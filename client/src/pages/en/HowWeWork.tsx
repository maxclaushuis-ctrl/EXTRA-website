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
import logoMercure from "../../assets/pitch/logo-mercure.webp";
import logoPulitzer from "@assets/Logo_Pulitzer_1773389329669.webp";
import logoFcUtrecht from "@assets/Logo_FcUtrecht_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoWestweelde from "../../assets/pitch/logo-westweelde-clean.webp";
import sollicitatieformulier from "@assets/Sollicitatieformulier_1772893764120.webp";
import dashboardKandidaten from "@assets/Dashboard_kandidaten_1772893764120.webp";
import scoreSnippet from "@assets/Scherm\u00adafbeelding_2026-03-12_om_11.31.00_1773311517193.png";
import poulesMatches from "@assets/Scherm\u00adafbeelding_2026-03-12_om_10.22.20_1773311761908.png";
import poulesButton from "@assets/Scherm\u00adafbeelding_2026-03-12_om_11.36.42_1773311845901.png";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "How We Work | Hospitality Staffing Process | EXTRA",
  "description": "Discover how EXTRA works. Hospitality staffing agency in Amsterdam for hotels and events. Flexible hospitality staff with smart selection and fixed favorite pools.",
  "url": "https://doehetextra.nl/en/how-we-work",
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
  { icon: Phone, step: "1", title: "Get in touch", desc: "Call us, send a WhatsApp message, or fill in the request form. We will contact you within 1 hour.", cta: { label: "Request staff", href: "/en/hospitality-staff-amsterdam" }, color: "from-purple-500 to-purple-700" },
  { icon: Users, step: "2", title: "On-site introduction", desc: "We discuss your staffing needs, peak moments, and desired skills.", color: "from-indigo-500 to-purple-600" },
  { icon: ClipboardList, step: "3", title: "Staff selection", desc: "We select employees based on experience, attitude, and communication skills.", color: "from-blue-500 to-indigo-600" },
  { icon: TrendingUp, step: "4", title: "Planning and deployment", desc: "Easily request staff through the client portal or your account manager.", color: "from-emerald-500 to-teal-600" },
];

const medewerkerSteps = [
  { icon: UserCheck, step: "1", title: "Apply at EXTRA", desc: "Apply through our online application form.", color: "from-purple-500 to-purple-700" },
  { icon: MessageCircle, step: "2", title: "Introduction", desc: "We discuss your experience and preferences.", color: "from-violet-500 to-purple-600" },
  { icon: Briefcase, step: "3", title: "Pick up shifts", desc: "Work at hotels, events, and hospitality venues.", color: "from-indigo-500 to-purple-600" },
  { icon: Gift, step: "4", title: "Earn EXTRAATjes", desc: "You receive a rating after every shift and can earn points.", color: "from-emerald-500 to-teal-600" },
];


