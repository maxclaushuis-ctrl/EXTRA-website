import { useEffect, useRef, useState } from "react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import { ClientReviewCard } from "@/components/ClientReviewCard";
import { getReviewsByCategory } from "@/data/reviews";
import {
  ArrowRight, Check, Phone, Shield, Clock, Star, Heart,
  TrendingUp, Users, Zap, Gift, Building2, UserCheck,
  BookOpen, Tag, Bell, AlertCircle, Lock, CheckCircle2,
  CalendarCheck, ThumbsUp, MessageCircle, Sparkles,
  BedDouble, Utensils, GlassWater, ChefHat, Waves, CookingPot,
  BarChart3
} from "lucide-react";
import heroBgImage from "@assets/CHEF_FINAL_AE_001_1775562300081.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoMercure from "../assets/pitch/logo-mercure.webp";
import logoPulitzer from "@assets/Logo_Pulitzer_1773389329669.webp";
import logoNH from "@assets/Logo_NH_1773389329669.webp";
import screenshotGebruikers from "@assets/Gebruikers_1772098047298.webp";
import screenshotProfiel from "@assets/Medewerkersprofiel_1772098064753.webp";
import screenDashboard from "@assets/IMG_9066_1773314165933.webp";
import screenRewards from "@assets/IMG_9067_1773314165933.webp";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.webp";
import screenRanglijst from "@assets/IMG_9068_1773314165933.webp";
import sollicitatieformulier from "@assets/Sollicitatieformulier_1772893764120.webp";
import dashboardKandidaten from "@assets/Dashboard_kandidaten_1772893764120.webp";
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

function IpadMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 560 }}>
      <div className="relative rounded-[2rem] p-3 shadow-2xl shadow-purple-900/30" style={{ background: "linear-gradient(145deg, #1c1c1e, #2c2c2e)", border: "2px solid #3a3a3e" }}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          <div className="w-2 h-0.5 rounded-full bg-gray-700" />
        </div>
        <div className="rounded-[1.2rem] overflow-hidden bg-white ml-2" style={{ aspectRatio: "4/3" }}>
          <img src={src} alt={alt} className="w-full h-full object-cover" style={{ objectPosition: "center 58%" }} loading="lazy" decoding="async" />
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
        <img src={src} alt={alt} className="w-full h-auto object-contain" loading="lazy" decoding="async" />
      </div>
    </div>
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard" },
  { key: "beloningen", img: screenRewards, label: "Beloningen" },
  { key: "uitdagingen", img: screenUitdagingen, label: "Uitdagingen" },
  { key: "ranglijst", img: screenRanglijst, label: "Ranglijst" },
];

