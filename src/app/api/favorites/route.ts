import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/favorites - Get user favorites
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Fetch favorites for the user
    const favSnap = await db.collection(Collections.FAVORITES)
      .where('user_id', '==', session.user.id)
      .orderBy('created_at', 'desc')
      .get();

    const favorites = favSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (favorites.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Collect unique product IDs
    const productIds = [...new Set(favorites.map((f: Record<string, unknown>) => f.product_id as string))];

    // Batch-fetch products
    const productMap: Record<string, Record<string, unknown>> = {};
    for (let i = 0; i < productIds.length; i += 10) {
      const batch = productIds.slice(i, i + 10);
      const snap = await db.collection(Collections.PRODUCTS).where('__name__', 'in', batch).get();
      snap.docs.forEach(d => { productMap[d.id] = { id: d.id, ...d.data() }; });
    }

    // Collect vendor & category IDs from products
    const vendorIds = [...new Set(Object.values(productMap).map(p => p.vendor_id as string).filter(Boolean))];
    const categoryIds = [...new Set(Object.values(productMap).map(p => p.category_id as string).filter(Boolean))];

    const vendorMap: Record<string, Record<string, unknown>> = {};
    for (let i = 0; i < vendorIds.length; i += 10) {
      const batch = vendorIds.slice(i, i + 10);
      const snap = await db.collection(Collections.VENDORS).where('__name__', 'in', batch).get();
      snap.docs.forEach(d => { vendorMap[d.id] = { id: d.id, ...d.data() }; });
    }

    const categoryMap: Record<string, Record<string, unknown>> = {};
    for (let i = 0; i < categoryIds.length; i += 10) {
      const batch = categoryIds.slice(i, i + 10);
      const snap = await db.collection(Collections.CATEGORIES).where('__name__', 'in', batch).get();
      snap.docs.forEach(d => { categoryMap[d.id] = { id: d.id, ...d.data() }; });
    }

    const transformed = favorites.map((f: Record<string, unknown>) => {
      const p = productMap[f.product_id as string] || null;
      const v = p ? vendorMap[p.vendor_id as string] || null : null;
      const c = p ? categoryMap[p.category_id as string] || null : null;
      return {
        id: f.id,
        productId: f.product_id,
        product: p ? {
          _id: p.id,
          name: p.name,
          slug: p.slug,
          images: p.images,
          price: p.price,
          discountPrice: p.discount_price,
          unit: p.unit,
          isVeg: p.is_veg,
          averageRating: p.average_rating,
          totalRatings: p.total_ratings,
          isAvailable: p.is_available,
          vendor: v ? { _id: (v as Record<string, unknown>).id, storeName: (v as Record<string, unknown>).store_name } : null,
          category: c ? { _id: (c as Record<string, unknown>).id, name: (c as Record<string, unknown>).name, slug: (c as Record<string, unknown>).slug } : null,
        } : null,
        createdAt: f.created_at,
      };
    });

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/favorites - Add to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    // Check if already favorited
    const existingSnap = await db.collection(Collections.FAVORITES)
      .where('user_id', '==', session.user.id)
      .where('product_id', '==', productId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const doc = existingSnap.docs[0];
      return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data() }, message: 'Already in favorites' });
    }

    const now = new Date().toISOString();
    const id = generateId();
    const favorite = {
      user_id: session.user.id,
      product_id: productId,
      created_at: now,
      updated_at: now,
    };
    await db.collection(Collections.FAVORITES).doc(id).set(favorite);

    return NextResponse.json({ success: true, data: { id, ...favorite } }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ success: false, error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const { productId } = await request.json();

    const snap = await db.collection(Collections.FAVORITES)
      .where('user_id', '==', session.user.id)
      .where('product_id', '==', productId)
      .get();

    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ success: false, error: 'Failed to remove favorite' }, { status: 500 });
  }
}
