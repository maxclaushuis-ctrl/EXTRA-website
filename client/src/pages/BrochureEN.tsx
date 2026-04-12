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

import extraLogoWit from "../assets/pitch/extra-logo-wit.webp";
import extraXShape from "../assets/pitch/extra-x-shape.webp";

import nhLogo from "../assets/pitch/nh-hotels-logo.webp";
import marriottLogo from "../assets/pitch/marriott-logo.webp";
import amrathLogo from "../assets/pitch/amrath-logo.webp";

import extraatjeApp from "../assets/pitch/extraatje-app.webp";
import extraatjeChallenges from "../assets/pitch/extraatje-challenges.webp";
import scoringDashboardNew from "../assets/pitch/scoring-dashboard-new.webp";
import intakeBeoordeling from "../assets/pitch/intake-beoordeling.webp";
import adminGebruikers from "../assets/pitch/admin-gebruikers.webp";
import beoordelingenStatistieken from "../assets/pitch/beoordelingen-statistieken.webp";
import ipadIntakeComplete from "../assets/pitch/ipad-intake-complete.webp";
import logoPulitzer from "@assets/Logo_Pulitzer_1773389329669.webp";
import logoRadisson from "../assets/pitch/logo-radisson.webp";
import logoHilton from "../assets/pitch/logo-hilton.webp";

