import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

// GET /api/seller/store - Get current seller's store
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('owner_id', session.user.id)
      .single();

    if (error || !vendor) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/seller/store - Create seller store (during registration)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // Check if vendor already has a store
    const { data: existing } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Store already exists' }, { status: 409 });
    }

    const body = await request.json();
    const { storeName, phone, email, description, category, address } = body;

    if (!storeName || !phone) {
      return NextResponse.json({ success: false, error: 'Store name and phone are required' }, { status: 400 });
    }

    const slug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert({
        owner_id: session.user.id,
        store_name: storeName,
        slug,
        description: description || '',
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(storeName)}&background=f97316&color=fff&size=200`,
        phone,
        email: email || session.user.email,
        category: category || 'general',
        address: address || { street: '', city: '', state: '', pincode: '' },
        is_active: true,
        is_verified: false,
        is_open: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: vendor }, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ success: false, error: 'Failed to create store' }, { status: 500 });
  }
}

// PUT /api/seller/store - Update seller store
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'vendor') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();
    const body = await request.json();

    const { data: vendor, error: findError } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', session.user.id)
      .single();

    if (findError || !vendor) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.storeName) updateData.store_name = body.storeName;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.phone) updateData.phone = body.phone;
    if (body.email) updateData.email = body.email;
    if (body.category) updateData.category = body.category;
    if (body.address) updateData.address = body.address;
    if (body.logo) updateData.logo = body.logo;
    if (body.coverImage) updateData.cover_image = body.coverImage;
    if (body.isOpen !== undefined) updateData.is_open = body.isOpen;
    if (body.deliveryRadius) updateData.delivery_radius = body.deliveryRadius;
    if (body.minOrderAmount !== undefined) updateData.min_order_amount = body.minOrderAmount;
    if (body.deliveryFee !== undefined) updateData.delivery_fee = body.deliveryFee;
    if (body.openingHours) updateData.opening_hours = body.openingHours;
    if (body.bankDetails) updateData.bank_details = body.bankDetails;

    const { data: updated, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', vendor.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json({ success: false, error: 'Failed to update store' }, { status: 500 });
  }
}
