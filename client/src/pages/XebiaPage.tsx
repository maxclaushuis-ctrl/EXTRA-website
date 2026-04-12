import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Users, Shield, Clock, Star,
  CheckCircle2, UserCheck, Phone, Mail,
  Heart, ClipboardList, MapPin, Coffee, Utensils,
  MessageSquare, Zap, Award, Building2
} from "lucide-react";

import extraLogoWit from "../assets/pitch/extra-logo-wit.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import heroBgImage from "@assets/hero-background.webp";

import sollicitatieformulier from "@assets/Sollicitatieformulier_1772893764120.webp";
import poulesMatches from "@assets/Scherm\u00adafbeelding_2026-03-12_om_10.22.20_1773311761908.png";
import poulesButton from "@assets/Scherm\u00adafbeelding_2026-03-12_om_11.36.42_1773311845901.png";
import scoreSnippet from "@assets/Scherm\u00adafbeelding_2026-03-12_om_11.31.00_1773311517193.png";

import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";

const TOTAL_SLIDES = 8;

const slideVariants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
};

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

export default function XebiaPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setCurrentSlide((p) => Math.min(p + 1, TOTAL_SLIDES - 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setCurrentSlide((p) => Math.max(p - 1, 0)); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const next = () => setCurrentSlide((p) => Math.min(p + 1, TOTAL_SLIDES - 1));
  const prev = () => setCurrentSlide((p) => Math.max(p - 1, 0));

  return (
    <div className="h-screen w-screen overflow-hidden relative select-none" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Progress dots */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-purple-600 w-6" : "bg-gray-300 hover:bg-gray-400 w-1.5"}`} />
        ))}
      </div>

      {/* Nav arrows */}
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

      {/* Slide counter */}
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
                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(26,10,46,0.97) 0%, rgba(26,10,46,0.92) 50%, rgba(26,10,46,0.55) 100%)" }} />
              </div>
              <XPatternBg count={3} opacity={0.07} color="rgba(168,85,247,0.7)" />

              <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full pt-16 pb-8">
                <div className="max-w-2xl">
                  <motion.img src={extraLogoWit} alt="EXTRA" className="h-8 sm:h-10 mb-7"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} />
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white text-xs sm:text-sm font-semibold">Persoonlijke brochure voor Xebia</span>
                  </motion.div>
                  <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-5"
                    style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Vertrouwde gezichten,{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-200">elke dienst weer</span>
                  </motion.h1>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                    className="text-base sm:text-lg text-purple-100/80 leading-relaxed mb-8 max-w-xl">
                    EXTRA levert een kleine, vaste poule van geselecteerde cateringmedewerkers die passen bij de sfeer en werkwijze van Xebia, op meerdere locaties tegelijk.
                  </motion.p>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    className="flex flex-wrap gap-6">
                    {[
                      { icon: Users, text: "Vaste poule van ~3 medewerkers" },
                      { icon: Shield, text: "HACCP-ervaren & senior profiel" },
                      { icon: Clock, text: "Altijd bereikbaar, snel geschakeld" },
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

              {/* Reference logos strip */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
                className="relative z-10 w-full py-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
                <p className="text-center text-white/30 text-xs mb-3 font-medium uppercase tracking-widest">Vergelijkbare samenwerkingen</p>
                <div className="flex items-center justify-center gap-10 sm:gap-16 px-8">
                  {[
                    { src: logoAppel, alt: "Appel Catering" },
                    { src: logoFunda, alt: "Funda" },
                    { src: logoSelectCatering, alt: "Select Catering" },
                    { src: logoMarriott, alt: "Marriott" },
                  ].map((logo) => (
                    <img key={logo.alt} src={logo.src} alt={logo.alt}
                      className="h-7 sm:h-9 w-auto object-contain opacity-40" loading="lazy" />
                  ))}
                </div>
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="relative z-10 text-center text-xs text-white/25 py-2">
                Klik of gebruik pijltjestoetsen om te navigeren
              </motion.p>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 1 — DE UITDAGING                             */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 1 && (
          <SlideWrap key="s1">
            <div className="relative min-h-screen bg-white">
              <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-14">
                <RevealSection>
                  <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                    <Building2 className="w-4 h-4" /> De situatie bij Xebia
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Flexibele ondersteuning op meerdere locaties
                  </h2>
                  <p className="text-base sm:text-lg text-gray-500 mb-10 max-w-2xl">
                    Zoals besproken zoekt Xebia iemand die zelfstandig de lunch kan voorbereiden, aansluit bij de teamsfeer, en ook meetings en interne events kan ondersteunen. Dat vraagt om een specifiek profiel, en continuiteit.
                  </p>
                </RevealSection>

                <div className="grid sm:grid-cols-3 gap-5 mb-10">
                  {[
                    {
                      icon: Coffee,
                      color: "bg-amber-50 border-amber-100",
                      iconColor: "text-amber-600 bg-amber-100",
                      title: "Lunches & do-it-yourself",
                      desc: "Zelfstandig de lunch voorbereiden volgens het DIT-principe, passend in de werkwijze van Xebia.",
                    },
                    {
                      icon: Users,
                      color: "bg-purple-50 border-purple-100",
                      iconColor: "text-purple-600 bg-purple-100",
                      title: "Meetings & borrels",
                      desc: "Ondersteuning bij vergaderingen, interne events en borrels op de Oostenburg-locatie.",
                    },
                    {
                      icon: MapPin,
                      color: "bg-blue-50 border-blue-100",
                      iconColor: "text-blue-600 bg-blue-100",
                      title: "Meerdere locaties",
                      desc: "Amsterdam Oostenburg, Hilversum en Eindhoven. Combinatie van locaties goed te realiseren.",
                    },
                  ].map((item, i) => (
                    <RevealSection key={i} delay={i * 80}>
                      <div className={`rounded-2xl p-6 border ${item.color} h-full`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.iconColor}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-base mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </RevealSection>
                  ))}
                </div>

                <RevealSection delay={300}>
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 sm:p-8 text-white">
                    <h3 className="font-bold text-lg mb-2">Ons voorstel</h3>
                    <p className="text-purple-100 text-sm leading-relaxed max-w-3xl">
                      We starten met een kleine, vaste poule van circa 3 medewerkers. Zo houd je flexibiliteit, maar wel met vertrouwde gezichten die de werkwijze van Xebia kennen. We selecteren specifiek op senioriteit en HACCP-kennis.
                    </p>
                  </div>
                </RevealSection>
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
              <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-14">
                <RevealSection>
                  <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                    <Shield className="w-4 h-4" /> Waarom EXTRA
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Wat Xebia van ons mag verwachten
                  </h2>
                  <p className="text-base text-gray-500 mb-8 max-w-2xl">
                    We zijn geen doorgeefluik. We zijn een partner die meedenkt, snel schakelt en altijd bereikbaar is.
                  </p>
                </RevealSection>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {[
                    {
                      emoji: "📞",
                      title: "Altijd bereikbaar",
                      desc: "Direct contact met je vaste accountmanager. Geen callcenters of ticketsystemen. Bel, app of mail — we reageren snel.",
                    },
                    {
                      emoji: "🔄",
                      title: "Vertrouwde gezichten",
                      desc: "Via een vaste favorietenpoule stuur je telkens dezelfde mensen in. Ze kennen jullie keuken, je werkwijze en de sfeer.",
                    },
                    {
                      emoji: "⚡",
                      title: "Snel schakelen",
                      desc: "Last-minute uitval? We lossen het op. Ons netwerk en systeem zijn erop gebouwd om ook op korte termijn te leveren.",
                    },
                    {
                      emoji: "🎯",
                      title: "Persoonlijke selectie",
                      desc: "We selecteren op basis van jouw wensen. Senioriteitsniveau, HACCP-kennis, teamfit en zelfstandigheid staan centraal.",
                    },
                    {
                      emoji: "📋",
                      title: "Volledig in loondienst",
                      desc: "Geen zzp-risico. Al onze medewerkers zijn in loondienst en werken conform de arbeidswetgeving. NEN 4400-1 gecertificeerd.",
                    },
                    {
                      emoji: "🤝",
                      title: "Proactief meedenken",
                      desc: "Xebia groeit. We denken mee over Eindhoven, piekperiodes en de juiste mix van medewerkers per locatie.",
                    },
                  ].map((item, i) => (
                    <RevealSection key={i} delay={i * 70}>
                      <div className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm">
                        <div className="text-3xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">{item.emoji}</div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
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
        {/* SLIDE 3 — FAVORIETENPOULE                         */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 3 && (
          <SlideWrap key="s3">
            <div className="relative min-h-screen bg-white">
              <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-14">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                  <div>
                    <RevealSection>
                      <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                        <Heart className="w-4 h-4" /> Favorietenpoule
                      </span>
                      <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        Jouw vaste team, op aanvraag beschikbaar
                      </h2>
                      <p className="text-base text-gray-600 leading-relaxed mb-6">
                        We bouwen samen een kleine, vaste poule van circa 3 medewerkers die specifiek voor Xebia geselecteerd zijn. Deze mensen leer je kennen. Ze kennen jouw werkwijze. Geen roulette bij elke dienst.
                      </p>
                    </RevealSection>

                    <div className="space-y-4">
                      {[
                        {
                          icon: Star,
                          title: "Jij bepaalt wie terugkomt",
                          desc: "Na elke dienst geef je feedback. Wie goed presteert, komt terug. Wie niet aansluit, verlaat de poule.",
                        },
                        {
                          icon: Users,
                          title: "Gezichten die de sfeer kennen",
                          desc: "Medewerkers in jouw poule weten hoe Xebia werkt: de lunch, de borrels, het team en de verwachtingen.",
                        },
                        {
                          icon: Zap,
                          title: "Flexibel inzetbaar",
                          desc: "Vanuit de poule kan dezelfde medewerker op meerdere locaties ingezet worden. Amsterdam en Hilversum combineren is geen probleem.",
                        },
                      ].map((item, i) => (
                        <RevealSection key={i} delay={i * 100}>
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <item.icon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h4>
                              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        </RevealSection>
                      ))}
                    </div>
                  </div>

                  <RevealSection delay={200} className="hidden lg:block">
                    <div className="relative">
                      <div className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/15 border border-gray-200">
                        <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                          </div>
                          <div className="flex-1 bg-white rounded-lg px-3 py-1.5 flex items-center gap-2">
                            <Shield className="w-3 h-3 text-green-500 shrink-0" />
                            <span className="text-xs text-gray-500 font-medium">Favorietenpoule — Xebia</span>
                          </div>
                        </div>
                        <img src={poulesMatches} alt="Favorietenpoule dashboard" className="w-full object-cover object-top" loading="lazy" />
                      </div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-6 rounded-full blur-xl bg-purple-400/20" />
                    </div>
                  </RevealSection>
                </div>

                {/* Poule visual */}
                <RevealSection delay={300} className="mt-10">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6 sm:p-8">
                    <p className="text-xs uppercase tracking-widest text-purple-500 font-bold mb-4">Jouw poule voor Xebia — circa 3 personen</p>
                    <div className="flex flex-wrap gap-4">
                      {["Cateringmedewerker A", "Cateringmedewerker B", "Cateringmedewerker C"].map((name, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-purple-100 shadow-sm">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {String.fromCharCode(65 + i)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{name}</p>
                            <p className="text-xs text-gray-400">HACCP gecertificeerd</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-xs text-gray-500 font-medium">4.{8 + i}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealSection>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 4 — PERSOONLIJKE SELECTIE                    */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 4 && (
          <SlideWrap key="s4">
            <div className="relative min-h-screen" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #170926 50%, #12071f 100%)" }}>
              <XPatternBg count={4} opacity={0.08} color="rgba(168,85,247,0.8)" />
              <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-14">
                <RevealSection>
                  <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                    <ClipboardList className="w-4 h-4" /> Persoonlijke selectie
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-white mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Wij selecteren, jij kiest wie terugkomt
                  </h2>
                  <p className="text-base text-purple-200/70 mb-10 max-w-2xl">
                    Elke medewerker in jouw poule is vooraf gescreend op de criteria die voor Xebia tellen. Geen verassingen, wel continuiteit.
                  </p>
                </RevealSection>

                <div className="grid sm:grid-cols-2 gap-5 mb-10">
                  {[
                    {
                      step: "01",
                      title: "Intake & profiel",
                      desc: "We beginnen met een gesprek over wat jullie nodig hebben: werktijden, locaties, de do-it-yourself aanpak, HACCP-eis en teamsfeer.",
                    },
                    {
                      step: "02",
                      title: "Selectie op maat",
                      desc: "We zoeken kandidaten met aantoonbare catering-ervaring, HACCP-kennis en de zelfstandigheid die past bij Xebia's werkwijze.",
                    },
                    {
                      step: "03",
                      title: "Eerste diensten & feedback",
                      desc: "Na elke dienst verzamelen we feedback. Zo bouwen we snel een poule van mensen die echt aansluiten.",
                    },
                    {
                      step: "04",
                      title: "Vaste poule & opbouw",
                      desc: "Binnen enkele weken heb je een vaste kern van vertrouwde medewerkers. De poule groeit mee als de vraag dat vraagt.",
                    },
                  ].map((item, i) => (
                    <RevealSection key={i} delay={i * 80}>
                      <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-400/40 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-300 font-black text-xs">{item.step}</span>
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                            <p className="text-purple-200/70 text-sm leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      </div>
                    </RevealSection>
                  ))}
                </div>

                <RevealSection delay={350}>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { label: "HACCP gecertificeerd", icon: Shield },
                      { label: "Aantoonbare catering-ervaring", icon: Utensils },
                      { label: "Zelfstandig & senioor", icon: Award },
                    ].map((tag, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/6 border border-white/10 rounded-xl px-4 py-3">
                        <tag.icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-white/80 text-sm font-medium">{tag.label}</span>
                      </div>
                    ))}
                  </div>
                </RevealSection>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 5 — LOCATIES                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 5 && (
          <SlideWrap key="s5">
            <div className="relative min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
              <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-14">
                <RevealSection>
                  <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                    <MapPin className="w-4 h-4" /> Locaties
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Alle locaties in ons bereik
                  </h2>
                  <p className="text-base text-gray-500 mb-10 max-w-2xl">
                    De combinatie Amsterdam en Hilversum is goed te realiseren. Voor Eindhoven werven we gericht, afhankelijk van de frequentie.
                  </p>
                </RevealSection>

                <div className="grid sm:grid-cols-3 gap-5 mb-10">
                  {[
                    {
                      city: "Amsterdam",
                      area: "Oostenburg",
                      status: "Primair",
                      statusColor: "bg-green-100 text-green-700",
                      desc: "Hoofdlocatie. Lunch + DIT-principe, ondersteuning bij meetings, vergaderingen en interne events en borrels.",
                      icon: Coffee,
                      iconBg: "bg-purple-100",
                      iconColor: "text-purple-600",
                    },
                    {
                      city: "Hilversum",
                      area: "",
                      status: "Combineerbaar",
                      statusColor: "bg-blue-100 text-blue-700",
                      desc: "Goed combineerbaar met Amsterdam. Dezelfde medewerkers uit de poule kunnen op beide locaties ingezet worden.",
                      icon: Users,
                      iconBg: "bg-blue-100",
                      iconColor: "text-blue-600",
                    },
                    {
                      city: "Eindhoven",
                      area: "",
                      status: "In overleg",
                      statusColor: "bg-amber-100 text-amber-700",
                      desc: "Voor Eindhoven werven we gericht. Afhankelijk van de regelmaat schakelen we lokale partners in of bouwen we een eigen poule.",
                      icon: Building2,
                      iconBg: "bg-amber-100",
                      iconColor: "text-amber-600",
                    },
                  ].map((loc, i) => (
                    <RevealSection key={i} delay={i * 100}>
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full hover:border-purple-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${loc.iconBg}`}>
                            <loc.icon className={`w-5 h-5 ${loc.iconColor}`} />
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${loc.statusColor}`}>{loc.status}</span>
                        </div>
                        <h3 className="font-black text-gray-900 text-xl mb-0.5">{loc.city}</h3>
                        {loc.area && <p className="text-purple-600 text-sm font-semibold mb-3">{loc.area}</p>}
                        <p className="text-sm text-gray-500 leading-relaxed mt-2">{loc.desc}</p>
                      </div>
                    </RevealSection>
                  ))}
                </div>

                <RevealSection delay={350}>
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Flexibel opschalen</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">Groeit de behoefte op een locatie? We schalen de poule mee. Piekperiodes, events of een nieuwe locatie — we denken proactief mee.</p>
                    </div>
                  </div>
                </RevealSection>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 6 — VERGELIJKBARE SAMENWERKINGEN            */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 6 && (
          <SlideWrap key="s6">
            <div className="relative min-h-screen bg-white">
              <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />
              <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-14">
                <RevealSection>
                  <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                    <UserCheck className="w-4 h-4" /> In goed gezelschap
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Vergelijkbare constructies die al werken
                  </h2>
                  <p className="text-base text-gray-500 mb-10 max-w-2xl">
                    De poule-aanpak die we voor Xebia voorstellen, doen we ook voor partijen als Appel Catering en Funda. Continuiteit en teamfit staan ook daar centraal.
                  </p>
                </RevealSection>

                <div className="grid sm:grid-cols-2 gap-6 mb-10">
                  {[
                    {
                      name: "Appel Catering",
                      logo: logoAppel,
                      type: "Cateringbedrijf",
                      desc: "Vaste poule van cateringmedewerkers, flexibel inzetbaar op meerdere cateringlocaties. Continuiteit en teamkennis staan centraal.",
                      tags: ["Vaste poule", "Catering", "Meerdere locaties"],
                    },
                    {
                      name: "Funda",
                      logo: logoFunda,
                      type: "Techbedrijf",
                      desc: "Vergelijkbare situatie: een techbedrijf met kantoorlocatie dat vertrouwde horecaondersteuning zoekt voor lunch en interne events.",
                      tags: ["Kantooromgeving", "Events", "Vaste gezichten"],
                    },
                  ].map((ref, i) => (
                    <RevealSection key={i} delay={i * 100}>
                      <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-6 sm:p-8 h-full">
                        <div className="flex items-center gap-4 mb-4">
                          <img src={ref.logo} alt={ref.name} className="h-10 w-auto object-contain" loading="lazy" />
                          <div>
                            <h3 className="font-bold text-gray-900">{ref.name}</h3>
                            <p className="text-xs text-purple-600 font-medium">{ref.type}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">{ref.desc}</p>
                        <div className="flex flex-wrap gap-2">
                          {ref.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-purple-100 text-purple-700 font-semibold px-2.5 py-1 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </RevealSection>
                  ))}
                </div>

                <RevealSection delay={250}>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex items-center gap-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">NEN 4400-1 gecertificeerd.</strong> Alle medewerkers in loondienst, conform arbeidswetgeving. Geen zzp-risico, geen onverwachte verplichtingen voor Xebia.
                    </p>
                  </div>
                </RevealSection>
              </div>
            </div>
          </SlideWrap>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 7 — VOLGENDE STAP                            */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 7 && (
          <SlideWrap key="s7">
            <div className="relative min-h-screen flex items-center" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #170926 50%, #12071f 100%)" }}>
              <XPatternBg count={4} opacity={0.09} color="rgba(168,85,247,0.8)" />
              <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 py-14 w-full">
                <RevealSection>
                  <motion.img src={extraLogoWit} alt="EXTRA" className="h-8 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
                  <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Klaar om te starten?
                  </h2>
                  <p className="text-base sm:text-lg text-purple-200/80 mb-10 max-w-xl leading-relaxed">
                    We kunnen snel schakelen. Na een korte afstemming stellen we een eerste voorstel op van passende kandidaten voor de poule.
                  </p>
                </RevealSection>

                <div className="grid sm:grid-cols-2 gap-4 mb-10">
                  {[
                    { step: "1", title: "Korte afstemming", desc: "We stemmen de exacte wensen en frequentie af per locatie." },
                    { step: "2", title: "Eerste kandidatenvoorstel", desc: "Binnen enkele dagen stellen we een selectie voor van geschikte kandidaten." },
                    { step: "3", title: "Eerste diensten draaien", desc: "De gekozen medewerkers gaan aan de slag. Feedback sturen we snel terug." },
                    { step: "4", title: "Vaste poule opgebouwd", desc: "Binnen enkele weken heb je een vaste kern die de werkwijze van Xebia kent." },
                  ].map((item, i) => (
                    <RevealSection key={i} delay={i * 80}>
                      <div className="flex gap-4 bg-white/6 border border-white/10 rounded-2xl p-5">
                        <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                          <p className="text-purple-200/60 text-xs leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </RevealSection>
                  ))}
                </div>

                <RevealSection delay={350}>
                  <div className="flex flex-wrap gap-4">
                    <a href="tel:+31202440888"
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/40">
                      <Phone className="w-4 h-4" />
                      Bel ons
                    </a>
                    <a href="mailto:max@doehetextra.nl"
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-200">
                      <Mail className="w-4 h-4" />
                      max@doehetextra.nl
                    </a>
                    <a href="https://wa.me/31202440888" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 font-bold px-6 py-3.5 rounded-xl transition-all duration-200">
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </div>
                </RevealSection>
              </div>
            </div>
          </SlideWrap>
        )}

      </AnimatePresence>
    </div>
  );
}
