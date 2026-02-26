import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrderRecord = Record<string, any>;

// Helper to find an order by UUID or order_number
async function findOrder(db: FirebaseFirestore.Firestore, id: string): Promise<OrderRecord | null> {
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

// GET /api/orders/[id] - Get a single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const order = await findOrder(db, id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch related docs in parallel
    const [customerDoc, vendorDoc, deliveryDoc] = await Promise.all([
      order.customer_id ? db.collection(Collections.USERS).doc(order.customer_id).get() : null,
      order.vendor_id ? db.collection(Collections.VENDORS).doc(order.vendor_id).get() : null,
      order.delivery_partner_id ? db.collection(Collections.USERS).doc(order.delivery_partner_id).get() : null,
    ]);

    const customer = customerDoc?.exists ? { id: customerDoc.id, ...customerDoc.data() } as OrderRecord : null;
    const vendor = vendorDoc?.exists ? { id: vendorDoc.id, ...vendorDoc.data() } as OrderRecord : null;
    const delivery_partner = deliveryDoc?.exists ? { id: deliveryDoc.id, ...deliveryDoc.data() } as OrderRecord : null;

    // Transform response
    const response = {
      _id: order.id,
      orderId: order.order_number,
      customer: customer ? {
        _id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      } : null,
      vendor: vendor ? {
        _id: vendor.id,
        storeName: vendor.store_name,
        phone: vendor.phone,
        address: vendor.address,
      } : null,
      deliveryPartner: delivery_partner ? {
        _id: delivery_partner.id,
        name: delivery_partner.name,
        phone: delivery_partner.phone,
      } : null,
      items: order.items,
      subtotal: order.subtotal,
      deliveryCharge: order.delivery_fee,
      discount: order.discount,
      total: order.total,
      deliveryAddress: order.delivery_address,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      status: order.status,
      instructions: order.delivery_instructions,
      promoCode: order.promo_code,
      timeline: order.status_history,
      confirmedAt: order.confirmed_at,
      preparingAt: order.preparing_at,
      readyAt: order.ready_at,
      pickedUpAt: order.picked_up_at,
      deliveredAt: order.delivered_at,
      cancelledAt: order.cancelled_at,
      cancellationReason: order.cancel_reason,
      rating: order.rating || null,
      review: order.review || null,
      deliveryRating: order.delivery_rating || null,
      deliveryFeedback: order.delivery_feedback || null,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const body = await request.json();
    const { status, deliveryPartner, cancellationReason, note } = body;

    // Find the order
    const order = await findOrder(db, id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['picked_up', 'cancelled'],
      picked_up: ['on_the_way'],
      on_the_way: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (status && !validTransitions[order.status]?.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${order.status} to ${status}` },
        { status: 400 }
      );
    }

    // Build update data
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { updated_at: now };

    if (status) {
      updateData.status = status;

      // Add to status history
      const currentHistory = order.status_history || [];
      updateData.status_history = [
        ...currentHistory,
        {
          status,
          timestamp: now,
          note: note || '',
        },
      ];

      // Set timestamps based on status
      if (status === 'confirmed') updateData.confirmed_at = now;
      if (status === 'preparing') updateData.preparing_at = now;
      if (status === 'ready') updateData.ready_at = now;
      if (status === 'picked_up') updateData.picked_up_at = now;
      if (status === 'delivered') {
        updateData.delivered_at = now;
        updateData.payment_status = 'completed';
      }
      if (status === 'cancelled') {
        updateData.cancelled_at = now;
        updateData.cancel_reason = cancellationReason;
      }
    }

    if (deliveryPartner) {
      updateData.delivery_partner_id = deliveryPartner;
      updateData.assigned_at = now;
    }

    // Update order in Firestore
    await db.collection(Collections.ORDERS).doc(order.id).update(updateData);

    // Create notification
    if (status) {
      const statusMessages: Record<string, string> = {
        confirmed: 'Your order has been confirmed by the vendor',
        preparing: 'Your order is being prepared',
        ready: 'Your order is ready for pickup',
        picked_up: 'Your order has been picked up by delivery partner',
        on_the_way: 'Your order is on the way',
        delivered: 'Your order has been delivered',
        cancelled: 'Your order has been cancelled',
      };

      const notifId = generateId();
      await db.collection(Collections.NOTIFICATIONS).doc(notifId).set({
        user_id: order.customer_id,
        type: 'order',
        title: `Order ${status.replace('_', ' ').toUpperCase()}`,
        message: statusMessages[status],
        data: { orderId: order.order_number },
        created_at: now,
        updated_at: now,
      });
    }

    // Merge updated fields with existing order for response
    const updatedOrder = { ...order, ...updateData };

    // Fetch related docs in parallel
    const [customerDoc, vendorDoc, deliveryDoc] = await Promise.all([
      updatedOrder.customer_id ? db.collection(Collections.USERS).doc(updatedOrder.customer_id).get() : null,
      updatedOrder.vendor_id ? db.collection(Collections.VENDORS).doc(updatedOrder.vendor_id).get() : null,
      updatedOrder.delivery_partner_id ? db.collection(Collections.USERS).doc(updatedOrder.delivery_partner_id as string).get() : null,
    ]);

    const customer = customerDoc?.exists ? { id: customerDoc.id, ...customerDoc.data() } as OrderRecord : null;
    const vendor = vendorDoc?.exists ? { id: vendorDoc.id, ...vendorDoc.data() } as OrderRecord : null;
    const delivery_partner = deliveryDoc?.exists ? { id: deliveryDoc.id, ...deliveryDoc.data() } as OrderRecord : null;

    // Transform response
    const response = {
      _id: updatedOrder.id,
      orderId: updatedOrder.order_number,
      customer: customer ? {
        _id: customer.id,
        name: customer.name,
        phone: customer.phone,
      } : null,
      vendor: vendor ? {
        _id: vendor.id,
        storeName: vendor.store_name,
        phone: vendor.phone,
      } : null,
      deliveryPartner: delivery_partner ? {
        _id: delivery_partner.id,
        name: delivery_partner.name,
        phone: delivery_partner.phone,
      } : null,
      status: updatedOrder.status,
      timeline: updatedOrder.status_history,
      updatedAt: updatedOrder.updated_at,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
