import { useEffect, useRef, useState, useCallback } from "react";
import {
  Users, Trophy, Gift, Star, ChevronDown, ChevronUp,
  TrendingUp, Shield, Clock,
  ArrowRight, Check, Menu, X, Briefcase, UserCheck, CreditCard,
  Award, Handshake, Phone, Sparkles, Heart, Zap,
  Building2, UtensilsCrossed, PartyPopper, Wine, MessageCircle
} from "lucide-react";
import heroBgImage from "@assets/hero-background.png";
import xPatroon from "@assets/X_patroon_1771260543289.png";
import screenDashboard from "@assets/IMG_8803_1770915286475.png";
import screenRewards from "@assets/IMG_8805_1770915286475.png";
import screenChallenges from "@assets/IMG_8807_1770915286475.png";
import screenRanglijst from "@assets/IMG_8808_1770915286475.png";
import logoAmrath from "@assets/Logo_amrath_1771267205959.png";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.png";
import logoFunda from "@assets/Logo_funda_1771267205959.png";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.png";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.png";
import logoHilton from "@assets/Logo_Hilton_1771267205959.png";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.png";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.png";
import logoAppel from "@assets/Logo-Appel_1771267205959.png";

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
      else { setCount(hasDecimal ? Math.round(start * 10) / 10 : Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target, duration, hasDecimal]);
  return <span ref={ref}>{hasDecimal ? count.toFixed(1).replace('.', ',') : count.toLocaleString("nl-NL")}{suffix}</span>;
}

function XPatternBg({ className = "", count = 3, opacity = 0.06 }: { className?: string; count?: number; opacity?: number }) {
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
            backgroundColor: "rgba(139,92,246,0.9)",
          }}
        />
      ))}
    </div>
  );
}

function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
        opacity: 0.4,
        mixBlendMode: "overlay",
      }}
    />
  );
}

function XDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-16 sm:h-24 flex items-center justify-center overflow-hidden ${className}`}>
      <div className="flex items-center gap-4 sm:gap-8">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              width: i === 3 ? 40 : 24,
              height: i === 3 ? 40 : 24,
              opacity: i === 3 ? 0.3 : 0.12,
              WebkitMaskImage: `url(${xPatroon})`,
              maskImage: `url(${xPatroon})`,
              WebkitMaskSize: "contain", maskSize: "contain",
              WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
              WebkitMaskPosition: "center", maskPosition: "center",
              backgroundColor: "rgba(168,85,247,0.9)",
              animationDelay: `${i * 200}ms`,
              animationDuration: "3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard", desc: "Bekijk je totale punten, status en maandelijkse voortgang in één overzicht.", emoji: "📊" },
  { key: "rewards", img: screenRewards, label: "Rewards", desc: "Wissel je punten in voor toffe beloningen zoals AirPods, museumjaarkaarten en meer.", emoji: "🎁" },
  { key: "challenges", img: screenChallenges, label: "Challenges", desc: "Behaal uitdagingen en verdien extra punten met elke mijlpaal.", emoji: "🏆" },
  { key: "ranglijst", img: screenRanglijst, label: "Ranglijst", desc: "Bekijk je positie op de maandelijkse ranglijst en versla je collega's.", emoji: "📈" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);
  const [howItWorksTab, setHowItWorksTab] = useState<"werkgever" | "medewerker">("werkgever");
  const [testimonialTab, setTestimonialTab] = useState<"werkgever" | "medewerker">("werkgever");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  }, []);

  const werkgeverTestimonials = [
    { quote: "EXTRA levert keer op keer betrouwbaar en goed getraind personeel. De communicatie is snel en helder.", name: "Mark de Vries", role: "F&B Manager, Grand Hotel" },
    { quote: "Binnen 24 uur hadden we personeel voor ons evenement. Professioneel en representatief. Aanrader.", name: "Lisa Jansen", role: "Event Manager, Venues Amsterdam" },
    { quote: "Eindelijk een uitzendbureau dat begrijpt wat hospitality écht betekent. De kwaliteit is constant hoog.", name: "Sophie van Dijk", role: "Operations Manager, Amrâth Hotels" },
  ];
  const medewerkerTestimonials = [
    { quote: "Het puntensysteem maakt werken echt leuker. Ik heb al AirPods en een TrainMore korting verdiend!", name: "Jamal El Amrani", role: "Medewerker sinds 2024" },
    { quote: "Fijn dat je zelf diensten kunt kiezen. Goede begeleiding en altijd snel betaald.", name: "Nina Bakker", role: "Studente & EXTRA medewerker" },
    { quote: "Na mijn gesprek kon ik direct aan de slag. Leuke events, goed team en eerlijk werk.", name: "Daan Vermeer", role: "Medewerker sinds 2025" },
  ];

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <GrainOverlay />

      {/* ── NAVIGATION ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-purple-500/5 border-b border-purple-100/50" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-lg">E</span>
              </div>
              <span className={`font-black text-2xl tracking-tight transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>EXTRA</span>
            </div>
            <div className="hidden lg:flex items-center gap-8">
              {[
                ["Sectoren", "sectors"],
                ["Hoe het werkt", "how-it-works"],
                ["Waarom extra", "differentiators"],
                ["EXTRAATje", "rewards"],
              ].map(([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)} className={`text-sm font-semibold transition-colors relative group ${scrolled ? "text-gray-600 hover:text-purple-600" : "text-white/80 hover:text-white"}`}>
                  {label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300" />
                </button>
              ))}
              <button onClick={() => scrollTo("final-cta")} className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5">
                Contact
              </button>
            </div>
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className={scrolled ? "text-gray-900" : "text-white"} /> : <Menu className={scrolled ? "text-gray-900" : "text-white"} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-6 py-4 space-y-3">
              {[["Sectoren","sectors"],["Hoe het werkt","how-it-works"],["Waarom extra","differentiators"],["EXTRAATje","rewards"],["Contact","final-cta"]].map(([label,id]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-gray-700 font-semibold py-2 hover:text-purple-600">{label}</button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════════ */}
      {/* 1. HERO — THE MOST IMPORTANT 40%                */}
      {/* ════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-right sm:object-center"
            style={{ filter: "brightness(0.6) contrast(1.1) saturate(1.05)" }}
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(105deg,
                rgba(55,10,110,0.95) 0%,
                rgba(70,15,130,0.92) 35%,
                rgba(88,22,164,0.78) 55%,
                rgba(88,22,164,0.45) 75%,
                rgba(88,22,164,0.15) 100%
              )`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-purple-950/20" />
        </div>

        <XPatternBg count={4} opacity={0.08} className="z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-32 sm:pb-28">
          <div className="max-w-2xl">
            <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl sm:rounded-[2rem] border border-white/[0.12] p-7 sm:p-10 lg:p-12 shadow-2xl shadow-black/20">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 sm:mb-8 border border-white/15">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">800+ medewerkers actief</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-[1.08] mb-5 sm:mb-7" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
                Horecapersoneel nodig?{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">extra</span>
                  <span className="absolute bottom-0 sm:bottom-0.5 left-0 right-0 h-2 sm:h-3.5 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
                </span>
                {" "}regelt het.
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-purple-100/85 max-w-md mb-7 sm:mb-8 leading-relaxed font-medium">
                Flexibel en representatief personeel voor hotels, catering, events en restaurants. Snel geregeld.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-6 mb-7 sm:mb-8">
                {[
                  { icon: Check, text: "Iedereen in loondienst" },
                  { icon: Star, text: "Geselecteerd & beoordeeld" },
                  { icon: CreditCard, text: "Dagbetaling mogelijk" },
                ].map((usp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                      <usp.icon className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-white/85 text-sm font-medium">{usp.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => scrollTo("final-cta")}
                  className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-white/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                  style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
                >
                  Ik zoek extra personeel
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="/sollicitatieformulier"
                  className="group border-2 border-white/25 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Ik zoek extra werk
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 2. STATS STRIP — SOCIAL PROOF                   */}
      {/* ════════════════════════════════════════════════ */}
      <section className="relative z-20 -mt-16 sm:-mt-20 pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-500/15 border border-purple-100/50 p-5 sm:p-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-10">
              {[
                { value: 800, suffix: "+", label: "Actieve medewerkers", icon: Users, color: "text-purple-500" },
                { value: 60, suffix: "+", label: "Tevreden opdrachtgevers", icon: Heart, color: "text-pink-500" },
                { value: 100, suffix: "k+", label: "Punten verdiend", icon: Sparkles, color: "text-yellow-500" },
                { value: 4.8, suffix: "/5", label: "Sterrenscore", icon: Star, color: "text-yellow-500" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color} mx-auto mb-2 sm:mb-3`} />
                  <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs sm:text-sm text-gray-400 mt-5 sm:mt-6 font-medium">
              Actief in hotels, catering, events en restaurants.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 3. SECTOREN — DARK PURPLE                       */}
      {/* ════════════════════════════════════════════════ */}
      <section id="sectors" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden mt-12 sm:mt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={5} opacity={0.06} />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                <Briefcase className="w-4 h-4" /> Onze sectoren
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Extra personeel per sector
              </h2>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Building2, title: "Hotels", color: "from-purple-500 to-purple-700", chips: ["Housekeeping", "Banqueting", "Front office", "Keuken"] },
              { icon: UtensilsCrossed, title: "Catering", color: "from-indigo-500 to-purple-600", chips: ["Chefs", "Horecamedewerkers", "Host/hostessen"] },
              { icon: PartyPopper, title: "Events", color: "from-pink-500 to-purple-600", chips: ["Chefs", "Horecamedewerkers", "Host/hostessen"] },
              { icon: Wine, title: "Restaurants", color: "from-blue-500 to-indigo-600", chips: ["Runners", "Bar", "Bediening", "Chefs", "Afwas"] },
            ].map((sector, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-white/[0.06] backdrop-blur-sm rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-8 border border-white/[0.08] hover:border-purple-400/30 hover:bg-white/[0.10] hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 h-full flex flex-col">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${sector.color} flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <sector.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mb-3 sm:mb-4">{sector.title}</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 flex-1">
                    {sector.chips.map((chip, j) => (
                      <span key={j} className="text-xs sm:text-sm bg-white/10 text-purple-200 px-3 py-1 sm:py-1.5 rounded-full border border-white/10 font-medium">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-purple-300 font-bold text-sm group-hover:gap-3 group-hover:text-white transition-all">
                    Bekijk functies <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 4. HOE EXTRA WERKT — WARM OFF-WHITE             */}
      {/* ════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.03} />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Zap className="w-4 h-4" /> Simpel & snel
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hoe extra werkt
              </h2>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
              {(["werkgever", "medewerker"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHowItWorksTab(tab)}
                  className={`px-5 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all duration-300 ${
                    howItWorksTab === tab
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-500/25 scale-105"
                      : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200"
                  }`}
                >
                  {tab === "werkgever" ? "Voor werkgevers" : "Voor medewerkers"}
                </button>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            {(() => {
              const steps = howItWorksTab === "werkgever" ? [
                { icon: Phone, step: "1", title: "Neem contact op", desc: "Bel of stuur je aanvraag. Wij schakelen snel.", color: "from-purple-500 to-purple-700" },
                { icon: UserCheck, step: "2", title: "Wij selecteren", desc: "Passend en beoordeeld personeel uit onze pool.", color: "from-indigo-500 to-purple-600" },
                { icon: Clock, step: "3", title: "Planning & inzet", desc: "Op tijd geregeld. Ook last-minute als het moet.", color: "from-blue-500 to-indigo-600" },
                { icon: TrendingUp, step: "4", title: "Evaluatie", desc: "Beoordeel en bouw een vaste poule op.", color: "from-emerald-500 to-teal-600" },
              ] : [
                { icon: UserCheck, step: "1", title: "Meld je aan", desc: "Schrijf je in via het formulier.", color: "from-purple-500 to-purple-700" },
                { icon: MessageCircle, step: "2", title: "Kom op gesprek", desc: "We maken kennis en checken wat bij je past.", color: "from-violet-500 to-purple-600" },
                { icon: Briefcase, step: "3", title: "Kies je diensten", desc: "Bekijk en claim shifts in de app.", color: "from-indigo-500 to-purple-600" },
                { icon: CreditCard, step: "4", title: "Werk & verdien", desc: "Direct uitbetaald, plus punten.", color: "from-blue-500 to-indigo-600" },
                { icon: Gift, step: "5", title: "Claim rewards", desc: "Wissel punten in voor echte beloningen.", color: "from-emerald-500 to-teal-600" },
              ];
              return (
                <div className={`grid grid-cols-2 ${howItWorksTab === "werkgever" ? "lg:grid-cols-4" : "lg:grid-cols-5"} gap-4 sm:gap-6`}>
                  {steps.map((item, i) => (
                    <div key={`${howItWorksTab}-${i}`} className="relative group">
                      {i < steps.length - 1 && <div className="hidden lg:block absolute top-10 left-[calc(100%+0.5rem)] w-[calc(100%-3rem)] h-0.5 bg-gradient-to-r from-purple-200 to-transparent z-0" />}
                      <div className="relative bg-white rounded-2xl sm:rounded-[1.5rem] p-5 sm:p-8 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                          <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div className="text-[10px] sm:text-xs font-black text-purple-400 uppercase tracking-widest mb-2 sm:mb-3">Stap {item.step}</div>
                        <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">{item.title}</h4>
                        <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 5. WAAROM EXTRA — LILA GRADIENT                 */}
      {/* ════════════════════════════════════════════════ */}
      <section id="differentiators" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.04} />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/70 px-4 sm:px-5 py-2 rounded-full">
                <Shield className="w-4 h-4" /> Wetgeving-proof
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waarom extra
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-3 sm:mt-4 max-w-xl mx-auto">
                Klaar voor de nieuwe arbeidswetgeving van 2026. Zekerheid voor jou en je personeel.
              </p>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { icon: Shield, title: "Iedereen in loondienst", desc: "Geen zzp-constructies. Duidelijke afspraken.", emoji: "🛡️" },
              { icon: Award, title: "Geselecteerd & beoordeeld", desc: "Na elke opdracht feedback. Kwaliteit blijft omhoog.", emoji: "⭐" },
              { icon: Clock, title: "Snel & flexibel inzetbaar", desc: "Opschalen bij piekdrukte. Of een snelle fix last-minute.", emoji: "⚡" },
              { icon: Handshake, title: "Heldere afspraken", desc: "Je weet waar je aan toe bent. Korte lijnen.", emoji: "🤝" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-purple-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="text-3xl sm:text-4xl flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      {item.emoji}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                      <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
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

      {/* ════════════════════════════════════════════════ */}
      {/* 6. EXTRAATJE / REWARDS — DEEP PURPLE            */}
      {/* ════════════════════════════════════════════════ */}
      <section id="rewards" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={5} opacity={0.05} />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                <Gift className="w-4 h-4" /> EXTRAATje
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Werken wordt{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">beloond</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed">
                Medewerkers verdienen automatisch punten voor elke gewerkte shift en behaalde challenge.
                Die punten wisselen ze in voor echte beloningen.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-20 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Werk & verdien punten", desc: "Elke shift levert punten op. Extra inzet? Extra punten.", icon: "🏃" },
                { step: "2", title: "Klim in status", desc: "Van Bronze naar Diamond. Hogere status = betere beloningen.", icon: "💎" },
                { step: "3", title: "Claim je rewards", desc: "AirPods, TrainMore, Starbucks en meer. Jij kiest.", icon: "🎁" },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8 text-center hover:bg-white/[0.10] transition-all duration-300 hover:-translate-y-1">
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">{item.icon}</div>
                  <div className="text-[10px] sm:text-xs font-black text-purple-400 uppercase tracking-widest mb-2 sm:mb-3">Stap {item.step}</div>
                  <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{item.title}</h4>
                  <p className="text-purple-200/70 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-8 sm:gap-10 lg:gap-16 max-w-5xl mx-auto">
              <div className="flex lg:flex-col gap-2 sm:gap-3 lg:gap-4 lg:justify-center order-2 lg:order-1 flex-wrap justify-center">
                {appScreens.map((screen, i) => (
                  <button
                    key={screen.key}
                    onClick={() => setActiveScreen(i)}
                    className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-left transition-all duration-300 min-w-[140px] sm:min-w-[170px] ${
                      activeScreen === i
                        ? "bg-white/15 border-2 border-purple-400/60 shadow-lg shadow-purple-500/20 scale-105"
                        : "bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl">{screen.emoji}</span>
                    <div>
                      <span className={`font-bold text-sm sm:text-base block ${activeScreen === i ? "text-white" : "text-purple-200/80"}`}>{screen.label}</span>
                      {activeScreen === i && <span className="text-[10px] sm:text-xs text-purple-300/60 font-medium">Actief</span>}
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative order-1 lg:order-2 flex-shrink-0">
                <div className="relative w-[240px] sm:w-[300px]">
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border-[5px] border-gray-700 bg-gray-900">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[20px] bg-gray-900 rounded-b-xl z-20" />
                    <div className="relative">
                      {appScreens.map((screen, i) => (
                        <img key={screen.key} src={screen.img} alt={screen.label} className={`w-full transition-opacity duration-500 ${activeScreen === i ? "opacity-100 relative" : "opacity-0 absolute inset-0"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-[3rem] blur-3xl -z-10" />
                </div>
              </div>

              <div className="flex flex-col justify-center order-3 max-w-sm text-center lg:text-left">
                <div className="transition-all duration-300">
                  <span className="text-4xl sm:text-5xl block mb-3 sm:mb-5">{appScreens[activeScreen].emoji}</span>
                  <h4 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4">{appScreens[activeScreen].label}</h4>
                  <p className="text-base sm:text-lg text-purple-200/70 leading-relaxed">{appScreens[activeScreen].desc}</p>
                </div>
                <div className="flex gap-2.5 mt-6 sm:mt-8 justify-center lg:justify-start">
                  {appScreens.map((_, i) => (
                    <button key={i} onClick={() => setActiveScreen(i)} className={`h-2.5 rounded-full transition-all duration-300 ${activeScreen === i ? "bg-purple-400 w-10" : "bg-white/20 w-2.5 hover:bg-white/40"}`} />
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={300}>
            <div className="max-w-2xl mx-auto mt-12 sm:mt-16 bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/15 p-6 sm:p-8">
              <h4 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-300" />
                Wat jij als opdrachtgever merkt
              </h4>
              <ul className="space-y-2.5">
                {["Meer opkomst, minder last-minute uitval", "Mensen komen graag terug → stabielere poule", "Gemotiveerde medewerkers die een stapje extra doen"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-purple-200/80 text-sm sm:text-base">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 7. TESTIMONIALS — WARM LIGHT                    */}
      {/* ════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg count={3} opacity={0.03} />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/50 px-4 sm:px-5 py-2 rounded-full">
                <Heart className="w-4 h-4" /> Ervaringen
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat anderen zeggen
              </h2>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
              {(["werkgever", "medewerker"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTestimonialTab(tab)}
                  className={`px-5 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all duration-300 ${
                    testimonialTab === tab
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-500/25 scale-105"
                      : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200"
                  }`}
                >
                  {tab === "werkgever" ? "Werkgevers" : "Medewerkers"}
                </button>
              ))}
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
            {(testimonialTab === "werkgever" ? werkgeverTestimonials : medewerkerTestimonials).map((testimonial, i) => (
              <RevealSection key={`${testimonialTab}-${i}`} delay={i * 120}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col shadow-sm">
                  <div className="flex gap-1 mb-4 sm:mb-5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6 sm:mb-8 flex-1">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <span className="text-white font-bold text-sm sm:text-base">{testimonial.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs sm:text-sm text-gray-400 font-medium">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 8. LOGO MARQUEE                                 */}
      {/* ════════════════════════════════════════════════ */}
      <section id="trust" className="py-10 sm:py-14 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Vertrouwd door teams in de horeca</p>
          </RevealSection>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                  {[
                    { src: logoAmrath, alt: "Amrâth Hotels" },
                    { src: logoFcUtrecht, alt: "FC Utrecht" },
                    { src: logoFunda, alt: "Funda" },
                    { src: logoHartMuseum, alt: "H'art Museum" },
                    { src: logoHetePeper, alt: "Hete Peper" },
                    { src: logoHilton, alt: "Hilton" },
                    { src: logoMarriott, alt: "Marriott" },
                    { src: logoSelectCatering, alt: "Select Catering" },
                    { src: logoAppel, alt: "Appèl" },
                  ].map((logo) => (
                    <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity duration-300">
                      <img src={logo.src} alt={logo.alt} className="h-14 sm:h-18 lg:h-20 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 40s linear infinite;
          }
        `}</style>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 9. FAQ — NEUTRAL                                */}
      {/* ════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-gray-50">
        <XPatternBg count={2} opacity={0.03} />
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
              { q: "Werken jullie met zzp?", a: "Nee, iedereen werkt via ons in loondienst. Wij regelen loon, belasting en verzekeringen. Geen gedoe met zzp-constructies." },
              { q: "Welke functies leveren jullie?", a: "Hotels, catering, events en restaurants — housekeeping, front office, chefs, bediening, host/hostess, afwas en meer." },
              { q: "Hoe snel kunnen jullie leveren?", a: "Afhankelijk van locatie en moment. Vaak snel schakelen, soms dezelfde week. Bij grote events plannen we ruim vooruit." },
              { q: "Hoe werkt EXTRAATje?", a: "Je verdient punten per gewerkte shift en wisselt die in voor echte beloningen zoals AirPods, sportabonnementen en meer. Hoe meer je werkt, hoe hoger je status." },
            ].map((faq, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-gray-100 hover:border-purple-200 transition-all duration-300 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 sm:p-7 text-left"
                  >
                    <span className="text-base sm:text-lg font-bold text-gray-900 pr-4">{faq.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
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

      {/* ── ANIMATED X-DIVIDER ── */}
      <XDivider className="bg-gradient-to-b from-gray-50 to-purple-950" />

      {/* ════════════════════════════════════════════════ */}
      {/* 10. FINAL CTA — DARK PURPLE                    */}
      {/* ════════════════════════════════════════════════ */}
      <section id="final-cta" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.06} />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om samen{" "}
              <span className="relative inline-block">
                <span className="relative z-10">te werken?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Of je nu extra personeel zoekt of extra werk: we regelen het snel en duidelijk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center">
              <a
                href="mailto:info@doehetextra.nl"
                className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3"
                style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
              >
                Vraag extra personeel aan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/sollicitatieformulier" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3">
                Ik zoek extra werk
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
              <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-base sm:text-lg">E</span>
                </div>
                <span className="font-black text-xl sm:text-2xl text-white tracking-tight">EXTRA</span>
              </div>
              <p className="text-sm sm:text-base leading-relaxed">
                Uitzendbureau voor horeca, hotels en evenementen. Met ons unieke EXTRAATje beloningssysteem.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Werkgevers</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li><button onClick={() => scrollTo("final-cta")} className="hover:text-purple-400 transition-colors">Personeel aanvragen</button></li>
                <li><button onClick={() => scrollTo("how-it-works")} className="hover:text-purple-400 transition-colors">Hoe het werkt</button></li>
                <li><button onClick={() => scrollTo("differentiators")} className="hover:text-purple-400 transition-colors">Waarom extra</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Werkzoekenden</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li><a href="/sollicitatieformulier" className="hover:text-purple-400 transition-colors">Solliciteren</a></li>
                <li><button onClick={() => scrollTo("rewards")} className="hover:text-purple-400 transition-colors">EXTRAATje Rewards</button></li>
                <li><button onClick={() => scrollTo("sectors")} className="hover:text-purple-400 transition-colors">Sectoren</button></li>
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
    </div>
  );
}
