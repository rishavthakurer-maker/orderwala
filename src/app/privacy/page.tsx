import { Header, Footer, BottomNav } from '@/components/layout';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm space-y-6 text-gray-600 text-sm leading-relaxed">
          <p className="text-xs text-gray-400">Last updated: February 2026</p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
            <p>We collect information you provide when creating an account, placing orders, or contacting us. This includes your name, email, phone number, delivery addresses, and payment information. We also collect device information, location data (with your permission), and usage analytics.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
            <p>We use your information to process orders, deliver products, communicate updates, improve our services, and personalize your experience. Location data is used to show nearby vendors and enable live delivery tracking.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Information Sharing</h2>
            <p>We share your delivery address and phone number with vendors and delivery partners only for order fulfillment. We do not sell your personal data to third parties. We may share data with service providers who help us operate our platform.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information. Passwords are encrypted and payment data is processed securely. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Cookies & Tracking</h2>
            <p>We use cookies and similar technologies to maintain your session, remember preferences, and analyze usage patterns. You can disable cookies in your browser settings, but some features may not work properly.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Your Rights</h2>
            <p>You can access, update, or delete your account information at any time from your account settings. You can also request a copy of your data or ask us to delete your account by contacting us at support@orderwala.in.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Contact</h2>
            <p>For privacy-related concerns, email us at <a href="mailto:support@orderwala.in" className="text-orange-600 hover:underline">support@orderwala.in</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
