import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Users, ArrowRight, Camera, Music, Hotel, Lightbulb, BookOpen, Zap, Smile, Smartphone, Trophy, MapPin, ChevronRight } from "lucide-react";
import xPatroon from "@assets/X_patroon_1771260543289.webp";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.06, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}
function XPat({ color = "rgba(139,92,246,1)", opacity = 0.07 }: { color?: string; opacity?: number }) {
  return <div className="absolute inset-0 pointer-events-none overflow-hidden">{[{ left: "3%", top: "5%", w: 180, rot: 12 }, { left: "78%", top: "8%", w: 140, rot: -10 }, { left: "50%", top: "72%", w: 160, rot: 22 }].map((x, i) => <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: color }} />)}</div>;
}
function PhotoPlaceholder({ initials, gradient }: { initials: string; gradient: string }) {
  return (
    <div className={`relative w-full aspect-[3/4] bg-gradient-to-br ${gradient} flex flex-col items-center justify-center overflow-hidden rounded-t-2xl sm:rounded-t-3xl`}>
      <div className="absolute inset-0 opacity-10" style={{ background: "repeating-linear-gradient(45deg, transparent, transparent 24px, rgba(255,255,255,0.15) 24px, rgba(255,255,255,0.15) 25px)" }} />
      <span className="absolute text-[8rem] font-black text-white/10 select-none leading-none">{initials}</span>
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <span className="text-white/70 text-xs font-bold tracking-widest uppercase">Photo coming</span>
      </div>
    </div>
  );
}

type Tag = { emoji: string; label: string };
const team: { name: string; role: string; gradient: string; initials: string; location: string; tags: Tag[]; quote: string }[] = [
  { name: "Eveline", role: "Operations Manager", gradient: "from-purple-600 via-violet-500 to-purple-800", initials: "EV", location: "Amsterdam", tags: [{ emoji: "🌏", label: "World traveller" }, { emoji: "🏋️", label: "Gym fanatic" }, { emoji: "☕", label: "Coffee first" }], quote: "The best service comes from people who genuinely care. That is what we build every day." },
  { name: "Lea", role: "Recruiter", gradient: "from-rose-500 via-pink-500 to-rose-700", initials: "LE", location: "Amsterdam", tags: [{ emoji: "📸", label: "Photographer" }, { emoji: "🎵", label: "Music lover" }, { emoji: "🌿", label: "Plant mum" }], quote: "Finding the right match between candidate and venue is my superpower." },
  { name: "Charlotte", role: "Recruiter", gradient: "from-blue-500 via-cyan-500 to-blue-700", initials: "CH", location: "Amsterdam", tags: [{ emoji: "🎨", label: "Creative" }, { emoji: "🏃", label: "Runner" }, { emoji: "🍕", label: "Foodie" }], quote: "Every person has something unique to offer. My job is to find it and put it to work." },
  { name: "Max", role: "Commercial Director", gradient: "from-amber-500 via-orange-500 to-amber-700", initials: "MA", location: "Amsterdam", tags: [{ emoji: "⚽", label: "Football" }, { emoji: "📊", label: "Data nerd" }, { emoji: "🚀", label: "Growth mindset" }], quote: "Strong partnerships are built on trust, speed and consistency. That is the EXTRA way." },
  { name: "Jayden", role: "Planner", gradient: "from-emerald-500 via-teal-500 to-emerald-700", initials: "JA", location: "Amsterdam", tags: [{ emoji: "🎮", label: "Gamer" }, { emoji: "🏄", label: "Surfer" }, { emoji: "🎧", label: "DJ" }], quote: "Logistics is about anticipating before things go wrong. Being three steps ahead." },
];

