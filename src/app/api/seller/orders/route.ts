import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/seller/orders - Get seller's orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const vendor = { id: vendorSnap.docs[0].id };

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query: FirebaseFirestore.Query = db.collection(Collections.ORDERS)
      .where('vendor_id', '==', vendor.id)
      .orderBy('created_at', 'desc');

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    query = query.limit(limit);

    const ordersSnap = await query.get();
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Record<string, unknown>[];

    // Fetch customer info for each order
    const customerIds = [...new Set(orders.map(o => String(o.customer_id)).filter(Boolean))];
    const customerMap: Record<string, Record<string, unknown>> = {};
    for (const custId of customerIds) {
      const custDoc = await db.collection(Collections.USERS).doc(custId).get();
      if (custDoc.exists) {
        const data = custDoc.data() as Record<string, unknown>;
        customerMap[custId] = { id: custId, name: data.name, email: data.email, phone: data.phone };
      }
    }

    const transformed = orders.map((o) => ({
      id: o.id,
      orderId: o.order_number || o.id,
      customer: customerMap[String(o.customer_id)] || null,
      items: o.items,
      subtotal: o.subtotal,
      deliveryCharge: o.delivery_charge,
      discount: o.discount,
      total: o.total,
      status: o.status,
      paymentMethod: o.payment_method,
      deliveryAddress: o.delivery_address,
      instructions: o.instructions,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
