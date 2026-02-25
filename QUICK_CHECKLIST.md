# 📋 QUICK SETUP CHECKLIST

## Your Project URLs
```
Vercel Dashboard: https://vercel.com/kratechsolutions-6082s-projects/orderwala
Environment Vars: https://vercel.com/kratechsolutions-6082s-projects/orderwala/settings/environment-variables
Domains Settings: https://vercel.com/kratechsolutions-6082s-projects/orderwala/settings/domains
```

## PHASE 1: COLLECT CREDENTIALS (Do This First!)

### From Supabase (https://app.supabase.com)
```
[ ] Project URL: ___________________________________
[ ] Anon Key: ______________________________________
[ ] Service Role Key: ______________________________
```

### From Firebase (https://console.firebase.google.com)
```
[ ] API Key: _______________________________________
[ ] Auth Domain: ___________________________________
[ ] Project ID: _____________________________________
[ ] Storage Bucket: _________________________________
[ ] Messaging Sender ID: ____________________________
[ ] App ID: __________________________________________
```

### From Razorpay (https://dashboard.razorpay.com)
```
[ ] Key ID: __________________________________________
[ ] Key Secret: ______________________________________
```

### From Google Cloud (https://console.cloud.google.com)
```
[ ] Client ID: _______________________________________
[ ] Client Secret: ___________________________________
```

### Generate These (Terminal)
```
[ ] JWT_SECRET: _____________________________________
[ ] JWT_REFRESH_SECRET: ____________________________
[ ] AUTH_SECRET: ____________________________________
```

---

## PHASE 2: ADD TO VERCEL (5 min)

URL: https://vercel.com/kratechsolutions-6082s-projects/orderwala/settings/environment-variables

Add all variables from Phase 1, setting Environment to "Production"

```
☐ NEXT_PUBLIC_SITE_URL = https://orderwala-kappa.vercel.app
☐ NEXT_PUBLIC_API_URL = https://api.orderwala.in
☐ NODE_ENV = production
☐ NEXTAUTH_URL = https://orderwala-kappa.vercel.app
☐ JWT_SECRET = [from Phase 1]
☐ JWT_REFRESH_SECRET = [from Phase 1]
☐ AUTH_SECRET = [from Phase 1]
☐ NEXT_PUBLIC_SUPABASE_URL = [from Phase 1]
☐ NEXT_PUBLIC_SUPABASE_ANON_KEY = [from Phase 1]
☐ SUPABASE_SERVICE_ROLE_KEY = [from Phase 1]
☐ NEXT_PUBLIC_FIREBASE_API_KEY = [from Phase 1]
☐ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = [from Phase 1]
☐ NEXT_PUBLIC_FIREBASE_PROJECT_ID = [from Phase 1]
☐ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = [from Phase 1]
☐ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = [from Phase 1]
☐ NEXT_PUBLIC_FIREBASE_APP_ID = [from Phase 1]
☐ NEXT_PUBLIC_RAZORPAY_KEY_ID = [from Phase 1]
☐ RAZORPAY_SECRET_KEY = [from Phase 1]
☐ AUTH_GOOGLE_ID = [from Phase 1]
☐ AUTH_GOOGLE_SECRET = [from Phase 1]
☐ GOOGLE_CLIENT_ID = [from Phase 1]
☐ GOOGLE_CLIENT_SECRET = [from Phase 1]

After adding all:
☐ Run: vercel --prod
☐ Check logs: vercel logs
```

---

## PHASE 3: CONNECT DOMAIN (2 min)

URL: https://vercel.com/kratechsolutions-6082s-projects/orderwala/settings/domains

```
☐ Click "Add Domain"
☐ Enter: orderwala.in
☐ Choose "Nameserver" option
☐ Copy these 4 nameservers:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
   - ns3.vercel-dns.com
   - ns4.vercel-dns.com

☐ Go to domain registrar (Namecheap/GoDaddy)
☐ Update nameservers with above 4
☐ Wait 24-48 hours (DNS propagation)

Verify with: nslookup orderwala.in
```

---

## PHASE 4: GITHUB SETUP (10 min)

### Create Repository
```
☐ Go to: https://github.com/new
☐ Name: orderwala
☐ Click "Create repository"
```

### Push Code
```bash
cd c:\gg\website\orderwala
☐ git init
☐ git add .
☐ git commit -m "Initial: Orderwala production"
☐ git remote add origin https://github.com/YOUR_USERNAME/orderwala.git
☐ git branch -M main
☐ git push -u origin main
```

### Add GitHub Secrets
URL: https://github.com/YOUR_USERNAME/orderwala/settings/secrets/actions

```
☐ VERCEL_TOKEN = [from https://vercel.com/account/tokens]
☐ VERCEL_ORG_ID = team_sWN7yVhHMDyJePweS3A0ZgZa
☐ VERCEL_PROJECT_ID = prj_VYgtylfmDjgVME6CYc2zP7znT9Ga
```

---

## PHASE 5: TEST EVERYTHING

```
☐ Website loads: https://orderwala-kappa.vercel.app
☐ Logs show no errors: vercel logs
☐ GitHub Action runs: https://github.com/YOUR_USERNAME/orderwala/actions
☐ DNS propagated: nslookup orderwala.in
☐ Custom domain works: https://orderwala.in (after 24-48h)
```

---

## WHAT HAPPENS NEXT

After DNS propagates (24-48 hours):
- https://orderwala.in loads your website ✅
- GitHub push automatically deploys ✅
- All environment variables working ✅

Then deploy backend:
- See BACKEND_SETUP.md for AWS Elastic Beanstalk

---

## EMERGENCY COMMANDS

```bash
# Check current status
vercel logs

# Redeploy
vercel --prod

# Check DNS
nslookup orderwala.in

# View all deployments
vercel list

# Rollback to previous
vercel rollback
```

---

## SUPPORT DOCS

- INTERACTIVE_SETUP.md - Detailed walkthrough
- NEXT_STEPS_NOW.md - Quick action items
- COMPLETE_SETUP.md - Full technical guide
- BACKEND_SETUP.md - Backend deployment

---

**Status: Ready to Deploy**
**Website: https://orderwala-kappa.vercel.app** (LIVE NOW!)
**Domain: orderwala.in** (pending DNS)
