import { NextRequest, NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// POST /api/promo-codes/validate - Validate a promo code
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Promo code is required' }, { status: 400 });
    }

    // Find promo by code + is_active
    const snap = await db.collection(Collections.PROMO_CODES)
      .where('code', '==', code.toUpperCase())
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ success: false, error: 'Invalid promo code' }, { status: 404 });
    }

    const promo = { id: snap.docs[0].id, ...snap.docs[0].data() } as Record<string, unknown>;

    // Check validity dates
    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from as string) > now) {
      return NextResponse.json({ success: false, error: 'Promo code is not yet active' }, { status: 400 });
    }
    if (promo.valid_until && new Date(promo.valid_until as string) < now) {
      return NextResponse.json({ success: false, error: 'Promo code has expired' }, { status: 400 });
    }

    // Check usage limit
    if (promo.usage_limit && (promo.used_count as number) >= (promo.usage_limit as number)) {
      return NextResponse.json({ success: false, error: 'Promo code usage limit reached' }, { status: 400 });
    }

    // Check minimum order amount
    if (promo.min_order_amount && subtotal < (promo.min_order_amount as number)) {
      return NextResponse.json({
        success: false,
        error: `Minimum order amount is ₹${promo.min_order_amount}`,
      }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = Math.round(subtotal * ((promo.discount_value as number) / 100));
      if (promo.max_discount && discount > (promo.max_discount as number)) {
        discount = promo.max_discount as number;
      }
    } else {
      discount = promo.discount_value as number;
    }

    return NextResponse.json({
      success: true,
      data: {
        code: promo.code,
        discount,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        description: promo.description,
      },
    });
  } catch (error) {
    console.error('Error validating promo:', error);
    return NextResponse.json({ success: false, error: 'Failed to validate promo' }, { status: 500 });
  }
}
