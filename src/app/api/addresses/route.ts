import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/addresses - Get user addresses
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const snap = await db.collection(Collections.ADDRESSES)
      .where('user_id', '==', session.user.id)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'desc')
      .get();

    const transformed = snap.docs.map(d => {
      const a = { id: d.id, ...d.data() } as Record<string, unknown>;
      return {
        id: a.id,
        type: a.type || 'Home',
        name: a.name,
        phone: a.phone,
        address: a.address_line1,
        address2: a.address_line2,
        landmark: a.landmark,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        isDefault: a.is_default,
        latitude: a.latitude,
        longitude: a.longitude,
      };
    });

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST /api/addresses - Create address
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const body = await request.json();
    const now = new Date().toISOString();

    // If setting as default, unset other defaults
    if (body.isDefault) {
      const existingSnap = await db.collection(Collections.ADDRESSES)
        .where('user_id', '==', session.user.id)
        .where('is_default', '==', true)
        .get();

      const batch = db.batch();
      existingSnap.docs.forEach(doc => {
        batch.update(doc.ref, { is_default: false, updated_at: now });
      });
      await batch.commit();
    }

    const id = generateId();
    const address = {
      user_id: session.user.id,
      type: body.type || 'Home',
      name: body.name,
      phone: body.phone,
      address_line1: body.address,
      address_line2: body.address2,
      landmark: body.landmark,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      is_default: body.isDefault || false,
      latitude: body.latitude,
      longitude: body.longitude,
      created_at: now,
      updated_at: now,
    };
    await db.collection(Collections.ADDRESSES).doc(id).set(address);

    return NextResponse.json({ success: true, data: { id, ...address } }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ success: false, error: 'Failed to create address' }, { status: 500 });
  }
}
