import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Users, Shield, Clock, Star,
  CheckCircle2, UserCheck, Gift, TrendingUp, Target, Trophy,
  BarChart3, BarChart2, Zap, Building2, BedDouble, Utensils, ChefHat,
  GlassWater, CalendarCheck, Layers, Handshake, Phone, Mail,
  Check, Bell, ArrowRight, Heart, CookingPot, ClipboardList
} from "lucide-react";

import extraLogoWit from "../assets/pitch/extra-logo-wit.png";
import extraLogoBlauw from "../assets/pitch/extra-logo-blauw.png";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import heroBgImage from "@assets/hero-background.webp";

import sollicitatieformulier from "@assets/Sollicitatieformulier_1772893764120.png";
import dashboardKandidaten from "@assets/Dashboard_kandidaten_1772893764120.png";
import scoreSnippet from "@assets/Scherm\u00adafbeelding_2026-03-12_om_11.31.00_1773311517193.png";
import poulesMatches from "@assets/Scherm\u00adafbeelding_2026-03-12_om_10.22.20_1773311761908.png";
import poulesButton from "@assets/Scherm\u00adafbeelding_2026-03-12_om_11.36.42_1773311845901.png";

import screenDashboard from "@assets/IMG_9066_1773314165933.png";
import screenRewards from "@assets/IMG_9067_1773314165933.png";
import screenRanglijst from "@assets/IMG_9068_1773314165933.png";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.png";

import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoMercure from "../assets/pitch/logo-mercure.png";
import logoPulitzer from "../assets/pitch/logo-pulitzer-clean.png";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoWestweelde from "../assets/pitch/logo-westweelde-clean.png";

const TOTAL_SLIDES = 11;

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard" },
  { key: "beloningen", img: screenRewards, label: "Beloningen" },
  { key: "uitdagingen", img: screenUitdagingen, label: "Uitdagingen" },
  { key: "ranglijst", img: screenRanglijst, label: "Ranglijst" },
];

