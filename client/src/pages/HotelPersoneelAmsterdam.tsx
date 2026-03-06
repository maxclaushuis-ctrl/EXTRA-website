import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";
import { ArrowRight, Hotel, Check, Sparkles, Clock, Shield, Star } from "lucide-react";

export default function HotelPersoneelAmsterdam() {
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
                  <Hotel className="w-4 h-4" /> Hotel Branche
                </span>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Jouw hotel verdient <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">het beste team</span>
                </h1>
                <p className="text-lg sm:text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl">
                  Professioneel hotel personeel in Amsterdam. EXTRA levert housekeeping, receptie en F&B medewerkers voor hotels. Flexibel en betrouwbaar.
                </p>
                <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Personeel aanvragen
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection className="mb-16">
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">Wat wij leveren voor <span className="text-purple-500">hotels</span></h2>
              <p className="text-lg text-purple-100/60 max-w-2xl">Van 5-sterren service tot efficiënte housekeeping.</p>
            </RevealSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Housekeeping", icon: Clock, desc: "Grondige en efficiënte reiniging van kamers en openbare ruimtes volgens de hoogste standaarden." },
                { title: "Receptie & Front Office", icon: Shield, desc: "Gastvrije en meertalige receptionisten die uw gasten een warm welkom bieden." },
                { title: "F&B Medewerkers", icon: Star, desc: "Ervaren ontbijt-, bar- en bedieningsmedewerkers voor uw hotelrestaurant en roomservice." },
              ].map((service, i) => (
                <RevealSection key={i} delay={i * 100} className="bg-white/5 p-8 rounded-2xl border border-white/10">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center mb-6 border border-purple-500/30">
                    <service.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                  <p className="text-purple-100/60 leading-relaxed">{service.desc}</p>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-[#0a0310] relative">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection className="text-center mb-16">
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6">Hoe het <span className="text-purple-500">werkt</span></h2>
            </RevealSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-purple-500/10 hidden md:block" />
              {[
                { step: "01", title: "Aanvraag", desc: "U geeft aan welk type personeel u nodig heeft en voor welke periode." },
                { step: "02", title: "Match", desc: "Wij selecteren de beste kandidaten uit onze getrainde hotel-pool." },
                { step: "03", title: "Service", desc: "Onze medewerkers gaan bij u aan de slag en leveren topkwaliteit." },
              ].map((item, i) => (
                <RevealSection key={i} delay={i * 100} className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-6 text-xl font-black shadow-xl shadow-purple-600/30">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                  <p className="text-purple-100/60">{item.desc}</p>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-y border-white/5">
          <div className="max-w-4xl mx-auto px-5 text-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black mb-8">Direct personeel nodig?</h2>
              <p className="text-xl text-purple-100/70 mb-10">Neem vandaag nog contact op en wij regelen het geschikte personeel voor uw hotel.</p>
              <Link href="/personeelsaanvraag" className="bg-white text-purple-900 font-black px-10 py-5 rounded-full hover:bg-purple-50 transition-colors shadow-2xl">
                Personeel aanvragen
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* Internal Link Section */}
        <section className="py-16 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-purple-100/40 mb-8">Gerelateerde pagina's:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/flexibel-horeca-personeel" className="text-purple-400 hover:text-purple-300 transition-colors">Flexibel horeca personeel</Link>
              <span className="text-white/10">•</span>
              <Link href="/horeca-uitzendbureau-amsterdam" className="text-purple-400 hover:text-purple-300 transition-colors">Horeca uitzendbureau Amsterdam</Link>
              <span className="text-white/10">•</span>
              <Link href="/horeca-personeel-inhuren" className="text-purple-400 hover:text-purple-300 transition-colors">Horeca personeel inhuren</Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
