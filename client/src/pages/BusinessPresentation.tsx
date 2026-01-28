import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Hotel, Banknote, Award, Clock, Users, Sparkles, Brain, Play, Maximize,
  Building2, Calendar, Star, Zap, Target, TrendingUp, Lightbulb, 
  MessageCircle, HandHeart, CheckCircle2, ArrowRight, Rocket,
  BadgeCheck, Trophy, Gift
} from "lucide-react";

import extraLogoWit from "@/assets/pitch/extra-logo-wit.png";
import extraXShape from "@/assets/pitch/extra-x-shape.png";
import extraPattern from "@/assets/pitch/extra-pattern.jpg";
import kcServiceLogo from "@/assets/pitch/kc-service-logo.png";
import extraLogoBlauw from "@/assets/pitch/extra-logo-blauw.png";
import starterVanHetJaar from "@/assets/pitch/starter-van-het-jaar.png";
import abnAmroLogo from "@/assets/pitch/abn-amro-logo.png";
import fundaLogo from "@/assets/pitch/funda-logo.png";
import nhHotelsLogo from "@/assets/pitch/nh-hotels-logo.png";
import fcUtrechtLogo from "@/assets/pitch/fc-utrecht-logo.png";
import hetePeperLogo from "@/assets/pitch/hete-peper-logo.png";
import amrathLogo from "@/assets/pitch/amrath-logo.png";
import marriottLogo from "@/assets/pitch/marriott-logo.png";
import sollicitatieformulier from "@/assets/pitch/sollicitatieformulier.png";
import scoringDashboard from "@/assets/pitch/scoring-dashboard.png";
import extraatjeApp from "@/assets/pitch/extraatje-app.png";
import extraatjeDeals from "@/assets/pitch/extraatje-deals.png";
import extraatjeChallenges from "@/assets/pitch/extraatje-challenges.png";
import extraatjeLeaderboard from "@/assets/pitch/extraatje-leaderboard.png";
import adminDashboardUsers from "@/assets/pitch/admin-dashboard-users.png";
import adminBeoordelingen from "@/assets/pitch/admin-beoordelingen.png";

const speakerNotes = [
  "SLIDE 1 - OPENING (5 min): Start interactief met handopsteken. Wie heeft bijbaantje? Wie werkt voor zichzelf? Wie heeft via uitzendbureau gewerkt? Dit creëert betrokkenheid en toont relevantie.",
  "SLIDE 2 - MIJN REIS (8 min): Loop chronologisch door de tijdlijn: 2018 KC Service, 2020 Corona, 2022 EXTRA, Starter vd Jaar, 2023 Dagbetaling/Payday ABN, 2025 EXTRAATJE, 2026 AI Planner.",
  "SLIDE 3 - WAT IS EXTRA (8 min): Leg uit wat we doen: hotels, events, 800+ mensen, dagbetaling. Vraag: wat vinden jullie belangrijk in een werkgever? Schrijf antwoorden op.",
  "SLIDE 4 - KWALITEIT (8 min): Toon sollicitatieformulier, leg uit hoe we softskills en hardskills meten. Vraag: waar zouden jullie op letten bij het aannemen van personeel?",
  "SLIDE 5 - SCORING (5 min): Elke medewerker krijgt een score na aanname. Planners zien wie geschikt is, wie training nodig heeft, en met wie we stoppen. Scores op hard- en softskills.",
  "SLIDE 6 - EXTRAATJE (10 min): Toon app screenshots, leg microprestaties en loyaliteitssysteem uit. Demo de pushnotificaties door te klikken.",
  "SLIDE 7 - AI TOEKOMST (8 min): Data → AI → perfecte match. Vraag: vertrouw jij AI meer dan een planner? Discussie over automatisering.",
  "SLIDE 8 - ONDERNEMEN (8 min): Deel ondernemerslessen. Alles kan als je er voor gaat. Stip op de horizon. Vraag: wat denken jullie dat voor mij het moeilijkst is?",
  "SLIDE 9 - Q&A (10 min): Open vragen, afsluiting met slogan. Bedank studenten voor hun tijd en interesse."
];