export default function BrochureEN() {
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
              Delivering the{" "}
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                EXTRA
              </span>{" "}standard your guests expect
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-400 mb-12 text-center"
              style={{ fontFamily: 'Poppins' }}
            >
              Your partner in quality hotel staffing
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center gap-6"
            >
              {[
                { icon: BadgeCheck, text: "NEN-4400-1 Certified" },
                { icon: Users, text: "800+ Staff Members" },
                { icon: Gift, text: "Loyalty Program" },
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

        {/* SLIDE 1: Our Services */}
        {currentSlide === 1 && (
          <motion.div
            key="slide-services"
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
                <span className="text-cyan-300 text-sm" style={{ fontFamily: 'Poppins' }}>What we provide</span>
              </div>
              <h2 className="text-4xl md:text-6xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Our <span className="text-cyan-400">services</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
                Specialized staff for every department of your hotel
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-6 max-w-6xl">
              {[
                {
                  emoji: "🛏️",
                  title: "Housekeeping",
                  desc: "Our housekeeping team ensures a spotless guest experience. Always tidy, swift, and with EXTRA attention to detail.",
                  color: "from-blue-600 to-blue-800"
                },
                {
                  emoji: "👨‍🍳",
                  title: "Kitchen",
                  desc: "From dishwashing to sous-chef: experienced staff who keep your kitchen running, even during peak hours.",
                  color: "from-orange-600 to-orange-800"
                },
                {
                  emoji: "🍽️",
                  title: "Banqueting",
                  desc: "Professional service for banquets, conferences, breakfast, and lunch. Flexible, presentable, and always EXTRA guest-focused.",
                  color: "from-purple-600 to-purple-800"
                },
                {
                  emoji: "🛎️",
                  title: "Front-office",
                  desc: "Reception and guest services for a warm welcome and an EXTRA smooth check-in experience.",
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

        {/* SLIDE 2: Quality */}
        {currentSlide === 2 && (
          <motion.div
            key="slide-quality"
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
                <span className="text-purple-300 text-sm" style={{ fontFamily: 'Poppins' }}>Our promise</span>
              </div>
              <h2 className="text-4xl md:text-6xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                <span className="text-purple-400">Quality</span> comes first
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
                We select, train, and retain the best people for your hotel
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl">
              {[
                {
                  icon: UserCheck,
                  title: "Thorough screening",
                  desc: "Every candidate meets with us in person and is evaluated on both soft and hard skills",
                  color: "from-purple-600 to-purple-800"
                },
                {
                  icon: Award,
                  title: "Rewards program",
                  desc: "More loyal staff through micro-performance rewards. Higher scores mean more points",
                  color: "from-pink-600 to-pink-800"
                },
                {
                  icon: Star,
                  title: "Continuous feedback",
                  desc: "Every shift is rated. This keeps us sharp on quality at all times",
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

        {/* SLIDE 3: Qualification Process */}
        {currentSlide === 3 && (
          <motion.div
            key="slide-qualification"
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
                  <span className="text-purple-300 text-sm" style={{ fontFamily: 'Poppins' }}>Selection process</span>
                </div>
                <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  Our <span className="text-purple-400">qualification process</span>
                </h2>
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
                  Every candidate is assessed on soft and hard skills during the intake interview
                </p>

                <div className="space-y-4 mb-6">
                  {[
                    { label: "Soft skills", desc: "Attitude & communication", icon: "💬" },
                    { label: "Hard skills", desc: "Experience & expertise", icon: "🎯" },
                    { label: "Rating", desc: "Top performer / Good impression / Average", icon: "⭐" },
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
                  alt="iPad with qualification form" 
                  className="w-full max-w-xl"
                  style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.4))' }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 4: EXTRAATJE Points System */}
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
                  <span className="text-pink-400">Loyal</span> staff through rewards
                </h2>
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
                  Our unique rewards system motivates staff to go the extra mile. Everything is measurable.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { icon: Target, value: "Challenges", desc: "Achieve goals" },
                    { icon: Trophy, value: "Points", desc: "Collect" },
                    { icon: Gift, value: "Rewards", desc: "Redeem" },
                    { icon: TrendingUp, value: "Leaderboard", desc: "Competition" },
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
                    "Staff earn points per shift",
                    "Bonus points for extra effort",
                    "Redeemable for rewards & discounts"
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

        {/* SLIDE 5: Shift Ratings */}
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
                <span className="text-orange-300 text-sm" style={{ fontFamily: 'Poppins' }}>Continuous feedback</span>
              </div>
              <h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Every shift <span className="text-orange-400">rated</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
                After every shift, staff receive a performance rating. Real-time insight into performance.
              </p>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-8 max-w-6xl w-full items-start justify-center">
              {/* Left column - smaller */}
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
                      <h4 className="text-white font-bold text-base" style={{ fontFamily: 'Poppins' }}>Staff overview</h4>
                      <p className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins' }}>Management & scores</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-700/50 shadow-inner">
                    <img 
                      src={adminGebruikers} 
                      alt="Staff management with ratings" 
                      className="w-full object-contain"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Right column - larger */}
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
                      <h4 className="text-white font-bold text-base" style={{ fontFamily: 'Poppins' }}>Individual statistics</h4>
                      <p className="text-gray-400 text-xs" style={{ fontFamily: 'Poppins' }}>Shifts, no-shows, ratings</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-700/50 shadow-inner">
                    <img 
                      src={beoordelingenStatistieken} 
                      alt="Staff statistics" 
                      className="w-full object-contain"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SLIDE 6: Familiar Faces */}
        {currentSlide === 6 && (
          <motion.div
            key="slide-continuity"
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
                  <span className="text-cyan-300 text-sm" style={{ fontFamily: 'Poppins' }}>Continuity</span>
                </div>
                <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  The same <span className="text-cyan-400">faces</span>, every time
                </h2>
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
                  No endless onboarding. We ensure you see the same staff who already know your hotel.
                </p>
                
                <div className="space-y-4">
                  {[
                    "Build your own favorites pool",
                    "Staff know your procedures",
                    "No time lost on training",
                    "Higher productivity from day one"
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
                      <h4 className="text-white font-bold text-lg" style={{ fontFamily: 'Poppins' }}>Your dedicated team</h4>
                      <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>Matched staff members</p>
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

        {/* SLIDE 7: Compliance */}
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
                Complete <span className="text-emerald-400">peace of mind</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
                We handle all regulatory concerns so you don't have to
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
              {[
                {
                  icon: BadgeCheck,
                  title: "NEN-4400-1",
                  desc: "Fully certified for labor law and tax compliance",
                  highlight: true
                },
                {
                  icon: Shield,
                  title: "100% Employed",
                  desc: "All our staff are on payroll. No risk of false self-employment",
                  highlight: false
                },
                {
                  icon: CheckCircle2,
                  title: "Waadi Check",
                  desc: "Registered in the SNA's Waadi register",
                  highlight: false
                },
                {
                  icon: Users,
                  title: "Work Permit Control",
                  desc: "Strict verification of work permits",
                  highlight: false
                },
                {
                  icon: Award,
                  title: "Insurance",
                  desc: "Fully insured. You carry no risk whatsoever",
                  highlight: false
                },
                {
                  icon: Clock,
                  title: "Worry-free",
                  desc: "We handle all administration for you",
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

        {/* SLIDE 8: Personal Contact */}
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
                      <h4 className="text-white font-bold" style={{ fontFamily: 'Poppins' }}>Direct line</h4>
                      <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>No queues, no phone menus</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: Phone, title: "Phone", desc: "Call your dedicated contact person directly" },
                      { icon: MessageCircle, title: "WhatsApp", desc: "Response within one hour" },
                      { icon: Clock, title: "7 days a week", desc: "Available on weekends too" },
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
                  <span className="text-pink-300 text-sm" style={{ fontFamily: 'Poppins' }}>Always available</span>
                </div>
                <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                  <span className="text-pink-400">Direct lines</span>, fast action
                </h2>
                <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
                  No queues or phone menus. At EXTRA, you have a dedicated contact person who knows your hotel.
                </p>
                
                <div className="space-y-4">
                  {[
                    "Dedicated account manager for your location",
                    "Direct contact, no runarounds",
                    "Proactive communication",
                    "Quick solutions when issues arise"
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

        {/* SLIDE 9: Clients */}
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
                <span className="text-yellow-300 text-sm" style={{ fontFamily: 'Poppins' }}>Our clients</span>
              </div>
              <h2 className="text-4xl md:text-6xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                In good <span className="text-yellow-400">company</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
                Leading hotels trust EXTRA
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
                Ready to <span className="text-purple-400">get started</span>?
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-gray-400 mb-10"
                style={{ fontFamily: 'Poppins' }}
              >
                Discover how EXTRA takes your staffing worries away
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
                  +31 85 130 59 15
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
                className="mt-8 text-gray-500 text-sm"
                style={{ fontFamily: 'Poppins' }}
              >
                www.doehetextra.nl
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
