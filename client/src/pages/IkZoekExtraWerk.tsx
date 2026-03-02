import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, ChevronRight, ChevronDown, Zap, Star, Clock, MapPin,
  Shield, TrendingUp, Gift, Award, Users, Briefcase,
  CheckCircle2, MessageCircle, Phone, Building2, UtensilsCrossed,
  BedDouble, ChefHat, ConciergeBell, Sparkles, Heart, Target,
  BarChart3, Flame, Menu, X, UserCheck, Trophy
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";
import xPatroon from "@assets/X_patroon_1771260543289.png";
import horecaImg from "@assets/Horecamedewerker_1771836004844.png";
import housekeepingImg from "@assets/Housekeeping_1771842919384.png";
import chefImg from "@assets/Chef_1771833440047.png";
import frontOfficeImg from "@assets/Front-office_1771842663934.png";
import padelImg from "@assets/Padelracket_1771872665358.png";
import airpodsImg from "@assets/Airpods_1771872665358.png";
import extraAppImg from "@assets/EXTRA_app_1772394156269.png";
import marriottLogo from "@assets/Logo_Marriott_1771267205959.png";
import amrathLogo from "@assets/Logo_amrath_1771267205959.png";
import nhLogo from "@assets/Copyright_nh_hotel_group_Logo_NH-Hotels_1769548607559.png";
import hiltonLogo from "@assets/Logo_Hilton_1771267205959.png";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.png";
import logoFunda from "@assets/Logo_funda_1771267205959.png";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.png";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.png";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.png";
import logoAppel from "@assets/Logo-Appel_1771267205959.png";
import imgDashboard from "@assets/IMG_8971_1772395165096.png";
import imgBeloningen from "@assets/IMG_8973_1772396250204.png";
import imgRanglijst from "@assets/IMG_8977_1772396250204.png";

/* ── SCROLL REVEAL ── */
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

/* ── PATTERN BACKGROUNDS ── */
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

