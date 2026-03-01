import { useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Gift, Star, Trophy, Zap, Clock, ThumbsUp, Shield, TrendingUp,
  ArrowRight, CheckCircle2, Users, Target, Award, Flame,
  ChevronRight, Tag, Sparkles
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";
import xPatroon from "@assets/X_patroon_1771260543289.png";
import imgDashboard from "@assets/IMG_8971_1772395165096.png";
import imgBeloningen from "@assets/IMG_8973_1772396250204.png";
import imgKortingen from "@assets/IMG_8974_1772396250204.png";
import imgChallenges from "@assets/IMG_8975_1772396250204.png";
import imgRanglijst from "@assets/IMG_8977_1772396250204.png";

function PhoneMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-[200px] sm:w-[240px] mx-auto">
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/60 border-[6px] border-gray-800 bg-gray-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[20px] bg-gray-900 rounded-b-xl z-20" />
        <img src={src} alt={alt} className="w-full relative z-10" loading="lazy" decoding="async" />
      </div>
      <div className="absolute -inset-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-[3.5rem] blur-3xl -z-10" />
    </div>
  );
}

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; } },
      { threshold: 0.1 }
    );
    el.style.opacity = "0";
    el.style.transform = "translateY(32px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useScrollReveal();
  return (
    <section ref={ref} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </section>
  );
}

