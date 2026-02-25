-- ============ DATABASE SCHEMA FOR ORDERWALA ============

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_picture_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'customer', -- customer, vendor, delivery, admin
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_role (role)
);

-- ============ CUSTOMERS TABLE ============
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender VARCHAR(20),
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  preferred_language VARCHAR(20) DEFAULT 'en',
  notification_preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);

-- ============ ADDRESSES TABLE ============
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_type VARCHAR(50), -- home, work, other
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  full_name VARCHAR(100),
  phone_number VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_coordinates (latitude, longitude)
);

-- ============ VENDORS TABLE ============
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_category VARCHAR(100),
  description TEXT,
  logo_url VARCHAR(500),
  banner_url VARCHAR(500),
  business_license VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_open BOOLEAN DEFAULT TRUE,
  opening_time TIME,
  closing_time TIME,
  minimum_order_value DECIMAL(8, 2) DEFAULT 0,
  delivery_fee DECIMAL(8, 2) DEFAULT 0,
  commission_percentage DECIMAL(5, 2) DEFAULT 10,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  average_delivery_time INT DEFAULT 30,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  visibility_radius_km INT DEFAULT 5,
  upi_id VARCHAR(100),
  bank_account_number VARCHAR(50),
  bank_ifsc_code VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_category (business_category),
  INDEX idx_coordinates (latitude, longitude),
  INDEX idx_status (status)
);

-- ============ CATEGORIES TABLE ============
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE,
  icon_url VARCHAR(500),
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
);

-- ============ PRODUCTS TABLE ============
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(8, 2) NOT NULL,
  rating DECIMAL(3, 2) DEFAULT 0,
  image_url VARCHAR(500),
  preparation_time INT DEFAULT 15, -- in minutes
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  stock_quantity INT DEFAULT 999,
  tags JSON, -- ["spicy", "vegan", etc]
  customizations JSON, -- sizes, toppings, etc
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_until TIMESTAMP,
  total_sold INT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_category_id (category_id),
  INDEX idx_is_available (is_available),
  INDEX idx_featured (is_featured)
);

-- ============ CART TABLE ============
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  selected_customizations JSON,
  special_instructions TEXT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_vendor_id (vendor_id),
  UNIQUE KEY unique_cart_item (user_id, vendor_id, product_id)
);

-- ============ ORDERS TABLE ============
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  delivery_partner_id UUID REFERENCES users(id),
  delivery_address_id UUID REFERENCES addresses(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, preparing, ready, picked_up, on_the_way, delivered, cancelled
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  payment_method VARCHAR(50), -- upi, card, wallet, cod
  subtotal DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  delivery_fee DECIMAL(8, 2),
  discount_amount DECIMAL(8, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2),
  delivery_time INT, -- estimated delivery time in minutes
  special_instructions TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  picked_up_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_id (customer_id),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_coordinates (latitude, longitude)
);

-- ============ ORDER ITEMS TABLE ============
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(8, 2),
  selected_customizations JSON,
  special_instructions TEXT,
  subtotal DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id)
);

-- ============ REVIEWS TABLE ============
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  images JSON, -- array of image URLs
  helpful_count INT DEFAULT 0,
  unhelpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_reviewer_id (reviewer_id),
  INDEX idx_order_id (order_id)
);

-- ============ DELIVERY PARTNERS TABLE ============
CREATE TABLE IF NOT EXISTS delivery_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50), -- bike, scooter, cycle, car
  vehicle_number VARCHAR(50),
  license_number VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'offline', -- online, offline, on_delivery
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  total_deliveries INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  is_available_for_orders BOOLEAN DEFAULT TRUE,
  bank_account_number VARCHAR(50),
  bank_ifsc_code VARCHAR(20),
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_coordinates (current_latitude, current_longitude)
);

-- ============ DELIVERY TRACKING TABLE ============
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_partner_id UUID NOT NULL REFERENCES delivery_partners(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id)
);

