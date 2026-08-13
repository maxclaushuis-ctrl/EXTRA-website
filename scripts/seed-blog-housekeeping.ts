/**
 * npm run seed:blog-housekeeping
 *
 * Plaatst de blog "Housekeeping personeel inhuren" op /blog/housekeeping-personeel-inhuren.
 *
 * Schrijft RECHTSTREEKS naar de database, net als scripts/import-contacten.ts.
 * Bewust niet via de admin-API zoals scripts/seed-vacatures.ts doet: die
 * stuurt een `admin_token`-cookie mee, maar adminMiddleware in server/routes.ts
 * controleert een échte ingelogde sessie (req.session.userId + userRole).
 * Een token levert daar dus gewoon 403 op.
 *
 * IDEMPOTENT: blog_posts heeft géén unique index op slug, dus zonder controle
 * zou een tweede run een duplicaat opleveren. Het script zoekt daarom eerst op
 * slug en werkt die post bij in plaats van een nieuwe aan te maken.
 *
 * Draaien (server hoeft NIET te draaien, DATABASE_URL moet gezet zijn):
 *   1. npm run seed:blog-housekeeping
 *   2. daarna eenmalig `npm run build && npm run prerender` om het
 *      crawler-fragment te genereren (vereist DATABASE_URL + Chromium).
 *
 * Feitencontrole (augustus 2026) — alleen geverifieerde claims staan in de tekst:
 *   - cao voor uitzendkrachten, gelijkwaardige arbeidsvoorwaarden per 1-1-2026: bevestigd
 *   - artikel 38 cao Schoonmaak (werkgelegenheid bij contractwisseling): bevestigd
 *   - citaat John van Keulen (80 / 50 kamers): letterlijk geverifieerd bij de bron
 *   - Temper: hof-arrest juni 2026, cassatie loopt bij de Hoge Raad — als zodanig benoemd
 *   - de CBS-verblijfsduurcijfers uit de briefing (1,87 → 1,83) waren NIET te
 *     verifiëren en staan daarom bewust niet in de tekst; het onderliggende
 *     punt (kortere verblijven = meer vertrekkamers) is kwalitatief gebracht.
 */
import { eq } from 'drizzle-orm';
import { db, pool } from '../server/db';
import { blogPosts } from '@shared/schema';

const SLUG = 'housekeeping-personeel-inhuren';

