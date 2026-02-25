import { Router, Request, Response } from 'express';
import { AuthRequest, authMiddleware, optionalAuth } from '../middleware/auth';
import { supabase } from '../config/database';

const router = Router();

// ============ GET ALL PRODUCTS ============
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { category, vendor, search, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('products')
      .select('*,vendors(business_name)')
      .eq('is_available', true)
      .order('total_sold', { ascending: false });

    if (category) {
      query = query.eq('category_id', category);
    }
    if (vendor) {
      query = query.eq('vendor_id', vendor);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { data: products, count, error } = await query
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: products,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ GET PRODUCT BY ID ============
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*,vendors(business_name),reviews(*)')
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ CREATE PRODUCT (VENDOR ONLY) ============
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, category_id, image_url, is_vegetarian, customizations } =
      req.body;

    // Get vendor
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    if (!vendor) {
      return res.status(403).json({ success: false, message: 'Only vendors can create products' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          vendor_id: vendor.id,
          category_id,
          name,
          description,
          price,
          image_url,
          is_vegetarian,
          customizations: customizations || {},
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ UPDATE PRODUCT ============
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verify vendor ownership
    const { data: product } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', id)
      .single();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    if (!product || !vendor || product.vendor_id !== vendor.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { data: updated, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ DELETE PRODUCT ============
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify vendor ownership
    const { data: product } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', id)
      .single();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', req.userId)
      .single();

    if (!product || !vendor || product.vendor_id !== vendor.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
