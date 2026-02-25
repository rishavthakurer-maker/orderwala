import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// GET /api/offers - Get active promo codes (public)
export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('promo_codes')
      .select('id, code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_until, usage_limit, used_count')
      .eq('is_active', true)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter out fully used promos
    const active = (data || []).filter(
      (p: Record<string, unknown>) => !p.usage_limit || (p.used_count as number) < (p.usage_limit as number)
    );

    const transformed = active.map((p: Record<string, unknown>) => ({
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
