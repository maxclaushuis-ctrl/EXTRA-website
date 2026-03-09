import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import {
  Users, ArrowRight, ChevronRight, Zap, Heart,
  Star, Coffee, Trophy, Flame, Camera, Sparkles, Award
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";

/* ─────────────────────────────────────────────
   ANIMATION HELPERS
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   X-PATTERN BACKGROUNDS
───────────────────────────────────────────── */
function XPatternBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[
        { left: "4%", top: "8%", w: 180, rot: 15, op: 0.07 },
        { left: "76%", top: "12%", w: 140, rot: -8, op: 0.05 },
        { left: "46%", top: "70%", w: 160, rot: 25, op: 0.06 },
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

/* ─────────────────────────────────────────────
   PHOTO PLACEHOLDER
───────────────────────────────────────────── */
function PhotoPlaceholder({ initials, color, size = "md" }: { initials: string; color: string; size?: "md" | "lg" }) {
  const height = size === "lg" ? "h-72 sm:h-80" : "h-56 sm:h-64";
  return (
    <div className={`relative w-full ${height} bg-gradient-to-br ${color} flex flex-col items-center justify-center overflow-hidden`}>
      {/* decorative diagonal stripe */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          background: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.15) 20px, rgba(255,255,255,0.15) 21px)"
        }} />
      </div>
      {/* faded initials */}
      <span className="absolute text-[7rem] font-black text-white/10 select-none leading-none">
        {initials}
      </span>
      {/* camera icon + label */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <span className="text-white/80 text-xs font-bold tracking-widest uppercase">Foto volgt</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TEAM DATA
───────────────────────────────────────────── */
type Member = {
  naam: string;
  functie: string;
  initials: string;
  color: string;
  shadowColor: string;
  bio: string;
  badge: string;
  badgeIcon: React.ElementType;
  badgeBg: string;
  badgeText: string;
  fun: string;
  dept: string;
  deptColor: string;
};

const team: Member[] = [
  {
    naam: "Eveline",
    functie: "Operations Manager",
    initials: "EV",
    color: "from-violet-600 via-purple-600 to-fuchsia-500",
    shadowColor: "shadow-violet-500/25",
    bio: "Geen obstakel is te hoog voor Eveline. Ze schakelt sneller dan je wifi op kantoor en staat bekend om haar 'komt goed'-mentaliteit. De motor die EXTRA draaiende houdt.",
    badge: "Onverslaanbaar",
    badgeIcon: Flame,
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    fun: "Kan elke situatie omtoveren tot een kans 🚀",
    dept: "Operations",
    deptColor: "bg-violet-100 text-violet-700",
  },
  {
    naam: "Jayden",
    functie: "Planner",
    initials: "JA",
    color: "from-blue-500 via-cyan-500 to-sky-400",
    shadowColor: "shadow-blue-500/25",
    bio: "Jayden plant niet alleen mensen in, hij plant chaos uit. Als iemand last-minute uitvalt, heeft hij al een oplossing voordat jij 'no-show' kunt zeggen.",
    badge: "Last-minute held",
    badgeIcon: Zap,
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    fun: "Heeft waarschijnlijk al jouw volgende shift gepland 📅",
    dept: "Planning",
    deptColor: "bg-blue-100 text-blue-700",
  },
  {
    naam: "Lotte",
    functie: "Recruiter",
    initials: "LO",
    color: "from-pink-500 via-rose-500 to-red-400",
    shadowColor: "shadow-pink-500/25",
    bio: "Lotte spot talent van drie kilometer afstand. Ze weet precies wie waar past. Haar motto: 'Iedereen heeft een EXTRAatje, je moet 'm alleen even vinden.'",
    badge: "Talentspotter",
    badgeIcon: Star,
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-700",
    fun: "Heeft meer mensen gescout dan een voetbalmakelaar 🌟",
    dept: "Recruitment",
    deptColor: "bg-pink-100 text-pink-700",
  },
  {
    naam: "Milan",
    functie: "Klantenmanager",
    initials: "MI",
    color: "from-emerald-500 via-green-500 to-teal-400",
    shadowColor: "shadow-emerald-500/25",
    bio: "Milan is de brug tussen klanten en medewerkers. Altijd positief, altijd strak geregeld. Hij kent onze klanten bij naam, en soms ook hun honden.",
    badge: "Klantkampioen",
    badgeIcon: Trophy,
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    fun: "Onthoudt elke verjaardag van elke klant 🎂",
    dept: "Account Management",
    deptColor: "bg-green-100 text-green-700",
  },
  {
    naam: "Sanne",
    functie: "HR & Medewerkerszaken",
    initials: "SA",
    color: "from-amber-500 via-yellow-500 to-orange-400",
    shadowColor: "shadow-amber-500/25",
    bio: "Bij Sanne is je verhaal altijd veilig. Ze zorgt dat medewerkers zich gehoord voelen en dat EXTRA een plek is waar je echt jezelf kunt zijn.",
    badge: "People person",
    badgeIcon: Heart,
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-700",
    fun: "Heeft nog nooit een e-mail onbeantwoord gelaten ✉️",
    dept: "HR",
    deptColor: "bg-amber-100 text-amber-700",
  },
  {
    naam: "Daan",
    functie: "Account Manager Hospitality",
    initials: "DA",
    color: "from-indigo-500 via-blue-500 to-violet-500",
    shadowColor: "shadow-indigo-500/25",
    bio: "Daan weet alles van de hospitality-sector. Van sterrenzaken tot boutique hotels. Hij snapt wat klanten nodig hebben, vaak voordat ze het zelf weten.",
    badge: "Hospitality pro",
    badgeIcon: Award,
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
    fun: "Heeft in meer keukens gestaan dan de meeste koks 👨‍🍳",
    dept: "Account Management",
    deptColor: "bg-indigo-100 text-indigo-700",
  },
  {
    naam: "Yara",
    functie: "Marketing & Communicatie",
    initials: "YA",
    color: "from-fuchsia-500 via-pink-500 to-rose-400",
    shadowColor: "shadow-fuchsia-500/25",
    bio: "Yara maakt van EXTRA een merk dat je voelt. Van social media tot campagnes, zij geeft EXTRA haar stem en een gave voor verhalen die echt raken.",
    badge: "Storyteller",
    badgeIcon: Sparkles,
    badgeBg: "bg-fuchsia-100",
    badgeText: "text-fuchsia-700",
    fun: "Vindt in elke situatie een goede caption 📸",
    dept: "Marketing",
    deptColor: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    naam: "Remi",
    functie: "Finance & Administratie",
    initials: "RE",
    color: "from-teal-500 via-cyan-500 to-sky-400",
    shadowColor: "shadow-teal-500/25",
    bio: "Remi houdt EXTRA scherp. Cijfers zijn zijn taal, nauwkeurigheid zijn superkracht. Terwijl de rest bezig is met buiten, klopt alles binnen tot op de cent.",
    badge: "Cijferaar",
    badgeIcon: Zap,
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-700",
    fun: "Heeft elk budget altijd on point 💰",
    dept: "Finance",
    deptColor: "bg-teal-100 text-teal-700",
  },
  {
    naam: "Nina",
    functie: "Trainer & Onboarding",
    initials: "NI",
    color: "from-orange-500 via-red-500 to-rose-500",
    shadowColor: "shadow-orange-500/25",
    bio: "Nina zorgt dat nieuwe medewerkers van dag één het gevoel hebben dat ze thuis zijn. Ze traint, begeleidt en motiveert, met een energie die aanstekelijk is.",
    badge: "Coach",
    badgeIcon: Coffee,
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    fun: "Heeft de beste onboarding-playlist van het kantoor 🎵",
    dept: "Training",
    deptColor: "bg-orange-100 text-orange-700",
  },
];

/* ─────────────────────────────────────────────
   TEAM CARD (PORTRAIT STYLE)
───────────────────────────────────────────── */
function TeamCard({ m, delay, size = "md" }: { m: Member; delay: number; size?: "md" | "lg" }) {
  const [hovered, setHovered] = useState(false);
  const BadgeIcon = m.badgeIcon;

  return (
    <RevealSection delay={delay}>
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`group rounded-2xl sm:rounded-3xl overflow-hidden border-2 bg-white transition-all duration-400 ${
          hovered
            ? `border-transparent shadow-2xl ${m.shadowColor} -translate-y-2`
            : "border-purple-100 shadow-md"
        }`}
      >
        {/* ── PHOTO AREA ── */}
        <div className="relative overflow-hidden">
          <PhotoPlaceholder initials={m.initials} color={m.color} size={size} />
          {/* dept tag */}
          <span className={`absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${m.deptColor} backdrop-blur-sm`}>
            {m.dept}
          </span>
          {/* badge */}
          <span className={`absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${m.badgeBg} ${m.badgeText}`}>
            <BadgeIcon className="h-2.5 w-2.5" /> {m.badge}
          </span>
          {/* gradient overlay at bottom of photo */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* ── INFO ── */}
        <div className="px-5 pb-5 pt-2">
          <h3 className="text-lg font-black text-gray-900 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {m.naam}
          </h3>
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">{m.functie}</p>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">{m.bio}</p>
          <div className="border-t border-purple-100 pt-3">
            <p className="text-[11px] text-gray-400 italic leading-relaxed">{m.fun}</p>
          </div>
        </div>
      </article>
    </RevealSection>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function OnsTeam() {
  useEffect(() => {
    document.title = "Ons Team: De mensen achter EXTRA | EXTRA Hospitality Staffing";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Maak kennis met het team achter EXTRA, jong, energiek en gedreven. Ontdek wie elke dag zorgt dat de beste medewerkers matchen met de mooiste opdrachtgevers.");
    setMeta("og:title", "Ons Team: De mensen achter EXTRA", true);
    setMeta("og:description", "Jong horeca team met grote energie. Planners, recruiters, klantenmanagers en trainers die werken met passie voor hospitality.", true);

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://www.doehetextra.nl/over-extra/ons-team";

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

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}>
        <XPatternBgDark />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-32 sm:pt-40 pb-20 sm:pb-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.05] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              De mensen{" "}
              <span className="relative inline-block">
                <span className="relative z-10">achter EXTRA</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/90 max-w-xl leading-relaxed font-medium mb-8">
              Jong, energiek en een tikje eigenwijs. Dit zijn de {team.length} mensen die elke dag zorgen dat alles loopt zoals het moet lopen, en soms net een beetje EXTRA.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Operations", "Planning", "Recruitment", "HR", "Marketing", "Finance"].map(d => (
                <span key={d} className="text-xs font-bold bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INTRO QUOTE ── */}
      <section className="relative bg-white py-14 sm:py-20 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div className="lg:w-1/2">
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Ons team</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Bij EXTRA draait alles om mensen
                </h2>
                <p className="text-gray-600 leading-relaxed text-base sm:text-lg mb-6">
                  Wij zijn geen anoniem bureau. Elk vraagstuk, elke planning en elke medewerker krijgt een menselijk gezicht. Snel schakelen, direct contact, oprechte aandacht. Dat is hoe wij werken.
                </p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { num: `${team.length}`, label: "Teamleden" },
                    { num: "5+", label: "Steden" },
                    { num: "9+", label: "Jaar ervaring" },
                  ].map(({ num, label }) => (
                    <div key={label} className="bg-purple-50 rounded-2xl px-5 py-3 border border-purple-100 text-center min-w-[80px]">
                      <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{num}</p>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* decorative quote */}
              <div className="lg:w-1/2">
                <div className="relative bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-500 rounded-3xl p-8 sm:p-10 text-white overflow-hidden">
                  <XPatternBgDark />
                  <span className="text-6xl font-black text-white/20 leading-none absolute top-4 left-6">"</span>
                  <p className="relative z-10 text-lg sm:text-xl font-bold leading-relaxed mt-4">
                    Iedereen heeft een EXTRAatje, je moet 'm alleen even vinden.
                  </p>
                  <p className="relative z-10 text-white/70 text-sm mt-4 font-semibold">— Lotte, Recruiter</p>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FEATURED: TOP 3 ── */}
      <section className="py-10 sm:py-14" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Kernteam</span>
              <div className="flex-1 h-px bg-purple-100" />
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6">
            {team.slice(0, 3).map((m, i) => (
              <TeamCard key={m.naam} m={m} delay={i * 80} size="lg" />
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL TEAM GRID ── */}
      <section className="relative bg-white py-10 sm:py-14 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Het volledige team</span>
              <div className="flex-1 h-px bg-purple-100" />
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {team.slice(3).map((m, i) => (
              <TeamCard key={m.naam} m={m} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CULTUUR TEKST ── */}
      <section className="py-14 sm:py-20" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Onze cultuur</span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-3 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Wat maakt ons horeca team anders?
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-sm sm:text-base">
              <p>Het EXTRA team bestaat uit een mix van jonge professionals met één gemeenschappelijk doel: de beste medewerkers koppelen aan de mooiste opdrachtgevers in de hospitality. We werken snel, denken vooruit en communiceren helder.</p>
              <p>Flexibiliteit zit in ons DNA. Onze planners denken in oplossingen, onze recruiters denken in mensen en onze klantenmanagers denken in relaties.</p>
              <p>Wat ons echt uniek maakt? We geloven dat motivatie van binnenuit komt. Daarom bouwen we het EXTRAATJE puntensysteem, om medewerkers te belonen voor wie ze zijn en wat ze bijdragen.</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {["Jong team", "Hospitality specialist", "Snel schakelen", "Medewerkersgericht", "EXTRAATJE systeem"].map(tag => (
                <span key={tag} className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">{tag}</span>
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
              <Users className="w-4 h-4" /> Werken bij EXTRA?
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Onderdeel worden van dit team?
            </h2>
            <p className="text-purple-200/80 text-base sm:text-lg mb-8 leading-relaxed">
              Meld je aan als medewerker en begin vandaag nog, of vraag personeel aan voor jouw locatie.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/aanmelden" className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2">
                Aanmelden als medewerker <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/personeel-gezocht" className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2">
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
