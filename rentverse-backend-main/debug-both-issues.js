const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

// Test 1: Check booking creation and notification flow
async function testBookingFlow() {
  console.log('🔍 Testing Booking Creation Flow...\n');
  
  try {
    // Test 1a: Check if there are any pending bookings that should notify landlords
    console.log('1. Checking existing bookings...');
    const bookingsResponse = await axios.get(`${BASE_URL}/bookings`, {
      headers: {
        'Authorization': 'Bearer invalid-token' // This will fail but let's see the endpoint structure
      }
    });
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Bookings endpoint exists (requires auth)');
    } else {
      console.log('❌ Bookings endpoint error:', error.response?.data || error.message);
    }
  }
  
  try {
    // Test 1b: Check properties endpoint
    console.log('\n2. Checking properties endpoint...');
    const propertiesResponse = await axios.get(`${BASE_URL}/properties?page=1&limit=5`);
    console.log(`✅ Properties endpoint working - found ${propertiesResponse.data?.data?.length || 0} properties`);
    
  } catch (error) {
    console.log('❌ Properties endpoint error:', error.response?.data || error.message);
  }
}

// Test 2: Check signature flow with detailed error logging
async function testSignatureFlow() {
  console.log('\n🔍 Testing Signature Flow...\n');
  
  try {
    // Test 2a: Check signature status endpoint
    console.log('1. Testing signature status endpoint...');
    const signatureStatusResponse = await axios.get(`${BASE_URL}/agreements/signature-status/test-lease-id`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Signature status endpoint exists (requires auth)');
    } else {
      console.log('❌ Signature status endpoint error:', error.response?.data || error.message);
    }
  }
  
  try {
    // Test 2b: Check sign endpoint
    console.log('\n2. Testing sign endpoint...');
    const signResponse = await axios.post(`${BASE_URL}/agreements/sign`, {
      leaseId: 'test-lease-id',
      signatureText: 'Test Signature'
    }, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Sign endpoint exists (requires auth)');
    } else {
      console.log('❌ Sign endpoint error:', error.response?.data || error.message);
    }
  }
}

// Test 3: Check notification system
async function testNotificationSystem() {
  console.log('\n🔍 Testing Notification System...\n');
  
  try {
    // Test if there's a notifications endpoint
    console.log('1. Checking notifications endpoint...');
    const notificationsResponse = await axios.get(`${BASE_URL}/notifications`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Notifications endpoint exists (requires auth)');
    } else if (error.response?.status === 404) {
      console.log('❌ No notifications endpoint found');
    } else {
      console.log('❌ Notifications endpoint error:', error.response?.data || error.message);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 COMPREHENSIVE SYSTEM DEBUG\n');
  console.log('=' * 50);
  
  await testBookingFlow();
  await testSignatureFlow(); 
  await testNotificationSystem();
  
  console.log('\n' + '=' * 50);
  console.log('📋 SUMMARY:');
  console.log('- Check if all endpoints are accessible');
  console.log('- Verify authentication is working');
  console.log('- Look for missing endpoints or 404 errors');
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Fix any 404 endpoint errors');
  console.log('2. Check frontend error console for JavaScript errors');
  console.log('3. Verify database relationships for booking notifications');
}

runAllTests().catch(console.error);