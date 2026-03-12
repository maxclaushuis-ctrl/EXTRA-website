import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  Users, Gift, Star, ChevronDown, ChevronUp,
  TrendingUp, Shield, Clock, Trophy,
  ArrowRight, Check, Briefcase, UserCheck,
  Award, Handshake, Phone, Sparkles, Heart, Zap,
  Building2, UtensilsCrossed, PartyPopper, Wine, MessageCircle,
  Tag, BarChart3, UserPlus, Search, CalendarCheck,
  AlertCircle, Bell, Lock, CheckCircle2, Flame
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import screenDashboard from "@assets/IMG_9066_1773314165933.png";
import screenRewards from "@assets/IMG_9067_1773314165933.png";
import screenRanglijst from "@assets/IMG_9068_1773314165933.png";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.png";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.png";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoWestweelde from "../assets/pitch/logo-westweelde-clean.png";
import { CLIENT_REVIEWS } from "@/data/reviews";
import sollicitatieformulier from "@assets/Sollicitatieformulier_1772893764120.png";
import dashboardKandidaten from "@assets/Dashboard_kandidaten_1772893764120.png";
import scoreSnippet from "@assets/Scherm\u00adafbeelding_2026-03-12_om_11.31.00_1773311517193.png";
import poulesMatches from "@assets/Scherm\u00adafbeelding_2026-03-12_om_10.22.20_1773311761908.png";
import poulesButton from "@assets/Scherm\u00adafbeelding_2026-03-12_om_11.36.42_1773311845901.png";

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

function IpadMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 560 }}>
      <div
        className="relative rounded-[2rem] p-3 shadow-2xl shadow-purple-900/30"
        style={{
          background: "linear-gradient(145deg, #1c1c1e, #2c2c2e)",
          border: "2px solid #3a3a3e",
        }}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          <div className="w-2 h-0.5 rounded-full bg-gray-700" />
        </div>
        <div className="rounded-[1.2rem] overflow-hidden bg-white ml-2" style={{ aspectRatio: "4/3" }}>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 58%" }}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-1 h-10 rounded-full bg-gray-600" />
        </div>
        <div className="absolute top-[-4px] left-[30%] h-1 w-8 rounded-t-sm" style={{ background: "linear-gradient(180deg, #3a3a3e, #222226)" }} />
        <div className="absolute top-[-4px] left-[42%] h-1 w-8 rounded-t-sm" style={{ background: "linear-gradient(180deg, #3a3a3e, #222226)" }} />
        <div className="absolute top-[-4px] right-[20%] h-1 w-6 rounded-t-sm" style={{ background: "linear-gradient(180deg, #3a3a3e, #222226)" }} />
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full blur-xl bg-purple-400/20" />
    </div>
  );
}

function BrowserMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 600 }}>
      <div className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/15 border border-gray-200">
        <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Shield className="w-3 h-3 text-green-500 shrink-0" />
            <span className="text-xs text-gray-500 font-medium truncate">app.doehetextra.nl/dashboard</span>
          </div>
        </div>
        <div className="overflow-hidden">
          <img src={src} alt={alt} className="w-full object-cover object-top" loading="lazy" decoding="async" />
        </div>
      </div>
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
        opacity: 0.4,
        mixBlendMode: "overlay",
      }}
    />
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard" },
  { key: "beloningen", img: screenRewards, label: "Beloningen" },
  { key: "ranglijst", img: screenRanglijst, label: "Ranglijst" },
  { key: "uitdagingen", img: screenUitdagingen, label: "Uitdagingen" },
];

