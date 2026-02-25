'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MapPin, Clock, CreditCard, Wallet, Banknote, ChevronRight, Plus, Tag, Check, ShoppingBag, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Modal } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/map/MapPicker').then(m => ({ default: m.MapPicker })), { ssr: false });
import toast from 'react-hot-toast';

interface Address {
  id: string;
  type: string;
  name: string;
  phone: string;
  address: string;
  address2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

const deliverySlots = [
  { id: '1', label: 'Express', time: '15-30 mins', charge: 0 },
  { id: '2', label: 'Standard', time: '45-60 mins', charge: 0 },
  { id: '3', label: 'Scheduled', time: 'Pick a time', charge: 0 },
];

const paymentMethods = [
  { id: 'cod', name: 'Cash on Delivery', icon: Banknote, description: 'Pay when order arrives' },
  { id: 'upi', name: 'UPI', icon: Wallet, description: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getTotal, clearCart } = useCartStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedSlot, setSelectedSlot] = useState(deliverySlots[0]);
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [newAddress, setNewAddress] = useState({
    type: 'Home', name: '', phone: '', address: '', address2: '', landmark: '', city: '', state: '', pincode: '', isDefault: false, latitude: 0, longitude: 0,
  });

  useEffect(() => {
    if (!session?.user) {
      router.push('/login?redirect=/checkout');
      return;
    }
    fetchAddresses();
  }, [session, router]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses');
      const data = await res.json();
      if (data.success && data.data) {
        setAddresses(data.data);
        const def = data.data.find((a: Address) => a.isDefault) || data.data[0];
        if (def) setSelectedAddress(def);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const subtotal = getTotal();
  const deliveryCharge = subtotal >= 199 ? 0 : 30;
  const discount = appliedPromo?.discount || 0;
  const total = subtotal + deliveryCharge - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) { toast.error('Please enter a promo code'); return; }
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
    } catch { toast.error('Failed to validate promo code'); }
    finally { setIsApplyingPromo(false); }
  };

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.address || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Address added');
        await fetchAddresses();
        setShowNewAddressForm(false);
        setNewAddress({ type: 'Home', name: '', phone: '', address: '', address2: '', landmark: '', city: '', state: '', pincode: '', isDefault: false, latitude: 0, longitude: 0 });
      } else {
        toast.error(data.error || 'Failed to add address');
      }
    } catch { toast.error('Failed to add address'); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    if (items.length === 0) { toast.error('Cart is empty'); return; }

    setIsProcessing(true);
    try {
      const vendorId = items[0]?.vendorId;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
          vendorId,
          deliveryAddress: {
            type: selectedAddress.type,
            name: selectedAddress.name,
            phone: selectedAddress.phone,
            address: `${selectedAddress.address}${selectedAddress.address2 ? ', ' + selectedAddress.address2 : ''}`,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude,
          },
          paymentMethod: selectedPayment === 'cod' ? 'Cash on Delivery' : selectedPayment === 'upi' ? 'UPI' : 'Card',
          instructions,
          promoCode: appliedPromo?.code,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        clearCart();
        router.push(`/order-success?orderId=${data.data.orderId}`);
      } else {
        toast.error(data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add items to your cart to checkout</p>
            <Link href="/"><Button>Continue Shopping</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Checkout</h1>
            <Link href="/cart" className="text-primary-600 hover:underline text-sm">Edit Cart</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary-600" />Delivery Address</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowAddressModal(true)}>Change</Button>
              </CardHeader>
              <CardContent>
                {selectedAddress ? (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-2">{selectedAddress.type}</Badge>
                        <p className="font-medium">{selectedAddress.name}</p>
                        <p className="text-gray-600 text-sm">{selectedAddress.address}{selectedAddress.address2 ? `, ${selectedAddress.address2}` : ''}</p>
                        <p className="text-gray-600 text-sm">{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
                        <p className="text-gray-600 text-sm mt-1">{selectedAddress.phone}</p>
                      </div>
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setShowAddressModal(true); setShowNewAddressForm(true); }} className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5" />Add Delivery Address
                  </button>
                )}
              </CardContent>
            </Card>

            {/* Delivery Time */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary-600" />Delivery Time</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {deliverySlots.map((slot) => (
                    <button key={slot.id} onClick={() => { setSelectedSlot(slot); if (slot.id === '3') setShowScheduleModal(true); }} className={`p-4 border rounded-lg text-center transition-colors ${selectedSlot.id === slot.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                      <p className="font-medium">{slot.label}</p>
                      <p className="text-sm text-gray-500">{slot.time}</p>
                      {slot.charge === 0 && <Badge variant="success" className="mt-1">Free</Badge>}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary-600" />Payment Method</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map((method) => (
                  <label key={method.id} className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${selectedPayment === method.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                    <input type="radio" name="payment" value={method.id} checked={selectedPayment === method.id} onChange={(e) => setSelectedPayment(e.target.value)} className="text-primary-600" />
                    <method.icon className="h-6 w-6 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    {selectedPayment === method.id && <Check className="h-5 w-5 text-primary-600" />}
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Delivery Instructions */}
            <Card>
              <CardHeader><CardTitle>Delivery Instructions (Optional)</CardTitle></CardHeader>
              <CardContent>
                <Input placeholder="E.g., Ring the doorbell, Leave at door..." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      {item.image ? <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" /> : <span className="text-2xl"></span>}
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.unit} x {item.quantity}</p>
                      </div>
                      <span className="font-medium">{formatPrice((item.discountPrice || item.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Promo code" className="pl-10" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} disabled={!!appliedPromo} />
                    </div>
                    <Button variant={appliedPromo ? 'outline' : 'default'} onClick={appliedPromo ? () => { setAppliedPromo(null); setPromoCode(''); } : handleApplyPromo} disabled={isApplyingPromo}>
                      {isApplyingPromo ? '...' : appliedPromo ? 'Remove' : 'Apply'}
                    </Button>
                  </div>
                  {appliedPromo && <p className="text-sm text-green-600 mt-2">&#10003; Code &quot;{appliedPromo.code}&quot; applied! You save {formatPrice(appliedPromo.discount)}</p>}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Item Total</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Delivery Fee</span><span className={deliveryCharge === 0 ? 'text-green-600' : ''}>{deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}</span></div>
                  {discount > 0 && <div className="flex items-center justify-between text-sm text-green-600"><span>Promo Discount</span><span>-{formatPrice(discount)}</span></div>}
                  <div className="flex items-center justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>{formatPrice(total)}</span></div>
                </div>

                <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={isProcessing || !selectedAddress}>
                  {isProcessing ? 'Processing...' : `Place Order  ${formatPrice(total)}`}
                </Button>
                <p className="text-xs text-gray-500 text-center">By placing this order, you agree to our Terms of Service</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Address Selection Modal */}
      <Modal isOpen={showAddressModal} onClose={() => { setShowAddressModal(false); setShowNewAddressForm(false); }} title="Select Delivery Address">
        <div className="space-y-4">
          {!showNewAddressForm ? (
            <>
              {addresses.map((address) => (
                <label key={address.id} className={`block p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress?.id === address.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="address" checked={selectedAddress?.id === address.id} onChange={() => setSelectedAddress(address)} className="mt-1 text-primary-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{address.type}</Badge>
                        {address.isDefault && <Badge variant="success">Default</Badge>}
                      </div>
                      <p className="font-medium">{address.name}</p>
                      <p className="text-sm text-gray-600">{address.address}{address.address2 ? `, ${address.address2}` : ''}</p>
                      <p className="text-sm text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
                      <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
                    </div>
                  </div>
                </label>
              ))}
              <button onClick={() => setShowNewAddressForm(true)} className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2">
                <Plus className="h-5 w-5" />Add New Address
              </button>
              <Button className="w-full" onClick={() => setShowAddressModal(false)}>Confirm Address</Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map(t => (
                  <button key={t} onClick={() => setNewAddress(p => ({ ...p, type: t }))} className={`px-4 py-2 rounded-lg border ${newAddress.type === t ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>{t}</button>
                ))}
              </div>
              {/* Map Picker for selecting location */}
              <MapPicker
                onLocationSelect={(loc) => {
                  setNewAddress(p => ({
                    ...p,
                    address: loc.address,
                    city: loc.city || p.city,
                    state: loc.state || p.state,
                    pincode: loc.pincode || p.pincode,
                    latitude: loc.lat,
                    longitude: loc.lng,
                  }));
                }}
                height="200px"
              />
              <Input placeholder="Full Name *" value={newAddress.name} onChange={e => setNewAddress(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Phone Number *" value={newAddress.phone} onChange={e => setNewAddress(p => ({ ...p, phone: e.target.value }))} />
              <Input placeholder="Complete Address *" value={newAddress.address} onChange={e => setNewAddress(p => ({ ...p, address: e.target.value }))} />
              <Input placeholder="Apartment, Floor, Landmark" value={newAddress.address2} onChange={e => setNewAddress(p => ({ ...p, address2: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="City *" value={newAddress.city} onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))} />
                <Input placeholder="State *" value={newAddress.state} onChange={e => setNewAddress(p => ({ ...p, state: e.target.value }))} />
              </div>
              <Input placeholder="Pincode *" value={newAddress.pincode} onChange={e => setNewAddress(p => ({ ...p, pincode: e.target.value }))} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={newAddress.isDefault} onChange={e => setNewAddress(p => ({ ...p, isDefault: e.target.checked }))} />
                <span className="text-sm">Set as default address</span>
              </label>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowNewAddressForm(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleAddAddress}>Save Address</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule Delivery">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <Input type="date" min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
            <div className="grid grid-cols-2 gap-2">
              {['9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM', '6:00 PM - 8:00 PM', '8:00 PM - 10:00 PM'].map((slot) => (
                <button key={slot} className="p-3 border rounded-lg text-sm hover:border-primary-500 hover:bg-primary-50">{slot}</button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={() => setShowScheduleModal(false)}>Confirm Schedule</Button>
        </div>
      </Modal>
    </div>
  );
}