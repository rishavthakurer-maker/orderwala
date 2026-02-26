import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
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
    const db = getDb();
    const otpCol = db.collection(Collections.OTP_VERIFICATIONS);

    // Find the OTP record
    const otpSnap = await otpCol
      .where('email', '==', normalizedEmail)
      .where('otp', '==', otp)
      .where('type', '==', 'password_reset')
      .where('is_verified', '==', false)
      .limit(1)
      .get();

    if (otpSnap.empty) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_OTP },
        { status: 400 }
      );
    }

    const otpDoc = otpSnap.docs[0];
    const otpRecord = otpDoc.data();

    // Check if OTP is expired
    const expiresAt = new Date(otpRecord.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired OTP
      await otpDoc.ref.delete();

      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.OTP_EXPIRED },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Mark OTP as verified and save reset token
    try {
      await otpDoc.ref.update({
        is_verified: true,
        reset_token: resetToken,
        token_expires_at: tokenExpiresAt.toISOString(),
      });
    } catch (updateError) {
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
