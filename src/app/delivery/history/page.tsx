'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Search, Star, TrendingUp, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Modal, Skeleton } from '@/components/ui';
import { formatPrice, formatDate, formatDateTime } from '@/lib/utils';

interface HistoryOrder {
  _id: string;
  orderId: string;
  items: { name: string; quantity: number; unit?: string; price: number }[];
  total: number;
  deliveryEarnings: number;
  deliveryRating: number | null;
  deliveryFeedback: string | null;
  deliveryAddress: { address?: string; city?: string };
  status: string;
  deliveredAt: string;
  createdAt: string;
  vendor: { _id: string; storeName: string; phone?: string; address?: string } | null;
  customer: { _id: string; name: string; phone?: string } | null;
}

export default function DeliveryHistoryPage() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/delivery/orders?type=history&page=${page}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
        setTotal(json.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Summary stats
  const totalDeliveries = orders.length;
  const totalEarnings = orders.reduce((sum, o) => sum + (o.deliveryEarnings || 0), 0);
  const ratedOrders = orders.filter(o => o.deliveryRating);
  const avgRating = ratedOrders.length > 0 ? (ratedOrders.reduce((sum, o) => sum + (o.deliveryRating || 0), 0) / ratedOrders.length).toFixed(1) : '—';

  // Filter
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (order.orderId?.toLowerCase().includes(q)) ||
      (order.vendor?.storeName?.toLowerCase().includes(q)) ||
      (order.customer?.name?.toLowerCase().includes(q));
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>)}
        </div>
        {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-24" /></CardContent></Card>)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-500">View your completed deliveries</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{total || totalDeliveries}</p>
            <p className="text-sm text-gray-500">Total Deliveries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{formatPrice(totalEarnings)}</p>
            <p className="text-sm text-gray-500">Earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{avgRating}</p>
            <p className="text-sm text-gray-500">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by Order ID, Vendor, or Customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedOrder(order); setShowOrderDetail(true); }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold">{order.orderId}</span>
                    <Badge variant={order.status === 'delivered' ? 'success' : 'secondary'}>{order.status === 'delivered' ? 'Delivered' : 'Cancelled'}</Badge>
                    {order.deliveryRating && (
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1 text-sm font-medium">{order.deliveryRating}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <p className="font-medium text-gray-900">{order.vendor?.storeName || 'Vendor'}</p>
                      <p>{order.customer?.name || 'Customer'}</p>
                    </div>
                    <div className="md:text-right">
                      <p className="flex items-center md:justify-end gap-1"><MapPin className="h-4 w-4" />{order.deliveryAddress?.address?.substring(0, 30) || 'Address'}</p>
                    </div>
                  </div>
                  {order.deliveryFeedback && (
                    <p className="mt-2 text-sm text-gray-500 italic">&quot;{order.deliveryFeedback}&quot;</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm text-gray-500">{order.deliveredAt ? formatDateTime(new Date(order.deliveredAt)) : formatDate(new Date(order.createdAt))}</p>
                  <p className="text-lg font-bold text-green-600 mt-1">{formatPrice(order.deliveryEarnings)}</p>
                  <p className="text-sm text-gray-500">{order.items.length} items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500">{searchQuery ? 'Try adjusting your search' : 'Complete deliveries to see your history'}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Previous</button>
          <span className="px-4 py-2 text-sm">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 20} className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Next</button>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal isOpen={showOrderDetail} onClose={() => setShowOrderDetail(false)} title="Delivery Details">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">{selectedOrder.orderId}</span>
              <Badge variant="success">Completed</Badge>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between"><span className="text-gray-500">Vendor</span><span className="font-medium">{selectedOrder.vendor?.storeName}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Customer</span><span className="font-medium">{selectedOrder.customer?.name}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Items</span><span className="font-medium">{selectedOrder.items.length}</span></div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between"><span className="text-gray-500">Order Total</span><span className="font-medium">{formatPrice(selectedOrder.total)}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Your Earnings</span><span className="font-bold text-green-600 text-lg">{formatPrice(selectedOrder.deliveryEarnings)}</span></div>
            </div>

            {selectedOrder.deliveredAt && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between"><span className="text-gray-500">Delivered At</span><span className="font-medium">{formatDateTime(new Date(selectedOrder.deliveredAt))}</span></div>
              </div>
            )}

            {/* Rating */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Customer Feedback</h4>
              {selectedOrder.deliveryRating ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-5 w-5 ${star <= (selectedOrder.deliveryRating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                    ))}
                    <span className="font-medium ml-1">{selectedOrder.deliveryRating}/5</span>
                  </div>
                  {selectedOrder.deliveryFeedback ? (
                    <p className="text-gray-600 italic">&quot;{selectedOrder.deliveryFeedback}&quot;</p>
                  ) : (
                    <p className="text-gray-400">No written feedback</p>
                  )}
                </>
              ) : (
                <p className="text-gray-400">No rating received yet</p>
              )}
            </div>

            <button onClick={() => setShowOrderDetail(false)} className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Close</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
