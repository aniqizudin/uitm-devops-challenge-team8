const express = require('express');
const router = express.Router();
const agreementController = require('./agreement.controller');
const protect = require('../../middleware/auth.middleware'); // Secure it!

// Only logged-in users (VIPs) can sign things
router.post('/sign', protect, agreementController.signAgreement);

// NEW: Get signature status for a lease
router.get('/signature-status/:leaseId', protect, agreementController.getSignatureStatus);

// NEW: Get signature QR code for display
router.get('/signature-qr/:leaseId', protect, agreementController.getSignatureQRCode);

module.exports = router;