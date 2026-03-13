import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
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
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { VACATURES } from "@/data/vacatures";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Button } from "@/components/ui/button";
import horecaImg from "@assets/Horecamedewerker_1771836004844.webp";
import housekeepingImg from "@assets/Housekeeping_1771842919384.webp";
import chefImg from "@assets/Chef_1771833440047.webp";
import frontOfficeImg from "@assets/Front-office_1771842663934.webp";

type SortOption = "newest" | "salary_high" | "parttime" | "fulltime";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Nieuwste vacatures",
  salary_high: "Hoogste salaris",
  parttime: "Parttime eerst",
  fulltime: "Fulltime eerst",
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  Fulltime: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Parttime: "bg-blue-50 text-blue-700 border-blue-100",
  Bijbaan: "bg-amber-50 text-amber-700 border-amber-100",
  Oproep: "bg-purple-50 text-purple-700 border-purple-100",
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
  }>({
    regions: [],
    functions: [],
    serviceTypes: [],
    workplaces: [],
  });

  const sortRef = useRef<HTMLDivElement>(null);

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
        "hiringOrganization": { "@type": "Organization", "name": "EXTRA Uitzendbureau", "sameAs": "https://www.doehetextra.nl" },
        "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": vacature.location, "addressCountry": "NL" } }
      });
      document.head.appendChild(script);
      scripts.push(script);
    });
    return () => { scripts.forEach(s => document.head.removeChild(s)); };
  }, []);

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
    const filtered = VACATURES.filter(v => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || v.title.toLowerCase().includes(q) || v.shortDescription.toLowerCase().includes(q);
      const matchesRegion = filters.regions.length === 0 || filters.regions.includes(v.region);
      const matchesFunction = filters.functions.length === 0 || filters.functions.includes(v.functionType);
      const matchesService = filters.serviceTypes.length === 0 || filters.serviceTypes.includes(v.serviceType);
      const matchesWorkplace = filters.workplaces.length === 0 || filters.workplaces.includes(v.workplace);
      return matchesSearch && matchesRegion && matchesFunction && matchesService && matchesWorkplace;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "salary_high") return b.salaryMin - a.salaryMin;
      if (sortBy === "parttime") {
        const order = ["Parttime", "Bijbaan", "Oproep", "Fulltime"];
        return order.indexOf(a.serviceType) - order.indexOf(b.serviceType);
      }
      if (sortBy === "fulltime") {
        const order = ["Fulltime", "Parttime", "Bijbaan", "Oproep"];
        return order.indexOf(a.serviceType) - order.indexOf(b.serviceType);
      }
      return 0;
    });
  }, [searchQuery, filters, sortBy]);

  const activeFilterCount =
    filters.regions.length + filters.functions.length +
    filters.serviceTypes.length + filters.workplaces.length;

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
          {(["Amsterdam", "Utrecht", "Het Gooi", "Randstad"] as const).map(r => (
            <FilterCheckbox key={r} type="regions" value={r} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-2">Functie</p>
        <div>
          {(["Bediening", "Bartender", "Chef", "Banqueting", "Housekeeping", "Front office"] as const).map(f => (
            <FilterCheckbox key={f} type="functions" value={f} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-2">Type dienst</p>
        <div>
          {(["Fulltime", "Parttime", "Bijbaan", "Oproep"] as const).map(t => (
            <FilterCheckbox key={t} type="serviceTypes" value={t} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-2">Werkplek</p>
        <div>
          {(["Hotel", "Eventlocatie", "Catering", "Restaurant"] as const).map(w => (
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
        {/* HERO */}
        <section className="relative min-h-[68vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a2e] via-[#170926] to-[#12071f]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_80%,rgba(124,58,237,0.15),transparent)]" />
          <XPatternBg count={3} opacity={0.12} color="rgba(168,85,247,0.6)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 py-32 lg:py-44">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                <MapPin className="w-4 h-4" /> Vacatures Amsterdam &amp; regio
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1] max-w-3xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Klaar om iets{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">extra's</span>{" "}
                te laten zien?
              </h1>
              <p className="text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl">
                Vacatures bij hotels, restaurants, events en hospitality locaties in Amsterdam en omgeving.
              </p>
              <div className="relative max-w-xl mb-10">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300/50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Zoek op functie of trefwoord…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-full py-4 pl-14 pr-6 text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all backdrop-blur-sm text-base"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-300/50 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-6 text-sm font-semibold text-purple-300/70">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" />{VACATURES.length}+ actieve vacatures</span>
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-400" />Amsterdam &amp; regio</span>
                <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" />Dagbetaling mogelijk</span>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* VACATURE OVERVIEW */}
        <section className="py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-56 flex-shrink-0">
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

              {/* Results column */}
              <div className="flex-1 min-w-0">

                {/* Top bar: count + mobile filter button + sort */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    {/* Mobile filter button */}
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
                    <p className="text-sm font-semibold text-gray-500">
                      <span className="text-gray-900 font-black">{filteredAndSorted.length}</span> {filteredAndSorted.length === 1 ? "vacature" : "vacatures"} gevonden
                    </p>
                  </div>

                  {/* Sort dropdown */}
                  <div className="relative flex-shrink-0" ref={sortRef}>
                    <button
                      onClick={() => setSortOpen(o => !o)}
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

                {/* Job list */}
                {filteredAndSorted.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAndSorted.map((v, i) => (
                      <RevealSection key={v.slug} delay={i * 40}>
                        <Link href={`/vacatures/${v.slug}`} className="group block">
                          <article className="bg-white border border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-md hover:shadow-purple-500/8 transition-all duration-200 overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-6 lg:py-7">

                              {/* Left: title + tags */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-700 transition-colors leading-snug mb-2">
                                  {v.title}
                                </h3>
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

                              {/* Middle: description (hidden on mobile) */}
                              <div className="hidden md:block w-64 lg:w-72 flex-shrink-0">
                                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                  {v.shortDescription}
                                </p>
                              </div>

                              {/* Right: salary + CTA */}
                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 flex-shrink-0">
                                <span className="flex items-center gap-1 text-sm font-bold text-gray-800">
                                  <Euro className="w-3.5 h-3.5 text-purple-500" />
                                  {v.salaryMin.toFixed(2).replace(".", ",")} p/u
                                </span>
                                <span className="inline-flex items-center gap-1.5 bg-purple-600 group-hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                                  Bekijk vacature <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>

                            {/* Mobile description */}
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
                ) : (
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

                {/* CTA below results */}
                {filteredAndSorted.length > 0 && (
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

        {/* Mobile filter slide-in panel */}
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

        {/* VAKGEBIEDEN */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950" />
          <XPatternBg count={2} opacity={0.08} color="rgba(168,85,247,0.6)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <div className="text-center mb-16">
                <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-5 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <Briefcase className="w-3.5 h-3.5" /> Vakgebieden
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Zoek vacatures per vakgebied
                </h2>
                <p className="text-white/60 max-w-2xl mx-auto">
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
                  <Link href={job.href} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col h-full">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={job.img} alt={job.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a3e]/90 to-transparent" />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-600 transition-colors duration-300">
                          <job.icon className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{job.title}</h3>
                      </div>
                      <p className="text-white/50 text-sm mb-4 flex-grow">{job.desc}</p>
                      <div className="flex items-center text-purple-300 font-bold text-sm gap-1 group-hover:gap-2 transition-all duration-300">
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
        <section className="relative py-24 lg:py-32 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
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

      </main>

      <PublicFooter />
    </div>
  );
}
