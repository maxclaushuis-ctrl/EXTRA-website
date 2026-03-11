import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  ChevronRight,
  X,
  Filter,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Star,
  Zap,
  UtensilsCrossed,
  ChefHat,
  BedDouble,
  ConciergeBell,
  SlidersHorizontal,
  Euro
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { VACATURES, type Vacature } from "@/data/vacatures";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import horecaImg from "@assets/Horecamedewerker_1771836004844.webp";
import housekeepingImg from "@assets/Housekeeping_1771842919384.webp";
import chefImg from "@assets/Chef_1771833440047.webp";
import frontOfficeImg from "@assets/Front-office_1771842663934.webp";

const serviceTypeBadgeColors: Record<string, string> = {
  Fulltime: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
  Parttime: "bg-blue-500/15 text-blue-300 border border-blue-500/25",
  Bijbaan: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  Oproep: "bg-purple-500/15 text-purple-300 border border-purple-500/25",
};

export default function Vacatures() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    regions: string[];
    functions: string[];
    serviceTypes: string[];
    workplaces: string[];
  }>({
    regions: [],
    functions: [],
    serviceTypes: [],
    workplaces: [],
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Horeca Vacatures Amsterdam | Bediening, Chef & Hotel | EXTRA";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Actuele horeca vacatures in Amsterdam via EXTRA. Werk bij tophotels, evenementenlocaties en restaurants als bediening, chef, bartender of housekeeping. Solliciteer direct.");
    }

    const scripts: HTMLScriptElement[] = [];
    VACATURES.forEach((vacature) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.innerHTML = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": vacature.title,
        "description": vacature.shortDescription,
        "employmentType": vacature.serviceType.toUpperCase(),
        "datePosted": vacature.datePosted,
        "hiringOrganization": {
          "@type": "Organization",
          "name": "EXTRA Uitzendbureau",
          "sameAs": "https://www.doehetextra.nl"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": vacature.location,
            "addressCountry": "NL"
          }
        }
      });
      document.head.appendChild(script);
      scripts.push(script);
    });

    return () => {
      scripts.forEach(script => document.head.removeChild(script));
    };
  }, []);

  const filteredVacatures = useMemo(() => {
    return VACATURES.filter(v => {
      const matchesSearch = !searchQuery ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion = filters.regions.length === 0 || filters.regions.includes(v.region);
      const matchesFunction = filters.functions.length === 0 || filters.functions.includes(v.functionType);
      const matchesService = filters.serviceTypes.length === 0 || filters.serviceTypes.includes(v.serviceType);
      const matchesWorkplace = filters.workplaces.length === 0 || filters.workplaces.includes(v.workplace);

      return matchesSearch && matchesRegion && matchesFunction && matchesService && matchesWorkplace;
    });
  }, [searchQuery, filters]);

  const activeFilterCount =
    filters.regions.length +
    filters.functions.length +
    filters.serviceTypes.length +
    filters.workplaces.length;

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({ regions: [], functions: [], serviceTypes: [], workplaces: [] });
    setSearchQuery("");
  };

  const FilterCheckbox = ({ type, value }: { type: keyof typeof filters; value: string }) => (
    <label className="flex items-center gap-3 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={filters[type].includes(value)}
        onChange={() => toggleFilter(type, value)}
        className="w-4 h-4 rounded border-white/20 accent-purple-500 cursor-pointer flex-shrink-0"
      />
      <span className="text-sm text-purple-100/60 group-hover:text-white transition-colors select-none">
        {value}
      </span>
    </label>
  );

  const filterContent = (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Locatie / Regio</p>
        <div className="space-y-2">
          {(["Amsterdam", "Utrecht", "Het Gooi", "Randstad"] as const).map(r => (
            <FilterCheckbox key={r} type="regions" value={r} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Functie</p>
        <div className="space-y-2">
          {(["Bediening", "Bartender", "Chef", "Banqueting", "Housekeeping", "Front office"] as const).map(f => (
            <FilterCheckbox key={f} type="functions" value={f} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Type dienst</p>
        <div className="space-y-2">
          {(["Fulltime", "Parttime", "Bijbaan", "Oproep"] as const).map(t => (
            <FilterCheckbox key={t} type="serviceTypes" value={t} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Werkplek</p>
        <div className="space-y-2">
          {(["Hotel", "Eventlocatie", "Catering", "Restaurant"] as const).map(w => (
            <FilterCheckbox key={w} type="workplaces" value={w} />
          ))}
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-purple-400 hover:text-white hover:bg-purple-500/15 rounded-xl transition-colors border border-purple-500/20"
        >
          <X className="w-4 h-4" /> Filters wissen ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0310] text-white font-sans selection:bg-purple-500/30">
      <PublicNav forceDark={false} />

      <main>
        {/* ── HERO ── */}
        <section className="relative pt-36 pb-24 lg:pt-52 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/80 via-[#110726] to-[#0a0310]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(124,58,237,0.18),transparent)]" />
          <XPatternBg count={3} opacity={0.08} color="rgba(168,85,247,0.5)" />
          <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 text-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                <MapPin className="w-3.5 h-3.5" /> Amsterdam &amp; regio
              </span>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-5 leading-[1.05]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Horeca vacatures{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  in Amsterdam
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-purple-100/65 max-w-2xl mx-auto mb-10 leading-relaxed">
                Vacatures bij hotels, restaurants, events en hospitality locaties in Amsterdam en omgeving. Kies jouw functie en solliciteer direct.
              </p>

              {/* Search */}
              <div className="max-w-2xl mx-auto relative mb-10">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300/50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Zoek op functie of trefwoord…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-full py-4 pl-14 pr-6 text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all backdrop-blur-sm text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-purple-300/60">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  {VACATURES.length}+ actieve vacatures
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  Amsterdam &amp; regio
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Dagbetaling mogelijk
                </span>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── VACATURE OVERVIEW ── */}
        <section className="pb-24 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-950/50">
                <div className="flex items-center gap-2 mb-6 pb-5 border-b border-white/10">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-sm">Verfijn resultaten</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-auto bg-purple-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {filterContent}
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">

              {/* Mobile filter accordion */}
              <div className="lg:hidden mb-6">
                <Accordion type="single" collapsible className="bg-white/5 border border-white/10 rounded-2xl px-5">
                  <AccordionItem value="filters" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-sm">Verfijn resultaten</span>
                        {activeFilterCount > 0 && (
                          <span className="ml-1 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {activeFilterCount}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">{filterContent}</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Results header */}
              <div className="flex items-center justify-between mb-7">
                <h2 className="text-xl sm:text-2xl font-black" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Actuele horeca vacatures
                </h2>
                <span className="text-sm text-purple-300/50 font-medium flex-shrink-0 ml-4">
                  {filteredVacatures.length} {filteredVacatures.length === 1 ? "vacature" : "vacatures"}
                </span>
              </div>

              {filteredVacatures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredVacatures.map((v) => (
                    <RevealSection key={v.slug}>
                      <Link href={`/vacatures/${v.slug}`} className="group block h-full">
                        <article className="h-full bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden hover:bg-white/[0.07] hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
                          {/* Card top: badges */}
                          <div className="px-5 pt-5 pb-0 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                              <MapPin className="w-3 h-3" /> {v.location}
                            </span>
                            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${serviceTypeBadgeColors[v.serviceType] ?? "bg-white/10 text-white/60"}`}>
                              {v.serviceType}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08]">
                              <Building2 className="w-3 h-3" /> {v.workplace}
                            </span>
                          </div>

                          {/* Card body */}
                          <div className="px-5 pt-4 pb-5 flex flex-col flex-grow">
                            <h3 className="text-base font-bold text-white leading-snug mb-1 group-hover:text-purple-300 transition-colors line-clamp-2">
                              {v.title}
                            </h3>
                            <p className="text-xs text-purple-100/40 mb-3 flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{v.client}</span>
                            </p>
                            <p className="text-sm text-white/55 leading-relaxed line-clamp-2 flex-grow">
                              {v.shortDescription}
                            </p>
                          </div>

                          {/* Card footer */}
                          <div className="px-5 py-3.5 border-t border-white/[0.06] flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                              <Euro className="w-3 h-3" />
                              Vanaf €{v.salaryMin.toFixed(2).replace(".", ",")} p/u
                            </span>
                            <span className="flex items-center gap-1 text-xs font-bold text-purple-400 group-hover:gap-2 transition-all">
                              Bekijk vacature <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </article>
                      </Link>
                    </RevealSection>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/[0.03] border border-dashed border-white/10 rounded-3xl">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Search className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Geen vacatures gevonden</h3>
                  <p className="text-purple-300/50 max-w-xs mx-auto mb-8 text-sm leading-relaxed">
                    Probeer je zoekopdracht aan te passen of de filters te wissen.
                  </p>
                  <Button
                    onClick={clearFilters}
                    className="border border-purple-500/30 bg-transparent text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 rounded-full"
                  >
                    Alle filters wissen
                  </Button>
                </div>
              )}

              {/* CTA below results */}
              {filteredVacatures.length > 0 && (
                <RevealSection>
                  <div className="mt-12 bg-gradient-to-r from-purple-600/20 to-violet-600/10 border border-purple-500/20 rounded-2xl px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <p className="font-bold text-white text-lg leading-snug">Niet gevonden wat je zocht?</p>
                      <p className="text-white/55 text-sm mt-1">Meld je aan en wij matchen je aan de beste opdrachten.</p>
                    </div>
                    <Link
                      href="/aanmelden"
                      className="flex-shrink-0 group inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-7 py-3.5 rounded-full transition-all text-sm hover:scale-105 shadow-xl shadow-purple-600/20"
                    >
                      Direct aanmelden <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </RevealSection>
              )}
            </div>
          </div>
        </section>

        {/* ── CATEGORIE LINKS ── */}
        <section className="py-24 bg-[#0d0415] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-4 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                  <Briefcase className="w-3.5 h-3.5" /> Vakgebieden
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Zoek vacatures per functie
                </h2>
                <p className="text-white/55 max-w-xl mx-auto mt-4 text-base">
                  Ontdek alle mogelijkheden binnen de hospitality sector in Amsterdam.
                </p>
              </div>
            </RevealSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {[
                { title: "Horeca werk", sub: "Bediening, bar & events", href: "/horeca-vacatures-amsterdam", img: horecaImg, Icon: UtensilsCrossed },
                { title: "Chef vacatures", sub: "Van commis tot chef de partie", href: "/chef-vacatures-amsterdam", img: chefImg, Icon: ChefHat },
                { title: "Housekeeping", sub: "Kamerverzorging in tophotels", href: "/housekeeping-vacatures-amsterdam", img: housekeepingImg, Icon: BedDouble },
                { title: "Front office", sub: "Receptie & gastenbeleving", href: "/front-office-vacatures-amsterdam", img: frontOfficeImg, Icon: ConciergeBell },
              ].map((cat, i) => (
                <RevealSection key={cat.href} delay={i * 100}>
                  <Link href={cat.href} className="group relative block rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer">
                    <img
                      src={cat.img}
                      alt={cat.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 bg-purple-500/30 rounded-lg">
                          <cat.Icon className="w-4 h-4 text-purple-300" />
                        </div>
                        <h3 className="text-base font-bold text-white">{cat.title}</h3>
                      </div>
                      <p className="text-xs text-white/60 leading-snug mb-3">{cat.sub}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-300 group-hover:gap-2 transition-all">
                        Bekijk vacatures <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── SEO CONTENT BLOCK ── */}
        <section className="py-24 bg-[#0a0310] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <RevealSection>
                <span className="text-purple-400 font-bold text-xs uppercase tracking-widest mb-4 block">Amsterdam &amp; regio</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Werken in de horeca in Amsterdam
                </h2>
                <div className="space-y-4 text-white/60 leading-relaxed text-sm sm:text-base">
                  <p>
                    Amsterdam is een van de meest bruisende horecasteden van Europa. Van internationale vijfsterrenhotels tot intieme restaurants in de Jordaan: de vraag naar hospitality professionals is het hele jaar door hoog.
                  </p>
                  <p>
                    Via EXTRA werk je bij de mooiste locaties in de stad. Of je nu kiest voor bediening in een grand café, housekeeping in een luxehotel, of professionele chefwerkzaamheden bij een cateraar: wij matchen je aan de opdracht die bij jou past.
                  </p>
                  <p>
                    Dankzij ons flexibele systeem bepaal jij wanneer je werkt. Geen vaste schema's, geen verplichtingen. Gewoon werken wanneer het jou uitkomt, met dagbetaling en het EXTRAATje beloningssysteem als extra motivatie.
                  </p>
                </div>
              </RevealSection>

              <RevealSection delay={150}>
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    {
                      Icon: Building2,
                      title: "Hotels Amsterdam",
                      body: "Werk bij internationale hotelketens zoals Hilton, Marriott en NH Hotels. Van housekeeping tot front office, EXTRA biedt plaatsingen in de meest prestigieuze hotels van Amsterdam.",
                    },
                    {
                      Icon: Star,
                      title: "Events & catering",
                      body: "Amsterdam is een toplocatie voor bedrijfsevents, galadiensten en beurzen. Als banqueting- of eventmedewerker werk je op de bijzonderste locaties in de stad.",
                    },
                    {
                      Icon: UtensilsCrossed,
                      title: "Restaurants",
                      body: "Van bruisende grand cafés tot culinaire fine-dining restaurants. Bediening, bar en keuken: EXTRA heeft vacatures op alle niveaus in de Amsterdamse restaurantsector.",
                    },
                    {
                      Icon: Zap,
                      title: "Flexibel horeca werk",
                      body: "Geen zin in een vaste baan? Via EXTRA werk je als oproepkracht op jouw eigen voorwaarden. Maximale vrijheid, directe uitbetaling en een groot netwerk van opdrachtgevers.",
                    },
                  ].map(({ Icon, title, body }, i) => (
                    <div key={title} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.07] hover:border-purple-500/20 transition-all duration-300">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
                      <p className="text-white/50 text-xs leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ── USP STRIP ── */}
        <section className="py-20 bg-[#0d0415] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { Icon: Calendar, title: "Dagbetaling", desc: "Na elke gewerkte dienst staat je salaris de volgende ochtend op je rekening." },
                  { Icon: Star, title: "EXTRAATje beloningen", desc: "Spaar punten bij elke dienst en wissel ze in voor gadgets, ervaringen of kortingen." },
                  { Icon: CheckCircle2, title: "Altijd in loondienst", desc: "Iedereen werkt direct in loondienst bij EXTRA. Wij regelen verzekering, vakantiegeld en pensioen." },
                ].map(({ Icon, title, desc }, i) => (
                  <RevealSection key={title} delay={i * 100}>
                    <div className="flex items-start gap-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:border-purple-500/20 transition-all">
                      <div className="w-11 h-11 flex-shrink-0 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm mb-1.5">{title}</h3>
                        <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>

            <RevealSection delay={200}>
              <div className="mt-12 text-center">
                <Link
                  href="/aanmelden"
                  className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base px-10 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105"
                >
                  Direct inschrijven <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── LINK CLOUD ── */}
        <section className="py-12 bg-[#0a0310] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/25 mb-5 text-center">Gerelateerde pagina's</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Horeca werk Amsterdam", href: "/horeca-vacatures-amsterdam" },
                { label: "Chef vacatures Amsterdam", href: "/chef-vacatures-amsterdam" },
                { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
                { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" },
                { label: "Horeca uitzendbureau Amsterdam", href: "/horeca-uitzendbureau-amsterdam" },
                { label: "Flexibel horeca personeel", href: "/flexibel-horeca-personeel" },
                { label: "Ik zoek extra werk", href: "/horeca-vacatures-amsterdam" },
              ].map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="bg-white/[0.04] px-4 py-2 rounded-full border border-white/[0.08] text-xs font-medium text-white/50 hover:border-purple-400/40 hover:text-purple-300 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
