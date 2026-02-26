import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, generateId, docToObj, docsToArray } from '@/lib/firebase';
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

// Get all products (admin)
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    let query: FirebaseFirestore.Query = db
      .collection(Collections.PRODUCTS)
      .orderBy('created_at', 'desc');

    if (category) {
      query = query.where('category_id', '==', category);
    }

    const snapshot = await query.get();
    let products = docsToArray<Record<string, unknown>>(snapshot);

    // Text search: filter in JS
    if (search) {
      const lower = search.toLowerCase();
      products = products.filter((p) =>
        (p.name as string || '').toLowerCase().includes(lower)
      );
    }

    // Collect unique category and vendor IDs for joins
    const catIds = [...new Set(products.map((p) => p.category_id as string).filter(Boolean))];
    const venIds = [...new Set(products.map((p) => p.vendor_id as string).filter(Boolean))];

    const catMap: Record<string, { id: string; name: string; slug: string }> = {};
    const venMap: Record<string, { id: string; store_name: string }> = {};

    // Batch-read categories
    if (catIds.length) {
      const catDocs = await db.getAll(
        ...catIds.map((cid) => db.collection(Collections.CATEGORIES).doc(cid))
      );
      for (const d of catDocs) {
        if (d.exists) {
          const data = d.data()!;
          catMap[d.id] = { id: d.id, name: data.name, slug: data.slug };
        }
      }
    }

    // Batch-read vendors
    if (venIds.length) {
      const venDocs = await db.getAll(
        ...venIds.map((vid) => db.collection(Collections.VENDORS).doc(vid))
      );
      for (const d of venDocs) {
        if (d.exists) {
          const data = d.data()!;
          venMap[d.id] = { id: d.id, store_name: data.store_name };
        }
      }
    }

    const enriched = products.map((p) => ({
      ...p,
      category: catMap[p.category_id as string] || null,
      vendor: venMap[p.vendor_id as string] || null,
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Create new product
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, discountPrice, unit, categoryId, vendorId, images, stock, isVeg, isFeatured, isAvailable, tags, minOrderQty, maxOrderQty } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { success: false, message: 'Name, price, and category are required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const db = getDb();

    // Get vendor_id - use provided or find first vendor
    let finalVendorId = vendorId;
    if (!finalVendorId) {
      const vendorSnap = await db
        .collection(Collections.VENDORS)
        .limit(1)
        .get();
      if (vendorSnap.empty) {
        return NextResponse.json(
          { success: false, message: 'No vendor found. Please create a vendor first.' },
          { status: 400 }
        );
      }
      finalVendorId = vendorSnap.docs[0].id;
    }

    const id = generateId();
    const now = new Date().toISOString();
    const productData: Record<string, unknown> = {
      name,
      slug,
      description: description || '',
      price,
      discount_price: discountPrice || null,
      unit: unit || 'piece',
      category_id: categoryId,
      vendor_id: finalVendorId,
      images: images || [],
      stock: stock || 0,
      is_veg: isVeg !== false,
      is_featured: isFeatured || false,
      is_available: isAvailable !== false,
      is_active: true,
      tags: tags || [],
      min_order_qty: minOrderQty || 1,
      max_order_qty: maxOrderQty || 10,
      created_at: now,
      updated_at: now,
    };

    await db.collection(Collections.PRODUCTS).doc(id).set(productData);

    // Read back with joins
    const catDoc = await db.collection(Collections.CATEGORIES).doc(categoryId).get();
    const venDoc = await db.collection(Collections.VENDORS).doc(finalVendorId).get();
    const catData = catDoc.exists ? catDoc.data()! : null;
    const venData = venDoc.exists ? venDoc.data()! : null;

    const product = {
      id,
      ...productData,
      category: catData ? { id: catDoc.id, name: catData.name, slug: catData.slug } : null,
      vendor: venData ? { id: venDoc.id, store_name: venData.store_name } : null,
    };

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
