'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle2, XCircle, Truck, Search, ChevronDown, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Modal, Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  orderId: string;
  customer: { id: string; name: string; email: string; phone: string } | null;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  status: string;
  paymentMethod: string;
  deliveryAddress: { address?: string; city?: string; pincode?: string; phone?: string } | null;
  instructions: string;
  createdAt: string;
}

const statusTabs = [
  { key: 'all', label: 'All', icon: ShoppingBag },
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', icon: Clock },
  { key: 'ready', label: 'Ready', icon: CheckCircle2 },
  { key: 'delivered', label: 'Delivered', icon: Truck },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle },
];

const nextAction: Record<string, { status: string; label: string; color: string }> = {
  pending: { status: 'confirmed', label: 'Accept Order', color: 'bg-green-600 hover:bg-green-700' },
  confirmed: { status: 'preparing', label: 'Start Preparing', color: 'bg-blue-600 hover:bg-blue-700' },
  preparing: { status: 'ready', label: 'Mark Ready', color: 'bg-purple-600 hover:bg-purple-700' },
};

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/seller/orders');
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch { console.error('Failed to fetch orders'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status: newStatus });
      toast.success(`Order ${newStatus.replace(/_/g, ' ')}!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    await updateStatus(orderId, 'cancelled');
  };

  const filtered = orders.filter((o) => {
    const matchesTab = activeTab === 'all' || o.status === activeTab;
    const matchesSearch = !search || o.orderId?.toLowerCase().includes(search.toLowerCase()) || o.customer?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const statusColor: Record<string, string> = {
    pending: 'warning', confirmed: 'info', preparing: 'info', ready: 'success',
    picked_up: 'info', on_the_way: 'info', delivered: 'success', cancelled: 'danger',
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500">{orders.length} total orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => {
          const count = tab.key === 'all' ? orders.length : orders.filter((o) => o.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-orange-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order ID or customer..." className="pl-10" />
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">No orders found</h2>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const action = nextAction[order.status];
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold">#{typeof order.orderId === 'string' ? order.orderId.slice(-8) : order.orderId}</p>
                        <Badge variant={(statusColor[order.status] || 'default') as 'success' | 'warning' | 'danger' | 'info' | 'default'} className="capitalize text-xs">
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{order.customer?.name || 'Customer'}</span>
                        <span>{Array.isArray(order.items) ? order.items.length : 0} items</span>
                        <span className="font-medium text-gray-900">{formatPrice(order.total)}</span>
                        <span className="capitalize">{order.paymentMethod?.replace(/_/g, ' ') || 'COD'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>View</Button>
                      {action && (
                        <Button
                          size="sm"
                          className={action.color + ' text-white'}
                          onClick={() => updateStatus(order.id, action.status)}
                          disabled={updatingId === order.id}
                        >
                          {updatingId === order.id ? 'Updating...' : action.label}
                        </Button>
                      )}
                      {['pending', 'confirmed'].includes(order.status) && (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => cancelOrder(order.id)} disabled={updatingId === order.id}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.orderId ? (typeof selectedOrder.orderId === 'string' ? selectedOrder.orderId.slice(-8) : selectedOrder.orderId) : ''}`}>
        {selectedOrder && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <Badge variant={(statusColor[selectedOrder.status] || 'default') as 'success' | 'warning' | 'danger' | 'info' | 'default'} className="capitalize">
                {selectedOrder.status.replace(/_/g, ' ')}
              </Badge>
              <span className="text-sm text-gray-500">{new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</span>
            </div>

            {/* Customer */}
            <Card className="p-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Customer</p>
              <p className="font-medium">{selectedOrder.customer?.name || 'Customer'}</p>
              {selectedOrder.customer?.phone && (
                <a href={`tel:${selectedOrder.customer.phone}`} className="text-sm text-orange-600 flex items-center gap-1 mt-1"><Phone className="h-3.5 w-3.5" /> {selectedOrder.customer.phone}</a>
              )}
            </Card>

            {/* Items */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Items</p>
              <div className="space-y-2">
                {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: OrderItem, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.image && <img src={item.image} alt="" className="h-10 w-10 rounded object-cover" />}
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <Card className="p-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>{formatPrice(selectedOrder.deliveryCharge)}</span></div>
                {selectedOrder.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(selectedOrder.discount)}</span></div>}
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatPrice(selectedOrder.total)}</span></div>
                <p className="text-xs text-gray-500 capitalize">Payment: {selectedOrder.paymentMethod?.replace(/_/g, ' ') || 'COD'}</p>
              </div>
            </Card>

            {/* Delivery Address */}
            {selectedOrder.deliveryAddress && (
              <Card className="p-4">
                <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1"><MapPin className="h-4 w-4" /> Delivery Address</p>
                <p className="text-sm">{selectedOrder.deliveryAddress.address}</p>
                {selectedOrder.deliveryAddress.city && <p className="text-sm text-gray-500">{selectedOrder.deliveryAddress.city} - {selectedOrder.deliveryAddress.pincode}</p>}
              </Card>
            )}

            {selectedOrder.instructions && (
              <Card className="p-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Special Instructions</p>
                <p className="text-sm">{selectedOrder.instructions}</p>
              </Card>
            )}

            {/* Actions */}
            {nextAction[selectedOrder.status] && (
              <div className="flex gap-3">
                <Button
                  className={`flex-1 ${nextAction[selectedOrder.status].color} text-white`}
                  onClick={() => updateStatus(selectedOrder.id, nextAction[selectedOrder.status].status)}
                  disabled={updatingId === selectedOrder.id}
                >
                  {updatingId === selectedOrder.id ? 'Updating...' : nextAction[selectedOrder.status].label}
                </Button>
                {['pending', 'confirmed'].includes(selectedOrder.status) && (
                  <Button variant="outline" className="text-red-600 border-red-200" onClick={() => cancelOrder(selectedOrder.id)}>
                    Cancel Order
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}