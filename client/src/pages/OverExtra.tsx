import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import {
  Users, Heart, Zap, Star, ArrowRight, ChevronRight,
  Shield, TrendingUp, Sparkles, Award, Check, Gift
} from "lucide-react";
import xPatroon from "@assets/X_patroon_1771260543289.webp";

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
        { left: "80%", top: "20%", w: 140, rot: -8, op: 0.05 },
        { left: "50%", top: "70%", w: 160, rot: 25, op: 0.06 },
      ].map((x, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: x.left, top: x.top,
            width: x.w, height: x.w,
            transform: `rotate(${x.rot}deg)`,
            opacity: x.op,
            WebkitMaskImage: `url(${xPatroon})`,
            maskImage: `url(${xPatroon})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            backgroundColor: "rgba(139,92,246,1)",
          }}
        />
      ))}
    </div>
  );
}

const values = [
  { icon: Zap, title: "Snel schakelen", desc: "Of het nu gaat om een last-minute verzoek of een urgente invaller — EXTRA staat klaar. Razendsnel.", color: "from-purple-600 to-purple-800", bg: "bg-purple-50", accent: "text-purple-600" },
  { icon: Heart, title: "Mensen eerst", desc: "Of je nu medewerker of klant bent: bij EXTRA staat jij centraal. Dat is geen slogan, dat is hoe we werken.", color: "from-pink-500 to-rose-600", bg: "bg-pink-50", accent: "text-pink-600" },
  { icon: Shield, title: "Betrouwbaar", desc: "Afspraken zijn afspraken. Wij leveren wat we beloven — en anders hoor je het meteen van ons.", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50", accent: "text-blue-600" },
  { icon: Sparkles, title: "Net dat EXTRA", desc: "We doen altijd net iets meer dan gevraagd. In service, in aandacht en in resultaat.", color: "from-amber-500 to-orange-500", bg: "bg-amber-50", accent: "text-amber-600" },
];

const teamPreview = [
  { naam: "Eveline", functie: "Operations Manager", initials: "EV", color: "from-purple-500 to-violet-600" },
  { naam: "Jayden", functie: "Planner", initials: "JA", color: "from-blue-500 to-cyan-500" },
  { naam: "Lotte", functie: "Recruiter", initials: "LO", color: "from-pink-500 to-rose-500" },
];

const NAV_LINKS = [
  { label: "Wie zijn wij?", href: "/over-extra" },
  { label: "Ons team", href: "/over-extra/ons-team" },
  { label: "Beloningssysteem", href: "/extraatje" },
  { label: "Aanmelden", href: "/aanmelden" },
];

export default function OverExtra() {

  useEffect(() => {
    document.title = "Over EXTRA – Wie zijn wij? | EXTRA Hospitality Staffing";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "EXTRA is een jong, energiek hospitality staffing bureau. Wij matchen de beste horecamedewerkers, housekeeping en front-office talenten met toonaangevende opdrachtgevers.");
    setMeta("og:title", "Over EXTRA – Wie zijn wij?", true);
    setMeta("og:description", "Leer ons kennen: jong team, grote energie, sterke resultaten. EXTRA levert de beste hospitality medewerkers.", true);
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://www.doehetextra.nl/over-extra";
    return () => { canonical?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      <PublicNav />

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { left: "5%", top: "10%", w: 200, rot: 15, op: 0.12 },
            { left: "15%", top: "75%", w: 180, rot: -10, op: 0.10 },
            { left: "75%", top: "20%", w: 240, rot: 30, op: 0.08 },
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

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-32 sm:pt-40 pb-24 sm:pb-32">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-white/60 mb-8">
            <Link href="/landing" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-semibold">Over EXTRA</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-xs sm:text-sm font-semibold">800+ medewerkers actief in de hospitality</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
            Wij zijn{" "}
            <span className="relative inline-block">
              <span className="relative z-10">EXTRA</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-100/90 max-w-xl mb-8 leading-relaxed font-medium">
            Een jong, gedreven hospitality staffing bureau dat de sector naar een hoger niveau tilt.
            Met mensen als uitgangspunt en een uniek beloningssysteem.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/over-extra/ons-team"
              className="group bg-white text-purple-900 font-bold px-7 py-3.5 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
            >
              <Users className="w-5 h-5" /> Maak kennis met ons team <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/extraatje"
              className="border-2 border-white/30 text-white font-bold px-7 py-3.5 rounded-full text-base hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
            >
              <Gift className="w-5 h-5" /> Ons beloningssysteem
            </Link>
          </div>
        </div>
      </section>

      {/* ── SUBNAV ── */}
      <div className="border-b border-purple-100 bg-white sticky top-0 sm:top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex gap-0 overflow-x-auto text-sm">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`py-4 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  href === "/over-extra"
                    ? "border-purple-600 text-purple-700"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 -mt-0 py-0">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-900/10 border border-purple-100/60 p-6 sm:p-8 lg:p-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 -mt-12 relative z-10">
            {[
              { num: "893+", label: "Actieve medewerkers", icon: Users, color: "text-purple-600" },
              { num: "150+", label: "Tevreden opdrachtgevers", icon: Heart, color: "text-pink-500" },
              { num: "541K", label: "Punten uitgedeeld", icon: Sparkles, color: "text-yellow-500" },
              { num: "98%", label: "Tevredenheidsscore", icon: TrendingUp, color: "text-green-500" },
            ].map(({ num, label, icon: Icon, color }) => (
              <div key={label} className="text-center">
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color} mx-auto mb-2 sm:mb-3`} />
                <p className="text-2xl sm:text-4xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{num}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MISSIE ── */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        <XPatternBg />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Onze missie</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Werken moet lonen — letterlijk
                </h2>
                <p className="text-gray-600 leading-relaxed mb-5 text-base sm:text-lg">
                  EXTRA is meer dan een uitzendbureau. We zijn een beweging voor een eerlijkere, leukere manier van werken in de hospitality. Medewerkers die zich inzetten, verdienen meer — niet alleen in salaris, maar ook in erkenning en beloningen.
                </p>
                <p className="text-gray-600 leading-relaxed mb-8 text-base sm:text-lg">
                  Met ons EXTRAATJE puntensysteem belonen we medewerkers automatisch voor elke shift, elke uitdaging en elk moment dat ze net dat beetje extra geven.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "Medewerkers altijd in loondienst",
                    "Dagbetaling mogelijk via de app",
                    "Punten & beloningen voor elke dienst",
                    "Snel inzetbaar, ook last-minute",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-purple-700" />
                      </div>
                      <span className="text-gray-700 font-medium text-sm sm:text-base">{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/extraatje"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-7 py-3.5 rounded-full hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/20 transition-all hover:-translate-y-0.5"
                >
                  Lees over EXTRAATJE <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Zap, label: "Snel schakelen", desc: "Binnen 24 uur een team", bg: "bg-purple-50", color: "text-purple-600" },
                  { icon: Shield, label: "Betrouwbaar", desc: "Afspraken = afspraken", bg: "bg-blue-50", color: "text-blue-600" },
                  { icon: Heart, label: "Mensen centraal", desc: "Medewerker & klant", bg: "bg-pink-50", color: "text-pink-600" },
                  { icon: Award, label: "Kwaliteitsborging", desc: "Strenge selectie", bg: "bg-amber-50", color: "text-amber-600" },
                ].map(({ icon: Icon, label, desc, bg, color }) => (
                  <div key={label} className={`${bg} rounded-2xl p-5 border border-white shadow-sm`}>
                    <Icon className={`w-6 h-6 ${color} mb-3`} />
                    <p className="font-bold text-gray-900 text-sm mb-1">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── WAARDEN ── */}
      <section className="py-16 sm:py-24 lg:py-32" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Onze waarden</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat ons drijft
              </h2>
              <p className="text-gray-500 mt-3 text-base sm:text-lg max-w-xl mx-auto">Vier principes die alles bepalen wat we doen.</p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {values.map(({ icon: Icon, title, desc, color, bg, accent }, i) => (
              <RevealSection key={title} delay={i * 80}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] shadow-lg shadow-purple-500/5 border-2 border-purple-100 p-6 sm:p-7 hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 shadow-lg shadow-purple-500/20`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM PREVIEW ── */}
      <section className="relative bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { left: "5%", top: "10%", w: 200, rot: 15, op: 0.1 },
            { left: "80%", top: "60%", w: 240, rot: -20, op: 0.08 },
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
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="flex items-end justify-between mb-10 sm:mb-14 flex-wrap gap-4">
              <div>
                <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-4 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
                  <Users className="w-4 h-4" /> Ons team
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  De mensen achter EXTRA
                </h2>
                <p className="text-purple-200/80 mt-3 text-base sm:text-lg max-w-xl">
                  Jong, energiek en een tikje eigenwijs — precies zoals we het leuk vinden.
                </p>
              </div>
              <Link href="/over-extra/ons-team" className="inline-flex items-center gap-2 text-purple-300 hover:text-white font-semibold text-sm transition-colors">
                Heel het team zien <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {teamPreview.map(({ naam, functie, initials, color }) => (
                <div key={naam} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center hover:bg-white/15 hover:border-white/20 hover:-translate-y-1 transition-all">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl font-black text-white mx-auto mb-4 shadow-lg`}>
                    {initials}
                  </div>
                  <p className="font-black text-white text-base" style={{ fontFamily: "'Poppins', sans-serif" }}>{naam}</p>
                  <p className="text-xs text-purple-300 mt-1 font-semibold uppercase tracking-wider">{functie}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8 sm:mt-10">
              <Link
                href="/over-extra/ons-team"
                className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
              >
                <Users className="w-5 h-5" /> Heel het team bekijken <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative bg-white py-16 sm:py-24 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <RevealSection>
            <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Meedoen?</span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Onderdeel worden van EXTRA?
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              Meld je aan als medewerker en begin vandaag nog met werken én verdienen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/aanmelden"
                className="group inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-8 py-4 rounded-full hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-1"
              >
                Aanmelden als medewerker <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/personeel-gezocht"
                className="inline-flex items-center gap-2 border-2 border-purple-200 text-purple-700 font-bold px-8 py-4 rounded-full hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                Opdrachtgever? <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
