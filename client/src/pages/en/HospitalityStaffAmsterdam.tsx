import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Phone, Check, Star, Shield,
  UtensilsCrossed, Wine, ChefHat, Flame, ChevronLeft
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { CLIENT_REVIEWS } from "@/data/reviews";
import { Link } from "wouter";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealSection({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

function XPatternBg({ className = "", count = 3, opacity = 0.12, color = "rgba(139,92,246,1)" }: {
  className?: string; count?: number; opacity?: number; color?: string;
}) {
  const positions = [
    { left: "5%",  top: "10%", size: 200, rotate: 15 },
    { left: "80%", top: "20%", size: 160, rotate: -25 },
    { left: "50%", top: "60%", size: 240, rotate: 35 },
    { left: "15%", top: "75%", size: 180, rotate: -10 },
    { left: "90%", top: "80%", size: 140, rotate: 45 },
    { left: "35%", top: "30%", size: 120, rotate: -30 },
  ];
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {positions.slice(0, count).map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: pos.left, top: pos.top,
            width: pos.size, height: pos.size,
            transform: `rotate(${pos.rotate}deg)`,
            opacity,
            WebkitMaskImage: `url(${xPatroon})`,
            maskImage: `url(${xPatroon})`,
            WebkitMaskSize: "contain", maskSize: "contain",
            WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
            WebkitMaskPosition: "center", maskPosition: "center",
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
      }}
    />
  );
}

