import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  X,
  CheckCircle2,
  ArrowRight,
  Zap,
  UtensilsCrossed,
  ChefHat,
  BedDouble,
  ConciergeBell,
  SlidersHorizontal,
  Euro,
  ChevronDown,
  ChevronRight,
  Gift,
  Trophy,
  HelpCircle,
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Button } from "@/components/ui/button";
import horecaImg from "@assets/Horecamedewerker_1771836004844.webp";
import housekeepingImg from "@assets/Housekeeping_1771842919384.webp";
import chefImg from "@assets/Chef_1771833440047.webp";
import frontOfficeImg from "@assets/Front-office_1771842663934.webp";

type SortOption = "newest" | "salary_high" | "parttime" | "fulltime";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Nieuwste vacatures",
  salary_high: "Hoogste all-in loon",
  parttime: "Parttime eerst",
  fulltime: "Fulltime eerst",
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  Fulltime: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Parttime: "bg-blue-50 text-blue-700 border-blue-100",
  Bijbaan: "bg-amber-50 text-amber-700 border-amber-100",
  Oproep: "bg-purple-50 text-purple-700 border-purple-100",
};

// FAQ over werken via EXTRA — zichtbaar op de pagina én als FAQPage-structured-data.
// Antwoorden bewust volledig en feitelijk geformuleerd: daarmee scoren we zowel in
// Google (rich results) als in AI-zoekmachines (GEO), die letterlijke antwoorden citeren.
const VACATURE_FAQS = [
  {
    q: "Hoe snel kan ik aan de slag via EXTRA?",
    a: "Vaak binnen enkele dagen. Je meldt je aan via het aanmeldformulier, we plannen een korte kennismaking en daarna kun je direct shifts oppakken bij hotels, restaurants en events in Amsterdam en omgeving.",
  },
  {
    q: "Wat betekent een all-in uurloon?",
    a: "Bij een all-in uurloon zijn vakantiegeld en vakantie-uren direct in je uurloon verwerkt. Wat je ziet is wat je per gewerkt uur opbouwt — transparant en zonder verrassingen.",
  },
  {
    q: "Hoe werkt dagbetaling bij EXTRA?",
    a: "Na elke gewerkte shift kun je je verdiende loon direct laten uitbetalen. Je hoeft dus niet te wachten tot het einde van de maand.",
  },
  {
    q: "Heb ik horeca-ervaring nodig?",
    a: "Voor veel functies is ervaring een pré maar geen vereiste. Motivatie en een representatief voorkomen zijn het belangrijkst; je leert het vak op de mooiste locaties van Amsterdam.",
  },
  {
    q: "Ben ik in loondienst als ik via EXTRA werk?",
    a: "Ja. Iedereen die via EXTRA werkt is in loondienst bij EXTRA, een NEN 4400-1 gecertificeerd uitzendbureau. Je bent dus altijd verzekerd van correcte afdrachten en goed werkgeverschap.",
  },
];

type VacancyCard = {
  slug: string;
  title: string;
  location: string;
  region: string;
  functionType: string;
  serviceType: string;
  workplace: string;
  shortDescription: string;
  salaryMin: number | null;
  datePosted: string;
};

