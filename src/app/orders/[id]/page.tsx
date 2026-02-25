'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Package, MapPin, Phone, Clock, CheckCircle, Truck, ShoppingBag, Star, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Modal, Skeleton } from '@/components/ui';
import { Header, Footer, BottomNav } from '@/components/layout';
import { formatPrice, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderItem {
  name: string;
  quantity: number;
  unit?: string;
  price: number;
  image?: string;
}

interface OrderData {
  _id: string;
  orderId: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  paymentMethod: string;
  deliveryAddress?: {
    type?: string;
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  vendor?: {
    _id: string;
    storeName: string;
    phone?: string;
    address?: string;
  };
  deliveryPartner?: {
    _id: string;
    name: string;
    phone?: string;
  };
  timeline?: { status: string; timestamp: string; note?: string }[];
  rating?: number | null;
  review?: string | null;
  deliveryRating?: number | null;
  deliveryFeedback?: string | null;
  createdAt: string;
}

const statusMessages: Record<string, string> = {
  pending: 'Your order has been placed',
  confirmed: 'Vendor has confirmed your order',
  preparing: 'Your order is being prepared',
  ready: 'Your order is ready for pickup',
  picked_up: 'Delivery partner has picked up your order',
  on_the_way: 'Your order is on the way!',
  delivered: 'Your order has been delivered',
  cancelled: 'Your order has been cancelled',
};

const statusOrder = ['pending', 'confirmed', 'preparing', 'picked_up', 'on_the_way', 'delivered'];

export default function OrderTrackingPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [productRating, setProductRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [productFeedback, setProductFeedback] = useState('');
  const [deliveryFeedback, setDeliveryFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (productRating === 0 && deliveryRating === 0) return;
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/orders/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productRating: productRating || undefined,
          deliveryRating: deliveryRating || undefined,
          productFeedback,
          deliveryFeedback,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Thank you for your feedback!');
        setShowRatingModal(false);
        setProductRating(0);
        setDeliveryRating(0);
        setProductFeedback('');
        setDeliveryFeedback('');
      } else {
        toast.error(data.error || 'Failed to submit rating');
      }
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
        <Footer /><BottomNav />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Order Not Found</h1>
          <p className="text-gray-500 mb-6">We couldn&apos;t find this order</p>
          <Link href="/"><Button>Go Home</Button></Link>
        </div>
        <Footer /><BottomNav />
      </div>
    );
  }

  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const currentStatusIndex = statusOrder.indexOf(order.status);

  const timelineSteps = statusOrder.map((s, idx) => {
    const historyEntry = order.timeline?.find(t => t.status === s);
    const completed = idx <= currentStatusIndex;
    const isCurrent = s === order.status;
    return {
      status: s,
      label: statusMessages[s] || s,
      time: historyEntry ? new Date(historyEntry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
      completed,
      current: isCurrent,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Order #{order.orderId}</h1>
              <p className="text-sm text-gray-500">Placed on {formatDateTime(new Date(order.createdAt))}</p>
            </div>
            <Badge variant={isDelivered ? 'success' : isCancelled ? 'danger' : 'info'} className="capitalize">
              {order.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Live Status Banner */}
        <Card className={`${isDelivered ? 'bg-green-50 border-green-200' : isCancelled ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDelivered ? 'bg-green-100' : isCancelled ? 'bg-red-100' : 'bg-blue-100'}`}>
                {isDelivered ? <CheckCircle className="h-6 w-6 text-green-600" /> : isCancelled ? <Package className="h-6 w-6 text-red-600" /> : <Truck className="h-6 w-6 text-blue-600 animate-pulse" />}
              </div>
              <div className="flex-1">
                <p className={`font-bold ${isDelivered ? 'text-green-700' : isCancelled ? 'text-red-700' : 'text-blue-700'}`}>
                  {statusMessages[order.status] || order.status}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Partner Info */}
        {order.deliveryPartner && ['picked_up', 'on_the_way', 'delivered'].includes(order.status) && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-xl"></span></div>
                  <div>
                    <p className="font-medium">{order.deliveryPartner.name}</p>
                    <p className="text-sm text-gray-500">Delivery Partner</p>
                  </div>
                </div>
                {order.deliveryPartner.phone && (
                  <a href={`tel:${order.deliveryPartner.phone}`} title="Call delivery partner"><Button variant="outline" size="sm"><Phone className="h-4 w-4" /></Button></a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Timeline */}
        {!isCancelled && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Order Status</CardTitle></CardHeader>
            <CardContent>
              <div className="relative">
                {timelineSteps.map((step, index, arr) => (
                  <div key={step.status} className="flex items-start gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step.completed ? step.current ? 'bg-blue-500 animate-pulse' : 'bg-green-500' : 'bg-gray-200'}`}>
                        {step.completed ? (step.current ? <Truck className="h-4 w-4 text-white" /> : <CheckCircle className="h-4 w-4 text-white" />) : <div className="h-2 w-2 bg-gray-400 rounded-full" />}
                      </div>
                      {index < arr.length - 1 && <div className={`w-0.5 h-full min-h-6 ${step.completed && !step.current ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className={`font-medium ${step.completed ? step.current ? 'text-blue-600' : 'text-green-600' : 'text-gray-400'}`}>{step.label}</p>
                      {step.time && <p className="text-sm text-gray-500">{step.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Placeholder */}
        {!isDelivered && !isCancelled && (
          <Card className="overflow-hidden">
            <div className="h-48 bg-linear-to-br from-blue-100 to-green-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-10 w-10 text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Live Tracking</p>
                <p className="text-sm text-gray-500">Map integration coming soon</p>
              </div>
            </div>
          </Card>
        )}

        {/* Order Items */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" />Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b last:border-0">
                  {item.image ? <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" /> : <span className="text-2xl"></span>}
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.unit || ''} x {item.quantity}</p>
                  </div>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Item Total</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Delivery Fee</span><span className={order.deliveryCharge === 0 ? 'text-green-600' : ''}>{order.deliveryCharge === 0 ? 'FREE' : formatPrice(order.deliveryCharge)}</span></div>
              {order.discount > 0 && <div className="flex items-center justify-between text-sm text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
              <div className="flex items-center justify-between font-bold pt-2 border-t"><span>Total</span><span>{formatPrice(order.total)}</span></div>
              <p className="text-sm text-gray-500">Payment: {order.paymentMethod}</p>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Delivery Address</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0"><MapPin className="h-5 w-5 text-green-600" /></div>
                <div>
                  {order.deliveryAddress.type && <Badge variant="secondary" className="mb-1">{order.deliveryAddress.type}</Badge>}
                  <p className="font-medium">{order.deliveryAddress.name}</p>
                  <p className="text-gray-600 text-sm">{order.deliveryAddress.address}</p>
                  <p className="text-gray-600 text-sm">{order.deliveryAddress.city}{order.deliveryAddress.state ? `, ${order.deliveryAddress.state}` : ''}{order.deliveryAddress.pincode ? ` - ${order.deliveryAddress.pincode}` : ''}</p>
                  {order.deliveryAddress.phone && <p className="text-gray-500 text-sm mt-1">{order.deliveryAddress.phone}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {isDelivered ? (
            <>
              {order.rating ? (
                <Button className="flex-1" variant="outline" disabled><Star className="h-4 w-4 mr-2 text-yellow-400 fill-current" />Rated {order.rating}/5</Button>
              ) : (
                <Button className="flex-1" onClick={() => setShowRatingModal(true)}><Star className="h-4 w-4 mr-2" />Rate Order</Button>
              )}
              <Link href="/" className="flex-1"><Button variant="outline" className="w-full">Continue Shopping</Button></Link>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={() => setShowContactModal(true)}>Need Help?</Button>
              <Link href="/" className="flex-1"><Button className="w-full">Continue Shopping</Button></Link>
            </>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      <Modal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} title="Rate Your Order">
        <div className="space-y-6">
          {/* Product Rating */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Rate Products</h4>
            <div className="flex items-center justify-center gap-2 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} title={`Rate products ${star} star${star > 1 ? 's' : ''}`} onClick={() => setProductRating(star)} className="p-1">
                  <Star className={`h-8 w-8 ${star <= productRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center mb-2">{productRating === 5 ? 'Excellent!' : productRating === 4 ? 'Good' : productRating === 3 ? 'Average' : productRating > 0 ? 'Poor' : 'Tap to rate'}</p>
            <textarea title="Product feedback" className="w-full px-3 py-2 border rounded-lg resize-none text-sm" rows={2} placeholder="Share your experience with the products..." value={productFeedback} onChange={(e) => setProductFeedback(e.target.value)} />
          </div>

          {/* Delivery Rating */}
          {order.deliveryPartner && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Truck className="h-4 w-4" />Rate Delivery</h4>
              <p className="text-xs text-gray-500 mb-2 text-center">Delivery by {order.deliveryPartner.name}</p>
              <div className="flex items-center justify-center gap-2 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} title={`Rate delivery ${star} star${star > 1 ? 's' : ''}`} onClick={() => setDeliveryRating(star)} className="p-1">
                    <Star className={`h-8 w-8 ${star <= deliveryRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center mb-2">{deliveryRating === 5 ? 'Excellent!' : deliveryRating === 4 ? 'Good' : deliveryRating === 3 ? 'Average' : deliveryRating > 0 ? 'Poor' : 'Tap to rate'}</p>
              <textarea title="Delivery feedback" className="w-full px-3 py-2 border rounded-lg resize-none text-sm" rows={2} placeholder="How was the delivery experience?" value={deliveryFeedback} onChange={(e) => setDeliveryFeedback(e.target.value)} />
            </div>
          )}

          <Button className="w-full" disabled={(productRating === 0 && deliveryRating === 0) || submittingRating} onClick={handleSubmitRating}>
            {submittingRating ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </Modal>

      {/* Contact Modal */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="Contact">
        <div className="space-y-4">
          {order.deliveryPartner?.phone && (
            <a href={`tel:${order.deliveryPartner.phone}`} className="w-full p-4 border rounded-lg flex items-center gap-3 hover:bg-gray-50">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center"><Phone className="h-5 w-5 text-blue-600" /></div>
              <div className="text-left"><p className="font-medium">Call Delivery Partner</p><p className="text-sm text-gray-500">{order.deliveryPartner.phone}</p></div>
            </a>
          )}
          {order.vendor?.phone && (
            <a href={`tel:${order.vendor.phone}`} className="w-full p-4 border rounded-lg flex items-center gap-3 hover:bg-gray-50">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center"><Phone className="h-5 w-5 text-green-600" /></div>
              <div className="text-left"><p className="font-medium">Call Vendor</p><p className="text-sm text-gray-500">{order.vendor.phone}</p></div>
            </a>
          )}
          <button className="w-full p-4 border rounded-lg flex items-center gap-3 hover:bg-gray-50">
            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center"><MessageSquare className="h-5 w-5 text-orange-600" /></div>
            <div className="text-left"><p className="font-medium">Chat with Support</p><p className="text-sm text-gray-500">Get help with your order</p></div>
          </button>
        </div>
      </Modal>

      <Footer />
      <BottomNav />
    </div>
  );
}