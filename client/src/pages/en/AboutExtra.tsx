import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  Users, Heart, Zap, Star, ArrowRight, Shield, TrendingUp,
  Sparkles, Award, Check, Gift, ChevronRight
} from "lucide-react";
import xPatroon from "@assets/X_patroon_1771260543289.webp";

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

function XPat() {
  const positions = [{ left: "5%", top: "10%", w: 200, rot: 15, op: 0.12 }, { left: "15%", top: "75%", w: 180, rot: -10, op: 0.10 }, { left: "75%", top: "20%", w: 240, rot: 30, op: 0.08 }];
  return <div className="absolute inset-0 pointer-events-none overflow-hidden">{positions.map((x, i) => <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity: x.op, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: "rgba(255,255,255,0.9)" }} />)}</div>;
}

function XPatLight() {
  const positions = [{ left: "5%", top: "10%", w: 180, rot: 15, op: 0.07 }, { left: "80%", top: "20%", w: 140, rot: -8, op: 0.05 }, { left: "50%", top: "70%", w: 160, rot: 25, op: 0.06 }];
  return <div className="absolute inset-0 pointer-events-none overflow-hidden">{positions.map((x, i) => <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity: x.op, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: "rgba(139,92,246,1)" }} />)}</div>;
}

export default function AboutExtra() {
  useEffect(() => {
    document.title = "About EXTRA | Hospitality Staffing Agency Amsterdam";
    const s = (n: string, c: string, a = 'name') => { let el = document.querySelector(`meta[${a}="${n}"]`) as HTMLMetaElement; if (!el) { el = document.createElement('meta'); el.setAttribute(a, n); document.head.appendChild(el); } el.setAttribute('content', c); };
    const l = (rel: string, href: string, hl?: string) => { const sel = hl ? `link[rel="${rel}"][hreflang="${hl}"]` : `link[rel="${rel}"]`; let el = document.querySelector(sel) as HTMLLinkElement; if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); if (hl) el.setAttribute('hreflang', hl); document.head.appendChild(el); } el.setAttribute('href', href); };
    s('description', 'EXTRA is a young, energetic hospitality staffing agency in Amsterdam. We connect the best hotel, restaurant and event professionals with leading venues across the Netherlands.');
    l('canonical', 'https://www.doehetextra.nl/en/about');
    l('alternate', 'https://www.doehetextra.nl/over-extra', 'nl');
    l('alternate', 'https://www.doehetextra.nl/en/about', 'en');
    s('og:title', 'About EXTRA | Hospitality Staffing Amsterdam', 'property');
    s('og:description', 'EXTRA is a young, energetic hospitality staffing agency in Amsterdam. Meet the team behind the platform.', 'property');
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PublicNav />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(88,22,164,0.97) 0%, rgba(109,40,217,0.93) 50%, rgba(124,58,237,0.88) 100%)" }}>
        <XPat />
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-32 sm:pt-40 pb-24 sm:pb-32">
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-8">
            <Link href="/en/hospitality-staff-amsterdam" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-semibold">About EXTRA</span>
          </nav>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 mb-6 border border-white/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-xs sm:text-sm font-semibold">800+ active hospitality professionals</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08] mb-5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
            We are{" "}
            <span className="relative inline-block">
              <span className="relative z-10">EXTRA</span>
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-80 rounded-sm" />
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-purple-100/90 max-w-xl mb-8 leading-relaxed font-medium">
            A young, driven hospitality staffing agency raising the bar. People first, and a reward system that actually means something.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/en/our-team" className="group bg-white text-purple-900 font-bold px-7 py-3.5 rounded-full text-base hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2">
              <Users className="w-5 h-5" /> Meet the team <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/en/rewards" className="border-2 border-white/30 text-white font-bold px-7 py-3.5 rounded-full text-base hover:bg-white/10 transition-all hover:-translate-y-1 inline-flex items-center gap-2">
              <Gift className="w-5 h-5" /> Our rewards system
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-900/10 border border-purple-100/60 p-6 sm:p-8 lg:p-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 -mt-12 relative z-10">
            {[
              { num: "893+", label: "Active staff members", icon: Users, color: "text-purple-600" },
              { num: "150+", label: "Happy clients", icon: Heart, color: "text-pink-500" },
              { num: "541K", label: "Points awarded", icon: Sparkles, color: "text-yellow-500" },
              { num: "98%", label: "Satisfaction score", icon: TrendingUp, color: "text-green-500" },
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

      {/* MISSION */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32 overflow-hidden">
        <XPatLight />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Our mission</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-3 mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Work should pay off. In every sense.
                </h2>
                <p className="text-gray-600 leading-relaxed mb-5 text-base sm:text-lg">
                  EXTRA is more than a staffing agency. We are building a fairer, more rewarding way to work in hospitality. Staff who show up and perform earn more, not just in salary, but in recognition and real rewards.
                </p>
                <p className="text-gray-600 leading-relaxed mb-8 text-base sm:text-lg">
                  Our EXTRA rewards point system automatically rewards staff for every shift, every challenge and every time they go the extra mile.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    "All staff employed on a formal contract",
                    "Same-day pay available via the app",
                    "Points and rewards for every shift",
                    "Available fast, including last-minute",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-purple-700" />
                      </div>
                      <span className="text-gray-700 font-medium text-sm sm:text-base">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/en/rewards" className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-7 py-3.5 rounded-full hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/20 transition-all hover:-translate-y-0.5">
                  Learn about the rewards system <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Zap, label: "Rapid response", desc: "A team within 24 hours", bg: "bg-purple-50", color: "text-purple-600" },
                  { icon: Shield, label: "Reliable", desc: "We keep our word", bg: "bg-blue-50", color: "text-blue-600" },
                  { icon: Heart, label: "People first", desc: "Staff and client both", bg: "bg-pink-50", color: "text-pink-600" },
                  { icon: Award, label: "Quality assured", desc: "Strict screening", bg: "bg-amber-50", color: "text-amber-600" },
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

      {/* VALUES */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPat />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="text-purple-300 text-sm font-bold uppercase tracking-widest">Our values</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>What drives us every day</h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Zap, title: "Move fast", desc: "Last-minute request or urgent cover, we are ready. Always." },
              { icon: Heart, title: "People first", desc: "Whether you are staff or client, you are at the centre of what we do." },
              { icon: Shield, title: "Reliable", desc: "A deal is a deal. We deliver on our promises, and tell you immediately if something changes." },
              { icon: Sparkles, title: "That bit extra", desc: "We always do slightly more than asked. In service, in attention and in results." },
            ].map((v, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center mb-4">
                    <v.icon className="w-6 h-6 text-purple-200" />
                  </div>
                  <h3 className="font-black text-white text-base mb-2">{v.title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* NEN */}
      <section className="relative bg-white py-16 sm:py-24 overflow-hidden">
        <XPatLight />
        <div className="max-w-3xl mx-auto px-5 sm:px-8 relative z-10 text-center">
          <RevealSection>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>Fully certified and compliant</h2>
            <p className="text-gray-600 leading-relaxed mb-8 text-base sm:text-lg max-w-xl mx-auto">
              EXTRA holds NEN-4400-1 certification, the Dutch standard for staffing agencies. All staff work on formal contracts and all statutory obligations are handled by us.
            </p>
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 font-bold text-sm px-6 py-3 rounded-full border border-green-200 mb-8">
              <Shield className="w-4 h-4" /> NEN-4400-1 certified
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/en/our-team" className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-8 py-4 rounded-full hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-0.5">
                <Users className="w-5 h-5" /> Meet the team
              </Link>
              <Link href="/personeelsaanvraag" className="inline-flex items-center gap-2 border-2 border-purple-600 text-purple-600 font-bold px-8 py-4 rounded-full hover:bg-purple-50 transition-all">
                Request staff <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
