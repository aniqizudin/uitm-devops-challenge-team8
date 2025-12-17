const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testAgreementFix() {
  try {
    console.log('🔍 TESTING AGREEMENT FIX...\n');
    
    // Create a mock admin user token (simulating admin login)
    const adminUser = {
      id: '7dc068b4-794e-456b-8cc7-3c005b180979', // admin user ID
      email: 'alimi.ruziomar@gmail.com',
      role: 'ADMIN'
    };
    
    const mockToken = jwt.sign(
      { 
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('🔑 Mock admin token created');
    console.log('📋 Testing the fixed query logic...\n');
    
    // Test the NEW query logic (same as in the fixed endpoint)
    const agreements = await prisma.rentalAgreement.findMany({
      where: {
        OR: [
          {
            AND: [
              {
                tenantSignature: {
                  not: null // Tenant has signed
                }
              },
              {
                landlordSignature: null // Landlord hasn't signed yet
              }
            ]
          },
          {
            AND: [
              {
                tenantSignature: null // Tenant hasn't signed yet
              },
              {
                landlordSignature: {
                  not: null // Landlord has signed
                }
              }
            ]
          }
        ]
      },
      include: {
        lease: {
          include: {
            property: {
              select: {
                title: true,
                address: true,
                city: true
              }
            },
            tenant: {
              select: {
                name: true,
                email: true
              }
            },
            landlord: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    });
    
    console.log('✅ QUERY RESULTS:');
    console.log(`Found ${agreements.length} agreements needing signatures\n`);
    
    agreements.forEach((agreement, index) => {
      console.log(`--- Agreement ${index + 1} ---`);
      console.log(`Agreement ID: ${agreement.id}`);
      console.log(`Lease ID: ${agreement.leaseId}`);
      console.log(`Status: ${agreement.status}`);
      console.log(`Property: ${agreement.lease.property.title}`);
      console.log(`Tenant: ${agreement.lease.tenant.name} (${agreement.lease.tenant.email})`);
      console.log(`Landlord: ${agreement.lease.landlord.name} (${agreement.lease.landlord.email})`);
      console.log(`Tenant Signed: ${!!agreement.tenantSignature}`);
      console.log(`Landlord Signed: ${!!agreement.landlordSignature}`);
      console.log('---');
      console.log('');
    });
    
    if (agreements.length > 0) {
      console.log('🎉 SUCCESS: The fix is working! Agreements are now being detected.');
    } else {
      console.log('❌ No agreements found. The query might need adjustment.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAgreementFix();