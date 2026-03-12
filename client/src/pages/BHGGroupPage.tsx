import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Users, Shield, Clock, Star,
  CheckCircle2, UserCheck, Gift, TrendingUp, Target, Trophy,
  BarChart3, Zap, Building2, BedDouble, Utensils, ChefHat,
  GlassWater, CalendarCheck, Layers, Handshake, Phone, Mail,
  Check, Bell, ArrowRight, Heart
} from "lucide-react";

import extraLogoWit from "../assets/pitch/extra-logo-wit.png";
import extraXShape from "../assets/pitch/extra-x-shape.png";

import adminGebruikers from "../assets/pitch/admin-gebruikers.png";
import beoordelingenStatistieken from "../assets/pitch/beoordelingen-statistieken.png";
import extraatjeApp from "../assets/pitch/extraatje-app.png";
import extraatjeChallenges from "../assets/pitch/extraatje-challenges.png";
import appRanking from "../assets/pitch/app-ranking.png";
import appRewards from "../assets/pitch/app-rewards.png";
import annaBakkerProfiel from "../assets/pitch/anna-bakker-profiel.png";
import ipadIntakeComplete from "../assets/pitch/ipad-intake-complete.png";
import beoordelingScreen from "../assets/pitch/beoordeling-screen.png";

import logoAmrath from "../assets/pitch/amrath-logo.png";
import logoMarriott from "../assets/pitch/marriott-logo.png";
import logoHilton from "../assets/pitch/logo-hilton.png";
import logoNH from "../assets/pitch/nh-hotels-logo.png";

const TOTAL_SLIDES = 11;

