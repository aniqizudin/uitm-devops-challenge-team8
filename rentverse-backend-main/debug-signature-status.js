const { PrismaClient } = require('@prisma/client');
const eSignatureService = require('./src/services/eSignature.service');

const prisma = new PrismaClient();

async function debugSignatureStatus(leaseId) {
  console.log(`\n🔍 DEBUG: Checking signature status for lease: ${leaseId}`);
  
  try {
    // Get the rental agreement directly from database
    const agreement = await prisma.rentalAgreement.findUnique({
      where: { leaseId: leaseId }
    });
    
    if (!agreement) {
      console.log('❌ No rental agreement found');
      return;
    }
    
    console.log('📋 Raw database data:');
    console.log('  - ID:', agreement.id);
    console.log('  - Status:', agreement.status);
    console.log('  - tenantSignature:', agreement.tenantSignature ? `EXISTS (${agreement.tenantSignature.substring(0, 20)}...)` : 'NULL');
    console.log('  - tenantSignedAt:', agreement.tenantSignedAt);
    console.log('  - landlordSignature:', agreement.landlordSignature ? `EXISTS (${agreement.landlordSignature.substring(0, 20)}...)` : 'NULL');
    console.log('  - landlordSignedAt:', agreement.landlordSignedAt);
    console.log('  - createdAt:', agreement.createdAt);
    console.log('  - generatedAt:', agreement.generatedAt);
    
    // Check what the signature service returns
    console.log('\n🔐 Signature service check:');
    const signatureStatus = await eSignatureService.isAgreementFullySigned(leaseId);
    console.log('  - isFullySigned:', signatureStatus.isFullySigned);
    console.log('  - tenantSigned:', signatureStatus.tenantSigned);
    console.log('  - landlordSigned:', signatureStatus.landlordSigned);
    console.log('  - tenantSignedAt:', signatureStatus.tenantSignedAt);
    console.log('  - landlordSignedAt:', signatureStatus.landlordSignedAt);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get the most recent lease IDs for testing
async function getRecentLeases() {
  const leases = await prisma.lease.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, createdAt: true }
  });
  
  console.log('📅 Recent leases:');
  leases.forEach(lease => {
    console.log(`  - ${lease.id} (${lease.createdAt})`);
  });
  
  return leases.map(l => l.id);
}

async function main() {
  try {
    const recentLeaseIds = await getRecentLeases();
    
    if (recentLeaseIds.length > 0) {
      console.log(`\n🔍 Debugging most recent lease: ${recentLeaseIds[0]}`);
      await debugSignatureStatus(recentLeaseIds[0]);
    }
    
    // Also try the specific lease ID mentioned by user if provided
    const specificLeaseId = process.argv[2];
    if (specificLeaseId) {
      console.log(`\n🔍 Debugging specific lease: ${specificLeaseId}`);
      await debugSignatureStatus(specificLeaseId);
    }
    
  } catch (error) {
    console.error('❌ Main error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();