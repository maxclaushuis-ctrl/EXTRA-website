import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  ArrowRight, ChevronRight, ChevronDown, Zap, Star, Clock,
  Gift, Users, CheckCircle2, MessageCircle, Building2,
  UtensilsCrossed, BedDouble, ChefHat, ConciergeBell, Menu, X,
  UserCheck, Trophy, CalendarCheck, Handshake, Globe, Smile, Moon
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import frontOfficeImg from "@assets/Front-office_1771842663934.webp";
import frontOffice2Img from "@assets/Front-office_1771842809388.webp";
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
import dienstFrontOfficeImg from "@/assets/images/dienst-frontoffice.jpg";
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

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function XBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[{ left: "4%", top: "10%", w: 180, rot: 15, op: 0.07 }, { left: "76%", top: "14%", w: 140, rot: -8, op: 0.05 }, { left: "47%", top: "70%", w: 160, rot: 25, op: 0.06 }].map((x, i) => (
        <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity: x.op, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: "rgba(139,92,246,1)" }} />
      ))}
    </div>
  );
}

function XBgDark() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[{ left: "5%", top: "8%", w: 220, rot: 15, op: 0.1 }, { left: "78%", top: "52%", w: 260, rot: -20, op: 0.08 }].map((x, i) => (
        <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity: x.op, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: "rgba(255,255,255,0.9)" }} />
      ))}
    </div>
  );
}

const NAV_ITEMS = [
  { label: "Hospitality", href: "/en/hospitality-work", icon: UtensilsCrossed },
  { label: "Housekeeping", href: "/en/housekeeping-jobs", icon: BedDouble },
  { label: "Chef", href: "/en/chef-jobs", icon: ChefHat },
  { label: "Front Office", href: "/en/front-office-jobs", icon: ConciergeBell },
];

const functies = [
  { title: "Front office employee", sub: "Hotels · Reception · Guest-oriented", img: frontOfficeImg, desc: "Front office jobs in Amsterdam for guest-oriented employees. The first point of contact for hotel guests, from check-in to a perfect welcome.", bullets: ["Front office jobs Amsterdam", "Hospitable and professional", "International work environment"], color: "from-indigo-500 to-blue-700", href: "/aanmelden" },
  { title: "Hotel receptionist", sub: "Check-in · Reservations · Service", img: frontOffice2Img, desc: "Receptionist jobs at five-star hotels in Amsterdam. Process reservations and guide guests upon arrival for a flawless hotel experience.", bullets: ["Receptionist jobs hotel", "Front-desk experience", "Five-star hotel chains"], color: "from-purple-600 to-violet-700", href: "/aanmelden" },
  { title: "Guest service employee", sub: "Guest experience · Hospitality · Support", img: dienstFrontOfficeImg, desc: "Front office employee in a guest service role. Support at the reception and guest experience on a flexible basis at hotels and hospitality venues.", bullets: ["Flexible front office shifts", "Guest-oriented work", "Hotels and hospitality venues"], color: "from-teal-500 to-cyan-600", href: "/aanmelden" },
  { title: "Night receptionist", sub: "Night shift · Oversight · Calm", img: hotelImg, desc: "Hotel receptionist Amsterdam in the night shift. Calm, oversight, and responsibility in a unique and independent role.", bullets: ["Hotel receptionist Amsterdam", "Independent work environment", "Build a steady pool"], color: "from-slate-600 to-gray-700", href: "/aanmelden" },
];

const reviews = [
  { name: "Emma L.", functie: "Front office employee", tekst: "Through EXTRA, I work at the desk of beautiful hotels. The atmosphere is professional and the locations are top-notch. Exactly what I was looking for.", rating: 5 },
  { name: "Thijs K.", functie: "Hotel receptionist", tekst: "Same-day pay via Jixbee makes the difference. The money is in my account right after my shift. No hassle, just clear.", rating: 5 },
  { name: "Laila B.", functie: "Guest service employee", tekst: "I combine my hospitality studies with front-office work through EXTRA. The scheduling is flexible and the shifts fit well with my schedule.", rating: 5 },
];