export default function Vacatures() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<{
    regions: string[];
    functions: string[];
    serviceTypes: string[];
    workplaces: string[];
  }>({ regions: [], functions: [], serviceTypes: [], workplaces: [] });

  const sortRef = useRef<HTMLDivElement>(null);

  // Alleen échte, gepubliceerde vacatures uit het CMS — geen statische placeholders.
  const { data: vacancyData, isLoading } = useQuery<{ posts: any[]; total?: number }>({
    queryKey: ["/api/vacatures"],
    staleTime: 60_000,
  });

  const vacatures: VacancyCard[] = useMemo(() => {
    const posts = Array.isArray(vacancyData?.posts) ? vacancyData!.posts : [];
    return posts.map((p: any) => ({
      slug: p.slug,
      title: p.title,
      location: p.location,
      region: p.region,
      functionType: p.functionType,
      serviceType: p.serviceType,
      workplace: p.workplace,
      shortDescription: p.shortDescription || p.metaDescription || "",
      salaryMin: p.salaryMin ? parseFloat(p.salaryMin) : null,
      datePosted: p.publishedAt || p.createdAt,
    }));
  }, [vacancyData]);

  // SEO: title/description + structured data.
  // Bewust géén JobPosting-markup op de overzichtspagina: Google wil JobPosting
  // uitsluitend op de detailpagina van de vacature zelf (elke vacature heeft een
  // eigen URL/paginastructuur). Hier: CollectionPage + ItemList + Breadcrumb + FAQ.
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Horeca Vacatures Amsterdam | All-in uurloon & dagbetaling | EXTRA";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Actuele horeca vacatures in Amsterdam en omgeving. Werk als bediening, chef, bartender, housekeeping of front-office bij tophotels, restaurants en events. All-in uurloon, dagbetaling mogelijk. Solliciteer direct via EXTRA.",
      );
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://www.doehetextra.nl/vacatures");
  }, []);

  useEffect(() => {
    if (vacatures.length === 0) return;
    const schemas: Record<string, any>[] = [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Horeca Vacatures Amsterdam | EXTRA",
        "url": "https://www.doehetextra.nl/vacatures",
        "description": "Overzicht van actuele horeca vacatures in Amsterdam en omgeving via EXTRA Uitzendbureau.",
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": vacatures.map((v, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": v.title,
          "url": `https://www.doehetextra.nl/vacatures/${v.slug}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.doehetextra.nl/" },
          { "@type": "ListItem", "position": 2, "name": "Vacatures", "item": "https://www.doehetextra.nl/vacatures" },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": VACATURE_FAQS.map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      },
    ];
    const scripts = schemas.map((schema, i) => {
      const script = document.createElement("script");
      script.id = `vacatures-schema-${i}`;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      return script;
    });
    return () => { scripts.forEach((s) => { if (s.parentNode) s.parentNode.removeChild(s); }); };
  }, [vacatures]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (mobileFiltersOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileFiltersOpen]);

  const filteredAndSorted = useMemo(() => {
    const filtered = vacatures.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || v.title.toLowerCase().includes(q) || v.shortDescription.toLowerCase().includes(q) || v.functionType.toLowerCase().includes(q);
      const matchesRegion = filters.regions.length === 0 || filters.regions.includes(v.region);
      const matchesFunction = filters.functions.length === 0 || filters.functions.includes(v.functionType);
      const matchesService = filters.serviceTypes.length === 0 || filters.serviceTypes.includes(v.serviceType);
      const matchesWorkplace = filters.workplaces.length === 0 || filters.workplaces.includes(v.workplace);
      return matchesSearch && matchesRegion && matchesFunction && matchesService && matchesWorkplace;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "salary_high") return (b.salaryMin ?? 0) - (a.salaryMin ?? 0);
      if (sortBy === "parttime") {
        const order = ["Parttime", "Bijbaan", "Oproep", "Fulltime"];
        return order.indexOf(a.serviceType) - order.indexOf(b.serviceType);
      }
      if (sortBy === "fulltime") {
        const order = ["Fulltime", "Parttime", "Bijbaan", "Oproep"];
        return order.indexOf(a.serviceType) - order.indexOf(b.serviceType);
      }
      return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
    });
  }, [vacatures, searchQuery, filters, sortBy]);

  const activeFilterCount =
    filters.regions.length + filters.functions.length +
    filters.serviceTypes.length + filters.workplaces.length;

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value],
    }));
  };

  const clearFilters = () => {
    setFilters({ regions: [], functions: [], serviceTypes: [], workplaces: [] });
    setSearchQuery("");
  };

  const FilterCheckbox = ({ type, value }: { type: keyof typeof filters; value: string }) => (
    <label className="flex items-center gap-3 cursor-pointer group py-2 rounded-lg hover:bg-purple-50/60 px-2 -mx-2 transition-colors">
      <input
        type="checkbox"
        checked={filters[type].includes(value)}
        onChange={() => toggleFilter(type, value)}
        className="w-4 h-4 rounded border-gray-300 accent-purple-600 cursor-pointer flex-shrink-0"
      />
      <span className="text-sm text-gray-600 group-hover:text-purple-700 transition-colors select-none">
        {value}
      </span>
    </label>
  );

  const FilterPanel = () => (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-2">Locatie / Regio</p>
        <div>
          {(["Amsterdam", "Utrecht", "Het Gooi", "Randstad"] as const).map((r) => (
            <FilterCheckbox key={r} type="regions" value={r} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-2">Functie</p>
        <div>
          {(["Bediening", "Bartender", "Chef", "Banqueting", "Housekeeping", "Front office"] as const).map((f) => (
            <FilterCheckbox key={f} type="functions" value={f} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-2">Type dienst</p>
        <div>
          {(["Fulltime", "Parttime", "Bijbaan", "Oproep"] as const).map((t) => (
            <FilterCheckbox key={t} type="serviceTypes" value={t} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-2">Werkplek</p>
        <div>
          {(["Hotel", "Eventlocatie", "Catering", "Restaurant"] as const).map((w) => (
            <FilterCheckbox key={w} type="workplaces" value={w} />
          ))}
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-xl transition-colors border border-purple-200"
        >
          <X className="w-3.5 h-3.5" /> Filters wissen ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <PublicNav forceDark={false} />

      <main>
        {/* HERO — compact en zoekwoord-gedreven: de H1 draagt het hoofdzoekwoord,
            de speelse merkzin is bewust de subtitel. */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#2a0d5e] to-purple-800" />
          <XPatternBg count={3} opacity={0.08} color="rgba(216,180,254,0.6)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 pt-32 pb-16 lg:pt-44 lg:pb-20">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-200 font-bold text-xs uppercase tracking-widest mb-6 bg-white/10 px-4 py-2 rounded-full border border-white/15">
                <MapPin className="w-4 h-4" /> Amsterdam &amp; regio
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-[1.08] max-w-3xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Horeca vacatures{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Amsterdam</span>
              </h1>
              <p className="text-xl text-purple-100/80 mb-8 leading-relaxed max-w-2xl">
                Klaar om iets extra's te laten zien? Werk bij tophotels, restaurants en events —
                met een all-in uurloon en dagbetaling mogelijk.
              </p>
              <div className="relative max-w-xl mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Zoek op functie of trefwoord…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Zoek vacatures"
                  className="w-full bg-white border-0 rounded-full py-4 pl-14 pr-6 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-400/40 transition-all text-base shadow-xl"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors" aria-label="Zoekopdracht wissen">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-6 text-sm font-semibold text-purple-100/80">
                <span className="flex items-center gap-2"><Euro className="w-4 h-4 text-purple-300" />All-in uurloon</span>
                <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-purple-300" />Dagbetaling mogelijk</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-300" />Direct in loondienst</span>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* VACATURE-OVERZICHT */}
        <section className="py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

              {/* Desktop sidebar */}
              <aside className="hidden lg:block w-56 flex-shrink-0" aria-label="Vacaturefilters">
                <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl">
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                      <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-sm text-gray-800">Filters</span>
                      {activeFilterCount > 0 && (
                        <span className="ml-auto bg-purple-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                          {activeFilterCount}
                        </span>
                      )}
                    </div>
                    <FilterPanel />
                  </div>
                </div>
              </aside>

              {/* Resultaten */}
              <div className="flex-1 min-w-0">

                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileFiltersOpen(true)}
                      className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-purple-300 hover:text-purple-700 transition-colors shadow-sm"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="bg-purple-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                    <p className="text-sm font-semibold text-gray-500" aria-live="polite">
                      <span className="text-gray-900 font-black">{filteredAndSorted.length}</span>{" "}
                      {filteredAndSorted.length === 1 ? "vacature" : "vacatures"} gevonden
                    </p>
                  </div>

                  <div className="relative flex-shrink-0" ref={sortRef}>
                    <button
                      onClick={() => setSortOpen((o) => !o)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-purple-300 hover:text-purple-700 transition-colors shadow-sm"
                    >
                      <span className="hidden sm:inline">{SORT_LABELS[sortBy]}</span>
                      <span className="sm:hidden">Sorteren</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                    </button>
                    {sortOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-30">
                        {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => { setSortBy(key); setSortOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${sortBy === key ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Laadstatus */}
                {isLoading && (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-28 bg-gray-50 border border-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                )}

                {/* Vacaturelijst */}
                {!isLoading && filteredAndSorted.length > 0 && (
                  <div className="space-y-3">
                    {filteredAndSorted.map((v, i) => (
                      <RevealSection key={v.slug} delay={i * 40}>
                        <Link href={`/vacatures/${v.slug}`} className="group block">
                          <article className="bg-white border border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-md hover:shadow-purple-500/8 transition-all duration-200 overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-6 lg:py-7">

                              <div className="flex-1 min-w-0">
                                {/* h2: elke vacaturetitel is een eigen indexeerbare entiteit
                                    met een eigen detailpagina */}
                                <h2 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors leading-snug mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                  {v.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                                    <MapPin className="w-3 h-3" /> {v.location}
                                  </span>
                                  <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${SERVICE_TYPE_COLORS[v.serviceType] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                                    {v.serviceType}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                                    <Building2 className="w-3 h-3" /> {v.workplace}
                                  </span>
                                </div>
                              </div>

                              <div className="hidden md:block w-64 lg:w-72 flex-shrink-0">
                                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                  {v.shortDescription}
                                </p>
                              </div>

                              {/* Nadruk: all-in loon als sterkste conversie-element */}
                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2.5 flex-shrink-0">
                                {v.salaryMin ? (
                                  <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-800 text-sm font-black px-3 py-1.5 rounded-full">
                                    €{v.salaryMin.toFixed(2).replace(".", ",")}{" "}
                                    <span className="font-semibold text-purple-500">all-in p/u</span>
                                  </span>
                                ) : (
                                  <span className="text-sm font-semibold text-gray-400">Loon in overleg</span>
                                )}
                                <span className="inline-flex items-center gap-1.5 bg-purple-600 group-hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                                  Bekijk vacature <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>

                            <div className="md:hidden px-6 pb-5 -mt-1">
                              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                {v.shortDescription}
                              </p>
                            </div>
                          </article>
                        </Link>
                      </RevealSection>
                    ))}
                  </div>
                )}

                {/* Leeg: geen resultaten door filters */}
                {!isLoading && vacatures.length > 0 && filteredAndSorted.length === 0 && (
                  <div className="text-center py-24 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Search className="w-7 h-7 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Geen vacatures gevonden</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8 text-sm leading-relaxed">
                      Probeer je zoekopdracht aan te passen of de filters te wissen.
                    </p>
                    <Button onClick={clearFilters} className="border border-purple-200 bg-white text-purple-700 hover:bg-purple-50 rounded-full shadow-none">
                      Alle filters wissen
                    </Button>
                  </div>
                )}

                {/* Leeg: nog geen gepubliceerde vacatures */}
                {!isLoading && vacatures.length === 0 && (
                  <div className="text-center py-24 bg-purple-50/50 border border-purple-100 rounded-3xl px-6">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Briefcase className="w-7 h-7 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Nieuwe vacatures komen eraan
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                      We zetten op dit moment nieuwe opdrachten klaar. Meld je alvast aan —
                      dan matchen we je direct zodra er een shift beschikbaar is die bij je past.
                    </p>
                    <Link href="/aanmelden" className="inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all text-sm hover:scale-105 shadow-xl shadow-purple-600/20">
                      Direct aanmelden <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {/* CTA onder resultaten */}
                {!isLoading && filteredAndSorted.length > 0 && (
                  <RevealSection>
                    <div className="mt-10 relative overflow-hidden bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-2xl px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                        <p className="font-black text-gray-900 text-xl leading-snug mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Niet gevonden wat je zocht?</p>
                        <p className="text-gray-500 text-sm mt-1">Meld je aan en wij matchen je aan de beste opdrachten.</p>
                      </div>
                      <Link href="/aanmelden" className="flex-shrink-0 group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all text-sm hover:scale-105 shadow-xl shadow-purple-600/20">
                        Direct aanmelden <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </RevealSection>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Mobiel filterpaneel */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-gray-800">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-purple-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <FilterPanel />
              </div>
              <div className="px-6 py-5 border-t border-gray-100">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-full transition-colors text-sm"
                >
                  {filteredAndSorted.length} vacatures tonen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VAKGEBIEDEN — interne links naar de functie-landingspagina's (topische
            silo-structuur: overzicht → vakgebied → vacature) */}
        <section className="relative py-24 lg:py-32 overflow-hidden bg-purple-50/60">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <div className="text-center mb-16">
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-widest mb-5 bg-purple-100/80 px-4 py-2 rounded-full">
                  <Briefcase className="w-3.5 h-3.5" /> Vakgebieden
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Zoek vacatures per vakgebied
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto">
                  Ontdek alle mogelijkheden binnen de hospitality sector in Amsterdam en omgeving.
                </p>
              </div>
            </RevealSection>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Horeca werk", href: "/horeca-vacatures-amsterdam", img: horecaImg, icon: UtensilsCrossed, desc: "Bediening, bar, banqueting en events." },
                { title: "Chef vacatures", href: "/chef-vacatures-amsterdam", img: chefImg, icon: ChefHat, desc: "Van commis tot zelfstandig werkend kok." },
                { title: "Housekeeping", href: "/housekeeping-vacatures-amsterdam", img: housekeepingImg, icon: BedDouble, desc: "Zorg voor een perfect verblijf in tophotels." },
                { title: "Front office", href: "/front-office-vacatures-amsterdam", img: frontOfficeImg, icon: ConciergeBell, desc: "Receptie en gastenbeleving." },
              ].map((job, i) => (
                <RevealSection key={job.href} delay={i * 100}>
                  <Link href={job.href} className="group bg-white border border-purple-100 rounded-2xl overflow-hidden hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100 transition-all duration-300 flex flex-col h-full">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={job.img} alt={`${job.title} in Amsterdam via EXTRA`} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-600 transition-colors duration-300">
                          <job.icon className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                      </div>
                      <p className="text-gray-500 text-sm mb-4 flex-grow">{job.desc}</p>
                      <div className="flex items-center text-purple-600 font-bold text-sm gap-1 group-hover:gap-2 transition-all duration-300">
                        Bekijk vacatures <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* VOORDELEN */}
        <section className="relative py-24 lg:py-32 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                  Voordelen
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Waarom werken via EXTRA?
                </h2>
                <p className="text-gray-500 max-w-xl mx-auto">
                  EXTRA biedt meer dan een gewone bijbaan. Dagbetaling, punten sparen en werken bij toplocaties.
                </p>
              </div>
            </RevealSection>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { Icon: Zap, title: "Dagbetaling", color: "bg-amber-50 text-amber-600", desc: "Na elke shift direct uitbetaald. Geen wachten tot het einde van de maand." },
                { Icon: Trophy, title: "Punten & rankings", color: "bg-purple-50 text-purple-600", desc: "Verdien punten per gewerkt uur. Klim in de rankings en verdien meer beloningen." },
                { Icon: Gift, title: "EXTRAATje beloningen", color: "bg-emerald-50 text-emerald-600", desc: "Wissel gespaarde punten in voor cadeaubonnen, gadgets en exclusieve beloningen." },
              ].map(({ Icon, title, color, desc }, i) => (
                <RevealSection key={i} delay={i * 100}>
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-purple-100 hover:shadow-md transition-all duration-300 shadow-sm">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ — zichtbaar voor bezoekers, FAQPage-schema voor Google & AI-zoekmachines */}
        <section className="py-24 bg-purple-50/40">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Veelgestelde vragen over werken via EXTRA
                </h2>
              </div>
              <div className="space-y-3">
                {VACATURE_FAQS.map((f, i) => (
                  <details key={i} className="group bg-white border border-purple-100 rounded-xl overflow-hidden">
                    <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-5 py-4 font-semibold text-gray-900 hover:bg-purple-50/50 transition-colors">
                      <span className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-purple-600 shrink-0" />
                        {f.q}
                      </span>
                      <ChevronRight className="w-4 h-4 text-purple-400 transition-transform group-open:rotate-90 shrink-0" />
                    </summary>
                    <div className="px-5 pb-5 pt-1 text-gray-600 leading-relaxed">{f.a}</div>
                  </details>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
