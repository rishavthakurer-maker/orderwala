'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Calendar, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton, DynamicBar } from '@/components/ui';
import { formatPrice, formatDate } from '@/lib/utils';

interface EarningsData {
  summary: {
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    allTimeEarnings: number;
    todayDeliveries: number;
    weekDeliveries: number;
    periodEarnings: number;
    periodDeliveries: number;
  };
  weeklyChart: { day: string; earnings: number; deliveries: number }[];
  recentEarnings: { orderId: string; amount: number; type: string; date: string; itemCount: number }[];
}

export default function DeliveryEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery/earnings?period=week');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <Card><CardContent className="p-6"><Skeleton className="h-24" /></CardContent></Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-48" /></CardContent></Card>
      </div>
    );
  }

  const summary = data?.summary || { todayEarnings: 0, weekEarnings: 0, monthEarnings: 0, allTimeEarnings: 0, todayDeliveries: 0, weekDeliveries: 0, periodEarnings: 0, periodDeliveries: 0 };
  const weeklyChart = data?.weeklyChart || [];
  const recentEarnings = data?.recentEarnings || [];
  const maxEarnings = Math.max(...weeklyChart.map(d => d.earnings), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500">Track your delivery earnings</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-100 text-sm">Today&apos;s Earnings</p>
              <p className="text-3xl font-bold mt-1">{formatPrice(summary.todayEarnings)}</p>
              <p className="text-blue-200 text-sm mt-1">{summary.todayDeliveries} deliveries</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">This Week</p>
              <p className="text-3xl font-bold mt-1">{formatPrice(summary.weekEarnings)}</p>
              <p className="text-blue-200 text-sm mt-1">{summary.weekDeliveries} deliveries</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Total Lifetime</p>
              <p className="text-3xl font-bold mt-1">{formatPrice(summary.allTimeEarnings)}</p>
              <p className="text-blue-200 text-sm mt-1">Since joining</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Today</p><p className="text-xl font-bold">{formatPrice(summary.todayEarnings)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">This Week</p><p className="text-xl font-bold">{formatPrice(summary.weekEarnings)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center"><Calendar className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">This Month</p><p className="text-xl font-bold">{formatPrice(summary.monthEarnings)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center"><Package className="h-5 w-5 text-orange-600" /></div>
            <div><p className="text-sm text-gray-500">Week Deliveries</p><p className="text-xl font-bold">{summary.weekDeliveries}</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Weekly Chart */}
      {weeklyChart.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Weekly Earnings</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-48 gap-2">
              {weeklyChart.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-sm font-medium mb-1">{formatPrice(day.earnings)}</span>
                    <DynamicBar className="w-full bg-blue-500 rounded-t-lg transition-all" height={`${(day.earnings / maxEarnings) * 150}px`} />
                  </div>
                  <span className="text-sm text-gray-500 mt-2">{day.day}</span>
                  <span className="text-xs text-gray-400">{day.deliveries} orders</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Earnings */}
      <Card>
        <CardHeader><CardTitle>Recent Earnings</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentEarnings.map((earning, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order {earning.orderId}</p>
                    <p className="text-sm text-gray-500">{earning.date ? formatDate(new Date(earning.date)) : ''} • {earning.itemCount} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+{formatPrice(earning.amount)}</p>
                  <Badge variant="success" className="text-xs">Credited</Badge>
                </div>
              </div>
            ))}
            {recentEarnings.length === 0 && (
              <div className="p-8 text-center text-gray-500">No earnings yet. Complete deliveries to earn!</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