const faqs = [
  { q: "Do I need experience as a receptionist?", a: "Some hospitality experience is a plus, but not always required for front office work. We look at your communication skills, professional appearance, and guest-oriented attitude. For some front office jobs in Amsterdam, we offer a short on-site introduction." },
  { q: "Will I always work in the same hotel?", a: "In many cases, yes. We try to link you to a steady pool at one or more hotels, so you know the procedures and feel comfortable as a hotel receptionist in the team quickly." },
  { q: "Can I choose my own shifts?", a: "Yes. You submit your availability and we provide suitable front office shifts. This allows you to combine your work as a front office employee with your studies, another job, or other activities." },
  { q: "How does payment work?", a: "After your shift, you are paid via Jixbee. The amount is usually in your account the same day. This is how front office work via EXTRA works: transparent, fast, and without surprises." },
  { q: "How soon can I start?", a: "After your registration and a short introduction, you can often start receptionist work within a week. We do our best to make the start as smooth as possible." },
];

const LOGOS = [
  { src: amrathLogo, alt: "Amrâth Hotels" }, { src: mercureLogo, alt: "Mercure Hotels" }, { src: pulitzerLogo, alt: "Pulitzer Amsterdam" },
  { src: logoFcUtrecht, alt: "FC Utrecht" }, { src: logoFunda, alt: "Funda" },
  { src: logoHartMuseum, alt: "H'art Museum" }, { src: logoHetePeper, alt: "Hete Peper" }, { src: hiltonLogo, alt: "Hilton" },
  { src: marriottLogo, alt: "Marriott" }, { src: logoSelectCatering, alt: "Select Catering" }, { src: logoAppel, alt: "Appèl" },
];

