import { NextResponse } from 'next/server';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// GET /api/wallet - Get wallet balance & transactions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Get user's wallet balance
    const userDoc = await db.collection(Collections.USERS).doc(session.user.id).get();
    const userData = userDoc.data();

    // Get recent transactions
    const txSnap = await db.collection(Collections.WALLET_TRANSACTIONS)
      .where('user_id', '==', session.user.id)
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();

    return NextResponse.json({
      success: true,
      data: {
        balance: userData?.wallet_balance || 0,
        transactions: txSnap.docs.map(d => {
          const t = { id: d.id, ...d.data() } as Record<string, unknown>;
          return {
            id: t.id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            orderId: t.order_id,
            createdAt: t.created_at,
          };
        }),
      },
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet' }, { status: 500 });
  }
}
