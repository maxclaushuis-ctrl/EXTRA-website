import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Hotel, PartyPopper, Landmark, ArrowRight } from "lucide-react";
import { ClientReviewCard } from "@/components/ClientReviewCard";
import { getReviewsByCategory } from "@/data/reviews";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";

const sections = [
  {
    id: "hotels",
    icon: Hotel,
    label: "Hotels",
    heading: "Wat hotelmanagers over ons zeggen",
    category: "hotels" as const,
  },
  {
    id: "events",
    icon: PartyPopper,
    label: "Eventlocaties",
    heading: "Wat eventlocaties over ons zeggen",
    category: "events" as const,
  },
  {
    id: "museums",
    icon: Landmark,
    label: "Musea & culturele locaties",
    heading: "Wat culturele locaties over ons zeggen",
    category: "museums" as const,
  },
];

export default function KlantcasesHoreca() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <PublicNav forceDark={false} />

      <main>
        {/* Hero */}
        <section className="relative py-32 lg:py-44 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a2e] via-[#170926] to-[#12071f]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_80%,rgba(124,58,237,0.15),transparent)]" />
          <XPatternBg count={3} opacity={0.1} color="rgba(168,85,247,0.6)" />
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 text-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                Referenties
              </span>
              <h1
                className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Wat onze klanten{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  zeggen
                </span>
              </h1>
              <p className="text-xl text-purple-100/70 max-w-2xl mx-auto leading-relaxed">
                Ontdek hoe hotels, eventlocaties en culturele instellingen in Amsterdam samenwerken met EXTRA voor betrouwbaar hospitality personeel.
              </p>
            </RevealSection>
          </div>
        </section>

        {/* Review sections per category */}
        {sections.map((section, sIdx) => {
          const reviews = getReviewsByCategory(section.category);
          if (reviews.length === 0) return null;
          const isLight = sIdx % 2 === 0;

          return (
            <section
              key={section.id}
              id={section.id}
              className={`relative py-20 sm:py-28 lg:py-36 overflow-hidden ${isLight ? "" : ""}`}
              style={{ backgroundColor: isLight ? "#fdf9f3" : "#ffffff" }}
            >
              {isLight && (
                <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />
              )}
              <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                <RevealSection>
                  <div className="text-center mb-12 sm:mb-16">
                    <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                      <section.icon className="w-3.5 h-3.5" /> {section.label}
                    </span>
                    <h2
                      className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {section.heading}
                    </h2>
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
              <h2
                className="text-3xl md:text-4xl font-black text-white mb-5"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Ook extra personeel nodig?
              </h2>
              <p className="text-purple-200/80 text-lg mb-10 max-w-xl mx-auto">
                Neem contact op en ontdek wat EXTRA voor jouw locatie kan betekenen.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  asChild
                  className="bg-white hover:bg-gray-100 text-purple-900 font-bold rounded-full px-10 py-5 text-base h-auto shadow-xl shadow-white/10 hover:-translate-y-1 transition-all"
                >
                  <Link href="/personeelsaanvraag" className="flex items-center gap-2">
                    Personeel aanvragen <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/25 text-white hover:bg-white/10 font-bold rounded-full px-10 py-5 text-base h-auto hover:-translate-y-1 transition-all"
                >
                  <Link href="/horeca-uitzendbureau-amsterdam">Lees meer over ons</Link>
                </Button>
              </div>
            </RevealSection>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
