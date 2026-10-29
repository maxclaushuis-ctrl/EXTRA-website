/**
 * Vacatures (/vacatures) in design 3.0. Bron: mock-ups vacatures.html,
 * vacatures-events.html en vacatures-logistiek.html.
 *
 * Eén pagina, drie varianten via de URL. Geen aparte routes: die zouden met
 * /vacatures om dezelfde zoekintentie concurreren. De canonical blijft
 * /vacatures (routeMeta).
 *  - ?branche=hotels | events | logistiek  kleur, kop en alleen die vacatures
 *  - ?afdeling=Housekeeping | Keuken | ...  zet het filter vooraf aan
 *    (gebruikt door /housekeeping-werk en /chef-vacatures-amsterdam)
 *
 * De vacatures komen alleen uit het CMS (/api/vacatures). Heeft een branche
 * nog geen vacatures, dan staan de functies met "Binnenkort" in de lijst, zoals
 * in de mock-up, en is de inschrijving de actie.
 *
 * Gestructureerde gegevens: CollectionPage, ItemList, BreadcrumbList en (op de
 * gewone variant) FAQPage. Bewust géén JobPosting: dat hoort alleen op de
 * detailpagina van een vacature (server/seo.ts).
 *
 * Taal: dezelfde pagina staat ook op /en/jobs (bron: mock-up en/jobs.html).
 * De taal volgt uit het pad. De vacatures zelf blijven zoals ze in het CMS
 * staan; alleen de vaste teksten, de filterlabels (afdeling, uren), het
 * loonformaat en het inschrijfblok zijn Engels. Detaillinks blijven
 * /vacatures/:slug, inschrijven gaat naar /en/apply. De FAQ staat alleen op de
 * Nederlandse pagina: er is geen goedgekeurde Engelse versie van.
 */
