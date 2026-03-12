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
  BarChart3, Trophy
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoMercure from "../../assets/pitch/logo-mercure.png";
import logoPulitzer from "../../assets/pitch/logo-pulitzer-clean.png";
import logoNH from "../../assets/pitch/logo-nh-clean.png";
import screenshotGebruikers from "@assets/Gebruikers_1772098047298.webp";
import screenshotProfiel from "@assets/Medewerkersprofiel_1772098064753.webp";
import screenDashboard from "@assets/IMG_9066_1773314165933.png";
import screenRewards from "@assets/IMG_9067_1773314165933.png";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.png";
import screenRanglijst from "@assets/IMG_9068_1773314165933.png";
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
  { key: "rewards", img: screenRewards, label: "Rewards" },
  { key: "challenges", img: screenUitdagingen, label: "Challenges" },
  { key: "leaderboard", img: screenRanglijst, label: "Leaderboard" },
];

export default function HotelStaffingAmsterdam() {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    document.title = "Hotel Staff Amsterdam | Hotel Staffing Agency | EXTRA";

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

    setMeta("description", "Need hotel staff? EXTRA provides experienced employees for housekeeping, front office, banqueting and F&B. Screened staff who understand hotel standards.");
    setLink("canonical", "https://www.doehetextra.nl/en/hotel-staffing-amsterdam");
    setMeta("og:title", "Hotel Staff Amsterdam | Hotel Staffing Agency | EXTRA", "property");
    setMeta("og:description", "Need hotel staff? EXTRA provides experienced employees for housekeeping, front office, banqueting and F&B. Screened staff who understand hotel standards.", "property");
    setMeta("og:url", "https://www.doehetextra.nl/en/hotel-staffing-amsterdam", "property");
    setMeta("og:type", "website", "property");

    addSchema("hotel-faq-schema-en", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How quickly can you supply hotel staff?", "acceptedAnswer": { "@type": "Answer", "text": "At EXTRA, we can often supply suitable hotel staff within 48 hours. Thanks to our fixed pool of selected hotel employees, we can act quickly in case of absence, peak demand or last-minute requests." } },
        { "@type": "Question", "name": "Can you provide housekeeping staff?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Housekeeping is one of our core specialisations for hotels. We supply experienced chambermaids and room attendants who are familiar with hotel standards and quality controls." } },
        { "@type": "Question", "name": "Can you provide staff for banqueting?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. EXTRA provides professional service and kitchen staff for banqueting and conferences in hotels. From small boardroom lunches to gala dinners of 300+ guests." } },
        { "@type": "Question", "name": "How does it work with fixed teams per hotel?", "acceptedAnswer": { "@type": "Answer", "text": "EXTRA works with favourite pools per client. We build a fixed pool of employees for each hotel who know your location. Same faces, less explanation, higher quality." } },
        { "@type": "Question", "name": "For which hotel roles can I hire staff?", "acceptedAnswer": { "@type": "Answer", "text": "Through EXTRA you can hire staff for: housekeeping, front office, F&B, banqueting, kitchen, dishwashers and room service. We always look for the employees that best fit your hotel and standards." } },
      ]
    });

    const interval = setInterval(() => setActiveScreen(p => (p + 1) % appScreens.length), 3500);
    return () => {
      clearInterval(interval);
      document.getElementById("hotel-faq-schema-en")?.remove();
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
                <span className="text-white/90 text-xs sm:text-sm font-semibold">Specialist in hotel staff</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 certified</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Need hotel staff?{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA sorts it.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-70 rounded-sm" />
              </span>
            </h1>
            <p className="text-base sm:text-xl text-purple-100/90 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              From housekeeping to banqueting, from front office to F&B. EXTRA provides flexible hotel staff who understand hotel standards. Every employee personally selected and fully employed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Request hotel staff
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/30 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                <Phone className="w-5 h-5" /> Direct contact
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              {[
                { icon: Check, text: "Everyone fully employed" },
                { icon: Star, text: "Experience with hotel standards" },
                { icon: Clock, text: "Available within 48 hours" },
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
                <Users className="w-4 h-4" /> Roles for hotels
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                The right people for every hotel role
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Whether it's daily occupancy or peak demand. EXTRA provides experienced hotel staff for every role within your hotel.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: BedDouble,
                title: "Housekeeping",
                desc: "Experienced chambermaids and room attendants who work according to your quality standards.",
                tags: ["AD", "Turndown", "Wellness", "Houseman", "Room attendant"],
                color: "from-purple-600 to-purple-800",
              },
              {
                icon: Building2,
                title: "Front Office",
                desc: "Representative staff for reception, check-in, check-out and guest relations. Professional, welcoming and used to hotel processes.",
                tags: ["Reception", "Check-in/out", "Guest relations", "Concierge"],
                color: "from-blue-500 to-indigo-600",
              },
              {
                icon: Utensils,
                title: "F&B Staff",
                desc: "Hospitable F&B staff for hotel restaurants, breakfast service, room service and banqueting.",
                tags: ["Service", "Restaurant staff", "Breakfast staff", "Banqueting staff", "Runner"],
                color: "from-indigo-500 to-purple-600",
              },
              {
                icon: GlassWater,
                title: "Banqueting",
                desc: "Professional service for conferences, gala dinners, meetings and events. Experience with larger groups and hotel service.",
                tags: ["Conferences", "Gala dinners", "Boardroom", "Events"],
                color: "from-pink-500 to-purple-600",
              },
              {
                icon: ChefHat,
                title: "Chefs and Kitchen Staff",
                desc: "Experienced chefs, sous chefs and cooks for à la carte service, banqueting and breakfast service in hotels.",
                tags: ["Chef de partie", "Sous-chef", "Independent cook", "Commis"],
                color: "from-orange-500 to-pink-600",
              },
              {
                icon: CookingPot,
                title: "Dishwashers and Kitchen Support",
                desc: "Reliable support for busy hotel kitchens. Dishwashers and kitchen assistants who ensure the kitchen keeps running.",
                tags: ["Dishwasher", "Kitchen assistant", "Scullery staff"],
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
                Request hotel staff
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
                <Shield className="w-4 h-4" /> Why EXTRA
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Why hotels choose EXTRA
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Hotel staff requires more than just experience. Hospitality, representativeness and consistency are essential. EXTRA understands that.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { emoji: "🏨", title: "Familiar with hotel standards", desc: "Our staff know the difference between three and five star service. They work according to hotel standards, dress codes and guest relations protocols." },
              { emoji: "🤝", title: "Fixed faces per hotel", desc: "Through favorite pools we build a fixed pool for each hotel. Employees who know your procedures and are immediately deployable." },
              { emoji: "📈", title: "Performance data per shift", desc: "We track performance after every shift. You only get employees who have proven to be reliable and hospitable." },
              { emoji: "📱", title: "Efficient staff app", desc: "Our app is designed for speed. Plan, review and communicate directly with your regular pool of employees." },
              { emoji: "💜", title: "Motivated employees", desc: "Through our unique EXTRAATje reward system, our staff are extra motivated to perform well at your location." },
              { emoji: "✅", title: "Full compliance", desc: "As a NEN-4400-1 certified agency, we handle all tax and legal obligations. You run zero risk." },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 h-full">
                  <div className="text-4xl mb-6">{item.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 4. DATA SECTION                                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Data-driven hospitality
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Staff selection based on real performance
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Stop guessing. We measure soft skills, service quality and reliability after every single shift. This data ensures you always get the best fit for your hotel's unique requirements.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  "Individual scores for every team member",
                  "Reliability and no-show tracking",
                  "Qualitative feedback from your supervisors",
                  "Automatic priority for your top-rated staff"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-gray-700 font-semibold">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-2xl font-black text-purple-600">4.8/5</p>
                  <p className="text-sm font-bold text-purple-800">Average staff rating</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-2xl font-black text-purple-600">98%</p>
                  <p className="text-sm font-bold text-purple-800">Shift fulfillment rate</p>
                </div>
              </div>
            </RevealSection>
            <RevealSection delay={200}>
              <div className="space-y-6">
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Regular Pool</span>
                    </div>
                    <img src={screenshotGebruikers} alt="Staff overview" className="w-full object-cover" />
                  </div>
                </div>
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detailed Performance Score</span>
                    </div>
                    <img src={screenshotProfiel} alt="Staff profile" className="w-full object-cover" />
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 5. APP SECTION                                     */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-[#0f0a1a]">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <XPatternBg count={4} opacity={0.15} color="rgba(168,85,247,0.5)" className="z-10" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-20">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <RevealSection>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-purple-400/30 mb-8">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-purple-100 text-sm font-bold tracking-wide uppercase">Motivated by EXTRAATje</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-white mb-8 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Employees who go the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">extra mile</span>
              </h2>
              <p className="text-xl text-purple-100/70 leading-relaxed mb-10">
                Staffing isn't just about filling slots; it's about motivation. Our unique rewards system gamifies work, rewarding reliability and high scores with real prizes.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Trophy, title: "Challenges", desc: "Staff earn points by completing special tasks or high-pressure shifts." },
                  { icon: Gift, title: "Real Rewards", desc: "Points are exchanged for vouchers, experiences and gadgets in our shop." },
                  { icon: BarChart3, title: "Leaderboards", desc: "Healthy competition drives consistency and performance across the board." },
                  { icon: Heart, title: "Engagement", desc: "Higher motivation leads to lower no-shows and better service for your guests." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-1">{item.title}</h3>
                      <p className="text-purple-200/50 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={300}>
              <div className="relative">
                <div className="absolute -inset-4 bg-purple-500/20 rounded-[3rem] blur-3xl" />
                <div className="relative bg-gradient-to-b from-gray-900 to-black rounded-[2.5rem] p-4 border border-white/10 shadow-2xl">
                  <div className="aspect-[9/19] rounded-[2rem] overflow-hidden bg-gray-800 relative group">
                    <img
                      src={appScreens[activeScreen].img}
                      alt={appScreens[activeScreen].label}
                      className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                      <p className="text-white font-black text-2xl mb-1">{appScreens[activeScreen].label}</p>
                      <div className="flex gap-1.5">
                        {appScreens.map((_, i) => (
                          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === activeScreen ? "w-8 bg-purple-500" : "w-2 bg-white/30"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 6. POULES SECTION                                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection className="order-2 lg:order-1">
              <div className="relative space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-100 transform -rotate-2">
                  <img src={poulesMatches} alt="Matching process" className="w-full h-auto" />
                </div>
                <div className="absolute -bottom-6 -right-6 w-1/2 rounded-2xl overflow-hidden shadow-2xl border border-gray-100 transform rotate-3 z-10">
                  <img src={poulesButton} alt="Pool creation" className="w-full h-auto" />
                </div>
                <div className="absolute -top-6 -left-6 w-2/3 rounded-2xl overflow-hidden shadow-2xl border border-gray-100 transform -rotate-1 z-0">
                  <img src={scoreSnippet} alt="Staff scores" className="w-full h-auto" />
                </div>
              </div>
            </RevealSection>
            <RevealSection className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Heart className="w-4 h-4" /> Fixed team
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Build your own favourite pool
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Stop explaining your procedures every day. We help you build a fixed team of EXTRA professionals who know your hotel, your brand and your guests.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Mark as favourite</h3>
                    <p className="text-gray-500 text-sm">Found someone you like? Add them to your regular pool with one click.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Priority booking</h3>
                    <p className="text-gray-500 text-sm">Your favourites always see your new shift requests first.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Efficiency</h3>
                    <p className="text-gray-500 text-sm">Less training, higher quality and consistent guest experiences.</p>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 7. LOGO MARQUEE                                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white border-y border-gray-100 relative overflow-hidden">
        <RevealSection>
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Trusted by industry leaders</p>
          </div>
        </RevealSection>
        <div className="relative flex overflow-hidden group">
          <div className="flex animate-marquee group-hover:pause gap-12 sm:gap-20 items-center">
            {[
              { src: logoMarriott, alt: "Marriott" },
              { src: logoHilton, alt: "Hilton" },
              { src: logoAmrath, alt: "Amrath" },
              { src: logoNH, alt: "NH Hotels" },
              { src: logoMercure, alt: "Mercure" },
              { src: logoPulitzer, alt: "Pulitzer" },
              { src: logoMarriott, alt: "Marriott" },
              { src: logoHilton, alt: "Hilton" },
              { src: logoAmrath, alt: "Amrath" },
              { src: logoNH, alt: "NH Hotels" },
              { src: logoMercure, alt: "Mercure" },
              { src: logoPulitzer, alt: "Pulitzer" },
            ].map((logo, i) => (
              <img key={i} src={logo.src} alt={logo.alt} className="h-10 sm:h-16 w-auto grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: fit-content;
            animation: marquee 30s linear infinite;
          }
          .pause { animation-play-state: paused; }
        `}</style>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 8. REVIEWS                                         */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-32 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-16 sm:mb-24">
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>What our hotel partners say</h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">Experience stories from Amsterdam's leading hotels working with EXTRA.</p>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-2 gap-8">
            {getReviewsByCategory("hotels").map((review, i) => (
              <RevealSection key={i} delay={i * 100}>
                <ClientReviewCard review={review} />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 9. FAQ                                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <FAQSection
        heading="Frequently asked questions about hotel staffing"
        faqs={[
          { q: "How quickly can you supply hotel staff?", a: "At EXTRA, we can often supply suitable hotel staff within 48 hours. Thanks to our fixed pool of selected hotel employees, we can act quickly in case of absence, peak demand or last-minute requests." },
          { q: "Can you provide housekeeping staff?", a: "Yes. Housekeeping is one of our core specialisations for hotels. We supply experienced chambermaids and room attendants who are familiar with hotel standards and quality controls." },
          { q: "Can you provide staff for banqueting?", a: "Yes. EXTRA provides professional service and kitchen staff for banqueting and conferences in hotels. From small boardroom lunches to gala dinners of 300+ guests." },
          { q: "How does it work with fixed teams per hotel?", a: "EXTRA works with favourite pools per client. We build a fixed pool of employees for each hotel who know your location. Same faces, less explanation, higher quality." },
          { q: "For which hotel roles can I hire staff?", a: "Through EXTRA you can hire staff for: housekeeping, front office, F&B, banqueting, kitchen, dishwashers and room service. We always look for the employees that best fit your hotel and standards." },
        ]}
      />

      {/* ═══════════════════════════════════════════════════ */}
      {/* 10. CTA SECTION                                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-purple-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-indigo-900 opacity-90" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.9)" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Ready to upgrade your hotel staffing?
            </h2>
            <p className="text-xl text-purple-100/80 mb-12 max-w-2xl mx-auto">
              Join the leading Amsterdam hotels that trust EXTRA for their flexible staffing needs. Experienced, motivated and fully compliant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-10 py-5 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                Request staff now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/30 text-white font-bold px-10 py-5 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" /> Call us directly
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
