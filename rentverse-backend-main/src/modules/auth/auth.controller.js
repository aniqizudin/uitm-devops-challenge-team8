const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../../config/email');
const { generateOTPWithExpiry } = require('../../utils/codeGenerator');
const { trackFailedLogin } = require('../../services/securityTracker'); 

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

let otpStore = {};

// --- HELPER: LOG SECURITY EVENTS ---
async function logSecurityEvent(userId, action, details, req, severity = 'INFO') {
  try {
    // 1. Always log to console for debugging
    console.log(`🔒 Security Log: [${action}] ${details}`);

    // 2. Only save to Database if we have a valid userId
    // (We cannot save logs for "Unknown User" because the database requires a User relation)
    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId: userId,       // Uses the passed userId argument
          action: action,       // Uses the passed action argument
          details: details,     // Uses the passed details argument
          ipAddress: req.ip || req.socket.remoteAddress, // Safely get IP
          userAgent: req.headers['user-agent'],          // Safely get User Agent
        }
      });
    }
  } catch (err) {
    // If logging fails, don't crash the whole app, just print error
    console.error("Failed to write activity log:", err);
  }
}

// --- 1. REGISTER ---
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        role: role || 'USER',
      },
    });

    await logSecurityEvent(newUser.id, 'USER_REGISTERED', `New user registered: ${email}`, req);

    res.status(201).json({
      message: 'User registered successfully. Please Login to verify.',
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// --- 2. LOGIN (SEND OTP) ---
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Track failed login attempt for unknown email
      const ipAddress = req.ip || req.socket.remoteAddress;
      await trackFailedLogin(ipAddress, email, req);
      
      // Pass 'null' for userId since user doesn't exist
      await logSecurityEvent(null, 'LOGIN_FAILED', `Unknown email attempted: ${email}`, req, 'WARNING');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Track failed login attempt for existing user
      const ipAddress = req.ip || req.socket.remoteAddress;
      const trackingResult = await trackFailedLogin(ipAddress, email, req);
      
      // Log the security tracking result
      if (trackingResult.triggered) {
        console.log(`🚨 Security Alert: ${trackingResult.message}`);
      }
      
      await logSecurityEvent(user.id, 'LOGIN_FAILED', `Invalid password for user: ${email}`, req, 'WARNING');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate OTP
    const otpData = generateOTPWithExpiry(6, 10); // 6-digit OTP, expires in 10 minutes
    const otpCode = otpData.otp;

    // Store OTP data in memory
    otpStore[email] = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      otp: otpCode,
      expiry: otpData.expiry,
      attempts: 0,
      createdAt: new Date()
    };

    // Send OTP via email
    const emailResult = await sendOTP(email, otpCode);
    
    if (!emailResult.success) {
      await logSecurityEvent(user.id, 'OTP_EMAIL_FAILED', `Failed to send OTP to: ${email}`, req, 'ERROR');
      return res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
    }

    // Log OTP sent
    await logSecurityEvent(user.id, 'OTP_SENT', `OTP sent to: ${email} via ${emailResult.method}`, req, 'INFO');

    // Return different messages based on delivery method
    let message = 'Verification code sent to your email';
    if (emailResult.method === 'console') {
      message = 'Verification code generated (check terminal for code in development)';
    }

    res.status(200).json({
      success: true,
      message: message,
      data: {
        requiresOTP: true,
        email: user.email,
        deliveryMethod: emailResult.method
      }
    });

  } catch (error) {
    console.error(error);
    await logSecurityEvent(null, 'SERVER_ERROR', `Server crash during login for ${req.body.email}`, req, 'ERROR');
    res.status(500).json({ message: 'Server error during login' });
  }
};

