/**
 * LOGISTIEK PERSONEEL INHUREN — /logistiek-personeel-inhuren
 *
 * Stijlpilot. Deze pagina staat bewust op noindex en staat niet in de
 * navigatie, de footer of de sitemap: hij is alleen via de directe URL te
 * bereiken zolang de nieuwe huisstijl nog niet is vastgesteld. Zie
 * shared/routeMeta.ts voor de entry en de reden.
 *
 * Waarom de opmaak hier lokaal staat en niet in gedeelde componenten: de
 * cyaan stijl is nog geen norm. Zolang dat zo is, mag hij de rest van de site
 * niet raken — geen wijzigingen in tailwind.config, globale CSS of gedeelde
 * componenten. PublicNav en PublicFooter worden ongewijzigd gebruikt.
 *
 * De hero is één aangeleverde afbeelding (man, X-patroon en achtergrond in
 * één bestand). De achtergrondkleur van de sectie is exact de kleur van de
 * afbeelding (#3FC3DA), zodat er geen naad zichtbaar is waar de afbeelding
 * ophoudt.
 *
 * Nog niet ingevuld, bewust: klantlogo's en referenties. EXTRA heeft in de
 * logistiek nog geen klanten, en verzonnen bewijs hoort niet op een site.
 * Zodra de eerste plaatsingen lopen, kan hier hetzelfde bewijsblok komen als
 * op de horecapagina's.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  ArrowRight,
  Phone,
  ShieldCheck,
  Clock,
  Users,
  BarChart3,
  Boxes,
  Truck,
  PackageCheck,
  ClipboardList,
  Forklift,
  ChevronDown,
} from "lucide-react";

/* Ligt in client/public/ en wordt dus als kaal pad geserveerd, niet geïmporteerd. */
const HERO_BEELD = "/images/logistiek-hero.webp";
const HERO_BEELD_MOBIEL = "/images/logistiek-hero-mobiel.webp";

/* ── Kleuren uit de aangeleverde afbeelding ──────────────────────────────── */
const CYAAN = "#3FC3DA";        // exact de achtergrondkleur uit de hero-afbeelding
const CYAAN_DIEP = "#2596AC";
const CYAAN_MIST = "#EAF9FC";
const VIOLET = "#5B3FD0";       // accentkleur: knoppen en iconen. Wit erop = 6,85:1
/**
 * Tekst op de cyaan is petrol, geen wit en geen zwart. Wit haalt op deze
 * achtergrond maar 2,09:1 (norm is 4,5:1) en zwart zet een kleur in het
 * palet die er niet in hoort. Petrol haalt 6,83:1 en blijft een kleur.
 */
const PETROL = "#0A2E3C";       // koppen op cyaan  — 6,83:1
const PETROL_ZACHT = "#173F4E"; // lopende tekst op cyaan — 5,40:1
const INKT = "#101C2B";         // koppen op wit

const FUNCTIES = [
  {
    icoon: Boxes,
    titel: "Orderpickers",
    tekst:
      "Pickers die uit de voeten kunnen met voice picking, scanners en pick-to-light, zonder lange inwerktijd.",
    tags: ["Voice picking", "Scannen", "Batchpicken"],
  },
  {
    icoon: Forklift,
    titel: "Heftruck en reachtruck",
    tekst:
      "Chauffeurs met een geldig certificaat, gewend aan smalle gangpaden en werken tussen collega's op de vloer.",
    tags: ["Heftruck", "Reachtruck", "EPT"],
  },
  {
    icoon: PackageCheck,
    titel: "Inpak en productie",
    tekst:
      "Nauwkeurige inpakkers voor orderverwerking, ompakwerk en seizoenspieken. Tempo houden zonder fouten.",
    tags: ["Inpakken", "Ompakken", "Etiketteren"],
  },
  {
    icoon: Truck,
    titel: "Expeditie en verzending",
    tekst:
      "Medewerkers die laden, lossen en verzendklaar maken volgens jouw procedures — ook als de trailer om vier uur weg moet.",
    tags: ["Laden en lossen", "Docking", "Retouren"],
  },
  {
    icoon: ClipboardList,
    titel: "Magazijnmedewerkers",
    tekst:
      "Breed inzetbaar door het hele magazijn: van goederenontvangst en opslag tot aanvullen en uitgifte.",
    tags: ["Ontvangst", "Opslag", "Uitgifte"],
  },
  {
    icoon: BarChart3,
    titel: "Voorraad en kwaliteit",
    tekst:
      "Tellen, controleren en corrigeren, zodat je voorraadstanden kloppen en je doorlooptijd voorspelbaar blijft.",
    tags: ["Cyclisch tellen", "Inventarisatie", "Controle"],
  },
];

