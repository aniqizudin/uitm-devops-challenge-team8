// Smart Notification & Alert System - Security Tracker
// Tracks suspicious login activity and triggers alerts

const { PrismaClient } = require('@prisma/client');
const { sendSecurityAlert } = require('./securityAlerts.service');

const prisma = new PrismaClient();

// Configuration for suspicious activity detection
const SUSPICIOUS_ACTIVITY_CONFIG = {
  // Number of failed attempts before triggering an alert
  FAILED_ATTEMPTS_THRESHOLD: 10,
  // Time window in minutes to consider attempts as part of same attack
  TIME_WINDOW_MINUTES: 15,
  // How long to keep failed attempt records (in hours)
  CLEANUP_AFTER_HOURS: 24,
};

// In-memory storage for tracking failed attempts (for fast access)
// In production, you might want to use Redis or similar for persistence across restarts
const failedAttemptsStore = new Map();

/**
 * Track a failed login attempt and check if it triggers suspicious activity
 * @param {string} ipAddress - The IP address of the failed attempt
 * @param {string} email - The email that was attempted (optional)
 * @param {object} req - Express request object for additional context
 * @returns {object} Result of the tracking operation
 */
async function trackFailedLogin(ipAddress, email = null, req = null) {
  try {
    const now = new Date();
    const timeWindowMs = SUSPICIOUS_ACTIVITY_CONFIG.TIME_WINDOW_MINUTES * 60 * 1000;
    
    // Initialize or get existing entry for this IP
    if (!failedAttemptsStore.has(ipAddress)) {
      failedAttemptsStore.set(ipAddress, {
        attempts: [],
        email: email,
        firstAttempt: now,
        lastAttempt: now,
        alertsSent: 0,
        lastAlertSent: null
      });
    }

    const ipData = failedAttemptsStore.get(ipAddress);
    
    // Clean up old attempts (older than time window)
    ipData.attempts = ipData.attempts.filter(attemptTime => {
      return (now - attemptTime) < timeWindowMs;
    });

    // Add new failed attempt
    ipData.attempts.push(now);
    ipData.lastAttempt = now;
    
    // Update email if provided
    if (email) {
      ipData.email = email;
    }

    // Calculate current attempt count in time window
    const currentAttempts = ipData.attempts.length;

    console.log(`🔍 Security Tracking: IP ${ipAddress} has ${currentAttempts} failed attempts in last ${SUSPICIOUS_ACTIVITY_CONFIG.TIME_WINDOW_MINUTES} minutes`);

    // Check if we should trigger an alert
    if (currentAttempts >= SUSPICIOUS_ACTIVITY_CONFIG.FAILED_ATTEMPTS_THRESHOLD) {
      // Check if we already sent an alert recently (avoid spam)
      const timeSinceLastAlert = ipData.lastAlertSent ? 
        (now - ipData.lastAlertSent) : Infinity;

      if (timeSinceLastAlert > (30 * 60 * 1000)) { // 30 minutes cooldown between alerts
        await triggerSecurityAlert(ipAddress, currentAttempts, email, req);
        ipData.alertsSent++;
        ipData.lastAlertSent = now;
        
        return {
          triggered: true,
          attempts: currentAttempts,
          message: `Security alert triggered for ${currentAttempts} failed attempts`,
          alertSent: true
        };
      } else {
        console.log(`⚠️ Security Alert: Threshold reached (${currentAttempts}) but alert recently sent, skipping`);
        return {
          triggered: true,
          attempts: currentAttempts,
          message: `Threshold reached but alert cooldown active`,
          alertSent: false
        };
      }
    }

    return {
      triggered: false,
      attempts: currentAttempts,
      message: `${currentAttempts} failed attempts recorded`
    };

  } catch (error) {
    console.error('❌ Error in security tracking:', error);
    return {
      triggered: false,
      attempts: 0,
      message: 'Error tracking failed attempt',
      error: error.message
    };
  }
}

/**
 * Trigger a security alert for suspicious login activity
 */
async function triggerSecurityAlert(ipAddress, attemptCount, email, req) {
  try {
    console.log(`🚨 SECURITY ALERT TRIGGERED: IP ${ipAddress} - ${attemptCount} failed attempts`);
    
    // Get user agent and additional context
    const userAgent = req?.headers?.['user-agent'] || 'Unknown';
    const timestamp = new Date().toISOString();
    
    // Prepare alert data
    const alertData = {
      ipAddress,
      attemptCount,
      email: email || 'Unknown',
      userAgent,
      timestamp,
      severity: attemptCount >= 20 ? 'CRITICAL' : 'HIGH',
      timeWindow: SUSPICIOUS_ACTIVITY_CONFIG.TIME_WINDOW_MINUTES
    };

    // Send security alert email
    const emailResult = await sendSecurityAlert(alertData);
    
    if (emailResult.success) {
      console.log(`✅ Security alert email sent successfully via ${emailResult.method}`);
    } else {
      console.error(`❌ Failed to send security alert email: ${emailResult.error}`);
    }

    // Also log the alert in the activity log if we have user context
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'SECURITY_ALERT_TRIGGERED',
            details: `Suspicious activity detected from IP ${ipAddress}: ${attemptCount} failed attempts`,
            ipAddress: ipAddress,
            userAgent: userAgent
          }
        });
      }
    }

    return emailResult;

  } catch (error) {
    console.error('❌ Error triggering security alert:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get current status of an IP address
 */
function getIPStatus(ipAddress) {
  const ipData = failedAttemptsStore.get(ipAddress);
  if (!ipData) {
    return {
      tracked: false,
      attempts: 0,
      status: 'No failed attempts recorded'
    };
  }

  const now = new Date();
  const recentAttempts = ipData.attempts.filter(attemptTime => {
    const timeWindowMs = SUSPICIOUS_ACTIVITY_CONFIG.TIME_WINDOW_MINUTES * 60 * 1000;
    return (now - attemptTime) < timeWindowMs;
  });

  return {
    tracked: true,
    attempts: recentAttempts.length,
    firstAttempt: ipData.firstAttempt,
    lastAttempt: ipData.lastAttempt,
    alertsSent: ipData.alertsSent,
    status: recentAttempts.length >= SUSPICIOUS_ACTIVITY_CONFIG.FAILED_ATTEMPTS_THRESHOLD ? 
      'SUSPICIOUS' : 'MONITORED'
  };
}

/**
 * Clean up old entries to prevent memory leaks
 * This should be called periodically (e.g., every hour)
 */
function cleanupOldEntries() {
  try {
    const now = new Date();
    const maxAgeMs = SUSPICIOUS_ACTIVITY_CONFIG.CLEANUP_AFTER_HOURS * 60 * 60 * 1000;
    
    for (const [ipAddress, ipData] of failedAttemptsStore.entries()) {
      const timeSinceLastAttempt = now - ipData.lastAttempt;
      
      if (timeSinceLastAttempt > maxAgeMs) {
        failedAttemptsStore.delete(ipAddress);
        console.log(`🧹 Cleaned up old tracking data for IP: ${ipAddress}`);
      }
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Start periodic cleanup (every hour)
setInterval(cleanupOldEntries, 60 * 60 * 1000);

module.exports = {
  trackFailedLogin,
  getIPStatus,
  cleanupOldEntries,
  SUSPICIOUS_ACTIVITY_CONFIG
};