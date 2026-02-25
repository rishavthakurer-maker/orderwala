# PowerShell script to set up Vercel environment and GitHub Actions

Write-Host "🚀 Orderwala Complete Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Step 1: Generate secrets
Write-Host "`n📝 Generating secrets..." -ForegroundColor Yellow
$JWTSecret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))
$JWTRefreshSecret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))
$AuthSecret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))

Write-Host "✅ Secrets generated:" -ForegroundColor Green
Write-Host "JWT_SECRET=$JWTSecret"
Write-Host "JWT_REFRESH_SECRET=$JWTRefreshSecret"
Write-Host "AUTH_SECRET=$AuthSecret"

# Step 2: Display Vercel configuration
Write-Host "`n🌐 Vercel Project Information:" -ForegroundColor Yellow
Write-Host "Project URL: https://vercel.com/kratechsolutions-6082s-projects/orderwala"
Write-Host "Deployment: https://orderwala-kappa.vercel.app"
Write-Host "Org ID: team_sWN7yVhHMDyJePweS3A0ZgZa"
Write-Host "Project ID: prj_VYgtylfmDjgVME6CYc2zP7znT9Ga"

# Step 3: Display environment variables needed
Write-Host "`n📋 Add these environment variables in Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "URL: https://vercel.com/kratechsolutions-6082s-projects/orderwala/settings/environment-variables"
Write-Host ""
Write-Host "Frontend URLs:"
Write-Host "  NEXT_PUBLIC_SITE_URL = https://orderwala-kappa.vercel.app"
Write-Host "  NEXT_PUBLIC_API_URL = https://api.orderwala.in"
Write-Host ""
Write-Host "Generated Secrets (Use these!):"
Write-Host "  JWT_SECRET = $JWTSecret"
Write-Host "  JWT_REFRESH_SECRET = $JWTRefreshSecret"
Write-Host "  AUTH_SECRET = $AuthSecret"
Write-Host ""
Write-Host "Required from Supabase (https://app.supabase.com):"
Write-Host "  NEXT_PUBLIC_SUPABASE_URL = <your_supabase_url>"
Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY = <your_anon_key>"
Write-Host "  SUPABASE_SERVICE_ROLE_KEY = <your_service_role_key>"
Write-Host ""
Write-Host "Required from Firebase (https://console.firebase.google.com):"
Write-Host "  NEXT_PUBLIC_FIREBASE_API_KEY = <your_api_key>"
Write-Host "  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = <your_domain>"
Write-Host "  NEXT_PUBLIC_FIREBASE_PROJECT_ID = <your_project_id>"
Write-Host "  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = <your_bucket>"
Write-Host "  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = <your_sender_id>"
Write-Host "  NEXT_PUBLIC_FIREBASE_APP_ID = <your_app_id>"
Write-Host ""
Write-Host "Required from Razorpay (https://dashboard.razorpay.com):"
Write-Host "  NEXT_PUBLIC_RAZORPAY_KEY_ID = <your_key_id>"
Write-Host "  RAZORPAY_SECRET_KEY = <your_secret>"
Write-Host ""
Write-Host "Required from Google Cloud (https://console.cloud.google.com):"
Write-Host "  AUTH_GOOGLE_ID = <your_client_id>"
Write-Host "  AUTH_GOOGLE_SECRET = <your_client_secret>"
Write-Host "  GOOGLE_CLIENT_ID = <same_as_above>"
Write-Host "  GOOGLE_CLIENT_SECRET = <same_as_above>"
Write-Host ""
Write-Host "Environment:"
Write-Host "  NEXTAUTH_URL = https://orderwala-kappa.vercel.app"
Write-Host "  NODE_ENV = production"

# Step 4: GitHub setup instructions
Write-Host "`n🐙 GitHub Setup Instructions:" -ForegroundColor Yellow
Write-Host "1. Create repository at: https://github.com/new"
Write-Host "   - Repository name: orderwala"
Write-Host "   - Public/Private: Your choice"
Write-Host ""
Write-Host "2. Initialize local git (if not done):"
Write-Host "   cd c:\gg\website\orderwala"
Write-Host "   git init"
Write-Host "   git add ."
Write-Host "   git commit -m 'Initial: Orderwala deployment'"
Write-Host ""
Write-Host "3. Push to GitHub:"
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/orderwala.git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "4. Add GitHub Secrets at: https://github.com/YOUR_USERNAME/orderwala/settings/secrets/actions"
Write-Host "   - VERCEL_TOKEN: Get from https://vercel.com/account/tokens"
Write-Host "   - VERCEL_ORG_ID: team_sWN7yVhHMDyJePweS3A0ZgZa"
Write-Host "   - VERCEL_PROJECT_ID: prj_VYgtylfmDjgVME6CYc2zP7znT9Ga"

# Step 5: Domain setup
Write-Host "`n🌍 Custom Domain Setup (orderwala.in):" -ForegroundColor Yellow
Write-Host "1. Go to: https://vercel.com/kratechsolutions-6082s-projects/orderwala/settings/domains"
Write-Host "2. Click 'Add Domain'"
Write-Host "3. Enter: orderwala.in"
Write-Host "4. Choose 'Nameserver' option"
Write-Host "5. Copy the 4 nameservers"
Write-Host "6. Log into your domain registrar (Namecheap/GoDaddy)"
Write-Host "7. Update nameservers with Vercel's nameservers"
Write-Host "8. Wait 24-48 hours for propagation"
Write-Host ""
Write-Host "Verify with: nslookup orderwala.in"

# Step 6: Deployment
Write-Host "`n🚀 Deployment Steps:" -ForegroundColor Yellow
Write-Host "1. Add all environment variables to Vercel dashboard"
Write-Host "2. Run: vercel --prod"
Write-Host "3. Wait for deployment to complete"
Write-Host "4. Test: https://orderwala-kappa.vercel.app"
Write-Host "5. After DNS propagation: https://orderwala.in"

# Step 7: Next steps
Write-Host "`n CHECKLIST:" -ForegroundColor Yellow
Write-Host "1. Environment variables added to Vercel"
Write-Host "2. Vercel project redeployed (vercel --prod)"
Write-Host "3. GitHub repository created and pushed"
Write-Host "4. GitHub secrets added"
Write-Host "5. Custom domain DNS updated"
Write-Host "6. DNS propagation verified"
Write-Host "7. Website accessible at orderwala.in"
Write-Host "8. Backend deployment to AWS EB (next)"

Write-Host "`n✅ Setup complete! Follow the steps above." -ForegroundColor Green
Write-Host "📚 See COMPLETE_SETUP.md for detailed instructions" -ForegroundColor Cyan
