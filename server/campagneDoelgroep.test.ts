/**
 * Unit-tests voor server/campagneDoelgroep.ts
 * Run met:  npx tsx server/campagneDoelgroep.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 * Zelfde opzet als server/redirects.test.ts.
 *
 * De nadruk ligt op de gevallen waarin de drie mechanismen elkaar tegenspreken.
 * Daar zit het risico: iemand die een mail krijgt die hij niet had moeten
 * krijgen, of andersom.
 */
import {
  doelgroep, doelgroepMetHerkomst, pastInFilters, magMailOntvangen,
  type DoelgroepContact, type DoelgroepFilters,
} from "./campagneDoelgroep";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean, extra?: string) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${extra ? `\n      ${extra}` : ""}`); }
}

function eq(label: string, actual: unknown, expected: unknown) {
  const gelijk = JSON.stringify(actual) === JSON.stringify(expected);
  ok(label, gelijk, gelijk ? undefined : `actual: ${JSON.stringify(actual)}  expected: ${JSON.stringify(expected)}`);
}

const contact = (over: Partial<DoelgroepContact> & { id: number }): DoelgroepContact => ({
  email: `contact${over.id}@voorbeeld.nl`,
  contactType: 'prospect',
  taal: 'Nederlands',
  branche: 'Hotel',
  functiegroep: 'Directie',
  phase: 'nieuw',
  ...over,
});

const ids = (cs: DoelgroepContact[]) => cs.map(c => c.id).sort((a, b) => a - b);

console.log("\n— magMailOntvangen(): de regel die niemand kan overrulen —");
ok("gewoon contact mag", magMailOntvangen(contact({ id: 1 })));
ok("zonder e-mailadres niet", !magMailOntvangen(contact({ id: 1, email: null })));
ok("uitgeschreven niet", !magMailOntvangen(contact({ id: 1, unsubscribed: true })));
ok("status uitgeschreven niet", !magMailOntvangen(contact({ id: 1, contactStatus: 'uitgeschreven' })));
ok("geblokkeerd niet", !magMailOntvangen(contact({ id: 1, contactStatus: 'geblokkeerd' })));

console.log("\n— pastInFilters(): losse filters —");
{
  const c = contact({ id: 1, contactType: 'klant', taal: 'Engels', branche: 'Catering', functiegroep: 'Inkoop', phase: 'in_gesprek' });
  ok("lege filters laten alles door", pastInFilters(c, {}));
  ok("type klant matcht", pastInFilters(c, { typeFilter: 'klant' }));
  ok("type prospect matcht niet", !pastInFilters(c, { typeFilter: 'prospect' }));
  ok("'alles' is geen filter", pastInFilters(c, { typeFilter: 'alles', taalFilter: 'alles' }));
  ok("taal matcht", pastInFilters(c, { taalFilter: 'Engels' }));
  ok("andere taal matcht niet", !pastInFilters(c, { taalFilter: 'Nederlands' }));
  ok("branche matcht", pastInFilters(c, { brancheFilter: ['Catering'] }));
  ok("branche in de lijst is genoeg", pastInFilters(c, { brancheFilter: ['Hotel', 'Catering'] }));
  ok("andere branche matcht niet", !pastInFilters(c, { brancheFilter: ['Hotel'] }));
  ok("functiegroep matcht", pastInFilters(c, { functieFilter: ['Inkoop'] }));
  ok("hoofdletters maken niet uit", pastInFilters(c, { functieFilter: ['inkoop'] }));
  ok("fase matcht", pastInFilters(c, { phaseFilter: ['in_gesprek'] }));
  ok("andere fase matcht niet", !pastInFilters(c, { phaseFilter: ['klant'] }));
}
{
  // Contact van vóór april 2026: functiegroep leeg, alleen de legacy-array.
  const oud = contact({ id: 2, functiegroep: null, functieTags: ['Directie'] });
  ok("legacy functieTags werken nog", pastInFilters(oud, { functieFilter: ['Directie'] }));
}
{
  const getagd = contact({ id: 3, customTags: '["ADE","VIP"]' });
  ok("tag matcht", pastInFilters(getagd, { tagFilter: '["VIP"]' }));
  ok("onbekende tag matcht niet", !pastInFilters(getagd, { tagFilter: '["Kerst"]' }));
  ok("kapotte tag-JSON laat alles door in plaats van te crashen", pastInFilters(getagd, { tagFilter: 'geen json' }));
  const zonder = contact({ id: 4, customTags: null });
  ok("contact zonder tags valt buiten een tagfilter", !pastInFilters(zonder, { tagFilter: '["VIP"]' }));
}

console.log("\n— doelgroep(): filters bepalen de basis —");
{
  const contacten = [
    contact({ id: 1, contactType: 'klant' }),
    contact({ id: 2, contactType: 'prospect' }),
    contact({ id: 3, contactType: 'klant', taal: 'Engels' }),
  ];
  eq("alleen klanten", ids(doelgroep(contacten, { typeFilter: 'klant' })), [1, 3]);
  eq("klanten die Nederlands spreken", ids(doelgroep(contacten, { typeFilter: 'klant', taalFilter: 'Nederlands' })), [1]);
  eq("zonder filters iedereen", ids(doelgroep(contacten, {})), [1, 2, 3]);
  eq("lege lijst geeft lege lijst", doelgroep([], { typeFilter: 'klant' }), []);
}

console.log("\n— doelgroep(): handmatig toevoegen —");
{
  const contacten = [
    contact({ id: 1, contactType: 'klant' }),
    contact({ id: 2, contactType: 'prospect' }),
  ];
  const f: DoelgroepFilters = { typeFilter: 'klant', extraContactIds: [2] };
  eq("een handmatig toegevoegd contact komt erbij, ook buiten de filters", ids(doelgroep(contacten, f)), [1, 2]);
  eq("iemand die al in het segment zit levert geen dubbele op",
    ids(doelgroep(contacten, { typeFilter: 'klant', extraContactIds: [1] })), [1]);
  eq("een id dat niet bestaat doet niets",
    ids(doelgroep(contacten, { typeFilter: 'klant', extraContactIds: [999] })), [1]);
}

console.log("\n— doelgroep(): waar de regels botsen —");
{
  const contacten = [contact({ id: 1 }), contact({ id: 2 })];
  eq("uitsluiten wint van het segment", ids(doelgroep(contacten, { excludedContactIds: [1] })), [2]);
  eq("uitsluiten wint óók van handmatig toevoegen",
    ids(doelgroep(contacten, { excludedContactIds: [1], extraContactIds: [1] })), [2]);
}
{
  // Het gevoeligste geval: iemand die zich heeft afgemeld en daarna handmatig
  // wordt toegevoegd. Dat mag onder geen beding een mail opleveren.
  const contacten = [
    contact({ id: 1, unsubscribed: true }),
    contact({ id: 2, contactStatus: 'geblokkeerd' }),
    contact({ id: 3, email: null }),
    contact({ id: 4 }),
  ];
  eq("afgemeld, geblokkeerd en zonder e-mail blijven buiten de lijst — ook handmatig toegevoegd",
    ids(doelgroep(contacten, { extraContactIds: [1, 2, 3] })), [4]);
}

console.log("\n— doelgroepMetHerkomst(): wat de Ontvangers-tab toont —");
{
  const contacten = [
    contact({ id: 1, contactType: 'klant' }),
    contact({ id: 2, contactType: 'prospect' }),
    contact({ id: 3, contactType: 'klant' }),
  ];
  const regels = doelgroepMetHerkomst(contacten, {
    typeFilter: 'klant',
    extraContactIds: [2],
    excludedContactIds: [3],
  });
  eq("drie regels in beeld", regels.length, 3);
  eq("id 1 komt uit het segment", regels.find(r => r.contact.id === 1)?.herkomst, 'segment');
  eq("id 2 is handmatig toegevoegd", regels.find(r => r.contact.id === 2)?.herkomst, 'handmatig');
  ok("id 3 staat erbij maar is uitgesloten", regels.find(r => r.contact.id === 3)?.uitgesloten === true);
  eq("en krijgt dus geen mail", ids(doelgroep(contacten, { typeFilter: 'klant', extraContactIds: [2], excludedContactIds: [3] })), [1, 2]);
  ok("een uitgeschreven contact staat niet eens in de lijst",
    doelgroepMetHerkomst([contact({ id: 9, unsubscribed: true })], {}).length === 0);
}

console.log("\n— randgevallen die niet mogen crashen —");
ok("null-lijst", doelgroep(null as any, {}).length === 0);
ok("filters met null-arrays", doelgroep([contact({ id: 1 })], {
  brancheFilter: null, functieFilter: null, phaseFilter: null,
  excludedContactIds: null, extraContactIds: null, tagFilter: null,
}).length === 1);
ok("contact zonder fase telt als 'nieuw'", pastInFilters(contact({ id: 1, phase: null }), { phaseFilter: ['nieuw'] }));

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
