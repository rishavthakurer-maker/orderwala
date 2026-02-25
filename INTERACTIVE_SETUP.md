# 🚀 INTERACTIVE SETUP GUIDE - Get All Setup Done!

## Phase 1: Collect All Required Information

Before you start adding environment variables, you need to collect credentials from these services:

### 1️⃣ Supabase (PostgreSQL Database)
**URL:** https://app.supabase.com

```
[ ] Go to your project
[ ] Click Settings → API
[ ] Copy: Project URL
    NEXT_PUBLIC_SUPABASE_URL = ____________________________
[ ] Copy: Anon (public) Key
    NEXT_PUBLIC_SUPABASE_ANON_KEY = ____________________________
[ ] Copy: Service Role Key (keep secret!)
    SUPABASE_SERVICE_ROLE_KEY = ____________________________
```

### 2️⃣ Firebase (Real-time Database & Auth)
**URL:** https://console.firebase.google.com

```
[ ] Go to your project
[ ] Click Settings → Project settings
[ ] Under "Your apps" → Web app config
[ ] Copy these values:
    NEXT_PUBLIC_FIREBASE_API_KEY = ____________________________
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = ____________________________
    NEXT_PUBLIC_FIREBASE_PROJECT_ID = ____________________________
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = ____________________________
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = ____________________________
    NEXT_PUBLIC_FIREBASE_APP_ID = ____________________________
```

### 3️⃣ Razorpay (Payments)
**URL:** https://dashboard.razorpay.com

```
[ ] Go to Settings → API Keys
[ ] Copy: Key ID (public key)
    NEXT_PUBLIC_RAZORPAY_KEY_ID = ____________________________
[ ] Copy: Key Secret (keep secret!)
    RAZORPAY_SECRET_KEY = ____________________________
```

### 4️⃣ Google OAuth (Login)
**URL:** https://console.cloud.google.com

```
[ ] Create OAuth 2.0 credentials (if not done)
[ ] Select: Web application
[ ] Add Authorized redirect URIs:
    - https://orderwala-kappa.vercel.app/api/auth/callback/google
    - https://orderwala.in/api/auth/callback/google
[ ] Copy: Client ID
    AUTH_GOOGLE_ID = ____________________________
[ ] Copy: Client Secret
    AUTH_GOOGLE_SECRET = ____________________________
```

### 5️⃣ Generate Secret Keys (Run These Commands)

```bash
# Generate JWT_SECRET (32+ characters)
openssl rand -base64 32
# Result: JWT_SECRET = ____________________________

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32
# Result: JWT_REFRESH_SECRET = ____________________________

# Generate AUTH_SECRET
openssl rand -base64 32
# Result: AUTH_SECRET = ____________________________
```

---

## Phase 2: Add Environment Variables to Vercel

**URL:** https://vercel.com/kratechsolutions-6082s-projects/orderwala/settings/environment-variables

### Instructions:
1. Click "Add New"
2. For each variable below:
   - Name: [from left side]
   - Value: [paste from above]
   - Environment: Select "Production"
   - Click "Save"

### Variables to Add:

```
Frontend URLs:
☐ NEXT_PUBLIC_SITE_URL = https://orderwala-kappa.vercel.app
☐ NEXT_PUBLIC_API_URL = https://api.orderwala.in
☐ NODE_ENV = production
☐ NEXTAUTH_URL = https://orderwala-kappa.vercel.app

Authentication:
☐ JWT_SECRET = [from step 5 above]
☐ JWT_REFRESH_SECRET = [from step 5 above]
☐ AUTH_SECRET = [from step 5 above]

Supabase (PostgreSQL):
☐ NEXT_PUBLIC_SUPABASE_URL = [from step 1]
☐ NEXT_PUBLIC_SUPABASE_ANON_KEY = [from step 1]
☐ SUPABASE_SERVICE_ROLE_KEY = [from step 1]

Firebase (Real-time):
☐ NEXT_PUBLIC_FIREBASE_API_KEY = [from step 2]
☐ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = [from step 2]
☐ NEXT_PUBLIC_FIREBASE_PROJECT_ID = [from step 2]
☐ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = [from step 2]
☐ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = [from step 2]
☐ NEXT_PUBLIC_FIREBASE_APP_ID = [from step 2]

Razorpay (Payments):
☐ NEXT_PUBLIC_RAZORPAY_KEY_ID = [from step 3]
☐ RAZORPAY_SECRET_KEY = [from step 3]

Google OAuth (Login):
☐ AUTH_GOOGLE_ID = [from step 4]
☐ AUTH_GOOGLE_SECRET = [from step 4]
☐ GOOGLE_CLIENT_ID = [same as AUTH_GOOGLE_ID]
☐ GOOGLE_CLIENT_SECRET = [same as AUTH_GOOGLE_SECRET]
```

