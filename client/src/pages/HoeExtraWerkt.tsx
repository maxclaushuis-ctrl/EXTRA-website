import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import {
  ArrowRight, ChevronRight, Zap, Phone, UserCheck, Clock,
  TrendingUp, MessageCircle, Briefcase, Gift, Star,
  Shield, CheckCircle2, Users, Building2, Sparkles,
  ThumbsUp, Target, Award, BarChart3, Heart, Flame
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";

/* ── ANIMATION ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.07, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── PATTERN BACKGROUNDS ── */
function XPatternBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[
        { left: "4%", top: "10%", w: 180, rot: 15, op: 0.07 },
        { left: "77%", top: "14%", w: 140, rot: -8, op: 0.05 },
        { left: "47%", top: "68%", w: 160, rot: 25, op: 0.06 },
      ].map((x, i) => (
        <div key={i} className="absolute" style={{
          left: x.left, top: x.top, width: x.w, height: x.w,
          transform: `rotate(${x.rot}deg)`, opacity: x.op,
          WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          backgroundColor: "rgba(139,92,246,1)",
        }} />
      ))}
    </div>
  );
}

function XPatternBgDark() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[
        { left: "5%", top: "8%", w: 220, rot: 15, op: 0.1 },
        { left: "78%", top: "52%", w: 260, rot: -20, op: 0.08 },
      ].map((x, i) => (
        <div key={i} className="absolute" style={{
          left: x.left, top: x.top, width: x.w, height: x.w,
          transform: `rotate(${x.rot}deg)`, opacity: x.op,
          WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          backgroundColor: "rgba(255,255,255,0.9)",
        }} />
      ))}
    </div>
  );
}

/* ── STEP CARD ── */
function StepCard({ step, icon: Icon, title, desc, color, delay, isLast = false }: {
  step: number; icon: React.ElementType; title: string; desc: string;
  color: string; delay: number; isLast?: boolean;
}) {
  return (
    <RevealSection delay={delay}>
      <div className="relative flex gap-5 sm:gap-6">
        {/* connector line */}
        {!isLast && (
          <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 to-transparent" />
        )}
        {/* icon circle */}
        <div className={`relative flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-lg z-10`}>
          <Icon className="w-5 h-5 text-white" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border-2 border-purple-200 flex items-center justify-center text-[8px] font-black text-purple-700">
            {step}
          </span>
        </div>
        {/* content */}
        <div className="pb-8 sm:pb-10 flex-1">
          <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1.5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {title}
          </h3>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </RevealSection>
  );
}