export default function BusinessPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [notifications, setNotifications] = useState<number[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [interactionStep, setInteractionStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const totalSlides = 14;

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
    if (currentSlide === 0 && interactionStep < 3) {
      setInteractionStep(prev => prev + 1);
    } else if (currentSlide === 5 && clickCount < 3) {
      setClickCount(prev => prev + 1);
      setNotifications(prev => [...prev, clickCount]);
    } else if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
      setClickCount(0);
      setNotifications([]);
      setInteractionStep(0);
    }
  }, [currentSlide, clickCount, interactionStep]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setClickCount(0);
      setNotifications([]);
      setInteractionStep(0);
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
    { emoji: "🚀", title: "Challenge behaald!", subtitle: "10 diensten voltooid (+500 pts)" },
    { emoji: "⭐", title: "Upgrade!", subtitle: "Je bent nu Gold status!" },
    { emoji: "🎁", title: "Beloning beschikbaar", subtitle: "Wissel je punten in voor kortingen" },
  ];

  const openingQuestions = [
    { question: "Wie heeft er een bijbaantje?", emoji: "✋" },
    { question: "Wie werkt er voor zichzelf?", emoji: "💼" },
    { question: "Wie heeft via een uitzendbureau gewerkt?", emoji: "🏢" },
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
              Business School Presentatie
            </motion.h1>
            
            <motion.p
              className="text-xl text-gray-400 mb-12 relative z-10"
              style={{ fontFamily: 'Poppins' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              60 minuten • Interactief • HBO Studenten
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
      
      {/* Creative 3D X Background Art */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-20"
          style={{ 
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          }}
        />
      </div>
      
      {/* Progress dots */}
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
        {/* SLIDE 0: Interactieve Opening */}
        {currentSlide === 0 && (
          <motion.div
            key="slide1-opening"
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

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <h2 className="text-2xl md:text-3xl text-gray-400 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Laten we beginnen met een vraag...
                </h2>
              </motion.div>
              
              <div className="space-y-6 mb-12">
                {openingQuestions.map((q, i) => (
                  <motion.div
                    key={q.question}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ 
                      opacity: i <= interactionStep ? 1 : 0.3, 
                      x: 0,
                      scale: i === interactionStep ? 1.05 : 1
                    }}
                    transition={{ delay: 0.4 + i * 0.2, duration: 0.5 }}
                    className={`flex items-center justify-center gap-6 p-6 rounded-2xl transition-all ${
                      i <= interactionStep 
                        ? "bg-gradient-to-r from-purple-600/30 to-pink-600/20 border border-purple-500/50" 
                        : "bg-gray-800/30 border border-gray-700/30"
                    }`}
                  >
                    <span className="text-4xl">{q.emoji}</span>
                    <span 
                      className={`text-2xl md:text-3xl ${i <= interactionStep ? "text-white" : "text-gray-500"}`}
                      style={{ fontFamily: 'Poppins', fontWeight: i === interactionStep ? 700 : 400 }}
                    >
                      {q.question}
                    </span>
                    {i < interactionStep && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              {interactionStep >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="mt-8"
                >
                  <h1
                    className="text-4xl md:text-6xl text-white leading-tight"
                    style={{ fontFamily: 'Poppins', fontWeight: 800 }}
                  >
                    "Wie goed is voor zijn personeel,
                    <br />
                    <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                      is goed voor ons."
                    </span>
                  </h1>
                </motion.div>
              )}

              {interactionStep < 3 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 1.5 }}
                  className="text-gray-500 text-sm mt-8"
                >
                  Klik om verder te gaan
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* SLIDE 1: Wat is EXTRA */}
        {currentSlide === 1 && (
          <motion.div
            key="slide2-watisextra"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-6xl text-white mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Wat is <span className="text-purple-400">EXTRA</span>?
                </h2>
                <p className="text-xl text-gray-400" style={{ fontFamily: 'Poppins' }}>
                  Uitzendbureau voor horeca en events
                </p>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {[
                  { icon: Hotel, title: "Hotels + Events", desc: "Werkgebied", delay: 0.3 },
                  { icon: Users, title: "800+", desc: "Medewerkers", delay: 0.4 },
                  { icon: Banknote, title: "Dagbetaling", desc: "Snelle uitbetaling", delay: 0.5 },
                  { icon: BadgeCheck, title: "NEN-4400-1", desc: "Gecertificeerd", delay: 0.6 },
                ].map((item) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: item.delay, duration: 0.5 }}
                    className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 text-center"
                  >
                    <div className="w-14 h-14 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-7 h-7 text-purple-400" />
                    </div>
                    <h3 className="text-white font-bold text-2xl mb-1" style={{ fontFamily: 'Poppins' }}>{item.title}</h3>
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>{item.desc}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-center"
              >
                <p className="text-gray-400 mb-6" style={{ fontFamily: 'Poppins' }}>Onze opdrachtgevers:</p>
                <div className="flex justify-center items-center gap-8 flex-wrap">
                  {[
                    { src: marriottLogo, alt: "Marriott", height: "h-12" },
                    { src: amrathLogo, alt: "Grand Hotel Amrâth", height: "h-16" },
                    { src: nhHotelsLogo, alt: "NH Hotels", height: "h-10" },
                    { src: fcUtrechtLogo, alt: "FC Utrecht", height: "h-14" },
                    { src: hetePeperLogo, alt: "Hete Peper", height: "h-8" },
                    { src: fundaLogo, alt: "Funda", height: "h-12" },
                  ].map((client, i) => (
                    <motion.div
                      key={client.alt}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + i * 0.1 }}
                      className="bg-white/95 rounded-xl px-4 py-3 flex items-center justify-center"
                    >
                      <img src={client.src} alt={client.alt} className={`${client.height} object-contain`} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className="mt-12 text-center"
              >
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-xl px-6 py-4">
                  <MessageCircle className="w-6 h-6 text-purple-400" />
                  <span className="text-purple-300 text-lg" style={{ fontFamily: 'Poppins' }}>
                    Vraag: Wat vinden jullie belangrijk in een werkgever?
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 3: Kwaliteit - Intake */}
        {currentSlide === 3 && (
          <motion.div
            key="slide3-kwaliteit"
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
                {/* iPad Mockup Horizontal */}
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
                      {/* Sollicitatieformulier screenshot in iPad frame */}
                      <div className="w-[320px] h-[420px] overflow-hidden bg-white rounded-b-lg">
                        <img 
                          src={sollicitatieformulier} 
                          alt="Sollicitatieformulier Beoordeling" 
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
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
                  Kwaliteit begint bij
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    de intake.
                  </span>
                </h2>
                
                <p className="text-xl text-gray-400" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  We beoordelen kandidaten op hard- en softskills.
                </p>

                <div className="space-y-4 pt-4">
                  {[
                    { icon: Star, text: "Softskills: houding, communicatie, motivatie", emoji: "😊", delay: 0.7 },
                    { icon: Award, text: "Hardskills: ervaring, diploma's, talen", emoji: "📚", delay: 0.85 },
                    { icon: Target, text: "Beoordelingsmatrix met scores", emoji: "📊", delay: 1.0 },
                  ].map((item) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.delay, duration: 0.5 }}
                      className="flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-5 py-3"
                    >
                      <span className="text-2xl">{item.emoji}</span>
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
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-purple-400" />
                      <p className="text-purple-300" style={{ fontFamily: 'Poppins' }}>
                        Waar zouden jullie op letten?
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 4: Scoring Dashboard */}
        {currentSlide === 4 && (
          <motion.div
            key="slide5-scoring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="flex items-center gap-12 max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex-1"
              >
                <h2 className="text-3xl md:text-4xl text-white leading-tight mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Data-gedreven
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    personeelsbeheer.
                  </span>
                </h2>
                
                <p className="text-lg text-gray-400 mb-6" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Na aanname krijgt elke medewerker een score op basis van hun prestaties.
                </p>

                <div className="space-y-4">
                  {[
                    { color: "bg-green-500", text: "Geschikt voor inzet", emoji: "✅", desc: "Hoge scores, direct inzetbaar" },
                    { color: "bg-yellow-500", text: "Training nodig", emoji: "📚", desc: "Potentie, maar extra begeleiding" },
                    { color: "bg-red-500", text: "Niet verder mee", emoji: "❌", desc: "Past niet bij de standaard" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                      className="flex items-center gap-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-5 py-3"
                    >
                      <div className={`w-4 h-4 ${item.color} rounded-full`} />
                      <div className="flex-1">
                        <span className="text-white font-medium">{item.text}</span>
                        <p className="text-gray-500 text-sm">{item.desc}</p>
                      </div>
                      <span className="text-xl">{item.emoji}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="mt-6 flex flex-wrap gap-3"
                >
                  {["Softskills", "Barscore", "Bedieningscore", "Dinerscore", "Taal"].map((skill, i) => (
                    <span 
                      key={skill}
                      className="bg-purple-600/20 border border-purple-500/40 text-purple-300 rounded-full px-4 py-1 text-sm"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      {skill}
                    </span>
                  ))}
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-shrink-0"
              >
                <div className="relative">
                  <div className="absolute -inset-6 bg-gradient-to-br from-purple-500/20 via-cyan-500/10 to-transparent rounded-2xl blur-xl" />
                  <div className="relative bg-gray-800/80 rounded-xl border border-gray-700/50 p-3 shadow-2xl">
                    <img 
                      src={scoringDashboard} 
                      alt="Medewerker Scoring Dashboard" 
                      className="w-[650px] rounded-lg"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm mt-4" style={{ fontFamily: 'Poppins' }}>
                    Live scoring dashboard
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 5: EXTRAATJE - App met Notificaties */}
        {currentSlide === 5 && (
          <motion.div
            key="slide6-extraatje"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="flex items-center gap-12 max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1"
              >
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/20 border border-purple-500/50 rounded-full px-4 py-2 mb-6">
                  <Gift className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">Beloningsplatform</span>
                </div>

                <h2 className="text-4xl md:text-5xl text-white leading-tight mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  EXTRAATJE:
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    Datagedreven beloning.
                  </span>
                </h2>
                
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Medewerkers verdienen punten voor microprestaties en bouwen loyaliteit op.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Trophy, title: "Challenges", desc: "Doelen behalen" },
                    { icon: Star, title: "Rankings", desc: "Competitie" },
                    { icon: Gift, title: "Beloningen", desc: "Punten inwisselen" },
                    { icon: Zap, title: "Real-time", desc: "Direct feedback" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4"
                    >
                      <item.icon className="w-6 h-6 text-purple-400 mb-2" />
                      <h4 className="text-white font-semibold" style={{ fontFamily: 'Poppins' }}>{item.title}</h4>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <div className="flex items-center gap-6">
                {/* Phone mockup with real app screenshot */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative"
                >
                  <div className="absolute -inset-6 bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-transparent rounded-[3rem] blur-2xl" />
                  <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-gray-800">
                    <img 
                      src={extraatjeApp} 
                      alt="EXTRAATJE App" 
                      className="w-56 rounded-[2rem] object-cover"
                    />
                  </div>
                </motion.div>

                {/* Notifications column */}
                <div className="flex flex-col gap-4 w-72">
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
            </div>
          </motion.div>
        )}

        {/* SLIDE 6: Kortingsacties */}
        {currentSlide === 6 && (
          <motion.div
            key="slide6-deals"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="flex items-center gap-16 max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-1"
              >
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600/30 to-emerald-600/20 border border-green-500/50 rounded-full px-4 py-2 mb-6">
                  <span className="text-lg">%</span>
                  <span className="text-green-300 text-sm font-medium">Exclusieve Deals</span>
                </div>

                <h2 className="text-4xl md:text-5xl text-white leading-tight mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Standaard
                  <br />
                  <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    personeelskorting.
                  </span>
                </h2>
                
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Al onze medewerkers krijgen automatisch exclusieve kortingen.
                </p>

                <div className="space-y-4">
                  {[
                    { brand: "TrainMore", discount: "30%", desc: "Fitness abonnement", color: "from-red-600 to-red-800", emoji: "💪" },
                    { brand: "Check", discount: "30 min", desc: "Gratis rijles", color: "from-orange-500 to-orange-700", emoji: "🚗" },
                    { brand: "GIG", discount: "25%", desc: "Hard seltzer", color: "from-purple-600 to-purple-800", emoji: "🍹" },
                  ].map((deal, i) => (
                    <motion.div
                      key={deal.brand}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className={`relative overflow-hidden bg-gradient-to-r ${deal.color} rounded-2xl p-5`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <p className="text-white/70 text-sm uppercase tracking-wide">{deal.desc}</p>
                          <p className="text-white text-2xl font-bold" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>{deal.brand}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-3xl font-bold" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>{deal.discount}</p>
                          <p className="text-white/70 text-sm">korting</p>
                        </div>
                        <span className="text-4xl ml-4">{deal.emoji}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="absolute -inset-6 bg-gradient-to-br from-green-500/30 via-emerald-500/20 to-transparent rounded-[3rem] blur-2xl" />
                <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-gray-800">
                  <img 
                    src={extraatjeDeals} 
                    alt="EXTRAATJE Deals" 
                    className="w-56 rounded-[2rem] object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 7: Challenges */}
        {currentSlide === 7 && (
          <motion.div
            key="slide7-challenges"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="flex items-center gap-16 max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-1"
              >
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-600/30 to-orange-600/20 border border-yellow-500/50 rounded-full px-4 py-2 mb-6">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-sm font-medium">Gamification</span>
                </div>

                <h2 className="text-4xl md:text-5xl text-white leading-tight mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Challenges maken
                  <br />
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    werk leuk.
                  </span>
                </h2>
                
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Medewerkers behalen doelen en verdienen extra punten.
                </p>

                <div className="space-y-4">
                  {[
                    { title: "Diensten Kampioen", desc: "Werk 10 diensten deze maand", points: "+500 pts", progress: 80, emoji: "🏆" },
                    { title: "Review Held", desc: "Krijg 5 positieve reviews", points: "+300 pts", progress: 60, emoji: "⭐" },
                    { title: "Vroege Vogel", desc: "5x op tijd aanwezig", points: "+200 pts", progress: 100, emoji: "🐦", completed: true },
                  ].map((challenge, i) => (
                    <motion.div
                      key={challenge.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className={`bg-gray-800/60 border ${challenge.completed ? 'border-green-500/50' : 'border-gray-700/50'} rounded-2xl p-5`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{challenge.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-bold" style={{ fontFamily: 'Poppins' }}>{challenge.title}</p>
                            <span className={`text-sm font-bold ${challenge.completed ? 'text-green-400' : 'text-yellow-400'}`}>{challenge.points}</span>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{challenge.desc}</p>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${challenge.progress}%` }}
                              transition={{ delay: 0.8 + i * 0.15, duration: 0.8 }}
                              className={`h-full rounded-full ${challenge.completed ? 'bg-green-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}
                            />
                          </div>
                        </div>
                        {challenge.completed && (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="absolute -inset-6 bg-gradient-to-br from-yellow-500/30 via-orange-500/20 to-transparent rounded-[3rem] blur-2xl" />
                <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-gray-800">
                  <img 
                    src={extraatjeChallenges} 
                    alt="EXTRAATJE Challenges" 
                    className="w-56 rounded-[2rem] object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 8: Leaderboard */}
        {currentSlide === 8 && (
          <motion.div
            key="slide8-leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="flex items-center gap-16 max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-1"
              >
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/20 border border-purple-500/50 rounded-full px-4 py-2 mb-6">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">Ranglijst</span>
                </div>

                <h2 className="text-4xl md:text-5xl text-white leading-tight mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Competitie
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    stimuleert prestatie.
                  </span>
                </h2>
                
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  Maandelijkse ranglijst met de beste presteerders.
                </p>

                <div className="flex items-end justify-center gap-4 mb-8">
                  {[
                    { place: 2, name: "Sophie", pts: "420 pts", color: "bg-gray-400", height: "h-28" },
                    { place: 1, name: "Jij! 🎉", pts: "485 pts", color: "bg-gradient-to-b from-yellow-400 to-yellow-600", height: "h-36" },
                    { place: 3, name: "Peter", pts: "380 pts", color: "bg-orange-700", height: "h-24" },
                  ].map((person, i) => (
                    <motion.div
                      key={person.place}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className="text-center"
                    >
                      <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-lg border-2 border-purple-400">
                        {person.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="text-white text-sm font-medium mb-1">{person.name}</p>
                      <p className="text-purple-400 text-xs mb-2">{person.pts}</p>
                      <div className={`w-20 ${person.height} ${person.color} rounded-t-xl flex items-start justify-center pt-2`}>
                        <span className="text-white text-2xl font-bold">{person.place}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏅</span>
                    <div>
                      <p className="text-white font-medium">Top 3 krijgt extra beloning!</p>
                      <p className="text-gray-400 text-sm">Elke maand nieuwe kansen</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="absolute -inset-6 bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-transparent rounded-[3rem] blur-2xl" />
                <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-gray-800">
                  <img 
                    src={extraatjeLeaderboard} 
                    alt="EXTRAATJE Leaderboard" 
                    className="w-56 rounded-[2rem] object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 9: Admin Dashboard */}
        {currentSlide === 9 && (
          <motion.div
            key="slide9-admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center p-8"
          >
            <div className="max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-10"
              >
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600/30 to-blue-600/20 border border-cyan-500/50 rounded-full px-4 py-2 mb-4">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-300 text-sm font-medium">Admin Dashboard</span>
                </div>
                <h2 className="text-4xl md:text-5xl text-white leading-tight" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Alle data op
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent ml-3">
                    één plek.
                  </span>
                </h2>
              </motion.div>

              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Totaal Gebruikers", value: "847", icon: Users, color: "text-purple-400", trend: "+12%" },
                  { label: "Actieve Medewerkers", value: "623", icon: CheckCircle2, color: "text-green-400", trend: "+8%" },
                  { label: "Uitgegeven Punten", value: "125K", icon: Sparkles, color: "text-yellow-400", trend: "+23%" },
                  { label: "Challenges Voltooid", value: "2,451", icon: Trophy, color: "text-orange-400", trend: "+45%" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      <span className="text-green-400 text-sm font-medium">{stat.trend}</span>
                    </div>
                    <p className="text-3xl text-white font-bold mb-1" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>{stat.value}</p>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="col-span-2 bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5"
                >
                  <h3 className="text-white font-bold mb-4" style={{ fontFamily: 'Poppins' }}>Top Presteerders</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Jan Jansen", points: "3,450 pts", badge: "🥇", status: "Gold" },
                      { name: "Sophie de Vries", points: "2,890 pts", badge: "🥈", status: "Silver" },
                      { name: "Peter van Dam", points: "2,340 pts", badge: "🥉", status: "Bronze" },
                    ].map((user, i) => (
                      <div key={user.name} className="flex items-center justify-between bg-gray-900/50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{user.badge}</span>
                          <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-gray-500 text-sm">{user.status} Status</p>
                          </div>
                        </div>
                        <span className="text-purple-400 font-bold">{user.points}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-5"
                >
                  <h3 className="text-white font-bold mb-4" style={{ fontFamily: 'Poppins' }}>Recente Activiteit</h3>
                  <div className="space-y-3">
                    {[
                      { action: "Challenge voltooid", user: "Emma", time: "2 min", emoji: "🏆" },
                      { action: "Punten uitgegeven", user: "Lucas", time: "5 min", emoji: "💰" },
                      { action: "Nieuwe badge", user: "Sophie", time: "12 min", emoji: "⭐" },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-lg">{activity.emoji}</span>
                        <div className="flex-1">
                          <p className="text-gray-300">{activity.action}</p>
                          <p className="text-gray-500 text-xs">{activity.user} • {activity.time} geleden</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 10: Dashboard Screenshots */}
        {currentSlide === 10 && (
          <motion.div
            key="slide10-dashboard-screens"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl text-white leading-tight" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Compleet
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent ml-2">
                  inzicht.
                </span>
              </h2>
              <p className="text-gray-400 mt-2" style={{ fontFamily: 'Poppins' }}>
                Van overzicht tot individuele beoordelingen
              </p>
            </motion.div>

            <div className="flex gap-8 max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex-1"
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 via-cyan-500/10 to-transparent rounded-2xl blur-xl" />
                  <div className="relative bg-gray-800/80 rounded-xl border border-gray-700/50 p-2 shadow-2xl">
                    <img 
                      src={adminDashboardUsers} 
                      alt="Admin Dashboard Gebruikers" 
                      className="w-full rounded-lg"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm mt-3" style={{ fontFamily: 'Poppins' }}>
                    Gebruikersbeheer met punten & functies
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="w-80"
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-transparent rounded-2xl blur-xl" />
                  <div className="relative bg-gray-800/80 rounded-xl border border-gray-700/50 p-2 shadow-2xl">
                    <img 
                      src={adminBeoordelingen} 
                      alt="Medewerker Beoordelingen" 
                      className="w-full rounded-lg"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm mt-3" style={{ fontFamily: 'Poppins' }}>
                    Individuele prestaties & reviews
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 11: AI Toekomst */}
        {currentSlide === 11 && (
          <motion.div
            key="slide5-ai"
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
                <span className="text-purple-300 text-sm font-medium">De Toekomst</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl text-white leading-tight mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Data → AI →
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  Perfecte Match
                </span>
              </h2>
            </motion.div>

            {/* Animated flow */}
            <div className="flex items-center gap-4 mb-12">
              {[
                { icon: Building2, label: "Data" },
                { icon: ArrowRight, label: "" },
                { icon: Brain, label: "AI" },
                { icon: ArrowRight, label: "" },
                { icon: Users, label: "Match" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.15, type: "spring" }}
                  className={item.label ? "flex flex-col items-center" : ""}
                >
                  {item.label ? (
                    <>
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-600/40 to-purple-800/40 border border-purple-500/50 rounded-2xl flex items-center justify-center">
                        <item.icon className="w-10 h-10 text-purple-400" />
                      </div>
                      <span className="text-white mt-2 font-medium">{item.label}</span>
                    </>
                  ) : (
                    <item.icon className="w-8 h-8 text-purple-500" />
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex gap-6 max-w-4xl w-full mb-10">
              {[
                { icon: Star, title: "Scores", desc: "Beoordelingen & ratings" },
                { icon: Clock, title: "Betrouwbaarheid", desc: "Punctualiteit & no-shows" },
                { icon: Award, title: "Ervaring", desc: "Skills & trainingen" },
                { icon: Calendar, title: "Beschikbaarheid", desc: "Real-time updates" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                  className="flex-1 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5"
                >
                  <item.icon className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-white font-semibold text-lg mb-1" style={{ fontFamily: 'Poppins' }}>{item.title}</h3>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-xl px-6 py-4">
                <MessageCircle className="w-6 h-6 text-purple-400" />
                <span className="text-purple-300 text-lg" style={{ fontFamily: 'Poppins' }}>
                  Vertrouw jij AI meer dan een planner?
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SLIDE 2: Mijn Reis - Tijdlijn (7 milestones) */}
        {currentSlide === 2 && (
          <motion.div
            key="slide2-tijdlijn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl md:text-4xl text-white leading-tight mb-2" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Mijn <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">reis</span>
              </h2>
              <p className="text-lg text-gray-400" style={{ fontFamily: 'Poppins' }}>
                Van idee naar ondernemer
              </p>
            </motion.div>

            {/* Timeline with 7 milestones */}
            <div className="relative w-full max-w-6xl px-4">
              {/* Timeline line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 1.2 }}
                className="absolute top-[24px] left-0 right-0 h-1 bg-gradient-to-r from-purple-600/50 via-cyan-500 to-green-500/50 rounded-full origin-left"
              />

              <div className="flex justify-between items-start relative">
                {/* 2018 - KC Service */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center flex-1"
                >
                  <div className="w-5 h-5 bg-purple-600 rounded-full border-3 border-gray-900 shadow-lg shadow-purple-500/50 mb-3 z-10" />
                  <div className="bg-gray-800/80 border border-purple-500/30 rounded-lg p-2 text-center w-[100px]">
                    <p className="text-purple-400 font-bold text-lg mb-1" style={{ fontFamily: 'Poppins' }}>2018</p>
                    <img src={kcServiceLogo} alt="KC Service" className="h-8 mx-auto mb-1" style={{ filter: 'brightness(1.2)' }} />
                    <p className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins' }}>De start</p>
                  </div>
                </motion.div>

                {/* 2020 - Corona */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center flex-1"
                >
                  <div className="w-5 h-5 bg-red-500 rounded-full border-3 border-gray-900 shadow-lg shadow-red-500/50 mb-3 z-10" />
                  <div className="bg-gray-800/80 border border-red-500/30 rounded-lg p-2 text-center w-[100px]">
                    <p className="text-red-400 font-bold text-lg mb-1" style={{ fontFamily: 'Poppins' }}>2020</p>
                    <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Poppins' }}>Corona</p>
                    <p className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins' }}>Reset</p>
                  </div>
                </motion.div>

                {/* Feb 2022 - EXTRA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col items-center flex-1"
                >
                  <div className="w-5 h-5 bg-cyan-500 rounded-full border-3 border-gray-900 shadow-lg shadow-cyan-500/50 mb-3 z-10" />
                  <div className="bg-gray-800/80 border border-cyan-500/30 rounded-lg p-2 text-center w-[100px]">
                    <p className="text-cyan-400 font-bold text-lg mb-1" style={{ fontFamily: 'Poppins' }}>Feb '22</p>
                    <img src={extraLogoBlauw} alt="EXTRA" className="h-6 mx-auto mb-1" />
                    <p className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins' }}>Geboren</p>
                  </div>
                </motion.div>

                {/* Jun 2022 - Starter vd Jaar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col items-center flex-1"
                >
                  <div className="w-5 h-5 bg-yellow-500 rounded-full border-3 border-gray-900 shadow-lg shadow-yellow-500/50 mb-3 z-10" />
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/50 rounded-lg p-2 text-center w-[100px]">
                    <p className="text-yellow-400 font-bold text-lg mb-1" style={{ fontFamily: 'Poppins' }}>Jun '22</p>
                    <img src={starterVanHetJaar} alt="Starter vd Jaar" className="h-8 mx-auto mb-1" />
                    <p className="text-gray-300 text-xs" style={{ fontFamily: 'Poppins' }}>Runner-up</p>
                  </div>
                </motion.div>

                {/* Feb 2023 - Dagbetaling / Payday */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-col items-center flex-1"
                >
                  <div className="w-5 h-5 bg-emerald-500 rounded-full border-3 border-gray-900 shadow-lg shadow-emerald-500/50 mb-3 z-10" />
                  <div className="bg-gray-800/80 border border-emerald-500/30 rounded-lg p-2 text-center w-[100px]">
                    <p className="text-emerald-400 font-bold text-lg mb-1" style={{ fontFamily: 'Poppins' }}>Feb '23</p>
                    <img src={abnAmroLogo} alt="ABN Amro" className="h-6 mx-auto mb-1" />
                    <p className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins' }}>Payday</p>
                  </div>
                </motion.div>

                {/* 2025 - EXTRAATJE */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex flex-col items-center flex-1"
                >
                  <div className="w-5 h-5 bg-pink-500 rounded-full border-3 border-gray-900 shadow-lg shadow-pink-500/50 mb-3 z-10" />
                  <div className="bg-gray-800/80 border border-pink-500/30 rounded-lg p-2 text-center w-[100px]">
                    <p className="text-pink-400 font-bold text-lg mb-1" style={{ fontFamily: 'Poppins' }}>2025</p>
                    <Gift className="w-6 h-6 text-pink-400 mx-auto mb-1" />
                    <p className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins' }}>EXTRAATJE</p>
                  </div>
                </motion.div>

                {/* 2026 - AI Planner */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="flex flex-col items-center flex-1"
                >
                  <div className="w-5 h-5 bg-blue-500 rounded-full border-3 border-gray-900 shadow-lg shadow-blue-500/50 mb-3 z-10" />
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-blue-500/50 rounded-lg p-2 text-center w-[100px]">
                    <p className="text-blue-400 font-bold text-lg mb-1" style={{ fontFamily: 'Poppins' }}>2026</p>
                    <Brain className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                    <p className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins' }}>AI Planner</p>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="mt-6 text-center"
            >
              <p className="text-purple-400 text-lg mb-6" style={{ fontFamily: 'Poppins' }}>
                8 jaar van groeien, vallen en opstaan
              </p>
              
              <div className="flex justify-center gap-4 flex-wrap max-w-4xl mx-auto">
                {[
                  { text: "Hobbels die je niet verwacht", emoji: "🪨" },
                  { text: "Flexibel inspelen op het moment", emoji: "🔄" },
                  { text: "Blijf leren, in elk stadium", emoji: "📚" },
                ].map((lesson, i) => (
                  <motion.div
                    key={lesson.text}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.5 + i * 0.15 }}
                    className="bg-gray-800/60 border border-purple-500/30 rounded-xl px-4 py-2 flex items-center gap-2"
                  >
                    <span className="text-lg">{lesson.emoji}</span>
                    <span className="text-gray-300 text-sm" style={{ fontFamily: 'Poppins' }}>{lesson.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SLIDE 12: Ondernemen in de Praktijk */}
        {currentSlide === 12 && (
          <motion.div
            key="slide7-ondernemen"
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
              <h2 className="text-4xl md:text-6xl text-white leading-tight mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Ondernemen
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  in de praktijk.
                </span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-3 gap-8 max-w-5xl mb-12">
              {[
                { icon: Lightbulb, title: "Alles kan", desc: "Als je er voor gaat", color: "from-yellow-500/20 to-orange-500/20", borderColor: "border-yellow-500/50" },
                { icon: Target, title: "Stip op de horizon", desc: "Weet waar je naartoe werkt", color: "from-blue-500/20 to-purple-500/20", borderColor: "border-blue-500/50" },
                { icon: TrendingUp, title: "Blijf groeien", desc: "Leren van uitdagingen", color: "from-green-500/20 to-emerald-500/20", borderColor: "border-green-500/50" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.15, duration: 0.6 }}
                  className={`bg-gradient-to-br ${item.color} backdrop-blur-xl border ${item.borderColor} rounded-2xl p-8 text-center`}
                >
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-2xl mb-2" style={{ fontFamily: 'Poppins' }}>{item.title}</h3>
                  <p className="text-gray-300" style={{ fontFamily: 'Poppins' }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-xl px-6 py-4">
                <MessageCircle className="w-6 h-6 text-purple-400" />
                <span className="text-purple-300 text-lg" style={{ fontFamily: 'Poppins' }}>
                  Wat denken jullie dat voor mij het moeilijkst is?
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SLIDE 13: Q&A + Slogan */}
        {currentSlide === 13 && (
          <motion.div
            key="slide7-qa"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-12"
            >
              <img src={extraLogoWit} alt="EXTRA" className="h-20 md:h-24" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-center max-w-4xl mb-16"
            >
              <h1
                className="text-5xl md:text-7xl text-white leading-tight mb-8"
                style={{ fontFamily: 'Poppins', fontWeight: 800 }}
              >
                "Goed voor je mensen.
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  Sterk voor je klant."
                </span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-6"
            >
              <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/20 border border-purple-500/50 rounded-2xl px-8 py-6 text-center">
                <MessageCircle className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <h3 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: 'Poppins' }}>Vragen?</h3>
                <p className="text-gray-400" style={{ fontFamily: 'Poppins' }}>Nu is jullie moment!</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2"
            >
              <p className="text-gray-500 text-lg" style={{ fontFamily: 'Poppins' }}>
                Bedankt voor jullie tijd en interesse!
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
