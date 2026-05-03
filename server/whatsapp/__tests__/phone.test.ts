/**
 * Unit-tests voor server/whatsapp/phone.ts
 * Run met:  npx tsx server/whatsapp/__tests__/phone.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 */
import { normalizePhone, normalizePhoneDetailed, phonesEqual } from '../phone';

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

console.log('\n— normalizePhone() —');

// 1. Lokaal NL-nummer met 0-prefix
assertEq('NL lokaal "0612345678"', normalizePhone('0612345678'), '31612345678');

// 2. Internationaal met +
assertEq('+31612345678', normalizePhone('+31612345678'), '31612345678');

// 3. Met spaties
assertEq('"+316 1234 5678" met spaties', normalizePhone('+316 1234 5678'), '31612345678');

// 4. Met streepjes en haakjes
assertEq('"(06) 1234-5678"', normalizePhone('(06) 1234-5678'), '31612345678');

// 5. 00-prefix internationaal
assertEq('"0031612345678"', normalizePhone('0031612345678'), '31612345678');

// 6. Al genormaliseerd (geen +, geen 0)
assertEq('"31612345678" (al goed)', normalizePhone('31612345678'), '31612345678');

// 7. Niet-NL internationaal nummer (US)
assertEq('"+1 415 555 0100"', normalizePhone('+1 415 555 0100'), '14155550100');

// 8. Lege string
assertEq('lege string ""', normalizePhone(''), null);

// 9. null input
assertEq('null', normalizePhone(null), null);

// 10. undefined input
assertEq('undefined', normalizePhone(undefined), null);

// 11. Te kort (zelfs na NL-prefix nog te kort)
assertEq('"12" te kort', normalizePhone('12'), null);
// 11b. Internationaal te kort (met +, geen NL-prefix-fallback)
assertEq('"+12345" te kort internationaal', normalizePhone('+12345'), null);

// 12. Te lang (>15 cijfers totaal)
assertEq('te lang ">15 cijfers"', normalizePhone('+1234567890123456'), null);

// 13. Geen cijfers
assertEq('"abcdefg"', normalizePhone('abcdefg'), null);

// 14. Mix tekens en cijfers
assertEq('"tel: 06-12345678"', normalizePhone('tel: 06-12345678'), '31612345678');

// 15. Vaste-lijn NL
assertEq('"020-1234567"', normalizePhone('020-1234567'), '31201234567');

console.log('\n— normalizePhoneDetailed() reasons —');

assertEq('reason empty', normalizePhoneDetailed('').reason, 'empty');
assertEq('reason no_digits', normalizePhoneDetailed('abc').reason, 'no_digits');
assertEq('reason too_short', normalizePhoneDetailed('123').reason, 'too_short');
assertEq('reason too_long', normalizePhoneDetailed('+12345678901234567').reason, 'too_long');

console.log('\n— phonesEqual() —');

assertEq('06-nummer == +31-nummer', phonesEqual('0612345678', '+31 6 1234 5678'), true);
assertEq('verschillende nummers', phonesEqual('0612345678', '0687654321'), false);
assertEq('één leeg', phonesEqual('', '0612345678'), false);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
