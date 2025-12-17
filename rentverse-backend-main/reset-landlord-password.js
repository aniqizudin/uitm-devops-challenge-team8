const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetLandlordPassword() {
  try {
    console.log('🔑 RESETTING LANDLORD PASSWORD...\n');
    
    // Hash the new password
    const newPassword = 'landlord123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the landlord account
    const updatedLandlord = await prisma.user.update({
      where: { email: 'landlord.rentverse@gmail.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ PASSWORD RESET SUCCESSFUL!');
    console.log('📧 Email: landlord.rentverse@gmail.com');
    console.log('🔑 New Password: landlord123');
    console.log('');
    console.log('🎯 YOU CAN NOW:');
    console.log('1. Log out from current account');
    console.log('2. Log in with: landlord.rentverse@gmail.com');
    console.log('3. Password: landlord123');
    console.log('4. Look for pending agreements in your dashboard');
    console.log('');
    console.log('🚀 Ready to complete the signature process!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetLandlordPassword();