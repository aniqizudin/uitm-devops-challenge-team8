const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // 1. Check if the header exists
    const tokenHeader = req.header('Authorization');
    
    // SPY LOG: Print what the server received
    console.log("🕵️ SECURITY CHECK:");
    console.log("   - Header Received:", tokenHeader ? "Yes" : "No");

    if (!tokenHeader) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    // 2. Clean the token (Remove "Bearer ")
    const token = tokenHeader.replace('Bearer ', '');
    console.log("   - Token (First 10 chars):", token.substring(0, 10) + "...");

    // 3. Verify the token
    // SPY LOG: Check if Secret is loaded
    console.log("   - JWT_SECRET Loaded:", process.env.JWT_SECRET ? "Yes" : "NO (Critical Error!)");
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    console.log("   - Verification: ✅ SUCCESS");
    next();

  } catch (error) {
    // SPY LOG: Print the exact error
    console.log("   - Verification: ❌ FAILED");
    console.log("   - Error Details:", error.message);
    res.status(400).json({ success: false, message: 'Access denied. Invalid token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { auth, authorize };