export default function HospitalityStaffAmsterdam() {
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  const clientReviews = ["amrath", "westweelde", "hart"].map((id) => {
    const r = CLIENT_REVIEWS.find((x) => x.id === id)!;
    return { quote: r.quote, name: r.author, rating: 5, role: r.role, company: r.company };
  });

  useEffect(() => {
    document.title = "Hospitality Staff Wanted? Flexible via EXTRA Amsterdam";

    const setMeta = (nameOrProp: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, nameOrProp); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
      el.setAttribute("href", href);
    };
    const addSchema = (id: string, data: object) => {
      document.getElementById(id)?.remove();
      const s = document.createElement("script");
      s.id = id;
      s.type = "application/ld+json";
      s.text = JSON.stringify(data);
      document.head.appendChild(s);
    };

    setMeta("description", "Looking for hospitality staff for your restaurant or venue? EXTRA quickly supplies waiting staff, chefs and kitchen workers. Flexible, reliable, immediately deployable.");
    setLink("canonical", "https://www.doehetextra.nl/en/hospitality-staff-amsterdam");

    setMeta("og:title", "Hospitality Staff Wanted? Flexible via EXTRA Amsterdam", "property");
    setMeta("og:description", "Looking for hospitality staff for your restaurant or venue? EXTRA quickly supplies waiting staff, chefs and kitchen workers.", "property");
    setMeta("og:url", "https://www.doehetextra.nl/en/hospitality-staff-amsterdam", "property");
    setMeta("og:type", "website", "property");
    setMeta("og:image", "https://www.doehetextra.nl/extra_email_banner_bg.png", "property");

    addSchema("local-business-schema-hsa", {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "EXTRA",
      "description": "Flexible hospitality staff via EXTRA, NEN-4400-1 certified staffing agency in Amsterdam.",
      "telephone": "+31851305915",
      "url": "https://www.doehetextra.nl",
      "address": { "@type": "PostalAddress", "addressLocality": "Amsterdam", "addressCountry": "NL" },
      "sameAs": ["https://www.doehetextra.nl"],
    });

    addSchema("faq-schema-hsa", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How quickly can EXTRA supply hospitality staff?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We can often supply staff the same day for urgent requests. For structural planning we advise contacting us 24-48 hours in advance.",
          },
        },
        {
          "@type": "Question",
          "name": "What type of hospitality staff does EXTRA supply?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We supply waiting staff, bar staff, kitchen helpers, independent cooks, chefs and supervisors for restaurants and hospitality venues.",
          },
        },
        {
          "@type": "Question",
          "name": "Are EXTRA's staff members employed?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, all our staff are employed by us. This eliminates bogus self-employment risks for our clients.",
          },
        },
      ],
    });

    return () => {
      document.getElementById("local-business-schema-hsa")?.remove();
      document.getElementById("faq-schema-hsa")?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative bg-[#0a0310] text-white">
      <GrainOverlay />
      <PublicNav />

      {/* 1. HERO */}
      <section className="relative min-h-[85svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBgImage} alt="Hospitality staff at work" className="absolute inset-0 w-full h-full object-cover object-center opacity-40" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a0310 0%, #1a0a3e 50%, #1e1b4b 100%)", opacity: 0.9 }} />
        </div>
        <XPatternBg count={4} opacity={0.15} color="rgba(255,255,255,0.9)" className="z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl text-white leading-[1.1] mb-6 font-black" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Short on hospitality staff?{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">EXTRA delivers.</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/90 mb-10 leading-relaxed font-medium">
              From waiting staff to kitchen crew — flexible and immediately deployable hospitality staff for restaurants, cafés and hospitality venues in Amsterdam.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/personeelsaanvraag" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold px-8 py-4 rounded-full text-lg shadow-xl shadow-purple-500/25 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                Request staff
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="tel:0851305915" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                085 130 59 15
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BREADCRUMB */}
      <div className="bg-white/5 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Link href="/en/hire-staff" className="inline-flex items-center gap-2 text-purple-300 hover:text-white font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Hire Staff
          </Link>
        </div>
      </div>

      {/* 3. INTRO */}
      <section className="py-24 bg-[#0a0310] overflow-hidden relative">
        <XPatternBg count={2} opacity={0.05} color="#7c3aed" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                The partner for Amsterdam's hospitality industry
              </h2>
              <p className="text-lg text-purple-100/70 leading-relaxed mb-6">
                Amsterdam has the busiest hospitality scene in the Netherlands. Unexpected rushes, sick calls, peak days. EXTRA always has people ready who know how to get things done.
              </p>
              <p className="text-lg text-purple-100/70 leading-relaxed">
                We don't supply 'hands' — we supply hospitality professionals who understand what genuine guest service means. Our pool of staff is carefully selected and trained to hit the ground running in your team.
              </p>
            </RevealSection>
            <RevealSection delay={200} className="relative">
              <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-white/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden backdrop-blur-sm">
                <div className="grid grid-cols-1 gap-8">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                      <Star className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">High Quality</h4>
                      <p className="text-purple-100/60 text-sm">Personally selected staff</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                      <Check className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">Immediately Deployable</h4>
                      <p className="text-purple-100/60 text-sm">No lengthy onboarding required</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                      <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">100% Compliant</h4>
                      <p className="text-purple-100/60 text-sm">NEN-4400-1 certified</p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 4. ROLES */}
      <section className="py-24 bg-[#0d0415]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Which hospitality staff does EXTRA supply?
            </h2>
            <p className="text-lg text-purple-100/60 max-w-2xl mx-auto">
              We offer a wide range of roles to immediately reinforce your hospitality team.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Waiting staff", icon: UtensilsCrossed, desc: "Guest-focused staff who ensure flawless table service at every cover." },
              { title: "Bar staff", icon: Wine, desc: "Experienced hands who prepare the best drinks with speed and precision." },
              { title: "Runner / Kitchen helper", icon: ChefHat, desc: "Fast workers for food running or mise-en-place support in the kitchen." },
              { title: "Chef de partie", icon: Star, desc: "Qualified cooks who can immediately take up their own station at full pace." },
              { title: "Cook / Sous-chef", icon: Flame, desc: "Experienced kitchen professionals for high-quality culinary support." },
              { title: "Supervisor", icon: Shield, desc: "Experienced leads who keep the team calm, focused and moving in the right direction." },
            ].map((role, i) => (
              <RevealSection key={i} delay={i * 50} className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 transition-all group">
                <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:bg-purple-600 transition-colors">
                  <role.icon className="w-7 h-7 text-purple-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{role.title}</h3>
                <p className="text-purple-100/60 leading-relaxed">{role.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CHALLENGES */}
      <section className="py-24 bg-[#0a0310]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Challenges in hospitality
              </h2>
              <div className="space-y-8">
                {[
                  { title: "Unexpected rushes", desc: "Fully booked restaurant, not enough hands. EXTRA delivers the same day." },
                  { title: "Sick calls", desc: "Someone dropped out? We fill the spot with a motivated replacement." },
                  { title: "Peak days", desc: "Always packed on Fridays and Saturdays? Plan ahead with EXTRA's fixed pool." },
                  { title: "Quality", desc: "No rushed hires — everyone is vetted and trained in genuine hospitality." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                      <Check className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xl">{item.title}</h4>
                      <p className="text-purple-100/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200} className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] p-10 sm:p-16 text-white relative overflow-hidden shadow-2xl">
              <XPatternBg count={3} opacity={0.15} color="white" />
              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>The EXTRA solution</h3>
                <p className="text-purple-100 text-lg mb-10 leading-relaxed">
                  We don't just supply staff — we offer an extension of your own team. Thanks to our rigorous selection process and unique reward system, our people are genuinely motivated.
                </p>
                <Link href="/personeelsaanvraag" className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-8 py-4 rounded-full hover:bg-purple-50 transition-all hover:scale-105">
                  Request staff
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 6. WHY EXTRA */}
      <section className="py-24 bg-[#0d0415] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection className="mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Why hospitality businesses choose EXTRA
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Own pool", desc: "800+ active staff in Amsterdam, immediately available for your venue.", icon: Star },
              { title: "Employed staff", desc: "All staff are on our payroll — no bogus self-employment risks or admin headaches.", icon: Shield },
              { title: "NEN-certified", desc: "EXTRA is NEN-4400-1 certified, so you always hire compliantly.", icon: Check },
            ].map((usp, i) => (
              <RevealSection key={i} delay={i * 100} className="bg-white/5 p-10 rounded-3xl border border-white/10">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-purple-600/20">
                  <usp.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{usp.title}</h3>
                <p className="text-purple-100/60 leading-relaxed">{usp.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SOCIAL PROOF */}
      <section className="py-20 sm:py-28" style={{ backgroundColor: "#faf8f5" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-bold text-purple-600 uppercase tracking-widest mb-4">Client reviews</p>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              How other clients experience EXTRA
            </h2>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
            {clientReviews.map((review, i) => (
              <RevealSection key={i} delay={i * 120}>
                <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col shadow-sm">
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div className="mb-6 sm:mb-8 flex-1">
                    <p className={`text-sm sm:text-base text-gray-600 leading-relaxed ${!expandedReviews.has(i) ? "line-clamp-4" : ""}`}>"{review.quote}"</p>
                    <button
                      onClick={() => setExpandedReviews(prev => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })}
                      className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-800 underline underline-offset-2 cursor-pointer"
                    >
                      {expandedReviews.has(i) ? "Read less" : "Read more"}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                      <span className="text-white font-bold text-sm sm:text-base">
                        {review.name.split(" ").map((n: string) => n[0]).join("")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{review.name}</p>
                      <p className="text-xs sm:text-sm text-gray-400 font-medium truncate">{review.role}</p>
                      <p className="text-xs text-purple-600 font-semibold truncate">{review.company}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 8. INTERNAL LINKS */}
      <section className="py-16 bg-[#0d0415] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-purple-100/40 mb-8 uppercase tracking-widest font-bold">Related pages</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <Link href="/en/hire-staff" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">All sectors</Link>
            <Link href="/personeelsaanvraag" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">Request staff</Link>
            <Link href="/en/hotel-staffing-amsterdam" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">Hotel staff</Link>
            <Link href="/en/event-staff-amsterdam" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">Event staff</Link>
          </div>
        </div>
      </section>

      {/* 9. CTA SECTION */}
      <section className="py-24 bg-[#0a0310]">
        <div className="max-w-5xl mx-auto px-5">
          <RevealSection className="bg-gradient-to-br from-purple-600 to-indigo-800 rounded-[3rem] p-12 sm:p-20 text-center relative overflow-hidden shadow-2xl">
            <XPatternBg count={4} opacity={0.15} color="white" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-6xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Looking to strengthen your team?
              </h2>
              <p className="text-xl text-purple-100/90 mb-12 max-w-2xl mx-auto font-medium">
                Placed within 2 minutes. We get straight to work finding you the best match.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/personeelsaanvraag" className="bg-white text-purple-900 font-bold px-10 py-5 rounded-full text-xl hover:bg-purple-50 transition-all hover:scale-105 shadow-xl shadow-black/20">
                  Request staff
                </Link>
                <a href="tel:0851305915" className="bg-purple-900/40 border-2 border-white/20 text-white font-bold px-10 py-5 rounded-full text-xl hover:bg-purple-900/60 transition-all flex items-center justify-center gap-3">
                  <Phone className="w-6 h-6" />
                  085 130 59 15
                </a>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
