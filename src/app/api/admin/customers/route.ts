import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, docsToArray } from '@/lib/firebase';
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
    const search = (searchParams.get('search') || '').toLowerCase();

    const snapshot = await db
      .collection(Collections.USERS)
      .where('role', '==', 'customer')
      .orderBy('created_at', 'desc')
      .get();

    let customers = docsToArray<Record<string, unknown>>(snapshot).map(doc => ({
      id: doc.id,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      role: doc.role,
      is_active: doc.is_active,
      is_verified: doc.is_verified,
      wallet_balance: doc.wallet_balance,
      created_at: doc.created_at,
    }));

    if (search) {
      customers = customers.filter(c =>
        (c.name && String(c.name).toLowerCase().includes(search)) ||
        (c.email && String(c.email).toLowerCase().includes(search)) ||
        (c.phone && String(c.phone).toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
