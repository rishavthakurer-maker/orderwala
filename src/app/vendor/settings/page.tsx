'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Store, Save, Phone, Mail, MapPin, Upload, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Skeleton, Modal } from '@/components/ui';
import toast from 'react-hot-toast';

interface StoreData {
  id: string;
  store_name: string;
  description: string;
  phone: string;
  email: string;
  category: string;
  logo: string;
  delivery_radius: number;
  min_order_amount: number;
  delivery_fee: number;
  address: { street?: string; city?: string; state?: string; pincode?: string };
  bank_details: { account_name?: string; account_number?: string; ifsc?: string; bank_name?: string } | null;
}

export default function VendorSettingsPage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [logo, setLogo] = useState('');
  const [deliveryRadius, setDeliveryRadius] = useState('5');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const res = await fetch('/api/seller/store');
      const data = await res.json();
      if (data.success) {
        const s = data.data;
        setStore(s);
        setStoreName(s.store_name || '');
        setDescription(s.description || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setCategory(s.category || 'general');
        setLogo(s.logo || '');
        setDeliveryRadius(String(s.delivery_radius || 5));
        setMinOrderAmount(String(s.min_order_amount || 0));
        setDeliveryFee(String(s.delivery_fee || 0));
        setStreet(s.address?.street || '');
        setCity(s.address?.city || '');
        setState(s.address?.state || '');
        setPincode(s.address?.pincode || '');
        setAccountName(s.bank_details?.account_name || '');
        setAccountNumber(s.bank_details?.account_number || '');
        setIfsc(s.bank_details?.ifsc || '');
        setBankName(s.bank_details?.bank_name || '');
      }
    } catch { console.error('Failed to fetch store'); }
    finally { setLoading(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5MB.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { toast.error('Invalid file type.'); return; }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'logos');
      const res = await fetch('/api/seller/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setLogo(data.data.url);
        toast.success('Logo uploaded!');
      } else {
        toast.error(data.error || 'Failed to upload logo');
      }
    } catch { toast.error('Failed to upload logo'); }
    finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!storeName || !phone) {
      toast.error('Store name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/seller/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          description,
          phone,
          email,
          category,
          logo,
          deliveryRadius: parseFloat(deliveryRadius),
          minOrderAmount: parseFloat(minOrderAmount),
          deliveryFee: parseFloat(deliveryFee),
          address: { street, city, state, pincode },
          bankDetails: { account_name: accountName, account_number: accountNumber, ifsc, bank_name: bankName },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-500">Manage your store information and preferences</p>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Store Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe your store" title="Store description" className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-orange-500 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} title="Store category" className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-orange-500 focus:outline-none">
                <option value="general">General</option>
                <option value="grocery">Grocery</option>
                <option value="vegetables">Vegetables</option>
                <option value="restaurant">Restaurant</option>
                <option value="meat">Meat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo</label>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-lg border overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                  {logo ? (
                    <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleLogoUpload} className="hidden" id="logo-upload" title="Upload store logo" />
                  <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                    {uploadingLogo ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</> : <><Upload className="h-3.5 w-3.5" /> Upload image</>}
                  </button>
                  <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="Or paste URL" className="text-xs h-8" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card>
        <CardHeader><CardTitle>Delivery Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius (km)</label>
              <Input type="number" value={deliveryRadius} onChange={(e) => setDeliveryRadius(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
              <Input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₹)</label>
              <Input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Store Address</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <Input value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <Input value={pincode} onChange={(e) => setPincode(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <Input value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || uploadingLogo} className="bg-orange-600 hover:bg-orange-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Danger Zone - Delete Account */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">Delete Seller Account</p>
              <p className="text-sm text-gray-500">Permanently delete your store, all products, and your account. This action cannot be undone.</p>
            </div>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50 shrink-0"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirm(''); }} title="Delete Seller Account">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Your store &quot;{store?.store_name}&quot;</li>
                  <li>All your products</li>
                  <li>Your seller account</li>
                </ul>
                <p className="mt-2 font-medium">This action cannot be undone.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
            </label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              className="border-red-300 focus:border-red-500"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteConfirm !== 'DELETE' || deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  const res = await fetch('/api/seller/store', { method: 'DELETE' });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to delete');
                  toast.success('Account deleted successfully');
                  await signOut({ callbackUrl: '/' });
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to delete account');
                  setDeleting(false);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}