import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  ArrowRight, ChevronRight, ChevronDown, Zap, Star, Clock,
  Gift, Users, CheckCircle2, MessageCircle, Building2,
  UtensilsCrossed, BedDouble, ChefHat, ConciergeBell, Menu, X,
  UserCheck, Trophy, CalendarCheck, Handshake, Flame, Award,
  Utensils, Hotel, Banknote, MapPin
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import chefImg from "@assets/Chef_1771833440047.webp";
import marriottLogo from "@assets/Logo_Marriott_1771267205959.webp";
import amrathLogo from "@assets/Logo_amrath_1771267205959.webp";
import mercureLogo from "../../assets/pitch/logo-mercure.png";
import pulitzerLogo from "../../assets/pitch/logo-pulitzer-clean.png";
import nhLogo from "../../assets/pitch/logo-nh-clean.png";
import hiltonLogo from "@assets/Logo_Hilton_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import jixbeeUren from "@assets/Jixbee_Gewerkte_uren_1772454264961.webp";
import jixbeePayout from "@assets/Jixbee_Payout_succes_1772454264961.webp";
import dienstChefImg from "@/assets/images/dienst-chef.jpg";
import cateringImg from "@/assets/images/blog-catering.jpg";
import hotelImg from "@/assets/images/blog-hotel.jpg";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.07, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function XPatternBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[
        { left: "4%", top: "10%", w: 180, rot: 15, op: 0.07 },
        { left: "76%", top: "14%", w: 140, rot: -8, op: 0.05 },
        { left: "47%", top: "70%", w: 160, rot: 25, op: 0.06 },
      ].map((x, i) => (
        <div key={i} className="absolute" style={{
          left: x.left, top: x.top, width: x.w, height: x.w,
          transform: `rotate(${x.rot}deg)`, opacity: x.op,
          WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          backgroundColor: "rgba(139,92,246,1)",
        }} />
      ))}
    </div>
  );
}

function XPatternBgDark() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[
        { left: "5%", top: "8%", w: 220, rot: 15, op: 0.1 },
        { left: "78%", top: "52%", w: 260, rot: -20, op: 0.08 },
      ].map((x, i) => (
        <div key={i} className="absolute" style={{
          left: x.left, top: x.top, width: x.w, height: x.w,
          transform: `rotate(${x.rot}deg)`, opacity: x.op,
          WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          backgroundColor: "rgba(255,255,255,0.9)",
        }} />
      ))}
    </div>
  );
}

const functies = [
  {
    title: "Independent Chef",
    sub: "Restaurants · Hotels · Independent",
    img: chefImg,
    desc: "Independent chef vacancy? Via EXTRA, you can run a kitchen at a high level or provide reinforcement at restaurants and hotels in Amsterdam.",
    bullets: ["High-level chef vacancies", "Diverse kitchen styles", "Day and evening shifts"],
    color: "from-orange-500 to-red-600",
    href: "/aanmelden",
  },
  {
    title: "Chef de Partie",
    sub: "Hotels · Fine Dining · Brigades",
    img: dienstChefImg,
    desc: "Chef de partie vacancy at five-star hotels or fine dining brigades. Responsible for your own section in a professional kitchen.",
    bullets: ["Chef de partie vacancies Amsterdam", "Work in a brigade", "Growth opportunities"],
    color: "from-purple-600 to-violet-700",
    href: "/aanmelden",
  },
  {
    title: "Events and Catering Kitchen",
    sub: "Gala · Festivals · Corporate",
    img: cateringImg,
    desc: "Kitchen vacancies Amsterdam for events and catering. Cooking at unique locations for gala dinners, corporate events, and festivals.",
    bullets: ["Kitchen vacancies Amsterdam", "Large-scale production", "Day and evening availability"],
    color: "from-teal-500 to-cyan-600",
    href: "/aanmelden",
  },
  {
    title: "Banqueting Kitchen",
    sub: "Hotels · Setup · Precision",
    img: hotelImg,
    desc: "Chef work in a production-oriented hotel kitchen. Banqueting at large hotel groups requires teamwork, speed, and consistency.",
    bullets: ["Chef work at hotel groups", "Large team, clear structure", "Good guidance"],
    color: "from-indigo-500 to-blue-700",
    href: "/aanmelden",
  },
];

