import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// PUT /api/seller/products/[id] - Update a product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const vendor = { id: vendorSnap.docs[0].id };

    // Verify product belongs to this vendor
    const productDoc = await db.collection(Collections.PRODUCTS).doc(id).get();
    if (!productDoc.exists) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const existingProduct = productDoc.data() as Record<string, unknown>;
    if (existingProduct.vendor_id !== vendor.id) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.discountPrice !== undefined) updateData.discount_price = body.discountPrice ? parseFloat(body.discountPrice) : null;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.categoryId !== undefined) updateData.category_id = body.categoryId || null;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock);
    if (body.isVeg !== undefined) updateData.is_veg = body.isVeg;
    if (body.isAvailable !== undefined) updateData.is_available = body.isAvailable;
    if (body.tags !== undefined) updateData.tags = body.tags;

    await db.collection(Collections.PRODUCTS).doc(id).update(updateData);

    // Fetch updated product with category
    const updatedDoc = await db.collection(Collections.PRODUCTS).doc(id).get();
    const product = { id: updatedDoc.id, ...updatedDoc.data() } as Record<string, unknown>;

    let category = null;
    if (product.category_id) {
      const catDoc = await db.collection(Collections.CATEGORIES).doc(String(product.category_id)).get();
      if (catDoc.exists) {
        const data = catDoc.data() as Record<string, unknown>;
        category = { id: catDoc.id, name: data.name, slug: data.slug };
      }
    }

    return NextResponse.json({ success: true, data: { ...product, category } });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/seller/products/[id] - Delete a product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    const vendorSnap = await db.collection(Collections.VENDORS)
      .where('owner_id', '==', session.user.id)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const vendor = { id: vendorSnap.docs[0].id };

    // Verify product belongs to this vendor before deleting
    const productDoc = await db.collection(Collections.PRODUCTS).doc(id).get();
    if (!productDoc.exists) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const product = productDoc.data() as Record<string, unknown>;
    if (product.vendor_id !== vendor.id) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    await db.collection(Collections.PRODUCTS).doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
  }
}
