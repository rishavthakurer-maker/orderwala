import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const productDoc = await db.collection(Collections.PRODUCTS).doc(id).get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product: any = { id: productDoc.id, ...productDoc.data() };

    // Fetch related category and vendor docs separately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let category: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let vendor: any = null;

    const [catDoc, venDoc] = await Promise.all([
      product.category_id
        ? db.collection(Collections.CATEGORIES).doc(product.category_id).get()
        : Promise.resolve(null),
      product.vendor_id
        ? db.collection(Collections.VENDORS).doc(product.vendor_id).get()
        : Promise.resolve(null),
    ]);

    if (catDoc && catDoc.exists) {
      const catData = catDoc.data();
      category = { id: catDoc.id, name: catData?.name, slug: catData?.slug };
    }

    if (venDoc && venDoc.exists) {
      const venData = venDoc.data();
      vendor = {
        id: venDoc.id,
        store_name: venData?.store_name,
        logo: venData?.logo,
        phone: venData?.phone,
        average_rating: venData?.average_rating,
      };
    }

    return NextResponse.json({
      success: true,
      data: { ...product, category, vendor },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const productRef = db.collection(Collections.PRODUCTS).doc(id);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    await productRef.update({
      ...body,
      updated_at: new Date().toISOString(),
    });

    // Fetch the updated product
    const updatedDoc = await productRef.get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product: any = { id: updatedDoc.id, ...updatedDoc.data() };

    // Fetch related category and vendor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let category: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let vendor: any = null;

    const [catDoc, venDoc] = await Promise.all([
      product.category_id
        ? db.collection(Collections.CATEGORIES).doc(product.category_id).get()
        : Promise.resolve(null),
      product.vendor_id
        ? db.collection(Collections.VENDORS).doc(product.vendor_id).get()
        : Promise.resolve(null),
    ]);

    if (catDoc && catDoc.exists) {
      const catData = catDoc.data();
      category = { id: catDoc.id, name: catData?.name, slug: catData?.slug };
    }

    if (venDoc && venDoc.exists) {
      const venData = venDoc.data();
      vendor = { id: venDoc.id, store_name: venData?.store_name };
    }

    return NextResponse.json({
      success: true,
      data: { ...product, category, vendor },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete a product (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const productRef = db.collection(Collections.PRODUCTS).doc(id);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    await productRef.update({
      is_active: false,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
