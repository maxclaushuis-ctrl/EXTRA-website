/**
 * BIJBAAN OP EVENTS — /inholland
 *
 * Campagnepagina, gemaakt als bestemming van een QR-code die tijdens een
 * gastles aan eerstejaars Facilitair Eventmanagement van InHolland op het
 * scherm staat. De bezoeker zit dus in een collegezaal, scant, en kijkt tien
 * seconden op zijn telefoon. Daarom: mobiel eerst, korte blokken, en één
 * duidelijke actie die overal terugkomt.
 *
 * noindex + follow, net als /BHG-group en /xebia: dit is een campagnepagina
 * zonder zoekdoel. prerender staat bewust op false zodat de build groen is
 * zonder dat er eerst een fragment gegenereerd hoeft te worden — zie de
 * toelichting in shared/routeMeta.ts.
 *
 * De knipoog naar de gastles zit op twee plekken: in de kop (het eventsvirus
 * waarover de spreker vertelt) en in het blok met de drie breakouts. Eén keer
 * knipogen werkt, drie keer wordt een running gag die niemand gevraagd heeft.
 *
 * Alles wat hier staat is terug te vinden op de bestaande site of in de app:
 * de eventlocaties uit de logobalk van /eventpersoneel-inhuren, het
 * EXTRAATje-schermen uit de app zelf, de leeftijdsgrens van 17 jaar uit
 * /aanmelden, en de aanmeldstappen uit de SEO-landingspagina's. Er staan
 * bewust geen tarieven en geen puntenaantallen in de lopende tekst: tarieven
 * staan nergens anders op de site, en puntenwaarden veranderen. Wat je op de
 * schermafdrukken staat is het scherm zelf, en dat spreekt voor zich.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  ArrowRight,
  CalendarCheck,
  Wallet,
  Sparkles,
  PartyPopper,
  Check,
  ChevronDown,
  Zap,
  Flame,
  Medal,
  ShoppingBag,
} from "lucide-react";

import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoWestweelde from "../assets/pitch/logo-westweelde-clean.webp";
import screenPunten from "@assets/EXTRAATje_punten_1788171508818.webp";
import screenShop from "@assets/EXTRAATje_shop_1788171508818.webp";
import screenKortingen from "@assets/EXTRAATje_kortingen_1788171508818.webp";

/* Aanmeldlink met herkomst, zodat je in GA4 ziet hoeveel studenten uit de
   gastles daadwerkelijk doorklikken. */
const AANMELDEN = "/aanmelden?ref=inholland";

const REDENEN = [
  {
    icoon: CalendarCheck,
    titel: "Jij bepaalt wanneer je werkt",
    tekst:
      "In de app zie je welke diensten openstaan en je schrijft je in op wat past. Tentamenweek? Dan sla je hem over.",
  },
  {
    icoon: Wallet,
    titel: "Vandaag werken, morgen uitbetaald",
    tekst:
      "Dienst gedraaid, de volgende dag je geld op je rekening. Liever per week of per vier weken? Ook goed.",
  },
  {
    icoon: PartyPopper,
    titel: "Events waar je bij wil zijn",
    tekst:
      "Van een gala in een museum tot de businessclub van een stadion. Precies het werk waar je opleiding over gaat.",
  },
  {
    icoon: Sparkles,
    titel: "Punten sparen in de app",
    tekst:
      "Elke dienst levert punten op. Die ruil je in voor spullen uit de shop, en er staan uitdagingen open voor extra punten.",
  },
];

const LOCATIES = [
  { logo: logoHartMuseum, naam: "H'ART Museum" },
  { logo: logoFcUtrecht, naam: "FC Utrecht" },
  { logo: logoWestweelde, naam: "Westweelde" },
  { logo: logoAppel, naam: "Appèl" },
  { logo: logoFunda, naam: "Funda" },
  { logo: logoHetePeper, naam: "Hete Peper" },
];

/* De drie schermen die in de telefoon langskomen. Het zijn echte
   schermafdrukken uit de app; de bijschriften benoemen wat je ziet. */
const APP_SCHERMEN = [
  { beeld: screenPunten, naam: "Je punten", omschrijving: "je puntensaldo, je status en het aantal diensten dat je op rij op tijd was" },
  { beeld: screenShop, naam: "Shop", omschrijving: "beloningen die je met je punten kunt verzilveren" },
  { beeld: screenKortingen, naam: "Kortingen", omschrijving: "voordelen bij partners, waar je geen punten voor nodig hebt" },
];

