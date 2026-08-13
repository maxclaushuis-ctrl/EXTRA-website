import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";
import { ArrowRight, Hotel, PartyPopper, UtensilsCrossed, Building2, Check, Sparkles } from "lucide-react";

export default function HorecaPersoneelInhuren() {
  const branches = [
    {
      title: "Hotels",
      href: "/hotelpersoneel-inhuren",
      icon: Hotel,
      description: "Van housekeeping tot front-office en F&B medewerkers voor luxe hotels.",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Eventlocaties",
      href: "/eventpersoneel-inhuren",
      icon: PartyPopper,
      description: "Professionele hosts, bediening en barpersoneel voor elk type event.",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Cateraars",
      href: "/cateringpersoneel-inhuren",
      icon: UtensilsCrossed,
      description: "Flexibel keuken- en bedieningspersoneel dat naadloos aansluit bij uw team.",
      image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Restaurants",
      href: "/horecapersoneel-restaurants",
      icon: Building2,
      description: "Ervaren kelners en barpersoneel die direct inzetbaar zijn in de Amsterdamse horeca.",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0310] text-white font-sans selection:bg-purple-500/30">
      <PublicNav forceDark={false} />
      
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#0a0310] to-[#0a0310] z-0" />
          <XPatternBg count={3} opacity={0.1} color="rgba(168,85,247,0.5)" />
          
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                  <Sparkles className="w-4 h-4" /> Voor opdrachtgevers
                </span>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Extra handen nodig <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">in de horeca?</span>
                </h1>
                <p className="text-lg sm:text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl">
                  EXTRA levert getrainde horecamedewerkers in Amsterdam voor hotels, events en restaurants. Altijd in loondienst, dus geen zzp-risico's.
                </p>
                <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Personeel aanvragen
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Branch Cards */}
        <section className="py-20 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {branches.map((branch, i) => (
                <RevealSection key={branch.href} delay={i * 100}>
                  <Link href={branch.href} className="group relative block h-[400px] rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-500">
                    <img src={branch.image} alt={branch.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0310] via-[#0a0310]/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mb-4 shadow-lg">
                        <branch.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-white">{branch.title}</h3>
                      <p className="text-sm text-purple-100/60 mb-4 line-clamp-2">{branch.description}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-purple-400 group-hover:text-purple-300">
                        Bekijk mogelijkheden <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* USP Section */}
        <section className="py-24 bg-[#0a0310] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection className="text-center mb-16">
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">Waarom kiezen voor <span className="text-purple-500">EXTRA</span>?</h2>
              <p className="text-lg text-purple-100/60 max-w-2xl mx-auto">Wij begrijpen de dynamiek van de Amsterdamse horeca als geen ander.</p>
            </RevealSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "Altijd beschikbaar", desc: "Door onze grote pool van getrainde medewerkers kunnen we snel schakelen." },
                { title: "Gecertificeerd personeel", desc: "Al onze medewerkers doorlopen een strikte selectie en training." },
                { title: "Geen ZZP-risico", desc: "Al ons personeel is in loondienst, wat u zekerheid en gemak biedt." },
                { title: "Dagbetaling", desc: "Uniek in de markt: wij betalen onze medewerkers direct uit voor maximale motivatie." },
              ].map((usp, i) => (
                <RevealSection key={i} delay={i * 100} className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                    <Check className="w-6 h-6 text-green-500" />
                  </div>
                  <h4 className="text-xl font-bold mb-3">{usp.title}</h4>
                  <p className="text-purple-100/60 leading-relaxed">{usp.desc}</p>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* Internal Link Section */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-purple-100/40 mb-8">Gerelateerde pagina's:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/horeca-personeel-amsterdam" className="text-purple-400 hover:text-purple-300 transition-colors">Horeca personeel Amsterdam</Link>
              <span className="text-white/10">•</span>
              <Link href="/flexibel-horeca-personeel" className="text-purple-400 hover:text-purple-300 transition-colors">Flexibel horeca personeel</Link>
              <span className="text-white/10">•</span>
              <Link href="/horeca-uitzendbureau-amsterdam" className="text-purple-400 hover:text-purple-300 transition-colors">Horeca uitzendbureau Amsterdam</Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