export default function HotelPersoneelGezocht() {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    document.title = "Hotelpersoneel inhuren | Housekeeping, F&B en Front Office | EXTRA";

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

    setMeta("description", "Hotelpersoneel nodig? EXTRA levert ervaren medewerkers voor housekeeping, front office, banqueting en F&B. Gescreend personeel dat hotelstandaarden begrijpt.");
    setLink("canonical", "https://www.doehetextra.nl/hotelpersoneel-inhuren");
    setMeta("og:title", "Hotelpersoneel inhuren | Housekeeping, F&B en Front Office | EXTRA", "property");
    setMeta("og:description", "Hotelpersoneel nodig? EXTRA levert ervaren medewerkers voor housekeeping, front office, banqueting en F&B. Gescreend personeel dat hotelstandaarden begrijpt.", "property");
    setMeta("og:url", "https://www.doehetextra.nl/hotelpersoneel-inhuren", "property");
    setMeta("og:type", "website", "property");

    addSchema("hotel-faq-schema", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Hoe snel kunnen jullie hotelpersoneel leveren?", "acceptedAnswer": { "@type": "Answer", "text": "Bij EXTRA kunnen we in veel gevallen binnen 48 uur geschikt hotelpersoneel leveren. Dankzij onze vaste poule van geselecteerde hotelmedewerkers kunnen we snel schakelen bij uitval, piekdrukte of last-minute aanvragen." } },
        { "@type": "Question", "name": "Kunnen jullie housekeeping personeel leveren?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Housekeeping is één van onze kernspecialisaties voor hotels. We leveren ervaren kamermeisjes en room attendants die vertrouwd zijn met hotelstandaarden en kwaliteitscontroles." } },
        { "@type": "Question", "name": "Kunnen jullie personeel leveren voor banqueting?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. EXTRA levert professionele bediening en keukenmedewerkers voor banqueting en conferenties in hotels. Van kleine boardroom-lunches tot gala-diners van 300+ gasten." } },
        { "@type": "Question", "name": "Hoe werkt het met vaste teams per hotel?", "acceptedAnswer": { "@type": "Answer", "text": "EXTRA werkt met favorietenpoules per opdrachtgever. We bouwen per hotel een vaste poule op van medewerkers die jouw locatie kennen. Dezelfde gezichten, minder uitleg, hogere kwaliteit." } },
        { "@type": "Question", "name": "Voor welke hotelfuncties kan ik personeel inhuren?", "acceptedAnswer": { "@type": "Answer", "text": "Via EXTRA kun je personeel inhuren voor: housekeeping, front office, F&B, banqueting, keuken, afwassers en roomservice. We kijken altijd welke medewerkers het beste passen bij jouw hotel en standaard." } },
      ]
    });

    const interval = setInterval(() => setActiveScreen(p => (p + 1) % appScreens.length), 3500);
    return () => {
      clearInterval(interval);
      document.getElementById("hotel-faq-schema")?.remove();
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

          {/* Spotlight radial achter de personen */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 42% 68% at 68% 46%, rgba(255,248,255,0.12) 0%, rgba(220,180,255,0.04) 55%, transparent 75%)"
          }} />

          {/* Solid paars vak links — tekst leesbaar, daarna zachte overgang naar foto */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to right, rgba(29,5,73,1) 0%, rgba(29,5,73,1) 26%, rgba(45,6,99,0.82) 40%, rgba(58,8,128,0.38) 51%, rgba(72,14,148,0.10) 60%, transparent 68%)"
          }} />

          {/* Bottom vignette */}
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: "22%",
            background: "linear-gradient(to top, rgba(29,5,73,0.82) 0%, rgba(29,5,73,0.30) 50%, transparent 100%)"
          }} />

          {/* Top vignette — navbar overlay */}
          <div className="absolute top-0 left-0 right-0" style={{
            height: "18%",
            background: "linear-gradient(to bottom, rgba(29,5,73,0.50) 0%, transparent 100%)"
          }} />
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Building2 className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">Specialist in hotelpersoneel</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 gecertificeerd</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Hotelpersoneel nodig?<br />
              <span className="relative inline-block">
                <span className="relative z-10">Wij cheffen het!</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-70 rounded-sm" />
              </span>
            </h1>
            <p className="text-base sm:text-xl text-purple-100/90 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              Van housekeeping tot banqueting, van front office tot F&B. EXTRA levert flexibel hotelpersoneel dat hotelstandaarden begrijpt. Iedere medewerker persoonlijk geselecteerd en volledig in loondienst.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Vraag hotelpersoneel aan
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
                { icon: Star, text: "Ervaring met hotelstandaarden" },
                { icon: Clock, text: "Binnen 48 uur beschikbaar" },
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
      {/* 2. FUNCTIES VOOR HOTELS                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="functies" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Users className="w-4 h-4" /> Functies voor hotels
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Voor elke hotelfunctie de juiste mensen
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Of het nu gaat om dagelijkse bezetting of piekdrukte. EXTRA levert ervaren hotelpersoneel voor iedere rol binnen jouw hotel.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: BedDouble,
                title: "Housekeeping",
                desc: "Ervaren kamermeisjes en room attendants die werken volgens jouw kwaliteitsstandaarden.",
                tags: ["AD", "Turndown", "Welness", "Houseman", "Room attendant"],
                color: "from-purple-600 to-purple-800",
              },
              {
                icon: Building2,
                title: "Front Office",
                desc: "Representatieve medewerkers voor receptie, check in, check out en guestrelations. Professioneel, gastvrij en gewend aan hotelprocessen.",
                tags: ["Receptie", "Check-in/out", "Guestrelations", "Conciërge"],
                color: "from-blue-500 to-indigo-600",
              },
              {
                icon: Utensils,
                title: "F&B Medewerkers",
                desc: "Gastvrije F&B medewerkers voor hotelrestaurants, ontbijtservice, roomservice en banqueting.",
                tags: ["Bediening", "Restaurantmedewerker", "Ontbijtmedewerker", "Banqueting medewerker", "Runner"],
                color: "from-indigo-500 to-purple-600",
              },
              {
                icon: GlassWater,
                title: "Banqueting",
                desc: "Professionele bediening voor conferenties, gala diners, meetings en events. Ervaring met grotere groepen en hotelservice.",
                tags: ["Conferenties", "Gala-diners", "Boardroom", "Events"],
                color: "from-pink-500 to-purple-600",
              },
              {
                icon: ChefHat,
                title: "Chefs en Keukenpersoneel",
                desc: "Ervaren chefs, sous chefs en koks voor à la carte service, banqueting en ontbijtservice in hotels.",
                tags: ["Chef de partie", "Sous-chef", "Zelfstandig werkend kok", "Commis"],
                color: "from-orange-500 to-pink-600",
              },
              {
                icon: CookingPot,
                title: "Afwassers en Keukenondersteuning",
                desc: "Betrouwbare ondersteuning voor drukke hotelkeukens. Afwassers en keukenhulpen die zorgen dat de keuken blijft draaien.",
                tags: ["Afwasser", "Keukenhulp", "Spoelkeuken medewerker"],
                color: "from-green-500 to-emerald-600",
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-[2rem] shadow-lg shadow-purple-500/5 border-2 border-purple-100 p-7 sm:p-8 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden">
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
                Vraag hotelpersoneel aan
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 3. WAAROM HOTELS VOOR EXTRA KIEZEN                 */}
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
                Waarom hotels voor EXTRA kiezen
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Hotelpersoneel vraagt om meer dan alleen ervaring. Gastvrijheid, representativiteit en consistentie zijn essentieel. EXTRA begrijpt dat.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { emoji: "🏨", title: "Vertrouwd met hotelstandaarden", desc: "Onze medewerkers kennen het verschil tussen drie en vijf sterren service. Ze werken volgens hotelstandaarden, dresscodes en guestrelations protocollen." },
              { emoji: "🤝", title: "Vaste gezichten per hotel", desc: "Via favorietenpoules bouwen we per hotel een vaste poule op. Medewerkers die jouw procedures kennen en direct inzetbaar zijn." },
              { emoji: "⭐", title: "Geselecteerd op gastvrijheid", desc: "Representativiteit en gastvrijheid zijn doorslaggevend in onze selectie. Iedereen heeft eerst een persoonlijk gesprek gehad." },
              { emoji: "📞", title: "Snel schakelen bij uitval", desc: "Ziekte of last minute aanvragen? EXTRA is 24 uur per dag bereikbaar en kan snel schakelen." },
              { emoji: "📊", title: "Data per medewerker per hotel", desc: "Na iedere dienst meten we prestaties. Zo weten we precies wie op jouw locatie het beste presteert." },
              { emoji: "🛡️", title: "Volledig in loondienst", desc: "NEN 4400 1 gecertificeerd en conform arbeidswetgeving. Geen zzp risico's voor hotels." },
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 4. LOGO'S VAN HOTELKLANTEN                         */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100 relative overflow-hidden">
        <RevealSection>
          <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">
            Vertrouwd door toonaangevende hotelketens in Amsterdam
          </p>
        </RevealSection>
        <div className="relative group overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="flex animate-marquee-hotel group-hover:[animation-play-state:paused]">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                {[
                  { src: logoMarriott, alt: "Marriott Hotels" },
                  { src: logoHilton, alt: "Hilton Hotels" },
                  { src: logoAmrath, alt: "Amrâth Hotels" },
                  { src: logoNH, alt: "NH Hotels" },
                  { src: logoMercure, alt: "Mercure Hotels" },
                  { src: logoPulitzer, alt: "Pulitzer Amsterdam" },
                ].map((logo) => (
                  <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
                    <img src={logo.src} alt={logo.alt} loading="lazy" decoding="async" className="h-12 sm:h-16 lg:h-20 w-auto max-w-[180px] sm:max-w-[220px] object-contain opacity-70 hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee-hotel {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-hotel {
            animation: marquee-hotel 30s linear infinite;
          }
        `}</style>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 5. KLANTCASE HOTEL                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="klantcase" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/50 px-4 sm:px-5 py-2 rounded-full">
                <MessageCircle className="w-4 h-4" /> Referenties
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat hotels over ons zeggen
              </h2>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {getReviewsByCategory("hotels").map((review, i) => (
              <RevealSection key={review.id} delay={i * 100}>
                <ClientReviewCard review={review} variant="light" />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════ */}
      {/* 5B. PERSOONLIJK GESCREEND                          */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="screening" className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/70 px-5 py-2 rounded-full">
                <UserCheck className="w-4 h-4" /> Screeningsproces
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Elke hotelmedewerker, persoonlijk gescreend
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Voordat een medewerker bij uw hotel staat, is deze persoonlijk gezien op kantoor en digitaal beoordeeld op presentatie, gastvrijheid en vakkennis per hotelfunctie. U weet altijd wie er achter uw receptie of in uw housekeeping staat.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { n: 1, emoji: "⭐", label: "Topper!" },
                  { n: 2, emoji: "🏆", label: "Veel ervaring" },
                  { n: 3, emoji: "💁", label: "Verzorgd" },
                  { n: 4, emoji: "😄", label: "Enthousiast" },
                  { n: 5, emoji: "🇳🇱", label: "NL" },
                  { n: 7, emoji: "🛏️", label: "Housekeeping" },
                ].map(({ n, emoji, label }) => (
                  <div key={n} className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-white font-semibold text-sm shadow-md" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
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
                alt="Digitaal intakeformulier screening hotelpersoneel EXTRA"
              />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 5C. GESELECTEERD OP BEWEZEN SCORES                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="datakwaliteit" className="relative py-20 sm:py-28 pb-28 sm:pb-36 overflow-x-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection className="order-2 lg:order-1">
              <div className="relative">
                <BrowserMockup
                  src={dashboardKandidaten}
                  alt="Kandidaten dashboard met servicescores per hotelfunctie EXTRA"
                />
                <div className="absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-6 w-[65%] rounded-2xl overflow-hidden shadow-2xl border border-white/80 ring-1 ring-purple-100/60 rotate-1 hover:rotate-0 transition-transform duration-300">
                  <img
                    src={scoreSnippet}
                    alt="Scores hotelmedewerker: gastvrijheid, presentatie en betrouwbaarheid"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </RevealSection>
            <RevealSection className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-100/60 px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Data en inzicht
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hotelpersoneel geselecteerd op bewezen servicescores
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Wij registreren elke plaatsing. Per medewerker ziet u scores op gastvrijheid, presentatie en betrouwbaarheid per hotelfunctie. Zo plaatsen wij altijd de persoon die bij uw hotelstandaard en afdeling past, zonder gokken.
              </p>
              <div className="space-y-4">
                {[
                  "Elk medewerkersprofiel met functie- en dienstscores",
                  "Direct inzicht in wie past bij uw hotel en afdeling",
                  "Objectieve matching op basis van bewezen hotelervaring",
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
      {/* 5D. VASTE GEZICHTEN PER HOTEL                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="pouleoverzicht" className="relative py-20 sm:py-28 bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-100/60 px-5 py-2 rounded-full">
                <Heart className="w-4 h-4" /> Favorietenpoule
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Vaste gezichten per hotel, minder uitleg
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Na elke geslaagde plaatsing voegen wij uw favorieten toe aan uw hotelpoule per afdeling. Direct inzetbaar bij uw volgende aanvraag: geen inwerkkosten, geen verrassingen bij de deur.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Opgebouwd per afdeling: housekeeping, F&B, banqueting en front office",
                  "Direct inzetbaar bij uw volgende aanvraag",
                  "Zelf uitnodigen via de knop 'Poules uitnodigen' in uw dashboard",
                  "Automatisch bijgewerkt na elke dienst op basis van beoordelingen",
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
                Bouw uw hotelpoule op <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                    alt="Hotelpoule medewerker matches favorietenpoule EXTRA dashboard"
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:right-0 w-[55%] rounded-xl overflow-hidden shadow-xl border border-gray-100 -rotate-1 hover:rotate-0 transition-transform duration-300 bg-white">
                  <img
                    src={poulesButton}
                    alt="Poules uitnodigen knop EXTRA hotel dashboard"
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
      {/* 6. HOE WIJ HOTELPERSONEEL SELECTEREN               */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="selectie" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={5} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                <UserCheck className="w-4 h-4" /> Ons selectieproces
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hoe wij hotelpersoneel selecteren
              </h2>
              <p className="text-base sm:text-lg text-purple-200/70 mt-4 max-w-2xl mx-auto">
                Hotelpersoneel vraagt om meer dan vakkennis. Presentatie, houding en gastvrijheid bepalen de gastbeleving. Daarom selecteren wij op alle drie.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { step: "1", icon: Users, title: "Persoonlijk gesprek op kantoor", desc: "Iedere kandidaat komt langs. We beoordelen presentatie, communicatie en hospitality mindset." },
              { step: "2", icon: Star, title: "Selectie op soft en hard skills", desc: "Vakkennis is belangrijk, maar gastvrijheid, representativiteit en nauwkeurigheid zijn doorslaggevend bij hotelplaatsingen." },
              { step: "3", icon: BookOpen, title: "Hospitality ervaring verifiëren", desc: "We controleren eerdere hotelervaring en referenties voordat iemand bij een hotel wordt geplaatst." },
              { step: "4", icon: ThumbsUp, title: "Beoordeling na elke hotelplaatsing", desc: "Na iedere dienst meten we prestaties en bouwen we per hotel een poule van bewezen medewerkers." },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-white/[0.06] backdrop-blur-sm rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-8 border border-white/[0.08] hover:border-purple-400/30 hover:bg-white/[0.10] hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 h-full">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-all duration-300 shadow-lg">
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
            <div className="mt-12 sm:mt-16 text-center">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl">
                <Shield className="w-5 h-5 text-purple-300 flex-shrink-0" />
                <p className="text-sm sm:text-base font-semibold leading-snug text-left">
                  Niemand die via EXTRA bij een hotel werkt heeft géén persoonlijk gesprek gehad.{" "}
                  <span className="text-purple-300">Dat is onze standaard, geen uitzondering.</span>
                </p>
              </div>
            </div>
          </RevealSection>
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
                  <span className="relative z-10">betere service</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Voor hotels is motivatie essentieel. Met het EXTRAATje beloningssysteem zorgen we dat medewerkers gemotiveerd blijven en graag terugkomen naar jouw hotel.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Elke dienst levert punten op", desc: "Medewerkers verdienen punten per dienst. Goed presteren levert bonuspunten op.", icon: "🏃" },
                { step: "2", title: "Status stijgt, binding groeit", desc: "Door punten op te bouwen bij jouw hotel groeit betrokkenheid en motivatie.", icon: "💎" },
                { step: "3", title: "Minder wisselende gezichten", desc: "Medewerkers blijven graag werken op locaties waar zij punten opbouwen.", icon: "🎁" },
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
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Wat jouw hotel hiervan merkt</h3>
                <ul className="space-y-4">
                  {[
                    { icon: TrendingUp, text: "Hogere motivatie: medewerkers willen punten verdienen in jouw hotel" },
                    { icon: Check, text: "Minder no-shows: betrouwbare medewerkers die weten wat er op het spel staat" },
                    { icon: Users, text: "Meer continuïteit: vaste gezichten die jouw hotel door en door kennen" },
                    { icon: Heart, text: "Betere gastbeleving: gemotiveerd personeel zorgt voor een glimlach" },
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
      {/* 10. FAQ VOOR HOTELS                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <FAQSection
        heading="Veelgestelde vragen over hotelpersoneel"
        faqs={[
          { q: "Hoe snel kunnen jullie hotelpersoneel leveren?", a: "Bij EXTRA kunnen we in veel gevallen binnen 48 uur geschikt hotelpersoneel leveren. Dankzij onze vaste poule van geselecteerde hotelmedewerkers kunnen we snel schakelen bij uitval, piekdrukte of last-minute aanvragen. Neem contact op en we kijken direct wat mogelijk is." },
          { q: "Kunnen jullie housekeeping personeel leveren?", a: "Ja. Housekeeping is één van onze kernspecialisaties voor hotels. We leveren ervaren kamermeisjes en room attendants die vertrouwd zijn met hotelstandaarden en kwaliteitscontroles. Via onze favorietenpoule bouwen we een vast team op dat jouw hotel door en door kent." },
          { q: "Kunnen jullie personeel leveren voor banqueting en conferenties?", a: "Ja. EXTRA levert professionele bediening en keukenmedewerkers voor banqueting, conferenties en events in hotels. Van kleine boardroom-lunches tot gala-diners van 300+ gasten. We hebben ervaren medewerkers die weten hoe formele hotelservice werkt." },
          { q: "Hoe werkt het met vaste teams per hotel?", a: "EXTRA werkt met favorietenpoules per opdrachtgever. We bouwen per hotel een vaste poule op van medewerkers die jouw locatie kennen. Dezelfde gezichten, minder uitleg, hogere kwaliteit. Dit geldt per afdeling: housekeeping, F&B, banqueting en front office." },
          { q: "Voor welke hotelfuncties kan ik personeel inhuren?", a: "Via EXTRA kun je personeel inhuren voor: housekeeping, front office, F&B bediening, banqueting, keuken (chefs, sous-chefs, keukenmedewerkers), afwassers en roomservice. We kijken altijd welke medewerkers het beste passen bij jouw hotel en standaard." },
          { q: "Hoe wordt de kwaliteit van hotelpersoneel bewaakt?", a: "Na elke dienst meten we hoe een medewerker heeft gepresteerd bij jouw hotel. Scores, complimenten en klachten worden geregistreerd. Zo weten we wie structureel goed presteert op jouw locatie en wie we prioriteit geven bij toekomstige aanvragen." },
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
              <Building2 className="w-4 h-4" /> Hotelpersoneel nodig?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Vraag direct{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA personeel aan</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Of je nu structurele ondersteuning zoekt voor housekeeping, tijdelijke versterking bij een event of een vaste poule wilt opbouwen. EXTRA regelt het. Snel, betrouwbaar en volledig in loondienst.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mb-10 sm:mb-14">
              <a
                href="/personeelsaanvraag"
                className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3"
                style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
              >
                Vraag hotelpersoneel aan
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
                { icon: Clock, text: "Binnen 48 uur beschikbaar" },
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
