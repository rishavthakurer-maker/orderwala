import Link from 'next/link';
import { Header, Footer, BottomNav } from '@/components/layout';
import { HelpCircle, MessageCircle, Mail, Phone, FileText, Shield, RotateCcw } from 'lucide-react';

export default function HelpPage() {
  const sections = [
    { icon: HelpCircle, title: 'FAQs', desc: 'Find answers to commonly asked questions', href: '/faq' },
    { icon: MessageCircle, title: 'Contact Us', desc: 'Reach out to our support team', href: '/contact' },
    { icon: FileText, title: 'Terms & Conditions', desc: 'Read our terms of service', href: '/terms' },
    { icon: Shield, title: 'Privacy Policy', desc: 'How we handle your data', href: '/privacy' },
    { icon: RotateCcw, title: 'Refund Policy', desc: 'Learn about our refund process', href: '/refund' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-500 text-sm mb-8">How can we help you today?</p>

        <div className="space-y-3 mb-8">
          {sections.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Direct Contact */}
        <div className="bg-green-50 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Need immediate help?</h2>
          <div className="space-y-3">
            <a href="mailto:support@orderwala.in" className="flex items-center gap-3 text-sm text-gray-700 hover:text-green-600">
              <Mail className="h-4 w-4 text-green-600" />
              support@orderwala.in
            </a>
            <a href="tel:+919876543210" className="flex items-center gap-3 text-sm text-gray-700 hover:text-green-600">
              <Phone className="h-4 w-4 text-green-600" />
              +91 98765 43210
            </a>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