const marqueeLogos = [
  { src: logoMarriott, alt: "Marriott" },
  { src: logoHilton, alt: "Hilton" },
  { src: logoMercure, alt: "Mercure Hotels" },
  { src: logoPulitzer, alt: "Pulitzer Amsterdam" },
  { src: logoHartMuseum, alt: "Hart Museum" },
  { src: logoSelectCatering, alt: "Select Catering" },
  { src: logoAppel, alt: "Appel" },
  { src: logoAmrath, alt: "Amrath Hotels" },
  { src: logoFcUtrecht, alt: "FC Utrecht" },
  { src: logoWestweelde, alt: "Westweelde" },
  { src: logoFunda, alt: "Funda" },
  { src: logoHetePeper, alt: "Hete Peper" },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ${className}`}
      style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(24px)", transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function XPatternBg({ count = 4, opacity = 0.08, color = "rgba(139,92,246,1)", className = "" }: { count?: number; opacity?: number; color?: string; className?: string }) {
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
        }} />
      ))}
    </div>
  );
}

function IpadMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 520 }}>
      <div className="relative rounded-[2rem] shadow-2xl shadow-purple-500/20"
        style={{ background: "linear-gradient(145deg, #2e2e32, #1c1c20)", padding: "14px 20px", border: "1px solid rgba(255,255,255,0.09)" }}>
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
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full blur-xl bg-purple-400/20" />
    </div>
  );
}

function BrowserMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 560 }}>
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
        <img src={src} alt={alt} className="w-full object-cover object-top" loading="lazy" decoding="async" />
      </div>
    </div>
  );
}

const slideVariants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
};

function SlideWrap({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`absolute inset-0 overflow-y-auto ${className}`}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      {children}
    </motion.div>
  );
}

export default function BHGGroupPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeScreen, setActiveScreen] = useState(0);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setCurrentSlide((p) => Math.min(p + 1, TOTAL_SLIDES - 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setCurrentSlide((p) => Math.max(p - 1, 0)); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (currentSlide !== 7) return;
    const interval = setInterval(() => setActiveScreen((p) => (p + 1) % appScreens.length), 3500);
    return () => clearInterval(interval);
  }, [currentSlide]);

  const next = () => setCurrentSlide((p) => Math.min(p + 1, TOTAL_SLIDES - 1));
  const prev = () => setCurrentSlide((p) => Math.max(p - 1, 0));

  return (
    <div className="h-screen w-screen overflow-hidden relative select-none" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ─── Progress dots ─── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-purple-600 w-6" : "bg-gray-300 hover:bg-gray-400 w-1.5"}`} />
        ))}
      </div>

      {/* ─── Nav arrows ─── */}
      <div className="absolute bottom-4 right-5 flex gap-2 z-50">
        <button onClick={(e) => { e.stopPropagation(); prev(); }} disabled={currentSlide === 0}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${currentSlide === 0 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-sm"}`}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); next(); }} disabled={currentSlide === TOTAL_SLIDES - 1}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${currentSlide === TOTAL_SLIDES - 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-purple-300 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"}`}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Slide counter ─── */}
      <div className="absolute bottom-5 left-5 text-xs font-bold text-gray-300 z-50 select-none">{currentSlide + 1} / {TOTAL_SLIDES}</div>

      <AnimatePresence mode="wait">

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 0 — HERO                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 0 && (
          <SlideWrap key="s0">
            <div className="relative min-h-screen flex flex-col">
              <div className="absolute inset-0">
                <img src={heroBgImage} alt="" className="w-full h-full object-cover object-center" loading="eager" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(26,10,46,0.96) 0%, rgba(26,10,46,0.90) 45%, rgba(26,10,46,0.65) 70%, rgba(26,10,46,0.30) 100%)" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
              </div>
              <XPatternBg count={3} opacity={0.07} color="rgba(168,85,247,0.7)" />

              <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full pt-16 pb-8">
                <div className="max-w-2xl">
                  <motion.img src={extraLogoWit} alt="EXTRA" className="h-8 sm:h-10 mb-7"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} />
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white text-xs sm:text-sm font-semibold">Persoonlijke brochure voor BHG Group</span>
                  </motion.div>
                  <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-5"
                    style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Minder uitval,{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-200">meer continuïteit</span>{" "}
                    in uw hotels
                  </motion.h1>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                    className="text-base sm:text-lg text-purple-100/80 leading-relaxed mb-8 max-w-xl">
                    EXTRA levert geselecteerd hotelpersoneel met een bewezen systeem voor motivatie, kwaliteit en loyaliteit, speciaal gebouwd voor hotels die structurele rust willen in hun operatie.
                  </motion.p>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    className="flex flex-wrap gap-6">
                    {[
                      { icon: Shield, text: "NEN 4400-1 gecertificeerd" },
                      { icon: Users, text: "Iedereen in loondienst" },
                      { icon: Clock, text: "Binnen 48 uur beschikbaar" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/70">
                        <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{item.text}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Marquee logos strip */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
                className="relative z-10 w-full py-5 border-t border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden">
                <div className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-black/30 to-transparent z-10" />
                  <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-black/30 to-transparent z-10" />
                  <div className="flex animate-marquee-bhg">
                    {[...Array(2)].map((_, setIdx) => (
                      <div key={setIdx} className="flex items-center gap-10 sm:gap-14 px-8 flex-shrink-0">
                        {marqueeLogos.map((logo) => (
                          <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0">
                            <img src={logo.src} alt={logo.alt} width="200" height="200" loading="lazy" decoding="async"
                              className="h-8 sm:h-10 w-auto object-contain opacity-50" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="relative z-10 text-center text-xs text-white/25 py-2">
                Klik of gebruik pijltjestoetsen om te navigeren
              </motion.p>
            </div>
            <style>{`
              @keyframes marquee-bhg { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
              .animate-marquee-bhg { animation: marquee-bhg 35s linear infinite; }
            `}</style>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 1 — UITDAGINGEN                              */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 1 && (
          <SlideWrap key="s1">
            <div className="relative min-h-screen bg-white">
              <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-14">
                <RevealSection>
                  <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                    <Building2 className="w-4 h-4" /> Herkenbaar?
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    De uitdagingen waar hotels dagelijks mee leven
                  </h2>
                  <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-2xl">
                    BHG Group opereert op meerdere locaties tegelijk. Dat vraagt om een personeelspartner die niet alleen levert, maar ook structureel meedenkt.
                  </p>
                </RevealSection>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {[
                    { emoji: "🤒", title: "Langdurig ziekteverzuim", desc: "Uitval die de rest van het team overbelast en de servicekwaliteit ondermijnt." },
                    { emoji: "🚫", title: "No-shows en last-minute uitval", desc: "Diensten die op het laatste moment wegvallen met operationele chaos als gevolg." },
                    { emoji: "🔍", title: "Moeite met betrouwbaar personeel", desc: "Veel tijd kwijt aan wervingsprocessen die telkens opnieuw beginnen." },
                    { emoji: "🔄", title: "Gebrek aan continuïteit", desc: "Steeds andere gezichten die telkens opnieuw ingewerkt moeten worden." },
                    { emoji: "😰", title: "Operationele druk op managers", desc: "Managers die brandblusdienst spelen in plaats van leidinggeven aan hun team." },
                    { emoji: "❌", title: "Geen echte partnerrelatie", desc: "Bureaus die leveren maar niet meedenken over structurele oplossingen per locatie." },
                  ].map((item, i) => (
                    <RevealSection key={i} delay={i * 70}>
                      <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-5 sm:p-6 border border-purple-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 h-full">
                        <div className="text-3xl mb-3">{item.emoji}</div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1.5">{item.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </RevealSection>
                  ))}
                </div>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 2 — WAAROM EXTRA                             */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 2 && (
          <SlideWrap key="s2">
            <div className="relative min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
              <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-14">
                <RevealSection>
                  <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                    <Shield className="w-4 h-4" /> Waarom EXTRA
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Wat BHG Group van EXTRA mag verwachten
                  </h2>
                  <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-2xl">
                    Hotelgroepen hebben andere eisen dan losse locaties. EXTRA begrijpt dat en bouwt de samenwerking daar specifiek omheen.
                  </p>
                </RevealSection>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {[
                    { emoji: "🛡️", title: "Structureel minder no-shows", desc: "Ons beloningssysteem beloont punctualiteit en betrouwbaarheid. Aantoonbaar minder uitval, ook bij last-minute diensten." },
                    { emoji: "🏨", title: "Vaste gezichten per hotel", desc: "Via favorietenpoules per BHG-locatie bouwt u een vaste kern op van mensen die uw procedures en standaarden kennen." },
                    { emoji: "📊", title: "Inzicht per locatie", desc: "Na elke dienst: scores, feedback en prestatierapportages per medewerker per hotel. Geen buikgevoel, maar data." },
                    { emoji: "⚡", title: "Snel opschalen bij drukte", desc: "Seizoenspiek, groot event of onverwachte uitval? EXTRA levert geselecteerd personeel, ook op korte termijn." },
                    { emoji: "🤝", title: "Één aanspreekpunt voor alle locaties", desc: "Een dedicated contactpersoon die alle BHG-hotels kent en proactief meedenkt over uw operatie." },
                    { emoji: "📋", title: "Volledig in loondienst en NEN-gecertificeerd", desc: "Geen zzp-risico. Alles conform arbeidswetgeving. NEN 4400-1 gecertificeerd." },
                  ].map((item, i) => (
                    <RevealSection key={i} delay={i * 70}>
                      <div className="group bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-7 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm">
                        <div className="text-3xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">{item.emoji}</div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </RevealSection>
                  ))}
                </div>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 3 — FUNCTIES (= HotelPersoneelGezocht §2)   */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 3 && (
          <SlideWrap key="s3">
            <div className="relative min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
              <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-6">
                <RevealSection>
                  <div className="text-center mb-6">
                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-widest mb-3 bg-purple-100/60 px-4 py-1.5 rounded-full">
                      <Users className="w-3.5 h-3.5" /> Functies voor hotels
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Voor elke hotelfunctie de juiste mensen
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-2xl mx-auto">
                      EXTRA levert ervaren hotelpersoneel voor iedere rol binnen BHG Group, bij dagelijkse bezetting en bij piekdrukte.
                    </p>
                  </div>
                </RevealSection>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { icon: BedDouble, title: "Housekeeping", desc: "Kamermeisjes en room attendants die werken volgens uw kwaliteitsstandaarden.", tags: ["AD", "Turndown", "Welness", "Houseman", "Room attendant"], color: "from-purple-600 to-purple-800" },
                    { icon: Building2, title: "Front Office", desc: "Representatieve medewerkers voor receptie en guestrelations.", tags: ["Receptie", "Check-in", "Guestrelations"], color: "from-blue-500 to-indigo-600" },
                    { icon: Utensils, title: "F&B Medewerkers", desc: "Voor hotelrestaurants, ontbijtservice, roomservice en banqueting.", tags: ["Bediening", "Ontbijtmedewerker", "Runner"], color: "from-indigo-500 to-purple-600" },
                    { icon: GlassWater, title: "Banqueting", desc: "Professionele bediening voor conferenties, gala-diners en events.", tags: ["Conferenties", "Gala-diners", "Events"], color: "from-pink-500 to-purple-600" },
                    { icon: ChefHat, title: "Chefs en Keukenpersoneel", desc: "Chefs, sous-chefs en koks voor à la carte, banqueting en ontbijt.", tags: ["Chef de partie", "Sous-chef", "Commis"], color: "from-orange-500 to-pink-600" },
                    { icon: CookingPot, title: "Keukenondersteuning", desc: "Afwassers en keukenhulpen die zorgen dat de keuken blijft draaien.", tags: ["Afwasser", "Keukenhulp"], color: "from-green-500 to-emerald-600" },
                  ].map((item, i) => (
                    <RevealSection key={i} delay={i * 50}>
                      <div className="group relative bg-white rounded-xl border border-purple-100 p-4 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden">
                        <div className="absolute top-0 right-0 w-14 h-14 bg-gradient-to-bl from-purple-50 to-transparent rounded-bl-[100%] opacity-60" />
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 shadow-md`}>
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1.5">{item.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed mb-2.5">{item.desc}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, j) => (
                            <span key={j} className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </RevealSection>
                  ))}
                </div>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 4 — SELECTIEPROCES (= WerkwijzePage §5)     */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 4 && (
          <SlideWrap key="s4">
            <div className="relative min-h-screen overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
              <XPatternBg count={4} opacity={0.08} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-12 pb-10">
                <RevealSection>
                  <div className="text-center mb-8">
                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-white/70 px-4 py-2 rounded-full">
                      <ClipboardList className="w-4 h-4" /> Selectieproces
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Persoonlijke selectie van hotelpersoneel
                    </h2>
                    <p className="text-gray-600 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto">
                      Iedere medewerker bij EXTRA wordt persoonlijk beoordeeld via een digitaal intakeformulier per functie. Zo weten wij precies wie klaar is voor uw locatie.
                    </p>
                  </div>
                </RevealSection>
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  <RevealSection>
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                      {[
                        { n: 1, emoji: "⭐", label: "Topper!" },
                        { n: 2, emoji: "🏆", label: "Veel ervaring" },
                        { n: 3, emoji: "💁", label: "Verzorgd" },
                        { n: 4, emoji: "😄", label: "Enthousiast" },
                        { n: 5, emoji: "🇳🇱", label: "NL" },
                        { n: 7, emoji: "🍽️", label: "3 borden lopen" },
                      ].map(({ n, emoji, label }) => (
                        <div key={n} className="flex items-center gap-2.5 rounded-xl px-5 py-3 text-white font-semibold text-sm shadow-md"
                          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
                          <span className="opacity-60 font-bold text-xs">{n}.</span>
                          <span>{emoji}</span>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </RevealSection>
                  <RevealSection delay={150}>
                    <IpadMockup src={sollicitatieformulier} alt="Digitale intake beoordeling hotelpersoneel EXTRA" />
                  </RevealSection>
                </div>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 5 — FAVORIETENPOULE (= WerkwijzePage §7)    */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 5 && (
          <SlideWrap key="s5">
            <div className="relative min-h-screen bg-white">
              <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-12 pb-10">
                <RevealSection>
                  <div className="text-center mb-8">
                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                      <Star className="w-4 h-4" /> Favorietenpoule
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Bouw een vaste favorietenpoule op
                    </h2>
                    <p className="text-gray-600 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto">
                      Na iedere dienst kan BHG Group medewerkers beoordelen. Bevalt iemand goed? Dan wordt deze toegevoegd aan de favorietenpoule per locatie, een vaste pool van mensen die uw hotel al kennen.
                    </p>
                  </div>
                </RevealSection>
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                  <RevealSection>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {["Tijd en punctualiteit", "Vaardigheden", "Houding", "Verzorging"].map((c, i) => (
                        <div key={i} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-700">{c}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2.5">
                      {[
                        "Minder introductietijd bij terugkerende medewerkers",
                        "Hogere gastvredenheid door consistente service",
                        "Minder operationele druk op vaste managers",
                        "Per BHG-locatie een aparte poule, centraal beheerd",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-sm sm:text-base text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </RevealSection>
                  <RevealSection delay={100}>
                    <div className="relative pb-10 pr-4">
                      <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/80 border border-gray-100 bg-white">
                        <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                          <div className="ml-3 flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200 max-w-[160px]">
                            app.doehetextra.nl
                          </div>
                        </div>
                        <img src={poulesMatches} alt="Favorietenpoule matches dashboard" className="w-full h-auto object-contain" loading="lazy" decoding="async" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-[52%] rounded-xl overflow-hidden shadow-xl border border-gray-100 -rotate-1 hover:rotate-0 transition-transform duration-300 bg-white">
                        <img src={poulesButton} alt="Poules uitnodigen knop" className="w-full h-auto object-contain" loading="lazy" decoding="async" />
                      </div>
                    </div>
                  </RevealSection>
                </div>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 6 — DATA & TECHNOLOGIE (= WerkwijzePage §6) */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 6 && (
          <SlideWrap key="s6">
            <div className="relative min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
              <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-14">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                  <RevealSection className="order-2 lg:order-1">
                    <div className="relative">
                      <BrowserMockup src={dashboardKandidaten} alt="Dashboard met beoordelingen hotelpersoneel EXTRA" />
                      <div className="absolute -bottom-5 -right-3 w-[60%] rounded-2xl overflow-hidden shadow-2xl border border-white/80 ring-1 ring-purple-100/60 rotate-1 hover:rotate-0 transition-transform duration-300">
                        <img src={scoreSnippet} alt="Scores kandidaat" className="w-full h-auto object-contain" loading="lazy" decoding="async" />
                      </div>
                    </div>
                  </RevealSection>
                  <RevealSection className="order-1 lg:order-2">
                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                      <BarChart2 className="w-4 h-4" /> Data en technologie
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Slimme selectie met data
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-7 text-base sm:text-lg">
                      Geen buikgevoel, maar data. Alle sollicitaties worden opgeslagen in ons systeem. Per kandidaat zien wij scores op softskills, bediening, bar en diner, zodat wij precies de juiste match kunnen maken voor uw hotel.
                    </p>
                    <div className="space-y-4">
                      {[
                        "Waar iemand ervaring heeft opgedaan",
                        "Hoe iemand beoordeeld is door opdrachtgevers",
                        "Welke locatie en functie het beste past",
                        "Periodieke kwaliteitsrapportage per BHG-locatie",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-purple-600" />
                          </div>
                          <span className="text-sm sm:text-base text-gray-600 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </RevealSection>
                </div>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 7 — EXTRAATJE (= PersoneelGezocht §7 phone) */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 7 && (
          <SlideWrap key="s7">
            <div className="relative min-h-screen overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
              <XPatternBg count={4} opacity={0.10} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-12 pb-10">
                <RevealSection>
                  <div className="text-center mb-8">
                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-white/70 px-4 py-2 rounded-full">
                      <Gift className="w-4 h-4" /> EXTRAATje beloningssysteem
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Betere motivatie ={" "}
                      <span className="relative inline-block">
                        <span className="relative z-10">beter hotelpersoneel</span>
                        <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                      </span>
                    </h2>
                  </div>
                </RevealSection>

                <RevealSection delay={100}>
                  <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14 max-w-5xl mx-auto">
                    <div className="relative flex-shrink-0 order-2 lg:order-1">
                      <div className="relative w-[180px] sm:w-[220px]">
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-500/20 border-[5px] border-gray-700 bg-gray-900">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[16px] bg-gray-900 rounded-b-xl z-20" />
                          <div className="relative">
                            {appScreens.map((screen, i) => (
                              <img key={screen.key} src={screen.img} alt={screen.label}
                                className={`w-full transition-opacity duration-500 ${activeScreen === i ? "opacity-100 relative" : "opacity-0 absolute inset-0"}`} />
                            ))}
                          </div>
                        </div>
                        <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-[3rem] blur-3xl -z-10" />
                      </div>
                      <div className="flex gap-2 mt-3 justify-center">
                        {appScreens.map((_, i) => (
                          <button key={i} onClick={(e) => { e.stopPropagation(); setActiveScreen(i); }}
                            className={`h-2 rounded-full transition-all duration-300 ${activeScreen === i ? "bg-purple-500 w-8" : "bg-purple-200 w-2 hover:bg-purple-300"}`} />
                        ))}
                      </div>
                    </div>
                    <div className="order-1 lg:order-2 flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                        {[
                          { step: "1", title: "Medewerker verdient punten", desc: "Elke shift levert punten op. Goed presteren betekent extra punten en hogere status.", icon: "🏃" },
                          { step: "2", title: "Status stijgt van Bronze naar Diamond", desc: "Hogere status betekent betere beloningen, meer betrokkenheid en meer motivatie.", icon: "💎" },
                          { step: "3", title: "Medewerker wil terugkomen", desc: "Punten opbouwen op uw locatie is een concrete reden om te blijven. Minder wisselende gezichten.", icon: "🎁" },
                        ].map((item, i) => (
                          <div key={i} className="bg-white rounded-2xl border border-purple-100 p-4 sm:p-5 flex items-start gap-4 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300">
                            <div className="text-3xl flex-shrink-0">{item.icon}</div>
                            <div>
                              <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Stap {item.step}</div>
                              <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1">{item.title}</h4>
                              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </RevealSection>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 8 — REVIEWS                                  */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 8 && (
          <SlideWrap key="s8">
            <div className="relative min-h-screen" style={{ backgroundColor: "#fdf9f3" }}>
              <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-12 pb-10">
                <RevealSection>
                  <div className="text-center mb-8">
                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                      <Heart className="w-4 h-4" /> Referenties
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Wat zij over EXTRA zeggen
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                      </div>
                      <span className="text-sm font-bold text-gray-900">4,8</span>
                      <span className="text-sm text-gray-500">gemiddeld uit 232 Google reviews</span>
                    </div>
                  </div>
                </RevealSection>
                <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
                  {[
                    {
                      shortQuote: "EXTRA heeft professionaliteit, betrouwbaarheid en een sterke toewijding aan kwaliteit getoond. De kamermeisjes hebben onze verwachtingen consequent waargemaakt en overtroffen.",
                      fullQuote: "Wij werken samen met EXTRA sinds eind oktober 2025 voor de levering van kamermeisjes, AD medewerkers, turndown en minibarmedewerkers aan Grand Hotel Amrâth Amsterdam. EXTRA heeft professionaliteit, betrouwbaarheid en een sterke toewijding aan kwaliteit getoond. De kamermeisjes hebben onze verwachtingen consequent waargemaakt en overtroffen, en zorgen dat onze hotelkamers aan de hoogste normen van netheid en gasttevredenheid voldoen. De communicatie is efficiënt en responsief, waardoor de samenwerking soepel verloopt. Wij aarzelen niet om EXTRA aan te bevelen bij ieder bedrijf dat op zoek is naar betrouwbare personeelsoplossingen.",
                      name: "D. Koops",
                      role: "Hotelmanager",
                      hotel: "Grand Hotel Amrâth Amsterdam",
                      logo: logoAmrath,
                    },
                    {
                      shortQuote: "Extra has consistently supplied skilled and reliable personnel for our kitchen and stewarding departments. Their culinary and operational skills have greatly supported our daily operations.",
                      fullQuote: "Extra has consistently supplied skilled and reliable personnel for our kitchen and stewarding departments. The team members provided by Extra have demonstrated excellent professionalism, strong work ethic, and the ability to adapt to the fast-paced environment of our hotel. Their culinary and operational skills have greatly supported our daily operations, and they have consistently met and exceeded our expectations. I confidently endorse Extra and their staff for any hotel or hospitality establishment seeking dedicated and competent personnel.",
                      name: "G. Di Domenico",
                      role: "Headchef",
                      hotel: "Amsterdam Marriott Hotel",
                      logo: logoMarriott,
                    },
                    {
                      shortQuote: "Het proces rondom het uitzetten van diensten verloopt soepel en de kwaliteit van de medewerkers die jullie sturen is goed.",
                      fullQuote: "Het proces rondom het uitzetten van diensten verloopt soepel en de kwaliteit van de medewerkers die jullie sturen is goed. Negen van de tien kandidaten die jullie hebben gestuurd, hebben uitstekend gewerkt. Één kandidaat was wat minder passend, maar daar hebben jullie direct actie op ondernomen, wat we erg waarderen.",
                      name: "A. Schoenmaker",
                      role: "HR-manager",
                      hotel: "Radisson Blu Hotel Amsterdam Airport",
                      logo: null,
                    },
                  ].map((review, i) => {
                    const isExpanded = expandedReview === i;
                    return (
                      <RevealSection key={i} delay={i * 80}>
                        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:border-purple-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
                            </div>
                            {review.logo && (
                              <img src={review.logo} alt={review.hotel} className="h-6 w-auto object-contain opacity-60" />
                            )}
                          </div>
                          <p className="text-gray-600 italic text-xs sm:text-sm leading-relaxed flex-1 mb-3">
                            "{isExpanded ? review.fullQuote : review.shortQuote}"
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedReview(isExpanded ? null : i); }}
                            className="text-purple-600 font-bold text-xs hover:text-purple-800 transition-colors mb-4 text-left">
                            {isExpanded ? "Lees minder" : "Lees meer"}
                          </button>
                          <div className="border-t border-gray-100 pt-3 mt-auto">
                            <div className="flex gap-0.5 mb-1">
                              {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 text-yellow-400 fill-yellow-400" />)}
                            </div>
                            <p className="font-bold text-gray-900 text-xs sm:text-sm">{review.name}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{review.role}</p>
                            <p className="text-purple-600 text-xs font-semibold mt-0.5">{review.hotel}</p>
                          </div>
                        </div>
                      </RevealSection>
                    );
                  })}
                </div>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 9 — SAMENWERKING                             */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 9 && (
          <SlideWrap key="s9">
            <div className="relative min-h-screen bg-white">
              <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-14">
                <RevealSection>
                  <div className="text-center mb-10 sm:mb-14">
                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                      <Handshake className="w-4 h-4" /> Samenwerking
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Zo ziet de samenwerking met BHG Group eruit
                    </h2>
                    <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-xl mx-auto">
                      Concrete stappen, geen vaag traject. Van eerste afstemming tot vaste operationele partner.
                    </p>
                  </div>
                </RevealSection>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                  {[
                    { step: "01", icon: Users, title: "Intake en afstemming", desc: "We stellen per locatie vast welke functies, standaarden en capaciteit nodig zijn. Inclusief jaarplanning en piekmomenten.", color: "from-purple-500 to-purple-700" },
                    { step: "02", icon: UserCheck, title: "Eerste plaatsingen", desc: "Gerichte proefplaatsingen met medewerkers die geselecteerd zijn op prestaties bij vergelijkbare hotels.", color: "from-indigo-500 to-purple-600" },
                    { step: "03", icon: Layers, title: "Opbouw favorietenpoule", desc: "Samen bepalen we wie structureel ingepland wordt. Die medewerkers vormen de vaste kern per BHG-hotel.", color: "from-blue-500 to-indigo-600" },
                    { step: "04", icon: TrendingUp, title: "Continue sturing en rapportage", desc: "Maandelijkse inzichten in kwaliteitsscores, bezettingsgraad en trends. Één aanspreekpunt, proactief contact.", color: "from-emerald-500 to-teal-600" },
                  ].map((item, i) => (
                    <RevealSection key={i} delay={i * 80}>
                      <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 sm:p-7 border border-purple-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm relative">
                        <div className="absolute top-4 right-4 text-2xl font-black text-purple-100">{item.step}</div>
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg`}>
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-base mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </RevealSection>
                  ))}
                </div>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 10 — CONTACT                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 10 && (
          <SlideWrap key="s10">
            <div className="relative min-h-screen overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
              <XPatternBg count={4} opacity={0.10} color="rgba(168,85,247,0.6)" />
              <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-10 text-center pt-12 pb-16">
                <motion.img src={extraLogoWit} alt="EXTRA" className="h-9 sm:h-11 mx-auto mb-8"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} />
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-widest mb-7">
                  <Building2 className="w-4 h-4" /> BHG Group × EXTRA
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight max-w-3xl"
                  style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Klaar voor de{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-200">volgende stap?</span>
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="text-base sm:text-lg text-purple-200/70 leading-relaxed mb-9 max-w-2xl">
                  Neem contact op met ons team. We denken graag mee over hoe EXTRA structurele rust brengt in de operatie van BHG Group, per locatie en op maat.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
                  <a href="tel:0851305915" onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2.5 bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 transition-all"
                    style={{ boxShadow: "0 0 30px rgba(168,85,247,0.25), 0 8px 32px rgba(0,0,0,0.2)" }}>
                    <Phone className="w-4 h-4" />
                    085 130 59 15
                  </a>
                  <a href="mailto:max@doehetextra.nl" onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2.5 border-2 border-white/25 text-white font-bold px-8 py-4 rounded-full text-base hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                    <Mail className="w-4 h-4" />
                    max@doehetextra.nl
                  </a>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                  className="flex flex-wrap justify-center gap-7 sm:gap-12">
                  {[
                    { icon: Shield, text: "NEN 4400-1 gecertificeerd" },
                    { icon: Users, text: "Iedereen in loondienst" },
                    { icon: Clock, text: "Binnen 48 uur beschikbaar" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/40">
                      <item.icon className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium">{item.text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </SlideWrap>
        )}

      </AnimatePresence>
    </div>
  );
}