export default function OurTeam() {
  useEffect(() => {
    document.title = "Our Team | EXTRA Hospitality Staffing Amsterdam";
    const s = (n: string, c: string, a = 'name') => { let el = document.querySelector(`meta[${a}="${n}"]`) as HTMLMetaElement; if (!el) { el = document.createElement('meta'); el.setAttribute(a, n); document.head.appendChild(el); } el.setAttribute('content', c); };
    const l = (rel: string, href: string, hl?: string) => { const sel = hl ? `link[rel="${rel}"][hreflang="${hl}"]` : `link[rel="${rel}"]`; let el = document.querySelector(sel) as HTMLLinkElement; if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); if (hl) el.setAttribute('hreflang', hl); document.head.appendChild(el); } el.setAttribute('href', href); };
    s('description', 'Meet the EXTRA team. Young professionals dedicated to better hospitality staffing in Amsterdam and beyond.');
    l('canonical', 'https://www.doehetextra.nl/en/our-team');
    // hreflang-alternates (nl/en/x-default) komen sinds P13 server-side uit
    // shared/routeMeta.ts (HREFLANG_GROUPS) — hier hardcoded zetten zou ze na
    // hydratie weer overschrijven met een niet-onderhouden, x-default-loze set.
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PublicNav />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}>
        <XPat color="rgba(255,255,255,0.9)" opacity={0.1} />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-32 sm:pt-40 pb-24 sm:pb-32 text-center">
          <nav className="flex items-center justify-center gap-1.5 text-xs text-white/60 mb-8">
            <Link href="/en/about" className="hover:text-white transition-colors">About EXTRA</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-semibold">Our team</span>
          </nav>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-xs sm:text-sm font-semibold">Growing team of hospitality professionals</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
            The people behind{" "}
            <span className="relative inline-block">
              <span className="relative z-10">EXTRA</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-100/90 max-w-2xl mx-auto leading-relaxed font-medium">
            We are a small, driven team with a big mission: make hospitality staffing smarter, faster and fairer for everyone involved.
          </p>
        </div>
      </section>

      {/* TEAM GRID */}
      <section className="relative bg-white py-20 sm:py-28 overflow-hidden">
        <XPat color="rgba(139,92,246,1)" opacity={0.05} />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">The team</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>People who make it happen</h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {team.map((m, i) => (
              <RevealSection key={m.name} delay={i * 80}>
                <div className="rounded-2xl sm:rounded-3xl bg-white border border-purple-100/80 shadow-xl shadow-purple-900/5 overflow-hidden hover:shadow-2xl hover:shadow-purple-900/10 transition-all duration-300 hover:-translate-y-1">
                  <PhotoPlaceholder initials={m.initials} gradient={m.gradient} />
                  <div className="p-5 sm:p-6">
                    <h3 className="text-xl font-black text-gray-900 mb-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{m.name}</h3>
                    <p className="text-purple-600 font-bold text-sm mb-1">{m.role}</p>
                    <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                      <MapPin className="w-3 h-3" /> {m.location}
                    </div>
                    <p className="text-gray-500 text-sm italic leading-relaxed mb-4">"{m.quote}"</p>
                    <div className="flex flex-wrap gap-2">
                      {m.tags.map(t => (
                        <span key={t.label} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-100">
                          {t.emoji} {t.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* WHY JOIN */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPat color="rgba(255,255,255,0.9)" opacity={0.07} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="text-purple-300 text-sm font-bold uppercase tracking-widest">Join the team</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Why work at EXTRA?</h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap, label: "Impact from day one", desc: "Small team means big influence. Your ideas are heard and executed." },
              { icon: Trophy, label: "Grow with us", desc: "We invest in our people just like we invest in our hospitality staff." },
              { icon: Smile, label: "Fun culture", desc: "Hard work and a good laugh. We take our craft seriously, not ourselves." },
              { icon: Lightbulb, label: "Tech-forward", desc: "Smart tools, modern workflows. No outdated spreadsheets here." },
              { icon: Hotel, label: "Top clients", desc: "Work alongside Amsterdam's finest hotels, venues and brands." },
              { icon: MapPin, label: "Amsterdam", desc: "Based in the best city in the Netherlands. Need we say more?" },
            ].map((v, i) => (
              <RevealSection key={i} delay={i * 70}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center mb-4">
                    <v.icon className="w-6 h-6 text-purple-200" />
                  </div>
                  <h3 className="font-black text-white text-sm mb-2">{v.label}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection className="mt-12 text-center">
            <Link href="/en/contact" className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold px-8 py-4 rounded-full hover:shadow-xl hover:shadow-white/20 transition-all hover:-translate-y-1">
              Get in touch <ArrowRight className="w-5 h-5" />
            </Link>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
