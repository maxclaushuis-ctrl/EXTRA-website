import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  X,
  CheckCircle2,
  ArrowRight,
  Star,
  Zap,
  UtensilsCrossed,
  ChefHat,
  BedDouble,
  ConciergeBell,
  SlidersHorizontal,
  Euro,
  Calendar,
  ChevronRight,
  Gift,
  Trophy,
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { VACATURES } from "@/data/vacatures";
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
  Oproep: "bg-purple-500/20 text-purple-200 border border-purple-500/30",
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
    return () => { scripts.forEach(s => document.head.removeChild(s)); };
  }, []);

  const filteredVacatures = useMemo(() => {
    return VACATURES.filter(v => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || v.title.toLowerCase().includes(q) || v.shortDescription.toLowerCase().includes(q);
      const matchesRegion = filters.regions.length === 0 || filters.regions.includes(v.region);
      const matchesFunction = filters.functions.length === 0 || filters.functions.includes(v.functionType);
      const matchesService = filters.serviceTypes.length === 0 || filters.serviceTypes.includes(v.serviceType);
      const matchesWorkplace = filters.workplaces.length === 0 || filters.workplaces.includes(v.workplace);
      return matchesSearch && matchesRegion && matchesFunction && matchesService && matchesWorkplace;
    });
  }, [searchQuery, filters]);

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
    <label className="flex items-center gap-3 cursor-pointer group py-1">
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

  const filterContent = (
    <div className="space-y-7">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-3">Locatie / Regio</p>
        <div className="space-y-0.5">
          {(["Amsterdam", "Utrecht", "Het Gooi", "Randstad"] as const).map(r => (
            <FilterCheckbox key={r} type="regions" value={r} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-3">Functie</p>
        <div className="space-y-0.5">
          {(["Bediening", "Bartender", "Chef", "Banqueting", "Housekeeping", "Front office"] as const).map(f => (
            <FilterCheckbox key={f} type="functions" value={f} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-3">Type dienst</p>
        <div className="space-y-0.5">
          {(["Fulltime", "Parttime", "Bijbaan", "Oproep"] as const).map(t => (
            <FilterCheckbox key={t} type="serviceTypes" value={t} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-3">Werkplek</p>
        <div className="space-y-0.5">
          {(["Hotel", "Eventlocatie", "Catering", "Restaurant"] as const).map(w => (
            <FilterCheckbox key={w} type="workplaces" value={w} />
          ))}
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearFilters}
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

        {/* ── HERO — exact same style as /landing hero section ── */}
        <section className="relative min-h-[72vh] flex items-center overflow-hidden">
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
                Vacatures bij hotels, restaurants, events en hospitality locaties in Amsterdam en omgeving. Kies jouw functie en solliciteer direct.
              </p>

              {/* Search bar */}
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
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-300/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 text-sm font-semibold text-purple-300/70">
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

        {/* ── VACATURE OVERVIEW — white background like /landing audience section ── */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-10">

              {/* Desktop Sidebar */}
              <aside className="hidden lg:block w-60 flex-shrink-0">
                <div className="sticky top-28">
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 pb-5 border-b border-gray-100">
                      <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-sm text-gray-800">Verfijn resultaten</span>
                      {activeFilterCount > 0 && (
                        <span className="ml-auto bg-purple-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                          {activeFilterCount}
                        </span>
                      )}
                    </div>
                    {filterContent}
                  </div>
                </div>
              </aside>

              {/* Results column */}
              <div className="flex-1 min-w-0">

                {/* Mobile filter accordion */}
                <div className="lg:hidden mb-6">
                  <Accordion type="single" collapsible className="bg-white border border-gray-200 rounded-2xl px-5 shadow-sm">
                    <AccordionItem value="filters" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-sm text-gray-800">Verfijn resultaten</span>
                          {activeFilterCount > 0 && (
                            <span className="ml-1 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
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
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Actuele vacatures
                  </h2>
                  <span className="text-sm text-gray-400 font-medium ml-4 flex-shrink-0">
                    {filteredVacatures.length} {filteredVacatures.length === 1 ? "vacature" : "vacatures"}
                  </span>
                </div>

                {filteredVacatures.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredVacatures.map((v) => (
                      <RevealSection key={v.slug}>
                        <Link href={`/vacatures/${v.slug}`} className="group block h-full">
                          <article className="h-full bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col shadow-sm">
                            {/* Badges */}
                            <div className="px-6 pt-6 pb-3 flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                                <MapPin className="w-3 h-3" /> {v.location}
                              </span>
                              <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${
                                v.serviceType === "Fulltime" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                v.serviceType === "Parttime" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                v.serviceType === "Bijbaan" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                "bg-purple-50 text-purple-700 border border-purple-100"
                              }`}>
                                {v.serviceType}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                                <Building2 className="w-3 h-3" /> {v.workplace}
                              </span>
                            </div>

                            {/* Body */}
                            <div className="px-6 pb-5 flex flex-col flex-grow">
                              <h3 className="text-base font-bold text-gray-900 leading-snug mb-1.5 group-hover:text-purple-700 transition-colors duration-300 line-clamp-2">
                                {v.title}
                              </h3>
                              <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                                <Briefcase className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{v.client}</span>
                              </p>
                              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-grow">
                                {v.shortDescription}
                              </p>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                                <Euro className="w-3.5 h-3.5" />
                                Vanaf €{v.salaryMin.toFixed(2).replace(".", ",")} p/u
                              </span>
                              <span className="flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:gap-2 transition-all duration-300">
                                Bekijk vacature <ChevronRight className="w-4 h-4" />
                              </span>
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
                    <Button
                      onClick={clearFilters}
                      className="border border-purple-200 bg-white text-purple-700 hover:bg-purple-50 rounded-full shadow-none"
                    >
                      Alle filters wissen
                    </Button>
                  </div>
                )}

                {/* CTA below results */}
                {filteredVacatures.length > 0 && (
                  <RevealSection>
                    <div className="mt-14 relative overflow-hidden bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                        <p className="font-black text-gray-900 text-xl leading-snug mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>Niet gevonden wat je zocht?</p>
                        <p className="text-gray-500 text-sm mt-1">Meld je aan en wij matchen je aan de beste opdrachten.</p>
                      </div>
                      <Link
                        href="/aanmelden"
                        className="flex-shrink-0 group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all text-sm hover:scale-105 shadow-xl shadow-purple-600/20"
                      >
                        Direct aanmelden <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </RevealSection>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── CATEGORIE LINKS — dark purple section like /landing "diensten" ── */}
        <section className="relative py-24 lg:py-36 overflow-hidden">
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

        {/* ── USP SECTION — white background like /landing "how it works" ── */}
        <section className="relative py-24 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
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
                  Meer dan een uitzendbureau. EXTRA is een platform dat jou beloont voor elke gewerkte dienst.
                </p>
              </div>
            </RevealSection>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  Icon: Zap,
                  color: "from-purple-600 to-purple-800",
                  title: "Dagbetaling",
                  desc: "Niet wachten op je geld aan het einde van de maand. Bij EXTRA word je na elke gewerkte shift direct uitbetaald.",
                },
                {
                  Icon: Trophy,
                  color: "from-indigo-500 to-purple-600",
                  title: "Punten verdienen",
                  desc: "Voor elk gewerkt uur spaar je punten. Hoe meer je werkt, hoe hoger je rank in het leaderboard.",
                },
                {
                  Icon: Gift,
                  color: "from-violet-500 to-indigo-600",
                  title: "EXTRAATje beloningen",
                  desc: "Wissel je gespaarde punten in voor geweldige beloningen, van cadeaubonnen tot exclusieve EXTRA gadgets.",
                },
              ].map(({ Icon, color, title, desc }, i) => (
                <RevealSection key={title} delay={i * 120}>
                  <div className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 shadow-sm h-full flex flex-col text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed flex-grow">{desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── SEO CONTENT — white/light background ── */}
        <section className="py-24 lg:py-36 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <RevealSection>
                <span className="text-purple-600 font-bold text-xs uppercase tracking-widest mb-4 block">Amsterdam &amp; regio</span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Werken in de horeca in Amsterdam
                </h2>
                <div className="space-y-5 text-gray-500 leading-relaxed">
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
                  ].map(({ Icon, title, body }) => (
                    <div key={title} className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 shadow-sm">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors duration-300">
                        <Icon className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm mb-2">{title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ── CTA BANNER — dark purple like /landing final-cta ── */}
        <section className="relative py-24 lg:py-36 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Klaar om te knallen?
              </h2>
              <p className="text-purple-200/80 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
                Meld je vandaag aan en begin morgen al te werken via EXTRA.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/aanmelden"
                  className="group bg-white text-purple-900 font-bold px-10 py-5 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center gap-2"
                >
                  Meld je aan <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/horeca-vacatures-amsterdam"
                  className="group border-2 border-white/25 text-white font-bold px-10 py-5 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center gap-2"
                >
                  Alle vacatures
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── LINK CLOUD — light section ── */}
        <section className="py-12 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 text-center">Gerelateerde pagina's</p>
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
                  className="bg-white px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-500 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition-all shadow-sm"
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
