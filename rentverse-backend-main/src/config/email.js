const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

const sendOTP = async (toEmail, otpCode) => {
  // Try Resend first if available
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Rentverse Security <onboarding@resend.dev>',
        to: [toEmail],
        subject: 'Your Verification Code - Rentverse',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; font-size: 28px; margin: 0;">🏠 Rentverse</h1>
              <h2 style="color: #34495e; font-size: 20px; margin: 10px 0 0 0;">Security Verification</h2>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="color: #555; font-size: 16px; margin: 0 0 20px 0;">Hello! Your verification code is:</p>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin: 20px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${otpCode}</span>
              </div>
              
              <p style="color: #666; font-size: 14px; margin: 20px 0 10px 0;">⏰ This code expires in <strong>10 minutes</strong></p>
              <p style="color: #888; font-size: 12px; margin: 0;">If you didn't request this code, please ignore this email.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">🔒 This email was sent by Rentverse Security System</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.log('❌ Resend API Error:', error);
        console.log('📋 Full Resend Response:', JSON.stringify({ data, error }, null, 2));
      } else {
        console.log('✅ Resend Success:', data);
        console.log(`📧 Email sent successfully to ${toEmail} via Resend`);
        console.log(`🆔 Email ID: ${data?.id || 'N/A'}`);
      }

      if (!error) {
        return { success: true, method: 'resend', data: data };
      }
    } catch (error) {
      console.log('❌ Resend service error:', error);
    }
  }

  // Fallback to Gmail if Resend fails
  try {
    const transporter = createGmailTransporter();
    const mailOptions = {
      from: `"Rentverse Security" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your Verification Code - Rentverse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; font-size: 28px; margin: 0;">🏠 Rentverse</h1>
            <h2 style="color: #34495e; font-size: 20px; margin: 10px 0 0 0;">Security Verification</h2>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="color: #555; font-size: 16px; margin: 0 0 20px 0;">Hello! Your verification code is:</p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin: 20px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${otpCode}</span>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0 10px 0;">⏰ This code expires in <strong>10 minutes</strong></p>
            <p style="color: #888; font-size: 12px; margin: 0;">If you didn't request this code, please ignore this email.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">🔒 This email was sent by Rentverse Security System</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP successfully sent to ${toEmail} via Gmail`);
    return { success: true, method: 'gmail' };

  } catch (error) {
    console.error('❌ Gmail SMTP Error:', error.message);
    
    // Check for specific issues
    if (error.message.includes('Invalid login') || error.message.includes('535')) {
      console.log('🔧 Gmail authentication failed. Please verify your App Password.');
    }
    
    if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      console.log('🌐 Network connection issue - Gmail SMTP blocked by your network.');
    }
    
    return { success: false, error: 'Email sending failed. Please check your configuration.' };
  }
};

module.exports = { sendOTP };