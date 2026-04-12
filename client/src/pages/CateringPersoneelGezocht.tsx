import { useEffect, useRef, useState } from "react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  ArrowRight, Check, Phone, Shield, Clock, Star, Heart,
  TrendingUp, Users, Zap, Gift, Building2, UserCheck,
  BookOpen, Tag, ThumbsUp, MessageCircle, Sparkles,
  Utensils, GlassWater, ChefHat, BarChart3, Truck
} from "lucide-react";
import heroBgImage from "@assets/BAR_BEDIENING_FINAL_002_1775574495470.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import sollicitatieImg from "@assets/Sollicitatieformulier_1772893764120.webp";
import screenshotGebruikers from "@assets/Gebruikers_1772098047298.webp";
import screenshotProfiel from "@assets/Medewerkersprofiel_1772098064753.webp";
import screenDashboard from "@assets/IMG_9066_1773314165933.webp";
import screenRewards from "@assets/IMG_9067_1773314165933.webp";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.webp";
import screenRanglijst from "@assets/IMG_9068_1773314165933.webp";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
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

function XPatternBg({ className = "", count = 3, opacity = 0.08, color = "rgba(139,92,246,1)" }: { className?: string; count?: number; opacity?: number; color?: string }) {
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
            WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
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
        backgroundRepeat: "repeat", backgroundSize: "256px 256px",
        opacity: 0.4, mixBlendMode: "overlay",
      }}
    />
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard" },
  { key: "beloningen", img: screenRewards, label: "Beloningen" },
  { key: "uitdagingen", img: screenUitdagingen, label: "Uitdagingen" },
  { key: "ranglijst", img: screenRanglijst, label: "Ranglijst" },
];

