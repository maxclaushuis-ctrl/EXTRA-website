import { useEffect, useRef, useState } from "react";
import { 
  Zap, Users, Trophy, Gift, Star, ChevronDown,
  Smartphone, TrendingUp, Shield, Clock, MapPin, 
  ArrowRight, Check, Menu, X
} from "lucide-react";
import appScreenshot2 from "@assets/Scherm\u00ADafbeelding_2026-02-12_om_17.16.14_1770913110868.png";
import appScreenshot3 from "@assets/Scherm\u00ADafbeelding_2026-02-12_om_17.16.21_1770913110868.png";
import appScreenshot4 from "@assets/Scherm\u00ADafbeelding_2026-02-12_om_17.16.36_1770913110868.png";
import appScreenshot5 from "@assets/Scherm\u00ADafbeelding_2026-02-12_om_17.16.44_1770913110868.png";
import screenDashboard from "@assets/IMG_8803_1770915286475.png";
import screenRewards from "@assets/IMG_8805_1770915286475.png";
import screenChallenges from "@assets/IMG_8807_1770915286475.png";
import screenRanglijst from "@assets/IMG_8808_1770915286475.png";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
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
    <div
      className={`absolute bg-white rounded-2xl shadow-2xl shadow-purple-500/20 px-5 py-3.5 flex items-center gap-3 border border-purple-100 transition-all duration-700 ${show ? "opacity-100 scale-100" : "opacity-0 scale-90"} ${className}`}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{text}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">EXTRA Rewards</p>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-purple-500 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40 pb-5" : "max-h-0"}`}>
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

function XShape({ className = "", size = 80, rotate = 0, opacity = 0.06 }: { className?: string; size?: number; rotate?: number; opacity?: number }) {
  return (
    <div
      className={`absolute pointer-events-none select-none ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)`, opacity }}
    >
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
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target, duration]);

  return <span ref={ref}>{count.toLocaleString("nl-NL")}{suffix}</span>;
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
                ["Over ons", "about"],
                ["Rewards", "rewards"],
                ["Werkgevers", "employers"],
                ["Werken", "workers"],
                ["FAQ", "faq"]
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`text-sm font-semibold transition-colors hover:text-purple-600 ${scrolled ? "text-gray-600" : "text-white/80 hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => scrollTo("contact")}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5"
              >
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
              {[["Over ons","about"],["Rewards","rewards"],["Werkgevers","employers"],["Werken","workers"],["FAQ","faq"],["Contact","contact"]].map(([label,id]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-gray-700 font-semibold py-2 hover:text-purple-600">{label}</button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
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
              <p className="text-lg text-purple-200 max-w-lg mb-10 leading-relaxed">
                Flexibel en representatief personeel voor hotels, events en cateraars. Snel geregeld.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => scrollTo("employers")} className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                  Ik zoek extra personeel
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => scrollTo("workers")} className="group border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
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
              <FloatingNotification
                text="Je hebt een challenge behaald! 🎉"
                emoji="🏆"
                className="top-8 -left-16 z-30 max-w-[260px]"
                delay={1500}
              />
              <FloatingNotification
                text="Gefeliciteerd! Je bent nu Diamond 💎"
                emoji="🥇"
                className="bottom-24 -right-12 z-30 max-w-[270px]"
                delay={3000}
              />
              <FloatingNotification
                text="+125 punten verdiend deze maand"
                emoji="⭐"
                className="top-1/2 -left-24 z-30 max-w-[260px]"
                delay={4500}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-20 -mt-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-3xl shadow-xl shadow-purple-500/10 border border-purple-100/50 p-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: 800, suffix: "+", label: "Actieve medewerkers", icon: Users },
              { value: 150, suffix: "+", label: "Opdrachtgevers", icon: Shield },
              { value: 50000, suffix: "+", label: "Punten verdiend", icon: Star },
              { value: 98, suffix: "%", label: "Tevredenheidsscore", icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-3xl lg:text-4xl font-black text-gray-900">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Why EXTRA */}
      <section id="about" className="py-24 lg:py-32 relative overflow-hidden">
        <XShape className="text-purple-500 top-[10%] right-[3%]" size={110} rotate={22} opacity={0.04} />
        <XShape className="text-purple-500 bottom-[8%] left-[2%]" size={60} rotate={-30} opacity={0.03} />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block text-purple-600 font-bold text-sm uppercase tracking-widest mb-4">Waarom EXTRA?</span>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
                Niet zomaar een uitzendbureau
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Bij EXTRA combineren we flexibel werken met echte waardering. 
                Onze medewerkers verdienen meer dan alleen een salaris — ze verdienen rewards, erkenning en een community.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Direct uitbetaald", desc: "Via de JIXBEE app staat je salaris al binnen één dag op je rekening. Nooit meer wachten op je loon.", color: "from-yellow-400 to-orange-500" },
              { icon: Gift, title: "Uniek beloningssysteem", desc: "Verdien punten voor elke shift, challenge en mijlpaal. Wissel ze in voor AirPods, kortingen, concerttickets en meer.", color: "from-purple-500 to-pink-500" },
              { icon: Trophy, title: "Challenges & gamification", desc: "Behaal challenges, klim in de ranglijst en unlock nieuwe statussen. Van Bronze tot Diamond.", color: "from-blue-500 to-cyan-500" },
              { icon: Clock, title: "Flexibele shifts", desc: "Jij bepaalt wanneer je werkt. Kies je eigen diensten via de app en pas je planning aan wanneer het jou uitkomt.", color: "from-green-500 to-emerald-500" },
              { icon: Smartphone, title: "Alles in één app", desc: "Diensten kiezen, uren registreren, punten bekijken en rewards claimen. Alles vanuit je smartphone.", color: "from-indigo-500 to-purple-500" },
              { icon: MapPin, title: "Top locaties", desc: "Werk bij de beste horeca, hotels en evenementen in Amsterdam, Utrecht, Rotterdam en meer.", color: "from-rose-500 to-pink-500" },
            ].map((feature, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards System Showcase */}
      <section id="rewards" className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <XShape className="text-white top-[8%] right-[6%]" size={120} rotate={-12} opacity={0.04} />
        <XShape className="text-white bottom-[15%] left-[4%]" size={70} rotate={25} opacity={0.035} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-16">
              <span className="inline-block text-purple-300 font-bold text-sm uppercase tracking-widest mb-4">EXTRAATJE</span>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                Ons unieke puntensysteem
              </h2>
              <p className="text-lg text-purple-200 max-w-2xl mx-auto leading-relaxed">
                Bij elke shift, challenge en prestatie verdien je punten. 
                Spaar voor toffe beloningen en klim in status van Bronze naar Diamond.
              </p>
            </div>
          </RevealSection>

          {/* How points work - steps */}
          <RevealSection>
            <div className="grid sm:grid-cols-3 gap-6 mb-20">
              {[
                { step: "1", title: "Werk shifts & behaal challenges", desc: "Verdien automatisch punten voor elke dienst en extra voor challenges.", icon: "🏃" },
                { step: "2", title: "Klim in status", desc: "Van Bronze naar Silver, Gold en Diamond. Hogere status = betere rewards.", icon: "💎" },
                { step: "3", title: "Claim je beloningen", desc: "Wissel punten in voor AirPods, TrainMore, Starbucks en meer.", icon: "🎁" },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center hover:bg-white/10 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl mx-auto mb-4">
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Stap {item.step}</div>
                  <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-purple-200/70 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>

          {/* Interactive app showcase */}
          <RevealSection>
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Bekijk de app</h3>
            <p className="text-purple-200/70 text-center mb-12 max-w-xl mx-auto">Klik op een onderdeel om te zien hoe de app werkt.</p>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-8 lg:gap-14 max-w-4xl mx-auto">
              {/* Navigation buttons - left side */}
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
                      {activeScreen === i && (
                        <span className="text-[10px] text-purple-300/60 font-medium">Actief</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Phone mockup - center */}
              <div className="relative order-1 lg:order-2 flex-shrink-0">
                <div className="relative w-[260px] sm:w-[280px]">
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border-[5px] border-gray-700 bg-gray-900">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[20px] bg-gray-900 rounded-b-xl z-20" />
                    <div className="relative">
                      {appScreens.map((screen, i) => (
                        <img
                          key={screen.key}
                          src={screen.img}
                          alt={screen.label}
                          className={`w-full transition-opacity duration-500 ${
                            activeScreen === i ? "opacity-100 relative" : "opacity-0 absolute inset-0"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -inset-3 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-[3rem] blur-2xl -z-10" />
                </div>
              </div>

              {/* Description - right side */}
              <div className="flex flex-col justify-center order-3 max-w-xs text-center lg:text-left">
                <div className="transition-all duration-300">
                  <span className="text-4xl block mb-4">{appScreens[activeScreen].emoji}</span>
                  <h4 className="text-xl font-bold text-white mb-3">{appScreens[activeScreen].label}</h4>
                  <p className="text-purple-200/70 leading-relaxed">{appScreens[activeScreen].desc}</p>
                </div>
                <div className="flex gap-2 mt-6 justify-center lg:justify-start">
                  {appScreens.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveScreen(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        activeScreen === i ? "bg-purple-400 w-8" : "bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>

          {/* Status levels */}
          <RevealSection>
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 lg:p-12 mt-20">
              <h3 className="text-2xl font-bold text-white mb-8 text-center">Status niveaus</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                  { name: "Bronze", pts: "0", emoji: "🥉", color: "from-amber-700 to-amber-900", textColor: "text-amber-200" },
                  { name: "Silver", pts: "5.000", emoji: "🥈", color: "from-gray-400 to-gray-600", textColor: "text-gray-200" },
                  { name: "Gold", pts: "10.000", emoji: "🥇", color: "from-yellow-500 to-amber-600", textColor: "text-yellow-100" },
                  { name: "Diamond", pts: "15.000", emoji: "💎", color: "from-cyan-400 to-blue-600", textColor: "text-cyan-100" },
                ].map((level, i) => (
                  <div key={i} className={`bg-gradient-to-br ${level.color} rounded-2xl p-6 text-center hover:scale-105 transition-transform cursor-default`}>
                    <span className="text-4xl block mb-3">{level.emoji}</span>
                    <h4 className={`text-lg font-black ${level.textColor}`}>{level.name}</h4>
                    <p className={`text-sm ${level.textColor} opacity-70 mt-1`}>Vanaf {level.pts} pts</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* For Employers */}
      <section id="employers" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <div>
                <span className="inline-block text-purple-600 font-bold text-sm uppercase tracking-widest mb-4">Voor werkgevers</span>
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                  Personeel nodig voor horeca, hotels of evenementen?
                </h2>
                <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                  Met meer dan 800+ gemotiveerde medewerkers levert EXTRA altijd het juiste personeel. 
                  Of het nu gaat om een groot evenement, last-minute horecapersoneel of betrouwbare ondersteuning in je hotel.
                </p>
                <div className="space-y-4 mb-10">
                  {[
                    "Getraind en gemotiveerd personeel",
                    "Beschikbaar voor last-minute aanvragen",
                    "NEN 4400-1 gecertificeerd",
                    "Landelijk actief met focus op de Randstad",
                    "Eigen app voor snelle inzet en planning",
                    "Dedicated accountmanager",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => scrollTo("contact")} className="group bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold px-8 py-4 rounded-full text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-1 flex items-center gap-2">
                  Direct personeel aanvragen
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </RevealSection>
            <RevealSection delay={200}>
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-gray-100">
                  <img src={appScreenshot5} alt="EXTRA voor werkgevers" className="w-full" />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl shadow-purple-500/15 border border-purple-100 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">15 medewerkers</p>
                      <p className="text-xs text-gray-400">Ingepland voor morgen</p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* For Workers */}
      <section id="workers" className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection delay={200} className="order-2 lg:order-1">
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10">
                  <img src={appScreenshot2} alt="EXTRA voor werknemers" className="w-full" />
                </div>
                <div className="absolute -top-6 -left-6 bg-white rounded-2xl shadow-xl shadow-purple-500/15 border border-purple-100 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⚡</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">€450</p>
                      <p className="text-xs text-gray-400">Direct op je rekening</p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
            <RevealSection className="order-1 lg:order-2">
              <div>
                <span className="inline-block text-purple-600 font-bold text-sm uppercase tracking-widest mb-4">Voor werkzoekenden</span>
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                  Jouw flexibele bijbaan met echte voordelen
                </h2>
                <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                  Zoek je een bijbaan in de horeca, evenementen of hotels waarbij je zélf bepaalt wanneer je werkt 
                  én snel wordt uitbetaald? Bij EXTRA kies je eenvoudig via onze app.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-10">
                  {[
                    { icon: "⚡", title: "Direct betaald", desc: "Salaris binnen 1 dag" },
                    { icon: "📱", title: "Kies je diensten", desc: "Alles via de app" },
                    { icon: "🎁", title: "Verdien rewards", desc: "Punten voor elke shift" },
                    { icon: "💎", title: "Exclusieve deals", desc: "TrainMore, H&M en meer" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all">
                      <span className="text-2xl block mb-2">{item.icon}</span>
                      <h4 className="font-bold text-gray-900 mb-0.5">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => scrollTo("contact")} className="group bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold px-8 py-4 rounded-full text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-1 flex items-center gap-2">
                  Solliciteer nu
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* Venues / Events showcase */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-block text-purple-600 font-bold text-sm uppercase tracking-widest mb-4">Onze locaties</span>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
                Verzorgd en getraind personeel voor top evenementen
              </h2>
            </div>
          </RevealSection>
          <RevealSection delay={200}>
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10">
              <img src={appScreenshot4} alt="Evenementen" className="w-full" />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="inline-block text-purple-600 font-bold text-sm uppercase tracking-widest mb-4">FAQ</span>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900">Veelgestelde vragen</h2>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="bg-white rounded-3xl shadow-lg shadow-purple-500/5 border border-gray-100 px-8">
              <FAQItem
                question="Hoe snel word ik uitbetaald?"
                answer="Via de JIXBEE app staat je salaris al binnen één dag op je rekening. Na elke dienst wordt je betaling direct verwerkt."
              />
              <FAQItem
                question="Wat zijn EXTRA punten?"
                answer="EXTRA punten verdien je automatisch bij elke dienst die je werkt en door challenges te voltooien. Je kunt ze inwisselen voor beloningen zoals AirPods, sportabonnementen, kortingen en meer."
              />
              <FAQItem
                question="Hoe werken de statussen?"
                answer="Je begint als Bronze en klimt naar Silver (5.000 pts), Gold (10.000 pts) en Diamond (15.000 pts). Elke status geeft toegang tot exclusievere beloningen en voordelen."
              />
              <FAQItem
                question="Kan ik zelf mijn diensten kiezen?"
                answer="Ja! Via de EXTRA app zie je alle beschikbare diensten en kies je zelf wanneer en waar je wilt werken. Jij hebt de controle."
              />
              <FAQItem
                question="Voor welke bedrijven kan ik werken?"
                answer="We werken samen met top locaties in de horeca, hotels en evenementen. Denk aan Arena, RAI Amsterdam, Kurhaus, en vele restaurants en hotels."
              />
              <FAQItem
                question="Hoe vraag ik personeel aan?"
                answer="Neem contact met ons op via het formulier onderaan deze pagina of bel direct. We kunnen vaak al binnen 24 uur personeel leveren."
              />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <XShape className="text-white top-[15%] left-[8%]" size={100} rotate={-18} opacity={0.045} />
        <XShape className="text-white bottom-[20%] right-[10%]" size={60} rotate={30} opacity={0.035} />
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <RevealSection>
            <span className="text-5xl mb-6 block">🚀</span>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
              Klaar om te starten?
            </h2>
            <p className="text-lg text-purple-200 mb-10 max-w-2xl mx-auto leading-relaxed">
              Of je nu personeel zoekt of een flexibele bijbaan wilt met echte voordelen — 
              bij EXTRA ben je aan het juiste adres.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:info@doehetextra.nl" className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                Personeel aanvragen
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/sollicitatieformulier" className="group border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                Solliciteer nu
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
                Uitzendbureau voor horeca, hotels en evenementen. Met ons unieke EXTRAATJE beloningssysteem.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Werkgevers</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#employers" className="hover:text-purple-400 transition-colors">Personeel aanvragen</a></li>
                <li><a href="#about" className="hover:text-purple-400 transition-colors">Waarom EXTRA</a></li>
                <li><a href="#faq" className="hover:text-purple-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Werkzoekenden</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/sollicitatieformulier" className="hover:text-purple-400 transition-colors">Solliciteren</a></li>
                <li><a href="#rewards" className="hover:text-purple-400 transition-colors">EXTRAATJE Rewards</a></li>
                <li><a href="#workers" className="hover:text-purple-400 transition-colors">Voordelen</a></li>
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