const content = `<p>Er zijn drie manieren om de housekeeping van je hotel te bemensen: zelf mensen aannemen, het werk uitbesteden aan een schoonmaakbedrijf, of personeel per uur inlenen bij een uitzendbureau. Het verschil zit niet alleen in de prijs. Het zit vooral in wie er leiding geeft op de vloer, welke cao geldt, wie aansprakelijk is als het misgaat en hoe makkelijk je er weer uit komt.</p>

  <p>Kort antwoord: onder de vijftig kamers houd je het zelf en huur je bij op drukke dagen. Tussen de vijftig en honderdvijftig kamers werkt een vaste kern met een flexibele schil het beste. Daarboven kan volledig uitbesteden rust geven, mits je bezetting stabiel is. Hieronder lees je waarom, en welke vragen je een leverancier stelt voordat je tekent.</p>

  <h2>De drie modellen, kort uitgelegd</h2>

  <h3>1. Zelf in dienst</h3>
  <p>Je neemt room attendants, houseman en een supervisor zelf aan. Je bepaalt de standaard, je bouwt kennis op en op jaarbasis is je uurtarief het laagst.</p>
  <p>Het nadeel ken je: je betaalt die loonkosten ook in februari, als je halfleeg staat. Bij ziekte draai je op voor de loondoorbetaling én voor de vervanging. En werven in Amsterdam is een vak apart, zeker voor een functie met veel concurrentie en hoog verloop.</p>

  <h3>2. Uitbesteden aan een schoonmaakbedrijf</h3>
  <p>Bij uitbesteding koop je een resultaat in, meestal tegen een prijs per kamer. Het schoonmaakbedrijf levert de mensen, de leiding, de middelen en de controle. Juridisch heet dat aanneming van werk: die medewerkers werken onder leiding van hun eigen werkgever, niet van jouw housekeeping manager.</p>
  <p>Twee dingen om vooraf te weten. Ze vallen onder de cao Schoonmaak, niet onder jouw horeca-cao. En artikel 38 van diezelfde cao regelt dat bij een contractwisseling het winnende schoonmaakbedrijf de betrokken medewerkers een aanbod moet doen. Goed voor de continuïteit op je vloer. Maar het betekent ook dat je met een leverancierswissel niet automatisch een ander team krijgt. Ben je ontevreden over specifieke mensen, dan lost een aanbesteding dat niet op.</p>

  <h3>3. Inlenen via een uitzendbureau</h3>
  <p>Bij inlenen betaal je per gewerkt uur voor mensen die bij het uitzendbureau in loondienst zijn, maar die op jouw vloer onder leiding van jouw supervisor werken. Jij bepaalt het schema, de standaard en het aantal kamers per medewerker.</p>
  <p>Sinds 1 januari 2026 geldt in de cao voor uitzendkrachten het principe van gelijkwaardige arbeidsvoorwaarden. Het totale pakket van de uitzendkracht moet in waarde minimaal gelijk zijn aan dat van een vaste medewerker in dezelfde functie bij jou. Dat betekent twee dingen: de ingeleende room attendant wordt beloond op basis van jouw voorwaarden, en jij moet die voorwaarden compleet aanleveren bij je bureau. Geen formaliteit — een verplichting.</p>
  <p>Het echte voordeel van inlenen zit in de aansprakelijkheid. Leen je in bij een bureau dat voldoet aan <a href="https://www.doehetextra.nl/nen-4400-1-certificering">NEN 4400-1</a> en in het SNA-register staat, dan kun je je onder voorwaarden vrijwaren van inlenersaansprakelijkheid voor loonheffingen en btw. Die vrijwaring bestaat niet bij aanneming van werk.</p>

  <h2>Vergelijking op de punten die tellen</h2>

  <figure>
    <img src="/images/vergelijking-housekeeping-uitbesteden-inlenen-eigen-dienst.webp" alt="Overzicht dat eigen housekeepingteam, uitbesteden aan een schoonmaakbedrijf en inlenen via een uitzendbureau vergelijkt op leiding, cao, kosten, opzegbaarheid en aansprakelijkheid" width="2400" height="1520" loading="lazy" />
  </figure>

  <div class="tabel-scroll">
  <table>
    <thead>
      <tr><th>&nbsp;</th><th>Eigen dienst</th><th>Schoonmaakbedrijf</th><th>Uitzendbureau</th></tr>
    </thead>
    <tbody>
      <tr><td>Leiding en toezicht</td><td>Jouw hotel</td><td>Het schoonmaakbedrijf</td><td>Jouw hotel</td></tr>
      <tr><td>Prijsmodel</td><td>Vaste loonkosten</td><td>Meestal per kamer</td><td>Per gewerkt uur</td></tr>
      <tr><td>Cao voor de medewerker</td><td>Jouw horeca-cao</td><td>Cao Schoonmaak</td><td>Gelijkwaardig aan jouw voorwaarden</td></tr>
      <tr><td>Kosten bij lage bezetting</td><td>Lopen door</td><td>Dalen mee</td><td>Dalen mee</td></tr>
      <tr><td>Loondoorbetaling bij ziekte</td><td>Voor jouw rekening</td><td>Voor de leverancier</td><td>Voor het bureau</td></tr>
      <tr><td>Wisselen van partij</td><td>Niet van toepassing</td><td>Overnameplicht personeel (art. 38)</td><td>Per opdracht opzegbaar</td></tr>
      <tr><td>Vrijwaring aansprakelijkheid</td><td>Niet van toepassing</td><td>Niet mogelijk</td><td>Mogelijk via NEN 4400-1 en g-rekening</td></tr>
      <tr><td>Grip op wie er staat</td><td>Volledig</td><td>Beperkt</td><td>Via een vaste poule per hotel</td></tr>
    </tbody>
  </table>
  </div>

  <h2>Wat past bij jouw hotel?</h2>

  <figure>
    <img src="/images/beslisboom-housekeeping-model-hotel.webp" alt="Beslisboom die per hotelgrootte en bezettingspatroon het passende housekeepingmodel aangeeft" width="2400" height="1400" loading="lazy" />
  </figure>

  <p><strong>Onder de vijftig kamers.</strong> Houd je housekeeping in eigen hand en vul aan met ingeleende krachten op drukke dagen. Volledig uitbesteden levert bij deze omvang zelden een besparing op, omdat je het toezicht toch al zelf organiseert.</p>
  <p><strong>Vijftig tot honderdvijftig kamers met wisselende bezetting.</strong> Dit is de klassieke situatie voor een vaste kern plus een flexibele schil. Je basisbezetting draait op eigen mensen, pieken en uitval vang je op met inleen. Zo koppel je je grootste variabele kostenpost aan je bezetting zonder je kwaliteit uit handen te geven.</p>
  <p><strong>Meer dan honderdvijftig kamers, stabiele bezetting, geen eigen housekeeping-aansturing.</strong> Hier kan volledig uitbesteden rust opleveren. Reken dan wel door wat er gebeurt als je over drie jaar wilt wisselen.</p>

  <blockquote>Wij maken vooral de grotere hotels schoon. Dat is logisch, want het uitbesteden van de schoonmaak is eigenlijk pas zinvol vanaf een kamer of tachtig. Onder de vijftig kamers is het sowieso niet voordelig om een extern bedrijf in te schakelen. — John van Keulen, Bosman Services, in Hospitality Management</blockquote>

  <p>Eén ding dat in Amsterdam extra meeweegt: verblijven worden korter. Kortere verblijven betekenen meer check-outs per bezette kamer, en een vertrekkamer kost aanzienlijk meer tijd dan een blijfkamer. Je housekeepingbehoefte stijgt dus sneller dan je bezettingsgraad doet vermoeden. Wie zijn planning alleen op bezettingspercentages baseert, plant structureel te krap.</p>

  <h2>Vijf vragen die je elke leverancier stelt</h2>
  <ul>
    <li><strong>Staan jullie in het SNA-register en voldoen jullie aan NEN 4400-1?</strong> Vraag het registratienummer op en controleer het zelf via normeringarbeid.nl. Bij inlening bepaalt dit of je je kunt vrijwaren van inlenersaansprakelijkheid.</li>
    <li><strong>Werken jullie met mensen in loondienst of met zzp'ers?</strong> Sinds het Temper-arrest van juni 2026 — waarin het hof oordeelde dat platformwerkers uitzendkrachten zijn, en waartegen cassatie loopt bij de Hoge Raad — is dit voor hotels een risicovraag geworden, niet alleen een principekwestie.</li>
    <li><strong>Wie geeft leiding op de vloer?</strong> Bij uitbesteding hoort dat de leverancier te zijn. Stuurt jouw supervisor de mensen aan terwijl je een aanneemcontract hebt getekend, dan klopt de constructie niet met de praktijk.</li>
    <li><strong>Wat gebeurt er met het team als ik overstap?</strong> Vraag expliciet naar de overnameverplichting bij contractwisseling en wat dat betekent voor mensen die jij liever niet meer op je vloer ziet.</li>
    <li><strong>Hoe vast is de poule?</strong> Vraag welk deel van de diensten wordt gedraaid door medewerkers die eerder bij jou hebben gewerkt. Vaste gezichten schelen inwerktijd en tillen je cleanliness scores op.</li>
  </ul>

  <div class="tip">💡 Vraag het SNA-registratienummer altijd op papier en controleer het zelf. Een leverancier die zegt "gecertificeerd" te zijn zonder nummer, is dat vaak net niet. EXTRA werkt uitsluitend met medewerkers in loondienst en is NEN 4400-1 gecertificeerd.</div>

  <h2>De fouten die we het vaakst zien</h2>
  <p><strong>Alleen op uurtarief vergelijken.</strong> Een tarief zegt niets zolang je niet weet hoeveel kamers per uur eronder liggen, welke toeslagen erbij komen en wat de minimale dienstduur is.</p>
  <p><strong>Een aanneemcontract tekenen en het als inleen behandelen.</strong> Maakt jouw floor supervisor de dagindeling, deelt hij de kamerlijsten uit en controleert hij de kwaliteit? Dan leen je feitelijk personeel in. Daar hoort een inleenovereenkomst bij, met alle afspraken over beloning en aansprakelijkheid.</p>
  <p><strong>Arbeidsvoorwaarden niet aanleveren.</strong> Sinds 2026 kan je uitzendpartner de beloning niet correct vaststellen zonder een compleet overzicht van jouw arbeidsvoorwaarden. Lever je dat niet aan, dan loop je risico op nabetalingen.</p>
  <p><strong>Pas bellen als het al misgaat.</strong> Een poule opbouwen kost weken. Bel je vrijdagmiddag voor zaterdagochtend, dan krijg je wie er beschikbaar is — niet wie het beste bij jouw hotel past.</p>

  <h2>Veelgestelde vragen</h2>

  <h3>Is housekeeping inhuren duurder dan zelf in dienst nemen?</h3>
  <p>Per uur wel. Per jaar hangt het af van je bezettingsgraad. Bij sterk wisselende bezetting is een vaste kern plus flexibele schil vrijwel altijd goedkoper dan een volledig vast team dat je in de dalmaanden doorbetaalt.</p>

  <h3>Mag ik ingeleende housekeeping medewerkers zelf aansturen?</h3>
  <p>Ja. Bij inlening werken de medewerkers juist onder jouw leiding en toezicht — dat is het wezenlijke verschil met uitbesteding. Bij aanneming van werk ligt de aansturing bij de leverancier.</p>

  <h3>Kan ik iemand die via een uitzendbureau bij mij werkt in dienst nemen?</h3>
  <p>Meestal wel. Kijk in de algemene voorwaarden welke termijn en welke overnamevergoeding gelden, en maak daar bij aanvang afspraken over.</p>

  <h3>Hoe snel kan ik housekeeping personeel geregeld hebben?</h3>
  <p>Voor een losse dienst gaat dat vaak binnen enkele dagen. Wil je een vaste poule die jouw standaarden kent, reken dan op een aanlooptijd van enkele weken.</p>

  <p>Twijfel je nog tussen uitbesteden en inlenen? Bekijk <a href="https://www.doehetextra.nl/hotelpersoneel-inhuren">hoe wij hotelpersoneel leveren</a>, lees <a href="https://www.doehetextra.nl/klantcases-horeca">ervaringen van hotels die met ons werken</a>, of <a href="https://www.doehetextra.nl/personeelsaanvraag">vraag vrijblijvend housekeeping personeel aan</a>. We denken ook mee als je uiteindelijk voor een ander model kiest.</p>`;

