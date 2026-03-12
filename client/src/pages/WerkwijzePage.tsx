import { useEffect } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import {
  Phone, Users, ClipboardList, TrendingUp, ChevronRight,
  Check, Shield, Star, ArrowRight, UserCheck, Briefcase,
  Gift, MessageCircle, BarChart2, Clock, Zap
} from "lucide-react";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoMercure from "../assets/pitch/logo-mercure.png";
import logoPulitzer from "../assets/pitch/logo-pulitzer.png";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoWestweelde from "../assets/pitch/logo-westweelde-clean.png";
import sollicitatieformulier from "@assets/Sollicitatieformulier_1772893764120.png";
import dashboardKandidaten from "@assets/Dashboard_kandidaten_1772893764120.png";
import scoreSnippet from "@assets/Scherm\u00adafbeelding_2026-03-12_om_11.31.00_1773311517193.png";
import poulesMatches from "@assets/Scherm\u00adafbeelding_2026-03-12_om_10.22.20_1773311761908.png";
import poulesButton from "@assets/Scherm\u00adafbeelding_2026-03-12_om_11.36.42_1773311845901.png";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Werkwijze EXTRA | Horeca Uitzendbureau Amsterdam voor hotels en evenementen",
  "description": "Ontdek hoe EXTRA werkt. Horecauitzendbureau in Amsterdam voor hotels en evenementen. Flexibel horecapersoneel in loondienst met slimme selectie en vaste favorietenpoules.",
  "url": "https://doehetextra.nl/horeca-uitzendbureau-amsterdam-werkwijze",
};

function IpadMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 580 }}>
      {/* iPad landscape frame */}
      <div
        className="relative rounded-[2rem] shadow-2xl shadow-purple-500/20"
        style={{
          background: "linear-gradient(145deg, #2e2e32, #1c1c20)",
          padding: "14px 20px 14px 20px",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        {/* Left bar: camera (landscape = camera on the left side) */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          <div className="w-2 h-0.5 rounded-full bg-gray-700" />
        </div>
        {/* Screen — landscape 4:3 */}
        <div className="rounded-[1.2rem] overflow-hidden bg-white ml-2" style={{ aspectRatio: "4/3" }}>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 58%" }}
            loading="lazy"
            decoding="async"
          />
        </div>
        {/* Right home bar */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-1 h-10 rounded-full bg-gray-600" />
        </div>
        {/* Top buttons (volume / power in landscape = top edge) */}
        <div
          className="absolute top-[-4px] left-[30%] h-1 w-8 rounded-t-sm"
          style={{ background: "linear-gradient(180deg, #3a3a3e, #222226)" }}
        />
        <div
          className="absolute top-[-4px] left-[42%] h-1 w-8 rounded-t-sm"
          style={{ background: "linear-gradient(180deg, #3a3a3e, #222226)" }}
        />
        <div
          className="absolute top-[-4px] right-[20%] h-1 w-6 rounded-t-sm"
          style={{ background: "linear-gradient(180deg, #3a3a3e, #222226)" }}
        />
      </div>
      {/* Reflection glow */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full blur-xl bg-purple-400/20" />
    </div>
  );
}

function BrowserMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 600 }}>
      <div className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/15 border border-gray-200">
        {/* Browser chrome */}
        <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Shield className="w-3 h-3 text-green-500 shrink-0" />
            <span className="text-xs text-gray-500 font-medium truncate">app.doehetextra.nl/dashboard</span>
          </div>
        </div>
        {/* Screenshot */}
        <div className="overflow-hidden">
          <img
            src={src}
            alt={alt}
            className="w-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}

const werkgeverSteps = [
  { icon: Phone, step: "1", title: "Neem contact op", desc: "Bel ons, stuur een WhatsApp of vul het aanvraagformulier in. Binnen 1 uur nemen wij contact op.", cta: { label: "Personeel aanvragen", href: "/personeelsaanvraag" }, color: "from-purple-500 to-purple-700" },
  { icon: Users, step: "2", title: "Kennismaking op locatie", desc: "We bespreken jullie personeelsvraag, piekmomenten en gewenste vaardigheden.", color: "from-indigo-500 to-purple-600" },
  { icon: ClipboardList, step: "3", title: "Selectie van personeel", desc: "Wij selecteren medewerkers op basis van ervaring, houding en communicatieve vaardigheden.", color: "from-blue-500 to-indigo-600" },
  { icon: TrendingUp, step: "4", title: "Planning en inzet", desc: "Via het klantportaal of accountmanager vraag je eenvoudig personeel aan.", color: "from-emerald-500 to-teal-600" },
];

const medewerkerSteps = [
  { icon: UserCheck, step: "1", title: "Solliciteer bij EXTRA", desc: "Meld je aan via het sollicitatieformulier.", color: "from-purple-500 to-purple-700" },
  { icon: MessageCircle, step: "2", title: "Kennismaking", desc: "We bespreken je ervaring en voorkeuren.", color: "from-violet-500 to-purple-600" },
  { icon: Briefcase, step: "3", title: "Pak diensten op", desc: "Werk bij hotels, evenementen en horeca locaties.", color: "from-indigo-500 to-purple-600" },
  { icon: Gift, step: "4", title: "Verdien EXTRAATjes", desc: "Na iedere dienst word je beoordeeld en kun je punten verdienen.", color: "from-emerald-500 to-teal-600" },
];


export default function WerkwijzePage() {
  useEffect(() => {
    document.title = "Werkwijze EXTRA | Horeca Uitzendbureau Amsterdam voor hotels en evenementen";
    window.scrollTo(0, 0);
    return () => { document.title = "EXTRA"; };
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <PublicNav />

      <main>
        {/* ① HERO — dark purple, same as LandingPage */}
        <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/15 via-transparent to-fuchsia-600/10 pointer-events-none" />
          <XPatternBg count={3} opacity={0.09} color="rgba(255,255,255,0.9)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <RevealSection>
                <nav className="flex mb-8 text-sm text-purple-300/60" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                    <li><ChevronRight className="w-4 h-4" /></li>
                    <li className="text-white font-medium">Werkwijze</li>
                  </ol>
                </nav>
                <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                  <Zap className="w-4 h-4" /> Horeca Uitzendbureau Amsterdam
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Hoe{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10">EXTRA</span>
                    <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
                  </span>{" "}
                  werkt
                </h1>
                <p className="text-lg sm:text-xl text-purple-100/70 mb-10 leading-relaxed max-w-lg">
                  Het horeca uitzendbureau in Amsterdam voor hotels, evenementen en hospitality. Van eerste aanvraag tot een vaste favorietenpoule.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2.5 bg-white text-purple-900 font-bold text-base sm:text-lg px-7 py-4 rounded-full transition-all duration-300 shadow-xl shadow-white/10 hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5">
                    Personeel aanvragen <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/aanmelden" className="inline-flex items-center gap-2.5 border-2 border-white/25 text-white font-bold text-base sm:text-lg px-7 py-4 rounded-full hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                    Solliciteren
                  </Link>
                </div>
              </RevealSection>
              <RevealSection delay={150}>
                <IpadMockup
                  src={sollicitatieformulier}
                  alt="Sollicitatieformulier horeca uitzendbureau EXTRA Amsterdam"
                />
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ② TRUST STRIP */}
        <section className="bg-white border-b border-gray-100 py-5">
          <div className="max-w-5xl mx-auto px-5 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
              {[
                { icon: Shield, text: "NEN 4400-1 gecertificeerd" },
                { icon: Users, text: "Altijd in loondienst" },
                { icon: Clock, text: "Reactie binnen 1 uur" },
                { icon: Star, text: "Vaste favorietenpoule" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Icon className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ③ INTRO — warm off-white, same as LandingPage */}
        <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
          <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-5 py-2 rounded-full">
                <BarChart2 className="w-4 h-4" /> Onze aanpak
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Zo werkt samenwerken met EXTRA
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                EXTRA is het horeca uitzendbureau in Amsterdam voor hotels, evenementen en hospitality. Wij combineren persoonlijke selectie met slimme technologie, zodat wij precies weten welk horecapersoneel bij jouw organisatie past.
              </p>
            </RevealSection>
          </div>
        </section>

        {/* ④ WERKWIJZE WERKGEVERS — white */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-5 py-2 rounded-full">
                  <Briefcase className="w-4 h-4" /> Voor werkgevers
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Horecapersoneel inhuren in 4 stappen
                </h2>
                <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
                  Flexibel horecapersoneel in Amsterdam, snel en persoonlijk geregeld.
                </p>
              </div>
            </RevealSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {werkgeverSteps.map((item, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="relative group h-full">
                    {i < werkgeverSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-10 left-[calc(100%+0.625rem)] w-full h-px bg-gradient-to-r from-purple-200 to-transparent z-0" />
                    )}
                    <div className="bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 shadow-sm p-6 sm:p-7 h-full flex flex-col">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shrink-0`}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Stap {item.step}</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed flex-1">{item.desc}</p>
                      {item.cta && (
                        <Link href={item.cta.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors group/cta">
                          {item.cta.label} <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ⑤ SELECTIEPROCES — lila gradient, same as LandingPage "Waarom EXTRA" */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
          <XPatternBg count={4} opacity={0.08} color="rgba(139,92,246,1)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
              <RevealSection>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/70 px-5 py-2 rounded-full">
                  <ClipboardList className="w-4 h-4" /> Selectieproces
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Persoonlijke selectie van horecapersoneel
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  Iedere medewerker bij EXTRA wordt persoonlijk beoordeeld via een digitaal intakeformulier per functie. Zo weten wij precies wie klaar is voor jouw locatie.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { n: 1, emoji: "⭐", label: "Topper!" },
                    { n: 2, emoji: "🏆", label: "Veel ervaring" },
                    { n: 3, emoji: "💁", label: "Verzorgd" },
                    { n: 4, emoji: "😄", label: "Enthousiast" },
                    { n: 5, emoji: "🇳🇱", label: "NL" },
                    { n: 7, emoji: "🍽️", label: "3 borden lopen" },
                  ].map(({ n, emoji, label }) => (
                    <div key={n} className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-white font-semibold text-sm shadow-md" style={{ background: "linear-gradient(135deg, #4a9fdf 0%, #3b8ecf 100%)" }}>
                      <span className="opacity-70 font-bold text-xs">{n}.</span>
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </RevealSection>
              <RevealSection delay={150}>
                <IpadMockup
                  src={sollicitatieformulier}
                  alt="Digitale horeca sollicitatie beoordeling EXTRA Amsterdam"
                />
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ⑥ KANDIDATEN DASHBOARD — warm off-white */}
        <section className="relative py-20 sm:py-28 pb-28 sm:pb-36 overflow-x-hidden" style={{ backgroundColor: "#faf8f5" }}>
          <XPatternBg count={2} opacity={0.05} color="rgba(139,92,246,1)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
              <RevealSection className="order-2 lg:order-1">
                <div className="relative">
                  <BrowserMockup
                    src={dashboardKandidaten}
                    alt="Dashboard met beoordelingen horecapersoneel EXTRA Amsterdam"
                  />
                  {/* Floating score snippet card — speels overlappend */}
                  <div className="absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-6 w-[65%] rounded-2xl overflow-hidden shadow-2xl border border-white/80 ring-1 ring-purple-100/60 rotate-1 hover:rotate-0 transition-transform duration-300">
                    <img
                      src={scoreSnippet}
                      alt="Scores kandidaat: softskills, bar, bediening en diner"
                      className="w-full h-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </RevealSection>
              <RevealSection className="order-1 lg:order-2">
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-100/60 px-5 py-2 rounded-full">
                  <BarChart2 className="w-4 h-4" /> Data & technologie
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Slimme selectie met data
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  Alle sollicitaties worden opgeslagen in ons systeem. Per kandidaat zien wij scores op softskills, bediening, bar en diner, zodat wij precies de juiste match kunnen maken.
                </p>
                <div className="space-y-4">
                  {[
                    "Waar iemand ervaring heeft opgedaan",
                    "Hoe iemand beoordeeld is door opdrachtgevers",
                    "Welke locatie en functie het beste past",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-600 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ⑦ FAVORIETENPOULE — white */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
              <RevealSection>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-100/60 px-5 py-2 rounded-full">
                  <Star className="w-4 h-4" /> Favorietenpoule
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Bouw een vaste favorietenpoule op
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  Na iedere dienst kan de opdrachtgever medewerkers beoordelen. Bevalt iemand goed? Dan wordt deze toegevoegd aan jouw favorietenpoule, een vaste pool van mensen die jouw organisatie al kennen.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {["Tijd & punctualiteit", "Vaardigheden", "Houding", "Verzorging"].map((c, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-700">{c}</span>
                    </div>
                  ))}
                </div>
              </RevealSection>
              <RevealSection delay={100}>
                <div className="relative pb-12 pr-4">
                  {/* Main browser-style card with matches table */}
                  <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/80 border border-gray-100 bg-white">
                    {/* Browser chrome bar */}
                    <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      <div className="ml-3 flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200 max-w-[180px]">
                        app.doehetextra.nl
                      </div>
                    </div>
                    <img
                      src={poulesMatches}
                      alt="Medewerker matches met favorietenpoule in EXTRA dashboard"
                      className="w-full h-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  {/* Floating "Poules uitnodigen" button snippet */}
                  <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:right-0 w-[55%] rounded-xl overflow-hidden shadow-xl border border-gray-100 -rotate-1 hover:rotate-0 transition-transform duration-300 bg-white">
                    <img
                      src={poulesButton}
                      alt="Poules uitnodigen knop"
                      className="w-full h-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ⑧ WETGEVING — lila gradient */}
        <section className="relative py-20 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
          <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-white/70 px-5 py-2 rounded-full">
                  <Shield className="w-4 h-4" /> Wetgeving & certificering
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Volledig volgens de wetgeving
                </h2>
              </div>
            </RevealSection>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: Shield, title: "NEN 4400-1 gecertificeerd", desc: "Wij voldoen aan alle wet- en regelgeving rondom uitzenden in de horeca.", link: { href: "/nen-4400-1-certificering", label: "Meer over certificering" } },
                { icon: Users, title: "Altijd in loondienst", desc: "Geen zzp-constructies. Duidelijke afspraken voor opdrachtgever én medewerker." },
                { icon: ClipboardList, title: "TWV-procedures", desc: "Voor medewerkers die een TWV nodig hebben hanteren wij aparte procedures." },
              ].map((tp, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="bg-white rounded-2xl p-7 shadow-sm border border-white hover:shadow-md transition-all h-full flex flex-col">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-5">
                      <tp.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{tp.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed flex-1">{tp.desc}</p>
                    {tp.link && (
                      <Link href={tp.link.href} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors">
                        {tp.link.label} <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ⑨ WERKWIJZE MEDEWERKERS — warm off-white */}
        <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
          <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-5 py-2 rounded-full">
                  <UserCheck className="w-4 h-4" /> Voor medewerkers
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Horeca bijbaan Amsterdam?<br className="hidden sm:block" /> Zo ga je van start
                </h2>
                <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
                  Werken in de horeca in Amsterdam via EXTRA, in loondienst, met beloningen.
                </p>
              </div>
            </RevealSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {medewerkerSteps.map((item, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="group h-full">
                    <div className="bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 shadow-sm p-6 sm:p-7 h-full flex flex-col">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shrink-0`}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Stap {item.step}</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed flex-1">{item.desc}</p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
            <RevealSection delay={200}>
              <div className="flex justify-center mt-10">
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base sm:text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Solliciteer bij EXTRA <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ⑩ LOGO MARQUEE — identical to LandingPage */}
        <section className="py-10 sm:py-14 bg-white border-t border-gray-100 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <p className="text-center text-xs sm:text-base font-bold text-gray-400 uppercase tracking-widest mb-6 sm:mb-10">Vertrouwd door teams in de horeca</p>
            </RevealSection>
            <div className="relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
              <div className="flex animate-marquee-werkwijze group-hover:[animation-play-state:paused]">
                {[...Array(2)].map((_, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                    {[
                      { src: logoAmrath, alt: "Amrâth Hotels Amsterdam" },
                      { src: logoMercure, alt: "Mercure Hotels" },
                      { src: logoPulitzer, alt: "Pulitzer Amsterdam" },
                      { src: logoFcUtrecht, alt: "FC Utrecht" },
                      { src: logoFunda, alt: "Funda" },
                      { src: logoHartMuseum, alt: "H'art Museum Amsterdam" },
                      { src: logoHetePeper, alt: "Hete Peper" },
                      { src: logoHilton, alt: "Hilton Amsterdam" },
                      { src: logoMarriott, alt: "Marriott Hotels Amsterdam" },
                      { src: logoSelectCatering, alt: "Select Catering" },
                      { src: logoAppel, alt: "Appèl Catering" },
                      { src: logoWestweelde, alt: "Westweelde" },
                    ].map((logo) => (
                      <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
                        <img src={logo.src} alt={logo.alt} width="200" height="200" className="h-16 sm:h-20 lg:h-24 w-auto object-contain" loading="lazy" decoding="async" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{`
            @keyframes marquee-werkwijze {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-werkwijze {
              animation: marquee-werkwijze 40s linear infinite;
            }
          `}</style>
        </section>

        {/* ⑪ CTA — dark purple gradient matching LandingPage/OnsTeam CTA */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950" />
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,0.9)" />
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                <Users className="w-4 h-4" /> Klaar om te starten?
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Personeel{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">nodig?</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-purple-200 mb-10 leading-relaxed max-w-xl mx-auto">
                Vraag vandaag nog flexibel horecapersoneel aan voor hotels en evenementen in Amsterdam.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-5">
                <Link href="/personeelsaanvraag" className="group inline-flex items-center justify-center gap-2.5 bg-white text-purple-900 font-bold text-base px-8 py-4 rounded-full transition-all hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5">
                  Personeel aanvragen <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/aanmelden" className="inline-flex items-center justify-center gap-2.5 border-2 border-white/25 text-white font-bold text-base px-8 py-4 rounded-full hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                  Solliciteren
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
