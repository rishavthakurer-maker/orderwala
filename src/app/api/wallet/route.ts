import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/wallet - Get wallet balance & transactions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // Get user's wallet balance
    const { data: user } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', session.user.id)
      .single();

    // Get recent transactions
    const { data: transactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        balance: user?.wallet_balance || 0,
        transactions: (transactions || []).map((t: Record<string, unknown>) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          orderId: t.order_id,
          createdAt: t.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet' }, { status: 500 });
  }
}
