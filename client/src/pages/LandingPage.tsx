import { useEffect, useRef, useState } from "react";
import {
  Users, Trophy, Gift, Star, ChevronDown,
  TrendingUp, Shield, Clock,
  ArrowRight, Check, Menu, X, Briefcase, UserCheck, CreditCard,
  MessageSquare, Award, Handshake, Phone
} from "lucide-react";
import appScreenshot3 from "@assets/Scherm\u00ADafbeelding_2026-02-12_om_17.16.21_1770913110868.png";
import screenDashboard from "@assets/IMG_8803_1770915286475.png";
import screenRewards from "@assets/IMG_8805_1770915286475.png";
import screenChallenges from "@assets/IMG_8807_1770915286475.png";
import screenRanglijst from "@assets/IMG_8808_1770915286475.png";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
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

function FloatingNotification({ text, emoji, className, delay }: { text: string; emoji: string; className?: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className={`absolute bg-white rounded-2xl shadow-2xl shadow-purple-500/20 px-5 py-3.5 flex items-center gap-3 border border-purple-100 transition-all duration-700 ${show ? "opacity-100 scale-100" : "opacity-0 scale-90"} ${className}`}>
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{text}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">EXTRA Rewards</p>
      </div>
    </div>
  );
}

function XShape({ className = "", size = 80, rotate = 0, opacity = 0.06 }: { className?: string; size?: number; rotate?: number; opacity?: number }) {
  return (
    <div className={`absolute pointer-events-none select-none ${className}`} style={{ width: size, height: size, transform: `rotate(${rotate}deg)`, opacity }}>
      <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M18.3 0L50 31.7L81.7 0L100 18.3L68.3 50L100 81.7L81.7 100L50 68.3L18.3 100L0 81.7L31.7 50L0 18.3Z" />
      </svg>
    </div>
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard", desc: "Bekijk je totale punten, status en maandelijkse voortgang in één overzicht.", emoji: "📊" },
  { key: "rewards", img: screenRewards, label: "Rewards", desc: "Wissel je punten in voor toffe beloningen zoals AirPods, museumjaarkaarten en meer.", emoji: "🎁" },
  { key: "challenges", img: screenChallenges, label: "Challenges", desc: "Behaal uitdagingen zoals 'Diensten Kampioen' en verdien extra punten met elke mijlpaal.", emoji: "🏆" },
  { key: "ranglijst", img: screenRanglijst, label: "Ranglijst", desc: "Bekijk je positie op de maandelijkse ranglijst en versla je collega's.", emoji: "📈" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);
  const [howItWorksTab, setHowItWorksTab] = useState<"werkgever" | "medewerker">("werkgever");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Navigation */}
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
                ["Hoe het werkt", "how-it-works"],
                ["Waarom EXTRA", "differentiators"],
                ["EXTRAATje", "rewards"],
                ["Werkgevers", "trust"],
                ["Contact", "final-cta"]
              ].map(([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)} className={`text-sm font-semibold transition-colors hover:text-purple-600 ${scrolled ? "text-gray-600" : "text-white/80 hover:text-white"}`}>
                  {label}
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
              {[["Hoe het werkt","how-it-works"],["Waarom EXTRA","differentiators"],["EXTRAATje","rewards"],["Werkgevers","trust"],["Contact","final-cta"]].map(([label,id]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-gray-700 font-semibold py-2 hover:text-purple-600">{label}</button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ============================================ */}
      {/* 1. HERO + MINI-USPs                         */}
      {/* ============================================ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <XShape className="text-white top-[12%] left-[5%]" size={140} rotate={15} opacity={0.04} />
        <XShape className="text-white top-[60%] right-[8%]" size={90} rotate={-20} opacity={0.05} />
        <XShape className="text-white bottom-[25%] left-[15%]" size={50} rotate={35} opacity={0.03} />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-medium">800+ medewerkers actief</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-6" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
                Horecapersoneel nodig?{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">EXTRA</span>
                  <span className="absolute bottom-0.5 left-0 right-0 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80" />
                </span>
                {" "}regelt het!
              </h1>
              <p className="text-lg text-purple-200 max-w-lg mb-8 leading-relaxed">
                Flexibel en representatief personeel voor hotels, events en cateraars. Snel geregeld.
              </p>

              {/* Mini-USPs */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-10">
                {[
                  { icon: Check, text: "Iedereen in loondienst" },
                  { icon: Star, text: "Geselecteerd personeel" },
                  { icon: CreditCard, text: "Dagbetaling mogelijk" },
                ].map((usp, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                      <usp.icon className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white/80 text-sm font-medium">{usp.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => scrollTo("audience")} className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                  Ik zoek extra personeel
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => scrollTo("audience")} className="group border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                  Ik zoek extra werk
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative mx-auto w-[320px]">
                <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/40 border-[6px] border-gray-800">
                  <img src={appScreenshot3} alt="EXTRA App" className="w-full" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-[3rem] blur-2xl -z-10" />
              </div>
              <FloatingNotification text="+50 punten verdiend" emoji="⭐" className="top-8 -left-16 z-30 max-w-[240px]" delay={1500} />
              <FloatingNotification text="Je bent nu Gold status!" emoji="🥇" className="bottom-24 -right-12 z-30 max-w-[250px]" delay={3000} />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 2. AUDIENCE SPLIT                           */}
      {/* ============================================ */}
      <section id="audience" className="relative z-20 -mt-16 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <RevealSection>
              <a href="#final-cta" onClick={(e) => { e.preventDefault(); scrollTo("final-cta"); }} className="group block bg-white rounded-3xl shadow-xl shadow-purple-500/10 border border-purple-100/50 p-8 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Ik zoek personeel</h3>
                <ul className="space-y-3 mb-8">
                  {["Snel inzetbaar horecapersoneel", "Strenge selectie & beoordeling", "Flexibel op- en afschalen"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-gray-600">
                      <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <span className="inline-flex items-center gap-2 text-purple-700 font-bold group-hover:gap-3 transition-all">
                  Plan een kennismaking <ArrowRight className="w-4 h-4" />
                </span>
              </a>
            </RevealSection>

            <RevealSection delay={150}>
              <a href="/sollicitatieformulier" className="group block bg-white rounded-3xl shadow-xl shadow-purple-500/10 border border-purple-100/50 p-8 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Ik zoek werk</h3>
                <ul className="space-y-3 mb-8">
                  {["Direct uitbetaald via app", "Kies je eigen diensten", "Verdien punten & beloningen"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-gray-600">
                      <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <span className="inline-flex items-center gap-2 text-purple-700 font-bold group-hover:gap-3 transition-all">
                  Meld je aan <ArrowRight className="w-4 h-4" />
                </span>
              </a>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 3. LOGO MARQUEE                             */}
      {/* ============================================ */}
      <section className="py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-10">Vertrouwd door teams in de horeca</p>
          </RevealSection>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-16 px-8 flex-shrink-0">
                  {["Hotel Okura", "RAI Amsterdam", "Kurhaus", "Marriott Hotels", "NH Collection", "Postillion Hotels", "Van der Valk", "Hilton", "Hyatt Regency", "Fletcher Hotels"].map((name) => (
                    <div key={`${setIdx}-${name}`} className="flex items-center gap-3 flex-shrink-0 opacity-30 hover:opacity-60 transition-opacity">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 font-bold text-xs">{name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <span className="text-gray-400 font-semibold text-sm whitespace-nowrap">{name}</span>
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

      {/* ============================================ */}
      {/* 4. HOE HET WERKT                            */}
      {/* ============================================ */}
      <section id="how-it-works" className="py-24 lg:py-32 relative overflow-hidden">
        <XShape className="text-purple-500 top-[10%] right-[3%]" size={110} rotate={22} opacity={0.04} />
        <XShape className="text-purple-500 bottom-[8%] left-[2%]" size={60} rotate={-30} opacity={0.03} />
        <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-block text-purple-600 font-bold text-sm uppercase tracking-widest mb-4">Proces</span>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900">Hoe het werkt</h2>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex justify-center gap-2 mb-12">
              {(["werkgever", "medewerker"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHowItWorksTab(tab)}
                  className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                    howItWorksTab === tab
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {tab === "werkgever" ? "Voor werkgevers" : "Voor medewerkers"}
                </button>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(howItWorksTab === "werkgever" ? [
                { icon: Phone, step: "1", title: "Neem contact op", desc: "Bel of mail ons met je personeelsbehoefte." },
                { icon: UserCheck, step: "2", title: "Wij selecteren", desc: "Geschikt en getraind personeel uit onze pool." },
                { icon: Clock, step: "3", title: "Planning & inzet", desc: "Personeel staat klaar op afgesproken tijden." },
                { icon: TrendingUp, step: "4", title: "Evaluatie", desc: "Beoordeel en bouw aan een vast team." },
              ] : [
                { icon: UserCheck, step: "1", title: "Meld je aan", desc: "Schrijf je in via het online formulier." },
                { icon: Briefcase, step: "2", title: "Kies je diensten", desc: "Bekijk beschikbare shifts in de app." },
                { icon: CreditCard, step: "3", title: "Werk & verdien", desc: "Direct uitbetaald, plus punten verdiend." },
                { icon: Gift, step: "4", title: "Claim rewards", desc: "Wissel punten in voor toffe beloningen." },
              ]).map((item, i) => (
                <div key={`${howItWorksTab}-${i}`} className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
                  <div className="absolute -top-3 -left-1 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-purple-500/30">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 mt-2">
                    <item.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-1.5">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ============================================ */}
      {/* 5. WAAROM EXTRA (Differentiators)           */}
      {/* ============================================ */}
      <section id="differentiators" className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-block text-purple-600 font-bold text-sm uppercase tracking-widest mb-4">Ons verschil</span>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900">Waarom EXTRA</h2>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Shield, title: "Iedereen in loondienst", desc: "Geen ZZP-constructies. Wij regelen alles rondom loon, belasting en verzekeringen." },
              { icon: Award, title: "Geselecteerd & beoordeeld", desc: "Elk teamlid doorloopt een selectieprocedure en wordt na elke opdracht beoordeeld." },
              { icon: Clock, title: "Snel & flexibel inzetbaar", desc: "Last-minute personeel nodig? Wij schakelen snel en leveren ook op korte termijn." },
              { icon: Gift, title: "Gemotiveerd door EXTRAATje", desc: "Ons beloningssysteem zorgt voor betrokken medewerkers die graag terugkomen." },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-5 group-hover:bg-purple-100 transition-colors">
                    <item.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 6. EXTRAATje / REWARDS                      */}
      {/* ============================================ */}
      <section id="rewards" className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <XShape className="text-white top-[8%] right-[6%]" size={120} rotate={-12} opacity={0.04} />
        <XShape className="text-white bottom-[15%] left-[4%]" size={70} rotate={25} opacity={0.035} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-16">
              <span className="inline-block text-purple-300 font-bold text-sm uppercase tracking-widest mb-4">EXTRAATje</span>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                Ons unieke beloningssysteem
              </h2>
              <p className="text-lg text-purple-200 max-w-2xl mx-auto leading-relaxed">
                Medewerkers verdienen automatisch punten voor elke gewerkte shift en behaalde challenge.
                Die punten wisselen ze in voor echte beloningen — van AirPods tot sportabonnementen.
                Het resultaat? Gemotiveerd personeel dat graag terugkomt.
              </p>
            </div>
          </RevealSection>

          {/* Interactive app showcase */}
          <RevealSection delay={100}>
            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-8 lg:gap-14 max-w-4xl mx-auto">
              <div className="flex lg:flex-col gap-3 lg:gap-4 lg:justify-center order-2 lg:order-1 flex-wrap justify-center">
                {appScreens.map((screen, i) => (
                  <button
                    key={screen.key}
                    onClick={() => setActiveScreen(i)}
                    className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-left transition-all duration-300 min-w-[160px] ${
                      activeScreen === i
                        ? "bg-white/15 border-2 border-purple-400/60 shadow-lg shadow-purple-500/20 scale-105"
                        : "bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <span className="text-2xl">{screen.emoji}</span>
                    <div>
                      <span className={`font-bold text-sm block ${activeScreen === i ? "text-white" : "text-purple-200/80"}`}>{screen.label}</span>
                      {activeScreen === i && <span className="text-[10px] text-purple-300/60 font-medium">Actief</span>}
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative order-1 lg:order-2 flex-shrink-0">
                <div className="relative w-[260px] sm:w-[280px]">
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border-[5px] border-gray-700 bg-gray-900">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[20px] bg-gray-900 rounded-b-xl z-20" />
                    <div className="relative">
                      {appScreens.map((screen, i) => (
                        <img key={screen.key} src={screen.img} alt={screen.label} className={`w-full transition-opacity duration-500 ${activeScreen === i ? "opacity-100 relative" : "opacity-0 absolute inset-0"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -inset-3 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-[3rem] blur-2xl -z-10" />
                </div>
              </div>

              <div className="flex flex-col justify-center order-3 max-w-xs text-center lg:text-left">
                <div className="transition-all duration-300">
                  <span className="text-4xl block mb-4">{appScreens[activeScreen].emoji}</span>
                  <h4 className="text-xl font-bold text-white mb-3">{appScreens[activeScreen].label}</h4>
                  <p className="text-purple-200/70 leading-relaxed">{appScreens[activeScreen].desc}</p>
                </div>
                <div className="flex gap-2 mt-6 justify-center lg:justify-start">
                  {appScreens.map((_, i) => (
                    <button key={i} onClick={() => setActiveScreen(i)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeScreen === i ? "bg-purple-400 w-8" : "bg-white/20 hover:bg-white/40"}`} />
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="text-center mt-16">
              <button onClick={() => scrollTo("audience")} className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2">
                Ontdek EXTRAATje
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ============================================ */}
      {/* 7. KWALITEIT & ZEKERHEID (Trust Block)      */}
      {/* ============================================ */}
      <section id="trust" className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-block text-purple-600 font-bold text-sm uppercase tracking-widest mb-4">Kwaliteit & zekerheid</span>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900">Waar u op kunt rekenen</h2>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-3xl border border-purple-100/50 p-8 lg:p-12">
              <div className="grid sm:grid-cols-3 gap-8">
                {[
                  { icon: Shield, title: "Volledig in loondienst", desc: "Alle medewerkers werken via ons in loondienst. Wij regelen loon, belasting en verzekeringen." },
                  { icon: Award, title: "Strenge selectie", desc: "Ieder teamlid doorloopt een selectieproces en wordt na iedere opdracht beoordeeld." },
                  { icon: Handshake, title: "Heldere afspraken", desc: "Duidelijke communicatie, vaste contactpersoon en transparante werkwijze." },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-lg shadow-purple-500/10 flex items-center justify-center mx-auto mb-5">
                      <item.icon className="w-7 h-7 text-purple-600" />
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ============================================ */}
      {/* 8. TESTIMONIALS                             */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-block text-purple-600 font-bold text-sm uppercase tracking-widest mb-4">Ervaringen</span>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900">Wat anderen zeggen</h2>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "EXTRA levert keer op keer betrouwbaar en goed getraind personeel. De communicatie is snel en helder.",
                name: "Mark de Vries",
                role: "F&B Manager, Grand Hotel",
                type: "werkgever"
              },
              {
                quote: "Binnen 24 uur hadden we personeel voor ons evenement. Professioneel en representatief. Aanrader.",
                name: "Lisa Jansen",
                role: "Event Manager, Venues Amsterdam",
                type: "werkgever"
              },
              {
                quote: "Het puntensysteem maakt werken echt leuker. Ik heb al AirPods en een TrainMore korting verdiend!",
                name: "Jamal El Amrani",
                role: "Medewerker sinds 2024",
                type: "medewerker"
              },
            ].map((testimonial, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="bg-white rounded-2xl p-7 border border-gray-100 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6 flex-1">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{testimonial.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 9. FINAL CTA                                */}
      {/* ============================================ */}
      <section id="final-cta" className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <XShape className="text-white top-[15%] left-[8%]" size={100} rotate={-18} opacity={0.045} />
        <XShape className="text-white bottom-[20%] right-[10%]" size={60} rotate={30} opacity={0.035} />
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <RevealSection>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om samen te werken?
            </h2>
            <p className="text-lg text-purple-200 mb-10 max-w-2xl mx-auto leading-relaxed">
              Of je nu personeel zoekt of een flexibele bijbaan wilt met echte voordelen —
              bij EXTRA ben je aan het juiste adres.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:info@doehetextra.nl" className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                Plan een kennismaking
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/sollicitatieformulier" className="group border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                Meld je aan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-lg">E</span>
                </div>
                <span className="font-black text-2xl text-white tracking-tight">EXTRA</span>
              </div>
              <p className="text-sm leading-relaxed">
                Uitzendbureau voor horeca, hotels en evenementen. Met ons unieke EXTRAATje beloningssysteem.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Werkgevers</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollTo("final-cta")} className="hover:text-purple-400 transition-colors">Personeel aanvragen</button></li>
                <li><button onClick={() => scrollTo("how-it-works")} className="hover:text-purple-400 transition-colors">Hoe het werkt</button></li>
                <li><button onClick={() => scrollTo("trust")} className="hover:text-purple-400 transition-colors">Kwaliteit</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Werkzoekenden</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/sollicitatieformulier" className="hover:text-purple-400 transition-colors">Solliciteren</a></li>
                <li><button onClick={() => scrollTo("rewards")} className="hover:text-purple-400 transition-colors">EXTRAATje Rewards</button></li>
                <li><button onClick={() => scrollTo("differentiators")} className="hover:text-purple-400 transition-colors">Voordelen</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
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
