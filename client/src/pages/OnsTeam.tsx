import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Users, ArrowRight, ChevronRight, Zap, Heart,
  Star, Coffee, Trophy, Flame, Check
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";
import xPatroon from "@assets/X_patroon_1771260543289.png";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
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
        <div
          key={i}
          className="absolute"
          style={{
            left: x.left, top: x.top, width: x.w, height: x.w,
            transform: `rotate(${x.rot}deg)`, opacity: x.op,
            WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
            WebkitMaskSize: "contain", maskSize: "contain",
            WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
            WebkitMaskPosition: "center", maskPosition: "center",
            backgroundColor: "rgba(139,92,246,1)",
          }}
        />
      ))}
    </div>
  );
}

type TeamMember = {
  naam: string;
  functie: string;
  initials: string;
  avatarColor: string;
  bio: string;
  badge: string;
  badgeIcon: React.ElementType;
  badgeBg: string;
  badgeText: string;
  fun: string;
};

const team: TeamMember[] = [
  {
    naam: "Eveline",
    functie: "Operations Manager",
    initials: "EV",
    avatarColor: "from-purple-500 to-violet-600",
    bio: "Geen obstakel is te hoog voor Eveline. Hoe groter de uitdaging, hoe meer energie ze krijgt. Ze schakelt sneller dan je wifi op kantoor en staat bekend om haar 'komt goed'-mentaliteit. Achter de schermen is zij de motor die EXTRA draaiende houdt.",
    badge: "Onverslaanbaar",
    badgeIcon: Flame,
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    fun: "Kan elke situatie omtoveren tot een kans 🚀",
  },
  {
    naam: "Jayden",
    functie: "Planner",
    initials: "JA",
    avatarColor: "from-blue-500 to-cyan-500",
    bio: "Jayden plant niet alleen mensen in — hij plant chaos uit. Als iemand last-minute uitvalt, heeft hij al een oplossing voordat jij 'no-show' kunt zeggen. Zijn planning-skills zijn legendarisch. Zijn koffieverbruik ook.",
    badge: "Last-minute held",
    badgeIcon: Zap,
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    fun: "Heeft waarschijnlijk al jouw volgende shift gepland 📅",
  },
  {
    naam: "Lotte",
    functie: "Recruiter",
    initials: "LO",
    avatarColor: "from-pink-500 to-rose-500",
    bio: "Lotte spot talent van drie kilometer afstand. Ze weet precies wie waar past en heeft een neus voor mensen met dat echte EXTRA-gevoel. Haar motto: 'Iedereen heeft een EXTRAatje — je moet 'm alleen even vinden.' Spoiler: zij vindt 'm altijd.",
    badge: "Talentspotter",
    badgeIcon: Star,
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-700",
    fun: "Heeft meer mensen gescout dan een voetbalmakelaar 🌟",
  },
  {
    naam: "Milan",
    functie: "Klantenmanager",
    initials: "MI",
    avatarColor: "from-green-500 to-emerald-500",
    bio: "Milan is de brug tussen klanten en medewerkers. Altijd positief, altijd strak geregeld. Hij kent onze klanten bij naam — en soms ook hun honden. Zijn geheim? Echt luisteren, en dan nóg een stapje verder gaan.",
    badge: "Klantkampioen",
    badgeIcon: Trophy,
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    fun: "Onthoudt elke verjaardag van elke klant 🎂",
  },
  {
    naam: "Sanne",
    functie: "HR & Medewerkerszaken",
    initials: "SA",
    avatarColor: "from-yellow-500 to-amber-500",
    bio: "Bij Sanne is je verhaal altijd veilig. Of je nu een vraag hebt, een punt wil maken of gewoon even wil sparren — zij staat klaar. Ze zorgt dat medewerkers zich gehoord voelen en dat EXTRA een plek is waar je echt jezelf kunt zijn.",
    badge: "People person",
    badgeIcon: Heart,
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-700",
    fun: "Heeft nog nooit een e-mail onbeantwoord gelaten ✉️",
  },
  {
    naam: "Daan",
    functie: "Account Manager Hospitality",
    initials: "DA",
    avatarColor: "from-indigo-500 to-purple-500",
    bio: "Daan weet alles van de hospitality-sector. Van sterrenzaken tot boutique hotels — hij heeft ze gezien, geserviced en verbeterd. Hij snapt wat klanten nodig hebben, vaak voordat ze het zelf weten. Zijn handshake-deals zijn legendarisch.",
    badge: "Hospitality pro",
    badgeIcon: Star,
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
    fun: "Heeft in meer keukens gestaan dan de meeste koks 👨‍🍳",
  },
  {
    naam: "Yara",
    functie: "Marketing & Communicatie",
    initials: "YA",
    avatarColor: "from-fuchsia-500 to-pink-500",
    bio: "Yara maakt van EXTRA een merk dat je voelt. Van social media tot campagnes — zij geeft EXTRA haar stem. Ze heeft een gave voor het vertellen van verhalen die mensen echt raken. Dit stukje tekst? Waarschijnlijk haar werk.",
    badge: "Storyteller",
    badgeIcon: Star,
    badgeBg: "bg-fuchsia-100",
    badgeText: "text-fuchsia-700",
    fun: "Vindt in elke situatie een goede caption 📸",
  },
  {
    naam: "Remi",
    functie: "Finance & Administratie",
    initials: "RE",
    avatarColor: "from-teal-500 to-cyan-500",
    bio: "Remi houdt EXTRA scherp. Cijfers zijn zijn taal, nauwkeurigheid zijn superkracht. Terwijl de rest bezig is met de buitenwereld, zorgt Remi dat alles intern klopt tot op de cent. Saai? Nooit. Essentieel? Altijd.",
    badge: "Cijferaar",
    badgeIcon: Zap,
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-700",
    fun: "Heeft elk budget altijd on point 💰",
  },
  {
    naam: "Nina",
    functie: "Trainer & Onboarding",
    initials: "NI",
    avatarColor: "from-orange-500 to-red-500",
    bio: "Nina zorgt dat nieuwe medewerkers van dag één het gevoel hebben dat ze thuis zijn. Ze traint, begeleidt en motiveert — met een energie die aanstekelijk is. Als jij goed begint, heeft Nina daar ongetwijfeld iets mee te maken.",
    badge: "Coach",
    badgeIcon: Coffee,
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    fun: "Heeft de beste onboarding-playlist van het kantoor 🎵",
  },
];

