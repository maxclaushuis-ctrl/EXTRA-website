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
 * Alles wat hier staat is terug te vinden op de bestaande site: de
 * eventlocaties uit de logobalk van /eventpersoneel-inhuren, de
 * app-schermen van EXTRAATje, de leeftijdsgrens van 17 jaar uit
 * /aanmelden, en de aanmeldstappen uit de SEO-landingspagina's. Er staan
 * bewust geen tarieven op: die staan nergens anders op de site en zijn dus
 * niet te onderbouwen.
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
} from "lucide-react";

import xPatroon from "@assets/X_patroon_1771260543289.webp";
import heroBeeld from "@assets/BAR_BEDIENING_FINAL_002_1775568428623.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoWestweelde from "../assets/pitch/logo-westweelde-clean.webp";
import screenDashboard from "@assets/IMG_9066_1773314165933.webp";
import screenRewards from "@assets/IMG_9067_1773314165933.webp";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.webp";
import screenRanglijst from "@assets/IMG_9068_1773314165933.webp";

/* Aanmeldlink met herkomst, zodat je in GA4 ziet hoeveel studenten uit de
   gastles daadwerkelijk doorklikken. */
const AANMELDEN = "/aanmelden?ref=inholland";

const REDENEN = [
  {
    icoon: CalendarCheck,
    titel: "Jij kiest je diensten",
    tekst:
      "Je ziet de beschikbare shifts in de app en schrijft je in op wat past. Tentamenweek? Dan schrijf je je gewoon niet in.",
  },
  {
    icoon: Wallet,
    titel: "Dagbetaling mogelijk",
    tekst:
      "Vandaag gewerkt, morgen op je rekening. Liever per week of per vier weken? Ook goed — je kiest zelf.",
  },
  {
    icoon: PartyPopper,
    titel: "Events waar je iets van leert",
    tekst:
      "Van een gala in een museum tot een businessclub in een stadion. Precies het werk waar je opleiding over gaat.",
  },
  {
    icoon: Sparkles,
    titel: "Sparen met EXTRAATje",
    tekst:
      "Elke gewerkte dienst levert punten op. Die ruil je in voor beloningen, en er lopen maandelijks uitdagingen.",
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

const APP_SCHERMEN = [
  { beeld: screenDashboard, naam: "Je punten" },
  { beeld: screenRewards, naam: "Beloningen" },
  { beeld: screenUitdagingen, naam: "Uitdagingen" },
  { beeld: screenRanglijst, naam: "Ranglijst" },
];

const STAPPEN = [
  { nr: "1", titel: "Meld je aan", tekst: "Kost ongeveer vijf minuten. Je hebt alleen je gegevens nodig." },
  { nr: "2", titel: "Korte intake", tekst: "Een gesprek van een kwartier, vaak via video. We kijken wat bij je past." },
  { nr: "3", titel: "Profiel staat klaar", tekst: "Je krijgt toegang tot de app en ziet welke shifts openstaan." },
  { nr: "4", titel: "Eerste dienst", tekst: "Vaak nog dezelfde week. Je gaat nooit onvoorbereid naar een locatie." },
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
      "Nee. Veel van onze medewerkers beginnen zonder horeca-ervaring. Je krijgt uitleg op locatie en we zetten je niet in op iets waar je nog niet klaar voor bent.",
  },
  {
    vraag: "Hoeveel moet ik werken?",
    antwoord:
      "Er is geen minimum. Sommige studenten draaien elke week een dienst, anderen alleen in drukke maanden of rond de feestdagen.",
  },
  {
    vraag: "Hoe zit het met mijn rooster?",
    antwoord:
      "Jij schrijft je in, wij plannen je niet zomaar in. Verandert je college­rooster, dan verandert jouw beschikbaarheid gewoon mee.",
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

  useEffect(() => {
    document.title = "Bijbaan op events voor InHolland-studenten | EXTRA";
  }, []);

  useEffect(() => {
    const beweegtLiever = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (beweegtLiever) return;
    const t = setInterval(() => setScherm((s) => (s + 1) % APP_SCHERMEN.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* ══════════ HERO ══════════ */}
      <section
        className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20"
        style={{ background: `linear-gradient(160deg, ${PAARS_DIEP} 0%, ${PAARS} 100%)` }}
      >
        <img
          src={xPatroon}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-16 w-[36rem] max-w-none opacity-[0.14]"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 font-poppins text-xs font-bold uppercase tracking-[0.14em] text-white">
              Voor studenten van InHolland
            </p>
            <h1 className="mt-6 font-poppins text-[2.1rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
              Jij leert over events.
              <br />
              <span style={{ color: "#c4b5fd" }}>Wij hebben ze.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-purple-100 sm:text-lg">
              Werk naast je studie op de events waar je opleiding over gaat. Jij kiest
              zelf je diensten, dus je bijbaan past om je rooster heen — en niet
              andersom.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <a
                href={AANMELDEN}
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 font-poppins font-bold shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ color: PAARS_DIEP }}
              >
                Meld je aan
                <ArrowRight className="h-4 w-4" />
              </a>
              <span className="text-sm text-purple-200">
                Duurt vijf minuten · vanaf 17 jaar
              </span>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white">
              {["Dagbetaling mogelijk", "Geen minimum aantal uren", "In loondienst"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-white/40 bg-white/20">
                    <Check className="h-3 w-3" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <img
              src={heroBeeld}
              alt="Medewerkers van EXTRA tijdens een event"
              className="w-full rounded-2xl object-cover shadow-2xl"
              loading="eager"
            />
          </div>
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
              Musea, stadions, eventlocaties en cateraars in en om Amsterdam. Geen twee
              weken hetzelfde.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 items-center gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {LOCATIES.map(({ logo, naam }) => (
              <div key={naam} className="grid place-items-center">
                <img
                  src={logo}
                  alt={naam}
                  className="h-12 w-auto max-w-[8rem] object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ROOSTER + DAGBETALING ══════════ */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: "#fdf9f3" }}>
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-6 md:grid-cols-2 lg:px-8">
          <article className="rounded-2xl bg-white p-8 shadow-sm">
            <h3 className="font-poppins text-xl font-extrabold text-gray-900">
              Je bijbaan past om je rooster heen
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              Wij plannen je niet in — jij schrijft je in. In de app zie je welke diensten
              er openstaan, met locatie, tijd en wat er van je verwacht wordt. Past het
              niet, dan sla je die week over. Er is geen minimum.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              Handig in je eerste jaar: de meeste events zijn 's avonds en in het weekend,
              precies wanneer je geen college hebt.
            </p>
          </article>
          <article className="rounded-2xl bg-white p-8 shadow-sm">
            <h3 className="font-poppins text-xl font-extrabold text-gray-900">
              Vandaag gewerkt, morgen op je rekening
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              Dagbetaling is bij ons een keuze, geen verplichting. Wil je liever per week
              of per vier weken uitbetaald krijgen, dan kan dat net zo goed.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              En het gaat gewoon via een loondienstconstructie: je bouwt vakantiegeld op,
              je bent verzekerd en je krijgt een nette loonstrook.
            </p>
            <Link
              href="/dagbetaling"
              className="mt-5 inline-flex items-center gap-2 font-poppins text-sm font-bold"
              style={{ color: ACCENT }}
            >
              Hoe dagbetaling werkt
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>

      {/* ══════════ EXTRAATJE ══════════ */}
      <section
        className="relative overflow-hidden py-16 sm:py-20"
        style={{ background: `linear-gradient(160deg, ${PAARS_DIEP} 0%, ${PAARS} 100%)` }}
      >
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="font-poppins text-xs font-bold uppercase tracking-[0.16em] text-purple-300">
              EXTRAATje
            </p>
            <h2 className="mt-4 font-poppins text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Elke dienst levert punten op
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-purple-100">
              Werken levert meer op dan alleen je uurloon. Voor elke gewerkte dienst
              spaar je punten, die je inruilt voor beloningen. Daarnaast lopen er
              maandelijks uitdagingen en is er een ranglijst.
            </p>
            <ul className="mt-7 grid gap-3 text-[15px] text-purple-100">
              {[
                "Punten voor elke dienst die je draait",
                "Sparen voor beloningen uit de app",
                "Maandelijkse uitdagingen en een ranglijst",
                "Kortingen bij partners, zonder punten",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-white/20">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <div className="relative w-[15rem] rounded-[2rem] border-[6px] border-black/40 bg-black/40 p-1.5 shadow-2xl sm:w-[16rem]">
              {APP_SCHERMEN.map(({ beeld, naam }, i) => (
                <img
                  key={naam}
                  src={beeld}
                  alt={`EXTRAATje in de app: ${naam.toLowerCase()}`}
                  loading="lazy"
                  /* Het eerste beeld blijft altijd in de flow en bepaalt de
                     hoogte van de mockup; de rest ligt er absoluut overheen.
                     Zou ook het eerste beeld absoluut worden zodra een ander
                     scherm actief is, dan klapt de hoogte in. */
                  className={`w-full rounded-[1.5rem] transition-opacity duration-700 ${
                    i === 0 ? "" : "absolute inset-1.5"
                  } ${i === scherm ? "opacity-100" : "opacity-0"}`}
                />
              ))}
            </div>
          </div>
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
            Meld je aan, dan nemen we contact op voor een korte intake. Je zit nergens
            aan vast.
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
