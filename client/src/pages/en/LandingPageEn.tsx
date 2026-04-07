import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Users, Trophy, Gift, Star, ChevronDown, ChevronUp,
  TrendingUp, Shield, Clock,
  ArrowRight, Check, Briefcase, UserCheck, CreditCard,
  Award, Handshake, Phone, Sparkles, Heart, Zap,
  Building2, UtensilsCrossed, PartyPopper, Wine, MessageCircle,
  Mail, MapPin
} from "lucide-react";
import groupShotHero from "@assets/GROUP_SHOT_002_1775115679180.png";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import screenDashboard from "@assets/IMG_8971_1772395165096.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoMercure from "../../assets/pitch/logo-mercure.png";
import logoPulitzer from "@assets/Logo_Pulitzer_1773389329669.png";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoWestweelde from "../../assets/pitch/logo-westweelde-clean.png";
import dienstChefPng from "@assets/Chef_1771833440047.webp";
import dienstHoreca from "@assets/Horecamedewerker_1771836004844.webp";
import dienstFrontoffice from "@assets/Front-office_1771842809388.webp";
import dienstHousekeeping from "@assets/Housekeeping_1771842919384.webp";
import rewardJBL from "@assets/JBL_1771872665358.webp";
import rewardPathe from "@assets/Pathe_1771872665358.webp";
import rewardPadel from "@assets/Padelracket_1771872665358.webp";
import rewardDinerbon from "@assets/Dinerbon_1771872665358.webp";
import rewardAirtag from "@assets/airtag_1771872665358.webp";
import rewardMuseumkaart from "@assets/Museumjaarkaart_1771872665358.webp";
import rewardAirpods from "@assets/Airpods_1771872665358.webp";
import rewardGig from "@assets/Gig_1771872665358.webp";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function XPatternBg({ count = 3, opacity = 0.08, color = "rgba(139,92,246,1)" }: { count?: number; opacity?: number; color?: string }) {
  const positions = [
    { left: "5%", top: "10%", size: 200, rotate: 15 },
    { left: "80%", top: "20%", size: 160, rotate: -25 },
    { left: "50%", top: "60%", size: 240, rotate: 35 },
    { left: "15%", top: "75%", size: 180, rotate: -10 },
    { left: "90%", top: "80%", size: 140, rotate: 45 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal();
  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const end = target;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else { setCount(Math.floor(start * 10) / 10); }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target]);
  return (
    <span ref={ref}>
      {target % 1 !== 0 ? count.toFixed(1) : Math.floor(count)}
      {suffix}
    </span>
  );
}

const rewardItems = [
  { name: "JBL Speaker", points: "2,500 pts", image: rewardJBL },
  { name: "Pathé Voucher", points: "800 pts", image: rewardPathe },
  { name: "Padel Racket", points: "1,800 pts", image: rewardPadel },
  { name: "Dinner Voucher", points: "1,200 pts", image: rewardDinerbon },
  { name: "Apple AirTag", points: "900 pts", image: rewardAirtag },
  { name: "Museum Card", points: "1,500 pts", image: rewardMuseumkaart },
  { name: "AirPods", points: "4,500 pts", image: rewardAirpods },
  { name: "Concert Ticket", points: "2,200 pts", image: rewardGig },
];

const allLogos = [
  { src: logoAmrath, alt: "Amrâth Hotels" },
  { src: logoMercure, alt: "Mercure Hotels" },
  { src: logoPulitzer, alt: "Pulitzer Amsterdam" },
  { src: logoFcUtrecht, alt: "FC Utrecht" },
  { src: logoFunda, alt: "Funda" },
  { src: logoHartMuseum, alt: "H'art Museum" },
  { src: logoHetePeper, alt: "Hete Peper" },
  { src: logoHilton, alt: "Hilton" },
  { src: logoMarriott, alt: "Marriott" },
  { src: logoSelectCatering, alt: "Select Catering" },
  { src: logoAppel, alt: "Appèl" },
  { src: logoWestweelde, alt: "Westweelde" },
];

