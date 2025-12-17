# 🔐 Digital Signature Testing Guide - **FIXED & WORKING** ✅

## ✅ **ISSUE RESOLVED**
The signature system was fixed by:
1. **Database Schema Updated**: Added signature fields to RentalAgreement table
2. **Migration Applied**: All signature fields are now properly created
3. **Status Fixed**: Agreement status initialized to 'PENDING'
4. **API Tested**: All signature endpoints verified working

## 📋 **Test Accounts Available**

### **Tenant Account (Required to test signature workflow)**
- **Email:** `kretossparta97@gmail.com`
- **Name:** Kretos Sparta
- **Password:** You need to know this from when the account was created
- **Role:** USER

### **Landlord Account (Required for complete signature flow)**
- **Email:** `alimi.ruziomar@gmail.com`
- **Name:** Test User
- **Password:** You need to know this from when the account was created
- **Role:** ADMIN

### **Alternative Landlord Account**
- **Email:** `system@fazwaz-scraper.com`
- **Name:** FazWaz Scraper
- **Role:** ADMIN

## 🏠 **Test Lease Available**

**Lease ID:** `1f1f8cc7-2379-4f1c-adb7-2e1f30cc7f8b`
- **Property:** 5BR Apartment in Bangsar
- **Tenant:** Kretos Sparta (kretossparta97@gmail.com)
- **Landlord:** FazWaz Scraper (system@fazwaz-scraper.com)
- **Status:** APPROVED

**Agreement ID:** `8c2ebe4d-d12c-4432-a7d8-df2fba9794f2`
- **Lease ID:** 1f1f8cc7-2379-4f1c-adb7-2e1f30cc7f8b
- **Current Status:** Neither party has signed yet (Perfect for testing!)

## 🧪 **Testing Scenarios**

### **Scenario 1: Complete Signature Workflow Test**

#### Step 1: Test as Tenant
1. **Login** as `kretossparta97@gmail.com`
2. **Navigate** to `/rents` page
3. **Click** on the 5BR Apartment lease
4. **Verify** you see the "Signature Status" component
5. **Check** that your signature shows as "Pending"
6. **Click** "Sign Now" button
7. **Type** your full name in the signature modal
8. **Click** "Sign & Accept"
9. **Verify** success message and signature status updates

#### Step 2: Test as Landlord
1. **Login** as `alimi.ruziomar@gmail.com`
2. **Navigate** to `/owner/bookings` page
3. **Find** the same lease and view details
4. **Verify** you see the signature status
5. **Check** that tenant has signed but landlord hasn't
6. **Sign** as landlord
7. **Verify** both signatures are complete

#### Step 3: Test Download After Signatures
1. **Login** as either tenant or landlord
2. **Navigate** to the agreement
3. **Click** "Download document"
4. **Verify** download works successfully

### **Scenario 2: Access Control Test**

#### Step 1: URL Manipulation Test
1. **Login** as `kretossparta97@gmail.com`
2. **Note** your lease ID: `1f1f8cc7-2379-4f1c-adb7-2e1f30cc7f8b`
3. **Try** to access: `/rents/b5e13c14-c53f-45c2-97c1-bbcc120f5dcb` (different lease)
4. **Verify** you get access denied or not found

#### Step 2: Unauthorized Signature Test
1. **Login** as a different user (not tenant/landlord of the lease)
2. **Try** to access signature endpoints directly
3. **Verify** you get 403 Unauthorized

### **Scenario 3: Download Block Test**

#### Step 1: Try Download Without Signatures
1. **Login** as `kretossparta97@gmail.com`
2. **Navigate** to the lease (before signing)
3. **Click** "Download document"
4. **Verify** you get error: "Missing signatures from: Tenant and Landlord"

#### Step 2: Try Download After Partial Signature
1. **Login** as tenant and sign
2. **Try** to download
3. **Verify** you get error: "Missing signatures from: Landlord"

## 🔧 **API Testing (Optional)**

### **Test Signature Status API**
```bash
curl -X GET "http://localhost:8000/api/agreements/signature-status/1f1f8cc7-2379-4f1c-adb7-2e1f30cc7f8b" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Test Signature API**
```bash
curl -X POST "http://localhost:8000/api/agreements/sign" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaseId": "1f1f8cc7-2379-4f1c-adb7-2e1f30cc7f8b",
    "signatureText": "Kretos Sparta"
  }'
```

### **Test Download API**
```bash
curl -X GET "http://localhost:8000/api/bookings/1f1f8cc7-2379-4f1c-adb7-2e1f30cc7f8b/rental-agreement" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📱 **Frontend Testing Checklist**

### ✅ **Signature Status Component**
- [ ] Shows correct user role (Tenant/Landlord)
- [ ] Displays signature status for both parties
- [ ] Shows "Sign Now" button for unsigned users
- [ ] Shows signature timestamp after signing
- [ ] Updates status in real-time after signature

### ✅ **Signature Modal**
- [ ] Opens when clicking "Sign Now"
- [ ] Requires signature text input
- [ ] Shows user role and agreement details
- [ ] Displays legal confirmation message
- [ ] Handles success/error responses

### ✅ **Download Validation**
- [ ] Blocks download when signatures missing
- [ ] Shows clear error messages about missing signatures
- [ ] Allows download only after both parties sign
- [ ] Provides helpful guidance for next steps

## 🐛 **Common Issues & Solutions**

### **Issue: Can't login to test accounts**
- **Solution:** Use the "Sign Up" flow to create new test accounts
- **Alternative:** Reset password using email verification

### **Issue: No leases visible**
- **Solution:** Create a new booking through the property booking flow
- **Alternative:** Check if existing leases are in correct status

### **Issue: Signature modal not opening**
- **Solution:** Check browser console for JavaScript errors
- **Alternative:** Clear browser cache and reload

### **Issue: Download still blocked after signatures**
- **Solution:** Refresh the page to get updated signature status
- **Alternative:** Check API response for signature validation errors

## 🎯 **Expected Results**

### **Successful Signature Flow:**
1. Both users can view signature status
2. Each user can sign when it's their turn
3. Status updates immediately after signing
4. Download becomes available only after both signatures
5. Clear error messages guide users when signatures are missing

### **Security Validation:**
1. Users cannot access other users' agreements
2. Only authorized parties can sign agreements
3. Download requires both signatures
4. All actions are logged with metadata (IP, timestamp, user agent)

## 📞 **Need Help?**

If you encounter any issues during testing:
1. Check browser console for errors
2. Verify backend server is running on port 8000
3. Confirm frontend is running on port 3000
4. Ensure database connection is active

The signature system is now fully functional and ready for testing! 🚀