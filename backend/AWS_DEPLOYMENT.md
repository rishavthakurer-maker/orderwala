# AWS Elastic Beanstalk Deployment Guide — Orderwala Backend

## Prerequisites

1. **AWS Account** with IAM user having these permissions:
   - `AWSElasticBeanstalkFullAccess`
   - `AmazonS3FullAccess` (for deployment artifacts)
   - `CloudWatchLogsFullAccess`

2. **AWS CLI** installed: `pip install awscli`

3. **EB CLI** installed: `pip install awsebcli`

---

## Step 1: Initial EB Setup

```bash
cd backend

# Initialize Elastic Beanstalk
eb init orderwala-backend \
  --region ap-south-1 \
  --platform "Node.js 18" \
  --keyname your-ec2-keypair

# Create the environment
eb create orderwala-backend-prod \
  --instance_type t3.micro \
  --elb-type application \
  --region ap-south-1 \
  --cname orderwala-api \
  --single    # Remove this flag for production (use load balancer)
```

---

## Step 2: Set Environment Variables

```bash
eb setenv \
  NODE_ENV=production \
  PORT=5000 \
  SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_SERVICE_KEY=your-service-role-key \
  JWT_SECRET=your-jwt-secret-min-32-chars \
  JWT_EXPIRES_IN=7d \
  FRONTEND_URL=https://orderwala.in \
  RAZORPAY_KEY_ID=rzp_live_xxxxx \
  RAZORPAY_KEY_SECRET=your-razorpay-secret \
  GOOGLE_MAPS_API_KEY=your-google-maps-key \
  CLOUDINARY_CLOUD_NAME=your-cloud-name \
  CLOUDINARY_API_KEY=your-cloudinary-key \
  CLOUDINARY_API_SECRET=your-cloudinary-secret \
  REDIS_URL="" \
  SENDGRID_API_KEY="" \
  TWILIO_SID="" \
  TWILIO_AUTH_TOKEN="" \
  TWILIO_PHONE=""
```

---

## Step 3: Deploy

```bash
# Build locally first
npm run build

# Deploy to EB
eb deploy

# Check status
eb status
eb health
```

---

## Step 4: Custom Domain (API subdomain)

1. In **Route 53** or your DNS provider, create:
   ```
   api.orderwala.in  →  CNAME  →  orderwala-api.ap-south-1.elasticbeanstalk.com
   ```

2. In **AWS Certificate Manager** (ACM), request an SSL cert for `api.orderwala.in`

3. Update `.ebextensions/01-environment.config`:
   - Replace `ACCOUNT_ID` and `CERT_ID` with your ACM certificate ARN

4. Redeploy: `eb deploy`

---

## Step 5: GitHub Actions (Automated)

The workflow at `.github/workflows/backend-deploy.yml` auto-deploys on push to `main`.

### Required GitHub Secrets:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret key |

---

## Monitoring & Logs

```bash
# View recent logs
eb logs

# Stream logs in real-time  
eb logs --stream

# Open the EB console
eb console

# SSH into the instance
eb ssh
```

---

## Scaling

```bash
# Scale to 2 instances
eb scale 2

# Update instance type
eb config
# Edit: aws:autoscaling:launchconfiguration → InstanceType
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | Check `eb logs` — likely PORT mismatch or crash |
| Health: Severe | Health check failing at `/api/health` — ensure route exists |
| WebSocket fails | Sticky sessions enabled in `.ebextensions/01-environment.config` |
| Deploy timeout | Increase `Timeout` in deployment config |
| CORS errors | Ensure `FRONTEND_URL` is set correctly |

---

## Cost Estimate (ap-south-1)

| Resource | Monthly Cost |
|----------|-------------|
| t3.micro (1 instance) | ~$7.50 |
| ALB (Application Load Balancer) | ~$18 |
| Data transfer (10GB) | ~$1 |
| CloudWatch Logs | ~$1 |
| **Total (minimal)** | **~$27/month** |

For development/testing, use `--single` (no load balancer) → **~$8/month**.
