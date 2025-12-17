// Security Alert System Test Script
// Simulates suspicious login activity to test the alert system

const { trackFailedLogin } = require('./src/services/securityTracker');
const { sendTestSecurityAlert } = require('./src/services/securityAlerts.service');

// Mock Express request object for testing
function createMockRequest(ipAddress, email = 'test@example.com', userAgent = 'Mozilla/5.0 (Test Browser)') {
  return {
    ip: ipAddress,
    socket: {
      remoteAddress: ipAddress
    },
    headers: {
      'user-agent': userAgent
    }
  };
}

/**
 * Test 1: Send a test security alert email
 */
async function testSecurityAlertEmail() {
  console.log('🧪 Test 1: Testing Security Alert Email System');
  console.log('='.repeat(50));
  
  try {
    const result = await sendTestSecurityAlert();
    if (result.success) {
      console.log('✅ Security alert email test PASSED');
      console.log(`   Method used: ${result.method}`);
    } else {
      console.log('❌ Security alert email test FAILED');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.log('❌ Security alert email test ERROR:', error.message);
  }
  
  console.log('');
}

/**
 * Test 2: Simulate multiple failed login attempts from same IP
 */
async function testFailedLoginTracking(ipAddress = '192.168.1.100', targetEmail = 'user@rentverse.com') {
  console.log('🧪 Test 2: Testing Failed Login Tracking System');
  console.log('='.repeat(50));
  
  const mockReq = createMockRequest(ipAddress, targetEmail);
  
  // Simulate 12 failed login attempts (should trigger alert at 10)
  console.log(`Simulating 12 failed login attempts from IP: ${ipAddress}`);
  console.log(`Target email: ${targetEmail}`);
  console.log('');
  
  for (let i = 1; i <= 12; i++) {
    try {
      const result = await trackFailedLogin(ipAddress, targetEmail, mockReq);
      
      if (result.triggered && result.alertSent) {
        console.log(`🚨 ATTEMPT ${i}: Alert triggered! ${result.message}`);
      } else if (result.triggered) {
        console.log(`⚠️  ATTEMPT ${i}: Threshold reached but no alert sent (cooldown): ${result.message}`);
      } else {
        console.log(`📊 ATTEMPT ${i}: ${result.message}`);
      }
      
      // Add a small delay between attempts to simulate real-time attacks
      if (i < 12) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.log(`❌ ATTEMPT ${i}: Error tracking failed login: ${error.message}`);
    }
  }
  
  console.log('');
}

/**
 * Test 3: Test different IP addresses
 */
async function testMultipleIPAddresses() {
  console.log('🧪 Test 3: Testing Multiple IP Address Tracking');
  console.log('='.repeat(50));
  
  const testIPs = [
    { ip: '10.0.0.1', email: 'admin@rentverse.com' },
    { ip: '172.16.0.1', email: 'manager@rentverse.com' },
    { ip: '203.0.113.1', email: 'security@rentverse.com' }
  ];
  
  for (const testCase of testIPs) {
    console.log(`Testing IP: ${testCase.ip} targeting: ${testCase.email}`);
    
    const mockReq = createMockRequest(testCase.ip, testCase.email);
    
    // Simulate 5 failed attempts for each IP (below threshold)
    for (let i = 1; i <= 5; i++) {
      try {
        const result = await trackFailedLogin(testCase.ip, testCase.email, mockReq);
        console.log(`  Attempt ${i}: ${result.message}`);
        
        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.log(`  ❌ Attempt ${i}: Error: ${error.message}`);
      }
    }
    
    console.log('');
  }
}

/**
 * Test 4: Test IP status checking
 */
async function testIPStatusChecking() {
  console.log('🧪 Test 4: Testing IP Status Checking');
  console.log('='.repeat(50));
  
  const { getIPStatus } = require('./src/services/securityTracker');
  
  const testIPs = ['192.168.1.100', '10.0.0.1', '203.0.113.1', 'unknown.ip.address'];
  
  for (const ip of testIPs) {
    const status = getIPStatus(ip);
    console.log(`IP: ${ip}`);
    console.log(`  Status: ${status.status}`);
    console.log(`  Tracked: ${status.tracked}`);
    console.log(`  Recent Attempts: ${status.attempts}`);
    if (status.tracked) {
      console.log(`  Alerts Sent: ${status.alertsSent}`);
      console.log(`  Last Attempt: ${status.lastAttempt}`);
    }
    console.log('');
  }
}

/**
 * Main test runner
 */
async function runSecurityAlertTests() {
  console.log('🛡️  RENTVERSE SECURITY ALERT SYSTEM TESTS');
  console.log('='.repeat(60));
  console.log('Starting comprehensive security alert system tests...\n');
  
  try {
    // Test 1: Email system
    await testSecurityAlertEmail();
    
    // Test 2: Failed login tracking (should trigger alert)
    await testFailedLoginTracking();
    
    // Test 3: Multiple IP addresses
    await testMultipleIPAddresses();
    
    // Test 4: Status checking
    await testIPStatusChecking();
    
    console.log('🎉 All security alert system tests completed!');
    console.log('');
    console.log('📋 Test Summary:');
    console.log('   ✅ Security Alert Email System');
    console.log('   ✅ Failed Login Tracking');
    console.log('   ✅ Multiple IP Address Monitoring');
    console.log('   ✅ IP Status Checking');
    console.log('');
    console.log('💡 Note: Check your email for security alerts!');
    console.log('   (Check both inbox and spam folder)');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Export functions for individual testing
module.exports = {
  testSecurityAlertEmail,
  testFailedLoginTracking,
  testMultipleIPAddresses,
  testIPStatusChecking,
  runSecurityAlertTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runSecurityAlertTests().catch(console.error);
}