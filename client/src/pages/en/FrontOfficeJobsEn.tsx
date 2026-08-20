import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  ArrowRight, ChevronRight, Zap, Star,
  Gift, Users, CheckCircle2, MessageCircle, Building2,
  ConciergeBell, CalendarCheck, Handshake, Globe, Smile
} from "lucide-react";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import frontOfficeImg from "@assets/Front-office_1771842663934.webp";
import frontOffice2Img from "@assets/Front-office_1771842809388.webp";
import frontOfficeHeroImg from "@assets/FRONT_OFFICE_FINAL_AE_001_1775059133785.webp";
import marriottLogo from "@assets/Logo_Marriott_1771267205959.webp";
import amrathLogo from "@assets/Logo_amrath_1771267205959.webp";
import mercureLogo from "../../assets/pitch/logo-mercure.webp";
import pulitzerLogo from "@assets/Logo_Pulitzer_1773389329669.webp";
import nhLogo from "@assets/Logo_NH_1773389329669.webp";
import hiltonLogo from "@assets/Logo_Hilton_1771267205959.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import jixbeeUren from "@assets/Jixbee_Gewerkte_uren_1772454264961.webp";
import jixbeePayout from "@assets/Jixbee_Payout_succes_1772454264961.webp";
import dienstFrontOfficeImg from "@/assets/images/dienst-frontoffice.webp";
import hotelImg from "@/assets/images/blog-hotel.webp";

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

