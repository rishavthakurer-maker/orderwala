'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Heart, Star, Trash2 } from 'lucide-react';
import { Header, Footer, BottomNav } from '@/components/layout';
import { Card, Button, Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store';
import toast from 'react-hot-toast';

interface Favorite {
  id: string;
  product_id: string;
  product?: {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    unit: string;
    images: string[];
    average_rating: number;
    is_veg: boolean;
    vendor_id?: string;
  };
}

export default function FavoritesPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?redirect=/favorites');
      return;
    }
    if (authStatus === 'authenticated') {
      fetchFavorites();
    }
  }, [authStatus, router]);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      if (data.success && data.data) {
        setFavorites(data.data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (productId: string) => {
    try {
      await fetch(`/api/favorites?productId=${productId}`, { method: 'DELETE' });
      setFavorites(prev => prev.filter(f => f.product_id !== productId));
      toast.success('Removed from favorites');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleAddToCart = (fav: Favorite) => {
    if (!fav.product) return;
    addItem({
      productId: fav.product.id,
      vendorId: fav.product.vendor_id || '',
      name: fav.product.name,
      image: fav.product.images?.[0] || '',
      price: fav.product.price,
      discountPrice: fav.product.discount_price,
      quantity: 1,
      unit: fav.product.unit,
    });
    toast.success(`${fav.product.name} added to cart`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">My Favorites</h1>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h2>
            <p className="text-gray-500 mb-6">Start adding products you love!</p>
            <Link href="/"><Button>Browse Products</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {favorites.map((fav) => {
              if (!fav.product) return null;
              const p = fav.product;
              const salePrice = p.discount_price || p.price;
              const discount = p.discount_price && p.discount_price < p.price
                ? Math.round(((p.price - salePrice) / p.price) * 100) : 0;

              return (
                <Card key={fav.id} className="overflow-hidden group relative">
                  <button
                    onClick={() => removeFavorite(fav.product_id)}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50"
                    aria-label="Remove from favorites"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                  <Link href={`/product/${p.id}`}>
                    <div className="relative aspect-square overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                          <span className="text-5xl">{p.is_veg ? '🥬' : '🍗'}</span>
                        </div>
                      )}
                      {discount > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">{discount}% OFF</span>}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/product/${p.id}`}>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-green-600">{p.name}</h3>
                    </Link>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-600">{p.average_rating || 0}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {discount > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold">{formatPrice(salePrice)}</span>
                            <span className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold">{formatPrice(p.price)}</span>
                        )}
                        <p className="text-xs text-gray-500">per {p.unit}</p>
                      </div>
                      <button onClick={() => handleAddToCart(fav)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700">+</button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
