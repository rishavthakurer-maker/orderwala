import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'orderwala-admin-secret-key-2024';

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'admin') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const db = getDb();
    const orderRef = db.collection(Collections.ORDERS).doc(id);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const existing = orderSnap.data()!;
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (status) {
      updateData.status = status;

      // Update status history
      const history = (existing.status_history as Array<Record<string, string>>) || [];
      history.push({
        status,
        timestamp: new Date().toISOString(),
        updatedBy: decoded.userId,
      });
      updateData.status_history = history;

      if (status === 'delivered') {
        updateData.actual_delivery_time = new Date().toISOString();
        updateData.payment_status = 'paid';
      }
      if (status === 'cancelled') {
        updateData.cancelled_by = 'admin';
      }
    }

    await orderRef.update(updateData);

    // Fetch updated order with joins
    const updatedSnap = await orderRef.get();
    const order: any = { id: updatedSnap.id, ...updatedSnap.data() };

    const [customerSnap, vendorSnap] = await Promise.all([
      order.customer_id ? db.collection(Collections.USERS).doc(order.customer_id).get() : null,
      order.vendor_id ? db.collection(Collections.VENDORS).doc(order.vendor_id).get() : null,
    ]);

    if (customerSnap?.exists) {
      const c = customerSnap.data()!;
      order.customer = { id: customerSnap.id, name: c.name, phone: c.phone, email: c.email };
    }
    if (vendorSnap?.exists) {
      const v = vendorSnap.data()!;
      order.vendor = { id: vendorSnap.id, store_name: v.store_name };
    }

    // Create notification for status update
    if (status && order.customer_id) {
      const notifId = crypto.randomUUID();
      await db.collection(Collections.NOTIFICATIONS).doc(notifId).set({
        id: notifId,
        user_id: order.customer_id,
        title: 'Order Update',
        message: `Your order #${order.order_number || id} status has been updated to ${status}`,
        type: 'order_update',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order updated successfully',
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