const NAV_LINKS = [
  { label: "Wie zijn wij?", href: "/over-extra" },
  { label: "Ons team", href: "/over-extra/ons-team" },
  { label: "Beloningssysteem", href: "/extraatje" },
  { label: "Aanmelden", href: "/aanmelden" },
];

function TeamCard({ member, delay }: { member: TeamMember; delay: number }) {
  const BadgeIcon = member.badgeIcon;
  return (
    <RevealSection delay={delay}>
      <article className="bg-white rounded-2xl sm:rounded-[1.5rem] shadow-lg shadow-purple-500/5 border-2 border-purple-100 p-6 sm:p-7 hover:shadow-xl hover:border-purple-200 hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col">
        <div className="flex items-start justify-between mb-5">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.avatarColor} flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-purple-500/20`}>
            {member.initials}
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full ${member.badgeBg} ${member.badgeText}`}>
            <BadgeIcon className="h-3 w-3" />
            {member.badge}
          </span>
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{member.naam}</h3>
        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4">{member.functie}</p>
        <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-4">{member.bio}</p>
        <div className="border-t border-purple-100 pt-4">
          <p className="text-xs text-gray-400 italic leading-relaxed">{member.fun}</p>
        </div>
      </article>
    </RevealSection>
  );
}

export default function OnsTeam() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = "Ons Team – De mensen achter EXTRA | EXTRA Hospitality Staffing";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Maak kennis met het team achter EXTRA – jong, energiek en gedreven. Ontdek wie elke dag zorgt dat de beste medewerkers matchen met de mooiste opdrachtgevers.");
    setMeta("og:title", "Ons Team – De mensen achter EXTRA", true);
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
        "@type": "Person",
        "name": m.naam,
        "jobTitle": m.functie,
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

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-purple-500/5 border-b border-purple-100/50" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/landing">
            <img
              src={extraLogoWit}
              alt="EXTRA logo"
              className={`h-8 sm:h-9 w-auto cursor-pointer transition-all ${scrolled ? "brightness-0" : ""}`}
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/over-extra"
              className={`text-sm font-semibold transition-colors hidden sm:block ${scrolled ? "text-gray-700 hover:text-purple-600" : "text-white/90 hover:text-white"}`}
            >
              Over EXTRA
            </Link>
            <a
              href="/aanmelden"
              className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-full text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            >
              Aanmelden <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </nav>

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

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-32 sm:pt-40 pb-20 sm:pb-28">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-white/60 mb-8">
            <Link href="/landing" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/over-extra" className="hover:text-white transition-colors">Over EXTRA</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-semibold">Ons Team</span>
          </nav>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
            Ons team –{" "}
            <span className="relative inline-block">
              <span className="relative z-10">de mensen</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
            </span>
            {" "}achter EXTRA
          </h1>
          <p className="text-lg sm:text-xl text-purple-100/90 max-w-xl leading-relaxed font-medium">
            Jong, energiek en een tikje eigenwijs — precies zoals we het leuk vinden. Dit zijn de mensen die elke dag zorgen dat alles loopt zoals het moet.
          </p>
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
                  href === "/over-extra/ons-team"
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

      {/* ── TEAM GRID ── */}
      <section className="relative bg-white py-14 sm:py-20 lg:py-28 overflow-hidden">
        <XPatternBg />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Maak kennis</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Het volledige team
              </h2>
              <p className="text-gray-500 mt-3 text-base sm:text-lg max-w-xl mx-auto">
                Van planning tot recruting, van finance tot training — elk stukje van EXTRA zit in goede handen.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {team.map((member, i) => (
              <TeamCard key={member.naam} member={member} delay={i * 50} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CULTUUR TEKST ── */}
      <section className="py-16 sm:py-24" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Onze cultuur</span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mt-3 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Wat maakt ons horeca team anders?
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-sm sm:text-base">
              <p>
                Het EXTRA team bestaat uit een mix van jonge professionals met een gemeenschappelijk doel: de beste medewerkers koppelen aan de mooiste opdrachtgevers in de hospitality. We werken snel, denken vooruit en communiceren helder — omdat dat de enige manier is om écht het verschil te maken.
              </p>
              <p>
                Onze planners denken in oplossingen, onze recruiters denken in mensen en onze klantenmanagers denken in relaties. Samen vormen we een uitzendbureau-team dat de sector begrijpt van binnenuit — omdat we er zelf mee opgegroeid zijn.
              </p>
              <p>
                Wat ons echt uniek maakt? We geloven dat motivatie van binnenuit komt. Daarom hebben we het EXTRAATJE puntensysteem gebouwd: een manier om medewerkers te belonen voor wie ze zijn en wat ze bijdragen. Ons team draagt dat systeem zelf uit — elke dag opnieuw.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {["Jong team", "Hospitality specialist", "Snel schakelen", "Medewerkersgericht", "EXTRAATJE systeem"].map(tag => (
                <span key={tag} className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
                  {tag}
                </span>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[{ left: "5%", top: "10%", w: 200, rot: 15, op: 0.1 }, { left: "80%", top: "50%", w: 240, rot: -20, op: 0.08 }].map((x, i) => (
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
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-5 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
              <Users className="w-4 h-4" /> Werken bij EXTRA?
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Onderdeel worden van dit team?
            </h2>
            <p className="text-purple-200/80 text-base sm:text-lg mb-8 leading-relaxed">
              Meld je aan als medewerker en begin vandaag nog met werken én verdienen — of vraag personeel aan voor jouw locatie.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/aanmelden"
                className="group bg-white text-purple-900 font-bold px-8 py-4 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
              >
                Aanmelden als medewerker <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/personeel-gezocht"
                className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full text-base hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
              >
                Opdrachtgever? <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t border-purple-100 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-center gap-6 text-xs text-gray-400 flex-wrap">
          <Link href="/landing" className="hover:text-purple-600 transition-colors">Home</Link>
          <Link href="/over-extra" className="hover:text-purple-600 transition-colors">Over EXTRA</Link>
          <Link href="/extraatje" className="hover:text-purple-600 transition-colors">EXTRAATJE</Link>
          <Link href="/aanmelden" className="hover:text-purple-600 transition-colors">Aanmelden</Link>
          <span>© 2025 EXTRA Hospitality Staffing</span>
        </div>
      </footer>
    </div>
  );
}
