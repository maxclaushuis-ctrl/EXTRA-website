import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import {
  Users, ArrowRight, Camera, Music, Hotel, Lightbulb,
  BookOpen, Zap, Smile, Smartphone, Trophy, MapPin, ChevronDown
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
      { threshold: 0.06, rootMargin: "0px 0px -40px 0px" }
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

function XPatternBg({ color = "rgba(139,92,246,1)", opacity = 0.07 }: { color?: string; opacity?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[
        { left: "3%", top: "5%", w: 180, rot: 12 },
        { left: "78%", top: "8%", w: 140, rot: -10 },
        { left: "50%", top: "72%", w: 160, rot: 22 },
      ].map((x, i) => (
        <div key={i} className="absolute" style={{
          left: x.left, top: x.top, width: x.w, height: x.w,
          transform: `rotate(${x.rot}deg)`, opacity,
          WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          backgroundColor: color,
        }} />
      ))}
    </div>
  );
}

function PhotoPlaceholder({ initials, gradient }: { initials: string; gradient: string }) {
  return (
    <div className={`relative w-full aspect-[3/4] bg-gradient-to-br ${gradient} flex flex-col items-center justify-center overflow-hidden rounded-t-2xl sm:rounded-t-3xl`}>
      <div className="absolute inset-0 opacity-10" style={{
        background: "repeating-linear-gradient(45deg, transparent, transparent 24px, rgba(255,255,255,0.15) 24px, rgba(255,255,255,0.15) 25px)"
      }} />
      <span className="absolute text-[8rem] font-black text-white/10 select-none leading-none">{initials}</span>
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <span className="text-white/70 text-xs font-bold tracking-widest uppercase">Foto volgt</span>
      </div>
    </div>
  );
}

type Tag = { emoji: string; label: string };

type Member = {
  naam: string;
  functie: string;
  initials: string;
  gradient: string;
  accentColor: string;
  shadowColor: string;
  bio: string;
  tags: Tag[];
  fullBio: string;
};

