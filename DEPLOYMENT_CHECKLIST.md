# Complete Deployment Checklist for Orderwala

## Phase 1: Pre-Deployment Setup ✅

### 1. Domain Registration
- [ ] Buy domain: **orderwala.in** from Namecheap/GoDaddy
- [ ] Domain registrar: ___________
- [ ] Domain registrar account created
- [ ] Domain DNS access verified

### 2. Cloud Services Setup

#### Supabase (PostgreSQL Database)
- [ ] Create Supabase project: https://app.supabase.com
- [ ] Project URL: ___________
- [ ] Anon Key: ___________
- [ ] Service Role Key: ___________
- [ ] Database schema created (see schema.sql)
- [ ] Enable RLS (Row Level Security) on tables
- [ ] Create database backups policy

#### Firebase (Real-time Sync)
- [ ] Create Firebase project: https://console.firebase.google.com
- [ ] Download service account key
- [ ] Enable Firestore
- [ ] Enable Firebase Auth
- [ ] Enable Cloud Messaging for notifications

#### AWS Account
- [ ] Create AWS account: https://aws.amazon.com
- [ ] Create IAM user with EB permissions
- [ ] Create S3 bucket for backups
- [ ] Configure CloudFront CDN

#### MongoDB (Optional - for sessions)
- [ ] Create MongoDB Atlas cluster: https://www.mongodb.com/cloud
- [ ] Connection string: ___________
- [ ] Create database: `orderwala_db`

### 3. Payment Gateway Setup

#### Razorpay
- [ ] Create Razorpay account: https://razorpay.com
- [ ] Business KYC verified
- [ ] Razorpay Key ID: ___________
- [ ] Razorpay Secret: ___________
- [ ] Enable all payment methods (UPI, Cards, Wallets)
- [ ] Webhook configured for orderwala.in

#### Stripe (Optional)
- [ ] Create Stripe account: https://stripe.com
- [ ] Publishable Key: ___________
- [ ] Secret Key: ___________
- [ ] Webhook configured

### 4. External Services

#### Twilio (OTP)
- [ ] Create Twilio account
- [ ] Account SID: ___________
- [ ] Auth Token: ___________
- [ ] Verify Indian phone numbers

#### Cloudinary (Image Storage)
- [ ] Create Cloudinary account: https://cloudinary.com
- [ ] Cloud Name: ___________
- [ ] API Key: ___________
- [ ] API Secret: ___________

#### Google Maps
- [ ] Enable Google Maps API: https://console.cloud.google.com
- [ ] API Key: ___________
- [ ] Enable: Maps, Directions, Places APIs

#### SendGrid / Gmail (Email)
- [ ] Email service configured
- [ ] SMTP credentials added
- [ ] Email templates created

## Phase 2: Code Preparation ✅

### 5. Frontend Code
- [ ] All environment variables in .env.local
- [ ] .env.production created for production values
- [ ] vercel.json configured
- [ ] README.md updated
- [ ] next.config.ts optimized for production
- [ ] No hardcoded URLs (use env variables)
- [ ] API calls use NEXT_PUBLIC_API_URL
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] No console.logs in production code
- [ ] TypeScript compilation passes
- [ ] ESLint checks pass

### 6. Backend Code
- [ ] Backend server created (Express/NestJS)
- [ ] All API routes implemented
- [ ] Authentication middleware added
- [ ] Error handling middleware added
- [ ] Rate limiting configured
- [ ] CORS properly configured for orderwala.in
- [ ] Database migrations created
- [ ] Input validation with Zod/Joi
- [ ] Security headers added
- [ ] Logging configured (Winston/Bunyan)
- [ ] Tests written and passing
- [ ] Production build tested locally

### 7. Database
- [ ] Supabase schema created (schema.sql)
- [ ] All tables created
- [ ] Foreign keys configured
- [ ] Indexes created for performance
- [ ] RLS policies created
- [ ] Sample data inserted for testing
- [ ] Backup strategy configured
- [ ] Database connection pooling configured

### 8. Git & GitHub
- [ ] Repository created: github.com/username/orderwala
- [ ] Main branch protected (require PR reviews)
- [ ] Develop branch for staging
- [ ] .gitignore includes .env* files
- [ ] GitHub Actions workflows created
- [ ] Secrets added to GitHub (VERCEL_TOKEN, AWS keys, etc.)

## Phase 3: Deployment ✅

### 9. Vercel Deployment (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Link to domain
# Go to Vercel dashboard → Settings → Domains → Add orderwala.in
```

Checklist:
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Project imported from GitHub
- [ ] Environment variables added in Vercel dashboard
- [ ] Production build succeeds
- [ ] Domain connected in Vercel
- [ ] SSL certificate auto-installed
- [ ] GitHub push triggers auto-deployment

### 10. AWS Elastic Beanstalk Deployment (Backend)
```bash
# Install EB CLI
pip install awsebcli

# Configure AWS credentials
aws configure

# Initialize Elastic Beanstalk
eb init -p node.js-18 orderwala-backend --region ap-south-1

# Create production environment
eb create orderwala-prod \
  --instance-type t3.medium \
  --envvars NODE_ENV=production,SUPABASE_URL=...,etc

# Deploy
eb deploy

# Monitor
eb health
eb logs
```

Checklist:
- [ ] AWS Elastic Beanstalk environment created
- [ ] Environment variables configured in EB
- [ ] Auto-scaling configured (min 2, max 6 instances)
- [ ] Security groups configured
- [ ] RDS database EB security group associated with
- [ ] Application health check configured
- [ ] CloudWatch monitoring enabled
- [ ] Application Load Balancer (ALB) configured

### 11. Database Deployment
- [ ] Supabase:
  - [ ] Database created
  - [ ] Schema imported (psql < schema.sql)
  - [ ] Backups enabled
  - [ ] Point-in-time recovery enabled
  
- [ ] Firebase:
  - [ ] Project created
  - [ ] Firestore database initialized
  - [ ] Security rules configured
  - [ ] Indexes created

### 12. DNS Configuration
```
At your domain registrar (Namecheap/GoDaddy):

