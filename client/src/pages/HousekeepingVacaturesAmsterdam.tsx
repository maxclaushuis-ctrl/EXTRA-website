import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Link } from "wouter";
import { ArrowRight, BedDouble, Sparkles, CheckCircle } from "lucide-react";
import { useEffect } from "react";
import housekeepingImg from "@assets/Housekeeping_1771842919384.webp";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

export default function HousekeepingVacaturesAmsterdam() {
  useEffect(() => {
    document.title = "Housekeeping Vacatures Amsterdam | EXTRA";
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
                <BedDouble className="w-4 h-4" /> Housekeeping vacatures
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Housekeeping — <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">jij maakt het hotel</span>
              </h1>
              <p className="text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl">
                Word jij blij van een perfect schone hotelkamer? Bij EXTRA vind je housekeeping vacatures bij de meest exclusieve hotels van Amsterdam.
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

        {/* Content */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="rounded-3xl overflow-hidden border border-white/10 aspect-[4/5] relative">
                  <img src={housekeepingImg} alt="Housekeeping medewerker" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0310]/60 to-transparent" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Werken in de housekeeping</h2>
                  <p className="text-white/60 mb-8 leading-relaxed">
                    Als housekeeping medewerker ben je de onzichtbare kracht die zorgt voor de ultieme gastbeleving. Je werkt in een team van gemotiveerde collega's bij topmerken zoals Marriott, NH Hotels en Hilton.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Flexibele werktijden (voornamelijk overdag)",
                      "Werken op de mooiste locaties in Amsterdam",
                      "Training en begeleiding op de werkvloer",
                      "Directe dagbetaling van je loon",
                      "Leuke extra's via het beloningssysteem"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <span className="font-medium text-white/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* Geen ervaring */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-4xl mx-auto px-5">
            <RevealSection>
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Sparkles className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Geen ervaring? Geen probleem!</h2>
                <p className="text-white/60 mb-10 leading-relaxed max-w-xl mx-auto">
                  Heb je nog nooit in de housekeeping gewerkt? Geen zorgen. Wij leren je de fijne kneepjes van het vak, zodat je met een zelfverzekerd gevoel aan de slag kunt.
                </p>
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all shadow-xl shadow-purple-600/20 hover:scale-105">
                  Schrijf je nu in <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Klaar voor jouw eerste shift?</h2>
              <p className="text-xl text-purple-100 mb-10">Meld je aan en begin snel met werken bij tophotels in Amsterdam.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-8 py-4 rounded-full hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl">
                  Meld je aan <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/horeca-vacatures-amsterdam" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/30 transition-all">
                  Terug naar alle vacatures
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
