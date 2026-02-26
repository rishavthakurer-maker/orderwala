import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// PUT /api/seller/orders/[id] - Update order status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const vendor = { id: vendorSnap.docs[0].id };

    // Verify order belongs to this vendor
    const orderDoc = await db.collection(Collections.ORDERS).doc(id).get();
    if (!orderDoc.exists) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const order = { id: orderDoc.id, ...orderDoc.data() } as Record<string, unknown>;
    if (order.vendor_id !== vendor.id) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['picked_up'],
      picked_up: ['on_the_way'],
      on_the_way: ['delivered'],
    };

    const allowed = validTransitions[order.status as string] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Cannot change status from ${order.status} to ${status}`,
      }, { status: 400 });
    }

    const statusHistory = Array.isArray(order.status_history) ? [...order.status_history] : [];
    statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      by: session.user.name || 'Vendor',
    });

    const updateData = {
      status,
      status_history: statusHistory,
      updated_at: new Date().toISOString(),
    };

    await db.collection(Collections.ORDERS).doc(id).update(updateData);

    const updatedDoc = await db.collection(Collections.ORDERS).doc(id).get();
    const updated = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}

// GET /api/seller/orders/[id] - Get single order
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const vendor = { id: vendorSnap.docs[0].id };

    const orderDoc = await db.collection(Collections.ORDERS).doc(id).get();
    if (!orderDoc.exists) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const order = { id: orderDoc.id, ...orderDoc.data() } as Record<string, unknown>;
    if (order.vendor_id !== vendor.id) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Fetch customer info
    let customer = null;
    if (order.customer_id) {
      const custDoc = await db.collection(Collections.USERS).doc(String(order.customer_id)).get();
      if (custDoc.exists) {
        const data = custDoc.data() as Record<string, unknown>;
        customer = { id: custDoc.id, name: data.name, email: data.email, phone: data.phone };
      }
    }

    return NextResponse.json({ success: true, data: { ...order, customer } });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
