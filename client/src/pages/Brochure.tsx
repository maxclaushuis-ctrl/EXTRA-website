import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Shield, 
  Phone, 
  Star, 
  CheckCircle2, 
  BadgeCheck, 
  UserCheck,
  MessageCircle,
  Clock,
  Award,
  Building2,
  ChevronLeft,
  ChevronRight,
  Gift,
  TrendingUp,
  Target,
  Trophy,
  BarChart3
} from "lucide-react";

import extraLogoWit from "../assets/pitch/extra-logo-wit.png";
import extraXShape from "../assets/pitch/extra-x-shape.png";

import nhLogo from "../assets/pitch/nh-hotels-logo.png";
import marriottLogo from "../assets/pitch/marriott-logo.png";
import amrathLogo from "../assets/pitch/amrath-logo.png";

import extraatjeApp from "../assets/pitch/extraatje-app.png";
import extraatjeChallenges from "../assets/pitch/extraatje-challenges.png";
import scoringDashboardNew from "../assets/pitch/scoring-dashboard-new.png";
import intakeBeoordeling from "../assets/pitch/intake-beoordeling.png";
import adminGebruikers from "../assets/pitch/admin-gebruikers.png";
import beoordelingenStatistieken from "../assets/pitch/beoordelingen-statistieken.png";
import ipadIntakeComplete from "../assets/pitch/ipad-intake-complete.png";
import logoPulitzer from "@assets/Logo_Pulitzer_1773389329669.png";
import logoRadisson from "../assets/pitch/logo-radisson.png";
import logoHilton from "../assets/pitch/logo-hilton.png";

