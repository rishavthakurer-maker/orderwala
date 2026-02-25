import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

// =============================================================================
// Constants
// =============================================================================

const BCRYPT_SALT_ROUNDS = 12;

const ERROR_MESSAGES = {
  INVALID_REQUEST: 'Email, token, and password are required.',
  INVALID_TOKEN: 'Invalid or expired reset token. Please request a new password reset.',
  TOKEN_EXPIRED: 'Reset token has expired. Please request a new password reset.',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters.',
  USER_NOT_FOUND: 'User not found.',
  UPDATE_FAILED: 'Failed to update password. Please try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
} as const;

// =============================================================================
// API Handler
// =============================================================================

/**
 * POST /api/auth/reset-password
 * 
 * Resets the user's password using a valid reset token.
 * 
 * Request body:
 * - email: string (required)
 * - token: string (required) - Reset token from verify-reset-otp
 * - password: string (required) - New password
 * 
 * Response:
 * - success: boolean
 * - message: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, password } = body;

    // Validate input
    if (!email || !token || !password) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_REQUEST },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.PASSWORD_TOO_SHORT },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createAdminSupabaseClient();

    // Find the OTP record with reset token
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('reset_token', token)
      .eq('type', 'password_reset')
      .eq('is_verified', true)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_TOKEN },
        { status: 400 }
      );
    }

    // Check if token is expired
    const tokenExpiresAt = new Date(otpRecord.token_expires_at);
    if (tokenExpiresAt < new Date()) {
      // Delete expired record
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', otpRecord.id);

      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.TOKEN_EXPIRED },
        { status: 400 }
      );
    }

    // Find the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Update user's password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[ResetPassword] Error updating password:', updateError);
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UPDATE_FAILED },
        { status: 500 }
      );
    }

    // Delete the used OTP record
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('id', otpRecord.id);

    // Optionally: Invalidate all existing sessions for the user
    // This would require session management implementation

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('[ResetPassword] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
