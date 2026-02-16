import { useEffect, useRef, useState } from "react";
import {
  Users, Trophy, Gift, Star, ChevronDown,
  TrendingUp, Shield, Clock,
  ArrowRight, Check, Menu, X, Briefcase, UserCheck, CreditCard,
  Award, Handshake, Phone, Sparkles, Heart, Zap
} from "lucide-react";
import appScreenshot3 from "@assets/Scherm\u00ADafbeelding_2026-02-12_om_17.16.21_1770913110868.png";
import screenDashboard from "@assets/IMG_8803_1770915286475.png";
import screenRewards from "@assets/IMG_8805_1770915286475.png";
import screenChallenges from "@assets/IMG_8807_1770915286475.png";
import screenRanglijst from "@assets/IMG_8808_1770915286475.png";

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

function Blob({ className = "", color = "purple" }: { className?: string; color?: string }) {
  const colors: Record<string, string> = {
    purple: "from-purple-300/20 to-purple-500/10",
    pink: "from-pink-300/15 to-purple-300/10",
    indigo: "from-indigo-300/15 to-purple-300/10",
  };
  return (
    <div className={`absolute rounded-full blur-3xl pointer-events-none bg-gradient-to-br ${colors[color] || colors.purple} ${className}`} />
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

function CountUp({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal();
  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target, duration]);
  return <span ref={ref}>{count.toLocaleString("nl-NL")}{suffix}</span>;
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
      {/* 1. HERO                                      */}
      {/* ============================================ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <XShape className="text-white top-[12%] left-[5%]" size={180} rotate={15} opacity={0.03} />
        <XShape className="text-white top-[55%] right-[6%]" size={120} rotate={-20} opacity={0.04} />
        <XShape className="text-white bottom-[20%] left-[12%]" size={60} rotate={35} opacity={0.025} />
        <Blob className="w-[600px] h-[600px] top-[-10%] right-[-10%]" color="pink" />
        <Blob className="w-[400px] h-[400px] bottom-[5%] left-[-5%]" color="indigo" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-32 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 mb-10 border border-white/20">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-semibold">800+ medewerkers actief</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
                Horecapersoneel nodig?{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">EXTRA</span>
                  <span className="absolute bottom-1 left-0 right-0 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
                </span>
                {" "}regelt het!
              </h1>
              <p className="text-xl sm:text-2xl text-purple-200 max-w-lg mb-10 leading-relaxed font-medium">
                Flexibel en representatief personeel voor hotels, events en cateraars. Snel geregeld.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 mb-12">
                {[
                  { icon: Check, text: "Iedereen in loondienst" },
                  { icon: Star, text: "Geselecteerd personeel" },
                  { icon: CreditCard, text: "Dagbetaling mogelijk" },
                ].map((usp, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                      <usp.icon className="w-4.5 h-4.5 text-green-400" />
                    </div>
                    <span className="text-white/85 text-base font-medium">{usp.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => scrollTo("audience")} className="group bg-white text-purple-900 font-bold px-10 py-5 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                  Ik zoek extra personeel
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => scrollTo("audience")} className="group border-2 border-white/30 text-white font-bold px-10 py-5 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                  Ik zoek extra werk
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative mx-auto w-[340px]">
                <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/40 border-[6px] border-gray-800">
                  <img src={appScreenshot3} alt="EXTRA App" className="w-full" />
                </div>
                <div className="absolute -inset-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-[3.5rem] blur-3xl -z-10" />
              </div>
              <FloatingNotification text="+50 punten verdiend" emoji="⭐" className="top-6 -left-20 z-30 max-w-[250px]" delay={1500} />
              <FloatingNotification text="Je bent nu Gold status!" emoji="🥇" className="bottom-20 -right-16 z-30 max-w-[260px]" delay={3000} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-20 -mt-20 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-3xl shadow-xl shadow-purple-500/10 border border-purple-100/50 p-6 sm:p-10 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {[
              { value: 800, suffix: "+", label: "Actieve medewerkers", icon: Users, color: "text-purple-500" },
              { value: 150, suffix: "+", label: "Tevreden opdrachtgevers", icon: Heart, color: "text-pink-500" },
              { value: 50000, suffix: "+", label: "Punten verdiend", icon: Sparkles, color: "text-yellow-500" },
              { value: 98, suffix: "%", label: "Tevredenheidsscore", icon: TrendingUp, color: "text-green-500" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-3`} />
                <p className="text-4xl lg:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-400 mt-2 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 2. AUDIENCE SPLIT                           */}
      {/* ============================================ */}
      <section id="audience" className="py-20 lg:py-28 relative overflow-hidden">
        <Blob className="w-[500px] h-[500px] top-[-10%] left-[-10%]" color="purple" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat zoek jij?
              </h2>
              <p className="text-xl text-gray-500 mt-4 max-w-xl mx-auto">Kies wat het best bij je past</p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-8">
            <RevealSection>
              <a href="#final-cta" onClick={(e) => { e.preventDefault(); scrollTo("final-cta"); }} className="group block relative bg-gradient-to-br from-purple-50 to-white rounded-[2rem] shadow-lg shadow-purple-500/5 border-2 border-purple-100 p-10 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-2 transition-all duration-400 h-full overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-[100%] opacity-60" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/20">
                    <Briefcase className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>Ik zoek personeel</h3>
                  <ul className="space-y-4 mb-10">
                    {["Snel inzetbaar horecapersoneel", "Strenge selectie & beoordeling", "Flexibel op- en afschalen"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-600">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-purple-700" />
                        </div>
                        <span className="text-base font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold text-base px-7 py-3.5 rounded-full group-hover:bg-purple-700 group-hover:gap-4 transition-all shadow-lg shadow-purple-500/20">
                    Plan een kennismaking <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </a>
            </RevealSection>

            <RevealSection delay={150}>
              <a href="/sollicitatieformulier" className="group block relative bg-gradient-to-br from-indigo-50 to-white rounded-[2rem] shadow-lg shadow-indigo-500/5 border-2 border-indigo-100 p-10 hover:shadow-2xl hover:border-indigo-300 hover:-translate-y-2 transition-all duration-400 h-full overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-[100%] opacity-60" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-lg shadow-indigo-500/20">
                    <UserCheck className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>Ik zoek werk</h3>
                  <ul className="space-y-4 mb-10">
                    {["Direct uitbetaald via app", "Kies je eigen diensten", "Verdien punten & beloningen"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-600">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-indigo-700" />
                        </div>
                        <span className="text-base font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-base px-7 py-3.5 rounded-full group-hover:bg-indigo-700 group-hover:gap-4 transition-all shadow-lg shadow-indigo-500/20">
                    Meld je aan <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </a>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 3. LOGO MARQUEE                             */}
      {/* ============================================ */}
      <section className="py-14 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-base font-bold text-gray-400 uppercase tracking-widest mb-10">Vertrouwd door teams in de horeca</p>
          </RevealSection>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50/90 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50/90 to-transparent z-10" />
            <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-16 px-8 flex-shrink-0">
                  {["Hotel Okura", "RAI Amsterdam", "Kurhaus", "Marriott Hotels", "NH Collection", "Postillion Hotels", "Van der Valk", "Hilton", "Hyatt Regency", "Fletcher Hotels"].map((name) => (
                    <div key={`${setIdx}-${name}`} className="flex items-center gap-3 flex-shrink-0 opacity-25 hover:opacity-50 transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-2xl bg-gray-200/60 flex items-center justify-center">
                        <span className="text-gray-400 font-black text-sm">{name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <span className="text-gray-400 font-bold text-base whitespace-nowrap">{name}</span>
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
      <section id="how-it-works" className="py-28 lg:py-36 relative overflow-hidden">
        <XShape className="text-purple-500 top-[8%] right-[3%]" size={140} rotate={22} opacity={0.03} />
        <XShape className="text-purple-500 bottom-[10%] left-[2%]" size={80} rotate={-30} opacity={0.025} />
        <Blob className="w-[400px] h-[400px] top-[20%] right-[-5%]" color="pink" />
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-widest mb-5 bg-purple-50 px-5 py-2 rounded-full">
                <Zap className="w-4 h-4" /> Simpel & snel
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hoe het werkt
              </h2>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex justify-center gap-3 mb-14">
              {(["werkgever", "medewerker"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHowItWorksTab(tab)}
                  className={`px-8 py-4 rounded-full text-base font-bold transition-all duration-300 ${
                    howItWorksTab === tab
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-500/25 scale-105"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                  }`}
                >
                  {tab === "werkgever" ? "Voor werkgevers" : "Voor medewerkers"}
                </button>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {(howItWorksTab === "werkgever" ? [
                { icon: Phone, step: "1", title: "Neem contact op", desc: "Bel of mail ons met je personeelsbehoefte.", color: "from-purple-500 to-purple-700" },
                { icon: UserCheck, step: "2", title: "Wij selecteren", desc: "Geschikt en getraind personeel uit onze pool.", color: "from-indigo-500 to-purple-600" },
                { icon: Clock, step: "3", title: "Planning & inzet", desc: "Personeel staat klaar op afgesproken tijden.", color: "from-blue-500 to-indigo-600" },
                { icon: TrendingUp, step: "4", title: "Evaluatie", desc: "Beoordeel en bouw aan een vast team.", color: "from-emerald-500 to-teal-600" },
              ] : [
                { icon: UserCheck, step: "1", title: "Meld je aan", desc: "Schrijf je in via het online formulier.", color: "from-purple-500 to-purple-700" },
                { icon: Briefcase, step: "2", title: "Kies je diensten", desc: "Bekijk beschikbare shifts in de app.", color: "from-indigo-500 to-purple-600" },
                { icon: CreditCard, step: "3", title: "Werk & verdien", desc: "Direct uitbetaald, plus punten verdiend.", color: "from-blue-500 to-indigo-600" },
                { icon: Gift, step: "4", title: "Claim rewards", desc: "Wissel punten in voor toffe beloningen.", color: "from-emerald-500 to-teal-600" },
              ]).map((item, i) => (
                <div key={`${howItWorksTab}-${i}`} className="relative group">
                  {i < 3 && <div className="hidden lg:block absolute top-10 left-[calc(100%+0.5rem)] w-[calc(100%-3rem)] h-0.5 bg-gradient-to-r from-purple-200 to-transparent z-0" />}
                  <div className="relative bg-white rounded-[1.5rem] p-8 border-2 border-gray-100 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-xs font-black text-purple-400 uppercase tracking-widest mb-3">Stap {item.step}</div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-base text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ============================================ */}
      {/* 5. WAAROM EXTRA (Differentiators)           */}
      {/* ============================================ */}
      <section id="differentiators" className="py-28 lg:py-36 bg-gradient-to-b from-purple-50/80 to-white relative overflow-hidden">
        <XShape className="text-purple-400 top-[5%] left-[4%]" size={100} rotate={-15} opacity={0.04} />
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-5 py-2 rounded-full">
                <Sparkles className="w-4 h-4" /> Ons verschil
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waarom EXTRA
              </h2>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: Shield, title: "Iedereen in loondienst", desc: "Geen ZZP-constructies. Wij regelen loon, belasting en verzekeringen.", emoji: "🛡️", bg: "from-purple-50 to-white" },
              { icon: Award, title: "Geselecteerd & beoordeeld", desc: "Elk teamlid doorloopt een selectieprocedure en wordt beoordeeld na elke opdracht.", emoji: "⭐", bg: "from-yellow-50 to-white" },
              { icon: Clock, title: "Snel & flexibel inzetbaar", desc: "Last-minute personeel nodig? Wij schakelen snel en leveren ook op korte termijn.", emoji: "⚡", bg: "from-blue-50 to-white" },
              { icon: Gift, title: "Gemotiveerd door EXTRAATje", desc: "Ons beloningssysteem zorgt voor betrokken medewerkers die graag terugkomen.", emoji: "🎁", bg: "from-pink-50 to-white" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className={`group bg-gradient-to-br ${item.bg} rounded-[1.5rem] p-9 border-2 border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 h-full`}>
                  <div className="flex items-start gap-5">
                    <div className="text-4xl flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      {item.emoji}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 mb-3">{item.title}</h3>
                      <p className="text-base text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 6. EXTRAATje / REWARDS                      */}
      {/* ============================================ */}
      <section id="rewards" className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <XShape className="text-white top-[8%] right-[6%]" size={160} rotate={-12} opacity={0.035} />
        <XShape className="text-white bottom-[12%] left-[4%]" size={90} rotate={25} opacity={0.03} />
        <Blob className="w-[500px] h-[500px] top-[-5%] left-[-10%] opacity-20" color="pink" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-20">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-sm uppercase tracking-widest mb-5 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
                <Gift className="w-4 h-4" /> EXTRAATje
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Werken wordt{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">beloond</span>
                  <span className="absolute bottom-1 left-0 right-0 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed">
                Medewerkers verdienen automatisch punten voor elke gewerkte shift en behaalde challenge.
                Die punten wisselen ze in voor echte beloningen — van AirPods tot sportabonnementen.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-3 gap-6 mb-20 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Werk & verdien punten", desc: "Elke shift levert punten op. Extra inzet? Extra punten.", icon: "🏃" },
                { step: "2", title: "Klim in status", desc: "Van Bronze naar Diamond. Hogere status = betere beloningen.", icon: "💎" },
                { step: "3", title: "Claim je rewards", desc: "AirPods, TrainMore, Starbucks en meer. Jij kiest.", icon: "🎁" },
              ].map((item, i) => (
                <div key={i} className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center hover:bg-white/12 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-5xl mb-5">{item.icon}</div>
                  <div className="text-xs font-black text-purple-400 uppercase tracking-widest mb-3">Stap {item.step}</div>
                  <h4 className="text-xl font-bold text-white mb-3">{item.title}</h4>
                  <p className="text-purple-200/70 text-base leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-10 lg:gap-16 max-w-5xl mx-auto">
              <div className="flex lg:flex-col gap-3 lg:gap-4 lg:justify-center order-2 lg:order-1 flex-wrap justify-center">
                {appScreens.map((screen, i) => (
                  <button
                    key={screen.key}
                    onClick={() => setActiveScreen(i)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-left transition-all duration-300 min-w-[170px] ${
                      activeScreen === i
                        ? "bg-white/15 border-2 border-purple-400/60 shadow-lg shadow-purple-500/20 scale-105"
                        : "bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <span className="text-3xl">{screen.emoji}</span>
                    <div>
                      <span className={`font-bold text-base block ${activeScreen === i ? "text-white" : "text-purple-200/80"}`}>{screen.label}</span>
                      {activeScreen === i && <span className="text-xs text-purple-300/60 font-medium">Actief</span>}
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative order-1 lg:order-2 flex-shrink-0">
                <div className="relative w-[280px] sm:w-[300px]">
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
                  <span className="text-5xl block mb-5">{appScreens[activeScreen].emoji}</span>
                  <h4 className="text-2xl font-black text-white mb-4">{appScreens[activeScreen].label}</h4>
                  <p className="text-lg text-purple-200/70 leading-relaxed">{appScreens[activeScreen].desc}</p>
                </div>
                <div className="flex gap-2.5 mt-8 justify-center lg:justify-start">
                  {appScreens.map((_, i) => (
                    <button key={i} onClick={() => setActiveScreen(i)} className={`h-2.5 rounded-full transition-all duration-300 ${activeScreen === i ? "bg-purple-400 w-10" : "bg-white/20 w-2.5 hover:bg-white/40"}`} />
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={300}>
            <div className="text-center mt-20">
              <button onClick={() => scrollTo("audience")} className="group bg-white text-purple-900 font-bold px-10 py-5 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-3">
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
      <section id="trust" className="py-28 lg:py-36 relative overflow-hidden">
        <Blob className="w-[300px] h-[300px] bottom-[10%] right-[-5%]" color="purple" />
        <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-widest mb-5 bg-purple-50 px-5 py-2 rounded-full">
                <Shield className="w-4 h-4" /> Betrouwbaar
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waar u op kunt rekenen
              </h2>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { icon: "🛡️", title: "Volledig in loondienst", desc: "Alle medewerkers werken via ons in loondienst. Wij regelen loon, belasting en verzekeringen.", bg: "from-purple-50 to-purple-100/30" },
                { icon: "⭐", title: "Strenge selectie", desc: "Ieder teamlid doorloopt een selectieproces en wordt na iedere opdracht beoordeeld.", bg: "from-yellow-50 to-orange-50/30" },
                { icon: "🤝", title: "Heldere afspraken", desc: "Duidelijke communicatie, vaste contactpersoon en transparante werkwijze.", bg: "from-green-50 to-emerald-50/30" },
              ].map((item, i) => (
                <div key={i} className={`text-center bg-gradient-to-b ${item.bg} rounded-[2rem] p-10 border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                  <div className="text-5xl mb-6">{item.icon}</div>
                  <h4 className="text-xl font-black text-gray-900 mb-3">{item.title}</h4>
                  <p className="text-base text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ============================================ */}
      {/* 8. TESTIMONIALS                             */}
      {/* ============================================ */}
      <section className="py-28 lg:py-36 bg-gradient-to-b from-purple-50/60 to-white relative overflow-hidden">
        <XShape className="text-purple-400 top-[15%] right-[5%]" size={100} rotate={20} opacity={0.03} />
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-14">
              <div>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-widest mb-4 bg-purple-100/50 px-5 py-2 rounded-full">
                  <Heart className="w-4 h-4" /> Ervaringen
                </span>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Wat anderen zeggen
                </h2>
              </div>
              <button onClick={() => scrollTo("final-cta")} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-base px-8 py-4 rounded-full transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 flex-shrink-0">
                Start vandaag
              </button>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "EXTRA levert keer op keer betrouwbaar en goed getraind personeel. De communicatie is snel en helder.",
                name: "Mark de Vries",
                role: "F&B Manager, Grand Hotel",
                type: "werkgever",
              },
              {
                quote: "Binnen 24 uur hadden we personeel voor ons evenement. Professioneel en representatief. Aanrader.",
                name: "Lisa Jansen",
                role: "Event Manager, Venues Amsterdam",
                type: "werkgever",
              },
              {
                quote: "Het puntensysteem maakt werken echt leuker. Ik heb al AirPods en een TrainMore korting verdiend!",
                name: "Jamal El Amrani",
                role: "Medewerker sinds 2024",
                type: "medewerker",
              },
            ].map((testimonial, i) => (
              <RevealSection key={i} delay={i * 120}>
                <div className="bg-white rounded-[1.5rem] p-9 border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-lg text-gray-600 leading-relaxed mb-8 flex-1">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <span className="text-white font-bold text-base">{testimonial.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-400 font-medium">{testimonial.role}</p>
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
      <section id="final-cta" className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <XShape className="text-white top-[10%] left-[6%]" size={130} rotate={-18} opacity={0.04} />
        <XShape className="text-white bottom-[15%] right-[8%]" size={80} rotate={30} opacity={0.035} />
        <Blob className="w-[500px] h-[500px] top-[-10%] right-[-10%] opacity-10" color="pink" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <RevealSection>
            <div className="text-6xl mb-8">🚀</div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om samen{" "}
              <span className="relative inline-block">
                <span className="relative z-10">te werken?</span>
                <span className="absolute bottom-1 left-0 right-0 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-xl text-purple-200 mb-12 max-w-2xl mx-auto leading-relaxed">
              Of je nu personeel zoekt of een flexibele bijbaan wilt met echte voordelen —
              bij EXTRA ben je aan het juiste adres.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <a href="mailto:info@doehetextra.nl" className="group bg-white text-purple-900 font-bold px-10 py-5 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                Plan een kennismaking
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/sollicitatieformulier" className="group border-2 border-white/30 text-white font-bold px-10 py-5 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                Meld je aan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-14">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-lg">E</span>
                </div>
                <span className="font-black text-2xl text-white tracking-tight">EXTRA</span>
              </div>
              <p className="text-base leading-relaxed">
                Uitzendbureau voor horeca, hotels en evenementen. Met ons unieke EXTRAATje beloningssysteem.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-5">Werkgevers</h4>
              <ul className="space-y-3 text-base">
                <li><button onClick={() => scrollTo("final-cta")} className="hover:text-purple-400 transition-colors">Personeel aanvragen</button></li>
                <li><button onClick={() => scrollTo("how-it-works")} className="hover:text-purple-400 transition-colors">Hoe het werkt</button></li>
                <li><button onClick={() => scrollTo("trust")} className="hover:text-purple-400 transition-colors">Kwaliteit</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-5">Werkzoekenden</h4>
              <ul className="space-y-3 text-base">
                <li><a href="/sollicitatieformulier" className="hover:text-purple-400 transition-colors">Solliciteren</a></li>
                <li><button onClick={() => scrollTo("rewards")} className="hover:text-purple-400 transition-colors">EXTRAATje Rewards</button></li>
                <li><button onClick={() => scrollTo("differentiators")} className="hover:text-purple-400 transition-colors">Voordelen</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-5">Contact</h4>
              <ul className="space-y-3 text-base">
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
