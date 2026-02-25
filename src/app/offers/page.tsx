'use client';

import { useState, useEffect } from 'react';
import { Tag, Clock, ShoppingCart, Copy, Check, Percent, IndianRupee } from 'lucide-react';
import { Card, CardContent, Badge, Button, Skeleton } from '@/components/ui';
import { Header, Footer, BottomNav } from '@/components/layout';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Offer {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  validFrom: string | null;
  validUntil: string | null;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await fetch('/api/offers');
        const data = await res.json();
        if (data.success && data.data) {
          setOffers(data.data);
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Code "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.discountType === 'percentage') {
      return `${offer.discountValue}% OFF`;
    }
    return `${formatPrice(offer.discountValue)} OFF`;
  };

  const formatExpiry = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-8">
        {/* Hero Banner */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-green-700 p-6 lg:p-10 text-white">
          <div className="relative z-10">
            <h1 className="text-2xl lg:text-4xl font-bold mb-2">Offers & Coupons</h1>
            <p className="text-green-100 text-sm lg:text-base max-w-lg">
              Save big on your orders! Apply these exclusive promo codes at checkout.
            </p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
            <Tag className="h-32 w-32 lg:h-48 lg:w-48" />
          </div>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-24 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Active Offers</h2>
            <p className="text-gray-500 mb-6">Check back later for exciting deals and discounts!</p>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Discount Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {offer.discountType === 'percentage' ? (
                        <Percent className="h-6 w-6" />
                      ) : (
                        <IndianRupee className="h-6 w-6" />
                      )}
                      <span className="text-2xl font-bold">{formatDiscount(offer)}</span>
                    </div>
                    {offer.maxDiscount && offer.discountType === 'percentage' && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        Up to {formatPrice(offer.maxDiscount)}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-5">
                  {/* Description */}
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {offer.description || 'Use this code to get a discount on your order!'}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {offer.minOrderAmount && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Min. order: {formatPrice(offer.minOrderAmount)}</span>
                      </div>
                    )}
                    {offer.validUntil && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Valid till: {formatExpiry(offer.validUntil)}</span>
                      </div>
                    )}
                  </div>

                  {/* Promo Code + Copy */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border-2 border-dashed border-green-300 bg-green-50 px-4 py-2.5 text-center">
                      <span className="font-mono font-bold text-green-700 tracking-wider text-lg">
                        {offer.code}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCode(offer.code)}
                      className="shrink-0"
                    >
                      {copiedCode === offer.code ? (
                        <><Check className="h-4 w-4 mr-1" /> Copied</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-1" /> Copy</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* How to Use Section */}
        {offers.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How to use a coupon</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { step: '1', title: 'Copy Code', desc: 'Tap the copy button on any coupon above' },
                { step: '2', title: 'Add to Cart', desc: 'Shop and add your favorite items to the cart' },
                { step: '3', title: 'Apply at Checkout', desc: 'Paste the code in the promo field and save!' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 p-4 bg-white rounded-xl border">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
