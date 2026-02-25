'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Navigation, Phone, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Modal, Skeleton } from '@/components/ui';
import { formatPrice, getOrderStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderData {
  _id: string;
  orderId: string;
  items: { name: string; quantity: number; unit?: string; price: number }[];
  total: number;
  deliveryFee: number;
  deliveryAddress: { address?: string; city?: string; state?: string; pincode?: string; name?: string; phone?: string };
  deliveryEarnings: number;
  status: string;
  paymentMethod: string;
  instructions?: string;
  createdAt: string;
  vendor: { _id: string; storeName: string; phone?: string; address?: string } | null;
  customer: { _id: string; name: string; phone?: string } | null;
}

const statusFlow = ['ready', 'picked_up', 'on_the_way', 'delivered'];
const statusLabels: Record<string, string> = {
  ready: 'Ready',
  picked_up: 'Picked Up',
  on_the_way: 'On The Way',
  delivered: 'Delivered',
};

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery/orders?type=active');
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, action: string) => {
    try {
      const res = await fetch('/api/delivery/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Status updated!');
        fetchOrders();
      } else {
        toast.error(json.error || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update status');
    }
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
        {[1, 2].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-48" /></CardContent></Card>)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Active Orders</h1>
        <p className="text-gray-500">Manage your current deliveries</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const nextAction = getNextAction(order.status);
          const currentIndex = statusFlow.indexOf(order.status);

          return (
            <Card key={order._id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{order.orderId}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{order.items.length} items • {formatPrice(order.total)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">{formatPrice(order.deliveryEarnings)}</p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-4 px-4">
                  {statusFlow.slice(0, -1).map((status, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    return (
                      <div key={status} className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isCompleted ? <CheckCircle className="h-5 w-5" /> : index + 1}
                        </div>
                        {index < statusFlow.length - 2 && (
                          <div className={`h-1 w-12 lg:w-20 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pickup and Delivery Info */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {order.vendor && (
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-orange-500" /><span className="text-xs font-medium text-orange-700">PICKUP</span></div>
                      <p className="font-medium">{order.vendor.storeName}</p>
                      <p className="text-sm text-gray-600">{order.vendor.address}</p>
                      {order.vendor.phone && (
                        <a href={`tel:${order.vendor.phone}`} className="inline-flex items-center gap-1 text-sm text-blue-600 mt-2"><Phone className="h-3 w-3" />{order.vendor.phone}</a>
                      )}
                    </div>
                  )}
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-green-500" /><span className="text-xs font-medium text-green-700">DELIVERY</span></div>
                    <p className="font-medium">{order.customer?.name || 'Customer'}</p>
                    <p className="text-sm text-gray-600">{order.deliveryAddress?.address}</p>
                    {order.customer?.phone && (
                      <a href={`tel:${order.customer.phone}`} className="inline-flex items-center gap-1 text-sm text-blue-600 mt-2"><Phone className="h-3 w-3" />{order.customer.phone}</a>
                    )}
                  </div>
                </div>

                {order.instructions && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-yellow-600" /><span className="text-sm text-yellow-800">{order.instructions}</span></div>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-4">
                  <span className="text-sm text-gray-500">Total: <span className="font-medium">{formatPrice(order.total)}</span></span>
                  <Badge variant={order.paymentMethod === 'cod' ? 'warning' : 'success'}>
                    {order.paymentMethod === 'cod' ? '💵 Collect Cash' : '✓ Paid Online'}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setSelectedOrder(order); setShowOrderDetail(true); }}>
                    View Details
                  </Button>
                  {nextAction && (
                    <Button className={`flex-1 ${nextAction.action === 'delivered' ? 'bg-green-500 hover:bg-green-600' : ''}`} onClick={() => updateOrderStatus(order._id, nextAction.action)}>
                      <CheckCircle className="h-4 w-4 mr-1" />{nextAction.label}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {orders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">No Active Orders</h3>
              <p className="text-gray-500">Stay online to receive new delivery requests!</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal isOpen={showOrderDetail} onClose={() => setShowOrderDetail(false)} title="Order Details">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">{selectedOrder.orderId}</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(selectedOrder.status)}`}>
                {statusLabels[selectedOrder.status] || selectedOrder.status}
              </span>
            </div>

            <div>
              <h4 className="font-medium mb-2">Items</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="text-gray-500">{item.unit || ''} x {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2"><span className="text-gray-500">Order Total</span><span className="font-medium">{formatPrice(selectedOrder.total)}</span></div>
              <div className="flex items-center justify-between mb-2"><span className="text-gray-500">Your Earnings</span><span className="font-bold text-green-600">{formatPrice(selectedOrder.deliveryEarnings)}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Payment</span>
                <Badge variant={selectedOrder.paymentMethod === 'cod' ? 'warning' : 'success'}>{selectedOrder.paymentMethod === 'cod' ? 'COD' : 'Online'}</Badge>
              </div>
            </div>

            {selectedOrder.vendor && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Vendor</h4>
                <p className="text-sm">{selectedOrder.vendor.storeName}</p>
                <p className="text-sm text-gray-500">{selectedOrder.vendor.address}</p>
                {selectedOrder.vendor.phone && <p className="text-sm text-gray-500">{selectedOrder.vendor.phone}</p>}
              </div>
            )}

            {selectedOrder.customer && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Customer</h4>
                <p className="text-sm">{selectedOrder.customer.name}</p>
                <p className="text-sm text-gray-500">{selectedOrder.deliveryAddress?.address}</p>
                {selectedOrder.customer.phone && <p className="text-sm text-gray-500">{selectedOrder.customer.phone}</p>}
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setShowOrderDetail(false)}>Close</Button>
              {selectedOrder.customer?.phone && (
                <a href={`tel:${selectedOrder.customer.phone}`} className="flex-1">
                  <Button className="w-full"><Phone className="h-4 w-4 mr-1" />Call Customer</Button>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
