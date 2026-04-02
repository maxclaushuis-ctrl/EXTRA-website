import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  ArrowRight, ChevronRight, ChevronDown, Zap, Star, Clock,
  Gift, Users, CheckCircle2, MessageCircle, Building2,
  UtensilsCrossed, BedDouble, ChefHat, ConciergeBell, Menu, X,
  UserCheck, Trophy, CalendarCheck, Handshake, Flame, Award,
  Utensils, Hotel
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import chefImg from "@assets/Chef_1771833440047.webp";
import chefHeroImg from "@assets/CHEF_FINAL_AE_001_1775057055119.png";
import marriottLogo from "@assets/Logo_Marriott_1771267205959.webp";
import amrathLogo from "@assets/Logo_amrath_1771267205959.webp";
import mercureLogo from "../assets/pitch/logo-mercure.png";
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
    title: "Zelfstandig werkend kok",
    sub: "Restaurants · Hotels · Zelfstandig",
    img: chefImg,
    desc: "Zelfstandig werkend kok vacature? Via EXTRA run je een keuken op hoog niveau of lever je versterking bij restaurants en hotels in Amsterdam.",
    bullets: ["Hoog niveau kok vacatures", "Diverse keukenstijlen", "Dag- en avonddiensten"],
    color: "from-orange-500 to-red-600",
    href: "/aanmelden",
  },
  {
    title: "Chef de partie",
    sub: "Hotels · Fine Dining · Brigades",
    img: dienstChefImg,
    desc: "Chef de partie vacature bij vijfsterren hotels of fine dining brigades. Verantwoordelijk voor een eigen sectie in een professionele keuken.",
    bullets: ["Chef de partie vacatures Amsterdam", "Werken in brigade", "Doorgroeimogelijkheden"],
    color: "from-purple-600 to-violet-700",
    href: "/aanmelden",
  },
  {
    title: "Events en catering keuken",
    sub: "Gala · Festivals · Zakelijk",
    img: cateringImg,
    desc: "Keuken vacatures Amsterdam bij events en catering. Koken op unieke locaties voor gala-diners, bedrijfsevents en festivals.",
    bullets: ["Keuken vacatures Amsterdam", "Grootschalige productie", "Dag en avond beschikbaar"],
    color: "from-teal-500 to-cyan-600",
    href: "/aanmelden",
  },
  {
    title: "Banqueting keuken",
    sub: "Hotels · Opbouw · Precisie",
    img: hotelImg,
    desc: "Kok werk in een productiegerichte hotelkeuken. Banqueting bij grote hotelgroepen vraagt om teamwork, snelheid en consistentie.",
    bullets: ["Kok werk bij hotelgroepen", "Groot team, duidelijke structuur", "Goede begeleiding"],
    color: "from-indigo-500 to-blue-700",
    href: "/aanmelden",
  },
];

const reviews = [
  { name: "Rik D.", functie: "Zelfstandig werkend kok", tekst: "Via EXTRA werk ik in keukens op mijn eigen niveau. Geen vaste toewijding, maar wel serieus werk bij serieuze locaties.", rating: 5 },
  { name: "Yusuf A.", functie: "Chef de partie", tekst: "Dagbetaling via Jixbee is echt een verschil. Ik hoef niet tot het eind van de maand te wachten. Dat geeft rust.", rating: 5 },
  { name: "Julia V.", functie: "Events keuken", tekst: "Ik doe catering-events via EXTRA. Elke keer een andere locatie, elke keer een nieuw team. Dat houdt het leuk en uitdagend.", rating: 5 },
];

