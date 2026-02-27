import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';

// POST /api/admin/fix-data - One-time data fix: add missing is_active to products, set is_verified on vendors
export async function POST(request: NextRequest) {
  try {
    // Simple auth check - require a secret key
    const { key } = await request.json();
    if (key !== 'orderwala-fix-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const batch = db.batch();
    let productsFixed = 0;
    let vendorsFixed = 0;

    // Fix products missing is_active
    const productsSnap = await db.collection(Collections.PRODUCTS).get();
    for (const doc of productsSnap.docs) {
      const data = doc.data();
      if (data.is_active === undefined || data.is_active === null) {
        batch.update(doc.ref, { is_active: true });
        productsFixed++;
      }
    }

    // Fix vendors missing is_verified or average_rating
    const vendorsSnap = await db.collection(Collections.VENDORS).get();
    for (const doc of vendorsSnap.docs) {
      const data = doc.data();
      const updates: Record<string, unknown> = {};
      if (data.is_verified === false || data.is_verified === undefined) {
        updates.is_verified = true;
      }
      if (data.average_rating === undefined || data.average_rating === null) {
        updates.average_rating = 0;
      }
      if (data.total_ratings === undefined) {
        updates.total_ratings = 0;
      }
      if (data.total_orders === undefined) {
        updates.total_orders = 0;
      }
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        vendorsFixed++;
      }
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Fixed ${productsFixed} products, ${vendorsFixed} vendors`,
    });
  } catch (error) {
    console.error('Fix data error:', error);
    return NextResponse.json({ error: 'Failed to fix data' }, { status: 500 });
  }
}
