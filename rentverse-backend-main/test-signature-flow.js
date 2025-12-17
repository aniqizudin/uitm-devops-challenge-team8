const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';
const TEST_LEASE_ID = '16cdead4-8e41-4fae-ac0c-33f70964c1a3';

// Test data - using existing users from database
const testUsers = [
  {
    email: 'kretossparta97@gmail.com',
    password: 'password123',
    name: 'Kretos Sparta (Tenant)'
  },
  {
    email: 'alimi.ruziomar@gmail.com',
    password: 'password123',
    name: 'Test User (Landlord)'
  }
];

async function loginUser(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });
    
    return {
      token: response.data.token,
      user: response.data.user
    };
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function testSignatureStatus(token, leaseId) {
  try {
    const response = await axios.get(`${BASE_URL}/agreements/signature-status/${leaseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Signature Status Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Signature status failed:', error.response?.data || error.message);
    return null;
  }
}

async function testSignAgreement(token, leaseId, signatureText) {
  try {
    const response = await axios.post(`${BASE_URL}/agreements/sign`, {
      leaseId,
      signatureText
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Sign Agreement Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Sign agreement failed:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Signature Flow Tests\n');
  
  // Test with tenant first
  console.log('1. Testing with TENANT account...');
  const tenantLogin = await loginUser(testUsers[0].email, testUsers[0].password);
  
  if (tenantLogin) {
    console.log(`✅ Tenant logged in: ${tenantLogin.user.name}`);
    
    // Test signature status
    await testSignatureStatus(tenantLogin.token, TEST_LEASE_ID);
    
    // Test signing
    console.log('\n📝 Testing tenant signature...');
    await testSignAgreement(tenantLogin.token, TEST_LEASE_ID, `${testUsers[0].name} - Tenant Signature`);
    
    // Check status after signing
    console.log('\n📊 Checking status after tenant signature...');
    await testSignatureStatus(tenantLogin.token, TEST_LEASE_ID);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Test with landlord
  console.log('2. Testing with LANDLORD account...');
  const landlordLogin = await loginUser(testUsers[1].email, testUsers[1].password);
  
  if (landlordLogin) {
    console.log(`✅ Landlord logged in: ${landlordLogin.user.name}`);
    
    // Test signature status
    await testSignatureStatus(landlordLogin.token, TEST_LEASE_ID);
    
    // Test signing
    console.log('\n📝 Testing landlord signature...');
    await testSignAgreement(landlordLogin.token, TEST_LEASE_ID, `${testUsers[1].name} - Landlord Signature`);
    
    // Check final status
    console.log('\n📊 Checking final status after both signatures...');
    await testSignatureStatus(landlordLogin.token, TEST_LEASE_ID);
  }
  
  console.log('\n🎉 Signature flow tests completed!');
}

runTests().catch(console.error);