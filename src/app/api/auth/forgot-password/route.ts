import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// =============================================================================
// Constants
// =============================================================================

const OTP_EXPIRY_MINUTES = 10;

const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Email address is required.',
  USER_NOT_FOUND: 'No account found with this email address.',
  OTP_GENERATION_FAILED: 'Failed to generate reset code. Please try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via email (placeholder - integrate with email service)
 */
async function sendResetEmail(email: string, otp: string, name?: string): Promise<boolean> {
  // For development, log the OTP
  console.log(`[ForgotPassword] Reset OTP for ${email}: ${otp}`);
  
  // In production, integrate with email service like:
  // - SendGrid
  // - AWS SES
  // - Resend
  // - Nodemailer with SMTP
  
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  await sgMail.send({
    to: email,
    from: 'noreply@orderwala.com',
    subject: 'Reset Your Password - Order Wala',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Order Wala</h2>
        <p>Hi ${name || 'there'},</p>
        <p>We received a request to reset your password. Use the code below to proceed:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
        </div>
        <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Thanks,<br>Order Wala Team</p>
      </div>
    `,
  });
  */
  
  return true;
}

// =============================================================================
// API Handler
// =============================================================================

/**
 * POST /api/auth/forgot-password
 * 
 * Sends a password reset OTP to the user's email address.
 * 
 * Request body:
 * - email: string (required)
 * 
 * Response:
 * - success: boolean
 * - message: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.EMAIL_REQUIRED },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createAdminSupabaseClient();

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      // Don't reveal if email exists for security
      // But still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a reset code.',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Delete any existing password reset OTPs for this email
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('email', normalizedEmail)
      .eq('type', 'password_reset');

    // Save new OTP
    const { error: insertError } = await supabase
      .from('otp_verifications')
      .insert({
        email: normalizedEmail,
        otp,
        type: 'password_reset',
        expires_at: expiresAt.toISOString(),
        is_verified: false,
      });

    if (insertError) {
      console.error('[ForgotPassword] Error saving OTP:', insertError);
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.OTP_GENERATION_FAILED },
        { status: 500 }
      );
    }

    // Send email with OTP
    const emailSent = await sendResetEmail(normalizedEmail, otp, user.name);

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reset code sent to your email address.',
    });
  } catch (error) {
    console.error('[ForgotPassword] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
