# Orderwala Backend API

Complete Node.js/Express REST API backend for the Orderwala food delivery platform with Supabase PostgreSQL database, real-time WebSocket updates, payment integration, and all microservices.

## 🌟 Features

✅ **Authentication**
- Sign up / Login with email & password
- OTP-based login
- JWT token-based auth
- Role-based access control (customer, vendor, delivery, admin)
- Refresh token mechanism

✅ **Product Management**
- Browse products by category
- Product search and filtering
- Create/edit products (vendors)
- Availability management
- Customizable items (sizes, toppings, etc)
- Product ratings & reviews

✅ **Order Management**
- Create orders
- Real-time order status tracking
- Order history
- Order cancellation
- Special instructions

✅ **Cart & Checkout**
- Add/remove items
- Cart persistence
- Apply promo codes
- Calculate delivery fees
- Multiple vendor support

✅ **Payment Processing**
- Razorpay integration
- Multiple payment methods (UPI, Cards, Wallets)
- Payment verification
- Refund handling
- Digital wallet with top-up

✅ **Delivery Features**
- Real-time delivery tracking (WebSocket)
- Delivery partner assignment
- Location-based vendor search
- Distance/ETA calculation
- Delivery earnings tracking

✅ **Vendor Features**
- Dashboard with analytics
- Order management
- Earnings tracking
- Product catalog management
- Performance ratings

✅ **Real-time Features**
- WebSocket for order updates
- Live delivery location tracking
- Push notifications
- Chat/messaging (extensible)

✅ **Maps Integration**
- Google Maps API integration
- Nearby vendor search
- Address geocoding
- Route optimization

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express server entry point
│   ├── routes/                # API route handlers
│   │   ├── auth.ts            # Authentication endpoints
│   │   ├── products.ts        # Product endpoints
│   │   ├── orders.ts          # Order endpoints
│   │   ├── vendors.ts         # Vendor endpoints
│   │   ├── delivery.ts        # Delivery tracking
│   │   ├── payments.ts        # Payment processing
│   │   ├── cart.ts            # Shopping cart
│   │   ├── users.ts           # User profiles
│   │   └── ...
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts            # JWT authentication
│   │   └── errorHandler.ts    # Error handling
│   ├── controllers/           # Business logic
│   ├── models/                # Data models
│   ├── config/
│   │   └── database.ts        # Supabase config
│   └── utils/
│       └── otp.ts             # OTP utilities
├── database/
│   └── schema.sql             # PostgreSQL schema
├── Dockerfile                 # Docker image
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── BACKEND_SETUP.md          # Setup guide
└── .env.example              # Environment variables
```

---

## 🚀 Installation & Setup

### 1. Prerequisites
```bash
# Check Node.js version
node --version   # Should be 18+

# Install dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy env template
cp .env.example .env

# Edit .env with your credentials
# Add: SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, etc
```

### 3. Database Setup
```bash
# Run migrations
npm run migrate

# Or manually run schema in Supabase SQL editor
# Copy database/schema.sql content to Supabase → SQL Editor
```

### 4. Start Development Server
```bash
# Start with hot reload
npm run dev

# API will be available at http://localhost:5000
```

### 5. Test API
```bash
# Health check
curl http://localhost:5000/api/health

# See BACKEND_SETUP.md for detailed API documentation
```

---

## 📚 API Documentation

### Authentication Endpoints

**Sign Up**
```bash
POST /api/auth/signup
Body: { email, phone, password, first_name, last_name, role }
```

**Login**
```bash
POST /api/auth/login
Body: { email, password }
```

**Send OTP**
```bash
POST /api/auth/send-otp
Body: { email_or_phone }
```

**Verify OTP Login**
```bash
POST /api/auth/verify-otp-login
Body: { email_or_phone, otp }
```

### Product Endpoints

**Get Products**
```bash
GET /api/products?category=uuid&search=name&page=1&limit=20
```

**Get Product Details**
```bash
GET /api/products/:id
```

**Create Product** (Vendor)
```bash
POST /api/products
Headers: { Authorization: "Bearer token" }
Body: { name, category_id, price, description, image_url }
```

### Order Endpoints

**Get Orders**
```bash
GET /api/orders
Headers: { Authorization: "Bearer token" }
```

**Create Order**
```bash
POST /api/orders
Headers: { Authorization: "Bearer token" }
Body: { vendor_id, items, delivery_address, payment_method }
```

**Get Order Status**
```bash
GET /api/orders/:id
Headers: { Authorization: "Bearer token" }
```

### More endpoints documented in [BACKEND_SETUP.md](./BACKEND_SETUP.md)

---

## 🔐 Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer your_jwt_token
```

