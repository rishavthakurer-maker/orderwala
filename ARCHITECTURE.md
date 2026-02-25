# Orderwala Architecture & Tech Stack Documentation

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ React.js + Next.js (SSR, ISR, Static Generation)          │ │
│  │ - Deployed on Vercel (Global CDN)                          │ │
│  │ - Domain: orderwala.in                                     │ │
│  │ - SSL/TLS via Let's Encrypt                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                   API GATEWAY LAYER                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ AWS Elastic Beanstalk (Node.js + Express)                 │ │
│  │ - Domain: api.orderwala.in                                 │ │
│  │ - Auto-scaling: 2-6 instances (t3.medium)                 │ │
│  │ - Load Balancer + CloudFront CDN                           │ │
│  │ - Socket.io for real-time updates                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────┬────────────────────────┬────────────────────┘
                   │                        │
          HTTPS    │                        │    HTTPS
                   ▼                        ▼
    ┌─────────────────────┐    ┌────────────────────────┐
    │  Supabase           │    │  Firebase              │
    │  PostgreSQL         │    │  Firestore + Auth      │
    │                     │    │  + Cloud Messaging     │
    │ Structured Data:    │    │                        │
    │ - Users             │    │ Real-time Data:        │
    │ - Orders            │    │ - Cart updates         │
    │ - Products          │    │ - Notifications        │
    │ - Providers         │    │ - Delivery tracking    │
    │ - Payments          │    │ - Chat messages        │
    │ - Reviews           │    │                        │
    └─────────────────────┘    └────────────────────────┘
                   │                        │
                   └────────────┬───────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
                    ▼                        ▼
            ┌──────────────────┐   ┌─────────────────┐
            │  Redis Cache     │   │  MongoDB        │
            │  (Session Store) │   │  (Optional)     │
            └──────────────────┘   └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend (Customer Website)
- **Framework**: React 19 + Next.js 16 with TypeScript
- **Styling**: Tailwind CSS 4 + PostCSS
- **UI Components**: Custom components + Lucide icons
- **State Management**: Zustand
- **Authentication**: Supabase Auth + Auth.js v5
- **Forms**: React Hook Form + Zod validation
- **Maps**: Google Maps React API
- **Payments**: Razorpay integration
- **Real-time**: Socket.io client
- **Deployment**: Vercel (auto CI/CD from GitHub)

### Backend APIs
- **Runtime**: Node.js 18
- **Framework**: Express.js (or NestJS for larger structure)
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod or Joi
- **Real-time**: Socket.io server
- **Database Client**: @supabase/supabase-js for PostgreSQL
- **Firebase Admin**: firebase-admin SDK
- **Payments**: Razorpay SDK
- **HTTP Client**: Axios
- **Environment**: dotenv
- **Deployment**: AWS Elastic Beanstalk

### Databases

#### Supabase (PostgreSQL) - Primary DB
- **Purpose**: Structured, relational data
- **Backup**: Automated daily backups
- **Point-in-time Recovery**: 7 days
- **Replication**: Real-time
- **Tables**:
  ```
  users (id, email, phone, name, avatar_url, address, ...)
  vendors (id, user_id, shop_name, description, avatar, ...)
  products (id, vendor_id, category_id, name, description, price, ...)
  categories (id, name, description, icon, ...)
  orders (id, user_id, vendor_id, status, total, address, ...)
  order_items (id, order_id, product_id, quantity, price, ...)
  payments (id, order_id, razor_pay_id, amount, status, ...)
  reviews (id, product_id, user_id, rating, comment, ...)
  delivery_partners (id, user_id, vehicle, status, location, ...)
  addresses (id, user_id, type, street, city, state, pincode, ...)
  promo_codes (id, code, discount, expiry, max_uses, ...)
  notifications (id, user_id, title, message, read, ...)
  ```

#### Firebase Firestore - Real-time DB
- **Purpose**: Real-time sync & ephemeral data
- **Collections**:
  ```
  cart/{userId}
    - items (real-time cart updates)
    
  deliveryTracking/{orderId}
    - current_location
    - partner_info
    - estimated_time
    
  notifications/{userId}
    - notification_list (real-time)
    
  chat/{orderId}
    - messages (real-time chat)
    
  status_updates/{orderId}
    - timeline (order status changes)
  ```

#### MongoDB (Optional)
- **Purpose**: Session storage, caching, logs
- **Collections**:
  ```
  sessions
  logs
  analytics
  ```

### External Services

#### Payment Gateway - Razorpay
- UPI, Credit/Debit Cards, Wallets
- Automatic reconciliation
- Instant settlements
- Webhook for payment updates

#### Authentication
- **Email/Phone**: Supabase Auth
- **Social Login**: Google OAuth
- **SMS OTP**: Twilio

#### Notifications
- **Push**: Firebase Cloud Messaging (FCM)
- **Email**: SendGrid / Gmail SMTP
- **SMS**: Twilio

#### Storage
- **Images**: Cloudinary CDN
- **Backups**: AWS S3
- **Static Files**: Vercel CDN

#### Mapping & Geolocation
- **Maps**: Google Maps API
- **Directions**: Google Directions API
- **Real-time Location**: WebSocket updates

### DevOps & Infrastructure

#### Container & Orchestration
- **Docker**: Multi-stage builds
- **Docker Compose**: Local development
- **AWS Elastic Beanstalk**: Production container orchestration
- **AWS ECR**: Docker image registry

