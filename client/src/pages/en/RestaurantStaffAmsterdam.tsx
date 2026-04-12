import { useEffect, useRef, useState } from "react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import {
  ArrowRight, Check, Phone, Shield, Clock, Star, Heart,
  TrendingUp, Users, Zap, Gift, UserCheck,
  Tag, ThumbsUp, MessageCircle, Sparkles,
  Utensils, GlassWater, ChefHat, BarChart3
} from "lucide-react";
import heroBgImage from "@assets/BAR_BEDIENING_FINAL_002_1775574495470.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoFunda from "@assets/Logo_funda_1771267205959.webp";
import sollicitatieImg from "@assets/Sollicitatieformulier_1772893764120.webp";
import screenshotGebruikers from "@assets/Gebruikers_1772098047298.webp";
import screenshotProfiel from "@assets/Medewerkersprofiel_1772098064753.webp";
import screenDashboard from "@assets/IMG_9066_1773314165933.webp";
import screenRewards from "@assets/IMG_9067_1773314165933.webp";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.webp";
import screenRanglijst from "@assets/IMG_9068_1773314165933.webp";

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

function GrainOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat", backgroundSize: "256px 256px",
      opacity: 0.4, mixBlendMode: "overlay",
    }} />
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard" },
  { key: "rewards", img: screenRewards, label: "Rewards" },
  { key: "challenges", img: screenUitdagingen, label: "Challenges" },
  { key: "leaderboard", img: screenRanglijst, label: "Leaderboard" },
];

