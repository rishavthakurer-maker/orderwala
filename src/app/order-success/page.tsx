'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, MapPin, Clock, Phone, ArrowRight } from 'lucide-react';
import { Card, CardContent, Button, Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

interface OrderData {
  orderId: string;
  status: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  deliveryAddress?: { address?: string; city?: string; state?: string; pincode?: string };
  paymentMethod: string;
  createdAt: string;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setIsLoading(false); return; }
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const displayId = order?.orderId || orderId;
  const itemCount = order?.items?.length || 0;
  const total = order?.total || 0;
  const address = order?.deliveryAddress ? `${order.deliveryAddress.address || ''}${order.deliveryAddress.city ? ', ' + order.deliveryAddress.city : ''}${order.deliveryAddress.state ? ', ' + order.deliveryAddress.state : ''}${order.deliveryAddress.pincode ? ' - ' + order.deliveryAddress.pincode : ''}` : '';
  const payment = order?.paymentMethod || 'Cash on Delivery';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-24 w-24 bg-green-100 rounded-full mb-4 animate-bounce">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-500">Thank you for ordering with Order Wala</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="text-xl font-bold text-primary-600">{displayId}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center"><Package className="h-5 w-5 text-blue-600" /></div>
              <div><p className="font-medium">Order Confirmed</p><p className="text-sm text-gray-500">Your order is being prepared</p></div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center"><Clock className="h-5 w-5 text-orange-600" /></div>
              <div><p className="font-medium">Estimated Delivery</p><p className="text-sm text-gray-500">30-45 mins</p></div>
            </div>

            {address && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center"><MapPin className="h-5 w-5 text-green-600" /></div>
                <div><p className="font-medium">Delivering to</p><p className="text-sm text-gray-500 line-clamp-2">{address}</p></div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500">{itemCount} items</span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>
              <p className="text-sm text-gray-500">Payment: {payment}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Link href={`/orders/${displayId}`} className="block">
            <Button className="w-full" size="lg">Track Your Order<ArrowRight className="h-5 w-5 ml-2" /></Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full" size="lg">Continue Shopping</Button>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">Need help with your order?</p>
          <a href="tel:+911234567890" className="inline-flex items-center gap-2 text-primary-600 hover:underline">
            <Phone className="h-4 w-4" />Call Support
          </a>
        </div>

        <Card className="mt-6">
          <CardContent className="p-4">
            <p className="font-medium mb-3 text-sm">Order Status</p>
            <div className="relative">
              {[
                { label: 'Order Placed', time: 'Just now', completed: true },
                { label: 'Order Confirmed', time: 'In a moment', completed: true },
                { label: 'Preparing', time: '5-10 mins', completed: false },
                { label: 'Out for Delivery', time: '15-20 mins', completed: false },
                { label: 'Delivered', time: '30-45 mins', completed: false },
              ].map((step, index, arr) => (
                <div key={step.label} className="flex items-start gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`} />
                    {index < arr.length - 1 && <div className={`w-0.5 h-8 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>{step.label}</p>
                    <p className="text-xs text-gray-400">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderSuccessContent />
    </Suspense>
  );
}