#### Monitoring & Logging
- **Application Performance**: New Relic / DataDog
- **Error Tracking**: Sentry
- **Log Aggregation**: CloudWatch / LogRocket
- **Uptime Monitoring**: Pingdom / UptimeRobot

#### CI/CD Pipeline
- **Version Control**: GitHub
- **GitHub Actions**: Automated testing, building, deployment
- **Vercel**: Auto-deploy frontend on push to main
- **AWS CodePipeline**: Backend deployment (optional)

#### Infrastructure as Code
- **Vercel JSON**: Frontend configuration
- **AWS CloudFormation**: Backend infrastructure
- **.ebextensions**: EB customization
- **buildspec.yml**: CodeBuild configuration

### Security

#### Authentication & Authorization
- JWT tokens (7-day expiry)
- Refresh tokens for session management
- Row-Level Security (RLS) on Supabase
- Firebase Security Rules on Firestore

#### API Security
- HTTPS/TLS encryption
- CORS properly scoped to orderwala.in
- Rate limiting (100 req/min per IP)
- Input validation with Zod
- SQL injection prevention (parameterized queries)
- XSS prevention (HTML sanitization)
- CSRF token validation

#### Data Security
- Password hashing with bcryptjs (salt rounds: 10)
- Sensitive data encrypted at rest
- PII (Personally Identifiable Information) masked in logs
- Database access restricted via security groups

#### Secret Management
- Environment variables via .env files (development)
- GitHub Secrets for CI/CD
- AWS Secrets Manager for production credentials
- Vercel Environment Variables
- Elastic Beanstalk environment variables

## 📊 Database Schema

### Core Tables (Supabase)

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  password_hash VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  role ENUM('customer', 'vendor', 'delivery', 'admin')
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  image_url VARCHAR(500),
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  delivery_partner_id UUID REFERENCES delivery_partners(id),
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'),
  total_amount DECIMAL(10, 2),
  delivery_fee DECIMAL(10, 2),
  discount DECIMAL(10, 2),
  address TEXT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

## 🚀 Deployment Flow

```
Developer pushes code to GitHub
        ↓
GitHub Actions Workflow Triggers
        ├─ Run tests
        ├─ Type check
        ├─ Lint code
        ├─ Build project
        └─ Security scan
        ↓
     Main Branch?
      ↙          ↘
   YES            NO
    ↓              ↓
Vercel           Preview
Deploy           Deployment
(Production)     (Staging)
    ↓              ↓
orderwala.in   preview-*.vercel.app
        ↓
    LIVE! 🎉
```

## 📈 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.8s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Time to Interactive (TTI) | < 3.8s |
| API Response Time | < 200ms |
| Database Query Time | < 100ms |
| Uptime | 99.9% |

## 🔄 Data Flow Examples

### User Registration Flow
```
1. User fills form → Frontend validation (Zod)
2. Submit → POST /api/auth/register
3. Backend validates input
4. Hash password with bcryptjs
5. Create user in Supabase
6. Send verification email via SendGrid
7. Generate JWT token
8. Return token to frontend
9. Store in secure HTTP-only cookie
10. Redirect to home page
```

### Order Creation Flow
```
1. User adds items to cart (stored in Zustand + Firebase)
2. User proceeds to checkout
3. Fill delivery address
4. Select payment method
5. Frontend: POST /api/orders
6. Backend creates order in Supabase
7. Update Firebase real-time order status
8. Send order confirmation email
9. Notify vendor via Socket.io
10. Return order ID to frontend
11. Redirect to payment page
```

### Real-time Delivery Tracking
```
1. Order status changes in Supabase
2. Backend emits Socket.io event
3. Frontend receives update via Socket.io
4. Update delivery map in real-time
5. Show estimated arrival time
6. Send push notification to user (Firebase FCM)
7. Log update in Firebase Firestore
```

## 🛡️ Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use HTTPS everywhere
3. ✅ Validate all user input
4. ✅ Use prepared statements (prevent SQL injection)
5. ✅ Sanitize HTML output (prevent XSS)
6. ✅ Implement CSRF protection
7. ✅ Rate limit API endpoints
8. ✅ Hash passwords with bcryptjs
9. ✅ Use JWT with short expiry
10. ✅ Enable CORS only for orderwala.in
11. ✅ Mask sensitive data in logs
12. ✅ Regular security audits
13. ✅ Keep dependencies updated
14. ✅ Monitor for suspicious activity

## 📱 Mobile App Integration

The same backend APIs and databases work with:
- **React Native** (Android + iOS)
- **Expo** for development
- **Firebase Auth** for seamless mobile auth
- **Firebase Cloud Messaging** for push notifications

## 🎯 Next Steps

1. **Complete Development**:
   - Implement all API endpoints
   - Build React components
   - Integrate payment gateway

2. **Testing**:
   - Unit tests (Jest)
   - Integration tests (Supertest)
   - E2E tests (Playwright)
   - Load testing (Artillery)

3. **Deployment Preparation**:
   - Follow DEPLOYMENT_CHECKLIST.md
   - Set up monitoring
   - Configure backups
   - Plan disaster recovery

4. **Go-Live**:
   - Deploy to Vercel + AWS EB
   - Point domain to Vercel
   - Verify all systems
   - Monitor closely for 48 hours

5. **Post-Launch**:
   - Gather user feedback
   - Monitor performance
   - Fix bugs
   - Plan scaling
   - Add new features

---

**Document Last Updated**: February 25, 2026
**Architecture Version**: 1.0
**Status**: Ready for Production
