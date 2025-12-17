const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function changePropertyOwner() {
  try {
    console.log('🔄 CHANGING PROPERTY OWNERSHIP...\n');
    
    // Find the property
    const property = await prisma.property.findFirst({
      where: { title: 'Surga' }
    });
    
    if (!property) {
      console.log('❌ Property "Surga" not found');
      return;
    }
    
    console.log('📍 FOUND PROPERTY:');
    console.log(`Current Owner: ${property.ownerId}`);
    console.log(`Property: ${property.title}`);
    console.log(`Status: ${property.status}`);
    console.log('');
    
    // Find the new landlord account
    const newLandlord = await prisma.user.findFirst({
      where: { email: 'landlord.rentverse@gmail.com' }
    });
    
    if (!newLandlord) {
      console.log('❌ New landlord account not found');
      return;
    }
    
    console.log('👤 FOUND NEW LANDLORD:');
    console.log(`ID: ${newLandlord.id}`);
    console.log(`Email: ${newLandlord.email}`);
    console.log('');
    
    // Update property ownership
    const updatedProperty = await prisma.property.update({
      where: { id: property.id },
      data: { 
        ownerId: newLandlord.id,
        status: 'APPROVED' // Make sure it's approved
      }
    });
    
    console.log('✅ PROPERTY OWNERSHIP UPDATED!');
    console.log(`New Owner ID: ${updatedProperty.ownerId}`);
    console.log(`New Status: ${updatedProperty.status}`);
    console.log('');
    console.log('🎉 COMPLETE! You can now log in as landlord.rentverse@gmail.com');
    console.log('   and complete the signature process.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

changePropertyOwner();