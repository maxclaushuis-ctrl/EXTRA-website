import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  ArrowRight, Check, Phone, Shield, Clock, Star, Heart,
  TrendingUp, Users, Zap, Gift, UserCheck, Tag, BarChart3,
  CalendarCheck, Building2, Hotel, Sparkles
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoNH from "../../assets/pitch/logo-nh.png";
import logoMercure from "../../assets/pitch/logo-mercure.png";
import logoPulitzer from "../../assets/pitch/logo-pulitzer.png";
import screenshotGebruikers from "@assets/Gebruikers_1772098047298.webp";
import screenshotProfiel from "@assets/Medewerkersprofiel_1772098064753.webp";
import screenDashboard from "@assets/IMG_9066_1773314165933.png";
import screenRewards from "@assets/IMG_9067_1773314165933.png";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function XPatternBg({ className = "", count = 3, opacity = 0.08, color = "rgba(139,92,246,1)" }: { className?: string; count?: number; opacity?: number; color?: string }) {
  const positions = [
    { left: "5%", top: "10%", size: 200, rotate: 15 },
    { left: "80%", top: "20%", size: 160, rotate: -25 },
    { left: "50%", top: "60%", size: 240, rotate: 35 },
    { left: "15%", top: "75%", size: 180, rotate: -10 },
    { left: "90%", top: "80%", size: 140, rotate: 45 },
    { left: "35%", top: "30%", size: 120, rotate: -30 },
  ];
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {positions.slice(0, count).map((pos, i) => (
        <div key={i} className="absolute" style={{
          left: pos.left, top: pos.top, width: pos.size, height: pos.size,
          transform: `rotate(${pos.rotate}deg)`, opacity,
          WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          backgroundColor: color,
        }} />
      ))}
    </div>
  );
}

