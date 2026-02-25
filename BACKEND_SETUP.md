# Orderwala Backend API Setup Guide

This guide helps you set up the Node.js backend for Orderwala.

## Architecture Overview

```
Frontend (React + Next.js) → Vercel
                    ↓
Backend APIs (Node.js + Express/NestJS) → AWS Elastic Beanstalk
                    ↓
        ┌───────────┴───────────┬────────────┐
        ↓                       ↓            ↓
   Supabase/PostgreSQL   Firebase/Firestore  MongoDB
   (Structured Data)     (Real-time Sync)    (Sessions)
```

## Backend Directory Structure (Recommended)

```
backend/
├── src/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── router.ts
│   │   │   ├── controller.ts
│   │   │   └── service.ts
│   │   ├── users/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── delivery/
│   │   └── vendors/
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── firebase.ts
│   │   ├── razorpay.ts
│   │   └── emailService.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Order.ts
│   │   └── Vendor.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── helpers.ts
│   └── server.ts
├── .env
├── .env.production
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Setup Steps

### 1. Initialize Backend Project

\`\`\`bash
mkdir backend
cd backend
npm init -y
npm install express cors dotenv axios socket.io @supabase/supabase-js firebase-admin razorpay jsonwebtoken bcryptjs
npm install --save-dev typescript @types/express @types/node ts-node nodemon
\`\`\`

### 2. Create Express Server

See \`backend-server-setup.md\` for complete implementation

### 3. Environment Variables

Create \`.env\`:
\`\`\`
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Payments
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret

# Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Socket.io
SOCKET_PORT=3002
\`\`\`

### 4. Deploy to AWS Elastic Beanstalk

\`\`\`bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init -p node.js-18 orderwala-backend --region ap-south-1

# Create environment
eb create orderwala-prod

# Deploy
eb deploy

# Check health
eb health
\`\`\`

### 5. Docker Setup (Optional)

\`\`\`bash
docker build -t orderwala-backend .
docker run -p 3001:3001 orderwala-backend
\`\`\`

## Key API Endpoints

```
Authentication:
- POST /api/auth/register → Register user
- POST /api/auth/login → Login
- POST /api/auth/logout → Logout
- POST /api/auth/refresh → Refresh JWT token

Products:
- GET /api/products → Get all products
- GET /api/products/:id → Get product details
- POST /api/products → Create product (vendor)
- PUT /api/products/:id → Update product
- DELETE /api/products/:id → Delete product

Orders:
- GET /api/orders → Get user orders
- POST /api/orders → Create order
- GET /api/orders/:id → Get order details
- PUT /api/orders/:id/status → Update order status

Payments:
- POST /api/payments/verify → Verify Razorpay payment
- POST /api/payments/refund → Process refund

Delivery:
- GET /api/delivery/nearby → Get nearby delivery partners
- POST /api/delivery/assign → Assign delivery partner
- PUT /api/delivery/:id/location → Update delivery location
```

## Database Schema

### Supabase Tables (PostgreSQL)

- `users` - User profiles
- `vendors` - Vendor/seller profiles
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Order records
- `order_items` - Items in orders
- `payments` - Payment records
- `delivery_partners` - Delivery personnel
- `addresses` - User addresses
- `promo_codes` - Discount codes
- `reviews` - Product reviews
- `notifications` - User notifications

### Firebase Collections (Real-time)

- `cart/{userId}` - Shopping cart
- `deliveryTracking/{orderId}` - Real-time delivery tracking
- `notifications/{userId}` - Real-time notifications
- `chat/{orderId}` - Customer-delivery chat

## Performance & Monitoring

### Caching Strategy
- Redis for session caching
- CDN for static assets
- Browser cache for images

### Monitoring Tools
- AWS CloudWatch for logs
- New Relic for APM
- Sentry for error tracking

### Load Testing
\`\`\`bash
npm install -g artillery
artillery quick --count 100 --num 10 https://api.orderwala.in/api/health
\`\`\`

## Security Best Practices

1. ✅ Use HTTPS everywhere
2. ✅ Implement rate limiting
3. ✅ Validate all inputs
4. ✅ Use environment variables for secrets
5. ✅ Implement CORS properly
6. ✅ Use JWT for authentication
7. ✅ Hash passwords with bcryptjs
8. ✅ Log all API requests
9. ✅ Implement request validation with Zod
10. ✅ Use prepared statements to prevent SQL injection

## Deployment Checklist

- [ ] Backend running locally on port 3001
- [ ] All environment variables set
- [ ] Database migrations completed
- [ ] APIs tested with Postman/Thunder Client
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Security headers added
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] AWS Elastic Beanstalk environment created
- [ ] GitHub Actions CI/CD configured
- [ ] Domain SSL certificate installed
- [ ] Database backups enabled
- [ ] Monitoring tools set up

## Useful Commands

\`\`\`bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Test
npm test

# Deploy to EB
eb deploy --message "Fix: payment API"

# View logs
eb logs
\`\`\`

## Support & Troubleshooting

- [Express.js Docs](https://expressjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [AWS Elastic Beanstalk Docs](https://docs.aws.amazon.com/elasticbeanstalk/)
- [Razorpay Docs](https://razorpay.com/docs/)
