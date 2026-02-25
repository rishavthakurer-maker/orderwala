'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Star, Plus, Grid, List } from 'lucide-react';
import { Card, CardContent, Button, Input, Badge, Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  icon?: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  unit: string;
  images: string[];
  averageRating: number;
  totalRatings: number;
  isVeg: boolean;
  isAvailable: boolean;
  vendor?: {
    _id: string;
    storeName: string;
  };
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
}

const sortOptions = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Rating', value: 'rating' },
];

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  
  const addItem = useCartStore((state) => state.addItem);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories?isActive=true');
        const data = await res.json();
        if (data.success && data.data) {
          setCategories(data.data);
          const found = data.data.find((c: Category) => c.slug === slug);
          setCurrentCategory(found || null);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, [slug]);

  // Fetch products for category
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?category=${slug}&sort=${sortBy}&limit=50`);
        const data = await res.json();
        if (data.success && data.data) {
          setProducts(data.data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      fetchProducts();
    }
  }, [slug, sortBy]);

  // Filter products locally
  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(p => {
      const price = p.discountPrice || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

  const handleAddToCart = useCallback((product: Product) => {
    addItem({
      productId: product._id,
      name: product.name,
      price: product.discountPrice || product.price,
      quantity: 1,
      image: product.images?.[0] || '',
      unit: product.unit,
      vendorId: product.vendor?._id || '',
    });
  }, [addItem]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-gray-500 hover:text-primary-600">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link href="/categories" className="text-gray-500 hover:text-primary-600">Categories</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">{currentCategory?.name || 'Products'}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="lg:w-64 shrink-0">
            <Card className="sticky top-4">
              <CardContent className="p-4">
                <h3 className="font-bold mb-4">Filters</h3>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Categories</h4>
                  <div className="space-y-2">
                    {categories.slice(0, 8).map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/category/${cat.slug}`}
                        className={`flex items-center justify-between py-1 text-sm ${
                          cat.slug === slug ? 'text-primary-600 font-medium' : 'text-gray-600 hover:text-primary-600'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {cat.icon && <span>{cat.icon}</span>}
                          {cat.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Price Range</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      className="w-20 text-sm"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      className="w-20 text-sm"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-primary-600" />
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="text-sm text-gray-500 ml-1">& up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {currentCategory?.icon && <span className="text-3xl">{currentCategory.icon}</span>}
                    {currentCategory?.name || 'Products'}
                  </h1>
                  <p className="text-gray-500">{filteredProducts.length} products found</p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      className="pl-9 w-48"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                    aria-label="Sort products"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {/* View Mode */}
                  <div className="flex border rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                      aria-label="Grid view"
                    >
                      <Grid className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                      aria-label="List view"
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-32 w-full mb-3" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
                {filteredProducts.map((product) => (
                  viewMode === 'grid' ? (
                    <Card key={product._id} className="group hover:shadow-lg transition-shadow">
                      <Link href={`/product/${product._id}`}>
                        <CardContent className="p-4">
                          {/* Discount Badge */}
                          {product.discountPrice && product.discountPrice < product.price && (
                            <Badge variant="success" className="absolute top-2 left-2">
                              {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                            </Badge>
                          )}
                          
                          {/* Product Image */}
                          <div className="text-center mb-3 h-32 flex items-center justify-center">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={120}
                                height={120}
                                className="object-cover rounded"
                              />
                            ) : (
                              <span className="text-6xl">{product.isVeg ? '🥬' : '🍗'}</span>
                            )}
                          </div>

                          {/* Product Info */}
                          <p className="text-xs text-gray-500 mb-1">{product.vendor?.storeName || 'Vendor'}</p>
                          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                          <p className="text-xs text-gray-500 mb-2">{product.unit}</p>

                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600">{product.averageRating || 0}</span>
                            <span className="text-xs text-gray-400">({product.totalRatings || 0})</span>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold text-gray-900">{formatPrice(product.discountPrice || product.price)}</span>
                            {product.discountPrice && product.discountPrice < product.price && (
                              <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
                            )}
                          </div>
                        </CardContent>
                      </Link>

                      {/* Add Button */}
                      <div className="px-4 pb-4">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product);
                          }}
                          disabled={!product.isAvailable}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {product.isAvailable ? 'Add' : 'Out of Stock'}
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card key={product._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 flex items-center gap-4">
                        <Link href={`/product/${product._id}`} className="shrink-0">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={80}
                              height={80}
                              className="object-cover rounded"
                            />
                          ) : (
                            <span className="text-5xl">{product.isVeg ? '🥬' : '🍗'}</span>
                          )}
                        </Link>
                        <div className="flex-1">
                          <Link href={`/product/${product._id}`}>
                            <p className="text-xs text-gray-500 mb-1">{product.vendor?.storeName || 'Vendor'}</p>
                            <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                            <p className="text-xs text-gray-500 mb-2">{product.unit}</p>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600">{product.averageRating || 0}</span>
                              <span className="text-xs text-gray-400">({product.totalRatings || 0} reviews)</span>
                            </div>
                          </Link>
                        </div>
                        <div className="text-right">
                          <div className="mb-2">
                            <span className="font-bold text-lg">{formatPrice(product.discountPrice || product.price)}</span>
                            {product.discountPrice && product.discountPrice < product.price && (
                              <span className="text-sm text-gray-400 line-through ml-2">{formatPrice(product.price)}</span>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleAddToCart(product)}
                            disabled={!product.isAvailable}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {product.isAvailable ? 'Add' : 'Out of Stock'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <span className="text-6xl mb-4 block">🔍</span>
                  <h3 className="font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search query</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
