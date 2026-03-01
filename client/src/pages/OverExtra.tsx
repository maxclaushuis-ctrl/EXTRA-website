import { useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Users, Heart, Zap, Star, ArrowRight, ChevronRight,
  Shield, TrendingUp, Clock, Sparkles, Award
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";
import xPatroon from "@assets/X_patroon_1771260543289.png";

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }
      },
      { threshold: 0.1 }
    );
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
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

const values = [
  { icon: Zap, title: "Snel schakelen", desc: "We reageren razendsnel. Of het nu gaat om een last-minute verzoek of een urgente invaller — EXTRA staat klaar.", color: "from-yellow-500 to-orange-500" },
  { icon: Heart, title: "Mensen eerst", desc: "Of je nu medewerker of klant bent: bij EXTRA staat jij centraal. Dat is geen slogan, dat is hoe we werken.", color: "from-pink-500 to-rose-500" },
  { icon: Shield, title: "Betrouwbaar", desc: "Afspraken zijn afspraken. Wij leveren wat we beloven — en anders hoor je het meteen van ons.", color: "from-blue-500 to-indigo-500" },
  { icon: Sparkles, title: "Net dat EXTRA", desc: "We doen altijd net iets meer dan gevraagd. In service, in aandacht en in resultaat.", color: "from-purple-500 to-violet-500" },
];

