// This middleware ensures the user is an ADMIN
exports.adminOnly = (req, res, next) => {
  // req.user is set by the previous 'protect' middleware
  if (req.user && req.user.role === 'ADMIN') {
    next(); // You are the boss, proceed.
  } else {
    res.status(403).json({ message: "Access Denied: Admins only." });
  }
};