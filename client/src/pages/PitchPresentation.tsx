import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hotel, Banknote, Heart, Star, Zap, Award, Clock, Users, Sparkles, ChevronRight, Brain, Play, Maximize } from "lucide-react";

import appHome from "@/assets/pitch/app-home.png";
import appChallenges from "@/assets/pitch/app-challenges.png";
import appRewards from "@/assets/pitch/app-rewards.png";
import appRanking from "@/assets/pitch/app-ranking.png";
import adminDashboard from "@/assets/pitch/admin-dashboard.png";
import sollicitatieStart from "@/assets/pitch/sollicitatie-start.png";
import extraLogoWit from "@/assets/pitch/extra-logo-wit.png";
import beoordelingScreen from "@/assets/pitch/beoordeling-screen.png";
import extraPattern from "@/assets/pitch/extra-pattern.jpg";
import annaBakkerProfiel from "@/assets/pitch/anna-bakker-profiel.png";
import extraXShape from "@/assets/pitch/extra-x-shape.png";

const speakerNotes = [
  "SLIDE 1 (30s): Introductie EXTRA - uitzendbureau voor horeca en events. Betrouwbaar personeel, dagbetaling, en social impact met de Voedselbank.",
  "SLIDE 2 (35s): Het begint bij de sollicitatie. Op een iPad vullen kandidaten hun gegevens in - snel, efficiënt en direct digitaal.",
  "SLIDE 3 (30s): Tijdens de intake beoordelen we direct op hard- en softskills. Ervaring, houding, verzorging - alles krijgt een score.",
  "SLIDE 4 (35s): Alle data komt in ons dashboard. Per medewerker een volledig profiel met ratings, betrouwbaarheid en geschiedenis.",
  "SLIDE 5 (40s): Om medewerkers te motiveren hebben we EXTRAATJE - onze belonings-app. Punten verdienen, status opbouwen, beloningen kiezen.",
  "SLIDE 6 (30s): [KLIK VOOR NOTIFICATIES] Zo voelt het om met EXTRAATJE te werken. Real-time feedback, direct in je broekzak.",
  "SLIDE 7 (30s): De toekomst: AI-planning. Automatisch matchen op basis van beschikbaarheid, skills en betrouwbaarheid."
];

