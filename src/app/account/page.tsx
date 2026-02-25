'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { User, Package, MapPin, Wallet, Heart, Bell, Settings, HelpCircle, LogOut, ChevronRight, Star, Gift, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Skeleton } from '@/components/ui';
import { Header, Footer, BottomNav } from '@/components/layout';
import { formatPrice } from '@/lib/utils';

interface Order {
  _id: string;
  orderId: string;
  status: string;
  items: { name: string }[];
  total: number;
  createdAt: string;
  vendor?: { storeName: string };
}

export default function AccountPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?redirect=/account');
      return;
    }
    if (authStatus === 'authenticated') {
      fetchData();
    }
  }, [authStatus, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, walletRes] = await Promise.all([
        fetch('/api/orders?limit=3'),
        fetch('/api/wallet'),
      ]);
      const ordersData = await ordersRes.json();
      const walletData = await walletRes.json();

      if (ordersData.success && ordersData.data) {
        setOrders(ordersData.data.orders || []);
        setOrderCount(ordersData.data.pagination?.total || 0);
      }
      if (walletData.success && walletData.data) {
        setWalletBalance(walletData.data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'on_the_way': return 'bg-blue-100 text-blue-700';
      case 'preparing': return 'bg-orange-100 text-orange-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Skeleton className="h-40 w-full rounded-lg mb-6" />
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
        <Footer /><BottomNav />
      </div>
    );
  }

  const user = session?.user;
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const menuItems = [
    { icon: Package, label: 'My Orders', href: '/account', badge: orderCount > 0 ? String(orderCount) : undefined },
    { icon: MapPin, label: 'Saved Addresses', href: '/account' },
    { icon: Wallet, label: 'Wallet', href: '/account', badge: formatPrice(walletBalance) },
    { icon: Heart, label: 'Favorites', href: '/favorites' },
    { icon: Bell, label: 'Notifications', href: '/account' },
    { icon: HelpCircle, label: 'Help & Support', href: '/account' },
  ];

  const activeOrder = orders.find(o => ['pending', 'confirmed', 'preparing', 'on_the_way'].includes(o.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Header */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold">{initials}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.name || 'User'}</h1>
              <p className="text-primary-100">{user?.email || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{orderCount}</p>
              <p className="text-sm text-primary-100">Orders</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{formatPrice(walletBalance)}</p>
              <p className="text-sm text-primary-100">Wallet</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-primary-100">Rewards</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Active Order Banner */}
        {activeOrder && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-orange-800">Order in Progress</p>
                    <p className="text-sm text-orange-600">{activeOrder.orderId} - {activeOrder.status.replace('_', ' ')}</p>
                  </div>
                </div>
                <Link href={`/orders/${activeOrder.orderId}`}>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Track</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Items */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {menuItems.map((item) => (
                <Link key={item.label} href={item.href} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.badge}</span>}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <Link key={order._id} href={`/orders/${order.orderId}`}>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{order.orderId}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>{order.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-gray-500">{order.vendor?.storeName || ''} {order.items ? ` ${order.items.length} items` : ''}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(order.total)}</p>
                      <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p>No orders yet</p>
                <Link href="/"><Button size="sm" className="mt-3">Start Shopping</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Banner */}
        <Card className="bg-linear-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Gift className="h-12 w-12" />
              <div className="flex-1">
                <h3 className="font-bold text-lg">Refer & Earn Rs.100</h3>
                <p className="text-white/80 text-sm">Invite friends and earn rewards on their first order</p>
              </div>
              <Button className="bg-white text-purple-600 hover:bg-gray-100">Share</Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => signOut({ callbackUrl: '/' })}>
          <LogOut className="h-4 w-4 mr-2" />Logout
        </Button>

        <p className="text-center text-sm text-gray-400">Order Wala v1.0.0</p>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}