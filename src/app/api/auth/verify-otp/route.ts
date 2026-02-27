import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId, Collections, docToObj } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp, name } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const otpCol = db.collection(Collections.OTP_VERIFICATIONS);
    const usersCol = db.collection(Collections.USERS);

    // Find the OTP record - query by phone+otp, validate expiry in code
    // (avoids complex composite index requirements for inequality + equality)
    const otpSnap = await otpCol
      .where('phone', '==', phone)
      .where('otp', '==', otp)
      .where('is_verified', '==', false)
      .limit(1)
      .get();

    if (otpSnap.empty) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    const otpDoc = otpSnap.docs[0];
    const otpData = otpDoc.data();

    // Check expiry in code (more reliable than Firestore string comparison)
    if (otpData.expires_at && new Date(otpData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await otpDoc.ref.update({ is_verified: true });

    // Find or create user
    const userSnap = await usersCol
      .where('phone', '==', phone)
      .limit(1)
      .get();

    let user: { id: string; name: string; phone: string; role: string };

    if (userSnap.empty) {
      // Create new user
      const userId = generateId();
      const now = new Date().toISOString();
      const newUserData = {
        name: name || `User${phone.slice(-4)}`,
        phone,
        role: 'customer',
        is_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      try {
        await usersCol.doc(userId).set(newUserData);
      } catch (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      user = {
        id: userId,
        name: newUserData.name,
        phone: newUserData.phone,
        role: newUserData.role,
      };
    } else {
      // Update verification status
      const existingDoc = userSnap.docs[0];
      try {
        await existingDoc.ref.update({ is_verified: true, updated_at: new Date().toISOString() });
      } catch (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        );
      }

      const existingData = existingDoc.data();
      user = {
        id: existingDoc.id,
        name: existingData.name,
        phone: existingData.phone,
        role: existingData.role,
      };
    }

    return NextResponse.json({
      message: 'OTP verified successfully',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