const post = {
  title: 'Housekeeping personeel inhuren: uitzendbureau, schoonmaakbedrijf of eigen team?',
  slug: SLUG,
  excerpt:
    'Zelf in dienst nemen, uitbesteden per kamer of inlenen per uur? De drie modellen naast elkaar op leiding, cao, kosten, opzegbaarheid en aansprakelijkheid — met een checklist voor je leverancier.',
  content,
  metaTitle: 'Housekeeping personeel inhuren: 3 modellen vergeleken',
  // Let op: metaDescription staat óók zichtbaar als intro-blok onder de H1
  // (zie NieuwsArtikel.tsx), dus dit moet als gewone zin te lezen zijn.
  metaDescription:
    'Uitzendbureau, schoonmaakbedrijf of eigen team? Vergelijk de drie manieren om housekeeping personeel in te huren op cao, leiding, kosten en opzegbaarheid.',
  focusKeyword: 'housekeeping personeel inhuren',
  category: 'Housekeeping',
  // Eigen beeld van EXTRA (client/src/assets/images/blog-housekeeping.jpg),
  // bijgesneden tot een brede band omdat de hero ~3:1 is. Bewust zonder tekst
  // in de afbeelding: de pagina legt er zelf een donkere gradient overheen en
  // zet de titel eronder, dus tekst in het beeld valt weg of wordt afgesneden.
  imageUrl: '/images/housekeeping-hotelkamer-amsterdam.webp',
  imageAlt: 'Opgemaakt hotelbed met verse linnengoed en een nachtkastje in een hotelkamer',
  author: 'EXTRA Redactie',
  readTime: '7 min',
  tags: ['housekeeping', 'hotels', 'inhuren'],
  // status en publishedAt staan hier bewust NIET in: die zet het
  // publish-endpoint hieronder server-side (met een echt Date-object).
  // Een ISO-string meesturen zou op de zod/drizzle-validatie stuklopen.
};

