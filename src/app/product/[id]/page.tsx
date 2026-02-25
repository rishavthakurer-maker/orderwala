'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Star, Plus, Minus, Heart, Share2, ShieldCheck, Truck, Clock, ChevronRight, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Skeleton, DynamicBar } from '@/components/ui';
import { Header, Footer, BottomNav } from '@/components/layout';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  unit: string;
  images: string[];
  is_veg: boolean;
  average_rating: number;
  total_reviews: number;
  stock: number;
  highlights?: string[];
  nutritional_info?: Record<string, string>;
  category?: { id: string; name: string; slug: string };
  vendor?: { id: string; store_name: string; logo?: string; phone?: string; average_rating?: number };
}

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  discount_price?: number;
  unit: string;
  images: string[];
  is_veg: boolean;
  average_rating: number;
  vendor?: { store_name: string };
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingDist, setRatingDist] = useState<Record<string, number>>({});
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'nutrition' | 'reviews'>('description');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchProduct() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setProduct(data.data);
          if (data.data.category?.id) {
            const relRes = await fetch(`/api/products?category=${data.data.category.id}&limit=4`);
            const relData = await relRes.json();
            if (relData.success && relData.data?.products) {
              setRelatedProducts(relData.data.products.filter((p: RelatedProduct) => p.id !== id));
            }
          }
          const revRes = await fetch(`/api/reviews?productId=${id}`);
          const revData = await revRes.json();
          if (revData.success && revData.data) {
            setReviews(revData.data.reviews || []);
            setRatingDist(revData.data.ratingDistribution || {});
          }
          if (session?.user) {
            const favRes = await fetch('/api/favorites');
            const favData = await favRes.json();
            if (favData.success && favData.data) {
              setIsFavorite(favData.data.some((f: { product_id: string }) => f.product_id === id));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [id, session]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.discount_price || product.price,
      discountPrice: product.discount_price,
      quantity,
      image: product.images?.[0] || '',
      unit: product.unit,
      vendorId: product.vendor?.id || '',
    });
    toast.success(`${product.name} added to cart`);
  };

  const toggleFavorite = async () => {
    if (!session?.user) {
      toast.error('Please login to add favorites');
      return;
    }
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?productId=${id}`, { method: 'DELETE' });
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id }),
        });
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/"><Button>Go Home</Button></Link>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  const mrp = product.price;
  const salePrice = product.discount_price || product.price;
  const discount = product.discount_price && product.discount_price < product.price
    ? Math.round(((mrp - salePrice) / mrp) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-gray-500 hover:text-primary-600">Home</Link></li>
              <li className="text-gray-400">/</li>
              {product.category && (
                <>
                  <li><Link href={`/category/${product.category.slug}`} className="text-gray-500 hover:text-primary-600 capitalize">{product.category.name}</Link></li>
                  <li className="text-gray-400">/</li>
                </>
              )}
              <li className="text-gray-900 font-medium line-clamp-1">{product.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card className="p-8">
              <div className="flex items-center justify-center aspect-square overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[selectedImage]} alt={product.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[200px]">{product.is_veg ? '' : ''}</span>
                )}
              </div>
            </Card>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, index) => (
                  <button key={index} title={`View image ${index + 1}`} onClick={() => setSelectedImage(index)} className={`w-20 h-20 border-2 rounded-lg overflow-hidden ${selectedImage === index ? 'border-primary-500' : 'border-gray-200'}`}>
                    <img src={img} alt={`${product.name} - image ${index + 1}`} className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  {discount > 0 && <Badge variant="success" className="mb-2">{discount}% OFF</Badge>}
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
                  <p className="text-gray-500 mt-1">{product.unit}</p>
                </div>
                <div className="flex gap-2">
                  <button title="Toggle favorite" onClick={toggleFavorite} className={`p-2 rounded-full border ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400'}`}>
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button title="Share" className="p-2 rounded-full border border-gray-200 text-gray-400"><Share2 className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-medium">{product.average_rating || 0}</span>
                </div>
                <span className="text-gray-500">{product.total_reviews || 0} Reviews</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(salePrice)}</span>
              {discount > 0 && (
                <>
                  <span className="text-xl text-gray-400 line-through">{formatPrice(mrp)}</span>
                  <span className="text-green-600 font-medium">Save {formatPrice(mrp - salePrice)}</span>
                </>
              )}
            </div>

            {product.vendor && (
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {product.vendor.logo ? (
                      <img src={product.vendor.logo} alt={product.vendor.store_name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center"><span className="text-xl"></span></div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{product.vendor.store_name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{product.vendor.average_rating || 0}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Card>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <button title="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-100"><Minus className="h-4 w-4" /></button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button title="Increase quantity" onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))} className="p-3 hover:bg-gray-100"><Plus className="h-4 w-4" /></button>
              </div>
              <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={product.stock === 0}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.stock === 0 ? 'Out of Stock' : `Add to Cart  ${formatPrice(salePrice * quantity)}`}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Truck className="h-5 w-5 text-primary-600" />
                <div><p className="text-xs text-gray-500">Delivery</p><p className="text-sm font-medium">15-30 mins</p></div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <div><p className="text-xs text-gray-500">Quality</p><p className="text-sm font-medium">Assured</p></div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-orange-500" />
                <div><p className="text-xs text-gray-500">Return</p><p className="text-sm font-medium">Easy</p></div>
              </div>
            </div>

            {product.highlights && product.highlights.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Highlights</h3>
                <ul className="space-y-2">
                  {product.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="h-1.5 w-1.5 bg-primary-500 rounded-full" />{h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <div className="border-b">
            <nav className="flex gap-8">
              {[
                { id: 'description', label: 'Description' },
                { id: 'nutrition', label: 'Nutritional Info' },
                { id: 'reviews', label: `Reviews (${product.total_reviews || 0})` },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`py-4 border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-600 text-primary-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="py-6">
            {activeTab === 'description' && <div className="prose max-w-none"><p className="text-gray-600">{product.description || 'No description available.'}</p></div>}
            {activeTab === 'nutrition' && (
              <div className="max-w-md">
                {product.nutritional_info && Object.keys(product.nutritional_info).length > 0 ? (
                  <Card><CardHeader><CardTitle>Nutritional Information (per 100g)</CardTitle></CardHeader><CardContent><div className="space-y-3">{Object.entries(product.nutritional_info).map(([key, value]) => (<div key={key} className="flex items-center justify-between py-2 border-b last:border-0"><span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span><span className="font-medium">{value}</span></div>))}</div></CardContent></Card>
                ) : (<p className="text-gray-500">Nutritional info not available.</p>)}
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-gray-900">{product.average_rating || 0}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-5 w-5 ${i < Math.floor(product.average_rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{product.total_reviews || 0} reviews</p>
                  </div>
                  <div className="flex-1">
                    {[5,4,3,2,1].map((star) => {
                      const count = ratingDist[star] || 0;
                      const total = product.total_reviews || 1;
                      const pct = Math.round((count / total) * 100);
                      return (<div key={star} className="flex items-center gap-2 mb-1"><span className="text-sm w-3">{star}</span><Star className="h-4 w-4 text-yellow-400 fill-current" /><div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><DynamicBar className="h-full bg-yellow-400" width={`${pct}%`} /></div><span className="text-xs text-gray-500 w-8">{count}</span></div>);
                    })}
                  </div>
                </div>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}><CardContent className="p-4"><div className="flex items-start justify-between mb-2"><div><p className="font-medium">{review.user_name || 'Anonymous'}</p><div className="flex items-center gap-1 mt-1">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />))}</div></div><span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div><p className="text-gray-600">{review.comment}</p></CardContent></Card>
                    ))}
                  </div>
                ) : (<p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>)}
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Related Products</h2>
              {product.category && <Link href={`/category/${product.category.slug}`} className="text-primary-600 hover:underline">View All</Link>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map((item) => (
                <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                  <Link href={`/product/${item.id}`}>
                    <CardContent className="p-4">
                      <div className="text-center mb-3 aspect-square overflow-hidden flex items-center justify-center">
                        {item.images?.[0] ? (<img src={item.images[0]} alt={item.name} className="max-h-full max-w-full object-contain" />) : (<span className="text-5xl">{item.is_veg ? '' : ''}</span>)}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{item.vendor?.store_name || ''}</p>
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{item.unit}</p>
                      <div className="flex items-center gap-1 mb-2"><Star className="h-3 w-3 text-yellow-400 fill-current" /><span className="text-xs text-gray-600">{item.average_rating || 0}</span></div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatPrice(item.discount_price || item.price)}</span>
                        {item.discount_price && item.discount_price < item.price && <span className="text-sm text-gray-400 line-through">{formatPrice(item.price)}</span>}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}