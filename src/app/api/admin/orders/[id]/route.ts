import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'orderwala-admin-secret-key-2024';

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'admin') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const supabase = createAdminSupabaseClient();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (status) {
      updateData.status = status;

      // Update status history
      const { data: existing } = await supabase
        .from('orders')
        .select('status_history')
        .eq('id', id)
        .single();

      const history = (existing?.status_history as Array<Record<string, string>>) || [];
      history.push({
        status,
        timestamp: new Date().toISOString(),
        updatedBy: decoded.userId,
      });
      updateData.status_history = history;

      if (status === 'delivered') {
        updateData.actual_delivery_time = new Date().toISOString();
        updateData.payment_status = 'paid';
      }
      if (status === 'cancelled') {
        updateData.cancelled_by = 'admin';
      }
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, name, phone, email),
        vendor:vendors!orders_vendor_id_fkey(id, store_name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order updated successfully',
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