async function main() {
  console.log('🌱 Blog plaatsen: ' + SLUG + '\n');

  // 1. Bestaat de slug al? Zonder deze controle levert een tweede run een
  //    duplicaat op — blog_posts heeft geen unique index op slug.
  const [bestaand] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, SLUG));

  // status en publishedAt worden hier gezet met een echt Date-object; dat is
  // precies wat het publish-endpoint in routes.ts ook doet.
  const velden = { ...post, status: 'published', publishedAt: new Date(), updatedAt: new Date() };

  let id: number;
  if (bestaand) {
    await db.update(blogPosts).set(velden).where(eq(blogPosts.id, bestaand.id));
    id = bestaand.id;
    console.log(`✅ Bijgewerkt (id ${id})`);
  } else {
    const [nieuw] = await db.insert(blogPosts).values(velden).returning({ id: blogPosts.id });
    id = nieuw.id;
    console.log(`✅ Aangemaakt (id ${id})`);
  }

  console.log(`   /blog/${SLUG}\n`);
  console.log('=== Nog te doen ===');
  console.log('1. npm run build && npm run prerender   (crawler-fragment, vereist Chromium)');
  console.log('2. commit client/public/prerender/blog__' + SLUG + '.html');
  console.log('3. interne link vanaf /horeca-uitzendbureau-amsterdam toevoegen');
  console.log('   (die vanaf /hotelpersoneel-inhuren staat er al in)');
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Mislukt:', err?.message || err);
    await pool.end().catch(() => {});
    process.exit(1);
  });
