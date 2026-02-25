import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// POST /api/promo-codes/validate - Validate a promo code
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Promo code is required' }, { status: 400 });
    }

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !promo) {
      return NextResponse.json({ success: false, error: 'Invalid promo code' }, { status: 404 });
    }

    // Check validity dates
    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return NextResponse.json({ success: false, error: 'Promo code is not yet active' }, { status: 400 });
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return NextResponse.json({ success: false, error: 'Promo code has expired' }, { status: 400 });
    }

    // Check usage limit
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      return NextResponse.json({ success: false, error: 'Promo code usage limit reached' }, { status: 400 });
    }

    // Check minimum order amount
    if (promo.min_order_amount && subtotal < promo.min_order_amount) {
      return NextResponse.json({
        success: false,
        error: `Minimum order amount is ₹${promo.min_order_amount}`,
      }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = Math.round(subtotal * (promo.discount_value / 100));
      if (promo.max_discount && discount > promo.max_discount) {
        discount = promo.max_discount;
      }
    } else {
      discount = promo.discount_value;
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
