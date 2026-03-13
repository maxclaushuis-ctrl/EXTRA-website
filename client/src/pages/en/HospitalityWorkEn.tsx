import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  ArrowRight, ChevronRight, ChevronDown, Zap, Star, Clock,
  MapPin, Gift, Users, CheckCircle2, MessageCircle, Building2,
  UtensilsCrossed, BedDouble, ChefHat, ConciergeBell, Menu, X,
  UserCheck, Trophy, Beer, PartyPopper, Layers, Banknote,
  CalendarCheck, Handshake
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import horecaImg from "@assets/Horecamedewerker_1771836004844.webp";
import marriottLogo from "@assets/Logo_Marriott_1771267205959.webp";
import amrathLogo from "@assets/Logo_amrath_1771267205959.webp";
import mercureLogo from "../../assets/pitch/logo-mercure.png";
import pulitzerLogo from "@assets/Logo_Pulitzer_1773389329669.png";
import nhLogo from "@assets/Logo_NH_1773389329669.png";
import hiltonLogo from "@assets/Logo_Hilton_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import jixbeeUren from "@assets/Jixbee_Gewerkte_uren_1772454264961.webp";
import jixbeePayout from "@assets/Jixbee_Payout_succes_1772454264961.webp";
import baristaImg from "@/assets/images/blog-barista.jpg";
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
    title: "Service",
    sub: "Restaurants · Hotels · Events",
    img: horecaImg,
    desc: "Serve in restaurants, hotel dining, and at corporate dinners. You are the face of the evening.",
    bullets: ["Day and evening shifts", "Hotels, restaurants, and events", "Professional brigades"],
    color: "from-purple-600 to-violet-700",
    href: "/aanmelden",
  },
  {
    title: "Bar",
    sub: "Barista · Cocktails · Beer",
    img: baristaImg,
    desc: "Tap beer, mix cocktails, or prepare coffee at top locations. From traditional pubs to rooftop bars.",
    bullets: ["Creative and varied", "Top hospitality locations", "All levels welcome"],
    color: "from-amber-500 to-orange-600",
    href: "/aanmelden",
  },
  {
    title: "Events and Catering",
    sub: "Gala · Festivals · Trade shows",
    img: cateringImg,
    desc: "Work at gala dinners, festivals, and corporate events. Never the same, always worthwhile.",
    bullets: ["Unique locations and atmosphere", "Day and evening available", "From small to large scale"],
    color: "from-blue-600 to-indigo-700",
    href: "/aanmelden",
  },
  {
    title: "Banqueting",
    sub: "Hotels · Setup · Precision",
    img: hotelImg,
    desc: "Setting up, serving, and clearing at hotel events. Structure, teamwork, and precision.",
    bullets: ["Five-star hotel groups", "Team-oriented work", "Professional guidance"],
    color: "from-emerald-500 to-teal-600",
    href: "/aanmelden",
  },
];

const reviews = [
  { name: "Sophie B.", functie: "Bartender", tekst: "Through EXTRA I work at beautiful locations and I decide my own schedule. Exactly what I was looking for alongside my studies.", rating: 5 },
  { name: "Daan V.", functie: "Service", tekst: "Same-day payment via Jixbee is a real game changer. The money is there immediately, which just feels good.", rating: 5 },
  { name: "Lena K.", functie: "Events and catering", tekst: "I've been working through EXTRA for almost a year now. The locations are great and the team is easy to reach if there are questions.", rating: 5 },
];

const faqs = [
  { q: "Do I need hospitality experience?", a: "Not always. For supporting roles such as runner or dishwasher, no experience is required. For service and bar, basic experience is a plus, but we primarily look at your attitude and motivation." },
  { q: "Can I choose my own shifts?", a: "Yes. Through the EXTRA app, you can see which shifts are available and choose what suits you. You decide when you work." },
  { q: "How does same-day payment via Jixbee work?", a: "After your shift, you are paid via Jixbee. The amount is usually in your account the same day. You don't need to register separately for anything." },
  { q: "At which locations can I work?", a: "Through EXTRA, you work at hotels, restaurants, and events in Amsterdam, Utrecht, and The Hague. Think of Hilton, Marriott, NH Hotels, and various event venues." },
  { q: "How soon can I start working?", a: "After your application and a short introduction, you can quickly pick up your first shifts. In most cases, you'll be working within a week." },
];

