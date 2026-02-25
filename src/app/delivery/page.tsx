'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, DollarSign, Clock, Star, Navigation, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Skeleton } from '@/components/ui';
import { formatPrice, getOrderStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderData {
  _id: string;
  orderId: string;
  items: { name: string; quantity: number; unit?: string; price: number }[];
  total: number;
  deliveryFee: number;
  deliveryAddress: { address?: string; city?: string; name?: string; phone?: string };
  deliveryEarnings: number;
  status: string;
  createdAt: string;
  vendor: { _id: string; storeName: string; phone?: string; address?: string } | null;
  customer: { _id: string; name: string; phone?: string } | null;
}

interface DashboardData {
  stats: {
    todayDeliveries: number;
    todayEarnings: number;
    activeOrders: number;
    rating: number;
    weekDeliveries: number;
    weekEarnings: number;
    totalRatings: number;
  };
  activeOrders: OrderData[];
  availableOrders: OrderData[];
}

export default function DeliveryDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery/dashboard');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleAcceptOrder = async (orderId: string) => {
    setAcceptingOrder(orderId);
    try {
      const res = await fetch('/api/delivery/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'accept' }),
      });
      const json = await res.json();
      if (json.success) { toast.success('Order accepted!'); fetchDashboard(); }
      else toast.error(json.error || 'Failed to accept order');
    } catch { toast.error('Failed to accept order'); }
    finally { setAcceptingOrder(null); }
  };

  const handleUpdateStatus = async (orderId: string, action: string) => {
    try {
      const res = await fetch('/api/delivery/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      const json = await res.json();
      if (json.success) { toast.success('Status updated!'); fetchDashboard(); }
      else toast.error(json.error || 'Failed to update');
    } catch { toast.error('Failed to update status'); }
  };

  const getNextAction = (status: string): { label: string; action: string } | null => {
    switch (status) {
      case 'ready': return { label: 'Mark Picked Up', action: 'pickup' };
      case 'picked_up': return { label: 'Start Delivery', action: 'on_the_way' };
      case 'on_the_way': return { label: 'Mark Delivered', action: 'delivered' };
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-4"><Skeleton className="h-40" /></CardContent></Card>
      </div>
    );
  }

  const stats = data?.stats || { todayDeliveries: 0, todayEarnings: 0, activeOrders: 0, rating: 0, weekDeliveries: 0, weekEarnings: 0, totalRatings: 0 };
  const activeOrders = data?.activeOrders || [];
  const availableOrders = data?.availableOrders || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here&apos;s your delivery overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Today&apos;s Deliveries</p><p className="text-2xl font-bold mt-1">{stats.todayDeliveries}</p></div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center"><Package className="h-6 w-6 text-blue-600" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Today&apos;s Earnings</p><p className="text-2xl font-bold mt-1">{formatPrice(stats.todayEarnings)}</p></div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="h-6 w-6 text-green-600" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Active Orders</p><p className="text-2xl font-bold mt-1">{stats.activeOrders}</p><p className="text-xs text-orange-600 mt-1">In progress</p></div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center"><Clock className="h-6 w-6 text-orange-600" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Your Rating</p><p className="text-2xl font-bold mt-1">{stats.rating || '—'}</p><p className="text-xs text-gray-500 mt-1">{stats.totalRatings} reviews</p></div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center"><Star className="h-6 w-6 text-yellow-600" /></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader><CardTitle className="flex items-center gap-2 text-blue-700"><Package className="h-5 w-5" />Active Orders<Badge variant="info">{activeOrders.length}</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {activeOrders.map((order) => {
              const nextAction = getNextAction(order.status);
              return (
                <div key={order._id} className="bg-white rounded-lg p-4 border shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.orderId}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>{order.status.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{order.items.length} items • {formatPrice(order.total)}</p>
                    </div>
                    <p className="font-bold text-green-600">{formatPrice(order.deliveryEarnings)}</p>
                  </div>

                  <div className="space-y-3 border-t pt-3">
                    {order.vendor && (
                      <div className="flex items-start gap-2">
                        <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs">📍</span></div>
                        <div><p className="text-xs text-gray-500">PICKUP</p><p className="text-sm font-medium">{order.vendor.storeName}</p><p className="text-sm text-gray-500">{order.vendor.address}</p></div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs">🏠</span></div>
                      <div><p className="text-xs text-gray-500">DELIVERY</p><p className="text-sm font-medium">{order.customer?.name || 'Customer'}</p><p className="text-sm text-gray-500">{order.deliveryAddress?.address}</p></div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {order.customer?.phone && (
                      <a href={`tel:${order.customer.phone}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm"><Phone className="h-4 w-4 mr-1" />Call</Button>
                      </a>
                    )}
                    {nextAction && (
                      <Button className={`flex-1 ${nextAction.action === 'delivered' ? 'bg-green-500 hover:bg-green-600' : ''}`} size="sm" onClick={() => handleUpdateStatus(order._id, nextAction.action)}>
                        <Navigation className="h-4 w-4 mr-1" />{nextAction.label}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Available Orders */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Available Nearby<Badge variant="secondary">{availableOrders.length}</Badge></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {availableOrders.map((order) => (
            <div key={order._id} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-start justify-between mb-3">
                <div><span className="font-medium">{order.orderId}</span><p className="text-sm text-gray-500 mt-1">{order.items.length} items • {formatPrice(order.total)}</p></div>
                <p className="font-bold text-green-600">{formatPrice(order.deliveryEarnings)}</p>
              </div>
              <div className="space-y-2 text-sm">
                {order.vendor && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-500" /><span className="text-gray-600">{order.vendor.storeName}</span></div>}
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-green-500" /><span className="text-gray-600">{order.deliveryAddress?.address || 'Delivery address'}</span></div>
              </div>
              <Button className="w-full mt-3" onClick={() => handleAcceptOrder(order._id)} disabled={acceptingOrder === order._id}>
                {acceptingOrder === order._id ? 'Accepting...' : 'Accept Order'}
              </Button>
            </div>
          ))}
          {availableOrders.length === 0 && (
            <p className="text-center text-gray-500 py-8">No orders available nearby. Stay online to receive orders!</p>
          )}
        </CardContent>
      </Card>

      {/* Week Summary */}
      <Card>
        <CardHeader><CardTitle>This Week Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-blue-600">{stats.weekDeliveries}</p><p className="text-sm text-gray-500">Deliveries</p></div>
            <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-green-600">{formatPrice(stats.weekEarnings)}</p><p className="text-sm text-gray-500">Earnings</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