export default function FrontOfficeJobsEn() {
  const [scrolled, setScrolled] = useState(false);
  const ACTIVE = "/en/front-office-jobs";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = "Front Office Jobs Amsterdam | Hotel Reception | EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Looking for front office jobs or receptionist work in Amsterdam? Through EXTRA, you work in top hotels with flexible shifts and same-day pay.");
    setMeta("og:title", "Front Office Jobs Amsterdam | Hotel Reception | EXTRA", true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <PublicNav />

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}>
        <XBgDark />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <ConciergeBell className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">Front office jobs via EXTRA</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Front-office work{" "}
              <span className="relative inline-block">
                <span className="relative z-10">that fits you.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-3.5 bg-gradient-to-r from-cyan-400 to-blue-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/90 max-w-xl leading-relaxed font-medium mb-8">
              Work as a hotel receptionist or front office employee at top hotels in Amsterdam. With EXTRA, you choose your own shifts. Flexible front office work with same-day pay and professional hotel environments.
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
              {[{ emoji: "⚡", label: "Same-day pay via Jixbee" }, { emoji: "🏨", label: "Top hotels Amsterdam" }, { emoji: "📅", label: "Flexible shifts" }].map(({ emoji, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">{emoji} {label}</span>
              ))}
            </div>
          </div>
          <div className="relative flex justify-center items-center">
            <div className="relative w-full max-w-sm">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/40 border-4 border-white/20">
                <img src={frontOfficeImg} alt="Front office employee via EXTRA – hotel receptionist Amsterdam" className="w-full h-[380px] sm:h-[440px] object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent rounded-3xl" />
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-cyan-100">💰 Same-day pay active</div>
              <div className="absolute -bottom-3 -left-4 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-green-100">🏨 Hotel receptionist work</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUST STRIP ══ */}
      <section className="py-10 sm:py-14 bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Work at hotels you can be proud of</p>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee-fow group-hover:[animation-play-state:paused]">
              {[0, 1].map((setIdx) => (
                <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                  {LOGOS.map((logo) => (
                    <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
                      <img src={logo.src} alt={logo.alt} className="h-16 sm:h-20 lg:h-24 w-auto object-contain" loading="lazy" decoding="async" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`@keyframes marquee-fow { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} } .animate-marquee-fow { animation: marquee-fow 40s linear infinite; }`}</style>
      </section>

      {/* ══ FUNCTIES ══ */}
      <section id="functies" className="py-16 sm:py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Your field</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Which front-office roles can you do through EXTRA?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Through EXTRA, you work as a hotel receptionist, front office employee, or guest service employee at hotels in Amsterdam. We link you to hotels that match your level and wishes. Also view{" "}
                <a href="/en/hospitality-work" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">hospitality work</a>,{" "}
                <a href="/en/housekeeping-jobs" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">housekeeping work</a> or{" "}
                <a href="/en/chef-jobs" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">chef jobs</a>.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {functies.map((f, i) => (
              <RevealSection key={f.title} delay={i * 70}>
                <article className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-purple-100 shadow-md hover:shadow-2xl hover:border-purple-200 hover:-translate-y-2 transition-all h-full flex flex-col">
                  <div className={`relative h-44 sm:h-52 overflow-hidden bg-gradient-to-br ${f.color}`}>
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover mix-blend-overlay group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="p-5 sm:p-7 flex flex-col flex-grow">
                    <div className="mb-4 flex-grow">
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">{f.sub}</span>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-2.5">{f.title}</h3>
                      <p className="text-gray-500 text-xs sm:text-sm mt-2 leading-relaxed">{f.desc}</p>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {f.bullets.map(b => (
                        <li key={b} className="flex items-start gap-2 text-[11px] sm:text-[13px] font-bold text-gray-700">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 shrink-0 mt-0.5" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <a href={f.href} className="w-full bg-gray-50 hover:bg-purple-600 hover:text-white text-gray-900 font-black py-3 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 group/btn text-sm sm:text-base">
                      Sign up <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </article>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ USP SECTION ══ */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-purple-900" />
        <XBgDark />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <span className="text-cyan-400 text-sm font-black uppercase tracking-[0.2em] mb-4 block">The EXTRA benefits</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-[1.1] mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Why work as a receptionist via EXTRA?
              </h2>
              <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                {[
                  { icon: Zap, title: "Same-day pay", desc: "Work today, get paid today. Transparent via Jixbee." },
                  { icon: Gift, title: "EXTRAATJE points", desc: "Earn points every shift for cool rewards." },
                  { icon: Clock, title: "You are in control", desc: "Decide when and where you work at hotels." },
                  { icon: Trophy, title: "Premium locations", desc: "Work at Marriott, Hilton, or Pulitzer Amsterdam." },
                  { icon: Users, title: "The best pool", desc: "Join an community of hospitality professionals." },
                  { icon: UserCheck, title: "Quick start", desc: "Sign up today and start your first shift fast." }
                ].map((usp, i) => (
                  <div key={usp.title} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 sm:p-6 rounded-2xl sm:rounded-3xl hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                      <usp.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-white font-black text-base sm:text-lg mb-1.5">{usp.title}</h3>
                    <p className="text-purple-100/60 text-xs sm:text-sm leading-relaxed">{usp.desc}</p>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200}>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] overflow-hidden p-3 sm:p-4">
                  <div className="aspect-[4/5] rounded-[2rem] overflow-hidden relative">
                    <img src={frontOffice2Img} alt="Hotel receptionist Amsterdam via EXTRA" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-purple-200" />)}
                        </div>
                        <span className="text-white/90 text-xs font-bold">+120 others active today</span>
                      </div>
                      <p className="text-white text-lg sm:text-xl font-black leading-tight">Become the face of Amsterdam's finest hotels.</p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══ JIXBEE SECTION ══ */}
      <section className="py-20 sm:py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <div className="relative group">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="pt-12">
                    <img src={jixbeeUren} alt="Jixbee app - worked hours" className="rounded-3xl shadow-2xl border border-gray-100 hover:-translate-y-2 transition-transform duration-500" />
                  </div>
                  <div>
                    <img src={jixbeePayout} alt="Jixbee app - same-day payout success" className="rounded-3xl shadow-2xl border border-gray-100 hover:translate-y-2 transition-transform duration-500" />
                  </div>
                </div>
              </div>
            </RevealSection>
            <RevealSection delay={200}>
              <div className="inline-flex items-center gap-2 bg-purple-50 rounded-full px-4 py-1.5 mb-6 border border-purple-100 text-purple-600 text-xs font-black uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5 fill-purple-600" /> Fast payment
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-[1.1] mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Worked today? <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Paid today.</span>
              </h2>
              <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8 font-medium">
                No more waiting for weeks. Through our integration with Jixbee, you get your money right after your shift. Transparent, fast, and automated. So you always have your extra cash on hand.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  { t: "Automated payouts", d: "Money is deposited directly after shift approval." },
                  { t: "Full transparency", d: "See exactly what you earned per hour and shift." },
                  { t: "Directly in your account", d: "No hassle with invoices, it works automatically." }
                ].map(item => (
                  <div key={item.t} className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm sm:text-base">{item.t}</h4>
                      <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="/aanmelden" className="bg-gray-900 text-white font-black px-8 py-4 rounded-full hover:bg-purple-700 transition-all flex items-center justify-center gap-2 w-fit">
                Start working via EXTRA <ArrowRight className="w-5 h-5" />
              </a>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══ REVIEWS ══ */}
      <section className="py-20 sm:py-28 bg-gray-50 relative overflow-hidden">
        <XBg />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>What our colleagues say</h2>
              <p className="text-gray-500 text-base sm:text-lg">Experience the freedom of front office work via EXTRA.</p>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {reviews.map((r, i) => (
              <RevealSection key={r.name} delay={i * 100}>
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-purple-50 relative group hover:-translate-y-2 transition-all duration-300">
                  <div className="absolute top-6 right-8 text-purple-100 group-hover:text-purple-200 transition-colors">
                    <MessageCircle className="w-10 h-10 fill-current" />
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(r.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-gray-700 italic mb-6 relative z-10 text-sm sm:text-base leading-relaxed">"{r.tekst}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-black text-sm sm:text-base">{r.name[0]}</div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm sm:text-base">{r.name}</h4>
                      <p className="text-purple-600 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">{r.functie}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <span className="text-purple-600 text-sm font-black uppercase tracking-widest mb-4 block">FAQ</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Common questions</h2>
            </div>
          </RevealSection>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <RevealSection key={i} delay={i * 50}>
                <details className="group bg-white border-2 border-purple-50 rounded-2xl sm:rounded-3xl overflow-hidden hover:border-purple-100 transition-all shadow-sm shadow-purple-500/5">
                  <summary className="list-none flex items-center justify-between p-5 sm:p-7 cursor-pointer">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 pr-4">{f.q}</h3>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                      <ChevronDown className="w-5 h-5 text-purple-600" />
                    </div>
                  </summary>
                  <div className="px-5 pb-5 sm:px-7 sm:pb-7">
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed border-t border-purple-50 pt-5">{f.a}</p>
                  </div>
                </details>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-800" />
        <XBgDark />
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative z-10">
          <RevealSection>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Ready for your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">next front-office shift?</span>
            </h2>
            <p className="text-purple-100 text-lg sm:text-xl mb-10 max-w-2xl mx-auto font-medium">
              Join EXTRA today. Work at the most beautiful hotels in Amsterdam, choose your own hours and get paid the same day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/aanmelden" className="bg-white text-purple-900 font-black px-10 py-5 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Sign up direct <ArrowRight className="w-6 h-6" />
              </a>
              <a href="/contact" className="bg-purple-600/30 backdrop-blur-md border-2 border-white/20 text-white font-black px-10 py-5 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Contact us <MessageCircle className="w-6 h-6" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <PublicFooter />

    </div>
  );
}