const faqs = [
  { q: "Moet ik ervaring hebben als chef?", a: "Ja, voor de meeste chef werk functies is aantoonbare keukenervaring vereist. We kijken naar jouw niveau en koppelen je aan passende keukens. Voor ondersteunende keukenrollen is minder ervaring soms voldoende." },
  { q: "Kan ik zelf bepalen waar ik werk?", a: "Je geeft aan wat je voorkeur heeft qua keukenstijl en locatie, en wij zoeken passende keuken vacatures. Je bent niet verplicht een vaste locatie te accepteren." },
  { q: "Hoe werkt de betaling?", a: "Na je dienst word je uitbetaald via Jixbee. Het bedrag staat doorgaans dezelfde dag nog op je rekening. Zo werkt kok werk via EXTRA: transparant en zonder gedoe." },
  { q: "Werk ik steeds op dezelfde locatie?", a: "Dat hoeft niet. Sommige chefs kiezen voor een vaste poule bij een hotel of restaurant, anderen pakken liever gevarieerde keuken vacatures op. Beiden is mogelijk via EXTRA." },
  { q: "Hoe snel kan ik starten?", a: "Na je aanmelding en een korte kennismaking kun je al binnen een week je eerste chef werk diensten oppakken. We proberen de drempel zo laag mogelijk te houden." },
];