-- ============ PROMOS TABLE ============
CREATE TABLE IF NOT EXISTS promos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(50), -- percentage, fixed
  discount_value DECIMAL(8, 2),
  max_discount_amount DECIMAL(10, 2),
  min_order_value DECIMAL(10, 2) DEFAULT 0,
  usage_limit INT,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  applicable_categories JSON, -- null = all categories
  applicable_vendors JSON, -- null = all vendors
  created_by_vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_is_active (is_active)
);

-- ============ FAVORITES TABLE ============
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (user_id, vendor_id),
  INDEX idx_user_id (user_id)
);

-- ============ WALLETS TABLE ============
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) DEFAULT 0,
  total_credited DECIMAL(12, 2) DEFAULT 0,
  total_debited DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);

-- ============ WALLET TRANSACTIONS TABLE ============
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type VARCHAR(50), -- credit, debit
  amount DECIMAL(10, 2),
  transaction_type VARCHAR(100), -- refund, cashback, promo, order_payment
  description TEXT,
  reference_id VARCHAR(255), -- order_id, payment_id, etc
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wallet_id (wallet_id),
  INDEX idx_type (type)
);

-- ============ NOTIFICATIONS TABLE ============
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100), -- order_update, promo, delivery_alert, etc
  title VARCHAR(255),
  message TEXT,
  data JSON,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_read (read),
  INDEX idx_created_at (created_at)
);

-- ============ PAYMENTS TABLE ============
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  payment_method VARCHAR(50),
  payment_gateway VARCHAR(100), -- razorpay, stripe, upi
  gateway_transaction_id VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50), -- pending, completed, failed, refunded
  metadata JSON,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- ============ OTP TABLE ============
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_or_phone VARCHAR(255),
  otp_code VARCHAR(6),
  type VARCHAR(50), -- signup, login, password_reset
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_phone (email_or_phone),
  INDEX idx_expires_at (expires_at)
);

-- ============ ADMIN DASHBOARD TABLE ============
CREATE TABLE IF NOT EXISTS admin_dashboard_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE,
  total_orders INT DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_users INT DEFAULT 0,
  total_vendors INT DEFAULT 0,
  total_delivery_partners INT DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_date (date)
);

-- ============ INDEXES ============

-- Create some common indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_vendor_available ON products(vendor_id, is_available);
CREATE INDEX IF NOT EXISTS idx_cart_vendor_user ON cart_items(vendor_id, user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id, timestamp DESC);

-- ============ VIEWS ============

-- Active vendors view
CREATE OR REPLACE VIEW active_vendors AS
SELECT v.*, u.email, u.phone, u.first_name, u.last_name
FROM vendors v
JOIN users u ON v.user_id = u.id
WHERE v.status = 'active' AND u.status = 'active';

-- Popular products view
CREATE OR REPLACE VIEW popular_products AS
SELECT p.*, v.business_name
FROM products p
JOIN vendors v ON p.vendor_id = v.id
WHERE p.is_available = TRUE
ORDER BY p.total_sold DESC, p.rating DESC;

-- Recent orders view
CREATE OR REPLACE VIEW recent_orders AS
SELECT o.*, c.user_id as customer_user_id, v.business_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN vendors v ON o.vendor_id = v.id
ORDER BY o.created_at DESC;

-- ============ TRIGGERS ============

-- Trigger to update product rating on new review
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET rating = (
    SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE product_id = NEW.product_id
  ],
  total_reviews = (
    SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id
  )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_rating
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();

-- Trigger to update vendor rating
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors
  SET rating = (
    SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE vendor_id = NEW.vendor_id
  )
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_rating
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating();

-- Trigger to create wallet on user signup
CREATE OR REPLACE FUNCTION create_wallet_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'customer' THEN
    INSERT INTO wallets (user_id, balance) VALUES (NEW.id, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_wallet_on_signup
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_wallet_on_signup();
