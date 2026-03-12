import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { ArrowRight, MapPin, Gift, CheckCircle2, Zap, Banknote, Trophy, CalendarCheck, ChevronDown } from "lucide-react";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import chefImg from "@assets/Chef_1771833440047.webp";
import marriottLogo from "@assets/Logo_Marriott_1771267205959.webp";
import amrathLogo from "@assets/Logo_amrath_1771267205959.webp";
import hiltonLogo from "@assets/Logo_Hilton_1771267205959.webp";
import mercureLogo from "../../assets/pitch/logo-mercure.png";
import pulitzerLogo from "../../assets/pitch/logo-pulitzer-clean.svg";
import nhLogo from "../../assets/pitch/logo-nh-clean.svg";

function useScrollReveal() { const ref = useRef<HTMLDivElement>(null); const [visible, setVisible] = useState(false); useEffect(() => { const el = ref.current; if (!el) return; const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.07, rootMargin: "0px 0px -40px 0px" }); obs.observe(el); return () => obs.disconnect(); }, []); return { ref, visible }; }
function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) { const { ref, visible } = useScrollReveal(); return <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>; }
function XPat({ color = "rgba(139,92,246,1)", opacity = 0.07 }: { color?: string; opacity?: number }) { return <div className="absolute inset-0 pointer-events-none overflow-hidden">{[{ left: "4%", top: "10%", w: 180, rot: 15 }, { left: "76%", top: "14%", w: 140, rot: -8 }, { left: "47%", top: "70%", w: 160, rot: 25 }].map((x, i) => <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: color }} />)}</div>; }

const roles = [
  { icon: "👨‍🍳", title: "Sous Chef", desc: "Second in command. Run sections, supervise junior staff and plate up to executive standards." },
  { icon: "🍳", title: "Chef de Partie", desc: "Run a specific kitchen section: grill, sauté, pastry or cold kitchen." },
  { icon: "🥗", title: "Commis Chef", desc: "Prep work and section support under the supervision of senior chefs." },
  { icon: "🎂", title: "Pastry Chef", desc: "Desserts, breads and pastry for hotel buffets and fine dining." },
  { icon: "🍱", title: "Banqueting Chef", desc: "Large-scale production for conferences, galas and events." },
  { icon: "🔪", title: "Prep Chef", desc: "Mise en place, butchery and stock prep to set the kitchen up for service." },
];

const faq = [
  { q: "What level of experience do you need?", a: "We have positions from commis through to sous chef level. Tell us your background and we will match you to the right role." },
  { q: "Are these permanent or flexible contracts?", a: "Flex contracts via EXTRA. You work the shifts you want. Some chefs work 5 days a week, others fill gaps between permanent roles." },
  { q: "Which kitchens will I work in?", a: "Primarily hotel kitchens: Marriott, Hilton, NH and similar. Also event catering and restaurant kitchens." },
  { q: "Is same-day pay available?", a: "Yes. Paid the same day you work, directly via the app. No waiting until month-end." },
];

const logos = [marriottLogo, hiltonLogo, amrathLogo, mercureLogo, pulitzerLogo, nhLogo];

