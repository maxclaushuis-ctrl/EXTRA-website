import { useEffect, useRef, useState, useCallback } from "react";
import {
  Users, Gift, Star, ChevronDown, ChevronUp,
  TrendingUp, Shield, Clock, Trophy,
  ArrowRight, Check, Menu, X, Briefcase, UserCheck,
  Award, Handshake, Phone, Sparkles, Heart, Zap,
  Building2, UtensilsCrossed, PartyPopper, Wine, MessageCircle,
  Tag, BookOpen, BarChart3, UserPlus, Search, CalendarCheck, ThumbsUp
} from "lucide-react";
import heroBgImage from "@assets/hero-background.png";
import xPatroon from "@assets/X_patroon_1771260543289.png";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";
import screenDashboard from "@assets/IMG_8803_1770915286475.png";
import screenRewards from "@assets/IMG_8805_1770915286475.png";
import screenChallenges from "@assets/IMG_8807_1770915286475.png";
import screenRanglijst from "@assets/IMG_8808_1770915286475.png";
import logoAmrath from "@assets/Logo_amrath_1771267205959.png";
import logoHilton from "@assets/Logo_Hilton_1771267205959.png";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.png";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.png";
import logoAppel from "@assets/Logo-Appel_1771267205959.png";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.png";
import logoFunda from "@assets/Logo_funda_1771267205959.png";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.png";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.png";
import screenshotGebruikers from "@assets/Gebruikers_1772098047298.png";
import screenshotProfiel from "@assets/Medewerkersprofiel_1772098064753.png";

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

function CountUp({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal();
  const hasDecimal = target % 1 !== 0;
  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(hasDecimal ? parseFloat(start.toFixed(1)) : Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target, duration, hasDecimal]);
  return <span ref={ref}>{hasDecimal ? count.toFixed(1).replace('.', ',') : count.toLocaleString("nl-NL")}{suffix}</span>;
}

function XPatternBg({ className = "", count = 3, opacity = 0.12, color = "rgba(139,92,246,1)" }: { className?: string; count?: number; opacity?: number; color?: string }) {
  const positions = [
    { left: "5%", top: "10%", size: 200, rotate: 15 },
    { left: "80%", top: "20%", size: 160, rotate: -25 },
    { left: "50%", top: "60%", size: 240, rotate: 35 },
    { left: "15%", top: "75%", size: 180, rotate: -10 },
    { left: "90%", top: "80%", size: 140, rotate: 45 },
    { left: "35%", top: "30%", size: 120, rotate: -30 },
  ];
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
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

function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
      }}
    />
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard", desc: "Bekijk je totale punten, status en maandelijkse voortgang.", emoji: "📊" },
  { key: "rewards", img: screenRewards, label: "Rewards", desc: "Wissel punten in voor toffe beloningen.", emoji: "🎁" },
  { key: "challenges", img: screenChallenges, label: "Challenges", desc: "Behaal uitdagingen en verdien extra punten.", emoji: "🏆" },
  { key: "ranglijst", img: screenRanglijst, label: "Ranglijst", desc: "Bekijk je positie op de maandelijkse ranglijst.", emoji: "📈" },
];

