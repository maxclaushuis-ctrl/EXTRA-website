import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  Users, Star, Shield, Clock, ArrowRight, Check, Phone,
  TrendingUp, Heart, Zap, Gift, UserCheck,
  Tag, BarChart3, Search, CalendarCheck, Sparkles,
  Briefcase, UtensilsCrossed, Building2, PartyPopper, Wine,
  MessageCircle, Award, Handshake, Trophy, Flame, Lock, Bell, AlertCircle,
  CheckCircle2, Utensils
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import screenDashboard from "@assets/IMG_9066_1773314165933.png";
import screenRewards from "@assets/IMG_9067_1773314165933.png";
import screenRanglijst from "@assets/IMG_9068_1773314165933.png";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.png";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoMercure from "../../assets/pitch/logo-mercure.png";
import logoPulitzer from "@assets/Logo_Pulitzer_1773389329669.png";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.png";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoWestweelde from "../../assets/pitch/logo-westweelde-clean.png";
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
  return <span ref={ref}>{hasDecimal ? count.toFixed(1) : count.toLocaleString("en-US")}{suffix}</span>;
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
  { key: "beloningen", img: screenRewards, label: "Rewards" },
  { key: "ranglijst", img: screenRanglijst, label: "Leaderboard" },
  { key: "uitdagingen", img: screenUitdagingen, label: "Challenges" },
];