import { useMemo, useState, useEffect, useRef, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Shell, { type Sector } from "@/design3/Shell";
import { Ic, Pijl } from "@/design3/basis";
import { useReus } from "@/design3/gedrag";
import { Faq } from "@/design3/secties";
import KandidaatSlot, { type KandidaatSlotProps } from "@/design3/KandidaatSlot";
import {
  afdelingVan, brancheVan, isBranche, korteTitel, plaats, loonLabel, tel, opsomming, type VacBranche,
} from "@shared/vacatureWeergave";
import { taalVanPad, type Taal } from "@shared/taal";
import { veiligeJsonLd } from "@shared/jsonLd";

const SITE = "https://www.doehetextra.nl";

// FAQ over werken via EXTRA, overgenomen van de vorige versie van deze pagina
// (zichtbaar én als FAQPage-gegevens).
const VACATURE_FAQS: [string, string][] = [
  ["Hoe snel kan ik aan de slag via EXTRA?", "Vaak binnen enkele dagen. Je meldt je aan via het aanmeldformulier, we plannen een korte kennismaking en daarna kun je direct shifts oppakken bij hotels, restaurants en events in Amsterdam en omgeving."],
  ["Wat betekent een all-in uurloon?", "Bij een all-in uurloon zijn vakantiegeld en vakantie-uren direct in je uurloon verwerkt. Wat je ziet is wat je per gewerkt uur opbouwt: transparant en zonder verrassingen."],
  ["Hoe werkt dagbetaling bij EXTRA?", "Na elke gewerkte shift kun je je verdiende loon direct laten uitbetalen. Je hoeft dus niet te wachten tot het einde van de maand."],
  ["Heb ik horeca-ervaring nodig?", "Voor veel functies is ervaring een pré maar geen vereiste. Motivatie en een representatief voorkomen zijn het belangrijkst; je leert het vak op de mooiste locaties van Amsterdam."],
  ["Ben ik in loondienst als ik via EXTRA werk?", "Ja. Iedereen die via EXTRA werkt is in loondienst bij EXTRA, een NEN 4400-1 gecertificeerd uitzendbureau. Je bent dus altijd verzekerd van correcte afdrachten en goed werkgeverschap."],
];

type Variant = VacBranche | "alle";

interface VariantInfo {
  sector: Sector;
  h1: [string, string];
  lead: (plaatsen: string) => string;
  /** Kruimelpad tussen Home en Vacatures. */
  midden: [string, string] | null;
  /** Functies die "binnenkort" komen, als er nog geen vacatures zijn. */
  binnenkort: [string, string][] | null;
  binnenkortMeta: string;
  slot: Omit<KandidaatSlotProps, "gekozen">;
}

const HOTEL_FUNCTIES = ["Housekeeping", "Front office", "F&B", "Banqueting", "Keuken", "Afwas en keukenhulp"];

const VARIANTEN: Record<Variant, VariantInfo> = {
  alle: {
    sector: "horeca",
    h1: ["Horeca vacatures ", "Amsterdam"],
    lead: (p) => `Dagbetaling, EXTRAATJE-punten en vaste hotels${p ? ` in ${p}` : ""}. Kies een vacature en solliciteer direct.`,
    midden: null,
    binnenkort: null,
    binnenkortMeta: "",
    slot: {
      foto: "/d3/w-slot.webp", tag: "/d3/logo-tag-r.svg", regels: ["Schrijf je", "in voor EXTRA", "werk in hotels"],
      kop: "In 2 minuten ingeschreven", sub: "Daarna nemen we contact met je op voor een kennismaking.",
      functies: HOTEL_FUNCTIES, beschikbaarheid: ["Doordeweeks", "Weekend", "Avond"],
    },
  },
  hotels: {
    sector: "horeca",
    h1: ["Vacatures in ", "hotels"],
    lead: (p) => `Dagbetaling, EXTRAATJE-punten en vaste hotels${p ? ` in ${p}` : ""}. Kies een vacature en solliciteer direct.`,
    midden: ["Werk in hotels", "/horeca-vacatures-amsterdam"],
    binnenkort: null,
    binnenkortMeta: "",
    slot: {
      foto: "/d3/w-slot.webp", tag: "/d3/logo-tag-r.svg", regels: ["Schrijf je", "in voor EXTRA", "werk in hotels"],
      kop: "In 2 minuten ingeschreven", sub: "Daarna nemen we contact met je op voor een kennismaking.",
      functies: HOTEL_FUNCTIES, beschikbaarheid: ["Doordeweeks", "Weekend", "Avond"],
    },
  },
  events: {
    sector: "events",
    h1: ["Vacatures bij ", "events"],
    lead: () => "Bediening, bar, hosts en runners bij events in Amsterdam. Met dagbetaling en EXTRAATJE-punten.",
    midden: ["Werk bij events", "/events-werk"],
    binnenkort: [
      ["Bediening", "Diners, borrels en recepties"],
      ["Barpersoneel", "Cocktails, wine service, hoog tempo"],
      ["Dinerloper", "Uitserveren en schalen aanvullen"],
      ["Runner", "Van keuken naar zaal"],
      ["Host of hostess", "Ontvangst, coatcheck, registratie"],
    ],
    binnenkortMeta: "Avond en weekend",
    slot: {
      foto: "/d3/e-slot.webp", tag: "/d3/logo-tag-b.svg", regels: ["Schrijf je", "in voor EXTRA", "werk bij events"], laag: true,
      kop: "In 2 minuten ingeschreven", sub: "Daarna nemen we contact met je op voor een kennismaking.",
      functies: ["Bediening", "Barpersoneel", "Dinerloper", "Runner", "Host of hostess", "Event supervisor"], beschikbaarheid: ["Avond", "Weekend", "Doordeweeks"],
    },
  },
  logistiek: {
    sector: "logistiek",
    h1: ["Vacatures in de ", "logistiek"],
    lead: () => "Orderpicken, heftruck, inpakken en expeditie in magazijnen en distributiecentra. Met dagbetaling en EXTRAATJE-punten.",
    midden: ["Werk in de logistiek", "/logistiek-werk"],
    binnenkort: [
      ["Orderpicker", "Voice picking, scannen, batchpicken"],
      ["Heftruckchauffeur", "Heftruck, reachtruck, EPT"],
      ["Inpakker", "Inpakken, ompakken, etiketteren"],
      ["Expeditiemedewerker", "Laden en lossen, docking, retouren"],
      ["Magazijnmedewerker", "Ontvangst, opslag, uitgifte"],
    ],
    binnenkortMeta: "Ploegendienst mogelijk",
    slot: {
      foto: "/d3/l-slot.webp", tag: "/d3/logo-tag-g.svg", regels: ["Schrijf je", "in voor EXTRA", "logistiek werk"],
      kop: "In 2 minuten ingeschreven", sub: "Daarna nemen we contact met je op voor een kennismaking.",
      functies: ["Orderpicker", "Heftruck of reachtruck", "Inpak en productie", "Expeditie", "Magazijnmedewerker", "Voorraad en kwaliteit"], beschikbaarheid: ["Dagdienst", "Ploegendienst", "Weekend"],
    },
  },
};

const HOTEL_FUNCTIES_EN = ["Housekeeping", "Front office", "F&B", "Banqueting", "Kitchen", "Dishwashing and kitchen porter"];
const SLOT_EN = { kop: "Signed up in 2 minutes", sub: "We'll then contact you to arrange an introduction meeting." };

/** Engelse varianten (en/jobs.html; events en logistiek uit en/event-jobs en en/logistics-jobs). */
const VARIANTEN_EN: Record<Variant, VariantInfo> = {
  alle: {
    sector: "horeca",
    h1: ["Jobs in ", "hotels"],
    lead: (p) => `Daily pay, EXTRAATje points and regular hotels${p ? ` in ${p}` : ""}. Pick a job and apply now.`,
    midden: null,
    binnenkort: null,
    binnenkortMeta: "",
    slot: {
      foto: "/d3/w-slot.webp", tag: "/d3/logo-tag-r.svg", regels: ["Sign up", "for EXTRA", "work in hotels"], ...SLOT_EN,
      functies: HOTEL_FUNCTIES_EN, beschikbaarheid: ["Weekdays", "Weekend", "Evenings"],
    },
  },
  hotels: {
    sector: "horeca",
    h1: ["Jobs in ", "hotels"],
    lead: (p) => `Daily pay, EXTRAATje points and regular hotels${p ? ` in ${p}` : ""}. Pick a job and apply now.`,
    midden: ["Work in hotels", "/en/hospitality-jobs"],
    binnenkort: null,
    binnenkortMeta: "",
    slot: {
      foto: "/d3/w-slot.webp", tag: "/d3/logo-tag-r.svg", regels: ["Sign up", "for EXTRA", "work in hotels"], ...SLOT_EN,
      functies: HOTEL_FUNCTIES_EN, beschikbaarheid: ["Weekdays", "Weekend", "Evenings"],
    },
  },
  events: {
    sector: "events",
    h1: ["Jobs at ", "events"],
    lead: () => "Waiting staff, bar, hosts and runners at events in Amsterdam. With daily pay and EXTRAATje points.",
    midden: ["Work at events", "/en/event-jobs"],
    binnenkort: [
      ["Waiting staff", "Dinners, drinks and receptions"],
      ["Bar staff", "Cocktails, wine service, high pace"],
      ["Dinner runner", "Serving out and refilling platters"],
      ["Runner", "From kitchen to floor"],
      ["Host or hostess", "Welcome, cloakroom, registration"],
    ],
    binnenkortMeta: "Evenings and weekends",
    slot: {
      foto: "/d3/e-slot.webp", tag: "/d3/logo-tag-b.svg", regels: ["Sign up", "for EXTRA", "work at events"], laag: true, ...SLOT_EN,
      functies: ["Waiting staff", "Bar staff", "Dinner runner", "Runner", "Host or hostess", "Event supervisor"], beschikbaarheid: ["Evening", "Weekend", "Weekdays"],
    },
  },
  logistiek: {
    sector: "logistiek",
    h1: ["Jobs in ", "logistics"],
    lead: () => "Order picking, forklift work, packing and dispatch in warehouses and distribution centres. With daily pay and EXTRAATje points.",
    midden: ["Work in logistics", "/en/logistics-jobs"],
    binnenkort: [
      ["Order picker", "Voice picking, scanning, batch picking"],
      ["Forklift driver", "Forklift, reach truck, EPT"],
      ["Packer", "Packing, repacking, labelling"],
      ["Dispatch operative", "Loading and unloading, docking, returns"],
      ["Warehouse operative", "Goods in, storage, goods out"],
    ],
    binnenkortMeta: "Shift work possible",
    slot: {
      foto: "/d3/l-slot.webp", tag: "/d3/logo-tag-g.svg", regels: ["Sign up", "for EXTRA", "logistics work"], ...SLOT_EN,
      functies: ["Order picker", "Forklift or reach truck", "Packing and production", "Dispatch", "Warehouse operative", "Stock and quality"], beschikbaarheid: ["Day shift", "Shift work", "Weekend"],
    },
  },
};

/** Vaste teksten van de lijst in beide talen. */
const TEKST = {
  nl: {
    home: "/", kruimelLabel: "Kruimelpad", vacatures: "Vacatures", vacaturesHref: "/vacatures", filterLabel: "Filter vacatures", alle: "Alle",
    laden: "Vacatures laden", binnenkortChip: "Binnenkort vacatures", aantal: (n: number) => `${n} openstaande ${n === 1 ? "vacature" : "vacatures"}`,
    eersteBinnenkort: " De eerste vacatures komen binnenkort online.", geenFilter: "Geen vacatures met deze filters.",
    nogGeen: "Nog geen openstaande vacatures", komenEraan: "Nieuwe vacatures komen eraan", alvast: "Schrijf je alvast in. We bellen je zodra er werk is dat bij je past.",
    nietGevonden: "Niet gevonden wat je zoekt?", algemeen: "Schrijf je algemeen in. We bellen je zodra er werk is dat bij je past.", inschrijven: "Schrijf je in",
    binnenkort: "Binnenkort", binnenkortSub: "schrijf je alvast in",
  },
  en: {
    home: "/en", kruimelLabel: "Breadcrumb", vacatures: "Jobs", vacaturesHref: "/en/jobs", filterLabel: "Filter jobs", alle: "All",
    laden: "Loading jobs", binnenkortChip: "Jobs coming soon", aantal: (n: number) => `${n} open ${n === 1 ? "vacancy" : "vacancies"}`,
    eersteBinnenkort: " The first jobs will be online soon.", geenFilter: "No jobs match these filters.",
    nogGeen: "No open vacancies yet", komenEraan: "New jobs are on their way", alvast: "Sign up now. We'll call you as soon as there's work that suits you.",
    nietGevonden: "Can't find what you're looking for?", algemeen: "Sign up anyway. We'll call you as soon as there's work that suits you.", inschrijven: "Sign up",
    binnenkort: "Coming soon", binnenkortSub: "sign up now",
  },
};

/** Engelse weergave van wat uit het CMS komt; de waarden zelf (filter, data-attributen) blijven Nederlands. */
const AFDELING_EN: Record<string, string> = { Keuken: "Kitchen", Afwas: "Dishwashing", Logistiek: "Logistics", Overig: "Other" };
const UREN_EN: Record<string, string> = { fulltime: "Full-time", parttime: "Part-time", bijbaan: "Side job", oproep: "On call" };
const afdelingLabel = (a: string, taal: Taal) => (taal === "en" ? AFDELING_EN[a] ?? a : a);
const urenLabel = (u: string, taal: Taal) => (taal === "en" ? UREN_EN[u.toLowerCase()] ?? u : u);
const plaatsLabel = (p: string, taal: Taal) => (taal === "en" ? p.replace(/\bDen Haag\b/g, "The Hague") : p);
const loonTekst = (l: string, taal: Taal) => (taal === "en" ? l.replace(/,/g, ".").replace(" tot ", " to ") : l);
/** "Amsterdam and Scheveningen": de Engelse tegenhanger van opsomming(). */
function opsommingEn(woorden: string[]): string {
  const u = woorden.filter((w, i) => w && woorden.indexOf(w) === i);
  if (u.length <= 1) return u[0] || "";
  return `${u.slice(0, -1).join(", ")} and ${u[u.length - 1]}`;
}

export interface VacatureRij {
  slug: string;
  title: string;
  kort: string;
  client: string | null;
  plaats: string;
  location: string;
  serviceType: string;
  afdeling: string;
  branche: VacBranche;
  loon: string | null;
  datum: string;
}

/** Zet een vacature uit /api/vacatures om naar een rij voor de lijst. */
export function naarRij(p: any): VacatureRij {
  return {
    slug: p.slug,
    title: p.title,
    kort: korteTitel(p.title, p.location),
    client: p.client || null,
    plaats: plaats(p.location) || p.location || "",
    location: p.location || "",
    serviceType: p.serviceType || "",
    afdeling: afdelingVan(p),
    branche: brancheVan(p),
    loon: loonLabel(p.salaryMin),
    datum: p.publishedAt || p.createdAt || "",
  };
}

/** Eén regel in de donkere lijst (ook gebruikt op de detailpagina). */
export function VacRegel({ v, nr, taal = "nl" }: { v: VacatureRij; nr: number; taal?: Taal }) {
  const en = taal === "en";
  return (
    <a className="vac" href={`/vacatures/${v.slug}`} data-afd={v.afdeling} data-uren={v.serviceType}>
      <span className="vac-nr">{String(nr).padStart(2, "0")}</span>
      <span className="vac-kop"><h3>{v.kort}</h3>{v.client && <span>{v.client}</span>}</span>
      <span className="vac-meta"><span>{plaatsLabel(v.location, taal)}</span>{v.serviceType && <span>{urenLabel(v.serviceType, taal)}</span>}</span>
      <span className="vac-loon">{v.loon
        ? <><b>{loonTekst(v.loon, taal)}</b><small>{en ? "all-in per hour" : "all-in per uur"}</small></>
        : <><b>{en ? "To be agreed" : "In overleg"}</b><small>{en ? "hourly wage" : "uurloon"}</small></>}</span>
      <i aria-hidden="true"><Ic n="pijl" /></i>
    </a>
  );
}

function leesParams(): { variant: Variant; afdeling: string | null } {
  if (typeof window === "undefined") return { variant: "alle", afdeling: null };
  const p = new URLSearchParams(window.location.search);
  const b = p.get("branche");
  return { variant: isBranche(b) ? b : "alle", afdeling: p.get("afdeling") };
}

export default function Vacatures() {
  const [location] = useLocation();
  const taal = taalVanPad(location);
  const en = taal === "en";
  const t = TEKST[taal];
  const { variant, afdeling: vooraf } = useMemo(leesParams, [location]);
  const info = (en ? VARIANTEN_EN : VARIANTEN)[variant];

  const { data, isLoading } = useQuery<{ posts: any[] }>({ queryKey: ["/api/vacatures"], staleTime: 60_000 });

  const alle = useMemo(() => {
    const posts = Array.isArray(data?.posts) ? data!.posts : [];
    return posts
      .map(naarRij)
      .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
  }, [data]);

  const lijst = useMemo(() => (variant === "alle" ? alle : alle.filter((v) => v.branche === variant)), [alle, variant]);
  const afdelingen = useMemo(() => tel(lijst, (v) => v.afdeling), [lijst]);
  const uren = useMemo(() => tel(lijst, (v) => v.serviceType).map(([u]) => u).filter((u) => /^(fulltime|parttime)$/i.test(u)), [lijst]);

  const [afd, setAfd] = useState<string>("alle");
  const [uur, setUur] = useState<string | null>(null);
  useEffect(() => {
    setUur(null);
    setAfd(vooraf && afdelingen.some(([a]) => a.toLowerCase() === vooraf.toLowerCase())
      ? afdelingen.find(([a]) => a.toLowerCase() === vooraf.toLowerCase())![0]
      : "alle");
  }, [vooraf, afdelingen]);

  const zichtbaar = lijst.filter((v) => (afd === "alle" || v.afdeling === afd) && (!uur || v.serviceType === uur));
  const plaatsen = en ? opsommingEn(lijst.map((v) => plaatsLabel(v.plaats, taal))) : opsomming(lijst.map((v) => v.plaats));
  const leeg = !isLoading && lijst.length === 0;

  const ld = useMemo(() => {
    const kruimels = [
      { name: "Home", item: en ? `${SITE}/en` : `${SITE}/` },
      ...(info.midden ? [{ name: info.midden[0], item: `${SITE}${info.midden[1]}` }] : []),
      { name: t.vacatures, item: `${SITE}${t.vacaturesHref}` },
    ];
    const blokken: Record<string, unknown>[] = [
      { "@context": "https://schema.org", "@type": "CollectionPage", name: `${info.h1.join("")} | EXTRA`, url: `${SITE}${t.vacaturesHref}`, description: info.lead(plaatsen) },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: kruimels.map((k, i) => ({ "@type": "ListItem", position: i + 1, ...k })) },
    ];
    if (lijst.length) {
      blokken.push({
        "@context": "https://schema.org", "@type": "ItemList",
        itemListElement: lijst.map((v, i) => ({ "@type": "ListItem", position: i + 1, name: v.title, url: `${SITE}/vacatures/${v.slug}` })),
      });
    }
    return blokken;
  }, [info, lijst, plaatsen, en, t]);

  const chip = isLoading ? t.laden : leeg ? t.binnenkortChip : t.aantal(lijst.length);
  const gekozen = afd !== "alle"
    ? (en ? ({ Keuken: "Kitchen", Afwas: "Dishwashing and kitchen porter" } as Record<string, string>)[afd] ?? afd : afd === "Afwas" ? "Afwas en keukenhulp" : afd)
    : undefined;

  return (
    <Shell sector={info.sector} css={["events", "hotels", "werk", "vacature"]} werkzoekende>
      {ld.map((b, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: veiligeJsonLd(b) }} />)}

      <section className="vhero voverzicht"><div className="w">
        <nav className="kruimel" aria-label={t.kruimelLabel}>
          <a href={t.home}>Home</a><span>/</span>
          {info.midden && <><a href={info.midden[1]}>{info.midden[0]}</a><span>/</span></>}
          <span aria-current="page">{t.vacatures}</span>
        </nav>
        <span className="chip"><i></i>{chip}</span>
        <h1 className="vh-h1">{info.h1[0]}<span className="serif">{info.h1[1]}</span></h1>
        <p className="vo-lead">
          {info.lead(plaatsen)}
          {leeg && info.binnenkort ? t.eersteBinnenkort : ""}
        </p>
      </div></section>

      <section className="donker vacs vo-lijst"><div className="w">
        {lijst.length > 1 && (
          <div className="vo-filter" role="group" aria-label={t.filterLabel}>
            <button type="button" className={afd === "alle" ? "aan" : undefined} aria-pressed={afd === "alle"} onClick={() => setAfd("alle")}>{t.alle} <b>{lijst.length}</b></button>
            {afdelingen.length > 1 && afdelingen.map(([a, n]) => (
              <button key={a} type="button" className={afd === a ? "aan" : undefined} aria-pressed={afd === a} onClick={() => setAfd(a)}>{afdelingLabel(a, taal)} <b>{n}</b></button>
            ))}
            {uren.length > 1 && <span className="vo-sep"></span>}
            {uren.length > 1 && uren.map((u) => (
              <button key={u} type="button" className={uur === u ? "aan" : undefined} aria-pressed={uur === u} onClick={() => setUur(uur === u ? null : u)}>{urenLabel(u, taal)}</button>
            ))}
          </div>
        )}

        <div className="vac-lijst">
          {zichtbaar.map((v, i) => <VacRegel key={v.slug} v={v} nr={i + 1} taal={taal} />)}
          {leeg && info.binnenkort && info.binnenkort.map(([f, s], i) => (
            <a className="vac" href="#inschrijven" key={f}>
              <span className="vac-nr">{String(i + 1).padStart(2, "0")}</span>
              <span className="vac-kop"><h3>{f}</h3><span>{s}</span></span>
              <span className="vac-meta"><span>{info.binnenkortMeta}</span></span>
              <span className="vac-loon"><b>{t.binnenkort}</b><small>{t.binnenkortSub}</small></span>
              <i aria-hidden="true"><Ic n="pijl" /></i>
            </a>
          ))}
        </div>
        {!isLoading && lijst.length > 0 && zichtbaar.length === 0 && <p className="vo-leeg">{t.geenFilter}</p>}

        <div className="vo-niet">
          {leeg
            ? <div><b>{info.binnenkort ? t.nogGeen : t.komenEraan}</b><span>{t.alvast}</span></div>
            : <div><b>{t.nietGevonden}</b><span>{t.algemeen}</span></div>}
          <a className="knop vol" href="#inschrijven">{t.inschrijven} <svg><use href="#pijl" /></svg></a>
        </div>
      </div></section>

      {variant === "alle" && !en && <Faq s={{ type: "faq", eyebrow: "Veelgestelde vragen", h2: "Werken via [[EXTRA]]", items: VACATURE_FAQS }} />}

      {en ? <KandidaatSlotEn {...info.slot} gekozen={gekozen} /> : <KandidaatSlot {...info.slot} gekozen={gekozen} />}
    </Shell>
  );
}

