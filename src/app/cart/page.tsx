'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, ChevronRight } from 'lucide-react';
import { Header, Footer, BottomNav } from '@/components/layout';
import { Button, Card, Input, Modal } from '@/components/ui';
import { useCartStore } from '@/store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const subtotal = getTotal();
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const platformFee = 5;
  const discount = appliedPromo?.discount || 0;
  const total = subtotal + deliveryFee + platformFee - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);
    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderTotal: subtotal }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAppliedPromo({ code: data.data.code, discount: data.data.discount });
        toast.success(`Promo applied! You save ${formatPrice(data.data.discount)}`);
      } else {
        toast.error(data.error || 'Invalid promo code');
      }
    } catch {
      toast.error('Failed to validate promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    toast.success('Promo code removed');
  };

  const handleCheckout = () => {
    // Full page navigation to ensure fresh code (not old cached JS)
    window.location.href = '/checkout';
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-500 mb-6">
              Looks like you haven&apos;t added anything to your cart yet
            </p>
            <Link href="/">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">Cart</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Shopping Cart ({items.length} items)</h1>
          <button
            onClick={() => setShowClearModal(true)}
            className="text-red-600 text-sm hover:underline"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={`${item.productId}-${item.variant}`} className="p-4">
                <div className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        {item.variant && (
                          <p className="text-sm text-gray-500">{item.variant}</p>
                        )}
                        <p className="text-sm text-gray-500">per {item.unit}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.variant)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        {item.discountPrice ? (
                          <>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(item.discountPrice)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(item.price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-gray-900">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                          className="h-8 w-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                          className="h-8 w-8 rounded-lg bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Savings Note */}
            {subtotal < 500 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Add items worth <span className="font-semibold">{formatPrice(500 - subtotal)}</span> more to get <span className="font-semibold">FREE delivery!</span>
                </p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

              {/* Promo Code */}
              <div className="mb-4">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {appliedPromo.code}
                      </span>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyPromo}
                      isLoading={isApplyingPromo}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                    {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-medium">{formatPrice(platformFee)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedPromo.code})</span>
                    <span className="font-medium">-{formatPrice(appliedPromo.discount)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-green-600">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button className="w-full mt-6" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>

              {/* Continue Shopping */}
              <Link href="/">
                <button className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-green-600">
                  <ArrowLeft className="h-4 w-4" />
                  Continue Shopping
                </button>
              </Link>
            </Card>
          </div>
        </div>
      </main>

      {/* Clear Cart Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Cart"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to remove all items from your cart?
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowClearModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                clearCart();
                setShowClearModal(false);
                toast.success('Cart cleared');
              }}
            >
              Clear Cart
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
      <BottomNav />
    </div>
  );
}
