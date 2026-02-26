'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Phone, ArrowLeft } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type PhoneFormData = z.infer<typeof phoneSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  const handleEmailLogin = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        const errorMsg = result.error === 'CredentialsSignin'
          ? 'Invalid email or password. If you signed up with Google, please use Google login.'
          : result.error;
        toast.error(errorMsg);
      } else if (result?.ok) {
        toast.success('Login successful!');
        router.push('/');
        router.refresh();
      } else {
        toast.error('Login failed. Please try again.');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (data: PhoneFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      setPhoneNumber(data.phone);
      setOtpSent(true);
      toast.success('OTP sent to your phone');
      
      // Show OTP (SMS not yet configured)
      if (result.otp) {
        toast(`Your OTP is: ${result.otp}`, { duration: 15000, icon: '🔑' });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (data: OTPFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, otp: data.otp }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to verify OTP');
      }

      // Sign in with the verified user
      const signInResult = await signIn('phone-otp', {
        phone: phoneNumber,
        userId: result.user.id,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error(signInResult.error);
      } else {
        toast.success('Login successful!');
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl font-bold text-green-600">Order</span>
            <span className="text-3xl font-bold text-yellow-500">वाला</span>
          </Link>
          <p className="text-gray-500 mt-2">Login to your account</p>
        </div>

        <Card className="p-6">
          {/* Login Method Toggle */}
          {!otpSent && (
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              <button
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  loginMethod === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Phone
              </button>
              <button
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  loginMethod === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Email
              </button>
            </div>
          )}

          {/* Email Login Form */}
          {loginMethod === 'email' && !otpSent && (
            <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                leftIcon={<Mail className="h-4 w-4" />}
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register('email')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  error={emailForm.formState.errors.password?.message}
                  {...emailForm.register('password')}
                />
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-green-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Login
              </Button>
            </form>
          )}

          {/* Phone Login Form */}
          {loginMethod === 'phone' && !otpSent && (
            <form onSubmit={phoneForm.handleSubmit(handleSendOTP)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3">
                    <span className="text-sm text-gray-500">+91</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit number"
                    leftIcon={<Phone className="h-4 w-4" />}
                    error={phoneForm.formState.errors.phone?.message}
                    {...phoneForm.register('phone')}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Send OTP
              </Button>
            </form>
          )}

          {/* OTP Verification Form */}
          {otpSent && (
            <div>
              <button
                onClick={() => setOtpSent(false)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit OTP sent to <span className="font-medium">+91 {phoneNumber}</span>
              </p>

              <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
                <Input
                  label="OTP"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  error={otpForm.formState.errors.otp?.message}
                  {...otpForm.register('otp')}
                />

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Verify OTP
                </Button>

                <button
                  type="button"
                  onClick={() => handleSendOTP({ phone: phoneNumber })}
                  className="w-full text-sm text-green-600 hover:underline"
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              </form>
            </div>
          )}

          {/* Divider */}
          {!otpSent && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">or continue with</span>
                </div>
              </div>

              {/* Social Login */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          )}
        </Card>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-green-600 font-medium hover:underline">
            Register
          </Link>
        </p>

        {/* Seller Link */}
        <div className="text-center mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600">
            Are you a seller?{' '}
            <Link href="/seller/login" className="text-orange-600 font-medium hover:underline">
              Login to Seller Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
