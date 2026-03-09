import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import {
  Gift, Star, Trophy, Zap, Clock, ThumbsUp, Shield, TrendingUp,
  ArrowRight, CheckCircle2, Users, Award, Flame,
  ChevronRight, Sparkles, Check
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import imgDashboard from "@assets/IMG_8971_1772395165096.webp";
import imgBeloningen from "@assets/IMG_8973_1772396250204.webp";
import imgKortingen from "@assets/IMG_8974_1772396250204.webp";
import imgChallenges from "@assets/IMG_8975_1772396250204.webp";
import imgRanglijst from "@assets/IMG_8977_1772396250204.webp";

function PhoneMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-[180px] sm:w-[220px] mx-auto">
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-900/30 border-[6px] border-gray-800 bg-gray-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[20px] bg-gray-900 rounded-b-xl z-20" />
        <img src={src} alt={alt} className="w-full relative z-10" loading="lazy" decoding="async" />
      </div>
      <div className="absolute -inset-6 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-[3.5rem] blur-3xl -z-10" />
    </div>
  );
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function XPatternBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[
        { left: "5%", top: "10%", w: 180, rot: 15, op: 0.07 },
        { left: "78%", top: "15%", w: 140, rot: -8, op: 0.05 },
        { left: "48%", top: "72%", w: 160, rot: 25, op: 0.06 },
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
        { left: "5%", top: "10%", w: 200, rot: 15, op: 0.1 },
        { left: "80%", top: "55%", w: 240, rot: -20, op: 0.08 },
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

const microPrestaties = [
  { icon: Clock, label: "Op tijd komen", desc: "Punten voor punctualiteit bij elke dienst", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50", accent: "text-blue-600" },
  { icon: Star, label: "Hoge beoordeling", desc: "Extra punten bij een topbeoordeling van opdrachtgevers", color: "from-yellow-500 to-orange-500", bg: "bg-yellow-50", accent: "text-yellow-600" },
  { icon: Sparkles, label: "Uitstraling & houding", desc: "Beloond voor professionele presentatie", color: "from-purple-500 to-pink-500", bg: "bg-purple-50", accent: "text-purple-600" },
  { icon: Zap, label: "Extra shifts", desc: "Meer shifts = meer punten, zo simpel is het", color: "from-green-500 to-emerald-500", bg: "bg-green-50", accent: "text-green-600" },
  { icon: Flame, label: "Last-minute beschikbaar", desc: "Bijspringen op korte termijn? Dubbele waardering", color: "from-red-500 to-orange-500", bg: "bg-red-50", accent: "text-red-600" },
  { icon: Shield, label: "Betrouwbaarheid", desc: "Geen no-shows levert een betrouwbaarheidsbonus op", color: "from-indigo-500 to-purple-500", bg: "bg-indigo-50", accent: "text-indigo-600" },
];

const challenges = [
  { icon: "🏆", title: "Diensten Draaier", desc: "Draai 10 shifts in één maand en stijg naar het volgende level", punten: "+250 ptn" },
  { icon: "⚡", title: "Last-minute Held", desc: "Reageer 3x binnen 2 uur op een oproep", punten: "+180 ptn" },
  { icon: "⏱️", title: "Stiptheids Specialist", desc: "Kom 5 shifts op rij exact op tijd aan", punten: "+150 ptn" },
  { icon: "🌟", title: "Klantfavoriet", desc: "Ontvang een 9+ beoordeling van opdrachtgevers", punten: "+200 ptn" },
  { icon: "🤝", title: "Talent Scout", desc: "Draag een nieuwe medewerker voor en verdien extra", punten: "+300 ptn" },
  { icon: "📱", title: "Social Ambassador", desc: "Deel een EXTRA post op social media", punten: "+100 ptn" },
];

const beloningen = [
  { icon: "🎵", title: "JBL Charge 3", pts: "500 ptn", cat: "Gadgets" },
  { icon: "🎧", title: "AirPods Pro", pts: "1.000 ptn", cat: "Gadgets" },
  { icon: "🎁", title: "Cadeaubon Bol.com", pts: "250 ptn", cat: "Cadeaubon" },
  { icon: "🚲", title: "Swapfiets 1 maand", pts: "350 ptn", cat: "Ervaring" },
  { icon: "👕", title: "EXTRA Gear", pts: "150 ptn", cat: "Merchandise" },
  { icon: "✈️", title: "Reiskosten vergoeding", pts: "200 ptn", cat: "Vervoer" },
];

const kortingen = [
  { brand: "Swapfiets", korting: "30% korting", desc: "Op een jaarabonnement" },
  { brand: "Hashlogics", korting: "20% korting", desc: "Op alle producten" },
  { brand: "Bonus", korting: "30% korting", desc: "Medewerkersdeal bij partner" },
];

export default function Extraatje() {
  useEffect(() => {
    document.title = "EXTRAATJE: Het beloningssysteem dat jouw werk beloont | EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "EXTRAATJE is het unieke puntensysteem van EXTRA waarmee medewerkers automatisch punten verdienen voor elke gewerkte shift, challenge en micro-prestatie.");
    setMeta("og:title", "EXTRAATJE: Het beloningssysteem dat jouw werk beloont", true);
    setMeta("og:description", "Verdien punten, behaal challenges en wissel ze in voor beloningen, kortingen en deals. Werken bij EXTRA loont letterlijk.", true);
    setMeta("og:type", "website", true);
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://www.doehetextra.nl/extraatje";
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Hoe werkt het EXTRAATJE puntensysteem?", "acceptedAnswer": { "@type": "Answer", "text": "Medewerkers verdienen automatisch punten voor elke gewerkte shift, op tijd komen, hoge beoordelingen en het voltooien van challenges." } },
        { "@type": "Question", "name": "Wat zijn challenges bij EXTRA?", "acceptedAnswer": { "@type": "Answer", "text": "Challenges zijn optionele doelen die medewerkers wekelijks of maandelijks kunnen behalen. Ze leveren bonuspunten op." } },
        { "@type": "Question", "name": "Wat kan ik doen met mijn punten?", "acceptedAnswer": { "@type": "Answer", "text": "Punten zijn inwisselbaar voor fysieke beloningen, exclusieve kortingscodes van partners, of ervaringen." } },
      ]
    };
    let scriptEl = document.querySelector("#extraatje-schema") as HTMLScriptElement;
    if (!scriptEl) { scriptEl = document.createElement("script"); scriptEl.id = "extraatje-schema"; scriptEl.type = "application/ld+json"; document.head.appendChild(scriptEl); }
    scriptEl.textContent = JSON.stringify(schema);
    return () => { scriptEl?.remove(); canonical?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      <PublicNav />

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}
      >
        <XPatternBgDark />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-32 sm:pt-40 pb-20 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-xs sm:text-sm font-semibold">Exclusief voor EXTRA medewerkers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
            EXTRAATJE
            <span className="relative inline-block">
              <span className="relative z-10">het beloningssysteem</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
            </span>
            {" "}dat jouw werk beloont
          </h1>
          <p className="text-lg sm:text-xl text-purple-100/90 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Medewerkers bij EXTRA verdienen automatisch punten voor elke gewerkte shift,
            behaalde challenge en micro-prestatie. Die punten wissel je in voor échte beloningen.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/aanmelden"
              className="group bg-white text-purple-900 font-bold px-7 py-3.5 rounded-full hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
            >
              Start met verdienen <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              href="/over-extra"
              className="border-2 border-white/30 text-white font-bold px-7 py-3.5 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
            >
              Meer over EXTRA <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 -mt-12 mb-0">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-900/10 border border-purple-100/60 p-6 sm:p-8 lg:p-10 grid grid-cols-3 gap-4 sm:gap-6">
          {[
            { num: "9.250", label: "Gem. punten per medewerker", icon: Star, color: "text-yellow-500" },
            { num: "30+", label: "Exclusieve partner deals", icon: Gift, color: "text-purple-600" },
            { num: "9+", label: "Actieve uitdagingen", icon: Trophy, color: "text-orange-500" },
          ].map(({ num, label, icon: Icon, color }) => (
            <div key={label} className="text-center">
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color} mx-auto mb-2`} />
              <p className="text-xl sm:text-3xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{num}</p>
              <p className="text-[11px] sm:text-sm text-gray-400 mt-1 font-semibold leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOE WERKT HET? ── */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        <XPatternBg />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Puntensysteem</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Hoe werkt het EXTRAATJE puntensysteem?
                </h2>
                <p className="text-gray-600 leading-relaxed mb-5 text-base sm:text-lg">
                  Zodra je een dienst draait bij EXTRA, begint je puntenbalans te groeien.
                  Het systeem registreert automatisch jouw inzet, prestaties en gedrag, zonder dat jij er iets voor hoeft te doen.
                </p>
                <p className="text-gray-600 leading-relaxed mb-8 text-base sm:text-lg">
                  Hoe meer je werkt, hoe hoger je score. Van <strong className="text-gray-900">BRONS</strong> naar <strong className="text-gray-900">ZILVER</strong> naar <strong className="text-gray-900">GOUD</strong> naar <strong className="text-gray-900">DIAMANT</strong>.
                </p>
                <div className="space-y-3">
                  {[
                    "Automatisch punten bij elke gewerkte shift",
                    "Statusniveaus: Brons → Zilver → Goud → Diamant",
                    "Real-time inzicht via de EXTRA app",
                    "Punten verlopen niet, ze bouwen op",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium text-sm sm:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <PhoneMockup src={imgDashboard} alt="EXTRA app – jouw punten dashboard" />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── MICRO-PRESTATIES ── */}
      <section className="py-16 sm:py-24 lg:py-32" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Automatisch verdienen</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 mb-4 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Micro-prestaties
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
                Je hoeft niets extra's te doen. EXTRA beloont jou voor wat je toch al doet:
                goed je werk doen. Elke kleine prestatie telt mee.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {microPrestaties.map(({ icon: Icon, label, desc, color }, i) => (
              <RevealSection key={label} delay={i * 60}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] shadow-lg shadow-purple-500/5 border-2 border-purple-100 p-6 hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHALLENGES ── */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        <XPatternBg />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-12 sm:mb-16">
              <div className="order-2 lg:order-1">
                <PhoneMockup src={imgChallenges} alt="EXTRA app – actieve uitdagingen" />
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Uitdagingen & doelen</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Challenges
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6 text-base sm:text-lg">
                  Naast de automatische punten kun je extra verdienen door wekelijkse en maandelijkse
                  challenges te voltooien. Optioneel, maar wel lonend.
                </p>
                <div className="space-y-2.5 mb-6">
                  {challenges.slice(0, 4).map(({ icon, title, punten }) => (
                    <div key={title} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border-2 border-purple-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <span className="text-sm font-semibold text-gray-900">{title}</span>
                      </div>
                      <span className="text-sm font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full">{punten}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 font-medium">En nog 5+ andere challenges elke maand →</p>
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {challenges.map(({ icon, title, desc, punten }, i) => (
                <RevealSection key={title} delay={i * 50}>
                  <div className="bg-white rounded-2xl p-5 border-2 border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-200 hover:-translate-y-1 transition-all h-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs font-black text-green-600 bg-green-100 px-2.5 py-1 rounded-full">{punten}</span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── BELONINGEN ── */}
      <section className="py-16 sm:py-24 lg:py-32" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Echte beloningen</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Beloningen die je kunt verdienen
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-base sm:text-lg">
                  Je punten zijn geen punten op papier, ze zijn echte waarde. Wissel ze in
                  voor gadgets, cadeaubonnen, ervaringen of merchandise. Jij kiest.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {beloningen.map(({ icon, title, pts, cat }) => (
                    <div key={title} className="bg-white rounded-xl p-4 border-2 border-purple-100 shadow-sm hover:border-purple-200 hover:shadow-md transition-all">
                      <span className="text-2xl block mb-2">{icon}</span>
                      <p className="text-sm font-black text-gray-900 leading-tight mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</p>
                      <p className="text-xs text-gray-400 font-medium">{cat}</p>
                      <p className="text-xs font-black text-green-600 mt-2">{pts}</p>
                    </div>
                  ))}
                </div>
              </div>
              <PhoneMockup src={imgBeloningen} alt="EXTRA app – beloningen zoals JBL en AirPods" />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── KORTINGEN ── */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        <XPatternBg />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <PhoneMockup src={imgKortingen} alt="EXTRA app – kortingscodes en partner deals" />
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Partner deals</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Kortingscodes & Deals
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-base sm:text-lg">
                  Naast fysieke beloningen hebben we exclusieve deals met onze partners.
                  Ruil je punten in voor kortingscodes die je direct kunt gebruiken.
                </p>
                <div className="space-y-3">
                  {kortingen.map(({ brand, korting, desc }) => (
                    <div key={brand} className="flex items-center justify-between bg-white rounded-xl px-4 py-3.5 border-2 border-purple-100 shadow-sm hover:border-purple-200 transition-all">
                      <div>
                        <p className="text-sm font-black text-gray-900">{brand}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <span className="text-sm font-black text-green-600 bg-green-100 px-3 py-1.5 rounded-full shrink-0 ml-4">{korting}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4 font-medium">Meer deals worden maandelijks toegevoegd</p>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── RANGLIJST ── */}
      <section className="relative bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 py-16 sm:py-24 overflow-hidden">
        <XPatternBgDark />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-4 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <Trophy className="w-4 h-4" /> Competitie & status
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-0 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  De ranglijst: wie staat er bovenaan?
                </h2>
                <p className="text-purple-200/80 leading-relaxed mb-8 text-base sm:text-lg">
                  In de EXTRA app zie je maandelijks wie de meeste punten heeft verdiend.
                  Sta je in de top 3? Dan wacht er een extra beloning, eerlijk en motiverend.
                </p>
                <div className="space-y-3">
                  {[
                    { pos: "🥇", label: "1e plaats", extra: "Exclusieve maandbonus" },
                    { pos: "🥈", label: "2e plaats", extra: "Extra puntenbonus" },
                    { pos: "🥉", label: "3e plaats", extra: "Beloningsbonus" },
                  ].map(({ pos, label, extra }) => (
                    <div key={label} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3.5 border border-white/10">
                      <span className="text-2xl">{pos}</span>
                      <div>
                        <p className="text-sm font-black text-white">{label}</p>
                        <p className="text-xs text-purple-300">{extra}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <PhoneMockup src={imgRanglijst} alt="EXTRA app – ranglijst met top 3 medewerkers" />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Veelgestelde vragen</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Alles over EXTRAATJE
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { q: "Hoe snel zie ik mijn punten?", a: "Na elke verwerkte dienst worden jouw punten automatisch bijgeschreven in de EXTRA app. Dit duurt maximaal 24 uur." },
                { q: "Verlopen mijn punten?", a: "Nee. Jouw punten verlopen niet en bouwen op. Je kunt op elk moment inwisselen wanneer jij dat wilt." },
                { q: "Kan ik punten overdragen aan iemand anders?", a: "Nee, punten zijn persoonlijk en gekoppeld aan jouw account. Ze zijn niet overdraagbaar." },
                { q: "Hoe werken de statusniveaus?", a: "Je begint als BRONS-medewerker. Naarmate je meer punten verdient, stijg je naar ZILVER (10.000 ptn), GOUD (15.000 ptn) en DIAMANT (25.000 ptn). Hogere niveaus geven toegang tot exclusievere beloningen." },
                { q: "Kan ik meedoen als ik niet bij EXTRA werk?", a: "Het EXTRAATJE systeem is exclusief voor medewerkers van EXTRA. Nog niet aangemeld? Doe dat dan via onze aanmeldpagina." },
              ].map(({ q, a }) => (
                <div key={q} className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-purple-100 shadow-sm hover:border-purple-200 transition-all">
                  <h3 className="text-sm sm:text-base font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{q}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 py-16 sm:py-24 overflow-hidden">
        <XPatternBgDark />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-5 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
              <Gift className="w-4 h-4" /> Klaar om te verdienen?
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Begin vandaag nog met verdienen
            </h2>
            <p className="text-purple-200/80 text-base sm:text-lg mb-8 leading-relaxed">
              Meld je aan als medewerker bij EXTRA en verdien je eerste punten al bij je eerste shift.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/aanmelden"
                className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
              >
                Meld je nu aan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                href="/landing"
                className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
              >
                Meer over EXTRA <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
