# Orderwala Backend Setup Guide

## Overview
Complete backend API setup for Orderwala food delivery platform with Supabase PostgreSQL database, authentication, payments, real-time tracking, and all features.

---

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [API Routes](#api-routes)
5. [Authentication](#authentication)
6. [Payment Integration](#payment-integration)
7. [Real-time Features](#real-time-features)
8. [Deployment](#deployment)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase)
- Razorpay account
- Google Maps API key
- Redis (optional, for caching)

### Installation

```bash
# Clone and enter backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Set up database
npm run migrate

# Start development server
npm run dev
```

---

## 🔧 Environment Setup

Create `.env` file in backend directory:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
DATABASE_URL=postgresql://user:password@localhost:5432/orderwala

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET_KEY=your_razorpay_secret

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_key
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_secret

# Email Service
SENDGRID_API_KEY=your_sendgrid_key

# SMS Service
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Cache
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

---

## 💾 Database Setup

### 1. Create Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Enter project name: `orderwala`
4. Set password and region (Asia - Singapore)
5. Click "Create new project"

### 2. Create Tables
Run the SQL schema:

```bash
# Copy schema.sql content
psql -U postgres -d orderwala -f database/schema.sql
```

Or paste directly in Supabase SQL editor:
1. Go to SQL Editor
2. Click "New Query"
3. Paste contents of `backend/database/schema.sql`
4. Click "Run"

### 3. Get Credentials
```
Supabase Dashboard → Settings → API
- Copy project URL → SUPABASE_URL
- Copy service_role key → SUPABASE_SERVICE_KEY
```

### 4. Verify Tables Created
Run in Supabase SQL editor:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

---

## 🔐 Authentication

### User Roles
- **Customer**: Place orders, track delivery, payments
- **Vendor**: Manage products, orders, analytics
- **Delivery**: Accept orders, track location
- **Admin**: Manage system, view analytics

### Sign Up
**POST** `/api/auth/signup`

```json
{
  "email": "user@example.com",
  "phone": "+91XXXXXXXXXX",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "customer"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer"
  },
  "token": "jwt_token"
}
```

### Login
**POST** `/api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### OTP Login
**POST** `/api/auth/send-otp`
```json
{
  "email_or_phone": "user@example.com"
}
```

**POST** `/api/auth/verify-otp-login`
```json
{
  "email_or_phone": "user@example.com",
  "otp": "123456"
}
```

---

## 🛍️ API Routes

### Products
```
GET    /api/products              - List all products
GET    /api/products/:id          - Get product details
POST   /api/products              - Create product (vendor)
PUT    /api/products/:id          - Update product (vendor)
DELETE /api/products/:id          - Delete product (vendor)
```

### Orders
```
GET    /api/orders                - Get user orders
POST   /api/orders                - Create new order
GET    /api/orders/:id            - Get order details
PUT    /api/orders/:id/status     - Update order status
PUT    /api/orders/:id/cancel     - Cancel order
```

### Cart
```
GET    /api/cart                  - Get user cart
POST   /api/cart/items            - Add to cart
PUT    /api/cart/items/:id        - Update cart item
DELETE /api/cart/items/:id        - Remove from cart
DELETE /api/cart                  - Clear cart
```

### Users
```
GET    /api/users/profile         - Get user profile
PUT    /api/users/profile         - Update profile
GET    /api/users/addresses       - Get addresses
POST   /api/users/addresses       - Add address
DELETE /api/users/addresses/:id   - Delete address
```

### Vendors
```
GET    /api/vendors/dashboard     - Vendor dashboard
GET    /api/vendors/analytics     - Sales analytics
PUT    /api/vendors/profile       - Update vendor info
GET    /api/vendors/earnings      - Get earnings
GET    /api/vendors/orders        - Get vendor orders
```

### Delivery
```
GET    /api/delivery/active-orders   - Active deliveries
GET    /api/delivery/earnings        - Delivery earnings
PUT    /api/delivery/status          - Update status
POST   /api/delivery/location        - Send location
GET    /api/delivery/history         - Delivery history
```

### Payments
```
POST   /api/payments/razorpay/create-order  - Create order
POST   /api/payments/razorpay/verify        - Verify payment
GET    /api/payments/wallet                 - Get wallet
POST   /api/payments/wallet/add-money       - Top up wallet
```

### Maps
```
POST   /api/maps/nearby-vendors  - Find nearby vendors
POST   /api/maps/distance        - Calculate distance
POST   /api/maps/geocode         - Geocode address
POST   /api/maps/route           - Get delivery route
```

### Categories
```
GET    /api/categories           - Get all categories
GET    /api/categories/:id       - Get category
GET    /api/categories/:id/products - Products in category
```

### Promos
```
GET    /api/promos               - Get active promos
POST   /api/promos/validate      - Validate promo code
POST   /api/promos/apply         - Apply promo to order
```

---

## 💳 Payment Integration

### Razorpay Setup

1. **Create Razorpay Account**
   - Go to https://razorpay.com
   - Sign up and verify
   - Get API keys from Settings → API Keys

2. **Add Credentials to .env**
   ```env
   RAZORPAY_KEY_ID=Your_Key_ID
   RAZORPAY_SECRET_KEY=Your_Secret_Key
   ```

3. **Payment Flow**
   ```
   Frontend → Create Order (API) → Razorpay UI → Payment
   Frontend → Verify Payment (API) → Update Order Status
   ```

### Webhook Setup
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-api.com/api/payments/razorpay/webhook`
3. Subscribe to: `payment.authorized`, `payment.failed`

---

## 🔄 Real-time Features

### WebSocket Events

**Order Tracking**
```javascript
// Client connect to order
socket.emit('join_order', orderId);

// Receive updates
socket.on('order_status_updated', (data) => {
  // Update UI with new status
});
```

**Delivery Tracking**
```javascript
// Delivery partner send location
socket.emit('delivery_location', {
  deliveryId: 'uuid',
  lat: 28.6139,
  lng: 77.2090
});

// Customers receive location updates
socket.on('delivery_location_updated', (location) => {
  // Show on map
});
```

**Notifications**
```javascript
// Customer join notification channel
socket.emit('join_notifications', userId);

// Receive push notifications
socket.on('notification', (data) => {
  // Show notification
});
```

---

## 🚀 Deployment

### AWS Elastic Beanstalk (Recommended)

```bash
# 1. Build for production
npm run build

# 2. Create Elastic Beanstalk environment
eb create orderwala-prod --instance-type t3.medium

# 3. Set environment variables
eb setenv NODE_ENV=production SUPABASE_URL=... JWT_SECRET=...

# 4. Deploy
eb deploy

# 5. Monitor health
eb health
```

### Docker Deployment

```bash
# Build image
docker build -t orderwala-backend .

# Run container
docker run -p 5000:5000 \
  -e SUPABASE_URL=... \
  -e SUPABASE_SERVICE_KEY=... \
  orderwala-backend
```

### Environment Variables (Production)
Update in Elastic Beanstalk console:
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- JWT_SECRET (40+ character random string)
- RAZORPAY_KEY_ID & RAZORPAY_SECRET_KEY
- GOOGLE_MAPS_API_KEY
- All other external service keys

---

## 🔍 Testing API Endpoints

### Using Postman
1. Import collection: `backend/postman-collection.json`
2. Set environment variables
3. Run requests

### Using cURL
```bash
# Health check
curl http://localhost:5000/api/health

# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phone":"+919876543210","password":"SecurePass123","first_name":"John","last_name":"Doe","role":"customer"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'
```

---

## 📊 Database Queries

### Get Popular Products
```sql
SELECT p.*, v.business_name, COUNT(r.id) as review_count
FROM products p
JOIN vendors v ON p.vendor_id = v.id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, v.id
ORDER BY p.total_sold DESC
LIMIT 20;
```

### Get Top Vendors
```sql
SELECT v.*, AVG(r.rating) as avg_rating, COUNT(o.id) as total_orders
FROM vendors v
LEFT JOIN reviews r ON v.id = r.vendor_id
LEFT JOIN orders o ON v.id = o.vendor_id
GROUP BY v.id
ORDER BY avg_rating DESC, total_orders DESC
LIMIT 20;
```

### Get User Statistics
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users,
  COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
  COUNT(CASE WHEN role = 'vendor' THEN 1 END) as vendors
FROM users
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
- Check SUPABASE_URL in .env
- Verify database credentials
- Check network connectivity

### JWT Token Invalid
- Verify JWT_SECRET is consistent between frontend/backend
- Check token expiry time

### Razorpay Payment Failing
- Verify Razorpay credentials
- Check API key permissions
- Review webhook configuration

### WebSocket Connection Issues
- Check CORS settings
- Verify Socket.IO version compatibility
- Check firewall rules

---

## 📖 Documentation

- [Express.js Docs](https://expressjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Razorpay Docs](https://razorpay.com/docs/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Google Maps API](https://developers.google.com/maps)

---

## ✅ Checklist

- [ ] Clone backend code
- [ ] Install dependencies with `npm install`
- [ ] Create Supabase project
- [ ] Run database migrations
- [ ] Set up .env file with all variables
- [ ] Test API with Postman or cURL
- [ ] Verify database tables created
- [ ] Test authentication flow
- [ ] Configure Razorpay webhook
- [ ] Deploy to Elastic Beanstalk
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

---

**Support**: Contact team@orderwala.in or check docs at https://orderwala.in/docs
