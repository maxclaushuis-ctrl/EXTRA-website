/**
 * Unit-tests voor server/crmNaarMail.ts
 * Run met:  npx tsx server/crmNaarMail.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 *
 * Waar het hier vooral om gaat: een synchronisatie mag nooit een afmelding,
 * bounce of blokkade wegpoetsen. Dat is de test die er echt toe doet; de rest
 * is boekhouding.
 */
import {
  CRM_VELDEN, CRM_VELDEN_ALTIJD, CRM_VELDEN_INDIEN_GEVULD, VERZENDVELDEN, BRANCHE_PER_TYPE,
  geldigEmail, emailSleutel, splitsNaam, brancheUitType, functiegroepUitFunctie,
  mailVeldenUitCrm, verschil, aanvullingen, beginwaarden,
} from "./crmNaarMail";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean, extra?: string) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${extra ? `\n      ${extra}` : ""}`); }
}

function eq(label: string, actual: unknown, expected: unknown) {
  const gelijk = JSON.stringify(actual) === JSON.stringify(expected);
  ok(label, gelijk, gelijk ? undefined : `actual:   ${JSON.stringify(actual)}\n      expected: ${JSON.stringify(expected)}`);
}

const HOTEL = { id: 7, name: 'Pulitzer Amsterdam', type: 'hotel', isClient: true, city: 'Amsterdam' };
const LEAD = { id: 8, name: 'De Nieuwe Zaak', type: 'restaurant', isClient: false, city: 'Utrecht' };

console.log("\n— de scheidslijn tussen CRM-velden en verzendvelden —");
{
  const overlap = (CRM_VELDEN as readonly string[]).filter(v => (VERZENDVELDEN as readonly string[]).includes(v));
  eq("geen enkel veld staat in beide lijsten", overlap, []);
  ok("afmelding is een verzendveld", (VERZENDVELDEN as readonly string[]).includes('unsubscribed'));
  ok("bounce-status is een verzendveld", (VERZENDVELDEN as readonly string[]).includes('bounceStatus'));
  ok("contactStatus is een verzendveld", (VERZENDVELDEN as readonly string[]).includes('contactStatus'));
  ok("taal is een verzendveld", (VERZENDVELDEN as readonly string[]).includes('taal'));
  ok("klant-of-prospect is een CRM-veld", (CRM_VELDEN as readonly string[]).includes('contactType'));
}

console.log("\n— geldigEmail() —");
ok("gewoon adres", geldigEmail('lars.s@pulitzeramsterdam.com'));
ok("subdomein", geldigEmail('a@mail.hotel.co.uk'));
ok("hoofdletters en spaties", geldigEmail('  Thomas.Kuiper@IHG.com  '));
ok("leeg", !geldigEmail(''));
ok("null", !geldigEmail(null));
ok("getal", !geldigEmail(42));
ok("zonder apenstaartje", !geldigEmail('geen-adres'));
ok("zonder domein", !geldigEmail('a@b'));
ok("twee apenstaartjes", !geldigEmail('a@b@c.nl'));
ok("spatie erin", !geldigEmail('a b@c.nl'));
ok("tld van één letter", !geldigEmail('a@b.c'));
ok("het verzonnen WhatsApp-adres telt niet", !geldigEmail('wa-31612345678@onbekend.local'));

console.log("\n— emailSleutel() —");
eq("kleine letters, geen spaties", emailSleutel('  Max@DoeHetExtra.NL '), 'max@doehetextra.nl');
eq("null wordt leeg", emailSleutel(null), '');

console.log("\n— splitsNaam() —");
eq("voor- en achternaam", splitsNaam('Lars Schrijnemakers'), { voornaam: 'Lars', achternaam: 'Schrijnemakers' });
eq("tussenvoegsel hoort bij de achternaam", splitsNaam('Jan van der Berg'), { voornaam: 'Jan', achternaam: 'van der Berg' });
eq("twee voornamen", splitsNaam('Jan Peter de Vries'), { voornaam: 'Jan Peter', achternaam: 'de Vries' });
eq("drie woorden zonder tussenvoegsel", splitsNaam('Anna Maria Bakker'), { voornaam: 'Anna Maria', achternaam: 'Bakker' });
eq("alleen een voornaam", splitsNaam('Eveline'), { voornaam: 'Eveline', achternaam: null });
eq("omgedraaid met komma", splitsNaam('Schrijnemakers, Lars'), { voornaam: 'Lars', achternaam: 'Schrijnemakers' });
eq("dubbele spaties", splitsNaam('  Max   Claushuis '), { voornaam: 'Max', achternaam: 'Claushuis' });
eq("leeg", splitsNaam(''), { voornaam: null, achternaam: null });
eq("null", splitsNaam(null), { voornaam: null, achternaam: null });

console.log("\n— brancheUitType() —");
eq("hotel", brancheUitType('hotel'), 'Hotel');
eq("eventlocatie heet in campagnes Evenementenlocatie", brancheUitType('eventlocatie'), 'Evenementenlocatie');
eq("hoofdletters", brancheUitType('Cateraar'), 'Cateraar');
eq("onbekend type geeft null", brancheUitType('sportschool'), null);
eq("null", brancheUitType(null), null);
ok("alle vijf types zijn gedekt", Object.keys(BRANCHE_PER_TYPE).length === 5);

console.log("\n— functiegroepUitFunctie(): een gok, meer niet —");
eq("F&B Manager", functiegroepUitFunctie('Food & Beverage Manager'), 'Bediening');
eq("Director of Food and Beverage", functiegroepUitFunctie('Director of Food and Beverage'), 'Bediening');
eq("Executive Chef", functiegroepUitFunctie('Executive Chef'), 'Chef');
eq("Housekeeping Manager", functiegroepUitFunctie('Housekeeping Manager'), 'Housekeeping');
eq("Warehouse Supervisor", functiegroepUitFunctie('Warehouse Supervisor'), 'Logistiek');
eq("Front Office Manager", functiegroepUitFunctie('Front Office Manager'), 'Bediening');
eq("iets onherkenbaars geeft null", functiegroepUitFunctie('General Manager'), null);
eq("leeg", functiegroepUitFunctie(''), null);
eq("null", functiegroepUitFunctie(null), null);

console.log("\n— mailVeldenUitCrm() —");
{
  const v = mailVeldenUitCrm(HOTEL, { id: 11, companyId: 7, name: 'Lars Schrijnemakers', function: 'Food & Beverage Manager', email: 'Lars.S@pulitzeramsterdam.com', phone: '020 1234567' });
  eq("naam", v?.name, 'Lars Schrijnemakers');
  eq("voornaam", v?.voornaam, 'Lars');
  eq("achternaam", v?.achternaam, 'Schrijnemakers');
  eq("e-mail genormaliseerd", v?.email, 'lars.s@pulitzeramsterdam.com');
  eq("bedrijf", v?.company, 'Pulitzer Amsterdam');
  eq("functie", v?.function, 'Food & Beverage Manager');
  eq("stad", v?.stad, 'Amsterdam');
  eq("branche", v?.branche, 'Hotel');
  eq("een klant is een klant", v?.contactType, 'klant');
  eq("de herkomst wordt vastgelegd", v?.crmContactId, 11);
  ok("er komt geen functiegroep uit", !(('functiegroep') in (v as any)));
  ok("en geen verzendveld", (VERZENDVELDEN as readonly string[]).every(f => !(f in (v as any))));
}
{
  const v = mailVeldenUitCrm(LEAD, { id: 12, companyId: 8, name: 'Sanne Bakker', email: 'sanne@nieuwezaak.nl' });
  eq("een lead is een prospect", v?.contactType, 'prospect');
  eq("branche uit het type van het bedrijf", v?.branche, 'Restaurant');
  eq("geen functie ingevuld", v?.function, null);
}
{
  eq("zonder e-mail geen verzendrij", mailVeldenUitCrm(HOTEL, { id: 13, companyId: 7, name: 'Naamloos' }), null);
  eq("met een onzinadres ook niet", mailVeldenUitCrm(HOTEL, { id: 14, companyId: 7, email: 'geen adres' }), null);
}
{
  const v = mailVeldenUitCrm(HOTEL, { id: 15, companyId: 7, email: 'info@pulitzeramsterdam.com' });
  eq("zonder naam valt de app terug op het adres", v?.name, 'info@pulitzeramsterdam.com');
  eq("en dan is er geen voornaam", v?.voornaam, null);
}
{
  const v = mailVeldenUitCrm({ id: 9, name: '  ', type: null, isClient: null, city: '' }, { id: 16, companyId: 9, email: 'x@y.nl' });
  eq("leeg bedrijf wordt null", v?.company, null);
  eq("lege stad wordt null", v?.stad, null);
  eq("onbekend type geeft geen branche", v?.branche, null);
  eq("isClient null telt als prospect", v?.contactType, 'prospect');
}

console.log("\n— verschil(): alleen wat echt anders is —");
{
  const gewenst = mailVeldenUitCrm(HOTEL, { id: 11, companyId: 7, name: 'Lars Schrijnemakers', function: 'F&B Manager', email: 'lars.s@pulitzeramsterdam.com' })!;
  eq("niets veranderd geeft niets terug", verschil({ ...gewenst }, gewenst), {});
  eq("een gewijzigde functie", verschil({ ...gewenst, function: 'Manager' }, gewenst), { function: 'F&B Manager' });
  eq("null en lege string zijn hetzelfde", verschil({ ...gewenst, stad: '' }, { ...gewenst, stad: null } as any), {});
  eq("een leeg veld dat gevuld wordt", verschil({ ...gewenst, branche: null }, gewenst), { branche: 'Hotel' });
}
{
  // Dit is de test die er echt toe doet.
  const bestaand = {
    id: 3, name: 'Lars S', email: 'lars.s@pulitzeramsterdam.com',
    company: 'Pulitzer', function: null, stad: null, branche: null,
    contactType: 'prospect', crmContactId: null,
    unsubscribed: true, unsubscribedAt: '2026-01-05', contactStatus: 'uitgeschreven',
    bounceStatus: 'hard', spamReported: true, phase: 'uitgesloten',
    taal: 'Engels', customTags: '["VIP"]', notes: 'niet meer mailen',
    whatsappOptInStatus: 'gestopt',
  };
  const gewenst = mailVeldenUitCrm(HOTEL, { id: 11, companyId: 7, name: 'Lars Schrijnemakers', function: 'F&B Manager', email: 'lars.s@pulitzeramsterdam.com' })!;
  const wijziging = verschil(bestaand, gewenst);

  ok("de naam wordt bijgewerkt", wijziging.name === 'Lars Schrijnemakers');
  ok("de klantstatus wordt bijgewerkt", wijziging.contactType === 'klant');
  ok("de koppeling wordt gelegd", wijziging.crmContactId === 11);
  for (const veld of VERZENDVELDEN) {
    ok(`${veld} blijft ongemoeid`, !(veld in wijziging));
  }
}

console.log("\n— verschil(): het CRM maakt niets leeg wat al ingevuld was —");
{
  // Dit is het geval dat een Apollo-import zou uitkleden: het CRM kent de stad
  // en de functietitel niet, de verzendlijst wel. Die mogen niet verdwijnen —
  // ze staan in de aanhef van de mail en in de segmentering.
  const rijk = {
    name: 'Piet Jansen', email: 'piet@hotel.nl', contactType: 'prospect', crmContactId: null,
    voornaam: 'Piet', achternaam: 'Jansen', company: 'Hotel Zon',
    function: 'F&B Manager', stad: 'Amsterdam', branche: 'Hotel',
  };
  const kaal = mailVeldenUitCrm(
    { id: 3, name: 'Hotel Zon', type: null, isClient: false, city: null },
    { id: 21, companyId: 3, name: 'Piet Jansen', email: 'piet@hotel.nl' },
  )!;
  const w = verschil(rijk, kaal) as Record<string, unknown>;
  ok("de stad blijft staan", !('stad' in w), JSON.stringify(w));
  ok("de functietitel blijft staan", !('function' in w));
  ok("de branche blijft staan", !('branche' in w));
  ok("de achternaam blijft staan", !('achternaam' in w));
  eq("alleen de koppeling wordt gelegd", w, { crmContactId: 21 });
}
{
  // Maar wat het CRM wél weet, wint.
  const arm = { name: 'P. Jansen', email: 'piet@hotel.nl', contactType: 'prospect', crmContactId: 21, stad: 'Utrecht', function: null };
  const rijkCrm = mailVeldenUitCrm(
    { id: 3, name: 'Hotel Zon', type: 'hotel', isClient: true, city: 'Amsterdam' },
    { id: 21, companyId: 3, name: 'Piet Jansen', function: 'Directeur', email: 'piet@hotel.nl' },
  )!;
  const w = verschil(arm, rijkCrm) as Record<string, unknown>;
  eq("stad bijgewerkt", w.stad, 'Amsterdam');
  eq("functie ingevuld", w.function, 'Directeur');
  eq("naam bijgewerkt", w.name, 'Piet Jansen');
  eq("klantstatus bijgewerkt", w.contactType, 'klant');
}
{
  // Deze twee velden moeten wél altijd volgen, ook als dat een leegmaking is.
  ok("email hoort bij de velden die altijd volgen", (CRM_VELDEN_ALTIJD as readonly string[]).includes('email'));
  ok("contactType ook", (CRM_VELDEN_ALTIJD as readonly string[]).includes('contactType'));
  ok("stad hoort bij de velden die alleen gevuld worden", (CRM_VELDEN_INDIEN_GEVULD as readonly string[]).includes('stad'));
  eq("samen zijn ze CRM_VELDEN", [...CRM_VELDEN].sort(), [...CRM_VELDEN_ALTIJD, ...CRM_VELDEN_INDIEN_GEVULD].sort());
}

console.log("\n— aanvullingen(): alleen lege velden vullen —");
{
  const contact = { id: 11, companyId: 7, function: 'Executive Chef', phone: '+31612345678' };
  eq("lege functiegroep wordt gegokt", aanvullingen({ functiegroep: null, telefoon: null }, contact), { functiegroep: 'Chef', telefoon: '+31612345678' });
  eq("een ingevulde functiegroep blijft staan", aanvullingen({ functiegroep: 'Bediening', telefoon: '+31611111111' }, contact), {});
  eq("een genormaliseerd nummer wordt niet overschreven", aanvullingen({ functiegroep: 'Chef', telefoon: '+31600000000' }, contact), {});
  eq("geen gok mogelijk, dan niets", aanvullingen({ functiegroep: null, telefoon: 'x' }, { id: 1, companyId: 1, function: 'General Manager' }), {});
}

console.log("\n— beginwaarden(): hoe een nieuwe rij start —");
{
  const b = beginwaarden({ id: 11, companyId: 7, function: 'Housekeeping Manager', phone: '020 123' });
  eq("herkomst", b.source, 'crm');
  eq("taal staat standaard op Nederlands", b.taal, 'Nederlands');
  eq("actief", b.contactStatus, 'actief');
  eq("een prospect begint in fase nieuw", b.phase, 'nieuw');
  eq("niet afgemeld", b.unsubscribed, false);
  eq("functiegroep gegokt", b.functiegroep, 'Housekeeping');
  eq("telefoon overgenomen", b.telefoon, '020 123');
  ok("geen telefoonveld als er geen nummer is", !('telefoon' in beginwaarden({ id: 1, companyId: 1 })));
  eq("een bestaande klant begint in fase klant", beginwaarden({ id: 1, companyId: 1 }, 'klant').phase, 'klant');
  ok("maar de fase wordt daarna nooit meer aangeraakt", !(CRM_VELDEN as readonly string[]).includes('phase'));
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
