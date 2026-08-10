import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  Users, Gift, Star, TrendingUp, Shield, Clock,
  ArrowRight, Check, Briefcase, UserCheck,
  Heart, Zap, Building2, UtensilsCrossed, PartyPopper, Wine,
  Tag, BarChart3, CalendarCheck, AlertCircle, Bell, Lock,
  CheckCircle2, Flame, Phone
} from "lucide-react";
import heroBgImage from "@assets/GROUP_SHOT_002_1775572320033.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import screenDashboard from "@assets/IMG_9066_1773314165933.webp";
import screenRewards from "@assets/IMG_9067_1773314165933.webp";
import screenRanglijst from "@assets/IMG_9068_1773314165933.webp";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoMercure from "../../assets/pitch/logo-mercure.webp";
import logoPulitzer from "@assets/Logo_Pulitzer_1773389329669.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoWestweelde from "../../assets/pitch/logo-westweelde-clean.webp";
import { CLIENT_REVIEWS } from "@/data/reviews";
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

function RevealSection({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
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
  return <span ref={ref}>{hasDecimal ? count.toFixed(1) : count.toLocaleString("en-GB")}{suffix}</span>;
}

function XPatternBg({ className = "", count = 3, opacity = 0.12, color = "rgba(139,92,246,1)" }: {
  className?: string; count?: number; opacity?: number; color?: string;
}) {
  const positions = [
    { left: "5%",  top: "10%", size: 200, rotate: 15 },
    { left: "80%", top: "20%", size: 160, rotate: -25 },
    { left: "50%", top: "60%", size: 240, rotate: 35 },
    { left: "15%", top: "75%", size: 180, rotate: -10 },
    { left: "90%", top: "80%", size: 140, rotate: 45 },
    { left: "35%", top: "30%", size: 120, rotate: -30 },
  ];
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {positions.slice(0, count).map((pos, i) => (
        <div key={i} className="absolute" style={{
          left: pos.left, top: pos.top, width: pos.size, height: pos.size,
          transform: `rotate(${pos.rotate}deg)`, opacity,
          WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          backgroundColor: color,
        }} />
      ))}
    </div>
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
        <div className="overflow-hidden">
          <img src={src} alt={alt} className="w-full object-cover object-top" loading="lazy" decoding="async" />
        </div>
      </div>
    </div>
  );
}

function GrainOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat", backgroundSize: "256px 256px", opacity: 0.4, mixBlendMode: "overlay",
    }} />
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard", alt: "Screenshot of the EXTRAATje dashboard in the hospitality staff app: points balance, bronze status and popular rewards" },
  { key: "rewards",   img: screenRewards,   label: "Rewards", alt: "Screenshot of the rewards catalogue in the EXTRAATje app, showing redeemable gifts such as a JBL speaker and AirPods" },
  { key: "rankings",  img: screenRanglijst, label: "Rankings", alt: "Screenshot of the leaderboard in the EXTRAATje app showing hospitality staff members' point rankings" },
  { key: "challenges",img: screenUitdagingen,label: "Challenges", alt: "Screenshot of an active challenge in the EXTRAATje app: earning extra points by working more shifts" },
];