const slideVariants = {
  enter: { opacity: 0, y: 24 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
};

function Slide({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`absolute inset-0 flex flex-col ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-widest mb-5 sm:mb-7">
      {children}
    </div>
  );
}

function H1({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h1
      className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-4 sm:mb-6 ${className}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {children}
    </h1>
  );
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 sm:mb-6 ${className}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {children}
    </h2>
  );
}

function Accent({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-200">
      {children}
    </span>
  );
}

function BgGradient() {
  return <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />;
}

function BgDecos() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full opacity-10"
        style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.4) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-8"
        style={{ background: "radial-gradient(ellipse at center, rgba(168,85,247,0.3) 0%, transparent 70%)" }} />
      <img src={extraXShape} alt="" className="absolute top-8 right-8 w-16 sm:w-24 opacity-10"
        style={{ filter: "invert(1) brightness(2) sepia(1) saturate(5) hue-rotate(240deg)" }} />
      <img src={extraXShape} alt="" className="absolute bottom-8 left-8 w-12 sm:w-16 opacity-8"
        style={{ filter: "invert(1) brightness(2) sepia(1) saturate(5) hue-rotate(240deg)" }} />
    </div>
  );
}

function SlideNumber({ current, total }: { current: number; total: number }) {
  return (
    <div className="absolute bottom-6 left-6 text-xs font-bold text-white/30 z-50 select-none">
      {current + 1} / {total}
    </div>
  );
}

export default function BHGGroupPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const next = () => setCurrentSlide((p) => Math.min(p + 1, TOTAL_SLIDES - 1));
  const prev = () => setCurrentSlide((p) => Math.max(p - 1, 0));

  return (
    <div
      className="h-screen w-screen overflow-hidden relative select-none"
      onClick={next}
    >
      {/* ─── Progress dots ─── */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentSlide ? "bg-purple-400 w-6" : "bg-white/20 hover:bg-white/40 w-1.5"
            }`}
          />
        ))}
      </div>

      {/* ─── Nav arrows ─── */}
      <div className="absolute bottom-5 right-6 flex gap-2 z-50">
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          disabled={currentSlide === 0}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all ${
            currentSlide === 0
              ? "border-white/10 text-white/20 cursor-not-allowed"
              : "border-purple-500/40 bg-white/5 hover:bg-white/15 text-white"
          }`}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          disabled={currentSlide === TOTAL_SLIDES - 1}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all ${
            currentSlide === TOTAL_SLIDES - 1
              ? "border-white/10 text-white/20 cursor-not-allowed"
              : "border-purple-500/40 bg-purple-500/20 hover:bg-purple-500/40 text-white"
          }`}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <SlideNumber current={currentSlide} total={TOTAL_SLIDES} />

      <AnimatePresence mode="wait">

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 0 — HERO                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 0 && (
          <Slide key="s0" className="items-center justify-center p-8 sm:p-12 lg:p-16 text-center">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 max-w-5xl mx-auto">
              <motion.img
                src={extraLogoWit}
                alt="EXTRA"
                className="h-10 sm:h-14 mx-auto mb-8 sm:mb-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-5 py-2 text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-widest mb-7"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Persoonlijke brochure voor BHG Group
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <H1>
                  Minder uitval,{" "}
                  <Accent>meer continuïteit</Accent>
                  <br />in uw hotels
                </H1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-base sm:text-xl text-purple-200/70 max-w-2xl mx-auto leading-relaxed mb-10"
              >
                EXTRA levert geselecteerd hotelpersoneel met een bewezen systeem voor motivatie, kwaliteit en loyaliteit — speciaal gebouwd voor hotelgroepen die structurele rust willen in hun operatie.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="flex flex-wrap justify-center gap-8 sm:gap-14"
              >
                {[logoAmrath, logoMarriott, logoHilton, logoNH].map((logo, i) => (
                  <img key={i} src={logo} alt="" className="h-7 sm:h-10 w-auto object-contain opacity-50" />
                ))}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-white/25 mt-8"
              >
                Klik of gebruik ← → om door de brochure te navigeren
              </motion.p>
            </div>
          </Slide>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 1 — UITDAGINGEN                              */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 1 && (
          <Slide key="s1" className="items-center justify-center p-6 sm:p-10 lg:p-14">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 w-full max-w-6xl mx-auto">
              <Tag><Building2 className="w-3 h-3" /> Herkenbaar?</Tag>
              <H2>De uitdagingen waar hotelgroepen dagelijks mee leven</H2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { emoji: "🤒", title: "Langdurig ziekteverzuim", desc: "Uitval die de rest van het team overbelast en kwaliteit ondermijnt." },
                  { emoji: "🚫", title: "No-shows & last-minute uitval", desc: "Diensten die op het laatste moment wegvallen met operationele chaos als gevolg." },
                  { emoji: "🔍", title: "Moeite met betrouwbaar personeel", desc: "Veel tijd kwijt aan wervingsprocessen die telkens opnieuw beginnen." },
                  { emoji: "🔄", title: "Gebrek aan continuïteit", desc: "Steeds andere gezichten die telkens opnieuw ingewerkt moeten worden." },
                  { emoji: "😰", title: "Operationele druk op managers", desc: "Managers die brandblusdienst spelen in plaats van leidinggeven." },
                  { emoji: "❌", title: "Geen echte partnerrelatie", desc: "Bureaus die leveren maar niet meedenken over structurele oplossingen." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="bg-white/[0.06] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5"
                  >
                    <div className="text-2xl sm:text-3xl mb-2">{item.emoji}</div>
                    <h3 className="font-bold text-white text-sm sm:text-base mb-1">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-purple-200/50 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Slide>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 2 — WAAROM EXTRA                             */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 2 && (
          <Slide key="s2" className="items-center justify-center p-6 sm:p-10 lg:p-14">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 w-full max-w-6xl mx-auto">
              <Tag><Shield className="w-3 h-3" /> Waarom EXTRA</Tag>
              <H2>Wat BHG Group van EXTRA mag verwachten</H2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { icon: Shield, title: "Structureel minder no-shows", desc: "Ons beloningssysteem beloont punctualiteit en betrouwbaarheid. Aantoonbaar minder uitval, ook bij last-minute diensten." },
                  { icon: Building2, title: "Vaste gezichten per hotel", desc: "Via favorietenpoules per BHG-locatie bouw je een vaste kern op van mensen die jouw procedures en standaarden kennen." },
                  { icon: BarChart3, title: "Inzicht per locatie", desc: "Na elke dienst: scores, feedback en prestatierapportages per medewerker per hotel. Geen buikgevoel, maar data." },
                  { icon: Zap, title: "Snel opschalen bij drukte", desc: "Seizoenspiek, groot event, onverwachte uitval? EXTRA levert geselecteerd personeel, ook op korte termijn." },
                  { icon: Handshake, title: "Één aanspreekpunt, alle locaties", desc: "Eén dedicated contactpersoon die alle BHG-hotels kent en proactief meedenkt over uw operatie." },
                  { icon: CheckCircle2, title: "Volledig in loondienst & NEN-gecertificeerd", desc: "Geen zzp-risico's. Alles compliant met arbeidswetgeving. NEN-4400-1 gecertificeerd." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="bg-gradient-to-br from-purple-900/40 to-purple-950/60 border border-purple-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-6"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base mb-1.5">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-purple-200/55 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Slide>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 3 — FUNCTIES                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 3 && (
          <Slide key="s3" className="items-center justify-center p-6 sm:p-10 lg:p-14">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 w-full max-w-5xl mx-auto">
              <Tag><Users className="w-3 h-3" /> Functies</Tag>
              <H2>Voor elke afdeling binnen BHG Group</H2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                {[
                  { icon: BedDouble, title: "Housekeeping", desc: "Room attendants en kamermeisjes die uw hotelstandaard kennen en naleven." },
                  { icon: UserCheck, title: "Front Office", desc: "Representatieve receptiemedewerkers voor een professionele eerste indruk bij elke gast." },
                  { icon: Utensils, title: "F&B Bediening", desc: "Ervaren bediening voor restaurant, roomservice, banqueting en conferenties." },
                  { icon: ChefHat, title: "Keuken & Chef", desc: "Keukenondersteuning, sous-chefs en ontbijtmedewerkers voor een soepele F&B-operatie." },
                  { icon: GlassWater, title: "Bar & Lounge", desc: "Barpersoneel dat stijlvol en efficiënt werkt tijdens drukke avonddiensten." },
                  { icon: CalendarCheck, title: "Event & Banqueting", desc: "Teams voor gala-diners, congressen, boardroom-lunches en hotelgebonden events." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08 + i * 0.07 }}
                    className="bg-white/[0.06] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/[0.10] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base mb-1">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-purple-200/50 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-200/80">Alle medewerkers zijn geselecteerd op hospitality-ervaring, representativiteit en betrouwbaarheid.</p>
              </motion.div>
            </div>
          </Slide>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 4 — SELECTIEPROCES                           */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 4 && (
          <Slide key="s4" className="items-center justify-center p-6 sm:p-10 lg:p-14">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
              <div>
                <Tag><UserCheck className="w-3 h-3" /> Selectieproces</Tag>
                <H2>Elke kandidaat,<br />persoonlijk gescreend</H2>
                <p className="text-purple-200/65 text-sm sm:text-base leading-relaxed mb-7">
                  BHG Group vraagt om personeel dat verder gaat dan technisch competent. Representativiteit, gastvrijheid en betrouwbaarheid zijn doorslaggevend — getoetst aan de voorkant, zodat u nooit voor verrassingen staat.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: CheckCircle2, text: "Persoonlijk gesprek op karakter, motivatie en gastvrijheid" },
                    { icon: Star, text: "Beoordeling op hotelstandaarden en representativiteit" },
                    { icon: BarChart3, text: "Trackrecord bij eerdere hotelplaatsingen weegt mee" },
                    { icon: Shield, text: "Volledige identiteits- en tewerkstellingsvergunningcontrole" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-purple-300" />
                      </div>
                      <p className="text-sm sm:text-base text-purple-100/80 pt-1">{item.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="relative hidden lg:block"
              >
                <div className="rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl shadow-purple-900/50">
                  <img src={adminGebruikers} alt="Kandidatenoverzicht" className="w-full" />
                </div>
                <div className="absolute -bottom-5 -right-5 w-[55%] rounded-xl overflow-hidden border border-purple-500/20 shadow-2xl rotate-2">
                  <img src={annaBakkerProfiel} alt="Medewerkersprofiel" className="w-full" />
                </div>
              </motion.div>
            </div>
          </Slide>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 5 — FAVORIETENPOULE                          */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 5 && (
          <Slide key="s5" className="items-center justify-center p-6 sm:p-10 lg:p-14">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
              <div>
                <Tag><Layers className="w-3 h-3" /> Favorietenpoule</Tag>
                <H2>Dezelfde gezichten.<br />Minder uitleg. Meer kwaliteit.</H2>
                <p className="text-purple-200/65 text-sm sm:text-base leading-relaxed mb-7">
                  Voor BHG Group bouwen we per locatie een vaste favorietenpoule op. Medewerkers die uw procedures, kamernormen en servicecultuur kennen — zodat elke dienst soepel verloopt, ook bij onverwachte drukte.
                </p>
                <div className="space-y-2.5">
                  {[
                    "Snellere inwerktijd bij terugkerende medewerkers",
                    "Hogere gastvredenheid door consistente service",
                    "Minder operationele druk op uw vaste managers",
                    "Per locatie een aparte poule, centraal beheerd",
                    "Inzicht in wie waar presteert via ons platform",
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.08 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-sm sm:text-base text-purple-100/80">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/[0.05] border border-purple-500/20 rounded-2xl p-5 sm:p-7"
              >
                <div className="flex items-center justify-between mb-5">
                  <p className="font-bold text-white text-sm">Actieve poule — BHG Group</p>
                  <span className="text-xs bg-green-500/20 text-green-300 font-bold px-3 py-1 rounded-full">Live</span>
                </div>
                <div className="space-y-3 mb-5">
                  {[
                    { hotel: "Amrâth Grand Hotel", n: 12, color: "from-purple-500 to-purple-600" },
                    { hotel: "BHG Hotel Centrum", n: 8, color: "from-indigo-500 to-indigo-600" },
                    { hotel: "BHG Airport Hotel", n: 6, color: "from-violet-500 to-violet-600" },
                    { hotel: "BHG Spa & Resort", n: 5, color: "from-fuchsia-500 to-fuchsia-600" },
                  ].map((h, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/[0.05] rounded-xl p-3.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${h.color} flex items-center justify-center flex-shrink-0`}>
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-xs sm:text-sm truncate">{h.hotel}</p>
                        <p className="text-xs text-purple-300/60">{h.n} vaste medewerkers</p>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-4 grid grid-cols-3 gap-4 text-center">
                  {[
                    { v: "31", l: "Vaste medewerkers" },
                    { v: "94%", l: "Terugkeer­percentage" },
                    { v: "↓62%", l: "Minder intro­ductietijd" },
                  ].map((s, i) => (
                    <div key={i}>
                      <p className="text-lg sm:text-2xl font-black text-purple-300">{s.v}</p>
                      <p className="text-xs text-purple-300/50 mt-0.5 leading-tight">{s.l}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </Slide>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 6 — EXTRAATJE BELONINGSSYSTEEM               */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 6 && (
          <Slide key="s6" className="items-center justify-center p-6 sm:p-10 lg:p-14">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
              <div>
                <Tag><Gift className="w-3 h-3" /> Het Extraatje systeem</Tag>
                <H2>Gemotiveerde medewerkers leveren betere hotelservice</H2>
                <p className="text-purple-200/65 text-sm sm:text-base leading-relaxed mb-6">
                  Het Extraatje beloningssysteem is onze sleutel voor continuïteit. Medewerkers verdienen punten door op tijd te komen, diensten niet af te zeggen en bij vaste klanten te werken. Dat levert BHG Group betere, loyalere mensen op.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: TrendingUp, title: "Punten voor punctualiteit & kwaliteit", desc: "Elke dienst goed afgerond = punten. Dit beloont het gedrag dat voor BHG Group belangrijk is." },
                    { icon: Trophy, title: "Ranglijst & beloningen", desc: "Medewerkers die hoog scoren, krijgen zinvolle beloningen: cadeaukaarten, kortingen, erkenning." },
                    { icon: Target, title: "Continuïteit als drijfveer", desc: "Vaste locaties leveren extra punten op. Medewerkers kiezen daardoor bewust voor terugkeer bij BHG." },
                    { icon: Bell, title: "No-shows dalen structureel", desc: "Bij actieve deelnemers aan ons systeem zien we aantoonbaar minder afmeldingen en no-shows." },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.08 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{item.title}</p>
                        <p className="text-xs text-purple-200/50 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="hidden lg:grid grid-cols-2 gap-3"
              >
                {[extraatjeApp, appRanking, extraatjeChallenges, appRewards].map((img, i) => (
                  <div key={i} className="rounded-xl sm:rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl">
                    <img src={img} alt="" className="w-full" />
                  </div>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="lg:hidden grid grid-cols-2 gap-3"
              >
                {[extraatjeApp, appRanking].map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-purple-500/20">
                    <img src={img} alt="" className="w-full" />
                  </div>
                ))}
              </motion.div>
            </div>
          </Slide>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 7 — DATA & TECHNOLOGIE                       */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 7 && (
          <Slide key="s7" className="items-center justify-center p-6 sm:p-10 lg:p-14">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
              <div>
                <Tag><BarChart3 className="w-3 h-3" /> Data & technologie</Tag>
                <H2>Grip op kwaliteit, per BHG-locatie</H2>
                <p className="text-purple-200/65 text-sm sm:text-base leading-relaxed mb-6">
                  Geen buikgevoel, maar data. EXTRA meet prestaties per medewerker, per locatie en per functietype. Zo weten we altijd wie op welke BHG-locatie het beste presteert — en verbeteren we de match met elke dienst.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: BarChart3, title: "Prestatiescore na elke dienst", desc: "Punctualiteit, werkhouding en kwaliteit worden geregistreerd. Elke plaatsing wordt beter." },
                    { icon: Users, title: "Matchingalgoritme op historische prestaties", desc: "Niet alleen op beschikbaarheid matchen — maar op bewezen prestaties bij vergelijkbare hotels." },
                    { icon: Zap, title: "Real-time planning & beschikbaarheid", desc: "Direct zicht op wie beschikbaar is en al eerder bij BHG heeft gewerkt." },
                    { icon: TrendingUp, title: "Periodieke kwaliteitsrapportage", desc: "BHG Group ontvangt periodiek een overzicht van scores en trends per locatie." },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.08 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{item.title}</p>
                        <p className="text-xs text-purple-200/50 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="hidden lg:flex flex-col gap-3"
              >
                <div className="rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl">
                  <img src={beoordelingenStatistieken} alt="Beoordelingen & statistieken" className="w-full" />
                </div>
                <div className="rounded-xl overflow-hidden border border-purple-500/20 shadow-xl">
                  <img src={beoordelingScreen} alt="Beoordeling" className="w-full" />
                </div>
              </motion.div>
            </div>
          </Slide>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 8 — REVIEWS                                  */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 8 && (
          <Slide key="s8" className="items-center justify-center p-6 sm:p-10 lg:p-14">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 w-full max-w-6xl mx-auto">
              <Tag><Heart className="w-3 h-3" /> Referenties</Tag>
              <H2>Wat hotelmanagers over EXTRA zeggen</H2>
              <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 mb-5">
                {[
                  {
                    quote: "EXTRA levert structureel betrouwbaar personeel voor onze hoteldiensten. Ze begrijpen wat housekeeping- en F&B-kwaliteit voor ons betekent. De vaste poule die we hebben opgebouwd, maakt echt het verschil.",
                    name: "Geert di Domenico",
                    role: "General Manager",
                    hotel: "Marriott Hotels Amsterdam",
                    logo: logoMarriott,
                  },
                  {
                    quote: "No-shows zijn bij ons met meer dan de helft gedaald sinds we met EXTRA werken. De medewerkers kennen onze standaarden, komen op tijd en zijn representatief. Dat is precies wat je nodig hebt.",
                    name: "Anya Schoenmaker",
                    role: "Operations Director",
                    hotel: "Radisson Blu Amsterdam",
                    logo: logoAmrath,
                  },
                  {
                    quote: "Wat EXTRA onderscheidt: ze leveren niet alleen mensen, ze leveren de juiste mensen. En als er iets speelt, wordt er meteen geschakeld. Dat geeft rust op de werkvloer.",
                    name: "Dirk Koops",
                    role: "Hotel Manager",
                    hotel: "Amrâth Grand Hotel",
                    logo: logoAmrath,
                  },
                ].map((review, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="bg-white/[0.06] border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 flex flex-col"
                  >
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
                    </div>
                    <p className="text-sm sm:text-base text-purple-100/80 italic leading-relaxed flex-1 mb-4">"{review.quote}"</p>
                    <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-white text-sm">{review.name}</p>
                        <p className="text-xs text-purple-300/60">{review.role} · {review.hotel}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-5 py-3"
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm text-yellow-200/80 font-semibold">4,8 gemiddeld · 232+ Google reviews van hotelklanten en medewerkers</p>
              </motion.div>
            </div>
          </Slide>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 9 — SAMENWERKING                             */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 9 && (
          <Slide key="s9" className="items-center justify-center p-6 sm:p-10 lg:p-14">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 w-full max-w-5xl mx-auto">
              <Tag><Handshake className="w-3 h-3" /> Samenwerking</Tag>
              <H2 className="mb-8">Zo ziet de samenwerking met BHG Group eruit</H2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {[
                  {
                    step: "01",
                    icon: Users,
                    title: "Intake & afstemming",
                    desc: "We stellen per locatie vast welke functies, standaarden en capaciteit nodig zijn. Inclusief jaarplanning en piekmomenten.",
                  },
                  {
                    step: "02",
                    icon: UserCheck,
                    title: "Eerste plaatsingen",
                    desc: "Gerichte proefplaatsingen met medewerkers die geselecteerd zijn op prestaties bij vergelijkbare hotels.",
                  },
                  {
                    step: "03",
                    icon: Layers,
                    title: "Opbouw favorietenpoule",
                    desc: "Samen bepalen we wie structureel ingepland wordt. Die medewerkers vormen de vaste kern per BHG-hotel.",
                  },
                  {
                    step: "04",
                    icon: TrendingUp,
                    title: "Continue sturing & rapportage",
                    desc: "Maandelijkse inzichten in kwaliteitsscores, bezettingsgraad en trends. Één aanspreekpunt, proactief contact.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="bg-gradient-to-br from-purple-900/40 to-purple-950/60 border border-purple-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 relative"
                  >
                    <div className="absolute top-4 right-4 text-3xl font-black text-white/10">{item.step}</div>
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                      <item.icon className="w-4 h-4 text-purple-300" />
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base mb-2">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-purple-200/55 leading-relaxed">{item.desc}</p>
                    {i < 3 && (
                      <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-purple-600/50 rounded-full items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-purple-200" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </Slide>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* SLIDE 10 — CONTACT                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        {currentSlide === 10 && (
          <Slide key="s10" className="items-center justify-center p-8 sm:p-12 lg:p-16 text-center">
            <BgGradient />
            <BgDecos />
            <div className="relative z-10 max-w-3xl mx-auto">
              <motion.img
                src={extraLogoWit}
                alt="EXTRA"
                className="h-10 sm:h-12 mx-auto mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <H1 className="text-4xl sm:text-5xl lg:text-6xl">
                  Klaar voor de{" "}
                  <Accent>volgende stap?</Accent>
                </H1>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-base sm:text-lg text-purple-200/70 leading-relaxed mb-10"
              >
                Neem rechtstreeks contact op met ons team. We denken graag mee over hoe EXTRA structurele rust brengt in de operatie van BHG Group — per locatie, op maat.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
              >
                <a
                  href="tel:0851305915"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2.5 bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-0.5"
                  style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
                >
                  <Phone className="w-4 h-4" />
                  085 130 59 15
                </a>
                <a
                  href="mailto:info@doehetextra.nl"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2.5 border-2 border-white/25 text-white font-bold px-8 py-4 rounded-full text-base hover:bg-white/10 transition-all hover:-translate-y-0.5"
                >
                  <Mail className="w-4 h-4" />
                  info@doehetextra.nl
                </a>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="flex flex-wrap justify-center gap-8 sm:gap-12"
              >
                {[
                  { icon: Shield, text: "NEN-4400-1 gecertificeerd" },
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
          </Slide>
        )}

      </AnimatePresence>
    </div>
  );
}
