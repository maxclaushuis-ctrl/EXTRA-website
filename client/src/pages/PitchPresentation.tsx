import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hotel, Banknote, Heart, Star, Zap, Award, Clock, Users, Sparkles, ChevronRight, Brain } from "lucide-react";

import appHome from "@/assets/pitch/app-home.png";
import appChallenges from "@/assets/pitch/app-challenges.png";
import appRewards from "@/assets/pitch/app-rewards.png";
import appRanking from "@/assets/pitch/app-ranking.png";
import adminDashboard from "@/assets/pitch/admin-dashboard.png";
import sollicitatieStart from "@/assets/pitch/sollicitatie-start.png";
import extraLogoWit from "@/assets/pitch/extra-logo-wit.png";

const speakerNotes = [
  "SLIDE 1 (35s): Start met de kern - onze filosofie. We geloven dat goed personeel de basis is van elk succesvol hotel of event. Daarom behandelen we onze mensen als partners, niet als nummers. Dagbetaling, transparantie, en zelfs social impact via de Voedselbank.",
  "SLIDE 2 (40s): Dit is EXTRAATJE, onze medewerker-app. Elke medewerker bouwt status op, van Bronze naar Diamond. Ze verdienen punten door goed te presteren en kunnen die inwisselen voor echte beloningen. Dit zorgt voor loyaliteit en motivatie.",
  "SLIDE 3 (30s): [KLIK VOOR NOTIFICATIES] Zo voelt het om met EXTRAATJE te werken. Real-time feedback, direct in je broekzak. Elke prestatie wordt gezien en beloond. Dat motiveert enorm.",
  "SLIDE 4 (40s): Voor onze opdrachtgevers: volledige transparantie. We meten alles - ratings, punctualiteit, houding. Zo bouwen we per medewerker een betrouwbaarheidsprofiel. Kwaliteit die je kunt bewijzen.",
  "SLIDE 5 (35s): Alles begint bij een goede intake. Links ons sollicitatieformulier op iPad. Rechts onze toekomstvisie: AI-gestuurde planning op basis van alle data die we verzamelen. 10x sneller, en altijd de beste match."
];

export default function PitchPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [notifications, setNotifications] = useState<number[]>([]);
  
  const totalSlides = 5;

  const nextSlide = useCallback(() => {
    if (currentSlide === 2 && clickCount < 3) {
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
      className="fixed inset-0 bg-gray-950 overflow-hidden cursor-pointer select-none"
      onClick={nextSlide}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/50 via-gray-950 to-gray-950" />
      
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
        {currentSlide === 0 && (
          <motion.div
            key="slide1"
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
                "Wie goed is voor je personeel,
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  is goed voor ons."
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-xl md:text-2xl text-gray-400 mb-16"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Daarom bouwen we EXTRA: betrouwbaarheid op schaal voor hotels én events.
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

        {currentSlide === 1 && (
          <motion.div
            key="slide2"
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
                  EXTRAATJE:
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    waardering die je elke dag voelt.
                  </span>
                </h2>
                
                <div className="flex gap-4 text-lg text-gray-300" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                  <span className="text-purple-400">Waardering</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-purple-400">Structuur</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-purple-400">Loyaliteit</span>
                </div>

                <div className="space-y-4 pt-6">
                  {[
                    { icon: Award, text: "Status (Gold → Diamond)", delay: 0.6 },
                    { icon: Zap, text: "Challenges & progress", delay: 0.75 },
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

        {currentSlide === 2 && (
          <motion.div
            key="slide3"
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

        {currentSlide === 3 && (
          <motion.div
            key="slide4"
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
              <h2 className="text-4xl md:text-5xl text-white mb-3" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Wat je meet, kun je <span className="text-purple-400">verbeteren.</span>
              </h2>
              <p className="text-xl text-gray-400" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                We bouwen per medewerker een performance-profiel.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative max-w-5xl w-full"
            >
              <div className="absolute -inset-4 bg-gradient-to-b from-purple-500/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-gray-800/50 rounded-2xl p-3 border border-gray-700/50 shadow-2xl">
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-gray-500 text-xs ml-2">EXTRAATJE Admin Dashboard</span>
                  </div>
                  <img
                    src={adminDashboard}
                    alt="Admin Dashboard"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center gap-4 mt-8 flex-wrap">
              {[
                { icon: Star, text: "Ratings na elke dienst" },
                { icon: Clock, text: "Op tijd, kleding, houding" },
                { icon: Users, text: "Favorietenpoules" },
                { icon: Award, text: "NEN-4400-1" },
              ].map((badge, i) => (
                <motion.div
                  key={badge.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl"
                >
                  <badge.icon className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 text-sm font-medium">{badge.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {currentSlide === 4 && (
          <motion.div
            key="slide5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8"
          >
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl text-white text-center mb-10"
              style={{ fontFamily: 'Poppins', fontWeight: 800 }}
            >
              Kwaliteit begint bij de intake.
              <br />
              <span className="text-purple-400">En eindigt bij AI-planning.</span>
            </motion.h2>

            <div className="flex items-center gap-12 max-w-6xl w-full">
              <motion.div
                initial={{ opacity: 0, x: -50, rotateX: 10 }}
                animate={{ opacity: 1, x: 0, rotateX: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-1 flex justify-center"
              >
                <div className="relative" style={{ perspective: '1200px' }}>
                  <div 
                    className="absolute -inset-8 bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent rounded-[2rem] blur-2xl"
                    style={{ transform: 'rotateX(50deg) rotateZ(-5deg) translateZ(-20px)' }}
                  />
                  <div 
                    className="relative"
                    style={{ 
                      transform: 'rotateX(25deg) rotateZ(-3deg)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <div 
                      className="absolute -bottom-8 left-4 right-4 h-16 bg-black/40 rounded-[2rem] blur-2xl"
                      style={{ transform: 'translateZ(-30px)' }}
                    />
                    <div className="relative bg-gray-800 rounded-[1.5rem] p-3 border-2 border-gray-700 shadow-2xl" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)' }}>
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
                  </div>
                  <p className="text-center text-gray-400 text-sm mt-10" style={{ fontFamily: 'Poppins' }}>iPad Sollicitatieformulier</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center"
              >
                <ChevronRight className="w-8 h-8 text-purple-500" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex-1"
              >
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-white font-semibold">AI Match Engine</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {["Scores", "Ratings", "Betrouwbaarheid", "Ervaring"].map((input, i) => (
                      <motion.div
                        key={input}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700/50"
                      >
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-300 text-sm">{input}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 }}
                    className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-xl p-4"
                  >
                    <p className="text-white font-semibold text-center">
                      Automatische planning op kwaliteit
                    </p>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="text-purple-400 text-sm text-center mt-4 font-medium"
                  >
                    10x sneller plannen dan handmatig
                  </motion.p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="mt-12 text-center"
            >
              <p className="text-3xl md:text-4xl bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                "Goed voor je mensen. Sterk voor je klant."
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