export default function PersoneelGezocht() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = "Op zoek naar extra horecapersoneel? | EXTRA Uitzendbureau";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "EXTRA levert snel, betrouwbaar horecapersoneel in loondienst. NEN-4400-1 gecertificeerd. Hotels, restaurants, events en catering. 800+ medewerkers actief.");
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "description";
      newMeta.content = "EXTRA levert snel, betrouwbaar horecapersoneel in loondienst. NEN-4400-1 gecertificeerd. Hotels, restaurants, events en catering. 800+ medewerkers actief.";
      document.head.appendChild(newMeta);
    }
    return () => { document.title = "EXTRA"; };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <GrainOverlay />

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-purple-500/5 border-b border-purple-100/50" : "bg-transparent"}`}
        onMouseLeave={() => {
          dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 200);
        }}
        onMouseEnter={() => {
          if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="/landing" className="flex items-center">
              <img src={extraLogoWit} alt="EXTRA" className={`h-9 sm:h-10 w-auto transition-all ${scrolled ? "brightness-0" : ""}`} />
            </a>
            <div className="hidden lg:flex items-center gap-2">
              {/* Ik zoek personeel */}
              <div
                className="relative"
                onMouseEnter={() => { if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current); setActiveDropdown("personeel"); }}
              >
                <button className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${activeDropdown === "personeel" ? (scrolled ? "text-purple-700 bg-purple-50" : "text-white bg-white/10") : (scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10")}`}>
                  <Briefcase className="w-5 h-5" />
                  Ik zoek extra personeel
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "personeel" ? "rotate-180" : ""}`} />
                </button>
                <div className={`absolute top-full left-0 pt-2 transition-all duration-200 ${activeDropdown === "personeel" ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-100/60 p-2 min-w-[220px]">
                    {[
                      { label: "Hotels", href: "/personeel-gezocht", icon: Building2 },
                      { label: "Eventlocaties", href: "/personeel-gezocht", icon: PartyPopper },
                      { label: "Cateraars", href: "/personeel-gezocht", icon: UtensilsCrossed },
                      { label: "Restaurants", href: "/personeel-gezocht", icon: Wine },
                    ].map((item) => (
                      <a key={item.label} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                          <item.icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-semibold">{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Klantcases */}
              <button
                onClick={() => scrollTo("cases")}
                className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10"}`}
              >
                <Trophy className="w-5 h-5" />
                Klantcases
              </button>

              {/* Over EXTRA */}
              <div
                className="relative"
                onMouseEnter={() => { if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current); setActiveDropdown("over"); }}
              >
                <button className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${activeDropdown === "over" ? (scrolled ? "text-purple-700 bg-purple-50" : "text-white bg-white/10") : (scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10")}`}>
                  <Star className="w-5 h-5" />
                  Over EXTRA
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "over" ? "rotate-180" : ""}`} />
                </button>
                <div className={`absolute top-full left-0 pt-2 transition-all duration-200 ${activeDropdown === "over" ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-100/60 p-2 min-w-[260px]">
                    {[
                      { label: "Onze werkwijze", action: () => scrollTo("werkwijze"), icon: Clock },
                      { label: "Waarom EXTRA", action: () => scrollTo("usp"), icon: Shield },
                      { label: "Ons beloningssysteem", action: () => scrollTo("rewards"), icon: Gift },
                    ].map((item) => (
                      <button key={item.label} onClick={() => { item.action(); setActiveDropdown(null); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all group w-full text-left">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                          <item.icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-semibold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vraag personeel aan CTA */}
              <a
                href="/personeelsaanvraag"
                className="ml-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-[18px] font-bold px-8 py-3.5 rounded-full transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 flex items-center gap-2.5 border border-purple-500/20"
              >
                <UserPlus className="w-[18px] h-[18px]" />
                Vraag personeel aan
              </a>
            </div>
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className={scrolled ? "text-gray-900" : "text-white"} size={28} /> : <Menu className={scrolled ? "text-gray-900" : "text-white"} size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="bg-white border-t border-gray-100 shadow-2xl overflow-y-auto max-h-[80vh]">
            <div className="px-5 py-5 space-y-1">
              {/* Ik zoek personeel */}
              <div>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === "personeel" ? null : "personeel")}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Briefcase className="w-4.5 h-4.5 text-purple-600" />
                    </div>
                    Ik zoek personeel
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileExpanded === "personeel" ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileExpanded === "personeel" ? "max-h-60" : "max-h-0"}`}>
                  <div className="pl-16 pr-4 pb-2 space-y-0.5">
                    {["Hotels", "Eventlocaties", "Cateraars", "Restaurants"].map((item) => (
                      <a key={item} href="/personeel-gezocht" className="block py-2.5 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">{item}</a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Klantcases */}
              <button
                onClick={() => { scrollTo("cases"); setMobileMenuOpen(false); }}
                className="flex items-center w-full px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Trophy className="w-4.5 h-4.5 text-purple-600" />
                  </div>
                  Klantcases
                </span>
              </button>

              {/* Over EXTRA */}
              <div>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === "over" ? null : "over")}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Star className="w-4.5 h-4.5 text-purple-600" />
                    </div>
                    Over EXTRA
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileExpanded === "over" ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileExpanded === "over" ? "max-h-60" : "max-h-0"}`}>
                  <div className="pl-16 pr-4 pb-2 space-y-0.5">
                    <button onClick={() => { scrollTo("werkwijze"); setMobileMenuOpen(false); }} className="block w-full text-left py-2.5 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">Onze werkwijze</button>
                    <button onClick={() => { scrollTo("usp"); setMobileMenuOpen(false); }} className="block w-full text-left py-2.5 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">Waarom EXTRA</button>
                    <button onClick={() => { scrollTo("rewards"); setMobileMenuOpen(false); }} className="block w-full text-left py-2.5 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">Ons beloningssysteem</button>
                  </div>
                </div>
              </div>

              {/* Vraag personeel aan CTA */}
              <div className="pt-3 px-2">
                <a
                  href="/personeelsaanvraag"
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-base py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/20"
                >
                  <UserPlus className="w-5 h-5" />
                  Vraag personeel aan
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 1. HERO                                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBgImage} alt="" className="absolute inset-0 w-full h-full object-cover object-right sm:object-center" style={{ filter: "contrast(1.03) saturate(1.02)" }} loading="eager" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(88,22,164,0.92) 0%, rgba(88,22,164,0.88) 40%, rgba(88,22,164,0.70) 65%, rgba(88,22,164,0.35) 82%, rgba(88,22,164,0.10) 100%)` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
        </div>
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.9)" className="z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">800+ medewerkers actief</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">60+ tevreden opdrachtgevers</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-[1.12] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Op zoek naar extra horecapersoneel?{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
              {" "}regelt het — snel, betrouwbaar en volledig in loondienst.
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-purple-100/90 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              Van hotels tot restaurants, events en cateraars: wij leveren representatieve medewerkers die écht bij jouw locatie passen — zorgvuldig geselecteerd, hoog beoordeeld en gemotiveerd door ons EXTRAATje beloningssysteem.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Vraag EXTRA personeel aan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/30 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                <Phone className="w-5 h-5" />
                Direct contact
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 2. USP — WAAROM EXTRA                              */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="usp" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Shield className="w-4 h-4" /> Waarom EXTRA
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waarom opdrachtgevers voor EXTRA kiezen
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Shield, title: "Iedereen in loondienst", desc: "NEN-4400-1 gecertificeerd en volledig volgens arbeidswetgeving 2026. Geen zzp-constructies.", emoji: "🛡️" },
              { icon: Users, title: "We kennen iedereen persoonlijk", desc: "Iedere medewerker komt eerst bij ons op gesprek op kantoor. Geen anonieme uitzendkrachten.", emoji: "🤝" },
              { icon: Star, title: "Selectie op soft & hard skills", desc: "Strenge screening op vakkennis, houding, representativiteit en beoordelingshistorie.", emoji: "⭐" },
              { icon: Gift, title: "EXTRAATje beloningssysteem", desc: "Hogere motivatie, minder no-shows en vaste teams. Medewerkers die graag terugkomen.", emoji: "🎁" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-8 border border-purple-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm">
                  <div className="text-3xl sm:text-4xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">{item.emoji}</div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={400}>
            <div className="text-center mt-8 sm:mt-12">
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full border border-green-200">
                <Shield className="w-4 h-4" />
                Volledig compliant met arbeidswetgeving 2026
              </span>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 3. KWALITEITSMETING                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 lg:py-36 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-18">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Kwaliteitsgarantie
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-5 sm:mb-7" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Altijd de beste mensen dankzij<br className="hidden sm:block" /> continue kwaliteitsmeting
              </h2>
              <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Bij EXTRA meten we elke dienst, elke prestatie en elke medewerker met ons eigen systeem. Niet één keer per maand, maar continu — zodat jij alleen medewerkers krijgt die bewezen goed presteren.
              </p>
            </div>
          </RevealSection>

          {/* Checklijst */}
          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-14 sm:mb-20 max-w-4xl mx-auto">
              {[
                { text: "Soft skills & hard skills real-time gemeten" },
                { text: "Scores per dienst opgeslagen in de database" },
                { text: "Complimenten, no-shows en klachten direct inzichtelijk" },
                { text: "Vaste poule van toppers voor elke klant" },
                { text: "Kwaliteitsdalingen signaleren we direct" },
                { text: "Alle sollicitaties vinden persoonlijk op kantoor plaats" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-gradient-to-br from-purple-50 to-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-sm">
                  <div className="mt-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-gray-800 leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
          </RevealSection>

          {/* Twee dashboard screenshots */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            <RevealSection delay={150}>
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-2xl sm:rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 sm:px-6 py-3 sm:py-4 border-b border-purple-100/60">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-xs sm:text-sm font-bold text-purple-800 uppercase tracking-wide">Medewerkers overzicht</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Real-time data van alle medewerkers in één oogopslag</p>
                  </div>
                  <img
                    src={screenshotGebruikers}
                    alt="Dashboard medewerkers overzicht met ratings en statistieken"
                    className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">We sturen op feiten, niet op gevoel</p>
                </div>
              </div>
            </RevealSection>

            <RevealSection delay={250}>
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-green-200 to-emerald-200 rounded-2xl sm:rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 sm:px-6 py-3 sm:py-4 border-b border-green-100/60">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-green-600" />
                      <span className="text-xs sm:text-sm font-bold text-green-800 uppercase tracking-wide">Individueel medewerkersprofiel</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Scores, complimenten, no-shows en diensthistorie per persoon</p>
                  </div>
                  <img
                    src={screenshotProfiel}
                    alt="Individueel medewerkersprofiel met beoordelingen en statistieken"
                    className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Zo selecteren we op bewezen kwaliteit</p>
                </div>
              </div>
            </RevealSection>
          </div>

          {/* Bottom quote */}
          <RevealSection delay={300}>
            <div className="mt-14 sm:mt-20 text-center">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl shadow-lg shadow-purple-900/20">
                <TrendingUp className="w-5 h-5 text-purple-300 flex-shrink-0" />
                <p className="text-sm sm:text-base font-semibold leading-snug">
                  Met deze data weet je precies wie betrouwbaar is, wie groeit en wie structureel sterker presteert.<br className="hidden sm:block" />
                  <span className="text-purple-300"> Zo schaal je op zonder in te leveren op kwaliteit.</span>
                </p>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 4. LOGO'S OPDRACHTGEVERS                           */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Vertrouwd door toonaangevende hotels, restaurants en eventlocaties</p>
          </RevealSection>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee-pg group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                  {[
                    { src: logoMarriott, alt: "Marriott" },
                    { src: logoHilton, alt: "Hilton" },
                    { src: logoHartMuseum, alt: "Scheepvaartmuseum" },
                    { src: logoSelectCatering, alt: "Select Catering" },
                    { src: logoAppel, alt: "Appèl" },
                    { src: logoAmrath, alt: "Amrâth Hotels" },
                    { src: logoFcUtrecht, alt: "FC Utrecht" },
                    { src: logoFunda, alt: "Funda" },
                    { src: logoHetePeper, alt: "Hete Peper" },
                  ].map((logo) => (
                    <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
                      <img src={logo.src} alt={logo.alt} className="h-16 sm:h-20 lg:h-24 w-auto object-contain" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes marquee-pg { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee-pg { animation: marquee-pg 40s linear infinite; }
        `}</style>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 4. BRANCHES                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="branches" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Briefcase className="w-4 h-4" /> Branches
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waar heb je extra personeel voor nodig?
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-8">
            {[
              { icon: Building2, title: "Hotels", desc: "Housekeeping, banqueting, front office, keuken — flexibel op- en afschalen.", color: "from-purple-600 to-purple-800", border: "border-purple-100", link: "/personeel-gezocht/hotels" },
              { icon: PartyPopper, title: "Eventlocaties", desc: "Grote en kleine events met representatief personeel. Van 5 tot 60+ medewerkers.", color: "from-pink-500 to-purple-600", border: "border-pink-100", link: "/personeel-gezocht/evenementenlocaties" },
              { icon: UtensilsCrossed, title: "Cateraars", desc: "Chefs, bediening en keukenmedewerkers voor catering op locatie.", color: "from-indigo-500 to-purple-600", border: "border-indigo-100", link: "/personeel-gezocht/cateraars" },
              { icon: Wine, title: "Restaurants", desc: "Runners, bar, bediening, chefs en afwas — wanneer je ze nodig hebt.", color: "from-blue-500 to-indigo-600", border: "border-blue-100", link: "/personeel-gezocht/restaurants" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <a href={item.link} className={`group block relative bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-[2rem] shadow-lg shadow-purple-500/5 border-2 ${item.border} p-7 sm:p-10 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-2 transition-all duration-400 h-full overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-28 sm:w-40 h-28 sm:h-40 bg-gradient-to-bl from-purple-50 to-transparent rounded-bl-[100%] opacity-60" />
                  <div className="relative">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3 sm:mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>{item.title}</h3>
                    <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-6">{item.desc}</p>
                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-sm group-hover:gap-4 transition-all">
                      Bekijk mogelijkheden <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </a>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 5. WERKWIJZE                                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="werkwijze" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={5} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                <Zap className="w-4 h-4" /> Hoe EXTRA werkt
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                In 4 stappen naar jouw{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">droomteam</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { step: "1", icon: Search, title: "Vertel wat je zoekt", desc: "Welke functies, wanneer en hoeveel medewerkers heb je nodig?" },
              { step: "2", icon: UserCheck, title: "Wij selecteren de juiste mensen", desc: "Op basis van ervaring, skills, beoordelingen, tags en favorietenpoule." },
              { step: "3", icon: CalendarCheck, title: "Onze planner zet je team klaar", desc: "Een op maat samengesteld team, ingeroosterd en klaar om te starten." },
              { step: "4", icon: TrendingUp, title: "Evalueren & poule opbouwen", desc: "Na elke opdracht feedback. Samen bouwen aan een vaste, betrouwbare poule." },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-white/[0.06] backdrop-blur-sm rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-8 border border-white/[0.08] hover:border-purple-400/30 hover:bg-white/[0.10] hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 h-full text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4 sm:mb-5 mx-auto group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-black text-purple-400 uppercase tracking-widest mb-2 sm:mb-3">Stap {item.step}</div>
                  <h3 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-purple-200/70 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 6. EXTRAATJE                                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="rewards" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.1} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/70 px-4 sm:px-5 py-2 rounded-full">
                <Gift className="w-4 h-4" /> EXTRAATje
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Betere motivatie ={" "}
                <span className="relative inline-block">
                  <span className="relative z-10">beter personeel</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Ons unieke beloningssysteem zorgt voor gemotiveerde medewerkers die graag terugkomen op jouw locatie.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Werk & verdien punten", desc: "Elke shift levert punten op. Extra inzet? Extra punten.", icon: "🏃" },
                { step: "2", title: "Klim in status", desc: "Van Bronze naar Diamond. Hogere status = betere beloningen.", icon: "💎" },
                { step: "3", title: "Claim je rewards", desc: "AirPods, TrainMore, Starbucks en meer. Medewerkers kiezen zelf.", icon: "🎁" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 text-center hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 shadow-sm">
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">{item.icon}</div>
                  <div className="text-[10px] sm:text-xs font-black text-purple-500 uppercase tracking-widest mb-2 sm:mb-3">Stap {item.step}</div>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{item.title}</h4>
                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 max-w-5xl mx-auto">
              <div className="relative flex-shrink-0">
                <div className="relative w-[220px] sm:w-[280px]">
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-500/20 border-[5px] border-gray-700 bg-gray-900">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[20px] bg-gray-900 rounded-b-xl z-20" />
                    <div className="relative">
                      {appScreens.map((screen, i) => (
                        <img key={screen.key} src={screen.img} alt={screen.label} className={`w-full transition-opacity duration-500 ${activeScreen === i ? "opacity-100 relative" : "opacity-0 absolute inset-0"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-[3rem] blur-3xl -z-10" />
                </div>
                <div className="flex gap-2 mt-4 justify-center">
                  {appScreens.map((_, i) => (
                    <button key={i} onClick={() => setActiveScreen(i)} className={`h-2.5 rounded-full transition-all duration-300 ${activeScreen === i ? "bg-purple-500 w-10" : "bg-purple-200 w-2.5 hover:bg-purple-300"}`} />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Wat jij als opdrachtgever merkt</h3>
                <ul className="space-y-4">
                  {[
                    { icon: TrendingUp, text: "Hogere motivatie — medewerkers willen punten verdienen" },
                    { icon: Check, text: "Minder uitval — betrouwbare medewerkers die komen opdagen" },
                    { icon: Users, text: "Meer continuïteit — vaste teams die je locatie kennen" },
                    { icon: Heart, text: "Medewerkers die graag terugkomen naar jouw locatie" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-purple-700" />
                      </div>
                      <span className="text-gray-700 font-medium text-sm sm:text-base">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 7. DATA & MATCHING                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="matching" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Data & Matching
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                We weten precies wie we uitzenden
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-3 sm:mt-4 max-w-xl mx-auto">Geen verrassingen. Data-gedreven matching voor de beste resultaten.</p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Tag, title: "Tags & profielen", desc: "Topper, Chef ervaren, Bar expert, Representatief — elke medewerker is getagd.", emoji: "🏷️" },
              { icon: Heart, title: "Favorietenpoule", desc: "Vaste teams per locatie. Medewerkers die je locatie kennen en waar je op kunt bouwen.", emoji: "⭐" },
              { icon: Star, title: "Beoordelingen", desc: "Na elke dienst een ster-score. Alleen de best beoordeelde medewerkers komen terug.", emoji: "📊" },
              { icon: BookOpen, title: "Skill-profielen", desc: "Hard skills én soft skills uitgesplitst. Vakkennis, houding, flexibiliteit en meer.", emoji: "📋" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 sm:p-8 border border-purple-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm text-center">
                  <div className="text-3xl sm:text-4xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">{item.emoji}</div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 8. KLANTCASES                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="cases" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/50 px-4 sm:px-5 py-2 rounded-full">
                <MessageCircle className="w-4 h-4" /> Klantcases
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hoe andere opdrachtgevers EXTRA ervaren
              </h2>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                company: "Marriott Hotel",
                quote: "EXTRA levert consistent hoogwaardig personeel voor onze housekeeping en banqueting. De vaste poule kent ons huis en dat merk je aan de kwaliteit.",
                name: "Mark de Vries",
                role: "F&B Manager",
                results: ["Vaste housekeeping poule opgebouwd", "30% minder uitval bij banqueting"]
              },
              {
                company: "Scheepvaartmuseum",
                quote: "Voor onze grote events hebben we soms 30 tot 60 medewerkers nodig. EXTRA levert altijd — representatief, op tijd en goed geïnstrueerd.",
                name: "Lisa Jansen",
                role: "Event Manager",
                results: ["Events tot 60 medewerkers gefaciliteerd", "Dezelfde vaste gezichten bij elk event"]
              },
              {
                company: "Maison van den Boer",
                quote: "De combinatie van ervaren chefs en professionele bediening maakt het verschil. Het beloningssysteem zorgt voor gemotiveerd personeel.",
                name: "Sophie van Dijk",
                role: "Operations Manager",
                results: ["Ervaren chefs beschikbaar op korte termijn", "Hogere medewerkertevredenheid"]
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 h-full shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-purple-500" />
                    <span className="font-bold text-purple-700 text-sm">{item.company}</span>
                  </div>
                  <p className="text-gray-600 italic text-sm sm:text-base leading-relaxed mb-6 flex-1">"{item.quote}"</p>
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-gray-400 text-xs">{item.role}</p>
                  </div>
                  <div className="space-y-2">
                    {item.results.map((r, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 9. FAQ                                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="faq" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-gray-50">
        <XPatternBg count={2} opacity={0.06} color="rgba(139,92,246,1)" />
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <MessageCircle className="w-4 h-4" /> FAQ
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Veelgestelde vragen
              </h2>
            </div>
          </RevealSection>
          <div className="space-y-3 sm:space-y-4">
            {[
              { q: "Hoe snel kunnen jullie leveren?", a: "Afhankelijk van locatie en moment. We kunnen vaak snel schakelen — soms dezelfde week. Bij grote events plannen we ruim vooruit om een perfect team samen te stellen." },
              { q: "Werken jullie alleen met loondienst?", a: "Ja, iedereen werkt via ons in loondienst. Wij regelen loon, belasting, verzekeringen en zijn NEN-4400-1 gecertificeerd. Volledig compliant met de arbeidswetgeving van 2026." },
              { q: "Hoe werkt de selectie?", a: "Iedere medewerker komt eerst op gesprek op kantoor. We beoordelen op vakkennis, houding, representativiteit en soft skills. Na elke opdracht volgt een beoordeling door de opdrachtgever." },
              { q: "Kan ik vaste medewerkers aanvragen?", a: "Absoluut. We bouwen per locatie een favorietenpoule op. Medewerkers die goed presteren bij jou, worden prioritair ingepland. Zo krijg je een vast, betrouwbaar team." },
              { q: "Hoe zit het met no-shows?", a: "Ons EXTRAATje beloningssysteem zorgt voor hoge motivatie en betrouwbaarheid. Medewerkers verdienen punten per dienst en worden beloond voor consistentie. Het resultaat: significant minder uitval." },
            ].map((faq, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-gray-100 hover:border-purple-200 transition-all duration-300 overflow-hidden shadow-sm">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 sm:p-7 text-left">
                    <span className="text-base sm:text-lg font-bold text-gray-900 pr-4">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-purple-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 pb-5 sm:pb-7" : "max-h-0"}`}>
                    <p className="px-5 sm:px-7 text-sm sm:text-base text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 10. FINAL CTA                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="cta" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om extra personeel{" "}
              <span className="relative inline-block">
                <span className="relative z-10">in te zetten?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Vertel ons wat je nodig hebt. Wij selecteren de juiste mensen en zetten snel een team voor je klaar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center">
              <a
                href="/personeelsaanvraag"
                className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3"
                style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
              >
                Vraag EXTRA personeel aan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3">
                <Phone className="w-5 h-5" />
                Plan een gesprek op kantoor
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-14">
            <div className="col-span-2 md:col-span-1">
              <a href="/landing" className="flex items-center mb-4 sm:mb-5">
                <img src={extraLogoWit} alt="EXTRA" className="h-6 sm:h-7 w-auto" />
              </a>
              <p className="text-sm sm:text-base leading-relaxed">
                Uitzendbureau voor horeca, hotels en evenementen. Met ons unieke EXTRAATje beloningssysteem.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Werkgevers</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li><button onClick={() => scrollTo("cta")} className="hover:text-purple-400 transition-colors">Vraag EXTRA personeel aan</button></li>
                <li><button onClick={() => scrollTo("werkwijze")} className="hover:text-purple-400 transition-colors">Hoe het werkt</button></li>
                <li><button onClick={() => scrollTo("usp")} className="hover:text-purple-400 transition-colors">Waarom EXTRA</button></li>
                <li><button onClick={() => scrollTo("cases")} className="hover:text-purple-400 transition-colors">Klantcases</button></li>
                <li><a href="/landing" className="hover:text-purple-400 transition-colors">Homepage</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Werkzoekenden</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li><a href="/aanmelden" className="hover:text-purple-400 transition-colors">Solliciteren</a></li>
                <li><button onClick={() => scrollTo("rewards")} className="hover:text-purple-400 transition-colors">EXTRAATje Rewards</button></li>
                <li><a href="/landing" className="hover:text-purple-400 transition-colors">Over EXTRA</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Contact</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li>info@doehetextra.nl</li>
                <li>Amsterdam, Nederland</li>
                <li className="pt-2">
                  <a href="https://instagram.com/doehetextra" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
                    Instagram @doehetextra
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; 2026 EXTRA Uitzendbureau. Alle rechten voorbehouden.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full border border-purple-800/30">NEN 4400-1</span>
            </div>
          </div>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Hoe snel kunnen jullie leveren?", "acceptedAnswer": { "@type": "Answer", "text": "Afhankelijk van locatie en moment. We kunnen vaak snel schakelen — soms dezelfde week." } },
          { "@type": "Question", "name": "Werken jullie alleen met loondienst?", "acceptedAnswer": { "@type": "Answer", "text": "Ja, iedereen werkt via ons in loondienst. NEN-4400-1 gecertificeerd." } },
          { "@type": "Question", "name": "Hoe werkt de selectie?", "acceptedAnswer": { "@type": "Answer", "text": "Iedere medewerker komt eerst op gesprek op kantoor. We beoordelen op vakkennis, houding en soft skills." } },
          { "@type": "Question", "name": "Kan ik vaste medewerkers aanvragen?", "acceptedAnswer": { "@type": "Answer", "text": "Ja, we bouwen per locatie een favorietenpoule op met vaste, betrouwbare medewerkers." } },
          { "@type": "Question", "name": "Hoe zit het met no-shows?", "acceptedAnswer": { "@type": "Answer", "text": "Ons EXTRAATje beloningssysteem zorgt voor hoge motivatie en significant minder uitval." } },
        ]
      }) }} />
    </div>
  );
}
