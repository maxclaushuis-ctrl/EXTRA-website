import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  Phone, Users, ClipboardList, TrendingUp, Check, Shield, Star,
  ArrowRight, UserCheck, Briefcase, Gift, MessageCircle, BarChart2, Clock, Zap
} from "lucide-react";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoMercure from "../../assets/pitch/logo-mercure.png";
import logoPulitzer from "../../assets/pitch/logo-pulitzer-clean.svg";
import xPatroon from "@assets/X_patroon_1771260543289.webp";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08, rootMargin: "0px 0px -50px 0px" });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}
function XPat({ color = "rgba(139,92,246,1)", opacity = 0.07 }: { color?: string; opacity?: number }) {
  return <div className="absolute inset-0 pointer-events-none overflow-hidden">{[{ left: "4%", top: "10%", w: 200, rot: 15 }, { left: "78%", top: "20%", w: 160, rot: -10 }, { left: "50%", top: "70%", w: 180, rot: 25 }].map((x, i) => <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: color }} />)}</div>;
}

const clientLogos = [logoMarriott, logoHilton, logoAmrath, logoMercure, logoPulitzer, logoHartMuseum];

const employerSteps = [
  { num: "01", icon: Phone, color: "bg-purple-100 text-purple-700", title: "Initial call", desc: "We map your needs in a 20-minute intake: type of work, number of staff, dress code, venue culture and quality requirements." },
  { num: "02", icon: ClipboardList, color: "bg-blue-100 text-blue-700", title: "We match the right profiles", desc: "From our verified pool we select candidates who have already been vetted, have a score above threshold, and fit your venue." },
  { num: "03", icon: UserCheck, color: "bg-green-100 text-green-700", title: "Confirmed and ready", desc: "You receive a confirmed line-up 24 to 48 hours before the shift. Name, photo and profile visible in your dashboard." },
  { num: "04", icon: TrendingUp, color: "bg-amber-100 text-amber-700", title: "Feedback and improvement", desc: "After each shift you give a quick rating. That data feeds directly back into our matching algorithm, making every booking better." },
];

const candidateSteps = [
  { num: "01", icon: Briefcase, color: "bg-purple-100 text-purple-700", title: "Apply online", desc: "Fill in our digital form in under 5 minutes. Basic info, skills, availability and a photo." },
  { num: "02", icon: UserCheck, color: "bg-blue-100 text-blue-700", title: "Selection and intake", desc: "We review your application and invite the strongest candidates for a short intake call." },
  { num: "03", icon: MessageCircle, color: "bg-green-100 text-green-700", title: "First shifts", desc: "After approval you appear in our planner. We match you to venues and clients that suit your profile." },
  { num: "04", icon: Gift, color: "bg-amber-100 text-amber-700", title: "Earn and redeem rewards", desc: "For every shift you earn points. Redeem for real rewards via our app: AirPods, cinema tickets, padel, and more." },
];