### After Adding All Variables:

```bash
# Redeploy to use new variables
cd c:\gg\website\orderwala
vercel --prod

# Check logs
vercel logs
```

---

## Phase 3: Connect Custom Domain (orderwala.in)

**URL:** https://vercel.com/kratechsolutions-6082s-projects/orderwala/settings/domains

### Step-by-Step:

1. ☐ Click "Add Domain"
2. ☐ Enter: `orderwala.in`
3. ☐ Choose "Nameserver" option
4. ☐ You'll see 4 nameservers displayed:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
   - ns3.vercel-dns.com
   - ns4.vercel-dns.com

### Update at Your Domain Registrar:

**If using Namecheap:**
1. ☐ Login to https://www.namecheap.com/myaccount/login/
2. ☐ Go to: Domain List
3. ☐ Click: Manage (next to orderwala.in)
4. ☐ Go to: Nameservers
5. ☐ Select: "Custom DNS"
6. ☐ Enter Vercel's 4 nameservers in the fields
7. ☐ Click: Save

**If using GoDaddy:**
1. ☐ Login to https://www.godaddy.com
2. ☐ Go to: My Domains
3. ☐ Right-click orderwala.in → Manage DNS
4. ☐ Go to: Nameservers
5. ☐ Click: Change nameservers
6. ☐ Enter Vercel's 4 nameservers
7. ☐ Click: Save

### Verify DNS Propagation:

```bash
# Check if DNS is propagated (might take 5 min to 48 hours)
nslookup orderwala.in

# Should show Vercel nameservers
# If not updated yet, wait and try again
```

---

## Phase 4: Set Up GitHub for Auto-Deployment

### Step 1: Create GitHub Repository

1. ☐ Go to: https://github.com/new
2. ☐ Repository name: `orderwala`
3. ☐ Description: (optional) Order management platform
4. ☐ Public or Private: Your choice
5. ☐ Click: "Create repository"

### Step 2: Push Code to GitHub

```bash
# Navigate to project
cd c:\gg\website\orderwala

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Orderwala production deployment"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/orderwala.git

# Rename main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 3: Add GitHub Secrets

**URL:** https://github.com/YOUR_USERNAME/orderwala/settings/secrets/actions

1. ☐ Go to Settings → Secrets and variables → Actions
2. ☐ Click "New repository secret"
3. ☐ Add each secret:

```
Secret 1: VERCEL_TOKEN
   - Go to: https://vercel.com/account/tokens
   - Click: "Create token"
   - Give it a name and click: "Create"
   - Copy the token
   - Paste in GitHub secret

Secret 2: VERCEL_ORG_ID
   Value: team_sWN7yVhHMDyJePweS3A0ZgZa

Secret 3: VERCEL_PROJECT_ID
   Value: prj_VYgtylfmDjgVME6CYc2zP7znT9Ga

Secret 4: AWS_ACCESS_KEY_ID
   - Get from AWS IAM (if you have AWS account)
   - Or skip for now

Secret 5: AWS_SECRET_ACCESS_KEY
   - Get from AWS IAM (if you have AWS account)
   - Or skip for now
```

### Step 4: GitHub Actions is Ready!

Your workflows are already configured in `.github/workflows/`:
- `frontend-deploy.yml` - Auto-deploys to Vercel on push to main
- `security.yml` - Runs code quality checks

**Now every push to main will auto-deploy!**

```bash
# To test auto-deployment:
git add .
git commit -m "Test auto-deployment"
git push origin main

