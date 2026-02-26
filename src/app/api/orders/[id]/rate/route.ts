import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocRecord = Record<string, any>;

// Helper to find an order by UUID or order_number
async function findOrder(db: FirebaseFirestore.Firestore, id: string): Promise<DocRecord | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    const doc = await db.collection(Collections.ORDERS).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } else {
    const snap = await db.collection(Collections.ORDERS)
      .where('order_number', '==', id)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }
}

// POST /api/orders/[id]/rate - Rate an order (product + delivery)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const body = await request.json();
    const { productRating, deliveryRating, productFeedback, deliveryFeedback } = body;

    // Validate
    if (!productRating && !deliveryRating) {
      return NextResponse.json({ success: false, error: 'At least one rating is required' }, { status: 400 });
    }

    // Find order
    const order = await findOrder(db, id);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Must be the customer who placed this order
    if (order.customer_id !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Not your order' }, { status: 403 });
    }

    // Must be delivered
    if (order.status !== 'delivered') {
      return NextResponse.json({ success: false, error: 'Can only rate delivered orders' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Save order-level rating
    const orderUpdate: Record<string, unknown> = { updated_at: now };
    if (productRating) {
      orderUpdate.rating = Math.min(5, Math.max(1, Math.round(productRating)));
      orderUpdate.review = productFeedback || '';
    }

    if (Object.keys(orderUpdate).length > 1) { // more than just updated_at
      await db.collection(Collections.ORDERS).doc(order.id).update(orderUpdate);
    }

    // Save product reviews for each item in the order
    if (productRating) {
      const items = order.items as DocRecord[];
      for (const item of items) {
        const productId = (item.productId || item.product) as string;
        if (!productId) continue;

        // Upsert review: query by user_id + product_id
        const existingSnap = await db.collection(Collections.REVIEWS)
          .where('user_id', '==', session.user.id)
          .where('product_id', '==', productId)
          .limit(1)
          .get();

        if (!existingSnap.empty) {
          const existingDoc = existingSnap.docs[0];
          await db.collection(Collections.REVIEWS).doc(existingDoc.id).update({
            rating: productRating,
            comment: productFeedback || '',
            updated_at: now,
          });
        } else {
          const reviewId = generateId();
          await db.collection(Collections.REVIEWS).doc(reviewId).set({
            user_id: session.user.id,
            product_id: productId,
            vendor_id: order.vendor_id,
            order_id: order.id,
            rating: productRating,
            comment: productFeedback || '',
            created_at: now,
            updated_at: now,
          });
        }

        // Update product average rating
        const productReviewsSnap = await db.collection(Collections.REVIEWS)
          .where('product_id', '==', productId)
          .get();

        if (!productReviewsSnap.empty) {
          const ratings = productReviewsSnap.docs.map(d => d.data().rating as number);
          const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
          await db.collection(Collections.PRODUCTS).doc(productId).update({
            average_rating: Math.round(avg * 10) / 10,
            total_ratings: ratings.length,
            updated_at: now,
          });
        }
      }

      // Update vendor average rating
      if (order.vendor_id) {
        const vendorReviewsSnap = await db.collection(Collections.REVIEWS)
          .where('vendor_id', '==', order.vendor_id)
          .get();

        if (!vendorReviewsSnap.empty) {
          const ratings = vendorReviewsSnap.docs.map(d => d.data().rating as number);
          const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
          await db.collection(Collections.VENDORS).doc(order.vendor_id).update({
            average_rating: Math.round(avg * 10) / 10,
            total_ratings: ratings.length,
            updated_at: now,
          });
        }
      }
    }

    // Save delivery rating (stored in order doc)
    if (deliveryRating && order.delivery_partner_id) {
      await db.collection(Collections.ORDERS).doc(order.id).update({
        delivery_rating: Math.min(5, Math.max(1, Math.round(deliveryRating))),
        delivery_feedback: deliveryFeedback || '',
        updated_at: now,
      });
    }

    return NextResponse.json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit rating' }, { status: 500 });
  }
}
