'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, IndianRupee, TrendingUp, Clock, AlertTriangle, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

interface DashboardData {
  store: { name: string; isOpen: boolean; isVerified: boolean; rating: number; totalRatings: number };
  stats: { totalOrders: number; pendingOrders: number; completedOrders: number; cancelledOrders: number; totalRevenue: number; todayOrders: number; todayRevenue: number; totalProducts: number };
  lowStock: { id: string; name: string; stock: number; images: string[] }[];
  recentOrders: { id: string; orderId: string; customerName: string; total: number; status: string; items: unknown[]; createdAt: string }[];
}

export default function VendorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/seller/dashboard');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-center text-gray-500 py-12">Failed to load dashboard</p>;

  const { stats, recentOrders, lowStock } = data;

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const statusColor: Record<string, string> = {
    pending: 'warning', confirmed: 'info', preparing: 'info', ready: 'success',
    picked_up: 'info', on_the_way: 'info', delivered: 'success', cancelled: 'danger',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here is your store overview.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
            <TrendingUp className="h-4 w-4" />
            Today: {formatPrice(stats.todayRevenue)} ({stats.todayOrders} orders)
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}><Icon className={`h-5 w-5 ${stat.color}`} /></div>
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Recent Orders</CardTitle>
            <Link href="/vendor/orders" className="text-sm text-orange-600 hover:underline flex items-center gap-1">View all <ArrowRight className="h-4 w-4" /></Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">#{typeof order.orderId === 'string' ? order.orderId.slice(-8) : order.orderId}</p>
                      <p className="text-xs text-gray-500">{order.customerName} &bull; {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatPrice(order.total as number)}</p>
                      <Badge variant={(statusColor[order.status] || 'default') as 'success' | 'warning' | 'danger' | 'info' | 'default'} className="text-xs capitalize">
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" /> Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500">All products are well stocked!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStock.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="h-10 w-10 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className={`text-xs font-medium ${product.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {product.stock === 0 ? 'Out of stock' : `Only ${product.stock} left`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.completedOrders}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.cancelledOrders}</p>
          <p className="text-xs text-gray-500">Cancelled</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="h-6 w-6 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{data.store.rating?.toFixed(1) || '0.0'}</p>
          <p className="text-xs text-gray-500">Rating ({data.store.totalRatings || 0})</p>
        </Card>
      </div>
    </div>
  );
}