export default function HospitalityStaffAmsterdam() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  const klantReviews = ["amrath", "westweelde", "hart"].map((id) => {
    const r = CLIENT_REVIEWS.find((x) => x.id === id)!;
    const translatedQuote = id === "amrath" 
      ? "We have been working with EXTRA since late October 2025 for housekeeping, turndown, and minibar staff at Grand Hotel Amrâth Amsterdam. EXTRA has shown professionalism, reliability, and a strong commitment to quality. The staff consistently meet and exceed our expectations. Communication is efficient and responsive, ensuring a smooth partnership. We do not hesitate to recommend EXTRA to any company looking for reliable staffing solutions."
      : id === "westweelde"
      ? "From the start, we've had pleasant and direct contact with the EXTRA team. They provide a wide range of staff. While our partnership began with just bar staff for our nightclub, they now provide our largest pool of BQT staff for weddings and corporate events, site crew for pre-production, and even cleaning staff during events. We are very satisfied with the quality of the staff. During events, we can directly communicate with EXTRA when challenges arise, and they respond quickly and adequately."
      : "At H'ART Museum, we regularly work with EXTRA staff because we know we receive well-qualified personnel who are always well-presented and on time. The EXTRA team is clear in their communication, both on the floor and in planning, and we enjoy working with them.";
    return { quote: translatedQuote, name: r.author, rating: 5, role: r.role, company: r.company };
  });

  useEffect(() => {
    document.title = "Hire Hospitality Staff Amsterdam | Flexible Staffing Agency | EXTRA";

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

    setMeta('description', 'Need hospitality staff? EXTRA delivers flexible hospitality staff for hotels, restaurants, caterers, and events in Amsterdam. Vetted, reliable, and ready to go.');
    setLink('canonical', 'https://www.doehetextra.nl/en/hospitality-staff-amsterdam');
    setMeta('og:title', 'Hire Hospitality Staff Amsterdam | Flexible Staffing Agency | EXTRA', 'property');
    setMeta('og:description', 'Need hospitality staff? EXTRA delivers flexible hospitality staff for hotels, restaurants, caterers, and events in Amsterdam. Vetted, reliable, and ready to go.', 'property');
    setMeta('og:url', 'https://www.doehetextra.nl/en/hospitality-staff-amsterdam', 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:image', 'https://www.doehetextra.nl/extra_email_banner_bg.png', 'property');

    addSchema('local-business-schema', {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "EXTRA",
      "description": "Flexible hospitality staff via EXTRA, NEN-4400-1 certified staffing agency in Amsterdam.",
      "telephone": "+31851305915",
      "url": "https://www.doehetextra.nl/en",
      "address": { "@type": "PostalAddress", "addressLocality": "Amsterdam", "addressCountry": "NL" },
    });

    addSchema('faq-schema', {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How quickly can you deliver hospitality staff?", "acceptedAnswer": { "@type": "Answer", "text": "At EXTRA, we understand that busy periods often arise unexpectedly. Thanks to our large pool of experienced hospitality workers, we can often deploy staff quickly. In many cases, we can propose suitable staff for hotels, restaurants, events, or catering within 48 hours." } },
        { "@type": "Question", "name": "For which roles can I hire hospitality staff?", "acceptedAnswer": { "@type": "Answer", "text": "Through EXTRA, you can hire staff for various roles within hospitality and hotels. This includes waitstaff, bar staff, runners, chefs, front office staff, and housekeeping." } },
        { "@type": "Question", "name": "What does hospitality staff cost through a staffing agency?", "acceptedAnswer": { "@type": "Answer", "text": "The costs for hospitality staff through an agency depend on the role, experience, and duration of the assignment. At EXTRA, we work with transparent rates." } },
        { "@type": "Question", "name": "Can you flexibly scale up for busy periods or events?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Flexibility is one of the main advantages of working with EXTRA. Whether it's a large event, a busy weekend, or a temporary peak in occupancy: we can scale up and down quickly." } },
        { "@type": "Question", "name": "How can I request staff from EXTRA?", "acceptedAnswer": { "@type": "Answer", "text": "You can easily request staff via the request form on our website. After we receive the request, we will contact you to discuss your needs and planning." } },
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

      {/* 1. HERO */}
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
                <span className="text-white/90 text-xs sm:text-sm font-semibold">800+ staff active</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 certified</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Full schedule,{" "}
              <span className="relative inline-block">
                <span className="relative z-10">too few people?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-70 rounded-sm" />
              </span>
            </h1>
            <p className="text-base sm:text-xl text-purple-100/90 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              EXTRA delivers fast and flexible hospitality staff for hotels, events, caterers, and restaurants. Everyone is personally selected and employed by us.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <Link href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Request EXTRA staff
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="tel:0851305915" className="group border-2 border-white/30 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                <Phone className="w-5 h-5" />
                Direct contact
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              {[
                { icon: Check, text: "Everyone on payroll" },
                { icon: Star, text: "Personally selected" },
                { icon: Clock, text: "Fast availability" },
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

      {/* 2. BRANCHES */}
      <section id="branches" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
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
                From major hotel chains to busy event venues. EXTRA delivers flexible hospitality staff tailored to your location. Vetted, professional, and ready for work.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-8">
            {[
              {
                icon: Building2,
                title: "Hotels",
                desc: "Housekeeping, banqueting, front office, and kitchen staff for hotels. Flexibly scale up during peak times, events, and seasons.",
                color: "from-purple-600 to-purple-800",
                border: "border-purple-100",
                link: "/en/hotel-staffing-amsterdam",
                tags: ["Housekeeping", "Front office", "Banqueting", "Kitchen"],
              },
              {
                icon: PartyPopper,
                title: "Event Venues",
                desc: "Representative staff for events of all sizes. From waitstaff to runners and bar staff. Teams from 5 to 60 members.",
                color: "from-pink-500 to-purple-600",
                border: "border-pink-100",
                link: "/en/event-staff-amsterdam",
                tags: ["Service", "Bar", "Runners", "Coat check"],
              },
              {
                icon: UtensilsCrossed,
                title: "Caterers",
                desc: "Chefs, waitstaff, and kitchen hands for catering and events at any location.",
                color: "from-indigo-500 to-purple-600",
                border: "border-indigo-100",
                link: "/en/catering-staff-amsterdam",
                tags: ["Chefs", "Waitstaff", "Kitchen hands"],
              },
              {
                icon: Wine,
                title: "Restaurants",
                desc: "Waitstaff, chefs, and bar staff for restaurants during busy periods, absence, and peak moments.",
                color: "from-blue-500 to-indigo-600",
                border: "border-blue-100",
                link: "/en/restaurant-staff-amsterdam",
                tags: ["Service", "Bar", "Kitchen", "Runners"],
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <Link href={item.link} className={`group block relative bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-[2rem] shadow-lg shadow-purple-500/5 border-2 ${item.border} p-7 sm:p-10 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden`}>
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
                </Link>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TRUSTED BY */}
      <section className="py-12 sm:py-20 bg-white overflow-hidden relative border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-10 sm:mb-16">
              Trusted by premium partners in Amsterdam
            </p>
          </RevealSection>
          <div className="relative group">
            <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-12 sm:gap-20 lg:gap-24 px-6 sm:px-12 flex-shrink-0">
                  {[
                    logoAmrath, logoHilton, logoMarriott, logoPulitzer, logoMercure,
                    logoSelectCatering, logoAppel, logoHartMuseum, logoWestweelde,
                    logoFunda, logoFcUtrecht, logoHetePeper
                  ].map((logo, i) => (
                    <div key={`${setIdx}-${i}`} className="flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                      <img src={logo} alt="Partner Logo" className="h-10 sm:h-14 lg:h-16 w-auto object-contain" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 50s linear infinite; }
        `}</style>
      </section>

      {/* 4. WHY CHOOSE EXTRA */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={4} opacity={0.06} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Star className="w-4 h-4" /> Why choose EXTRA
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Not just another agency,<br />
                <span className="text-purple-600">quality-driven staffing.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-10 leading-relaxed max-w-xl">
                We believe that hospitality is a profession. That's why we don't just send anyone; we send motivated professionals who are personally selected and screened by us.
              </p>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  { icon: UserCheck, title: "Personal Screening", desc: "Every staff member has been personally interviewed and tested for skills and attitude." },
                  { icon: Shield, title: "Fully Certified", desc: "NEN-4400-1 certified. We handle all social contributions and risks." },
                  { icon: TrendingUp, title: "Reward System", desc: "Our unique EXTRAATje system motivates staff to perform at their best every shift." },
                  { icon: Clock, title: "Always Available", desc: "Our planners are available 24/7. We respond quickly to requests and emergencies." },
                ].map((item, i) => (
                  <div key={i} className="group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                        <item.icon className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
                      </div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200} className="relative">
              <div className="relative bg-gradient-to-br from-purple-100 to-white p-2 sm:p-4 rounded-[2.5rem] shadow-2xl overflow-hidden border border-purple-200/50">
                <img src={dashboardKandidaten} alt="Staff Management Dashboard" className="w-full h-auto rounded-[1.8rem] shadow-lg" loading="lazy" decoding="async" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 animate-pulse">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-xl">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 hidden sm:block max-w-[220px] animate-bounce-slow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="font-black text-gray-900 text-sm">Quality Match</div>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">94% of our clients rate our staff with an 8 or higher.</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 5. APP MOCKUP */}
      <section className="relative py-24 sm:py-32 lg:py-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPatternBg count={5} opacity={0.12} color="rgba(255,255,255,0.9)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <RevealSection className="lg:order-2">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-400/20 px-4 sm:px-5 py-2 rounded-full">
                <Flame className="w-4 h-4" /> Motivated people
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Our staff is<br />
                <span className="text-purple-400">extra motivated.</span>
              </h2>
              <p className="text-base sm:text-xl text-purple-100/80 mb-10 leading-relaxed">
                Motivated staff performs better. That's why we developed EXTRAATje: a reward system where staff earns points for every shift, positive feedback, and special challenges.
              </p>
              <div className="space-y-6">
                {[
                  { icon: Trophy, title: "Leaderboard", desc: "Monthly competition for the best performance among 800+ staff." },
                  { icon: Gift, title: "Real Rewards", desc: "Points can be exchanged for cinema tickets, JBL speakers, and more." },
                  { icon: Zap, title: "Challenges", desc: "Bonuses for working during busy weekends or specific locations." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 sm:gap-6 bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-2xl group hover:bg-white/10 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-purple-200/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200} className="lg:order-1 relative">
              <div className="relative mx-auto max-w-[320px] sm:max-w-[380px]">
                <div className="absolute inset-0 bg-purple-500/30 blur-[100px] rounded-full animate-pulse" />
                <div className="relative rounded-[3rem] p-4 bg-gray-900 border-8 border-gray-800 shadow-[0_0_50px_rgba(168,85,247,0.3)]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />
                  <div className="relative rounded-[2rem] overflow-hidden bg-white aspect-[9/19.5]">
                    <img
                      src={appScreens[activeScreen].img}
                      alt={appScreens[activeScreen].label}
                      className="w-full h-full object-cover transition-opacity duration-500"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex justify-center gap-2">
                        {appScreens.map((_, i) => (
                          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${activeScreen === i ? "w-8 bg-purple-500" : "w-1.5 bg-white/40"}`} />
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

      {/* 6. STATS */}
      <section className="relative py-20 sm:py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 text-center">
            {[
              { target: 850, suffix: "+", label: "Active staff", icon: Users },
              { target: 45, suffix: "k", label: "Shifts filled", icon: CalendarCheck },
              { target: 120, suffix: "+", label: "Premium partners", icon: Handshake },
              { target: 9.2, suffix: "/10", label: "Client satisfaction", icon: Star },
            ].map((stat, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
                <div className="text-3xl sm:text-5xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <CountUp target={stat.target} suffix={stat.suffix} />
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SCREENING & DATA */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-gray-50">
        <XPatternBg count={3} opacity={0.05} color="rgba(139,92,246,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <RevealSection className="lg:order-2">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100 px-4 py-2 rounded-full">
                <Search className="w-4 h-4" /> Data-driven matching
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Vetted professionals,<br />
                <span className="text-purple-600">selected by data.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mb-10 leading-relaxed">
                We don't just guess who fits. We track performance scores for every staff member across service, speed, attitude, and skill level. You get the data, we get the result.
              </p>
              <div className="space-y-4">
                {[
                  "Personal screening and skills testing",
                  "Performance tracking after every shift",
                  "Proven disciplinary scores (punctuality, appearance)",
                  "Custom talent pools for your venue",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-gray-700">{text}</span>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200} className="lg:order-1">
              <div className="bg-white p-2 sm:p-3 rounded-[2rem] shadow-2xl shadow-purple-900/10 border border-gray-100">
                <img src={sollicitatieformulier} alt="Candidate screening form" className="w-full h-auto rounded-2xl" loading="lazy" decoding="async" />
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 8. REVIEWS */}
      <section className="relative py-24 sm:py-32 lg:py-44 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What our clients say
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
                Discover why leading hotels, event venues, and caterers in Amsterdam choose EXTRA as their long-term staffing partner.
              </p>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-8">
            {klantReviews.map((review, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="h-full flex flex-col bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:border-purple-200 transition-all group">
                  <div className="flex gap-1 mb-6">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-gray-700 italic leading-relaxed mb-8">
                    "{review.quote}"
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 font-black text-purple-600">
                      {review.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{review.name}</div>
                      <div className="text-sm text-purple-600 font-semibold">{review.role}</div>
                      <div className="text-xs text-gray-400 font-medium">{review.company}</div>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="relative py-20 sm:py-32 bg-gray-50 overflow-hidden">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Frequently Asked Questions
              </h2>
              <p className="text-gray-500 font-medium">Everything you need to know about hiring staff through EXTRA.</p>
            </div>
          </RevealSection>
          <div className="space-y-4">
            {[
              { q: "How quickly can you deliver hospitality staff?", a: "At EXTRA, we understand that busy periods often arise unexpectedly. Thanks to our large pool of experienced hospitality workers, we can often deploy staff quickly. In many cases, we can propose suitable staff for hotels, restaurants, events, or catering within 48 hours." },
              { q: "For which roles can I hire hospitality staff?", a: "Through EXTRA, you can hire staff for various roles within hospitality and hotels. This includes waitstaff, bar staff, runners, chefs, front office staff, and housekeeping." },
              { q: "What does hospitality staff cost through an agency?", a: "The costs for hospitality staff through an agency depend on the role, experience, and duration of the assignment. At EXTRA, we work with transparent rates and can provide a custom quote based on your needs." },
              { q: "Can you flexibly scale up for busy periods or events?", a: "Yes. Flexibility is one of the main advantages of working with EXTRA. Whether it's a large event, a busy weekend, or a temporary peak in occupancy: we can scale up and down quickly, from 1 person to teams of 60." },
              { q: "How can I request staff from EXTRA?", a: "You can easily request staff via the request form on our website. After we receive the request, we will contact you to discuss your needs and planning." },
            ].map((faq, i) => (
              <RevealSection key={i} delay={i * 50}>
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-purple-300 transition-colors">
                  <button
                    className="w-full px-6 py-5 flex items-center justify-between text-left group"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{faq.q}</span>
                    <div className={`w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center transition-transform duration-300 ${openFaq === i ? "rotate-180 bg-purple-600" : ""}`}>
                      <Zap className={`w-4 h-4 ${openFaq === i ? "text-white" : "text-purple-600"}`} />
                    </div>
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaq === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="relative py-24 sm:py-32 lg:py-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPatternBg count={5} opacity={0.15} color="rgba(255,255,255,1)" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
              <Zap className="w-4 h-4" /> Ready to start?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Ready to deploy{" "}
              <span className="relative inline-block">
                <span className="relative z-10">extra staff?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Tell us what you need. We select the right people and have a team ready for you quickly. Everyone on payroll, everyone personally known to us.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mb-10 sm:mb-14">
              <Link
                href="/personeelsaanvraag"
                className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3"
                style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
              >
                Request EXTRA staff
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="tel:0851305915" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3">
                <Phone className="w-5 h-5" />
                Schedule a meeting
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {[
                { icon: Shield, text: "NEN-4400-1 certified" },
                { icon: Users, text: "Everyone on payroll" },
                { icon: Clock, text: "Available 24/7" },
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