export default function LandingPageEn() {
  const [howItWorksTab, setHowItWorksTab] = useState<"employer" | "employee">("employer");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "EXTRA | Hospitality Staffing Agency Amsterdam";
    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "EXTRA is Amsterdam's hospitality staffing agency. We supply experienced hotel, restaurant, event and catering staff — all on payroll. Fast, flexible and fully compliant.");
    setMeta("og:title", "EXTRA | Hospitality Staffing Agency Amsterdam", "property");
    setMeta("og:description", "800+ active hospitality staff for hotels, restaurants, events and caterers. Handpicked, flexible and all on payroll.", "property");
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <PublicNav />

      {/* ════════════════════════════════════════════════ */}
      {/* 1. HERO                                          */}
      {/* ════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, #2d0663 0%, #4a0e96 35%, #5b16a8 65%, #6d28d9 100%)" }}>

        {/* X-pattern */}
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
          <img src={groupShotHero} alt="EXTRA hospitality staff Amsterdam" className="absolute top-0 bottom-0 right-0 h-full object-cover" loading="eager" style={{ left: "4%", objectPosition: "68% center", filter: "contrast(1.08) saturate(1.20) brightness(1.08)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 38% 65% at 65% 44%, rgba(255,248,255,0.13) 0%, rgba(220,180,255,0.04) 55%, transparent 75%)" }} />
          <div className="absolute inset-0 landing-text-gradient" />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: "20%", background: "linear-gradient(to top, rgba(29,5,73,0.80) 0%, rgba(29,5,73,0.28) 50%, transparent 100%)" }} />
          <div className="absolute top-0 left-0 right-0" style={{ height: "18%", background: "linear-gradient(to bottom, rgba(29,5,73,0.48) 0%, transparent 100%)" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 sm:pt-32 sm:pb-24 w-full">
          <div className="max-w-xl lg:max-w-[52%] 2xl:max-w-[42%]">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-7 border border-white/20">
              <Users className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">800+ active staff members</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] text-white leading-[1.05] mb-6" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Hospitality<br />
              needs{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA heroes.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-3.5 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-purple-100/90 leading-relaxed font-medium mb-8 max-w-lg">
              Need flexible hospitality staff? Or looking to work in hospitality? EXTRA makes it happen — fast, reliable and fair.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-7 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                I need staff <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/en/hospitality-jobs" className="border-2 border-white/30 text-white font-bold px-7 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                I'm looking for work <ArrowRight className="w-5 h-5" />
              </a>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {[
                { emoji: "✓", label: "All staff on payroll" },
                { emoji: "☆", label: "Handpicked staff" },
                { emoji: "⬡", label: "Daily pay possible" },
              ].map(({ emoji, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">{emoji} {label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 2. STATS BAR                                     */}
      {/* ════════════════════════════════════════════════ */}
      <div className="relative z-30 -mt-16 sm:-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-900/15 p-6 sm:p-8 lg:p-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-10">
            {[
              { value: 800, suffix: "+", label: "Active staff members", icon: Users, color: "text-purple-600" },
              { value: 90, suffix: "+", label: "Happy clients", icon: Heart, color: "text-pink-500" },
              { value: 500, suffix: "k+", label: "Points earned", icon: Sparkles, color: "text-yellow-500" },
              { value: 4.8, suffix: "/5", label: "234 Google reviews", icon: Star, color: "text-amber-400" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color} mx-auto mb-2 sm:mb-3`} />
                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* 3. WHAT ARE YOU LOOKING FOR?                    */}
      {/* ════════════════════════════════════════════════ */}
      <section id="audience" className="relative bg-white py-16 sm:py-20 lg:py-28 overflow-hidden">
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-5xl mx-auto px-5 sm:px-6 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What are you looking for?
              </h2>
              <p className="text-lg sm:text-xl text-gray-500 mt-3 sm:mt-4 max-w-xl mx-auto">Choose what fits you best</p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-8">
            <RevealSection>
              <a href="/personeelsaanvraag" className="group block relative bg-gradient-to-br from-purple-50 to-white rounded-2xl sm:rounded-[2rem] shadow-lg shadow-purple-500/5 border-2 border-purple-100 p-7 sm:p-10 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-2 transition-all duration-400 h-full overflow-hidden">
                <div className="absolute top-0 right-0 w-28 sm:w-40 h-28 sm:h-40 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-[100%] opacity-60" />
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/20">
                    <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>I need extra staff</h3>
                  <ul className="space-y-3 sm:space-y-4 mb-7 sm:mb-10">
                    {["Fast deployment of hospitality staff", "Strict selection & performance ratings", "Scale up or down flexibly"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 sm:gap-3 text-gray-600">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-700" />
                        </div>
                        <span className="text-sm sm:text-base font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 rounded-full group-hover:bg-purple-700 group-hover:gap-4 transition-all shadow-lg shadow-purple-500/20">
                    I need extra staff <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                </div>
              </a>
            </RevealSection>

            <RevealSection delay={150}>
              <a href="/en/hospitality-jobs" className="group block relative bg-gradient-to-br from-indigo-50 to-white rounded-2xl sm:rounded-[2rem] shadow-lg shadow-indigo-500/5 border-2 border-indigo-100 p-7 sm:p-10 hover:shadow-2xl hover:border-indigo-300 hover:-translate-y-2 transition-all duration-400 h-full overflow-hidden">
                <div className="absolute top-0 right-0 w-28 sm:w-40 h-28 sm:h-40 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-[100%] opacity-60" />
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-lg shadow-indigo-500/20">
                    <UserCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>I'm looking for extra work</h3>
                  <ul className="space-y-3 sm:space-y-4 mb-7 sm:mb-10">
                    {["Paid out fast via the app", "Pick shifts that fit your schedule", "Earn points & rewards"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 sm:gap-3 text-gray-600">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-700" />
                        </div>
                        <span className="text-sm sm:text-base font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 rounded-full group-hover:bg-indigo-700 group-hover:gap-4 transition-all shadow-lg shadow-indigo-500/20">
                    I'm looking for extra work <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                </div>
              </a>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* LOGO MARQUEE                                    */}
      {/* ════════════════════════════════════════════════ */}
      <section id="trust" className="py-10 sm:py-14 bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Trusted by hospitality teams across Amsterdam</p>
          </RevealSection>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                  {allLogos.map((logo) => (
                    <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
                      <img src={logo.src} alt={logo.alt} width="200" height="200" className="h-16 sm:h-20 lg:h-24 w-auto object-contain" loading="lazy" decoding="async" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 40s linear infinite; }
        `}</style>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 4. WHAT WE SUPPLY                               */}
      {/* ════════════════════════════════════════════════ */}
      <section id="services" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950" />
        <XPatternBg count={4} opacity={0.06} color="rgba(255,255,255,0.8)" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                <Sparkles className="w-4 h-4" /> Our services
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 sm:mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What kind of EXTRA's do you need?
              </h2>
              <p className="text-base sm:text-lg text-purple-100/70 leading-relaxed max-w-2xl mx-auto">
                From kitchen to front office — always presentable and on payroll.
              </p>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { img: dienstHoreca, title: "Service & Bar", desc: "Experienced waitstaff, bartenders and runners for restaurants, hotels and events.", link: "/en/hospitality-staff-amsterdam", tags: ["Waitstaff", "Bartenders", "Runners"], color: "from-purple-600 to-purple-800" },
              { img: dienstChefPng, title: "Chef & Kitchen", desc: "Independent chefs, sous-chefs and kitchen support who hit the ground running in any kitchen.", link: "/en/hospitality-staff-amsterdam", tags: ["Head chefs", "Sous-chefs", "Kitchen support"], color: "from-orange-500 to-red-600" },
              { img: dienstFrontoffice, title: "Front Office", desc: "Front office staff, receptionists and concierges for 3- to 5-star hotels.", link: "/en/hotel-staffing-amsterdam", tags: ["Reception", "Concierge", "Guest services"], color: "from-blue-500 to-indigo-600" },
              { img: dienstHousekeeping, title: "Housekeeping", desc: "Reliable room attendants and housekeeping support who work independently and efficiently.", link: "/en/hotel-staffing-amsterdam", tags: ["Room attendants", "Floor supervisors", "Laundry"], color: "from-green-500 to-emerald-600" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <a href={item.link} className="group relative block bg-white/[0.06] rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden hover:bg-white/[0.1] hover:border-purple-400/30 hover:-translate-y-2 transition-all duration-400 h-full">
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className={`absolute top-4 left-4 bg-gradient-to-br ${item.color} rounded-xl px-3 py-1`}>
                      <span className="text-white text-xs font-bold uppercase tracking-wide">EXTRA</span>
                    </div>
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-purple-200 transition-colors">{item.title}</h3>
                    <p className="text-sm text-purple-200/70 leading-relaxed mb-4">{item.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map((tag, j) => (
                        <span key={j} className="text-xs font-semibold bg-white/10 text-purple-200 px-2.5 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-purple-300 text-sm font-bold group-hover:gap-3 transition-all">
                      View more <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </a>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 5. HOW EXTRA WORKS                              */}
      {/* ════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Zap className="w-4 h-4" /> Simple & fast
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                How EXTRA works
              </h2>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
              {(["employer", "employee"] as const).map((tab) => (
                <button key={tab} onClick={() => setHowItWorksTab(tab)}
                  className={`px-5 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all duration-300 ${
                    howItWorksTab === tab
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-500/25 scale-105"
                      : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200"
                  }`}>
                  {tab === "employer" ? "For employers" : "For job seekers"}
                </button>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
              {(howItWorksTab === "employer" ? [
                { icon: Phone, step: "1", title: "Get in touch", desc: "Call us or submit your staff request.", color: "from-purple-500 to-purple-700" },
                { icon: UserCheck, step: "2", title: "Intake & needs", desc: "We discuss your situation and requirements.", color: "from-indigo-500 to-purple-600" },
                { icon: Clock, step: "3", title: "Matching & deployment", desc: "We select and schedule the right staff.", color: "from-blue-500 to-indigo-600" },
                { icon: TrendingUp, step: "4", title: "Feedback & pool", desc: "We process ratings and build your preferred team.", color: "from-emerald-500 to-teal-600" },
              ] : [
                { icon: UserCheck, step: "1", title: "Apply to EXTRA", desc: "Sign up via the application form.", color: "from-purple-500 to-purple-700" },
                { icon: MessageCircle, step: "2", title: "Personal intake", desc: "We discuss your experience and preferences.", color: "from-violet-500 to-purple-600" },
                { icon: Briefcase, step: "3", title: "Shifts & work", desc: "Pick shifts that suit your schedule and skills.", color: "from-indigo-500 to-purple-600" },
                { icon: Gift, step: "4", title: "Rewards & payout", desc: "Earn EXTRAATjes and get paid fast.", color: "from-emerald-500 to-teal-600" },
              ]).map((item, i) => (
                <div key={`${howItWorksTab}-${i}`} className="relative group">
                  {i < 3 && <div className="hidden lg:block absolute top-10 left-[calc(100%+0.5rem)] w-[calc(100%-3rem)] h-0.5 bg-gradient-to-r from-purple-200 to-transparent z-0" />}
                  <div className="relative bg-white rounded-2xl sm:rounded-[1.5rem] p-5 sm:p-8 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm h-full flex flex-col">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="text-[10px] sm:text-xs font-black text-purple-400 uppercase tracking-widest mb-2 sm:mb-3">Step {item.step}</div>
                    <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">{item.title}</h4>
                    <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={300}>
            <div className="flex justify-center mt-10 sm:mt-12">
              <a href="/en/how-we-work" className="inline-flex items-center gap-2 font-bold px-7 py-3.5 rounded-full text-white text-sm sm:text-base transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/25" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                Read more about EXTRA <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 6. EXTRAATJE / REWARDS                          */}
      {/* ════════════════════════════════════════════════ */}
      <section id="rewards" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={5} opacity={0.1} color="rgba(255,255,255,0.8)" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                <Gift className="w-4 h-4" /> EXTRAATje
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Working gets{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">rewarded</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed mb-7">
                Staff automatically earn points for every shift worked and challenge completed. Those points can be redeemed for real rewards.
              </p>
              <Link href="/en/rewards" className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-full text-white text-sm sm:text-base transition-all duration-200 shadow-lg shadow-purple-900/50 hover:shadow-purple-700/60 hover:scale-105" style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}>
                <Gift className="h-4 w-4" />
                Read more about EXTRAATje
              </Link>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex justify-center mb-16 sm:mb-24">
              <div className="relative w-[240px] sm:w-[280px]">
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border-[6px] border-gray-800 bg-gray-900">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[22px] bg-gray-900 rounded-b-xl z-20" />
                  <img src={screenDashboard} alt="EXTRA staff app — rewards and shifts dashboard" className="w-full relative z-10" loading="lazy" decoding="async" />
                </div>
                <div className="absolute -inset-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-[3.5rem] blur-3xl -z-10" />
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="mb-12 sm:mb-16">
              <div className="text-center mb-6 sm:mb-8">
                <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <Star className="w-3.5 h-3.5" /> EXTRA rewards
                </span>
              </div>
              <div className="relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-purple-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-purple-950 to-transparent z-10 pointer-events-none" />
                <div className="flex gap-4 sm:gap-6" style={{ animation: "marquee-scroll 40s linear infinite", width: "fit-content" }}>
                  {[...rewardItems, ...rewardItems].map((reward, i) => (
                    <div key={i} className="flex-shrink-0 w-[160px] sm:w-[200px] rounded-2xl border border-white/[0.15] p-4 sm:p-5 text-center transition-all duration-300 hover:border-purple-400/40 hover:scale-105 group" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
                      <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <img src={reward.image} alt={reward.name} loading="lazy" decoding="async" className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <h5 className="text-white font-bold text-sm sm:text-base mb-2 leading-tight">{reward.name}</h5>
                      <span className="inline-block text-[10px] sm:text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">{reward.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <style>{`@keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
          </RevealSection>

          <RevealSection delay={300}>
            <div className="max-w-2xl mx-auto mt-12 sm:mt-16 bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/15 p-6 sm:p-8">
              <h4 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-300" />
                What you notice as a client
              </h4>
              <ul className="space-y-2.5">
                {["More show-ups, fewer last-minute cancellations", "People who love coming back → more stable pool", "Motivated staff who go the extra mile"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-purple-200/80 text-sm sm:text-base">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 7. WHY EXTRA                                    */}
      {/* ════════════════════════════════════════════════ */}
      <section id="differentiators" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.1} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/70 px-4 sm:px-5 py-2 rounded-full">
                <Shield className="w-4 h-4" /> Legislation-proof
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Why EXTRA
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-3 sm:mt-4 max-w-xl mx-auto">
                Ready for new employment legislation from 2026. Certainty for you and your staff.
              </p>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { icon: Shield, title: "All staff on payroll", desc: "No freelancer constructions. Clear contracts. Full compliance.", emoji: "🛡️" },
              { icon: Award, title: "Handpicked & rated", desc: "Feedback after every shift. Quality keeps going up.", emoji: "⭐" },
              { icon: Clock, title: "Fast & flexible deployment", desc: "Scale up for peak periods. Or a quick last-minute fix.", emoji: "⚡" },
              { icon: Handshake, title: "Clear agreements", desc: "You know what to expect. Short lines of communication.", emoji: "🤝" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-purple-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="text-3xl sm:text-4xl flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">{item.emoji}</div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                      <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection delay={400}>
            <div className="text-center mt-8 sm:mt-12">
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full border border-green-200">
                <Shield className="w-4 h-4" />
                Fully compliant with employment legislation 2026
              </span>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 8. TESTIMONIALS                                 */}
      {/* ════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
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
            {[
              { quote: "EXTRA always delivers reliable staff, quickly and with no hassle. The people they send are professional, presentable and require minimal briefing. We've been working with them for over a year and wouldn't want it any other way.", name: "Sarah van den Berg", role: "F&B Manager", company: "Amrâth Hotel Amsterdam", rating: 5 },
              { quote: "What I appreciate most about EXTRA is the consistency. The same familiar faces, people who know how we work. Fewer no-shows, more quality. The EXTRAATje system clearly motivates them to keep coming back.", name: "Thomas Mulder", role: "Operations Director", company: "Select Catering", rating: 5 },
              { quote: "I've been working through EXTRA for almost two years. I can pick shifts that fit my schedule, get paid fast and on top of that I earn points and rewards. It's genuinely fun to see those points stack up.", name: "Fatima El Ouali", role: "Service staff", company: "EXTRA staff member", rating: 5 },
            ].map((review, i) => (
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
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">"{review.quote}"</p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                      <span className="text-white font-bold text-sm sm:text-base">{review.name.split(" ").map((n: string) => n[0]).join("")}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{review.name}</p>
                      <p className="text-xs sm:text-sm text-gray-400 font-medium">{review.role}</p>
                      <p className="text-xs text-purple-600 font-semibold">{review.company}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 9. FAQ                                          */}
      {/* ════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-gray-50">
        <XPatternBg count={2} opacity={0.06} color="rgba(139,92,246,1)" />
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <MessageCircle className="w-4 h-4" /> FAQ
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Frequently asked questions
              </h2>
            </div>
          </RevealSection>

          <div className="space-y-3 sm:space-y-4">
            {[
              { q: "How quickly can you deliver hospitality staff?", a: "At EXTRA we understand that busy periods often arise unexpectedly. Thanks to our large pool of experienced hospitality staff, we can often deploy quickly. In many cases we can propose suitable staff within 48 hours for hotels, restaurants, events or catering assignments." },
              { q: "For which roles can I hire hospitality staff?", a: "Through EXTRA you can hire staff for various hospitality and hotel roles — think waitstaff, bar staff, runners, chefs, front office staff and housekeeping. We always look for the best match between the staff member and the assignment." },
              { q: "What does hospitality staff cost through a staffing agency?", a: "The cost of hospitality staff through a staffing agency depends on factors like the role, experience level and duration of deployment. At EXTRA we work with transparent rates and are happy to help find the right solution for your situation." },
              { q: "Can you scale up quickly for events or peak periods?", a: "Yes. Flexibility is one of EXTRA's key strengths. Whether it's a large event, a busy weekend or a temporary peak in occupancy: we can scale up and down quickly with experienced hospitality staff." },
              { q: "What types of businesses does EXTRA supply staff to?", a: "EXTRA supplies hospitality staff to various businesses in the hospitality sector — hotels, event venues, caterers and restaurants. This gives us broad experience across very different assignments and working environments." },
              { q: "How do I request staff from EXTRA?", a: "You can easily submit a staff request via the request form on our website. After we receive it, we'll get in touch to discuss your requirements and planning." },
            ].map((faq, i) => (
              <RevealSection key={i} delay={i * 60}>
                <div className="bg-white rounded-2xl border border-gray-100 hover:border-purple-200 transition-all duration-300 overflow-hidden shadow-sm">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 sm:p-7 text-left">
                    <span className="text-base sm:text-lg font-bold text-gray-900 pr-4">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-purple-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-72 pb-5 sm:pb-7" : "max-h-0"}`}>
                    <p className="px-5 sm:px-7 text-sm sm:text-base text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 10. FINAL CTA                                   */}
      {/* ════════════════════════════════════════════════ */}
      <section id="final-cta" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Ready to work{" "}
              <span className="relative inline-block">
                <span className="relative z-10">together?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Whether you need extra staff or extra work — we sort it out fast and clearly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3" style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}>
                Request staff
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/en/hospitality-jobs" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3">
                I'm looking for work
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
