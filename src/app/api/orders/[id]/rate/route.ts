import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

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

    const supabase = createAdminSupabaseClient();
    const body = await request.json();
    const { productRating, deliveryRating, productFeedback, deliveryFeedback } = body;

    // Validate
    if (!productRating && !deliveryRating) {
      return NextResponse.json({ success: false, error: 'At least one rating is required' }, { status: 400 });
    }

    // Find order
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let findQuery = supabase.from('orders').select('*');
    if (uuidRegex.test(id)) {
      findQuery = findQuery.eq('id', id);
    } else {
      findQuery = findQuery.eq('order_number', id);
    }
    const { data: order, error: findErr } = await findQuery.single();

    if (findErr || !order) {
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

    // Save order-level rating
    const orderUpdate: Record<string, unknown> = {};
    if (productRating) {
      orderUpdate.rating = Math.min(5, Math.max(1, Math.round(productRating)));
      orderUpdate.review = productFeedback || '';
    }

    if (Object.keys(orderUpdate).length > 0) {
      await supabase.from('orders').update(orderUpdate).eq('id', order.id);
    }

    // Save product reviews for each item in the order
    if (productRating) {
      const items = order.items as Record<string, unknown>[];
      for (const item of items) {
        const productId = item.productId as string;
        if (!productId) continue;

        // Upsert review
        const { data: existing } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('product_id', productId)
          .single();

        if (existing) {
          await supabase.from('reviews').update({
            rating: productRating,
            comment: productFeedback || '',
          }).eq('id', existing.id);
        } else {
          await supabase.from('reviews').insert({
            user_id: session.user.id,
            product_id: productId,
            vendor_id: order.vendor_id,
            order_id: order.id,
            rating: productRating,
            comment: productFeedback || '',
          });
        }

        // Update product average rating
        const { data: productReviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('product_id', productId);

        if (productReviews && productReviews.length > 0) {
          const avg = productReviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / productReviews.length;
          await supabase.from('products').update({
            average_rating: Math.round(avg * 10) / 10,
            total_ratings: productReviews.length,
          }).eq('id', productId);
        }
      }

      // Update vendor average rating
      if (order.vendor_id) {
        const { data: vendorReviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('vendor_id', order.vendor_id);

        if (vendorReviews && vendorReviews.length > 0) {
          const avg = vendorReviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / vendorReviews.length;
          await supabase.from('vendors').update({
            average_rating: Math.round(avg * 10) / 10,
            total_ratings: vendorReviews.length,
          }).eq('id', order.vendor_id);
        }
      }
    }

    // Save delivery rating (stored in a separate field or notification to delivery partner)
    if (deliveryRating && order.delivery_partner_id) {
      // Store delivery rating in the order for now
      await supabase.from('orders').update({
        delivery_rating: Math.min(5, Math.max(1, Math.round(deliveryRating))),
        delivery_feedback: deliveryFeedback || '',
      }).eq('id', order.id);
    }

    return NextResponse.json({ success: true, message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit rating' }, { status: 500 });
  }
}
