import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Link } from "wouter";
import { ArrowRight, UtensilsCrossed, Beer, PartyPopper, Sparkles, Zap, Trophy, Gift } from "lucide-react";
import { useEffect } from "react";
import horecaImg from "@assets/Horecamedewerker_1771836004844.webp";
import baristaImg from "../assets/images/blog-barista.jpg";
import cateringImg from "../assets/images/blog-catering.jpg";
import hotelImg from "../assets/images/blog-hotel.jpg";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

export default function HorecaWerk() {
  useEffect(() => {
    document.title = "Horeca Werk | Bijbaan in de Horeca via EXTRA";
  }, []);

  const taken = [
    { title: "Bediening", href: "/aanmelden", img: horecaImg, icon: UtensilsCrossed, desc: "Serveren, bestellingen opnemen en gasten verwelkomen op mooie locaties." },
    { title: "Barmedewerker", href: "/aanmelden", img: baristaImg, icon: Beer, desc: "Tap biertjes of mix cocktails in hotels, restaurants en op festivals." },
    { title: "Events en catering", href: "/aanmelden", img: cateringImg, icon: PartyPopper, desc: "Helpen bij gala's, festivals en zakelijke bijeenkomsten. Nooit saai." },
    { title: "Banqueting", href: "/aanmelden", img: hotelImg, icon: Sparkles, desc: "Opbouwen, afruimen en zorgen voor een perfecte tafelschikking." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0310] text-white font-sans selection:bg-purple-500/30">
      <PublicNav forceDark={false} />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#0a0310] to-[#0a0310]" />
          <XPatternBg count={3} opacity={0.1} color="rgba(168,85,247,0.5)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                <UtensilsCrossed className="w-4 h-4" /> Horeca werk via EXTRA
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Werken in de horeca via <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">EXTRA</span>
              </h1>
              <p className="text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl">
                Werk bij restaurants, hotels en events in Amsterdam, Utrecht en Den Haag. Kies zelf wanneer je werkt.
              </p>
              <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                Schrijf je in <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* Taken grid */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Wat doe je als horecamedewerker</h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  Als horecamedewerker werk je op verschillende locaties zoals restaurants, hotels en events. Je werkzaamheden wisselen, maar zijn altijd afwisselend.
                </p>
              </div>
            </RevealSection>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {taken.map((taak, i) => (
                <RevealSection key={taak.title} delay={i * 100}>
                  <Link href={taak.href} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col h-full">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={taak.img} alt={taak.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0310]/80 to-transparent" />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-600 transition-colors">
                          <taak.icon className="w-5 h-5 text-purple-400 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{taak.title}</h3>
                      </div>
                      <p className="text-white/50 text-sm mb-4 flex-grow">{taak.desc}</p>
                      <div className="flex items-center text-purple-400 font-bold text-sm gap-1 group-hover:gap-2 transition-all">
                        Schrijf je in <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <XDivider />

        {/* USPs */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Waarom werken via EXTRA?</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { Icon: Zap, title: "Dagbetaling mogelijk", desc: "Niet wachten op je geld aan het einde van de maand. Via Jixbee ontvang je je loon snel na je dienst." },
                  { Icon: Trophy, title: "Werk wanneer je wilt", desc: "Jij bepaalt je eigen agenda. Kies de diensten die passen bij jouw leven, studie of andere bezigheden." },
                  { Icon: Gift, title: "EXTRAATje beloningen", desc: "Spaar punten voor elke gewerkte dienst en wissel ze in voor leuke beloningen. Hoe meer je werkt, hoe meer je verdient." },
                ].map(({ Icon, title, desc }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <Icon className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>Klaar om te beginnen?</h2>
              <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-10 py-5 rounded-full transition-all hover:scale-105 shadow-2xl">
                Schrijf je in bij EXTRA <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* Link Cloud */}
        <section className="py-12 bg-[#0a0310] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6 text-center">Gerelateerde pagina's</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Horeca vacatures Amsterdam", href: "/horeca-vacatures-amsterdam" },
                { label: "Housekeeping werk", href: "/housekeeping-werk" },
                { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
                { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" },
                { label: "Over EXTRA", href: "/horeca-uitzendbureau-amsterdam" },
              ].map((link, i) => (
                <Link key={i} href={link.href} className="bg-white/5 px-5 py-2.5 rounded-full border border-white/10 text-sm font-medium text-white/60 hover:border-purple-400/50 hover:text-purple-300 transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
