import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import FAQSection from "@/components/FAQSection";
import {
  Gift, Star, Trophy, Zap, Clock, ThumbsUp, Shield, TrendingUp,
  ArrowRight, CheckCircle2, Users, Award, Flame,
  ChevronRight, Sparkles, Check
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import imgDashboard from "@assets/IMG_8971_1772395165096.webp";
import imgBeloningen from "@assets/IMG_8973_1772396250204.webp";
import imgKortingen from "@assets/IMG_8974_1772396250204.webp";
import imgChallenges from "@assets/IMG_8975_1772396250204.webp";
import imgRanglijst from "@assets/IMG_8977_1772396250204.webp";

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
        { left: "78%", top: "15%", w: 140, rot: -8, op: 0.05 },
        { left: "48%", top: "72%", w: 160, rot: 25, op: 0.06 },
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

const microPrestaties = [
  { icon: Clock, label: "Arriving on time", desc: "Points for punctuality with every shift", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50", accent: "text-blue-600" },
  { icon: Star, label: "High rating", desc: "Extra points for a top rating from clients", color: "from-yellow-500 to-orange-500", bg: "bg-yellow-50", accent: "text-yellow-600" },
  { icon: Sparkles, label: "Appearance & attitude", desc: "Rewarded for professional presentation", color: "from-purple-500 to-pink-500", bg: "bg-purple-50", accent: "text-purple-600" },
  { icon: Zap, label: "Extra shifts", desc: "More shifts = more points, it's that simple", color: "from-green-500 to-emerald-500", bg: "bg-green-50", accent: "text-green-600" },
  { icon: Flame, label: "Last-minute availability", desc: "Stepping in at short notice? Double appreciation", color: "from-red-500 to-orange-500", bg: "bg-red-50", accent: "text-red-600" },
  { icon: Shield, label: "Reliability", desc: "No no-shows earns a reliability bonus", color: "from-indigo-500 to-purple-500", bg: "bg-indigo-50", accent: "text-indigo-600" },
];

const challenges = [
  { icon: "🏆", title: "Shift Spinner", desc: "Complete 10 shifts in one month and rise to the next level", punten: "+250 pts" },
  { icon: "⚡", title: "Last-minute Hero", desc: "Respond 3x within 2 hours to a call", punten: "+180 pts" },
  { icon: "⏱️", title: "Punctuality Specialist", desc: "Arrive exactly on time for 5 shifts in a row", punten: "+150 pts" },
  { icon: "🌟", title: "Client Favorite", desc: "Receive a 9+ rating from clients", punten: "+200 pts" },
  { icon: "🤝", title: "Talent Scout", desc: "Refer a new employee and earn extra", punten: "+300 pts" },
  { icon: "📱", title: "Social Ambassador", desc: "Share an EXTRA post on social media", punten: "+100 pts" },
];

const beloningen = [
  { icon: "🎵", title: "JBL Charge 3", pts: "500 pts", cat: "Gadgets" },
  { icon: "🎧", title: "AirPods Pro", pts: "1,000 pts", cat: "Gadgets" },
  { icon: "🎁", title: "Bol.com Gift Card", pts: "250 pts", cat: "Gift Card" },
  { icon: "🚲", title: "Swapfiets 1 month", pts: "350 pts", cat: "Experience" },
  { icon: "👕", title: "EXTRA Gear", pts: "150 pts", cat: "Merchandise" },
  { icon: "✈️", title: "Travel allowance", pts: "200 pts", cat: "Transport" },
];

const kortingen = [
  { brand: "Swapfiets", korting: "30% discount", desc: "On an annual subscription" },
  { brand: "Hashlogics", korting: "20% discount", desc: "On all products" },
  { brand: "Bonus", korting: "30% discount", desc: "Employee deal at partner" },
];

export default function RewardsEn() {
  useEffect(() => {
    document.title = "EXTRAATJE Rewards | Points & Benefits | EXTRA";
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "EXTRAATJE is the unique points system from EXTRA where employees automatically earn points for every worked shift, challenge and micro-achievement.");
    setMeta("og:title", "EXTRAATJE Rewards | Points & Benefits", true);
    setMeta("og:description", "Earn points, complete challenges and exchange them for rewards, discounts and deals. Working at EXTRA literally pays off.", true);
    setMeta("og:type", "website", true);
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = "https://www.doehetextra.nl/en/rewards";
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How does the EXTRAATJE points system work?", "acceptedAnswer": { "@type": "Answer", "text": "Employees automatically earn points for every worked shift, arriving on time, high ratings and completing challenges." } },
        { "@type": "Question", "name": "What are challenges at EXTRA?", "acceptedAnswer": { "@type": "Answer", "text": "Challenges are optional goals that employees can achieve weekly or monthly. They provide bonus points." } },
        { "@type": "Question", "name": "What can I do with my points?", "acceptedAnswer": { "@type": "Answer", "text": "Points can be exchanged for physical rewards, exclusive discount codes from partners, or experiences." } },
      ]
    };
    let scriptEl = document.querySelector("#extraatje-schema") as HTMLScriptElement;
    if (!scriptEl) { scriptEl = document.createElement("script"); scriptEl.id = "extraatje-schema"; scriptEl.type = "application/ld+json"; document.head.appendChild(scriptEl); }
    scriptEl.textContent = JSON.stringify(schema);
    return () => { scriptEl?.remove(); canonical?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>

      <PublicNav />

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}
      >
        <XPatternBgDark />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-32 sm:pt-40 pb-20 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-xs sm:text-sm font-semibold">Exclusive for EXTRA employees</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
            EXTRAATJE
            <span className="relative inline-block">
              <span className="relative z-10">the rewards system</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
            </span>
            {" "}that rewards your work
          </h1>
          <p className="text-lg sm:text-xl text-purple-100/90 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Employees at EXTRA automatically earn points for every worked shift,
            completed challenge and micro-achievement. You exchange those points for real rewards.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/aanmelden"
              className="group bg-white text-purple-900 font-bold px-7 py-3.5 rounded-full hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
            >
              Start earning <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              href="/en/about"
              className="border-2 border-white/30 text-white font-bold px-7 py-3.5 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2"
            >
              More about EXTRA <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 -mt-12 mb-0">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-900/10 border border-purple-100/60 p-6 sm:p-8 lg:p-10 grid grid-cols-3 gap-4 sm:gap-6">
          {[
            { num: "9,250", label: "Avg. points per employee", icon: Star, color: "text-yellow-500" },
            { num: "30+", label: "Exclusive partner deals", icon: Gift, color: "text-purple-600" },
            { num: "9+", label: "Active challenges", icon: Trophy, color: "text-orange-500" },
          ].map(({ num, label, icon: Icon, color }) => (
            <div key={label} className="text-center">
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color} mx-auto mb-2`} />
              <p className="text-xl sm:text-3xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{num}</p>
              <p className="text-[11px] sm:text-sm text-gray-400 mt-1 font-semibold leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOE WERKT HET? ── */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        <XPatternBg />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Points System</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  How does the EXTRAATJE points system work?
                </h2>
                <p className="text-gray-600 leading-relaxed mb-5 text-base sm:text-lg">
                  As soon as you work a shift at EXTRA, your points balance starts to grow.
                  The system automatically records your effort, performance and behavior, without you having to do anything.
                </p>
                <p className="text-gray-600 leading-relaxed mb-8 text-base sm:text-lg">
                  The more you work, the higher your score. From <strong className="text-gray-900">BRONZE</strong> to <strong className="text-gray-900">SILVER</strong> to <strong className="text-gray-900">GOLD</strong> to <strong className="text-gray-900">DIAMOND</strong>.
                </p>
                <div className="space-y-3">
                  {[
                    "Automatic points with every worked shift",
                    "Status levels: Bronze → Silver → Gold → Diamond",
                    "Real-time insight via the EXTRA app",
                    "Points do not expire, they build up",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium text-sm sm:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <PhoneMockup src={imgDashboard} alt="EXTRA app – your points dashboard" />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── MICRO-PRESTATIES ── */}
      <section className="py-16 sm:py-24 lg:py-32" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Earn Automatically</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 mb-4 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Micro-achievements
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
                You don't have to do anything extra. EXTRA rewards you for what you're already doing:
                doing your job well. Every small achievement counts.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {microPrestaties.map(({ icon: Icon, label, desc, color }, i) => (
              <RevealSection key={label} delay={i * 60}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] shadow-lg shadow-purple-500/5 border-2 border-purple-100 p-6 hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHALLENGES ── */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        <XPatternBg />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-12 sm:mb-16">
              <div className="order-2 lg:order-1">
                <PhoneMockup src={imgChallenges} alt="EXTRA app – active challenges" />
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Challenges & Goals</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Challenges
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6 text-base sm:text-lg">
                  In addition to automatic points, you can earn extra by completing weekly and monthly
                  challenges. Optional, but rewarding.
                </p>
                <div className="space-y-2.5 mb-6">
                  {challenges.slice(0, 4).map(({ icon, title, punten }) => (
                    <div key={title} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border-2 border-purple-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <span className="text-sm font-semibold text-gray-900">{title}</span>
                      </div>
                      <span className="text-sm font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full">{punten}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 font-medium">And 5+ other challenges every month →</p>
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {challenges.map(({ icon, title, desc, punten }, i) => (
                <RevealSection key={title} delay={i * 50}>
                  <div className="bg-white rounded-2xl p-5 border-2 border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-200 hover:-translate-y-1 transition-all h-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs font-black text-green-600 bg-green-100 px-2.5 py-1 rounded-full">{punten}</span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 mb-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── BELONINGEN ── */}
      <section className="py-16 sm:py-24 lg:py-32" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Real Rewards</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Rewards you can earn
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-base sm:text-lg">
                  Your points are not just points on paper, they are real value. Exchange them
                  for gadgets, gift cards, experiences or merchandise. You choose.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {beloningen.map(({ icon, title, pts, cat }) => (
                    <div key={title} className="bg-white rounded-xl p-4 border-2 border-purple-100 shadow-sm hover:border-purple-200 hover:shadow-md transition-all">
                      <span className="text-2xl block mb-2">{icon}</span>
                      <p className="text-sm font-black text-gray-900 leading-tight mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</p>
                      <p className="text-xs text-gray-400 font-medium">{cat}</p>
                      <p className="text-xs font-black text-green-600 mt-2">{pts}</p>
                    </div>
                  ))}
                </div>
              </div>
              <PhoneMockup src={imgBeloningen} alt="EXTRA app – rewards like JBL and AirPods" />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── KORTINGEN ── */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        <XPatternBg />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <PhoneMockup src={imgKortingen} alt="EXTRA app – discount codes and partner deals" />
              </div>
              <div className="order-1 lg:order-2">
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Partner Deals</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Discount Codes & Deals
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-base sm:text-lg">
                  In addition to physical rewards, we have exclusive deals with our partners.
                  Exchange your points for discount codes that you can use immediately.
                </p>
                <div className="space-y-3">
                  {kortingen.map(({ brand, korting, desc }) => (
                    <div key={brand} className="flex items-center justify-between bg-white rounded-xl px-4 py-3.5 border-2 border-purple-100 shadow-sm hover:border-purple-200 transition-all">
                      <div>
                        <p className="text-sm font-black text-gray-900">{brand}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <span className="text-sm font-black text-green-600 bg-green-100 px-3 py-1.5 rounded-full shrink-0 ml-4">{korting}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4 font-medium">More deals are added monthly</p>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── RANGLIJST ── */}
      <section className="py-16 sm:py-24 lg:py-32" style={{ background: "linear-gradient(135deg, #f9f7ff 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Competition</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Leaderboard & Status
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6 text-base sm:text-lg">
                  See how you rank against your colleagues. The top 10 of the month receive
                  bonus points and exclusive badges.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Monthly Top 10</h4>
                      <p className="text-sm text-gray-500">Extra bonus points for the most active professionals.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Status Badges</h4>
                      <p className="text-sm text-gray-500">Unlock unique badges for special achievements.</p>
                    </div>
                  </div>
                </div>
              </div>
              <PhoneMockup src={imgRanglijst} alt="EXTRA app – monthly leaderboard" />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQSection
        heading="Frequently Asked Questions about EXTRAATJE"
        faqs={[
          {
            q: "How do I earn points exactly?",
            a: "You earn points automatically for every worked shift. In addition, there are micro-achievements (like arriving on time, receiving high ratings) and specific challenges that provide extra points."
          },
          {
            q: "Do my points expire?",
            a: "No, your points remain valid as long as you are active at EXTRA. If you don't work for more than 6 months, your balance may be reset, but we will always inform you in advance."
          },
          {
            q: "How do I redeem my rewards?",
            a: "In the EXTRA app, you'll find the 'Rewards' tab. Here you can see all available gadgets, vouchers and deals. If you have enough points, you can claim the reward with one click."
          },
          {
            q: "Can I also earn points by referring colleagues?",
            a: "Yes! Referring new talent is one of the biggest 'Talent Scout' challenges and provides a significant point bonus once they have worked their first shifts."
          }
        ]}
      />

      {/* ── FINAL CTA ── */}
      <section className="relative py-20 sm:py-32 overflow-hidden bg-purple-900 text-white">
        <XPatternBgDark />
        <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
          <RevealSection>
            <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Ready to be rewarded for your work?
            </h2>
            <p className="text-lg sm:text-xl text-purple-100/80 mb-10 max-w-2xl mx-auto">
              Apply today, work your first shift and start building your points balance.
              Werken bij EXTRA loont letterlijk.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/aanmelden"
                className="w-full sm:w-auto bg-white text-purple-900 font-black px-10 py-4 rounded-full text-lg shadow-xl hover:shadow-white/20 transition-all hover:-translate-y-1"
              >
                Apply now
              </a>
              <Link
                href="/contact"
                className="w-full sm:w-auto border-2 border-white/30 text-white font-bold px-10 py-4 rounded-full text-lg hover:bg-white/10 transition-all"
              >
                Ask a question
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
