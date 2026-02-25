import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler';
import { sendOTP, verifyOTP } from '../utils/otp';
import validator from 'validator';

const router = Router();

interface SignupBody {
  email: string;
  phone: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'vendor' | 'delivery';
}

interface LoginBody {
  email: string;
  password: string;
}

// ============ SIGN UP ============
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, phone, password, first_name, last_name, role } = req.body as SignupBody;

    // Validation
    if (!email || !validator.isEmail(email)) {
      throwErrorWithStatus(400, 'Invalid email format');
    }
    if (!phone || !validator.isMobilePhone(phone, 'en-IN')) {
      throwErrorWithStatus(400, 'Invalid phone number');
    }
    if (!password || password.length < 8) {
      throwErrorWithStatus(400, 'Password must be at least 8 characters');
    }
    if (!first_name || !last_name) {
      throwErrorWithStatus(400, 'First name and last name required');
    }
    if (!['customer', 'vendor', 'delivery'].includes(role)) {
      throwErrorWithStatus(400, 'Invalid role');
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .single();

    if (existingUser) {
      throwErrorWithStatus(409, 'User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email,
          phone,
          password_hash: hashedPassword,
          first_name,
          last_name,
          role,
          status: 'active',
        },
      ])
      .select()
      .single();

    if (insertError) {
      throwErrorWithStatus(500, insertError.message);
    }

    // Create additional profile based on role
    if (role === 'customer') {
      await supabase.from('customers').insert([{ user_id: user.id }]);
    } else if (role === 'vendor') {
      await supabase.from('vendors').insert([{ user_id: user.id }]);
    } else if (role === 'delivery') {
      await supabase.from('delivery_partners').insert([{ user_id: user.id }]);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    handleError(error, res);
  }
});

// ============ LOGIN ============
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginBody;

    // Validation
    if (!email || !password) {
      throwErrorWithStatus(400, 'Email and password required');
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user || error) {
      throwErrorWithStatus(401, 'Invalid email or password');
    }

    if (user.status !== 'active') {
      throwErrorWithStatus(403, 'Account is suspended or inactive');
    }

    // Verify password
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);

    if (!passwordMatch) {
      throwErrorWithStatus(401, 'Invalid email or password');
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      token,
    });
  } catch (error: any) {
    handleError(error, res);
  }
});

// ============ LOGIN WITH OTP ============
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email_or_phone } = req.body;

    if (!email_or_phone) {
      throwErrorWithStatus(400, 'Email or phone required');
    }

    const result = await sendOTP(email_or_phone, 'login');

    res.json({
      success: true,
      message: `OTP sent to ${email_or_phone}`,
      result,
    });
  } catch (error: any) {
    handleError(error, res);
  }
});

// ============ VERIFY OTP LOGIN ============
router.post('/verify-otp-login', async (req: Request, res: Response) => {
  try {
    const { email_or_phone, otp } = req.body;

    if (!email_or_phone || !otp) {
      throwErrorWithStatus(400, 'Email/phone and OTP required');
    }

    const verified = await verifyOTP(email_or_phone, otp, 'login');

    if (!verified) {
      throwErrorWithStatus(401, 'Invalid OTP');
    }

    // Find or create user
    let user;
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email_or_phone},phone.eq.${email_or_phone}`)
      .single();

    if (existingUser) {
      user = existingUser;
    } else {
      // Create new user
      const { data: newUser } = await supabase
        .from('users')
        .insert([
          {
            email: validator.isEmail(email_or_phone) ? email_or_phone : null,
            phone: !validator.isEmail(email_or_phone) ? email_or_phone : null,
            role: 'customer',
            is_verified: true,
          },
        ])
        .select()
        .single();
      user = newUser;

      // Create customer profile
      await supabase.from('customers').insert([{ user_id: user.id }]);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    handleError(error, res);
  }
});

// ============ GET CURRENT USER ============
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    handleError(error, res);
  }
});

// ============ REFRESH TOKEN ============
router.post('/refresh-token', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const token = jwt.sign(
      { userId: req.userId, email: req.email, role: req.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
    });
  } catch (error: any) {
    handleError(error, res);
  }
});

// ============ LOGOUT ============
router.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ============ HELPER FUNCTIONS ============

function throwErrorWithStatus(status: number, message: string): never {
  throw { statusCode: status, message };
}

function handleError(error: any, res: Response) {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  console.error('Auth error:', error);

  res.status(statusCode).json({
    success: false,
    message,
    error: error.code || 'AUTH_ERROR',
  });
}

export default router;
