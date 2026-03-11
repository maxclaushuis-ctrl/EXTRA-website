import PublicNav from "@/components/PublicNav";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { CLIENT_REVIEWS } from "@/data/reviews";
import { Link } from "wouter";
import {
  Users, Trophy, Gift, Star, ChevronDown, ChevronUp,
  TrendingUp, Shield, Clock,
  ArrowRight, Check, Briefcase, UserCheck, CreditCard,
  Award, Handshake, Phone, Sparkles, Heart, Zap,
  Building2, UtensilsCrossed, PartyPopper, Wine, MessageCircle,
  Mail, MapPin, Instagram, Linkedin
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import screenDashboard from "@assets/IMG_8971_1772395165096.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoWestweelde from "@assets/pitch/logo-westweelde-transparant.png";
import blogHousekeeping from "../assets/images/blog-housekeeping.jpg";
import blogCatering from "../assets/images/blog-catering.jpg";
import blogBarista from "../assets/images/blog-barista.jpg";
import blogTeam from "../assets/images/blog-team.jpg";
import blogHotel from "../assets/images/blog-hotel.jpg";
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

export function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
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

export function XPatternBg({ className = "", count = 3, opacity = 0.12, color = "rgba(139,92,246,1)" }: { className?: string; count?: number; opacity?: number; color?: string }) {
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


const blogArticles = [
  {
    image: blogHousekeeping,
    category: "Hospitality",
    title: "Vijf tips voor een onvergetelijke gastervaring in je hotel",
    summary: "Van persoonlijke welkomstmomenten tot kleine verrassingen op de kamer. Ontdek hoe tophotels het verschil maken.",
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

function InstagramFeed() {
  const tiles = [
    { gradient: "from-purple-600 via-pink-500 to-orange-400", icon: "🎉", text: "Events & hospitality", delay: 0 },
    { gradient: "from-indigo-500 via-purple-500 to-pink-400", icon: "🏨", text: "Hotel service", delay: 50 },
    { gradient: "from-purple-500 via-violet-500 to-blue-400", icon: "🍽️", text: "Catering & dining", delay: 100 },
    { gradient: "from-pink-500 via-rose-400 to-purple-500", icon: "⭐", text: "Top prestaties", delay: 150 },
    { gradient: "from-violet-500 via-indigo-500 to-cyan-400", icon: "👥", text: "Ons team", delay: 200 },
    { gradient: "from-orange-400 via-pink-500 to-purple-600", icon: "🎯", text: "EXTRA rewards", delay: 250 },
  ];

  return (
    <RevealSection delay={100}>
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 max-w-3xl mx-auto">
        {tiles.map((item, i) => (
          <a
            key={i}
            href="https://instagram.com/doehetextra"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3 sm:p-4">
              <span className="text-3xl sm:text-4xl lg:text-5xl mb-1.5 sm:mb-2 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 drop-shadow-lg">{item.icon}</span>
              <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-center opacity-95 drop-shadow-md leading-tight">{item.text}</span>
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 flex items-end justify-center pb-2 sm:pb-3 opacity-0 group-hover:opacity-100">
              <span className="text-white text-[10px] sm:text-xs font-bold bg-white/25 backdrop-blur-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
                Bekijk
              </span>
            </div>
          </a>
        ))}
      </div>
    </RevealSection>
  );
}

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
    <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a2e] via-[#170926] to-[#12071f]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_80%,rgba(124,58,237,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_20%,rgba(99,102,241,0.08),transparent)]" />
      <XPatternBg count={4} opacity={0.08} color="rgba(168,85,247,0.6)" />
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <RevealSection>
          <div className="mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-500/10 px-4 sm:px-5 py-2 rounded-full border border-purple-500/20">
              <Sparkles className="w-4 h-4" /> Nieuws & Blogs
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Laatste nieuws uit{" "}
              <span className="relative inline-block">
                <span className="relative z-10">de branche</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-lg text-purple-100/70 leading-relaxed mt-4 max-w-2xl">
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

        <RevealSection delay={300}>
          <div className="flex justify-center mt-10 sm:mt-14">
            <Link
              href="/nieuws"
              className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-base px-8 py-4 rounded-full shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
            >
              Lees EXTRA
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </RevealSection>
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
  imgStyle?: string;
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

            <h3 className="relative text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {d.title}
                <span className="absolute -bottom-1 left-0 h-1.5 rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-transparent" style={{ width: "60%" }} />
              </h3>

              <p className="text-sm sm:text-base text-purple-100/70 leading-relaxed mb-6">{d.subtitle}</p>

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
                        className={`absolute ${item.imgStyle || "bottom-[-60px] right-[-35px] h-[125%]"} object-contain object-bottom z-10`}
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
  const [howItWorksTab, setHowItWorksTab] = useState<"werkgever" | "medewerker">("werkgever");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeNotification, setActiveNotification] = useState(0);

  const rewardNotifications = useMemo(() => [
    { text: "Je hebt een challenge behaald 🚀", points: "+500 EXTRA punten" },
    { text: "Gefeliciteerd met je verjaardag 🎉", points: "+100 EXTRA punten" },
    { text: "Je hebt een 5-sterren review gehaald ⭐", points: "+50 EXTRA punten" },
  ], []);

  const rewardItems = useMemo(() => [
    { name: "JBL Speaker", points: "7.500 punten", image: rewardJBL },
    { name: "Pathé Bon", points: "2.500 punten", image: rewardPathe },
    { name: "EXTRA Padelset", points: "15.000 punten", image: rewardPadel },
    { name: "Dinerbon", points: "5.000 punten", image: rewardDinerbon },
    { name: "Apple AirTags", points: "3.000 punten", image: rewardAirtag },
    { name: "Museumkaart", points: "10.000 punten", image: rewardMuseumkaart },
    { name: "AirPods Pro", points: "12.500 punten", image: rewardAirpods },
    { name: "GiG Hard Seltzer", points: "1.500 punten", image: rewardGig },
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNotification((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const styleId = "rewards-animations";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes notification-pop {
        0% { transform: scale(0.7); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes float-slow {
        0%, 100% { transform: translateY(-10px); }
        50% { transform: translateY(10px); }
      }
      @keyframes marquee-scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(styleId)?.remove(); };
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const [reviewTab, setReviewTab] = useState<"medewerkers" | "klanten">("medewerkers");
  const medewerkerReviews = [
    { quote: "Ontzettend leuk uitzendbureau! Open en flexibel team, leuke klussen", name: "Sophie Sybrandy", rating: 5 },
    { quote: "Extra is nice platform for from entry level to become a pro at hospitality industry.", name: "Oliur Rahman", rating: 5 },
    { quote: "Geweldig uitzendbureau met goede en leerzame opdrachten. Werkt met mooie locaties waar altijd een fijne sfeer hangt en goed personeel rondloopt. De communicatie in het bedrijf zelf verloopt goed waardoor je zonder problemen en miscommunicaties aan het werk kan.", name: "Nathalie Siegerma", rating: 5 },
  ];
  const klantReviews = ["amrath", "westweelde", "hart"].map((id) => {
    const r = CLIENT_REVIEWS.find((x) => x.id === id)!;
    return { quote: r.quote, name: r.author, rating: 5, role: r.role, company: r.company };
  });

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <GrainOverlay />
      <PublicNav />


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
            {...{ fetchpriority: "high" } as any}
            decoding="async"
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

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.08] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Horeca draait op mensen,{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
              {" "}levert ze!
            </h1>

            <p className="text-lg sm:text-xl text-purple-100/75 leading-relaxed max-w-lg mb-8 sm:mb-10 font-medium">
              Snel horecapersoneel inzetten of direct aan de slag? Bij EXTRA regelen we het.
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
              <a href="/ik-zoek-extra-werk" className="group border-2 border-white/30 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
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
              { value: 90, suffix: "+", label: "Tevreden opdrachtgevers", icon: Heart, color: "text-pink-500" },
              { value: 500, suffix: "k+", label: "Punten verdiend", icon: Sparkles, color: "text-yellow-500" },
              { value: 4.8, suffix: "/5", label: "234 Google reviews", icon: Star, color: "text-amber-400 fill-amber-400" },
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
              <a href="/ik-zoek-extra-werk" className="group block relative bg-gradient-to-br from-indigo-50 to-white rounded-2xl sm:rounded-[2rem] shadow-lg shadow-indigo-500/5 border-2 border-indigo-100 p-7 sm:p-10 hover:shadow-2xl hover:border-indigo-300 hover:-translate-y-2 transition-all duration-400 h-full overflow-hidden">
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
                    { src: logoWestweelde, alt: "Westweelde" },
                  ].map((logo) => (
                    <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
                      <img src={logo.src} alt={logo.alt} className="h-16 sm:h-20 lg:h-24 w-auto object-contain" loading="lazy" decoding="async" />
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
            imgStyle: "bottom-[-60px] right-[-30px] h-[130%]",
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
            imgStyle: "bottom-[-60px] right-[-30px] h-[130%]",
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
            glowColor: "rgba(147,130,240,0.35)",
            ringColor: "border-purple-400/30",
            transparentBg: true,
            alt: "Professionele front-office medewerker van EXTRA in donker blazer",
            imgStyle: "bottom-[-60px] right-[-30px] h-[130%]",
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
            glowColor: "rgba(147,130,240,0.35)",
            ringColor: "border-purple-400/30",
            transparentBg: true,
            alt: "Lachende housekeeping medewerker van EXTRA met handdoeken",
            imgStyle: "bottom-[-60px] right-[-30px] h-[130%]",
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
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 sm:mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Welke EXTRA's heb je nodig?
              </h2>
              <p className="text-base sm:text-lg text-purple-100/70 leading-relaxed max-w-2xl mx-auto">
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
                Hoe EXTRA werkt
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
                { icon: Phone, step: "1", title: "Neem contact op", desc: "Bel ons of stuur je aanvraag in.", color: "from-purple-500 to-purple-700" },
                { icon: UserCheck, step: "2", title: "Kennismaking & behoefte", desc: "We bespreken je vraag en pijnpunten.", color: "from-indigo-500 to-purple-600" },
                { icon: Clock, step: "3", title: "Selectie & inzet", desc: "Wij selecteren en plannen passend personeel.", color: "from-blue-500 to-indigo-600" },
                { icon: TrendingUp, step: "4", title: "Evaluatie & vaste pool", desc: "We verwerken feedback en bouwen je favorietenpoule op.", color: "from-emerald-500 to-teal-600" },
              ] : [
                { icon: UserCheck, step: "1", title: "Solliciteer bij EXTRA", desc: "Meld je aan via het formulier.", color: "from-purple-500 to-purple-700" },
                { icon: MessageCircle, step: "2", title: "Kennismaking", desc: "We bespreken je ervaring en voorkeuren.", color: "from-violet-500 to-purple-600" },
                { icon: Briefcase, step: "3", title: "Planning & werk", desc: "Pak diensten op die bij je passen.", color: "from-indigo-500 to-purple-600" },
                { icon: Gift, step: "4", title: "Beloningen & betaling", desc: "Verdien EXTRAATjes en krijg snel betaald.", color: "from-emerald-500 to-teal-600" },
              ];
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
                  {steps.map((item, i) => (
                    <div key={`${howItWorksTab}-${i}`} className="relative group">
                      {i < steps.length - 1 && <div className="hidden lg:block absolute top-10 left-[calc(100%+0.5rem)] w-[calc(100%-3rem)] h-0.5 bg-gradient-to-r from-purple-200 to-transparent z-0" />}
                      <div className="relative bg-white rounded-2xl sm:rounded-[1.5rem] p-5 sm:p-8 border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm h-full flex flex-col">
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

          <RevealSection delay={300}>
            <div className="flex justify-center mt-10 sm:mt-12">
              <a
                href="/horeca-uitzendbureau-amsterdam-werkwijze"
                className="inline-flex items-center gap-2 font-bold px-7 py-3.5 rounded-full text-white text-sm sm:text-base transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/25"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
              >
                Lees EXTRA <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ */}
      {/* 5. EXTRAATJE / REWARDS — DEEP PURPLE            */}
      {/* ════════════════════════════════════════════════ */}
      <section id="rewards" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={5} opacity={0.1} color="rgba(255,255,255,0.8)" />

        {[
          { left: "8%", top: "15%", size: 6, delay: 0, dur: 4 },
          { left: "92%", top: "25%", size: 4, delay: 1, dur: 5 },
          { left: "15%", top: "70%", size: 5, delay: 2, dur: 3.5 },
          { left: "85%", top: "65%", size: 7, delay: 0.5, dur: 4.5 },
          { left: "25%", top: "30%", size: 3, delay: 1.5, dur: 5.5 },
          { left: "75%", top: "80%", size: 5, delay: 3, dur: 4 },
          { left: "50%", top: "10%", size: 4, delay: 2.5, dur: 3 },
          { left: "40%", top: "85%", size: 6, delay: 0.8, dur: 5 },
        ].map((dot, i) => (
          <div
            key={`float-dot-${i}`}
            className="absolute rounded-full pointer-events-none z-[5]"
            style={{
              left: dot.left,
              top: dot.top,
              width: dot.size,
              height: dot.size,
              backgroundColor: "rgba(168,85,247,0.35)",
              animation: `float-slow ${dot.dur}s ease-in-out infinite`,
              animationDelay: `${dot.delay}s`,
            }}
          />
        ))}

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
              <p className="text-base sm:text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed mb-7">
                Medewerkers verdienen automatisch punten voor elke gewerkte shift en behaalde challenge.
                Die punten wissel je in voor echte beloningen.
              </p>
              <Link
                href="/extraatje"
                className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-full text-white text-sm sm:text-base transition-all duration-200 shadow-lg shadow-purple-900/50 hover:shadow-purple-700/60 hover:scale-105"
                style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
              >
                <Gift className="h-4 w-4" />
                Lees meer over EXTRAATJE
              </Link>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            {/* Mobile: notification boven, telefoon onder */}
            {/* Desktop: telefoon midden, notificaties links en rechts */}
            <div className="flex flex-col items-center mb-16 sm:mb-24 gap-6 sm:gap-0">

              {/* Mobiele pushmelding — alleen zichtbaar op kleine schermen, in-flow */}
              <div className="sm:hidden w-full px-5 max-w-[360px]" style={{ minHeight: "130px", position: "relative" }}>
                {rewardNotifications.map((notif, i) => {
                  const isActive = activeNotification === i;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? "scale(1) translateY(0)" : "scale(0.95) translateY(4px)",
                        transition: "opacity 0.35s ease, transform 0.35s ease",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        className="rounded-2xl backdrop-blur-xl border border-white/25 px-5 py-5"
                        style={{
                          background: "rgba(255,255,255,0.13)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 0 24px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
                        }}
                      >
                        <p className="text-white font-semibold text-base leading-snug mb-3">{notif.text}</p>
                        <span
                          className="inline-flex items-center font-black px-4 py-2 rounded-full"
                          style={{
                            background: "linear-gradient(135deg, rgba(168,85,247,0.55), rgba(99,102,241,0.55))",
                            border: "1px solid rgba(168,85,247,0.55)",
                            color: "#ede9fe",
                            fontSize: "1rem",
                            letterSpacing: "0.02em",
                            boxShadow: "0 0 12px rgba(139,92,246,0.4)",
                          }}
                        >
                          {notif.points}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Telefoon + desktop notificaties */}
              <div className="relative flex justify-center" style={{ overflow: "visible" }}>
                <div className="relative w-[240px] sm:w-[280px]">
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border-[6px] border-gray-800 bg-gray-900">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[22px] bg-gray-900 rounded-b-xl z-20" />
                    <img src={screenDashboard} alt="EXTRA medewerkers app – beloningssysteem en diensten dashboard" className="w-full relative z-10" loading="lazy" decoding="async" />
                  </div>
                  <div className="absolute -inset-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-[3.5rem] blur-3xl -z-10" />
                </div>

                {/* Desktop notificaties — verborgen op mobiel */}
                {rewardNotifications.map((notif, i) => {
                  const desktopPos = [
                    { style: { left: "-300px", top: "20px" }, rot: "-2deg" },
                    { style: { right: "-300px", top: "100px" }, rot: "1.5deg" },
                    { style: { right: "-270px", top: "-10px" }, rot: "3deg" },
                  ];
                  const pos = desktopPos[i];
                  const isActive = activeNotification === i;
                  return (
                    <div
                      key={i}
                      className="hidden sm:block absolute z-30 pointer-events-none"
                      style={{
                        ...pos.style,
                        animation: isActive ? "notification-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
                        opacity: isActive ? 1 : 0,
                        transition: "opacity 0.3s ease-out",
                      }}
                    >
                      <div
                        className="rounded-2xl backdrop-blur-xl border border-white/25 w-[260px] px-5 py-4"
                        style={{
                          background: "rgba(255,255,255,0.13)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 0 24px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
                          transform: `rotate(${pos.rot})`,
                        }}
                      >
                        <p className="text-white font-semibold text-sm leading-snug mb-3">{notif.text}</p>
                        <span
                          className="inline-flex items-center gap-1.5 font-black px-4 py-1.5 rounded-full"
                          style={{
                            background: "linear-gradient(135deg, rgba(168,85,247,0.5), rgba(99,102,241,0.5))",
                            border: "1px solid rgba(168,85,247,0.5)",
                            color: "#e9d5ff",
                            fontSize: "0.9rem",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {notif.points}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stippen indicator */}
              <div className="flex justify-center gap-2 mt-4 sm:mt-5">
                {rewardNotifications.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      activeNotification === i ? "w-8 bg-purple-400" : "w-2 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="mb-12 sm:mb-16">
              <div className="text-center mb-6 sm:mb-8">
                <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <Star className="w-3.5 h-3.5" /> EXTRA beloningen
                </span>
              </div>

              <div className="relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-purple-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-purple-950 to-transparent z-10 pointer-events-none" />

                <div
                  className="flex gap-4 sm:gap-6"
                  style={{
                    animation: "marquee-scroll 40s linear infinite",
                    width: "fit-content",
                  }}
                >
                  {[...rewardItems, ...rewardItems].map((reward, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-[160px] sm:w-[200px] rounded-2xl border border-white/[0.15] p-4 sm:p-5 text-center transition-all duration-300 hover:border-purple-400/40 hover:scale-105 group"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <img
                          src={reward.image}
                          alt={reward.name}
                          className="max-w-full max-h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h5 className="text-white font-bold text-sm sm:text-base mb-2 leading-tight">{reward.name}</h5>
                      <span className="inline-block text-[10px] sm:text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
                        {reward.points}
                      </span>
                    </div>
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
                Waarom EXTRA
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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mt-4 sm:mt-6">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className={`w-4 h-4 sm:w-6 sm:h-6 ${j < 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <span className="text-base sm:text-xl font-bold text-gray-900 ml-0.5">4,8</span>
                </div>
                <span className="text-sm sm:text-base text-gray-500">gemiddeld uit <span className="font-semibold text-gray-700">232 Google reviews</span></span>
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="flex justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
              {(["medewerkers", "klanten"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setReviewTab(tab)}
                  className={`px-5 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all duration-300 ${
                    reviewTab === tab
                      ? "bg-purple-600 text-white shadow-xl shadow-purple-500/25 scale-105"
                      : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 border border-gray-200"
                  }`}
                >
                  {tab === "medewerkers" ? "Medewerkers" : "Klanten"}
                </button>
              ))}
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
            {(reviewTab === "medewerkers" ? medewerkerReviews : klantReviews).map((review, i) => (
              <RevealSection key={`${reviewTab}-${i}`} delay={i * 120}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col shadow-sm">
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <p className={`text-base sm:text-lg text-gray-600 leading-relaxed mb-6 sm:mb-8 flex-1 ${reviewTab === "klanten" ? "line-clamp-7 text-sm sm:text-base" : ""}`}>"{review.quote}"</p>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                      <span className="text-white font-bold text-sm sm:text-base">{review.name.split(" ").map((n: string) => n[0]).join("")}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{review.name}</p>
                      {reviewTab === "klanten" && (review as { role?: string; company?: string }).role ? (
                        <>
                          <p className="text-xs sm:text-sm text-gray-400 font-medium truncate">{(review as { role?: string }).role}</p>
                          <p className="text-xs text-purple-600 font-semibold truncate">{(review as { company?: string }).company}</p>
                        </>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-400 font-medium">Review van Google</p>
                      )}
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
              {
                q: "Hoe snel kunnen jullie horecapersoneel leveren?",
                a: "Bij EXTRA begrijpen we dat drukte vaak onverwacht ontstaat. Dankzij onze grote pool met ervaren horecamedewerkers kunnen we vaak snel personeel inzetten. In veel gevallen kunnen wij binnen 48 uur geschikte medewerkers voorstellen voor hotels, restaurants, events of cateringopdrachten."
              },
              {
                q: "Voor welke functies kan ik horecapersoneel inhuren?",
                a: "Via EXTRA kun je personeel inhuren voor verschillende functies binnen de horeca en hospitality. Denk aan bediening, barpersoneel, runners, chefs, front-office medewerkers en housekeeping. We kijken altijd welke medewerkers het beste passen bij de opdracht en locatie."
              },
              {
                q: "Wat kost horecapersoneel via een uitzendbureau?",
                a: "De kosten voor horecapersoneel via een uitzendbureau hangen af van verschillende factoren zoals de functie, ervaring en duur van de inzet. Bij EXTRA werken we met transparante tarieven en denken we graag mee over een passende oplossing voor jouw situatie."
              },
              {
                q: "Waarom kiezen bedrijven voor een horeca uitzendbureau?",
                a: "Veel bedrijven kiezen voor een horeca uitzendbureau omdat het flexibiliteit biedt. Je kunt snel personeel inzetten bij drukte, evenementen of ziekte. Daarnaast neemt een uitzendbureau de werving, selectie en administratie uit handen."
              },
              {
                q: "Kunnen jullie flexibel opschalen bij drukte of evenementen?",
                a: "Ja. Flexibiliteit is één van de belangrijkste voordelen van werken met EXTRA. Of het nu gaat om een groot evenement, een druk weekend of tijdelijke piek in bezetting: we kunnen snel op- en afschalen met ervaren horecapersoneel."
              },
              {
                q: "Voor wat voor soort bedrijven levert EXTRA personeel?",
                a: "EXTRA levert horecapersoneel aan verschillende bedrijven binnen de hospitalitysector, zoals hotels, eventlocaties, cateraars en restaurants. Hierdoor hebben we veel ervaring met uiteenlopende opdrachten en werkomgevingen."
              },
              {
                q: "Hoe kan ik personeel aanvragen bij EXTRA?",
                a: "Je kunt eenvoudig personeel aanvragen via het aanvraagformulier op onze website. Nadat we de aanvraag hebben ontvangen nemen we contact op om de wensen en planning te bespreken."
              },
            ].map((faq, i) => (
              <RevealSection key={i} delay={i * 60}>
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
              <a href="/aanmelden" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3">
                Ik zoek extra werk
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative text-white overflow-hidden">
        {/* Gradient: smooth transition from the dark purple CTA section above */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #1a0533 0%, #0f0320 30%, #0a0310 100%)" }} />
        <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.10), transparent)" }} />
        <XPatternBg count={2} opacity={0.03} color="rgba(168,85,247,0.5)" />

        <div className="relative z-10">
          {/* CTA strip */}
          <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">Klaar om te starten?</p>
                  <p className="text-base sm:text-lg font-bold text-white">Personeel nodig of op zoek naar extra werk?</p>
                </div>
                <div className="flex flex-col xs:flex-row gap-3 shrink-0">
                  <a
                    href="/personeelsaanvraag"
                    className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-white text-sm transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}
                  >
                    Personeel aanvragen <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="/aanmelden"
                    className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm border-2 border-white/20 hover:bg-white/10 hover:border-white/35 transition-all duration-200"
                  >
                    Solliciteer direct <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main columns */}
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-16 sm:pb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-14 sm:mb-16">

              {/* Kolom 1: Brand */}
              <div className="sm:col-span-2 lg:col-span-1">
                <Link href="/">
                  <img src={extraLogoWit} alt="EXTRA Horecapersoneel Amsterdam" className="h-8 w-auto mb-5" />
                </Link>
                <p className="text-sm leading-relaxed text-purple-200/65 mb-6 max-w-xs">
                  Hét horecauitzendbureau in Amsterdam voor hotels en evenementen. Flexibel horecapersoneel in loondienst, met het unieke beloningssysteem <span className="text-purple-300 font-semibold">EXTRAATje</span>.
                </p>
                <div className="space-y-2.5 text-sm text-purple-300/60 mb-6">
                  <a href="mailto:info@doehetextra.nl" className="flex items-center gap-2.5 hover:text-white transition-colors group">
                    <Mail className="w-4 h-4 shrink-0 group-hover:text-purple-400 transition-colors" />
                    info@doehetextra.nl
                  </a>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    Amsterdam, Nederland
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="https://instagram.com/doehetextra"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4 text-purple-300" />
                  </a>
                  <a
                    href="https://linkedin.com/company/doehetextra"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4 text-purple-300" />
                  </a>
                </div>
              </div>

              {/* Kolom 2: Werkgevers */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-5">Werkgevers</p>
                <ul className="space-y-3">
                  {[
                    { label: "Personeel aanvragen", href: "/personeelsaanvraag" },
                    { label: "Hoe het werkt", href: "/horeca-uitzendbureau-amsterdam-werkwijze" },
                    { label: "Waarom EXTRA", href: "/horeca-uitzendbureau-amsterdam" },
                    { label: "Horeca personeel", href: "/horeca-personeel-amsterdam" },
                    { label: "Hotel personeel", href: "/hotel-personeel-amsterdam" },
                    { label: "Evenementen personeel", href: "/evenementen-personeel-amsterdam" },
                    { label: "Catering personeel", href: "/catering-personeel-amsterdam" },
                  ].map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="text-sm text-purple-300/60 hover:text-white transition-colors inline-block">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Kolom 3: Werkzoekenden */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-5">Werkzoekenden</p>
                <ul className="space-y-3">
                  {[
                    { label: "Solliciteer direct", href: "/aanmelden" },
                    { label: "Vacatures", href: "/vacatures" },
                    { label: "Horeca vacatures Amsterdam", href: "/horeca-vacatures-amsterdam" },
                    { label: "Horeca werk Amsterdam", href: "/horeca-werk-amsterdam" },
                    { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
                    { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
                    { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" },
                    { label: "EXTRAATje beloningen", href: "/beloningssysteem" },
                  ].map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="text-sm text-purple-300/60 hover:text-white transition-colors inline-block">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Kolom 4: Bedrijf + trust */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-5">Bedrijf</p>
                <ul className="space-y-3 mb-7">
                  {[
                    { label: "Over EXTRA", href: "/over-extra" },
                    { label: "Ons team", href: "/ons-team" },
                    { label: "Klantcases", href: "/klantcases-horeca" },
                    { label: "Nieuws & blog", href: "/blog" },
                    { label: "Contact", href: "/contact" },
                  ].map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="text-sm text-purple-300/60 hover:text-white transition-colors inline-block">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <div
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                  style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}
                >
                  <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-purple-300">NEN 4400-1 gecertificeerd</p>
                    <p className="text-[10px] text-purple-400/60 leading-tight">Gecertificeerd uitzendbureau</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom bar */}
            <div className="border-t pt-7 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <p className="text-xs text-purple-300/35 text-center sm:text-left">
                © {new Date().getFullYear()} EXTRA Uitzendbureau B.V. · KvK 91860903 · Amsterdam
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-purple-300/40">
                <a href="/privacybeleid" className="hover:text-white transition-colors">Privacybeleid</a>
                <a href="/voorwaarden" className="hover:text-white transition-colors">Algemene voorwaarden</a>
                <a href="/cookiebeleid" className="hover:text-white transition-colors">Cookiebeleid</a>
                <a href="/contact" className="hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Hoe snel kunnen jullie horecapersoneel leveren?", "acceptedAnswer": { "@type": "Answer", "text": "Bij EXTRA begrijpen we dat drukte vaak onverwacht ontstaat. Dankzij onze grote pool met ervaren horecamedewerkers kunnen we vaak snel personeel inzetten. In veel gevallen kunnen wij binnen 48 uur geschikte medewerkers voorstellen voor hotels, restaurants, events of cateringopdrachten." } },
          { "@type": "Question", "name": "Voor welke functies kan ik horecapersoneel inhuren?", "acceptedAnswer": { "@type": "Answer", "text": "Via EXTRA kun je personeel inhuren voor verschillende functies binnen de horeca en hospitality. Denk aan bediening, barpersoneel, runners, chefs, front-office medewerkers en housekeeping. We kijken altijd welke medewerkers het beste passen bij de opdracht en locatie." } },
          { "@type": "Question", "name": "Wat kost horecapersoneel via een uitzendbureau?", "acceptedAnswer": { "@type": "Answer", "text": "De kosten voor horecapersoneel via een uitzendbureau hangen af van verschillende factoren zoals de functie, ervaring en duur van de inzet. Bij EXTRA werken we met transparante tarieven en denken we graag mee over een passende oplossing voor jouw situatie." } },
          { "@type": "Question", "name": "Waarom kiezen bedrijven voor een horeca uitzendbureau?", "acceptedAnswer": { "@type": "Answer", "text": "Veel bedrijven kiezen voor een horeca uitzendbureau omdat het flexibiliteit biedt. Je kunt snel personeel inzetten bij drukte, evenementen of ziekte. Daarnaast neemt een uitzendbureau de werving, selectie en administratie uit handen." } },
          { "@type": "Question", "name": "Kunnen jullie flexibel opschalen bij drukte of evenementen?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Flexibiliteit is één van de belangrijkste voordelen van werken met EXTRA. Of het nu gaat om een groot evenement, een druk weekend of tijdelijke piek in bezetting: we kunnen snel op- en afschalen met ervaren horecapersoneel." } },
          { "@type": "Question", "name": "Voor wat voor soort bedrijven levert EXTRA personeel?", "acceptedAnswer": { "@type": "Answer", "text": "EXTRA levert horecapersoneel aan verschillende bedrijven binnen de hospitalitysector, zoals hotels, eventlocaties, cateraars en restaurants. Hierdoor hebben we veel ervaring met uiteenlopende opdrachten en werkomgevingen." } },
          { "@type": "Question", "name": "Hoe kan ik personeel aanvragen bij EXTRA?", "acceptedAnswer": { "@type": "Answer", "text": "Je kunt eenvoudig personeel aanvragen via het aanvraagformulier op onze website. Nadat we de aanvraag hebben ontvangen nemen we contact op om de wensen en planning te bespreken." } },
        ]
      }) }} />
    </div>
  );
}
