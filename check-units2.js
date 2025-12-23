const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const units = await prisma.unitOfMeasure.findMany({ 
      take: 3,
      include: { organization: { select: { slug: true, name: true } } }
    });
    console.log('First 3 units:');
    units.forEach(u => {
      console.log(`  ${u.name} -> org: ${u.organization.slug}`);
    });
    
    // Get the nabatanzi org id
    const nabatanziOrg = await prisma.organization.findUnique({
      where: { slug: 'nabatanzi-cmjgxcxc' },
      select: { id: true }
    });
    console.log(`\nNabatanzi org ID: ${nabatanziOrg.id}`);
    
    // Get first unit to copy from
    const firstUnit = await prisma.unitOfMeasure.findFirst();
    console.log(`First unit org ID: ${firstUnit.organizationId}`);
  } finally {
    await prisma.$disconnect();
  }
}
main();