/* De vier regels hieronder beschrijven alleen wat er op de schermafdruk
   hiernaast te zien is: een saldo, een reeks, een status en twee tegels.
   Bewust zonder aantallen — wat een dienst oplevert en wat iets kost is
   niet iets dat hier hoort vast te staan. */
const EXTRAATJE = [
  {
    icoon: Zap,
    titel: "Punten per dienst",
    tekst: "Elke dienst die je draait schrijft punten bij. Je saldo staat bovenaan in de app.",
  },
  {
    icoon: Flame,
    titel: "Op tijd? Reeks!",
    tekst: "Kom je op tijd, dan loopt je reeks door. Vijf, tien, vijfentwintig diensten op rij.",
  },
  {
    icoon: Medal,
    titel: "Van Kanjer naar Topper",
    tekst: "Hoe meer je draait, hoe hoger je status. Je ziet precies wat je nog nodig hebt.",
  },
  {
    icoon: ShoppingBag,
    titel: "Inruilen wanneer je wil",
    tekst: "Verzilver je punten in de shop. Korting bij partners pak je zelfs zonder punten.",
  },
];

const STAPPEN = [
  { nr: "1", titel: "Meld je aan", tekst: "Vijf minuten werk. Je hebt alleen je eigen gegevens nodig." },
  { nr: "2", titel: "Korte intake", tekst: "Een kwartiertje bellen of videobellen. We kijken samen wat bij je past." },
  { nr: "3", titel: "Profiel staat klaar", tekst: "Je krijgt de app en ziet meteen welke diensten openstaan." },
  { nr: "4", titel: "Eerste dienst", tekst: "Vaak nog dezelfde week. En je gaat nooit onvoorbereid naar een locatie." },
];

const VRAGEN = [
  {
    vraag: "Vanaf welke leeftijd kan ik werken?",
    antwoord:
      "Vanaf 17 jaar. Voor bardiensten waar alcohol wordt geschonken geldt wettelijk 18 jaar.",
  },
  {
    vraag: "Moet ik ervaring hebben?",
    antwoord:
      "Nee. De meesten beginnen zonder horeca-ervaring. Je krijgt uitleg op locatie en we zetten je niet op iets waar je nog niet klaar voor bent.",
  },
  {
    vraag: "Hoeveel moet ik werken?",
    antwoord:
      "Niks moet. Sommige studenten draaien elke week een dienst, anderen alleen in de drukke maanden of rond de feestdagen.",
  },
  {
    vraag: "Hoe zit het met mijn rooster?",
    antwoord:
      "Jij schrijft je in, wij plannen je niet zomaar in. Verandert je college­rooster, dan verandert je beschikbaarheid gewoon mee.",
  },
  {
    vraag: "Krijg ik hier studiepunten voor?",
    antwoord:
      "Nee. Wel ervaring waar je vanaf je tweede jaar iets aan hebt, en salaris. Wil je er studiepunten voor, dan moet je bij je studieloopbaanbegeleider zijn — niet bij ons.",
  },
  {
    vraag: "Ben ik verzekerd?",
    antwoord:
      "Ja. Je komt bij EXTRA in loondienst, dus je bouwt vakantiegeld op, bent verzekerd en krijgt een nette loonstrook. Wij zijn NEN 4400-1 gecertificeerd.",
  },
];

const PAARS = "#6d28d9";
const PAARS_DIEP = "#2d0663";
const ACCENT = "#7c3aed";

