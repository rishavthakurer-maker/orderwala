'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search as SearchIcon, Star, SlidersHorizontal, X } from 'lucide-react';
import { Header, Footer, BottomNav } from '@/components/layout';
import { Card, Button, ProductCardSkeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store';
import toast from 'react-hot-toast';

interface Product {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  price: number;
  discount_price?: number;
  discountPrice?: number;
  unit: string;
  images: string[];
  average_rating?: number;
  averageRating?: number;
  is_veg?: boolean;
  isVeg?: boolean;
  vendor?: { _id?: string; id?: string; store_name?: string; storeName?: string };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (initialQuery) {
      searchProducts(initialQuery);
    }
  }, [initialQuery]);

  const searchProducts = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      if (data.success && data.data?.products) {
        setProducts(data.data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      searchProducts(query);
    }
  };

  const handleAddToCart = (product: Product) => {
    const id = product._id || product.id || '';
    addItem({
      productId: id,
      vendorId: product.vendor?._id || product.vendor?.id || '',
      name: product.name,
      image: product.images?.[0] || '',
      price: product.price,
      discountPrice: product.discount_price || product.discountPrice,
      quantity: 1,
      unit: product.unit,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, groceries, restaurants..."
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-12 text-base focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              autoFocus
            />
            {query && (
              <button type="button" title="Clear search" onClick={() => { setQuery(''); setProducts([]); setHasSearched(false); }} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
        </form>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : hasSearched && products.length === 0 ? (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No results found</h2>
            <p className="text-gray-500">Try searching with different keywords</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">{products.length} results for &quot;{initialQuery}&quot;</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product) => {
                const id = product._id || product.id || '';
                const salePrice = product.discount_price || product.discountPrice || product.price;
                const isVeg = product.is_veg ?? product.isVeg ?? true;
                const rating = product.average_rating || product.averageRating || 0;
                const vendorName = product.vendor?.store_name || product.vendor?.storeName || '';
                const discount = salePrice < product.price ? Math.round(((product.price - salePrice) / product.price) * 100) : 0;

                return (
                  <Card key={id} className="overflow-hidden group">
                    <Link href={`/product/${id}`}>
                      <div className="relative aspect-square overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <span className="text-5xl">{isVeg ? '🥬' : '🍗'}</span>
                          </div>
                        )}
                        {discount > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">{discount}% OFF</span>}
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link href={`/product/${id}`}>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-green-600">{product.name}</h3>
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">{vendorName}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">{rating}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {salePrice < product.price ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-semibold">{formatPrice(salePrice)}</span>
                              <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
                          )}
                          <p className="text-xs text-gray-500">per {product.unit}</p>
                        </div>
                        <button onClick={() => handleAddToCart(product)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700">+</button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Search for anything</h2>
            <p className="text-gray-500">Find groceries, vegetables, fruits, meat, and more</p>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SearchContent />
    </Suspense>
  );
}
