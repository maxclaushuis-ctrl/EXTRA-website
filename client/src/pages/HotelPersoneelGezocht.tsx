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
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoNH from "@assets/Copyright_nh_hotel_group_Logo_NH-Hotels_1769548607559.webp";
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
        { "@type": "Question", "name": "Kunnen jullie housekeeping personeel leveren?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Housekeeping is één van onze kernspecialisaties voor hotels. We leveren ervaren kamermeisjes en room attendants die vertrouwd zijn met hotelstandaarden zoals SOP's en kwaliteitscontroles." } },
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
                <Building2 className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">Specialist in hotelpersoneel</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 gecertificeerd</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Hotelpersoneel nodig?{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA regelt het.</span>
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
                desc: "Ervaren kamermeisjes en room attendants die werken volgens jouw SOP's en kwaliteitsstandaarden.",
                tags: ["Kamerreiniging", "Badkamers", "Linnengoed", "Inspectie"],
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
              { emoji: "🏨", title: "Vertrouwd met hotelstandaarden", desc: "Onze medewerkers kennen het verschil tussen drie en vijf sterren service. Ze werken volgens SOP's, dresscodes en guestrelations protocollen." },
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
      {/* 4. HOE WIJ HOTELPERSONEEL SELECTEREN               */}
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
                Gastbeleving begint bij<br className="hidden sm:block" /> betrouwbaar personeel
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                In een hotel is iedere medewerker onderdeel van de merkbeleving. EXTRA meet na iedere dienst prestaties zodat kwaliteit structureel gewaarborgd blijft.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-14 max-w-4xl mx-auto">
              {[
                { text: "Na iedere dienst beoordeling op gastvrijheid en uitvoering" },
                { text: "No shows en klachten direct geregistreerd" },
                { text: "Consistentie per medewerker inzichtelijk" },
                { text: "Kwaliteitsdalingen snel gesignaleerd" },
                { text: "Vaste poules van bewezen medewerkers" },
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
                    <p className="text-xs text-gray-500 mt-0.5">Real-time data van alle medewerkers — inclusief hotelplaatsingen</p>
                  </div>
                  <img src={screenshotGebruikers} alt="Dashboard medewerkers overzicht met ratings" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-4 text-center">We sturen op feiten, niet op gevoel</p>
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
                  <img src={screenshotProfiel} alt="Individueel medewerkersprofiel met beoordelingen" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-4 text-center">Zo selecteren we op bewezen kwaliteit per hotellocatie</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 6. FAVORIETENPOULES VOOR HOTELS                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="favorietenpoule" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <div>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                  <Heart className="w-4 h-4" /> Favorietenpoules voor hotels
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Vaste teams die<br /> jouw hotel kennen
                </h2>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8">
                  In hotels draait alles om consistentie. Met een vaste favorietenpoule hoef je niet steeds opnieuw uit te leggen hoe jouw hotel werkt.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Users, text: "Vaste poules per afdeling zoals housekeeping, F&B, banqueting en front office" },
                    { icon: Heart, text: "Medewerkers kennen jouw hotel en procedures" },
                    { icon: TrendingUp, text: "Sneller schakelen bij last minute aanvragen" },
                    { icon: Star, text: "Hogere gastbeleving door vaste gezichten" },
                    { icon: Tag, text: "Tags per medewerker zoals housekeeping topper of F&B ervaren" },
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
                  Bouw jouw hotelpoule op <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "🛏️", title: "Vaste housekeeping poule", desc: "Kamermeisjes die elke kamer, elke etage en elke SOP van jouw hotel kennen.", tag: "Housekeeping" },
                  { icon: "🥂", title: "Vaste banqueting teams", desc: "Dezelfde bediening bij elk groot event. Ze kennen de opstelling, de service en jouw standaard.", tag: "Banqueting" },
                  { icon: "🍳", title: "Vaste keukenploeg", desc: "Chefs en keukenmedewerkers die jouw keuken, menukaart en processen kennen.", tag: "F&B & Keuken" },
                  { icon: "🏨", title: "Front office bekenden", desc: "Receptiemedewerkers die gasten herkennen, systemen kennen en jouw merk uitdragen.", tag: "Front Office" },
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
      {/* 8. LOGO'S VAN HOTELKLANTEN                         */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">
              Vertrouwd door toonaangevende hotelketens in Amsterdam
            </p>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 lg:gap-20">
              {[
                { src: logoMarriott, alt: "Marriott Hotels" },
                { src: logoHilton, alt: "Hilton Hotels" },
                { src: logoAmrath, alt: "Amrâth Hotels" },
                { src: logoNH, alt: "NH Hotels" },
              ].map((logo, i) => (
                <div key={i} className="hover:scale-105 transition-transform duration-300">
                  <img src={logo.src} alt={logo.alt} width="200" height="200" loading="lazy" decoding="async" className="h-12 sm:h-16 lg:h-20 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 9. KLANTCASE HOTEL                                 */}
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
      {/* 10. FAQ VOOR HOTELS                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <FAQSection
        heading="Veelgestelde vragen over hotelpersoneel"
        faqs={[
          { q: "Hoe snel kunnen jullie hotelpersoneel leveren?", a: "Bij EXTRA kunnen we in veel gevallen binnen 48 uur geschikt hotelpersoneel leveren. Dankzij onze vaste poule van geselecteerde hotelmedewerkers kunnen we snel schakelen bij uitval, piekdrukte of last-minute aanvragen. Neem contact op en we kijken direct wat mogelijk is." },
          { q: "Kunnen jullie housekeeping personeel leveren?", a: "Ja. Housekeeping is één van onze kernspecialisaties voor hotels. We leveren ervaren kamermeisjes en room attendants die vertrouwd zijn met hotelstandaarden, SOP's en kwaliteitscontroles. Via onze favorietenpoule bouwen we een vast team op dat jouw hotel door en door kent." },
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
