'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Store, User, Mail, Lock, Eye, EyeOff, Phone, ArrowRight } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';

export default function SellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Account details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Store details
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeCategory, setStoreCategory] = useState('general');
  const [storeDescription, setStoreDescription] = useState('');

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      toast.error('Please fill all required fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !storePhone) {
      toast.error('Store name and phone are required');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Register user with vendor role
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role: 'vendor' }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Registration failed');

      // Step 2: Sign in
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (!signInResult?.ok) throw new Error('Sign in failed');

      // Step 3: Create store
      const storeRes = await fetch('/api/seller/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          phone: storePhone,
          email,
          description: storeDescription,
          category: storeCategory,
        }),
      });
      const storeData = await storeRes.json();
      if (!storeRes.ok) throw new Error(storeData.error || 'Failed to create store');

      toast.success('Seller account created successfully!');
      router.push('/vendor');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl font-bold text-green-600">Order</span>
            <span className="text-2xl font-bold text-yellow-500">वाला</span>
          </Link>
          <div className="mx-auto mb-4 h-16 w-16 bg-orange-500 rounded-2xl flex items-center justify-center">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Become a Seller</h1>
          <p className="text-gray-500 mt-1">Start selling on OrderWala today</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>1</div>
            <span className="text-sm font-medium hidden sm:inline">Account</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-orange-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>2</div>
            <span className="text-sm font-medium hidden sm:inline">Store</span>
          </div>
        </div>

        <Card className="p-6">
          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="text-lg font-semibold mb-2">Account Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="pl-10" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seller@example.com" className="pl-10" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="pl-10" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="pl-10 pr-10" required />
                  <button type="button" title="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="pl-10" required />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Next: Store Details <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Store Details</h2>
                <button type="button" onClick={() => setStep(1)} className="text-sm text-orange-600 hover:underline">← Back</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. Fresh Farm Vegetables" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="Store contact number" className="pl-10" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={storeCategory}
                  onChange={(e) => setStoreCategory(e.target.value)}
                  title="Store category"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="general">General Store</option>
                  <option value="grocery">Grocery</option>
                  <option value="vegetables">Vegetables & Fruits</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="meat">Meat & Seafood</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                <textarea
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Tell buyers what you sell..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                />
              </div>

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Seller Account'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have a seller account?{' '}
              <Link href="/seller/login" className="text-orange-600 hover:underline font-medium">Login here</Link>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Want to buy instead?{' '}
              <Link href="/register" className="text-green-600 hover:underline">Sign up as buyer</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
