/**
 * Generate a secure OTP code
 * @param {number} length - Length of the OTP code (default: 6)
 * @returns {string} - OTP code as string
 */
function generateOTP(length = 6) {
  // Generate a random number between 0 and 10^length - 1
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  
  return otp.toString();
}

/**
 * Generate OTP with expiry time
 * @param {number} length - Length of the OTP code (default: 6)
 * @param {number} expiryMinutes - Expiry time in minutes (default: 10)
 * @returns {Object} - Object containing OTP and expiry time
 */
function generateOTPWithExpiry(length = 6, expiryMinutes = 10) {
  const otp = generateOTP(length);
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
  
  return {
    otp,
    expiry,
    isExpired: function() {
      return new Date() > this.expiry;
    }
  };
}

module.exports = {
  generateOTP,
  generateOTPWithExpiry
};
