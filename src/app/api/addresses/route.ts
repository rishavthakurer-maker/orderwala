import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/addresses - Get user addresses
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transformed = (addresses || []).map((a: Record<string, unknown>) => ({
      id: a.id,
      type: a.type || 'Home',
      name: a.name,
      phone: a.phone,
      address: a.address_line1,
      address2: a.address_line2,
      landmark: a.landmark,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      isDefault: a.is_default,
      latitude: a.latitude,
      longitude: a.longitude,
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST /api/addresses - Create address
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const body = await request.json();

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', session.user.id);
    }

    const { data: address, error } = await supabase
      .from('addresses')
      .insert({
        user_id: session.user.id,
        type: body.type || 'Home',
        name: body.name,
        phone: body.phone,
        address_line1: body.address,
        address_line2: body.address2,
        landmark: body.landmark,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        is_default: body.isDefault || false,
        latitude: body.latitude,
        longitude: body.longitude,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: address }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ success: false, error: 'Failed to create address' }, { status: 500 });
  }
}
