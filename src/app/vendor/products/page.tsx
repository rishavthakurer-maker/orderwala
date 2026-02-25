'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, X, ImagePlus } from 'lucide-react';
import { Card, CardContent, Button, Badge, Input, Modal, Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  unit: string;
  images: string[];
  stock: number;
  is_veg: boolean;
  is_available: boolean;
  category?: { id: string; name: string; slug: string };
  created_at: string;
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  unit: 'kg',
  categoryId: '',
  stock: '0',
  isVeg: true,
  images: [] as string[],
  imageUrl: '',
};

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/seller/products');
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch { console.error('Failed to fetch products'); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?isActive=true');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch { console.error('Failed to fetch categories'); }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      discountPrice: p.discount_price ? String(p.discount_price) : '',
      unit: p.unit || 'kg',
      categoryId: p.category?.id || '',
      stock: String(p.stock),
      isVeg: p.is_veg,
      images: p.images || [],
      imageUrl: '',
    });
    setEditingId(p.id);
    setShowModal(true);
  };

  const addImage = () => {
    if (form.imageUrl.trim()) {
      setForm({ ...form, images: [...form.images, form.imageUrl.trim()], imageUrl: '' });
    }
  };

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        discountPrice: form.discountPrice || null,
        unit: form.unit,
        categoryId: form.categoryId || null,
        stock: form.stock,
        isVeg: form.isVeg,
        images: form.images,
      };

      const url = editingId ? `/api/seller/products/${editingId}` : '/api/seller/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      toast.success(editingId ? 'Product updated!' : 'Product added!');
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/seller/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Product deleted');
      setProducts(products.filter((p) => p.id !== id));
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const toggleAvailability = async (p: Product) => {
    try {
      const res = await fetch(`/api/seller/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !p.is_available }),
      });
      if (!res.ok) throw new Error('Failed');
      setProducts(products.map((pr) => pr.id === p.id ? { ...pr, is_available: !pr.is_available } : pr));
      toast.success(p.is_available ? 'Product hidden' : 'Product visible');
    } catch {
      toast.error('Failed to update');
    }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">{products.length} products in your store</p>
        </div>
        <Button onClick={openAdd} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-10" />
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{search ? 'No products found' : 'No products yet'}</h2>
          <p className="text-gray-500 mb-4">{search ? 'Try a different search' : 'Add your first product to start selling!'}</p>
          {!search && <Button onClick={openAdd} className="bg-orange-600 hover:bg-orange-700"><Plus className="h-4 w-4 mr-2" /> Add Product</Button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <Card key={product.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${!product.is_available ? 'opacity-60' : ''}`}>
              <div className="relative h-40 bg-gray-100">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center"><Package className="h-12 w-12 text-gray-300" /></div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {product.is_veg && <Badge variant="success" className="text-xs">Veg</Badge>}
                  {!product.is_available && <Badge variant="danger" className="text-xs">Hidden</Badge>}
                </div>
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">Out of Stock</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{product.category?.name || 'Uncategorized'} &bull; {product.unit}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-gray-900">{formatPrice(product.discount_price || product.price)}</span>
                  {product.discount_price && <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">Stock: {product.stock}</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(product)}>
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleAvailability(product)} className="text-xs">
                    {product.is_available ? 'Hide' : 'Show'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)} disabled={deleting === product.id} className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Product' : 'Add New Product'}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fresh Tomatoes" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your product..." rows={3} className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-orange-500 focus:outline-none resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (₹)</label>
              <Input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} title="Product unit" className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-orange-500 focus:outline-none">
                <option value="kg">Kg</option>
                <option value="g">Gram</option>
                <option value="piece">Piece</option>
                <option value="dozen">Dozen</option>
                <option value="litre">Litre</option>
                <option value="ml">ML</option>
                <option value="pack">Pack</option>
                <option value="box">Box</option>
                <option value="bundle">Bundle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} title="Product category" className="w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-orange-500 focus:outline-none">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="isVeg" checked={form.isVeg} onChange={() => setForm({ ...form, isVeg: true })} className="text-green-600" />
              <span className="text-sm"> Veg</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="isVeg" checked={!form.isVeg} onChange={() => setForm({ ...form, isVeg: false })} className="text-red-600" />
              <span className="text-sm"> Non-Veg</span>
            </label>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Images (URL)</label>
            <div className="flex gap-2">
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Paste image URL" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }} />
              <Button type="button" variant="outline" onClick={addImage}><ImagePlus className="h-4 w-4" /></Button>
            </div>
            {form.images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {form.images.map((img, i) => (
                  <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border group">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button type="button" title="Remove image" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}