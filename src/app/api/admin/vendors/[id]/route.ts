import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const updateData: Record<string, unknown> = {};
    if (body.store_name !== undefined) updateData.store_name = body.store_name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.commission_rate !== undefined) updateData.commission_rate = body.commission_rate;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_verified !== undefined) updateData.is_verified = body.is_verified;
    if (body.is_open !== undefined) updateData.is_open = body.is_open;
    if (body.delivery_radius !== undefined) updateData.delivery_radius = body.delivery_radius;
    if (body.min_order_amount !== undefined) updateData.min_order_amount = body.min_order_amount;
    if (body.delivery_fee !== undefined) updateData.delivery_fee = body.delivery_fee;
    updateData.updated_at = new Date().toISOString();

    const vendorRef = db.collection(Collections.VENDORS).doc(id);
    await vendorRef.update(updateData);

    const updatedSnap = await vendorRef.get();
    const data = { id: updatedSnap.id, ...updatedSnap.data() };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating vendor:', error);
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

    // Soft delete: set is_active to false
    await db.collection(Collections.VENDORS).doc(id).update({
      is_active: false,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Vendor deleted' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