export default function PitchPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [notifications, setNotifications] = useState<number[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const totalSlides = 7;

  const startPresentation = useCallback(async () => {
    try {
      if (containerRef.current && document.fullscreenEnabled) {
        await containerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen not available');
    }
    setShowStartScreen(false);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const nextSlide = useCallback(() => {
    if (currentSlide === 5 && clickCount < 3) {
      setClickCount(prev => prev + 1);
      setNotifications(prev => [...prev, clickCount]);
    } else if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
      setClickCount(0);
      setNotifications([]);
    }
  }, [currentSlide, clickCount]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setClickCount(0);
      setNotifications([]);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "n" || e.key === "N") {
        setShowNotes(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const notificationData = [
    { emoji: "🚀", title: "Challenge behaald", subtitle: "Vroege vogel (+200 pts)" },
    { emoji: "🥇", title: "Upgrade", subtitle: "Gold status — lekker bezig!" },
    { emoji: "🔥", title: "Streak!", subtitle: "5 dagen op rij gewerkt (+125 pts)" },
  ];

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-gray-950 overflow-hidden cursor-pointer select-none"
      onClick={showStartScreen ? undefined : nextSlide}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/50 via-gray-950 to-gray-950" />

      {/* Start Screen Overlay */}
      <AnimatePresence>
        {showStartScreen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950/50 via-gray-950 to-gray-950" />
            
            <motion.img
              src={extraLogoWit}
              alt="EXTRA"
              className="h-20 mb-12 relative z-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            />
            
            <motion.h1
              className="text-4xl md:text-5xl text-white mb-4 text-center relative z-10"
              style={{ fontFamily: 'Poppins', fontWeight: 800 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              JCI Ondernemers Award
            </motion.h1>
            
            <motion.p
              className="text-xl text-gray-400 mb-12 relative z-10"
              style={{ fontFamily: 'Poppins' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Pitch Presentatie
            </motion.p>
            
            <motion.button
              onClick={startPresentation}
              className="relative z-10 flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-8 py-4 rounded-2xl text-xl font-semibold shadow-2xl shadow-purple-500/30 transition-all hover:scale-105"
              style={{ fontFamily: 'Poppins' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="w-6 h-6" />
              Start Presentatie
              <Maximize className="w-5 h-5 ml-1 opacity-60" />
            </motion.button>
            
            <motion.p
              className="text-gray-500 text-sm mt-6 relative z-10"
              style={{ fontFamily: 'Poppins' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Opent in volledig scherm
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Creative 3D X Background Art - Using actual brand X image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large 3D X element - bottom right */}
        <div 
          className="absolute -right-40 -bottom-40"
          style={{ perspective: '1000px' }}
        >
          <img 
            src={extraXShape}
            alt=""
            className="w-[700px] h-[700px] opacity-[0.08]"
            style={{ 
              transform: 'rotateX(15deg) rotateY(-20deg) rotateZ(5deg)',
              filter: 'invert(1) brightness(2)',
            }}
          />
        </div>

        {/* Medium 3D X element - top left */}
        <div 
          className="absolute -left-28 -top-28"
          style={{ perspective: '800px' }}
        >
          <img 
            src={extraXShape}
            alt=""
            className="w-[450px] h-[450px] opacity-[0.05]"
            style={{ 
              transform: 'rotateX(-10deg) rotateY(25deg) rotateZ(-8deg)',
              filter: 'invert(1) brightness(2)',
            }}
          />
        </div>

        {/* Small floating X element */}
        <div 
          className="absolute right-1/4 top-1/4"
          style={{ perspective: '600px' }}
        >
          <img 
            src={extraXShape}
            alt=""
            className="w-[120px] h-[120px] opacity-[0.12]"
            style={{ 
              transform: 'rotateX(20deg) rotateY(-15deg) rotateZ(12deg)',
              filter: 'invert(1) brightness(1.5) sepia(1) saturate(5) hue-rotate(240deg)',
            }}
          />
        </div>

        {/* Extra small X - center left */}
        <div 
          className="absolute left-1/3 bottom-1/3"
          style={{ perspective: '500px' }}
        >
          <img 
            src={extraXShape}
            alt=""
            className="w-[70px] h-[70px] opacity-[0.06]"
            style={{ 
              transform: 'rotateX(-5deg) rotateY(10deg) rotateZ(-5deg)',
              filter: 'invert(1) brightness(2)',
            }}
          />
        </div>

        {/* Diamond pattern strip - subtle, only partial coverage */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden"
          style={{ perspective: '1000px' }}
        >
          <div 
            className="w-full h-full opacity-[0.025]"
            style={{ 
              backgroundImage: `url(${extraPattern})`,
              backgroundSize: '250px',
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'bottom',
              transform: 'rotateX(70deg) translateY(50%)',
              transformOrigin: 'bottom center',
              filter: 'invert(1)',
            }}
          />
        </div>

        {/* Ambient glow behind content */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-20"
          style={{ 
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          }}
        />
      </div>
      
      <div className="absolute top-6 right-6 flex gap-2 z-50">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === currentSlide ? "bg-purple-500 scale-125" : "bg-gray-600"
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* SLIDE 0: Intro - Wie is EXTRA */}
        {currentSlide === 0 && (
          <motion.div
            key="slide1-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center max-w-5xl"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-block mb-8"
              >
                <img src={extraLogoWit} alt="EXTRA" className="h-16 md:h-20" />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-5xl md:text-7xl text-white mb-6 leading-tight"
                style={{ fontFamily: 'Poppins', fontWeight: 800 }}
              >
                Betrouwbaar personeel voor
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  horeca en events.
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-xl md:text-2xl text-gray-400 mb-16"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                EXTRA is een uitzendbureau dat technologie inzet voor kwaliteit en transparantie.
              </motion.p>

              <div className="flex justify-center gap-6 flex-wrap">
                {[
                  { icon: Hotel, text: "Hotels + Events" },
                  { icon: Banknote, text: "Dagbetaling" },
                  { icon: Heart, text: "1 dienst = 1 maaltijd", highlight: true },
                ].map((badge, i) => (
                  <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1 + i * 0.15, duration: 0.5 }}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${
                      badge.highlight 
                        ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50" 
                        : "bg-gray-800/50 border-gray-700/50"
                    } backdrop-blur-sm`}
                  >
                    <badge.icon className={`w-5 h-5 ${badge.highlight ? "text-pink-400" : "text-purple-400"}`} />
                    <span className="text-white font-medium">{badge.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SLIDE 1: Sollicitatie op iPad */}
        {currentSlide === 1 && (
          <motion.div
            key="slide2-sollicitatie"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="flex items-center gap-16 max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex-shrink-0"
              >
                <div className="relative" style={{ perspective: '1200px' }}>
                  <div className="absolute -inset-8 bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent rounded-[2rem] blur-2xl" />
                  <div className="absolute -bottom-6 left-6 right-6 h-12 bg-black/50 rounded-[2rem] blur-xl" />
                  <div 
                    className="relative bg-gray-800 rounded-[1.5rem] p-3 border-2 border-gray-700 shadow-2xl"
                    style={{ 
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
                      transform: 'rotateY(-5deg)'
                    }}
                  >
                    <div className="bg-black rounded-[1rem] p-1 overflow-hidden">
                      <div className="flex items-center justify-center gap-2 py-1.5 bg-gray-900 rounded-t-lg">
                        <div className="w-2 h-2 bg-gray-700 rounded-full" />
                      </div>
                      <img
                        src={sollicitatieStart}
                        alt="Sollicitatieformulier"
                        className="w-80 h-auto"
                      />
                      <div className="h-1 bg-gray-900" />
                    </div>
                  </div>
                  <p className="text-center text-gray-400 text-sm mt-8" style={{ fontFamily: 'Poppins' }}>iPad Sollicitatieformulier</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-1 space-y-6"
              >
                <h2 className="text-4xl md:text-5xl text-white leading-tight" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Het begint bij de
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    sollicitatie.
                  </span>
                </h2>
                
                <p className="text-xl text-gray-400" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Kandidaten vullen hun gegevens in op een iPad - snel, efficiënt en direct digitaal.
                </p>

                <div className="space-y-4 pt-4">
                  {[
                    { icon: Users, text: "Persoonsgegevens & beschikbaarheid", delay: 0.7 },
                    { icon: Award, text: "Ervaring & vaardigheden", delay: 0.85 },
                    { icon: Zap, text: "Direct in het systeem", delay: 1.0 },
                  ].map((item) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.delay, duration: 0.5 }}
                      className="flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-5 py-3"
                    >
                      <item.icon className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 2: Beoordeling */}
        {currentSlide === 2 && (
          <motion.div
            key="slide3-beoordeling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="flex items-center gap-16 max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex-shrink-0"
              >
                <div className="relative">
                  <div className="absolute -inset-6 bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent rounded-[2rem] blur-2xl" />
                  <div className="absolute -bottom-6 left-6 right-6 h-12 bg-black/50 rounded-[2rem] blur-xl" />
                  <div className="relative bg-gray-800 rounded-[1.5rem] p-3 border-2 border-gray-700 shadow-2xl" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)' }}>
                    <div className="bg-white rounded-[1rem] overflow-hidden">
                      <img
                        src={beoordelingScreen}
                        alt="Beoordeling scherm"
                        className="w-72 h-auto"
                      />
                    </div>
                  </div>
                  <p className="text-center text-gray-400 text-sm mt-8" style={{ fontFamily: 'Poppins' }}>iPad Beoordelingsformulier</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-1 space-y-6"
              >
                <h2 className="text-4xl md:text-5xl text-white leading-tight" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Direct beoordelen op
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    hard- en softskills.
                  </span>
                </h2>
                
                <p className="text-xl text-gray-400" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Tijdens de intake geeft de recruiter scores aan elke kandidaat.
                </p>

                <div className="space-y-4 pt-4">
                  {[
                    { icon: Award, text: "Eerste indruk & houding", delay: 0.7 },
                    { icon: Star, text: "Ervaring & vaardigheden", delay: 0.85 },
                    { icon: Users, text: "Uiterlijke verzorging", delay: 1.0 },
                  ].map((item) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.delay, duration: 0.5 }}
                      className="flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-5 py-3"
                    >
                      <item.icon className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="pt-4"
                >
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-xl p-4">
                    <p className="text-purple-300 text-center" style={{ fontFamily: 'Poppins' }}>
                      Objectieve data voor betere matches
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 3: Dashboard */}
        {currentSlide === 3 && (
          <motion.div
            key="slide4-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <h2 className="text-4xl md:text-5xl text-white mb-3" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Alle data in <span className="text-purple-400">één dashboard.</span>
              </h2>
              <p className="text-xl text-gray-400" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Per medewerker een volledig profiel met ratings en geschiedenis.
              </p>
            </motion.div>

            <div className="flex items-center gap-6 max-w-6xl w-full">
              {/* Main Dashboard Screenshot */}
              <motion.div
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative flex-1"
              >
                <div className="absolute -inset-4 bg-gradient-to-b from-purple-500/10 to-transparent rounded-3xl blur-2xl" />
                <div className="relative bg-gray-800/50 rounded-2xl p-2 border border-gray-700/50 shadow-2xl">
                  <div className="bg-gray-900 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700">
                      <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      </div>
                      <span className="text-gray-500 text-xs ml-2">EXTRA Dashboard</span>
                    </div>
                    <img
                      src={adminDashboard}
                      alt="Admin Dashboard"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Arrow indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                className="flex-shrink-0"
              >
                <ChevronRight className="w-8 h-8 text-purple-500" />
              </motion.div>

              {/* Anna Bakker Profile Popup */}
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="relative flex-shrink-0"
              >
                <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-3xl blur-2xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-purple-500/30" style={{ maxWidth: '340px' }}>
                  <img
                    src={annaBakkerProfiel}
                    alt="Anna Bakker Profiel"
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-center text-gray-400 text-sm mt-3" style={{ fontFamily: 'Poppins' }}>
                  Ingezoomd: medewerker profiel
                </p>
              </motion.div>
            </div>

            <div className="flex justify-center gap-4 mt-6 flex-wrap">
              {[
                { icon: Star, text: "Ratings na elke dienst" },
                { icon: Clock, text: "Betrouwbaarheid & punctualiteit" },
                { icon: Users, text: "Favorietenpoules" },
              ].map((badge, i) => (
                <motion.div
                  key={badge.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl"
                >
                  <badge.icon className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 text-sm font-medium">{badge.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SLIDE 4: EXTRAATJE App */}
        {currentSlide === 4 && (
          <motion.div
            key="slide5-extraatje"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="flex items-center gap-12 max-w-7xl w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex-1 space-y-6"
              >
                <h2 className="text-4xl md:text-5xl text-white leading-tight" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Medewerkers motiveren met
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    EXTRAATJE.
                  </span>
                </h2>
                
                <p className="text-xl text-gray-400" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Onze belonings-app voor medewerkers. Punten verdienen, status opbouwen, beloningen kiezen.
                </p>

                <div className="space-y-4 pt-6">
                  {[
                    { icon: Award, text: "Status opbouwen (Bronze → Diamond)", delay: 0.6 },
                    { icon: Zap, text: "Challenges & uitdagingen", delay: 0.75 },
                    { icon: Star, text: "Beloningen & Ranglijst", delay: 0.9 },
                  ].map((item) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.delay, duration: 0.5 }}
                      className="flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-5 py-3"
                    >
                      <item.icon className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex gap-4"
              >
                {[appHome, appChallenges, appRanking].map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                    className="relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-b from-purple-500/30 to-transparent rounded-[2rem] blur-xl" />
                    <div className="relative bg-gray-900 rounded-[2rem] p-1.5 shadow-2xl border border-gray-800">
                      <img
                        src={img}
                        alt="App screenshot"
                        className="w-44 h-auto rounded-[1.5rem]"
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 5: Notifications */}
        {currentSlide === 5 && (
          <motion.div
            key="slide6-notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <motion.h2
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 text-4xl md:text-5xl text-white z-20"
              style={{ fontFamily: 'Poppins', fontWeight: 800 }}
            >
              Motivatie, <span className="text-purple-400">realtime.</span>
            </motion.h2>

            <div className="flex items-center gap-8 md:gap-16 max-w-5xl">
              <motion.div
                initial={{ opacity: 0, x: -30, rotate: -3 }}
                animate={{ opacity: 1, x: 0, rotate: -3 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="relative"
              >
                <div className="absolute -inset-6 bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-transparent rounded-[3rem] blur-2xl" />
                <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-gray-800" style={{ transform: 'perspective(1000px) rotateY(5deg)' }}>
                  <img
                    src={appChallenges}
                    alt="App challenges"
                    className="w-64 md:w-72 h-auto rounded-[2rem]"
                  />
                </div>
              </motion.div>

              <div className="flex flex-col gap-4 w-80">
                <AnimatePresence>
                  {notifications.map((idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 80, y: -20, rotate: 3 }}
                      animate={{ opacity: 1, x: 0, y: 0, rotate: idx === 1 ? -1 : idx === 2 ? 2 : 0 }}
                      exit={{ opacity: 0, x: 50, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl" />
                      <div className="relative bg-gray-900/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-4 shadow-2xl">
                        <div className="flex items-center gap-4">
                          <motion.span 
                            className="text-3xl"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.1, stiffness: 400 }}
                          >
                            {notificationData[idx].emoji}
                          </motion.span>
                          <div>
                            <p className="text-white font-bold text-lg" style={{ fontFamily: 'Poppins' }}>{notificationData[idx].title}</p>
                            <p className="text-purple-300 text-sm" style={{ fontFamily: 'Poppins' }}>{notificationData[idx].subtitle}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {clickCount < 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-4"
                  >
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>
                      Klik om meldingen te tonen
                    </p>
                    <div className="flex justify-center gap-2 mt-2">
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full transition-all ${i < clickCount ? 'bg-purple-500' : 'bg-gray-600'}`} 
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 6: AI-planning (toekomst) */}
        {currentSlide === 6 && (
          <motion.div
            key="slide7-ai-planning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12 max-w-4xl"
            >
              <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/50 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-sm font-medium">Coming Soon</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl text-white leading-tight mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                De toekomst:
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  AI-gestuurde planning.
                </span>
              </h2>
              
              <p className="text-xl text-gray-400" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Medewerkers krijgen automatisch een appje met diensten, gebaseerd op beschikbaarheid en skills.
              </p>
            </motion.div>

            <div className="flex gap-6 max-w-4xl w-full">
              {[
                { icon: Clock, title: "Beschikbaarheid", desc: "Real-time beschikbaarheid via de app" },
                { icon: Award, title: "Skills & scores", desc: "Match op basis van beoordelingen" },
                { icon: Zap, title: "Instant notificatie", desc: "Direct een appje met de dienst" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                  className="flex-1 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
                >
                  <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2" style={{ fontFamily: 'Poppins' }}>{item.title}</h3>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mt-10 text-center"
            >
              <p className="text-purple-400 text-lg font-medium" style={{ fontFamily: 'Poppins' }}>
                10x sneller plannen dan handmatig
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 right-6 max-w-md bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl p-4 shadow-2xl z-50"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-400 text-xs uppercase tracking-wider">Speaker Notes</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {speakerNotes[currentSlide]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-6 text-gray-600 text-xs z-50">
        <p>← → Navigeren | Spatie/Klik = Volgende | N = Notes</p>
      </div>
    </div>
  );
}
