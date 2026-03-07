import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Link } from "wouter";
import { ArrowRight, ConciergeBell, Users, Globe, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import frontOfficeImg from "@assets/Front-office_1771842663934.webp";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

export default function FrontOfficeVacaturesAmsterdam() {
  useEffect(() => {
    document.title = "Front Office Vacatures Amsterdam | Receptie Jobs | EXTRA";
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
                <ConciergeBell className="w-4 h-4" /> Front office vacatures
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Het gezicht van het hotel — <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">dat ben jij</span>
              </h1>
              <p className="text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl">
                Ben jij het gastvrije gezicht van het hotel? Word receptionist(e) bij de mooiste 4- en 5-sterrenhotels in Amsterdam.
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

        {/* Rol + image */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Jouw rol als Front Office medewerker</h2>
                  <p className="text-white/60 mb-8 leading-relaxed">
                    Als Front Office medewerker ben je het eerste aanspreekpunt voor gasten van over de hele wereld. Je zorgt voor een vlekkeloze check-in, geeft de beste Amsterdamse tips en lost eventuele problemen professioneel op.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { Icon: Globe, title: "Internationaal", desc: "Gasten uit alle windstreken." },
                      { Icon: ConciergeBell, title: "Gastvrij", desc: "Service met een glimlach." },
                      { Icon: Users, title: "Teamwork", desc: "Samen met je collega's." },
                      { Icon: TrendingUp, title: "Doorgroei", desc: "Ontwikkel je talent." }
                    ].map(({ Icon, title, desc }, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors group">
                        <Icon className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
                        <p className="text-xs text-white/50">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl overflow-hidden border border-white/10 aspect-[4/3]">
                  <img src={frontOfficeImg} alt="Front office medewerker Amsterdam" className="w-full h-full object-cover" />
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* Join the team */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-4xl mx-auto px-5">
            <RevealSection>
              <div className="text-center">
                <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Ready to join our team?</h2>
                <p className="text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                  We zoeken representatieve, communicatief sterke medewerkers die vloeiend Nederlands en Engels spreken. Ervaring is een pré, maar een positieve instelling is het belangrijkst!
                </p>
                <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
                  {["Vloeiend Nederlands & Engels", "Representatief en vriendelijk", "Positieve instelling"].map((req, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                      <p className="text-sm text-white/70 font-medium">{req}</p>
                    </div>
                  ))}
                </div>
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all shadow-xl shadow-purple-600/20 hover:scale-105">
                  Meld je aan <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
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
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Jouw hotelcarrière begint hier</h2>
              <p className="text-xl text-purple-100 mb-10">Word het gezicht van de mooiste hotels in Amsterdam.</p>
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
                { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
                { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" }
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
