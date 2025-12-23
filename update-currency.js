const fs = require('fs');
const path = require('path');

// List of files to update with currency formatting
const filesToUpdate = [
  'src/app/(dashboard)/[orgSlug]/reports/trial-balance/page.tsx',
  'src/app/(dashboard)/[orgSlug]/reports/balance-sheet/page.tsx',
  'src/app/(dashboard)/[orgSlug]/reports/profit-loss/page.tsx',
  'src/app/(dashboard)/[orgSlug]/reports/cash-flow/page.tsx',
];

function updateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Check if already has imports
  if (!content.includes('useOrganization')) {
    // Add imports after other imports
    content = content.replace(
      /(import .* from 'lucide-react';)/,
      `$1\nimport { useOrganization } from '@/hooks/useOrganization';\nimport { formatCurrency } from '@/lib/currency';`
    );
    modified = true;
  }

  // Add currency hook in component
  if (!content.includes('const { currency } = useOrganization()')) {
    content = content.replace(
      /(const params = useParams\(\);[\s\S]*?const orgSlug = params\.orgSlug as string;)/,
      `$1\n  const { currency } = useOrganization();`
    );
    modified = true;
  }

  // Replace $...toLocaleString() patterns
  const patterns = [
    /\$\{([a-zA-Z0-9_.]+)\.toLocaleString\(\)\}/g,
    /\$\{([a-zA-Z0-9_.]+)\.toFixed\(2\)\}/g,
    /\$\{([a-zA-Z0-9_.]+)\}/g,
  ];

  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      modified = true;
      content = content.replace(pattern, (match, variable) => {
        return `{formatCurrency(${variable}, currency)}`;
      });
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
}

console.log('🔄 Updating currency formatting in report pages...\n');

filesToUpdate.forEach(file => {
  try {
    updateFile(file);
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
  }
});

console.log('\n✨ Currency update complete!');
console.log('\n📝 Summary:');
console.log('   - Added African currencies to src/lib/currency.ts (UGX, KES, TZS, RWF, ZAR, NGN, GHS, ETB)');
console.log('   - Created useOrganization hook to fetch organization currency');
console.log('   - Updated Chart of Accounts page to use organization currency');
console.log('   - Updated Dashboard page to use organization currency');
console.log('   - Report pages will use currency from organization settings');
console.log('\n💡 The system will now display amounts in the organization\'s baseCurrency instead of hardcoded $');
