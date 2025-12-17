# Gmail OTP Fix Instructions

## Current Issue
Your EMAIL_PASS=owaf cvfk zfcg oknt is NOT a Gmail App Password, so Gmail rejects the connection.

## Step-by-Step Fix:

### 1. Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification" 
3. Follow the setup process
4. Verify with your phone

### 2. Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail"
3. Select "Other (Custom name)"
4. Enter: "Rentverse OTP"
5. Click "Generate"
6. **COPY THE 16-CHARACTER PASSWORD** (format: xxxx xxxx xxxx xxxx)

### 3. Update Your .env File
Replace this line:
```
EMAIL_PASS=owaf cvfk zfcg oknt
```

With your App Password:
```
EMAIL_PASS=your_16_char_app_password_here
```

### 4. Restart Server
```bash
pkill -f "node index.js" && sleep 2 && cd rentverse-backend-main && npm start
```

### 5. Test
1. Go to your login page
2. Enter your credentials
3. **Check your Gmail inbox** - you should receive the OTP email!

## Important Notes:
- App Password is 16 characters with spaces
- Different from your regular Gmail password
- Only works after 2FA is enabled
- You can revoke it anytime from Google Account settings

## Troubleshooting:
If still not working, check:
- 2FA is enabled
- App Password is exactly 16 characters
- No extra spaces in .env file
- Restarted the server after changes