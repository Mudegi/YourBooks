const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Find organization by slug pattern
    const orgs = await prisma.organization.findMany({
      where: {
        slug: {
          contains: 'nabatanzi'
        }
      },
      include: {
        _count: {
          select: {
            chartOfAccounts: true
          }
        }
      }
    });

    console.log('\n📊 Organization Check:');
    console.log('='.repeat(60));
    
    for (const org of orgs) {
      console.log(`\nOrganization: ${org.name}`);
      console.log(`Slug: ${org.slug}`);
      console.log(`Industry: ${org.industry || 'Not set'}`);
      console.log(`Onboarding Completed: ${org.onboardingCompleted}`);
      console.log(`Chart of Accounts Count: ${org._count.chartOfAccounts}`);
      console.log(`Legal Name: ${org.legalName || 'Not set'}`);
      console.log(`Home Country: ${org.homeCountry || 'Not set'}`);
      console.log(`Base Currency: ${org.baseCurrency || 'Not set'}`);
      
      // Get actual accounts
      const accounts = await prisma.chartOfAccount.findMany({
        where: { organizationId: org.id },
        orderBy: { code: 'asc' }
      });
      
      if (accounts.length > 0) {
        console.log(`\n📋 Sample Accounts (first 5):`);
        accounts.slice(0, 5).forEach(acc => {
          console.log(`  ${acc.code} - ${acc.name} (${acc.accountType})`);
        });
      } else {
        console.log('\n⚠️  NO ACCOUNTS FOUND!');
      }
    }
    
    if (orgs.length === 0) {
      console.log('\n❌ No organization found with slug containing "nabatanzi"');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