export default function HowWeWork() {
  useEffect(() => {
    document.title = "How We Work | Hospitality Staffing Process | EXTRA";
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
                    <li><Link href="/en/hospitality-staff-amsterdam" className="hover:text-white transition-colors">Home</Link></li>
                    <li><ChevronRight className="w-4 h-4" /></li>
                    <li className="text-white font-medium">How We Work</li>
                  </ol>
                </nav>
                <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
                  <Zap className="w-4 h-4" /> Hospitality Staffing Amsterdam
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  How{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10">EXTRA</span>
                    <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
                  </span>{" "}
                  works
                </h1>
                <p className="text-lg sm:text-xl text-purple-100/70 mb-10 leading-relaxed max-w-lg">
                  The hospitality staffing agency in Amsterdam for hotels, events, and hospitality. From your first request to a dedicated pool of favourites.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/en/hospitality-staff-amsterdam" className="group inline-flex items-center gap-2.5 bg-white text-purple-900 font-bold text-base sm:text-lg px-7 py-4 rounded-full transition-all duration-300 shadow-xl shadow-white/10 hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5">
                    Request staff <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/aanmelden?lang=en" className="inline-flex items-center gap-2.5 border-2 border-white/25 text-white font-bold text-base sm:text-lg px-7 py-4 rounded-full hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                    Apply now
                  </Link>
                </div>
              </RevealSection>
              <RevealSection delay={150}>
                <IpadMockup
                  src={sollicitatieformulier}
                  alt="Application form hospitality staffing agency EXTRA Amsterdam"
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
                { icon: Shield, text: "NEN 4400-1 certified" },
                { icon: Users, text: "Always employed" },
                { icon: Clock, text: "Response within 1 hour" },
                { icon: Star, text: "A dedicated pool of favourites" },
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
                <BarChart2 className="w-4 h-4" /> Our approach
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What working with EXTRA looks like
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                EXTRA is the hospitality staffing agency in Amsterdam for hotels, events, and hospitality. We combine personal selection with smart technology, so we know exactly which staff members fit your organization.
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
                  <Briefcase className="w-4 h-4" /> For employers
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Hire hospitality staff in 4 steps
                </h2>
                <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
                  Flexible hospitality staff in Amsterdam — fast, personal, and properly arranged.
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
                      <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Step {item.step}</div>
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
                  <ClipboardList className="w-4 h-4" /> Selection process
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Personal selection of hospitality staff
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  Every employee at EXTRA is personally assessed via a digital intake form per role. This way, we know exactly who is ready for your location.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { n: 1, emoji: "⭐", label: "Top performer!" },
                    { n: 2, emoji: "🏆", label: "Highly experienced" },
                    { n: 3, emoji: "💁", label: "Polished" },
                    { n: 4, emoji: "😄", label: "Enthusiastic" },
                    { n: 5, emoji: "🇳🇱", label: "Dutch speaker" },
                    { n: 7, emoji: "🍽️", label: "3-plate carrying" },
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
                  alt="Digital hospitality application assessment EXTRA Amsterdam"
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
                    alt="Dashboard with hospitality staff ratings EXTRA Amsterdam"
                  />
                  {/* Floating score snippet card — speels overlappend */}
                  <div className="absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-6 w-[65%] rounded-2xl overflow-hidden shadow-2xl border border-white/80 ring-1 ring-purple-100/60 rotate-1 hover:rotate-0 transition-transform duration-300">
                    <img
                      src={scoreSnippet}
                      alt="Candidate scores: soft skills, bar, service and dining"
                      className="w-full h-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </RevealSection>
              <RevealSection className="order-1 lg:order-2">
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-100/60 px-5 py-2 rounded-full">
                  <BarChart2 className="w-4 h-4" /> Data & technology
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Smart selection with data
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  All applications are stored in our system. For each candidate, we see scores for soft skills, service, bar, and dining, allowing us to make the perfect match.
                </p>
                <div className="space-y-4">
                  {[
                    "Where someone has gained experience",
                    "How someone was rated by clients",
                    "Which location and role fits best",
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
                  <Star className="w-4 h-4" /> Favorite pool
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Build a dedicated pool of favourites
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  After every shift, the client can rate employees. If someone performs well, they are added to your favorite pool—a fixed pool of people who already know your organization.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {["Time & punctuality", "Skills", "Attitude", "Grooming"].map((c, i) => (
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
                      alt="Employee matches with favorite pool in EXTRA dashboard"
                      className="w-full h-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  {/* Overlapping small snippet */}
                  <div className="absolute bottom-0 right-0 w-[45%] sm:w-[40%] translate-y-4 rounded-xl overflow-hidden shadow-2xl border border-white/90 ring-1 ring-purple-100/50 hover:scale-105 transition-transform duration-300">
                    <img
                      src={poulesButton}
                      alt="Add to favourites button"
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

        {/* ⑧ WERKWIJZE MEDEWERKERS — warm off-white */}
        <section className="py-20 sm:py-28" style={{ backgroundColor: "#faf8f5" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-14">
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-5 py-2 rounded-full">
                  <UserCheck className="w-4 h-4" /> For employees
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Working at EXTRA in 4 steps
                </h2>
                <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
                  Hospitality work in Amsterdam at the most beautiful locations.
                </p>
              </div>
            </RevealSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {medewerkerSteps.map((item, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 shadow-sm p-6 sm:p-7 h-full flex flex-col">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg shrink-0`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Step {item.step}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/aanmelden?lang=en" className="inline-flex items-center gap-2.5 bg-purple-600 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-purple-700 hover:-translate-y-0.5 transition-all shadow-xl shadow-purple-200">
                Apply directly <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ⑨ LOGO CLOUD */}
        <section className="py-20 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-center text-gray-400 font-bold text-xs uppercase tracking-widest mb-12">
              Our partners in Amsterdam
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <img src={logoMarriott} alt="Marriott" className="h-8 mx-auto object-contain" />
              <img src={logoHilton} alt="Hilton" className="h-8 mx-auto object-contain" />
              <img src={logoPulitzer} alt="Pulitzer" className="h-10 mx-auto object-contain" />
              <img src={logoMercure} alt="Mercure" className="h-8 mx-auto object-contain" />
              <img src={logoHartMuseum} alt="H'Art Museum" className="h-10 mx-auto object-contain" />
              <img src={logoWestweelde} alt="Westweelde" className="h-10 mx-auto object-contain" />
            </div>
          </div>
        </section>

        {/* ⑩ CTA — dark purple */}
        <section className="py-24 bg-gradient-to-br from-[#1a0a2e] to-[#12071f] relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-600/5 pointer-events-none" />
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Ready to work with EXTRA?
            </h2>
            <p className="text-xl text-purple-100/70 mb-10 max-w-2xl mx-auto">
              Experience the smarter way of staffing. Whether you need staff or are looking for the best hospitality jobs in Amsterdam.
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              <Link href="/en/hospitality-staff-amsterdam" className="bg-white text-purple-900 font-bold text-lg px-10 py-5 rounded-full hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all">
                Request staff
              </Link>
              <Link href="/aanmelden?lang=en" className="bg-transparent border-2 border-white/30 text-white font-bold text-lg px-10 py-5 rounded-full hover:bg-white/10 hover:-translate-y-1 transition-all">
                Apply now
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
