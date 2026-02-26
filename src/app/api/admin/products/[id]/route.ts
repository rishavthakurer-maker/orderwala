import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections, docToObj } from '@/lib/firebase';
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

async function getProductWithJoins(db: FirebaseFirestore.Firestore, id: string) {
  const prodDoc = await db.collection(Collections.PRODUCTS).doc(id).get();
  const product = docToObj<Record<string, unknown>>(prodDoc);
  if (!product) return null;

  const [catDoc, venDoc] = await Promise.all([
    product.category_id
      ? db.collection(Collections.CATEGORIES).doc(product.category_id as string).get()
      : null,
    product.vendor_id
      ? db.collection(Collections.VENDORS).doc(product.vendor_id as string).get()
      : null,
  ]);

  const catData = catDoc?.exists ? catDoc.data()! : null;
  const venData = venDoc?.exists ? venDoc.data()! : null;

  return {
    ...product,
    category: catData ? { id: catDoc!.id, name: catData.name, slug: catData.slug } : null,
    vendor: venData ? { id: venDoc!.id, store_name: venData.store_name } : null,
  };
}

// Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = getDb();
    const product = await getProductWithJoins(db, id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, discountPrice, unit, categoryId, vendorId, images, stock, isVeg, isFeatured, isAvailable, isActive, tags, minOrderQty, maxOrderQty } = body;

    const db = getDb();

    const updateData: Record<string, unknown> = {};
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (discountPrice !== undefined) updateData.discount_price = discountPrice;
    if (unit) updateData.unit = unit;
    if (categoryId) updateData.category_id = categoryId;
    if (vendorId) updateData.vendor_id = vendorId;
    if (images) updateData.images = images;
    if (stock !== undefined) updateData.stock = stock;
    if (isVeg !== undefined) updateData.is_veg = isVeg;
    if (isFeatured !== undefined) updateData.is_featured = isFeatured;
    if (isAvailable !== undefined) updateData.is_available = isAvailable;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (tags !== undefined) updateData.tags = tags;
    if (minOrderQty !== undefined) updateData.min_order_qty = minOrderQty;
    if (maxOrderQty !== undefined) updateData.max_order_qty = maxOrderQty;
    updateData.updated_at = new Date().toISOString();

    await db.collection(Collections.PRODUCTS).doc(id).update(updateData);

    // Re-read with joins
    const product = await getProductWithJoins(db, id);

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = getDb();

    await db.collection(Collections.PRODUCTS).doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
