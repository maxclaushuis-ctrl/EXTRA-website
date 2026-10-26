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
 */
import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Shell, { type Sector } from "@/design3/Shell";
import { Ic } from "@/design3/basis";
import { Faq } from "@/design3/secties";
import KandidaatSlot, { type KandidaatSlotProps } from "@/design3/KandidaatSlot";
import {
  afdelingVan, brancheVan, isBranche, korteTitel, plaats, loonLabel, tel, opsomming, type VacBranche,
} from "@shared/vacatureWeergave";

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
    midden: null,
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
    midden: null,
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
export function VacRegel({ v, nr }: { v: VacatureRij; nr: number }) {
  return (
    <a className="vac" href={`/vacatures/${v.slug}`} data-afd={v.afdeling} data-uren={v.serviceType}>
      <span className="vac-nr">{String(nr).padStart(2, "0")}</span>
      <span className="vac-kop"><h3>{v.kort}</h3>{v.client && <span>{v.client}</span>}</span>
      <span className="vac-meta"><span>{v.location}</span>{v.serviceType && <span>{v.serviceType}</span>}</span>
      <span className="vac-loon">{v.loon ? <><b>{v.loon}</b><small>all-in per uur</small></> : <><b>In overleg</b><small>uurloon</small></>}</span>
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
  const { variant, afdeling: vooraf } = useMemo(leesParams, [location]);
  const info = VARIANTEN[variant];

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
  const plaatsen = opsomming(lijst.map((v) => v.plaats));
  const leeg = !isLoading && lijst.length === 0;

  const ld = useMemo(() => {
    const kruimels = [
      { name: "Home", item: `${SITE}/` },
      ...(info.midden ? [{ name: info.midden[0], item: `${SITE}${info.midden[1]}` }] : []),
      { name: "Vacatures", item: `${SITE}/vacatures` },
    ];
    const blokken: Record<string, unknown>[] = [
      { "@context": "https://schema.org", "@type": "CollectionPage", name: `${info.h1.join("")} | EXTRA`, url: `${SITE}/vacatures`, description: info.lead(plaatsen) },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: kruimels.map((k, i) => ({ "@type": "ListItem", position: i + 1, ...k })) },
    ];
    if (lijst.length) {
      blokken.push({
        "@context": "https://schema.org", "@type": "ItemList",
        itemListElement: lijst.map((v, i) => ({ "@type": "ListItem", position: i + 1, name: v.title, url: `${SITE}/vacatures/${v.slug}` })),
      });
    }
    return blokken;
  }, [info, lijst, plaatsen]);

  const chip = isLoading ? "Vacatures laden" : leeg ? "Binnenkort vacatures" : `${lijst.length} openstaande ${lijst.length === 1 ? "vacature" : "vacatures"}`;

  return (
    <Shell sector={info.sector} css={["events", "hotels", "werk", "vacature"]} werkzoekende>
      {ld.map((b, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(b) }} />)}

      <section className="vhero voverzicht"><div className="w">
        <nav className="kruimel" aria-label="Kruimelpad">
          <a href="/">Home</a><span>/</span>
          {info.midden && <><a href={info.midden[1]}>{info.midden[0]}</a><span>/</span></>}
          <span aria-current="page">Vacatures</span>
        </nav>
        <span className="chip"><i></i>{chip}</span>
        <h1 className="vh-h1">{info.h1[0]}<span className="serif">{info.h1[1]}</span></h1>
        <p className="vo-lead">
          {info.lead(plaatsen)}
          {leeg && info.binnenkort ? " De eerste vacatures komen binnenkort online." : ""}
        </p>
      </div></section>

      <section className="donker vacs vo-lijst"><div className="w">
        {lijst.length > 1 && (
          <div className="vo-filter" role="group" aria-label="Filter vacatures">
            <button type="button" className={afd === "alle" ? "aan" : undefined} aria-pressed={afd === "alle"} onClick={() => setAfd("alle")}>Alle <b>{lijst.length}</b></button>
            {afdelingen.length > 1 && afdelingen.map(([a, n]) => (
              <button key={a} type="button" className={afd === a ? "aan" : undefined} aria-pressed={afd === a} onClick={() => setAfd(a)}>{a} <b>{n}</b></button>
            ))}
            {uren.length > 1 && <span className="vo-sep"></span>}
            {uren.length > 1 && uren.map((u) => (
              <button key={u} type="button" className={uur === u ? "aan" : undefined} aria-pressed={uur === u} onClick={() => setUur(uur === u ? null : u)}>{u}</button>
            ))}
          </div>
        )}

        <div className="vac-lijst">
          {zichtbaar.map((v, i) => <VacRegel key={v.slug} v={v} nr={i + 1} />)}
          {leeg && info.binnenkort && info.binnenkort.map(([f, s], i) => (
            <a className="vac" href="#inschrijven" key={f}>
              <span className="vac-nr">{String(i + 1).padStart(2, "0")}</span>
              <span className="vac-kop"><h3>{f}</h3><span>{s}</span></span>
              <span className="vac-meta"><span>{info.binnenkortMeta}</span></span>
              <span className="vac-loon"><b>Binnenkort</b><small>schrijf je alvast in</small></span>
              <i aria-hidden="true"><Ic n="pijl" /></i>
            </a>
          ))}
        </div>
        {!isLoading && lijst.length > 0 && zichtbaar.length === 0 && <p className="vo-leeg">Geen vacatures met deze filters.</p>}

        <div className="vo-niet">
          {leeg
            ? <div><b>{info.binnenkort ? "Nog geen openstaande vacatures" : "Nieuwe vacatures komen eraan"}</b><span>Schrijf je alvast in. We bellen je zodra er werk is dat bij je past.</span></div>
            : <div><b>Niet gevonden wat je zoekt?</b><span>Schrijf je algemeen in. We bellen je zodra er werk is dat bij je past.</span></div>}
          <a className="knop vol" href="#inschrijven">Schrijf je in <svg><use href="#pijl" /></svg></a>
        </div>
      </div></section>

      {variant === "alle" && <Faq s={{ type: "faq", eyebrow: "Veelgestelde vragen", h2: "Werken via [[EXTRA]]", items: VACATURE_FAQS }} />}

      <KandidaatSlot {...info.slot} gekozen={afd !== "alle" ? (afd === "Afwas" ? "Afwas en keukenhulp" : afd) : undefined} />
    </Shell>
  );
}
