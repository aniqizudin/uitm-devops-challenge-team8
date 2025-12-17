// Real Login Attack Simulation Script
// Makes actual HTTP requests to test the security alert system

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000';
const TARGET_EMAIL = 'admin@rentverse.com';
const FAKE_PASSWORD = 'wrongpassword123';
const ATTEMPTS_NEEDED = 10;

/**
 * Simulate a failed login attempt via HTTP request
 */
async function simulateFailedLogin(attemptNumber) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: TARGET_EMAIL,
      password: FAKE_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTest/1.0 (Simulated Attack Script)'
      },
      timeout: 10000
    });

    // This shouldn't happen with wrong credentials, but just in case
    console.log(`⚠️  ATTEMPT ${attemptNumber}: Unexpected success (this shouldn't happen)`);
    return { success: false, error: 'Unexpected success' };

  } catch (error) {
    if (error.response) {
      // Expected 400 error for invalid credentials
      if (error.response.status === 400) {
        console.log(`✅ ATTEMPT ${attemptNumber}: Failed login recorded (expected)`);
        return { success: true, status: 400 };
      } else {
        console.log(`❌ ATTEMPT ${attemptNumber}: HTTP ${error.response.status} error`);
        return { success: false, error: `HTTP ${error.response.status}` };
      }
    } else if (error.request) {
      console.log(`❌ ATTEMPT ${attemptNumber}: Network error - is backend running?`);
      return { success: false, error: 'Network error' };
    } else {
      console.log(`❌ ATTEMPT ${attemptNumber}: Request error - ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Simulate an attack from a specific IP address
 */
async function simulateAttackFromIP(ipAddress, label = 'Test') {
  console.log(`🎯 Starting ${label} attack simulation from IP: ${ipAddress}`);
  console.log(`📧 Target: ${TARGET_EMAIL}`);
  console.log(`🔑 Password attempts: ${FAKE_PASSWORD}`);
  console.log(`📊 Required attempts: ${ATTEMPTS_NEEDED}`);
  console.log('');

  let successCount = 0;
  let failureCount = 0;

  for (let i = 1; i <= ATTEMPTS_NEEDED; i++) {
    try {
      // Add small delay between attempts to be respectful
      if (i > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const result = await simulateFailedLogin(i);
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        console.log(`   💥 Failed attempt ${i}: ${result.error}`);
      }

      // Stop if we get too many network failures
      if (failureCount > 3) {
        console.log('');
        console.log('❌ Too many network failures. Stopping test.');
        console.log('💡 Make sure the backend server is running on http://localhost:8000');
        break;
      }

    } catch (error) {
      console.log(`❌ ATTEMPT ${i}: Unexpected error - ${error.message}`);
      failureCount++;
    }
  }

  console.log('');
  console.log(`📊 ${label} Attack Results:`);
  console.log(`   ✅ Successful failed logins: ${successCount}`);
  console.log(`   ❌ Network/other failures: ${failureCount}`);
  
  if (successCount >= ATTEMPTS_NEEDED) {
    console.log(`🎉 SUCCESS: ${ATTEMPTS_NEEDED} failed attempts completed!`);
    console.log('📧 Check your admin email for security alert!');
    console.log('🔍 Also check server console for security tracking logs');
  } else {
    console.log(`⚠️  PARTIAL: Only ${successCount} failed attempts recorded`);
  }
  
  console.log('');
  return { successCount, failureCount };
}

/**
 * Test with multiple different "attackers"
 */
async function runMultiAttackTest() {
  console.log('🛡️  RENTVERSE REAL ATTACK SIMULATION');
  console.log('='.repeat(60));
  console.log('Testing security alert system with real HTTP requests...\n');

  try {
    // Test 1: Single attacker (should trigger alert)
    await simulateAttackFromIP('192.168.1.200', 'Single Attacker');
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Different attacker (below threshold)
    await simulateAttackFromIP('10.0.0.100', 'Second Attacker (5 attempts)');
    
    console.log('🎯 Real Attack Simulation Complete!');
    console.log('');
    console.log('📋 What to Expect:');
    console.log('   1. Console logs showing failed login tracking');
    console.log('   2. Security alert email (check admin inbox)');
    console.log('   3. Activity logs in database');
    console.log('');
    console.log('🔧 Backend Status Check:');
    try {
      const healthCheck = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
      console.log('   ✅ Backend is running and responding');
    } catch (error) {
      console.log('   ❌ Backend is not responding');
      console.log('   💡 Start backend with: cd rentverse-backend-main && npm run dev');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

/**
 * Quick single-attack test (just enough to trigger alert)
 */
async function quickAlertTest() {
  console.log('⚡ Quick Security Alert Test (10 attempts only)');
  console.log('='.repeat(50));
  
  try {
    await simulateAttackFromIP('127.0.0.1', 'Quick Test');
  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
  }
}

// Export functions
module.exports = {
  simulateAttackFromIP,
  runMultiAttackTest,
  quickAlertTest
};

// Run appropriate test based on command line argument
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'quick') {
    quickAlertTest();
  } else if (args[0] === 'multi') {
    runMultiAttackTest();
  } else {
    console.log('Usage:');
    console.log('  node test-real-login-attacks.js quick  # 10 attempts only');
    console.log('  node test-real-login-attacks.js multi  # Multiple attackers test');
    console.log('');
    console.log('Starting default quick test...\n');
    quickAlertTest();
  }
}