# Check deployment at:
# https://github.com/YOUR_USERNAME/orderwala/actions
```

---

## Phase 5: Verification & Testing

### Test 1: Environment Variables Working?

```bash
# Redeploy with variables
vercel --prod

# Check logs
vercel logs --follow

# Look for errors about missing variables
```

### Test 2: Domain Propagation

```bash
# Check DNS status
nslookup orderwala.in

# If still shows old DNS, wait and retry (up to 48 hours)

# Once propagated:
# Visit: https://orderwala.in (should work!)
```

### Test 3: Auto-Deployment Working?

```bash
# Make a small change
# git add & commit & push
git push origin main

# Check GitHub Actions:
# https://github.com/YOUR_USERNAME/orderwala/actions

# Should show workflow running → auto-deploy to Vercel
```

---

## Troubleshooting

### Issue: "Environment variables not working"
**Solution:**
- Make sure ALL variables are added in Vercel dashboard
- Redeploy: `vercel --prod`
- Check logs: `vercel logs`
- Variables starting with `NEXT_PUBLIC_` are visible in browser (normal)

### Issue: "Domain not resolving"
**Solution:**
- DNS takes 5 min to 48 hours to propagate
- Check status: `nslookup orderwala.in`
- If still old DNS, check registrar settings again
- Clear browser cache: Ctrl+Shift+Del
- Try from different device/network

### Issue: "GitHub push not triggering deployment"
**Solution:**
- Check GitHub Actions tab for errors
- Make sure VERCEL_TOKEN secret is set correctly
- On main branch? (not develop or other branch)
- Try: `git push origin main --force`

### Issue: "SSL certificate not working"
**Solution:**
- SSL auto-generates within 24-48 hours of domain connection
- Check Vercel dashboard Domains tab
- If not generating, check DNS is correct

---

## 📊 Final Checklist

```
Phase 1: Collect Information
☐ Supabase credentials collected
☐ Firebase credentials collected
☐ Razorpay credentials collected
☐ Google OAuth credentials set up
☐ Secret keys generated

Phase 2: Vercel Environment Variables
☐ All 20+ variables added to Vercel dashboard
☐ Set to "Production" environment
☐ Redeployed with: vercel --prod
☐ No errors in vercel logs

Phase 3: Custom Domain
☐ Domain added in Vercel dashboard
☐ Nameservers copied
☐ Nameservers updated at registrar
☐ DNS propagation verified (nslookup orderwala.in)
☐ Website accessible at https://orderwala.in

Phase 4: GitHub Setup
☐ Repository created on GitHub
☐ Code pushed to main branch
☐ GitHub secrets added (VERCEL_TOKEN, IDs)
☐ GitHub Actions workflows visible

Phase 5: Testing
☐ Website loads at https://orderwala-kappa.vercel.app
☐ Website loads at https://orderwala.in (after DNS)
☐ GitHub push triggers auto-deployment
☐ No errors in logs

✅ ALL DONE! Your website is live!
```

---

## ⏱️ Timeline

- **Right now:** Add environment variables (5 min) → `vercel --prod`
- **Next 2 min:** Add domain to Vercel
- **Next 2 min:** Update DNS at registrar
- **5-48 hours:** DNS propagation (website will work immediately on vercel.app)
- **Next 10 min:** GitHub setup (push code + add secrets)
- **After that:** Auto-deployment on every push!

---

## 📞 Quick Links During Setup

- Vercel Dashboard: https://vercel.com/kratechsolutions-6082s-projects/orderwala
- Vercel Env Vars: https://vercel.com/kratechsolutions-6082s-projects/orderwala/settings/environment-variables
- Vercel Domains: https://vercel.com/kratechsolutions-6082s-projects/orderwala/settings/domains
- GitHub Actions: https://github.com/YOUR_USERNAME/orderwala/actions
- GitHub Secrets: https://github.com/YOUR_USERNAME/orderwala/settings/secrets/actions

---

**Ready to get started? Follow Phase 1 first - collect all credentials!**
