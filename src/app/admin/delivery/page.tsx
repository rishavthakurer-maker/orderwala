'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Phone, Mail, Bike, Loader2 } from 'lucide-react';
import { Card, CardContent, Button, Input, Badge, Modal } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';

interface DeliveryPartner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  image: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export default function DeliveryPage() {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingPartner, setViewingPartner] = useState<DeliveryPartner | null>(null);
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletePartner, setDeletePartner] = useState<DeliveryPartner | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({ name: '', phone: '', email: '', is_verified: false });

  const getToken = () => localStorage.getItem('adminToken') || '';

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/delivery?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setPartners(data.data || []);
    } catch (err) {
      console.error('Error fetching delivery partners:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const openAddModal = () => {
    setFormData({ name: '', phone: '', email: '', is_verified: false });
    setShowAddModal(true);
  };

  const openEditModal = (partner: DeliveryPartner) => {
    setFormData({
      name: partner.name,
      phone: partner.phone || '',
      email: partner.email || '',
      is_verified: partner.is_verified,
    });
    setEditingPartner(partner);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingPartner
        ? `/api/admin/delivery/${editingPartner.id}`
        : '/api/admin/delivery';
      const method = editingPartner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setEditingPartner(null);
        fetchPartners();
      } else {
        alert(data.message || 'Error saving partner');
      }
    } catch (err) {
      console.error('Error saving partner:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (partner: DeliveryPartner) => {
    try {
      const res = await fetch(`/api/admin/delivery/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ is_active: !partner.is_active }),
      });
      const data = await res.json();
      if (data.success) fetchPartners();
    } catch (err) {
      console.error('Error toggling partner status:', err);
    }
  };

  const handleVerify = async (partner: DeliveryPartner) => {
    try {
      const res = await fetch(`/api/admin/delivery/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ is_verified: true }),
      });
      const data = await res.json();
      if (data.success) fetchPartners();
    } catch (err) {
      console.error('Error verifying partner:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletePartner) return;
    try {
      const res = await fetch(`/api/admin/delivery/${deletePartner.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeletePartner(null);
        fetchPartners();
      }
    } catch (err) {
      console.error('Error deleting partner:', err);
    }
  };

  const activeCount = partners.filter(p => p.is_active).length;
  const totalPages = Math.ceil(partners.length / itemsPerPage);
  const paginatedPartners = partners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Partners</h1>
          <p className="text-gray-500">Manage delivery personnel ({partners.length} total)</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Partner
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Partners</p><p className="text-2xl font-bold">{partners.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{activeCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Verified</p><p className="text-2xl font-bold text-blue-600">{partners.filter(p => p.is_verified).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search by name, phone or email..."
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
          ) : partners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Bike className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No delivery partners found</p>
              <Button className="mt-4" onClick={openAddModal}><Plus className="h-4 w-4 mr-2" /> Add Partner</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPartners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 shrink-0 bg-orange-100 rounded-full flex items-center justify-center">
                            <Bike className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">{partner.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{partner.phone || '-'}</p>
                        <p className="text-xs text-gray-500">{partner.email || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {partner.is_verified ? (
                          <Badge variant="success" size="sm">Verified</Badge>
                        ) : (
                          <Button size="sm" onClick={() => handleVerify(partner)}>Verify</Button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{formatDateTime(partner.created_at)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleToggleActive(partner)}>
                          {partner.is_active ? (
                            <ToggleRight className="h-6 w-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setViewingPartner(partner)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(partner)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletePartner(partner)}>
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, partners.length)} of {partners.length}
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

      {/* Partner Detail Modal */}
      <Modal isOpen={!!viewingPartner} onClose={() => setViewingPartner(null)} title="Partner Details" size="lg">
        {viewingPartner && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Bike className="h-8 w-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{viewingPartner.name}</h3>
                <p className="text-gray-500">Partner since {formatDateTime(viewingPartner.created_at)}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={viewingPartner.is_active ? 'success' : 'secondary'}>
                    {viewingPartner.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={viewingPartner.is_verified ? 'success' : 'secondary'}>
                    {viewingPartner.is_verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Contact Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{viewingPartner.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{viewingPartner.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Partner Modal */}
      <Modal
        isOpen={showAddModal || !!editingPartner}
        onClose={() => { setShowAddModal(false); setEditingPartner(null); }}
        title={editingPartner ? 'Edit Partner' : 'Add New Partner'}
        size="lg"
      >
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
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

          <Input
            label="Email"
            type="email"
            placeholder="partner@email.com"
            value={formData.email}
            onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
          />

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_verified}
                onChange={(e) => setFormData(p => ({ ...p, is_verified: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Verified Partner</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); setEditingPartner(null); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingPartner ? 'Update Partner' : 'Add Partner'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletePartner} onClose={() => setDeletePartner(null)} title="Delete Partner" size="sm">
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete &quot;{deletePartner?.name}&quot;?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletePartner(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
