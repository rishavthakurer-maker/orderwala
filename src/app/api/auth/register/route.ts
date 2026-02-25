import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

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

    const supabase = createAdminSupabaseClient();

    // Check if user already exists
    let existingUserQuery = supabase.from('users').select('id');
    
    if (email && phone) {
      existingUserQuery = existingUserQuery.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      existingUserQuery = existingUserQuery.eq('email', email);
    } else if (phone) {
      existingUserQuery = existingUserQuery.eq('phone', phone);
    }

    const { data: existingUsers, error: existingError } = await existingUserQuery;

    if (existingError) {
      console.error('Error checking existing user:', existingError);
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      );
    }

    if (existingUsers && existingUsers.length > 0) {
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
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        phone,
        password_hash: hashedPassword,
        role: ['customer', 'vendor', 'delivery'].includes(role) ? role : 'customer',
        is_verified: false,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
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
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
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
