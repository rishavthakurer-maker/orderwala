'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Users, 
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

// Demo data - In production, fetch from API
const stats = [
  {
    title: 'Total Revenue',
    value: 125000,
    change: 12.5,
    icon: IndianRupee,
    color: 'bg-green-500',
  },
  {
    title: 'Total Orders',
    value: 1234,
    change: 8.2,
    icon: ShoppingCart,
    color: 'bg-blue-500',
  },
  {
    title: 'Active Products',
    value: 456,
    change: -2.4,
    icon: Package,
    color: 'bg-purple-500',
  },
  {
    title: 'Active Customers',
    value: 2890,
    change: 15.3,
    icon: Users,
    color: 'bg-orange-500',
  },
];

const recentOrders = [
  { id: 'OW2602100001', customer: 'Rahul Kumar', total: 450, status: 'delivered', time: '2 hours ago' },
  { id: 'OW2602100002', customer: 'Priya Singh', total: 1200, status: 'on_the_way', time: '3 hours ago' },
  { id: 'OW2602100003', customer: 'Amit Sharma', total: 680, status: 'preparing', time: '4 hours ago' },
  { id: 'OW2602100004', customer: 'Sneha Patel', total: 320, status: 'pending', time: '5 hours ago' },
  { id: 'OW2602100005', customer: 'Vikram Yadav', total: 890, status: 'delivered', time: '6 hours ago' },
];

const topProducts = [
  { name: 'Fresh Tomatoes', sold: 245, revenue: 8575 },
  { name: 'Chicken Breast', sold: 189, revenue: 56511 },
  { name: 'Farm Fresh Eggs', sold: 167, revenue: 13360 },
  { name: 'Basmati Rice', sold: 142, revenue: 18318 },
  { name: 'Fresh Paneer', sold: 98, revenue: 27440 },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  on_the_way: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-white animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 rounded-xl bg-white animate-pulse" />
          <div className="h-96 rounded-xl bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change > 0;

          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-3 ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.title.includes('Revenue') 
                      ? formatPrice(stat.value) 
                      : stat.value.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-green-600 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customer}</p>
                    <p className="text-xs text-gray-400">{order.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${statusColors[order.status]}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Selling Products</CardTitle>
            <Link href="/admin/products" className="text-sm text-green-600 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sold} sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">{formatPrice(product.revenue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">New Vendor Applications</p>
                  <p className="text-sm text-gray-500">5 pending review</p>
                </div>
                <Link href="/admin/vendors" className="text-sm text-green-600 hover:underline">
                  Review
                </Link>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Low Stock Products</p>
                  <p className="text-sm text-gray-500">12 items</p>
                </div>
                <Link href="/admin/products" className="text-sm text-green-600 hover:underline">
                  View
                </Link>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Pending Orders</p>
                  <p className="text-sm text-gray-500">8 need attention</p>
                </div>
                <Link href="/admin/orders" className="text-sm text-green-600 hover:underline">
                  View
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-yellow-50 p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">23</p>
                <p className="text-sm text-yellow-700">Pending</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">18</p>
                <p className="text-sm text-orange-700">Preparing</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">12</p>
                <p className="text-sm text-blue-700">On the way</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">145</p>
                <p className="text-sm text-green-700">Delivered Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
