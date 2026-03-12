import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Hotel, PartyPopper, Landmark, ArrowRight } from "lucide-react";
import { ClientReviewCard } from "@/components/ClientReviewCard";
import { getReviewsByCategory } from "@/data/reviews";
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
function XPatternBg({ count = 3, opacity = 0.07, color = "rgba(168,85,247,0.6)" }: { count?: number; opacity?: number; color?: string }) {
  const positions = [{ left: "5%", top: "10%", w: 180, rot: 15 }, { left: "75%", top: "20%", w: 140, rot: -8 }, { left: "45%", top: "65%", w: 160, rot: 25 }].slice(0, count);
  return <div className="absolute inset-0 pointer-events-none overflow-hidden">{positions.map((x, i) => <div key={i} className="absolute" style={{ left: x.left, top: x.top, width: x.w, height: x.w, transform: `rotate(${x.rot}deg)`, opacity, WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", backgroundColor: color }} />)}</div>;
}

const sections = [
  { id: "hotels", icon: Hotel, label: "Hotels", heading: "What hotel managers say about us", category: "hotels" as const },
  { id: "events", icon: PartyPopper, label: "Event venues", heading: "What event venues say about us", category: "events" as const },
  { id: "museums", icon: Landmark, label: "Museums & cultural venues", heading: "What cultural venues say about us", category: "museums" as const },
];

export default function ClientStories() {
  useEffect(() => {
    document.title = "Client Stories | EXTRA Hospitality Staffing Amsterdam";
    const s = (n: string, c: string, a = 'name') => { let el = document.querySelector(`meta[${a}="${n}"]`) as HTMLMetaElement; if (!el) { el = document.createElement('meta'); el.setAttribute(a, n); document.head.appendChild(el); } el.setAttribute('content', c); };
    const l = (rel: string, href: string, hl?: string) => { const sel = hl ? `link[rel="${rel}"][hreflang="${hl}"]` : `link[rel="${rel}"]`; let el = document.querySelector(sel) as HTMLLinkElement; if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); if (hl) el.setAttribute('hreflang', hl); document.head.appendChild(el); } el.setAttribute('href', href); };
    s('description', 'Read what hotels, event venues and cultural institutions in Amsterdam say about working with EXTRA for reliable hospitality staffing.');
    l('canonical', 'https://www.doehetextra.nl/en/client-stories');
    l('alternate', 'https://www.doehetextra.nl/klantcases-horeca', 'nl');
    l('alternate', 'https://www.doehetextra.nl/en/client-stories', 'en');
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <PublicNav forceDark={false} />
      <main>
        {/* HERO */}
        <section className="relative py-32 lg:py-44 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a2e] via-[#170926] to-[#12071f]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_80%,rgba(124,58,237,0.15),transparent)]" />
          <XPatternBg count={3} opacity={0.1} color="rgba(168,85,247,0.6)" />
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 text-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                References
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                What our clients{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">say</span>
              </h1>
              <p className="text-xl text-purple-100/70 max-w-2xl mx-auto leading-relaxed">
                Discover how hotels, event venues and cultural institutions in Amsterdam work with EXTRA for reliable hospitality staffing.
              </p>
            </RevealSection>
          </div>
        </section>

        {sections.map((section, sIdx) => {
          const reviews = getReviewsByCategory(section.category);
          if (reviews.length === 0) return null;
          const isLight = sIdx % 2 === 0;
          return (
            <section key={section.id} id={section.id} className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: isLight ? "#fdf9f3" : "#ffffff" }}>
              {isLight && <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />}
              <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <RevealSection>
                  <div className="text-center mb-12 sm:mb-16">
                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                      <section.icon className="w-3.5 h-3.5" /> {section.label}
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{section.heading}</h2>
                  </div>
                </RevealSection>
                <div className={`grid gap-5 sm:gap-6 ${reviews.length === 1 ? "max-w-xl mx-auto" : reviews.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3"}`}>
                  {reviews.map((review, i) => (
                    <RevealSection key={review.id} delay={i * 100}>
                      <ClientReviewCard review={review} variant="light" />
                    </RevealSection>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <section className="relative py-24 lg:py-36 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-3xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Need <span className="uppercase tracking-wide">EXTRA</span> staff?
              </h2>
              <p className="text-purple-200/80 text-lg mb-10 max-w-xl mx-auto">
                Get in touch and discover what EXTRA can do for your venue.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/personeelsaanvraag" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-purple-900 font-bold rounded-full px-10 py-4 text-base shadow-xl shadow-white/10 hover:-translate-y-1 transition-all">
                  Request staff <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/en/our-team" className="inline-flex items-center gap-2 border-2 border-white/50 text-white hover:bg-white/10 font-bold rounded-full px-10 py-4 text-base hover:-translate-y-1 transition-all">
                  Learn more about us
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