/* ── PHONE MOCKUP ── */
function PhoneMockup({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative w-[160px] sm:w-[200px] ${className}`}>
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-900/30 border-[5px] border-gray-800 bg-gray-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[18px] bg-gray-900 rounded-b-xl z-20" />
        <img src={src} alt={alt} className="w-full relative z-10" loading="lazy" decoding="async" />
      </div>
    </div>
  );
}

/* ── FAQ ITEM ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-2 border-purple-100 rounded-2xl overflow-hidden hover:border-purple-200 transition-colors bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-sm sm:text-base font-black text-gray-900 pr-4" style={{ fontFamily: "'Poppins', sans-serif" }}>{q}</span>
        <ChevronDown className={`w-4 h-4 text-purple-600 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ── PAGE ── */
export default function IkZoekExtraWerk() {
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = "Flexibel werk in de hospitality — wanneer jij wil | EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Flexibel werk in de hospitality — via EXTRA. Dagbetaling, premium locaties, EXTRAATJE rewards en shifts die bij jou passen. Meld je aan in 2 minuten.");
    setMeta("og:title", "Flexibel werk in de hospitality — EXTRA", true);
    setMeta("og:description", "Werken bij Marriott, Amrath, NH Hotels en meer. Dagbetaling via Jixbee, EXTRAATJE rewards en échte doorgroeimogelijkheden.", true);
    setMeta("og:type", "website", true);
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://www.doehetextra.nl/ik-zoek-extra-werk";
    return () => { canonical?.remove(); };
  }, []);

  const functies = [
    {
      title: "Horeca",
      sub: "Banqueting · Bediening · Events",
      img: horecaImg,
      desc: "Van exclusieve banqueting-diensten tot levendige restaurantshifts op toplocaties.",
      bullets: ["Flexibele dag- en avonddiensten", "Werken bij evenementen & gala's", "Professionele brigades"],
      color: "from-purple-600 to-violet-700",
      href: "/aanmelden",
    },
    {
      title: "Housekeeping",
      sub: "Hotels · Resorts · Boutique",
      img: housekeepingImg,
      desc: "Kwaliteits-housekeeping voor de mooiste hotelketens in Nederland.",
      bullets: ["Vaste poule bij tophotels", "Dagdiensten met structuur", "Professioneel team"],
      color: "from-blue-600 to-indigo-700",
      href: "/aanmelden",
    },
    {
      title: "Chef & Keuken",
      sub: "Diverse niveaus · Culinair",
      img: chefImg,
      desc: "Van sous-chef tot entremetier — werk in keukens waar kwaliteit centraal staat.",
      bullets: ["Fine dining & catering", "Culinaire toplocaties", "Doorgroei naar vast"],
      color: "from-orange-500 to-amber-600",
      href: "/aanmelden",
    },
    {
      title: "Front Office",
      sub: "Receptie · Guest Relations",
      img: frontOfficeImg,
      desc: "De professionele eerste indruk van hotels. Representatief, scherp en servicegericht.",
      bullets: ["4- en 5-sterrenshotels", "Sterke communicatieve skills", "Internationale gasten"],
      color: "from-emerald-500 to-teal-600",
      href: "/aanmelden",
    },
  ];

  const vacatures = [
    { title: "Banqueting medewerker Amsterdam (flexibel)", bullets: ["Evenementenlocaties & gala's", "Dag- en avonddiensten beschikbaar"], hrs: "Parttime / flexibel" },
    { title: "Front Office medewerker – hotel Utrecht", bullets: ["4-sterrenhotel, centrumlocatie", "Weekenden & doordeweeks"], hrs: "Parttime / fulltime" },
    { title: "Zelfstandig werkend kok – Randstad", bullets: ["Culinaire locaties in Amsterdam & Utrecht", "Basis- t/m senior niveau"], hrs: "Flexibel / losse diensten" },
    { title: "Housekeeping medewerker – NH Hotels", bullets: ["Vaste poule bij NH Hotels Nederland", "Dagdiensten maandag t/m zondag"], hrs: "Parttime" },
    { title: "Receptionist – boutique hotel Amsterdam", bullets: ["Internationaal team, Engelstalig", "Ochtend- en middagdiensten"], hrs: "Flexibel" },
    { title: "Barista / Bediening – grand café", bullets: ["Bruisende locatie, vaste kern", "Service met karakter"], hrs: "Parttime / flexibel" },
  ];

  const reviews = [
    { name: "Sven R.", functie: "Banqueting medewerker", tekst: "Via EXTRA werk ik bij locaties waar ik echt trots op ben. De planning is duidelijk, mijn begeleider reageert snel en mijn punten groeien elke maand.", rating: 5 },
    { name: "Fleur V.", functie: "Front Office", tekst: "Ik had verwacht dat het een standaard uitzendbureau zou zijn, maar EXTRA voelt echt anders. Ze kennen je naam, snappen je situatie en stellen je voor aan de juiste plekken.", rating: 5 },
    { name: "Jaylen K.", functie: "Chef de partie", tekst: "Dag na dag uitbetaald. Dat was voor mij de reden om te beginnen, maar ik ben gebleven voor de kwalitatieve keukens en de eerlijke begeleiding.", rating: 5 },
  ];

  const blogs = [
    { tag: "Hospitality", title: "Wat maakt een goede horeca-professional in 2025?", datum: "15 feb 2025", kleur: "bg-purple-100 text-purple-700" },
    { tag: "Carrière", title: "Van flexibel naar vast: doorgroeien via EXTRA", datum: "3 jan 2025", kleur: "bg-blue-100 text-blue-700" },
    { tag: "Finance", title: "Dagbetaling: zo werkt financiële vrijheid in de praktijk", datum: "20 dec 2024", kleur: "bg-green-100 text-green-700" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-purple-500/5 border-b border-purple-100/50" : "bg-transparent"}`}
        onMouseLeave={() => { dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 200); }}
        onMouseEnter={() => { if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current); }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/landing">
              <img src={extraLogoWit} alt="EXTRA logo" className={`h-9 sm:h-10 w-auto cursor-pointer transition-all ${scrolled ? "brightness-0" : ""}`} />
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-2">

              {/* Ik zoek extra werk (dropdown) */}
              <div className="relative" onMouseEnter={() => { if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current); setActiveDropdown("werk"); }}>
                <button className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${activeDropdown === "werk" ? (scrolled ? "text-purple-700 bg-purple-50" : "text-white bg-white/10") : (scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10")}`}>
                  <UserCheck className="w-5 h-5" />
                  Ik zoek extra werk
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "werk" ? "rotate-180" : ""}`} />
                </button>
                <div className={`absolute top-full left-0 pt-2 transition-all duration-200 ${activeDropdown === "werk" ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-100/60 p-2 min-w-[220px]">
                    {[
                      { label: "Horeca", href: "/aanmelden", icon: UtensilsCrossed },
                      { label: "Housekeeping", href: "/aanmelden", icon: BedDouble },
                      { label: "Chef & Keuken", href: "/aanmelden", icon: ChefHat },
                      { label: "Front Office", href: "/aanmelden", icon: ConciergeBell },
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

              {/* EXTRAATJE */}
              <a href="/extraatje" className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10"}`}>
                <Trophy className="w-5 h-5" />
                EXTRAATJE
              </a>

              {/* Werkwijze */}
              <a href="/hoe-extra-werkt" className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10"}`}>
                <Clock className="w-5 h-5" />
                Werkwijze
              </a>

              {/* Ons Team */}
              <a href="/over-extra/ons-team" className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10"}`}>
                <Users className="w-5 h-5" />
                Ons Team
              </a>

              {/* CTA */}
              <a href="/aanmelden" className={`ml-4 text-[18px] font-black px-8 py-3.5 rounded-full transition-all hover:shadow-2xl hover:-translate-y-0.5 flex items-center gap-2.5 ${scrolled ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border border-purple-500/20 hover:shadow-purple-500/30" : "bg-white text-purple-700 hover:shadow-white/30 border-2 border-white"}`}>
                Aanmelden <ArrowRight className="w-[18px] h-[18px]" />
              </a>
            </div>

            {/* Mobile hamburger */}
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className={scrolled ? "text-gray-900" : "text-white"} size={28} /> : <Menu className={scrolled ? "text-gray-900" : "text-white"} size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="bg-white border-t border-gray-100 shadow-2xl overflow-y-auto max-h-[80vh]">
            <div className="px-5 py-5 space-y-1">
              {/* Ik zoek extra werk */}
              <div>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === "werk" ? null : "werk")}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                    </div>
                    Ik zoek extra werk
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileExpanded === "werk" ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${mobileExpanded === "werk" ? "max-h-60" : "max-h-0"}`}>
                  <div className="pl-16 pr-4 pb-2 space-y-0.5">
                    {["Horeca", "Housekeeping", "Chef & Keuken", "Front Office"].map((item) => (
                      <a key={item} href="/aanmelden" className="block py-2.5 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">{item}</a>
                    ))}
                  </div>
                </div>
              </div>
              {/* EXTRAATJE */}
              <a href="/extraatje" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-purple-600" />
                </div>
                EXTRAATJE
              </a>
              {/* Werkwijze */}
              <a href="/hoe-extra-werkt" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                Werkwijze
              </a>
              {/* Ons Team */}
              <a href="/over-extra/ons-team" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                Ons Team
              </a>
              {/* CTA */}
              <div className="pt-3 border-t border-gray-100">
                <a href="/aanmelden" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-base px-6 py-4 rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all">
                  <ArrowRight className="w-4 h-4" /> Aanmelden
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}>
        <XPatternBgDark />

        {/* floating glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-fuchsia-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-16 sm:pt-28 sm:pb-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 text-xs font-semibold">Dagelijks nieuwe shifts beschikbaar</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Flexibel werk<br />
              in de{" "}
              <span className="relative inline-block">
                <span className="relative z-10">hospitality</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-3.5 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
              ,<br />
              wanneer jij wilt!
            </h1>

            <p className="text-lg sm:text-xl text-purple-100/90 max-w-xl leading-relaxed font-medium mb-8">
              Kies je eigen shifts, word dagelijks uitbetaald en werk op de mooiste hotellocaties en evenementenplekken. EXTRA begeleidt je en beloont je prestaties.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/aanmelden" className="group bg-white text-purple-900 font-bold px-7 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Meld je aan in 2 minuten <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#functies" className="border-2 border-white/30 text-white font-bold px-7 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Bekijk functies <ChevronRight className="w-5 h-5" />
              </a>
            </div>

            {/* Micro badges */}
            <div className="mt-8 flex flex-wrap gap-2.5">
              {[
                { icon: Zap, label: "Dagbetaling" },
                { icon: MapPin, label: "Premium locaties" },
                { icon: Gift, label: "EXTRAATJE rewards" },
                { icon: Shield, label: "Altijd begeleid" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Icon className="w-3 h-3" /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right – phone mockup stack */}
          <div className="relative flex justify-center items-end gap-4 h-[340px] sm:h-[420px]">
            {/* Back phone */}
            <div className="absolute left-[5%] bottom-0 opacity-70" style={{ transform: "rotate(-8deg) translateY(10px)" }}>
              <PhoneMockup src={imgBeloningen} alt="EXTRA beloningen" className="w-[130px] sm:w-[160px]" />
            </div>
            {/* Front phone */}
            <div className="relative z-10">
              <PhoneMockup src={imgDashboard} alt="EXTRA dashboard" className="w-[160px] sm:w-[200px]" />
              {/* floating badge */}
              <div className="absolute -top-4 -right-8 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-purple-100">
                💰 Dagbetaling actief
              </div>
              <div className="absolute -bottom-2 -left-10 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-purple-100">
                🏆 +250 punten verdiend
              </div>
            </div>
            {/* Right phone */}
            <div className="absolute right-[5%] bottom-0 opacity-70" style={{ transform: "rotate(6deg) translateY(10px)" }}>
              <PhoneMockup src={imgRanglijst} alt="EXTRA ranglijst" className="w-[130px] sm:w-[160px]" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          2. TRUST STRIP – PARTNER LOGOS
      ══════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Vertrouwd door teams in de horeca</p>
          <div className="relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee-izew group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                  {[
                    { src: amrathLogo, alt: "Amrâth Hotels" },
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
          @keyframes marquee-izew {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-izew {
            animation: marquee-izew 40s linear infinite;
          }
        `}</style>
      </section>

      {/* ══════════════════════════════════════════════
          3. USPs – WAAROM EXTRA
      ══════════════════════════════════════════════ */}
      <section className="relative bg-white py-16 sm:py-24 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Professional perks</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waarom werken via EXTRA?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                EXTRA is geen standaard uitzendbureau. We zoeken en behouden professionals die kwaliteit hoog in het vaandel hebben.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { icon: Zap, title: "Direct salaris", desc: "Na elke gewerkte shift betalen we je dagelijks uit. Volledige controle over je financiën.", color: "from-purple-500 to-violet-600" },
              { icon: MapPin, title: "Premium locaties", desc: "Marriott, Amrath, NH Hotels, evenementencentra. Werken op plekken waar je trots op bent.", color: "from-blue-500 to-indigo-600" },
              { icon: Target, title: "Match op niveau", desc: "Van front office tot culinair. Wij koppelen je aan opdrachten die aansluiten bij jouw ervaring.", color: "from-teal-500 to-cyan-600" },
              { icon: Award, title: "EXTRAATJE rewards", desc: "Professionele erkenning via ons puntensysteem. Goede prestaties worden beloond met echte rewards.", color: "from-orange-500 to-amber-500" },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <RevealSection key={title} delay={i * 70}>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-purple-100 shadow-md hover:shadow-xl hover:border-purple-200 hover:-translate-y-1.5 transition-all h-full">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          4. DAGBETALING (JIXBEE)
      ══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 lg:py-32" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Financiële vrijheid</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Direct salaris na elke gewerkte shift
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6 text-base sm:text-lg">
                  Geen wachten tot het einde van de maand. Na elke gewerkte shift wordt je salaris de volgende ochtend bijgeschreven. Volledig transparant, direct te bekijken in de EXTRA app.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "Dagelijks uitbetaald — ook op weekenden",
                    "Volledig inzicht via de EXTRA app",
                    "Gecertificeerde payroll, geen verrassingen",
                    "Reiskostenvergoeding inbegrepen",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <a href="#faq" className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-900 transition-colors">
                  Hoe werkt dagbetaling? <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Phone stack */}
              <div className="flex justify-center">
                <div className="relative flex gap-6 items-end h-[320px] sm:h-[380px]">
                  <div style={{ transform: "rotate(-5deg)" }}>
                    <PhoneMockup src={imgDashboard} alt="EXTRA app – jouw salaris" className="w-[140px] sm:w-[170px]" />
                  </div>
                  <div className="relative z-10 -mb-4">
                    <PhoneMockup src={imgBeloningen} alt="EXTRA app – uitbetalingen" className="w-[150px] sm:w-[185px]" />
                    <div className="absolute -top-3 -right-10 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 border border-purple-100 whitespace-nowrap">
                      💳 +€87,50 bijgeschreven
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          5. EXTRAATJE REWARDS
      ══════════════════════════════════════════════ */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Images */}
              <div className="order-2 lg:order-1 flex gap-4 justify-center">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-4 border-2 border-purple-100 shadow-md">
                    <img src={padelImg} alt="Adidas padelracket – EXTRAATJE beloning" className="w-full h-36 sm:h-44 object-contain" loading="lazy" />
                    <p className="text-xs font-black text-center text-gray-700 mt-2">Adidas Padel Set<br /><span className="text-purple-600">1.200 punten</span></p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 border-2 border-blue-100 shadow-md">
                    <img src={airpodsImg} alt="AirPods Pro – EXTRAATJE beloning" className="w-full h-36 sm:h-44 object-contain" loading="lazy" />
                    <p className="text-xs font-black text-center text-gray-700 mt-2">AirPods Pro<br /><span className="text-purple-600">1.000 punten</span></p>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2">
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Professionele erkenning</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  EXTRAATJE — voordelen die passen bij ambitie
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6 text-base sm:text-lg">
                  Iedere shift levert punten op. Die punten spaar je in voor sport, lifestyle en tech. Exclusieve deals van onze partners, zichtbaar in de EXTRA app.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: "🏋️", label: "Sport & lifestyle" },
                    { icon: "🎧", label: "Tech & gadgets" },
                    { icon: "🎁", label: "Exclusieve deals" },
                    { icon: "⚡", label: "Bonus voor prestaties" },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-2.5 border border-purple-100">
                      <span className="text-lg">{icon}</span>
                      <span className="text-xs font-bold text-gray-800">{label}</span>
                    </div>
                  ))}
                </div>
                <Link href="/extraatje" className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-white text-sm transition-all hover:-translate-y-0.5 hover:shadow-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                  Bekijk alle voordelen <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          6. FUNCTIES
      ══════════════════════════════════════════════ */}
      <section id="functies" className="py-16 sm:py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Jouw vakgebied</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Kies je richting
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Van banqueting tot receptie — we matchen je aan de opdrachten die bij jouw ervaring en ambitie passen.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {functies.map((f, i) => (
              <RevealSection key={f.title} delay={i * 70}>
                <article className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-purple-100 shadow-md hover:shadow-2xl hover:border-purple-200 hover:-translate-y-2 transition-all h-full flex flex-col">
                  {/* Image */}
                  <div className={`relative h-44 sm:h-52 overflow-hidden bg-gradient-to-br ${f.color}`}>
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-luminosity opacity-90" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-white font-black text-lg leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>{f.title}</h3>
                      <p className="text-white/70 text-[10px] font-semibold">{f.sub}</p>
                    </div>
                  </div>
                  {/* Content */}
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
                      Meer over {f.title} <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </article>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          7. HOE HET WERKT
      ══════════════════════════════════════════════ */}
      <section className="relative bg-white py-16 sm:py-24 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">In 4 stappen</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Van aanmelding tot eerste shift
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { step: "01", icon: MessageCircle, title: "Aanmelden", desc: "Meld je in 2 minuten aan via de website, WhatsApp of Indeed.", color: "from-purple-500 to-violet-600" },
              { step: "02", icon: Users, title: "Kennismaking", desc: "We leren je kennen op kantoor. Jouw skills, wensen en niveau bepalen de match.", color: "from-indigo-500 to-blue-600" },
              { step: "03", icon: Target, title: "Match & poule", desc: "Wij plaatsen je in de juiste poule op basis van ervaring, persoonlijkheid en beschikbaarheid.", color: "from-teal-500 to-cyan-600" },
              { step: "04", icon: Zap, title: "Werken & groeien", desc: "Kies shifts, word dagelijks betaald, verdien punten en bouw aan je professionele reputatie.", color: "from-orange-500 to-amber-500" },
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
                Start je aanmelding <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          8. REVIEWS
      ══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Ervaringen</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat zeggen professionals over EXTRA?
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
                      <p className="text-[10px] text-gray-400 font-medium">{functie}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          {/* Partner logos */}
          <RevealSection delay={200}>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Onze opdrachtgevers</p>
              <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
                {[
                  { src: marriottLogo, alt: "Marriott" },
                  { src: amrathLogo, alt: "Amrath" },
                  { src: nhLogo, alt: "NH Hotels" },
                  { src: hiltonLogo, alt: "Hilton" },
                ].map(({ src, alt }) => (
                  <img key={alt} src={src} alt={alt} className="h-6 sm:h-8 w-auto object-contain grayscale opacity-40 hover:opacity-70 hover:grayscale-0 transition-all" loading="lazy" />
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          9. EXTRAATJE + RATINGSYSTEEM
      ══════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 py-16 sm:py-24 overflow-hidden">
        <XPatternBgDark />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-4 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <BarChart3 className="w-4 h-4" /> Kwaliteitssysteem
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-0 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Presteren wordt erkend en beloond
                </h2>
                <p className="text-purple-200/80 leading-relaxed mb-6 text-base sm:text-lg">
                  Na elke shift krijg je feedback op zowel soft- als hardskills. Zo bouwen we topteams — en weet jij precies waar je staat en wat je waard bent.
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    { icon: Flame, label: "Hoge score? Eerder gebeld voor nieuwe shifts" },
                    { icon: Award, label: "Consistente kwaliteit? Snellere doorgroei" },
                    { icon: Gift, label: "Microprestaties leveren automatisch EXTRAATJE-punten op" },
                    { icon: TrendingUp, label: "Transparant profiel — jij bepaalt je eigen reputatie" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3 h-3 text-purple-300" />
                      </div>
                      <span className="text-sm text-purple-200/80 font-medium leading-snug">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <img src={extraAppImg} alt="EXTRA app – prestatie dashboard" className="w-64 sm:w-72 rounded-2xl shadow-2xl shadow-black/30 border border-white/10" loading="lazy" />
                  <div className="absolute -top-3 -right-4 bg-white rounded-2xl px-3 py-2 text-xs font-black text-gray-900 shadow-xl border border-purple-100 whitespace-nowrap">
                    ⭐ Jouw score: 9.2
                  </div>
                  <div className="absolute -bottom-3 -left-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl px-3 py-2 text-xs font-black text-white shadow-xl whitespace-nowrap">
                    🔥 Top 10% medewerker
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          10. AANMELDBONUS STRIP
      ══════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-black text-base sm:text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Meld je aan en krijg direct toegang tot exclusieve voordelen, rewards & deals.
            </p>
            <p className="text-purple-200 text-sm mt-0.5">Geen kosten. Geen verplichtingen. Jij beslist wanneer je werkt.</p>
          </div>
          <a href="/aanmelden" className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-purple-900 font-black px-6 py-3 rounded-full text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Start je aanmelding <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          11. BLOG
      ══════════════════════════════════════════════ */}
      <section className="relative bg-white py-16 sm:py-24 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Hospitality insights</span>
                <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-2 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Horeca & hospitality
                </h2>
              </div>
              <Link href="/nieuws" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors">
                Lees alle artikelen <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
            {blogs.map(({ tag, title, datum, kleur }, i) => (
              <RevealSection key={title} delay={i * 80}>
                <Link href="/nieuws" className="group block bg-white rounded-2xl overflow-hidden border-2 border-purple-100 shadow-md hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all h-full">
                  <div className="h-32 bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-purple-400" />
                  </div>
                  <div className="p-4">
                    <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${kleur} mb-2`}>{tag}</span>
                    <h3 className="text-sm font-black text-gray-900 leading-snug mb-2 group-hover:text-purple-700 transition-colors" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                    <p className="text-[11px] text-gray-400 font-medium">{datum}</p>
                  </div>
                </Link>
              </RevealSection>
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link href="/nieuws" className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-600">
              Lees alle artikelen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          12. FAQ
      ══════════════════════════════════════════════ */}
      <section id="faq" className="py-16 sm:py-24" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Veelgestelde vragen</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Alles wat je wil weten
              </h2>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="space-y-3">
              {[
                { q: "Hoe werkt dagbetaling precies?", a: "Na elke gewerkte shift verwerken wij je uren. De volgende ochtend staat je salaris op je rekening. Dit geldt ook voor weekenden en feestdagen. Geen wachttijden, geen maandelijkse salarisrondes." },
                { q: "Hoe ziet het kennismakingsgesprek eruit?", a: "Het gesprek duurt ongeveer 30-45 minuten op ons kantoor. We bespreken je ervaring, voorkeuren, beschikbaarheid en persoonlijkheid. Het is informeel, maar professioneel — we willen echt weten wie jij bent." },
                { q: "Moet ik ervaring hebben in de hospitality?", a: "Niet per se. We werken met medewerkers van diverse niveaus. Wat wij zoeken is de juiste houding, representativiteit en motivatie. Ervaring helpt, maar je drive is minstens zo belangrijk." },
                { q: "Hoe flexibel kan ik werken?", a: "Volledig flexibel. Jij bepaalt je beschikbaarheid en kiest welke shifts je wil pakken. Er is geen minimumvereiste qua uren — al raden we aan om actief te blijven voor de beste matching." },
                { q: "Wat zijn de doorgroeimogelijkheden?", a: "Via EXTRA kun je groeien van losse shifts naar een vaste opdracht bij een opdrachtgever. Medewerkers met hoge scores en sterke reviews worden als eerste benaderd voor exclusieve projecten en vaste rollen." },
              ].map(item => (
                <FaqItem key={item.q} {...item} />
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          13. SEO VACATURES
      ══════════════════════════════════════════════ */}
      <section className="relative bg-white py-16 sm:py-24 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Beschikbare opdrachten</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Actuele vacatures
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Dagelijks nieuwe opdrachten in de hospitality. Meld je aan en word gematcht.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {vacatures.map(({ title, bullets, hrs }, i) => (
              <RevealSection key={title} delay={i * 60}>
                <div className="bg-white rounded-2xl p-5 border-2 border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-200 hover:-translate-y-1 transition-all h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-sm font-black text-gray-900 leading-snug" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                    <span className="flex-shrink-0 text-[9px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{hrs}</span>
                  </div>
                  <ul className="space-y-1 mb-4 flex-1">
                    {bullets.map(b => (
                      <li key={b} className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                  <a href="/aanmelden" className="inline-flex items-center gap-1.5 text-xs font-black text-purple-700 hover:text-purple-900 transition-colors">
                    Solliciteer direct <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          14. AFSLUITENDE CTA
      ══════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 py-20 sm:py-28 overflow-hidden">
        <XPatternBgDark />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-5 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
              <Zap className="w-4 h-4" /> Klaar om te starten?
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA te gaan verdienen?</span>
                <span className="absolute bottom-0.5 left-0 right-0 h-2 sm:h-3 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-70 rounded-sm" />
              </span>
            </h2>
            <p className="text-purple-200/80 text-base sm:text-lg mb-8 leading-relaxed">
              Aanmelden duurt 2 minuten. Daarna ben je onderdeel van een professioneel netwerk van medewerkers die dagelijks werken op de mooiste locaties.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/aanmelden" className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2">
                Meld je nu aan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="https://wa.me/31000000000" className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2">
                Stel een vraag via WhatsApp <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t border-purple-100 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-center gap-6 text-xs text-gray-400 flex-wrap">
          <Link href="/landing" className="hover:text-purple-600 transition-colors">Home</Link>
          <Link href="/hoe-extra-werkt" className="hover:text-purple-600 transition-colors">Hoe het werkt</Link>
          <Link href="/extraatje" className="hover:text-purple-600 transition-colors">EXTRAATJE</Link>
          <Link href="/aanmelden" className="hover:text-purple-600 transition-colors">Aanmelden</Link>
          <Link href="/personeel-gezocht" className="hover:text-purple-600 transition-colors">Voor werkgevers</Link>
          <span>© 2025 EXTRA Hospitality Staffing</span>
        </div>
      </footer>
    </div>
  );
}
