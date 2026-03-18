import { Header, Footer, BottomNav } from '@/components/layout';
import { ShoppingBag, Truck, Users, Heart, MapPin, Clock } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            About <span className="text-orange-600">Order</span><span className="text-yellow-500">वाला</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your one-stop destination for fresh groceries, delicious food, and quick delivery at your doorstep.
            We connect local vendors with customers across Bihar.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            At Orderवाला, we believe everyone deserves access to fresh, quality products delivered quickly
            and affordably. We empower local vendors by giving them a digital storefront and connecting
            them with customers in their area. Our goal is to make everyday shopping effortless while
            supporting local businesses.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            { icon: ShoppingBag, title: 'Wide Selection', desc: 'Groceries, food, essentials — all from local vendors you trust.' },
            { icon: Truck, title: 'Fast Delivery', desc: 'Get your orders delivered in minutes, not hours.' },
            { icon: Users, title: 'Local Vendors', desc: 'Support small businesses and shops in your neighborhood.' },
            { icon: Heart, title: 'Quality Products', desc: 'Fresh and quality-checked products every time.' },
            { icon: MapPin, title: 'Hyperlocal', desc: 'Serving communities across Patna and Bihar.' },
            { icon: Clock, title: 'Convenient', desc: 'Order anytime, from anywhere. We handle the rest.' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl p-5 shadow-sm text-center">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="bg-orange-50 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Have Questions?</h2>
          <p className="text-gray-600 text-sm mb-3">
            Reach out to us anytime. We&apos;d love to hear from you.
          </p>
          <a href="mailto:support@orderwala.in" className="text-orange-600 font-medium hover:underline">
            support@orderwala.in
          </a>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