function XBg() {
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

const roles = [
  {
    title: "Front office agent",
    sub: "Hotels · Reception · Guest-focused",
    img: frontOfficeImg,
    desc: "Front office vacancies in Amsterdam for guest-oriented staff. First point of contact for hotel guests, from check-in to a perfect welcome.",
    bullets: ["Front office vacancies Amsterdam", "Warm and professional", "International work environment"],
    color: "from-indigo-500 to-blue-700",
    href: "/aanmelden?lang=en",
  },
  {
    title: "Hotel receptionist",
    sub: "Check-in · Reservations · Service",
    img: frontOffice2Img,
    desc: "Receptionist vacancies at five-star hotels in Amsterdam. Handle reservations and guide guests on arrival for a seamless hotel experience.",
    bullets: ["Hotel receptionist vacancies", "Front-desk experience", "Five-star hotel chains"],
    color: "from-purple-600 to-violet-700",
    href: "/aanmelden?lang=en",
  },
  {
    title: "Guest service agent",
    sub: "Guest experience · Hospitality · Support",
    img: dienstFrontOfficeImg,
    desc: "Front office work in a guest service role. Supporting reception and the guest experience on a flexible basis at hotels and hospitality venues.",
    bullets: ["Flexible front office shifts", "Guest-focused work", "Hotels and hospitality venues"],
    color: "from-teal-500 to-cyan-600",
    href: "/aanmelden?lang=en",
  },
  {
    title: "Night receptionist",
    sub: "Night shift · Overview · Independence",
    img: hotelImg,
    desc: "Hotel receptionist in the night shift in Amsterdam. Calm, oversight and responsibility in a unique and independent role.",
    bullets: ["Hotel receptionist Amsterdam", "Independent work environment", "Build a fixed pool"],
    color: "from-slate-600 to-gray-700",
    href: "/aanmelden?lang=en",
  },
];

const reviews = [
  { name: "Emma L.", role: "Front office agent", text: "Through EXTRA I work at the reception of beautiful hotels. The atmosphere is professional and the venues are truly top-notch. Exactly what I was looking for.", rating: 5 },
  { name: "Thijs K.", role: "Hotel receptionist", text: "Same-day pay via Jixbee makes all the difference. Right after my shift the money is there. No hassle, just clear and simple.", rating: 5 },
  { name: "Laila B.", role: "Guest service agent", text: "I combine my hospitality studies with front office work via EXTRA. The scheduling is flexible and the shifts fit well around my timetable.", rating: 5 },
];

const faqs = [
  { q: "Do I need experience as a receptionist?", a: "Some hospitality experience is a plus, but not always required for front office work. We look at your communication skills, professional appearance and guest-focused attitude. For some front office vacancies in Amsterdam we offer a short on-site introduction." },
  { q: "Will I always work at the same hotel?", a: "In most cases yes. We aim to place you in a regular team at one or more hotels, so you know the procedures and quickly feel at home as a hotel receptionist." },
  { q: "Can I choose my own shifts?", a: "Yes. You let us know your availability and we arrange matching front office shifts. This way you can combine the work with your studies, another job or other commitments." },
  { q: "How does payment work?", a: "After your shift you're paid out via Jixbee. The amount is usually in your account the same day. That's how front office work via EXTRA works: transparent, fast and no surprises." },
  { q: "How quickly can I start?", a: "After your sign-up and a short intake you can often start receptionist work within a week. We do our best to make the start as smooth as possible." },
];

const LOGOS = [
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
];

export default function FrontOfficeJobsEn() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Front office vacancies Amsterdam | Receptionist work via EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Looking for front office vacancies or receptionist work in Amsterdam? Via EXTRA you work in top hotels with flexible shifts and same-day pay.");
    setMeta("og:title", "Front office vacancies Amsterdam | Receptionist work via EXTRA", true);
    setMeta("og:type", "website", true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      <PublicNav />

      {/* ══ 1. HERO ══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, #2d0663 0%, #4a0e96 35%, #5b16a8 65%, #6d28d9 100%)" }}>

        {/* X-pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { left: "3%",  top: "8%",  w: 240, rot:  12, op: 0.10 },
            { left: "6%",  top: "58%", w: 180, rot: -15, op: 0.07 },
            { left: "42%", top: "72%", w: 140, rot:  20, op: 0.05 },
          ].map((x, i) => (
            <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity: x.op, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: "rgba(255,255,255,0.9)" }} />
          ))}
        </div>

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-[38%] -translate-y-1/2 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-4 w-72 h-72 bg-violet-800/30 rounded-full blur-3xl pointer-events-none" />

        {/* Hero photo */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={frontOfficeHeroImg}
            alt="Front office agent via EXTRA – hotel receptionist Amsterdam"
            className="w-full h-full object-cover"
            loading="eager"
            style={{ objectPosition: "62% center", filter: "contrast(1.12) saturate(1.22) brightness(1.07)" }}
          />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 38% 65% at 65% 44%, rgba(255,248,255,0.13) 0%, rgba(220,180,255,0.04) 55%, transparent 75%)" }} />
          <div className="absolute inset-0 hero-text-gradient" />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: "20%", background: "linear-gradient(to top, rgba(29,5,73,0.80) 0%, rgba(29,5,73,0.28) 50%, transparent 100%)" }} />
          <div className="absolute top-0 left-0 right-0" style={{ height: "18%", background: "linear-gradient(to bottom, rgba(29,5,73,0.48) 0%, transparent 100%)" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 sm:pt-32 sm:pb-24 w-full">
          <div className="max-w-xl lg:max-w-[52%] 2xl:max-w-[42%]">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-7 border border-white/20">
              <ConciergeBell className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">Front office vacancies via EXTRA</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] text-white leading-[1.05] mb-6" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Front office work{" "}
              <span className="relative inline-block">
                <span className="relative z-10">that fits you.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-3.5 bg-gradient-to-r from-cyan-400 to-blue-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-purple-100/90 leading-relaxed font-medium mb-8 max-w-lg">
              Work as a hotel receptionist or front office agent at top hotels in Amsterdam. Through EXTRA you choose your own shifts. Flexible front office work with same-day pay in professional hotel environments.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a href="/aanmelden?lang=en" className="group bg-white text-purple-900 font-bold px-7 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Apply now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#roles" className="border-2 border-white/30 text-white font-bold px-7 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                See how it works <ChevronRight className="w-5 h-5" />
              </a>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {[{ emoji: "⚡", label: "Same-day pay via Jixbee" }, { emoji: "🏨", label: "Top hotels Amsterdam" }, { emoji: "📅", label: "Flexible shifts" }].map(({ emoji, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">{emoji} {label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. TRUST STRIP ══ */}
      <section className="py-10 sm:py-14 bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Work in hotels you can be proud of</p>
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

      {/* ══ 3. ROLES ══ */}
      <section id="roles" className="py-16 sm:py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Your area of expertise</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Which front office roles can you do via EXTRA?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Via EXTRA you work as a hotel receptionist, front office agent or guest service agent at hotels in Amsterdam. We match you to hotels that suit your level and preferences. Also check out{" "}
                <a href="/en/hospitality-work" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">hospitality work</a>,{" "}
                <a href="/en/housekeeping-jobs" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">housekeeping work</a> or{" "}
                <a href="/en/chef-jobs" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">chef vacancies</a>.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {roles.map((f, i) => (
              <RevealSection key={f.title} delay={i * 70}>
                <article className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-purple-100 shadow-md hover:shadow-2xl hover:border-purple-200 hover:-translate-y-2 transition-all h-full flex flex-col">
                  <div className={`relative h-44 sm:h-52 overflow-hidden bg-gradient-to-br ${f.color}`}>
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-luminosity opacity-90" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-white font-black text-lg leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>{f.title}</h3>
                      <p className="text-white/70 text-[10px] font-semibold">{f.sub}</p>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">{f.desc}</p>
                    <ul className="space-y-1 mb-4 flex-1">
                      {f.bullets.map(b => (
                        <li key={b} className="flex items-center gap-2 text-xs font-medium text-gray-700">
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> {b}
                        </li>
                      ))}
                    </ul>
                    <a href={f.href} className={`inline-flex items-center gap-1.5 text-xs font-black text-white px-4 py-2 rounded-full bg-gradient-to-r ${f.color} hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
                      Sign up <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </article>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={400}>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {["Lobby host", "Concierge assistant", "Reservations agent", "Hospitality host"].map((fn) => (
                <span key={fn} className="bg-purple-50 border border-purple-100 px-5 py-2.5 rounded-full text-sm text-gray-600 font-medium">{fn}</span>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ 4. WHY EXTRA ══ */}
      <section className="relative bg-white py-16 sm:py-28 overflow-hidden">
        <XBg />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Why EXTRA?</span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Why do front office work via EXTRA?
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                EXTRA gives front office agents and hotel receptionists the freedom to work when it suits them. Flexible front office vacancies in Amsterdam, same-day pay and working at professional hotels without long-term commitments.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {[
              { icon: Zap, badge: "Financial freedom", title: "Same-day pay via Jixbee", desc: "After your shift your money is in your account the same day. No waiting — real-time insight into what you earn.", bg: "from-yellow-50 to-orange-50", border: "border-yellow-200", iconBg: "bg-yellow-100", iconColor: "text-yellow-600", tag: "⚡ Same-day pay" },
              { icon: CalendarCheck, badge: "Your own schedule", title: "Flexible shifts", desc: "Choose when you work. Day and night shifts, weekends or weekdays — you decide.", bg: "from-violet-50 to-purple-50", border: "border-violet-200", iconBg: "bg-violet-100", iconColor: "text-violet-600", tag: "📅 Fully flexible" },
              { icon: Building2, badge: "Premium work environment", title: "Work in top hotels", desc: "Front office vacancies at five-star hotels, international chains and boutique hotels in Amsterdam.", bg: "from-blue-50 to-indigo-50", border: "border-blue-200", iconBg: "bg-blue-100", iconColor: "text-blue-600", tag: "🏨 Top venues" },
              { icon: Globe, badge: "International atmosphere", title: "International work environment", desc: "Work with guests from around the world. Your language skills and guest-focused approach are a real asset here.", bg: "from-teal-50 to-cyan-50", border: "border-teal-200", iconBg: "bg-teal-100", iconColor: "text-teal-600", tag: "🌍 International" },
              { icon: Gift, badge: "Exclusive reward system", title: "EXTRAATje rewards", desc: "Earn points for every shift and redeem them for great rewards. Consistently good work is always recognised.", bg: "from-orange-50 to-amber-50", border: "border-orange-200", iconBg: "bg-orange-100", iconColor: "text-orange-600", tag: "🎁 Earn points" },
              { icon: Handshake, badge: "Personal approach", title: "Personal contact", desc: "Our planners know you and your preferences. Always reachable and always honest.", bg: "from-emerald-50 to-teal-50", border: "border-emerald-200", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", tag: "💬 Always reachable" },
            ].map(({ icon: Icon, badge, title, desc, bg, border, iconBg, iconColor, tag }, i) => (
              <RevealSection key={title} delay={i * 80}>
                <div className={`group relative bg-gradient-to-br ${bg} rounded-3xl p-7 sm:p-9 border-2 ${border} hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden`}>
                  <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/60 blur-2xl pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${iconBg} ${iconColor}`}>{badge}</span>
                      <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                      </div>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3 leading-snug" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-5">{desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-white/70 border border-white px-3 py-1.5 rounded-full">{tag}</span>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. HOTELS ══ */}
      <section className="py-16 sm:py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Top venues</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hotels you can be proud of
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Via EXTRA you work as a hotel receptionist or front office agent in hotels where quality and hospitality come first. International guests, professional reception teams and a great working atmosphere.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 mb-10">
            {[
              { icon: Building2, title: "Five-star hotels", desc: "International hotel chains in Amsterdam, Utrecht and The Hague. Top standards and professional reception teams.", iconBg: "bg-indigo-100", iconColor: "text-indigo-600", bg: "from-indigo-50 to-blue-50", border: "border-indigo-200" },
              { icon: Globe, title: "International chains", desc: "Work for well-known hotel brands with high quality standards. You'll work with guests from all over the world and build a strong CV.", iconBg: "bg-purple-100", iconColor: "text-purple-600", bg: "from-purple-50 to-violet-50", border: "border-purple-200" },
              { icon: Smile, title: "Fixed hotel pool", desc: "You're matched to a fixed pool so you know the procedures, get to know the team and quickly feel at home at the venue.", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", bg: "from-emerald-50 to-teal-50", border: "border-emerald-200" },
            ].map(({ icon: Icon, title, desc, iconBg, iconColor, bg, border }, i) => (
              <RevealSection key={title} delay={i * 100}>
                <div className={`group relative bg-gradient-to-br ${bg} rounded-3xl p-7 border-2 ${border} hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden`}>
                  <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/60 blur-2xl pointer-events-none" />
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={300}>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Partner hotels</p>
              <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
                {[
                  { src: marriottLogo, alt: "Marriott" },
                  { src: amrathLogo, alt: "Amrath" },
                  { src: nhLogo, alt: "NH Hotels" },
                  { src: hiltonLogo, alt: "Hilton" },
                  { src: mercureLogo, alt: "Mercure Hotels" },
                  { src: pulitzerLogo, alt: "Pulitzer Amsterdam" },
                ].map(({ src, alt }) => (
                  <img key={alt} src={src} alt={alt} className="h-6 sm:h-8 w-auto object-contain grayscale opacity-40 hover:opacity-70 hover:grayscale-0 transition-all" loading="lazy" />
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ 6. HOW IT WORKS ══ */}
      <section id="how-it-works" className="relative bg-white py-16 sm:py-24 overflow-hidden">
        <XBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">In 4 steps</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                How to start as a front office agent via EXTRA
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">From sign-up to your first hotel reception. Simple, fast and clear.</p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { step: "01", icon: MessageCircle, title: "Sign up", desc: "Register via the form and upload your CV. Sorted in a matter of minutes.", color: "from-purple-500 to-violet-600" },
              { step: "02", icon: Users, title: "Intake", desc: "We discuss your experience, preferences and availability. Then we look at which hotels suit you.", color: "from-indigo-500 to-blue-600" },
              { step: "03", icon: CalendarCheck, title: "Pick your shifts", desc: "You choose the front office shifts that fit your schedule.", color: "from-teal-500 to-cyan-600" },
              { step: "04", icon: Zap, title: "Work and get paid", desc: "Complete your shift and receive your payment the same day via Jixbee.", color: "from-cyan-500 to-blue-500" },
            ].map(({ step, icon: Icon, title, desc, color }, i) => (
              <RevealSection key={step} delay={i * 80}>
                <div className="relative bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border-2 border-purple-100 shadow-md hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all group h-full flex flex-col">
                  <span className="text-5xl font-black text-purple-100 leading-none mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>{step}</span>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={300}>
            <div className="flex justify-center mt-10">
              <a href="/aanmelden?lang=en" className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-white text-base transition-all hover:-translate-y-0.5 hover:shadow-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                Sign up <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ 7. SAME-DAY PAY ══ */}
      <section className="py-16 sm:py-24 lg:py-32" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Financial freedom</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Money in your account, the same day.
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6 text-base sm:text-lg">
                  After your front office shift you're paid out via Jixbee. No waiting until the end of the month. You can see straight away what you've earned and receive your money the same day.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "Payout via Jixbee, same day after your shift",
                    "Real-time insight into your worked hours and amount",
                    "Official contract and payroll, legally compliant",
                    "No surprises on your pay slip",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <a href="/en/how-we-work" className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-900 transition-colors">
                  How does same-day pay work? <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              <div className="flex justify-center">
                <div className="relative flex gap-5 items-end h-[320px] sm:h-[380px]">
                  <div style={{ transform: "rotate(-5deg)", animation: "float-fow 5s ease-in-out infinite" }}>
                    <img src={jixbeeUren} alt="Jixbee – worked hours overview" className="w-[145px] sm:w-[175px] drop-shadow-2xl rounded-[2rem]" />
                  </div>
                  <div className="relative z-10 -mb-4" style={{ animation: "float-fow 4s ease-in-out infinite" }}>
                    <img src={jixbeePayout} alt="Jixbee – payout successful" className="w-[155px] sm:w-[190px] drop-shadow-2xl rounded-[2rem]" />
                    <div className="absolute -top-3 -right-10 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 border border-cyan-100 whitespace-nowrap">
                      💸 €590 paid out
                    </div>
                    <div className="absolute -bottom-2 -left-8 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 border border-green-100 whitespace-nowrap">
                      ✅ Hours approved
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
        <style>{`@keyframes float-fow { 0%,100%{transform:translateY(0px) rotate(-5deg)} 50%{transform:translateY(-12px) rotate(-5deg)} }`}</style>
      </section>

      {/* ══ 8. REVIEWS ══ */}
      <section className="py-16 sm:py-24" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Experiences</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What front office staff say
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
            {reviews.map(({ name, role, text, rating }, i) => (
              <RevealSection key={name} delay={i * 80}>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-purple-100 shadow-md hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all h-full flex flex-col">
                  <div className="flex mb-3">
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4 italic">"{text}"</p>
                  <div className="border-t border-purple-100 pt-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-black">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900">{name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{role} via EXTRA</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 9. CTA STRIP ══ */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-black text-base sm:text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Start front office work via EXTRA today
            </p>
            <p className="text-purple-200 text-sm mt-0.5">Want to work as a hotel receptionist or front office agent in Amsterdam? Sign up with EXTRA and start quickly with shifts at top hotels.</p>
          </div>
          <a href="/aanmelden?lang=en" className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-purple-900 font-black px-6 py-3 rounded-full text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Start your application <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* ══ 10. FAQ ══ */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Frequently asked questions about front office work via EXTRA
              </h2>
            </div>
          </RevealSection>
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, i) => (
              <RevealSection key={i} delay={i * 60}>
                <div className="bg-white rounded-2xl border border-gray-100 hover:border-purple-200 transition-all duration-300 overflow-hidden shadow-sm">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 sm:p-7 text-left">
                    <span className="text-base sm:text-lg font-bold text-gray-900 pr-4">{faq.q}</span>
                    <span className={`text-gray-400 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
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

      {/* ══ 11. LINK CLOUD ══ */}
      <section className="py-12 bg-white border-t border-purple-100/60">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 text-center">Related pages</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Front office vacancies Amsterdam", href: "/en/front-office-jobs" },
              { label: "Hotel receptionist vacancies", href: "/en/front-office-jobs" },
              { label: "Hospitality work", href: "/en/hospitality-work" },
              { label: "Housekeeping jobs", href: "/en/housekeeping-jobs" },
              { label: "Chef vacancies", href: "/en/chef-jobs" },
              { label: "How does same-day pay work?", href: "/en/how-we-work" },
              { label: "Apply to EXTRA", href: "/aanmelden?lang=en" },
            ].map((link, i) => (
              <Link key={i} href={link.href} className="bg-purple-50 px-5 py-2.5 rounded-full border border-purple-100 text-sm font-medium text-gray-600 hover:border-purple-400/50 hover:text-purple-700 transition-all">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
