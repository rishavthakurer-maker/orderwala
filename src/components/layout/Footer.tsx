import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-linear-to-b from-gray-900 to-gray-950 text-gray-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-green-500/50 to-transparent" />
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center mb-5">
              <img src="/logo.png" alt="Order Wala" className="h-12 w-auto" />
            </Link>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              Your one-stop destination for fresh groceries, delicious food, and quick delivery at your doorstep.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-xl bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-all duration-200 hover:scale-110" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-xl bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-all duration-200 hover:scale-110" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-xl bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-all duration-200 hover:scale-110" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-xl bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-all duration-200 hover:scale-110" aria-label="Youtube">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/offers" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  Offers & Deals
                </Link>
              </li>
              <li>
                <Link href="/vendor/register" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  Become a Seller
                </Link>
              </li>
              <li>
                <Link href="/delivery/register" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  Become a Delivery Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Help & Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-sm hover:text-green-400 transition-colors flex items-center gap-2 group">
                  <span className="h-1 w-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors" />
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-sm leading-relaxed">
                  123 Main Street, Patna<br />
                  Bihar, India - 800001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-green-400" />
                </div>
                <a href="tel:+919876543210" className="text-sm hover:text-green-400 transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-green-400" />
                </div>
                <a href="mailto:support@orderwala.com" className="text-sm hover:text-green-400 transition-colors">
                  support@orderwala.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800/50 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Order Wala. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Made by <span className="text-green-400 font-medium">KRA Tech Solutions</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
