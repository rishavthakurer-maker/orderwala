-- Order Wala Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMS
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'vendor', 'delivery');
CREATE TYPE vendor_category AS ENUM ('restaurant', 'grocery', 'meat', 'vegetables', 'general');
CREATE TYPE payment_method AS ENUM ('cod', 'online', 'wallet');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered', 'cancelled');
CREATE TYPE promo_discount_type AS ENUM ('percentage', 'fixed');
CREATE TYPE address_type AS ENUM ('home', 'work', 'other');

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash TEXT,
  image TEXT,
  role user_role DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  wallet_balance DECIMAL(10, 2) DEFAULT 0,
  fcm_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(60) UNIQUE NOT NULL,
  description VARCHAR(200),
  image TEXT NOT NULL,
  icon TEXT,
  parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors Table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_name VARCHAR(100) NOT NULL,
  slug VARCHAR(110) UNIQUE NOT NULL,
  description TEXT,
  logo TEXT NOT NULL,
  cover_image TEXT,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address JSONB NOT NULL,
  category vendor_category NOT NULL,
  cuisines TEXT[],
  delivery_radius DECIMAL(5, 2) DEFAULT 5,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  commission_rate DECIMAL(5, 2) DEFAULT 10,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  is_open BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  opening_hours JSONB DEFAULT '[]'::jsonb,
  bank_details JSONB,
  documents JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  description TEXT,
  images TEXT[] NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  unit VARCHAR(20) DEFAULT 'piece',
  stock INTEGER DEFAULT 0,
  min_order_qty INTEGER DEFAULT 1,
  max_order_qty INTEGER DEFAULT 10,
  variants JSONB,
  tags TEXT[],
  is_veg BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,
  preparation_time INTEGER,
  nutrition_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(30) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  delivery_partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  promo_code VARCHAR(50),
  payment_method payment_method DEFAULT 'cod',
  payment_status payment_status DEFAULT 'pending',
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  status order_status DEFAULT 'pending',
  status_history JSONB DEFAULT '[]'::jsonb,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  delivery_instructions TEXT,
  cancel_reason TEXT,
  cancelled_by VARCHAR(20),
  delivery_partner_location JSONB,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,
  vendor_earnings DECIMAL(10, 2) DEFAULT 0,
  delivery_earnings DECIMAL(10, 2) DEFAULT 0,
  platform_earnings DECIMAL(10, 2) DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses Table
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type address_type DEFAULT 'home',
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  street TEXT NOT NULL,
  landmark TEXT,
  city VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites Table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promo Codes Table
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  discount_type promo_discount_type NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2),
  usage_limit INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  applicable_categories UUID[],
  applicable_vendors UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP Verifications Table
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20),
  email VARCHAR(255),
  otp VARCHAR(6) NOT NULL,
  type VARCHAR(50) DEFAULT 'phone_verification',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  reset_token VARCHAR(64),
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet Transactions Table
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  reference_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_category_id);

CREATE INDEX idx_vendors_owner ON vendors(owner_id);
CREATE INDEX idx_vendors_slug ON vendors(slug);
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);

CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_delivery_partner ON orders(delivery_partner_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);

CREATE INDEX idx_addresses_user ON addresses(user_id);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_otp_phone ON otp_verifications(phone);
CREATE INDEX idx_otp_email ON otp_verifications(email);
CREATE INDEX idx_otp_type ON otp_verifications(type);

CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - allow service role full access)
-- These can be customized based on your security needs

-- Categories: Public read, admin write
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Categories are editable by service role" ON categories FOR ALL USING (auth.role() = 'service_role');

-- Products: Public read if active, vendor owner can edit
CREATE POLICY "Products are viewable by everyone if active" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Products are editable by service role" ON products FOR ALL USING (auth.role() = 'service_role');

-- Vendors: Public read if active
CREATE POLICY "Vendors are viewable by everyone if active" ON vendors FOR SELECT USING (is_active = true);
CREATE POLICY "Vendors are editable by service role" ON vendors FOR ALL USING (auth.role() = 'service_role');

-- Users: Service role only
CREATE POLICY "Users are managed by service role" ON users FOR ALL USING (auth.role() = 'service_role');

-- Orders: Service role only (auth handled in API)
CREATE POLICY "Orders are managed by service role" ON orders FOR ALL USING (auth.role() = 'service_role');

-- Addresses: Service role only
CREATE POLICY "Addresses are managed by service role" ON addresses FOR ALL USING (auth.role() = 'service_role');

-- Favorites: Service role only
CREATE POLICY "Favorites are managed by service role" ON favorites FOR ALL USING (auth.role() = 'service_role');

-- Reviews: Public read, service role write
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Reviews are editable by service role" ON reviews FOR ALL USING (auth.role() = 'service_role');

-- Promo Codes: Service role only
CREATE POLICY "Promo codes are managed by service role" ON promo_codes FOR ALL USING (auth.role() = 'service_role');

-- Notifications: Service role only
CREATE POLICY "Notifications are managed by service role" ON notifications FOR ALL USING (auth.role() = 'service_role');