const REDENEN = [
  {
    icoon: Users,
    titel: "Na de eerste keer hoef je niemand meer in te werken",
    tekst:
      "Medewerkers die het bij jou goed doen, zet je in je vaste poule. Bij je volgende aanvraag vragen we hen als eerste — dezelfde gezichten, dezelfde procedures.",
  },
  {
    icoon: BarChart3,
    titel: "Wij weten wie bij jou goed presteert, omdat we het meten",
    tekst:
      "Na elke dienst leggen we vast hoe iemand het deed op tempo, nauwkeurigheid en betrouwbaarheid. Die beoordelingen bepalen wie we de volgende keer sturen.",
  },
  {
    icoon: ShieldCheck,
    titel: "Iedereen in loondienst, geen zzp-risico bij jou",
    tekst:
      "EXTRA is NEN 4400-1 gecertificeerd. Loonheffing, cao-beloning en verzekeringen liggen bij ons, niet bij jou. Geen discussie achteraf over schijnzelfstandigheid.",
  },
  {
    icoon: Clock,
    titel: "Snel schakelen bij piek en uitval",
    tekst:
      "Ziekmelding om zes uur 's ochtends of een order die er ineens uit moet? Bel ons — we kijken meteen wie er beschikbaar is.",
  },
];

const STAPPEN = [
  { nr: "1", titel: "Je aanvraag", tekst: "Vertel welke rollen je nodig hebt, wanneer en op welke locatie." },
  { nr: "2", titel: "Wij bellen terug", tekst: "We bespreken je proces, je tijden en waar het nu misgaat in de bezetting." },
  { nr: "3", titel: "Voorstel met namen", tekst: "Je krijgt te horen wie we sturen en wat die mensen eerder hebben gedaan." },
  { nr: "4", titel: "Beoordeling na de dienst", tekst: "Jouw beoordeling bepaalt wie er terugkomt. Zo bouwt je vaste poule zichzelf op." },
];

const VRAGEN = [
  {
    vraag: "Zijn de heftruckcertificaten gecontroleerd?",
    antwoord:
      "Altijd. We controleren het certificaat op geldigheid en leggen dat vast in het dossier. Zonder geldig certificaat plaatsen we niemand op een truck.",
  },
  {
    vraag: "Werken jullie ook in ploegendienst en in het weekend?",
    antwoord:
      "Ja. Vroege, late en nachtdiensten zijn mogelijk, net als weekendbezetting tijdens piekperiodes. Toeslagen lopen volgens de inlenersbeloning van jouw cao.",
  },
  {
    vraag: "Loop ik risico op schijnzelfstandigheid?",
    antwoord:
      "Nee. Iedereen die via EXTRA werkt is in loondienst en we zijn NEN 4400-1 gecertificeerd. Er komt geen zzp-constructie aan te pas.",
  },
  {
    vraag: "Wat gebeurt er als iemand niet komt opdagen?",
    antwoord:
      "Je belt ons en wij zoeken vervanging. Daarnaast telt het mee in de beoordeling van die medewerker: wie niet komt opdagen, komt niet terug in jouw poule.",
  },
  {
    vraag: "Kunnen we eerst één dienst proberen?",
    antwoord:
      "Dat kan. Er is geen minimumafname en geen opzegtermijn. Je betaalt per gewerkt uur.",
  },
];

/**
 * Bewijs in de hero. Alleen cijfers die al aantoonbaar op doehetextra.nl
 * staan — niets verzonnen, en geen klantlogo's zolang er in de logistiek
 * geen klanten zijn. Deze cijfers gelden EXTRA-breed, niet specifiek voor
 * logistiek; dat is een bewuste keuze en met Max afgestemd.
 */
const BEWIJS = [
  { cijfer: "4,8/5", label: "uit 234 reviews" },
  { cijfer: "NEN 4400-1", label: "gecertificeerd" },
  { cijfer: "800+", label: "medewerkers" },
];

