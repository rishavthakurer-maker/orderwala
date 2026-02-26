import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/seller/products - Get seller's products
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Get vendor for this user
    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const vendor = { id: vendorSnap.docs[0].id };

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    let query: FirebaseFirestore.Query = db.collection(Collections.PRODUCTS)
      .where('vendor_id', '==', vendor.id)
      .orderBy('created_at', 'desc');

    if (category) {
      query = query.where('category_id', '==', category);
    }

    const productsSnap = await query.get();
    let products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Record<string, unknown>[];

    // Client-side text search (Firestore doesn't support ilike)
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter((p) =>
        String(p.name || '').toLowerCase().includes(searchLower)
      );
    }

    // Fetch category info for each product
    const categoryIds = [...new Set(products.map(p => String(p.category_id)).filter(Boolean))];
    const categoryMap: Record<string, Record<string, unknown>> = {};
    for (const catId of categoryIds) {
      const catDoc = await db.collection(Collections.CATEGORIES).doc(catId).get();
      if (catDoc.exists) {
        const data = catDoc.data() as Record<string, unknown>;
        categoryMap[catId] = { id: catDoc.id, name: data.name, slug: data.slug };
      }
    }

    const enrichedProducts = products.map((p) => ({
      ...p,
      category: p.category_id ? categoryMap[String(p.category_id)] || null : null,
    }));

    return NextResponse.json({ success: true, data: enrichedProducts });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/seller/products - Create a product
export async function POST(request: NextRequest) {
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

    const vendor = { id: vendorSnap.docs[0].id };

    const body = await request.json();
    const { name, description, price, discountPrice, unit, categoryId, images, stock, isVeg, tags } = body;

    if (!name || !price) {
      return NextResponse.json({ success: false, error: 'Name and price are required' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const now = new Date().toISOString();
    const productId = generateId();
    const productData = {
      vendor_id: vendor.id,
      category_id: categoryId || null,
      name,
      slug,
      description: description || '',
      price: parseFloat(price),
      discount_price: discountPrice ? parseFloat(discountPrice) : null,
      unit: unit || 'piece',
      images: images || [],
      stock: stock ? parseInt(stock) : 0,
      is_veg: isVeg !== undefined ? isVeg : true,
      is_available: true,
      is_featured: false,
      tags: tags || [],
      created_at: now,
      updated_at: now,
    };

    await db.collection(Collections.PRODUCTS).doc(productId).set(productData);

    // Fetch category info if applicable
    let category = null;
    if (categoryId) {
      const catDoc = await db.collection(Collections.CATEGORIES).doc(categoryId).get();
      if (catDoc.exists) {
        const data = catDoc.data() as Record<string, unknown>;
        category = { id: catDoc.id, name: data.name, slug: data.slug };
      }
    }

    return NextResponse.json({ success: true, data: { id: productId, ...productData, category } }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}