export default function ChefVacaturesAmsterdam() {
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
    document.title = "Chef vacatures Amsterdam | Kok werk via EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Op zoek naar chef of kok werk in Amsterdam? Werk in hotels, restaurants en events via EXTRA met flexibele diensten en dagbetaling.");
    setMeta("og:title", "Chef vacatures Amsterdam | Kok werk via EXTRA", true);
    setMeta("og:type", "website", true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══ NAV ══ */}
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
                    {[
                      { label: "Horeca", href: "/horeca-werk", icon: UtensilsCrossed },
                      { label: "Housekeeping", href: "/housekeeping-werk", icon: BedDouble },
                      { label: "Chef", href: "/chef-vacatures-amsterdam", icon: ChefHat },
                      { label: "Front Office", href: "/front-office-vacatures-amsterdam", icon: ConciergeBell },
                    ].map((item) => (
                      <a key={item.label} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${item.href === "/chef-vacatures-amsterdam" ? "bg-purple-50 text-purple-700" : "text-gray-700 hover:bg-purple-50 hover:text-purple-700"}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.href === "/chef-vacatures-amsterdam" ? "bg-indigo-200" : "bg-indigo-100 group-hover:bg-indigo-200"}`}>
                          <item.icon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-sm font-semibold">{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <a href="/extraatje" className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10"}`}>
                <Trophy className="w-5 h-5" /> EXTRAATJE
              </a>
              <a href="/hoe-extra-werkt" className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10"}`}>
                <Clock className="w-5 h-5" /> Werkwijze
              </a>
              <a href="/over-extra/ons-team" className={`flex items-center gap-2 text-[18px] font-bold px-5 py-3 rounded-lg transition-all ${scrolled ? "text-gray-800 hover:text-purple-600 hover:bg-purple-50/50" : "text-white/90 hover:text-white hover:bg-white/10"}`}>
                <Users className="w-5 h-5" /> Ons Team
              </a>
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
                    {[
                      { label: "Horeca", href: "/horeca-werk" },
                      { label: "Housekeeping", href: "/housekeeping-werk" },
                      { label: "Chef", href: "/chef-vacatures-amsterdam" },
                      { label: "Front Office", href: "/front-office-vacatures-amsterdam" },
                    ].map((item) => (
                      <a key={item.label} href={item.href} className={`block py-2.5 text-sm font-medium transition-colors ${item.href === "/chef-vacatures-amsterdam" ? "text-purple-600 font-bold" : "text-gray-600 hover:text-purple-600"}`}>{item.label}</a>
                    ))}
                  </div>
                </div>
              </div>
              <a href="/extraatje" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center"><Trophy className="w-4 h-4 text-purple-600" /></div>
                EXTRAATJE
              </a>
              <a href="/hoe-extra-werkt" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center"><Clock className="w-4 h-4 text-purple-600" /></div>
                Werkwijze
              </a>
              <a href="/over-extra/ons-team" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="w-4 h-4 text-purple-600" /></div>
                Ons Team
              </a>
              <div className="pt-3 border-t border-gray-100">
                <a href="/aanmelden" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-base px-6 py-4 rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all">
                  <ArrowRight className="w-4 h-4" /> Aanmelden
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ══ 1. HERO ══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, #2d0663 0%, #4a0e96 35%, #5b16a8 65%, #6d28d9 100%)" }}>

        {/* X-patroon achtergrond */}
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

        {/* Hero foto — volledig scherm */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={chefHeroImg}
            alt="Chef via EXTRA – kok vacatures Amsterdam toprestaurants"
            className="w-full h-full object-cover"
            loading="eager"
            style={{
              objectPosition: "60% center",
              filter: "contrast(1.10) saturate(1.18) brightness(1.05)",
            }}
          />

          {/* Spotlight radial achter de persoon */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 38% 65% at 65% 44%, rgba(255,248,255,0.13) 0%, rgba(220,180,255,0.04) 55%, transparent 75%)"
          }} />

          {/* Gradient links — tekst leesbaar */}
          <div className="absolute inset-0 hero-text-gradient" />

          {/* Bottom vignette */}
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: "20%",
            background: "linear-gradient(to top, rgba(29,5,73,0.80) 0%, rgba(29,5,73,0.28) 50%, transparent 100%)"
          }} />

          {/* Top vignette — navbar overlay */}
          <div className="absolute top-0 left-0 right-0" style={{
            height: "18%",
            background: "linear-gradient(to bottom, rgba(29,5,73,0.48) 0%, transparent 100%)"
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 sm:pt-32 sm:pb-24 w-full">
          <div className="max-w-xl lg:max-w-[52%] 2xl:max-w-[42%]">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-7 border border-white/20">
              <ChefHat className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">Chef vacatures via EXTRA</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] text-white leading-[1.05] mb-6" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Keukenwerk{" "}
              <span className="relative inline-block">
                <span className="relative z-10">dat bij jou past.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-3.5 bg-gradient-to-r from-cyan-400 to-blue-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-purple-100/90 leading-relaxed font-medium mb-8 max-w-lg">
              Werk als chef of kok bij toprestaurants en hotels in Amsterdam. Via EXTRA kies je zelf je diensten. Flexibel keukenwerk met dagbetaling en professionele werkomgevingen.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a href="/aanmelden" className="group bg-white text-purple-900 font-bold px-7 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Meld je aan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#functies" className="border-2 border-white/30 text-white font-bold px-7 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Bekijk hoe het werkt <ChevronRight className="w-5 h-5" />
              </a>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {[{ emoji: "⚡", label: "Dagbetaling via Jixbee" }, { emoji: "🍳", label: "Topkeukens Amsterdam" }, { emoji: "📅", label: "Flexibele diensten" }].map(({ emoji, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">{emoji} {label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. TRUST STRIP ══ */}
      <section className="py-10 sm:py-14 bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Werk in keukens waar jij trots op kunt zijn</p>
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
      <section id="functies" className="py-16 sm:py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Jouw vakgebied</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Welke chef functies kun je doen via EXTRA?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Via EXTRA werk je als kok of chef in verschillende soorten keukens. Van zelfstandig werkend kok tot chef de partie of event keuken. Wij koppelen je aan keukens die passen bij jouw ervaring en niveau. Bekijk ook{" "}
                <a href="/horeca-werk" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">horeca werk</a>,{" "}
                <a href="/housekeeping-werk" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">housekeeping werk</a> of{" "}
                <a href="/front-office-vacatures-amsterdam" className="text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-2">front office vacatures</a>.
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
              {["Commis de cuisine", "Patissier", "Sous chef", "Productie keuken"].map((fn) => (
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
                Waarom EXTRA?
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waarom chef werk via EXTRA?
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                EXTRA biedt chefs en koks de vrijheid om te werken op hun eigen niveau. Flexibele diensten, dagbetaling en werken in professionele keukens zonder langdurige verplichtingen. Ideaal voor iedereen die chef vacatures Amsterdam zoekt op zijn of haar niveau.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {[
              {
                icon: Zap, badge: "Financiële vrijheid", title: "Dagbetaling via Jixbee",
                desc: "Na je dienst staat je geld dezelfde dag nog op je rekening. Direct na je shift, niet aan het einde van de maand.",
                bg: "from-yellow-50 to-orange-50", border: "border-yellow-200", iconBg: "bg-yellow-100", iconColor: "text-yellow-600", tag: "⚡ Dagbetaling",
              },
              {
                icon: CalendarCheck, badge: "Eigen planning", title: "Flexibele diensten",
                desc: "Kies de diensten die bij je passen. Werk fulltime, parttime of enkele shifts per week — jij bepaalt.",
                bg: "from-violet-50 to-purple-50", border: "border-violet-200", iconBg: "bg-violet-100", iconColor: "text-violet-600", tag: "📅 Volledig flexibel",
              },
              {
                icon: Flame, badge: "Kwaliteitskeukens", title: "Werken in topkeukens",
                desc: "Kok vacatures bij vijfsterren hotels, professionele catering en restaurants op hoog niveau in Amsterdam.",
                bg: "from-orange-50 to-red-50", border: "border-orange-200", iconBg: "bg-orange-100", iconColor: "text-orange-600", tag: "🍳 Toplocaties",
              },
              {
                icon: Award, badge: "Groei", title: "Werken op jouw niveau",
                desc: "EXTRA koppelt je aan keukens die passen bij jouw ervaring. Van commis tot zelfstandig werkend kok.",
                bg: "from-blue-50 to-indigo-50", border: "border-blue-200", iconBg: "bg-blue-100", iconColor: "text-blue-600", tag: "🏆 Niveau-gerichte match",
              },
              {
                icon: Gift, badge: "Exclusief beloningssysteem", title: "EXTRAATJE beloningen",
                desc: "Spaar punten voor elke dienst en wissel ze in voor beloningen. Consistent goed werk wordt beloond.",
                bg: "from-emerald-50 to-teal-50", border: "border-emerald-200", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", tag: "🎁 Punten sparen",
              },
              {
                icon: Handshake, badge: "Persoonlijke aanpak", title: "Persoonlijk contact",
                desc: "Onze planners werken met je samen. Ze kennen jouw voorkeur en vinden diensten die echt bij je passen.",
                bg: "from-teal-50 to-cyan-50", border: "border-teal-200", iconBg: "bg-teal-100", iconColor: "text-teal-600", tag: "💬 Direct bereikbaar",
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

      {/* ══ 5. KEUKENS ══ */}
      <section className="py-16 sm:py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Toplocaties</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Keukens waar jij trots op kunt zijn
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Via EXTRA werk je in professionele keukens waar kwaliteit centraal staat. Van hotelrestaurants tot eventlocaties en cateringbedrijven in Amsterdam.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 mb-10">
            {[
              { icon: Hotel, title: "Hotelkeukens", desc: "Vijfsterren hotelrestaurants en room dining in Amsterdam. Professionele brigades en hoge standaarden.", iconBg: "bg-indigo-100", iconColor: "text-indigo-600", bg: "from-indigo-50 to-blue-50", border: "border-indigo-200" },
              { icon: UtensilsCrossed, title: "Restaurants", desc: "Van bistro's tot fine dining. Keuken vacatures in restaurants waar vak en kwaliteit centraal staan.", iconBg: "bg-orange-100", iconColor: "text-orange-600", bg: "from-orange-50 to-amber-50", border: "border-orange-200" },
              { icon: Utensils, title: "Events en catering", desc: "Gala-diners, zakelijke events en festivals. Koken op bijzondere locaties voor grote aantallen gasten.", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", bg: "from-emerald-50 to-teal-50", border: "border-emerald-200" },
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Partnerlocaties</p>
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
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">In 4 stappen</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Zo begin je als chef via EXTRA
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3 text-base sm:text-lg">
                Van aanmelding tot je eerste keuken. Snel, simpel en transparant.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { step: "01", icon: MessageCircle, title: "Schrijf je in", desc: "Meld je aan via het formulier en upload je cv. Binnen enkele minuten geregeld.", color: "from-purple-500 to-violet-600" },
              { step: "02", icon: Users, title: "Kennismaking", desc: "We bespreken jouw ervaring, voorkeur en beschikbaarheid. Dan kijken we welke keukens bij je passen.", color: "from-orange-500 to-red-600" },
              { step: "03", icon: CalendarCheck, title: "Kies je diensten", desc: "Je kiest zelf de diensten die bij jouw agenda passen. Flexibel chef werk op jouw niveau.", color: "from-teal-500 to-cyan-600" },
              { step: "04", icon: Zap, title: "Werk en word betaald", desc: "Werk je shift en ontvang dezelfde dag je betaling via Jixbee.", color: "from-yellow-500 to-amber-500" },
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

      {/* ══ 7. DAGBETALING ══ */}
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
                  Na je dienst wordt je uitbetaald via Jixbee. Geen wachten tot het einde van de maand. Je ziet direct wat je hebt verdiend en ontvangt je geld vaak dezelfde dag.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "Uitbetaling via Jixbee, zelfde dag na je shift",
                    "Real-time inzicht in je gewerkte uren en bedrag",
                    "Officieel contract en payroll conform wetgeving",
                    "Geen verrassingen op je loonstrook",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <a href="/hoe-werkt-dagbetaling" className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-900 transition-colors">
                  Hoe werkt dagbetaling? <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              <div className="flex justify-center">
                <div className="relative flex gap-5 items-end h-[320px] sm:h-[380px]">
                  <div style={{ transform: "rotate(-5deg)", animation: "float-cw 5s ease-in-out infinite" }}>
                    <img src={jixbeeUren} alt="Jixbee – gewerkte uren overzicht" className="w-[145px] sm:w-[175px] drop-shadow-2xl rounded-[2rem]" />
                  </div>
                  <div className="relative z-10 -mb-4" style={{ animation: "float-cw 4s ease-in-out infinite" }}>
                    <img src={jixbeePayout} alt="Jixbee – payout succesvol" className="w-[155px] sm:w-[190px] drop-shadow-2xl rounded-[2rem]" />
                    <div className="absolute -top-3 -right-10 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 border border-orange-100 whitespace-nowrap">
                      💸 €820,- uitbetaald
                    </div>
                    <div className="absolute -bottom-2 -left-8 bg-white rounded-xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 border border-green-100 whitespace-nowrap">
                      ✅ Shift goedgekeurd
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
        <style>{`
          @keyframes float-cw {
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
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Ervaringen</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat zeggen chefs en koks?
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-black">
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
              Begin vandaag met chef werk via EXTRA
            </p>
            <p className="text-purple-200 text-sm mt-0.5">Wil je werken als chef of kok in Amsterdam? Meld je aan bij EXTRA en start snel met diensten in professionele keukens.</p>
          </div>
          <a href="/aanmelden" className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-purple-900 font-black px-6 py-3 rounded-full text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Start je aanmelding <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* ══ 10. FAQ ══ */}
      <FAQSection
        heading="Veelgestelde vragen over chef werk via EXTRA"
        faqs={faqs}
      />

      {/* ══ 11. LINK CLOUD ══ */}
      <section className="py-12 bg-white border-t border-purple-100/60">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 text-center">Gerelateerde pagina's</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Chef vacatures Amsterdam", href: "/chef-vacatures-amsterdam" },
              { label: "Kok vacatures", href: "/chef-vacatures-amsterdam" },
              { label: "Horeca werk", href: "/horeca-werk" },
              { label: "Housekeeping werk", href: "/housekeeping-werk" },
              { label: "Front Office vacatures", href: "/front-office-vacatures-amsterdam" },
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