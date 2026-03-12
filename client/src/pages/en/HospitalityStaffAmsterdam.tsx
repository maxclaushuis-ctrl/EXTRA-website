import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  Users, Star, Shield, Clock, ArrowRight, Check, Phone,
  TrendingUp, Heart, Zap, Gift, UserCheck,
  Tag, BarChart3, Search, CalendarCheck, Sparkles,
  Briefcase, UtensilsCrossed, Hotel, PartyPopper, ChefHat
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoMercure from "../../assets/pitch/logo-mercure.png";
import logoPulitzer from "../../assets/pitch/logo-pulitzer-clean.svg";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.png";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoWestweelde from "../../assets/pitch/logo-westweelde-clean.png";
import sollicitatieformulier from "@assets/Sollicitatieformulier_1772893764120.png";
import dashboardKandidaten from "@assets/Dashboard_kandidaten_1772893764120.png";
import screenDashboard from "@assets/IMG_9066_1773314165933.png";
import screenRewards from "@assets/IMG_9067_1773314165933.png";
import screenRanglijst from "@assets/IMG_9068_1773314165933.png";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.png";

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

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard" },
  { key: "rewards", img: screenRewards, label: "Rewards" },
  { key: "leaderboard", img: screenRanglijst, label: "Leaderboard" },
  { key: "challenges", img: screenUitdagingen, label: "Challenges" },
];

const logos = [
  { src: logoMarriott, alt: "Marriott Hotels" },
  { src: logoHilton, alt: "Hilton Hotels" },
  { src: logoMercure, alt: "Mercure Hotels" },
  { src: logoPulitzer, alt: "Pulitzer Amsterdam" },
  { src: logoHartMuseum, alt: "H'art Museum" },
  { src: logoAmrath, alt: "Amrâth Hotels" },
  { src: logoFcUtrecht, alt: "FC Utrecht" },
  { src: logoWestweelde, alt: "Westweelde" },
  { src: logoFunda, alt: "Funda" },
  { src: logoHetePeper, alt: "Hete Peper" },
  { src: logoSelectCatering, alt: "Select Catering" },
  { src: logoAppel, alt: "Appèl" },
];

