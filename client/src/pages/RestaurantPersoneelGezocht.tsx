import { useEffect, useRef, useState } from "react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  ArrowRight, Check, Phone, Shield, Clock, Star, Heart,
  TrendingUp, Users, Zap, Gift, UserCheck,
  Tag, ThumbsUp, MessageCircle, Sparkles,
  Utensils, GlassWater, ChefHat, BarChart3
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import sollicitatieImg from "@assets/Sollicitatieformulier_1772893764120.png";
import screenshotGebruikers from "@assets/Gebruikers_1772098047298.webp";
import screenshotProfiel from "@assets/Medewerkersprofiel_1772098064753.webp";
import screenDashboard from "@assets/IMG_8803_1770915286475.png";
import screenRewards from "@assets/IMG_8805_1770915286475.png";
import screenChallenges from "@assets/IMG_8807_1770915286475.png";
import screenRanglijst from "@assets/IMG_8808_1770915286475.png";

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
  { key: "rewards", img: screenRewards, label: "Rewards" },
  { key: "challenges", img: screenChallenges, label: "Challenges" },
  { key: "ranglijst", img: screenRanglijst, label: "Ranglijst" },
];

export default function RestaurantPersoneelGezocht() {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    document.title = "Restaurantpersoneel Nodig? EXTRA Levert Flexibel Horecapersoneel | Restaurant Uitzendbureau";

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

    setMeta("description", "Restaurantpersoneel nodig? EXTRA levert flexibel horecapersoneel voor restaurants — van bediening tot keukenondersteuning. Persoonlijk geselecteerd, iedereen in loondienst. NEN-4400-1 gecertificeerd.");
    setLink("canonical", "https://www.doehetextra.nl/horecapersoneel-gezocht");
    setMeta("og:title", "Restaurantpersoneel Nodig? EXTRA Levert Flexibel Horecapersoneel", "property");
    setMeta("og:description", "Restaurantpersoneel nodig? EXTRA levert bediening, keukenondersteuning en barpersoneel voor restaurants. Persoonlijk geselecteerd, iedereen in loondienst.", "property");
    setMeta("og:url", "https://www.doehetextra.nl/horecapersoneel-gezocht", "property");
    setMeta("og:type", "website", "property");

    addSchema("restaurant-faq-schema", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Kunnen jullie snel horecapersoneel leveren voor een restaurant?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. In veel gevallen leveren we binnen 48 uur geschikt horecapersoneel. Dankzij onze pool van ervaren medewerkers kunnen we snel schakelen bij uitval, ziekte of onverwachte drukte." } },
        { "@type": "Question", "name": "Hebben jullie ervaren bediening voor restaurants?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Onze bedienend personeel heeft ruime horecaervaring en is gewend aan het tempo van drukke restaurants. Ze kennen de omgangsvormen, werken zelfstandig en zijn representatief." } },
        { "@type": "Question", "name": "Kunnen jullie ook keukenpersoneel leveren voor een restaurant?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. EXTRA levert ook keukenpersoneel: zelfstandig werkende koks, sous-chefs, keukenhulpen en afwassers. We selecteren op keukenervaring en zelfstandigheid." } },
        { "@type": "Question", "name": "Kunnen wij werken met vaste medewerkers via EXTRA?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Via het favorietenpoule systeem bouwen we per restaurant een vaste groep medewerkers op. Ze kennen jouw menu, jouw werkwijze en jouw kwaliteitsstandaard. Minder uitleg, meer kwaliteit." } },
        { "@type": "Question", "name": "Kunnen jullie personeel leveren voor weekenden en piekperiodes?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Juist voor drukke weekenden, vakanties en piekperiodes is EXTRA de aangewezen partner. We leveren flexibel horecapersoneel dat gewend is aan hoog tempo en wisselende drukte." } },
      ]
    });

    const interval = setInterval(() => setActiveScreen(p => (p + 1) % appScreens.length), 3500);
    return () => {
      clearInterval(interval);
      document.getElementById("restaurant-faq-schema")?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <GrainOverlay />
      <PublicNav />

      {/* ═══════════════════════════════════════════════════ */}
      {/* 1. HERO                                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBgImage} alt="" className="absolute inset-0 w-full h-full object-cover object-right sm:object-center" style={{ filter: "contrast(1.03) saturate(1.02)" }} loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(88,22,164,0.92) 0%, rgba(88,22,164,0.88) 40%, rgba(88,22,164,0.70) 65%, rgba(88,22,164,0.35) 82%, rgba(88,22,164,0.10) 100%)` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
        </div>
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.9)" className="z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Utensils className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">Specialist in restaurantpersoneel</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 gecertificeerd</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Restaurantpersoneel nodig?{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA regelt het.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-70 rounded-sm" />
              </span>
            </h1>
            <p className="text-base sm:text-xl text-purple-100/90 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              EXTRA levert flexibel horecapersoneel voor restaurants — van bediening tot keukenondersteuning. Persoonlijk geselecteerd, gewend aan horeca tempo en altijd representatief. Iedereen in loondienst.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Vraag restaurantpersoneel aan
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
                { icon: Star, text: "Ervaring met het restaurantbedrijf" },
                { icon: Zap, text: "Snel inzetbaar bij uitval of drukte" },
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
      {/* 2. FUNCTIES VOOR RESTAURANTS                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="functies" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Users className="w-4 h-4" /> Functies voor restaurants
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Elke rol in het restaurant.{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Snel ingevuld.</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2 sm:h-3.5 bg-gradient-to-r from-yellow-300 to-orange-400 -skew-x-3 z-0 opacity-50 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-5 max-w-2xl mx-auto">
                Of het nu gaat om een druk weekend, een zieke medewerker of een onverwacht volgeboekte zaal — EXTRA levert ervaren horecapersoneel dat direct meedraait in jouw restaurant.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Utensils,
                title: "Bedieningsmedewerkers",
                desc: "Ervaren bediening die gewend is aan het tempo van een vol restaurant. Zelfstandig, representatief en gastgericht.",
                tags: ["À la carte", "Buffet", "Banqueting", "Fine dining"],
                color: "from-purple-600 to-purple-800",
              },
              {
                icon: Zap,
                title: "Runners",
                desc: "Snelle runners voor de verbinding tussen keuken en zaal. Ze houden het tempo hoog en zorgen dat elk bord op tijd aankomt.",
                tags: ["Keuken-zaal", "Doorgeefluik", "Hoog tempo", "Ondersteuning"],
                color: "from-indigo-500 to-purple-600",
              },
              {
                icon: GlassWater,
                title: "Barpersoneel",
                desc: "Ervaren barkeepers en barmedewerkers voor de drankservice. Snel, representatief en geschikt voor drukke barservices.",
                tags: ["Drankservice", "Cocktails", "Wijnservice", "Bar support"],
                color: "from-pink-500 to-purple-600",
              },
              {
                icon: ChefHat,
                title: "Zelfstandig werkend kok",
                desc: "Koks die direct meekoken in een vreemde keuken. Zelfstandig, flexibel en gewend aan wisseling van omgeving.",
                tags: ["Zelfstandig", "Keukenleid", "Kok niveau 3/4", "Flexibel"],
                color: "from-orange-500 to-red-600",
              },
              {
                icon: Sparkles,
                title: "Sous-chef",
                desc: "Ervaren sous-chefs die de keuken draaiende houden bij afwezigheid van de chef of bij drukte. Leidinggevend en vaktechnisch sterk.",
                tags: ["Leidinggevend", "Keukencoördinatie", "Mise en place", "HACCP"],
                color: "from-blue-500 to-indigo-600",
              },
              {
                icon: Users,
                title: "Afwassers & keukenhulpen",
                desc: "Betrouwbare afwassers en keukenhulpen die de basis op orde houden. Snel inzetbaar bij uitval of piekdrukte in de keuken.",
                tags: ["Afwas", "Keukenhulp", "Mise en place", "Schoonmaak"],
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
                Vraag restaurantpersoneel aan
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 3. WAAROM RESTAURANTS VOOR EXTRA KIEZEN            */}
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
                Restaurants kiezen EXTRA<br className="hidden sm:block" />
                <span className="text-purple-600">om één reden: het werkt.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-5 max-w-2xl mx-auto">
                Horecapersoneel vinden is al moeilijk genoeg. Het vinden van iemand die direct meedraait in een druk restaurant is nog een stap verder. Dat is precies waar EXTRA in uitblinkt.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                stat: "Flexibel",
                statLabel: "op- en afschalen",
                title: "Flexibel bij uitval en drukte",
                desc: "Ziek personeel, een onverwacht volgeboekte zaal of een drukker weekend dan gepland. EXTRA levert snel horecapersoneel dat direct inzetbaar is.",
                accent: "from-purple-500 to-purple-700",
              },
              {
                stat: "100%",
                statLabel: "persoonlijk geselecteerd",
                title: "Persoonlijk geselecteerd personeel",
                desc: "Iedere medewerker wordt persoonlijk gesproken voordat hij of zij bij EXTRA werkt. We selecteren op houding, service en de drive die past bij horeca.",
                accent: "from-indigo-500 to-purple-600",
              },
              {
                stat: "Tempo",
                statLabel: "gewend aan horeca",
                title: "Gewend aan horeca tempo",
                desc: "Onze medewerkers kennen de druk van een vol restaurant. Ze schrikken niet van een dubbele boeking, een late storm of een keukentje dat net iets anders werkt.",
                accent: "from-pink-500 to-rose-600",
              },
              {
                stat: "24/7",
                statLabel: "bereikbaar voor planners",
                title: "Altijd bereikbaar",
                desc: "Ook buiten kantooruren. Onze planners staan klaar wanneer je snel moet schakelen — ook voor vroege ochtenden, late avonden en weekenden.",
                accent: "from-blue-500 to-indigo-600",
              },
              {
                stat: "★ 4.8",
                statLabel: "gemiddelde beoordeling",
                title: "Continu beoordeeld op kwaliteit",
                desc: "Na iedere dienst verzamelen we feedback. Alleen medewerkers die structureel goed presteren in het restaurantbedrijf blijven actief.",
                accent: "from-amber-500 to-orange-500",
              },
              {
                stat: "0%",
                statLabel: "ZZP-risico voor jou",
                title: "Geen zzp-risico",
                desc: "Alle medewerkers werken bij ons in loondienst en voldoen aan de NEN 4400-1 norm. Volledige compliance, geen gedoe.",
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
      {/* 4. ZO SELECTEERT EXTRA DE JUISTE MENSEN            */}
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
                  Restaurantpersoneel moet direct kunnen meedraaien in een onbekende omgeving. Dat vraagt om ervaring, aanpassingsvermogen en de juiste werkmentaliteit. Wij selecteren precies daarop.
                </p>
                <ul className="space-y-6">
                  {[
                    {
                      icon: Users,
                      title: "Persoonlijke intake",
                      desc: "Iedere medewerker doorloopt een gesprek en beoordeling voordat hij of zij aan de slag kan. Geen uitzonderingen.",
                    },
                    {
                      icon: Star,
                      title: "Beoordeling na iedere dienst",
                      desc: "Restaurants geven feedback na elke dienst. Alleen medewerkers die structureel goed presteren blijven actief bij EXTRA.",
                    },
                    {
                      icon: Sparkles,
                      title: "Representativiteit",
                      desc: "In een restaurant staat het personeel in het middelpunt. Onze medewerkers zijn verzorgd, gastgericht en beheersen de taal van de gastvrijheid.",
                    },
                    {
                      icon: ThumbsUp,
                      title: "Horecaervaring & houding",
                      desc: "We kijken verder dan een CV. Aanpassingsvermogen, servicegerichtheid en werkmentaliteit zijn bij onze selectie minstens zo belangrijk als aantoonbare ervaring.",
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
                      alt="EXTRA beoordelingsformulier — zo meten we kwaliteit van restaurantpersoneel"
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
      {/* 5. CONTINUE KWALITEITSMETING                       */}
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
                Elke dienst beter dan<br className="hidden sm:block" /> de vorige
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Na elke restaurantdienst meten we hoe het personeel heeft gepresteerd. Zo weet je zeker dat je elke keer iemand krijgt die bewezen goed is in jouw type restaurant.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-14 max-w-4xl mx-auto">
              {[
                { text: "Na elke dienst een beoordeling op servicekwaliteit en gedrag" },
                { text: "Betrouwbaarheid en punctualiteit worden nauwkeurig bijgehouden" },
                { text: "No-shows direct geregistreerd met consequenties" },
                { text: "Wie structureel goed presteert in restaurants wordt prioritair ingezet" },
                { text: "Vaste poule van restaurant-toppers opbouwen per opdrachtgever" },
                { text: "Diensthistorie en scores per medewerker altijd inzichtelijk" },
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
                    <p className="text-xs text-gray-500 mt-0.5">Real-time inzicht in alle medewerkers — inclusief restaurantplaatsingen</p>
                  </div>
                  <img src={screenshotGebruikers} alt="Dashboard medewerkers overzicht" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-4 text-center">We weten precies wie goed presteert in welk type restaurant</p>
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
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-4 text-center">Zo plaatsen we bewezen kwaliteit in jouw restaurant</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 6. FAVORIETENPOULES VOOR RESTAURANTS               */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="favorietenpoule" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <div>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                  <Heart className="w-4 h-4" /> Favorietenpoules voor restaurants
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Vaste gezichten<br /> in jouw restaurant
                </h2>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8">
                  Restaurants die structureel met EXTRA werken, bouwen een vaste kern op van medewerkers die het restaurant kennen. Ze weten hoe de bediening werkt, kennen het menu en begrijpen de servicestijl — zonder uitgebreide introductie.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Users, text: "Vaste poule per restaurant, opgebouwd op bewezen prestaties" },
                    { icon: Heart, text: "Medewerkers kennen jouw menu, servicestijl en kwaliteitsstandaard" },
                    { icon: TrendingUp, text: "Minder briefing nodig, direct inzetbaar bij elke dienst" },
                    { icon: Star, text: "Hogere servicekwaliteit door vertrouwdheid en continuïteit" },
                    { icon: Tag, text: "Tags per medewerker: Restaurantervaren, Fine dining, Bediening, Keuken" },
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
                  Bouw jouw restaurantpoule op <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "🍽️", title: "Vaste bediening", desc: "Dezelfde bediening bij elke drukke dienst. Ze kennen jouw menu, werkwijze en gasten. Direct inzetbaar zonder briefing.", tag: "Bediening" },
                  { icon: "👨‍🍳", title: "Vaste koks", desc: "Koks die jouw keuken kennen. Ze weten hoe jouw mise en place werkt en wat de standaard is. Geen inwerkperiode nodig.", tag: "Keuken" },
                  { icon: "🍸", title: "Vaste bartenders", desc: "Bartenders die jouw drankenkaart en glassoorten kennen. Direct op volle snelheid, ook op drukke vrijdag- en zaterdagavonden.", tag: "Bar" },
                  { icon: "⚡", title: "Vaste runners", desc: "Runners die weten hoe de logistiek werkt tussen jouw keuken en zaal. Snel, betrouwbaar en vertrouwd.", tag: "Support" },
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
      {/* 7. EXTRAATJE BELONINGSSYSTEEM                      */}
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
                  <span className="relative z-10">betere service</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Personeel dat gemotiveerd is, presteert beter in jouw restaurant. Met het EXTRAATje beloningssysteem zorgen we dat medewerkers betrokken zijn en elke dienst het beste uit zichzelf halen.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Elke dienst levert punten op", desc: "Medewerkers verdienen punten per restaurantdienst. Goed beoordeeld door jou? Bonus-punten. Inzet wordt direct beloond.", icon: "🏃" },
                { step: "2", title: "Vaker werken, hogere status", desc: "Wie regelmatig terugkomt in jouw restaurant bouwt status op — van Bronze naar Diamond. Hogere status betekent meer binding.", icon: "💎" },
                { step: "3", title: "Minder uitval, sterkere teams", desc: "Medewerkers die punten opbouwen bij jou willen terugkomen. Minder no-shows, een stabieler team en betere continuïteit.", icon: "🎁" },
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
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Wat jouw restaurant hiervan merkt</h3>
                <ul className="space-y-4">
                  {[
                    { icon: TrendingUp, text: "Hogere motivatie: medewerkers die beloond worden, presteren beter" },
                    { icon: Check, text: "Minder no-shows: wie punten opbouwt bij jou, komt opdagen" },
                    { icon: Users, text: "Sterkere teams: dezelfde gemotiveerde gezichten bij elke dienst" },
                    { icon: Heart, text: "Betere gastbeleving: enthousiast personeel straalt af op jouw gasten" },
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
      {/* 8. LOGO'S VAN RESTAURANTKLANTEN                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">
              Vertrouwd door restaurants en horeca-opdrachtgevers
            </p>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 lg:gap-24">
              {[
                { src: logoHetePeper, alt: "Hete Peper" },
                { src: logoAppel, alt: "Appèl" },
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
      {/* 9. KLANTCASE RESTAURANT                            */}
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
                Hoe restaurants EXTRA ervaren
              </h2>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                company: "Restaurant Hete Peper",
                quote: "Bij een ziek teamlid op vrijdagmiddag hadden we EXTRA ingeschakeld. Binnen de avond stond er een ervaren bedieningsmedewerker die direct meepakte. Geen uitleg nodig, gewoon goed.",
                name: "Thomas van der Berg",
                role: "Restaurantmanager",
                results: ["Uitval op vrijdagmiddag opgelost voor de avonddienst", "Vaste poule opgezet voor weekenddiensten"],
              },
              {
                company: "Restaurant Appèl",
                quote: "We werken inmiddels structureel met een vaste groep EXTRA medewerkers voor onze drukke avonden. Ze kennen de kaart, de werkwijze en wat wij verwachten. Dat scheelt enorm.",
                name: "Sarah Konings",
                role: "F&B Manager",
                results: ["Vaste favorietenpoule opgebouwd in 6 weken", "Minder instructietijd bij elke dienst"],
              },
              {
                company: "Horeca Amsterdam",
                quote: "Tijdens de vakantieperiode was het moeilijk om personeel te vinden. EXTRA heeft ons geholpen met flexibele inzet van medewerkers die de druk aan konden. Zonder hen was het chaotisch geworden.",
                name: "Mark de Vries",
                role: "Operations Director",
                results: ["Vakantieperiode volledig gedraaid met EXTRA support", "Alle diensten bezet zonder kwaliteitsverlies"],
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
      {/* 10. FAQ VOOR RESTAURANTS                           */}
      {/* ═══════════════════════════════════════════════════ */}
      <FAQSection
        heading="Veelgestelde vragen over restaurantpersoneel"
        faqs={[
          { q: "Kunnen jullie snel horecapersoneel leveren voor een restaurant?", a: "Ja. In veel gevallen leveren we binnen 48 uur geschikt horecapersoneel. Dankzij onze pool van ervaren medewerkers kunnen we snel schakelen bij uitval, ziekte of onverwachte drukte in jouw restaurant." },
          { q: "Hebben jullie ervaren bediening voor restaurants?", a: "Ja. Onze bedienend personeel heeft ruime horecaervaring en is gewend aan het tempo van een druk restaurant. Ze kennen de omgangsvormen, werken zelfstandig en zijn representatief." },
          { q: "Kunnen jullie ook keukenpersoneel leveren voor een restaurant?", a: "Ja. EXTRA levert zelfstandig werkende koks, sous-chefs, keukenhulpen en afwassers. We selecteren op keukenervaring en het vermogen om direct zelfstandig mee te draaien in een vreemde keuken." },
          { q: "Kunnen wij werken met vaste medewerkers via EXTRA?", a: "Ja. Via het favorietenpoule systeem bouwen we per restaurant een vaste groep medewerkers op. Ze kennen jouw menu, je werkwijze en jouw kwaliteitsstandaard. Minder uitleg, meer kwaliteit bij elke dienst." },
          { q: "Kunnen jullie personeel leveren voor weekenden en piekperiodes?", a: "Ja. Juist voor drukke weekenden, vakanties en piekperiodes is EXTRA de aangewezen partner. We leveren flexibel horecapersoneel dat gewend is aan hoog tempo en wisselende drukte." },
          { q: "Zijn jullie medewerkers in loondienst?", a: "Ja. Alle medewerkers die via EXTRA werken zijn in loondienst bij ons. We voldoen aan de NEN 4400-1 norm. Geen zzp-risico voor jouw restaurant, geen schijnzelfstandigheid." },
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
              <Utensils className="w-4 h-4" /> Restaurantpersoneel nodig?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Vraag direct{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA personeel aan</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Of je nu op zoek bent naar bediening voor dit weekend of een vaste aanvulling op je team zoekt: EXTRA levert snel, flexibel en betrouwbaar horecapersoneel voor restaurants.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mb-10 sm:mb-14">
              <a
                href="/personeelsaanvraag"
                className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3"
                style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
              >
                Vraag restaurantpersoneel aan
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
                { icon: Zap, text: "Snel inzetbaar bij uitval" },
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