const team: Member[] = [
  {
    naam: "Max",
    functie: "Eigenaar & Sales",
    initials: "MA",
    gradient: "from-purple-600 via-violet-600 to-indigo-500",
    accentColor: "text-purple-600",
    shadowColor: "shadow-purple-500/20",
    bio: "Ideeën heeft Max altijd genoeg, meestal een stuk of tien tegelijk en vaak nog een paar extra onderweg. Als eigenaar van EXTRA en verantwoordelijk voor sales is hij continu bezig met nieuwe kansen, slimme verbeteringen en manieren om dingen nét iets beter te doen dan gisteren.",
    tags: [
      { emoji: "🏆", label: "Competitief, ook buiten werk" },
      { emoji: "📍", label: "Favoriete tent: Bar Buuf" },
      { emoji: "💡", label: "Bekend om: tien ideeën tegelijk" },
    ],
    fullBio: "Ideeën heeft Max altijd genoeg, meestal een stuk of tien tegelijk en vaak nog een paar extra onderweg. Als eigenaar van EXTRA en verantwoordelijk voor sales is hij continu bezig met nieuwe kansen, slimme verbeteringen en manieren om dingen nét iets beter te doen dan gisteren. Nieuwe technologie en handige tools probeert hij het liefst meteen uit, zolang het maar helpt om het werk slimmer en sneller te maken.\n\nBuiten kantoor is Max net zo enthousiast over de horeca als binnen. Een goed restaurant, een volle tafel en een gezellige avond slaan ze bij hem zelden over. En als er iets te vieren valt, is de kans groot dat hij degene is die zegt: \"Nog eentje dan.\"",
  },
  {
    naam: "Eveline",
    functie: "Operations Manager",
    initials: "EV",
    gradient: "from-fuchsia-500 via-purple-500 to-violet-600",
    accentColor: "text-fuchsia-600",
    shadowColor: "shadow-fuchsia-500/20",
    bio: "Als er iemand is die overzicht houdt, is het Eveline wel. Goed georganiseerd, scherp en een echte aanpakker die niet snel het kaas van haar brood laat eten. Binnen EXTRA weet ze precies wat er speelt — er ontgaat haar weinig en vaak is ze al op de hoogte voordat iemand anders het doorheeft.",
    tags: [
      { emoji: "📚", label: "Boekenworm" },
      { emoji: "⚡", label: "Aanpakker" },
      { emoji: "💡", label: "Bekend om: altijd overal van op de hoogte" },
    ],
    fullBio: "Als er iemand is die overzicht houdt, is het Eveline wel. Goed georganiseerd, scherp en een echte aanpakker die niet snel het kaas van haar brood laat eten. Binnen EXTRA weet ze precies wat er speelt — er ontgaat haar weinig en vaak is ze al op de hoogte voordat iemand anders het doorheeft.\n\nEveline is recht voor de raap en houdt van duidelijkheid. Dat maakt haar niet alleen een sterke sparringpartner binnen het team, maar ook iemand die ervoor zorgt dat plannen daadwerkelijk worden uitgevoerd. EXTRA zit haar duidelijk in het bloed — soms lijkt het bijna alsof ze er zelfs over droomt.\n\nEn als het werk erop zit? Dan duikt Eveline net zo graag in een goed boek. Een echte boekenworm die net zo enthousiast kan worden van een sterk verhaal als van een goed georganiseerde planning.",
  },
  {
    naam: "Charlotte",
    functie: "Hotel & Housekeeping specialist",
    initials: "CH",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-400",
    accentColor: "text-rose-600",
    shadowColor: "shadow-rose-500/20",
    bio: "Charlotte ademt hotels. Met een achtergrond van de hotelschool voelt hospitality voor haar als tweede natuur. Binnen EXTRA staat ze bekend om haar scherpe oog voor detail en haar liefde voor structuur — niets ontgaat haar en alles moet kloppen, tot in de kleinste puntjes.",
    tags: [
      { emoji: "🎼", label: "Fan van klassieke muziek" },
      { emoji: "🏨", label: "Hotelhart" },
      { emoji: "💡", label: "Bekend om: oog voor elk detail" },
    ],
    fullBio: "Charlotte ademt hotels. Met een achtergrond van de hotelschool voelt hospitality voor haar als tweede natuur. Binnen EXTRA staat ze bekend om haar scherpe oog voor detail en haar liefde voor structuur — niets ontgaat haar en alles moet kloppen, tot in de kleinste puntjes.\n\nWaar anderen chaos zien, ziet Charlotte overzicht. Ze wordt oprecht blij van een strakke planning en een goed georganiseerd proces. En terwijl ze dat allemaal regelt, gaat ze meestal neuriënd door de dag — zingen doet ze namelijk ook buiten werk, in een koor.\n\nOoit wil Charlotte haar eigen hotel openen. Tot die tijd zorgt ze er bij EXTRA voor dat alles loopt zoals het hoort: gestructureerd, gastvrij en tot in de puntjes verzorgd.",
  },
  {
    naam: "Lea",
    functie: "Recruiter & Kandidaatrelaties",
    initials: "LE",
    gradient: "from-amber-400 via-orange-500 to-rose-400",
    accentColor: "text-orange-600",
    shadowColor: "shadow-orange-500/20",
    bio: "Lea is de verbinder van het team. Altijd met een lach, altijd behulpzaam en iemand bij wie mensen zich meteen op hun gemak voelen. Of het nu collega's, kandidaten of opdrachtgevers zijn — Lea zorgt dat iedereen zich gezien en gehoord voelt.",
    tags: [
      { emoji: "😊", label: "Altijd met een lach" },
      { emoji: "📱", label: "Onze TikTok ster" },
      { emoji: "💡", label: "Bekend om: mensen verbinden" },
    ],
    fullBio: "Lea is de verbinder van het team. Altijd met een lach, altijd behulpzaam en iemand bij wie mensen zich meteen op hun gemak voelen. Of het nu collega's, kandidaten of opdrachtgevers zijn — Lea zorgt dat iedereen zich gezien en gehoord voelt.\n\nNaast haar rol op kantoor staat ze ook regelmatig zelf op de vloer. Niet alleen om te helpen, maar ook om te blijven voelen hoe het er in de praktijk aan toe gaat. Daardoor weet ze precies hoe alles reilt en zeilt en waar we dingen nog beter kunnen maken.\n\nEn buiten het plannen en verbinden is Lea ook onze onofficiële TikTok ster. Waar zij verschijnt, gebeurt er meestal wel iets dat het delen waard is.",
  },
];

function TeamCard({ member, delay }: { member: Member; delay: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <RevealSection delay={delay}>
      <article className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 hover:border-purple-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

        <PhotoPlaceholder initials={member.initials} gradient={member.gradient} />

        <div className="p-6 sm:p-8 flex flex-col flex-1">
          <div className="mb-4">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {member.naam}
            </h3>
            <p className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${member.accentColor}`}>{member.functie}</p>
          </div>

          <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-5 flex-1">
            {expanded
              ? member.fullBio.split("\n\n").map((p, i) => <span key={i}>{p}{i < member.fullBio.split("\n\n").length - 1 && <><br /><br /></>}</span>)
              : member.bio
            }
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold mb-5 transition-colors ${member.accentColor} hover:opacity-70`}
          >
            {expanded ? "Lees minder" : "Lees meer"}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            {member.tags.map((tag, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-base leading-none">{tag.emoji}</span>
                <span className="text-xs text-gray-500 font-medium">{tag.label}</span>
              </div>
            ))}
          </div>
        </div>
      </article>
    </RevealSection>
  );
}