/**
 * Engelse tegenhanger van KandidaatSlot (teksten uit en/jobs.html). Werkt
 * hetzelfde: naam, telefoon en functie via sessionStorage naar /en/apply, geen
 * persoonsgegevens in de URL. Aanmelden.tsx herkent de Engelse functienamen.
 */
function KandidaatSlotEn({ id = "inschrijven", foto, tag, regels, kop, sub, functies, gekozen, beschikbaarheid, knop = "Sign up", laag }: KandidaatSlotProps) {
  const reus = useRef<HTMLHeadingElement>(null);
  useReus(reus, 0.55);
  const [location, naar] = useLocation();
  const [fout, setFout] = useState<string | null>(null);
  const KIES = "Choose a role";

  function verstuur(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const w = (k: string) => String(fd.get(k) ?? "").trim();
    const functie = w("functie");
    if (!w("naam") || w("phone").replace(/\D/g, "").length < 8) {
      setFout("Please enter your name and a valid phone number.");
      return;
    }
    setFout(null);
    try {
      sessionStorage.setItem("extra-aanmelden", JSON.stringify({
        naam: w("naam"),
        telefoon: w("phone"),
        functie: functie && functie !== KIES ? functie : "",
        via: location,
      }));
    } catch { /* privémodus: dan vul je het op de volgende pagina in */ }
    naar("/en/apply");
    window.scrollTo(0, 0);
  }

  return (
    <section className={`slot2 slot-werk${laag ? " slot-laag" : ""}`} id={id}>
      <div className="foto"><img src={foto} alt="" loading="lazy" /></div>
      <img className="tag" src={tag} alt="EXTRA, the staffing agency that works" loading="lazy" />
      <h2 className="reus" ref={reus}><span className="l1">{regels[0]}</span> <span className="l2">{regels[1]}</span> <span className="l3">{regels[2]}</span></h2>
      <div className="acties">
        <form className="inschrijf" noValidate onSubmit={verstuur} aria-label="Sign up with EXTRA">
          <p className="if-kop"><b>{kop}</b><span>{sub}</span></p>
          <label><span>Name</span><input name="naam" type="text" autoComplete="name" placeholder="First and last name" /></label>
          <label><span>Phone</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12 34 56 78" /></label>
          <label><span>Role</span>
            <select name="functie" defaultValue={gekozen && functies.includes(gekozen) ? gekozen : KIES}>
              <option>{KIES}</option>
              {functies.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <fieldset><legend>Availability</legend><div className="if-chips">
            {beschikbaarheid.map((b) => <label key={b}><input type="checkbox" name="beschikbaarheid" value={b} /><span>{b}</span></label>)}
          </div></fieldset>
          {fout && <p className="form-fout" role="alert">{fout}</p>}
          <button className="knop vol" type="submit">{knop} <Pijl /></button>
          <a className="if-wa" href="https://wa.me/31851305915">Got a question first? Message us on WhatsApp <Ic n="pijl" /></a>
        </form>
      </div>
    </section>
  );
}
