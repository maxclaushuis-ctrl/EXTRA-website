/**
 * Unit-tests voor server/salesflowLogic.ts
 * Run met:  npx tsx server/salesflowLogic.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 * Zelfde opzet als server/redirects.test.ts.
 */
import { beoordeelReminder, faseRegelUitRij, type FaseRegel } from "./salesflowLogic";

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

const regel = (p: Partial<FaseRegel>): FaseRegel => ({
  isEndState: false, asksAppointment: false, triggerAction: null, triggerDays: null, ...p,
});

console.log("\n— beoordeelReminder(): wél een reminder —");
assertEq("actie + termijn", beoordeelReminder(regel({ triggerAction: 'bellen', triggerDays: 3 })).maakt, true);
assertEq("0 dagen mét actie is geldig (bel vandaag nog)", beoordeelReminder(regel({ triggerAction: 'bellen', triggerDays: 0 })).maakt, true);
assertEq("lange termijn", beoordeelReminder(regel({ triggerAction: 'opvolgen', triggerDays: 90 })).maakt, true);

console.log("\n— beoordeelReminder(): de bug uit v8 —");
assertEq(
  '"Geen actie" met 0 werkdagen levert GEEN reminder op',
  beoordeelReminder(regel({ triggerAction: null, triggerDays: 0 })),
  { maakt: false, reden: 'geen actie ingesteld' },
);
assertEq(
  '"Geen actie" met een termijn levert evenmin een reminder op',
  beoordeelReminder(regel({ triggerAction: null, triggerDays: 5 })).maakt,
  false,
);
assertEq(
  "lege string als actie telt als geen actie",
  beoordeelReminder(regel({ triggerAction: '   ', triggerDays: 0 })).maakt,
  false,
);

console.log("\n— beoordeelReminder(): overige gevallen —");
assertEq(
  "afspraakfase maakt nooit een reminder, ook niet met actie en termijn",
  beoordeelReminder(regel({ asksAppointment: true, triggerAction: 'bellen', triggerDays: 3 })),
  { maakt: false, reden: 'afspraakfase — de datum voer je zelf in' },
);
assertEq(
  "eindfase maakt nooit een reminder",
  beoordeelReminder(regel({ isEndState: true, triggerAction: 'bellen', triggerDays: 3 })),
  { maakt: false, reden: 'eindfase' },
);
assertEq(
  "actie zonder termijn wacht op een termijn",
  beoordeelReminder(regel({ triggerAction: 'bellen', triggerDays: null })),
  { maakt: false, reden: 'geen termijn ingesteld' },
);
assertEq(
  "lege fase (Selectie) maakt niets aan",
  beoordeelReminder(regel({})).maakt,
  false,
);

console.log("\n— faseRegelUitRij(): databasekolommen —");
assertEq(
  "snake_case rij wordt correct gelezen",
  faseRegelUitRij({ is_end_state: false, asks_appointment: true, trigger_action: 'bellen', trigger_days: 3 }),
  { isEndState: false, asksAppointment: true, triggerAction: 'bellen', triggerDays: 3 },
);
assertEq(
  "ontbrekende kolommen (oude database zonder asks_appointment) vallen terug op veilige waarden",
  faseRegelUitRij({ is_end_state: false, trigger_action: null, trigger_days: 0 }),
  { isEndState: false, asksAppointment: false, triggerAction: null, triggerDays: 0 },
);
assertEq("undefined rij crasht niet", faseRegelUitRij(undefined).asksAppointment, false);

console.log("\n— samen: de situatie van 'Afspraak gepland' —");
assertEq(
  "vóór de fix (actie leeg, 0 dagen, geen afspraakvlag) → geen reminder meer",
  beoordeelReminder(faseRegelUitRij({ is_end_state: false, trigger_action: null, trigger_days: 0 })).maakt,
  false,
);
assertEq(
  "ná het omzetten naar 'Afspraak plannen' → nog steeds geen reminder",
  beoordeelReminder(faseRegelUitRij({ is_end_state: false, asks_appointment: true, trigger_action: null, trigger_days: null })).maakt,
  false,
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
