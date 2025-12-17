# 🚀 QUICK EMAIL FIX - Get OTP in Your Gmail Inbox

## ⚡ FASTEST SOLUTION (2 minutes)

### Option 1: Gmail App Password (Recommended)

**Step 1: Enable 2FA on Gmail**
1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification" 
3. Follow setup with your phone

**Step 2: Generate App Password**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" → "Other" → Enter "Rentverse OTP"
3. **Copy the 16-character password** (like: "abcd efgh ijkl mnop")

**Step 3: Update .env file**
```bash
# Replace this line:
EMAIL_PASS=owaf cvfk zfcg oknt

# With your App Password:
EMAIL_PASS=abcd efgh ijkl mnop
```

**Step 4: Restart & Test**
```bash
pkill -f "node index.js" && sleep 2 && cd rentverse-backend-main && npm start
```

---

### Option 2: Resend (No Gmail setup needed)

**Step 1: Get Resend Account**
1. Go to https://resend.com (free - 3000 emails/month)
2. Sign up and verify email
3. Copy API key from dashboard

**Step 2: Update .env**
```bash
# Add this line:
RESEND_API_KEY=re_your_api_key_here
```

**Step 3: Restart & Test**

---

## ✅ Current Status
- ✅ OTP Generation: Working perfectly
- ✅ Security: 2-factor authentication active  
- ✅ Console Display: OTP shown in terminal
- ❌ Email Delivery: Need proper credentials

## 🎯 What Happens After Fix
1. You enter email/password
2. System generates 6-digit OTP
3. **Email arrives in your Gmail inbox**
4. You enter OTP to complete login

**Choose Option 1 or 2 above, and your OTP emails will be in your inbox within 3 minutes!**