import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Users, ArrowRight, ChevronRight, MapPin, Zap, Heart,
  Star, Coffee, Music, Bike, Trophy, Flame
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
      { threshold: 0.08 }
    );
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    el.style.transition = "opacity 0.55s ease, transform 0.55s ease";
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

type TeamMember = {
  naam: string;
  functie: string;
  initials: string;
  color: string;
  bio: string;
  badge: string;
  badgeIcon: React.ElementType;
  badgeColor: string;
  fun: string;
};

const team: TeamMember[] = [
  {
    naam: "Eveline",
    functie: "Operations Manager",
    initials: "EV",
    color: "from-purple-500 to-violet-600",
    bio: "Geen obstakel is te hoog voor Eveline. Hoe groter de uitdaging, hoe meer energie ze krijgt. Ze schakelt sneller dan je wifi op kantoor en staat bekend om haar 'komt goed'-mentaliteit. Achter de schermen is zij de motor die EXTRA draaiende houdt.",
    badge: "Onverslaanbaar",
    badgeIcon: Flame,
    badgeColor: "bg-orange-500/20 text-orange-400",
    fun: "Kan elke situatie omtoveren tot een kans 🚀",
  },
  {
    naam: "Jayden",
    functie: "Planner",
    initials: "JA",
    color: "from-blue-500 to-cyan-500",
    bio: "Jayden plant niet alleen mensen in — hij plant chaos uit. Als iemand last-minute uitvalt, heeft hij al een oplossing voordat jij 'no-show' kunt zeggen. Zijn planning-skills zijn legendarisch. Zijn koffieverbruik ook.",
    badge: "Last-minute held",
    badgeIcon: Zap,
    badgeColor: "bg-blue-500/20 text-blue-400",
    fun: "Heeft waarschijnlijk al jouw volgende shift gepland 📅",
  },
  {
    naam: "Lotte",
    functie: "Recruiter",
    initials: "LO",
    color: "from-pink-500 to-rose-500",
    bio: "Lotte spot talent van drie kilometer afstand. Ze weet precies wie waar past en heeft een neus voor mensen met dat echte EXTRA-gevoel. Haar motto: 'Iedereen heeft een EXTRAatje — je moet 'm alleen even vinden.' Spoiler: zij vindt 'm altijd.",
    badge: "Talentspotter",
    badgeIcon: Star,
    badgeColor: "bg-pink-500/20 text-pink-400",
    fun: "Heeft meer mensen gescout dan een voetbalmakelaar 🌟",
  },
  {
    naam: "Milan",
    functie: "Klantenmanager",
    initials: "MI",
    color: "from-green-500 to-emerald-500",
    bio: "Milan is de brug tussen klanten en medewerkers. Altijd positief, altijd strak geregeld. Hij kent onze klanten bij naam — en soms ook hun honden. Zijn geheim? Echt luisteren, en dan nóg een stapje verder gaan.",
    badge: "Klantkampioen",
    badgeIcon: Trophy,
    badgeColor: "bg-green-500/20 text-green-400",
    fun: "Onthoudt elke verjaardag van elke klant 🎂",
  },
  {
    naam: "Sanne",
    functie: "HR & Medewerkerszaken",
    initials: "SA",
    color: "from-yellow-500 to-amber-500",
    bio: "Bij Sanne is je verhaal altijd veilig. Of je nu een vraag hebt, een punt wil maken of gewoon even wil sparren — zij staat klaar. Ze zorgt dat medewerkers zich gehoord voelen en dat EXTRA een plek is waar je echt jezelf kunt zijn.",
    badge: "People person",
    badgeIcon: Heart,
    badgeColor: "bg-yellow-500/20 text-yellow-400",
    fun: "Heeft nog nooit een e-mail onbeantwoord gelaten ✉️",
  },
  {
    naam: "Daan",
    functie: "Account Manager Hospitality",
    initials: "DA",
    color: "from-indigo-500 to-purple-500",
    bio: "Daan weet alles van de hospitality-sector. Van sterrenzaken tot boutique hotels — hij heeft ze gezien, geserviced en verbeterd. Hij snapt wat klanten nodig hebben, vaak voordat ze het zelf weten. Zijn handshake-deals zijn legendarisch.",
    badge: "Hospitality pro",
    badgeIcon: Star,
    badgeColor: "bg-indigo-500/20 text-indigo-400",
    fun: "Heeft in meer keukens gestaan dan de meeste koks 👨‍🍳",
  },
  {
    naam: "Yara",
    functie: "Marketing & Communicatie",
    initials: "YA",
    color: "from-fuchsia-500 to-pink-500",
    bio: "Yara maakt van EXTRA een merk dat je voelt. Van social media tot campagnes en van copywriting tot design — zij geeft EXTRA haar stem. Ze heeft een gave voor het vertellen van verhalen die mensen echt raken. Dit stukje tekst? Waarschijnlijk haar werk.",
    badge: "Storyteller",
    badgeIcon: Music,
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-400",
    fun: "Vindt in elke situatie een goede caption 📸",
  },
  {
    naam: "Remi",
    functie: "Finance & Administratie",
    initials: "RE",
    color: "from-teal-500 to-cyan-500",
    bio: "Remi houdt EXTRA scherp. Cijfers zijn zijn taal, nauwkeurigheid zijn superkracht. Terwijl de rest bezig is met de buitenwereld, zorgt Remi dat alles intern klopt tot op de cent. Saai? Nooit. Essentieel? Altijd.",
    badge: "Cijferaar",
    badgeIcon: Zap,
    badgeColor: "bg-teal-500/20 text-teal-400",
    fun: "Heeft elk budget altijd on point 💰",
  },
  {
    naam: "Nina",
    functie: "Trainer & Onboarding",
    initials: "NI",
    color: "from-orange-500 to-red-500",
    bio: "Nina zorgt dat nieuwe medewerkers van dag één het gevoel hebben dat ze thuis zijn. Ze traint, begeleidt en motiveert — met een energie die aanstekelijk is. Als jij goed begint, heeft Nina daar ongetwijfeld iets mee te maken.",
    badge: "Coach",
    badgeIcon: Coffee,
    badgeColor: "bg-orange-500/20 text-orange-400",
    fun: "Heeft de beste onboarding-playlist van het kantoor 🎵",
  },
];