export default function PersoneelGezocht() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  const klantReviews = ["amrath", "westweelde", "hart"].map((id) => {
    const r = CLIENT_REVIEWS.find((x) => x.id === id)!;
    return { quote: r.quote, name: r.author, rating: 5, role: r.role, company: r.company };
  });

  useEffect(() => {
    document.title = "Horeca personeel gezocht | flexibel horecapersoneel | EXTRA";

    const setMeta = (nameOrProp: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, nameOrProp); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };
    const addSchema = (id: string, data: object) => {
      document.getElementById(id)?.remove();
      const s = document.createElement('script');
      s.id = id;
      s.type = 'application/ld+json';
      s.text = JSON.stringify(data);
      document.head.appendChild(s);
    };

    setMeta('description', 'Horeca personeel nodig? EXTRA levert flexibel horecapersoneel voor hotels, restaurants, cateraars en events. Gescreend, betrouwbaar en direct inzetbaar.');
    setLink('canonical', 'https://www.doehetextra.nl/horeca-personeel-gezocht');
    setMeta('og:title', 'Horeca personeel gezocht | flexibel horecapersoneel | EXTRA', 'property');
    setMeta('og:description', 'Horeca personeel nodig? EXTRA levert flexibel horecapersoneel voor hotels, restaurants, cateraars en events. Gescreend, betrouwbaar en direct inzetbaar.', 'property');
    setMeta('og:url', 'https://www.doehetextra.nl/horeca-personeel-gezocht', 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:image', 'https://www.doehetextra.nl/extra_email_banner_bg.png', 'property');

    addSchema('local-business-schema', {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "EXTRA",
      "description": "Flexibel horecapersoneel via EXTRA, NEN-4400-1 gecertificeerd uitzendbureau in Amsterdam.",
      "telephone": "+31851305915",
      "url": "https://www.doehetextra.nl",
      "address": { "@type": "PostalAddress", "addressLocality": "Amsterdam", "addressCountry": "NL" },
    });

    addSchema('faq-schema', {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Hoe snel kunnen jullie horecapersoneel leveren?", "acceptedAnswer": { "@type": "Answer", "text": "Bij EXTRA begrijpen we dat drukte vaak onverwacht ontstaat. Dankzij onze grote pool met ervaren horecamedewerkers kunnen we vaak snel personeel inzetten. In veel gevallen kunnen wij binnen 48 uur geschikte medewerkers voorstellen voor hotels, restaurants, events of cateringopdrachten." } },
        { "@type": "Question", "name": "Voor welke functies kan ik horecapersoneel inhuren?", "acceptedAnswer": { "@type": "Answer", "text": "Via EXTRA kun je personeel inhuren voor verschillende functies binnen de horeca en hospitality. Denk aan bediening, barpersoneel, runners, chefs, front-office medewerkers en housekeeping." } },
        { "@type": "Question", "name": "Wat kost horecapersoneel via een uitzendbureau?", "acceptedAnswer": { "@type": "Answer", "text": "De kosten voor horecapersoneel via een uitzendbureau hangen af van de functie, ervaring en duur van de inzet. Bij EXTRA werken we met transparante tarieven." } },
        { "@type": "Question", "name": "Kunnen jullie flexibel opschalen bij drukte of evenementen?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Flexibiliteit is één van de belangrijkste voordelen van werken met EXTRA. Of het nu gaat om een groot evenement, een druk weekend of tijdelijke piek in bezetting: we kunnen snel op- en afschalen." } },
        { "@type": "Question", "name": "Hoe kan ik personeel aanvragen bij EXTRA?", "acceptedAnswer": { "@type": "Answer", "text": "Je kunt eenvoudig personeel aanvragen via het aanvraagformulier op onze website. Nadat we de aanvraag hebben ontvangen nemen we contact op om de wensen en planning te bespreken." } },
      ]
    });

    const screenInterval = setInterval(() => {
      setActiveScreen(prev => (prev + 1) % appScreens.length);
    }, 3500);

    return () => {
      document.getElementById('local-business-schema')?.remove();
      document.getElementById('faq-schema')?.remove();
      clearInterval(screenInterval);
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
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">800+ medewerkers actief</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 gecertificeerd</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Vol rooster,{" "}
              <span className="relative inline-block">
                <span className="relative z-10">te weinig mensen?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-70 rounded-sm" />
              </span>
            </h1>
            <p className="text-base sm:text-xl text-purple-100/90 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              EXTRA levert snel en flexibel horecapersoneel voor hotels, events, cateraars en restaurants. Iedereen persoonlijk geselecteerd, iedereen in loondienst.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Vraag EXTRA personeel aan
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
                { icon: Star, text: "Persoonlijk geselecteerd" },
                { icon: Clock, text: "Snel beschikbaar" },
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
      {/* 2. BRANCHES                                        */}
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
                Waar heb je extra horecapersoneel voor nodig?
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Van grote hotelketens tot drukke eventlocaties. EXTRA levert flexibel horecapersoneel dat past bij jouw locatie. Gescreend, representatief en direct inzetbaar.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-8">
            {[
              {
                icon: Building2,
                title: "Hotels",
                desc: "Housekeeping, banqueting, front office en keukenpersoneel voor hotels. Flexibel opschalen tijdens drukte, evenementen en seizoenen.",
                color: "from-purple-600 to-purple-800",
                border: "border-purple-100",
                link: "/hotelpersoneel-inhuren",
                tags: ["Housekeeping", "Front office", "Banqueting", "Keuken"],
              },
              {
                icon: PartyPopper,
                title: "Eventlocaties",
                desc: "Representatief personeel voor grote en kleine evenementen. Van bediening tot runners en barpersoneel. Teams van 5 tot 60 medewerkers.",
                color: "from-pink-500 to-purple-600",
                border: "border-pink-100",
                link: "/eventpersoneel-inhuren",
                tags: ["Bediening", "Bar", "Runners", "Coatcheck"],
              },
              {
                icon: UtensilsCrossed,
                title: "Cateraars",
                desc: "Chefs, bediening en keukenmedewerkers voor catering en evenementen op iedere locatie.",
                color: "from-indigo-500 to-purple-600",
                border: "border-indigo-100",
                link: "/cateringpersoneel-inhuren",
                tags: ["Chefs", "Bediening", "Keukenmedewerkers"],
              },
              {
                icon: Wine,
                title: "Restaurants",
                desc: "Bediening, koks en barpersoneel voor restaurants bij drukte, uitval en piekmomenten.",
                color: "from-blue-500 to-indigo-600",
                border: "border-blue-100",
                link: "/horecapersoneel-restaurants",
                tags: ["Bediening", "Bar", "Keuken", "Runners"],
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <a href={item.link} className={`group block relative bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-[2rem] shadow-lg shadow-purple-500/5 border-2 ${item.border} p-7 sm:p-10 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-28 sm:w-40 h-28 sm:h-40 bg-gradient-to-bl from-purple-50 to-transparent rounded-bl-[100%] opacity-60" />
                  <div className="relative">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-5">{item.desc}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {item.tags.map((tag, j) => (
                        <span key={j} className="text-xs font-semibold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100">{tag}</span>
                      ))}
                    </div>
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
      {/* 3. WAAROM OPDRACHTGEVERS VOOR EXTRA KIEZEN         */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="waarom-extra" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Shield className="w-4 h-4" /> Waarom EXTRA
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waarom horecabedrijven voor EXTRA kiezen
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Geen standaard uitzendbureau. EXTRA werkt anders. Wij bouwen vaste teams, selecteren streng en meten continu kwaliteit.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Shield, title: "Iedereen in loondienst", desc: "Volledig NEN-4400-1 gecertificeerd en conform arbeidswetgeving 2026. Geen zzp-constructies, geen risico's.", emoji: "🛡️" },
              { icon: Users, title: "Persoonlijk bekend bij ons", desc: "Iedere medewerker is op kantoor op gesprek geweest. Je weet altijd wie er naar jouw locatie komt.", emoji: "🤝" },
              { icon: Star, title: "Selectie op soft & hard skills", desc: "Strenge screening op vakkennis, houding, representativiteit en beoordelingshistorie na elke dienst.", emoji: "⭐" },
              { icon: Clock, title: "24/7 bereikbaar", desc: "Snel schakelen bij uitval of last-minute aanvragen. We zijn er als jij ons nodig hebt.", emoji: "📞" },
              { icon: TrendingUp, title: "Continu gemeten kwaliteit", desc: "Na elke dienst een beoordeling. Zo weten we precies wie structureel goed presteert op jouw locatie.", emoji: "📊" },
              { icon: Gift, title: "EXTRAATje beloningssysteem", desc: "Hogere motivatie, minder uitval en vaste teams. Medewerkers die graag terugkomen naar jouw locatie.", emoji: "🎁" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-8 border border-purple-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm">
                  <div className="text-3xl sm:text-4xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">{item.emoji}</div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={500}>
            <div className="text-center mt-8 sm:mt-12">
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full border border-green-200">
                <Shield className="w-4 h-4" />
                Volledig conform arbeidswetgeving 2026 — NEN-4400-1 gecertificeerd
              </span>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 4. LOGO'S VAN OPDRACHTGEVERS                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">
              Vertrouwd door hotels, cateraars en eventlocaties
            </p>
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
                    { src: logoWestweelde, alt: "Westweelde" },
                    { src: logoFunda, alt: "Funda" },
                    { src: logoHetePeper, alt: "Hete Peper" },
                  ].map((logo) => (
                    <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
                      <img src={logo.src} alt={logo.alt} width="200" height="200" loading="lazy" decoding="async" className="h-12 sm:h-16 lg:h-20 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
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
      {/* 5. KLANTREVIEWS                                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="reviews" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/50 px-4 sm:px-5 py-2 rounded-full">
                <Heart className="w-4 h-4" /> Ervaringen
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat anderen zeggen
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mt-4 sm:mt-6">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-base sm:text-xl font-bold text-gray-900 ml-0.5">4,8</span>
                </div>
                <span className="text-sm sm:text-base text-gray-500">gemiddeld uit <span className="font-semibold text-gray-700">232 Google reviews</span></span>
              </div>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
            {klantReviews.map((review, i) => (
              <RevealSection key={i} delay={i * 120}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col shadow-sm">
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div className="mb-6 sm:mb-8 flex-1">
                    <p className={`text-sm sm:text-base text-gray-600 leading-relaxed ${!expandedReviews.has(i) ? "line-clamp-4" : ""}`}>"{review.quote}"</p>
                    <button
                      onClick={() => setExpandedReviews(prev => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })}
                      className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-800 underline underline-offset-2 cursor-pointer"
                    >
                      {expandedReviews.has(i) ? "Lees minder" : "Lees meer"}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                      <span className="text-white font-bold text-sm sm:text-base">{review.name.split(" ").map((n: string) => n[0]).join("")}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{review.name}</p>
                      <p className="text-xs sm:text-sm text-gray-400 font-medium truncate">{review.role}</p>
                      <p className="text-xs text-purple-600 font-semibold truncate">{review.company}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection delay={200}>
            <div className="flex justify-center mt-10 sm:mt-14">
              <Link href="/klantcases-horeca">
                <button className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm sm:text-base text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-200" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
                  Bekijk alle klantcases <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 6. SCREENINGSPROCES                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="selectie" className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/70 px-5 py-2 rounded-full">
                <UserCheck className="w-4 h-4" /> Screeningsproces
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Elke kandidaat, persoonlijk gescreend
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Voordat een medewerker bij uw locatie staat, is deze persoonlijk gezien op kantoor en digitaal beoordeeld per functie. U weet altijd wie er voor de deur staat.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { n: 1, emoji: "⭐", label: "Topper!" },
                  { n: 2, emoji: "🏆", label: "Veel ervaring" },
                  { n: 3, emoji: "💁", label: "Verzorgd" },
                  { n: 4, emoji: "😄", label: "Enthousiast" },
                  { n: 5, emoji: "🇳🇱", label: "NL" },
                  { n: 7, emoji: "🍽️", label: "3 borden lopen" },
                ].map(({ n, emoji, label }) => (
                  <div key={n} className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-white font-semibold text-sm shadow-md" style={{ background: "linear-gradient(135deg, #4a9fdf 0%, #3b8ecf 100%)" }}>
                    <span className="opacity-70 font-bold text-xs">{n}.</span>
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={150}>
              <IpadMockup
                src={sollicitatieformulier}
                alt="Digitaal intakeformulier screening horecamedewerker EXTRA"
              />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 5. SELECTIE MET DATA                               */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="kwaliteit" className="relative py-20 sm:py-28 pb-28 sm:pb-36 overflow-x-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={2} opacity={0.05} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection className="order-2 lg:order-1">
              <div className="relative">
                <BrowserMockup
                  src={dashboardKandidaten}
                  alt="Kandidaten dashboard met scores per discipline EXTRA Amsterdam"
                />
                <div className="absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-6 w-[65%] rounded-2xl overflow-hidden shadow-2xl border border-white/80 ring-1 ring-purple-100/60 rotate-1 hover:rotate-0 transition-transform duration-300">
                  <img
                    src={scoreSnippet}
                    alt="Scores kandidaat: softskills, bar, bediening en diner"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </RevealSection>
            <RevealSection className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-100/60 px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Data & inzicht
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Uw kandidaten geselecteerd op bewezen scores
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Wij slaan elke beoordeling op. Per medewerker ziet u scores op softskills, bediening, bar en diner — zo matchen wij altijd de juiste persoon aan uw locatie, zonder gokken.
              </p>
              <div className="space-y-4">
                {[
                  "Elk kandidaatprofiel met discipline-scores",
                  "Direct inzicht in wie bij uw concept past",
                  "Objectieve matching op basis van werkhistorie",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 6. FAVORIETENPOULES                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="favorietenpoule" className="relative py-20 sm:py-28 bg-white">
        <XPatternBg count={2} opacity={0.04} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-100/60 px-5 py-2 rounded-full">
                <Heart className="w-4 h-4" /> Favorietenpoule
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Vaste gezichten, minder uitleg
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Na elke geslaagde samenwerking voegen wij uw favorieten toe aan uw persoonlijke poule. Direct inzetbaar bij uw volgende aanvraag — geen inwerken, geen verrassingen.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Opgebouwd op basis van uw voorkeuren en feedback",
                  "Direct inzetbaar bij uw volgende aanvraag",
                  "Zelf uitnodigen via de knop 'Poules uitnodigen'",
                  "Continu bijgewerkt na elke dienst",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <a href="/personeelsaanvraag" className="group inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-7 py-3.5 rounded-full hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-0.5">
                Bouw uw vaste poule op <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </RevealSection>
            <RevealSection delay={100}>
              <div className="relative pb-12 pr-4">
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/80 border border-gray-100 bg-white">
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <div className="ml-3 flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200 max-w-[180px]">
                      app.doehetextra.nl
                    </div>
                  </div>
                  <img
                    src={poulesMatches}
                    alt="Medewerker matches favorietenpoule EXTRA dashboard opdrachtgever"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:right-0 w-[55%] rounded-xl overflow-hidden shadow-xl border border-gray-100 -rotate-1 hover:rotate-0 transition-transform duration-300 bg-white">
                  <img
                    src={poulesButton}
                    alt="Poules uitnodigen knop EXTRA dashboard"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
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
                Betere motivatie ={" "}
                <span className="relative inline-block">
                  <span className="relative z-10">beter personeel</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Ons unieke beloningssysteem zorgt voor gemotiveerde medewerkers die graag terugkomen. Wat jij als opdrachtgever merkt: minder uitval, meer continuïteit en vaste teams.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Medewerker verdient punten", desc: "Elke shift levert punten op. Goed presteren? Extra punten. Zo wordt kwaliteit beloond.", icon: "🏃" },
                { step: "2", title: "Status stijgt, motivatie groeit", desc: "Van Bronze naar Diamond. Hogere status betekent betere beloningen en meer betrokkenheid.", icon: "💎" },
                { step: "3", title: "Medewerker wil terugkomen", desc: "Punten opbouwen op jouw locatie is een reden om te blijven. Minder wisselende gezichten.", icon: "🎁" },
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
                    { icon: TrendingUp, text: "Hogere motivatie, want medewerkers willen punten verdienen op jouw locatie" },
                    { icon: Check, text: "Minder uitval, want betrouwbare medewerkers die komen opdagen" },
                    { icon: Users, text: "Meer continuïteit, vaste teams die jouw locatie kennen" },
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
      {/* 8. STRIKT AFMELDPROTOCOL & BETROUWBAARHEID         */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="betrouwbaarheid" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Lock className="w-4 h-4" /> Betrouwbaarheid
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                No-shows tolereren we niet
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Een betrouwbare medewerker meld zich correct af. Doet hij dat niet? Dan zijn er gevolgen. Zo zorgen we dat jij nooit voor verrassingen staat.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {[
              {
                icon: Bell,
                color: "from-blue-500 to-indigo-600",
                bg: "bg-blue-50",
                title: "Altijd bellen bij afmelding",
                desc: "Medewerkers zijn verplicht telefonisch af te melden. Een appje of bericht is niet voldoende.",
              },
              {
                icon: AlertCircle,
                color: "from-orange-500 to-red-500",
                bg: "bg-orange-50",
                title: "€50 boete bij onjuiste afmelding",
                desc: "Wie zich niet volgens het protocol afmeldt, krijgt een boete van €50. Direct, consequent en eerlijk.",
              },
              {
                icon: Lock,
                color: "from-red-500 to-rose-600",
                bg: "bg-red-50",
                title: "2x onjuist = non-actief",
                desc: "Na twee onjuiste afmeldingen wordt een medewerker op non-actief gezet. Geen tweede kans voor slordigheid.",
              },
              {
                icon: Shield,
                color: "from-green-500 to-emerald-600",
                bg: "bg-green-50",
                title: "Jij staat nooit voor een verrassing",
                desc: "Dankzij dit protocol weet je tijdig wanneer iemand niet kan. Zodat wij een vervanging kunnen regelen.",
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-8 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection delay={350}>
            <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Betrouwbaarheid is geen bijzaak bij EXTRA
              </h3>
              <p className="text-purple-200/80 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
                Ons afmeldprotocol is er niet voor de vorm. Het beschermt jou als opdrachtgever en zorgt dat medewerkers serieus worden genomen in hun verantwoordelijkheid.
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 9. WERKWIJZE VOOR OPDRACHTGEVERS                   */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="werkwijze" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={5} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                <Zap className="w-4 h-4" /> Werkwijze voor opdrachtgevers
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hoe samenwerken met EXTRA werkt
              </h2>
              <p className="text-base sm:text-lg text-purple-200/70 mt-4 max-w-2xl mx-auto">
                Van eerste aanvraag tot vaste favorietenpoule. Vier stappen.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { step: "1", icon: Phone, title: "Vertel wat je zoekt", desc: "Welke functies, wanneer en hoeveel medewerkers? We denken direct mee over de beste aanpak." },
              { step: "2", icon: UserCheck, title: "Wij selecteren de juiste mensen", desc: "Op basis van ervaring, skills, beoordelingen en favorietenpoule zetten wij het beste team klaar." },
              { step: "3", icon: CalendarCheck, title: "Je team staat klaar", desc: "Een op maat samengesteld team, ingeroosterd en klaar om te starten. Jij hoeft niks te doen." },
              { step: "4", icon: TrendingUp, title: "Evalueren & poule bouwen", desc: "Na elke opdracht feedback. Zo bouwen we samen aan een vaste, betrouwbare favorietenpoule." },
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
          <RevealSection delay={400}>
            <div className="text-center mt-10 sm:mt-14">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 sm:gap-3">
                Begin nu met een aanvraag
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 12. FAQ                                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <FAQSection
        heading="Veelgestelde vragen"
        faqs={[
          { q: "Hoe snel kunnen jullie horecapersoneel leveren?", a: "Bij EXTRA begrijpen we dat drukte vaak onverwacht ontstaat. Dankzij onze grote pool met ervaren horecamedewerkers kunnen we vaak snel personeel inzetten. In veel gevallen kunnen wij binnen 48 uur geschikte medewerkers voorstellen voor hotels, restaurants, events of cateringopdrachten." },
          { q: "Voor welke functies kan ik horecapersoneel inhuren?", a: "Via EXTRA kun je personeel inhuren voor verschillende functies binnen de horeca en hospitality. Denk aan bediening, barpersoneel, runners, chefs, front-office medewerkers en housekeeping. We kijken altijd welke medewerkers het beste passen bij de opdracht en locatie." },
          { q: "Wat kost horecapersoneel via een uitzendbureau?", a: "De kosten voor horecapersoneel via een uitzendbureau hangen af van verschillende factoren zoals de functie, ervaring en duur van de inzet. Bij EXTRA werken we met transparante tarieven en denken we graag mee over een passende oplossing voor jouw situatie." },
          { q: "Waarom kiezen bedrijven voor een horeca uitzendbureau?", a: "Veel bedrijven kiezen voor een horeca uitzendbureau omdat het flexibiliteit biedt. Je kunt snel personeel inzetten bij drukte, evenementen of ziekte. Daarnaast neemt een uitzendbureau de werving, selectie en administratie uit handen." },
          { q: "Kunnen jullie flexibel opschalen bij drukte of evenementen?", a: "Ja. Flexibiliteit is één van de belangrijkste voordelen van werken met EXTRA. Of het nu gaat om een groot evenement, een druk weekend of tijdelijke piek in bezetting: we kunnen snel op- en afschalen met ervaren horecapersoneel." },
          { q: "Voor wat voor soort bedrijven levert EXTRA personeel?", a: "EXTRA levert horecapersoneel aan verschillende bedrijven binnen de hospitalitysector, zoals hotels, eventlocaties, cateraars en restaurants. Hierdoor hebben we veel ervaring met uiteenlopende opdrachten en werkomgevingen." },
          { q: "Hoe kan ik personeel aanvragen bij EXTRA?", a: "Je kunt eenvoudig personeel aanvragen via het aanvraagformulier op onze website. Nadat we de aanvraag hebben ontvangen nemen we contact op om de wensen en planning te bespreken." },
        ]}
      />

      {/* ═══════════════════════════════════════════════════ */}
      {/* 13. STERKE EINDE CTA                               */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="cta" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
              <Zap className="w-4 h-4" /> Klaar om te starten?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om extra personeel{" "}
              <span className="relative inline-block">
                <span className="relative z-10">in te zetten?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Vertel ons wat je nodig hebt. Wij selecteren de juiste mensen en zetten snel een team voor je klaar. Iedereen in loondienst, iedereen persoonlijk bekend bij ons.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mb-10 sm:mb-14">
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
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {[
                { icon: Shield, text: "NEN-4400-1 gecertificeerd" },
                { icon: Users, text: "Iedereen in loondienst" },
                { icon: Clock, text: "24/7 bereikbaar" },
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