// --- 3. VERIFY OTP ---
const verifyLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedData = otpStore[email];

    // Check if OTP request exists
    if (!storedData) {
      return res.status(400).json({ message: 'No verification code request found or expired.' });
    }

    // Check if OTP is expired
    if (new Date() > storedData.expiry) {
      delete otpStore[email];
      await logSecurityEvent(storedData.id, 'OTP_EXPIRED', `OTP expired for: ${email}`, req, 'WARNING');
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Check attempt limit (max 5 attempts)
    if (storedData.attempts >= 5) {
      delete otpStore[email];
      await logSecurityEvent(storedData.id, 'OTP_ATTEMPTS_EXCEEDED', `Too many OTP attempts for: ${email}`, req, 'WARNING');
      return res.status(400).json({ message: 'Too many attempts. Please request a new verification code.' });
    }

    // Increment attempts
    storedData.attempts++;

    // Verify OTP
    if (storedData.otp === otp) {
      // Generate JWT token
      const token = jwt.sign(
        { id: storedData.id, role: storedData.role }, 
        JWT_SECRET, 
        { expiresIn: '1d' }
      );

      // Clean up OTP store
      delete otpStore[email];

      // Log successful login
      await logSecurityEvent(storedData.id, 'LOGIN_OTP_SUCCESS', `User logged in via OTP: ${email}`, req, 'INFO');

      res.json({
        success: true,
        message: 'Login successful!',
        data: {
          token: token,
          user: {
            id: storedData.id,
            email: storedData.email,
            name: storedData.name,
            role: storedData.role,
          }
        }
      });
    } else {
      await logSecurityEvent(storedData.id, 'OTP_INVALID', `Invalid OTP entered for: ${email}`, req, 'WARNING');
      res.status(400).json({ message: 'Invalid verification code' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// --- 4. RESEND OTP ---
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const storedData = otpStore[email];

    if (!storedData) {
      return res.status(400).json({ message: 'No verification request found. Please try logging in again.' });
    }

    // Check if enough time has passed (1 minute cooldown)
    const now = new Date();
    const timeSinceLastOTP = now - storedData.createdAt;
    const cooldownPeriod = 60 * 1000; // 1 minute in milliseconds

    if (timeSinceLastOTP < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastOTP) / 1000);
      return res.status(400).json({ 
        message: `Please wait ${remainingTime} seconds before requesting a new code.`,
        remainingTime: remainingTime
      });
    }

    // Generate new OTP
    const otpData = generateOTPWithExpiry(6, 10);
    const otpCode = otpData.otp;

    // Update stored data
    otpStore[email] = {
      ...storedData,
      otp: otpCode,
      expiry: otpData.expiry,
      attempts: 0, // Reset attempts
      createdAt: new Date()
    };

    // Send new OTP via email
    const emailResult = await sendOTP(email, otpCode);
    
    if (!emailResult.success) {
      await logSecurityEvent(storedData.id, 'OTP_RESEND_FAILED', `Failed to resend OTP to: ${email}`, req, 'ERROR');
      return res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
    }

    // Log OTP resent
    await logSecurityEvent(storedData.id, 'OTP_RESENT', `OTP resent to: ${email} via ${emailResult.method}`, req, 'INFO');

    // Return different messages based on delivery method
    let message = 'New verification code sent to your email';
    if (emailResult.method === 'console') {
      message = 'New verification code generated (check terminal for code in development)';
    }

    res.status(200).json({
      success: true,
      message: message,
      deliveryMethod: emailResult.method
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP resend' });
  }
};

// --- 5. CHECK EMAIL ---
const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        lastName: true,
        name: true,
        isActive: true,
        role: true 
      } 
    });

    if (!user) {
        return res.status(200).json({
          success: true,
          data: {
            exists: false,
            message: 'User not found',
            user: null
          },
        });
    }

    res.status(200).json({
      success: true,
      data: {              
        exists: true,
        isActive: user.isActive,
        role: user.role,
        message: 'User found',
        user: { 
            id: user.id, 
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            name: user.name,
            role: user.role 
        }
      }
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error checking email' 
    });
  }
};

module.exports = {
  register,
  login, 
  verifyLogin,
  resendOTP,
  checkEmail
};