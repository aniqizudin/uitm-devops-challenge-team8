const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Magic Seed for Module 3...");

  // 1. Find your user (Alimi)
  const user = await prisma.user.findFirst({
    where: { email: { contains: "alimi" } } 
  });

  if (!user) {
    console.error("❌ Error: Could not find user 'alimi'. Did you register?");
    return;
  }
  console.log(`✅ Found User: ${user.email} (${user.id})`);

  // 2. Create Property Type (if not exists)
  let propType = await prisma.propertyType.findUnique({ where: { code: 'APT' } });
  if (!propType) {
    propType = await prisma.propertyType.create({
      data: { name: 'Apartment', code: 'APT' }
    });
    console.log("✅ Created Property Type: Apartment");
  }

  // 3. Create a Property
  const property = await prisma.property.create({
    data: {
      title: "Module 3 Security House",
      address: "123 Secure Lane",
      city: "Tapah",
      state: "Perak",
      zipCode: "35000",
      country: "MY",
      price: 1500,
      code: `SEC-${Math.floor(Math.random() * 10000)}`, // Random code to avoid duplicates
      ownerId: user.id,
      propertyTypeId: propType.id
    }
  });
  console.log(`✅ Created Property: ${property.title}`);

  // 4. Create a Lease
  const lease = await prisma.lease.create({
    data: {
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      rentAmount: 1500,
      propertyId: property.id,
      tenantId: user.id,   // You are renting...
      landlordId: user.id, // ...from yourself!
      status: 'APPROVED'
    }
  });
  console.log(`✅ Created Lease ID: ${lease.id}`);

  // 5. Create the Agreement (The document we need to sign!)
  const agreement = await prisma.rentalAgreement.create({
    data: {
      leaseId: lease.id,
      status: 'DRAFT'
    }
  });

  console.log("\n🎉 SUCCESS! Everything is ready.");
  console.log("------------------------------------------------");
  console.log("👉 USE THIS LEASE ID IN POSTMAN/THUNDER CLIENT:");
  console.log(`   ${lease.id}`);
  console.log("------------------------------------------------");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());