export default function InHolland() {
  const [openVraag, setOpenVraag] = useState<string | null>(null);
  const [scherm, setScherm] = useState(0);

  /* De schermen wisselen vanzelf, maar niet bij wie liever geen beweging
     ziet -- dan blijft het eerste scherm staan en kies je zelf met de
     knoppen eronder. Zodra iemand zelf kiest stopt de carrousel: verder
     bladeren terwijl de bezoeker net iets aangeklikt heeft is vervelend. */
  const [zelfGekozen, setZelfGekozen] = useState(false);

  useEffect(() => {
    document.title = "Bijbaan op events voor InHolland-studenten | EXTRA";
  }, []);

  useEffect(() => {
    if (zelfGekozen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setScherm((i) => (i + 1) % APP_SCHERMEN.length), 4000);
    return () => clearInterval(t);
  }, [zelfGekozen]);

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* ══════════ HERO ══════════ */}
      <section
        className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24"
        style={{ background: `linear-gradient(160deg, ${PAARS_DIEP} 0%, ${PAARS} 100%)` }}
      >
        <img
          src={xPatroon}
          alt=""
          aria-hidden="true"
          /* Bij een gecentreerde hero staat een X in de rechterbovenhoek
             scheef; midden achter de tekst leest hij als achtergrond. */
          className="pointer-events-none absolute left-1/2 top-1/2 w-[64rem] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"
        />
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 font-poppins text-xs font-bold uppercase tracking-[0.14em] text-white">
            Voor eerstejaars Facilitair Eventmanagement
          </p>
          <h1 className="mt-6 font-poppins text-[2.1rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Het eventsvirus is
            <br />
            <span style={{ color: "#c4b5fd" }}>nogal besmettelijk.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-purple-100 sm:text-lg">
            EXTRA is het uitzendbureau achter de bar, de bediening en de keuken bij
            events in Amsterdam, van musea tot stadions. Hier loop je het op: naast je
            studie, om jouw rooster heen, niet andersom.
          </p>

          <div className="mt-9">
            <a
              href={AANMELDEN}
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-9 py-4 font-poppins font-bold shadow-lg transition-transform hover:-translate-y-0.5"
              style={{ color: PAARS_DIEP }}
            >
              Meld je aan
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-white">
            {["Vandaag werken, morgen uitbetaald", "Geen minimum aantal uren", "Gewoon in loondienst"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-white/40 bg-white/20">
                  <Check className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ VIER REDENEN ══════════ */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: "#faf8f5" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-2xl text-center font-poppins text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Waarom studenten bij EXTRA werken
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {REDENEN.map(({ icoon: Icoon, titel, tekst }) => (
              <article key={titel} className="rounded-2xl border border-black/5 bg-white p-6">
                <span
                  className="mb-5 grid h-12 w-12 place-items-center rounded-xl"
                  style={{ backgroundColor: "#f3effd", color: ACCENT }}
                >
                  <Icoon className="h-6 w-6" />
                </span>
                <h3 className="font-poppins text-lg font-bold text-gray-900">{titel}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{tekst}</p>
              </article>
            ))}
          </div>

          {/* De enige plek waar nog naar /dagbetaling wordt gelinkt sinds het
              aparte dagbetalingsblok eruit is. Die pagina legt de constructie
              uit; hier hoeft dat niet nog een keer te staan. */}
          <p className="mt-10 text-center">
            <Link
              href="/dagbetaling"
              className="inline-flex items-center gap-2 font-poppins text-[15px] font-bold"
              style={{ color: ACCENT }}
            >
              Zo werkt dagbetaling bij EXTRA
              <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </div>
      </section>

      {/* ══════════ LOCATIES ══════════ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-poppins text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Hier kom je te werken
            </h2>
            <p className="mt-4 text-gray-600">
              Musea, stadions, eventlocaties en cateraars in en om Amsterdam. Geen week
              hetzelfde.
            </p>
          </div>
          {/* Lopende logobalk, hetzelfde patroon als op de homepage: twee
              helften die identiek zijn, en een animatie die precies de helft
              opschuift -- daardoor is er geen zichtbaar sprongetje bij het
              herhalen. Vier sets in plaats van twee, omdat het hier maar zes
              logo's zijn en één set anders smaller is dan het scherm.

              De keyframes heten bewust marquee-inholland: de homepage zet een
              eigen .animate-marquee in een <style>-blok, en twee gelijknamige
              regels die allebei globaal landen wil je niet. */}
          <div className="group relative mt-12 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-28" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-28" />
            <div className="flex animate-marquee-inholland group-hover:[animation-play-state:paused]">
              {[0, 1, 2, 3].map((set) => (
                <div
                  key={set}
                  className="flex flex-shrink-0 items-center gap-10 px-5 sm:gap-16 sm:px-10 lg:gap-20"
                  aria-hidden={set > 0}
                >
                  {LOCATIES.map(({ logo, naam }) => (
                    <img
                      key={`${set}-${naam}`}
                      src={logo}
                      alt={set === 0 ? naam : ""}
                      className="h-16 w-auto flex-shrink-0 object-contain transition-transform duration-300 hover:scale-105 sm:h-20 lg:h-24"
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes marquee-inholland {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-inholland {
            animation: marquee-inholland 45s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-marquee-inholland { animation: none; }
          }
        `}</style>
      </section>

      {/* ══════════ EXTRAATJE ══════════ */}
      {/* Het puntensysteem uit de app. Het scherm is een echte schermafdruk uit
          EXTRAATje in een telefoonframe: het beeld doet het werk, de tekst
          ernaast benoemt alleen wat je erop ziet. De dynamic island is een los
          element, want een iOS-schermafdruk bevat hem niet.

          De volgorde in de DOM is kop → telefoon → kaarten, want op een
          telefoon wil je het beeld zien vóór vier tekstblokken. Op lg zetten de
          col-/row-klassen alles weer naast elkaar: kop en kaarten links onder
          elkaar, de telefoon rechts over beide rijen. */}
      <section
        className="relative overflow-hidden py-16 sm:py-20"
        style={{ background: `linear-gradient(160deg, ${PAARS_DIEP} 0%, ${PAARS} 100%)` }}
      >
        <img
          src={xPatroon}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -bottom-24 w-[34rem] max-w-none opacity-[0.10]"
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-x-16 lg:gap-y-9 lg:px-8">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <p className="font-poppins text-xs font-bold uppercase tracking-[0.16em] text-purple-300">
              EXTRAATje
            </p>
            <h2 className="mt-4 font-poppins text-[1.9rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-[2.4rem]">
              Je verdient geld.
              <br />
              <span style={{ color: "#c4b5fd" }}>En punten.</span>
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-purple-100">
              Elke dienst die je draait levert punten op. Die ruil je in voor spullen
              uit de shop of voor korting bij partners. Kom je steeds op tijd, dan loopt
              je reeks door en klim je op in status. Alles staat in de app.
            </p>
          </div>

          <div className="flex flex-col items-center gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute -inset-8 rounded-[4rem] bg-white/10 blur-2xl"
              />
              <div className="relative w-[14rem] rounded-[2.7rem] bg-[#12111a] p-[0.4rem] shadow-[0_35px_70px_-20px_rgba(0,0,0,0.75)] ring-1 ring-white/25 sm:w-[16.5rem]">
                <div className="relative overflow-hidden rounded-[2.35rem] bg-white">
                  {APP_SCHERMEN.map(({ beeld, naam, omschrijving }, i) => (
                    /* Het eerste beeld blijft altijd in de flow en bepaalt zo de
                       hoogte van de telefoon; de andere twee liggen er absoluut
                       overheen. Zou ook het eerste absoluut worden zodra een
                       ander scherm actief is, dan klapt de hoogte in. */
                    <img
                      key={naam}
                      src={beeld}
                      alt={`Het scherm ${naam.toLowerCase()} in de app van EXTRA: ${omschrijving}.`}
                      loading="lazy"
                      width={620}
                      height={1344}
                      className={`block w-full transition-opacity duration-700 ${
                        i === 0 ? "" : "absolute inset-0"
                      } ${i === scherm ? "opacity-100" : "opacity-0"}`}
                    />
                  ))}
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-[0.5rem] h-[1.1rem] w-[4.4rem] -translate-x-1/2 rounded-full bg-black"
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="absolute -left-[3px] top-[4.4rem] h-7 w-[3px] rounded-l-full bg-white/30"
                />
                <span
                  aria-hidden="true"
                  className="absolute -left-[3px] top-[6.1rem] h-7 w-[3px] rounded-l-full bg-white/30"
                />
                <span
                  aria-hidden="true"
                  className="absolute -right-[3px] top-[5.6rem] h-12 w-[3px] rounded-r-full bg-white/30"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {APP_SCHERMEN.map(({ naam }, i) => (
                <button
                  key={naam}
                  type="button"
                  onClick={() => {
                    setScherm(i);
                    setZelfGekozen(true);
                  }}
                  aria-pressed={i === scherm}
                  className={`rounded-full px-4 py-1.5 font-poppins text-xs font-bold transition ${
                    i === scherm ? "bg-white" : "bg-white/15 text-purple-100 hover:bg-white/25"
                  }`}
                  style={i === scherm ? { color: PAARS_DIEP } : undefined}
                >
                  {naam}
                </button>
              ))}
            </div>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:col-start-1 lg:row-start-2 lg:self-start">
            {EXTRAATJE.map(({ icoon: Icoon, titel, tekst }) => (
              <li key={titel} className="rounded-2xl bg-white/10 p-5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-white">
                  <Icoon className="h-[18px] w-[18px]" />
                </span>
                <h3 className="mt-3 font-poppins text-[15px] font-bold text-white">{titel}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-purple-100">{tekst}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ DE DRIE BREAKOUTS ══════════ */}
      {/* Tweede knipoog naar de gastles: ze gaan daarna uiteen in catering, AV
          en sales. Eerlijk zijn over welke van de drie wij wél kunnen bieden is
          grappiger én geloofwaardiger dan doen alsof we alles doen. */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-poppins text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Straks ga je in drie groepen uiteen
            </h2>
            <p className="mt-4 text-gray-600">
              Van die drie kun je er bij ons één in het echt doen. We zullen niet
              zeggen welke.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
            <article className="rounded-2xl border-2 border-black/5 bg-gray-50 p-7 text-center">
              <h3 className="font-poppins text-lg font-bold text-gray-400 line-through decoration-2">
                AV
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
                Licht, geluid en beeld. Fantastisch vak, maar niet het onze.
              </p>
            </article>

            <article
              className="rounded-2xl border-2 p-7 text-center shadow-lg"
              style={{ borderColor: ACCENT, backgroundColor: "#f8f5ff" }}
            >
              <span
                className="inline-block rounded-full px-3 py-1 font-poppins text-[11px] font-bold uppercase tracking-[0.12em] text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Deze dus
              </span>
              <h3 className="mt-4 font-poppins text-lg font-bold text-gray-900">
                Catering bij events
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                Bediening, bar, runnen, banqueting. De kant met de gasten erbij —
                en dat is waar wij mensen voor leveren.
              </p>
            </article>

            <article className="rounded-2xl border-2 border-black/5 bg-gray-50 p-7 text-center">
              <h3 className="font-poppins text-lg font-bold text-gray-400 line-through decoration-2">
                Sales
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
                Komt vanzelf. Eerst een paar honderd gasten van dichtbij zien.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ══════════ WAT HET DOET OP JE CV ══════════ */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: "#faf8f5" }}>
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <h2 className="font-poppins text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Waarom dit meer is dan bijverdienen
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-gray-600">
            In je derde jaar ga je stage lopen bij precies dit soort organisaties. Het
            verschil tussen twee kandidaten is dan zelden hun cijferlijst.
          </p>
          <ul className="mt-8 grid gap-4">
            {[
              "Je hebt gestaan op locaties die in je studieboeken staan.",
              "Je weet hoe een banquetingopzet er in het echt uitziet, en wat er misgaat als de timing verschuift.",
              "Je kunt in een gesprek vertellen hoe een diner voor driehonderd gasten werkelijk verloopt.",
              "Je hebt met keukens, leveranciers en gasten gewerkt in plaats van erover gelezen.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] leading-relaxed text-gray-700">
                <span
                  className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full"
                  style={{ backgroundColor: "#f3effd", color: ACCENT }}
                >
                  <Check className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ STAPPEN ══════════ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-2xl text-center font-poppins text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Zo begin je
          </h2>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STAPPEN.map(({ nr, titel, tekst }) => (
              <li key={nr} className="rounded-2xl border border-black/5 p-6" style={{ backgroundColor: "#faf8f5" }}>
                <span
                  className="grid h-9 w-9 place-items-center rounded-full font-poppins text-sm font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {nr}
                </span>
                <h3 className="mt-4 font-poppins text-base font-bold text-gray-900">{titel}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{tekst}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: "#faf8f5" }}>
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <h2 className="text-center font-poppins text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Veelgestelde vragen
          </h2>
          <div className="mt-10 flex flex-col gap-3">
            {VRAGEN.map(({ vraag, antwoord }) => {
              const open = openVraag === vraag;
              return (
                <div key={vraag} className="overflow-hidden rounded-2xl border border-black/5 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenVraag(open ? null : vraag)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left font-poppins text-[17px] font-bold text-gray-900"
                  >
                    {vraag}
                    <ChevronDown
                      className={`h-5 w-5 flex-none transition-transform ${open ? "rotate-180" : ""}`}
                      style={{ color: ACCENT }}
                    />
                  </button>
                  {open && (
                    <p className="px-5 pb-5 text-[15px] leading-relaxed text-gray-600">{antwoord}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ EIND-CTA ══════════ */}
      <section
        className="py-16 sm:py-20"
        style={{ background: `linear-gradient(160deg, ${PAARS_DIEP} 0%, ${PAARS} 100%)` }}
      >
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
          <h2 className="font-poppins text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Klaar om je eerste event te draaien?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-purple-100">
            Meld je aan, dan bellen we je voor een korte intake. Je zit nergens aan vast.
          </p>
          <a
            href={AANMELDEN}
            className="mt-9 inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-9 py-4 font-poppins font-bold shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ color: PAARS_DIEP }}
          >
            Meld je aan
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-5 text-sm text-purple-200">
            Vragen? Bel of app 085 130 59 15 — ma t/m vr 9:00–18:00.
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