export default function HowWeWork() {
  useEffect(() => {
    document.title = "How We Work | EXTRA Hospitality Staffing Amsterdam";
    const s = (n: string, c: string, a = 'name') => { let el = document.querySelector(`meta[${a}="${n}"]`) as HTMLMetaElement; if (!el) { el = document.createElement('meta'); el.setAttribute(a, n); document.head.appendChild(el); } el.setAttribute('content', c); };
    const l = (rel: string, href: string, hl?: string) => { const sel = hl ? `link[rel="${rel}"][hreflang="${hl}"]` : `link[rel="${rel}"]`; let el = document.querySelector(sel) as HTMLLinkElement; if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); if (hl) el.setAttribute('hreflang', hl); document.head.appendChild(el); } el.setAttribute('href', href); };
    s('description', 'How does EXTRA work? Smart selection, verified profiles, same-day pay and a rewards system. Hospitality staffing agency in Amsterdam for hotels, events and restaurants.');
    l('canonical', 'https://www.doehetextra.nl/en/how-we-work');
    l('alternate', 'https://www.doehetextra.nl/horeca-uitzendbureau-amsterdam-werkwijze', 'nl');
    l('alternate', 'https://www.doehetextra.nl/en/how-we-work', 'en');
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PublicNav />

      {/* HERO */}
      <section className="relative py-28 sm:py-36 lg:py-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPat color="rgba(255,255,255,0.9)" opacity={0.09} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">How it works</span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-6 leading-[1.06]" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Smarter staffing.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Better results.</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/75 max-w-2xl mb-10 leading-relaxed">
              Our process has been built around two sides: venues that need reliable staff, and hospitality professionals who deserve better recognition. This is how we connect them.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/personeelsaanvraag" className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold px-8 py-4 rounded-full hover:shadow-xl hover:shadow-white/20 transition-all hover:-translate-y-1">
                Request staff <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/aanmelden" className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all">
                Apply as a professional
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* CLIENT LOGOS */}
      <div className="bg-white border-b border-gray-100 py-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <p className="text-center text-xs text-gray-400 uppercase tracking-widest font-bold mb-6">Trusted by</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {clientLogos.map((logo, i) => (
              <img key={i} src={logo} alt="Client logo" className="h-7 sm:h-8 object-contain opacity-50 hover:opacity-80 transition-opacity grayscale" loading="lazy" />
            ))}
          </div>
        </div>
      </div>

      {/* EMPLOYER STEPS */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPat color="rgba(139,92,246,1)" opacity={0.05} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="mb-14">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-widest mb-3 bg-purple-100/60 px-4 py-2 rounded-full">
                <Users className="w-3.5 h-3.5" /> For employers
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>How it works for you</h2>
              <p className="text-gray-500 mt-3 max-w-xl text-base sm:text-lg">From first contact to a confirmed team on the floor, typically within 24 hours.</p>
            </div>
          </RevealSection>
          <div className="space-y-10">
            {employerSteps.map((step, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className={`flex flex-col sm:flex-row gap-6 sm:gap-10 items-start ${i % 2 === 1 ? "sm:flex-row-reverse" : ""}`}>
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-sm`}>
                      <step.icon className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-purple-400 font-black text-sm tracking-widest">{step.num}</span>
                      <h3 className="text-xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{step.title}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection className="mt-12">
            <div className="bg-purple-50 rounded-2xl p-7 border border-purple-100">
              <div className="grid sm:grid-cols-3 gap-5">
                {[{ icon: Zap, label: "Within 24h", desc: "Typical time to confirmed team" }, { icon: Shield, label: "100% insured", desc: "All staff on formal contract" }, { icon: Star, label: "4.9/5 rating", desc: "Average client satisfaction score" }].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{f.label}</p>
                      <p className="text-xs text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* CANDIDATE STEPS */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #170926 60%, #12071f 100%)" }}>
        <XPat color="rgba(255,255,255,0.9)" opacity={0.07} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="mb-14">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-3 bg-purple-500/20 px-4 py-2 rounded-full">
                <Briefcase className="w-3.5 h-3.5" /> For hospitality professionals
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>Your journey with EXTRA</h2>
              <p className="text-purple-100/65 mt-3 max-w-xl text-base sm:text-lg">From application to your first shift, and earning rewards along the way.</p>
            </div>
          </RevealSection>
          <div className="space-y-10">
            {candidateSteps.map((step, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-purple-300" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-purple-400 font-black text-sm tracking-widest">{step.num}</span>
                      <h3 className="text-xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>{step.title}</h3>
                    </div>
                    <p className="text-purple-100/70 leading-relaxed">{step.desc}</p>
                  </div>
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

      {/* SELECTION */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-white">
        <XPat color="rgba(139,92,246,1)" opacity={0.05} />
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="text-purple-600 text-sm font-bold uppercase tracking-widest">Our selection process</span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Quality starts with selection</h2>
              <p className="text-gray-500 max-w-xl mx-auto mt-3">Not everyone gets in. We screen on attitude, experience, references and digital skills assessment.</p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: ClipboardList, label: "Digital application", desc: "Skills, availability and work history captured in one smart form." },
              { icon: BarChart2, label: "Score-based matching", desc: "Each candidate receives a profile score based on assessment and track record." },
              { icon: UserCheck, label: "Reference check", desc: "We verify work history and request references from previous employers." },
              { icon: MessageCircle, label: "Personal intake", desc: "Every candidate we place has passed a call with our recruitment team." },
              { icon: Clock, label: "Fast and reliable", desc: "Our process takes two to five days, not weeks. Speed without compromising quality." },
              { icon: TrendingUp, label: "Continuous feedback loop", desc: "Post-shift ratings feed back into profiles. The best people get the best shifts." },
            ].map((f, i) => (
              <RevealSection key={i} delay={i * 60}>
                <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-purple-700" />
                  </div>
                  <h3 className="font-black text-gray-900 text-sm mb-1">{f.label}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPat color="rgba(255,255,255,0.9)" opacity={0.07} />
        <div className="max-w-3xl mx-auto px-5 text-center relative z-10">
          <RevealSection>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>Ready to work with EXTRA?</h2>
            <p className="text-purple-200/80 text-lg mb-10">Employer or professional, get in touch and we will take it from there.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/personeelsaanvraag" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-purple-900 font-bold rounded-full px-10 py-4 text-base shadow-xl hover:-translate-y-1 transition-all">
                Request staff <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/aanmelden" className="inline-flex items-center gap-2 border-2 border-white/50 text-white hover:bg-white/10 font-bold rounded-full px-10 py-4 text-base hover:-translate-y-1 transition-all">
                Apply as a professional
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