const microPrestaties = [
  { icon: Clock, label: "Op tijd komen", desc: "Punten voor punctualiteit bij elke dienst", color: "from-blue-500 to-cyan-500" },
  { icon: Star, label: "Hoge beoordeling", desc: "Extra punten bij een topbeoordeling van opdrachtgevers", color: "from-yellow-500 to-orange-500" },
  { icon: Sparkles, label: "Uitstraling & houding", desc: "Beloond voor professionele presentatie", color: "from-purple-500 to-pink-500" },
  { icon: Zap, label: "Extra shifts", desc: "Meer shifts = meer punten, zo simpel is het", color: "from-green-500 to-emerald-500" },
  { icon: Flame, label: "Last-minute beschikbaar", desc: "Bijspringen op korte termijn? Dubbele waardering", color: "from-red-500 to-orange-500" },
  { icon: Shield, label: "Betrouwbaarheid", desc: "Geen no-shows levert een betrouwbaarheidsbonus op", color: "from-indigo-500 to-purple-500" },
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
    document.title = "EXTRAATJE – Het beloningssysteem dat jouw werk beloont | EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "EXTRAATJE is het unieke puntensysteem van EXTRA waarmee medewerkers automatisch punten verdienen voor elke gewerkte shift, challenge en micro-prestatie. Wissel ze in voor echte beloningen.");
    setMeta("og:title", "EXTRAATJE – Het beloningssysteem dat jouw werk beloont", true);
    setMeta("og:description", "Verdien punten, behaal challenges en wissel ze in voor beloningen, kortingen en deals. Werken bij EXTRA loont letterlijk.", true);
    setMeta("og:type", "website", true);
    setMeta("og:url", "https://www.doehetextra.nl/extraatje", true);
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://www.doehetextra.nl/extraatje";
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Hoe werkt het EXTRAATJE puntensysteem?", "acceptedAnswer": { "@type": "Answer", "text": "Medewerkers verdienen automatisch punten voor elke gewerkte shift, op tijd komen, hoge beoordelingen en het voltooien van challenges. Punten zijn in te wisselen voor beloningen en kortingen." } },
        { "@type": "Question", "name": "Wat zijn challenges bij EXTRA?", "acceptedAnswer": { "@type": "Answer", "text": "Challenges zijn optionele doelen die medewerkers wekelijks of maandelijks kunnen behalen, zoals extra shifts draaien, stipt zijn of last-minute beschikbaar zijn. Ze leveren bonuspunten op." } },
        { "@type": "Question", "name": "Wat kan ik doen met mijn punten?", "acceptedAnswer": { "@type": "Answer", "text": "Punten zijn inwisselbaar voor fysieke beloningen (gadgets, cadeaubonnen), exclusieve kortingscodes van partners zoals Swapfiets, of ervaringen." } },
      ]
    };
    let scriptEl = document.querySelector("#extraatje-schema") as HTMLScriptElement;
    if (!scriptEl) { scriptEl = document.createElement("script"); scriptEl.id = "extraatje-schema"; scriptEl.type = "application/ld+json"; document.head.appendChild(scriptEl); }
    scriptEl.textContent = JSON.stringify(schema);
    return () => { scriptEl?.remove(); canonical?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10" style={{ background: "rgba(10,5,30,0.85)" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/landing">
            <img src={extraLogoWit} alt="EXTRA logo" className="h-7 cursor-pointer" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/landing" className="text-sm text-purple-300 hover:text-white transition-colors hidden sm:block">← Terug naar home</Link>
            <a
              href="/aanmelden"
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
            >
              Aanmelden <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden pt-16" style={{ background: "linear-gradient(160deg, #0a0518 0%, #1a0a3e 50%, #0f0726 100%)" }}>
        <img src={xPatroon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.06] pointer-events-none select-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-20 sm:pb-32 text-center">
          <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
            <Gift className="w-4 h-4" /> Beloningssysteem
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.05]" style={{ fontFamily: "'Poppins', sans-serif" }}>
            EXTRAATJE –{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              het beloningssysteem
            </span>{" "}
            dat jouw werk beloont
          </h1>
          <p className="text-lg sm:text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed mb-8">
            Medewerkers bij EXTRA verdienen automatisch punten voor elke gewerkte shift,
            behaalde challenge en micro-prestatie. Die punten wissel je in voor échte beloningen.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/aanmelden"
              className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-white text-base sm:text-lg shadow-xl shadow-purple-900/50"
              style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
            >
              Start met verdienen <ArrowRight className="h-5 w-5" />
            </a>
            <Link href="/landing" className="inline-flex items-center gap-2 text-purple-300 hover:text-white font-medium transition-colors text-sm">
              Meer over EXTRA <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-16 max-w-xl mx-auto">
            {[
              { num: "9.250", label: "Gemiddelde punten" },
              { num: "30+", label: "Exclusieve deals" },
              { num: "9+", label: "Uitdagingen actief" },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-white">{num}</p>
                <p className="text-xs sm:text-sm text-purple-300 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOE WERKT HET? ── */}
      <div className="py-20 sm:py-28" style={{ background: "#0d0820" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Puntensysteem</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Hoe werkt het EXTRAATJE puntensysteem?
                </h2>
                <p className="text-purple-200 leading-relaxed mb-6">
                  Zodra je een dienst draait bij EXTRA, begint je puntenbalans te groeien.
                  Het systeem registreert automatisch jouw inzet, prestaties en gedrag
                  — zonder dat jij er iets voor hoeft te doen.
                </p>
                <p className="text-purple-200 leading-relaxed mb-8">
                  Hoe meer je werkt, hoe hoger je score. En hoe hoger je score,
                  hoe aantrekkelijker de beloningen die je kunt claimen.
                  Van BRONS naar ZILVER naar GOUD naar DIAMANT.
                </p>
                <div className="space-y-3">
                  {[
                    "Automatisch punten bij elke gewerkte shift",
                    "Statusniveaus: Brons → Zilver → Goud → Diamant",
                    "Real-time inzicht via de EXTRA app",
                    "Punten verlopen niet — ze bouwen op",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3 text-sm text-white">
                      <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <PhoneMockup src={imgDashboard} alt="EXTRA app – jouw punten dashboard met BRONS status" />
            </div>
          </RevealSection>
        </div>
      </div>

      {/* ── MICRO-PRESTATIES ── */}
      <div className="py-20 sm:py-28 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0f0726, #1a0a3e)" }}>
        <img src={xPatroon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Automatisch verdienen</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Micro-prestaties (automatisch punten verdienen)
              </h2>
              <p className="text-purple-200 max-w-2xl mx-auto">
                Je hoeft niets extra's te doen. EXTRA beloont jou voor wat je toch al doet:
                goed je werk doen. Elke kleine prestatie telt mee.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {microPrestaties.map(({ icon: Icon, label, desc, color }) => (
                <div
                  key={label}
                  className="rounded-2xl p-5 border border-white/10 backdrop-blur-sm"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{label}</h3>
                  <p className="text-sm text-purple-300 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </div>

      {/* ── CHALLENGES ── */}
      <div className="py-20 sm:py-28" style={{ background: "#0d0820" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <PhoneMockup src={imgChallenges} alt="EXTRA app – actieve uitdagingen en challenges" />
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Uitdagingen & doelen</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Challenges
                </h2>
                <p className="text-purple-200 leading-relaxed mb-6">
                  Naast de automatische punten kun je extra verdienen door wekelijkse en maandelijkse
                  challenges te voltooien. Optioneel, maar wel lonend.
                </p>
                <div className="space-y-3 mb-8">
                  {challenges.slice(0, 4).map(({ icon, title, punten }) => (
                    <div key={title} className="flex items-center justify-between rounded-xl px-4 py-3 border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <span className="text-sm font-medium text-white">{title}</span>
                      </div>
                      <span className="text-sm font-bold text-green-400">{punten}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-purple-400">En nog 5+ andere challenges elke maand →</p>
              </div>
            </div>
          </RevealSection>

          {/* Challenge cards grid */}
          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
              {challenges.map(({ icon, title, desc, punten }) => (
                <div key={title} className="rounded-2xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">{punten}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                  <p className="text-xs text-purple-300 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </div>

      {/* ── BELONINGEN ── */}
      <div className="py-20 sm:py-28 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0f0726, #1a0a3e)" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Echte beloningen</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Beloningen die je kunt verdienen
                </h2>
                <p className="text-purple-200 leading-relaxed mb-8">
                  Je punten zijn geen punten op papier — ze zijn echte waarde. Wissel ze in
                  voor gadgets, cadeaubonnen, ervaringen of merchandise. Jij kiest.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {beloningen.map(({ icon, title, pts, cat }) => (
                    <div key={title} className="rounded-xl p-4 border border-white/10" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <span className="text-2xl block mb-2">{icon}</span>
                      <p className="text-sm font-bold text-white leading-tight mb-1">{title}</p>
                      <p className="text-xs text-purple-400">{cat}</p>
                      <p className="text-xs font-bold text-green-400 mt-2">{pts}</p>
                    </div>
                  ))}
                </div>
              </div>
              <PhoneMockup src={imgBeloningen} alt="EXTRA app – beloningen zoals JBL en AirPods inwisselen met punten" />
            </div>
          </RevealSection>
        </div>
      </div>

      {/* ── KORTINGEN ── */}
      <div className="py-20 sm:py-28" style={{ background: "#0d0820" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <PhoneMockup src={imgKortingen} alt="EXTRA app – kortingscodes en deals van partners zoals Swapfiets" />
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Partner deals</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Kortingscodes & Deals
                </h2>
                <p className="text-purple-200 leading-relaxed mb-8">
                  Naast fysieke beloningen hebben we exclusieve deals met onze partners.
                  Ruil je punten in voor kortingscodes die je direct kunt gebruiken —
                  van fietsabonnementen tot tech-kortingen.
                </p>
                <div className="space-y-3">
                  {kortingen.map(({ brand, korting, desc }) => (
                    <div key={brand} className="flex items-center justify-between rounded-xl px-4 py-3.5 border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div>
                        <p className="text-sm font-bold text-white">{brand}</p>
                        <p className="text-xs text-purple-300">{desc}</p>
                      </div>
                      <span className="text-sm font-black text-green-400 shrink-0 ml-4">{korting}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-purple-400 mt-4">Meer deals worden maandelijks toegevoegd</p>
              </div>
            </div>
          </RevealSection>
        </div>
      </div>

      {/* ── RANGLIJST ── */}
      <div className="py-20 sm:py-28 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0f0726, #1a0a3e)" }}>
        <img src={xPatroon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Competitie & status</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  De ranglijst — wie staat er bovenaan?
                </h2>
                <p className="text-purple-200 leading-relaxed mb-6">
                  In de EXTRA app zie je maandelijks wie de meeste punten heeft verdiend.
                  Sta je in de top 3? Dan wacht er een extra beloning. Spannend, motiverend
                  en eerlijk — want iedereen begint elke maand opnieuw.
                </p>
                <div className="space-y-3">
                  {[
                    { pos: "🥇", label: "1e plaats", extra: "Exlusieve maandbonus" },
                    { pos: "🥈", label: "2e plaats", extra: "Extra puntenbonus" },
                    { pos: "🥉", label: "3e plaats", extra: "Beloningsbonus" },
                  ].map(({ pos, label, extra }) => (
                    <div key={label} className="flex items-center gap-4 rounded-xl px-4 py-3.5 border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <span className="text-2xl">{pos}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{label}</p>
                        <p className="text-xs text-purple-300">{extra}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <PhoneMockup src={imgRanglijst} alt="EXTRA app – ranglijst met top 3 medewerkers en punten" />
            </div>
          </RevealSection>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="py-20 sm:py-28" style={{ background: "#0d0820" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Veelgestelde vragen</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
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
                <div key={q} className="rounded-2xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <h3 className="text-sm font-bold text-white mb-2">{q}</h3>
                  <p className="text-sm text-purple-300 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </div>

      {/* ── CTA BOTTOM ── */}
      <div className="py-20 sm:py-28 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4c1d95, #6d28d9, #7c3aed)" }}>
        <img src={xPatroon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <RevealSection>
            <Gift className="h-12 w-12 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om te verdienen?
            </h2>
            <p className="text-purple-200 text-lg mb-8 leading-relaxed">
              Meld je aan als medewerker bij EXTRA en begin vandaag nog met het verzamelen van punten.
              Je eerste punten verdien je al bij je eerste shift.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/aanmelden"
                className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-purple-900 text-base shadow-xl"
                style={{ background: "linear-gradient(135deg, #fde68a, #fbbf24)" }}
              >
                Meld je nu aan <ArrowRight className="h-5 w-5" />
              </a>
              <Link href="/landing" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors text-sm">
                Meer over EXTRA <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </div>

      {/* ── MINI FOOTER ── */}
      <div className="py-8 border-t border-white/10 text-center" style={{ background: "#0a0518" }}>
        <div className="flex items-center justify-center gap-6 text-xs text-purple-400">
          <Link href="/landing" className="hover:text-white transition-colors">Home</Link>
          <Link href="/aanmelden" className="hover:text-white transition-colors">Aanmelden</Link>
          <Link href="/personeel-gezocht" className="hover:text-white transition-colors">Opdrachtgevers</Link>
          <span>© 2025 EXTRA Hospitality Staffing</span>
        </div>
      </div>
    </div>
  );
}
