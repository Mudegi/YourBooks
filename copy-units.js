const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get both organizations
    const demoOrg = await prisma.organization.findUnique({
      where: { slug: 'demo-company' },
      select: { id: true }
    });
    
    const nabatanziOrg = await prisma.organization.findUnique({
      where: { slug: 'nabatanzi-cmjgxcxc' },
      select: { id: true }
    });

    if (!demoOrg || !nabatanziOrg) {
      console.log('One or both organizations not found');
      return;
    }

    // Get all units from demo-company
    const demoUnits = await prisma.unitOfMeasure.findMany({
      where: { organizationId: demoOrg.id }
    });

    console.log(`Found ${demoUnits.length} units in demo-company`);

    // Copy units to nabatanzi org
    for (const unit of demoUnits) {
      await prisma.unitOfMeasure.upsert({
        where: {
          organizationId_code: {
            organizationId: nabatanziOrg.id,
            code: unit.code,
          },
        },
        update: {},
        create: {
          organizationId: nabatanziOrg.id,
          code: unit.code,
          name: unit.name,
          abbreviation: unit.abbreviation,
          category: unit.category,
          displayOrder: unit.displayOrder,
          isActive: unit.isActive,
        },
      });
    }

    console.log(`✅ Copied ${demoUnits.length} units to nabatanzi-cmjgxcxc`);

    // Verify
    const nabatanziUnits = await prisma.unitOfMeasure.count({
      where: { organizationId: nabatanziOrg.id }
    });
    console.log(`Nabatanzi now has ${nabatanziUnits} units`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
