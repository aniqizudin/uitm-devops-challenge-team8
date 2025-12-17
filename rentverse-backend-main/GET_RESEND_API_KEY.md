# 🎯 GET RESEND API KEY - Send OTP to Your Gmail

## Step 1: Create Free Resend Account
1. Go to: https://resend.com
2. Click "Sign up"
3. Enter your email: alimi.ruziomar@gmail.com
4. Create a password
5. Verify your email address

## Step 2: Get Your API Key
1. Log into Resend dashboard
2. Go to "API Keys" in the sidebar
3. Click "Create API Key"
4. Name it: "Rentverse OTP"
5. **COPY THE API KEY** (starts with "re_")

## Step 3: Update Your .env File
```bash
# REPLACE this line:
RESEND_API_KEY=your_resend_api_key_here

# WITH your real API key:
RESEND_API_KEY=re_your_real_api_key_here
```

## Step 4: Restart Server
```bash
pkill -f "node index.js" && sleep 2 && cd rentverse-backend-main && npm start
```

## Step 5: Test
1. Go to login page
2. Enter email/password
3. **Check your Gmail inbox** - OTP email will arrive!

## Why Resend Works
- ✅ No SMTP connections (bypasses network blocks)
- ✅ Uses Gmail's API for delivery
- ✅ Professional email service
- ✅ FREE for 3000 emails/month

**This will definitely send OTP emails to your Gmail inbox within 2 minutes!**