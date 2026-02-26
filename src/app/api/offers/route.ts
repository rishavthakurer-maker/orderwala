import { NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';

// GET /api/offers - Get active promo codes (public)
export async function GET() {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    // Fetch all active promo codes, filter dates and usage in JS
    const snap = await db.collection(Collections.PROMO_CODES)
      .where('is_active', '==', true)
      .orderBy('created_at', 'desc')
      .get();

    const allPromos = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Record<string, unknown>[];

    const active = allPromos.filter((p) => {
      // Filter by date validity
      if (p.valid_until && (p.valid_until as string) < now) return false;
      if (p.valid_from && (p.valid_from as string) > now) return false;
      // Filter out fully used promos
      if (p.usage_limit && (p.used_count as number) >= (p.usage_limit as number)) return false;
      return true;
    });

    const transformed = active.map((p) => ({
      id: p.id,
      code: p.code,
      description: p.description,
      discountType: p.discount_type,
      discountValue: p.discount_value,
      minOrderAmount: p.min_order_amount,
      maxDiscount: p.max_discount,
      validFrom: p.valid_from,
      validUntil: p.valid_until,
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch offers' }, { status: 500 });
  }
}
