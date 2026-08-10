import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import { ArrowRight, Sparkles, ChevronLeft, Phone, Menu, X, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import blogHousekeeping from "../assets/images/blog-housekeeping.webp";
import blogCatering from "../assets/images/blog-catering.webp";
import blogBarista from "../assets/images/blog-barista.webp";
import blogTeam from "../assets/images/blog-team.webp";
import blogHotel from "../assets/images/blog-hotel.webp";

function XPatternBg({ count = 3, opacity = 0.12, color = "rgba(139,92,246,1)" }: { count?: number; opacity?: number; color?: string }) {
  const positions = [
    { left: "5%", top: "10%", size: 200, rotate: 15 },
    { left: "80%", top: "20%", size: 160, rotate: -25 },
    { left: "50%", top: "60%", size: 240, rotate: 35 },
    { left: "15%", top: "75%", size: 180, rotate: -10 },
    { left: "90%", top: "80%", size: 140, rotate: 45 },
    { left: "35%", top: "30%", size: 120, rotate: -30 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {positions.slice(0, count).map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: pos.left, top: pos.top,
            width: pos.size, height: pos.size,
            transform: `rotate(${pos.rotate}deg)`,
            opacity,
            WebkitMaskImage: `url(${xPatroon})`,
            maskImage: `url(${xPatroon})`,
            WebkitMaskSize: "contain", maskSize: "contain",
            WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
            WebkitMaskPosition: "center", maskPosition: "center",
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const allArticles = [
  {
    slug: "vijf-tips-onvergetelijke-gastervaring",
    image: blogHousekeeping,
    category: "Hospitality",
    title: "Vijf tips voor een onvergetelijke gastervaring in je hotel",
    summary: "Van persoonlijke welkomstmomenten tot kleine verrassingen op de kamer. Ontdek hoe tophotels het verschil maken en gasten keer op keer terug laten komen.",
    date: "18 feb 2026",
    readTime: "4 min",
  },
  {
    slug: "perfecte-catering-bedrijfsevent",
    image: blogCatering,
    category: "Events & Catering",
    title: "Hoe plan je de perfecte catering voor een bedrijfsevent?",
    summary: "Een goed doordacht menu en professioneel serviceteam tillen elk evenement naar een hoger niveau. Wij delen de beste praktijktips.",
    date: "12 feb 2026",
    readTime: "5 min",
  },
  {
    slug: "barista-als-visitekaartje",
    image: blogBarista,
    category: "Horeca",
    title: "De barista als visitekaartje: waarom kwaliteit telt",
    summary: "Gasten verwachten meer dan koffie. Een goede barista biedt beleving, snelheid en een glimlach. Zo maak jij het verschil.",
    date: "5 feb 2026",
    readTime: "3 min",
  },
  {
    slug: "medewerker-van-de-maand-priya",
    image: blogTeam,
    category: "EXTRA Nieuws",
    title: "Medewerker van de maand: het verhaal van Priya",
    summary: "Na drie maanden bij EXTRA verdiende Priya haar eerste beloning. Lees hoe het EXTRAATje-systeem haar motiveert om elke dag het beste te geven.",
    date: "28 jan 2026",
    readTime: "4 min",
  },
  {
    slug: "personeelstekort-horeca-2026",
    image: blogHotel,
    category: "Branche",
    title: "Personeelstekort in de horeca: trends en oplossingen voor 2026",
    summary: "De horecasector kampt met structurele tekorten. EXTRA zet in op beloning, begeleiding en flexibiliteit als antwoord op deze uitdaging.",
    date: "20 jan 2026",
    readTime: "6 min",
  },
  {
    slug: "housekeeping-standaarden-verhogen",
    image: blogHousekeeping,
    category: "Housekeeping",
    title: "Housekeeping: zo verhoog je de standaard in jouw hotel",
    summary: "Schone kamers zijn de basis, maar échte gastvrijheid gaat verder. Ontdek de nieuwste trends in housekeeping die het verschil maken.",
    date: "15 jan 2026",
    readTime: "4 min",
  },
];

const categories = ["Alles", "Hospitality", "Events & Catering", "Horeca", "Housekeeping", "EXTRA Nieuws", "Branche"];

const categoryColors: Record<string, string> = {
  "Hospitality": "bg-purple-500/80",
  "Events & Catering": "bg-emerald-500/80",
  "Horeca": "bg-amber-500/80",
  "Housekeeping": "bg-blue-500/80",
  "EXTRA Nieuws": "bg-pink-500/80",
  "Branche": "bg-indigo-500/80",
};

export default function NieuwsPage() {
  const [activeCategory, setActiveCategory] = useState("Alles");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: apiData } = useQuery<{ posts: any[]; total: number }>({
    queryKey: ['/api/blog'],
    staleTime: 60000,
  });

  // Merge DB posts with static articles: DB posts first, then static ones not already in DB
  const dbSlugs = new Set((apiData?.posts ?? []).map((p: any) => p.slug));
  const dbArticles = (apiData?.posts ?? []).map((p: any) => ({
    slug: p.slug,
    image: p.imageUrl || blogHotel,
    category: p.category,
    title: p.title,
    summary: p.excerpt,
    date: new Date(p.publishedAt || p.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }),
    readTime: p.readTime || '5 min',
    fromDb: true,
  }));
  const staticFallbacks = allArticles.filter(a => !dbSlugs.has(a.slug));
  const combined = [...dbArticles, ...staticFallbacks];

  // Collect all categories from both sources
  const allCategories = ["Alles", ...Array.from(new Set(combined.map(a => a.category)))];

  const filtered = activeCategory === "Alles"
    ? combined
    : combined.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0a0310]">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-xl shadow-purple-500/5 border-b border-purple-100/50"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/">
              <img
                src={extraLogoWit}
                alt="EXTRA"
                className={`h-8 sm:h-10 transition-all duration-300 ${scrolled ? "brightness-0" : ""}`}
              />
            </Link>
            <Link
              href="/"
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                scrolled
                  ? "text-purple-700 hover:bg-purple-50"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Terug naar home
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_80%,rgba(124,58,237,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_20%,rgba(99,102,241,0.08),transparent)]" />
        <XPatternBg count={5} opacity={0.08} color="rgba(168,85,247,0.6)" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
                <Sparkles className="w-4 h-4" /> Nieuws & Blogs
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Laatste nieuws uit{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">de branche</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h1>
              <p className="text-base sm:text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed">
                Tips, verhalen en trends uit de horeca- en hotelwereld. Ontdek wat er speelt.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12 sm:mb-16">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 border ${
                    activeCategory === cat
                      ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20"
                      : "bg-white/5 text-purple-200/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {filtered.map((article, i) => (
              <RevealSection key={article.slug} delay={i * 80}>
                <Link href={`/blog/${article.slug}`}>
                  <article
                    className="group relative bg-white/[0.04] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.08] transition-all duration-500 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 focus-within:border-purple-500/30 focus-within:shadow-2xl focus-within:shadow-purple-500/10 cursor-pointer"
                    tabIndex={0}
                  >
                    <div className="relative h-[220px] sm:h-[260px] overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                        <span className={`inline-block text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider px-3 py-1 rounded-full mb-3 ${categoryColors[article.category] || "bg-purple-500/80"}`}>
                          {article.category}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2">
                          {article.title}
                        </h3>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="text-purple-200/60 text-sm sm:text-base leading-relaxed line-clamp-2 mb-4">
                        {article.summary}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300/40 text-xs sm:text-sm">{article.date}</span>
                        <span className="text-purple-300/40 text-xs sm:text-sm">{article.readTime} lezen</span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-purple-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Lees EXTRA <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              </RevealSection>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-purple-200/50 text-lg">Geen artikelen gevonden in deze categorie.</p>
            </div>
          )}

          <RevealSection delay={400}>
            <div className="flex justify-center mt-12 sm:mt-16">
              <Link
                href="/landing#contact"
                className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-base px-8 py-4 rounded-full shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
              >
                Neem contact op
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