export default function RestaurantStaffAmsterdam() {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    document.title = "Restaurant Staff Amsterdam | Hospitality Staffing for Restaurants | EXTRA";
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
    const addSchema = (id: string, data: object) => {
      document.getElementById(id)?.remove();
      const s = document.createElement("script");
      s.id = id; s.type = "application/ld+json"; s.text = JSON.stringify(data);
      document.head.appendChild(s);
    };

    setMeta('description', 'Need restaurant staff in Amsterdam? EXTRA supplies experienced waitstaff, bartenders, runners and kitchen support. Handpicked, fast delivery, all on payroll.');
    setLink('canonical', 'https://www.doehetextra.nl/en/restaurant-staff-amsterdam');
    setLink('alternate', 'https://www.doehetextra.nl/horecapersoneel-restaurants', 'nl');
    setLink('alternate', 'https://www.doehetextra.nl/en/restaurant-staff-amsterdam', 'en');
    setMeta('og:title', 'Restaurant Staff Amsterdam | EXTRA', 'property');
    setMeta('og:description', 'Flexible restaurant staff in Amsterdam. Experienced waitstaff, bartenders, runners and kitchen support for any dining concept. All on payroll.', 'property');
    setMeta('og:url', 'https://www.doehetextra.nl/en/restaurant-staff-amsterdam', 'property');
    setMeta('og:type', 'website', 'property');

    addSchema("restaurant-en-faq-schema", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Can you deliver restaurant staff quickly?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. In most cases we deliver suitable restaurant staff within 48 hours. Thanks to our pool of experienced staff, we can act fast on cover requests, sick leave and unexpected busy periods." } },
        { "@type": "Question", "name": "Do you have experienced waitstaff for restaurants?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Our service staff have extensive restaurant experience and are used to the pace of a busy restaurant. They know hospitality standards, work independently and are presentable." } },
        { "@type": "Question", "name": "Can you also supply kitchen staff for a restaurant?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. EXTRA supplies independent chefs, sous-chefs, kitchen assistants and dishwashers. We select on kitchen experience and the ability to hit the ground running in an unfamiliar kitchen." } },
      ]
    });

    const interval = setInterval(() => setActiveScreen(p => (p + 1) % appScreens.length), 3500);
    return () => {
      clearInterval(interval);
      document.getElementById("restaurant-en-faq-schema")?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <GrainOverlay />
      <PublicNav />

      {/* ═══════════════════════════════════════════════════ */}
      {/* 1. HERO                                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, #2d0663 0%, #4a0e96 35%, #5b16a8 65%, #6d28d9 100%)" }}>

        {/* X-pattern background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { left: "3%",  top: "8%",  w: 240, rot:  12, op: 0.10 },
            { left: "6%",  top: "58%", w: 180, rot: -15, op: 0.07 },
            { left: "42%", top: "72%", w: 140, rot:  20, op: 0.05 },
          ].map((x, i) => (
            <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity: x.op, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: "rgba(255,255,255,0.9)" }} />
          ))}
        </div>

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-[38%] -translate-y-1/2 w-[520px] h-[520px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-4 w-72 h-72 bg-violet-800/30 rounded-full blur-3xl pointer-events-none" />

        {/* Hero photo */}
        <div className="absolute inset-0 pointer-events-none">
          <img src={heroBgImage} alt="" className="w-full h-full object-cover" loading="eager"
            style={{ objectPosition: "center top", filter: "contrast(1.08) saturate(1.15) brightness(1.04)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 42% 68% at 68% 46%, rgba(255,248,255,0.12) 0%, rgba(220,180,255,0.04) 55%, transparent 75%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(29,5,73,1) 0%, rgba(29,5,73,1) 32%, rgba(45,6,99,0.82) 46%, rgba(58,8,128,0.38) 56%, rgba(72,14,148,0.10) 65%, transparent 72%)" }} />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: "22%", background: "linear-gradient(to top, rgba(29,5,73,0.82) 0%, rgba(29,5,73,0.30) 50%, transparent 100%)" }} />
          <div className="absolute top-0 left-0 right-0" style={{ height: "18%", background: "linear-gradient(to bottom, rgba(29,5,73,0.50) 0%, transparent 100%)" }} />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Utensils className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">Restaurant staffing specialists</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white/90 text-xs sm:text-sm font-semibold">NEN-4400-1 certified</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-5 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900 }}>
              Need staff for your restaurant?<br />
              EXTRA's got<br />
              <span className="relative inline-block">
                <span className="relative z-10">you covered.</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-70 rounded-sm" />
              </span>
            </h1>
            <p className="text-base sm:text-xl text-purple-100/90 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              EXTRA supplies flexible restaurant staff — from service and bar to kitchen support. Handpicked, experienced in restaurant pace and ready to go. Everyone on payroll.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                Get restaurant staff now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/30 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                <Phone className="w-5 h-5" />
                Call us directly
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              {[
                { icon: Check, text: "All staff on payroll" },
                { icon: Star, text: "Restaurant-experienced" },
                { icon: Zap, text: "Ready for cover or peak" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/80">
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* STATS STRIP                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-0 bg-gradient-to-r from-purple-950 to-indigo-950 overflow-hidden border-b border-purple-800/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-purple-700/30">
            {[
              { number: "800+", label: "Active staff members", icon: Users },
              { number: "Flex", label: "Scale up on demand", icon: Zap },
              { number: "48h", label: "Average delivery time", icon: Clock },
              { number: "24/7", label: "Available for urgent requests", icon: Shield },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center py-7 sm:py-9 px-4 sm:px-8 text-center gap-1 group hover:bg-white/5 transition-colors duration-300">
                <stat.icon className="w-4 h-4 text-purple-400 mb-1 group-hover:text-yellow-400 transition-colors" />
                <span className="text-2xl sm:text-4xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>{stat.number}</span>
                <span className="text-xs sm:text-sm text-purple-300/80 font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 2. RESTAURANT ROLES                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="roles" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Users className="w-4 h-4" /> Restaurant roles
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Every role in the restaurant.{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Filled fast.</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2 sm:h-3.5 bg-gradient-to-r from-yellow-300 to-orange-400 -skew-x-3 z-0 opacity-50 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-5 max-w-2xl mx-auto">
                Whether it's a busy weekend, a sick team member or an unexpectedly packed house. EXTRA delivers experienced restaurant staff who can step right in.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Utensils, title: "Waitstaff", desc: "Experienced service staff used to the pace of a busy restaurant. Self-directed, presentable and guest-focused.", tags: ["À la carte", "Buffet", "Banqueting", "Fine dining"], color: "from-purple-600 to-purple-800" },
              { icon: Zap, title: "Runners", desc: "Fast and focused runners keeping the flow between kitchen and table smooth. They hold the pace.", tags: ["Kitchen-floor", "Pass", "High pace", "Support"], color: "from-indigo-500 to-purple-600" },
              { icon: GlassWater, title: "Bartenders", desc: "Experienced bar staff for drink service. Fast, presentable and built for busy bar services.", tags: ["Cocktails", "Wine service", "Drinks", "Bar support"], color: "from-pink-500 to-purple-600" },
              { icon: ChefHat, title: "Independent chefs", desc: "Chefs who can walk into an unfamiliar kitchen and cook. Self-directed, flexible and level 3/4 skilled.", tags: ["Independent", "Kitchen lead", "Chef level 3/4", "Flexible"], color: "from-orange-500 to-red-600" },
              { icon: Sparkles, title: "Sous-chefs", desc: "Experienced sous-chefs who keep the kitchen running when the head chef is away or when things get busy.", tags: ["Leadership", "Kitchen coordination", "Mise en place", "HACCP"], color: "from-blue-500 to-indigo-600" },
              { icon: Users, title: "Dishwashers & kitchen assistants", desc: "Reliable kitchen support who keep the operation flowing. Fast to deploy for cover or peak service.", tags: ["Dishwashing", "Kitchen help", "Mise en place", "Cleaning"], color: "from-green-500 to-emerald-600" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-[2rem] shadow-lg shadow-purple-500/5 border-2 border-purple-100 p-7 sm:p-8 hover:shadow-2xl hover:border-purple-300 hover:-translate-y-2 transition-all duration-300 h-full overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-50 to-transparent rounded-bl-[100%] opacity-60" />
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-5">{item.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, j) => (
                      <span key={j} className="text-xs font-semibold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100">{tag}</span>
                    ))}
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={500}>
            <div className="text-center mt-10 sm:mt-14">
              <a href="/personeelsaanvraag" className="group inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-8 py-4 rounded-full hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-0.5 text-base">
                Request restaurant staff
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 3. WHY RESTAURANTS CHOOSE EXTRA                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="why-extra" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <Zap className="w-4 h-4" /> Why EXTRA
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Restaurants choose EXTRA<br className="hidden sm:block" />
                <span className="text-purple-600">for one reason: it works.</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-5 max-w-2xl mx-auto">
                Finding restaurant staff is hard enough. Finding someone who can jump straight into a busy service is harder. EXTRA selects staff who know hospitality pace, service and teamwork.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { stat: "Flexible", statLabel: "cover and scale-up", title: "Ready when you need them", desc: "Sick call on a Friday? Unexpected full house? EXTRA delivers restaurant staff fast — ready to get straight to work.", accent: "from-purple-500 to-purple-700" },
              { stat: "100%", statLabel: "personally screened", title: "Handpicked. Every time.", desc: "Every staff member goes through a personal intake before working for EXTRA. We select on attitude, service mindset and the drive that hospitality demands.", accent: "from-indigo-500 to-purple-600" },
              { stat: "Pace", statLabel: "used to restaurant tempo", title: "They know restaurant tempo", desc: "Our staff know the pressure of a full restaurant. A double booking, a late rush or an unfamiliar kitchen layout won't throw them.", accent: "from-pink-500 to-rose-600" },
              { stat: "24/7", statLabel: "reachable for you", title: "Always reachable", desc: "Outside office hours too. Our planners are available when you need to act fast — including early mornings, late nights and weekends.", accent: "from-blue-500 to-indigo-600" },
              { stat: "★ 4.8", statLabel: "average rating", title: "Continuously rated", desc: "We collect feedback after every shift. Only staff who consistently perform well in restaurants stay active.", accent: "from-amber-500 to-orange-500" },
              { stat: "0%", statLabel: "freelancer risk for you", title: "Zero compliance headache", desc: "All staff are on payroll and NEN 4400-1 compliant. No freelancer risk, no admin on your end.", accent: "from-green-500 to-emerald-600" },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group relative bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-8 border-2 border-gray-100 hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-500/8 hover:-translate-y-1.5 transition-all duration-300 h-full shadow-sm overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300" style={{ background: `radial-gradient(circle, rgb(139,92,246) 0%, transparent 70%)` }} />
                  <div className="inline-flex items-baseline gap-1.5 mb-1">
                    <span className={`text-3xl sm:text-4xl font-black bg-gradient-to-br ${item.accent} bg-clip-text text-transparent`} style={{ fontFamily: "'Poppins', sans-serif" }}>{item.stat}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{item.statLabel}</p>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 mb-2 sm:mb-3 leading-snug">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 4. CLIENT LOGOS                                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-white border-y border-gray-100 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 sm:mb-12">
              Trusted by restaurants and dining concepts across Amsterdam
            </p>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 lg:gap-24">
              {[
                { src: logoHetePeper, alt: "Hete Peper restaurant" },
                { src: logoAppel, alt: "Appèl restaurant" },
                { src: logoFunda, alt: "Funda" },
              ].map((logo, i) => (
                <div key={i} className="hover:scale-105 transition-transform duration-300">
                  <img src={logo.src} alt={logo.alt} className="h-10 sm:h-14 lg:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 5. CLIENT TESTIMONIALS                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="testimonials" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/50 px-4 sm:px-5 py-2 rounded-full">
                <MessageCircle className="w-4 h-4" /> Client stories
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What restaurants say about EXTRA
              </h2>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { company: "Restaurant Hete Peper", quote: "Sick call on a Friday afternoon and EXTRA had someone on the floor by the evening. Experienced, needed zero briefing, just got on with it. Exactly what you need.", name: "Thomas van der Berg", role: "Restaurant Manager", results: ["Friday cover solved before the evening service", "Dedicated pool set up for weekend shifts"] },
              { company: "Restaurant Appèl", quote: "We now work with a regular group of EXTRA staff for our busy evenings. They know the menu, our way of working and what we expect. Makes an enormous difference.", name: "Sarah Konings", role: "F&B Manager", results: ["Regular preferred pool built in 6 weeks", "Less briefing time per shift"] },
              { company: "Hospitality Amsterdam", quote: "During the summer it was nearly impossible to find staff. EXTRA helped us cover every shift with flexible people who could handle the pressure. Without them it would have been chaos.", name: "Mark de Vries", role: "Operations Director", results: ["Full summer period covered with EXTRA support", "Zero uncovered shifts — quality maintained"] },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 h-full shadow-sm flex flex-col">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Utensils className="w-4 h-4 text-purple-500" />
                    <span className="font-bold text-purple-700 text-sm">{item.company}</span>
                  </div>
                  <p className="text-gray-600 italic text-sm sm:text-base leading-relaxed mb-6 flex-1">"{item.quote}"</p>
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-gray-400 text-xs">{item.role}</p>
                  </div>
                  <div className="space-y-2">
                    {item.results.map((r, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 6. HOW EXTRA SELECTS STAFF                         */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="selection" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#f3f0fa" }}>
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <div>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/80 px-4 sm:px-5 py-2 rounded-full">
                  <UserCheck className="w-4 h-4" /> Our selection process
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  How EXTRA picks{" "}
                  <span className="text-purple-600">the right restaurant staff</span>
                </h2>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-10">
                  Restaurant staff need to hit the ground running in a new environment. That demands experience, adaptability and the right work ethic. That's what we select on.
                </p>
                <ul className="space-y-6">
                  {[
                    { icon: Users, title: "Personal intake interview", desc: "Every candidate goes through a personal interview and assessment. No exceptions." },
                    { icon: Star, title: "Rated after every shift", desc: "Restaurants rate our staff after each shift. Only consistent performers stay active." },
                    { icon: Sparkles, title: "Presentation and guest focus", desc: "In a restaurant, staff are front and centre. Our people look the part and speak the language of hospitality." },
                    { icon: ThumbsUp, title: "Restaurant experience and attitude", desc: "We look beyond the CV. Adaptability, service mindset and work ethic matter just as much as technical skills." },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 group">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 group-hover:bg-purple-700 transition-all duration-300 shadow-md shadow-purple-500/20">
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="relative flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="absolute -inset-6 bg-gradient-to-br from-purple-300/20 to-indigo-300/20 rounded-[2rem] blur-3xl" />
                  <div className="relative bg-white rounded-[1.5rem] shadow-2xl shadow-purple-500/15 overflow-hidden border border-purple-100/60 max-w-[480px] w-full">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-3 flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-white/25" />
                        <div className="w-3 h-3 rounded-full bg-white/25" />
                        <div className="w-3 h-3 rounded-full bg-white/25" />
                      </div>
                      <span className="text-white/80 text-xs font-semibold ml-1">EXTRA Application form</span>
                    </div>
                    <img src={sollicitatieImg} alt="EXTRA staff intake form" className="w-full object-cover" />
                    <div className="absolute bottom-5 right-5 bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      9.2 Average
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 7. CONTINUOUS QUALITY MEASUREMENT                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="quality" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Continuous quality measurement
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Every service better<br className="hidden sm:block" /> than the last
              </h2>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                After every restaurant shift we measure how our staff performed. That's how we know who fits your concept best — and who gets priority next time.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-14 max-w-4xl mx-auto">
              {[
                { text: "Rated on service quality and behaviour after every shift" },
                { text: "Reliability and punctuality tracked precisely per shift" },
                { text: "No-shows registered immediately with consequences" },
                { text: "Top restaurant performers get first priority" },
                { text: "Dedicated pool of restaurant-quality staff per client" },
                { text: "Full shift history and scores visible per staff member" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-gradient-to-br from-purple-50 to-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-sm">
                  <div className="mt-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-gray-800 leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
          </RevealSection>
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            <RevealSection delay={150}>
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-2xl sm:rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-5 sm:px-6 py-3 sm:py-4 border-b border-purple-100/60">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-xs sm:text-sm font-bold text-purple-800 uppercase tracking-wide">Staff overview</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Real-time data on all staff — including restaurant placements</p>
                  </div>
                  <img src={screenshotGebruikers} alt="EXTRA staff overview dashboard" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-4 text-center">We know exactly who performs best at which type of restaurant</p>
              </div>
            </RevealSection>
            <RevealSection delay={250}>
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-green-200 to-emerald-200 rounded-2xl sm:rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 sm:px-6 py-3 sm:py-4 border-b border-green-100/60">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-green-600" />
                      <span className="text-xs sm:text-sm font-bold text-green-800 uppercase tracking-wide">Individual staff profile</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Scores, highlights, no-shows and shift history per person</p>
                  </div>
                  <img src={screenshotProfiel} alt="Individual staff performance profile" className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-4 text-center">How we place proven quality in your restaurant</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 8. PREFERRED TEAM POOLS                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="preferred-teams" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <RevealSection>
              <div>
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 sm:px-5 py-2 rounded-full">
                  <Heart className="w-4 h-4" /> Preferred team pools
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Familiar faces<br /> in your restaurant
                </h2>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8">
                  Restaurants that work with EXTRA regularly build a core team of familiar staff — people who know your restaurant, your service tempo and your standard.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Users, text: "Dedicated pool per restaurant, built on proven performance" },
                    { icon: Heart, text: "Staff know your menu, service style and quality standard" },
                    { icon: TrendingUp, text: "Less briefing per shift — they hit the ground running" },
                    { icon: Star, text: "Higher service quality through familiarity and continuity" },
                    { icon: Tag, text: "Staff tagged by role: restaurant-experienced, fine dining, bar, kitchen" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-purple-700" />
                      </div>
                      <span className="text-gray-700 font-medium text-sm sm:text-base">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <a href="/personeelsaanvraag" className="group inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-7 py-3.5 rounded-full hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:-translate-y-0.5">
                  Build your restaurant team pool <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "🍽️", title: "Dedicated waitstaff", desc: "Same service staff for every busy shift. They know the menu, how you work and what your guests expect.", tag: "Service" },
                  { icon: "👨‍🍳", title: "Dedicated chefs", desc: "Chefs who know your kitchen. They know how your mise en place works and what the standard is. No onboarding needed.", tag: "Kitchen" },
                  { icon: "🍸", title: "Dedicated bartenders", desc: "Bartenders who know your drinks list and glassware. At full speed from the first Friday service.", tag: "Bar" },
                  { icon: "⚡", title: "Dedicated runners", desc: "Runners who know how the logistics flow between your kitchen and floor. Fast, reliable and familiar.", tag: "Support" },
                ].map((card, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-purple-200 hover:-translate-y-1 transition-all duration-300">
                    <div className="text-3xl mb-3">{card.icon}</div>
                    <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">{card.tag}</div>
                    <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-2">{card.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 9. EXTRAATJE REWARDS SYSTEM                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="rewards" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100" />
        <XPatternBg count={4} opacity={0.1} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-20">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-white/70 px-4 sm:px-5 py-2 rounded-full">
                <Gift className="w-4 h-4" /> EXTRAATje rewards system
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Motivated staff deliver{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">better service</span>
                  <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Motivated staff perform better. Our EXTRAATje rewards system keeps staff engaged and eager to return to your restaurant shift after shift.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Every shift earns points", desc: "Staff earn points per restaurant shift. Strong performance — rated by you — means bonus points. Good work is rewarded immediately.", icon: "🏃" },
                { step: "2", title: "More shifts, higher status", desc: "Regular returners at your restaurant build status — from Bronze to Diamond. Higher status means stronger commitment.", icon: "💎" },
                { step: "3", title: "Less drop-out, stronger teams", desc: "Staff building points at your restaurant want to come back. Fewer no-shows, a more stable team and better continuity.", icon: "🎁" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-purple-100 p-6 sm:p-8 text-center hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 shadow-sm">
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">{item.icon}</div>
                  <div className="text-[10px] sm:text-xs font-black text-purple-500 uppercase tracking-widest mb-2 sm:mb-3">Step {item.step}</div>
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{item.title}</h4>
                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>
          <RevealSection delay={200}>
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 max-w-5xl mx-auto">
              <div className="relative flex-shrink-0">
                <div className="relative w-[220px] sm:w-[280px]">
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-500/20 border-[5px] border-gray-700 bg-gray-900">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] h-[20px] bg-gray-900 rounded-b-xl z-20" />
                    <div className="relative">
                      {appScreens.map((screen, i) => (
                        <img key={screen.key} src={screen.img} alt={screen.label} className={`w-full transition-opacity duration-500 ${activeScreen === i ? "opacity-100 relative" : "opacity-0 absolute inset-0"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-[3rem] blur-3xl -z-10" />
                </div>
                <div className="flex gap-2 mt-4 justify-center">
                  {appScreens.map((_, i) => (
                    <button key={i} onClick={() => setActiveScreen(i)} className={`h-2.5 rounded-full transition-all duration-300 ${activeScreen === i ? "bg-purple-500 w-10" : "bg-purple-200 w-2.5 hover:bg-purple-300"}`} />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>What your restaurant gains from this</h3>
                <ul className="space-y-4">
                  {[
                    { icon: TrendingUp, text: "Higher motivation because staff are working towards something" },
                    { icon: Check, text: "Fewer no-shows because staff are building points" },
                    { icon: Users, text: "Stronger teams through the same familiar faces" },
                    { icon: Heart, text: "Better guest experience through genuinely motivated staff" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-purple-700" />
                      </div>
                      <span className="text-gray-700 font-medium text-sm sm:text-base">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 10. FAQ                                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <FAQSection
        heading="Frequently asked questions about restaurant staff"
        faqs={[
          { q: "Can you deliver restaurant staff quickly?", a: "Yes. In most cases we deliver suitable restaurant staff within 48 hours. Thanks to our pool of experienced staff, we can act fast on cover requests, sick leave and unexpected busy periods." },
          { q: "Do you have experienced waitstaff for restaurants?", a: "Yes. Our service staff have extensive restaurant experience and are used to the pace of a busy restaurant. They know hospitality standards, work independently and are always presentable." },
          { q: "Can you also supply kitchen staff for a restaurant?", a: "Yes. EXTRA supplies independent chefs, sous-chefs, kitchen assistants and dishwashers. We select on kitchen experience and the ability to hit the ground running in an unfamiliar kitchen." },
          { q: "Can we work with the same staff for regular shifts?", a: "Yes. Through our preferred pool system we build a dedicated group of staff for your restaurant — people who know your menu, your workflow and your standard. Less briefing, more quality every shift." },
          { q: "Can you supply staff for busy weekends and peak periods?", a: "Yes. Especially for busy weekends, holiday periods and peak seasons, EXTRA is the right partner. We deliver flexible restaurant staff who are used to high volume and variable workload." },
          { q: "Are your staff on payroll?", a: "Yes. All staff working through EXTRA are on our payroll. We are NEN 4400-1 compliant. No freelancer risk for your restaurant, no disguised employment." },
        ]}
      />

      {/* ═══════════════════════════════════════════════════ */}
      {/* 11. FINAL CTA                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section id="cta" className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.12} color="rgba(255,255,255,0.8)" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
              <Utensils className="w-4 h-4" /> Need restaurant staff?
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Get restaurant staff{" "}
              <span className="relative inline-block">
                <span className="relative z-10">right now</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Whether you need cover for this weekend or a reliable staffing partner for the long term. EXTRA delivers fast, flexible and experienced restaurant staff.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mb-10 sm:mb-14">
              <a href="/personeelsaanvraag" className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3" style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}>
                Get restaurant staff now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3">
                <Phone className="w-5 h-5" />
                Schedule a call
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {[
                { icon: Shield, text: "NEN-4400-1 certified" },
                { icon: Users, text: "All staff on payroll" },
                { icon: Zap, text: "Ready for cover or peak" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/60">
                  <item.icon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
