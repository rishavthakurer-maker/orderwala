'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Skeleton, DynamicBar } from '@/components/ui';

interface AnalyticsData {
  summary: { totalRevenue: number; totalOrders: number; avgOrderValue: number };
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  dailyRevenue: { day: string; revenue: number; orders: number }[];
  statusBreakdown: Record<string, number>;
  topProducts: { id: string; name: string; quantity: number; revenue: number }[];
}

export default function VendorAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/seller/analytics');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch { console.error('Failed to fetch analytics'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-10 text-gray-500">Failed to load analytics</div>;
  }

  const maxMonthRev = Math.max(...data.monthlyRevenue.map(m => m.revenue), 1);
  const maxDailyRev = Math.max(...data.dailyRevenue.map(d => d.revenue), 1);
  const maxTopProduct = Math.max(...data.topProducts.map(p => p.revenue), 1);
  const totalStatusOrders = Object.values(data.statusBreakdown).reduce((s, v) => s + v, 0) || 1;

  const statusColors: Record<string, string> = {
    delivered: '#22c55e',
    cancelled: '#ef4444',
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    preparing: '#8b5cf6',
    ready: '#06b6d4',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500">Track your store performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">₹{data.summary.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-lg"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{data.summary.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 rounded-lg"><TrendingUp className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Avg Order Value</p>
                <p className="text-xl font-bold text-gray-900">₹{Math.round(data.summary.avgOrderValue).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader><CardTitle>Monthly Revenue (Last 6 Months)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-48">
            {data.monthlyRevenue.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-700">₹{m.revenue >= 1000 ? `${(m.revenue/1000).toFixed(1)}k` : m.revenue}</span>
                <DynamicBar
                  className="w-full bg-orange-500 rounded-t-md transition-all"
                  height={`${(m.revenue / maxMonthRev) * 150}px`}
                  minHeight={m.revenue > 0 ? '4px' : '2px'}
                />
                <span className="text-xs text-gray-500">{m.month}</span>
                <span className="text-xs text-gray-400">{m.orders} orders</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Revenue + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue */}
        <Card>
          <CardHeader><CardTitle>Daily Revenue (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {data.dailyRevenue.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-gray-700">₹{d.revenue}</span>
                  <DynamicBar
                    className="w-full bg-blue-500 rounded-t-md transition-all"
                    height={`${(d.revenue / maxDailyRev) * 110}px`}
                    minHeight={d.revenue > 0 ? '4px' : '2px'}
                  />
                  <span className="text-xs text-gray-500">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader><CardTitle>Order Status Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="w-20 text-sm capitalize text-gray-700">{status}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <DynamicBar
                    className="h-full rounded-full transition-all"
                    width={`${(count / totalStatusOrders) * 100}%`}
                    backgroundColor={statusColors[status] || '#9ca3af'}
                    minWidth={count > 0 ? '8px' : '0'}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Top Selling Products</CardTitle></CardHeader>
        <CardContent>
          {data.topProducts.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No product sales data yet</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-gray-400">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.quantity} units sold</p>
                  </div>
                  <div className="w-32 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <DynamicBar
                      className="h-full bg-orange-500 rounded-full"
                      width={`${(p.revenue / maxTopProduct) * 100}%`}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-20 text-right">₹{p.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}