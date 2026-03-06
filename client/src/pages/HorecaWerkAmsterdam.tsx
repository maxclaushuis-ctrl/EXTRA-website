import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Link } from "wouter";
import { ArrowRight, UtensilsCrossed, Beer, Coffee, Star } from "lucide-react";
import { useEffect } from "react";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

export default function HorecaWerkAmsterdam() {
  useEffect(() => {
    document.title = "Horeca Werk Amsterdam | Vacatures & Direct aan de Slag | EXTRA";
  }, []);

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
                <UtensilsCrossed className="w-4 h-4" /> Horeca & Bediening
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Horeca werk dat <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">écht wat oplevert</span>
              </h1>
              <p className="text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl">
                Op zoek naar een leuke bijbaan in de Amsterdamse horeca? Bij EXTRA vind je de beste vacatures als ober, bediening, bar- of cateringmedewerker.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Meld je direct aan <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/horeca-vacatures-amsterdam" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/20 transition-all">
                  Alle vacatures
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Rollen */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <h2 className="text-3xl font-black text-white mb-12" style={{ fontFamily: "'Poppins', sans-serif" }}>Wat voor horeca werk bieden wij?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { Icon: UtensilsCrossed, title: "Bediening & Banqueting", desc: "Werk op luxe gala's, zakelijke evenementen of in gezellige restaurants." },
                  { Icon: Beer, title: "Bar Medewerker", desc: "Tap biertjes op de grootste festivals of mix cocktails in trendy hotels." },
                  { Icon: Coffee, title: "Catering & Hospitality", desc: "Help mee bij de catering op toplocaties in Amsterdam." }
                ].map(({ Icon, title, desc }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* Quote + USPs */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-10 lg:p-14 flex items-center justify-center">
                  <blockquote className="text-center">
                    <div className="text-5xl text-purple-400 font-black mb-4">"</div>
                    <p className="text-xl text-white/80 italic leading-relaxed">
                      Werken bij de leukste locaties van Amsterdam, met de vrijheid van een freelancer maar de zekerheid van loondienst.
                    </p>
                  </blockquote>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-10" style={{ fontFamily: "'Poppins', sans-serif" }}>Waarom werken via EXTRA?</h2>
                  <div className="space-y-4">
                    {[
                      "Directe dagbetaling na je shift",
                      "Sparen voor leuke beloningen",
                      "Bepaal je eigen agenda",
                      "Iedereen in loondienst (geen ZZP)",
                      "Doorgroeimogelijkheden",
                      "Gezellig team van collega's"
                    ].map((usp, i) => (
                      <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-4 hover:bg-white/8 transition-colors">
                        <Star className="w-4 h-4 text-purple-400 shrink-0 fill-purple-400" />
                        <span className="font-medium text-white/80">{usp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Direct aan de slag?</h2>
              <p className="text-xl text-purple-100 mb-10">Schrijf je in en begin volgende week al met werken.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-8 py-4 rounded-full hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl">
                  Meld je aan <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/horeca-vacatures-amsterdam" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/30 transition-all">
                  Bekijk alle vakgebieden
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Link Cloud */}
        <section className="py-12 bg-[#0a0310] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6 text-center">Gerelateerde pagina's</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Alle vacatures", href: "/horeca-vacatures-amsterdam" },
                { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
                { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
                { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" }
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
