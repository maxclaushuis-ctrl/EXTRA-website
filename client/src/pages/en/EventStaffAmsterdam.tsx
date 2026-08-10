import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  ArrowRight, Check, Phone, Shield, Clock, Star, Heart,
  TrendingUp, Users, Zap, Gift, UserCheck,
  Tag, ThumbsUp, MessageCircle, Sparkles,
  Utensils, GlassWater, BarChart3, PartyPopper, Award
} from "lucide-react";
import heroBgImage from "@assets/BAR_BEDIENING_FINAL_002_1775574495470.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoWestweelde from "../../assets/pitch/logo-westweelde-clean.webp";
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
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
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

function GrainOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat", backgroundSize: "256px 256px",
      opacity: 0.4, mixBlendMode: "overlay",
    }} />
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard", alt: "Screenshot of the EXTRAATje dashboard in the event staff app: points balance, bronze status and popular rewards" },
  { key: "rewards", img: screenRewards, label: "Rewards", alt: "Screenshot of the rewards catalogue in the EXTRAATje app, showing redeemable gifts such as a JBL speaker and AirPods" },
  { key: "challenges", img: screenUitdagingen, label: "Challenges", alt: "Screenshot of an active challenge in the EXTRAATje app: earning extra points by working more shifts" },
  { key: "leaderboard", img: screenRanglijst, label: "Leaderboard", alt: "Screenshot of the leaderboard in the EXTRAATje app showing event staff members' point rankings" },
];

const eventLogos = [
  { src: logoWestweelde, alt: "Westweelde events" },
  { src: logoHartMuseum, alt: "H'art Museum Amsterdam" },
  { src: logoFcUtrecht, alt: "FC Utrecht events" },
  { src: logoFunda, alt: "Funda events" },
  { src: logoHetePeper, alt: "Hete Peper" },
  { src: logoAppel, alt: "Appèl" },
];

