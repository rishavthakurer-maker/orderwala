'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  Clock,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Bike,
  MapPin,
  UserPlus,
} from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';

const deliveryNavItems = [
  { href: '/delivery', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/delivery/nearby', label: 'Nearby Orders', icon: MapPin },
  { href: '/delivery/orders', label: 'Active Orders', icon: Package },
  { href: '/delivery/history', label: 'Order History', icon: Clock },
  { href: '/delivery/earnings', label: 'Earnings', icon: Wallet },
  { href: '/delivery/onboarding', label: 'Enrollment', icon: UserPlus },
  { href: '/delivery/settings', label: 'Settings', icon: Settings },
];

const authPages = ['/delivery/login', '/delivery/register'];

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const isAuthPage = authPages.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (status === 'loading') return;
    if (isAuthPage) return;
    if (!session?.user) {
      router.push('/delivery/login');
      return;
    }
    if (session.user.role !== 'delivery') {
      router.push('/delivery/login');
    }
  }, [session, status, router, isAuthPage]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'delivery') {
    return null;
  }

  const partnerName = session.user.name || 'Delivery Partner';
  const partnerInitial = partnerName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/delivery/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/delivery" className="flex items-center gap-2">
              <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Bike className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900">Delivery Partner</span>
                <p className="text-xs text-gray-500">Order Wala</p>
              </div>
            </Link>
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">{partnerInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{partnerName}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {deliveryNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/delivery' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => setSidebarOpen(false)}>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
              <LogOut className="h-5 w-5" />
              Back to Main Site
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-3">
              <Button variant={isOnline ? 'primary' : 'outline'} size="sm" onClick={() => setIsOnline(!isOnline)} className={isOnline ? 'bg-green-500 hover:bg-green-600' : ''}>
                {isOnline ? '🟢 Online' : '⚪ Go Online'}
              </Button>
              <button className="relative p-2 hover:bg-gray-100 rounded-lg" aria-label="Notifications">
                <Bell className="h-5 w-5 text-gray-600" />
              </button>
              <div className="hidden md:flex items-center gap-2 pl-3 border-l">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">{partnerInitial}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{partnerName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