const reviews = [
  { name: "Rik D.", functie: "Independent Chef", tekst: "Through EXTRA, I work in kitchens at my own level. No fixed commitment, but serious work at serious locations.", rating: 5 },
  { name: "Yusuf A.", functie: "Chef de Partie", tekst: "Daily payment via Jixbee really makes a difference. I don't have to wait until the end of the month. That gives peace of mind.", rating: 5 },
  { name: "Julia V.", functie: "Events Kitchen", tekst: "I do catering events through EXTRA. Every time a different location, every time a new team. That keeps it fun and challenging.", rating: 5 },
];

const faqs = [
  { q: "Do I need to have experience as a chef?", a: "Yes, for most chef work roles, demonstrable kitchen experience is required. We look at your level and match you with suitable kitchens. For supporting kitchen roles, less experience is sometimes sufficient." },
  { q: "Can I decide where I work?", a: "You indicate your preference regarding kitchen style and location, and we look for suitable kitchen vacancies. You are not obliged to accept a fixed location." },
  { q: "How does payment work?", a: "After your shift, you are paid via Jixbee. The amount is usually in your account the same day. That's how chef work through EXTRA works: transparent and without hassle." },
  { q: "Do I always work at the same location?", a: "That's not necessary. Some chefs choose a fixed pool at a hotel or restaurant, others prefer to pick up varied kitchen vacancies. Both are possible through EXTRA." },
  { q: "How quickly can I start?", a: "After your registration and a short introduction, you can start your first chef work shifts within a week. We try to keep the threshold as low as possible." },
];

