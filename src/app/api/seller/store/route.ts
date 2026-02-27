import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/seller/store - Get current seller's store
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const vendor = { id: vendorSnap.docs[0].id, ...vendorSnap.docs[0].data() };

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/seller/store - Create seller store (during registration)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Check if vendor already has a store
    const existingSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json({ success: false, error: 'Store already exists' }, { status: 409 });
    }

    const body = await request.json();
    const { storeName, phone, email, description, category, address } = body;

    if (!storeName || !phone) {
      return NextResponse.json({ success: false, error: 'Store name and phone are required' }, { status: 400 });
    }

    const slug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const now = new Date().toISOString();
    const vendorId = generateId();
    const vendorData = {
      owner_id: session.user.id,
      store_name: storeName,
      slug,
      description: description || '',
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=f97316&color=fff&size=200`,
      phone,
      email: email || session.user.email,
      category: category || 'general',
      address: address || { street: '', city: '', state: '', pincode: '' },
      is_active: true,
      is_verified: true,
      is_open: true,
      average_rating: 0,
      total_ratings: 0,
      total_orders: 0,
      delivery_time: '25-35 min',
      created_at: now,
      updated_at: now,
    };

    await db.collection(Collections.VENDORS).doc(vendorId).set(vendorData);

    return NextResponse.json({ success: true, data: { id: vendorId, ...vendorData } }, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ success: false, error: 'Failed to create store' }, { status: 500 });
  }
}

// PUT /api/seller/store - Update seller store
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const body = await request.json();

    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const vendorId = vendorSnap.docs[0].id;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.storeName !== undefined) updateData.store_name = body.storeName;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.coverImage !== undefined) updateData.cover_image = body.coverImage;
    if (body.isOpen !== undefined) updateData.is_open = body.isOpen;
    if (body.deliveryRadius !== undefined) updateData.delivery_radius = body.deliveryRadius;
    if (body.minOrderAmount !== undefined) updateData.min_order_amount = body.minOrderAmount;
    if (body.deliveryFee !== undefined) updateData.delivery_fee = body.deliveryFee;
    if (body.openingHours !== undefined) updateData.opening_hours = body.openingHours;
    if (body.bankDetails !== undefined) updateData.bank_details = body.bankDetails;

    await db.collection(Collections.VENDORS).doc(vendorId).update(updateData);

    const updatedDoc = await db.collection(Collections.VENDORS).doc(vendorId).get();
    const updated = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json({ success: false, error: 'Failed to update store' }, { status: 500 });
  }
}

// DELETE /api/seller/store - Delete seller account (store + products + user)
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const batch = db.batch();

    // Find the vendor store
    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (!vendorSnap.empty) {
      const vendorId = vendorSnap.docs[0].id;

      // Delete all products belonging to this vendor
      const productsSnap = await db.collection(Collections.PRODUCTS)
        .where('vendor_id', '==', vendorId)
        .get();

      for (const doc of productsSnap.docs) {
        batch.delete(doc.ref);
      }

      // Delete the vendor store
      batch.delete(vendorSnap.docs[0].ref);
    }

    // Delete the user account
    const userDoc = db.collection(Collections.USERS).doc(session.user.id);
    batch.delete(userDoc);

    // Delete user's addresses
    const addressSnap = await db.collection(Collections.ADDRESSES)
      .where('user_id', '==', session.user.id)
      .get();
    for (const doc of addressSnap.docs) {
      batch.delete(doc.ref);
    }

    // Delete user's favorites
    const favSnap = await db.collection(Collections.FAVORITES)
      .where('user_id', '==', session.user.id)
      .get();
    for (const doc of favSnap.docs) {
      batch.delete(doc.ref);
    }

    await batch.commit();

    return NextResponse.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete account' }, { status: 500 });
  }
}