export default function Brochure() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 11;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div 
      className="h-screen w-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden relative"
      onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ 
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ 
            background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
          }}
        />
        <div className="absolute top-10 right-10 opacity-10">
          <img 
            src={extraXShape}
            alt=""
            className="w-[100px] h-[100px]"
            style={{ filter: 'invert(1) brightness(1.5) sepia(1) saturate(5) hue-rotate(240deg)' }}
          />
        </div>
        <div className="absolute bottom-10 left-10 opacity-10">
          <img 
            src={extraXShape}
            alt=""
            className="w-[80px] h-[80px]"
            style={{ filter: 'invert(1) brightness(1.5) sepia(1) saturate(5) hue-rotate(240deg)' }}
          />
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute top-6 right-6 flex gap-2 z-50">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <motion.div
            key={i}
            onClick={(e) => { e.stopPropagation(); goToSlide(i); }}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
              i === currentSlide ? "bg-purple-500 scale-125" : "bg-gray-600 hover:bg-gray-500"
            }`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="absolute bottom-6 right-6 flex gap-2 z-50">
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentSlide((prev) => Math.max(prev - 1, 0)); }}
          className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 border border-purple-500/30 rounded-full flex items-center justify-center transition-all"
          disabled={currentSlide === 0}
        >
          <ChevronLeft className={`w-5 h-5 ${currentSlide === 0 ? 'text-gray-600' : 'text-white'}`} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1)); }}
          className="w-10 h-10 bg-gray-800/80 hover:bg-gray-700 border border-purple-500/30 rounded-full flex items-center justify-center transition-all"
          disabled={currentSlide === totalSlides - 1}
        >
          <ChevronRight className={`w-5 h-5 ${currentSlide === totalSlides - 1 ? 'text-gray-600' : 'text-white'}`} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* SLIDE 0: Hero */}
        {currentSlide === 0 && (
          <motion.div
            key="slide-hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-12"
          >
            <motion.img 
              src={extraLogoWit} 
              alt="EXTRA" 
              className="h-20 md:h-28 mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            />
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight text-center max-w-5xl"
              style={{ fontFamily: 'Poppins', fontWeight: 800 }}
            >
              Geef je hotel dat{" "}
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                EXTRA
              </span>tje
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-400 mb-12 text-center"
              style={{ fontFamily: 'Poppins' }}
            >
              Je partner in kwalitatieve hotelmedewerkers
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center gap-6"
            >
              {[
                { icon: BadgeCheck, text: "NEN-4400-1 Gecertificeerd" },
                { icon: Users, text: "800+ Medewerkers" },
                { icon: Gift, text: "Loyaliteitssysteem" },
              ].map((item) => (
                <div 
                  key={item.text}
                  className="flex items-center gap-2 bg-gray-800/50 border border-purple-500/30 rounded-full px-5 py-2"
                >
                  <item.icon className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300" style={{ fontFamily: 'Poppins' }}>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* SLIDE 1: Onze Diensten */}
        {currentSlide === 1 && (
          <motion.div
            key="slide-diensten"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-12"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-cyan-600/20 border border-cyan-500/40 rounded-full px-4 py-2 mb-6">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-300 text-sm" style={{ fontFamily: 'Poppins' }}>Wat wij leveren</span>
              </div>
              <h2 className="text-4xl md:text-6xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Onze <span className="text-cyan-400">diensten</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
                Gespecialiseerd personeel voor alle afdelingen van je hotel
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-6 max-w-6xl">
              {[
                {
                  emoji: "🛏️",
                  title: "Housekeeping",
                  desc: "Ons housekeeping team zorgt voor een strakke, vlekkeloze gastbeleving. Altijd netjes, snel en met EXTRA oog voor detail.",
                  color: "from-blue-600 to-blue-800"
                },
                {
                  emoji: "👨‍🍳",
                  title: "Keuken",
                  desc: "Van afwas tot sous-chef: ervaren krachten die jullie keuken draaiende houden, ook tijdens piekmomenten.",
                  color: "from-orange-600 to-orange-800"
                },
                {
                  emoji: "🍽️",
                  title: "Banqueting",
                  desc: "Professionele bediening voor banqueting, conferenties, ontbijt- en lunchservices. Flexibel, representatief en altijd EXTRA gastgericht.",
                  color: "from-purple-600 to-purple-800"
                },
                {
                  emoji: "🛎️",
                  title: "Front-office",
                  desc: "Receptie en guest service voor een warm welkom en een EXTRA soepele check-in ervaring.",
                  color: "from-green-600 to-green-800"
                }
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 text-center"
                >
                  <div className="text-6xl mb-6">{item.emoji}</div>
                  <h3 className="text-2xl text-white font-bold mb-3" style={{ fontFamily: 'Poppins' }}>
                    {item.title}
                  </h3>
                  <p className="text-gray-400" style={{ fontFamily: 'Poppins' }}>
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SLIDE 2: Kwaliteit */}
        {currentSlide === 2 && (
          <motion.div
            key="slide-kwaliteit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-12"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/40 rounded-full px-4 py-2 mb-6">
                <Star className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 text-sm" style={{ fontFamily: 'Poppins' }}>Onze belofte</span>
              </div>
              <h2 className="text-4xl md:text-6xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                <span className="text-purple-400">Kwaliteit</span> staat voorop
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
                Wij selecteren, trainen en behouden de beste mensen voor je hotel
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl">
              {[
                {
                  icon: UserCheck,
                  title: "Uitgebreide selectie",
                  desc: "Alle kandidaten komen bij ons op gesprek en worden beoordeeld op soft- en hardskills",
                  color: "from-purple-600 to-purple-800"
                },
                {
                  icon: Award,
                  title: "Beloningssysteem",
                  desc: "Loyalere medewerkers doordat ze worden beloond op microprestaties. Hoe hoger de score, hoe meer punten",
                  color: "from-pink-600 to-pink-800"
                },
                {
                  icon: Star,
                  title: "Continu feedback",
                  desc: "Na elke dienst ontvangt de medewerker een beoordeling. Zo blijven wij scherp op kwaliteit",
                  color: "from-cyan-600 to-cyan-800"
                }
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-6`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl text-white font-bold mb-3" style={{ fontFamily: 'Poppins' }}>
                    {item.title}
                  </h3>
                  <p className="text-gray-400" style={{ fontFamily: 'Poppins' }}>
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SLIDE 3: Kwalificatieproces */}
        {currentSlide === 3 && (
          <motion.div
            key="slide-kwalificatie"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/40 rounded-full px-4 py-2 mb-6">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-300 text-sm" style={{ fontFamily: 'Poppins' }}>Selectieproces</span>
                </div>
                <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Ons <span className="text-purple-400">kwalificatieproces</span>
                </h2>
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
                  Elke kandidaat wordt beoordeeld op soft- en hardskills tijdens het intake gesprek
                </p>

                <div className="space-y-4 mb-6">
                  {[
                    { label: "Softskills", desc: "Houding & communicatie", icon: "💬" },
                    { label: "Hardskills", desc: "Ervaring & kennis", icon: "🎯" },
                    { label: "Beoordeling", desc: "Topper / Goede indruk / Middelmatig", icon: "⭐" },
                  ].map((stat, i) => (
                    <motion.div 
                      key={stat.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-4 bg-gray-800/60 border border-purple-500/20 rounded-xl px-5 py-3"
                    >
                      <span className="text-2xl">{stat.icon}</span>
                      <div>
                        <span className="text-purple-400 font-bold text-base" style={{ fontFamily: 'Poppins' }}>{stat.label}</span>
                        <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>{stat.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="relative flex justify-center"
              >
                <img 
                  src={ipadIntakeComplete} 
                  alt="iPad met kwalificatieformulier" 
                  className="w-full max-w-xl"
                  style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.4))' }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 4: EXTRAATJE Puntensysteem */}
        {currentSlide === 4 && (
          <motion.div
            key="slide-extraatje"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 bg-pink-600/20 border border-pink-500/40 rounded-full px-4 py-2 mb-6">
                  <Gift className="w-5 h-5 text-pink-400" />
                  <span className="text-pink-300 text-sm" style={{ fontFamily: 'Poppins' }}>EXTRAATJE</span>
                </div>
                <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  <span className="text-pink-400">Loyale</span> medewerkers door punten
                </h2>
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
                  Ons unieke beloningssysteem motiveert medewerkers om zich extra in te zetten. Alles is meetbaar.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { icon: Target, value: "Challenges", desc: "Doelen behalen" },
                    { icon: Trophy, value: "Punten", desc: "Verzamelen" },
                    { icon: Gift, value: "Rewards", desc: "Inwisselen" },
                    { icon: TrendingUp, value: "Leaderboard", desc: "Competitie" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="bg-gray-800/60 border border-pink-500/20 rounded-xl p-4"
                    >
                      <stat.icon className="w-6 h-6 text-pink-400 mb-2" />
                      <p className="text-white font-bold" style={{ fontFamily: 'Poppins' }}>{stat.value}</p>
                      <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>{stat.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-3">
                  {[
                    "Medewerkers verdienen punten per dienst",
                    "Bonuspunten voor extra inzet",
                    "Inwisselbaar voor rewards & kortingen"
                  ].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-pink-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm" style={{ fontFamily: 'Poppins' }}>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="relative flex justify-center gap-4"
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-3xl blur-xl" />
                  <img 
                    src={extraatjeApp} 
                    alt="EXTRAATJE App" 
                    className="relative w-[200px] rounded-2xl shadow-2xl border border-pink-500/30"
                  />
                </div>
                <div className="relative mt-8">
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
                  <img 
                    src={extraatjeChallenges} 
                    alt="Challenges" 
                    className="relative w-[200px] rounded-2xl shadow-2xl border border-purple-500/30"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 5: Beoordelingen na dienst */}
        {currentSlide === 5 && (
          <motion.div
            key="slide-scoring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 bg-orange-600/20 border border-orange-500/40 rounded-full px-4 py-2 mb-6">
                <BarChart3 className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 text-sm" style={{ fontFamily: 'Poppins' }}>Continu feedback</span>
              </div>
              <h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Elke dienst <span className="text-orange-400">beoordeeld</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
                Na elke dienst ontvangt de medewerker een beoordeling. Realtime inzicht in prestaties.
              </p>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-8 max-w-6xl w-full items-start justify-center">
              {/* Linker kolom - kleiner */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="relative w-full md:w-[38%]"
              >
                <div className="absolute -inset-3 bg-gradient-to-br from-orange-500/20 to-yellow-500/10 rounded-3xl blur-xl" />
                <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-orange-500/40 rounded-2xl p-5 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base" style={{ fontFamily: 'Poppins' }}>Overzicht medewerkers</h4>
                      <p className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins' }}>Beheer en scores</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-700/50 shadow-inner">
                    <img 
                      src={adminGebruikers} 
                      alt="Gebruikersbeheer met beoordelingen" 
                      className="w-full object-contain"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Rechter kolom - groter */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative w-full md:w-[58%]"
              >
                <div className="absolute -inset-3 bg-gradient-to-br from-purple-500/20 to-orange-500/10 rounded-3xl blur-xl" />
                <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-purple-500/40 rounded-2xl p-5 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base" style={{ fontFamily: 'Poppins' }}>Statistieken per medewerker</h4>
                      <p className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins' }}>Diensten, no-shows, beoordelingen</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-700/50 shadow-inner">
                    <img 
                      src={beoordelingenStatistieken} 
                      alt="Medewerker statistieken" 
                      className="w-full object-contain"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 6: Dezelfde medewerkers */}
        {currentSlide === 6 && (
          <motion.div
            key="slide-continuiteit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-12"
          >
            <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 bg-cyan-600/20 border border-cyan-500/40 rounded-full px-4 py-2 mb-6">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-300 text-sm" style={{ fontFamily: 'Poppins' }}>Continuïteit</span>
                </div>
                <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Dezelfde <span className="text-cyan-400">gezichten</span>, steeds weer
                </h2>
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
                  Geen eindeloos inwerken. Wij zorgen dat je zoveel mogelijk dezelfde medewerkers ziet die je hotel al kennen.
                </p>
                
                <div className="space-y-4">
                  {[
                    "Stel je eigen favorietenpoule samen",
                    "Medewerkers kennen je werkwijze",
                    "Geen tijd kwijt aan inwerken",
                    "Hogere productiviteit vanaf dag één"
                  ].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <span className="text-gray-300" style={{ fontFamily: 'Poppins' }}>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg" style={{ fontFamily: 'Poppins' }}>Je vaste team</h4>
                      <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>Gematchte medewerkers</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {["Anna B.", "Mohammed K.", "Lisa V.", "Thomas R."].map((name) => (
                      <div key={name} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {name.split(' ')[0][0]}{name.split(' ')[1][0]}
                          </div>
                          <span className="text-white" style={{ fontFamily: 'Poppins' }}>{name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 7: Wet- en regelgeving */}
        {currentSlide === 7 && (
          <motion.div
            key="slide-compliance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-12"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/40 rounded-full px-4 py-2 mb-6">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 text-sm" style={{ fontFamily: 'Poppins' }}>100% Compliant</span>
              </div>
              <h2 className="text-4xl md:text-6xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Volledige <span className="text-emerald-400">zekerheid</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
                Wij nemen alle zorgen rondom wet- en regelgeving uit handen
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
              {[
                {
                  icon: BadgeCheck,
                  title: "NEN-4400-1",
                  desc: "Volledig gecertificeerd voor arbeidswetgeving en fiscale verplichtingen",
                  highlight: true
                },
                {
                  icon: Shield,
                  title: "100% Loondienst",
                  desc: "Al onze medewerkers zijn in vaste loondienst. Geen risico op schijnzelfstandigheid",
                  highlight: false
                },
                {
                  icon: CheckCircle2,
                  title: "Waadi Check",
                  desc: "Geregistreerd in het Waadi-register van de SNA",
                  highlight: false
                },
                {
                  icon: Users,
                  title: "TWV Controle",
                  desc: "Strikte controle op tewerkstellingsvergunningen",
                  highlight: false
                },
                {
                  icon: Award,
                  title: "Verzekeringen",
                  desc: "Volledig verzekerd. Je loopt geen enkel risico",
                  highlight: false
                },
                {
                  icon: Clock,
                  title: "Zorgeloos",
                  desc: "Wij handelen alle administratie voor je af",
                  highlight: false
                }
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className={`bg-gradient-to-br ${item.highlight ? 'from-emerald-600/30 to-emerald-800/20 border-emerald-500/50' : 'from-gray-800/80 to-gray-900/80 border-emerald-500/20'} backdrop-blur-xl border rounded-2xl p-6`}
                >
                  <div className={`w-12 h-12 ${item.highlight ? 'bg-emerald-600' : 'bg-emerald-600/20'} rounded-xl flex items-center justify-center mb-4`}>
                    <item.icon className={`w-6 h-6 ${item.highlight ? 'text-white' : 'text-emerald-400'}`} />
                  </div>
                  <h3 className="text-lg text-white font-bold mb-2" style={{ fontFamily: 'Poppins' }}>
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SLIDE 8: Persoonlijk Contact */}
        {currentSlide === 8 && (
          <motion.div
            key="slide-contact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-12"
          >
            <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-700 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold" style={{ fontFamily: 'Poppins' }}>Directe lijn</h4>
                      <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>Geen wachtrijen, geen keuzemenu's</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: Phone, title: "Telefonisch", desc: "Bel direct met je vast contactpersoon" },
                      { icon: MessageCircle, title: "WhatsApp", desc: "Antwoord binnen een uur" },
                      { icon: Clock, title: "7 dagen per week", desc: "Ook in het weekend bereikbaar" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="bg-pink-600/10 border border-pink-500/30 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <item.icon className="w-5 h-5 text-pink-400" />
                          <span className="text-pink-300 font-semibold" style={{ fontFamily: 'Poppins' }}>{item.title}</span>
                        </div>
                        <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>
                          {item.desc}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 bg-pink-600/20 border border-pink-500/40 rounded-full px-4 py-2 mb-6">
                  <Phone className="w-5 h-5 text-pink-400" />
                  <span className="text-pink-300 text-sm" style={{ fontFamily: 'Poppins' }}>Altijd bereikbaar</span>
                </div>
                <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  <span className="text-pink-400">Korte lijntjes</span>, snelle actie
                </h2>
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
                  Geen wachtrijen of keuzemenu's. Bij EXTRA heb je een vast contactpersoon die je hotel kent.
                </p>
                
                <div className="space-y-4">
                  {[
                    "Vaste accountmanager voor je locatie",
                    "Direct contact, geen omwegen",
                    "Proactieve communicatie",
                    "Snelle oplossingen bij problemen"
                  ].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-pink-400 flex-shrink-0" />
                      <span className="text-gray-300" style={{ fontFamily: 'Poppins' }}>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 9: Opdrachtgevers */}
        {currentSlide === 9 && (
          <motion.div
            key="slide-clients"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-12"
          >
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-yellow-600/20 border border-yellow-500/40 rounded-full px-4 py-2 mb-6">
                <Building2 className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 text-sm" style={{ fontFamily: 'Poppins' }}>Onze opdrachtgevers</span>
              </div>
              <h2 className="text-4xl md:text-6xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                In goed <span className="text-yellow-400">gezelschap</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
                Toonaangevende hotels vertrouwen op EXTRA
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl">
              {[
                { name: "NH Hotels", logo: nhLogo, hasLogo: true },
                { name: "Marriott", logo: marriottLogo, hasLogo: true },
                { name: "Grand Hotel Amrath", logo: amrathLogo, hasLogo: true },
                { name: "Pulitzer Amsterdam", logo: logoPulitzer, hasLogo: true },
                { name: "Radisson Blu", logo: logoRadisson, hasLogo: true },
                { name: "Hilton Hotels", logo: logoHilton, hasLogo: true },
              ].map((client, i) => (
                <motion.div
                  key={client.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center min-h-[120px] shadow-lg hover:shadow-xl transition-shadow"
                >
                  {client.hasLogo && client.logo ? (
                    <img 
                      src={client.logo} 
                      alt={client.name} 
                      className="h-14 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-800 font-semibold text-center" style={{ fontFamily: 'Poppins' }}>
                      {client.name}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SLIDE 10: CTA */}
        {currentSlide === 10 && (
          <motion.div
            key="slide-cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-12 max-w-4xl text-center"
            >
              <motion.img 
                src={extraLogoWit} 
                alt="EXTRA" 
                className="h-16 mx-auto mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              />
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl mb-6"
                style={{ fontFamily: 'Poppins', fontWeight: 800 }}
              >
                Klaar om te <span className="text-purple-400">starten</span>?
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-gray-400 mb-10"
                style={{ fontFamily: 'Poppins' }}
              >
                Ontdek hoe EXTRA je personeelszorgen wegneemt
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap justify-center gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <a 
                  href="tel:+31851305915"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-full px-8 py-4 transition-all"
                  style={{ fontFamily: 'Poppins' }}
                >
                  <Phone className="w-5 h-5" />
                  085 130 59 15
                </a>
                <a 
                  href="mailto:eveline@doehetextra.nl"
                  className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-purple-500/30 text-white font-semibold rounded-full px-8 py-4 transition-all"
                  style={{ fontFamily: 'Poppins' }}
                >
                  <MessageCircle className="w-5 h-5" />
                  eveline@doehetextra.nl
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-10 flex items-center justify-center gap-2 text-gray-500"
              >
                <BadgeCheck className="w-4 h-4" />
                <span className="text-sm" style={{ fontFamily: 'Poppins' }}>NEN-4400-1 Gecertificeerd</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
