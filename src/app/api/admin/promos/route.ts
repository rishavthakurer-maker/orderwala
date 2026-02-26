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
    const snapshot = await db.collection(Collections.PROMO_CODES)
      .orderBy('created_at', 'desc')
      .get();

    let promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const searchLower = search.toLowerCase();
      promos = promos.filter((p: any) =>
        p.code?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ success: true, data: promos });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
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

    // Check code uniqueness
    const code = body.code?.toUpperCase();
    const existing = await db.collection(Collections.PROMO_CODES)
      .where('code', '==', code)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ success: false, message: 'Promo code already exists' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();
    const promoData = {
      id,
      code,
      description: body.description,
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      min_order_amount: body.min_order_amount || 0,
      max_discount: body.max_discount || null,
      usage_limit: body.usage_limit || 100,
      usage_count: 0,
      valid_from: body.valid_from,
      valid_until: body.valid_until,
      is_active: body.is_active !== false,
      created_at: now,
      updated_at: now,
    };

    await db.collection(Collections.PROMO_CODES).doc(id).set(promoData);

    return NextResponse.json({ success: true, data: promoData }, { status: 201 });
  } catch (error) {
    console.error('Error creating promo code:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
