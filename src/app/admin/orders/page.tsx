'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight, Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, Button, Input, Modal } from '@/components/ui';
import { formatPrice, formatDateTime, getOrderStatusColor } from '@/lib/utils';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer: { id: string; name: string; phone: string; email: string } | null;
  vendor: { id: string; store_name: string } | null;
  items: OrderItem[];
  delivery_address: Record<string, string>;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

const statusOptions = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Order | null>(null);
  const itemsPerPage = 10;

  const getToken = () => localStorage.getItem('adminToken') || '';

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.data);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    try {
      setDeletingId(order.id);
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order ${order.order_number} deleted permanently`);
        setOrders(prev => prev.filter(o => o.id !== order.id));
        if (selectedOrder?.id === order.id) setSelectedOrder(null);
      } else {
        toast.error(data.message || 'Failed to delete order');
      }
    } catch {
      toast.error('Failed to delete order');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatAddress = (addr: Record<string, string> | null) => {
    if (!addr) return 'N/A';
    return [addr.street, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500">Manage and track all orders ({orders.length} total)</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by order number..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              aria-label="Filter by status"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <ShoppingCart className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{order.order_number}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.customer?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{order.customer?.phone || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{order.vendor?.store_name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{formatPrice(order.total)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-gray-900 capitalize">{order.payment_method}</p>
                          <p className={`text-xs ${order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'refunded' ? 'text-purple-600' : 'text-yellow-600'}`}>
                            {order.payment_status}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{formatDateTime(order.created_at)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(order)}
                            disabled={deletingId === order.id}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Order" size="sm">
        {confirmDelete && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-center text-gray-700">
              Are you sure you want to permanently delete order <strong>{confirmDelete.order_number}</strong>?
              This will remove it from all accounts (customer, vendor, delivery).
            </p>
            <p className="text-center text-sm text-red-600 font-medium">This action cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDeleteOrder(confirmDelete)}
                disabled={!!deletingId}
              >
                {deletingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete Permanently
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order ${selectedOrder?.order_number}`} size="lg">
        {selectedOrder && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status.replace(/_/g, ' ')}
                </span>
              </div>
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <select
                  className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  defaultValue=""
                  disabled={updatingStatus}
                  onChange={(e) => {
                    if (e.target.value) handleStatusChange(selectedOrder.id, e.target.value);
                  }}
                  aria-label="Update order status"
                >
                  <option value="" disabled>Update Status</option>
                  {statusOptions.filter(s => s !== 'all').map(status => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Customer Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm"><span className="text-gray-500">Name:</span> {selectedOrder.customer?.name || 'N/A'}</p>
                  <p className="text-sm"><span className="text-gray-500">Phone:</span> {selectedOrder.customer?.phone || 'N/A'}</p>
                  <p className="text-sm"><span className="text-gray-500">Email:</span> {selectedOrder.customer?.email || 'N/A'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Delivery Address</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm">{formatAddress(selectedOrder.delivery_address)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Order Items</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(selectedOrder.items as OrderItem[])?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.qty}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatPrice(item.price)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatPrice(item.price * item.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-medium text-right">Total</td>
                      <td className="px-4 py-3 text-sm font-bold text-right">{formatPrice(selectedOrder.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium capitalize">{selectedOrder.payment_method}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className={`font-medium ${selectedOrder.payment_status === 'paid' ? 'text-green-600' : selectedOrder.payment_status === 'refunded' ? 'text-purple-600' : 'text-yellow-600'}`}>
                  {selectedOrder.payment_status?.replace(/^\w/, (c: string) => c.toUpperCase())}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
