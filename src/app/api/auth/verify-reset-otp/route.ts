import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// =============================================================================
// Constants
// =============================================================================

const TOKEN_EXPIRY_MINUTES = 15;

const ERROR_MESSAGES = {
  INVALID_REQUEST: 'Email and OTP are required.',
  INVALID_OTP: 'Invalid or expired verification code.',
  OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a secure reset token
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// =============================================================================
// API Handler
// =============================================================================

/**
 * POST /api/auth/verify-reset-otp
 * 
 * Verifies the password reset OTP and returns a reset token.
 * 
 * Request body:
 * - email: string (required)
 * - otp: string (required)
 * 
 * Response:
 * - success: boolean
 * - token: string (reset token for password change)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_REQUEST },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createAdminSupabaseClient();

    // Find the OTP record
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('otp', otp)
      .eq('type', 'password_reset')
      .eq('is_verified', false)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_OTP },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    const expiresAt = new Date(otpRecord.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired OTP
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', otpRecord.id);

      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.OTP_EXPIRED },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Mark OTP as verified and save reset token
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({
        is_verified: true,
        reset_token: resetToken,
        token_expires_at: tokenExpiresAt.toISOString(),
      })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('[VerifyResetOTP] Error updating OTP record:', updateError);
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.SERVER_ERROR },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: resetToken,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    console.error('[VerifyResetOTP] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
