'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronRight, Star, Clock, Truck, Shield, Headphones, Percent } from 'lucide-react';
import { Header, Footer, BottomNav } from '@/components/layout';
import { Button, Card, CategoryCardSkeleton, ProductCardSkeleton, VendorCardSkeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store';
import toast from 'react-hot-toast';

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
  isVeg: boolean;
  vendor?: { _id: string; storeName: string; logo?: string | null };
}

interface Vendor {
  _id: string;
  storeName: string;
  slug: string;
  category: string;
  logo?: string | null;
  averageRating: number;
  deliveryTime?: string;
  description?: string;
}

const banners = [
  { id: '1', title: 'Fresh Vegetables', subtitle: 'Up to 30% Off on farm-fresh produce', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&h=400&fit=crop', color: 'from-green-600 via-green-500 to-emerald-500' },
  { id: '2', title: 'Fresh Groceries', subtitle: 'Free Delivery on your first order', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop', color: 'from-orange-500 via-amber-500 to-yellow-500' },
  { id: '3', title: 'Fresh Meat & Fish', subtitle: 'Premium quality guaranteed', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1200&h=400&fit=crop', color: 'from-red-600 via-rose-500 to-pink-500' },
];

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularVendors, setPopularVendors] = useState<Vendor[]>([]);
  const { addItem } = useCartStore();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [catRes, prodRes, vendorRes] = await Promise.all([
          fetch('/api/categories?isActive=true'),
          fetch('/api/products?limit=12&sortBy=created_at&sortOrder=desc'),
          fetch('/api/vendors?limit=8'),
        ]);

        const catData = await catRes.json();
        const prodData = await prodRes.json();
        const vendorData = await vendorRes.json();

        if (catData.success && catData.data) {
          setCategories(catData.data);
        }
        if (prodData.success && prodData.data?.products) {
          setFeaturedProducts(prodData.data.products);
        }
        if (vendorData.success && vendorData.data?.vendors) {
          setPopularVendors(vendorData.data.vendors.map((v: Record<string, unknown>) => ({
            _id: v._id || v.id,
            storeName: v.storeName || v.store_name,
            slug: v.slug,
            category: v.category,
            logo: v.logo,
            averageRating: v.averageRating || v.average_rating || 0,
            deliveryTime: v.deliveryTime || '25-35 min',
            description: v.description,
          })));
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product._id,
      vendorId: product.vendor?._id || '',
      name: product.name,
      image: product.images?.[0] || '',
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: 1,
      unit: product.unit,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero Banner */}
        <section className="relative overflow-hidden">
          <div className="relative h-56 md:h-80 lg:h-[420px]">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} opacity-85`} />
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4">
                    <div className="max-w-xl animate-fade-in-up">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white mb-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                        Order Now
                      </span>
                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 text-white leading-tight drop-shadow-lg">
                        {banner.title}
                      </h1>
                      <p className="text-lg md:text-xl mb-6 text-white/90 font-medium">
                        {banner.subtitle}
                      </p>
                      <Link href="/categories">
                        <Button className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl px-8 py-3 font-semibold shadow-xl shadow-black/10 transition-all duration-200 hover:shadow-2xl hover:scale-105">
                          Shop Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBanner(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentBanner ? 'w-6 bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-white py-8 border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors duration-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 shadow-sm">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Fast Delivery</p>
                  <p className="text-xs text-gray-500">Within 30 mins</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors duration-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 shadow-sm">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Quality Assured</p>
                  <p className="text-xs text-gray-500">100% Fresh</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors duration-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-violet-50 shadow-sm">
                  <Percent className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Best Prices</p>
                  <p className="text-xs text-gray-500">Guaranteed</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors duration-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 shadow-sm">
                  <Headphones className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">24/7 Support</p>
                  <p className="text-xs text-gray-500">Always Here</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Shop by Category</h2>
                <p className="text-sm text-gray-500 mt-1">Browse your favorite categories</p>
              </div>
              <Link href="/categories" className="text-green-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all duration-200 bg-green-50 px-4 py-2 rounded-xl hover:bg-green-100">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                {[...Array(8)].map((_, i) => (
                  <CategoryCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-8 gap-5">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category._id}
                    href={`/category/${category.slug}`}
                    className="flex flex-col items-center group"
                  >
                    <div className="relative mb-3 h-18 w-18 md:h-22 md:w-22 overflow-hidden rounded-2xl border-2 border-gray-100 group-hover:border-green-400 group-hover:shadow-lg group-hover:shadow-green-100 transition-all duration-300 group-hover:scale-105">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                          <span className="text-3xl">{category.icon || '🛒'}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs md:text-sm text-center font-semibold text-gray-700 group-hover:text-green-600 transition-colors duration-200">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-10 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Best Sellers</h2>
                <p className="text-sm text-gray-500 mt-1">Most loved products by our customers</p>
              </div>
              <Link href="/categories" className="text-green-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all duration-200 bg-green-50 px-4 py-2 rounded-xl hover:bg-green-100">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                {featuredProducts.slice(0, 12).map((product) => (
                  <div key={product._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 group hover:shadow-lg hover:shadow-green-100/50 hover:-translate-y-1 transition-all duration-300">
                    <Link href={`/product/${product._id}`}>
                      <div className="relative aspect-square overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                            <span className="text-5xl">{product.isVeg ? '🥬' : '🍗'}</span>
                          </div>
                        )}
                        {product.discountPrice && product.discountPrice < product.price && (
                          <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">
                            {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                          </span>
                        )}
                        <span className={`absolute top-2 right-2 h-5 w-5 rounded-md border-2 ${product.isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center bg-white shadow-sm`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${product.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                        </span>
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link href={`/product/${product._id}`}>
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">{product.vendor?.storeName || ''}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium text-gray-600">{product.averageRating || 0}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2.5">
                        <div>
                          {product.discountPrice && product.discountPrice < product.price ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-gray-900">
                                {formatPrice(product.discountPrice)}
                              </span>
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                          )}
                          <p className="text-xs text-gray-400">per {product.unit}</p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-200 hover:scale-110 transition-all duration-200 font-bold"
                          aria-label={`Add ${product.name} to cart`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg">No products available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* Popular Vendors */}
        {popularVendors.length > 0 && (
          <section className="py-10">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Popular Stores</h2>
                  <p className="text-sm text-gray-500 mt-1">Top rated stores near you</p>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[...Array(4)].map((_, i) => (
                    <VendorCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {popularVendors.map((vendor) => (
                    <div key={vendor._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 group cursor-pointer hover:shadow-lg hover:shadow-green-100/50 hover:-translate-y-1 transition-all duration-300">
                      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
                        {vendor.logo ? (
                          <img
                            src={vendor.logo}
                            alt={vendor.storeName}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="text-6xl">🏪</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="text-xs font-medium text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg capitalize">{vendor.category}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                          {vendor.storeName}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                          {vendor.description || vendor.category}
                        </p>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-yellow-700">{vendor.averageRating || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-sm">{vendor.deliveryTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Download App CTA */}
        <section className="py-16 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="text-white text-center md:text-left">
                <span className="inline-block bg-white/20 backdrop-blur-sm text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Coming Soon</span>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
                  Download Our App
                </h2>
                <p className="text-green-100 mb-6 text-lg max-w-md">
                  Get exclusive offers and faster checkout with our mobile app
                </p>
                <div className="flex gap-4 justify-center md:justify-start">
                  <button className="flex items-center gap-3 bg-black/80 backdrop-blur-sm px-5 py-3 rounded-2xl hover:bg-black hover:scale-105 transition-all duration-200 shadow-lg">
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-[10px] leading-none text-gray-300">GET IT ON</p>
                      <p className="text-sm font-bold">Google Play</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 bg-black/80 backdrop-blur-sm px-5 py-3 rounded-2xl hover:bg-black hover:scale-105 transition-all duration-200 shadow-lg">
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-[10px] leading-none text-gray-300">Download on the</p>
                      <p className="text-sm font-bold">App Store</p>
                    </div>
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="w-52 h-52 md:w-64 md:h-64 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
                  <div className="text-7xl animate-float">📱</div>
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400/30 rounded-2xl blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/20 rounded-2xl blur-xl" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
