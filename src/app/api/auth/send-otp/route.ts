import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId, Collections } from '@/lib/firebase';

// Generate 6 digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In production, use Twilio or MSG91 to send OTP
async function sendOTP(phone: string, otp: string): Promise<boolean> {
  // For development, just log the OTP
  console.log(`OTP for ${phone}: ${otp}`);
  
  // Uncomment below for Twilio integration
  /*
  const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  await client.messages.create({
    body: `Your Order Wala verification code is: ${otp}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
  */
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone number format (Indian)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/^\+91/, ''))) {
      return NextResponse.json(
        { error: 'Please enter a valid Indian phone number' },
        { status: 400 }
      );
    }

    const db = getDb();
    const otpCol = db.collection(Collections.OTP_VERIFICATIONS);

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTPs for this phone
    const existingOtps = await otpCol.where('phone', '==', phone).get();
    if (!existingOtps.empty) {
      const batch = db.batch();
      existingOtps.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Save new OTP
    const otpId = generateId();
    try {
      await otpCol.doc(otpId).set({
        phone,
        otp,
        expires_at: expiresAt.toISOString(),
        is_verified: false,
        created_at: new Date().toISOString(),
      });
    } catch (insertError) {
      console.error('Error saving OTP:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate OTP' },
        { status: 500 }
      );
    }

    // Send OTP
    await sendOTP(phone, otp);

    return NextResponse.json({
      message: 'OTP sent successfully',
      // SMS provider not configured yet - return OTP to client
      otp,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