export default function HospitalityWorkEn() {
  useEffect(() => {
    document.title = "Hospitality Work Amsterdam | F&B Jobs | EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Looking for hospitality work in Amsterdam? Work when you want at hotels, restaurants, and events. Flexible hospitality jobs with same-day payment via EXTRA.");
    setMeta("og:title", "Hospitality Work Amsterdam | F&B Jobs | EXTRA", true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      <PublicNav />

      {/* ══ 1. HERO ══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}>
        <XPatternBgDark />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-fuchsia-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <UtensilsCrossed className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">Hospitality work via EXTRA</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Hospitality work{" "}
              <span className="relative inline-block">
                <span className="relative z-10">that fits you.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-3.5 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-purple-100/90 max-w-xl leading-relaxed font-medium mb-8">
              Work in hospitality at hotels, restaurants, and events in Amsterdam. Through EXTRA, you choose when you work. Flexible hospitality jobs with same-day payment and working at top locations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/aanmelden" className="group bg-white text-purple-900 font-bold px-7 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Sign up now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#functies" className="border-2 border-white/30 text-white font-bold px-7 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                View hospitality roles <ChevronRight className="w-5 h-5" />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {[
                { emoji: "⚡", label: "Same-day pay via Jixbee" },
                { emoji: "📅", label: "Work when it suits you" },
                { emoji: "🏨", label: "Top locations in Amsterdam" },
              ].map(({ emoji, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {emoji} {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right – horeca photo card */}
          <div className="relative flex justify-center items-center">
            <div className="relative w-full max-w-sm">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/40 border-4 border-white/20">
                <img src={horecaImg} alt="Hospitality professional via EXTRA" className="w-full h-[380px] sm:h-[440px] object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent rounded-3xl" />
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-purple-100">
                💰 Same-day pay active
              </div>
              <div className="absolute -bottom-3 -left-4 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-green-100">
                ✅ Everyone on formal contract
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. TRUST STRIP ══ */}
      <section className="py-10 sm:py-14 bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Work at locations you can be proud of</p>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee-hw group-hover:[animation-play-state:paused]">
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
          @keyframes marquee-hw {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-hw {
            animation: marquee-hw 40s linear infinite;
          }
        `}</style>
      </section>

      {/* ══ 3. FUNCTIES ══ */}
      <section id="functies" className="py-20 sm:py-32 bg-gray-50 relative overflow-hidden">
        <XPatternBg />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Our hospitality <span className="text-purple-600">roles</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
              From high-end hotel service to festivals and corporate events. There is always a role that matches your experience and energy.
            </p>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {functies.map((f, i) => (
              <RevealSection key={i} delay={i * 100} className="group">
                <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2">
                  <div className="h-48 overflow-hidden relative">
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={`absolute top-4 left-4 bg-gradient-to-br ${f.color} text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg`}>
                      {f.sub}
                    </div>
                  </div>
                  <div className="p-6 sm:p-8 flex flex-col flex-grow">
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-grow">{f.desc}</p>
                    <ul className="space-y-2.5 mb-8">
                      {f.bullets.map((b, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-xs font-bold text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <a href={f.href} className={`w-full py-4 rounded-xl font-bold text-sm transition-all text-center border-2 border-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600`}>
                      Sign up directly
                    </a>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. HOW IT WORKS / STEPS ══ */}
      <section className="py-20 sm:py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Working via EXTRA in <span className="text-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">4 steps</span>
              </h2>
              <div className="space-y-8">
                {[
                  { title: "Sign up", desc: "Create an account within 2 minutes. We'll contact you quickly for an introduction.", icon: UserCheck, color: "bg-purple-100 text-purple-600" },
                  { title: "Choose your shift", desc: "Download the app and respond directly to the shifts you want to work. You decide where and when.", icon: CalendarCheck, color: "bg-indigo-100 text-indigo-600" },
                  { title: "Get to work", desc: "Work at the most beautiful hotels, restaurants, and event venues in Amsterdam.", icon: UtensilsCrossed, color: "bg-blue-100 text-blue-600" },
                  { title: "Receive your pay", desc: "Get paid within 24 hours via Jixbee. Plus, earn EXTRAATJE points for rewards.", icon: Banknote, color: "bg-green-100 text-green-600" },
                ].map((s, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center font-bold relative z-10 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                        <s.icon className="w-6 h-6" />
                      </div>
                      {i < 3 && <div className="absolute top-14 left-7 w-0.5 h-10 bg-gray-100 -translate-x-1/2" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed font-medium">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12">
                <a href="/aanmelden" className="bg-purple-600 text-white font-black px-10 py-5 rounded-2xl hover:bg-purple-700 transition-all inline-flex items-center gap-3 shadow-xl shadow-purple-200">
                  Register now <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </RevealSection>

            <RevealSection delay={200} className="relative">
              <div className="relative bg-gradient-to-br from-purple-100 to-indigo-50 rounded-[40px] p-8 sm:p-12 overflow-hidden border border-purple-100">
                <XPatternBg />
                <div className="relative z-10 flex flex-col gap-6">
                  <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-5 border border-purple-100 rotate-2 group hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-purple-200">S</div>
                        <div>
                          <p className="text-[13px] font-black text-gray-900">Shift completed</p>
                          <p className="text-[10px] text-gray-400 font-bold">Hilton Amsterdam</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-widest">Confirmed</span>
                    </div>
                    <img src={jixbeeUren} alt="Jixbee app interface" className="rounded-xl w-full border border-gray-100" />
                  </div>

                  <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-5 border border-purple-100 -rotate-2 group hover:rotate-0 transition-transform duration-500 self-end w-4/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-gray-900">Payment successful</p>
                        <p className="text-[10px] text-gray-400 font-bold tracking-tight">Sent via Jixbee Instant Pay</p>
                      </div>
                    </div>
                    <img src={jixbeePayout} alt="Jixbee payout success" className="rounded-xl w-full border border-gray-100" />
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══ 5. WHY / BENEFITS ══ */}
      <section className="py-20 sm:py-32 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-purple-900" />
        <XPatternBgDark />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection className="text-center mb-16 sm:mb-24">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Why work via <span className="text-purple-400">EXTRA?</span>
            </h2>
            <p className="text-lg text-purple-200/70 max-w-2xl mx-auto font-medium leading-relaxed">
              We go further than standard staffing agencies. From unique rewards to lightning-fast payments, your work is appreciated.
            </p>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {[
              { title: "Everyone on formal contract", desc: "No zero-hours, no surprises. You are simply employed, with all the associated benefits.", icon: Handshake, color: "text-blue-400" },
              { title: "Same-day pay via Jixbee", desc: "Finished your shift? Receive your salary in your account the same day. Financial freedom at its best.", icon: Zap, color: "text-yellow-400" },
              { title: "The unique EXTRAATJE", desc: "Earn points with every shift for cool rewards like AirPods, dinner vouchers, and tickets.", icon: Gift, color: "text-purple-400" },
              { title: "Work at top locations", desc: "From five-star hotels to exclusive event locations and restaurants. You go to work with a smile.", icon: Star, color: "text-orange-400" },
              { title: "Fully flexible schedule", desc: "You decide when you work. Combine your hospitality job perfectly with study, sports, or other plans.", icon: Clock, color: "text-emerald-400" },
              { title: "Become a top performer", desc: "Reach the elite rankings and unlock higher salaries and more exclusive shifts.", icon: Trophy, color: "text-fuchsia-400" },
            ].map((b, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group bg-white/5 backdrop-blur-md rounded-[32px] p-8 sm:p-10 border border-white/10 hover:bg-white/10 transition-all duration-300 h-full flex flex-col">
                  <div className={`w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 shadow-inner ${b.color} group-hover:scale-110 transition-transform duration-300`}>
                    <b.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-3 tracking-tight leading-tight">{b.title}</h3>
                  <p className="text-sm text-purple-200/60 leading-relaxed font-medium flex-grow">{b.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. REGIONS ══ */}
      <section className="py-20 sm:py-32 bg-white relative overflow-hidden">
        <XPatternBg />
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection className="order-2 lg:order-1">
              <div className="relative rounded-[40px] overflow-hidden group shadow-2xl">
                <img src={cateringImg} alt="Hospitality work Amsterdam" className="w-full h-[500px] object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-900/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-gray-900">Active region</p>
                        <p className="text-xs text-purple-600 font-bold uppercase tracking-widest">Greater Amsterdam Area</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>

            <RevealSection className="order-1 lg:order-2">
              <span className="text-purple-600 text-sm font-black uppercase tracking-[0.2em] mb-4 block">Our base</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-8 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Work where the <span className="text-purple-600">energy is.</span>
              </h2>
              <p className="text-lg text-gray-600 font-medium leading-relaxed mb-8">
                Amsterdam is the heart of hospitality. From the canal belt to the Zuidas and from Noord to Amstelveen. We work with the biggest hotel chains and most innovative caterers.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Amsterdam Center", "Amsterdam South", "Amsterdam North", "Amsterdam East", "Utrecht", "The Hague", "Haarlem", "Schiphol Area"
                ].map((loc, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple-200 transition-colors group">
                    <div className="w-2 h-2 rounded-full bg-purple-600 group-hover:scale-150 transition-transform" />
                    <span className="text-sm font-bold text-gray-700">{loc}</span>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══ 7. TESTIMONIALS ══ */}
      <section className="py-20 sm:py-32 bg-gray-50 relative overflow-hidden">
        <XPatternBg />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Experiences of <span className="text-purple-600 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">our team</span>
            </h2>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {reviews.map((r, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-lg border border-gray-100 h-full flex flex-col hover:shadow-xl transition-all">
                  <div className="flex gap-1 mb-6">
                    {[...Array(r.rating)].map((_, j) => <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-base sm:text-lg text-gray-600 italic leading-relaxed mb-8 flex-grow">"{r.tekst}"</p>
                  <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black text-lg">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{r.name}</p>
                      <p className="text-xs text-purple-600 font-bold uppercase tracking-widest">{r.functie}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. FAQ ══ */}
      <FAQSection 
        heading="Frequently asked questions"
        faqs={faqs} 
      />

      {/* ══ 9. CTA FINAL ══ */}
      <section className="py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-700 to-indigo-900" />
        <XPatternBgDark />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection className="bg-white rounded-[40px] p-10 sm:p-20 shadow-2xl overflow-hidden relative text-center">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-yellow-400 to-orange-500" />
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Start your <span className="text-purple-600">adventure</span> today.
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-medium mb-12">
              Join the team and experience the freedom of hospitality. We look forward to seeing you at our office for an introduction!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/aanmelden" className="bg-purple-600 text-white font-black px-12 py-5 rounded-2xl hover:bg-purple-700 transition-all text-lg shadow-xl shadow-purple-200 inline-flex items-center gap-3 justify-center">
                Sign up directly <ArrowRight className="w-5 h-5" />
              </a>
              <a href="/contact" className="bg-gray-100 text-gray-900 font-black px-12 py-5 rounded-2xl hover:bg-gray-200 transition-all text-lg inline-flex items-center gap-3 justify-center">
                Any questions? <MessageCircle className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
