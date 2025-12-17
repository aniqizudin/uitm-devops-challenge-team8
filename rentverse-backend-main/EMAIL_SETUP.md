# Email Setup Instructions

## Option 1: Resend (Recommended - 3000 emails/month free)

1. **Sign up for Resend:**
   - Go to https://resend.com
   - Sign up for free account
   - Verify your email
   - Go to API Keys in dashboard
   - Create a new API key

2. **Update your .env file:**
   ```
   # Replace this line in .env:
   EMAIL_USER=alimi.ruziomar@gmail.com
   EMAIL_PASS=owaf cvfk zfcg oknt
   
   # With these lines:
   RESEND_API_KEY=re_your_real_api_key_here
   ```

3. **Restart your server:**
   ```bash
   pkill -f "node index.js" && sleep 2 && cd rentverse-backend-main && npm start
   ```

## Option 2: Fix Gmail SMTP

1. **Enable 2FA on your Gmail:**
   - Go to https://myaccount.google.com/security
   - Turn on 2-Step Verification

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Rentverse OTP"
   - Copy the 16-character password

3. **Update your .env file:**
   ```
   # Replace the EMAIL_PASS line with:
   EMAIL_PASS=your_16_character_app_password
   ```

4. **Restart your server**

## Option 3: Alternative SMTP (SendGrid)

1. **Sign up for SendGrid:**
   - Go to https://sendgrid.com
   - Sign up for free (100 emails/day)
   - Create API key

2. **Update email.js to use SendGrid SMTP**

---

**After setup, test with:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alimi.ruziomar@gmail.com", "password": "password123"}'
```

You should receive the OTP in your actual email inbox!