export default function LogistiekPersoneelInhuren() {
  useEffect(() => {
    document.title = "Logistiek personeel inhuren | EXTRA";
  }, []);

  // Geen paginabrede fontFamily: Inter is de bodyletter van de site en
  // Poppins staat per element via font-poppins.
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* ══════════════ HERO ══════════════ */}
      {/*
        Typografie volgt de siteconventie: font-poppins voor wat je ziet
        (bovenregel, kop, knoppen), de standaard font-sans (Inter) voor wat je
        leest. Eén letter voor alles maakte de header vlak.

        Rangorde in vijf treden: bovenregel → kop met twee gewichten → zin →
        één massieve knop met het telefoonnummer als ondergeschikte link →
        bewijsbalk. Twee knoppen van gelijk gewicht lieten het oog niet kiezen.
      */}
      <section className="relative overflow-hidden" style={{ backgroundColor: CYAAN }}>
        {/*
          <picture> en niet twee <img>: een img die met `hidden` verborgen is
          wordt door de browser alsnog gedownload, een niet-matchende <source>
          niet. Mobiel haalt zo 22 kB op in plaats van 86 kB.
          De sectieachtergrond is exact de kleur van de afbeelding, dus er is
          geen naad zichtbaar waar het beeld ophoudt.
        */}
        {/* fetchpriority via spread: dat is het huispatroon in deze repo,
            omdat de React-types hier de camelCase-variant niet accepteren. */}
        <picture className="block">
          <source media="(min-width: 768px)" srcSet={HERO_BEELD} />
          <img
            src={HERO_BEELD_MOBIEL}
            alt="Logistiek medewerker met handscanner"
            width={960}
            height={540}
            {...({ fetchpriority: "high" } as any)}
            className="block h-auto w-full md:absolute md:inset-0 md:h-full md:w-full md:object-cover"
            style={{ objectPosition: "18% center" }}
          />
        </picture>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 px-5 pb-16 pt-7 sm:px-6 md:min-h-[44rem] md:grid-cols-[0.94fr_1.06fr] md:items-center md:px-8 md:pb-20 md:pt-32">
          {/* Linkerkolom blijft leeg: daar staat de man in de afbeelding. */}
          <div className="hidden md:block" aria-hidden="true" />

          <div className="w-full md:max-w-[36rem] md:justify-self-end">
            <p
              className="inline-flex items-center gap-2.5 font-poppins text-[0.7rem] font-bold uppercase tracking-[0.2em] sm:text-xs"
              style={{ color: PETROL, opacity: 0.75 }}
            >
              <span aria-hidden="true" className="h-0.5 w-6" style={{ backgroundColor: PETROL }} />
              Logisch werkt!
            </p>

            {/* Twee gewichten in één kop: de vraag in 400, het antwoord in 800. */}
            <h1
              className="mt-4 font-poppins text-[2rem] leading-[1.1] tracking-[-0.035em] sm:text-[2.35rem] lg:text-[2.6rem]"
              style={{ color: PETROL }}
            >
              <span className="block font-normal">Logistiek personeel nodig?</span>
              <span className="block font-extrabold">Wij pakken het op.</span>
            </h1>

            <p
              className="mt-5 max-w-[30rem] text-base leading-relaxed sm:text-[1.0625rem]"
              style={{ color: PETROL_ZACHT }}
            >
              Van orderpicken tot heftruck. Iedereen persoonlijk gescreend,
              volledig in loondienst en meestal binnen 48 uur inzetbaar.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-8">
              <Link
                href="/personeelsaanvraag"
                className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 font-poppins font-bold text-white transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: VIOLET }}
              >
                Vraag personeel aan
                <ArrowRight className="h-4 w-4" />
              </Link>
              {/* Bewust geen tweede knop: het nummer is de uitwijkmogelijkheid,
                  niet de gelijkwaardige keuze. */}
              <a
                href="tel:0851305915"
                className="inline-flex items-center justify-center gap-2 font-poppins font-bold"
                style={{ color: PETROL }}
              >
                <Phone className="h-4 w-4" />
                <span className="border-b-2 border-current pb-0.5">085 130 59 15</span>
              </a>
            </div>

            {/* Bewijs boven de vouw, in plaats van onderaan de pagina. */}
            <ul
              className="mt-9 grid grid-cols-3 pt-5 text-[13px] leading-snug"
              style={{ borderTop: "1px solid rgba(10,46,60,.25)", color: PETROL_ZACHT }}
            >
              {BEWIJS.map(({ cijfer, label }, i) => (
                <li
                  key={cijfer}
                  className={i === 0 ? "" : "pl-3 sm:pl-4"}
                  style={i === 0 ? undefined : { borderLeft: "1px solid rgba(10,46,60,.25)" }}
                >
                  <b
                    className="block font-poppins text-[0.95rem] font-extrabold tracking-tight sm:text-base"
                    style={{ color: PETROL }}
                  >
                    {cijfer}
                  </b>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════════ FUNCTIES ══════════════ */}
      <section className="py-20 sm:py-28" style={{ backgroundColor: CYAAN_MIST }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p
              className="mb-5 inline-block rounded-full border border-black/5 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ color: CYAAN_DIEP }}
            >
              Functies voor logistiek
            </p>
            <h2
              className="text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{ color: INKT }}
            >
              Voor elke logistieke rol de juiste mensen
            </h2>
            <p className="mt-5 text-gray-600">
              Of het nu gaat om dagelijkse bezetting of een piek in het seizoen —
              wij leveren mensen voor iedere rol in je magazijn of
              distributiecentrum.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FUNCTIES.map(({ icoon: Icoon, titel, tekst, tags }) => (
              <article
                key={titel}
                className="rounded-2xl border border-black/5 bg-white p-7 transition-transform hover:-translate-y-0.5"
              >
                <span
                  className="mb-5 grid h-12 w-12 place-items-center rounded-xl"
                  style={{ backgroundColor: CYAAN_MIST, color: CYAAN_DIEP }}
                >
                  <Icoon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-bold" style={{ color: INKT }}>
                  {titel}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{tekst}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-black/5 px-3 py-1.5 text-[13px] font-semibold"
                      style={{ backgroundColor: CYAAN_MIST, color: CYAAN_DIEP }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ WAAROM EXTRA ══════════════ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p
              className="mb-5 inline-block rounded-full border border-black/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ backgroundColor: CYAAN_MIST, color: CYAAN_DIEP }}
            >
              Waarom EXTRA
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: INKT }}>
              Een uitzendkracht die je proces niet kent, kost je een uur uitleg
            </h2>
            <p className="mt-5 text-gray-600">
              Daarom werken we per locatie met een vaste poule. Wie het bij jou
              goed doet, komt terug — en weet de volgende keer waar alles staat.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {REDENEN.map(({ icoon: Icoon, titel, tekst }) => (
              <article key={titel} className="rounded-2xl border border-black/5 bg-white p-7 shadow-sm">
                <span
                  className="mb-5 grid h-12 w-12 place-items-center rounded-xl"
                  style={{ backgroundColor: "#EFEBFC", color: VIOLET }}
                >
                  <Icoon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-bold leading-snug" style={{ color: INKT }}>
                  {titel}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{tekst}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ WERKWIJZE ══════════════ */}
      <section className="py-20 sm:py-28" style={{ backgroundColor: CYAAN_MIST }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: INKT }}>
              Zo gaat het
            </h2>
          </div>
          <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STAPPEN.map(({ nr, titel, tekst }) => (
              <li key={nr} className="rounded-2xl border border-black/5 bg-white p-7">
                <span
                  className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: CYAAN_DIEP }}
                >
                  {nr}
                </span>
                <h3 className="mt-4 text-base font-bold" style={{ color: INKT }}>
                  {titel}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{tekst}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <h2
            className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: INKT }}
          >
            Veelgestelde vragen
          </h2>
          <div className="mt-12 flex flex-col gap-4">
            {VRAGEN.map(({ vraag, antwoord }) => (
              <details
                key={vraag}
                className="group rounded-2xl border border-black/5 bg-white p-6 open:shadow-sm"
                style={{ backgroundColor: CYAAN_MIST }}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold" style={{ color: INKT }}>
                  {vraag}
                  <ChevronDown
                    className="h-5 w-5 flex-none transition-transform group-open:rotate-180"
                    style={{ color: CYAAN_DIEP }}
                  />
                </summary>
                <p className="mt-4 text-[15px] leading-relaxed text-gray-600">{antwoord}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ EIND-CTA ══════════════ */}
      {/* Zelfde behandeling als de hero: petrol op cyaan in plaats van wit
          (wit haalde hier ook maar 2,09:1), één violette knop en het nummer
          als ondergeschikte link. */}
      <section className="py-20 sm:py-24" style={{ backgroundColor: CYAAN }}>
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
          <h2
            className="font-poppins text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: PETROL }}
          >
            Vertel ons welke dienst je niet rond krijgt
          </h2>
          <p className="mx-auto mt-5 max-w-xl" style={{ color: PETROL_ZACHT }}>
            Laat je nummer achter, dan bellen we je terug met wie we kunnen
            sturen. Ook als het voor morgenochtend is.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            <Link
              href="/personeelsaanvraag"
              className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 font-poppins font-bold text-white transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: VIOLET }}
            >
              Vraag logistiek personeel aan
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:0851305915"
              className="inline-flex items-center justify-center gap-2 font-poppins font-bold"
              style={{ color: PETROL }}
            >
              <Phone className="h-4 w-4" />
              <span className="border-b-2 border-current pb-0.5">085 130 59 15</span>
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
