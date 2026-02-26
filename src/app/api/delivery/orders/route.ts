import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/delivery/orders - Get delivery partner's orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'active'; // active | history
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Fetch all orders for this delivery partner
    const snapshot = await db.collection(Collections.ORDERS)
      .where('delivery_partner_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Record<string, unknown>[];

    // Filter by type
    let filteredOrders: Record<string, unknown>[];
    if (type === 'active') {
      filteredOrders = allOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    } else {
      filteredOrders = allOrders
        .filter(o => o.status === 'delivered' || o.status === 'cancelled')
        .sort((a, b) => {
          const aDate = (a.delivered_at as string) || '';
          const bDate = (b.delivered_at as string) || '';
          return bDate.localeCompare(aDate);
        });
    }

    const total = filteredOrders.length;
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);

    // Fetch vendor and customer data for each order
    const transformed = await Promise.all(paginatedOrders.map(async (o) => {
      let vendor = null;
      let customer = null;

      if (o.vendor_id) {
        const vendorSnap = await db.collection(Collections.VENDORS).doc(o.vendor_id as string).get();
        if (vendorSnap.exists) {
          const v = vendorSnap.data()!;
          vendor = { _id: vendorSnap.id, storeName: v.store_name, phone: v.phone, address: v.address };
        }
      }

      if (o.customer_id) {
        const customerSnap = await db.collection(Collections.USERS).doc(o.customer_id as string).get();
        if (customerSnap.exists) {
          const c = customerSnap.data()!;
          customer = { _id: customerSnap.id, name: c.name, phone: c.phone };
        }
      }

      return {
        _id: o.id,
        orderId: o.order_number,
        items: o.items || [],
        total: o.total,
        deliveryFee: o.delivery_fee,
        deliveryAddress: o.delivery_address,
        deliveryEarnings: o.delivery_earnings || o.delivery_fee || 0,
        deliveryRating: o.delivery_rating,
        deliveryFeedback: o.delivery_feedback,
        status: o.status,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        instructions: o.delivery_instructions,
        timeline: o.status_history,
        createdAt: o.created_at,
        deliveredAt: o.delivered_at,
        vendor,
        customer,
      };
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error('Delivery orders error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/delivery/orders - Accept an order (assign delivery partner)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'delivery') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const userId = session.user.id;
    const body = await request.json();
    const { orderId, action } = body; // action: accept | pickup | on_the_way | delivered

    // Find the order
    const orderRef = db.collection(Collections.ORDERS).doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const order = orderSnap.data()!;
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const statusHistory = order.status_history || [];

    if (action === 'accept') {
      if (order.delivery_partner_id) {
        return NextResponse.json({ success: false, error: 'Order already assigned' }, { status: 400 });
      }
      if (order.status !== 'ready') {
        return NextResponse.json({ success: false, error: 'Order is not ready for pickup' }, { status: 400 });
      }
      updateData.delivery_partner_id = userId;
      updateData.assigned_at = new Date().toISOString();
      // Calculate delivery earnings (e.g., delivery_fee or a fixed amount)
      updateData.delivery_earnings = order.delivery_fee || 30;
    } else if (action === 'pickup') {
      if (order.delivery_partner_id !== userId) {
        return NextResponse.json({ success: false, error: 'Not your order' }, { status: 403 });
      }
      updateData.status = 'picked_up';
      updateData.picked_up_at = new Date().toISOString();
      statusHistory.push({ status: 'picked_up', timestamp: new Date().toISOString(), note: 'Picked up by delivery partner' });
      updateData.status_history = statusHistory;
    } else if (action === 'on_the_way') {
      if (order.delivery_partner_id !== userId) {
        return NextResponse.json({ success: false, error: 'Not your order' }, { status: 403 });
      }
      updateData.status = 'on_the_way';
      statusHistory.push({ status: 'on_the_way', timestamp: new Date().toISOString(), note: 'On the way to delivery' });
      updateData.status_history = statusHistory;
    } else if (action === 'delivered') {
      if (order.delivery_partner_id !== userId) {
        return NextResponse.json({ success: false, error: 'Not your order' }, { status: 403 });
      }
      updateData.status = 'delivered';
      updateData.delivered_at = new Date().toISOString();
      updateData.payment_status = 'completed';
      statusHistory.push({ status: 'delivered', timestamp: new Date().toISOString(), note: 'Delivered by delivery partner' });
      updateData.status_history = statusHistory;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await orderRef.update(updateData);

    // Send notification to customer
    const statusMsgs: Record<string, string> = {
      accept: 'A delivery partner has been assigned to your order',
      pickup: 'Your order has been picked up by the delivery partner',
      on_the_way: 'Your order is on the way',
      delivered: 'Your order has been delivered',
    };

    if (statusMsgs[action]) {
      const notifId = generateId();
      await db.collection(Collections.NOTIFICATIONS).doc(notifId).set({
        id: notifId,
        user_id: order.customer_id,
        type: 'order',
        title: `Order ${action === 'accept' ? 'Assigned' : (updateData.status as string || '').replace('_', ' ').toUpperCase()}`,
        message: statusMsgs[action],
        data: { orderId: order.order_number },
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    console.error('Delivery order update error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
