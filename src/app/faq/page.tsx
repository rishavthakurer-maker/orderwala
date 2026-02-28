'use client';

import { useState } from 'react';
import { Header, Footer, BottomNav } from '@/components/layout';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    category: 'Orders',
    items: [
      { q: 'How do I place an order?', a: 'Browse products from vendors near you, add items to your cart, select a delivery address, and place your order. You can pay via cash on delivery or online payment.' },
      { q: 'Can I cancel my order?', a: 'You can cancel your order before the vendor confirms it. Once confirmed, cancellation may not be possible. Go to your order details page to cancel.' },
      { q: 'How do I track my order?', a: 'Go to your order details page to see real-time status updates. Once your order is picked up, you can see live tracking of the delivery partner on a map.' },
      { q: 'What if I receive wrong or damaged items?', a: 'Contact our support team from the order details page or email support@orderwala.in. We\'ll arrange a refund or replacement.' },
    ],
  },
  {
    category: 'Delivery',
    items: [
      { q: 'What are the delivery charges?', a: 'Delivery is free for orders above ₹199. For smaller orders, a delivery fee of ₹30 applies.' },
      { q: 'How long does delivery take?', a: 'Delivery times vary based on vendor preparation time and distance. Most orders are delivered within 30-60 minutes.' },
      { q: 'Can I schedule a delivery?', a: 'Scheduled delivery is coming soon! Currently, all orders are delivered as soon as possible.' },
    ],
  },
  {
    category: 'Account',
    items: [
      { q: 'How do I create an account?', a: 'Click on "Account" and then "Register". You can sign up with your email/phone or use Google login.' },
      { q: 'I forgot my password. What do I do?', a: 'Click "Forgot Password" on the login page. We\'ll send you an OTP to reset your password.' },
      { q: 'How do I delete my account?', a: 'Go to Account settings and choose "Delete Account". Your data will be permanently removed within 30 days.' },
    ],
  },
  {
    category: 'Vendors & Sellers',
    items: [
      { q: 'How can I sell on Orderवाला?', a: 'Click "Become a Seller" in the footer, fill out the registration form with your store details, and start listing products once approved.' },
      { q: 'What commission does Orderवाला charge?', a: 'Commission rates vary by category. Contact our vendor support team for detailed pricing.' },
      { q: 'How do I become a delivery partner?', a: 'Click "Become a Delivery Partner" in the footer and complete the registration process. You\'ll need a valid ID and a vehicle.' },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="text-sm font-medium text-gray-900 pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-gray-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>
        <div className="space-y-6">
          {faqs.map((section) => (
            <div key={section.category} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="font-semibold text-gray-900">{section.category}</h2>
              </div>
              <div className="px-6">
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
