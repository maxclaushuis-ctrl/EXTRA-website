import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Users, Trophy, Gift, Star, ChevronDown, ChevronUp,
  TrendingUp, Shield, Clock,
  ArrowRight, Check, Menu, X, Briefcase, UserCheck, CreditCard,
  Award, Handshake, Phone, Sparkles, Heart, Zap,
  Building2, UtensilsCrossed, PartyPopper, Wine, MessageCircle
} from "lucide-react";
import heroBgImage from "@assets/hero-background.png";
import xPatroon from "@assets/X_patroon_1771260543289.png";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";
import screenDashboard from "@assets/IMG_8803_1770915286475.png";
import screenRewards from "@assets/IMG_8805_1770915286475.png";
import screenChallenges from "@assets/IMG_8807_1770915286475.png";
import screenRanglijst from "@assets/IMG_8808_1770915286475.png";
import logoAmrath from "@assets/Logo_amrath_1771267205959.png";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.png";
import logoFunda from "@assets/Logo_funda_1771267205959.png";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.png";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.png";
import logoHilton from "@assets/Logo_Hilton_1771267205959.png";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.png";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.png";
import logoAppel from "@assets/Logo-Appel_1771267205959.png";
import blogHousekeeping from "../assets/images/blog-housekeeping.jpg";
import blogCatering from "../assets/images/blog-catering.jpg";
import blogBarista from "../assets/images/blog-barista.jpg";
import blogTeam from "../assets/images/blog-team.jpg";
import blogHotel from "../assets/images/blog-hotel.jpg";
import dienstChefPng from "@assets/Chef_1771833440047.png";
import dienstHoreca from "@assets/Horecamedewerker_1771836004844.png";
import dienstFrontoffice from "@assets/ChatGPT_Image_23_feb_2026,_10_19_13_1771838461343.png";
import dienstHousekeeping from "../assets/images/dienst-housekeeping.jpg";

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
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
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CountUp({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal();
  const hasDecimal = target % 1 !== 0;
  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else { setCount(hasDecimal ? Math.round(start * 10) / 10 : Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target, duration, hasDecimal]);
  return <span ref={ref}>{hasDecimal ? count.toFixed(1).replace('.', ',') : count.toLocaleString("nl-NL")}{suffix}</span>;
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
        <div
          key={i}
          className="absolute"
          style={{
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
          }}
        />
      ))}
    </div>
  );
}

function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
        opacity: 0.4,
        mixBlendMode: "overlay",
      }}
    />
  );
}

function XDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-16 sm:h-24 flex items-center justify-center overflow-hidden ${className}`}>
      <div className="flex items-center gap-4 sm:gap-8">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              width: i === 3 ? 40 : 24,
              height: i === 3 ? 40 : 24,
              opacity: i === 3 ? 0.3 : 0.12,
              WebkitMaskImage: `url(${xPatroon})`,
              maskImage: `url(${xPatroon})`,
              WebkitMaskSize: "contain", maskSize: "contain",
              WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
              WebkitMaskPosition: "center", maskPosition: "center",
              backgroundColor: "rgba(168,85,247,0.9)",
              animationDelay: `${i * 200}ms`,
              animationDuration: "3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard", desc: "Bekijk je totale punten, status en maandelijkse voortgang in één overzicht.", emoji: "📊" },
  { key: "rewards", img: screenRewards, label: "Rewards", desc: "Wissel je punten in voor toffe beloningen zoals AirPods, museumjaarkaarten en meer.", emoji: "🎁" },
  { key: "challenges", img: screenChallenges, label: "Challenges", desc: "Behaal uitdagingen en verdien extra punten met elke mijlpaal.", emoji: "🏆" },
  { key: "ranglijst", img: screenRanglijst, label: "Ranglijst", desc: "Bekijk je positie op de maandelijkse ranglijst en versla je collega's.", emoji: "📈" },
];

const blogArticles = [
  {
    image: blogHousekeeping,
    category: "Hospitality",
    title: "Vijf tips voor een onvergetelijke gastervaring in je hotel",
    summary: "Van persoonlijke welkomstmomenten tot kleine verrassingen op de kamer — ontdek hoe tophotels het verschil maken.",
    date: "18 feb 2026",
  },
  {
    image: blogCatering,
    category: "Events & Catering",
    title: "Hoe plan je de perfecte catering voor een bedrijfsevent?",
    summary: "Een goed doordacht menu en professioneel serviceteam tillen elk evenement naar een hoger niveau.",
    date: "12 feb 2026",
  },
  {
    image: blogBarista,
    category: "Horeca",
    title: "De barista als visitekaartje: waarom kwaliteit telt",
    summary: "Gasten verwachten meer dan koffie. Een goede barista biedt beleving, snelheid en een glimlach.",
    date: "5 feb 2026",
  },
  {
    image: blogTeam,
    category: "EXTRA Nieuws",
    title: "Medewerker van de maand: het verhaal van Priya",
    summary: "Na drie maanden bij EXTRA verdiende Priya haar eerste beloning. Lees hoe het EXTRAATje-systeem haar motiveert.",
    date: "28 jan 2026",
  },
  {
    image: blogHotel,
    category: "Branche",
    title: "Personeelstekort in de horeca: trends en oplossingen voor 2026",
    summary: "De horecasector kampt met structurele tekorten. EXTRA zet in op beloning, begeleiding en flexibiliteit.",
    date: "20 jan 2026",
  },
];

function NewsSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEnd.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStart.current - touchEnd.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeSlide < blogArticles.length - 1) setActiveSlide(activeSlide + 1);
      if (diff < 0 && activeSlide > 0) setActiveSlide(activeSlide - 1);
    }
  };

  return (
    <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-gray-950">
      <XPatternBg count={3} opacity={0.06} color="rgba(255,255,255,0.5)" />
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <RevealSection>
          <div className="mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-500/10 px-4 sm:px-5 py-2 rounded-full border border-purple-500/20">
              <Sparkles className="w-4 h-4" /> Nieuws & Blogs
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Laatste nieuws uit{" "}
              <span className="relative inline-block">
                <span className="relative z-10">de branche</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-400 mt-4 max-w-2xl">
              Tips, verhalen en trends uit de horeca- en hotelwereld. Ontdek wat er speelt.
            </p>
          </div>
        </RevealSection>

        {/* Desktop: 3-column grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-5 lg:gap-6">
          {blogArticles.slice(0, 3).map((article, i) => (
            <RevealSection key={i} delay={i * 120}>
              <div className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[3/4]">
                <img
                  src={article.image}
                  alt={article.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7">
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full mb-3 border border-purple-500/30">
                    {article.category}
                  </span>
                  <h3 className="text-lg lg:text-xl font-bold text-white leading-snug mb-2">{article.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{article.summary}</p>
                  <span className="text-xs text-gray-500 mt-3 block">{article.date}</span>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>

        {/* Desktop: bottom row with 2 wider cards */}
        <div className="hidden md:grid md:grid-cols-2 gap-5 lg:gap-6 mt-5 lg:mt-6">
          {blogArticles.slice(3, 5).map((article, i) => (
            <RevealSection key={i} delay={(i + 3) * 120}>
              <div className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[16/9]">
                <img
                  src={article.image}
                  alt={article.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7">
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full mb-3 border border-purple-500/30">
                    {article.category}
                  </span>
                  <h3 className="text-lg lg:text-xl font-bold text-white leading-snug mb-2">{article.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{article.summary}</p>
                  <span className="text-xs text-gray-500 mt-3 block">{article.date}</span>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>

        {/* Mobile: Carousel */}
        <div className="md:hidden">
          <div
            className="relative overflow-hidden rounded-2xl"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {blogArticles.map((article, i) => (
                <div key={i} className="w-full flex-shrink-0">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mx-1">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <span className="inline-block text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full mb-3 border border-purple-500/30">
                        {article.category}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-snug mb-2">{article.title}</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">{article.summary}</p>
                      <span className="text-xs text-gray-500 mt-3 block">{article.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {blogArticles.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeSlide === i ? "bg-purple-400 w-7" : "bg-gray-600 hover:bg-gray-500"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37 + 13) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  size: 2 + (i % 4),
  opacity: 0.15 + (i % 5) * 0.06,
  delay: (i % 7) * 0.7,
  duration: 3 + (i % 5),
}));

function DienstenParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: `rgba(167,139,250,${p.opacity})`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

type DienstItem = {
  id: string;
  label: string;
  icon: any;
  title: string;
  subtitle: string;
  usps: string[];
  cta: string;
  image: string;
  accent: string;
  glowColor: string;
  ringColor: string;
  transparentBg?: boolean;
  alt?: string;
};

function DienstenDesktop({ diensten }: { diensten: DienstItem[] }) {
  const [active, setActive] = useState(0);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!isPausedRef.current) {
        setActive((prev) => (prev + 1) % diensten.length);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [diensten.length]);

  const d = diensten[active];

  return (
    <RevealSection>
      <div
        className="relative"
        onMouseEnter={() => { isPausedRef.current = true; }}
        onMouseLeave={() => { isPausedRef.current = false; }}
      >
        <div className="flex justify-center gap-3 mb-10">
          {diensten.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                i === active
                  ? "bg-white text-purple-900 shadow-xl shadow-purple-500/20 scale-105"
                  : "bg-white/10 text-purple-200 hover:bg-white/20 hover:text-white border border-white/10"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-white/[0.04] backdrop-blur-sm" style={{ minHeight: 420 }}>
          <div
            className="absolute inset-0 rounded-[2rem] transition-all duration-700"
            style={{
              boxShadow: `0 0 120px 40px ${d.glowColor}, 0 0 60px 20px ${d.glowColor}`,
              animation: "glow-pulse 3s ease-in-out infinite",
            }}
          />

          <div className="relative z-10 grid grid-cols-2 h-full" style={{ minHeight: 420 }}>
            <div className="flex flex-col justify-center p-10 lg:p-14">
              <div className="inline-flex items-center gap-2 text-purple-300 text-sm font-bold mb-4 bg-white/10 px-4 py-2 rounded-full w-fit border border-white/10">
                <d.icon className="w-4 h-4" />
                {d.label}
              </div>

              <h3 className="relative text-4xl lg:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {d.title}
                <span className="absolute -bottom-1 left-0 h-1.5 rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-transparent" style={{ width: "60%" }} />
              </h3>

              <p className="text-lg text-purple-200/80 mb-6">{d.subtitle}</p>

              <div className="space-y-3 mb-8">
                {d.usps.map((usp, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/90 font-medium">{usp}</span>
                  </div>
                ))}
              </div>

              <a
                href="/personeelsaanvraag"
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-purple-900 font-bold px-7 py-3.5 rounded-full transition-all hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5 w-fit text-base"
              >
                {d.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="relative flex items-end justify-center overflow-visible">
              <div
                className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full blur-[90px] transition-colors duration-700"
                style={{ backgroundColor: d.glowColor }}
              />
              {diensten.map((item, i) => {
                const isTransparent = item.transparentBg;
                if (isTransparent) {
                  return (
                    <div
                      key={item.id}
                      className={`absolute inset-0 transition-all duration-700 ${
                        i === active ? "opacity-100 scale-100" : "opacity-0 scale-95"
                      }`}
                    >
                      <div className="absolute bottom-[8%] right-[18%] w-[220px] h-[220px] rounded-full blur-[80px] bg-purple-500/20" />
                      <img
                        src={item.image}
                        alt={item.alt || item.title}
                        className="absolute bottom-[-60px] right-[-35px] h-[125%] object-contain object-bottom z-10"
                        style={{
                          filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.3))",
                        }}
                      />
                    </div>
                  );
                }
                return (
                  <img
                    key={item.id}
                    src={item.image}
                    alt={item.alt || item.title}
                    className={`absolute bottom-0 w-full h-full object-cover object-top transition-all duration-700 ${
                      i === active ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
                    }`}
                    style={{
                      maskImage: "linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0.8) 80%, transparent 100%)",
                      WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0.8) 80%, transparent 100%)",
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {diensten.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === active ? "w-10 bg-white" : "w-4 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </RevealSection>
  );
}

function DienstenMobiel({ diensten }: { diensten: DienstItem[] }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleSwipe = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActive((p) => Math.min(p + 1, diensten.length - 1));
      else setActive((p) => Math.max(p - 1, 0));
    }
  };

  return (
    <div
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { touchEndX.current = e.changedTouches[0].clientX; handleSwipe(); }}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {diensten.map((d) => (
            <div key={d.id} className="w-full flex-shrink-0 px-2">
              <div className={`relative rounded-2xl overflow-hidden border ${d.ringColor} bg-white/[0.06] backdrop-blur-sm`}>
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{ boxShadow: `inset 0 0 60px 10px ${d.glowColor.replace("0.35", "0.15")}` }}
                />
                <div className="relative z-10">
                  <div className={`relative ${d.transparentBg ? "h-64 flex items-end justify-center" : "h-56"} overflow-hidden`}>
                    {d.transparentBg ? (
                      <>
                        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full blur-[60px]" style={{ backgroundColor: d.glowColor }} />
                        <img
                          src={d.image}
                          alt={d.alt || d.title}
                          className="relative z-10 max-w-[75%] max-h-[95%] object-contain object-bottom drop-shadow-2xl"
                          style={{ filter: "drop-shadow(0 0 30px rgba(139,92,246,0.25))" }}
                        />
                      </>
                    ) : (
                      <img
                        src={d.image}
                        alt={d.alt || d.title}
                        className="w-full h-full object-cover object-top"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-950 via-purple-950/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 z-20">
                      <div className="inline-flex items-center gap-2 text-purple-200 text-xs font-bold bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                        <d.icon className="w-3.5 h-3.5" />
                        {d.label}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {d.title}
                    </h3>
                    <p className="text-sm text-purple-200/80 mb-4">{d.subtitle}</p>
                    <div className="space-y-2 mb-5">
                      {d.usps.map((usp, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="text-sm text-white/80 font-medium">{usp}</span>
                        </div>
                      ))}
                    </div>
                    <a
                      href="/personeelsaanvraag"
                      className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-100 text-purple-900 font-bold px-6 py-3 rounded-full transition-all text-sm"
                    >
                      {d.cta}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {diensten.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-8 bg-white" : "w-3 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeScreen, setActiveScreen] = useState(0);
  const [howItWorksTab, setHowItWorksTab] = useState<"werkgever" | "medewerker">("werkgever");
  const [testimonialTab, setTestimonialTab] = useState<"werkgever" | "medewerker">("werkgever");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  }, []);

  const werkgeverTestimonials = [
    { quote: "EXTRA levert keer op keer betrouwbaar en goed getraind personeel. De communicatie is snel en helder.", name: "Mark de Vries", role: "F&B Manager, Grand Hotel" },
    { quote: "Binnen 24 uur hadden we personeel voor ons evenement. Professioneel en representatief. Aanrader.", name: "Lisa Jansen", role: "Event Manager, Venues Amsterdam" },
    { quote: "Eindelijk een uitzendbureau dat begrijpt wat hospitality écht betekent. De kwaliteit is constant hoog.", name: "Sophie van Dijk", role: "Operations Manager, Amrâth Hotels" },
  ];
  const medewerkerTestimonials = [
    { quote: "Het puntensysteem maakt werken echt leuker. Ik heb al AirPods en een TrainMore korting verdiend!", name: "Jamal El Amrani", role: "Medewerker sinds 2024" },
    { quote: "Fijn dat je zelf diensten kunt kiezen. Goede begeleiding en altijd snel betaald.", name: "Nina Bakker", role: "Studente & EXTRA medewerker" },
    { quote: "Na mijn gesprek kon ik direct aan de slag. Leuke events, goed team en eerlijk werk.", name: "Daan Vermeer", role: "Medewerker sinds 2025" },
  ];

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <GrainOverlay />

      {/* ── NAVIGATION ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-purple-500/5 border-b border-purple-100/50" : "bg-transparent"}`}
        onMouseLeave={() => {
          dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 200);
        }}
        onMouseEnter={() => {
          if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <img src={extraLogoWit} alt="EXTRA" className={`h-9 sm:h-10 w-auto transition-all ${scrolled ? "brightness-0" : ""}`} />
            </div>
            <div className="hidden lg:flex items-center gap-2">
              {/* Ik zoek personeel */}
              <div
                className="relative"
                onMouseEnter={() => { if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current); setActiveDropdown("personeel"); }}
              >
                <button className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${activeDropdown === "personeel" ? (scrolled ? "text-purple-700 bg-purple-50" : "text-white bg-white/10") : (scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10")}`}>
                  <Briefcase className="w-5 h-5" />
                  Ik zoek extra personeel
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "personeel" ? "rotate-180" : ""}`} />
                </button>
                <div className={`absolute top-full left-0 pt-2 transition-all duration-200 ${activeDropdown === "personeel" ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-100/60 p-2 min-w-[220px]">
                    {[
                      { label: "Hotels", href: "/personeel-gezocht", icon: Building2 },
                      { label: "Eventlocaties", href: "/personeel-gezocht", icon: PartyPopper },
                      { label: "Cateraars", href: "/personeel-gezocht", icon: UtensilsCrossed },
                      { label: "Restaurants", href: "/personeel-gezocht", icon: Wine },
                    ].map((item) => (
                      <a key={item.label} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                          <item.icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-semibold">{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ik zoek werk */}
              <div
                className="relative"
                onMouseEnter={() => { if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current); setActiveDropdown("werk"); }}
              >
                <button className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${activeDropdown === "werk" ? (scrolled ? "text-purple-700 bg-purple-50" : "text-white bg-white/10") : (scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10")}`}>
                  <UserCheck className="w-5 h-5" />
                  Ik zoek extra werk
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "werk" ? "rotate-180" : ""}`} />
                </button>
                <div className={`absolute top-full left-0 pt-2 transition-all duration-200 ${activeDropdown === "werk" ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-100/60 p-2 min-w-[220px]">
                    {[
                      { label: "Horeca", href: "/sollicitatieformulier", icon: UtensilsCrossed },
                      { label: "Housekeeping", href: "/sollicitatieformulier", icon: Heart },
                      { label: "Chefs", href: "/sollicitatieformulier", icon: Award },
                      { label: "Front Office", href: "/sollicitatieformulier", icon: Handshake },
                    ].map((item) => (
                      <a key={item.label} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                          <item.icon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-sm font-semibold">{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Over EXTRA */}
              <div
                className="relative"
                onMouseEnter={() => { if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current); setActiveDropdown("over"); }}
              >
                <button className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${activeDropdown === "over" ? (scrolled ? "text-purple-700 bg-purple-50" : "text-white bg-white/10") : (scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10")}`}>
                  <Star className="w-5 h-5" />
                  Over EXTRA
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "over" ? "rotate-180" : ""}`} />
                </button>
                <div className={`absolute top-full left-0 pt-2 transition-all duration-200 ${activeDropdown === "over" ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-100/60 p-2 min-w-[260px]">
                    {[
                      { label: "Onze werkwijze", action: () => scrollTo("how-it-works"), icon: Clock },
                      { label: "Klantcases", action: () => scrollTo("differentiators"), icon: Trophy },
                      { label: "Ons beloningssysteem", action: () => scrollTo("rewards"), icon: Gift },
                    ].map((item) => (
                      <button key={item.label} onClick={() => { item.action(); setActiveDropdown(null); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all group w-full text-left">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                          <item.icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-semibold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact CTA */}
              <a
                href="/personeelsaanvraag"
                className="ml-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-[18px] font-bold px-8 py-3.5 rounded-full transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 flex items-center gap-2.5 border border-purple-500/20"
              >
                <Phone className="w-[18px] h-[18px]" />
                Contact
              </a>
            </div>
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className={scrolled ? "text-gray-900" : "text-white"} size={28} /> : <Menu className={scrolled ? "text-gray-900" : "text-white"} size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="bg-white border-t border-gray-100 shadow-2xl overflow-y-auto max-h-[80vh]">
            <div className="px-5 py-5 space-y-1">
              {/* Ik zoek personeel */}
              <div>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === "personeel" ? null : "personeel")}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Briefcase className="w-4.5 h-4.5 text-purple-600" />
                    </div>
                    Ik zoek personeel
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileExpanded === "personeel" ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileExpanded === "personeel" ? "max-h-60" : "max-h-0"}`}>
                  <div className="pl-16 pr-4 pb-2 space-y-0.5">
                    {["Hotels", "Eventlocaties", "Cateraars", "Restaurants"].map((item) => (
                      <a key={item} href="/personeel-gezocht" className="block py-2.5 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">{item}</a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ik zoek werk */}
              <div>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === "werk" ? null : "werk")}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <UserCheck className="w-4.5 h-4.5 text-indigo-600" />
                    </div>
                    Ik zoek werk
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileExpanded === "werk" ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileExpanded === "werk" ? "max-h-60" : "max-h-0"}`}>
                  <div className="pl-16 pr-4 pb-2 space-y-0.5">
                    {["Horeca", "Housekeeping", "Chefs", "Front Office"].map((item) => (
                      <a key={item} href="/sollicitatieformulier" className="block py-2.5 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">{item}</a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Over EXTRA */}
              <div>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === "over" ? null : "over")}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Star className="w-4.5 h-4.5 text-purple-600" />
                    </div>
                    Over EXTRA
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileExpanded === "over" ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileExpanded === "over" ? "max-h-60" : "max-h-0"}`}>
                  <div className="pl-16 pr-4 pb-2 space-y-0.5">
                    <button onClick={() => { scrollTo("how-it-works"); }} className="block w-full text-left py-2.5 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">Onze werkwijze</button>
                    <button onClick={() => { scrollTo("differentiators"); }} className="block w-full text-left py-2.5 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">Klantcases</button>
                    <button onClick={() => { scrollTo("rewards"); }} className="block w-full text-left py-2.5 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">Ons beloningssysteem</button>
                  </div>
                </div>
              </div>

              {/* Contact CTA */}
              <div className="pt-3 px-2">
                <a
                  href="/personeelsaanvraag"
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-base py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/20"
                >
                  <Phone className="w-5 h-5" />
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════ */}
      {/* 1. HERO                                          */}
      {/* ════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-right sm:object-center"
            style={{ filter: "contrast(1.03) saturate(1.02)" }}
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg,
                rgba(88,22,164,0.92) 0%,
                rgba(88,22,164,0.88) 40%,
                rgba(88,22,164,0.70) 65%,
                rgba(88,22,164,0.35) 82%,
                rgba(88,22,164,0.10) 100%
              )`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="absolute" style={{ left: "5%", top: "10%", width: 200, height: 200, transform: "rotate(15deg)", opacity: 0.12, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: "rgba(255,255,255,0.9)" }} />
          <div className="absolute" style={{ left: "15%", top: "75%", width: 180, height: 180, transform: "rotate(-10deg)", opacity: 0.12, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: "rgba(255,255,255,0.9)" }} />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 mb-6 sm:mb-10 border border-white/20">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 text-xs sm:text-sm font-semibold">800+ medewerkers actief</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Horecapersoneel nodig?{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
              {" "}regelt het!
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-purple-100/90 max-w-lg mb-8 sm:mb-10 leading-relaxed font-medium">
              Flexibel en representatief personeel voor hotels, events en cateraars. Snel geregeld.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-8 mb-8 sm:mb-12">
              {[
                { icon: Check, text: "Iedereen in loondienst" },
                { icon: Star, text: "Geselecteerd personeel" },
                { icon: CreditCard, text: "Dagbetaling mogelijk" },
              ].map((usp, i) => (
                <div key={i} className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <usp.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                  </div>
                  <span className="text-white/90 text-sm sm:text-base font-medium">{usp.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-16 sm:mb-20">
              <a href="/personeel-gezocht" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Ik zoek extra personeel
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/sollicitatieformulier" className="group border-2 border-white/30 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Ik zoek extra werk
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 2. USP's STATS BAR (overlapping hero bottom)     */}
      {/* ════════════════════════════════════════════════ */}
      <div className="relative z-30 -mt-16 sm:-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-900/15 p-6 sm:p-8 lg:p-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-10">
            {[
              { value: 800, suffix: "+", label: "Actieve medewerkers", icon: Users, color: "text-purple-600" },
              { value: 150, suffix: "+", label: "Tevreden opdrachtgevers", icon: Heart, color: "text-pink-500" },
              { value: 50, suffix: ".000+", label: "Punten verdiend", icon: Sparkles, color: "text-yellow-500" },
              { value: 98, suffix: "%", label: "Tevredenheidsscore", icon: TrendingUp, color: "text-green-500" },
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
      {/* 3. WAT ZOEK JIJ?                                */}
      {/* ════════════════════════════════════════════════ */}
      <section id="audience" className="relative bg-white py-16 sm:py-20 lg:py-28 overflow-hidden">
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-5xl mx-auto px-5 sm:px-6 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat zoek jij?
              </h2>
              <p className="text-lg sm:text-xl text-gray-500 mt-3 sm:mt-4 max-w-xl mx-auto">Kies wat het best bij je past</p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-8">
            <RevealSection>
              <a href="/personeel-gezocht" className="group block relative bg-gradient-to-br from-purple-50 to-white rounded-2xl sm:rounded-[2rem] shadow-lg shadow-purple-500/5 border-2 border-purple-100 p-7 sm:p-10 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-2 transition-all duration-400 h-full overflow-hidden">
                <div className="absolute top-0 right-0 w-28 sm:w-40 h-28 sm:h-40 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-[100%] opacity-60" />
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/20">
                    <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>Ik zoek extra personeel</h3>
                  <ul className="space-y-3 sm:space-y-4 mb-7 sm:mb-10">
                    {["Snel inzetbaar horecapersoneel", "Strenge selectie & beoordeling", "Flexibel op- en afschalen"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 sm:gap-3 text-gray-600">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-700" />
                        </div>
                        <span className="text-sm sm:text-base font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 rounded-full group-hover:bg-purple-700 group-hover:gap-4 transition-all shadow-lg shadow-purple-500/20">
                    Ik zoek extra personeel <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                </div>
              </a>
            </RevealSection>

            <RevealSection delay={150}>
              <a href="/sollicitatieformulier" className="group block relative bg-gradient-to-br from-indigo-50 to-white rounded-2xl sm:rounded-[2rem] shadow-lg shadow-indigo-500/5 border-2 border-indigo-100 p-7 sm:p-10 hover:shadow-2xl hover:border-indigo-300 hover:-translate-y-2 transition-all duration-400 h-full overflow-hidden">
                <div className="absolute top-0 right-0 w-28 sm:w-40 h-28 sm:h-40 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-[100%] opacity-60" />
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-lg shadow-indigo-500/20">
                    <UserCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>Ik zoek extra werk</h3>
                  <ul className="space-y-3 sm:space-y-4 mb-7 sm:mb-10">
                    {["Direct uitbetaald via app", "Kies jouw eigen diensten", "Verdien punten & beloningen"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 sm:gap-3 text-gray-600">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-700" />
                        </div>
                        <span className="text-sm sm:text-base font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 rounded-full group-hover:bg-indigo-700 group-hover:gap-4 transition-all shadow-lg shadow-indigo-500/20">
                    Ik zoek extra werk <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
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
            <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Vertrouwd door teams in de horeca</p>
          </RevealSection>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                  {[
                    { src: logoAmrath, alt: "Amrâth Hotels" },
                    { src: logoFcUtrecht, alt: "FC Utrecht" },
                    { src: logoFunda, alt: "Funda" },
                    { src: logoHartMuseum, alt: "H'art Museum" },
                    { src: logoHetePeper, alt: "Hete Peper" },
                    { src: logoHilton, alt: "Hilton" },
                    { src: logoMarriott, alt: "Marriott" },
                    { src: logoSelectCatering, alt: "Select Catering" },
                    { src: logoAppel, alt: "Appèl" },
                  ].map((logo) => (
                    <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
                      <img src={logo.src} alt={logo.alt} className="h-16 sm:h-20 lg:h-24 w-auto object-contain" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 40s linear infinite;
          }
        `}</style>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* DIENSTEN — DYNAMIC SPOTLIGHT SECTION             */}
      {/* ════════════════════════════════════════════════ */}
      {(() => {
        const diensten = [
          {
            id: "chefs",
            label: "Chef",
            icon: UtensilsCrossed,
            title: "Ervaren Chefs",
            subtitle: "Direct inzetbaar voor jouw keuken.",
            usps: ["Geselecteerd op ervaring & representativiteit", "Binnen 24 uur geleverd"],
            cta: "Chef aanvragen",
            image: dienstChefPng,
            accent: "from-orange-400 via-amber-400 to-yellow-300",
            glowColor: "rgba(147,130,240,0.35)",
            ringColor: "border-purple-400/30",
            transparentBg: true,
            alt: "Lachende chef van EXTRA in witte koksjas en donker schort",
          },
          {
            id: "horeca",
            label: "Horeca",
            icon: Wine,
            title: "Horecamedewerkers",
            subtitle: "Bediening, bar & hospitality op topniveau.",
            usps: ["Representatief & servicegericht", "Flexibel inzetbaar per dienst"],
            cta: "Horeca aanvragen",
            image: dienstHoreca,
            accent: "from-purple-400 via-violet-400 to-fuchsia-400",
            glowColor: "rgba(167,139,250,0.35)",
            ringColor: "border-purple-400/30",
            transparentBg: true,
            alt: "Lachende horecamedewerker van EXTRA in wit overhemd en donker schort",
          },
          {
            id: "frontoffice",
            label: "Front-office",
            icon: Users,
            title: "Front-office",
            subtitle: "Dé eerste indruk van jouw hotel of locatie.",
            usps: ["Meertalig & representatief", "Ervaring met PMS-systemen"],
            cta: "Front-office aanvragen",
            image: dienstFrontoffice,
            accent: "from-cyan-400 via-blue-400 to-indigo-400",
            glowColor: "rgba(96,165,250,0.35)",
            ringColor: "border-blue-400/30",
            transparentBg: true,
            alt: "Professionele front-office medewerker van EXTRA in donker blazer",
          },
          {
            id: "housekeeping",
            label: "Housekeeping",
            icon: Sparkles,
            title: "Housekeeping",
            subtitle: "Kamers & ruimtes onberispelijk schoon.",
            usps: ["Getraind op hotelstandaarden", "Direct beschikbaar, ook last-minute"],
            cta: "Housekeeping aanvragen",
            image: dienstHousekeeping,
            accent: "from-emerald-400 via-green-400 to-teal-400",
            glowColor: "rgba(52,211,153,0.35)",
            ringColor: "border-emerald-400/30",
          },
        ];
        return (
      <section id="diensten-extra" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950" />
        <DienstenParticles />
        <XPatternBg count={4} opacity={0.06} color="rgba(255,255,255,0.8)" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                <Sparkles className="w-4 h-4" /> Onze diensten
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Welke EXTRA's heb je nodig?
              </h2>
              <p className="text-base sm:text-lg text-purple-200/80 max-w-2xl mx-auto leading-relaxed">
                Kies het team dat bij jouw past, van keuken tot front-office, altijd representatief en in loondienst.
              </p>
            </div>
          </RevealSection>

          {/* Desktop: 4 kaarten met spotlight */}
          <div className="hidden lg:block">
            <DienstenDesktop diensten={diensten} />
          </div>

          {/* Mobiel: swipeable carrousel */}
          <div className="lg:hidden">
            <DienstenMobiel diensten={diensten} />
          </div>
        </div>

        <style>{`
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          @keyframes brush-stroke {
            0% { width: 0; opacity: 0; }
            100% { width: 100%; opacity: 1; }
          }
          @keyframes float-up {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .dienst-card-active { animation: float-up 4s ease-in-out infinite; }
          .brush-underline::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            height: 6px;
            width: 100%;
            border-radius: 3px;
            background: linear-gradient(90deg, #f97316, #fbbf24, transparent);
            animation: brush-stroke 0.6s ease-out forwards;
          }
        `}</style>
      </section>
        );
      })()}

      {/* ════════════════════════════════════════════════ */}
      {/* 4. HOE EXTRA WERKT — WARM OFF-WHITE             */}
      {/* ════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Zap className="w-4 h-4" /> Simpel & snel
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hoe extra werkt
              </h2>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
              {(["werkgever", "medewerker"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHowItWorksTab(tab)}
                  className={`px-5 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all duration-300 ${
                    howItWorksTab === tab
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-500/25 scale-105"
                      : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200"
                  }`}
                >
                  {tab === "werkgever" ? "Voor werkgevers" : "Voor medewerkers"}
                </button>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            {(() => {
              const steps = howItWorksTab === "werkgever" ? [
                { icon: Phone, step: "1", title: "Neem contact op", desc: "Bel of stuur je aanvraag. Wij schakelen snel.", color: "from-purple-500 to-purple-700" },
                { icon: UserCheck, step: "2", title: "Wij selecteren", desc: "Passend en beoordeeld personeel uit onze pool.", color: "from-indigo-500 to-purple-600" },
                { icon: Clock, step: "3", title: "Planning & inzet", desc: "Op tijd geregeld. Ook last-minute als het moet.", color: "from-blue-500 to-indigo-600" },
                { icon: TrendingUp, step: "4", title: "Evaluatie", desc: "Beoordeel en bouw een vaste poule op.", color: "from-emerald-500 to-teal-600" },
              ] : [
                { icon: UserCheck, step: "1", title: "Meld je aan", desc: "Schrijf je in via het formulier.", color: "from-purple-500 to-purple-700" },
                { icon: MessageCircle, step: "2", title: "Kom op gesprek", desc: "We maken kennis en checken wat bij je past.", color: "from-violet-500 to-purple-600" },
                { icon: Briefcase, step: "3", title: "Kies je diensten", desc: "Bekijk en claim shifts in de app.", color: "from-indigo-500 to-purple-600" },
                { icon: CreditCard, step: "4", title: "Werk & verdien", desc: "Direct uitbetaald, plus punten.", color: "from-blue-500 to-indigo-600" },
                { icon: Gift, step: "5", title: "Claim rewards", desc: "Wissel punten in voor echte beloningen.", color: "from-emerald-500 to-teal-600" },
              ];
              return (
                <div className={`grid grid-cols-2 ${howItWorksTab === "werkgever" ? "lg:grid-cols-4" : "lg:grid-cols-5"} gap-4 sm:gap-6`}>
                  {steps.map((item, i) => (
                    <div key={`${howItWorksTab}-${i}`} className="relative group">
                      {i < steps.length - 1 && <div className="hidden lg:block absolute top-10 left-[calc(100%+0.5rem)] w-[calc(100%-3rem)] h-0.5 bg-gradient-to-r from-purple-200 to-transparent z-0" />}
                      <div className="relative bg-white rounded-2xl sm:rounded-[1.5rem] p-5 sm:p-8 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                          <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div className="text-[10px] sm:text-xs font-black text-purple-400 uppercase tracking-widest mb-2 sm:mb-3">Stap {item.step}</div>
                        <h4 className="text-base sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">{item.title}</h4>
                        <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 5. EXTRAATJE / REWARDS — DEEP PURPLE            */}
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
                Werken wordt{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">beloond</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed">
                Medewerkers verdienen automatisch punten voor elke gewerkte shift en behaalde challenge.
                Die punten wisselen ze in voor echte beloningen.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-20 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Werk & verdien punten", desc: "Elke shift levert punten op. Extra inzet? Extra punten.", icon: "🏃" },
                { step: "2", title: "Klim in status", desc: "Van Bronze naar Diamond. Hogere status = betere beloningen.", icon: "💎" },
                { step: "3", title: "Claim je rewards", desc: "AirPods, TrainMore, Starbucks en meer. Jij kiest.", icon: "🎁" },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-6 sm:p-8 text-center hover:bg-white/[0.10] transition-all duration-300 hover:-translate-y-1">
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">{item.icon}</div>
                  <div className="text-[10px] sm:text-xs font-black text-purple-400 uppercase tracking-widest mb-2 sm:mb-3">Stap {item.step}</div>
                  <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{item.title}</h4>
                  <p className="text-purple-200/70 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-8 sm:gap-10 lg:gap-16 max-w-5xl mx-auto">
              <div className="flex lg:flex-col gap-2 sm:gap-3 lg:gap-4 lg:justify-center order-2 lg:order-1 flex-wrap justify-center">
                {appScreens.map((screen, i) => (
                  <button
                    key={screen.key}
                    onClick={() => setActiveScreen(i)}
                    className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-left transition-all duration-300 min-w-[140px] sm:min-w-[170px] ${
                      activeScreen === i
                        ? "bg-white/15 border-2 border-purple-400/60 shadow-lg shadow-purple-500/20 scale-105"
                        : "bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl">{screen.emoji}</span>
                    <div>
                      <span className={`font-bold text-sm sm:text-base block ${activeScreen === i ? "text-white" : "text-purple-200/80"}`}>{screen.label}</span>
                      {activeScreen === i && <span className="text-[10px] sm:text-xs text-purple-300/60 font-medium">Actief</span>}
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative order-1 lg:order-2 flex-shrink-0">
                <div className="relative w-[240px] sm:w-[300px]">
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border-[5px] border-gray-700 bg-gray-900">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[20px] bg-gray-900 rounded-b-xl z-20" />
                    <div className="relative">
                      {appScreens.map((screen, i) => (
                        <img key={screen.key} src={screen.img} alt={screen.label} className={`w-full transition-opacity duration-500 ${activeScreen === i ? "opacity-100 relative" : "opacity-0 absolute inset-0"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-[3rem] blur-3xl -z-10" />
                </div>
              </div>

              <div className="flex flex-col justify-center order-3 max-w-sm text-center lg:text-left">
                <div className="transition-all duration-300">
                  <span className="text-4xl sm:text-5xl block mb-3 sm:mb-5">{appScreens[activeScreen].emoji}</span>
                  <h4 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4">{appScreens[activeScreen].label}</h4>
                  <p className="text-base sm:text-lg text-purple-200/70 leading-relaxed">{appScreens[activeScreen].desc}</p>
                </div>
                <div className="flex gap-2.5 mt-6 sm:mt-8 justify-center lg:justify-start">
                  {appScreens.map((_, i) => (
                    <button key={i} onClick={() => setActiveScreen(i)} className={`h-2.5 rounded-full transition-all duration-300 ${activeScreen === i ? "bg-purple-400 w-10" : "bg-white/20 w-2.5 hover:bg-white/40"}`} />
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={300}>
            <div className="max-w-2xl mx-auto mt-12 sm:mt-16 bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/15 p-6 sm:p-8">
              <h4 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-300" />
                Wat jij als opdrachtgever merkt
              </h4>
              <ul className="space-y-2.5">
                {["Meer opkomst, minder last-minute uitval", "Mensen komen graag terug → stabielere poule", "Gemotiveerde medewerkers die een stapje extra doen"].map((item, i) => (
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
      {/* 6. WAAROM EXTRA — LILA GRADIENT                 */}
      {/* ════════════════════════════════════════════════ */}
      <section id="differentiators" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.1} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/70 px-4 sm:px-5 py-2 rounded-full">
                <Shield className="w-4 h-4" /> Wetgeving-proof
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waarom extra
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-3 sm:mt-4 max-w-xl mx-auto">
                Klaar voor de nieuwe arbeidswetgeving van 2026. Zekerheid voor jou en je personeel.
              </p>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { icon: Shield, title: "Iedereen in loondienst", desc: "Geen zzp-constructies. Duidelijke afspraken.", emoji: "🛡️" },
              { icon: Award, title: "Geselecteerd & beoordeeld", desc: "Na elke opdracht feedback. Kwaliteit blijft omhoog.", emoji: "⭐" },
              { icon: Clock, title: "Snel & flexibel inzetbaar", desc: "Opschalen bij piekdrukte. Of een snelle fix last-minute.", emoji: "⚡" },
              { icon: Handshake, title: "Heldere afspraken", desc: "Je weet waar je aan toe bent. Korte lijnen.", emoji: "🤝" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="group bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-purple-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="text-3xl sm:text-4xl flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      {item.emoji}
                    </div>
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
                Volledig compliant met arbeidswetgeving 2026
              </span>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 7. TESTIMONIALS — WARM LIGHT                    */}
      {/* ════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/50 px-4 sm:px-5 py-2 rounded-full">
                <Heart className="w-4 h-4" /> Ervaringen
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat anderen zeggen
              </h2>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
              {(["werkgever", "medewerker"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTestimonialTab(tab)}
                  className={`px-5 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all duration-300 ${
                    testimonialTab === tab
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-500/25 scale-105"
                      : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200"
                  }`}
                >
                  {tab === "werkgever" ? "Werkgevers" : "Medewerkers"}
                </button>
              ))}
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
            {(testimonialTab === "werkgever" ? werkgeverTestimonials : medewerkerTestimonials).map((testimonial, i) => (
              <RevealSection key={`${testimonialTab}-${i}`} delay={i * 120}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col shadow-sm">
                  <div className="flex gap-1 mb-4 sm:mb-5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6 sm:mb-8 flex-1">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <span className="text-white font-bold text-sm sm:text-base">{testimonial.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs sm:text-sm text-gray-400 font-medium">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 9. FAQ — NEUTRAL                                */}
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
                Veelgestelde vragen
              </h2>
            </div>
          </RevealSection>

          <div className="space-y-3 sm:space-y-4">
            {[
              { q: "Werken jullie met zzp?", a: "Nee, iedereen werkt via ons in loondienst. Wij regelen loon, belasting en verzekeringen. Geen gedoe met zzp-constructies." },
              { q: "Welke functies leveren jullie?", a: "Hotels, catering, events en restaurants — housekeeping, front office, chefs, bediening, host/hostess, afwas en meer." },
              { q: "Hoe snel kunnen jullie leveren?", a: "Afhankelijk van locatie en moment. Vaak snel schakelen, soms dezelfde week. Bij grote events plannen we ruim vooruit." },
              { q: "Hoe werkt EXTRAATje?", a: "Je verdient punten per gewerkte shift en wisselt die in voor echte beloningen zoals AirPods, sportabonnementen en meer. Hoe meer je werkt, hoe hoger je status." },
            ].map((faq, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-gray-100 hover:border-purple-200 transition-all duration-300 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 sm:p-7 text-left"
                  >
                    <span className="text-base sm:text-lg font-bold text-gray-900 pr-4">{faq.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 pb-5 sm:pb-7" : "max-h-0"}`}>
                    <p className="px-5 sm:px-7 text-sm sm:text-base text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 9b. NEWS / BLOG — DARK                          */}
      {/* ════════════════════════════════════════════════ */}
      <NewsSection />

      {/* ════════════════════════════════════════════════ */}
      {/* 10. FINAL CTA — DARK PURPLE                    */}
      {/* ════════════════════════════════════════════════ */}
      <section id="final-cta" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om samen{" "}
              <span className="relative inline-block">
                <span className="relative z-10">te werken?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Of je nu extra personeel zoekt of extra werk: we regelen het snel en duidelijk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center">
              <a
                href="/personeelsaanvraag"
                className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3"
                style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
              >
                Vraag extra personeel aan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/sollicitatieformulier" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3">
                Ik zoek extra werk
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-14">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center mb-4 sm:mb-5">
                <img src={extraLogoWit} alt="EXTRA" className="h-6 sm:h-7 w-auto" />
              </div>
              <p className="text-sm sm:text-base leading-relaxed">
                Uitzendbureau voor horeca, hotels en evenementen. Met ons unieke EXTRAATje beloningssysteem.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Werkgevers</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li><button onClick={() => scrollTo("final-cta")} className="hover:text-purple-400 transition-colors">Personeel aanvragen</button></li>
                <li><button onClick={() => scrollTo("how-it-works")} className="hover:text-purple-400 transition-colors">Hoe het werkt</button></li>
                <li><button onClick={() => scrollTo("differentiators")} className="hover:text-purple-400 transition-colors">Waarom extra</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Werkzoekenden</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li><a href="/sollicitatieformulier" className="hover:text-purple-400 transition-colors">Solliciteren</a></li>
                <li><button onClick={() => scrollTo("rewards")} className="hover:text-purple-400 transition-colors">EXTRAATje Rewards</button></li>
                <li><button onClick={() => scrollTo("diensten-extra")} className="hover:text-purple-400 transition-colors">Diensten</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Contact</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li>info@doehetextra.nl</li>
                <li>Amsterdam, Nederland</li>
                <li className="pt-2">
                  <a href="https://instagram.com/doehetextra" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
                    Instagram @doehetextra
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; 2026 EXTRA Uitzendbureau. Alle rechten voorbehouden.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full border border-purple-800/30">NEN 4400-1</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
