// Security Alert Email Service
// Sends email notifications for suspicious login activity

const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Admin email for receiving security alerts
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rentverse.com';

// Gmail transporter as fallback
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send security alert email for suspicious login activity
 * @param {object} alertData - Contains IP, attempt count, email, user agent, etc.
 * @returns {object} Result of the email sending operation
 */
const sendSecurityAlert = async (alertData) => {
  const {
    ipAddress,
    attemptCount,
    email,
    userAgent,
    timestamp,
    severity,
    timeWindow
  } = alertData;

  // Format timestamp for display
  const alertTime = new Date(timestamp).toLocaleString('en-US', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Determine alert severity styling
  const isCritical = severity === 'CRITICAL';
  const alertColor = isCritical ? '#dc3545' : '#fd7e14';
  const alertIcon = isCritical ? '🚨' : '⚠️';
  const urgencyText = isCritical ? 'IMMEDIATE ACTION REQUIRED' : 'SUSPICIOUS ACTIVITY DETECTED';

  // Try Resend first if available
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Rentverse Security <security@rentverse.com>',
        to: [ADMIN_EMAIL],
        subject: `${alertIcon} Security Alert: ${attemptCount} Failed Login Attempts from ${ipAddress}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; font-size: 28px; margin: 0;">🏠 Rentverse Security</h1>
              <h2 style="color: ${alertColor}; font-size: 22px; margin: 10px 0 0 0; font-weight: bold;">${urgencyText}</h2>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="background: ${alertColor}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
                <h3 style="margin: 0; font-size: 24px;">${attemptCount} Failed Login Attempts</h3>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Detected from IP: <strong>${ipAddress}</strong></p>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid ${alertColor};">
                  <h4 style="margin: 0 0 10px 0; color: #495057;">📧 Target Account</h4>
                  <p style="margin: 0; font-family: monospace; color: #6c757d;">${email}</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid ${alertColor};">
                  <h4 style="margin: 0 0 10px 0; color: #495057;">⏰ Detection Time</h4>
                  <p style="margin: 0; font-family: monospace; color: #6c757d;">${alertTime}</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid ${alertColor};">
                  <h4 style="margin: 0 0 10px 0; color: #495057;">🔍 Time Window</h4>
                  <p style="margin: 0; color: #6c757d;">Last ${timeWindow} minutes</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid ${alertColor};">
                  <h4 style="margin: 0 0 10px 0; color: #495057;">🌐 IP Address</h4>
                  <p style="margin: 0; font-family: monospace; color: #6c757d;">${ipAddress}</p>
                </div>
              </div>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px 0; color: #495057;">💻 User Agent</h4>
                <p style="margin: 0; font-size: 12px; color: #6c757d; word-break: break-all;">${userAgent}</p>
              </div>
              
              <div style="background: ${isCritical ? '#f8d7da' : '#fff3cd'}; border: 1px solid ${isCritical ? '#f5c6cb' : '#ffeaa7'}; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h4 style="margin: 0 0 15px 0; color: ${isCritical ? '#721c24' : '#856404'};">📋 Recommended Actions</h4>
                <ul style="margin: 0; padding-left: 20px; color: ${isCritical ? '#721c24' : '#856404'};">
                  ${isCritical ? 
                    '<li><strong>URGENT:</strong> Consider blocking this IP address immediately</li>' : 
                    '<li>Monitor this IP address for continued suspicious activity</li>'
                  }
                  <li>Review recent login logs for this account</li>
                  <li>Consider implementing additional security measures</li>
                  <li>Verify with the account owner if the attempts are legitimate</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">🔒 This alert was generated by Rentverse Security System</p>
                <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">Alert ID: SEC-${Date.now()}-${ipAddress.replace(/:/g, '')}</p>
              </div>
            </div>
          </div>
        `,
      });

      if (error) {
        console.log('❌ Resend Security Alert Error:', error);
      } else {
        console.log('✅ Security Alert sent via Resend:', data);
      }

      if (!error) {
        return { success: true, method: 'resend', data: data };
      }
    } catch (error) {
      console.log('❌ Resend security alert service error:', error);
    }
  }

  // Fallback to Gmail if Resend fails
  try {
    const transporter = createGmailTransporter();
    const mailOptions = {
      from: `"Rentverse Security" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `${alertIcon} Security Alert: ${attemptCount} Failed Login Attempts from ${ipAddress}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; font-size: 28px; margin: 0;">🏠 Rentverse Security</h1>
            <h2 style="color: ${alertColor}; font-size: 22px; margin: 10px 0 0 0; font-weight: bold;">${urgencyText}</h2>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background: ${alertColor}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
              <h3 style="margin: 0; font-size: 24px;">${attemptCount} Failed Login Attempts</h3>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Detected from IP: <strong>${ipAddress}</strong></p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0;">
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid ${alertColor};">
                <h4 style="margin: 0 0 10px 0; color: #495057;">📧 Target Account</h4>
                <p style="margin: 0; font-family: monospace; color: #6c757d;">${email}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid ${alertColor};">
                <h4 style="margin: 0 0 10px 0; color: #495057;">⏰ Detection Time</h4>
                <p style="margin: 0; font-family: monospace; color: #6c757d;">${alertTime}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid ${alertColor};">
                <h4 style="margin: 0 0 10px 0; color: #495057;">🔍 Time Window</h4>
                <p style="margin: 0; color: #6c757d;">Last ${timeWindow} minutes</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid ${alertColor};">
                <h4 style="margin: 0 0 10px 0; color: #495057;">🌐 IP Address</h4>
                <p style="margin: 0; font-family: monospace; color: #6c757d;">${ipAddress}</p>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 25px 0;">
              <h4 style="margin: 0 0 10px 0; color: #495057;">💻 User Agent</h4>
              <p style="margin: 0; font-size: 12px; color: #6c757d; word-break: break-all;">${userAgent}</p>
            </div>
            
            <div style="background: ${isCritical ? '#f8d7da' : '#fff3cd'}; border: 1px solid ${isCritical ? '#f5c6cb' : '#ffeaa7'}; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="margin: 0 0 15px 0; color: ${isCritical ? '#721c24' : '#856404'};">📋 Recommended Actions</h4>
              <ul style="margin: 0; padding-left: 20px; color: ${isCritical ? '#721c24' : '#856404'};">
                ${isCritical ? 
                  '<li><strong>URGENT:</strong> Consider blocking this IP address immediately</li>' : 
                  '<li>Monitor this IP address for continued suspicious activity</li>'
                }
                <li>Review recent login logs for this account</li>
                <li>Consider implementing additional security measures</li>
                <li>Verify with the account owner if the attempts are legitimate</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">🔒 This alert was generated by Rentverse Security System</p>
              <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">Alert ID: SEC-${Date.now()}-${ipAddress.replace(/:/g, '')}</p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Security alert successfully sent to ${ADMIN_EMAIL} via Gmail`);
    return { success: true, method: 'gmail' };

  } catch (error) {
    console.error('❌ Gmail Security Alert Error:', error.message);
    
    // Check for specific issues
    if (error.message.includes('Invalid login') || error.message.includes('535')) {
      console.log('🔧 Gmail authentication failed. Please verify your App Password.');
    }
    
    if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      console.log('🌐 Network connection issue - Gmail SMTP blocked by your network.');
    }
    
    return { success: false, error: 'Security alert email sending failed. Please check your configuration.' };
  }
};

/**
 * Send a test security alert to verify the system is working
 */
const sendTestSecurityAlert = async () => {
  const testAlertData = {
    ipAddress: '192.168.1.100',
    attemptCount: 10,
    email: 'test@example.com',
    userAgent: 'Mozilla/5.0 (Test Security Alert)',
    timestamp: new Date().toISOString(),
    severity: 'HIGH',
    timeWindow: 15
  };

  console.log('🧪 Sending test security alert...');
  return await sendSecurityAlert(testAlertData);
};

module.exports = {
  sendSecurityAlert,
  sendTestSecurityAlert
};