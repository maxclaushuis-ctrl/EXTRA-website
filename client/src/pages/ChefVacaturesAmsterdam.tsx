import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Link } from "wouter";
import { ArrowRight, ChefHat, Flame, Award } from "lucide-react";
import { useEffect } from "react";
import chefImg from "@assets/Chef_1771833440047.webp";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

export default function ChefVacaturesAmsterdam() {
  useEffect(() => {
    document.title = "Chef Vacatures Amsterdam | Keukenpersoneel Gezocht | EXTRA";
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
                <ChefHat className="w-4 h-4" /> Chef vacatures Amsterdam
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Koken is je ding. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Wij regelen de rest.</span>
              </h1>
              <p className="text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl">
                Breng je passie voor koken naar de beste keukens van Amsterdam. Van hulpkok tot chef de partie, wij hebben de uitdaging die bij je past.
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
              <h2 className="text-3xl font-black text-white mb-12" style={{ fontFamily: "'Poppins', sans-serif" }}>Jouw niveau, jouw keuken</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { Icon: ChefHat, title: "Hulpkok", desc: "Ideaal als je net begint in de keuken of wilt bijleren naast je studie.", tag: "Flexibele shifts" },
                  { Icon: Flame, title: "Zelfstandig Werkend Kok", desc: "Draai mee in hoogwaardige keukens en laat zien wat je in huis hebt.", tag: "Mooie locaties", featured: true },
                  { Icon: Award, title: "Chef de Partie", desc: "Neem verantwoordelijkheid voor je eigen sectie in de keuken.", tag: "Dagbetaling" }
                ].map(({ Icon, title, desc, tag, featured }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className={`bg-white/5 border rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group h-full ${featured ? "border-purple-500/50 shadow-lg shadow-purple-500/10" : "border-white/10 hover:border-purple-500/30"}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${featured ? "bg-purple-500/30" : "bg-purple-500/20 group-hover:bg-purple-500/30"}`}>
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed mb-6">{desc}</p>
                      <span className="inline-block bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full">{tag}</span>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* Waarom EXTRA + image */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Waarom chefs kiezen voor EXTRA</h2>
                  <p className="text-white/60 leading-relaxed mb-8">
                    Wij begrijpen de dynamiek van de keuken. Daarom bieden we je de vrijheid om te koken op verschillende locaties, terwijl je de zekerheid hebt van een betrouwbare werkgever die je direct uitbetaalt.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-10">
                    {["Dagbetaling via Jixbee", "Topkeukens in Amsterdam", "Punten voor EXTRAATje"].map((tag, i) => (
                      <span key={i} className="bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm font-bold text-white/80">{tag}</span>
                    ))}
                  </div>
                  <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all shadow-xl shadow-purple-600/20 hover:scale-105">
                    Meld je aan <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                <div className="rounded-3xl overflow-hidden border border-white/10 aspect-[4/3]">
                  <img src={chefImg} alt="Chef Amsterdam" className="w-full h-full object-cover" />
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
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Klaar voor de beste keukens?</h2>
              <p className="text-xl text-purple-100 mb-10">Meld je aan en kook morgen al in een topkeuken van Amsterdam.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-8 py-4 rounded-full hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl">
                  Meld je aan <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/horeca-vacatures-amsterdam" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/30 transition-all">
                  Bekijk alle vacatures
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
                { label: "Horeca werk", href: "/horeca-werk-amsterdam" },
                { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
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