export default function HospitalityStaffAmsterdam() {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    document.title = "Hospitality Staff Amsterdam | Flexible Staffing Agency | EXTRA";
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
    setMeta('description', 'Looking for reliable hospitality staff in Amsterdam? EXTRA provides experienced hotel, restaurant, event and catering staff on demand. Vetted, flexible and ready to work.');
    setLink('canonical', 'https://www.doehetextra.nl/en/hospitality-staff-amsterdam');
    setLink('alternate', 'https://www.doehetextra.nl/horeca-personeel-gezocht', 'nl');
    setLink('alternate', 'https://www.doehetextra.nl/en/hospitality-staff-amsterdam', 'en');
    setMeta('og:title', 'Hospitality Staff Amsterdam | EXTRA', 'property');
    setMeta('og:description', 'Looking for reliable hospitality staff in Amsterdam? EXTRA provides experienced hotel, restaurant, event and catering staff on demand.', 'property');
    setMeta('og:url', 'https://www.doehetextra.nl/en/hospitality-staff-amsterdam', 'property');
    setMeta('og:type', 'website', 'property');
    const timer = setInterval(() => setActiveScreen(prev => (prev + 1) % appScreens.length), 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <PublicNav />

      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBgImage} alt="Hospitality staff working at event in Amsterdam" className="absolute inset-0 w-full h-full object-cover object-right sm:object-center" loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(88,22,164,0.92) 0%, rgba(88,22,164,0.88) 40%, rgba(88,22,164,0.70) 65%, rgba(88,22,164,0.35) 82%, rgba(88,22,164,0.10) 100%)` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
        </div>
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.9)" className="z-10" />
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
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              The right<br />
              <span className="text-purple-200">hospitality staff</span>,<br />
              when you need them.
            </h1>
            <p className="text-white/85 text-lg sm:text-xl leading-relaxed mb-8 sm:mb-12 max-w-xl">
              EXTRA delivers vetted, motivated hospitality professionals for hotels, events, catering and restaurants across Amsterdam. Flexible. Reliable. Ready to go.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/personeelsaanvraag" className="inline-flex items-center justify-center gap-2.5 bg-white text-purple-700 font-black text-base sm:text-lg px-8 py-4 rounded-full hover:bg-purple-50 hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-200 hover:-translate-y-0.5">
                <Phone className="w-5 h-5" /> Request staff now
              </Link>
              <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 text-white/90 font-bold text-base sm:text-lg px-8 py-4 rounded-full border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all duration-200">
                How it works <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-10 sm:mt-14 grid grid-cols-3 gap-4 sm:gap-6 max-w-sm">
              {[
                { val: "800+", label: "Active staff" },
                { val: "48h", label: "Response time" },
                { val: "9.2", label: "Client rating" },
              ].map((stat) => (
                <div key={stat.label} className="text-white">
                  <div className="text-2xl sm:text-3xl font-black" style={{ fontFamily: "'Poppins', sans-serif" }}>{stat.val}</div>
                  <div className="text-white/70 text-xs sm:text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LOGO MARQUEE */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100 relative overflow-hidden">
        <RevealSection>
          <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">
            Trusted by hotels, venues and catering companies
          </p>
        </RevealSection>
        <div className="relative group overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="flex animate-marquee-en group-hover:[animation-play-state:paused]">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                {logos.map((logo) => (
                  <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
                    <img src={logo.src} alt={logo.alt} width="200" height="200" loading="lazy" decoding="async" className="h-12 sm:h-16 lg:h-20 w-auto max-w-[120px] sm:max-w-[160px] object-contain opacity-70 hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee-en { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee-en { animation: marquee-en 40s linear infinite; }
        `}</style>
      </section>

      {/* SECTOR CARDS */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Briefcase className="w-4 h-4" /> All sectors
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Staffing solutions<br className="hidden sm:block" /> for every venue
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Whether you run a hotel, plan events or manage a catering operation, EXTRA has the professionals to keep your service running smoothly.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { icon: Hotel, label: "Hotels", desc: "Front office, housekeeping, F&B and banqueting staff for every hotel brand.", href: "/en/hotel-staffing-amsterdam", color: "purple" },
              { icon: PartyPopper, label: "Events", desc: "Experienced event staff for conferences, galas, festivals and more.", href: "/en/event-staff-amsterdam", color: "blue" },
              { icon: UtensilsCrossed, label: "Catering", desc: "Reliable catering professionals for large-scale productions.", href: "/en/catering-staff-amsterdam", color: "green" },
              { icon: ChefHat, label: "Restaurants", desc: "Waitstaff, bartenders and runners who hit the ground running.", href: "/en/restaurant-staff-amsterdam", color: "orange" },
            ].map((card, i) => (
              <RevealSection key={card.label} delay={i * 80}>
                <Link href={card.href} className="group block bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:bg-purple-600 transition-colors">
                    <card.icon className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{card.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{card.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-purple-600 font-bold text-sm group-hover:gap-3 transition-all">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-14 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Zap className="w-4 h-4" /> Simple process
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Staff in three steps
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
                No complicated contracts, no weeks of waiting. Tell us what you need, we handle the rest.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-10">
            {[
              { step: "01", icon: Search, title: "Submit your request", desc: "Fill in our quick online form. Tell us the date, role and number of staff you need. It takes under two minutes." },
              { step: "02", icon: UserCheck, title: "We match the right people", desc: "We select vetted professionals from our active pool who match your venue, service standard and timing." },
              { step: "03", icon: CalendarCheck, title: "Your team shows up, ready to work", desc: "Your staff arrives briefed and motivated. We stay available throughout the shift, so you never work alone." },
            ].map((step, i) => (
              <RevealSection key={step.step} delay={i * 100}>
                <div className="relative">
                  <div className="text-6xl sm:text-7xl font-black text-purple-100 leading-none mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>{step.step}</div>
                  <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center mb-5 -mt-4">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={300}>
            <div className="text-center mt-12 sm:mt-16">
              <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2 bg-purple-600 text-white font-black text-lg px-10 py-4 rounded-full hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-0.5">
                Request staff now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* SCREENING */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.9)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-400/20 px-4 sm:px-5 py-2 rounded-full">
                <UserCheck className="w-4 h-4" /> Personal screening
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Every staff member personally interviewed
              </h2>
              <p className="text-white/75 leading-relaxed mb-8 text-lg">
                We do not rely on CVs alone. Every candidate goes through a personal interview, skills assessment and reference check before joining the EXTRA pool. Only the best make it through.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Personal interview with skills and attitude assessment",
                  "Work permit and identity verification (NEN-4400-1)",
                  "Performance scores tracked after every shift",
                  "No-shows and complaints immediately registered",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/80 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/20">
                <img src={sollicitatieformulier} alt="EXTRA candidate application form" className="w-full rounded-2xl shadow-xl" loading="lazy" decoding="async" />
                <p className="text-white/60 text-sm text-center mt-5 font-medium">Candidate application and screening form</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* SCORES */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection delay={150}>
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl">
                <img src={dashboardKandidaten} alt="Staff performance scores dashboard" className="w-full rounded-2xl shadow-md" loading="lazy" decoding="async" />
                <p className="text-gray-400 text-sm text-center mt-4 font-medium">Real performance data per staff member</p>
              </div>
            </RevealSection>
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Data-driven matching
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Staff selected on proven performance scores
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                We track scores for every staff member across softskills, bar, service and kitchen. This means we always match the right person to your venue, based on facts, not gut feeling.
              </p>
              <div className="space-y-4">
                {[
                  "Individual discipline scores per staff member",
                  "Consistent performance tracked across multiple shifts",
                  "Preferred staff added to your personal talent pool",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-gray-700 font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* TALENT POOL */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Heart className="w-4 h-4" /> Your personal pool
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Familiar faces, less explaining
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                After each successful collaboration, your favourite staff members are added to your personal talent pool. Next time you need staff, they are ready to step in without a briefing.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: Users, text: "Dedicated pool built around your preferences" },
                  { icon: TrendingUp, text: "Faster response on last-minute requests" },
                  { icon: Star, text: "Higher guest satisfaction through familiar staff" },
                  { icon: Tag, text: "Staff tagged by speciality and venue experience" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-purple-700" />
                    </div>
                    <span className="text-gray-700 font-medium text-sm sm:text-base">{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-7 py-3.5 rounded-full hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-0.5">
                Build your talent pool <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="space-y-4">
                {[
                  { title: "Hotels", icon: Hotel, desc: "Housekeeping, F&B, banqueting and front office specialists who know your property." },
                  { title: "Events", icon: PartyPopper, desc: "Waitstaff and logistics teams experienced in your event format." },
                  { title: "Catering", icon: UtensilsCrossed, desc: "Production-ready catering professionals for any scale." },
                  { title: "Restaurants", icon: ChefHat, desc: "Service and kitchen staff who fit your concept and pace." },
                ].map((card, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-purple-200 hover:-translate-y-1 transition-all duration-300 flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <card.icon className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{card.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* REWARD APP */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.1} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-white/70 px-4 sm:px-5 py-2 rounded-full">
                <Gift className="w-4 h-4" /> EXTRA rewards system
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Motivated staff deliver better service
              </h2>
              <p className="text-gray-700 leading-relaxed mb-8 text-lg">
                Our built-in rewards app keeps staff motivated and engaged. Staff earn points for reliability and performance, redeemable for real rewards like AirPods, padel gear or extra cash. Better staff motivation means better service for your guests.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Star, title: "Performance rewards", desc: "Reliable staff earn more points" },
                  { icon: TrendingUp, title: "Leaderboards", desc: "Healthy competition within teams" },
                  { icon: Gift, title: "Real prizes", desc: "AirPods, gift cards and more" },
                  { icon: Zap, title: "Same-day pay", desc: "Instant payouts after each shift" },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
                    <item.icon className="w-5 h-5 text-purple-600 mb-2" />
                    <div className="font-bold text-sm text-gray-900 mb-1">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="relative">
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-purple-100 mx-auto max-w-xs">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-purple-100/60 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex gap-2 ml-1">
                      {appScreens.map((s, i) => (
                        <button key={s.key} onClick={() => setActiveScreen(i)} className={`text-xs font-bold px-2 py-0.5 rounded-full transition-all ${activeScreen === i ? "bg-purple-600 text-white" : "text-gray-500 hover:text-purple-600"}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {appScreens.map((s, i) => (
                    <div key={s.key} className={`transition-all duration-500 ${activeScreen === i ? "block" : "hidden"}`}>
                      <img src={s.img} alt={`EXTRA app ${s.label}`} className="w-full object-cover" loading="lazy" decoding="async" />
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* WHY EXTRA */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4" /> Why EXTRA
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What sets us apart
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              { icon: UserCheck, title: "Personally screened", desc: "Every staff member is interviewed face-to-face before joining our pool. No exceptions." },
              { icon: Clock, title: "Fast deployment", desc: "Staff confirmed within hours, often ready within 48 hours of your request." },
              { icon: Shield, title: "Fully compliant", desc: "NEN-4400-1 certified. Work permits, payroll and insurance all handled by us." },
              { icon: BarChart3, title: "Performance tracked", desc: "Scores after every shift. You always know who you are booking." },
              { icon: Heart, title: "Your own talent pool", desc: "Your favourite staff saved and prioritised for future requests." },
              { icon: Gift, title: "Motivated team", desc: "Our rewards app keeps staff genuinely motivated to show up at their best." },
            ].map((card, i) => (
              <RevealSection key={i} delay={i * 60}>
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-purple-700" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={400}>
            <div className="text-center mt-12">
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full border border-green-200">
                <Shield className="w-4 h-4" />
                Fully compliant with Dutch labour law 2026, NEN-4400-1 certified
              </span>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.9)" />
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 text-center">
          <RevealSection>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Ready to request<br /><span className="text-purple-300">your first team?</span>
            </h2>
            <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Tell us what you need and we will get back to you within hours with the right professionals for your venue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/personeelsaanvraag" className="inline-flex items-center justify-center gap-2.5 bg-white text-purple-700 font-black text-lg px-10 py-4 rounded-full hover:bg-purple-50 hover:shadow-2xl transition-all hover:-translate-y-0.5">
                <Phone className="w-5 h-5" /> Request staff now
              </Link>
              <a href="mailto:info@doehetextra.nl" className="inline-flex items-center justify-center gap-2 text-white/90 font-bold text-lg px-10 py-4 rounded-full border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all">
                Send us an email
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