function TeamCard({ member, delay }: { member: TeamMember; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const BadgeIcon = member.badgeIcon;

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.04)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered ? "0 20px 60px rgba(124,58,237,0.2)" : "none",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        transitionDelay: `${delay}ms`,
      }}
      className="rounded-2xl border border-white/10 hover:border-purple-500/30 p-6 flex flex-col"
    >
      {/* Avatar */}
      <div className="flex items-start justify-between mb-5">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-2xl font-black text-white shadow-lg`}>
          {member.initials}
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${member.badgeColor}`}>
          <BadgeIcon className="h-3 w-3" />
          {member.badge}
        </span>
      </div>

      {/* Name & Role */}
      <h3 className="text-lg font-black text-white mb-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {member.naam}
      </h3>
      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-4">{member.functie}</p>

      {/* Bio */}
      <p className="text-sm text-purple-200 leading-relaxed flex-1 mb-5">{member.bio}</p>

      {/* Fun fact */}
      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-purple-400 italic leading-relaxed">{member.fun}</p>
      </div>
    </article>
  );
}

export default function OnsTeam() {
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
    setMeta("og:type", "website", true);

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://www.doehetextra.nl/over-extra/ons-team";

    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "EXTRA Hospitality Staffing",
      "url": "https://www.doehetextra.nl",
      "description": "Jong en energiek uitzendbureau gespecialiseerd in hospitality medewerkers",
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
    <div className="min-h-screen bg-gray-950 text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10" style={{ background: "rgba(10,5,30,0.88)" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/landing">
            <img src={extraLogoWit} alt="EXTRA logo" className="h-7 cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/over-extra" className="text-purple-300 hover:text-white transition-colors hidden sm:block">Over EXTRA</Link>
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
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-16 sm:pb-24">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs text-purple-400 mb-8">
            <Link href="/landing" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/over-extra" className="hover:text-white transition-colors">Over EXTRA</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-medium">Ons Team</span>
          </nav>

          <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
            <Users className="w-4 h-4" /> Het team
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.05]" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Ons team –{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              de mensen achter EXTRA
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-200 max-w-2xl leading-relaxed">
            Bij EXTRA draait alles om mensen. Jong, energiek en een tikje eigenwijs — precies zoals we het leuk vinden.
            Dit is ons team: de mensen die elke dag zorgen dat alles loopt zoals het moet lopen… en soms net een beetje EXTRA.
          </p>
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
                  href === "/over-extra/ons-team"
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

      {/* STATS BAR */}
      <div className="py-10 border-b border-white/10" style={{ background: "#0d0820" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-6 text-center">
            {[
              { num: `${team.length}`, label: "Teamleden" },
              { num: "5+", label: "Steden actief" },
              { num: "100%", label: "Passie voor hospitality" },
            ].map(({ num, label }) => (
              <div key={label}>
                <p className="text-2xl sm:text-3xl font-black text-white">{num}</p>
                <p className="text-xs text-purple-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TEAM GRID */}
      <div className="py-16 sm:py-24" style={{ background: "#0d0820" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {team.map((member, i) => (
                <TeamCard key={member.naam} member={member} delay={i * 40} />
              ))}
            </div>
          </RevealSection>
        </div>
      </div>

      {/* SEO CONTENT BLOCK */}
      <div className="py-16 sm:py-20 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0f0726, #1a0a3e)" }}>
        <img src={xPatroon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Onze cultuur</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Wat maakt ons horeca team anders?
            </h2>
            <div className="space-y-4 text-purple-200 leading-relaxed text-sm sm:text-base">
              <p>
                Het EXTRA team bestaat uit een mix van jonge professionals met een gemeenschappelijk doel: de beste medewerkers koppelen aan de mooiste opdrachtgevers in de hospitality. We werken snel, denken vooruit en communiceren helder — omdat dat de enige manier is om écht het verschil te maken.
              </p>
              <p>
                Onze planners denken in oplossingen, onze recruiters denken in mensen en onze klantenmanagers denken in relaties. Samen vormen we een uitzendbureau-team dat de sector begrijpt van binnenuit — omdat we er zelf mee opgegroeid zijn.
              </p>
              <p>
                Flexibiliteit zit in ons DNA. We schakelen razendsnel bij last-minute verzoeken, denken mee bij complexe planningsvraagstukken en zorgen altijd dat de communicatie richting medewerkers en klanten klopt. Geen ellenlange procedures — gewoon directe actie.
              </p>
              <p>
                Wat ons echt uniek maakt? We geloven dat motivatie van binnenuit komt. Daarom hebben we het EXTRAATJE puntensysteem gebouwd: een manier om medewerkers te belonen voor wie ze zijn en wat ze bijdragen. Ons team draagt dat systeem zelf uit — elke dag opnieuw.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Jong team", "Hospitality specialist", "Snel schakelen", "Medewerkersgericht", "EXTRAATJE beloningssysteem"].map(tag => (
                <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                  {tag}
                </span>
              ))}
            </div>
          </RevealSection>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 sm:py-28 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4c1d95, #6d28d9, #7c3aed)" }}>
        <img src={xPatroon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.07] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <RevealSection>
            <Bike className="h-12 w-12 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Werken bij EXTRA?
            </h2>
            <p className="text-purple-200 text-lg mb-8 leading-relaxed">
              Ben jij klaar om onderdeel te worden van dit team? Of ben je opzoek naar de beste
              hospitality medewerkers voor jouw locatie?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/aanmelden"
                className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-purple-900 shadow-xl"
                style={{ background: "linear-gradient(135deg, #fde68a, #fbbf24)" }}
              >
                Aanmelden als medewerker <ArrowRight className="h-5 w-5" />
              </a>
              <Link href="/personeel-gezocht" className="text-white/80 hover:text-white font-medium transition-colors text-sm inline-flex items-center gap-1">
                Opdrachtgever? <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </div>

      {/* MINI FOOTER */}
      <div className="py-8 border-t border-white/10 text-center" style={{ background: "#0a0518" }}>
        <div className="flex items-center justify-center gap-6 text-xs text-purple-400 flex-wrap">
          <Link href="/landing" className="hover:text-white transition-colors">Home</Link>
          <Link href="/over-extra" className="hover:text-white transition-colors">Over EXTRA</Link>
          <Link href="/extraatje" className="hover:text-white transition-colors">EXTRAATJE</Link>
          <Link href="/aanmelden" className="hover:text-white transition-colors">Aanmelden</Link>
          <span>© 2025 EXTRA Hospitality Staffing</span>
        </div>
      </div>
    </div>
  );
}