/* ── PAGE ── */
export default function HoeExtraWerkt() {
  const [activeTab, setActiveTab] = useState<"werkgever" | "medewerker">("werkgever");

  useEffect(() => {
    document.title = "Hoe EXTRA werkt – Werkwijze voor werkgevers & medewerkers | EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Ontdek hoe EXTRA werkt — van eerste contact tot vaste poule. Duidelijke stappen voor werkgevers en medewerkers. Snel, menselijk en resultaatgericht.");
    setMeta("og:title", "Hoe EXTRA werkt – Werkwijze voor werkgevers & medewerkers", true);
    setMeta("og:description", "EXTRA verbindt het beste horecapersoneel met de mooiste opdrachtgevers. Bekijk onze werkwijze stap voor stap.", true);
    setMeta("og:type", "website", true);
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://www.doehetextra.nl/hoe-extra-werkt";
    return () => { canonical?.remove(); };
  }, []);

  const werkgeverStappen = [
    {
      icon: Phone,
      title: "We komen persoonlijk langs",
      desc: "Samen inventariseren we jouw behoeften, doelstellingen en piekmomenten. We kijken naar wat er nodig is aan flexibele én vaste ondersteuning — op jouw locatie en in jouw tempo.",
      color: "from-purple-500 to-violet-600",
    },
    {
      icon: Shield,
      title: "Raamovereenkomst & onboarding",
      desc: "Voordat we starten ontvang je een raamovereenkomst die voldoet aan alle wet- & regelgeving — inclusief ABU, Wet DBA, StiPP, NEN en identiteitscontroles. Pas daarna gaan we live.",
      color: "from-indigo-500 to-purple-600",
    },
    {
      icon: Target,
      title: "Sourcing & selectie op maat",
      desc: "We combineren drie bronnen: onze bestaande poule, de meest passende kandidaten via targeting en sourcing op maat wanneer nodig. Altijd de juiste match, niet de snelste.",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: UserCheck,
      title: "Gesprekken & beoordeling",
      desc: "Alle kandidaten komen eerst bij ons langs op kantoor. We beoordelen houding, representativiteit, ervaring, skills en betrouwbaarheid. Elke kandidaat krijgt scores die terugkomen in planning en rapportages.",
      color: "from-cyan-500 to-blue-600",
    },
    {
      icon: Users,
      title: "Opbouw van een vaste poule",
      desc: "We stellen een vaste poule samen van kandidaten die geschikt zijn, graag bij jou willen werken en goed matchen met jouw cultuur en verwachtingen.",
      color: "from-teal-500 to-cyan-600",
    },
    {
      icon: Clock,
      title: "Planning & communicatie",
      desc: "Je maakt diensten aan via het portaal of direct via je accountmanager. Wij verzorgen de volledige planning — altijd de best scorende kandidaten, altijd op tijd.",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: BarChart3,
      title: "Evaluatie na elke shift",
      desc: "Na elke dienst wordt elke medewerker beoordeeld. De beste medewerkers blijven vanzelf over in de poule. Zo groeit de kwaliteit automatisch mee met jouw locatie.",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: Sparkles,
      title: "Continu verbeteren via EXTRAATJE",
      desc: "Medewerkers worden beloond via ons puntensysteem EXTRAATJE — voor microprestaties als op tijd komen, hoge beoordelingen, juiste houding en extra inzet. Dit geeft EXTRA unieke inzichten in kwaliteit en motivatie.",
      color: "from-orange-500 to-amber-500",
      highlight: true,
    },
  ];

  const medewerkerStappen = [
    {
      icon: UserCheck,
      title: "Aanmelden",
      desc: "Meld je aan via de website, WhatsApp of Indeed. Het duurt minder dan 2 minuten om je eerste gegevens in te vullen.",
      color: "from-purple-500 to-violet-600",
    },
    {
      icon: MessageCircle,
      title: "Sollicitatiegesprek bij EXTRA",
      desc: "We leren elkaar kennen op kantoor. We bespreken jouw skills, ervaring, beschikbaarheid en voorkeuren — zodat we je echt goed kunnen inzetten.",
      color: "from-indigo-500 to-purple-600",
    },
    {
      icon: Target,
      title: "Profiel & poule",
      desc: "Op basis van je skills, persoonlijkheid en beschikbaarheid plaatsen we jou in de juiste poule(s). Zo krijg je alleen shifts aangeboden die bij jou passen.",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: Briefcase,
      title: "Werken via EXTRA",
      desc: "Via het portaal of via de planning krijg je shifts aangeboden — snel, duidelijk en flexibel. Jij kiest wat bij je past, wij regelen de rest.",
      color: "from-teal-500 to-cyan-600",
    },
    {
      icon: Gift,
      title: "EXTRAATJE – punten verdienen",
      desc: "Bij elke shift verdien je automatisch punten via EXTRAATJE. Voor microprestaties als op tijd komen, hoge beoordelingen en extra inzet krijg je bonuspunten. Ruil ze in voor echte beloningen.",
      color: "from-orange-500 to-amber-500",
      highlight: true,
    },
  ];

  const currentStappen = activeTab === "werkgever" ? werkgeverStappen : medewerkerStappen;

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      <PublicNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}>
        <XPatternBgDark />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-32 sm:pt-40 pb-20 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-white/20">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-white/90 text-xs sm:text-sm font-semibold">Simpel, snel & menselijk</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.06] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
            Hoe{" "}
            <span className="relative inline-block">
              <span className="relative z-10">EXTRA werkt</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-100/90 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            EXTRA verbindt het beste horecapersoneel met de mooiste opdrachtgevers. Een geautomatiseerde én mensgerichte aanpak — transparant, betrouwbaar en razendsnel.
          </p>
          {/* Tab switcher in hero */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {(["werkgever", "medewerker"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-white text-purple-900 shadow-xl"
                    : "bg-white/15 text-white border border-white/25 hover:bg-white/25"
                }`}
              >
                {tab === "werkgever" ? "Voor werkgevers" : "Voor medewerkers"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="bg-white border-b border-purple-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-gray-500 font-semibold">
            {[
              { icon: Shield, label: "ABU & Wet DBA compliant" },
              { icon: Award, label: "StiPP gecertificeerd" },
              { icon: Users, label: "900+ actieve medewerkers" },
              { icon: ThumbsUp, label: "98% klanttevredenheid" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-purple-500" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <section className="relative bg-white py-14 sm:py-20 lg:py-28 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">

          {/* Tab switcher */}
          <RevealSection>
            <div className="flex items-center gap-3 mb-10 sm:mb-14">
              {(["werkgever", "medewerker"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex items-center gap-2 px-5 sm:px-7 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                    activeTab === tab
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-500/25"
                      : "bg-white text-gray-500 hover:bg-purple-50 hover:text-purple-700 border-2 border-purple-100"
                  }`}
                >
                  {tab === "werkgever" ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  {tab === "werkgever" ? "Voor werkgevers" : "Voor medewerkers"}
                </button>
              ))}
            </div>
          </RevealSection>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* LEFT: intro card */}
            <RevealSection>
              <div className="lg:sticky lg:top-28">
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">
                  {activeTab === "werkgever" ? "Werkwijze" : "Jouw route"}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {activeTab === "werkgever"
                    ? "Van eerste gesprek tot vaste, betrouwbare poule"
                    : "Van aanmelding tot beloond werken"}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6 text-sm sm:text-base">
                  {activeTab === "werkgever"
                    ? "We denken met je mee, zorgen voor compliance, selecteren op kwaliteit en verbeteren continu. Jij focust op je gasten, wij regelen de mensen."
                    : "Bij EXTRA ben je geen nummer. Je krijgt begeleiding, flexibele shifts en een beloningssysteem dat jou motiveert om elke dag je best te doen."}
                </p>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {(activeTab === "werkgever" ? [
                    { num: "8", label: "Stappen naar kwaliteit" },
                    { num: "150+", label: "Tevreden opdrachtgevers" },
                    { num: "24u", label: "Gemiddelde reactietijd" },
                    { num: "100%", label: "Compliance gegarandeerd" },
                  ] : [
                    { num: "5", label: "Simpele stappen" },
                    { num: "900+", label: "Actieve medewerkers" },
                    { num: "9.250", label: "Gem. punten per medewerker" },
                    { num: "30+", label: "Partner deals & beloningen" },
                  ]).map(({ num, label }) => (
                    <div key={label} className="bg-purple-50 rounded-xl p-3.5 border border-purple-100 text-center">
                      <p className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{num}</p>
                      <p className="text-[11px] text-gray-500 font-semibold mt-0.5 leading-snug">{label}</p>
                    </div>
                  ))}
                </div>

                {/* CTA card */}
                <div className="mt-6 bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
                  <XPatternBgDark />
                  <div className="relative z-10">
                    <p className="text-sm font-black mb-3 leading-snug">
                      {activeTab === "werkgever"
                        ? "Klaar om te starten? Plan een kennismaking."
                        : "Meld je nu aan als medewerker bij EXTRA."}
                    </p>
                    <a
                      href={activeTab === "werkgever" ? "/personeelsaanvraag" : "/aanmelden"}
                      className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold text-sm px-4 py-2.5 rounded-full hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                      {activeTab === "werkgever" ? "Personeel aanvragen" : "Aanmelden"} <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* RIGHT: steps */}
            <div>
              {currentStappen.map((stap, i) => (
                <div key={`${activeTab}-${i}`}>
                  {stap.highlight ? (
                    /* ── EXTRAATJE HIGHLIGHT BOX ── */
                    <RevealSection delay={i * 60}>
                      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-orange-200 shadow-xl shadow-orange-500/10 mb-2">
                        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-5 sm:p-6">
                          <div className="flex items-start gap-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${stap.color} flex items-center justify-center shadow-lg`}>
                              <stap.icon className="w-5 h-5 text-white" />
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border-2 border-orange-200 flex items-center justify-center text-[8px] font-black text-orange-700">
                                {i + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                  {stap.title}
                                </h3>
                                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-orange-500 text-white px-2.5 py-0.5 rounded-full">
                                  <Flame className="w-2.5 h-2.5" /> USP
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed mb-3">{stap.desc}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {["Op tijd komen", "Hoge beoordeling", "Juiste houding", "Geen no-shows", "Extra inzet"].map(tag => (
                                  <span key={tag} className="text-[10px] font-bold bg-white border border-orange-200 text-orange-700 px-2 py-0.5 rounded-full">
                                    ✓ {tag}
                                  </span>
                                ))}
                              </div>
                              <Link href="/extraatje" className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-900 mt-3 transition-colors">
                                Meer over EXTRAATJE <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </RevealSection>
                  ) : (
                    /* ── REGULAR STEP ── */
                    <StepCard
                      step={i + 1}
                      icon={stap.icon}
                      title={stap.title}
                      desc={stap.desc}
                      color={stap.color}
                      delay={i * 60}
                      isLast={i === currentStappen.length - 2}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── USP STRIP ── */}
      <section className="py-12 sm:py-16" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-8 sm:mb-10">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Waarom EXTRA</span>
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat maakt EXTRA anders?
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              { icon: Heart, title: "Menselijk contact", desc: "Geen chatbot, maar een vast contactpersoon die jou en jouw situatie kent.", color: "from-pink-500 to-rose-500" },
              { icon: Zap, title: "Razendsnel schakelen", desc: "Last-minute krapte? Wij reageren snel — ook 's avonds en in het weekend.", color: "from-purple-500 to-violet-600" },
              { icon: Shield, title: "Compliance & zekerheid", desc: "Volledig ABU-gecertificeerd. Geen juridische verrassingen, wel volledige bescherming.", color: "from-indigo-500 to-blue-600" },
              { icon: Star, title: "Kwaliteitsscores", desc: "Elk gesprek, elke shift, elke beoordeling. Wij meten kwaliteit van begin tot eind.", color: "from-amber-500 to-orange-500" },
              { icon: Sparkles, title: "EXTRAATJE puntensysteem", desc: "Gemotiveerde medewerkers presteren beter. Ons beloningssysteem zorgt voor dat extraatje.", color: "from-green-500 to-emerald-500" },
              { icon: TrendingUp, title: "Groeit met jou mee", desc: "Van één locatie tot ketenbeheer. EXTRA schaalt mee met jouw ambities.", color: "from-cyan-500 to-teal-500" },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <RevealSection key={title} delay={i * 60}>
                <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-200 hover:-translate-y-1 transition-all h-full">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERNAL LINKS ── */}
      <section className="relative bg-white py-12 sm:py-16 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-8 sm:mb-10">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Meer ontdekken</span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Verken EXTRA verder</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
              {[
                { href: "/extraatje", icon: Gift, title: "EXTRAATJE beloningssysteem", desc: "Punten, challenges en echte beloningen voor medewerkers.", color: "from-orange-500 to-amber-500" },
                { href: "/aanmelden", icon: UserCheck, title: "Aanmelden als medewerker", desc: "Start je profiel en verdien bij je eerste shift.", color: "from-purple-500 to-violet-600" },
                { href: "/personeelsaanvraag", icon: Building2, title: "Personeel aanvragen", desc: "Vul in wat je nodig hebt en wij schakelen direct.", color: "from-indigo-500 to-blue-600" },
              ].map(({ href, icon: Icon, title, desc, color }) => (
                <Link key={href} href={href} className="group block bg-white rounded-2xl p-5 border-2 border-purple-100 shadow-sm hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:gap-2 transition-all">
                    Bekijk <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 py-16 sm:py-24 overflow-hidden">
        <XPatternBgDark />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-5 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
              <Zap className="w-4 h-4" /> Direct starten
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om samen te werken?
            </h2>
            <p className="text-purple-200/80 text-base sm:text-lg mb-8 leading-relaxed">
              Of je nu op zoek bent naar top horecapersoneel of zelf wilt werken — EXTRA heeft de aanpak, de mensen en het systeem.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2">
                Personeel aanvragen <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/aanmelden" className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2">
                Aanmelden als medewerker <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
