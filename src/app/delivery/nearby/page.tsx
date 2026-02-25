'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Navigation, Package, Clock, Phone, RefreshCw, Loader2, Search, Filter, Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Skeleton, Modal } from '@/components/ui';
import { formatPrice, getOrderStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NearbyOrder {
  _id: string;
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  itemCount: number;
  total: number;
  deliveryFee: number;
  deliveryEarnings: number;
  status: string;
  createdAt: string;
  deliveryAddress: {
    address: string;
    city: string;
    pincode: string;
    lat: number | null;
    lng: number | null;
  };
  vendor: {
    _id: string;
    storeName: string;
    phone: string;
    logo: string;
    category: string;
    address: { address: string; city: string; lat: number | null; lng: number | null } | null;
  } | null;
  pickupDistance: number | null;
  deliveryDistance: number | null;
  totalDistance: number | null;
}

export default function NearbyDeliveriesPage() {
  const [orders, setOrders] = useState<NearbyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<NearbyOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(10);

  const [myLat, setMyLat] = useState(0);
  const [myLng, setMyLng] = useState(0);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState('');

  // Get user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLat(pos.coords.latitude);
        setMyLng(pos.coords.longitude);
        setLocationLoading(false);
      },
      (err) => {
        setLocationError(err.message || 'Location access denied');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const fetchNearby = useCallback(async (showRefresh = false) => {
    if (!myLat && !myLng && !locationError) return; // still waiting for location
    if (showRefresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (myLat) params.set('lat', myLat.toString());
      if (myLng) params.set('lng', myLng.toString());
      params.set('radius', radius.toString());

      const res = await fetch(`/api/delivery/nearby?${params}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.orders);
      }
    } catch (error) {
      console.error('Error fetching nearby orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [myLat, myLng, radius, locationError]);

  useEffect(() => {
    fetchNearby();
    const interval = setInterval(() => fetchNearby(), 15000);
    return () => clearInterval(interval);
  }, [fetchNearby]);

  const handleAcceptOrder = async (orderId: string) => {
    setAcceptingOrder(orderId);
    try {
      const res = await fetch('/api/delivery/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'accept' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Order accepted! Check your active orders.');
        setOrders(prev => prev.filter(o => o._id !== orderId));
        setSelectedOrder(null);
      } else {
        toast.error(json.error || 'Failed to accept order');
      }
    } catch {
      toast.error('Failed to accept order');
    } finally {
      setAcceptingOrder(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderId?.toLowerCase().includes(q) ||
      o.vendor?.storeName?.toLowerCase().includes(q) ||
      o.deliveryAddress?.address?.toLowerCase().includes(q) ||
      o.deliveryAddress?.city?.toLowerCase().includes(q)
    );
  });

  const formatDistance = (d: number | null) => {
    if (d === null) return 'N/A';
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)} km`;
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  if (isLoading || locationLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <Card><CardContent className="p-4"><Skeleton className="h-12" /></CardContent></Card>
        {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-32" /></CardContent></Card>)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nearby Deliveries</h1>
          <p className="text-gray-500">Find and accept deliveries near you</p>
        </div>
        <Button variant="outline" onClick={() => fetchNearby(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Location Status */}
      {locationError ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Location access denied</p>
              <p className="text-sm text-yellow-600">Enable location to see distances. Showing all available orders.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <MapPin className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Location active</p>
                <p className="text-xs text-green-600">Showing orders within {radius} km</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-green-700" htmlFor="radius-select">Radius:</label>
              <select
                id="radius-select"
                value={radius}
                onChange={e => setRadius(parseInt(e.target.value))}
                className="text-sm border rounded-lg px-2 py-1"
              >
                <option value={3}>3 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by order ID, vendor or area..."
          className="pl-10"
        />
      </div>

      {/* Orders count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} available</p>
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <Filter className="h-4 w-4" />
          Sorted by distance
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedOrder(order)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{order.orderId}</span>
                    <Badge variant="info">{order.itemCount} items</Badge>
                    <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                  </div>
                  {order.vendor && (
                    <p className="text-sm text-gray-600 mt-1">from <span className="font-medium">{order.vendor.storeName}</span></p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{formatPrice(order.deliveryEarnings)}</p>
                  <p className="text-xs text-gray-400">Earnings</p>
                </div>
              </div>

              {/* Route Info */}
              <div className="flex items-center gap-2 mb-3">
                {/* Pickup */}
                <div className="flex items-center gap-1.5 flex-1 bg-orange-50 rounded-lg p-2">
                  <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs">📍</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-orange-600 font-medium">PICKUP</p>
                    <p className="text-xs text-gray-600 truncate">{order.vendor?.address?.address || order.vendor?.storeName || 'Vendor'}</p>
                  </div>
                </div>

                <Navigation className="h-4 w-4 text-gray-300 shrink-0" />

                {/* Delivery */}
                <div className="flex items-center gap-1.5 flex-1 bg-green-50 rounded-lg p-2">
                  <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs">🏠</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-green-600 font-medium">DROP</p>
                    <p className="text-xs text-gray-600 truncate">{order.deliveryAddress?.address || order.deliveryAddress?.city || 'Customer'}</p>
                  </div>
                </div>
              </div>

              {/* Distance badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {order.pickupDistance !== null && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      <MapPin className="h-3 w-3" /> {formatDistance(order.pickupDistance)} away
                    </span>
                  )}
                  {order.totalDistance !== null && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      <Navigation className="h-3 w-3" /> {formatDistance(order.totalDistance)} total
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order._id); }}
                  disabled={acceptingOrder === order._id}
                >
                  {acceptingOrder === order._id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Package className="h-4 w-4 mr-1" />}
                  {acceptingOrder === order._id ? 'Accepting...' : 'Accept'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Orders Nearby</h3>
              <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'No orders match your search. Try a different query.'
                  : 'No delivery orders available right now. Stay online and check back soon!'}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => fetchNearby(true)}>
                <RefreshCw className="h-4 w-4 mr-2" /> Check Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order ${selectedOrder?.orderId || ''}`}>
        {selectedOrder && (
          <div className="space-y-4">
            {/* Vendor */}
            {selectedOrder.vendor && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-600 font-medium uppercase">Pickup From</p>
                    <p className="font-bold text-gray-900 mt-1">{selectedOrder.vendor.storeName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.vendor.address?.address || ''}</p>
                    {selectedOrder.vendor.category && (
                      <Badge variant="secondary" className="mt-1">{selectedOrder.vendor.category}</Badge>
                    )}
                  </div>
                  {selectedOrder.pickupDistance !== null && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{formatDistance(selectedOrder.pickupDistance)}</p>
                      <p className="text-xs text-orange-500">from you</p>
                    </div>
                  )}
                </div>
                {selectedOrder.vendor.phone && (
                  <a href={`tel:${selectedOrder.vendor.phone}`} className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600">
                    <Phone className="h-3 w-3" /> {selectedOrder.vendor.phone}
                  </a>
                )}
              </div>
            )}

            {/* Delivery */}
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 font-medium uppercase">Deliver To</p>
              <p className="font-medium text-gray-900 mt-1">{selectedOrder.deliveryAddress?.address || 'Customer address'}</p>
              {selectedOrder.deliveryAddress?.city && (
                <p className="text-sm text-gray-500">{selectedOrder.deliveryAddress.city} {selectedOrder.deliveryAddress.pincode}</p>
              )}
              {selectedOrder.deliveryDistance !== null && (
                <p className="text-sm text-green-600 mt-1">{formatDistance(selectedOrder.deliveryDistance)} from vendor</p>
              )}
            </div>

            {/* Items */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Order Items ({selectedOrder.itemCount})</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.quantity}x {item.name}</span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Total</span>
                <span className="font-medium">{formatPrice(selectedOrder.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="font-medium">{formatPrice(selectedOrder.deliveryFee)}</span>
              </div>
              {selectedOrder.totalDistance !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Distance</span>
                  <span className="font-medium">{formatDistance(selectedOrder.totalDistance)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                <span className="text-green-700">Your Earnings</span>
                <span className="text-green-600">{formatPrice(selectedOrder.deliveryEarnings)}</span>
              </div>
            </div>

            {/* Posted time */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              Posted {timeAgo(selectedOrder.createdAt)}
            </div>

            {/* Accept */}
            <Button
              className="w-full"
              onClick={() => handleAcceptOrder(selectedOrder._id)}
              disabled={acceptingOrder === selectedOrder._id}
            >
              {acceptingOrder === selectedOrder._id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              {acceptingOrder === selectedOrder._id ? 'Accepting...' : 'Accept This Order'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