export default function EventStaffAmsterdam() {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    document.title = "Event Staff Amsterdam | Experienced Event Staffing Agency | EXTRA";
    const setMeta = (nameOrProp: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, nameOrProp); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const setLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
      let el = document.querySelector(selector) as HTMLLinkElement | null;
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); if (hreflang) el.setAttribute('hreflang', hreflang); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };
    const addSchema = (id: string, data: object) => {
      document.getElementById(id)?.remove();
      const s = document.createElement("script");
      s.id = id; s.type = "application/ld+json"; s.text = JSON.stringify(data);
      document.head.appendChild(s);
    };

    setMeta('description', 'Need event staff in Amsterdam? EXTRA supplies experienced hospitality teams for conferences, galas, festivals and corporate events. From 5 to 100+ staff, delivered fast.');
    setLink('canonical', 'https://www.doehetextra.nl/en/event-staff-amsterdam');
    // hreflang-alternates (nl/en/x-default) komen sinds P13 server-side uit
    // shared/routeMeta.ts (HREFLANG_GROUPS) — hier hardcoded zetten zou ze na
    // hydratie weer overschrijven met een niet-onderhouden, x-default-loze set.
    setMeta('og:title', 'Event Staff Amsterdam | EXTRA', 'property');
    setMeta('og:description', 'Experienced event hospitality teams for conferences, galas, festivals and corporate events. Handpicked staff, delivered in 48 hours.', 'property');
    setMeta('og:url', 'https://www.doehetextra.nl/en/event-staff-amsterdam', 'property');
    setMeta('og:type', 'website', 'property');

    addSchema("event-en-faq-schema", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Can you scale up quickly for events?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Scaling fast is one of EXTRA's core strengths. Whether you need 5 or 80 people, we deliver reliably — even on short notice. Get in touch and we'll confirm availability straight away." } },
        { "@type": "Question", "name": "Do you have staff with event experience?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Most of our staff work events regularly and are used to busy environments, fast service and large guest numbers. Event experience is a key factor in our matching process." } },
        { "@type": "Question", "name": "Can you supply bar staff and service staff for events?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. We supply experienced bar staff, service staff, dinner runners and event floor support for events of any scale. Everyone is selected on event experience and attitude." } },
      ]
    });

    const interval = setInterval(() => setActiveScreen(p => (p + 1) % appScreens.length), 3500);
    return () => {
      clearInterval(interval);
      document.getElementById("event-en-faq-schema")?.remove();
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

        {/* X-pattern background */}
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

        {/* Hero photo */}
        <div className="absolute inset-0 pointer-events-none">
          <img src={heroBgImage} alt="" className="w-full h-full object-cover" loading="eager"
            style={{ objectPosition: "center top", filter: "contrast(1.08) saturate(1.15) brightness(1.04)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 42% 68% at 68% 46%, rgba(255,248,255,0.12) 0%, rgba(220,180,255,0.04) 55%, transparent 75%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(29,5,73,1) 0%, rgba(29,5,73,1) 32%, rgba(45,6,99,0.82) 46%, rgba(58,8,128,0.38) 56%, rgba(72,14,148,0.10) 65%, transparent 72%)" }} />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: "22%", background: "linear-gradient(to top, rgba(29,5,73,0.82) 0%, rgba(29,5,73,0.30) 50%, transparent 100%)" }} />
          <div className="absolute top-0 left-0 right-0" style={{ height: "18%", background: "linear-gradient(to bottom, rgba(29,5,73,0.50) 0%, transparent 100%)" }} />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <PartyPopper className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">Event staffing specialists</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">5 to 100+ staff per event</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Your event deserves<br />
              <span className="relative inline-block">
                <span className="relative z-10">the best staff.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-70 rounded-sm" />
              </span>
              {" "}We deliver them.
            </h1>
            <p className="text-base sm:text-xl text-purple-100/90 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              Tight deadline, high expectations, full house. EXTRA delivers event hospitality staff within 48 hours — service staff, bar teams, hosts, runners and supervisors. All on payroll. Always.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Get event staff now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/30 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                <Phone className="w-5 h-5" />
                Call us directly
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              {[
                { icon: Check, text: "All staff on payroll" },
                { icon: Star, text: "Experienced with large events" },
                { icon: Zap, text: "Scale up fast" },
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
              { number: "800+", label: "Active staff members", icon: Users },
              { number: "500+", label: "Events per year", icon: PartyPopper },
              { number: "48h", label: "Average delivery time", icon: Clock },
              { number: "24/7", label: "Available for urgent requests", icon: Zap },
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
      {/* 2. ROLES FOR EVENTS                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="roles" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Users className="w-4 h-4" /> Event roles
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Every event format.{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Every role filled.</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2 sm:h-3.5 bg-gradient-to-r from-yellow-300 to-orange-400 -skew-x-3 z-0 opacity-50 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-5 max-w-2xl mx-auto">
                From the first guest through the door to the last glass cleared. EXTRA covers every role — experienced, presentable and built for the pace of events.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Utensils, title: "Service staff", desc: "Experienced servers for dinners, receptions and networking events. Professional, fast and guest-focused.", tags: ["Dinner service", "Receptions", "Buffet", "Formal & casual"], color: "from-purple-600 to-purple-800" },
              { icon: GlassWater, title: "Bar staff", desc: "Bartenders with event experience. Presentable, high-volume ready and confident under pressure.", tags: ["Cocktails", "Wine service", "High volume", "Drinks reception"], color: "from-pink-500 to-purple-600" },
              { icon: Users, title: "Dinner runners", desc: "Fast and efficient runners who plate up, clear tables and keep large dinners moving smoothly.", tags: ["Plated service", "Replenishment", "Large groups", "Flow support"], color: "from-indigo-500 to-purple-600" },
              { icon: Zap, title: "Runners", desc: "Energetic logistics staff keeping everything flowing between kitchen and floor throughout the event.", tags: ["Kitchen-floor", "Transport", "Setup support", "High pace"], color: "from-blue-500 to-indigo-600" },
              { icon: Sparkles, title: "Hosts & hostesses", desc: "Friendly, polished hosts for arrivals, registration, cloakroom and guest coordination.", tags: ["Welcome desk", "Cloakroom", "Registration", "Guest guidance"], color: "from-orange-500 to-pink-600" },
              { icon: Award, title: "Event supervisors", desc: "Experienced on-site leads who manage teams, liaise with planners and keep the quality bar high.", tags: ["Team management", "Quality control", "On-site direction"], color: "from-green-500 to-emerald-600" },
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
                Request event staff
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 3. WHY EVENT VENUES CHOOSE EXTRA                   */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="why-extra" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Zap className="w-4 h-4" /> Why EXTRA
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                At events, everything counts.<br className="hidden sm:block" />
                <span className="text-purple-600">That's why venues choose EXTRA.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-5 max-w-2xl mx-auto">
                Every guest, every shift, every moment. Event venues that want consistently great staff keep coming back to EXTRA. Reliable, presentable, on time.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { stat: "Flexible", statLabel: "scale-up on demand", title: "Scale up instantly", desc: "From intimate dinners to packed halls. EXTRA helps venues scale quickly with experienced staff who thrive under pressure.", accent: "from-purple-500 to-purple-700" },
              { stat: "100%", statLabel: "personally screened", title: "Handpicked. Every time.", desc: "Every member of our staff has gone through a personal intake before working a single shift through EXTRA.", accent: "from-indigo-500 to-purple-600" },
              { stat: "500+", statLabel: "events per year", title: "Real event experience", desc: "Our staff know full houses, tight timelines and high guest expectations. They've done it hundreds of times.", accent: "from-pink-500 to-rose-600" },
              { stat: "24/7", statLabel: "reachable for planners", title: "Available around the clock", desc: "Our planners are available outside office hours when you need to move fast — even on the day of the event.", accent: "from-blue-500 to-indigo-600" },
              { stat: "★ 4.8", statLabel: "average rating", title: "Continuously rated", desc: "We collect feedback after every event. Only staff who consistently perform well stay active in our pool.", accent: "from-amber-500 to-orange-500" },
              { stat: "0%", statLabel: "freelancer risk for you", title: "Zero compliance headache", desc: "All our staff are on payroll and NEN 4400-1 compliant. No freelancer risk, no admin on your end.", accent: "from-green-500 to-emerald-600" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group relative bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-8 border-2 border-gray-100 hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-500/8 hover:-translate-y-1.5 transition-all duration-300 h-full shadow-sm overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300" style={{ background: `radial-gradient(circle, rgb(139,92,246) 0%, transparent 70%)` }} />
                  <div className="inline-flex items-baseline gap-1.5 mb-1">
                    <span className={`text-3xl sm:text-4xl font-black bg-gradient-to-br ${item.accent} bg-clip-text text-transparent`} style={{ fontFamily: "'Poppins', sans-serif" }}>{item.stat}</span>
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
      {/* 4. CLIENT LOGOS                                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">
              Trusted by leading event venues and organisers
            </p>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 lg:gap-20">
              {eventLogos.map((logo, i) => (
                <div key={i} className="hover:scale-105 transition-transform duration-300">
                  <img src={logo.src} alt={logo.alt} width="200" height="200" loading="lazy" decoding="async" className="h-10 sm:h-14 lg:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 5. CLIENT TESTIMONIALS                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="testimonials" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/50 px-4 sm:px-5 py-2 rounded-full">
                <MessageCircle className="w-4 h-4" /> Client stories
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What event venues say about us
              </h2>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { company: "H'art Museum Amsterdam", quote: "EXTRA always delivers reliable staff for our events. They know the pace of a museum setting, show up on time and represent the venue exactly as we'd want.", name: "Sarah van den Berg", role: "Events Manager", results: ["Consistent team built over two seasons", "Zero no-shows across 40+ events"] },
              { company: "Westweelde Events", quote: "For large outdoor events we need staff who can handle volume and stay calm. EXTRA understands that — they scale up fast and the quality stays high.", name: "Thomas Mulder", role: "Operations Director", results: ["Scaled to 60 staff for a single event weekend", "Same familiar faces at every return booking"] },
              { company: "FC Utrecht Hospitality", quote: "The EXTRA team knows what match-day hospitality looks like. They're fast, they're professional and they need zero hand-holding once they're on the floor.", name: "Lisanne Konings", role: "F&B Manager", results: ["Full hospitality suite staffed every home match", "20% fewer briefing minutes per event"] },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 h-full shadow-sm flex flex-col">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <PartyPopper className="w-4 h-4 text-purple-500" />
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
      {/* 6. HOW EXTRA SELECTS STAFF                         */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="selection" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#f3f0fa" }}>
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <div>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/80 px-4 sm:px-5 py-2 rounded-full">
                  <UserCheck className="w-4 h-4" /> Our selection process
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  How EXTRA picks{" "}
                  <span className="text-purple-600">the right people</span>
                </h2>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-10">
                  Quality at events doesn't happen by accident. It's the result of a process that goes well beyond a CV.
                </p>
                <ul className="space-y-6">
                  {[
                    { icon: Users, title: "Personal intake interview", desc: "Every candidate goes through a personal interview and assessment before working a single shift." },
                    { icon: Star, title: "Rated after every shift", desc: "Clients rate our staff after each event. Only those who consistently perform well stay active." },
                    { icon: Sparkles, title: "Presentation and attitude", desc: "Our staff look the part and speak the language of hospitality — every time." },
                    { icon: ThumbsUp, title: "Experience and work ethic", desc: "We look beyond the CV. Service mindset, adaptability and attitude matter just as much as experience." },
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
                      <span className="text-white/80 text-xs font-semibold ml-1">EXTRA Application form</span>
                    </div>
                    <img src={sollicitatieImg} alt="EXTRA staff intake form" className="w-full object-cover" />
                    <div className="absolute bottom-5 right-5 bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      9.2 Average
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 7. CONTINUOUS QUALITY MEASUREMENT                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="quality" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Continuous quality measurement
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Every event better<br className="hidden sm:block" /> than the last
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                After every event we measure how our staff performed. That's how we know who fits your format best — and who gets priority next time. No guesswork. Just data.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-14 max-w-4xl mx-auto">
              {[
                { text: "Rated on service quality and attitude after every event" },
                { text: "Reliability and punctuality tracked for every shift" },
                { text: "No-shows registered immediately with consequences" },
                { text: "Top performers get first priority for your next event" },
                { text: "Dedicated pools built per venue or organiser" },
                { text: "Full shift history and scores visible per staff member" },
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
                      <span className="text-xs sm:text-sm font-bold text-purple-800 uppercase tracking-wide">Staff overview</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Real-time data on all staff — including event placements</p>
                  </div>
                  <img src={screenshotGebruikers} alt="EXTRA staff overview dashboard" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-4 text-center">We know exactly who performs best at which event type</p>
              </div>
            </RevealSection>
            <RevealSection delay={250}>
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-green-200 to-emerald-200 rounded-2xl sm:rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 sm:px-6 py-3 sm:py-4 border-b border-green-100/60">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-green-600" />
                      <span className="text-xs sm:text-sm font-bold text-green-800 uppercase tracking-wide">Individual staff profile</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Scores, highlights, no-shows and shift history per person</p>
                  </div>
                  <img src={screenshotProfiel} alt="Individual staff performance profile" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-4 text-center">How we select on proven quality per venue</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 8. PREFERRED TEAM POOLS                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="preferred-teams" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <div>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                  <Heart className="w-4 h-4" /> Preferred team pools
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Dedicated teams that<br /> know your event
                </h2>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8">
                  For recurring events or regular venues, EXTRA builds a preferred pool — the same people who know your layout, setup and exactly what you expect.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Users, text: "Dedicated event teams built on proven performance" },
                    { icon: Heart, text: "Staff know your venue's flow, format and service standard" },
                    { icon: TrendingUp, text: "Faster onboarding — they hit the ground running" },
                    { icon: Star, text: "Higher quality through familiarity and continuity" },
                    { icon: Tag, text: "Staff tagged by speciality: gala specialist, bar ace, and more" },
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
                  Build your event team pool <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "🥂", title: "Dedicated gala team", desc: "Same service staff at every gala dinner. They know the setup, the service style and your standard.", tag: "Gala & Dinner" },
                  { icon: "🍸", title: "Dedicated bar crew", desc: "A bar team that knows your bar, your menu and your pace. No briefing needed — just results.", tag: "Bar" },
                  { icon: "⚡", title: "Dedicated runners", desc: "Runners who know your venue layout and how the logistics work. Fast, reliable and familiar.", tag: "Logistics" },
                  { icon: "🎤", title: "Dedicated host team", desc: "Welcoming hosts who represent your venue's entrance exactly as you want — every time.", tag: "Arrivals" },
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
      {/* 9. EXTRAATJE REWARDS SYSTEM                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="rewards" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.1} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/70 px-4 sm:px-5 py-2 rounded-full">
                <Gift className="w-4 h-4" /> EXTRAATje rewards system
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Motivated staff{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">make the event</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                The more motivated your staff, the better the guest experience. Our EXTRAATje rewards system keeps staff engaged and energised at every event.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Every shift earns points", desc: "Staff earn points for each event worked. Strong performance means bonus points.", icon: "🏃" },
                { step: "2", title: "More shifts, higher status", desc: "From Bronze to Diamond. More status means stronger commitment to your venue.", icon: "💎" },
                { step: "3", title: "Stronger, more stable teams", desc: "Staff who build points at your venue want to come back. Fewer no-shows, better continuity.", icon: "🎁" },
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
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>What your venue gains from this</h3>
                <ul className="space-y-4">
                  {[
                    { icon: TrendingUp, text: "Higher motivation because staff are working towards something" },
                    { icon: Check, text: "Fewer no-shows because staff are building points" },
                    { icon: Users, text: "Stronger teams through familiar, returning faces" },
                    { icon: Heart, text: "Better guest experience through genuinely engaged staff" },
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
      {/* 10. FAQ                                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <FAQSection
        heading="Frequently asked questions about event staff"
        faqs={[
          { q: "Can you scale up quickly for events?", a: "Yes. Flexible scaling is one of EXTRA's core strengths. Whether you need 5 or 80 staff members: we deliver fast and reliably, even on short notice. Get in touch and we'll discuss what's possible straight away." },
          { q: "How many staff can you supply for an event?", a: "We have a pool of 800+ active staff members. For large events we can supply dozens to 100+ staff depending on availability and roles. We have experience with events ranging from 10 to 300+ guests." },
          { q: "Do you have staff with event experience?", a: "Yes. Most of our staff work events regularly and are used to busy environments, fast-paced service and large guest numbers. Event experience is a key factor in how we match staff to bookings." },
          { q: "Can you supply bar staff and service staff for events?", a: "Yes. We supply experienced bar staff, service staff, dinner runners and event floor support for events of any scale — from a reception with 50 guests to a gala for 500. Everyone is selected on event experience and attitude." },
          { q: "Can you supply hosts and hostesses for events?", a: "Yes. Our hosts and hostesses are presentable, articulate and experienced in guest-facing roles: arrivals, cloakroom, registration and escort. They understand the importance of a strong first impression." },
          { q: "How quickly can you deliver event staff?", a: "In most cases we can deliver suitable event staff within 48 hours. Thanks to our large pool of experienced staff, we can move quickly — including on last-minute requests." },
        ]}
      />

      {/* ═══════════════════════════════════════════════════ */}
      {/* 11. FINAL CTA                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="cta" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
              <PartyPopper className="w-4 h-4" /> Need event staff?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Book your event team{" "}
              <span className="relative inline-block">
                <span className="relative z-10">right now</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Whether it's a one-off event or a regular venue, EXTRA delivers fast, flexible and reliable hospitality staff. From 5 to 100+ people.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mb-10 sm:mb-14">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3" style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}>
                Get event staff now
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
                { icon: Users, text: "800+ active staff members" },
                { icon: Zap, text: "Scale up fast" },
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
