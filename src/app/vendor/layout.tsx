'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Store,
  ChevronDown,
} from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';

const vendorNavItems = [
  { href: '/vendor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/vendor/products', label: 'Products', icon: Package },
  { href: '/vendor/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
];

interface VendorStore {
  store_name: string;
  is_open: boolean;
  is_verified: boolean;
  logo?: string;
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [store, setStore] = useState<VendorStore | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [togglingStore, setTogglingStore] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/seller/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'vendor') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && session?.user?.role === 'vendor') {
      fetchStore();
    }
  }, [status, session, router]);

  const fetchStore = async () => {
    try {
      const res = await fetch('/api/seller/store');
      const data = await res.json();
      if (data.success) {
        setStore(data.data);
      } else {
        // No store yet - redirect to setup
        router.push('/seller/register');
      }
    } catch {
      console.error('Failed to fetch store');
    } finally {
      setStoreLoading(false);
    }
  };

  const toggleStoreStatus = async () => {
    if (!store) return;
    setTogglingStore(true);
    try {
      const res = await fetch('/api/seller/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !store.is_open }),
      });
      const data = await res.json();
      if (data.success) {
        setStore(data.data);
      }
    } catch {
      console.error('Failed to toggle store');
    } finally {
      setTogglingStore(false);
    }
  };

  if (status === 'loading' || storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'vendor') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/vendor" className="flex items-center gap-2">
              <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900">Seller Panel</span>
                <p className="text-xs text-gray-500">Order Wala</p>
              </div>
            </Link>
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Store Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                {store?.logo ? (
                  <img src={store.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-orange-600 font-bold">{store?.store_name?.charAt(0) || 'S'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{store?.store_name || 'My Store'}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${store?.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-500">{store?.is_open ? 'Open' : 'Closed'}</span>
                  {store?.is_verified && <span className="text-xs text-blue-600"> Verified</span>}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {vendorNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/vendor' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-2">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
              <Store className="h-5 w-5" />
              View Marketplace
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/seller/login' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleStoreStatus}
                disabled={togglingStore}
                className={store?.is_open ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}
              >
                {store?.is_open ? ' Store Open' : ' Store Closed'}
              </Button>
              <div className="hidden md:flex items-center gap-2 pl-3 border-l">
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm font-medium">{session.user.name?.charAt(0) || 'S'}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{session.user.name}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}