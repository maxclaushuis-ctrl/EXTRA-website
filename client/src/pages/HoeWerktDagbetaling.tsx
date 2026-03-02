import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, ChevronDown, ChevronRight, Clock, Menu, X,
  Zap, Shield, Eye, CalendarCheck, CheckCircle2, Smartphone,
  Users, Trophy, Gift, Star, Banknote, TrendingUp
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";
import xPatroon from "@assets/X_patroon_1771260543289.png";
import jixbeeUren from "@assets/Jixbee_Gewerkte_uren_1772454264961.png";
import jixbeePayout from "@assets/Jixbee_Payout_succes_1772454264961.png";

/* ── SCROLL REVEAL ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function XPatternBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
      {[...Array(6)].map((_, i) => (
        <img key={i} src={xPatroon} alt="" className="absolute w-40 sm:w-56 opacity-60"
          style={{ top: `${[5, 25, 55, 70, 10, 80][i]}%`, left: `${[5, 70, 15, 80, 45, 50][i]}%`, transform: `rotate(${[0, 15, -10, 5, -20, 10][i]}deg)` }} />
      ))}
    </div>
  );
}

/* ── FAQ ITEM ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${open ? "border-purple-200 shadow-md" : "border-gray-100 hover:border-purple-100"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-bold text-gray-900 text-sm sm:text-base">{q}</span>
        <ChevronDown className={`w-5 h-5 text-purple-500 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ── PUSH NOTIFICATION ── */
function PushNotification({ title, body, time, emoji }: { title: string; body: string; time: string; emoji: string }) {
  return (
    <div className="flex items-start gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3.5 shadow-lg border border-gray-100/80">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center flex-shrink-0 text-lg shadow-md">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs font-black text-gray-900 uppercase tracking-wide">EXTRA</span>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{time}</span>
        </div>
        <p className="text-xs font-bold text-gray-800 leading-snug">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{body}</p>
      </div>
    </div>
  );
}

