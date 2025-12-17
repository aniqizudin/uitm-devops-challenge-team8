const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
  console.log("🔐 Starting Password Reset...");

  const email = "alimi.ruziomar@gmail.com"; // Your email
  const newPassword = "password123";          // Your new password

  // 1. Encrypt the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // 2. Update the user in the database
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword }
    });
    
    console.log("✅ SUCCESS! Password updated.");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    
  } catch (error) {
    console.error("❌ Error: Could not find that user.", error);
  }
}

resetPassword()
  .finally(async () => await prisma.$disconnect());