export default function HospitalityStaffAmsterdam() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  const clientReviews = ["amrath", "westweelde", "hart"].map((id) => {
    const r = CLIENT_REVIEWS.find((x) => x.id === id)!;
    return { quote: r.quote, name: r.author, rating: 5, role: r.role, company: r.company };
  });

  useEffect(() => {
    document.title = "Hospitality staff wanted | Flexible staff via EXTRA Amsterdam";

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
      const s = document.createElement("script"); s.id = id; s.type = "application/ld+json";
      s.text = JSON.stringify(data); document.head.appendChild(s);
    };

    setMeta("description", "Need hospitality staff? EXTRA supplies flexible staff for hotels, restaurants, caterers and events. Vetted, reliable and immediately deployable.");
    setLink("canonical", "https://www.doehetextra.nl/en/hospitality-staff-amsterdam");
    setMeta("og:title", "Hospitality staff wanted | Flexible staff via EXTRA Amsterdam", "property");
    setMeta("og:description", "Need hospitality staff? EXTRA supplies flexible staff for hotels, restaurants, caterers and events. Vetted, reliable and immediately deployable.", "property");
    setMeta("og:url", "https://www.doehetextra.nl/en/hospitality-staff-amsterdam", "property");
    setMeta("og:type", "website", "property");
    setMeta("og:image", "https://www.doehetextra.nl/extra_email_banner_bg.png", "property");

    addSchema("local-business-schema-hsa", {
      "@context": "https://schema.org", "@type": "LocalBusiness", "name": "EXTRA",
      "description": "Flexible hospitality staff via EXTRA, NEN-4400-1 certified staffing agency in Amsterdam.",
      "telephone": "+31851305915", "url": "https://www.doehetextra.nl",
      "address": { "@type": "PostalAddress", "streetAddress": "Herengracht 372", "postalCode": "1016 CH", "addressLocality": "Amsterdam", "addressCountry": "NL" },
    });

    addSchema("faq-schema-hsa", {
      "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How quickly can you supply hospitality staff?", "acceptedAnswer": { "@type": "Answer", "text": "At EXTRA we understand that busy periods often arise unexpectedly. Thanks to our large pool of experienced staff we can usually deploy people quickly. In many cases we can propose suitable candidates within 48 hours for hotels, restaurants, events or catering assignments." } },
        { "@type": "Question", "name": "For which roles can I hire hospitality staff?", "acceptedAnswer": { "@type": "Answer", "text": "Via EXTRA you can hire staff for various roles in hospitality. Think of waiting staff, bar staff, runners, chefs, front office agents and housekeeping." } },
        { "@type": "Question", "name": "What does hospitality staff cost via a staffing agency?", "acceptedAnswer": { "@type": "Answer", "text": "Costs depend on the role, experience level and duration of the assignment. EXTRA works with transparent rates." } },
        { "@type": "Question", "name": "Can you scale up flexibly for busy periods or events?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Flexibility is one of the key advantages of working with EXTRA. Whether it's a large event, a busy weekend or a temporary spike: we can scale up and down quickly." } },
        { "@type": "Question", "name": "How can I request staff from EXTRA?", "acceptedAnswer": { "@type": "Answer", "text": "You can easily request staff via the request form on our website. Once we receive the request we'll be in touch to discuss your requirements and planning." } },
      ],
    });

    const screenInterval = setInterval(() => setActiveScreen(prev => (prev + 1) % appScreens.length), 3500);
    return () => {
      document.getElementById("local-business-schema-hsa")?.remove();
      document.getElementById("faq-schema-hsa")?.remove();
      clearInterval(screenInterval);
    };
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <GrainOverlay />
      <PublicNav />

      {/* ══ 1. HERO ══ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, #2d0663 0%, #4a0e96 35%, #5b16a8 65%, #6d28d9 100%)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { left: "3%",  top: "8%",  w: 240, rot:  12, op: 0.10 },
            { left: "6%",  top: "58%", w: 180, rot: -15, op: 0.07 },
            { left: "42%", top: "72%", w: 140, rot:  20, op: 0.05 },
          ].map((x, i) => (
            <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity: x.op, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: "rgba(255,255,255,0.9)" }} />
          ))}
        </div>

        <div className="absolute top-1/2 left-[38%] -translate-y-1/2 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-4 w-72 h-72 bg-violet-800/30 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute inset-0 pointer-events-none">
          <img src={heroBgImage} alt="" className="w-full h-full object-cover" loading="eager" style={{ objectPosition: "center top", filter: "contrast(1.08) saturate(1.15) brightness(1.04)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 42% 68% at 68% 46%, rgba(255,248,255,0.12) 0%, rgba(220,180,255,0.04) 55%, transparent 75%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(29,5,73,1) 0%, rgba(29,5,73,1) 26%, rgba(45,6,99,0.82) 40%, rgba(58,8,128,0.38) 51%, rgba(72,14,148,0.10) 60%, transparent 68%)" }} />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: "22%", background: "linear-gradient(to top, rgba(29,5,73,0.82) 0%, rgba(29,5,73,0.30) 50%, transparent 100%)" }} />
          <div className="absolute top-0 left-0 right-0" style={{ height: "18%", background: "linear-gradient(to bottom, rgba(29,5,73,0.50) 0%, transparent 100%)" }} />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">800+ active staff members</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 certified</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Full roster,{" "}
              <span className="relative inline-block">
                <span className="relative z-10">too few people?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-70 rounded-sm" />
              </span>
            </h1>

            <p className="text-base sm:text-xl text-purple-100/90 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              EXTRA quickly supplies flexible hospitality staff for hotels, events, caterers and restaurants. Everyone personally selected, everyone employed by us.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Request EXTRA staff
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/30 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                <Phone className="w-5 h-5" />
                Direct contact
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              {[
                { icon: Check, text: "Everyone employed by us" },
                { icon: Star,  text: "Personally selected" },
                { icon: Clock, text: "Quickly available" },
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

      {/* ══ 2. SECTORS ══ */}
      <section id="sectors" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Briefcase className="w-4 h-4" /> Sectors
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Where do you need extra hospitality staff?
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                From large hotel chains to busy event venues. EXTRA supplies flexible hospitality staff that fits your location. Vetted, presentable and immediately deployable.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-8">
            {[
              {
                icon: Building2,
                title: "Hotels",
                desc: "Housekeeping, banqueting, front office and kitchen staff for hotels. Scale up flexibly during busy periods, events and seasonal peaks.",
                color: "from-purple-600 to-purple-800",
                border: "border-purple-100",
                link: "/en/hotel-staffing-amsterdam",
                tags: ["Housekeeping", "Front office", "Banqueting", "Kitchen"],
              },
              {
                icon: PartyPopper,
                title: "Event venues",
                desc: "Presentable staff for large and small events. From waiting staff to runners and bar staff. Teams of 5 to 60 people.",
                color: "from-pink-500 to-purple-600",
                border: "border-pink-100",
                link: "/en/event-staff-amsterdam",
                tags: ["Waiting staff", "Bar", "Runners", "Coat check"],
              },
              {
                icon: UtensilsCrossed,
                title: "Caterers",
                desc: "Chefs, waiting staff and kitchen workers for catering and events at any venue.",
                color: "from-indigo-500 to-purple-600",
                border: "border-indigo-100",
                link: "/en/catering-staff-amsterdam",
                tags: ["Chefs", "Waiting staff", "Kitchen workers"],
              },
              {
                icon: Wine,
                title: "Restaurants",
                desc: "Waiting staff, cooks and bar staff for restaurants during busy periods, sick calls and peak moments.",
                color: "from-blue-500 to-indigo-600",
                border: "border-blue-100",
                link: "/en/restaurant-staff-amsterdam",
                tags: ["Waiting staff", "Bar", "Kitchen", "Runners"],
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
                      View options <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </a>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3. WHY EXTRA ══ */}
      <section id="why-extra" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Shield className="w-4 h-4" /> Why EXTRA
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Why hospitality businesses choose EXTRA
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Not a standard staffing agency. EXTRA works differently. We build fixed teams, select rigorously and measure quality continuously.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { emoji: "🛡️", title: "Everyone employed by us", desc: "Fully NEN-4400-1 certified and compliant with 2026 labour law. No self-employment constructions, no risks." },
              { emoji: "🤝", title: "Personally known to us", desc: "Every staff member has come to our office for an interview. You always know who is coming to your venue." },
              { emoji: "⭐", title: "Selected on soft & hard skills", desc: "Rigorous screening on expertise, attitude, appearance and performance history after every shift." },
              { emoji: "📞", title: "Available 24/7", desc: "Quick response to drop-outs or last-minute requests. We're there when you need us." },
              { emoji: "📊", title: "Continuously measured quality", desc: "A rating after every shift. So we always know exactly who performs consistently well at your venue." },
              { emoji: "🎁", title: "EXTRAATje reward system", desc: "Higher motivation, fewer no-shows and fixed teams. Staff who genuinely want to come back to your venue." },
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
                Fully compliant with 2026 labour law, NEN-4400-1 certified
              </span>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ 4. LOGO MARQUEE ══ */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">
              Trusted by hotels, caterers and event venues
            </p>
          </RevealSection>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee-hsa group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                  {[
                    { src: logoMarriott,      alt: "Marriott" },
                    { src: logoHilton,        alt: "Hilton" },
                    { src: logoMercure,       alt: "Mercure Hotels" },
                    { src: logoPulitzer,      alt: "Pulitzer Amsterdam" },
                    { src: logoHartMuseum,    alt: "H'art Museum" },
                    { src: logoSelectCatering,alt: "Select Catering" },
                    { src: logoAppel,         alt: "Appèl" },
                    { src: logoAmrath,        alt: "Amrâth Hotels" },
                    { src: logoFcUtrecht,     alt: "FC Utrecht" },
                    { src: logoWestweelde,    alt: "Westweelde" },
                    { src: logoFunda,         alt: "Funda" },
                    { src: logoHetePeper,     alt: "Hete Peper" },
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
        <style>{`@keyframes marquee-hsa { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee-hsa { animation: marquee-hsa 40s linear infinite; }`}</style>
      </section>

      {/* ══ 5. CLIENT REVIEWS ══ */}
      <section id="reviews" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/50 px-4 sm:px-5 py-2 rounded-full">
                <Heart className="w-4 h-4" /> Experiences
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What others say
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mt-4 sm:mt-6">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <span className="text-base sm:text-xl font-bold text-gray-900 ml-0.5">4.8</span>
                </div>
                <span className="text-sm sm:text-base text-gray-500">average from <span className="font-semibold text-gray-700">232 Google reviews</span></span>
              </div>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
            {clientReviews.map((review, i) => (
              <RevealSection key={i} delay={i * 120}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col shadow-sm">
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, j) => <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />)}
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
                    <button onClick={() => setExpandedReviews(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; })} className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-800 underline underline-offset-2 cursor-pointer">
                      {expandedReviews.has(i) ? "Read less" : "Read more"}
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
              <Link href="/en/client-stories">
                <button className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm sm:text-base text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-200" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
                  View all client stories <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ 6. SCREENING PROCESS ══ */}
      <section id="screening" className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/70 px-5 py-2 rounded-full">
                <UserCheck className="w-4 h-4" /> Screening process
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Every candidate, personally screened
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Before a staff member arrives at your venue, they have met us in person at our office and been assessed digitally per role. You always know exactly who's coming through the door.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { n: 1, emoji: "⭐", label: "Top performer!" },
                  { n: 2, emoji: "🏆", label: "Lots of experience" },
                  { n: 3, emoji: "💁", label: "Well-presented" },
                  { n: 4, emoji: "😄", label: "Enthusiastic" },
                  { n: 5, emoji: "🇳🇱", label: "NL" },
                  { n: 7, emoji: "🍽️", label: "3-plate carry" },
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
              <IpadMockup src={sollicitatieformulier} alt="Digital intake form screening hospitality staff EXTRA" />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══ 7. DATA-DRIVEN SELECTION ══ */}
      <section id="quality" className="relative py-20 sm:py-28 pb-28 sm:pb-36 overflow-x-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={2} opacity={0.05} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection className="order-2 lg:order-1">
              <div className="relative">
                <BrowserMockup src={dashboardKandidaten} alt="Candidates dashboard with scores per discipline EXTRA Amsterdam" />
                <div className="absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-6 w-[65%] rounded-2xl overflow-hidden shadow-2xl border border-white/80 ring-1 ring-purple-100/60 rotate-1 hover:rotate-0 transition-transform duration-300">
                  <img src={scoreSnippet} alt="Candidate scores: soft skills, bar, service and dining" className="w-full h-auto object-contain" loading="lazy" decoding="async" />
                </div>
              </div>
            </RevealSection>
            <RevealSection className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-100/60 px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Data & insight
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Your candidates selected on proven scores
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                We store every rating. Per staff member you can see scores on soft skills, service, bar and dining. That's how we always match the right person to your venue, without guesswork.
              </p>
              <div className="space-y-4">
                {[
                  "Every candidate profile with discipline scores",
                  "Immediate insight into who fits your concept",
                  "Objective matching based on work history",
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

      {/* ══ 8. FAVOURITES POOL ══ */}
      <section id="favourites-pool" className="relative py-20 sm:py-28 bg-white">
        <XPatternBg count={2} opacity={0.04} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-100/60 px-5 py-2 rounded-full">
                <Heart className="w-4 h-4" /> Favourites pool
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Familiar faces, less explaining
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                After every successful collaboration we add your favourites to your personal pool. Immediately deployable for your next request, no onboarding and no surprises.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Built on your preferences and feedback",
                  "Immediately deployable for your next request",
                  "Invite them yourself via the 'Invite to pool' button",
                  "Continuously updated after every shift",
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
                Build your fixed pool <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </RevealSection>
            <RevealSection delay={100}>
              <div className="relative pb-12 pr-4">
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/80 border border-gray-100 bg-white">
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <div className="ml-3 flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200 max-w-[180px]">app.doehetextra.nl</div>
                  </div>
                  <img src={poulesMatches} alt="Staff matches favourites pool EXTRA dashboard client" className="w-full h-auto object-contain" loading="lazy" decoding="async" />
                </div>
                <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:right-0 w-[55%] rounded-xl overflow-hidden shadow-xl border border-gray-100 -rotate-1 hover:rotate-0 transition-transform duration-300 bg-white">
                  <img src={poulesButton} alt="Invite to pool button EXTRA dashboard" className="w-full h-auto object-contain" loading="lazy" decoding="async" />
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══ 9. EXTRAATJE REWARD SYSTEM ══ */}
      <section id="extraatje" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.1} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/70 px-4 sm:px-5 py-2 rounded-full">
                <Gift className="w-4 h-4" /> EXTRAATje reward system
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Better motivation ={" "}
                <span className="relative inline-block">
                  <span className="relative z-10">better staff</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Our unique reward system creates motivated staff who genuinely want to come back. What you notice as a client: fewer no-shows, more continuity and fixed teams.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Staff member earns points", desc: "Every shift earns points. Performing well? Extra points. That's how quality is rewarded.", icon: "🏃" },
                { step: "2", title: "Status rises, motivation grows", desc: "From Bronze to Diamond. Higher status means better rewards and greater engagement.", icon: "💎" },
                { step: "3", title: "Staff want to come back", desc: "Building up points at your venue gives them a reason to stay. Fewer changing faces.", icon: "🎁" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 text-center hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 shadow-sm">
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">{item.icon}</div>
                  <div className="text-[10px] sm:text-xs font-black text-purple-500 uppercase tracking-widest mb-2 sm:mb-3">Step {item.step}</div>
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
                        <img key={screen.key} src={screen.img} alt={screen.alt} className={`w-full transition-opacity duration-500 ${activeScreen === i ? "opacity-100 relative" : "opacity-0 absolute inset-0"}`} />
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
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>What you notice as a client</h3>
                <ul className="space-y-4">
                  {[
                    { icon: TrendingUp, text: "Higher motivation, because staff want to earn points at your venue" },
                    { icon: Check,      text: "Fewer no-shows, because reliable staff actually show up" },
                    { icon: Users,      text: "More continuity — fixed teams who know your venue" },
                    { icon: Heart,      text: "Staff who genuinely want to come back to your location" },
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

      {/* ══ 10. STRICT CANCELLATION PROTOCOL ══ */}
      <section id="reliability" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Lock className="w-4 h-4" /> Reliability
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                We do not tolerate no-shows
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                A reliable staff member cancels properly. If they don't, there are consequences. This way you're never left with an unpleasant surprise.
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {[
              { icon: Bell, color: "from-blue-500 to-indigo-600", title: "Always call to cancel", desc: "Staff are required to cancel by phone. A text message or chat is not sufficient." },
              { icon: AlertCircle, color: "from-orange-500 to-red-500", title: "€50 fine for improper cancellation", desc: "Anyone who doesn't follow the protocol is fined €50. Immediate, consistent and fair." },
              { icon: Lock, color: "from-red-500 to-rose-600", title: "2× improper = non-active", desc: "After two improper cancellations a staff member is suspended. No second chance for carelessness." },
              { icon: Shield, color: "from-green-500 to-emerald-600", title: "You're never caught off guard", desc: "Thanks to this protocol you know in good time when someone can't make it — so we can arrange a replacement." },
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
                Reliability is not an afterthought at EXTRA
              </h3>
              <p className="text-purple-200/80 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
                Our cancellation protocol is not for show. It protects you as a client and ensures our staff take their responsibilities seriously.
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ 11. HOW WORKING WITH EXTRA WORKS ══ */}
      <section id="how-it-works" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={5} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                <Zap className="w-4 h-4" /> How it works for clients
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                How working with EXTRA works
              </h2>
              <p className="text-base sm:text-lg text-purple-200/70 mt-4 max-w-2xl mx-auto">
                From first request to a fixed favourites pool. Four steps.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { step: "1", icon: Phone,        title: "Tell us what you need",      desc: "Which roles, when and how many people? We immediately think along on the best approach." },
              { step: "2", icon: UserCheck,    title: "We select the right people", desc: "Based on experience, skills, ratings and favourites pool we put together the best team." },
              { step: "3", icon: CalendarCheck,title: "Your team is ready",         desc: "A tailor-made team, scheduled and ready to start. You don't have to do a thing." },
              { step: "4", icon: TrendingUp,   title: "Evaluate & build the pool",  desc: "Feedback after every assignment. That's how we jointly build a reliable, fixed favourites pool." },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-white/[0.06] backdrop-blur-sm rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-8 border border-white/[0.08] hover:border-purple-400/30 hover:bg-white/[0.10] hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 h-full text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4 sm:mb-5 mx-auto group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-black text-purple-400 uppercase tracking-widest mb-2 sm:mb-3">Step {item.step}</div>
                  <h3 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-purple-200/70 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={400}>
            <div className="text-center mt-10 sm:mt-14">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 sm:gap-3">
                Start a request now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ 12. FAQ ══ */}
      <FAQSection
        heading="Frequently asked questions"
        faqs={[
          { q: "How quickly can you supply hospitality staff?", a: "At EXTRA we understand that busy periods often arise unexpectedly. Thanks to our large pool of experienced staff we can usually deploy people quickly. In many cases we can propose suitable candidates within 48 hours for hotels, restaurants, events or catering assignments." },
          { q: "For which roles can I hire hospitality staff?", a: "Via EXTRA you can hire staff for various roles in hospitality. Think of waiting staff, bar staff, runners, chefs, front office agents and housekeeping. We always look at which staff members best fit the assignment and venue." },
          { q: "What does hospitality staff cost via a staffing agency?", a: "Costs depend on various factors such as role, experience level and duration of the assignment. At EXTRA we work with transparent rates and are happy to think along on a suitable solution for your situation." },
          { q: "Why do businesses choose a hospitality staffing agency?", a: "Many businesses choose a hospitality staffing agency because of the flexibility it offers. You can quickly deploy staff during busy periods, events or sick days. In addition, a staffing agency takes care of recruitment, selection and administration." },
          { q: "Can you scale up flexibly for busy periods or events?", a: "Yes. Flexibility is one of the key advantages of working with EXTRA. Whether it's a large event, a busy weekend or a temporary spike: we can scale up and down quickly with experienced hospitality staff." },
          { q: "What types of businesses does EXTRA supply staff to?", a: "EXTRA supplies hospitality staff to various businesses in the hospitality sector, such as hotels, event venues, caterers and restaurants. This gives us broad experience with a wide variety of assignments and work environments." },
          { q: "How can I request staff from EXTRA?", a: "You can easily request staff via the request form on our website. Once we receive the request we will be in touch to discuss your requirements and planning." },
        ]}
      />

      {/* ══ 13. FINAL CTA ══ */}
      <section id="cta" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
              <Zap className="w-4 h-4" /> Ready to get started?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Ready to deploy{" "}
              <span className="relative inline-block">
                <span className="relative z-10">extra staff?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Tell us what you need. We select the right people and quickly put a team together for you. Everyone employed by us, everyone personally known to us.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mb-10 sm:mb-14">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3" style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}>
                Request EXTRA staff
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3">
                <Phone className="w-5 h-5" />
                Schedule a call
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {[
                { icon: Shield, text: "NEN-4400-1 certified" },
                { icon: Users,  text: "Everyone employed by us" },
                { icon: Clock,  text: "Available 24/7" },
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
