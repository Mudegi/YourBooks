const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if any units exist
    const count = await prisma.unitOfMeasure.count();
    console.log(`Total units: ${count}`);

    // Get the organization
    const org = await prisma.organization.findUnique({
      where: { slug: 'nabatanzi-cmjgxcxc' },
    });
    console.log(`Organization found: ${org ? org.name : 'NOT FOUND'}`);

    if (org) {
      // Get units for this org
      const units = await prisma.unitOfMeasure.findMany({
        where: { organizationId: org.id, isActive: true },
        take: 10,
      });
      console.log(`Units for organization: ${units.length}`);
      units.forEach((u) => {
        console.log(`  - ${u.name} (${u.abbreviation}) [${u.category}]`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