export default function ChefJobsEn() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = "Chef Jobs Amsterdam | Kitchen Jobs | EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Looking for chef or kitchen work in Amsterdam? Work in hotels, restaurants, and events through EXTRA with flexible shifts and daily payment.");
    setMeta("og:title", "Chef Jobs Amsterdam | Kitchen Jobs | EXTRA", true);
    setMeta("og:type", "website", true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══ NAV ══ */}
      <PublicNav />

      {/* ══ 1. HERO ══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}>
        <XPatternBgDark />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <ChefHat className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">Chef vacancies via EXTRA</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Chef work that fits{" "}
              <span className="relative inline-block">
                <span className="relative z-10">your level.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-3.5 bg-gradient-to-r from-orange-400 to-yellow-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-purple-100/90 max-w-xl leading-relaxed font-medium mb-8">
              Work as a chef or cook at restaurants, hotels, and events in Amsterdam. Through EXTRA, you choose your own shifts. Flexible chef work with daily payment and professional kitchens.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/aanmelden" className="group bg-white text-purple-900 font-bold px-7 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Sign up <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#functies" className="border-2 border-white/30 text-white font-bold px-7 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                See how it works <ChevronRight className="w-5 h-5" />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {[
                { emoji: "⚡", label: "Daily payment via Jixbee" },
                { emoji: "🍳", label: "Top-level kitchens" },
                { emoji: "📅", label: "Flexible shifts" },
              ].map(({ emoji, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {emoji} {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center items-center">
            <div className="relative w-full max-w-sm">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/40 border-4 border-white/20">
                <img src={chefImg} alt="Chef via EXTRA – chef vacancies Amsterdam" className="w-full h-[380px] sm:h-[440px] object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent rounded-3xl" />
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-orange-100">
                💰 Daily payment active
              </div>
              <div className="absolute -bottom-3 -left-4 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-green-100">
                🍳 Chef vacancies Amsterdam
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. TRUST STRIP ══ */}
      <section className="py-10 sm:py-14 bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Work in kitchens you can be proud of</p>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee-cw group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                  {[
                    { src: amrathLogo, alt: "Amrâth Hotels" },
                    { src: mercureLogo, alt: "Mercure Hotels" },
                    { src: pulitzerLogo, alt: "Pulitzer Amsterdam" },
                    { src: logoFcUtrecht, alt: "FC Utrecht" },
                    { src: logoFunda, alt: "Funda" },
                    { src: logoHartMuseum, alt: "H'art Museum" },
                    { src: logoHetePeper, alt: "Hete Peper" },
                    { src: hiltonLogo, alt: "Hilton" },
                    { src: marriottLogo, alt: "Marriott" },
                    { src: logoSelectCatering, alt: "Select Catering" },
                    { src: logoAppel, alt: "Appèl" },
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
          @keyframes marquee-cw {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-cw {
            animation: marquee-cw 40s linear infinite;
          }
        `}</style>
      </section>

      {/* ══ 3. FUNCTIES ══ */}
      <section id="functies" className="py-24 sm:py-32 bg-white relative overflow-hidden">
        <XPatternBg />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Chef vacancies for <span className="text-purple-600">every specialty.</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto font-medium">
              From fine dining to large-scale events. At EXTRA, we have chef work at the level that suits your experience and ambition.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {functies.map((f, i) => (
              <RevealSection key={i} delay={i * 100} className="group h-full">
                <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 flex flex-col h-full hover:-translate-y-2">
                  <div className="relative h-56 overflow-hidden">
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-6">
                      <p className="text-white/90 text-xs font-black uppercase tracking-widest">{f.sub}</p>
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-black text-gray-900 mb-4">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">{f.desc}</p>
                    <ul className="space-y-3 mb-8">
                      {f.bullets.map((b, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-xs font-bold text-gray-700">
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${f.color}`} />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <a href={f.href} className="w-full py-4 rounded-2xl bg-gray-50 text-gray-900 font-bold text-sm text-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 border border-gray-100 group-hover:border-purple-600">
                      Sign up now
                    </a>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. STEPS ══ */}
      <section className="py-24 sm:py-32 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/extra-pattern.svg')] opacity-5" />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Start working as a chef <span className="text-orange-400">within a week.</span>
              </h2>
              <div className="space-y-8 sm:space-y-10">
                {[
                  { step: "01", title: "Online application", desc: "Fill in your details and experience in 2 minutes via our website." },
                  { step: "02", title: "Meet & Greet", desc: "We'll invite you for a short introduction to discuss your level and preferences." },
                  { step: "03", title: "Choose your shifts", desc: "Pick the shifts that suit you in our app and start working immediately." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-4xl sm:text-5xl font-black text-white/10 select-none leading-none">{s.step}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                      <p className="text-purple-100/60 leading-relaxed text-sm sm:text-base">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12">
                <a href="/aanmelden" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-10 py-4 rounded-full transition-all hover:-translate-y-1 shadow-lg shadow-orange-500/20">
                  Register now <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </RevealSection>
            <RevealSection delay={200} className="relative">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[3rem] p-10 sm:p-14 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10">
                  <Flame className="w-16 h-16 text-orange-400 mb-8" />
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-6">Why chefs choose EXTRA:</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {[
                      { icon: Banknote, label: "Weekly or Daily pay", desc: "You decide when you want to be paid via Jixbee." },
                      { icon: Award, label: "Points for prizes", desc: "Every shift earns you points for cool rewards." },
                      { icon: Clock, label: "Maximum flexibility", desc: "Full control over your own agenda and kitchen style." },
                      { icon: Hotel, label: "Premium locations", desc: "Work in the best hotels and restaurants in Amsterdam." },
                    ].map((item, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                        <item.icon className="w-6 h-6 text-orange-400 mb-3" />
                        <h4 className="text-white font-bold text-sm mb-1">{item.label}</h4>
                        <p className="text-white/60 text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══ 5. JIXBEE DAILY PAY ══ */}
      <section className="py-24 sm:py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/10 blur-[80px] rounded-full" />
                <div className="relative grid grid-cols-2 gap-4">
                  <img src={jixbeeUren} alt="Jixbee worked hours" className="w-full rounded-2xl shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-500" />
                  <img src={jixbeePayout} alt="Jixbee payout success" className="w-full rounded-2xl shadow-xl transform rotate-3 translate-y-8 hover:rotate-0 transition-transform duration-500" />
                </div>
              </div>
            </RevealSection>
            <RevealSection className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 mb-6 border border-green-200">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-black uppercase tracking-widest text-green-700">Instant Payout</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Paid today for the <span className="text-purple-600">work you did today.</span>
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed font-medium">
                No more waiting for the end of the month. Through our partner Jixbee, you can have your earned salary in your account immediately after your shift.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Decide yourself when you get paid",
                  "Direct overview of your hours and earnings",
                  "Transparent and without hidden costs",
                  "Available for every shift via EXTRA"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-800 font-bold">
                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/aanmelden" className="inline-flex items-center gap-2 bg-gray-900 text-white font-black px-10 py-4 rounded-full hover:bg-gray-800 transition-all hover:-translate-y-1">
                Start immediately <ArrowRight className="w-5 h-5" />
              </a>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══ 6. REVIEWS ══ */}
      <section className="py-24 sm:py-32 bg-purple-50 relative overflow-hidden">
        <XPatternBg />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Chefs about <span className="text-purple-600">EXTRA</span>
            </h2>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />)}
            </div>
            <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">Average rating: 4.9/5</p>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((r, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 h-full border border-purple-100 flex flex-col">
                  <div className="flex gap-1 mb-6">
                    {[...Array(r.rating)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-gray-700 italic mb-8 flex-grow leading-relaxed font-medium">"{r.tekst}"</p>
                  <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-black text-purple-600 text-lg uppercase">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-base">{r.name}</p>
                      <p className="text-purple-600 text-xs font-bold uppercase tracking-wider">{r.functie}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. REGIO'S ══ */}
      <section className="py-24 sm:py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Active in the <span className="text-purple-600">entire Amsterdam region.</span>
              </h2>
              <p className="text-gray-600 text-lg mb-10 leading-relaxed font-medium">
                Whether you want to work in a hotel in Amsterdam Center, a restaurant in South, or at an event in North. We have the best chef vacancies throughout the city.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {[
                  "Amsterdam Center", "Amsterdam South", "Amsterdam North",
                  "Amsterdam East", "Amsterdam West", "Amsterdam Schiphol"
                ].map((regio) => (
                  <div key={regio} className="flex items-center gap-3 bg-purple-50 rounded-2xl px-5 py-4 border border-purple-100">
                    <MapPin className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="font-bold text-gray-800 text-sm sm:text-base">{regio}</span>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200}>
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl">
                <img src={cateringImg} alt="Kitchen vacancies Amsterdam regions" className="w-full h-[500px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent" />
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══ 8. FAQ ══ */}
      <FAQSection
        heading="FAQ Chef work"
        faqs={faqs}
      />

      {/* ══ 9. CTA ══ */}
      <section className="py-24 sm:py-32 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/extra-pattern.svg')] opacity-5" />
        <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
          <RevealSection>
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Time for a new <span className="text-orange-400 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">challenge in the kitchen?</span>
            </h2>
            <p className="text-purple-100/70 text-lg sm:text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
              Sign up today and start working as a chef at top locations in Amsterdam this week. Choose flexibility, quality, and daily payment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/aanmelden" className="bg-white text-purple-900 font-black px-12 py-5 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Sign up direct <ArrowRight className="w-6 h-6" />
              </a>
              <Link href="/contact" className="border-2 border-white/20 text-white font-bold px-12 py-5 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Questions? Contact us
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
