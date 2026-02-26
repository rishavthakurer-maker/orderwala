import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';

// GET /api/vendors/[id] - Get a single vendor with products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('products') === 'true';

    const vendorDoc = await db.collection(Collections.VENDORS).doc(id).get();

    if (!vendorDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const vendor = { id: vendorDoc.id, ...vendorDoc.data() };

    let products = null;
    if (includeProducts) {
      const productsSnapshot = await db
        .collection(Collections.PRODUCTS)
        .where('vendor_id', '==', id)
        .where('is_active', '==', true)
        .orderBy('created_at', 'desc')
        .get();

      // Collect unique category IDs for separate reads
      const categoryIds = new Set<string>();
      productsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.category_id) categoryIds.add(data.category_id);
      });

      // Fetch categories
      const categoryMap: Record<string, { id: string; name: string; slug: string }> = {};
      if (categoryIds.size > 0) {
        const categoryPromises = Array.from(categoryIds).map((catId) =>
          db.collection(Collections.CATEGORIES).doc(catId).get()
        );
        const categoryDocs = await Promise.all(categoryPromises);
        categoryDocs.forEach((catDoc) => {
          if (catDoc.exists) {
            const catData = catDoc.data()!;
            categoryMap[catDoc.id] = { id: catDoc.id, name: catData.name, slug: catData.slug };
          }
        });
      }

      products = productsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          category: data.category_id ? categoryMap[data.category_id] || null : null,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        vendor,
        products: includeProducts ? products : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

// PUT /api/vendors/[id] - Update a vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const vendorRef = db.collection(Collections.VENDORS).doc(id);
    const vendorDoc = await vendorRef.get();

    if (!vendorDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const updateData = { ...body, updated_at: new Date().toISOString() };
    await vendorRef.update(updateData);

    const updatedDoc = await vendorRef.get();
    const vendor = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/[id] - Deactivate a vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const vendorRef = db.collection(Collections.VENDORS).doc(id);
    const vendorDoc = await vendorRef.get();

    if (!vendorDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Soft delete vendor
    await vendorRef.update({ is_active: false, updated_at: now });

    // Also deactivate all vendor products using batch
    const productsSnapshot = await db
      .collection(Collections.PRODUCTS)
      .where('vendor_id', '==', id)
      .get();

    if (!productsSnapshot.empty) {
      const batch = db.batch();
      productsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { is_active: false, updated_at: now });
      });
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating vendor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate vendor' },
      { status: 500 }
    );
  }
}
