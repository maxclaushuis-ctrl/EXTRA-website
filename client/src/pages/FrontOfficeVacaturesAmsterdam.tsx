import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
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
import mercureLogo from "../assets/pitch/logo-mercure.png";
import pulitzerLogo from "../assets/pitch/logo-pulitzer.png";
import nhLogo from "../assets/pitch/logo-nh.png";
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
  { label: "Horeca", href: "/horeca-werk", icon: UtensilsCrossed },
  { label: "Housekeeping", href: "/housekeeping-werk", icon: BedDouble },
  { label: "Chef", href: "/chef-vacatures-amsterdam", icon: ChefHat },
  { label: "Front Office", href: "/front-office-vacatures-amsterdam", icon: ConciergeBell },
];

const functies = [
  { title: "Front office medewerker", sub: "Hotels · Receptie · Gastgericht", img: frontOfficeImg, desc: "Front office vacatures Amsterdam voor gastgerichte medewerkers. Eerste aanspreekpunt voor hotelgasten, van check-in tot een perfecte ontvangst.", bullets: ["Front office vacatures Amsterdam", "Gastvrij en professioneel", "Internationale werkomgeving"], color: "from-indigo-500 to-blue-700", href: "/aanmelden" },
  { title: "Hotel receptionist", sub: "Check-in · Reserveringen · Service", img: frontOffice2Img, desc: "Receptionist vacatures bij vijfsterren hotels in Amsterdam. Verwerk reserveringen en begeleid gasten bij aankomst voor een vlekkeloze hotelervaring.", bullets: ["Receptionist vacatures hotel", "Front-desk ervaring", "Vijfsterren hotelketens"], color: "from-purple-600 to-violet-700", href: "/aanmelden" },
  { title: "Guest service medewerker", sub: "Gastbeleving · Hospitality · Support", img: dienstFrontOfficeImg, desc: "Front office medewerker in een guest service rol. Ondersteuning bij receptie en gastbeleving op flexibele basis bij hotels en hospitality venues.", bullets: ["Flexibele front office diensten", "Gastgericht werken", "Hotels en hospitality venues"], color: "from-teal-500 to-cyan-600", href: "/aanmelden" },
  { title: "Night receptionist", sub: "Nachtdienst · Overzicht · Rust", img: hotelImg, desc: "Hotel receptionist Amsterdam in de nachtdienst. Rust, overzicht en verantwoordelijkheid in een unieke en zelfstandige rol.", bullets: ["Hotel receptionist Amsterdam", "Zelfstandige werkomgeving", "Vaste poule opbouwen"], color: "from-slate-600 to-gray-700", href: "/aanmelden" },
];

const reviews = [
  { name: "Emma L.", functie: "Front office medewerker", tekst: "Via EXTRA werk ik aan de balie van mooie hotels. De sfeer is professioneel en de locaties zijn echt top. Precies wat ik zocht.", rating: 5 },
  { name: "Thijs K.", functie: "Hotel receptionist", tekst: "Dagbetaling via Jixbee maakt het verschil. Direct na mijn dienst staat het geld er op. Geen gedoe, gewoon duidelijk.", rating: 5 },
  { name: "Laila B.", functie: "Guest service medewerker", tekst: "Ik combineer mijn horecastudie met front-office werk via EXTRA. De planning is flexibel en de diensten passen goed bij mijn schema.", rating: 5 },
];

const faqs = [
  { q: "Moet ik ervaring hebben als receptionist?", a: "Enige hospitality-ervaring is een pluspunt, maar niet altijd vereist voor front office werk. We kijken naar jouw communicatieve vaardigheden, representatieve uitstraling en gastgerichtheid. Voor sommige front office vacatures Amsterdam bieden we een korte introductie op locatie aan." },
  { q: "Werk ik altijd in hetzelfde hotel?", a: "In veel gevallen ja. We proberen je te koppelen aan een vaste poule bij een of meerdere hotels, zodat je de procedures kent en snel op je gemak voelt als hotel receptionist in het team." },
  { q: "Kan ik zelf mijn diensten kiezen?", a: "Ja. Je geeft je beschikbaarheid door en wij zorgen voor passende front office diensten. Zo combineer je het werk als front office medewerker met je studie, andere baan of andere bezigheden." },
  { q: "Hoe werkt de betaling?", a: "Na je dienst word je uitbetaald via Jixbee. Het bedrag staat doorgaans dezelfde dag nog op je rekening. Zo werkt front office werk via EXTRA: transparant, snel en zonder verrassingen." },
  { q: "Hoe snel kan ik beginnen?", a: "Na je aanmelding en een korte kennismaking kun je vaak al binnen een week aan de slag met receptionist werk. We doen ons best om de start zo soepel mogelijk te laten verlopen." },
];

