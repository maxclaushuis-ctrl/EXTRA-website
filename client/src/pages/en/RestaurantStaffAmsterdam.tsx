import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  ArrowRight, Check, Phone, Shield, Clock, Heart,
  Users, Zap, UserCheck, BarChart3, ChefHat
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import screenshotGebruikers from "@assets/Gebruikers_1772098047298.webp";

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

export default function RestaurantStaffAmsterdam() {
  useEffect(() => {
    document.title = "Restaurant Staff Amsterdam | Flexible Hospitality Staffing | EXTRA";
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
    setMeta('description', 'Flexible restaurant staff in Amsterdam. EXTRA supplies vetted waitstaff, bar staff, runners and kitchen support for restaurants, brasseries and dining concepts.');
    setLink('canonical', 'https://www.doehetextra.nl/en/restaurant-staff-amsterdam');
    setLink('alternate', 'https://www.doehetextra.nl/horecapersoneel-restaurants', 'nl');
    setLink('alternate', 'https://www.doehetextra.nl/en/restaurant-staff-amsterdam', 'en');
    setMeta('og:title', 'Restaurant Staff Amsterdam | EXTRA', 'property');
    setMeta('og:description', 'Flexible restaurant staff in Amsterdam. Vetted waitstaff, bar staff, runners and kitchen support for any dining concept.', 'property');
    setMeta('og:url', 'https://www.doehetextra.nl/en/restaurant-staff-amsterdam', 'property');
    setMeta('og:type', 'website', 'property');
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <PublicNav />

      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBgImage} alt="Restaurant staff serving guests at an Amsterdam restaurant" className="absolute inset-0 w-full h-full object-cover object-right sm:object-center" loading="eager" fetchPriority="high" decoding="async" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(88,22,164,0.92) 0%, rgba(88,22,164,0.88) 40%, rgba(88,22,164,0.70) 65%, rgba(88,22,164,0.35) 82%, rgba(88,22,164,0.10) 100%)` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
        </div>
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.9)" className="z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">Restaurant professionals on demand</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 certified</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Restaurant staff<br />
              <span className="text-purple-200">who fit your floor.</span>
            </h1>
            <p className="text-white/85 text-lg sm:text-xl leading-relaxed mb-8 sm:mb-12 max-w-xl">
              EXTRA delivers waitstaff, bartenders, runners and kitchen support for Amsterdam restaurants. Screened professionals who match your pace, service standard and concept.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/personeelsaanvraag" className="inline-flex items-center justify-center gap-2.5 bg-white text-purple-700 font-black text-base sm:text-lg px-8 py-4 rounded-full hover:bg-purple-50 hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-200 hover:-translate-y-0.5">
                <Phone className="w-5 h-5" /> Request restaurant staff
              </Link>
              <Link href="/en/hospitality-staff-amsterdam" className="inline-flex items-center justify-center gap-2 text-white/90 font-bold text-base sm:text-lg px-8 py-4 rounded-full border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all duration-200">
                All sectors <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100">
        <RevealSection>
          <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-10 sm:mb-14">
            Working with restaurants and dining concepts across Amsterdam
          </p>
        </RevealSection>
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 lg:gap-16 px-6">
          {[
            { src: logoHetePeper, alt: "Hete Peper restaurant" },
            { src: logoAppel, alt: "Appèl restaurant" },
            { src: logoFunda, alt: "Funda" },
          ].map((logo) => (
            <img key={logo.alt} src={logo.src} alt={logo.alt} className="h-12 sm:h-14 lg:h-16 w-auto max-w-[130px] sm:max-w-[160px] object-contain opacity-70 hover:opacity-100 transition-opacity" loading="lazy" decoding="async" />
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-14 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <ChefHat className="w-4 h-4" /> Restaurant roles
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Every position on<br className="hidden sm:block" /> the floor and behind it
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                We supply trained professionals across all restaurant roles, selected on their experience and performance history.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              { icon: "🍽️", title: "Waitstaff", desc: "Service professionals who read the table, handle requests and represent your brand well." },
              { icon: "🍸", title: "Bartenders", desc: "Confident bar staff experienced in cocktail service, wine and high-volume settings." },
              { icon: "🏃", title: "Runners", desc: "Fast and focused runners who keep the flow between kitchen and table smooth." },
              { icon: "👨‍🍳", title: "Kitchen support", desc: "Commis chefs and prep staff to support your kitchen during busy services." },
              { icon: "🥗", title: "Breakfast service", desc: "Experienced staff for hotel breakfast and brunch service, efficient and presentable." },
              { icon: "👔", title: "Team leads", desc: "Experienced floor managers and shift leads who keep the whole service on track." },
            ].map((card, i) => (
              <RevealSection key={i} delay={i * 70}>
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

      {/* DATA */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Smarter matching
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Matched on performance, not just availability
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Every staff member has a performance profile built from actual shift data. We match based on service style, experience level and your specific dining concept.
              </p>
              <ul className="space-y-4">
                {[
                  "Performance scores tracked per discipline and per shift",
                  "Service style matched to your restaurant concept",
                  "No-shows and issues logged immediately",
                  "Your best staff always saved and prioritised",
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
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 sm:px-6 py-3 sm:py-4 border-b border-purple-100/60">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-xs sm:text-sm font-bold text-purple-800 uppercase tracking-wide">Staff overview with scores</span>
                  </div>
                </div>
                <img src={screenshotGebruikers} alt="Restaurant staff performance overview in EXTRA dashboard" className="w-full object-cover" loading="lazy" decoding="async" />
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.9)" />
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 text-center">
          <RevealSection>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Need restaurant staff<br /><span className="text-purple-300">for your next service?</span>
            </h2>
            <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Tell us your restaurant concept, service style and schedule. We match the right professionals and confirm fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/personeelsaanvraag" className="inline-flex items-center justify-center gap-2.5 bg-white text-purple-700 font-black text-lg px-10 py-4 rounded-full hover:bg-purple-50 hover:shadow-2xl transition-all hover:-translate-y-0.5">
                <Phone className="w-5 h-5" /> Request restaurant staff
              </Link>
              <Link href="/en/hospitality-staff-amsterdam" className="inline-flex items-center justify-center gap-2 text-white/90 font-bold text-lg px-10 py-4 rounded-full border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all">
                View all sectors <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