Roles & Permissions:
- **customer**: Place orders, view history, manage addresses
- **vendor**: Manage products, view orders, see earnings
- **delivery**: View assigned orders, update location
- **admin**: Full system access, view analytics

---

## 💳 Payment Setup

### Razorpay Configuration

1. **Get API Keys**
   - Go to https://razorpay.com/dashboard
   - Settings → API Keys
   - Copy Key ID and Secret

2. **Add to .env**
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_SECRET_KEY=your_secret
   ```

3. **Webhook Setup**
   - Add webhook at: Settings → Webhooks
   - URL: https://your-api.com/api/payments/razorpay/webhook
   - Events: payment.authorized, payment.failed

---

## 📱 Real-time Features (WebSocket)

### Order Tracking
```javascript
// Client side
socket.emit('join_order', orderId);
socket.on('order_status_updated', (data) => console.log(data));
```

### Delivery Location
```javascript
// Delivery partner sends location
socket.emit('delivery_location', { deliveryId, lat, lng });

// Customer receives updates
socket.on('delivery_location_updated', (location) => {
  // Update map
});
```

---

## 🐳 Docker Deployment

### Build & Run
```bash
# Build image
docker build -t orderwala-backend .

# Run container
docker run -p 5000:5000 \
  -e SUPABASE_URL=... \
  -e SUPABASE_SERVICE_KEY=... \
  orderwala-backend
```

### Docker Compose
```bash
# Start all services (DB, Redis, Backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

---

## 🚀 Production Deployment

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 orderwala --region ap-south-1

# Create environment
eb create orderwala-prod --instance-type t3.medium

# Set environment variables
eb setenv NODE_ENV=production SUPABASE_URL=... JWT_SECRET=...

# Deploy
eb deploy

# Monitor
eb health
eb logs
```

### Environment Variables (Production)
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- JWT_SECRET (40+ random chars)
- RAZORPAY_KEY_ID & SECRET
- GOOGLE_MAPS_API_KEY
- All external service credentials

---

## 📊 Database Schema

Tables:
- `users` - User accounts
- `customers` - Customer profiles
- `vendors` - Restaurant/vendor info
- `products` - Menu items
- `orders` - Customer orders
- `cart_items` - Shopping cart
- `payments` - Payment records
- `delivery_partners` - Delivery agents
- `reviews` - Ratings & reviews
- `wallets` - Digital wallets
- `notifications` - User notifications
- And more...

See `database/schema.sql` for complete schema.

---

## 🧪 Testing

### API Testing
```bash
# Using Postman: Import postman-collection.json

# Using cURL
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Using Thunder Client (VS Code)
# Install extension and import collection
```

### Unit Tests
```bash
npm test
```

---

## 🔍 Monitoring & Logging

- **Morgan**: HTTP request logging
- **Sentry**: Error tracking (optional)
- **Application Logs**: `logs/app.log`

Set log level in .env:
```
LOG_LEVEL=info  # debug, info, warn, error
```

---

## 📖 Documentation

- [Full Setup Guide](./BACKEND_SETUP.md)
- [Supabase Docs](https://supabase.com/docs)
- [Express.js Docs](https://expressjs.com/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Razorpay Docs](https://razorpay.com/docs/)

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -m "Add new feature"`
3. Push to branch: `git push origin feature/new-feature`
4. Submit pull request

---

## 📝 License

ISC License - See LICENSE file

---

## 💬 Support

- Email: support@orderwala.in
- Issues: GitHub Issues
- Docs: https://orderwala.in/docs/backend