export default function CateringPersoneelGezocht() {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    document.title = "Cateringpersoneel inhuren | bediening, runners en chefs | EXTRA";

    const setMeta = (nameOrProp: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, nameOrProp); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
      el.setAttribute("href", href);
    };
    const addSchema = (id: string, data: object) => {
      document.getElementById(id)?.remove();
      const s = document.createElement("script");
      s.id = id; s.type = "application/ld+json"; s.text = JSON.stringify(data);
      document.head.appendChild(s);
    };

    setMeta("description", "Cateringpersoneel nodig? EXTRA levert ervaren bediening, runners, chefs en keukenondersteuning voor cateraars en grote events. Flexibel en betrouwbaar.");
    setLink("canonical", "https://www.doehetextra.nl/cateringpersoneel-inhuren");
    setMeta("og:title", "Cateringpersoneel inhuren | bediening, runners en chefs | EXTRA", "property");
    setMeta("og:description", "Cateringpersoneel nodig? EXTRA levert ervaren bediening, runners, chefs en keukenondersteuning voor cateraars en grote events. Flexibel en betrouwbaar.", "property");
    setMeta("og:url", "https://www.doehetextra.nl/cateringpersoneel-inhuren", "property");
    setMeta("og:type", "website", "property");

    addSchema("catering-faq-schema", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Kunnen jullie personeel leveren voor grote catering events?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. EXTRA heeft ruime ervaring met het leveren van personeel voor grote catering events. Van kleine bedrijfsdiners tot cateringopdrachten voor honderden gasten — we leveren ervaren bediening, runners en keukenondersteuning." } },
        { "@type": "Question", "name": "Hoe snel kunnen jullie cateringpersoneel leveren?", "acceptedAnswer": { "@type": "Answer", "text": "In veel gevallen kunnen we binnen 48 uur geschikt cateringpersoneel leveren. Dankzij onze pool van ervaren medewerkers kunnen we snel schakelen bij uitval of last-minute aanvragen." } },
        { "@type": "Question", "name": "Hebben jullie personeel met cateringervaring?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Veel van onze medewerkers hebben ruime cateringervaring en zijn gewend aan het werken op wisselende locaties. Ze kennen de dynamiek van cateringopdrachten: snel opstellen, efficiënt serveren en een soepele afbouw." } },
        { "@type": "Question", "name": "Kunnen jullie bediening en runners leveren voor catering?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. We leveren ervaren bediening, dinerlopers, runners en barpersoneel voor cateringopdrachten van elke omvang. Iedereen is geselecteerd op cateringervaring en werkhouding." } },
        { "@type": "Question", "name": "Kunnen jullie ook keukenondersteuning leveren voor catering?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. EXTRA levert ook keukenondersteuning voor cateraars: keukenmedewerkers, afwassers en keukenhulpen die de keuken draaiende houden tijdens grote cateringopdrachten." } },
      ]
    });

    const interval = setInterval(() => setActiveScreen(p => (p + 1) % appScreens.length), 3500);
    return () => {
      clearInterval(interval);
      document.getElementById("catering-faq-schema")?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <GrainOverlay />
      <PublicNav />

      {/* ═══════════════════════════════════════════════════ */}
      {/* 1. HERO                                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, #2d0663 0%, #4a0e96 35%, #5b16a8 65%, #6d28d9 100%)" }}>

        {/* X-patroon achtergrond */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { left: "3%",  top: "8%",  w: 240, rot:  12, op: 0.10 },
            { left: "6%",  top: "58%", w: 180, rot: -15, op: 0.07 },
            { left: "42%", top: "72%", w: 140, rot:  20, op: 0.05 },
          ].map((x, i) => (
            <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity: x.op, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: "rgba(255,255,255,0.9)" }} />
          ))}
        </div>

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-[38%] -translate-y-1/2 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-4 w-72 h-72 bg-violet-800/30 rounded-full blur-3xl pointer-events-none" />

        {/* Hero foto — volledig scherm */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={heroBgImage}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
            style={{
              objectPosition: "center top",
              filter: "contrast(1.08) saturate(1.15) brightness(1.04)",
            }}
          />
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 42% 68% at 68% 46%, rgba(255,248,255,0.12) 0%, rgba(220,180,255,0.04) 55%, transparent 75%)"
          }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to right, rgba(29,5,73,1) 0%, rgba(29,5,73,1) 32%, rgba(45,6,99,0.82) 46%, rgba(58,8,128,0.38) 56%, rgba(72,14,148,0.10) 65%, transparent 72%)"
          }} />
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: "22%",
            background: "linear-gradient(to top, rgba(29,5,73,0.82) 0%, rgba(29,5,73,0.30) 50%, transparent 100%)"
          }} />
          <div className="absolute top-0 left-0 right-0" style={{
            height: "18%",
            background: "linear-gradient(to bottom, rgba(29,5,73,0.50) 0%, transparent 100%)"
          }} />
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Utensils className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">Specialist in cateringpersoneel</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 gecertificeerd</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Hij rent al.<br />
              Jouw tafel<br />
              <span className="relative inline-block">
                <span className="relative z-10">wordt bediend.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-70 rounded-sm" />
              </span>
            </h1>
            <p className="text-base sm:text-xl text-purple-100/90 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              Snel restaurantpersoneel inhuren? EXTRA levert de helden die jouw zaak draaiende houden.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Vraag cateringpersoneel aan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/30 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                <Phone className="w-5 h-5" />
                Direct contact
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              {[
                { icon: Check, text: "Iedereen in loondienst" },
                { icon: Star, text: "Ervaring met grote catering events" },
                { icon: Zap, text: "Snel inzetbaar op locatie" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/80">
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* STATS STRIP                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-0 bg-gradient-to-r from-purple-950 to-indigo-950 overflow-hidden border-b border-purple-800/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-purple-700/30">
            {[
              { number: "800+", label: "Actieve medewerkers", icon: Users },
              { number: "Flex", label: "Opschalen op aanvraag", icon: Zap },
              { number: "48u", label: "Gemiddelde levertijd", icon: Clock },
              { number: "24/7", label: "Bereikbaar voor spoed", icon: Shield },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center py-7 sm:py-9 px-4 sm:px-8 text-center gap-1 group hover:bg-white/5 transition-colors duration-300">
                <stat.icon className="w-4 h-4 text-purple-400 mb-1 group-hover:text-yellow-400 transition-colors" />
                <span className="text-2xl sm:text-4xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>{stat.number}</span>
                <span className="text-xs sm:text-sm text-purple-300/80 font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 2. FUNCTIES VOOR CATERAARS                         */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="functies" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Users className="w-4 h-4" /> Functies voor cateraars
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Elk soort catering.{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Elke rol gevuld.</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2 sm:h-3.5 bg-gradient-to-r from-yellow-300 to-orange-400 -skew-x-3 z-0 opacity-50 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-5 max-w-2xl mx-auto">
                Van kleinschalige bedrijfsdiners tot grote gala's met honderden gasten. EXTRA levert voor iedere cateringopdracht de juiste mensen. Ervaren, flexibel en gewend aan wisselende locaties.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Utensils,
                title: "Bediening",
                desc: "Ervaren bedienend personeel voor diners, buffetten en recepties. Gastgericht, professioneel en gewend aan het tempo van cateringopdrachten.",
                tags: ["Dinerservice", "Buffet", "Receptie", "Formeel & informeel"],
                color: "from-purple-600 to-purple-800",
              },
              {
                icon: Users,
                title: "Dinerlopers",
                desc: "Snelle diner runners die gerechten uitserveren, buffetten aanvullen en het tempo van grote diners ondersteunen.",
                tags: ["Uitserveren", "Schalen aanvullen", "Grote groepen", "Doorloop"],
                color: "from-indigo-500 to-purple-600",
              },
              {
                icon: GlassWater,
                title: "Barpersoneel",
                desc: "Ervaren bartenders voor drankservice tijdens cateringevents. Representatief, snel en gewend om hoge volumes te draaien.",
                tags: ["Cocktails", "Wine service", "Drankservice", "Hoog tempo"],
                color: "from-pink-500 to-purple-600",
              },
              {
                icon: Zap,
                title: "Runners",
                desc: "Energieke runners voor logistieke ondersteuning tijdens cateringopdrachten. Van keuken naar zaal en terug. Snel, betrouwbaar en altijd op de juiste plek.",
                tags: ["Keuken-zaal", "Transport", "Logistiek", "Ondersteuning"],
                color: "from-blue-500 to-indigo-600",
              },
              {
                icon: Sparkles,
                title: "Catering medewerkers",
                desc: "Allround cateringmedewerkers die op wisselende locaties inzetbaar zijn en het volledige cateringproces begrijpen. Van opbouw tot service en afbouw.",
                tags: ["Allround", "Opstellen", "Service", "Afbouw"],
                color: "from-orange-500 to-pink-600",
              },
              {
                icon: ChefHat,
                title: "Keukenondersteuning",
                desc: "Betrouwbare keukenondersteuning voor cateraars. Keukenmedewerkers, afwassers en keukenhulpen die zorgen dat de keuken blijft draaien.",
                tags: ["Keukenmedewerker", "Afwasser", "Keukenhulp", "Voorbereiding"],
                color: "from-green-500 to-emerald-600",
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-[2rem] shadow-lg shadow-purple-500/5 border-2 border-purple-100 p-7 sm:p-8 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-50 to-transparent rounded-bl-[100%] opacity-60" />
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-5">{item.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, j) => (
                      <span key={j} className="text-xs font-semibold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100">{tag}</span>
                    ))}
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={500}>
            <div className="text-center mt-10 sm:mt-14">
              <a href="/personeelsaanvraag" className="group inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-8 py-4 rounded-full hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-0.5 text-base">
                Vraag cateringpersoneel aan
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 3. WAAROM CATERAARS VOOR EXTRA KIEZEN              */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="waarom-extra" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Zap className="w-4 h-4" /> Waarom EXTRA
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Catering draait op mensen.<br className="hidden sm:block" />
                <span className="text-purple-600">Wij leveren de juiste.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-5 max-w-2xl mx-auto">
                Cateraars werken op wisselende locaties met strakke tijdschema's en hoge kwaliteitseisen. EXTRA levert personeel dat daarin meebeweegt zonder gedoe.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                stat: "Flexibel",
                statLabel: "opschalen op aanvraag",
                title: "Flexibel opschalen",
                desc: "Van kleine diners tot grote events met honderden gasten. EXTRA helpt cateraars snel op en af te schalen met ervaren personeel.",
                accent: "from-purple-500 to-purple-700",
              },
              {
                stat: "100%",
                statLabel: "persoonlijk geselecteerd",
                title: "Persoonlijk geselecteerd personeel",
                desc: "Iedere medewerker wordt persoonlijk gesproken voordat hij of zij via EXTRA werkt. We selecteren op houding, service en representativiteit.",
                accent: "from-indigo-500 to-purple-600",
              },
              {
                stat: "Overal",
                statLabel: "inzetbaar in de regio",
                title: "Gewend aan wisselende locaties",
                desc: "Cateringpersoneel werkt zelden op dezelfde plek. Onze medewerkers zijn mobiel, flexibel en gewend aan snel opstarten op een nieuwe locatie.",
                accent: "from-pink-500 to-rose-600",
              },
              {
                stat: "24/7",
                statLabel: "bereikbaar voor planners",
                title: "Altijd bereikbaar",
                desc: "Ook buiten kantooruren. Onze planners staan klaar wanneer je snel moet schakelen.",
                accent: "from-blue-500 to-indigo-600",
              },
              {
                stat: "★ 4.8",
                statLabel: "gemiddelde beoordeling",
                title: "Continu beoordeeld op kwaliteit",
                desc: "Na iedere dienst verzamelen we feedback van opdrachtgevers. Alleen medewerkers die structureel goed presteren blijven actief.",
                accent: "from-amber-500 to-orange-500",
              },
              {
                stat: "0%",
                statLabel: "ZZP-risico voor jou",
                title: "Geen zzp risico",
                desc: "Alle medewerkers werken bij ons in loondienst en voldoen aan de NEN 4400 1 norm.",
                accent: "from-green-500 to-emerald-600",
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group relative bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-8 border-2 border-gray-100 hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-500/8 hover:-translate-y-1.5 transition-all duration-300 h-full shadow-sm overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300"
                    style={{ background: `radial-gradient(circle, rgb(139,92,246) 0%, transparent 70%)` }}
                  />
                  <div className="inline-flex items-baseline gap-1.5 mb-1">
                    <span className={`text-3xl sm:text-4xl font-black bg-gradient-to-br ${item.accent} bg-clip-text text-transparent`} style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {item.stat}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{item.statLabel}</p>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2 sm:mb-3 leading-snug">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 4. LOGO'S VAN CATERINGKLANTEN                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">
              Vertrouwd door cateraars en cateringopdrachtgevers
            </p>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 lg:gap-20">
              {[
                { src: logoSelectCatering, alt: "Select Catering" },
                { src: logoAppel, alt: "Appèl" },
                { src: logoHetePeper, alt: "Hete Peper" },
                { src: logoFunda, alt: "Funda" },
              ].map((logo, i) => (
                <div key={i} className="hover:scale-105 transition-transform duration-300">
                  <img src={logo.src} alt={logo.alt} className="h-10 sm:h-14 lg:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 5. KLANTCASE CATERING                              */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="klantcase" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/50 px-4 sm:px-5 py-2 rounded-full">
                <MessageCircle className="w-4 h-4" /> Klantcases
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hoe cateraars EXTRA ervaren
              </h2>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                company: "Select Catering",
                quote: "EXTRA levert altijd betrouwbaar personeel voor onze cateringopdrachten. Ze zijn gewend aan wisselende locaties, snel inzetbaar en begrijpen het tempo van een grote dienst.",
                name: "Mark de Vries",
                role: "Operations Manager",
                results: ["Vaste bedieningspoule opgebouwd in 2 maanden", "Consistent hoge kwaliteit over 50+ events"],
              },
              {
                company: "Hete Peper",
                quote: "Bij grote cateringevents schalen we snel op. EXTRA begrijpt dat: ze leveren op korte termijn ervaren personeel dat direct inzetbaar is en past binnen onze werkwijze.",
                name: "Lisa Jansen",
                role: "Event Manager",
                results: ["Snel opgeschaald voor events tot 300 gasten", "Dezelfde gezichten bij terugkerende events"],
              },
              {
                company: "Appèl Amsterdam",
                quote: "De medewerkers van EXTRA kennen het vak. Ze zijn representatief, servicegericht en weten wat ze doen. Dat merk je direct aan de kwaliteit van de service bij onze gasten.",
                name: "Sophie de Vries",
                role: "Operationeel Manager",
                results: ["Vaste cateringpoule voor weekenddiensten", "20% minder no-shows ten opzichte van voorheen"],
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 h-full shadow-sm flex flex-col">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Utensils className="w-4 h-4 text-purple-500" />
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
      {/* 6. ZO SELECTEERT EXTRA DE JUISTE MENSEN            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="selectie" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#f3f0fa" }}>
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <div>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/80 px-4 sm:px-5 py-2 rounded-full">
                  <UserCheck className="w-4 h-4" /> Selectieproces
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Zo selecteert EXTRA{" "}
                  <span className="text-purple-600">de juiste mensen</span>
                </h2>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-10">
                  Cateringpersoneel moet snel schakelen, zich aanpassen aan nieuwe locaties en toch representatief blijven. Daarom selecteren wij streng.
                </p>
                <ul className="space-y-6">
                  {[
                    {
                      icon: Users,
                      title: "Persoonlijke intake",
                      desc: "Iedere medewerker doorloopt een gesprek en beoordeling voordat hij of zij aan de slag kan.",
                    },
                    {
                      icon: Star,
                      title: "Beoordeling na iedere dienst",
                      desc: "Opdrachtgevers geven feedback na elke cateringopdracht. Alleen medewerkers die structureel goed presteren blijven actief.",
                    },
                    {
                      icon: Sparkles,
                      title: "Representativiteit",
                      desc: "Cateringpersoneel staat dicht op de gast. Daarom letten we extra op presentatie en servicehouding.",
                    },
                    {
                      icon: ThumbsUp,
                      title: "Ervaring en flexibiliteit",
                      desc: "We kijken verder dan een CV. Ervaring met wisselende locaties en drukke services telt zwaar mee.",
                    },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 group">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 group-hover:bg-purple-700 transition-all duration-300 shadow-md shadow-purple-500/20">
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="absolute -inset-6 bg-gradient-to-br from-purple-300/20 to-indigo-300/20 rounded-[2rem] blur-3xl" />
                  <div className="relative bg-white rounded-[1.5rem] shadow-2xl shadow-purple-500/15 overflow-hidden border border-purple-100/60 max-w-[480px] w-full">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-3 flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-white/25" />
                        <div className="w-3 h-3 rounded-full bg-white/25" />
                        <div className="w-3 h-3 rounded-full bg-white/25" />
                      </div>
                      <span className="text-white/80 text-xs font-semibold ml-1">EXTRA Sollicitatieformulier</span>
                    </div>
                    <img
                      src={sollicitatieImg}
                      alt="EXTRA beoordelingsformulier — zo meten we kwaliteit van cateringpersoneel"
                      className="w-full object-cover"
                    />
                    <div className="absolute bottom-5 right-5 bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      9.2 Gemiddeld
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 7. CONTINUE KWALITEITSMETING                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="kwaliteit" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Continue kwaliteitsmeting
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Elke catering beter dan<br className="hidden sm:block" /> de vorige
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Na elke cateringopdracht meten we hoe het personeel gepresteerd heeft. Zo weten we wie het beste past bij jouw type catering en zetten we die medewerkers opnieuw in.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-14 max-w-4xl mx-auto">
              {[
                { text: "Na iedere opdracht beoordeling op servicekwaliteit en gedrag" },
                { text: "Betrouwbaarheid en punctualiteit worden bijgehouden" },
                { text: "No shows worden direct geregistreerd" },
                { text: "Top performers krijgen prioriteit bij nieuwe opdrachten" },
                { text: "Vaste poules per opdrachtgever" },
                { text: "Diensthistorie en scores per medewerker inzichtelijk" },
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
                    <p className="text-xs text-gray-500 mt-0.5">Real-time data van alle medewerkers — inclusief cateringplaatsingen</p>
                  </div>
                  <img src={screenshotGebruikers} alt="Dashboard medewerkers overzicht" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-4 text-center">We weten precies wie goed presteert bij welk type catering</p>
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
                  <img src={screenshotProfiel} alt="Individueel medewerkersprofiel" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-4 text-center">Zo selecteren we op bewezen kwaliteit per cateringopdrachtgever</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 8. FAVORIETENPOULES VOOR CATERAARS                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="favorietenpoule" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <div>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                  <Heart className="w-4 h-4" /> Favorietenpoules voor cateraars
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Vaste teams die<br /> jouw catering kennen
                </h2>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8">
                  Veel cateraars werken met terugkerende opdrachtgevers. Met een favorietenpoule bouwt EXTRA een vaste kern van medewerkers die jouw werkwijze en tempo kennen.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Users, text: "Vaste poule per cateringbedrijf opgebouwd op basis van prestaties" },
                    { icon: Heart, text: "Medewerkers kennen jouw werkwijze en kwaliteitsstandaard" },
                    { icon: TrendingUp, text: "Minder briefing nodig en sneller inzetbaar" },
                    { icon: Star, text: "Hogere servicekwaliteit door vertrouwdheid" },
                    { icon: Tag, text: "Tags per medewerker zoals cateringervaring, grote groepen en zelfstandig" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-purple-700" />
                      </div>
                      <span className="text-gray-700 font-medium text-sm sm:text-base">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <a href="/personeelsaanvraag" className="group inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-7 py-3.5 rounded-full hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-0.5">
                  Bouw jouw cateringpoule op <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "🍽️", title: "Vaste bedieningsploeg", desc: "Dezelfde bediening bij elk terugkerend event. Ze kennen jouw standaard en tempo.", tag: "Bediening" },
                  { icon: "🍸", title: "Vaste bartenders", desc: "Barteam dat jouw drankenkaart, glassoorten en servicestijl kent. Geen introductie nodig.", tag: "Bar" },
                  { icon: "⚡", title: "Vaste runners", desc: "Runners die weten hoe jouw logistiek werkt. Snel, betrouwbaar en altijd op de goede plek.", tag: "Logistiek" },
                  { icon: "👨‍🍳", title: "Vaste keukenondersteuning", desc: "Keukenmedewerkers die jouw keukenopstelling en processen kennen. Direct inzetbaar.", tag: "Keuken" },
                ].map((card, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-purple-200 hover:-translate-y-1 transition-all duration-300">
                    <div className="text-3xl mb-3">{card.icon}</div>
                    <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">{card.tag}</div>
                    <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-2">{card.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 9. EXTRAATJE BELONINGSSYSTEEM                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="extraatje" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.1} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/70 px-4 sm:px-5 py-2 rounded-full">
                <Gift className="w-4 h-4" /> EXTRAATje beloningssysteem
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Gemotiveerd personeel levert{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">betere catering</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Cateringpersoneel dat gemotiveerd is presteert beter. Met het EXTRAATje beloningssysteem zorgen we dat medewerkers energie en drive houden bij elke cateringopdracht.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Elke dienst levert punten op", desc: "Medewerkers verdienen punten per opdracht. Goed presteren bij een grote dienst levert extra punten op.", icon: "🏃" },
                { step: "2", title: "Vaker werken hogere status", desc: "Van Bronze naar Diamond. Hoe vaker iemand werkt bij jouw cateringbedrijf hoe hoger de status en betrokkenheid.", icon: "💎" },
                { step: "3", title: "Minder uitval sterkere teams", desc: "Medewerkers die punten opbouwen bij jouw bedrijf komen vaker terug. Dat betekent minder no shows en stabielere teams.", icon: "🎁" },
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
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Wat jouw cateringbedrijf hiervan merkt</h3>
                <ul className="space-y-4">
                  {[
                    { icon: TrendingUp, text: "Hogere motivatie doordat medewerkers ergens voor werken" },
                    { icon: Check, text: "Minder no shows omdat medewerkers punten opbouwen" },
                    { icon: Users, text: "Sterkere teams door vaste gezichten" },
                    { icon: Heart, text: "Betere service door gemotiveerd personeel" },
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
      {/* 10. FAQ VOOR CATERAARS                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <FAQSection
        heading="Veelgestelde vragen over cateringpersoneel"
        faqs={[
          { q: "Kunnen jullie personeel leveren voor grote catering events?", a: "Ja. EXTRA heeft ruime ervaring met grote cateringopdrachten. Van kleinschalige bedrijfsdiners tot events voor honderden gasten — we leveren ervaren bediening, runners, barpersoneel en keukenondersteuning. Neem contact op en we kijken direct wat mogelijk is." },
          { q: "Hoe snel kunnen jullie cateringpersoneel leveren?", a: "In veel gevallen kunnen we binnen 48 uur geschikt cateringpersoneel leveren. Dankzij onze pool van ervaren medewerkers kunnen we snel schakelen bij uitval of last-minute aanvragen voor cateringopdrachten." },
          { q: "Hebben jullie personeel met cateringervaring?", a: "Ja. Veel van onze medewerkers hebben ruime cateringervaring en zijn gewend aan wisselende locaties. Ze kennen de dynamiek van cateringopdrachten: snel opstellen, efficiënt serveren en een soepele afbouw." },
          { q: "Kunnen jullie bediening en runners leveren voor catering?", a: "Ja. We leveren ervaren bediening, dinerlopers, runners en barpersoneel voor cateringopdrachten. Iedereen is geselecteerd op cateringervaring, werkhouding en representativiteit." },
          { q: "Kunnen jullie ook keukenondersteuning leveren voor catering?", a: "Ja. EXTRA levert ook keukenondersteuning voor cateraars: keukenmedewerkers, afwassers en keukenhulpen die de keuken draaiende houden tijdens grote cateringopdrachten." },
          { q: "Kunnen wij een vaste groep medewerkers krijgen voor terugkerende opdrachten?", a: "Ja. EXTRA werkt met favorietenpoules. We bouwen per cateringbedrijf een vaste poule op van medewerkers die jouw werkwijze, jouw standaard en jouw tempo kennen. Minder uitleg, hogere kwaliteit." },
        ]}
      />

      {/* ═══════════════════════════════════════════════════ */}
      {/* 11. STERKE EINDE CTA                               */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="cta" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
              <Utensils className="w-4 h-4" /> Cateringpersoneel nodig?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Vraag direct{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA personeel aan</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Of je nu een eenmalige cateringopdracht hebt of structureel personeel zoekt. EXTRA levert snel, flexibel en betrouwbaar cateringpersoneel dat gewend is aan grote events.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mb-10 sm:mb-14">
              <a
                href="/personeelsaanvraag"
                className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3"
                style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
              >
                Vraag cateringpersoneel aan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3">
                <Phone className="w-5 h-5" />
                Plan een gesprek op kantoor
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {[
                { icon: Shield, text: "NEN-4400-1 gecertificeerd" },
                { icon: Users, text: "Iedereen in loondienst" },
                { icon: Zap, text: "Snel opschalen mogelijk" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/60">
                  <item.icon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
