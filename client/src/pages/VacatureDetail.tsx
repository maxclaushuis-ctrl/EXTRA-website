import { useEffect, type ReactNode } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  Calendar,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FaqItem = { q: string; a: string };

/** Zet meta-/link-tags dynamisch; maakt de tag aan als hij nog niet bestaat. */
function setMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

export default function VacatureDetail() {
  const [match, params] = useRoute("/vacatures/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug ?? "";

  const { data: dbVacancy, isLoading } = useQuery<any>({
    queryKey: [`/api/vacatures/${slug}`],
    enabled: !!slug,
    staleTime: 60_000,
    retry: false,
  });

  // FAQ uit het CMS: JSON-string [{"q":"...","a":"..."}]
  let faqs: FaqItem[] = [];
  if (dbVacancy?.faqItems) {
    try {
      const parsed = JSON.parse(dbVacancy.faqItems);
      if (Array.isArray(parsed)) faqs = parsed.filter((f: any) => f?.q && f?.a);
    } catch { /* ongeldig JSON → geen FAQ */ }
  }

  const vacature = dbVacancy
    ? {
        title: dbVacancy.title,
        slug: dbVacancy.slug,
        location: dbVacancy.location,
        region: dbVacancy.region,
        serviceType: dbVacancy.serviceType,
        workplace: dbVacancy.workplace,
        functionType: dbVacancy.functionType,
        client: dbVacancy.client || "EXTRA",
        salaryMin: dbVacancy.salaryMin ? parseFloat(dbVacancy.salaryMin) : null,
        introductionText: dbVacancy.introductionText || "",
        aboutRole: dbVacancy.aboutRole || "",
        workEnvironment: dbVacancy.workEnvironment || "",
        fullDescription: [dbVacancy.introductionText, dbVacancy.aboutRole, dbVacancy.workEnvironment].filter(Boolean).join("\n\n"),
        responsibilities: dbVacancy.responsibilities || [],
        requirements: dbVacancy.requirements || [],
        offer: dbVacancy.offer || [],
        datePosted: dbVacancy.publishedAt || dbVacancy.createdAt,
        metaTitle: dbVacancy.metaTitle || "",
        metaDescription: dbVacancy.metaDescription || dbVacancy.shortDescription || "",
        canonicalUrl: dbVacancy.canonicalUrl || "",
        ogTitle: dbVacancy.ogTitle || "",
        ogDescription: dbVacancy.ogDescription || "",
        ctaText: dbVacancy.ctaText || "",
      }
    : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!isLoading && !vacature && match) {
      setLocation("/vacatures");
    }
  }, [vacature, match, setLocation, isLoading]);

  // SEO: title, description, canonical, Open Graph
  useEffect(() => {
    if (!vacature) return;
    const pageTitle = vacature.metaTitle || `${vacature.title} | Horeca vacature ${vacature.location} | EXTRA`;
    const pageUrl = vacature.canonicalUrl || `https://www.doehetextra.nl/vacatures/${vacature.slug}`;
    document.title = pageTitle;
    setMeta("name", "description", vacature.metaDescription);
    setCanonical(pageUrl);
    setMeta("property", "og:title", vacature.ogTitle || pageTitle);
    setMeta("property", "og:description", vacature.ogDescription || vacature.metaDescription);
    setMeta("property", "og:type", "article");
    setMeta("property", "og:url", pageUrl);
  }, [vacature]);

  if (isLoading) return null;
  if (!vacature) return null;

  // JobPosting- en BreadcrumbList-schema staan sinds P12 server-side in
  // server/seo.ts (jobPostingJsonLd/breadcrumbJsonLd) — die zitten al in de
  // initiële server-response, vóór hydratie. Hier nogmaals genereren zou
  // dezelfde twee JSON-LD-blokken dubbel op de pagina zetten na hydratie.
  // FAQPage staat (nog) niet server-side en blijft daarom hier client-side.
  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  } : null;

  const salarisLabel = vacature.salaryMin
    ? `€${vacature.salaryMin.toFixed(2).replace(".", ",")} all-in per uur`
    : "In overleg";

  const SectionHeading = ({ children }: { children: ReactNode }) => (
    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <span className="w-8 h-1 bg-purple-600 rounded-full inline-block" />
      {children}
    </h2>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-purple-200">
      {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      <PublicNav forceDark={false} />

      <main>
        {/* Hero — paars, zoals de rest van de site; content daaronder wit */}
        <section className="relative pt-32 pb-14 lg:pt-44 lg:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#2a0d5e] to-purple-800" />
          <XPatternBg count={3} opacity={0.08} color="rgba(216,180,254,0.6)" />

          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <nav className="flex mb-8 text-sm text-purple-200/70" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                  <li><ChevronRight className="w-4 h-4" /></li>
                  <li><Link href="/vacatures" className="hover:text-white transition-colors">Vacatures</Link></li>
                  <li><ChevronRight className="w-4 h-4" /></li>
                  <li className="text-white font-medium truncate max-w-[200px] sm:max-w-none" aria-current="page">{vacature.title}</li>
                </ol>
              </nav>

              <div className="max-w-3xl">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {vacature.title}
                </h1>

                <div className="flex flex-wrap gap-3 mb-6">
                  <Badge variant="secondary" className="bg-white/10 text-purple-100 border-white/15 px-3 py-1 text-sm font-semibold">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" /> {vacature.location}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-purple-100 border-white/15 px-3 py-1 text-sm font-semibold">
                    <Building2 className="w-3.5 h-3.5 mr-1.5" /> {vacature.client}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-purple-100 border-white/15 px-3 py-1 text-sm font-semibold">
                    <Clock className="w-3.5 h-3.5 mr-1.5" /> {vacature.serviceType}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-purple-100 border-white/15 px-3 py-1 text-sm font-semibold">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5" /> {vacature.workplace}
                  </Badge>
                </div>

                {/* All-in uurloon prominent in de hero */}
                <div className="inline-flex items-center gap-2 bg-white text-purple-800 font-bold px-5 py-2.5 rounded-full mb-8 shadow-lg">
                  <Euro className="w-4 h-4" />
                  {salarisLabel}
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link href="/aanmelden">
                    <Button size="lg" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-6 rounded-full text-lg shadow-xl shadow-purple-900/40">
                      Solliciteer direct
                    </Button>
                  </Link>
                  <Link href="/vacatures">
                    <Button variant="outline" size="lg" className="bg-white/5 hover:bg-white/15 text-white border-white/25 font-bold px-8 py-6 rounded-full text-lg">
                      Alle vacatures
                    </Button>
                  </Link>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Content — wit */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

              {/* Hoofdcontent */}
              <article className="lg:col-span-2 space-y-14">
                <RevealSection>
                  <SectionHeading>Over deze functie</SectionHeading>
                  <div className="text-gray-600 text-lg leading-relaxed space-y-4">
                    {vacature.fullDescription.split("\n\n").map((par, i) => (
                      <p key={i}>{par}</p>
                    ))}
                  </div>
                </RevealSection>

                {vacature.responsibilities.length > 0 && (
                  <RevealSection>
                    <SectionHeading>Wat ga je doen?</SectionHeading>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                      {vacature.responsibilities.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 bg-purple-50/60 border border-purple-100 rounded-xl p-4 text-gray-700">
                          <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </RevealSection>
                )}

                {vacature.requirements.length > 0 && (
                  <RevealSection>
                    <SectionHeading>Wat wij zoeken</SectionHeading>
                    <ul className="space-y-4 list-none p-0">
                      {vacature.requirements.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-4 text-gray-700">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-purple-700 font-bold text-sm">{index + 1}</span>
                          </div>
                          <span className="text-lg">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </RevealSection>
                )}

                {vacature.offer.length > 0 && (
                  <RevealSection>
                    <SectionHeading>Wat wij bieden</SectionHeading>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {vacature.offer.map((item: string, index: number) => (
                        <div key={index} className="flex items-center gap-4 bg-purple-50/60 border-l-4 border-purple-600 p-5 rounded-r-xl">
                          <span className="text-lg font-semibold text-gray-900">{item}</span>
                        </div>
                      ))}
                    </div>
                  </RevealSection>
                )}

                {faqs.length > 0 && (
                  <RevealSection>
                    <SectionHeading>Veelgestelde vragen</SectionHeading>
                    <div className="space-y-3">
                      {faqs.map((f, i) => (
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
                )}
              </article>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <RevealSection delay={200}>
                  <div className="sticky top-32 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-purple-100 shadow-xl shadow-purple-100/60">
                      <h3 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Vacaturedetails
                      </h3>

                      <div className="space-y-6">
                        {[
                          { icon: Building2, label: "Opdrachtgever", value: vacature.client },
                          { icon: MapPin, label: "Locatie", value: vacature.location },
                          { icon: Euro, label: "All-in uurloon", value: salarisLabel },
                          { icon: Clock, label: "Dienstverband", value: vacature.serviceType },
                          { icon: Calendar, label: "Gepubliceerd op", value: new Date(vacature.datePosted).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                              <p className="font-bold text-gray-800">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-10 space-y-4">
                        <Link href="/aanmelden">
                          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-7 rounded-2xl text-lg group shadow-lg shadow-purple-600/25">
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
                    </div>

                    {/* Support-kaart */}
                    <div className="bg-purple-50 border border-purple-100 p-8 rounded-3xl">
                      <h4 className="font-bold text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Vragen over deze vacature?</h4>
                      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                        Onze recruiters staan voor je klaar om je alles te vertellen over werken via EXTRA.
                      </p>
                      <Link href="/contact" className="text-purple-600 font-bold text-sm hover:text-purple-700 flex items-center gap-2 transition-colors">
                        Neem contact op <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </RevealSection>
              </aside>
            </div>
          </div>
        </section>

        {/* Onderste CTA */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {vacature.ctaText || "Klaar om iets extra's te laten zien?"}
              </h2>
              <p className="text-xl text-purple-100 mb-10">
                Meld je vandaag aan — binnen een paar dagen sta jij op de mooiste locaties van {vacature.location}.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/aanmelden">
                  <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-50 font-bold px-8 py-4 rounded-full shadow-2xl">
                    Solliciteer direct
                  </Button>
                </Link>
                <Link href="/vacatures">
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 font-bold px-8 py-4 rounded-full">
                    Alle vacatures bekijken
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
