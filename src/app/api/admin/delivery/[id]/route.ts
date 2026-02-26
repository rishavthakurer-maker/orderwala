import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, docToObj, docsToArray } from '@/lib/firebase';
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
      return NextResponse.json({ success: false, message: 'Delivery partner not found' }, { status: 404 });
    }

    const partner = docToObj<Record<string, unknown>>(userDoc);

    // Get delivery stats: count of delivered orders
    const ordersSnapshot = await db
      .collection(Collections.ORDERS)
      .where('delivery_partner_id', '==', id)
      .get();

    const orders = docsToArray<Record<string, unknown>>(ordersSnapshot);
    const deliveryCount = orders.length;
    const completedCount = orders.filter(o => o.status === 'delivered').length;

    return NextResponse.json({
      success: true,
      data: { ...partner, total_deliveries: deliveryCount, completed_deliveries: completedCount },
    });
  } catch (error) {
    console.error('Error fetching delivery partner:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    // Verify the user is a delivery partner
    const userDoc = await db.collection(Collections.USERS).doc(id).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'delivery') {
      return NextResponse.json({ success: false, message: 'Delivery partner not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_verified !== undefined) updateData.is_verified = body.is_verified;
    updateData.updated_at = new Date().toISOString();

    const userRef = db.collection(Collections.USERS).doc(id);
    await userRef.update(updateData);

    const updatedDoc = await userRef.get();
    const data = docToObj<Record<string, unknown>>(updatedDoc);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating delivery partner:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    // Verify the user is a delivery partner
    const userDoc = await db.collection(Collections.USERS).doc(id).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'delivery') {
      return NextResponse.json({ success: false, message: 'Delivery partner not found' }, { status: 404 });
    }

    // Soft delete: set is_active = false
    await db.collection(Collections.USERS).doc(id).update({
      is_active: false,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Delivery partner deleted' });
  } catch (error) {
    console.error('Error deleting delivery partner:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
