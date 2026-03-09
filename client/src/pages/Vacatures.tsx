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
  Users,
  Calendar,
  ArrowRight,
  Star
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { VACATURES, type Vacature } from "@/data/vacatures";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

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

    // JSON-LD JobPosting schemas
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

  const filterContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-4">Locatie / Regio</h3>
        <div className="space-y-3">
          {(["Amsterdam", "Utrecht", "Het Gooi", "Randstad"] as const).map(region => (
            <label key={region} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                id={`region-${region}`}
                checked={filters.regions.includes(region)}
                onChange={() => toggleFilter("regions", region)}
                className="w-4 h-4 rounded border-purple-300/30 accent-purple-600 cursor-pointer"
              />
              <span className="text-sm text-purple-100/70 group-hover:text-white transition-colors select-none">
                {region}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-4">Functie</h3>
        <div className="space-y-3">
          {(["Bediening", "Bartender", "Chef", "Banqueting", "Housekeeping", "Front office"] as const).map(func => (
            <label key={func} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                id={`func-${func}`}
                checked={filters.functions.includes(func)}
                onChange={() => toggleFilter("functions", func)}
                className="w-4 h-4 rounded border-purple-300/30 accent-purple-600 cursor-pointer"
              />
              <span className="text-sm text-purple-100/70 group-hover:text-white transition-colors select-none">
                {func}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-4">Type dienst</h3>
        <div className="space-y-3">
          {(["Fulltime", "Parttime", "Bijbaan", "Oproep"] as const).map(type => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                id={`type-${type}`}
                checked={filters.serviceTypes.includes(type)}
                onChange={() => toggleFilter("serviceTypes", type)}
                className="w-4 h-4 rounded border-purple-300/30 accent-purple-600 cursor-pointer"
              />
              <span className="text-sm text-purple-100/70 group-hover:text-white transition-colors select-none">
                {type}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-4">Werkplek</h3>
        <div className="space-y-3">
          {(["Hotel", "Eventlocatie", "Catering", "Restaurant"] as const).map(work => (
            <label key={work} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                id={`work-${work}`}
                checked={filters.workplaces.includes(work)}
                onChange={() => toggleFilter("workplaces", work)}
                className="w-4 h-4 rounded border-purple-300/30 accent-purple-600 cursor-pointer"
              />
              <span className="text-sm text-purple-100/70 group-hover:text-white transition-colors select-none">
                {work}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" /> Filters wissen
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0310] text-white font-sans selection:bg-purple-500/30">
      <PublicNav forceDark={false} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950">
          <XPatternBg count={3} opacity={0.1} color="rgba(168,85,247,0.5)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 text-center">
            <RevealSection>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight font-poppins">
                Horeca vacatures <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">in Amsterdam</span>
              </h1>
              <p className="text-xl text-purple-100/70 max-w-2xl mx-auto mb-10 leading-relaxed">
                Vacatures bij hotels, events en restaurants
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto relative mb-12">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300/50" />
                <input 
                  type="text" 
                  placeholder="Zoek op functie, trefwoord..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-full py-4 pl-12 pr-6 text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all backdrop-blur-sm"
                />
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 text-sm font-bold uppercase tracking-widest text-purple-300/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  50+ actieve vacatures
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  Amsterdam & regio
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-1/4 space-y-8">
              <div className="sticky top-32 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-950/50">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold">Filters</h2>
                </div>
                {filterContent}
              </div>
            </aside>

            {/* Mobile Filters - Accordion */}
            <div className="lg:hidden">
              <Accordion type="single" collapsible className="bg-white/5 border border-white/10 rounded-2xl px-6">
                <AccordionItem value="filters" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-purple-400" />
                      <span className="font-bold">Verfijn resultaten</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    {filterContent}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Results Area */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black font-poppins">
                  Actuele horeca vacatures
                </h2>
                <span className="text-sm text-purple-300/60 font-medium">
                  {filteredVacatures.length} {filteredVacatures.length === 1 ? 'vacature' : 'vacatures'} gevonden
                </span>
              </div>

              {filteredVacatures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredVacatures.map((v) => (
                    <RevealSection key={v.slug}>
                      <Link href={`/vacatures/${v.slug}`}>
                        <div className="group bg-white rounded-2xl p-6 h-full border border-purple-100 hover:border-purple-300 transition-all duration-300 shadow-xl shadow-purple-950/5 hover:-translate-y-1">
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">
                              <MapPin className="w-3 h-3 mr-1" /> {v.location}
                            </Badge>
                            <Badge variant="outline" className="text-gray-500 border-gray-200 uppercase text-[10px] tracking-widest font-bold">
                              {v.serviceType}
                            </Badge>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2 leading-snug">
                            {v.title}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Building2 className="w-4 h-4" />
                            <span className="truncate">{v.client}</span>
                          </div>

                          <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
                            {v.shortDescription}
                          </p>

                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Bekijk vacature</span>
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </RevealSection>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Geen vacatures gevonden</h3>
                  <p className="text-purple-300/60 max-w-xs mx-auto mb-8">
                    Probeer je zoekopdracht aan te passen of de filters te wissen.
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                    Alle filters wissen
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* USP Section */}
        <section className="py-24 bg-[#0d0415] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 font-poppins">Waarom werken via EXTRA</h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  Bij EXTRA ben je niet zomaar een nummer. Wij investeren in jouw groei en bieden de beste voorwaarden.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { 
                    title: "Wekelijkse uitbetaling", 
                    desc: "Krijg elke week je loon gestort. Of kies voor dagbetaling na je gewerkte dienst via ons platform.",
                    icon: Calendar
                  },
                  { 
                    title: "EXTRAATje Beloningen", 
                    desc: "Spaar punten bij elke dienst en wissel ze in voor toffe gadgets, ervaringen of kortingen.",
                    icon: Star
                  },
                  { 
                    title: "Vastigheid & Zekerheid", 
                    desc: "Iedereen is direct in loondienst bij EXTRA. Wij regelen je verzekeringen, vakantiegeld en pensioen.",
                    icon: CheckCircle2
                  }
                ].map((usp, i) => (
                  <RevealSection key={i} delay={i * 100}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <usp.icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{usp.title}</h3>
                      <p className="text-white/60 leading-relaxed text-sm">{usp.desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
              
              <div className="mt-16 text-center">
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-10 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Direct inschrijven <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
