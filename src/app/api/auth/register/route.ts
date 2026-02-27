import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, generateId, Collections } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, role = 'customer' } = await request.json();

    // Validation
    if (!name || (!email && !phone)) {
      return NextResponse.json(
        { error: 'Name and either email or phone are required' },
        { status: 400 }
      );
    }

    if (email && !password) {
      return NextResponse.json(
        { error: 'Password is required for email registration' },
        { status: 400 }
      );
    }

    const db = getDb();
    const usersCol = db.collection(Collections.USERS);

    // Check if user already exists
    let existingUsers: FirebaseFirestore.QueryDocumentSnapshot[] = [];

    if (email && phone) {
      const [byEmail, byPhone] = await Promise.all([
        usersCol.where('email', '==', email).limit(1).get(),
        usersCol.where('phone', '==', phone).limit(1).get(),
      ]);
      existingUsers = [...byEmail.docs, ...byPhone.docs];
    } else if (email) {
      const snap = await usersCol.where('email', '==', email).limit(1).get();
      existingUsers = snap.docs;
    } else if (phone) {
      const snap = await usersCol.where('phone', '==', phone).limit(1).get();
      existingUsers = snap.docs;
    }

    if (existingUsers.length > 0) {
      // If user exists as customer and wants to become vendor, upgrade role
      if (role === 'vendor') {
        const existingDoc = existingUsers[0];
        const existingData = existingDoc.data() as Record<string, unknown>;
        if (existingData.role === 'customer') {
          await existingDoc.ref.update({ role: 'vendor', updated_at: new Date().toISOString() });
          return NextResponse.json(
            {
              message: 'Account upgraded to seller successfully',
              user: {
                id: existingDoc.id,
                name: existingData.name,
                email: existingData.email,
                phone: existingData.phone,
                role: 'vendor',
              },
            },
            { status: 200 }
          );
        }
      }
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 409 }
      );
    }

    // Hash password if provided
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Create user
    const userId = generateId();
    const validRole = ['customer', 'vendor', 'delivery'].includes(role) ? role : 'customer';
    const now = new Date().toISOString();
    const userData = {
      name,
      email: email || null,
      phone: phone || null,
      password_hash: hashedPassword || null,
      role: validRole,
      is_verified: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    try {
      await usersCol.doc(userId).set(userData);
    } catch (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: userId,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