export default function ChefJobsEn() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Chef Jobs Amsterdam | EXTRA Hospitality Staffing";
    const s = (n: string, c: string, a = 'name') => { let el = document.querySelector(`meta[${a}="${n}"]`) as HTMLMetaElement; if (!el) { el = document.createElement('meta'); el.setAttribute(a, n); document.head.appendChild(el); } el.setAttribute('content', c); };
    const l = (rel: string, href: string, hl?: string) => { const sel = hl ? `link[rel="${rel}"][hreflang="${hl}"]` : `link[rel="${rel}"]`; let el = document.querySelector(sel) as HTMLLinkElement; if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); if (hl) el.setAttribute('hreflang', hl); document.head.appendChild(el); } el.setAttribute('href', href); };
    s('description', 'Chef jobs in Amsterdam. Sous chef, CDP, commis and pastry chef positions at top hotels and event kitchens. Apply via EXTRA and work on a proper contract with same-day pay.');
    l('canonical', 'https://www.doehetextra.nl/en/chef-jobs');
    l('alternate', 'https://www.doehetextra.nl/chef-vacatures-amsterdam', 'nl');
    l('alternate', 'https://www.doehetextra.nl/en/chef-jobs', 'en');
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <PublicNav />

      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0"><img src={chefImg} alt="Chef professional" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-[#1a0a2e]/95 via-[#170926]/80 to-transparent" /></div>
        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-32 sm:py-40">
          <RevealSection>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-green-500/30"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Hiring now</span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-white/20"><MapPin className="w-3 h-3" /> Amsterdam</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.06]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Chef jobs<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">in Amsterdam</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/80 max-w-xl mb-10 leading-relaxed">Sous chef, CDP, commis and pastry chef roles at top hotels and event kitchens. Flexible contracts, same-day pay and rewards for your hard work.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/aanmelden" className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold px-8 py-4 rounded-full hover:shadow-xl transition-all hover:-translate-y-1 text-base">Apply now <ArrowRight className="w-5 h-5" /></Link>
              <Link href="/en/rewards" className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all"><Gift className="w-5 h-5" /> Our rewards</Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <div className="bg-gray-50 border-y border-gray-100 py-10"><div className="max-w-5xl mx-auto px-5 sm:px-8"><p className="text-center text-xs text-gray-400 uppercase tracking-widest font-bold mb-6">Kitchens you will work in</p><div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">{logos.map((logo, i) => <img key={i} src={logo} alt="Client logo" className="h-7 sm:h-8 object-contain opacity-40 hover:opacity-70 transition-opacity grayscale" loading="lazy" />)}</div></div></div>

      <section className="relative py-20 sm:py-28 overflow-hidden">
        <XPat color="rgba(139,92,246,1)" opacity={0.05} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection><div className="text-center mb-14"><span className="text-amber-600 text-sm font-bold uppercase tracking-widest">Kitchen roles</span><h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Available positions</h2></div></RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{roles.map((t, i) => (<RevealSection key={i} delay={i * 60}><div className="bg-amber-50 rounded-2xl p-6 border border-amber-100"><span className="text-3xl mb-3 block">{t.icon}</span><h3 className="font-black text-gray-900 text-base mb-2">{t.title}</h3><p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p></div></RevealSection>))}</div>
        </div>
      </section>

      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPat color="rgba(255,255,255,0.9)" opacity={0.07} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection><div className="text-center mb-14"><h2 className="text-3xl sm:text-5xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>Why chefs choose EXTRA</h2></div></RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{[
            { icon: CheckCircle2, label: "Formal employment", desc: "Proper contract. Taxes and holiday pay handled by us." },
            { icon: Banknote, label: "Same-day pay", desc: "Get paid right after your shift via the app." },
            { icon: Gift, label: "Rewards program", desc: "Points for every shift. Real prizes to redeem." },
            { icon: CalendarCheck, label: "Choose your shifts", desc: "Work when you want. Top up income between permanent roles." },
            { icon: Trophy, label: "Best kitchens", desc: "Marriott, Hilton and other leading hotel brands." },
            { icon: Zap, label: "Start quickly", desc: "Apply today. Often first shift within a week." },
          ].map((f, i) => (<RevealSection key={i} delay={i * 60}><div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/15"><f.icon className="w-8 h-8 text-amber-300 mb-3" /><h3 className="font-black text-white text-sm mb-1.5">{f.label}</h3><p className="text-white/60 text-sm leading-relaxed">{f.desc}</p></div></RevealSection>))}</div>
        </div>
      </section>

      <section className="relative py-20 sm:py-28 bg-white overflow-hidden">
        <XPat color="rgba(139,92,246,1)" opacity={0.04} />
        <div className="max-w-3xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection><div className="text-center mb-12"><h2 className="text-3xl sm:text-4xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Frequently asked questions</h2></div></RevealSection>
          <div className="space-y-3">{faq.map((item, i) => (<RevealSection key={i} delay={i * 50}><button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><span className="font-bold text-gray-900 text-sm sm:text-base">{item.q}</span><ChevronDown className={`w-5 h-5 text-purple-500 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} /></div>{openFaq === i && <p className="mt-3 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">{item.a}</p>}</button></RevealSection>))}</div>
        </div>
      </section>

      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPat color="rgba(255,255,255,0.9)" opacity={0.06} />
        <div className="max-w-3xl mx-auto px-5 text-center relative z-10">
          <RevealSection>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>Ready to cook?</h2>
            <p className="text-purple-200/80 text-lg mb-10">Apply in 5 minutes and start working in Amsterdam's top kitchens.</p>
            <Link href="/aanmelden" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-purple-900 font-bold rounded-full px-10 py-4 text-base shadow-xl hover:-translate-y-1 transition-all">Apply now <ArrowRight className="w-4 h-4" /></Link>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
