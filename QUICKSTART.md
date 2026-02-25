# Quick Start Guide - Deploying Orderwala to orderwala.in

## Step 1: Buy the Domain ✅

1. Go to [Namecheap.com](https://namecheap.com) or [GoDaddy.com](https://godaddy.com)
2. Search for **orderwala.in**
3. Add to cart and complete purchase
4. Note your domain registrar username/password

## Step 2: Set Up Vercel (Frontend) 🌐

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy project
vercel --prod
# This will ask:
# - Link to account? → Yes
# - Set project name? → orderwala
# - Framework? → Next.js
# - Root directory? → ./
# - Build command? → npm run build
# - Output directory? → .next
```

### Connect Your Domain in Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select **orderwala** project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `orderwala.in`
6. Choose **Nameserver** option
7. Copy the nameserver addresses shown
8. Go to your domain registrar (Namecheap/GoDaddy)
9. Update nameservers with Vercel's nameservers

## Step 3: Set Environment Variables in Vercel

Go to Vercel Dashboard → Project Settings → Environment Variables

Add these from your `.env.production`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_SECRET_KEY
JWT_SECRET
```

## Step 4: Set Up AWS Elastic Beanstalk (Backend) 🖥️

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (ap-south-1)

# Install EB CLI
pip install awsebcli

# Navigate to backend folder
cd backend

# Initialize Elastic Beanstalk
eb init -p node.js-18 orderwala-backend --region ap-south-1

# Create production environment
eb create orderwala-prod \
  --instance-type t3.medium \
  --scale 2 \
  --envvars NODE_ENV=production,SUPABASE_URL=YOUR_URL,etc

# Deploy
eb deploy

# Monitor health
eb health
```

## Step 5: Configure DNS at Domain Registrar 📡

After Vercel confirms domain, update DNS records:

**At Namecheap/GoDaddy:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.19.163 | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |
| MX | @ | mx.google.com | 3600 |
| TXT | @ | v=spf1 include:sendgrid.net ~all | 3600 |

**Verify DNS:**
```bash
# Check DNS propagation
dig orderwala.in
nslookup orderwala.in

# Should return Vercel's IP: 76.76.19.163
```

## Step 6: Set Up GitHub Actions (Auto CI/CD) 🤖

1. Push code to GitHub: https://github.com/yourusername/orderwala
2. Go to GitHub → Settings → Secrets and variables → Actions
3. Add these secrets:
   ```
   VERCEL_TOKEN (get from https://vercel.com/account/tokens)
   VERCEL_ORG_ID
   VERCEL_PROJECT_ID
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   ```

## Step 7: Add GitHub Secrets

```bash
# Or via GitHub CLI
gh secret set VERCEL_TOKEN -b "your_token"
gh secret set AWS_ACCESS_KEY_ID -b "your_key"
gh secret set AWS_SECRET_ACCESS_KEY -b "your_secret"
```

## Step 8: Test the Deployment ✅

```bash
# Test frontend
open https://orderwala.in

# Test backend
curl https://api.orderwala.in/api/health

# Check SSL certificate
openssl s_client -connect orderwala.in:443

# Monitor logs
vercel logs
eb logs --zip  # for backend
```

## Step 9: Set Up Monitoring 📊

1. **Sentry** (error tracking):
   - Go to https://sentry.io
   - Create project
   - Add `NEXT_PUBLIC_SENTRY_DSN` to env vars

2. **Vercel Analytics**:
   - Automatic via Vercel
   - View at: https://vercel.com/dashboard/orderwala

3. **AWS CloudWatch**:
   - Automatic via Elastic Beanstalk
   - View at: AWS Console → CloudWatch

## Step 10: Enable Auto Deployment

Every time you push to `main` branch:
- GitHub Actions runs tests
- If tests pass → Auto deploy to Vercel (frontend)
- If tests pass → Auto deploy to EB (backend)

```bash
# Example workflow:
git add .
git commit -m "Add payment integration"
git push origin main
# → Automatic deployment starts! 🚀
```

## Useful Commands

```bash
# View logs
vercel logs                    # Frontend logs
eb logs --zip                  # Backend logs

# Redeploy latest version
vercel --prod                  # Frontend
eb deploy                      # Backend

# Rollback to previous version
vercel rollback                # Frontend
eb abort                       # Backend (cancel current deploy)

# SSH into EB instance (for debugging)
eb ssh

# Check domain status
dig orderwala.in               # DNS records
nslookup orderwala.in
whois orderwala.in

# Test API
curl -X GET https://api.orderwala.in/api/health
curl -X GET https://orderwala.in/api/products
```

## Troubleshooting

### Domain not working after 24 hours?
- Clear browser cache (Ctrl+Shift+Del)
- Clear DNS cache: `ipconfig /flushdns` (Windows)
- Test from different device

### 502 Bad Gateway?
- Check backend health: `eb health`
- View logs: `eb logs`
- Restart environment: `eb abort` then `eb deploy`

### SSL Certificate not issued?
- Wait 24-48 hours
- Verify domain DNS records are correct
- Check Vercel dashboard for any errors

### Environment variables not working?
- Redeploy after adding variables: `vercel --prod`
- For backend: `eb deploy`
- Verify variables exist: `eb config`

### Payment test failing?
- Check Razorpay credentials are correct
- Verify webhook URL in Razorpay dashboard
- Check that NEXT_PUBLIC_RAZORPAY_KEY_ID is public (no secret!)

## Performance Checklist

- [ ] Website loads in < 2 seconds
- [ ] API responds in < 200ms
- [ ] Images optimized (Cloudinary)
- [ ] CSS/JS minified
- [ ] Database indexes created
- [ ] Caching configured
- [ ] CDN active
- [ ] Monitoring tools set up

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secure
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CORS properly configured
- [ ] Backup strategy in place

## Next Steps

1. ✅ Domain purchased
2. ✅ Frontend deployed to Vercel
3. ✅ Backend deployed to AWS EB
4. ✅ DNS configured
5. ✅ Monitoring set up
6. ⏳ Monitor for 48 hours
7. ⏳ Optimize performance
8. ⏳ Plan mobile app launch

**🎉 You're live at orderwala.in!**

---

Need help? Check these resources:
- [Vercel Docs](https://vercel.com/docs)
- [AWS EB Docs](https://docs.aws.amazon.com/elasticbeanstalk/)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
