import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// PUT /api/addresses/[id] - Update address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const body = await request.json();
    const now = new Date().toISOString();

    // Verify ownership
    const docRef = db.collection(Collections.ADDRESSES).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.user_id !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 });
    }

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

    const updateData: Record<string, unknown> = { updated_at: now };
    if (body.type !== undefined) updateData.type = body.type;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address_line1 = body.address;
    if (body.address2 !== undefined) updateData.address_line2 = body.address2;
    if (body.landmark !== undefined) updateData.landmark = body.landmark;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.pincode !== undefined) updateData.pincode = body.pincode;
    if (body.isDefault !== undefined) updateData.is_default = body.isDefault;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;

    await docRef.update(updateData);
    const updated = await docRef.get();

    return NextResponse.json({ success: true, data: { id: updated.id, ...updated.data() } });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ success: false, error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE /api/addresses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Verify ownership
    const docRef = db.collection(Collections.ADDRESSES).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.user_id !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete address' }, { status: 500 });
  }
}
