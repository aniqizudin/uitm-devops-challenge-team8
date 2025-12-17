const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestAccounts() {
  try {
    console.log('🔍 CHECKING EXISTING ACCOUNTS AND LEASES...\n');
    
    // Check existing users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true
      }
    });
    
    console.log('=== EXISTING USERS ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name || user.firstName + ' ' + user.lastName}`);
      console.log(`Role: ${user.role || 'USER'}`);
      console.log('---');
    });

    // Check existing leases for testing
    const leases = await prisma.lease.findMany({
      include: {
        tenant: {
          select: {
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        landlord: {
          select: {
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        property: {
          select: {
            title: true,
            address: true
          }
        }
      }
    });

    console.log('\n=== EXISTING LEASES ===');
    leases.forEach(lease => {
      console.log(`Lease ID: ${lease.id}`);
      console.log(`Status: ${lease.status}`);
      console.log(`Property: ${lease.property.title}`);
      console.log(`Tenant: ${lease.tenant.name || lease.tenant.firstName + ' ' + lease.tenant.lastName} (${lease.tenant.email})`);
      console.log(`Landlord: ${lease.landlord.name || lease.landlord.firstName + ' ' + lease.landlord.lastName} (${lease.landlord.email})`);
      console.log('---');
    });

    // Check rental agreements
    const agreements = await prisma.rentalAgreement.findMany({
      include: {
        lease: {
          include: {
            tenant: { select: { email: true, name: true } },
            landlord: { select: { email: true, name: true } }
          }
        }
      }
    });

    console.log('\n=== RENTAL AGREEMENTS ===');
    agreements.forEach(agreement => {
      console.log(`Agreement ID: ${agreement.id}`);
      console.log(`Lease ID: ${agreement.leaseId}`);
      console.log(`Status: ${agreement.status}`);
      console.log(`Tenant Signed: ${!!agreement.tenantSignature}`);
      console.log(`Landlord Signed: ${!!agreement.landlordSignature}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestAccounts();