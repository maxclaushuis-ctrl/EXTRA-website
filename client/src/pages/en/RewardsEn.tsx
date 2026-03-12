import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import {
  Gift, Star, Trophy, Zap, Clock, ThumbsUp, Shield, TrendingUp,
  ArrowRight, CheckCircle2, Users, Award, Flame, Sparkles, Check
} from "lucide-react";
import imgDashboard from "@assets/IMG_8971_1772395165096.webp";
import imgBeloningen from "@assets/IMG_8973_1772396250204.webp";
import imgChallenges from "@assets/IMG_8975_1772396250204.webp";
import imgRanglijst from "@assets/IMG_8977_1772396250204.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";

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
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}
function XPat({ color = "rgba(139,92,246,1)", opacity = 0.07 }: { color?: string; opacity?: number }) {
  return <div className="absolute inset-0 pointer-events-none overflow-hidden">{[{ left: "5%", top: "10%", w: 180, rot: 15 }, { left: "78%", top: "15%", w: 140, rot: -8 }, { left: "48%", top: "72%", w: 160, rot: 25 }].map((x, i) => <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: color }} />)}</div>;
}

const features = [
  { icon: Zap, title: "Points per shift", desc: "Every completed shift earns you points automatically. No forms, no fuss.", color: "from-purple-500 to-violet-600", bg: "bg-purple-50", accent: "text-purple-600" },
  { icon: Trophy, title: "Monthly leaderboard", desc: "Compete with colleagues. Top 3 each month get bonus rewards.", color: "from-amber-500 to-orange-500", bg: "bg-amber-50", accent: "text-amber-600" },
  { icon: Flame, title: "Challenges", desc: "Complete special challenges to earn extra points. Always something new.", color: "from-rose-500 to-pink-600", bg: "bg-pink-50", accent: "text-pink-600" },
  { icon: Gift, title: "Real rewards", desc: "Redeem for AirPods, cinema tickets, padel sessions, restaurant vouchers and more.", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50", accent: "text-blue-600" },
  { icon: Star, title: "Partner discounts", desc: "Exclusive discounts at restaurants, gyms and lifestyle brands.", color: "from-green-500 to-emerald-600", bg: "bg-green-50", accent: "text-green-600" },
  { icon: Clock, title: "Same-day pay", desc: "Get paid on the same day you work via our app. No waiting.", color: "from-cyan-500 to-sky-600", bg: "bg-cyan-50", accent: "text-cyan-600" },
];

const screens = [
  { src: imgDashboard, alt: "EXTRA App dashboard", label: "Dashboard", desc: "See your points, open shifts and earnings at a glance." },
  { src: imgBeloningen, alt: "Rewards overview", label: "Rewards", desc: "Browse and redeem rewards. New items added regularly." },
  { src: imgChallenges, alt: "Challenges", label: "Challenges", desc: "Accept challenges to earn bonus points and special badges." },
  { src: imgRanglijst, alt: "Leaderboard", label: "Leaderboard", desc: "See where you rank and who to beat this month." },
];

export default function RewardsEn() {
  useEffect(() => {
    document.title = "EXTRA Rewards System | Points, Leaderboard and Real Prizes";
    const s = (n: string, c: string, a = 'name') => { let el = document.querySelector(`meta[${a}="${n}"]`) as HTMLMetaElement; if (!el) { el = document.createElement('meta'); el.setAttribute(a, n); document.head.appendChild(el); } el.setAttribute('content', c); };
    const l = (rel: string, href: string, hl?: string) => { const sel = hl ? `link[rel="${rel}"][hreflang="${hl}"]` : `link[rel="${rel}"]`; let el = document.querySelector(sel) as HTMLLinkElement; if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); if (hl) el.setAttribute('hreflang', hl); document.head.appendChild(el); } el.setAttribute('href', href); };
    s('description', 'EXTRA rewards hospitality staff with real prizes. Earn points every shift, climb the leaderboard, and redeem for AirPods, cinema tickets, padel and restaurant vouchers.');
    l('canonical', 'https://www.doehetextra.nl/en/rewards');
    l('alternate', 'https://www.doehetextra.nl/beloningssysteem', 'nl');
    l('alternate', 'https://www.doehetextra.nl/en/rewards', 'en');
  }, []);

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #170926 50%, #12071f 100%)" }}>
      <PublicNav forceDark />

      {/* HERO */}
      <section className="relative pt-32 sm:pt-40 pb-24 sm:pb-32 overflow-hidden">
        <XPat color="rgba(255,255,255,0.9)" opacity={0.07} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgba(124,58,237,0.2),transparent)]" />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10 text-center">
          <RevealSection>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full border border-purple-500/30 mb-8">
              <Sparkles className="w-4 h-4" /> The EXTRA Rewards System
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-[1.06]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Work more.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">Earn more. Get more.</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/70 max-w-2xl mx-auto leading-relaxed mb-10">
              Every shift you complete earns you points. Climb the leaderboard, conquer challenges and redeem real rewards. This is how EXTRA makes hospitality work rewarding.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/aanmelden" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold px-8 py-4 rounded-full hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:-translate-y-1">
                <Zap className="w-5 h-5" /> Start earning rewards
              </Link>
              <Link href="/en/how-we-work" className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all">
                How it works
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* APP SCREENS */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <XPat color="rgba(139,92,246,1)" opacity={0.07} />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="text-purple-300 text-sm font-bold uppercase tracking-widest">The app</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Your rewards, in your pocket</h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {screens.map((sc, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="text-center">
                  <PhoneMockup src={sc.src} alt={sc.alt} />
                  <div className="mt-6">
                    <p className="font-black text-white text-base mb-1">{sc.label}</p>
                    <p className="text-purple-100/60 text-sm">{sc.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-white text-gray-900">
        <XPat color="rgba(139,92,246,1)" opacity={0.05} />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">All the ways to earn</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>More than just points</h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <RevealSection key={i} delay={i * 70}>
                <div className={`${f.bg} rounded-2xl p-6 border border-white shadow-sm hover:shadow-md transition-all`}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-black text-gray-900 text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <XPat color="rgba(255,255,255,0.9)" opacity={0.06} />
        <div className="max-w-4xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="text-purple-300 text-sm font-bold uppercase tracking-widest">Step by step</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>From shift to reward</h2>
            </div>
          </RevealSection>
          <div className="space-y-8">
            {[
              { n: "01", title: "Work a shift", desc: "Complete any shift as an EXTRA professional. Points are awarded automatically." },
              { n: "02", title: "Earn points", desc: "Your points appear in the app immediately. Challenges and bonuses stack on top." },
              { n: "03", title: "Climb the leaderboard", desc: "Monthly rankings with bonus rewards for top performers. Friendly competition, real prizes." },
              { n: "04", title: "Redeem rewards", desc: "Browse the rewards catalogue and redeem your points for gear, experiences and vouchers." },
            ].map((step, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="flex items-start gap-5 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/15">
                  <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-purple-200 text-sm">{step.n}</div>
                  <div>
                    <h3 className="font-black text-white text-base mb-1">{step.title}</h3>
                    <p className="text-purple-100/65 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-br from-purple-950 via-violet-900 to-indigo-950">
        <XPat color="rgba(255,255,255,0.9)" opacity={0.06} />
        <div className="max-w-3xl mx-auto px-5 text-center relative z-10">
          <RevealSection>
            <div className="text-5xl mb-5">🎁</div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>Ready to earn your first reward?</h2>
            <p className="text-purple-200/80 text-lg mb-10 max-w-xl mx-auto">Apply today and start collecting points from your very first shift.</p>
            <Link href="/aanmelden" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-purple-900 font-bold rounded-full px-10 py-4 text-base shadow-xl hover:-translate-y-1 transition-all">
              Apply now <ArrowRight className="w-4 h-4" />
            </Link>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
