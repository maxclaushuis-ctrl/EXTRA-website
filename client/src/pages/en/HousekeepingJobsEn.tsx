import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import PublicNav from "@/components/PublicNav";
import {
  ArrowRight, ChevronRight, ChevronDown, Zap, Star, Clock,
  MapPin, Gift, Users, CheckCircle2, MessageCircle, Building2,
  UtensilsCrossed, BedDouble, ChefHat, ConciergeBell, Menu, X,
  UserCheck, Trophy, Sparkles, CalendarCheck, Handshake, Shield
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import housekeepingImg from "@assets/Housekeeping_1771842919384.webp";
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
import blogHousekeepingImg from "@/assets/images/blog-housekeeping.jpg";
import dienstHousekeepingImg from "@/assets/images/dienst-housekeeping.jpg";
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
    title: "Room Attendant",
    sub: "Hotel rooms · Hospitality · Precision",
    img: housekeepingImg,
    desc: "Ensure an impeccably clean hotel room. You determine the guest's first impression upon arrival.",
    bullets: ["Day shifts in top hotels", "Structure and precision", "Fixed pool per hotel"],
    color: "from-blue-600 to-indigo-700",
    href: "/aanmelden",
  },
  {
    title: "Hotel cleaning",
    sub: "Hotels · Resorts · Boutique",
    img: blogHousekeepingImg,
    desc: "General cleaning in hotel environments. From rooms to common areas and corridors.",
    bullets: ["Varied task package", "International hotel chains", "Good daily schedule"],
    color: "from-teal-500 to-cyan-600",
    href: "/aanmelden",
  },
  {
    title: "Public Area Cleaning",
    sub: "Lobby · Corridors · Restaurants",
    img: dienstHousekeepingImg,
    desc: "Cleaning of public spaces such as the lobby, elevators, corridors and hotel restaurant. Always representative.",
    bullets: ["Morning and evening shifts", "High pace and visible results", "Independent work"],
    color: "from-violet-500 to-purple-700",
    href: "/aanmelden",
  },
  {
    title: "Linen Service",
    sub: "Linen room · Laundry · Logistics",
    img: hotelImg,
    desc: "Management and care of hotel linen. From sorting and washing to distribution on the floors.",
    bullets: ["Organised work pace", "Backstage in top hotels", "Teamwork is central"],
    color: "from-emerald-500 to-teal-600",
    href: "/aanmelden",
  },
];

const reviews = [
  { name: "Fatima A.", functie: "Room Attendant", tekst: "Through EXTRA I work in beautiful hotels and I always know where I stand. The planning is clear and the team is nice.", rating: 5 },
  { name: "Nadia R.", functie: "Hotel cleaning", tekst: "Same-day pay via Jixbee makes the difference. I immediately see what I earn and it's transferred quickly. That gives peace of mind.", rating: 5 },
  { name: "Ingrid M.", functie: "Public Area Cleaning", tekst: "I've been working through EXTRA for six months now. The locations are tidy, the work is clear and I can choose when I go.", rating: 5 },
];

const faqs = [
  { q: "Do I need experience for housekeeping work?", a: "Experience is a plus, but not always required. We mainly look at your motivation, accuracy and attitude. For some roles we offer a short on-site introduction." },
  { q: "Will I always work in the same hotel?", a: "In most cases, yes. We try to link you to a fixed pool at one or more hotels, so you know the working method and quickly feel at home in the team." },
  { q: "Can I choose my own shifts?", a: "Yes. You indicate when you are available and we provide suitable shifts. This way you combine work with other obligations or activities." },
  { q: "How does the payment work?", a: "After your shift you are paid via Jixbee. The amount is usually in your account the same day. Transparent and fast, without surprises." },
  { q: "How quickly can I start working?", a: "After your registration and a short introduction, you can often pick up your first shifts within a week. We ensure everything runs quickly and smoothly." },
];

