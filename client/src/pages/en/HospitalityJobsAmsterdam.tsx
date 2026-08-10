import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  ArrowRight, MapPin, Star, Clock, Gift, Users, CheckCircle2,
  Building2, UtensilsCrossed, BedDouble, ChefHat, ConciergeBell, Zap
} from "lucide-react";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import horecaImg from "@assets/Horecamedewerker_1771836004844.webp";
import housekeepingImg from "@assets/Housekeeping_1771842919384.webp";
import chefImg from "@assets/Chef_1771833440047.webp";
import frontOfficeImg from "@assets/Front-office_1771842663934.webp";
import marriottLogo from "@assets/Logo_Marriott_1771267205959.webp";
import amrathLogo from "@assets/Logo_amrath_1771267205959.webp";
import hiltonLogo from "@assets/Logo_Hilton_1771267205959.webp";
import mercureLogo from "../../assets/pitch/logo-mercure.webp";
import pulitzerLogo from "@assets/Logo_Pulitzer_1773389329669.webp";
import nhLogo from "@assets/Logo_NH_1773389329669.webp";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.07, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}
function XPat({ color = "rgba(139,92,246,1)", opacity = 0.07 }: { color?: string; opacity?: number }) {
  return <div className="absolute inset-0 pointer-events-none overflow-hidden">{[{ left: "4%", top: "10%", w: 180, rot: 15 }, { left: "76%", top: "14%", w: 140, rot: -8 }, { left: "47%", top: "70%", w: 160, rot: 25 }].map((x, i) => <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: color }} />)}</div>;
}

const roles = [
  { icon: UtensilsCrossed, img: horecaImg, title: "F&B Staff", desc: "Serving, bartending, running and banqueting at Amsterdam's finest venues.", href: "/en/hospitality-work", badge: "Most popular", bg: "from-purple-500 to-violet-600" },
  { icon: BedDouble, img: housekeepingImg, title: "Housekeeping", desc: "Room attendants and public area cleaners for hotels across Amsterdam.", href: "/en/housekeeping-jobs", badge: null, bg: "from-blue-500 to-cyan-600" },
  { icon: ChefHat, img: chefImg, title: "Chef", desc: "Sous chefs, CDP, commis and pastry chefs for hotel kitchens and events.", href: "/en/chef-jobs", badge: null, bg: "from-amber-500 to-orange-500" },
  { icon: ConciergeBell, img: frontOfficeImg, title: "Front Office", desc: "Receptionists, concierge and guest service roles at top-rated hotels.", href: "/en/front-office-jobs", badge: null, bg: "from-green-500 to-emerald-600" },
];

const logos = [marriottLogo, hiltonLogo, amrathLogo, mercureLogo, pulitzerLogo, nhLogo];

export default function HospitalityJobsAmsterdam() {
  useEffect(() => {
    document.title = "Hospitality Jobs Amsterdam | EXTRA Staffing Agency";
    const s = (n: string, c: string, a = 'name') => { let el = document.querySelector(`meta[${a}="${n}"]`) as HTMLMetaElement; if (!el) { el = document.createElement('meta'); el.setAttribute(a, n); document.head.appendChild(el); } el.setAttribute('content', c); };
    const l = (rel: string, href: string, hl?: string) => { const sel = hl ? `link[rel="${rel}"][hreflang="${hl}"]` : `link[rel="${rel}"]`; let el = document.querySelector(sel) as HTMLLinkElement; if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); if (hl) el.setAttribute('hreflang', hl); document.head.appendChild(el); } el.setAttribute('href', href); };
    s('description', 'Looking for hospitality work in Amsterdam? EXTRA places F&B staff, housekeepers, chefs and front office professionals at top hotels, event venues and restaurants. Apply now.');
    l('canonical', 'https://www.doehetextra.nl/en/hospitality-jobs');
    // hreflang-alternates (nl/en/x-default) komen sinds P13 server-side uit
    // shared/routeMeta.ts (HREFLANG_GROUPS) — hier hardcoded zetten zou ze na
    // hydratie weer overschrijven met een niet-onderhouden, x-default-loze set.
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <PublicNav />

      {/* HERO */}
      <section className="relative py-28 sm:py-36 lg:py-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPat color="rgba(255,255,255,0.9)" opacity={0.08} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-green-500/30">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Positions available
              </span>
              <span className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-purple-500/30">
                <MapPin className="w-3 h-3" /> Amsterdam
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-[1.06]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Hospitality jobs<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">in Amsterdam</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/75 max-w-2xl mb-10 leading-relaxed">
              Work at Amsterdam's best hotels, event venues and restaurants. On a proper contract, with same-day pay and real rewards for every shift you complete.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/aanmelden" className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold px-8 py-4 rounded-full hover:shadow-xl hover:shadow-white/20 transition-all hover:-translate-y-1 text-base">
                Apply now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/en/rewards" className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all">
                <Gift className="w-5 h-5" /> See rewards
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* LOGOS */}
      <div className="bg-white border-b border-gray-100 py-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <p className="text-center text-xs text-gray-400 uppercase tracking-widest font-bold mb-6">Our clients include</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {logos.map((logo, i) => <img key={i} src={logo} alt="Client logo" className="h-7 sm:h-8 object-contain opacity-50 hover:opacity-80 transition-opacity grayscale" loading="lazy" />)}
          </div>
        </div>
      </div>

      {/* ROLES */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-white">
        <XPat color="rgba(139,92,246,1)" opacity={0.05} />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Open positions</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>What are you looking for?</h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 gap-6">
            {roles.map((role, i) => (
              <RevealSection key={i} delay={i * 80}>
                <Link href={role.href} className="group block rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-purple-900/10 transition-all hover:-translate-y-1">
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img src={role.img} alt={role.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent`} />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${role.bg} flex items-center justify-center shadow-lg`}>
                        <role.icon className="w-5 h-5 text-white" />
                      </div>
                      {role.badge && <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-2.5 py-1 rounded-full">{role.badge}</span>}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-black text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">{role.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{role.desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-purple-600 font-bold text-sm">
                      View positions <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* WHY EXTRA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPat color="rgba(255,255,255,0.9)" opacity={0.07} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-5xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>Why work with EXTRA?</h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: CheckCircle2, label: "Formal employment", desc: "Employed on a proper contract. No zero-hours, no uncertainty." },
              { icon: Zap, label: "Same-day pay", desc: "Get paid on the day you work via the app. No waiting for payslips." },
              { icon: Gift, label: "Real rewards", desc: "Points for every shift, redeemable for AirPods, cinema, padel and more." },
              { icon: Star, label: "Top venues", desc: "Work at Marriott, Hilton, Amrâth and other leading hospitality brands." },
              { icon: Clock, label: "Flexible scheduling", desc: "Choose your hours. Work when it suits you." },
              { icon: Users, label: "Community", desc: "Join 800+ active hospitality professionals in our network." },
            ].map((f, i) => (
              <RevealSection key={i} delay={i * 60}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/15 hover:bg-white/15 transition-all">
                  <f.icon className="w-8 h-8 text-purple-300 mb-3" />
                  <h3 className="font-black text-white text-sm mb-1.5">{f.label}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection className="mt-14 text-center">
            <Link href="/aanmelden" className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold px-10 py-5 rounded-full hover:shadow-xl hover:shadow-white/20 transition-all hover:-translate-y-1 text-base">
              Apply now <ArrowRight className="w-5 h-5" />
            </Link>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
