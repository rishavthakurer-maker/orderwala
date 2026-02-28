import { Header, Footer, BottomNav } from '@/components/layout';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Refund Policy</h1>
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6 text-gray-600 text-sm leading-relaxed">
          <p className="text-xs text-gray-400">Last updated: February 2026</p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Eligibility for Refund</h2>
            <p>Refunds may be provided in the following cases:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Order cancelled before vendor confirmation</li>
              <li>Wrong items delivered</li>
              <li>Missing items from the order</li>
              <li>Damaged or spoiled products received</li>
              <li>Order not delivered within a reasonable time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. How to Request a Refund</h2>
            <p>To request a refund, go to your order details page and contact our support team, or email us at <a href="mailto:support@orderwala.in" className="text-green-600 hover:underline">support@orderwala.in</a> with your order ID and description of the issue. Include photos if applicable.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Refund Timeline</h2>
            <p>Refund requests are reviewed within 24-48 hours. Approved refunds will be processed as follows:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong>Online payments:</strong> Refunded to the original payment method within 5-7 business days</li>
              <li><strong>Cash on delivery:</strong> Credited to your Orderवाला wallet for future use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Non-Refundable Cases</h2>
            <p>Refunds will not be provided for:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Change of mind after delivery</li>
              <li>Incorrect address provided by the customer</li>
              <li>Customer unavailable for delivery after multiple attempts</li>
              <li>Orders cancelled after vendor has started preparation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Partial Refunds</h2>
            <p>If only some items in your order are affected, a partial refund will be issued for those specific items only.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Contact</h2>
            <p>For refund-related queries, email <a href="mailto:support@orderwala.in" className="text-green-600 hover:underline">support@orderwala.in</a> or call +91 98765 43210.</p>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
