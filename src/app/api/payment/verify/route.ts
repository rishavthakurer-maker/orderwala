import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, Collections } from '@/lib/firebase';
import { auth } from '@/lib/auth';

// POST /api/payment/verify — Verify Razorpay payment signature and update order
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId, // Our internal order ID
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Missing payment details' }, { status: 400 });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed');
      return NextResponse.json(
        { success: false, error: 'Payment verification failed. Signature mismatch.' },
        { status: 400 }
      );
    }

    // Payment is verified — update the order
    if (orderId) {
      const db = getDb();
      const now = new Date().toISOString();

      await db.collection(Collections.ORDERS).doc(orderId).update({
        payment_status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        paid_at: now,
        updated_at: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
