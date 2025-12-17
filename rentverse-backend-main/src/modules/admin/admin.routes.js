const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const protect = require('../../middleware/auth.middleware'); // Must be logged in
const { adminOnly } = require('../../middleware/admin.middleware'); // Must be ADMIN

// Secure Route chain: 1. Login Check -> 2. Admin Check -> 3. Get Data
router.get('/logs', protect, adminOnly, adminController.getSecurityLogs);

router.post('/ban-ip', protect, adminOnly, adminController.banIp);
router.delete('/logs/cleanup', protect, adminOnly, adminController.cleanupLogs);

module.exports = router;