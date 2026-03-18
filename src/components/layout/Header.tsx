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
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img src="/logo.png" alt="Order Wala" className="h-10 w-auto" />
          </Link>

          {/* Location Picker - Desktop */}
          <button onClick={() => router.push('/location')} className="hidden lg:flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
              <MapPin className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Deliver to</p>
              <p className="text-sm font-semibold text-gray-800 truncate max-w-40">
                {location?.address || 'Select Location'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
          </button>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-6">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for groceries, restaurants, and more..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pl-11 pr-4 text-sm focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200',
                    pathname === item.href 
                      ? 'text-orange-700 bg-orange-50' 
                      : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Cart */}
            <Link href="/cart" className="relative p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
              <ShoppingCart className="h-5 w-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white shadow-lg shadow-orange-200 animate-scale-in">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-orange-500 to-amber-600 text-white text-xs font-bold">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{session.user?.name?.split(' ')[0]}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform duration-200", isUserMenuOpen && "rotate-180")} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-gray-100 bg-white py-2 shadow-hover animate-scale-in">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        Profile
                      </Link>
                      <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Package className="h-4 w-4 text-gray-400" />
                        My Orders
                      </Link>
                      <Link
                        href="/favorites"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4 text-gray-400" />
                        Favorites
                      </Link>
                      <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Wallet className="h-4 w-4 text-gray-400" />
                        Wallet
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" className="rounded-xl bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-200 px-5">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="lg:hidden pb-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for groceries..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-4 text-sm focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white animate-fade-in">
          <div className="container mx-auto px-4 py-4">
            {/* Location */}
            <button onClick={() => { setIsMenuOpen(false); router.push('/location'); }} className="flex items-center gap-3 w-full rounded-xl border border-gray-200 p-3.5 mb-4 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
                <MapPin className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Deliver to</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {location?.address || 'Select Location'}
                </p>
              </div>
            </button>

            {/* Navigation */}
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                    pathname === item.href
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <hr className="my-4 border-gray-100" />

            {session ? (
              <div className="space-y-1">
                <Link
                  href="/account"
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4 text-gray-400" />
                  Profile
                </Link>
                <Link
                  href="/account"
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Package className="h-4 w-4 text-gray-400" />
                  My Orders
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                  Cart ({cartCount})
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full rounded-xl bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-200">Login</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
