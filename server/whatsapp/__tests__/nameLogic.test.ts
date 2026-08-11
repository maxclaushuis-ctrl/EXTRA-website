/**
 * Unit-tests voor server/whatsapp/nameLogic.ts
 * Run met:  npx tsx server/whatsapp/__tests__/nameLogic.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 */
import { splitFullName } from '../nameLogic';

let passed = 0;
let failed = 0;

function assertEq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}\n      actual:   ${JSON.stringify(actual)}\n      expected: ${JSON.stringify(expected)}`);
  }
}

console.log('\n— splitFullName() —');

// 1. Simpele twee-woord naam
assertEq('"Jan Bakker"', splitFullName('Jan Bakker'), { firstName: 'Jan', lastName: 'Bakker' });

// 2. Meerdere achternaam-delen (tussenvoegsel)
assertEq('"Jan van der Berg"', splitFullName('Jan van der Berg'), { firstName: 'Jan', lastName: 'van der Berg' });

// 3. Eén woord — lastName blijft leeg, niet null
assertEq('"Jan"', splitFullName('Jan'), { firstName: 'Jan', lastName: '' });

// 4. Lege string
assertEq('""', splitFullName(''), { firstName: '', lastName: '' });

// 5. Alleen spaties
assertEq('"   "', splitFullName('   '), { firstName: '', lastName: '' });

// 6. null
assertEq('null', splitFullName(null), { firstName: '', lastName: '' });

// 7. undefined
assertEq('undefined', splitFullName(undefined), { firstName: '', lastName: '' });

// 8. Dubbele spaties tussen woorden
assertEq('"Jan   Bakker"', splitFullName('Jan   Bakker'), { firstName: 'Jan', lastName: 'Bakker' });

// 9. Voor-/na-spaties worden getrimd
assertEq('"  Jan Bakker  "', splitFullName('  Jan Bakker  '), { firstName: 'Jan', lastName: 'Bakker' });

// 10. Bekende beperking, expliciet vastgelegd: functie-prefix telt mee als
//     "voornaam" — vandaar de handmatige-correctiemogelijkheid in de UI.
assertEq('"Chef Jan" (bekende beperking)', splitFullName('Chef Jan'), { firstName: 'Chef', lastName: 'Jan' });

// 11. Drie woorden zonder tussenvoegsel-patroon
assertEq('"Marie de Hotel Okura" (drie woorden)', splitFullName('Marie de Hotel Okura'), { firstName: 'Marie', lastName: 'de Hotel Okura' });

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
