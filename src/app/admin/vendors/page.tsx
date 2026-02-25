'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Phone, Mail, Star, Loader2, Store } from 'lucide-react';
import { Card, CardContent, Button, Input, Badge, Modal } from '@/components/ui';
import { formatPrice, formatDateTime } from '@/lib/utils';

interface Vendor {
  id: string;
  store_name: string;
  slug: string;
  phone: string;
  email: string | null;
  category: string;
  description: string;
  logo: string;
  address: Record<string, string>;
  commission_rate: number;
  average_rating: number;
  total_ratings: number;
  total_orders: number;
  is_open: boolean;
  is_active: boolean;
  is_verified: boolean;
  delivery_radius: number;
  min_order_amount: number;
  delivery_fee: number;
  created_at: string;
}

const categoryOptions = ['restaurant', 'grocery', 'meat', 'vegetables', 'general'];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [deleteVendor, setDeleteVendor] = useState<Vendor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    store_name: '',
    phone: '',
    email: '',
    category: 'restaurant',
    description: '',
    commission_rate: 10,
    is_verified: false,
    delivery_radius: 5,
    min_order_amount: 0,
    delivery_fee: 0,
  });

  const getToken = () => localStorage.getItem('adminToken') || '';

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/vendors?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setVendors(data.data || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const openAddModal = () => {
    setFormData({
      store_name: '',
      phone: '',
      email: '',
      category: 'restaurant',
      description: '',
      commission_rate: 10,
      is_verified: false,
      delivery_radius: 5,
      min_order_amount: 0,
      delivery_fee: 0,
    });
    setShowAddModal(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setFormData({
      store_name: vendor.store_name,
      phone: vendor.phone,
      email: vendor.email || '',
      category: vendor.category,
      description: vendor.description || '',
      commission_rate: vendor.commission_rate,
      is_verified: vendor.is_verified,
      delivery_radius: vendor.delivery_radius,
      min_order_amount: vendor.min_order_amount,
      delivery_fee: vendor.delivery_fee,
    });
    setEditingVendor(vendor);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingVendor
        ? `/api/admin/vendors/${editingVendor.id}`
        : '/api/admin/vendors';
      const method = editingVendor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setEditingVendor(null);
        fetchVendors();
      } else {
        alert(data.message || 'Error saving vendor');
      }
    } catch (err) {
      console.error('Error saving vendor:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (vendorId: string, field: string, value: boolean) => {
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.success) fetchVendors();
    } catch (err) {
      console.error('Error updating vendor:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteVendor) return;
    try {
      const res = await fetch(`/api/admin/vendors/${deleteVendor.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeleteVendor(null);
        fetchVendors();
      }
    } catch (err) {
      console.error('Error deleting vendor:', err);
    }
  };

  const activeCount = vendors.filter(v => v.is_active).length;
  const totalPages = Math.ceil(vendors.length / itemsPerPage);
  const paginatedVendors = vendors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500">Manage registered vendors ({vendors.length} total)</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Vendors</p><p className="text-2xl font-bold">{vendors.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{activeCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Verified</p><p className="text-2xl font-bold text-blue-600">{vendors.filter(v => v.is_verified).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold">{vendors.reduce((s, v) => s + (v.total_orders || 0), 0)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search by store name or phone..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Store className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No vendors found</p>
              <Button className="mt-4" onClick={openAddModal}><Plus className="h-4 w-4 mr-2" /> Add Your First Vendor</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 shrink-0 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-medium">{vendor.store_name.charAt(0)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{vendor.store_name}</p>
                              {vendor.is_verified && <Badge variant="success" size="sm">Verified</Badge>}
                            </div>
                            <p className="text-sm text-gray-500">{vendor.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">{vendor.category}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="ml-1 text-sm font-medium">{vendor.average_rating || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{vendor.total_orders || 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{vendor.commission_rate}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={vendor.is_active ? 'active' : 'inactive'}
                          onChange={(e) => handleStatusChange(vendor.id, 'is_active', e.target.value === 'active')}
                          className={`text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer ${
                            vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                          aria-label="Change vendor status"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setViewingVendor(vendor)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(vendor)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteVendor(vendor)}>
                            <Trash2 className="h-4 w-4" />
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, vendors.length)} of {vendors.length}
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

      {/* View Vendor Modal */}
      <Modal isOpen={!!viewingVendor} onClose={() => setViewingVendor(null)} title="Vendor Details" size="lg">
        {viewingVendor && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-2xl font-bold">{viewingVendor.store_name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{viewingVendor.store_name}</h3>
                  {viewingVendor.is_verified && <Badge variant="success">Verified</Badge>}
                </div>
                <p className="text-gray-500 capitalize">{viewingVendor.category}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1 font-medium">{viewingVendor.average_rating || 0}</span>
                    <span className="text-gray-500 text-sm ml-1">({viewingVendor.total_ratings} ratings)</span>
                  </div>
                  <Badge variant={viewingVendor.is_active ? 'success' : 'secondary'}>
                    {viewingVendor.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Contact Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{viewingVendor.phone}</span>
                  </div>
                  {viewingVendor.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{viewingVendor.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Business Stats</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Total Orders:</span><span className="font-medium">{viewingVendor.total_orders}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Commission Rate:</span><span className="font-medium">{viewingVendor.commission_rate}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery Fee:</span><span className="font-medium">{formatPrice(viewingVendor.delivery_fee)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Min Order:</span><span className="font-medium">{formatPrice(viewingVendor.min_order_amount)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery Radius:</span><span className="font-medium">{viewingVendor.delivery_radius} km</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Joined:</span><span className="font-medium">{formatDateTime(viewingVendor.created_at)}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Vendor Modal */}
      <Modal
        isOpen={showAddModal || !!editingVendor}
        onClose={() => { setShowAddModal(false); setEditingVendor(null); }}
        title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
        size="lg"
      >
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Store Name"
              placeholder="Enter store name"
              value={formData.store_name}
              onChange={(e) => setFormData(p => ({ ...p, store_name: e.target.value }))}
              required
            />
            <Input
              label="Phone"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="vendor@example.com"
              value={formData.email}
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="vendor-category">Category</label>
              <select
                id="vendor-category"
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={formData.category}
                onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
              >
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Commission (%)"
              type="number"
              placeholder="10"
              value={formData.commission_rate}
              onChange={(e) => setFormData(p => ({ ...p, commission_rate: Number(e.target.value) }))}
            />
            <Input
              label="Delivery Fee"
              type="number"
              placeholder="0"
              value={formData.delivery_fee}
              onChange={(e) => setFormData(p => ({ ...p, delivery_fee: Number(e.target.value) }))}
            />
            <Input
              label="Min Order Amount"
              type="number"
              placeholder="0"
              value={formData.min_order_amount}
              onChange={(e) => setFormData(p => ({ ...p, min_order_amount: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              rows={3}
              placeholder="Vendor description..."
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_verified}
                onChange={(e) => setFormData(p => ({ ...p, is_verified: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Verified Vendor</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); setEditingVendor(null); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingVendor ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteVendor} onClose={() => setDeleteVendor(null)} title="Delete Vendor" size="sm">
        <div className="p-6">
          <p className="text-gray-600 mb-2">
            Are you sure you want to delete &quot;{deleteVendor?.store_name}&quot;?
          </p>
          <p className="text-sm text-red-600 mb-6">
            This will remove all products associated with this vendor.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteVendor(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
