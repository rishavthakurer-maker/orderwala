'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight,
  ToggleLeft, ToggleRight, X, ImagePlus, Loader2,
  Star, Package
} from 'lucide-react';
import { Card, CardContent, Button, Input, Badge, Modal } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Vendor {
  id: string;
  store_name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  unit: string;
  stock: number;
  min_order_qty: number;
  max_order_qty: number;
  images: string[];
  tags: string[];
  is_veg: boolean;
  is_featured: boolean;
  is_available: boolean;
  is_active: boolean;
  average_rating: number;
  total_sold: number;
  category: Category | null;
  vendor: Vendor | null;
  category_id: string;
  vendor_id: string;
  created_at: string;
}

const defaultForm = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  unit: 'piece',
  stock: '0',
  categoryId: '',
  vendorId: '',
  images: [] as string[],
  isVeg: true,
  isFeatured: false,
  isAvailable: true,
  tags: '',
  minOrderQty: '1',
  maxOrderQty: '10',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;

  const getToken = () => localStorage.getItem('adminToken') || '';

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/admin/vendors', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setVendors(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchVendors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, categoryFilter, fetchProducts]);

  const openAddForm = () => {
    setEditingProduct(null);
    setForm(defaultForm);
    setError('');
    setShowFormModal(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      discountPrice: product.discount_price?.toString() || '',
      unit: product.unit || 'piece',
      stock: product.stock.toString(),
      categoryId: product.category_id || '',
      vendorId: product.vendor_id || '',
      images: product.images || [],
      isVeg: product.is_veg,
      isFeatured: product.is_featured,
      isAvailable: product.is_available,
      tags: (product.tags || []).join(', '),
      minOrderQty: product.min_order_qty?.toString() || '1',
      maxOrderQty: product.max_order_qty?.toString() || '10',
    });
    setError('');
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingProduct(null);
    setForm(defaultForm);
    setError('');
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages = [...form.images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          newImages.push(data.data.url);
        } else {
          setError(data.message || 'Failed to upload image');
        }
      } catch (err) {
        console.error('Upload error:', err);
        setError('Image upload failed');
      }
    }

    setForm(f => ({ ...f, images: newImages }));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setForm(f => ({
      ...f,
      images: f.images.filter((_, i) => i !== index),
    }));
  };

  // Save product (create or update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Product name is required'); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setError('Valid price is required'); return; }
    if (!form.categoryId) { setError('Category is required'); return; }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
      unit: form.unit,
      stock: parseInt(form.stock) || 0,
      categoryId: form.categoryId,
      vendorId: form.vendorId || undefined,
      images: form.images,
      isVeg: form.isVeg,
      isFeatured: form.isFeatured,
      isAvailable: form.isAvailable,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      minOrderQty: parseInt(form.minOrderQty) || 1,
      maxOrderQty: parseInt(form.maxOrderQty) || 10,
    };

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        closeFormModal();
        fetchProducts();
      } else {
        setError(data.message || 'Failed to save product');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      const res = await fetch(`/api/admin/products/${deleteProduct.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeleteProduct(null);
        fetchProducts();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Toggle active/featured/available
  const handleToggle = async (product: Product, field: 'isActive' | 'isFeatured' | 'isAvailable') => {
    const payload: Record<string, boolean> = {};
    if (field === 'isActive') payload.isActive = !product.is_active;
    if (field === 'isFeatured') payload.isFeatured = !product.is_featured;
    if (field === 'isAvailable') payload.isAvailable = !product.is_available;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) fetchProducts();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage all products ({products.length} total)</p>
        </div>
        <Button onClick={openAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Package className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Add your first product to get started</p>
              <Button className="mt-4" onClick={openAddForm}>
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            {product.images && product.images.length > 0 ? (
                              <Image src={product.images[0]} alt={product.name} width={48} height={48} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <div className="flex items-center gap-2">
                              {product.is_veg ? (
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Veg</span>
                              ) : (
                                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Non-veg</span>
                              )}
                              {product.average_rating > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-gray-500">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" /> {product.average_rating}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">{product.category?.name || 'N/A'}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatPrice(product.price)}/{product.unit}</p>
                          {product.discount_price && product.discount_price < product.price && (
                            <p className="text-xs text-green-600 font-medium">Sale: {formatPrice(product.discount_price)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-600' : product.stock < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleToggle(product, 'isAvailable')} className="flex items-center">
                          {product.is_available ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6 text-gray-400" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleToggle(product, 'isFeatured')} className="flex items-center">
                          {product.is_featured ? <ToggleRight className="h-6 w-6 text-yellow-500" /> : <ToggleLeft className="h-6 w-6 text-gray-400" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditForm(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteProduct(product)}>
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, products.length)} of {products.length}
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

      {/* Add/Edit Product Modal */}
      <Modal isOpen={showFormModal} onClose={closeFormModal} title={editingProduct ? 'Edit Product' : 'Add New Product'} size="full">
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          {/* Product Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border bg-gray-50">
                  <Image src={img} alt={`Product image ${idx + 1}`} fill className="object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} aria-label="Remove image" className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 flex flex-col items-center justify-center text-gray-400 hover:text-green-600 transition-colors"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ImagePlus className="h-6 w-6" /><span className="text-xs mt-1">Upload</span></>}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" title="Upload product images" />
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 5MB each</p>
          </div>

          {/* Name & Category */}
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Product Name *" placeholder="Enter product name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="product-category">Category *</label>
              <select id="product-category" value={form.categoryId} onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" required>
                <option value="">Select category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="product-desc">Description</label>
            <textarea id="product-desc" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the product..." rows={3} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none" />
          </div>

          {/* Price, Discount, Unit, Stock */}
          <div className="grid md:grid-cols-4 gap-4">
            <Input label="Price (₹) *" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
            <Input label="Discount Price (₹)" type="number" min="0" step="0.01" placeholder="Optional" value={form.discountPrice} onChange={(e) => setForm(f => ({ ...f, discountPrice: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="product-unit">Unit</label>
              <select id="product-unit" value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
                <option value="piece">Piece</option>
                <option value="kg">Kg</option>
                <option value="g">Gram</option>
                <option value="liter">Liter</option>
                <option value="ml">mL</option>
                <option value="packet">Packet</option>
                <option value="dozen">Dozen</option>
                <option value="plate">Plate</option>
                <option value="box">Box</option>
                <option value="bundle">Bundle</option>
              </select>
            </div>
            <Input label="Stock" type="number" min="0" placeholder="0" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))} />
          </div>

          {/* Vendor & Order Qty */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="product-vendor">Vendor</label>
              <select id="product-vendor" value={form.vendorId} onChange={(e) => setForm(f => ({ ...f, vendorId: e.target.value }))} className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
                <option value="">Auto-assign vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.store_name}</option>)}
              </select>
            </div>
            <Input label="Min Order Qty" type="number" min="1" placeholder="1" value={form.minOrderQty} onChange={(e) => setForm(f => ({ ...f, minOrderQty: e.target.value }))} />
            <Input label="Max Order Qty" type="number" min="1" placeholder="10" value={form.maxOrderQty} onChange={(e) => setForm(f => ({ ...f, maxOrderQty: e.target.value }))} />
          </div>

          {/* Tags */}
          <Input label="Tags" placeholder="organic, fresh, local (comma separated)" value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} />

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm(f => ({ ...f, isVeg: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <span className="text-sm text-gray-700">Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm(f => ({ ...f, isAvailable: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <span className="text-sm text-gray-700">Available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeFormModal}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteProduct} onClose={() => setDeleteProduct(null)} title="Delete Product" size="sm">
        <div className="p-6">
          <p className="text-gray-600 mb-6">Are you sure you want to delete &quot;{deleteProduct?.name}&quot;? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteProduct(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
