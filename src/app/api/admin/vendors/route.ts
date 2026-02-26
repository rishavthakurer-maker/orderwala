import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'orderwala-admin-secret-key-2024';

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const db = getDb();
    const snapshot = await db.collection(Collections.VENDORS)
      .orderBy('created_at', 'desc')
      .get();

    let vendors = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        store_name: d.store_name,
        slug: d.slug,
        phone: d.phone,
        email: d.email,
        category: d.category,
        description: d.description,
        logo: d.logo,
        address: d.address,
        commission_rate: d.commission_rate,
        average_rating: d.average_rating,
        total_ratings: d.total_ratings,
        total_orders: d.total_orders,
        is_open: d.is_open,
        is_active: d.is_active,
        is_verified: d.is_verified,
        delivery_radius: d.delivery_radius,
        min_order_amount: d.min_order_amount,
        delivery_fee: d.delivery_fee,
        created_at: d.created_at,
      };
    });

    if (search) {
      const searchLower = search.toLowerCase();
      vendors = vendors.filter(v =>
        v.store_name?.toLowerCase().includes(searchLower) ||
        v.phone?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ success: true, data: vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const db = getDb();

    // Create slug from store_name
    const slug = (body.store_name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const id = generateId();
    const now = new Date().toISOString();
    const vendorData = {
      id,
      owner_id: decoded.userId,
      store_name: body.store_name,
      slug,
      phone: body.phone,
      email: body.email || null,
      category: body.category,
      description: body.description || '',
      logo: body.logo || '/placeholder.png',
      address: body.address || {},
      commission_rate: body.commission_rate || 10,
      is_verified: body.is_verified || false,
      is_active: true,
      is_open: true,
      delivery_radius: body.delivery_radius || 5,
      min_order_amount: body.min_order_amount || 0,
      delivery_fee: body.delivery_fee || 0,
      average_rating: 0,
      total_ratings: 0,
      total_orders: 0,
      created_at: now,
      updated_at: now,
    };

    await db.collection(Collections.VENDORS).doc(id).set(vendorData);

    return NextResponse.json({ success: true, data: vendorData }, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
