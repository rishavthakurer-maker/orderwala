import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId, docsToArray, docToObj } from '@/lib/firebase';
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
    const search = (searchParams.get('search') || '').toLowerCase();

    const db = getDb();

    const snapshot = await db
      .collection(Collections.USERS)
      .where('role', '==', 'delivery')
      .orderBy('created_at', 'desc')
      .get();

    let partners = docsToArray<Record<string, unknown>>(snapshot).map(doc => ({
      id: doc.id,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      image: doc.image,
      is_active: doc.is_active,
      is_verified: doc.is_verified,
      created_at: doc.created_at,
    }));

    if (search) {
      partners = partners.filter(p =>
        (p.name && String(p.name).toLowerCase().includes(search)) ||
        (p.phone && String(p.phone).toLowerCase().includes(search)) ||
        (p.email && String(p.email).toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error('Error fetching delivery partners:', error);
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
    const id = generateId();
    const now = new Date().toISOString();

    const newPartner = {
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      role: 'delivery',
      is_active: true,
      is_verified: body.is_verified || false,
      created_at: now,
      updated_at: now,
    };

    await db.collection(Collections.USERS).doc(id).set(newPartner);

    const createdDoc = await db.collection(Collections.USERS).doc(id).get();
    const data = docToObj<Record<string, unknown>>(createdDoc);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery partner:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
