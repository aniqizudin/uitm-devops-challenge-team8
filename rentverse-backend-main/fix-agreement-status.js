const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAgreementStatus() {
  try {
    console.log('🔧 FIXING AGREEMENT STATUS...\n');
    
    // Fix the undefined status for all rental agreements
    const agreements = await prisma.rentalAgreement.findMany({
      where: {
        OR: [
          { status: null },
          { status: 'undefined' }
        ]
      }
    });
    
    console.log(`Found ${agreements.length} agreements with undefined/null status`);
    
    for (const agreement of agreements) {
      // Set default status to 'PENDING' for agreements without status
      await prisma.rentalAgreement.update({
        where: { id: agreement.id },
        data: { status: 'PENDING' }
      });
      console.log(`✅ Fixed agreement ${agreement.id} - Status set to PENDING`);
    }
    
    // Verify the fix
    const testLeaseId = '1f1f8cc7-2379-4f1c-adb7-2e1f30cc7f8b';
    const agreement = await prisma.rentalAgreement.findUnique({
      where: { leaseId: testLeaseId }
    });
    
    console.log('\n📋 TEST AGREEMENT STATUS:');
    console.log('ID:', agreement.id);
    console.log('Lease ID:', agreement.leaseId);
    console.log('Status:', agreement.status);
    console.log('Tenant Signature:', !!agreement.tenantSignature);
    console.log('Landlord Signature:', !!agreement.landlordSignature);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixAgreementStatus();