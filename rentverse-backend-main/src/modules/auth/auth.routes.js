const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const protect = require('../../middleware/auth.middleware'); // Keep the Bouncer active!

// --- PUBLIC ROUTES (No Token Needed) ---
router.post('/register', authController.register);
router.post('/login', authController.login);       // Step 1: Check password & Send Email
router.post('/verify', authController.verifyLogin); // Step 2: Verify OTP & Get Token (NEW!)
router.post('/resend-otp', authController.resendOTP); // Step 3: Resend OTP

router.post('/check-email', authController.checkEmail);

// --- PROTECTED ROUTES (Token Required) ---
// This route proves your "Bouncer" (Module 2) works.
router.get('/me', protect, (req, res) => {
  res.json({ 
    message: "Welcome to the VIP area!", 
    your_data: req.user 
  });
});

module.exports = router;