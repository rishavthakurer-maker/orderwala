import { Header, Footer, BottomNav } from '@/components/layout';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Terms & Conditions</h1>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm space-y-6 text-gray-600 text-sm leading-relaxed">
          <p className="text-xs text-gray-400">Last updated: February 2026</p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using Orderवाला (&quot;the Platform&quot;), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Account Registration</h2>
            <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. You must be at least 18 years old to use our services.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Orders & Payments</h2>
            <p>All orders are subject to vendor acceptance and product availability. Prices are set by individual vendors and may change without notice. Payment is due at the time of order placement. We support cash on delivery and online payment methods.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Delivery</h2>
            <p>Delivery times are estimates and may vary based on distance, traffic, and order volume. We are not liable for delays caused by circumstances beyond our control. Delivery charges apply for orders below the free delivery threshold.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Cancellation</h2>
            <p>You may cancel an order before it is confirmed by the vendor. Once confirmed, cancellation may not be possible. Refunds for cancelled orders will be processed as per our Refund Policy.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Vendor Responsibilities</h2>
            <p>Vendors are responsible for the quality, accuracy, and safety of their products. Orderवाला acts as an intermediary and is not liable for product quality issues. Disputes between customers and vendors will be mediated by our support team.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Prohibited Activities</h2>
            <p>You agree not to misuse the platform, create fake accounts, manipulate reviews, abuse promotional offers, or engage in any fraudulent activity. Violation may result in account suspension.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Limitation of Liability</h2>
            <p>Orderवाला is not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount paid for the specific order in question.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:support@orderwala.in" className="text-orange-600 hover:underline">support@orderwala.in</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
