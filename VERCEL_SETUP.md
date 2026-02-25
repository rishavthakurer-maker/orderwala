# Vercel Deployment Setup Guide

## ✅ Step 1: Vercel CLI Installed
Vercel CLI is already installed globally on your system.

## ⏳ Step 2: Login to Vercel Account

Run this command in your terminal:

```bash
vercel login
```

This will:
1. Open a browser window automatically
2. Ask you to create/login to Vercel account
3. Grant permissions to your CLI
4. Confirm in terminal when done

**If you don't have a Vercel account yet:**
- Go to https://vercel.com/signup
- Sign up with GitHub (recommended for auto CI/CD)
- Then run `vercel login` again

## ⏳ Step 3: Deploy to Vercel

Once logged in, run:

```bash
cd c:\gg\website\orderwala
vercel --prod
```

**This will ask you:**

| Question | Answer |
|----------|--------|
| Set up and deploy "C:\gg\website\orderwala"? | **y** |
| Which scope? | Select your personal account |
| Link to existing project? | **n** (first deployment) |
| Project name? | **orderwala** |
| In which directory is your code? | **.** (current directory) |
| Want to modify these settings? | **n** |

---

**Wait for deployment to complete** (~2-5 minutes)

You'll see output like:
```
✅ Production: https://orderwala.vercel.app
```

## ⏳ Step 4: Add Environment Variables in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on **orderwala** project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
NEXT_PUBLIC_FIREBASE_API_KEY = your_firebase_key
NEXT_PUBLIC_RAZORPAY_KEY_ID = your_razorpay_key
RAZORPAY_SECRET_KEY = your_razorpay_secret
JWT_SECRET = your_jwt_secret
JWT_REFRESH_SECRET = your_jwt_refresh_secret
NEXTAUTH_URL = https://orderwala.vercel.app
AUTH_SECRET = your_auth_secret
AUTH_GOOGLE_ID = your_google_id
AUTH_GOOGLE_SECRET = your_google_secret
```

Get these values from:
- ✅ Supabase: https://app.supabase.com
- ✅ Firebase: https://console.firebase.google.com
- ✅ Razorpay: https://dashboard.razorpay.com
- ✅ Google OAuth: https://console.cloud.google.com

## ⏳ Step 5: Connect Your Domain (orderwala.in)

1. In Vercel Dashboard → **orderwala** project
2. Go to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter: `orderwala.in`
5. Choose **Nameserver** option
6. Copy the nameservers shown

**Update at your domain registrar (Namecheap/GoDaddy):**

Go to your domain registrar's DNS settings:
1. Find "Nameservers" section
2. Replace current nameservers with Vercel's nameservers
3. Save changes

**DNS propagation takes 24-48 hours**

## ⏳ Step 6: Redeploy After Adding Variables

After adding environment variables, redeploy:

```bash
vercel --prod
```

This ensures environment variables are used in the build.

## ✅ Step 7: Test Your Deployment

**Check if everything is working:**

```bash
# Test production URL
curl https://orderwala.vercel.app

# Once domain is connected (24-48h):
curl https://orderwala.in

# Check build status
vercel logs

# Redeploy if needed
vercel --prod
```

---

## 🔗 Configure GitHub Integration (Optional but Recommended)

For automatic deployments on every push to `main` branch:

1. Go to Vercel Dashboard
2. Select **orderwala** project
3. Go to **Settings** → **Git**
4. Click **Connect Git Repository**
5. Select your GitHub repository
6. Under "Deploy on push": **Enable**

Now every `git push` to `main` will auto-deploy! 🚀

---

## 📝 Common Issues & Solutions

### Issue: "Vercel login failed"
**Solution:**
```bash
vercel logout
vercel login
# Complete browser authentication
```

### Issue: "Environment variables not used"
**Solution:**
- Add variables in Vercel Dashboard
- Redeploy: `vercel --prod`
- Variables starting with `NEXT_PUBLIC_` are visible in browser
- Others are server-side only

### Issue: "Domain not resolving after 48 hours"
**Solution:**
```bash
# Check DNS propagation
nslookup orderwala.in
dig orderwala.in

# Verify Vercel nameservers are set at registrar
# Clear browser cache: Ctrl+Shift+Del
```

### Issue: "SSL certificate not issued"
**Solution:**
- SSL auto-installs within 24-48 hours of domain connection
- Check Vercel dashboard for any errors
- Verify domain DNS is correct

### Issue: "Build failing after environment variables added"
**Solution:**
- Ensure `NEXT_PUBLIC_*` prefix for client-side variables
- Don't use special characters in variable values
- Restart build: `vercel redeploy`

---

## 🎯 Next: Backend Deployment

After Vercel is live:

1. Set up AWS Elastic Beanstalk for backend
2. Configure database (Supabase)
3. Set up Firebase for real-time features
4. Configure GitHub Actions for auto CI/CD

See `BACKEND_SETUP.md` and `AWS_DEPLOYMENT.md` for details.

---

## 📊 Vercel Dashboard Overview

After deployment, your dashboard shows:
- **Deployments**: All versions deployed
- **Analytics**: Page views, response times
- **Performance**: Core Web Vitals
- **Logs**: Build and runtime logs
- **Settings**: Domains, env vars, git integration

---

## ✅ Deployed! 🎉

Your website is now live on:
- **Preview**: https://orderwala.vercel.app
- **Production**: https://orderwala.in (after 24-48h DNS propagation)

**Don't forget to:**
- [ ] Test all pages work
- [ ] Check mobile responsiveness
- [ ] Verify API calls work
- [ ] Test authentication
- [ ] Test payment flow

---

**Still need help?**
- [Vercel Docs](https://vercel.com/docs)
- [Vercel Discord Community](https://discord.gg/vercel)
- [Next.js Docs](https://nextjs.org/docs)