-- OTP: Service role only
CREATE POLICY "OTP are managed by service role" ON otp_verifications FOR ALL USING (auth.role() = 'service_role');

-- Wallet: Service role only
CREATE POLICY "Wallet transactions are managed by service role" ON wallet_transactions FOR ALL USING (auth.role() = 'service_role');

-- INSERT SAMPLE DATA

-- Insert sample categories
INSERT INTO categories (name, slug, description, image, sort_order) VALUES
('Vegetables', 'vegetables', 'Fresh vegetables from local farms', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', 1),
('Fruits', 'fruits', 'Fresh seasonal fruits', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400', 2),
('Meat & Fish', 'meat-fish', 'Fresh meat and seafood', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400', 3),
('Dairy & Eggs', 'dairy-eggs', 'Milk, cheese, eggs and more', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400', 4),
('Groceries', 'groceries', 'Daily essentials and staples', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', 5),
('Snacks', 'snacks', 'Chips, namkeen and more', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400', 6),
('Beverages', 'beverages', 'Drinks and juices', 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400', 7);

-- Insert admin user (password: admin123)
INSERT INTO users (name, email, phone, password_hash, role, is_verified, is_active) VALUES
('Admin User', 'admin@orderwala.com', '9999999999', '$2b$10$2HtrfLlrbla9/24XlxjZvecXuk30Aw79RAdo7UhrwSspGjZ.4u7aW', 'admin', true, true);

-- Insert sample vendor owner
INSERT INTO users (id, name, email, phone, role, is_verified, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Fresh Mart Owner', 'vendor@freshmart.com', '9876543210', 'vendor', true, true);

-- Insert sample customer
INSERT INTO users (id, name, email, phone, role, is_verified, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'Test Customer', 'customer@test.com', '9876543211', 'customer', true, true);

-- Insert sample delivery partner
INSERT INTO users (id, name, email, phone, role, is_verified, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'Delivery Partner', 'delivery@test.com', '9876543212', 'delivery', true, true);

-- Get category IDs for vendor insertion
DO $$
DECLARE
  veg_cat_id UUID;
  grocery_cat_id UUID;
  vendor_id UUID;
BEGIN
  SELECT id INTO veg_cat_id FROM categories WHERE slug = 'vegetables' LIMIT 1;
  SELECT id INTO grocery_cat_id FROM categories WHERE slug = 'groceries' LIMIT 1;

  -- Insert sample vendor
  INSERT INTO vendors (id, owner_id, store_name, slug, description, logo, phone, address, category, delivery_radius, min_order_amount, delivery_fee, is_open, is_verified, is_active)
  VALUES (
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440001',
    'Fresh Mart',
    'fresh-mart',
    'Your one-stop shop for fresh vegetables and groceries',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
    '9876543210',
    '{"street": "Main Market", "city": "Patna", "state": "Bihar", "pincode": "800001", "coordinates": {"lat": 25.6093, "lng": 85.1237}}',
    'grocery',
    10,
    100,
    25,
    true,
    true,
    true
  ) RETURNING id INTO vendor_id;

  -- Insert sample products
  INSERT INTO products (vendor_id, category_id, name, slug, description, images, price, discount_price, unit, stock, is_veg, is_available, is_active) VALUES
  (vendor_id, veg_cat_id, 'Fresh Tomatoes', 'fresh-tomatoes', 'Farm fresh red tomatoes', ARRAY['https://images.unsplash.com/photo-1546470427-227c7369a9b9?w=400'], 40, 35, 'kg', 100, true, true, true),
  (vendor_id, veg_cat_id, 'Green Capsicum', 'green-capsicum', 'Fresh green bell peppers', ARRAY['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400'], 60, NULL, 'kg', 50, true, true, true),
  (vendor_id, veg_cat_id, 'Onions', 'onions', 'Fresh red onions', ARRAY['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400'], 30, 25, 'kg', 200, true, true, true),
  (vendor_id, veg_cat_id, 'Potatoes', 'potatoes', 'Fresh potatoes', ARRAY['https://images.unsplash.com/photo-1518977676601-b53f82ber91e?w=400'], 25, NULL, 'kg', 300, true, true, true),
  (vendor_id, grocery_cat_id, 'Basmati Rice', 'basmati-rice', 'Premium aged basmati rice', ARRAY['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'], 150, 130, 'kg', 100, true, true, true),
  (vendor_id, grocery_cat_id, 'Toor Dal', 'toor-dal', 'Premium quality toor dal', ARRAY['https://images.unsplash.com/photo-1585996939674-66d6db87e0b7?w=400'], 120, NULL, 'kg', 80, true, true, true);
END $$;

-- Insert sample promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, valid_from, valid_until) VALUES
('WELCOME50', 'Get 50% off on your first order', 'percentage', 50, 200, 100, 1000, NOW(), NOW() + INTERVAL '30 days'),
('FLAT100', 'Flat Rs.100 off on orders above Rs.500', 'fixed', 100, 500, NULL, 500, NOW(), NOW() + INTERVAL '30 days');

COMMIT;
