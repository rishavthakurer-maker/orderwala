import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
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
    const db = getDb();
    const otpCol = db.collection(Collections.OTP_VERIFICATIONS);
    const usersCol = db.collection(Collections.USERS);

    // Find the OTP record with reset token
    const otpSnap = await otpCol
      .where('email', '==', normalizedEmail)
      .where('reset_token', '==', token)
      .where('type', '==', 'password_reset')
      .where('is_verified', '==', true)
      .limit(1)
      .get();

    if (otpSnap.empty) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_TOKEN },
        { status: 400 }
      );
    }

    const otpDoc = otpSnap.docs[0];
    const otpRecord = otpDoc.data();

    // Check if token is expired
    const tokenExpiresAt = new Date(otpRecord.token_expires_at);
    if (tokenExpiresAt < new Date()) {
      // Delete expired record
      await otpDoc.ref.delete();

      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.TOKEN_EXPIRED },
        { status: 400 }
      );
    }

    // Find the user
    const userSnap = await usersCol
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    const userDoc = userSnap.docs[0];

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Update user's password
    try {
      await userDoc.ref.update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error('[ResetPassword] Error updating password:', updateError);
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UPDATE_FAILED },
        { status: 500 }
      );
    }

    // Delete the used OTP record
    await otpDoc.ref.delete();

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
