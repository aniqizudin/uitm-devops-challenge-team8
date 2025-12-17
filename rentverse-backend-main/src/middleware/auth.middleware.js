const jwt = require('jsonwebtoken');

// This must match the secret key we used to sign the wristband!
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

const protect = (req, res, next) => {
  // 1. Check if the user is holding a wristband
  // (It should look like: "Authorization: Bearer <token>")
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Access Denied: No token provided (Where is your wristband?)' 
    });
  }

  // 2. Extract the token (remove the word "Bearer " from the front)
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verify the signature (Shine the UV light on it)
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. If valid, attach the user info to the request so the next function can see it
    req.user = decoded;

    // 5. Open the door!
    next();

  } catch (error) {
    // If the token is fake, expired, or broken
    res.status(401).json({ message: 'Access Denied: Invalid token' });
  }
};

module.exports = protect;