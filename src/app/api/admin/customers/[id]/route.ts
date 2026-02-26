import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, docToObj, docsToArray } from '@/lib/firebase';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const userDoc = await db.collection(Collections.USERS).doc(id).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    const customer = docToObj<Record<string, unknown>>(userDoc);

    // Get order stats: count and total spent
    const ordersSnapshot = await db
      .collection(Collections.ORDERS)
      .where('customer_id', '==', id)
      .get();

    const orders = docsToArray<Record<string, unknown>>(ordersSnapshot);
    const orderCount = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return NextResponse.json({
      success: true,
      data: { ...customer, order_count: orderCount, total_spent: totalSpent },
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
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
    const { isActive } = body;

    const db = getDb();
    const userRef = db.collection(Collections.USERS).doc(id);

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (isActive !== undefined) updateData.is_active = isActive;

    await userRef.update(updateData);

    const updatedDoc = await userRef.get();
    const user = docToObj<Record<string, unknown>>(updatedDoc);

    return NextResponse.json({
      success: true,
      data: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        role: user?.role,
        is_active: user?.is_active,
        is_verified: user?.is_verified,
        wallet_balance: user?.wallet_balance,
        created_at: user?.created_at,
      },
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