A Record:
  Name: @
  Type: A
  Value: [Vercel IP - 76.76.19.163]
  TTL: 3600

CNAME Record:
  Name: www
  Type: CNAME
  Value: cname.vercel-dns.com
  TTL: 3600

MX Record (for email):
  Name: @
  Type: MX
  Value: mx.google.com (or SendGrid)
  Priority: 10
  TTL: 3600

TXT Record (SPF):
  Name: @
  Type: TXT
  Value: v=spf1 include:sendgrid.net ~all
  TTL: 3600
```

Checklist:
- [ ] A record pointing to Vercel
- [ ] CNAME for www pointing to Vercel
- [ ] DNS propagation verified (dig orderwala.in)
- [ ] SSL certificate issued by Let's Encrypt
- [ ] HTTPS working (https://orderwala.in)
- [ ] Email MX records configured
- [ ] SPF/DKIM/DMARC records added

### 13. Testing

#### Frontend
```bash
cd frontend
npm run build
npm start
# Test at http://localhost:3000
```
- [ ] Homepage loads
- [ ] Navigation works
- [ ] Can browse products
- [ ] Can add to cart
- [ ] Can checkout
- [ ] Authentication works
- [ ] Admin panel accessible
- [ ] No console errors
- [ ] Mobile responsive

#### Backend
```bash
cd backend
npm start
# Test at http://localhost:3001
```
- [ ] GET /api/health returns 200
- [ ] GET /api/products returns data
- [ ] POST /api/auth/login works
- [ ] POST /api/orders creates order
- [ ] Payment webhook receives events
- [ ] Socket.io connections work
- [ ] Rate limiting works
- [ ] Error responses formatted correctly

#### Public URL Testing
- [ ] https://orderwala.in loads (might take 24-48h for DNS)
- [ ] https://api.orderwala.in/api/health works
- [ ] Checkout flow works end-to-end
- [ ] Payment test transaction succeeds
- [ ] Email notifications send
- [ ] Push notifications work (if mobile app)

### 14. Monitoring & Logging Setup
- [ ] Vercel Analytics enabled
- [ ] AWS CloudWatch configured
- [ ] Error tracking (Sentry)
- [ ] Application Performance Monitoring (New Relic/DataDog)
- [ ] Log aggregation (LogRocket/CloudWatch)
- [ ] Uptime monitoring (Pingdom/Uptime Robot)
- [ ] Alert notifications configured

### 15. Security Hardening
- [ ] SSL/TLS certificate installed
- [ ] HTTPS redirects enabled (301 from http → https)
- [ ] Security headers added (CSP, X-Frame-Options, etc.)
- [ ] CORS restricted to orderwala.in
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize HTML)
- [ ] CSRF tokens implemented
- [ ] Password hashing (bcryptjs)
- [ ] Environment variables never logged
- [ ] API keys rotated after deployment

## Phase 4: Post-Deployment ✅

### 16. Go-Live
- [ ] Team notified
- [ ] Website announcement ready
- [ ] Social media posts scheduled
- [ ] Email to users (if any)
- [ ] Status page created (status.orderwala.in)

### 17. Monitoring & Maintenance
- [ ] Daily check: website loads, API responds
- [ ] Weekly review: logs, errors, performance
- [ ] Monthly: database backups verified
- [ ] Quarterly: security updates, dependency updates
- [ ] Annual: performance optimization, scaling review

### 18. Documentation
- [ ] README.md complete with deployment instructions
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database schema documented
- [ ] Environment variables documented
- [ ] Deployment runbook created
- [ ] Disaster recovery plan documented
- [ ] Team training completed

## Phase 5: Continuous Improvement

### 19. Performance Optimization
- [ ] Page load time < 2s
- [ ] API response time < 200ms
- [ ] Database queries optimized (add indexes)
- [ ] Images optimized (Cloudinary)
- [ ] CSS/JS bundle size minimized
- [ ] Caching strategy implemented
- [ ] CDN utilized for static assets

### 20. Feature Rollout
- [ ] A/B testing for new features
- [ ] Gradual rollout (canary deployment)
- [ ] Rollback plan for each deployment
- [ ] Feature flags implemented
- [ ] Analytics tracking added

## Emergency Contacts

| Service | Contact | Status Page |
|---------|---------|------------|
| Vercel (Frontend) | support@vercel.com | https://status.vercel.com |
| AWS | AWS Support Console | https://status.aws.amazon.com |
| Supabase | support@supabase.com | https://status.supabase.com |
| Firebase | Firebase Support | https://status.firebase.google.com |
| Razorpay | support@razorpay.com | https://api.razorpay.com/status |

## Useful Commands

```bash
# Check domain DNS propagation
dig orderwala.in
nslookup orderwala.in

# Test SSL certificate
openssl s_client -connect orderwala.in:443

# Monitor Vercel deployments
vercel logs

# Check AWS EB status
eb status
eb health
eb logs

# Database backup
pg_dump -U postgres -h db.supabase.co orderwala > backup.sql

# Restore from backup
psql -U postgres -h db.supabase.co orderwala < backup.sql
```

---

## Notes

- DNS might take 24-48 hours to fully propagate
- SSL certificate auto-renews on Vercel
- Keep backup of all credentials in secure password manager
- Review logs daily in first week after deployment
- Have team on standby for updates/issues

**Deployment Status: [ ] COMPLETE**

Date Started: __________
Date Completed: __________
Deployed By: __________