export default function HotelStaffingAmsterdam() {
  useEffect(() => {
    document.title = "Hotel Staff Amsterdam | Flexible Hotel Staffing Agency | EXTRA";
    const setMeta = (nameOrProp: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, nameOrProp); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const setLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
      let el = document.querySelector(selector) as HTMLLinkElement | null;
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); if (hreflang) el.setAttribute('hreflang', hreflang); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };
    setMeta('description', 'Flexible hotel staff in Amsterdam on demand. EXTRA supplies vetted housekeeping, F&B, banqueting and front office professionals for hotels of all sizes.');
    setLink('canonical', 'https://www.doehetextra.nl/en/hotel-staffing-amsterdam');
    setLink('alternate', 'https://www.doehetextra.nl/hotelpersoneel-inhuren', 'nl');
    setLink('alternate', 'https://www.doehetextra.nl/en/hotel-staffing-amsterdam', 'en');
    setMeta('og:title', 'Hotel Staff Amsterdam | EXTRA', 'property');
    setMeta('og:description', 'Flexible hotel staff in Amsterdam on demand. EXTRA supplies vetted housekeeping, F&B, banqueting and front office professionals.', 'property');
    setMeta('og:url', 'https://www.doehetextra.nl/en/hotel-staffing-amsterdam', 'property');
    setMeta('og:type', 'website', 'property');
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <PublicNav />

      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBgImage} alt="Hotel staff ready to work in Amsterdam" className="absolute inset-0 w-full h-full object-cover object-right sm:object-center" loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(88,22,164,0.92) 0%, rgba(88,22,164,0.88) 40%, rgba(88,22,164,0.70) 65%, rgba(88,22,164,0.35) 82%, rgba(88,22,164,0.10) 100%)` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
        </div>
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.9)" className="z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">Active in Amsterdam hotels</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 certified</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Hotel staffing<br />
              <span className="text-purple-200">done right.</span>
            </h1>
            <p className="text-white/85 text-lg sm:text-xl leading-relaxed mb-8 sm:mb-12 max-w-xl">
              EXTRA delivers vetted hotel professionals for Amsterdam's leading properties. Housekeeping, F&B, banqueting, front office. Familiar faces who know your standards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/personeelsaanvraag" className="inline-flex items-center justify-center gap-2.5 bg-white text-purple-700 font-black text-base sm:text-lg px-8 py-4 rounded-full hover:bg-purple-50 hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-200 hover:-translate-y-0.5">
                <Phone className="w-5 h-5" /> Request hotel staff
              </Link>
              <Link href="/en/hospitality-staff-amsterdam" className="inline-flex items-center justify-center gap-2 text-white/90 font-bold text-base sm:text-lg px-8 py-4 rounded-full border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all duration-200">
                All sectors <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOTEL LOGOS */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100 relative overflow-hidden">
        <RevealSection>
          <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">
            Trusted by leading Amsterdam hotel brands
          </p>
        </RevealSection>
        <div className="relative group overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="flex animate-marquee-hotel-en group-hover:[animation-play-state:paused]">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex items-center gap-10 sm:gap-16 lg:gap-20 px-5 sm:px-10 flex-shrink-0">
                {[
                  { src: logoMarriott, alt: "Marriott Hotels Amsterdam" },
                  { src: logoHilton, alt: "Hilton Hotels Amsterdam" },
                  { src: logoAmrath, alt: "Amrâth Hotels Amsterdam" },
                  { src: logoNH, alt: "NH Hotels" },
                  { src: logoMercure, alt: "Mercure Hotels" },
                  { src: logoPulitzer, alt: "Pulitzer Amsterdam" },
                ].map((logo) => (
                  <div key={`${setIdx}-${logo.alt}`} className="flex-shrink-0 hover:scale-105 transition-transform duration-300">
                    <img src={logo.src} alt={logo.alt} width="200" height="200" loading="lazy" decoding="async" className="h-12 sm:h-16 lg:h-20 w-auto max-w-[120px] sm:max-w-[160px] object-contain opacity-70 hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee-hotel-en { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee-hotel-en { animation: marquee-hotel-en 30s linear infinite; }
        `}</style>
      </section>

      {/* ROLES */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Hotel className="w-4 h-4" /> Hotel roles
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Every hotel department,<br className="hidden sm:block" /> fully staffed
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                We supply professionals across all hotel departments, each personally screened and experienced in hospitality service standards.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { icon: "🛏️", title: "Housekeeping", desc: "Room attendants and supervisors who meet your SOP without being told twice." },
              { icon: "🥂", title: "Banqueting", desc: "Experienced banqueting staff for conferences, gala dinners and large events." },
              { icon: "🍽️", title: "F&B Service", desc: "Waitstaff, runners and bar staff for hotel restaurants and room service." },
              { icon: "🏨", title: "Front Office", desc: "Receptionists and front desk staff who represent your brand with confidence." },
            ].map((card, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all duration-300">
                  <div className="text-3xl mb-4">{card.icon}</div>
                  <h3 className="text-lg font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>{card.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* PERFORMANCE DATA */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Data and insight
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Scores tracked after every shift
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                We measure softskills, service quality and reliability after each shift. This data drives every match we make. You get staff selected on evidence, not assumptions.
              </p>
              <ul className="space-y-4">
                {[
                  "Individual performance score per staff member",
                  "Consistency tracked across multiple placements",
                  "No-shows and complaints immediately logged",
                  "Your preferred staff always prioritised",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-gray-700 font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="space-y-5">
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-2xl sm:rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 sm:px-6 py-3 sm:py-4 border-b border-purple-100/60">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-xs sm:text-sm font-bold text-purple-800 uppercase tracking-wide">Staff overview</span>
                      </div>
                    </div>
                    <img src={screenshotGebruikers} alt="Hotel staff overview dashboard with performance ratings" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" loading="lazy" decoding="async" />
                  </div>
                </div>
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-green-200 to-emerald-200 rounded-2xl sm:rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 sm:px-6 py-3 sm:py-4 border-b border-green-100/60">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-green-600" />
                        <span className="text-xs sm:text-sm font-bold text-green-800 uppercase tracking-wide">Individual staff profile</span>
                      </div>
                    </div>
                    <img src={screenshotProfiel} alt="Individual hotel staff profile with performance scores" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" loading="lazy" decoding="async" />
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* WHY EXTRA FOR HOTELS */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.9)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Why hotels choose EXTRA
              </h2>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: UserCheck, title: "Hotel-experienced staff", desc: "Every team member understands hotel standards, SOPs and brand expectations before day one." },
              { icon: Clock, title: "Fast turnaround", desc: "Last-minute request? We are used to it. Our response time is often within the hour." },
              { icon: Heart, title: "Dedicated talent pool", desc: "Your favourites are saved and available first for your next request." },
              { icon: Shield, title: "Fully insured and compliant", desc: "All employment, insurance and tax obligations handled by EXTRA. Zero admin for you." },
              { icon: BarChart3, title: "Performance scores per shift", desc: "No guesswork. Every placement is tracked so you always know the standard you are booking." },
              { icon: Gift, title: "Motivated by rewards", desc: "Our staff app drives genuine motivation with challenges and real prizes." },
            ].map((card, i) => (
              <RevealSection key={i} delay={i * 60}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-purple-200" />
                  </div>
                  <h3 className="text-base font-black text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-white/65 leading-relaxed">{card.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={400}>
            <div className="text-center mt-12">
              <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-black text-lg px-10 py-4 rounded-full hover:bg-purple-50 hover:shadow-2xl transition-all hover:-translate-y-0.5">
                <Phone className="w-5 h-5" /> Request hotel staff now
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
