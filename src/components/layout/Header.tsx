'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Search,
  ShoppingCart,
  User,
  MapPin,
  Menu,
  X,
  Heart,
  Package,
  Wallet,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useCartStore, useLocationStore } from '@/store';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const { getItemCount } = useCartStore();
  const { selectedAddress, currentLocation, setCurrentLocation, setSelectedAddress } = useLocationStore();

  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-detect location on first visit (like Blinkit)
  useEffect(() => {
    if (!mounted) return;
    if (selectedAddress || currentLocation) return; // already have location
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          // Use free OpenStreetMap Nominatim reverse geocoding
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data?.display_name) {
            const addr = data.address || {};
            const loc = {
              lat,
              lng,
              address: data.display_name,
              city: addr.city || addr.town || addr.village || addr.county || '',
              state: addr.state || '',
              pincode: addr.postcode || '',
            };
            setCurrentLocation(loc);
            setSelectedAddress(loc);
          } else {
            const loc = { lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
            setCurrentLocation(loc);
            setSelectedAddress(loc);
          }
        } catch {
          const loc = { lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
          setCurrentLocation(loc);
          setSelectedAddress(loc);
        }
      },
      () => {
        // User denied location - silently ignore, they can pick manually
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [mounted, selectedAddress, currentLocation, setCurrentLocation, setSelectedAddress]);

  const cartCount = mounted ? getItemCount() : 0;
  const location = mounted ? (selectedAddress || currentLocation) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push('/search?q=' + encodeURIComponent(searchQuery.trim()));
    }
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/categories' },
    { name: 'Offers', href: '/offers' },
    { name: 'Admin', href: '/admin/login' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-green-600">Order</span>
              <span className="text-2xl font-bold text-yellow-500">वाला</span>
            </div>
          </Link>

          {/* Location Picker - Desktop */}
          <button onClick={() => router.push('/location')} className="hidden lg:flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50">
            <MapPin className="h-4 w-4 text-green-600" />
            <div className="text-left">
              <p className="text-xs text-gray-500">Deliver to</p>
              <p className="text-sm font-medium truncate max-w-50">
                {location?.address || 'Select Location'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for groceries, restaurants, and more..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <nav className="flex items-center gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-green-600',
                    pathname === item.href ? 'text-green-600' : 'text-gray-600'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Cart */}
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-green-600" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-medium text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{session.user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-white py-2 shadow-lg">
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Package className="h-4 w-4" />
                      My Orders
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Heart className="h-4 w-4" />
                      Favorites
                    </Link>
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Wallet className="h-4 w-4" />
                      Wallet
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="lg:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4">
            {/* Location */}
            <button onClick={() => { setIsMenuOpen(false); router.push('/location'); }} className="flex items-center gap-2 w-full rounded-lg border p-3 mb-4 hover:bg-gray-50">
              <MapPin className="h-5 w-5 text-green-600" />
              <div className="text-left flex-1">
                <p className="text-xs text-gray-500">Deliver to</p>
                <p className="text-sm font-medium truncate">
                  {location?.address || 'Select Location'}
                </p>
              </div>
            </button>

            {/* Navigation */}
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block rounded-lg px-3 py-2 text-sm font-medium',
                    pathname === item.href
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <hr className="my-4" />

            {session ? (
              <div className="space-y-2">
                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package className="h-4 w-4" />
                  My Orders
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Cart ({cartCount})
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">Login</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