const LOGOS = [
  { src: amrathLogo, alt: "Amrâth Hotels" }, { src: mercureLogo, alt: "Mercure Hotels" }, { src: pulitzerLogo, alt: "Pulitzer Amsterdam" },
  { src: logoFcUtrecht, alt: "FC Utrecht" }, { src: logoFunda, alt: "Funda" },
  { src: logoHartMuseum, alt: "H'art Museum" }, { src: logoHetePeper, alt: "Hete Peper" }, { src: hiltonLogo, alt: "Hilton" },
  { src: marriottLogo, alt: "Marriott" }, { src: logoSelectCatering, alt: "Select Catering" }, { src: logoAppel, alt: "Appèl" },
];

export default function FrontOfficeVacaturesAmsterdam() {
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ACTIVE = "/front-office-vacatures-amsterdam";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = "Front office vacatures Amsterdam | Receptionist werk via EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Op zoek naar front office vacatures of receptionist werk in Amsterdam? Via EXTRA werk je in tophotels met flexibele diensten en dagbetaling.");
    setMeta("og:title", "Front office vacatures Amsterdam | Receptionist werk via EXTRA", true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-purple-500/5 border-b border-purple-100/50" : "bg-transparent"}`}
        onMouseLeave={() => { dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 200); }}
        onMouseEnter={() => { if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current); }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/landing">
              <img src={extraLogoWit} alt="EXTRA logo" className={`h-9 sm:h-10 w-auto cursor-pointer transition-all ${scrolled ? "brightness-0" : ""}`} />
            </Link>
            <div className="hidden lg:flex items-center gap-2">
              <div className="relative" onMouseEnter={() => { if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current); setActiveDropdown("werk"); }}>
                <button className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${activeDropdown === "werk" ? (scrolled ? "text-purple-700 bg-purple-50" : "text-white bg-white/10") : (scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10")}`}>
                  <UserCheck className="w-5 h-5" />
                  Ik zoek extra werk
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "werk" ? "rotate-180" : ""}`} />
                </button>
                <div className={`absolute top-full left-0 pt-2 transition-all duration-200 ${activeDropdown === "werk" ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-100/60 p-2 min-w-[220px]">
                    {NAV_ITEMS.map((item) => (
                      <a key={item.label} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${item.href === ACTIVE ? "bg-purple-50 text-purple-700" : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.href === ACTIVE ? "bg-indigo-200" : "bg-indigo-100 group-hover:bg-indigo-200"}`}>
                          <item.icon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-sm font-semibold">{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <a href="/extraatje" className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10"}`}><Trophy className="w-5 h-5" /> EXTRAATJE</a>
              <a href="/hoe-extra-werkt" className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10"}`}><Clock className="w-5 h-5" /> Werkwijze</a>
              <a href="/over-extra/ons-team" className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10"}`}><Users className="w-5 h-5" /> Ons Team</a>
              <a href="/aanmelden" className={`ml-4 text-[18px] font-black px-8 py-3.5 rounded-full transition-all hover:shadow-2xl hover:-translate-y-0.5 flex items-center gap-2.5 ${scrolled ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border border-purple-500/20 hover:shadow-purple-500/30" : "bg-white text-purple-700 hover:shadow-white/30 border-2 border-white"}`}>
                Aanmelden <ArrowRight className="w-[18px] h-[18px]" />
              </a>
            </div>
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className={scrolled ? "text-gray-900" : "text-white"} size={28} /> : <Menu className={scrolled ? "text-gray-900" : "text-white"} size={28} />}
            </button>
          </div>
        </div>
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="bg-white border-t border-gray-100 shadow-2xl overflow-y-auto max-h-[80vh]">
            <div className="px-5 py-5 space-y-1">
              <div>
                <button onClick={() => setMobileExpanded(mobileExpanded === "werk" ? null : "werk")} className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors">
                  <span className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center"><UserCheck className="w-4 h-4 text-indigo-600" /></div>Ik zoek extra werk</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileExpanded === "werk" ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileExpanded === "werk" ? "max-h-60" : "max-h-0"}`}>
                  <div className="pl-16 pr-4 pb-2 space-y-0.5">
                    {NAV_ITEMS.map((item) => (
                      <a key={item.label} href={item.href} className={`block py-2.5 text-sm font-medium transition-colors ${item.href === ACTIVE ? "text-purple-600 font-bold" : "text-gray-600 hover:text-purple-600"}`}>{item.label}</a>
                    ))}
                  </div>
                </div>
              </div>
              <a href="/extraatje" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors"><div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center"><Trophy className="w-4 h-4 text-purple-600" /></div>EXTRAATJE</a>
              <a href="/hoe-extra-werkt" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors"><div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center"><Clock className="w-4 h-4 text-purple-600" /></div>Werkwijze</a>
              <a href="/over-extra/ons-team" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors"><div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="w-4 h-4 text-purple-600" /></div>Ons Team</a>
              <div className="pt-3 border-t border-gray-100">
                <a href="/aanmelden" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-base px-6 py-4 rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all"><ArrowRight className="w-4 h-4" /> Aanmelden</a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}>
        <XBgDark />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <ConciergeBell className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">Front office vacatures via EXTRA</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Front-office werk{" "}
              <span className="relative inline-block">
                <span className="relative z-10">dat bij jou past.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-3.5 bg-gradient-to-r from-cyan-400 to-blue-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/90 max-w-xl leading-relaxed font-medium mb-8">
              Werk als hotel receptionist of front office medewerker bij tophotels in Amsterdam. Via EXTRA kies je zelf je diensten. Flexibel front office werk met dagbetaling en professionele hotelomgevingen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/aanmelden" className="group bg-white text-purple-900 font-bold px-7 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Meld je aan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#functies" className="border-2 border-white/30 text-white font-bold px-7 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Bekijk hoe het werkt <ChevronRight className="w-5 h-5" />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {[{ emoji: "⚡", label: "Dagbetaling via Jixbee" }, { emoji: "🏨", label: "Tophotels Amsterdam" }, { emoji: "📅", label: "Flexibele diensten" }].map(({ emoji, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">{emoji} {label}</span>
              ))}
            </div>
          </div>
          <div className="relative flex justify-center items-center">
            <div className="relative w-full max-w-sm">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/40 border-4 border-white/20">
                <img src={frontOfficeImg} alt="Front office medewerker via EXTRA – hotel receptionist Amsterdam" className="w-full h-[380px] sm:h-[440px] object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent rounded-3xl" />
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-cyan-100">💰 Dagbetaling actief</div>
              <div className="absolute -bottom-3 -left-4 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-green-100">🏨 Hotel receptionist werk</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUST STRIP ══ */}
      <section className="py-10 sm:py-14 bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Werk in hotels waar jij trots op kunt zijn</p>
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
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Jouw vakgebied</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Welke front-office functies kun je doen via EXTRA?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Via EXTRA werk je als hotel receptionist, front office medewerker of guest service medewerker bij hotels in Amsterdam. Wij koppelen je aan hotels die passen bij jouw niveau en wensen. Bekijk ook{" "}
                <a href="/horeca-werk" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">horeca werk</a>,{" "}
                <a href="/housekeeping-werk" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">housekeeping werk</a> of{" "}
                <a href="/chef-vacatures-amsterdam" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">chef vacatures</a>.
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
                      {f.bullets.map(b => (<li key={b} className="flex items-center gap-2 text-xs font-medium text-gray-700"><CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> {b}</li>))}
                    </ul>
                    <a href={f.href} className={`inline-flex items-center gap-1.5 text-xs font-black text-white px-4 py-2 rounded-full bg-gradient-to-r ${f.color} hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
                      Schrijf je in <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </article>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={400}>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {["Lobby host", "Concierge assistent", "Reserveringen medewerker", "Hospitality host"].map((fn) => (
                <span key={fn} className="bg-purple-50 border border-purple-100 px-5 py-2.5 rounded-full text-sm text-gray-600 font-medium">{fn}</span>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ WAAROM EXTRA ══ */}
      <section className="relative bg-white py-16 sm:py-28 overflow-hidden">
        <XBg />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Waarom EXTRA?</span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waarom front-office werk via EXTRA?
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                EXTRA biedt front office medewerkers en hotel receptionisten de vrijheid om te werken wanneer het jou uitkomt. Flexibele front office vacatures Amsterdam, dagbetaling en werken bij professionele hotels zonder langdurige verplichtingen.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {[
              { icon: Zap, badge: "Financiële vrijheid", title: "Dagbetaling via Jixbee", desc: "Na je dienst staat je geld dezelfde dag nog op je rekening. Geen wachten — direct inzicht in wat je verdient.", bg: "from-yellow-50 to-orange-50", border: "border-yellow-200", iconBg: "bg-yellow-100", iconColor: "text-yellow-600", tag: "⚡ Dagbetaling" },
              { icon: CalendarCheck, badge: "Eigen planning", title: "Flexibele diensten", desc: "Kies zelf wanneer je werkt. Dag- en nachtdiensten, weekenden of door de week — jij bepaalt.", bg: "from-violet-50 to-purple-50", border: "border-violet-200", iconBg: "bg-violet-100", iconColor: "text-violet-600", tag: "📅 Volledig flexibel" },
              { icon: Building2, badge: "Premium werkomgeving", title: "Werken in tophotels", desc: "Front office vacatures bij vijfsterren hotels, internationale ketens en boutique hotels in Amsterdam.", bg: "from-blue-50 to-indigo-50", border: "border-blue-200", iconBg: "bg-blue-100", iconColor: "text-blue-600", tag: "🏨 Toplocaties" },
              { icon: Globe, badge: "Internationale sfeer", title: "Internationale werkomgeving", desc: "Werk met gasten uit de hele wereld. Jouw taalvaardigheid en gastgerichtheid zijn hier een echte plus.", bg: "from-teal-50 to-cyan-50", border: "border-teal-200", iconBg: "bg-teal-100", iconColor: "text-teal-600", tag: "🌍 Internationaal" },
              { icon: Gift, badge: "Exclusief beloningssysteem", title: "EXTRAATJE beloningen", desc: "Spaar punten voor elke dienst en wissel ze in voor gave beloningen. Goed werk wordt altijd erkend.", bg: "from-orange-50 to-amber-50", border: "border-orange-200", iconBg: "bg-orange-100", iconColor: "text-orange-600", tag: "🎁 Punten sparen" },
              { icon: Handshake, badge: "Persoonlijke aanpak", title: "Persoonlijk contact", desc: "Onze planners kennen jou en jouw voorkeuren. Altijd bereikbaar en altijd eerlijk.", bg: "from-emerald-50 to-teal-50", border: "border-emerald-200", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", tag: "💬 Direct bereikbaar" },
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

      {/* ══ HOTELS ══ */}
      <section className="py-16 sm:py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Toplocaties</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hotels waar jij trots op kunt zijn
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Via EXTRA werk je als hotel receptionist of front office medewerker in hotels waar kwaliteit en gastvrijheid centraal staan. Internationale gasten, professionele receptieteams en een prettige werksfeer.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 mb-10">
            {[
              { icon: Building2, title: "Vijfsterren hotels", desc: "Internationale hotelketens in Amsterdam, Utrecht en Den Haag. Topstandaarden en professionele receptieteams.", iconBg: "bg-indigo-100", iconColor: "text-indigo-600", bg: "from-indigo-50 to-blue-50", border: "border-indigo-200" },
              { icon: Globe, title: "Internationale ketens", desc: "Werk voor bekende hotelmerken met hoge kwaliteitseisen. Je werkt met gasten uit de hele wereld en bouwt een sterk CV op.", iconBg: "bg-purple-100", iconColor: "text-purple-600", bg: "from-purple-50 to-violet-50", border: "border-purple-200" },
              { icon: Smile, title: "Vaste hotelpoule", desc: "Je wordt gekoppeld aan een vaste poule zodat je procedures kent, het team leert en snel vertrouwd raakt met de locatie.", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", bg: "from-emerald-50 to-teal-50", border: "border-emerald-200" },
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Partnerhotels</p>
              <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
                {[{ src: marriottLogo, alt: "Marriott" }, { src: amrathLogo, alt: "Amrath" }, { src: nhLogo, alt: "NH Hotels" }, { src: hiltonLogo, alt: "Hilton" }, { src: mercureLogo, alt: "Mercure Hotels" }, { src: pulitzerLogo, alt: "Pulitzer Amsterdam" }].map(({ src, alt }) => (
                  <img key={alt} src={src} alt={alt} className="h-6 sm:h-8 w-auto object-contain grayscale opacity-40 hover:opacity-70 hover:grayscale-0 transition-all" loading="lazy" />
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ HOE HET WERKT ══ */}
      <section id="hoe-het-werkt" className="relative bg-white py-16 sm:py-24 overflow-hidden">
        <XBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">In 4 stappen</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Zo begin je als front-office medewerker via EXTRA
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">Van aanmelding tot je eerste hotelreceptie. Simpel, snel en duidelijk.</p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { step: "01", icon: MessageCircle, title: "Schrijf je in", desc: "Meld je aan via het formulier en upload je cv. Binnen enkele minuten geregeld.", color: "from-purple-500 to-violet-600" },
              { step: "02", icon: Users, title: "Kennismaking", desc: "We bespreken jouw ervaring, voorkeur en beschikbaarheid. Dan kijken we welke hotels bij je passen.", color: "from-indigo-500 to-blue-600" },
              { step: "03", icon: CalendarCheck, title: "Kies je diensten", desc: "Je kiest zelf de front office diensten die bij jouw agenda passen.", color: "from-teal-500 to-cyan-600" },
              { step: "04", icon: Zap, title: "Werk en word betaald", desc: "Werk je dienst en ontvang dezelfde dag je betaling via Jixbee.", color: "from-cyan-500 to-blue-500" },
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
              <a href="/aanmelden" className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-white text-base transition-all hover:-translate-y-0.5 hover:shadow-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                Schrijf je in <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══ DAGBETALING ══ */}
      <section className="py-16 sm:py-24 lg:py-32" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Financiële vrijheid</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Geld op je rekening, dezelfde dag nog.
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6 text-base sm:text-lg">
                  Na je front office dienst wordt je uitbetaald via Jixbee. Geen wachten tot het einde van de maand. Je ziet direct wat je hebt verdiend en ontvangt je geld dezelfde dag.
                </p>
                <div className="space-y-3 mb-8">
                  {["Uitbetaling via Jixbee, zelfde dag na je dienst", "Real-time inzicht in je gewerkte uren en bedrag", "Officieel contract en payroll conform wetgeving", "Geen verrassingen op je loonstrook"].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="h-3 w-3 text-green-600" /></div>
                      <span className="text-sm text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <a href="/hoe-werkt-dagbetaling" className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-900 transition-colors">Hoe werkt dagbetaling? <ChevronRight className="w-4 h-4" /></a>
              </div>
              <div className="flex justify-center">
                <div className="relative flex gap-5 items-end h-[320px] sm:h-[380px]">
                  <div style={{ transform: "rotate(-5deg)", animation: "float-fow 5s ease-in-out infinite" }}>
                    <img src={jixbeeUren} alt="Jixbee – gewerkte uren overzicht" className="w-[145px] sm:w-[175px] drop-shadow-2xl rounded-[2rem]" />
                  </div>
                  <div className="relative z-10 -mb-4" style={{ animation: "float-fow 4s ease-in-out infinite" }}>
                    <img src={jixbeePayout} alt="Jixbee – payout succesvol" className="w-[155px] sm:w-[190px] drop-shadow-2xl rounded-[2rem]" />
                    <div className="absolute -top-3 -right-10 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 border border-cyan-100 whitespace-nowrap">💸 €590,- uitbetaald</div>
                    <div className="absolute -bottom-2 -left-8 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 border border-green-100 whitespace-nowrap">✅ Uren goedgekeurd</div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
        <style>{`@keyframes float-fow { 0%,100%{transform:translateY(0px) rotate(-5deg)} 50%{transform:translateY(-12px) rotate(-5deg)} }`}</style>
      </section>

      {/* ══ REVIEWS ══ */}
      <section className="py-16 sm:py-24" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Ervaringen</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat zeggen front-office medewerkers?
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
            {reviews.map(({ name, functie, tekst, rating }, i) => (
              <RevealSection key={name} delay={i * 80}>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-purple-100 shadow-md hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all h-full flex flex-col">
                  <div className="flex mb-3">{Array.from({ length: rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}</div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4 italic">"{tekst}"</p>
                  <div className="border-t border-purple-100 pt-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-black">{name.charAt(0)}</div>
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

      {/* ══ CTA STRIP ══ */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-black text-base sm:text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>Begin vandaag met front office werk via EXTRA</p>
            <p className="text-purple-200 text-sm mt-0.5">Wil je werken als hotel receptionist of front office medewerker in Amsterdam? Meld je aan bij EXTRA en start snel met diensten bij tophotels.</p>
          </div>
          <a href="/aanmelden" className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-purple-900 font-black px-6 py-3 rounded-full text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Start je aanmelding <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* ══ FAQ ══ */}
      <FAQSection heading="Veelgestelde vragen over front-office werk via EXTRA" faqs={faqs} />

      {/* ══ LINK CLOUD ══ */}
      <section className="py-12 bg-white border-t border-purple-100/60">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 text-center">Gerelateerde pagina's</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Front office vacatures Amsterdam", href: "/front-office-vacatures-amsterdam" },
              { label: "Receptionist vacatures hotel", href: "/front-office-vacatures-amsterdam" },
              { label: "Horeca werk", href: "/horeca-werk" },
              { label: "Housekeeping werk", href: "/housekeeping-werk" },
              { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
              { label: "Hoe werkt dagbetaling?", href: "/hoe-werkt-dagbetaling" },
              { label: "Aanmelden bij EXTRA", href: "/aanmelden" },
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
