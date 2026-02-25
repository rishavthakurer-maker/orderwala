import { supabase } from '../config/database';

interface OTPData {
  email_or_phone: string;
  otp_code: string;
  type: string;
  expires_at: Date;
}

// Generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email or SMS
export const sendOTP = async (
  email_or_phone: string,
  type: 'signup' | 'login' | 'password_reset'
): Promise<{ success: boolean; message: string }> => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const { error } = await supabase.from('otps').insert([
      {
        email_or_phone,
        otp_code: otp,
        type,
        expires_at: expiresAt.toISOString(),
      },
    ]);

    if (error) throw error;

    // Send OTP (email or SMS)
    if (email_or_phone.includes('@')) {
      // Send email
      console.log(`Sending OTP ${otp} to email ${email_or_phone}`);
      // TODO: Implement email service (SendGrid, SES, etc)
    } else {
      // Send SMS
      console.log(`Sending OTP ${otp} to phone ${email_or_phone}`);
      // TODO: Implement SMS service (Twilio, etc)
    }

    return {
      success: true,
      message: `OTP sent to ${email_or_phone}`,
    };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP',
    };
  }
};

// Verify OTP
export const verifyOTP = async (
  email_or_phone: string,
  otp: string,
  type: string
): Promise<boolean> => {
  try {
    const { data: otpRecord, error } = await supabase
      .from('otps')
      .select('*')
      .eq('email_or_phone', email_or_phone)
      .eq('otp_code', otp)
      .eq('type', type)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !otpRecord) {
      return false;
    }

    // Mark as verified
    await supabase
      .from('otps')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    return true;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

// Clean expired OTPs (run periodically)
export const cleanExpiredOTPs = async (): Promise<void> => {
  try {
    await supabase
      .from('otps')
      .delete()
      .lt('expires_at', new Date().toISOString());
  } catch (error: any) {
    console.error('Error cleaning expired OTPs:', error);
  }
};