export default function HoeWerktDagbetaling() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = "Dagbetaling: direct grip op je inkomsten | EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Ontdek hoe dagbetaling werkt bij EXTRA. Na elke shift staat je salaris de volgende ochtend klaar in Jixbee. Transparant, veilig en volledig inzichtelijk via de app.");
    setMeta("og:title", "Dagbetaling bij EXTRA — direct grip op je inkomsten", true);
    setMeta("og:description", "Geen einde-van-de-maand wachten. Werk een shift, en je voorschot staat direct klaar. Lees hoe dagbetaling via Jixbee werkt.", true);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-purple-500/5 border-b border-purple-100/50" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/landing">
              <img src={extraLogoWit} alt="EXTRA logo" className={`h-9 sm:h-10 w-auto cursor-pointer transition-all ${scrolled ? "brightness-0" : ""}`} />
            </Link>
            <div className="hidden lg:flex items-center gap-6">
              {[
                { label: "Ik zoek extra werk", href: "/ik-zoek-extra-werk" },
                { label: "EXTRAATJE", href: "/extraatje" },
                { label: "Werkwijze", href: "/hoe-extra-werkt" },
                { label: "Ons Team", href: "/over-extra/ons-team" },
              ].map(({ label, href }) => (
                <a key={label} href={href} className={`text-[16px] font-bold transition-colors ${scrolled ? "text-gray-700 hover:text-purple-600" : "text-white/90 hover:text-white"}`}>
                  {label}
                </a>
              ))}
              <a href="/aanmelden" className={`ml-2 text-[16px] font-black px-7 py-3 rounded-full transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 ${scrolled ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white" : "bg-white text-purple-700 border-2 border-white"}`}>
                Aanmelden <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className={scrolled ? "text-gray-900" : "text-white"} size={28} /> : <Menu className={scrolled ? "text-gray-900" : "text-white"} size={28} />}
            </button>
          </div>
        </div>
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="bg-white border-t border-gray-100 shadow-xl px-5 py-4 space-y-1">
            {[
              { label: "Ik zoek extra werk", href: "/ik-zoek-extra-werk" },
              { label: "EXTRAATJE", href: "/extraatje" },
              { label: "Werkwijze", href: "/hoe-extra-werkt" },
              { label: "Ons Team", href: "/over-extra/ons-team" },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="block px-4 py-3 rounded-xl text-gray-800 font-bold hover:bg-purple-50 transition-colors">{label}</a>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <a href="/aanmelden" className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold px-6 py-3.5 rounded-2xl">
                <ArrowRight className="w-4 h-4" /> Aanmelden
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}>
        <XPatternBg />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-fuchsia-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-white/90 text-xs font-semibold">Dagbetaling via Jixbee</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.05] mb-6" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Dagbetaling:<br />
              <span className="relative inline-block">
                <span className="relative z-10">direct grip</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
              {" "}op je inkomsten
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/90 max-w-lg leading-relaxed font-medium mb-8">
              Na elke gewerkte shift zie je direct wat je hebt verdiend en staat jouw voorschot klaar in Jixbee. Supersnel, transparant en volledig geregeld via EXTRA.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/aanmelden" className="group bg-white text-purple-900 font-bold px-7 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Meld je aan in 2 minuten <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#hoe-het-werkt" className="border-2 border-white/30 text-white font-bold px-7 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2 justify-center">
                Hoe het werkt <ChevronDown className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right – Jixbee mockup */}
          <div className="relative flex justify-center items-center">
            <div className="relative" style={{ animation: "float 4s ease-in-out infinite" }}>
              <img
                src={jixbeePayout}
                alt="Jixbee payout – uitbetaling succesvol"
                className="w-[220px] sm:w-[270px] lg:w-[300px] drop-shadow-2xl rounded-[2.5rem]"
              />
              {/* floating badge */}
              <div className="absolute -top-4 -right-6 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-purple-100">
                💸 €750,- uitbetaald
              </div>
              <div className="absolute -bottom-2 -left-8 bg-white rounded-2xl shadow-xl px-3 py-2 text-xs font-black text-gray-900 whitespace-nowrap border border-purple-100">
                ✅ Uren goedgekeurd
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </section>

      {/* ══════════════════════════════════════════════
          2. HOE WERKT HET – 3 STAPPEN
      ══════════════════════════════════════════════ */}
      <section id="hoe-het-werkt" className="relative bg-white py-20 sm:py-28 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-14 sm:mb-20">
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                Stap voor stap
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Hoe werkt dagbetaling?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto text-base sm:text-lg">
                Van shift tot geld op je rekening — in drie simpele stappen.
              </p>
            </div>
          </RevealSection>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Steps */}
            <div className="space-y-6">
              {[
                {
                  num: "01",
                  icon: CalendarCheck,
                  title: "Je hebt gewerkt",
                  desc: "Je werkt een shift en meldt je via de EXTRA app af. Jouw uren worden automatisch geregistreerd.",
                  color: "from-violet-500 to-purple-600",
                  bg: "from-violet-50 to-purple-50",
                  border: "border-violet-200",
                },
                {
                  num: "02",
                  icon: Clock,
                  title: "Wij keuren je uren goed",
                  desc: "De uren komen bij ons binnen. EXTRA HQ keurt ze handmatig goed — snel, zorgvuldig en transparant.",
                  color: "from-blue-500 to-indigo-600",
                  bg: "from-blue-50 to-indigo-50",
                  border: "border-blue-200",
                },
                {
                  num: "03",
                  icon: Banknote,
                  title: "Voorschot direct beschikbaar in Jixbee",
                  desc: (
                    <span>
                      <strong>Loonheffing AAN:</strong> €75 direct beschikbaar.<br />
                      <strong>Loonheffing UIT:</strong> 50% van de verdiende shift.<br />
                      Het bedrag verschijnt automatisch in je Jixbee-wallet. Het restbedrag volgt via het reguliere loon.
                    </span>
                  ),
                  color: "from-green-500 to-emerald-600",
                  bg: "from-green-50 to-emerald-50",
                  border: "border-green-200",
                },
              ].map(({ num, icon: Icon, title, desc, color, bg, border }, i) => (
                <RevealSection key={num} delay={i * 100}>
                  <div className={`flex gap-5 bg-gradient-to-br ${bg} rounded-3xl p-6 border-2 ${border} hover:shadow-lg transition-all`}>
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {i < 2 && <div className="w-0.5 h-6 bg-gradient-to-b from-gray-300 to-transparent mt-2" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Stap {num}</div>
                      <h3 className="text-lg font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>

            {/* Jixbee uren mockup */}
            <RevealSection delay={150} className="flex justify-center">
              <div className="relative" style={{ animation: "float 5s ease-in-out infinite" }}>
                <img
                  src={jixbeeUren}
                  alt="Jixbee app – gewerkte uren overzicht"
                  className="w-[220px] sm:w-[260px] drop-shadow-2xl rounded-[2.5rem]"
                />
                <div className="absolute -top-3 -right-8 bg-white rounded-xl shadow-lg px-3 py-2 text-xs font-black text-gray-900 border border-purple-100 whitespace-nowrap">
                  ⏱ 30 uur · €450 verdiend
                </div>
                <div className="absolute -bottom-3 -left-6 bg-white rounded-xl shadow-lg px-3 py-2 text-xs font-black text-gray-900 border border-green-100 whitespace-nowrap">
                  💳 €400 reeds uitbetaald
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          3. PUSH NOTIFICATIES
      ══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #f0ebff 100%)" }}>
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                Real-time meldingen
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Altijd op de hoogte
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto text-base sm:text-lg">
                Je ontvangt direct een melding zodra je uren zijn goedgekeurd of je geld klaar staat.
              </p>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 gap-8 items-center">
            {/* iPhone frame */}
            <RevealSection delay={100}>
              <div className="relative max-w-[280px] mx-auto">
                {/* iPhone outline */}
                <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-gray-100 rounded-[2.5rem] overflow-hidden">
                    {/* status bar */}
                    <div className="bg-gray-100 px-6 pt-4 pb-2 flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-900">9:41</span>
                      <div className="w-20 h-5 bg-gray-900 rounded-full" />
                      <div className="flex gap-1 items-center">
                        <div className="w-3 h-2 border border-gray-900 rounded-sm"><div className="w-1.5 h-1 bg-gray-900 rounded-sm ml-auto" /></div>
                      </div>
                    </div>
                    {/* lock screen */}
                    <div className="bg-gradient-to-b from-gray-100 to-gray-200 px-3 pb-6 pt-2 space-y-2 min-h-[320px]">
                      <p className="text-center text-xs text-gray-500 font-medium mb-3">Vandaag</p>
                      <PushNotification emoji="✔️" title="Je uren bij Marriott zijn goedgekeurd" body="30 uur · Week 2 · €450,- verdiend" time="Nu" />
                      <PushNotification emoji="💸" title="€150,- staat klaar in je Jixbee account" body="Voorschot beschikbaar — open Jixbee om op te nemen" time="2 min" />
                      <PushNotification emoji="🚀" title="Voorschot uitbetaald" body="Check je Jixbee app voor het overzicht" time="5 min" />
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Explanation */}
            <RevealSection delay={200}>
              <div className="space-y-5">
                {[
                  { emoji: "✔️", title: "Uren goedgekeurd", desc: "Zodra EXTRA HQ jouw uren heeft goedgekeurd, ontvang je direct een pushmelding op je telefoon.", color: "bg-green-100 text-green-700" },
                  { emoji: "💸", title: "Voorschot klaarstaat", desc: "Je krijgt een melding zodra het voorschot beschikbaar is in je Jixbee-wallet. Klik en je hebt het.", color: "bg-blue-100 text-blue-700" },
                  { emoji: "🚀", title: "Geld uitbetaald", desc: "Bevestiging zodra de uitbetaling is verwerkt. Volledig transparant, altijd inzichtelijk.", color: "bg-purple-100 text-purple-700" },
                ].map(({ emoji, title, desc, color }) => (
                  <div key={title} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg flex-shrink-0`}>
                      {emoji}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm mb-1">{title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          4. WAAROM DAGBETALING WERKT – 4 VOORDELEN
      ══════════════════════════════════════════════ */}
      <section className="relative bg-white py-20 sm:py-28 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                Jouw voordelen
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Waarom dagbetaling werkt
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-7">
            {[
              {
                icon: Zap,
                title: "Meteen je geld",
                desc: "Geen wachttijd, direct controle over je inkomsten. Jij bepaalt wanneer je opmikt.",
                bg: "from-violet-50 to-purple-50",
                border: "border-violet-200",
                iconBg: "bg-violet-100",
                iconColor: "text-violet-600",
                tag: "⚡ Dagelijks",
              },
              {
                icon: Eye,
                title: "Super transparant",
                desc: "Je ziet altijd exact hoeveel je hebt verdiend, uitbetaald en open hebt staan via de EXTRA app.",
                bg: "from-blue-50 to-indigo-50",
                border: "border-blue-200",
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
                tag: "👁 Real-time inzicht",
              },
              {
                icon: Shield,
                title: "100% veilig payroll systeem",
                desc: "Alles via gecertificeerde payroll — geen verrassingen achteraf. Volledig conform wetgeving.",
                bg: "from-green-50 to-emerald-50",
                border: "border-green-200",
                iconBg: "bg-green-100",
                iconColor: "text-green-600",
                tag: "🔒 Gecertificeerd",
              },
              {
                icon: CalendarCheck,
                title: "Werkt elke dag + weekend",
                desc: "Dagbetaling werkt 7 dagen per week, automatisch. Ook op zaterdag en zondag.",
                bg: "from-orange-50 to-amber-50",
                border: "border-orange-200",
                iconBg: "bg-orange-100",
                iconColor: "text-orange-600",
                tag: "📅 7 dagen per week",
              },
            ].map(({ icon: Icon, title, desc, bg, border, iconBg, iconColor, tag }, i) => (
              <RevealSection key={title} delay={i * 80}>
                <div className={`group bg-gradient-to-br ${bg} rounded-3xl p-7 sm:p-9 border-2 ${border} hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full`}>
                  <div className="flex items-center justify-between mb-5">
                    <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${iconBg} ${iconColor}`}>{tag}</span>
                    <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          5. FAQ
      ══════════════════════════════════════════════ */}
      <section id="faq" className="py-20 sm:py-28 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #f0ebff 100%)" }}>
        <XPatternBg />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                Veelgestelde vragen
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Alles wat je wil weten
              </h2>
            </div>
          </RevealSection>
          <div className="space-y-3">
            {[
              {
                q: "Hoe werkt dagbetaling met loonheffing aan of uit?",
                a: "Als je loonheffingskorting aan hebt staan, wordt er €75 als voorschot beschikbaar gesteld. Heb je loonheffing uit? Dan ontvang je 50% van de verdiende shift als voorschot. Het resterende bedrag wordt verwerkt in je reguliere maandloon.",
              },
              {
                q: "Wat gebeurt er als er onduidelijkheid is over mijn uren?",
                a: "Bij onduidelijkheid neemt EXTRA contact met je op voordat de uren worden goedgekeurd. Jij wordt altijd op de hoogte gesteld via de app en e-mail. Jouw uren worden pas uitbetaald na bevestiging.",
              },
              {
                q: "Kan het voorschot lager of hoger zijn dan verwacht?",
                a: "Het voorschotbedrag is afhankelijk van je loonheffingssituatie en de gewerkte uren. Bij loonheffing aan is het altijd €75. Bij loonheffing uit is het 50% van de shift. Het exacte bedrag zie je altijd terug in de EXTRA app.",
              },
              {
                q: "Hoe snel staat het voorschot op mijn rekening?",
                a: "Zodra EXTRA HQ jouw uren heeft goedgekeurd, staat het voorschot direct klaar in je Jixbee-wallet. Vanaf daar kun je het direct opnemen naar je bankrekening — dit duurt meestal enkele minuten.",
              },
              {
                q: "Moet ik iets doen om dagbetaling te activeren?",
                a: "Nee — dagbetaling is standaard actief via Jixbee zodra je bij EXTRA werkt. Je ontvangt bij onboarding een uitleg en toegang tot de Jixbee-app. Daarna werkt alles automatisch.",
              },
            ].map(({ q, a }) => (
              <RevealSection key={q}>
                <FaqItem q={q} a={a} />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          6. CTA AFSLUITER
      ══════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.98) 0%, rgba(109,40,217,0.95) 50%, rgba(124,58,237,0.90) 100%)" }}>
        <XPatternBg />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <RevealSection>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8 border border-white/20">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-white/90 text-xs font-semibold">Direct uitbetaald na elke shift</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om direct voor je werk betaald te worden?
            </h2>
            <p className="text-purple-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Meld je aan in 2 minuten en start met werken op de mooiste hotellocaties — met dagbetaling via Jixbee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/aanmelden" className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center justify-center gap-2">
                Meld je aan in 2 minuten <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/ik-zoek-extra-werk#functies" className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center justify-center gap-2">
                Bekijk functies <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-white py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <img src={extraLogoWit} alt="EXTRA" className="h-8 w-auto opacity-80" />
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <Link href="/ik-zoek-extra-werk" className="hover:text-purple-400 transition-colors">Ik zoek werk</Link>
              <Link href="/extraatje" className="hover:text-purple-400 transition-colors">EXTRAATJE</Link>
              <Link href="/hoe-extra-werkt" className="hover:text-purple-400 transition-colors">Werkwijze</Link>
              <Link href="/over-extra/ons-team" className="hover:text-purple-400 transition-colors">Ons team</Link>
              <Link href="/aanmelden" className="hover:text-purple-400 transition-colors">Aanmelden</Link>
            </div>
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} EXTRA. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