const teamPreview = [
  { naam: "Eveline", functie: "Operations Manager", initials: "EV", color: "from-purple-500 to-violet-600" },
  { naam: "Jayden", functie: "Planner", initials: "JA", color: "from-blue-500 to-cyan-500" },
  { naam: "Lotte", functie: "Recruiter", initials: "LO", color: "from-pink-500 to-rose-500" },
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
    setMeta("og:description", "Leer ons kennen: jong team, grote energie, sterke resultaten. EXTRA levert de beste hospitality medewerkers met een uniek beloningssysteem.", true);
    setMeta("og:type", "website", true);
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://www.doehetextra.nl/over-extra";
    return () => { canonical?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10" style={{ background: "rgba(10,5,30,0.88)" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/landing">
            <img src={extraLogoWit} alt="EXTRA logo" className="h-7 cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/over-extra/ons-team" className="text-purple-300 hover:text-white transition-colors hidden sm:block">Ons team</Link>
            <a
              href="/aanmelden"
              className="inline-flex items-center gap-2 font-semibold px-4 py-2 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
            >
              Aanmelden <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative overflow-hidden pt-16" style={{ background: "linear-gradient(160deg, #0a0518 0%, #1a0a3e 55%, #0f0726 100%)" }}>
        <img src={xPatroon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.06] pointer-events-none select-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-20 sm:pb-32">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-purple-400 mb-8">
            <Link href="/landing" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-medium">Over EXTRA</span>
          </div>

          <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
            <Users className="w-4 h-4" /> Over ons
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.05]" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Wij zijn{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              EXTRA
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-200 max-w-2xl leading-relaxed mb-8">
            Een jong, gedreven team dat de hospitality sector naar een hoger niveau tilt.
            Wij verbinden de beste medewerkers met de mooiste opdrachtgevers — met een uniek beloningssysteem dat werken écht leuker maakt.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/over-extra/ons-team"
              className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-full text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
            >
              <Users className="h-4 w-4" /> Maak kennis met ons team
            </Link>
            <Link
              href="/landing"
              className="inline-flex items-center gap-2 font-medium px-7 py-3 rounded-full text-purple-300 border border-white/20 hover:border-white/40 transition-all"
            >
              Naar home <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* SUBNAV */}
      <div className="border-b border-white/10 sticky top-16 z-40 backdrop-blur-xl" style={{ background: "rgba(10,5,30,0.9)" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex gap-6 text-sm overflow-x-auto">
            {[
              { label: "Wie zijn wij?", href: "/over-extra" },
              { label: "Ons team", href: "/over-extra/ons-team" },
              { label: "Beloningssysteem", href: "/extraatje" },
              { label: "Medewerkers gezocht", href: "/aanmelden" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  href === "/over-extra"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-purple-400 hover:text-white hover:border-white/30"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* MISSIE */}
      <div className="py-20 sm:py-28" style={{ background: "#0d0820" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Onze missie</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Werken moet lonen — letterlijk
                </h2>
                <p className="text-purple-200 leading-relaxed mb-5">
                  EXTRA is meer dan een uitzendbureau. We zijn een beweging voor een eerlijkere, leukere manier van werken in de hospitality. Medewerkers die zich inzetten, verdienen meer — niet alleen in salaris, maar ook in erkenning, beloningen en groei.
                </p>
                <p className="text-purple-200 leading-relaxed mb-5">
                  Met ons EXTRAATJE puntensysteem belonen we medewerkers automatisch voor elke shift, elke uitdaging en elk moment dat ze net dat beetje extra geven. Dat is onze belofte.
                </p>
                <Link href="/extraatje" className="inline-flex items-center gap-2 text-purple-300 hover:text-white font-medium transition-colors text-sm">
                  Lees meer over EXTRAATJE <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { num: "893+", label: "Actieve medewerkers" },
                  { num: "150+", label: "Tevreden opdrachtgevers" },
                  { num: "541K", label: "Uitgedeelde punten" },
                  { num: "9+", label: "Jaar hospitality ervaring" },
                ].map(({ num, label }) => (
                  <div key={label} className="rounded-2xl p-5 border border-white/10 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-3xl font-black text-white mb-1">{num}</p>
                    <p className="text-xs text-purple-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </div>

      {/* VALUES */}
      <div className="py-20 sm:py-28 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0f0726, #1a0a3e)" }}>
        <img src={xPatroon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Onze waarden</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat ons drijft
              </h2>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {values.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="rounded-2xl p-6 border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-purple-300 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </div>

      {/* TEAM PREVIEW */}
      <div className="py-20 sm:py-28" style={{ background: "#0d0820" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <div>
                <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Ons team</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  De mensen achter EXTRA
                </h2>
                <p className="text-purple-200 mt-3 max-w-xl">
                  Jong, energiek en een tikje eigenwijs. Precies zoals we het leuk vinden.
                </p>
              </div>
              <Link
                href="/over-extra/ons-team"
                className="inline-flex items-center gap-2 font-semibold text-sm text-purple-300 hover:text-white transition-colors"
              >
                Heel het team bekijken <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {teamPreview.map(({ naam, functie, initials, color }) => (
                <div key={naam} className="rounded-2xl p-6 border border-white/10 text-center group hover:border-purple-500/40 transition-all hover:-translate-y-1" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-xl font-black text-white mx-auto mb-4 shadow-lg`}>
                    {initials}
                  </div>
                  <p className="font-bold text-white">{naam}</p>
                  <p className="text-xs text-purple-400 mt-1">{functie}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/over-extra/ons-team"
                className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-full text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
              >
                <Users className="h-4 w-4" /> Heel het team zien
              </Link>
            </div>
          </RevealSection>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 sm:py-28 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4c1d95, #6d28d9, #7c3aed)" }}>
        <img src={xPatroon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.07] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <RevealSection>
            <Award className="h-12 w-12 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Onderdeel worden van EXTRA?
            </h2>
            <p className="text-purple-200 text-lg mb-8">
              Meld je aan als medewerker en begin vandaag nog met werken én verdienen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/aanmelden" className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-purple-900 shadow-xl" style={{ background: "linear-gradient(135deg, #fde68a, #fbbf24)" }}>
                Aanmelden als medewerker <ArrowRight className="h-5 w-5" />
              </a>
              <Link href="/personeel-gezocht" className="text-white/80 hover:text-white font-medium transition-colors text-sm">
                Opdrachtgever? Klik hier →
              </Link>
            </div>
          </RevealSection>
        </div>
      </div>

      {/* MINI FOOTER */}
      <div className="py-8 border-t border-white/10 text-center" style={{ background: "#0a0518" }}>
        <div className="flex items-center justify-center gap-6 text-xs text-purple-400 flex-wrap">
          <Link href="/landing" className="hover:text-white transition-colors">Home</Link>
          <Link href="/over-extra/ons-team" className="hover:text-white transition-colors">Ons team</Link>
          <Link href="/extraatje" className="hover:text-white transition-colors">EXTRAATJE</Link>
          <Link href="/aanmelden" className="hover:text-white transition-colors">Aanmelden</Link>
          <span>© 2025 EXTRA Hospitality Staffing</span>
        </div>
      </div>
    </div>
  );
}
