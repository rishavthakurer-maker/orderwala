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
  { id: '1', title: 'Fresh Vegetables', subtitle: 'Up to 30% Off', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&h=400&fit=crop', color: 'from-green-500 to-green-600' },
  { id: '2', title: 'Fresh Groceries', subtitle: 'Free Delivery on First Order', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop', color: 'from-orange-500 to-yellow-500' },
  { id: '3', title: 'Fresh Meat & Fish', subtitle: 'Quality Guaranteed', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1200&h=400&fit=crop', color: 'from-red-500 to-pink-500' },
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
          <div className="relative h-50 md:h-75 lg:h-100">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentBanner ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className={`absolute inset-0 bg-linear-to-r ${banner.color} opacity-90`} />
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4">
                    <div className="max-w-lg text-white">
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                        {banner.title}
                      </h1>
                      <p className="text-lg md:text-xl mb-4 opacity-90">
                        {banner.subtitle}
                      </p>
                      <Link href="/categories">
                        <Button className="bg-white text-gray-900 hover:bg-gray-100">
                          Order Now
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
        <section className="bg-white py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Fast Delivery</p>
                  <p className="text-xs text-gray-500">Within 30 mins</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Quality Assured</p>
                  <p className="text-xs text-gray-500">100% Fresh</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Percent className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Best Prices</p>
                  <p className="text-xs text-gray-500">Guaranteed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <Headphones className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">24/7 Support</p>
                  <p className="text-xs text-gray-500">Always Here</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold">Shop by Category</h2>
              <Link href="/categories" className="text-green-600 text-sm font-medium flex items-center gap-1 hover:underline">
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
              <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category._id}
                    href={`/category/${category.slug}`}
                    className="flex flex-col items-center group"
                  >
                    <div className="relative mb-2 h-16 w-16 md:h-20 md:w-20 overflow-hidden rounded-full border-2 border-transparent group-hover:border-green-500 transition-all">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="h-full w-full bg-green-100 flex items-center justify-center">
                          <span className="text-2xl">{category.icon || '🛒'}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs md:text-sm text-center font-medium text-gray-700 group-hover:text-green-600">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold">Best Sellers</h2>
              <Link href="/categories" className="text-green-600 text-sm font-medium flex items-center gap-1 hover:underline">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {featuredProducts.slice(0, 12).map((product) => (
                  <Card key={product._id} className="overflow-hidden group">
                    <Link href={`/product/${product._id}`}>
                      <div className="relative aspect-square overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <span className="text-5xl">{product.isVeg ? '🥬' : '🍗'}</span>
                          </div>
                        )}
                        {product.discountPrice && product.discountPrice < product.price && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">
                            {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                          </span>
                        )}
                        <span className={`absolute top-2 right-2 h-4 w-4 rounded-sm border ${product.isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center bg-white`}>
                          <span className={`h-2 w-2 rounded-full ${product.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                        </span>
                      </div>
                    </Link>
                    <div className="p-3">
                      <Link href={`/product/${product._id}`}>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-green-600">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">{product.vendor?.storeName || ''}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">{product.averageRating || 0}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {product.discountPrice && product.discountPrice < product.price ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPrice(product.discountPrice)}
                              </span>
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                          )}
                          <p className="text-xs text-gray-500">per {product.unit}</p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                          aria-label={`Add ${product.name} to cart`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No products available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* Popular Vendors */}
        {popularVendors.length > 0 && (
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold">Popular Stores</h2>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <VendorCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {popularVendors.map((vendor) => (
                    <Card key={vendor._id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-green-100 to-green-50">
                        {vendor.logo ? (
                          <img
                            src={vendor.logo}
                            alt={vendor.storeName}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="text-5xl">🏪</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <span className="text-xs text-white/80 capitalize">{vendor.category}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                          {vendor.storeName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {vendor.description || vendor.category}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{vendor.averageRating || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{vendor.deliveryTime}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Download App CTA */}
        <section className="py-12 bg-linear-to-r from-green-600 to-green-700">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-white text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Download Our App
                </h2>
                <p className="text-green-100 mb-4">
                  Get exclusive offers and faster checkout with our mobile app
                </p>
                <div className="flex gap-4 justify-center md:justify-start">
                  <button className="flex items-center gap-2 bg-black px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-[10px] leading-none">GET IT ON</p>
                      <p className="text-sm font-semibold">Google Play</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-2 bg-black px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-[10px] leading-none">Download on the</p>
                      <p className="text-sm font-semibold">App Store</p>
                    </div>
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="w-48 h-48 md:w-56 md:h-56 bg-white/10 rounded-full flex items-center justify-center">
                  <div className="text-6xl">📱</div>
                </div>
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