export default function OnsTeam() {
  useEffect(() => {
    document.title = "Ons Team | De mensen achter EXTRA | doehetextra.nl";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Maak kennis met het team achter EXTRA. Max, Eveline, Charlotte en Lea zorgen elke dag dat de beste horecamedewerkers matchen met de mooiste opdrachtgevers in Amsterdam.");
    setMeta("og:title", "Ons Team: De mensen achter EXTRA", true);
    setMeta("og:description", "Maak kennis met het team achter EXTRA Hospitality Staffing.", true);

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://www.doehetextra.nl/ons-team";

    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "EXTRA Hospitality Staffing",
      "url": "https://www.doehetextra.nl",
      "employee": team.map(m => ({
        "@type": "Person", "name": m.naam, "jobTitle": m.functie,
        "worksFor": { "@type": "Organization", "name": "EXTRA Hospitality Staffing" }
      }))
    };
    let scriptEl = document.querySelector("#ons-team-schema") as HTMLScriptElement;
    if (!scriptEl) { scriptEl = document.createElement("script"); scriptEl.id = "ons-team-schema"; scriptEl.type = "application/ld+json"; document.head.appendChild(scriptEl); }
    scriptEl.textContent = JSON.stringify(schema);
    return () => { canonical?.remove(); scriptEl?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PublicNav forceDark={false} />

      {/* ═══════════════════════════════════════ */}
      {/* HERO                                   */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]">
        <XPatternBg color="rgba(255,255,255,0.9)" opacity={0.07} />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-fuchsia-600/10 pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-32 sm:pt-40 pb-20 sm:pb-28">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
              <Users className="w-4 h-4" /> Ons team
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              De mensen achter{" "}
              <span className="relative inline-block">
                <span className="relative z-10">EXTRA</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/80 max-w-2xl leading-relaxed mb-10">
              Wij zijn geen anoniem bureau. Elk vraagstuk, elke kandidaat en elke opdrachtgever krijgt een menselijk gezicht. Maak kennis met het kleine team dat grote dingen doet.
            </p>
            <div className="flex flex-wrap gap-3">
              {["4 mensen", "1 missie", "100% hospitality", "Amsterdam"].map(tag => (
                <span key={tag} className="text-xs font-bold bg-white/10 border border-white/15 text-white/90 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* TEAM GRID                              */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg color="rgba(139,92,246,1)" opacity={0.07} />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Users className="w-4 h-4" /> Maak kennis
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Het team
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">
                Klein team, groot resultaat. Ieder met zijn eigen specialiteit, samen zorgen we dat alles klopt.
              </p>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {team.map((member, i) => (
              <TeamCard key={member.naam} member={member} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* MISSIE SECTIE                          */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-white">
        <XPatternBg color="rgba(139,92,246,1)" opacity={0.05} />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                Onze aanpak
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Bij EXTRA draait alles om mensen
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-sm sm:text-base mb-8">
                <p>Wij zijn geen anoniem bureau. Elk vraagstuk, elke planning en elke medewerker krijgt een menselijk gezicht. Snel schakelen, direct contact, oprechte aandacht.</p>
                <p>Flexibiliteit zit in ons DNA. We denken in oplossingen en in mensen. En we kennen onze medewerkers echt — van hun sterke kanten tot wat ze drijft.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {["Hospitality specialist", "Direct contact", "Persoonlijk", "Snel schakelen"].map(tag => (
                  <span key={tag} className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">{tag}</span>
                ))}
              </div>
            </RevealSection>

            <RevealSection delay={150}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { num: "800+", label: "Actieve medewerkers", color: "from-purple-600 to-violet-600" },
                  { num: "4,8", label: "Google reviews", color: "from-amber-400 to-orange-500" },
                  { num: "4", label: "Gepassioneerde teamleden", color: "from-fuchsia-500 to-pink-500" },
                  { num: "100%", label: "In loondienst", color: "from-emerald-500 to-teal-500" },
                ].map(({ num, label, color }) => (
                  <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 sm:p-6 text-white`}>
                    <p className="text-2xl sm:text-3xl font-black leading-none mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{num}</p>
                    <p className="text-xs sm:text-sm font-semibold text-white/80 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* CTA                                    */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950" />
        <XPatternBg color="rgba(255,255,255,0.9)" opacity={0.08} />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
              Werken bij EXTRA?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Word onderdeel{" "}
              <span className="relative inline-block">
                <span className="relative z-10">van ons team</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-10 max-w-xl mx-auto leading-relaxed">
              Ben jij de aanvulling die ons team nodig heeft? Bekijk onze openstaande vacatures of neem direct contact op.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center">
              <Link
                href="/vacatures"
                className="group inline-flex items-center justify-center gap-2.5 bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 transition-all"
              >
                Bekijk vacatures
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2.5 border-2 border-white/25 text-white font-bold px-8 py-4 rounded-full text-base hover:bg-white/10 hover:-translate-y-0.5 transition-all"
              >
                Neem contact op
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
