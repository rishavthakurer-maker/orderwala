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

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let query: FirebaseFirestore.Query = db.collection(Collections.ORDERS)
      .orderBy('created_at', 'desc');

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    let orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Text search filter (Firestore doesn't support ilike)
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter((o: any) =>
        o.order_number?.toLowerCase().includes(searchLower)
      );
    }

    // Batch-fetch related docs for joins
    const customerIds = [...new Set(orders.map((o: any) => o.customer_id).filter(Boolean))];
    const vendorIds = [...new Set(orders.map((o: any) => o.vendor_id).filter(Boolean))];
    const deliveryPartnerIds = [...new Set(orders.map((o: any) => o.delivery_partner_id).filter(Boolean))];

    const [customerDocs, vendorDocs, deliveryDocs] = await Promise.all([
      customerIds.length > 0
        ? Promise.all(customerIds.map(id => db.collection(Collections.USERS).doc(id as string).get()))
        : Promise.resolve([]),
      vendorIds.length > 0
        ? Promise.all(vendorIds.map(id => db.collection(Collections.VENDORS).doc(id as string).get()))
        : Promise.resolve([]),
      deliveryPartnerIds.length > 0
        ? Promise.all(deliveryPartnerIds.map(id => db.collection(Collections.USERS).doc(id as string).get()))
        : Promise.resolve([]),
    ]);

    const customerMap: Record<string, any> = {};
    customerDocs.forEach((doc: any) => {
      if (doc.exists) {
        const d = doc.data()!;
        customerMap[doc.id] = { id: doc.id, name: d.name, phone: d.phone, email: d.email };
      }
    });

    const vendorMap: Record<string, any> = {};
    vendorDocs.forEach((doc: any) => {
      if (doc.exists) {
        const d = doc.data()!;
        vendorMap[doc.id] = { id: doc.id, store_name: d.store_name };
      }
    });

    const deliveryMap: Record<string, any> = {};
    deliveryDocs.forEach((doc: any) => {
      if (doc.exists) {
        const d = doc.data()!;
        deliveryMap[doc.id] = { id: doc.id, name: d.name, phone: d.phone, email: d.email };
      }
    });

    const enrichedOrders = orders.map((order: any) => ({
      ...order,
      customer: customerMap[order.customer_id] || null,
      vendor: vendorMap[order.vendor_id] || null,
      delivery_partner: deliveryMap[order.delivery_partner_id] || null,
    }));

    return NextResponse.json({ success: true, data: enrichedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