export default function HousekeepingJobsEn() {
  useEffect(() => {
    document.title = "Housekeeping Jobs Amsterdam | Hotel Housekeeping | EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Looking for housekeeping work in Amsterdam? Work in top hotels as a room attendant or hotel cleaning employee. Flexible shifts and fast payment via EXTRA.");
    setMeta("og:title", "Housekeeping Jobs Amsterdam | Hotel Housekeeping | EXTRA", true);
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
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <BedDouble className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">Housekeeping work via EXTRA</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Housekeeping work{" "}
              <span className="relative inline-block">
                <span className="relative z-10">that fits you.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-3.5 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-purple-100/90 max-w-xl leading-relaxed font-medium mb-8">
              Work as a room attendant or in hotel cleaning at beautiful hotels in Amsterdam. Through EXTRA you choose when you work. Flexible housekeeping vacancies with same-day payment and clear planning.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/aanmelden" className="group bg-white text-purple-900 font-bold px-7 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Sign up <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#functies" className="border-2 border-white/30 text-white font-bold px-7 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                See how it works <ChevronRight className="w-5 h-5" />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {[
                { emoji: "⚡", label: "Same-day pay via Jixbee" },
                { emoji: "🏨", label: "Top hotels in Amsterdam" },
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
                <img src={housekeepingImg} alt="Housekeeping employee via EXTRA" className="w-full h-[380px] sm:h-[440px] object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent rounded-3xl" />
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-purple-100">
                💰 Same-day pay active
              </div>
              <div className="absolute -bottom-3 -left-4 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-green-100">
                🏨 Top hotels Amsterdam
              </div>
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
            <div className="flex animate-marquee-hsw group-hover:[animation-play-state:paused]">
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
          @keyframes marquee-hsw {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-hsw {
            animation: marquee-hsw 40s linear infinite;
          }
        `}</style>
      </section>

      {/* ══ 3. FUNCTIES ══ */}
      <section id="functies" className="py-16 sm:py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Your field</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Which housekeeping roles can you do?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Through EXTRA you can work in various housekeeping roles at hotels in Amsterdam. Think of room attendant, hotel cleaning work, public area cleaning and linen service. Also view{" "}
                <Link href="/en/hospitality-work" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">hospitality work</Link>,{" "}
                <Link href="/en/front-office-jobs" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">front office work</Link> or{" "}
                <Link href="/en/chef-jobs" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">chef jobs</Link>. You choose the shifts that fit your schedule.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {functies.map((f, i) => (
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
                    <Link href={f.href} className={`inline-flex items-center gap-1.5 text-xs font-black text-white px-4 py-2 rounded-full bg-gradient-to-r ${f.color} hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
                      Sign up <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={400}>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {["Housekeeping support", "Turndown service", "Minibar service", "Laundry assistant"].map((fn) => (
                <span key={fn} className="bg-purple-50 border border-purple-100 px-5 py-2.5 rounded-full text-sm text-gray-600 font-medium">
                  {fn}
                </span>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ 4. WAAROM EXTRA ══ */}
      <section className="relative bg-white py-16 sm:py-28 overflow-hidden">
        <XPatternBg />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                Why EXTRA?
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Why housekeeping through EXTRA?
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                EXTRA works differently than traditional staffing agencies. As a housekeeping employee you get clear planning, flexibility in shifts and you work at professional hotels with housekeeping jobs that fit you.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {[
              {
                icon: Zap, badge: "Financial freedom", title: "Same-day pay via Jixbee",
                desc: "After your shift, your payment is processed quickly. This way you don't have to wait until the end of the month.",
                bg: "from-yellow-50 to-orange-50", border: "border-yellow-200", iconBg: "bg-yellow-100", iconColor: "text-yellow-600", tag: "⚡ Same-day pay",
              },
              {
                icon: CalendarCheck, badge: "Your own planning", title: "Flexible shifts",
                desc: "Choose when you work. Ideal if you are looking for part-time or flexible housekeeping work.",
                bg: "from-violet-50 to-purple-50", border: "border-violet-200", iconBg: "bg-violet-100", iconColor: "text-violet-600", tag: "📅 Fully flexible",
              },
              {
                icon: Building2, badge: "Premium work environment", title: "Work in top hotels",
                desc: "Work as a room attendant or hotel cleaning employee at hotels with international guests.",
                bg: "from-blue-50 to-indigo-50", border: "border-blue-200", iconBg: "bg-blue-100", iconColor: "text-blue-600", tag: "🏨 Top locations",
              },
              {
                icon: Shield, badge: "Certainty", title: "Everyone is employed",
                desc: "You always work with an official contract via EXTRA. No grey constructions, just fair and transparent.",
                bg: "from-green-50 to-emerald-50", border: "border-green-200", iconBg: "bg-green-100", iconColor: "text-green-600", tag: "✅ Safe and fair",
              },
              {
                icon: Gift, badge: "Exclusive rewards system", title: "EXTRAATJE rewards",
                desc: "Save points for every shift and exchange them for cool rewards. From gift cards to gadgets.",
                bg: "from-orange-50 to-amber-50", border: "border-orange-200", iconBg: "bg-orange-100", iconColor: "text-orange-600", tag: "🎁 Earn points",
              },
              {
                icon: Handshake, badge: "Personal approach", title: "Personal contact",
                desc: "Our planners know your name and situation. Quickly reachable and always honest about available shifts.",
                bg: "from-teal-50 to-cyan-50", border: "border-teal-200", iconBg: "bg-teal-100", iconColor: "text-teal-600", tag: "💬 Directly reachable",
              },
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
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Top locations</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hotels you can be proud of
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                As a housekeeping employee through EXTRA you work at hotels with high standards and professional teams. From international hotel chains to boutique hotels in Amsterdam.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 mb-10">
            {[
              { icon: Building2, title: "Five-star hotels", desc: "Work at international hotel chains in Amsterdam, Utrecht and The Hague. Top standards and professional teams.", iconBg: "bg-indigo-100", iconColor: "text-indigo-600", bg: "from-indigo-50 to-blue-50", border: "border-indigo-200" },
              { icon: Sparkles, title: "Boutique hotels", desc: "Smaller, more personal hotel environments with a high quality standard and attention to detail.", iconBg: "bg-purple-100", iconColor: "text-purple-600", bg: "from-purple-50 to-violet-50", border: "border-purple-200" },
              { icon: Shield, title: "Fixed hotel pool", desc: "You are linked to a fixed pool so you know the working method, are familiar with the team and can be deployed quickly.", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", bg: "from-emerald-50 to-teal-50", border: "border-emerald-200" },
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

      {/* ══ 6. HOE HET WERKT ══ */}
      <section id="hoe-het-werkt" className="relative bg-white py-16 sm:py-24 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">In 4 steps</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                How to start with housekeeping work through EXTRA
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                From registration to your first hotel room. Simple, fast and clear.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { step: "01", icon: MessageCircle, title: "Sign up", desc: "Fill in the application form and upload your CV. Takes less than 5 minutes.", color: "from-purple-500 to-violet-600" },
              { step: "02", icon: Users, title: "Introduction", desc: "We schedule a short meeting. Then we see which hotels suit you best.", color: "from-indigo-500 to-blue-600" },
              { step: "03", icon: CalendarCheck, title: "Choose your shifts", desc: "You provide your availability and we provide suitable housekeeping shifts.", color: "from-teal-500 to-cyan-600" },
              { step: "04", icon: Zap, title: "Work and get paid", desc: "Work your shift and receive your payment the same day via Jixbee.", color: "from-orange-500 to-amber-500" },
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
              <Link href="/aanmelden" className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-white text-base transition-all hover:-translate-y-0.5 hover:shadow-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                Sign up <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ 7. DAGBETALING ══ */}
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
                  After your housekeeping shift, you are paid via Jixbee. You immediately see what you have earned and receive your payment quickly. No waiting times, no lack of clarity.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "Payment via Jixbee, same day after your shift",
                    "Always real-time insight into your earned hours",
                    "Official contract and payroll according to legislation",
                    "No surprises on your payslip",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/en/how-we-work" className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-900 transition-colors">
                  How does same-day pay work? <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex justify-center">
                <div className="relative flex gap-5 items-end h-[320px] sm:h-[380px]">
                  <div style={{ transform: "rotate(-5deg)", animation: "float-hsw 5s ease-in-out infinite" }}>
                    <img src={jixbeeUren} alt="Jixbee – worked hours overview" className="w-[145px] sm:w-[175px] drop-shadow-2xl rounded-[2rem]" />
                  </div>
                  <div className="relative z-10 -mb-4" style={{ animation: "float-hsw 4s ease-in-out infinite" }}>
                    <img src={jixbeePayout} alt="Jixbee – payout successful" className="w-[155px] sm:w-[190px] drop-shadow-2xl rounded-[2rem]" />
                    <div className="absolute -top-3 -right-10 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 border border-purple-100 whitespace-nowrap">
                      💸 €680,- paid out
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
        <style>{`
          @keyframes float-hsw {
            0%, 100% { transform: translateY(0px) rotate(-5deg); }
            50% { transform: translateY(-12px) rotate(-5deg); }
          }
        `}</style>
      </section>

      {/* ══ 8. REVIEWS ══ */}
      <section className="py-16 sm:py-24" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Experiences</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What do housekeeping staff say?
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 mb-12">
            {reviews.map(({ name, functie, tekst, rating }, i) => (
              <RevealSection key={name} delay={i * 80}>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-purple-100 shadow-md hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all h-full flex flex-col">
                  <div className="flex mb-3">
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4 italic">"{tekst}"</p>
                  <div className="border-t border-purple-100 pt-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs font-black">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900">{name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{functie} via EXTRA</p>
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
              Start today with housekeeping work through EXTRA
            </p>
            <p className="text-purple-200 text-sm mt-0.5">Do you want to work as a room attendant or in hotel cleaning at beautiful hotels in Amsterdam? Sign up at EXTRA and start quickly with housekeeping shifts.</p>
          </div>
          <Link href="/aanmelden" className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-purple-900 font-black px-6 py-3 rounded-full text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Start your application <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ══ 10. FAQ ══ */}
      <FAQSection
        heading="Frequently asked questions about housekeeping work through EXTRA"
        faqs={faqs}
      />

      {/* ══ 11. LINK CLOUD ══ */}
      <section className="py-12 bg-white border-t border-purple-100/60">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 text-center">Related pages</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Housekeeping jobs Amsterdam", href: "/en/housekeeping-jobs" },
              { label: "Hospitality work", href: "/en/hospitality-work" },
              { label: "Chef jobs", href: "/en/chef-jobs" },
              { label: "Front Office jobs", href: "/en/front-office-jobs" },
              { label: "How does same-day pay work?", href: "/en/how-we-work" },
              { label: "EXTRAATJE rewards", href: "/en/rewards" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-4 py-2 rounded-full border border-purple-200 transition-colors">
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
