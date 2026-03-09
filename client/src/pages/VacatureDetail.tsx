import { useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { VACATURES } from "@/data/vacatures";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { 
  ChevronRight, 
  MapPin, 
  Building2, 
  Clock, 
  Briefcase, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2,
  Euro,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VacatureDetail() {
  const [match, params] = useRoute("/vacatures/:slug");
  const [, setLocation] = useLocation();
  const vacature = VACATURES.find((v) => v.slug === params?.slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params?.slug]);

  useEffect(() => {
    if (!vacature && match) {
      setLocation("/vacatures");
    }
  }, [vacature, match, setLocation]);

  useEffect(() => {
    if (vacature) {
      document.title = `${vacature.title} | Horeca vacature Amsterdam | EXTRA`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", vacature.metaDescription);
      }
    }
  }, [vacature]);

  if (!vacature) return null;

  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": vacature.title,
    "description": vacature.fullDescription,
    "employmentType": vacature.serviceType === "Fulltime" ? "FULL_TIME" : vacature.serviceType === "Parttime" ? "PART_TIME" : "OTHER",
    "datePosted": vacature.datePosted,
    "hiringOrganization": {
      "@type": "Organization",
      "name": "EXTRA Uitzendbureau",
      "sameAs": "https://www.doehetextra.nl",
      "logo": "https://www.doehetextra.nl/assets/EXTRA_LOGO_BLAUW.png"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": vacature.location,
        "addressRegion": vacature.region,
        "addressCountry": "NL"
      }
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": {
        "@type": "QuantitativeValue",
        "value": vacature.salaryMin,
        "unitText": "HOUR"
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0310] text-white font-sans selection:bg-purple-500/30">
      <script type="application/ld+json">
        {JSON.stringify(jobPostingSchema)}
      </script>
      <PublicNav forceDark={false} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950" />
          <XPatternBg count={3} opacity={0.1} color="rgba(168,85,247,0.5)" />
          
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <nav className="flex mb-8 text-sm text-purple-300/60" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                  <li><ChevronRight className="w-4 h-4" /></li>
                  <li><Link href="/vacatures" className="hover:text-white transition-colors">Vacatures</Link></li>
                  <li><ChevronRight className="w-4 h-4" /></li>
                  <li className="text-white font-medium truncate max-w-[200px] sm:max-w-none">{vacature.title}</li>
                </ol>
              </nav>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="max-w-3xl">
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {vacature.title}
                  </h1>
                  
                  <div className="flex flex-wrap gap-3 mb-8">
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20 px-3 py-1 text-sm font-semibold">
                      <MapPin className="w-3.5 h-3.5 mr-1.5" /> {vacature.location}
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20 px-3 py-1 text-sm font-semibold">
                      <Building2 className="w-3.5 h-3.5 mr-1.5" /> {vacature.client}
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20 px-3 py-1 text-sm font-semibold">
                      <Clock className="w-3.5 h-3.5 mr-1.5" /> {vacature.serviceType}
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20 px-3 py-1 text-sm font-semibold">
                      <Briefcase className="w-3.5 h-3.5 mr-1.5" /> {vacature.workplace}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Link href="/aanmelden">
                      <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-6 rounded-full text-lg shadow-xl shadow-purple-600/20">
                        Solliciteer direct
                      </Button>
                    </Link>
                    <Link href="/vacatures">
                      <Button variant="outline" size="lg" className="bg-white/5 hover:bg-white/10 text-white border-white/20 font-bold px-8 py-6 rounded-full text-lg">
                        Alle vacatures
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 lg:py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-12">
                <RevealSection>
                  <div className="prose prose-invert max-w-none">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      <span className="w-8 h-1 bg-purple-500 rounded-full inline-block"></span>
                      Over deze functie
                    </h2>
                    <p className="text-purple-100/70 text-lg leading-relaxed mb-8">
                      {vacature.fullDescription}
                    </p>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      <span className="w-8 h-1 bg-purple-500 rounded-full inline-block"></span>
                      Wat ga je doen?
                    </h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                      {vacature.responsibilities.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4 text-purple-100/80">
                          <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mt-12 mb-6 flex items-center gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      <span className="w-8 h-1 bg-purple-500 rounded-full inline-block"></span>
                      Wat wij zoeken
                    </h2>
                    <ul className="space-y-4 list-none p-0">
                      {vacature.requirements.map((item, index) => (
                        <li key={index} className="flex items-start gap-4 text-purple-100/80">
                          <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-purple-400 font-bold text-sm">{index + 1}</span>
                          </div>
                          <span className="text-lg">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mt-12 mb-6 flex items-center gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      <span className="w-8 h-1 bg-purple-500 rounded-full inline-block"></span>
                      Wat wij bieden
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {vacature.offer.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 bg-gradient-to-r from-purple-500/10 to-transparent border-l-4 border-purple-500 p-5 rounded-r-xl">
                          <span className="text-lg font-semibold text-white">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealSection>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <RevealSection delay={200}>
                  <div className="sticky top-32 space-y-6">
                    <Card className="bg-white text-gray-900 p-8 rounded-3xl border-none shadow-2xl shadow-purple-950/50">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                        Vacaturedetails
                      </h3>
                      
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Opdrachtgever</p>
                            <p className="font-bold text-gray-800">{vacature.client}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Locatie</p>
                            <p className="font-bold text-gray-800">{vacature.location}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                            <Euro className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Salaris vanaf</p>
                            <p className="font-bold text-gray-800">€{vacature.salaryMin.toFixed(2)} per uur</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gepubliceerd op</p>
                            <p className="font-bold text-gray-800">{new Date(vacature.datePosted).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 space-y-4">
                        <Link href="/aanmelden">
                          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-7 rounded-2xl text-lg group shadow-lg shadow-purple-600/30">
                            Solliciteer direct
                            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </Link>
                        <Link href="/vacatures">
                          <Button variant="ghost" className="w-full text-purple-600 font-bold hover:bg-purple-50 flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Alle vacatures
                          </Button>
                        </Link>
                      </div>
                    </Card>

                    {/* Support Card */}
                    <div className="bg-purple-900/20 border border-purple-500/20 p-8 rounded-3xl">
                      <h4 className="font-bold text-white mb-3">Vragen over deze vacature?</h4>
                      <p className="text-purple-200/60 text-sm mb-6 leading-relaxed">
                        Onze recruiters staan voor je klaar om je alles te vertellen over werken via EXTRA.
                      </p>
                      <Link href="/contact" className="text-purple-400 font-bold text-sm hover:text-purple-300 flex items-center gap-2 transition-colors">
                        Neem contact op <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </RevealSection>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Niet helemaal wat je zoekt?
              </h2>
              <p className="text-xl text-purple-100 mb-10">
                Bekijk onze andere openstaande vacatures of schrijf je in voor onze job alert.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/vacatures">
                  <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-50 font-bold px-8 py-4 rounded-full shadow-2xl">
                    Alle vacatures bekijken
                  </Button>
                </Link>
                <Link href="/aanmelden">
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 font-bold px-8 py-4 rounded-full">
                    Open sollicitatie
                  </Button>
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
