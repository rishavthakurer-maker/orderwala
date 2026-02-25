'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Copy, Check, Tag, Loader2 } from 'lucide-react';
import { Card, CardContent, Button, Input, Badge, Modal, DynamicBar } from '@/components/ui';
import { formatPrice, formatDate } from '@/lib/utils';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deletePromo, setDeletePromo] = useState<PromoCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_amount: 0,
    max_discount: 0,
    usage_limit: 100,
    valid_from: '',
    valid_until: '',
  });

  const getToken = () => localStorage.getItem('adminToken') || '';

  const fetchPromos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/promos?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setPromos(data.data || []);
    } catch (err) {
      console.error('Error fetching promos:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const openAddModal = () => {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 0,
      max_discount: 0,
      usage_limit: 100,
      valid_from: now.toISOString().split('T')[0],
      valid_until: nextMonth.toISOString().split('T')[0],
    });
    setShowAddModal(true);
  };

  const openEditModal = (promo: PromoCode) => {
    setFormData({
      code: promo.code,
      description: promo.description,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_order_amount: promo.min_order_amount,
      max_discount: promo.max_discount || 0,
      usage_limit: promo.usage_limit,
      valid_from: promo.valid_from?.split('T')[0] || '',
      valid_until: promo.valid_until?.split('T')[0] || '',
    });
    setEditingPromo(promo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingPromo ? `/api/admin/promos/${editingPromo.id}` : '/api/admin/promos';
      const method = editingPromo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...formData,
          max_discount: formData.max_discount || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setEditingPromo(null);
        fetchPromos();
      } else {
        alert(data.message || 'Error saving promo');
      }
    } catch (err) {
      console.error('Error saving promo:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promo: PromoCode) => {
    try {
      const res = await fetch(`/api/admin/promos/${promo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ is_active: !promo.is_active }),
      });
      const data = await res.json();
      if (data.success) fetchPromos();
    } catch (err) {
      console.error('Error toggling promo:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletePromo) return;
    try {
      const res = await fetch(`/api/admin/promos/${deletePromo.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeletePromo(null);
        fetchPromos();
      }
    } catch (err) {
      console.error('Error deleting promo:', err);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (promo: PromoCode) => new Date(promo.valid_until) < new Date();
  const activeCount = promos.filter(p => p.is_active && !isExpired(p)).length;
  const totalPages = Math.ceil(promos.length / itemsPerPage);
  const paginatedPromos = promos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-gray-500">Manage promotional codes ({promos.length} total)</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Promo Code
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Promos</p><p className="text-2xl font-bold">{promos.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{activeCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Expired</p><p className="text-2xl font-bold text-red-600">{promos.filter(p => isExpired(p)).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Used</p><p className="text-2xl font-bold">{promos.reduce((s, p) => s + (p.used_count || 0), 0)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search by code or description..."
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
          ) : promos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Tag className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No promo codes found</p>
              <Button className="mt-4" onClick={openAddModal}><Plus className="h-4 w-4 mr-2" /> Create Promo Code</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPromos.map((promo) => (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{promo.code}</span>
                          <button onClick={() => handleCopyCode(promo.code)} className="text-gray-400 hover:text-gray-600">
                            {copiedCode === promo.code ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{promo.description}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : formatPrice(promo.discount_value)}
                        </span>
                        {promo.max_discount && promo.discount_type === 'percentage' && (
                          <p className="text-xs text-gray-500">Max: {formatPrice(promo.max_discount)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{formatPrice(promo.min_order_amount)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{promo.used_count || 0}</span>
                        <span className="text-sm text-gray-500">/{promo.usage_limit}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                          <DynamicBar
                            className="bg-green-500 h-1.5 rounded-full"
                            width={`${Math.min(100, ((promo.used_count || 0) / promo.usage_limit) * 100)}%`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${isExpired(promo) ? 'text-red-600' : 'text-gray-500'}`}>
                          {formatDate(promo.valid_until)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleToggleActive(promo)}>
                          {promo.is_active ? (
                            <ToggleRight className="h-6 w-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(promo)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletePromo(promo)}>
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, promos.length)} of {promos.length}
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

      {/* Add/Edit Promo Modal */}
      <Modal
        isOpen={showAddModal || !!editingPromo}
        onClose={() => { setShowAddModal(false); setEditingPromo(null); }}
        title={editingPromo ? 'Edit Promo Code' : 'Add Promo Code'}
        size="lg"
      >
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Promo Code"
              placeholder="e.g. SAVE20"
              value={formData.code}
              onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="discount-type">Discount Type</label>
              <select
                id="discount-type"
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={formData.discount_type}
                onChange={(e) => setFormData(p => ({ ...p, discount_type: e.target.value as 'percentage' | 'fixed' }))}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <Input
            label="Description"
            placeholder="Describe the promo..."
            value={formData.description}
            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
            required
          />

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label={formData.discount_type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
              type="number"
              value={formData.discount_value}
              onChange={(e) => setFormData(p => ({ ...p, discount_value: Number(e.target.value) }))}
              required
            />
            <Input
              label="Min Order Amount"
              type="number"
              value={formData.min_order_amount}
              onChange={(e) => setFormData(p => ({ ...p, min_order_amount: Number(e.target.value) }))}
            />
            {formData.discount_type === 'percentage' && (
              <Input
                label="Max Discount (₹)"
                type="number"
                value={formData.max_discount}
                onChange={(e) => setFormData(p => ({ ...p, max_discount: Number(e.target.value) }))}
              />
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Usage Limit"
              type="number"
              value={formData.usage_limit}
              onChange={(e) => setFormData(p => ({ ...p, usage_limit: Number(e.target.value) }))}
            />
            <Input
              label="Valid From"
              type="date"
              value={formData.valid_from}
              onChange={(e) => setFormData(p => ({ ...p, valid_from: e.target.value }))}
              required
            />
            <Input
              label="Valid Until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData(p => ({ ...p, valid_until: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); setEditingPromo(null); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingPromo ? 'Update Promo' : 'Create Promo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletePromo} onClose={() => setDeletePromo(null)} title="Delete Promo Code" size="sm">
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete promo code &quot;{deletePromo?.code}&quot;?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletePromo(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
