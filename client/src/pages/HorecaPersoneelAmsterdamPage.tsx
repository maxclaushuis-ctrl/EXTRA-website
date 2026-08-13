import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Check, ChevronRight, MapPin, ArrowRight, Users, Shield } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

export default function HorecaPersoneelAmsterdamPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

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
              <nav className="flex mb-8 text-sm text-purple-300/60" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                  <li><ChevronRight className="w-4 h-4" /></li>
                  <li className="text-white font-medium">Horeca personeel Amsterdam</li>
                </ol>
              </nav>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                <MapPin className="w-4 h-4" /> Amsterdam
              </span>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Amsterdam draait op <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">goed horecapersoneel</span>
              </h1>
              <p className="text-xl text-purple-100/70 max-w-3xl mb-10 leading-relaxed">
                Professioneel en getraind personeel voor de Amsterdamse hospitality sector. Ontdek hoe EXTRA de werving en selectie van uw horeca personeel in de hoofdstad professionaliseert.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Direct personeel aanvragen <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/horeca-uitzendbureau-amsterdam" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/20 transition-all">
                  Over ons bureau
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Types personeel */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-4xl mx-auto px-5">
            <RevealSection>
              <p className="text-white/60 leading-relaxed mb-8">
                Amsterdam is het epicentrum van de Nederlandse horeca. Met duizenden horecagelegenheden, van bruine cafés in de Jordaan tot sterrenrestaurants aan de Zuidas en luxe hotels in het centrum, is de vraag naar kwalitatief <strong className="text-white/80">horeca personeel in Amsterdam</strong> groter dan ooit.
              </p>
              <h2 className="text-3xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>Types horeca personeel in Amsterdam</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: Users, title: "Bediening en Bar", desc: "Onze bedieningsmedewerkers zijn getraind in actieve verkoop, gastvrijheidsetiquette en productkennis. Van een perfect getapt biertje tot het toelichten van de menukaart bij een uitgebreid diner." },
                  { icon: Shield, title: "Hotel-specifiek personeel", desc: "In de hotellerie gelden andere standaarden. Onze medewerkers zijn getraind in housekeeping, ontbijtservice en front-office ondersteuning. Ze begrijpen discretie, oog voor detail en een onberispelijke presentatie." }
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                    <item.icon className="w-8 h-8 text-purple-400 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* Voordelen */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Werving en selectie in een krappe markt</h2>
                  <p className="text-white/60 leading-relaxed mb-6">
                    De arbeidsmarkt in de Amsterdamse horeca is krap. Juist daarom is een samenwerking met een gespecialiseerd bureau als EXTRA essentieel. Wij werven continu nieuw talent, vaak jonge professionals en studenten die in Amsterdam wonen en op zoek zijn naar een uitdagende bijbaan of start van hun hospitality-carrière.
                  </p>
                  <p className="text-white/60 leading-relaxed mb-8">
                    Onze selectieprocedure is streng. We kijken niet alleen naar ervaring op het CV, maar vooral naar instelling en passie voor het vak. Iedereen die voor EXTRA aan de slag gaat, doorloopt onze eigen onboarding.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Voordelen op een rij</h3>
                  <ul className="space-y-4">
                    {[
                      { label: "Direct inzetbaar", desc: "Getraind personeel dat weet wat er gevraagd wordt." },
                      { label: "Lokaal talent", desc: "Mensen uit Amsterdam voor de Amsterdamse horeca." },
                      { label: "Geen ZZP-risico", desc: "Iedereen is bij ons in loondienst." },
                      { label: "Focus op kwaliteit", desc: "Ons beloningssysteem motiveert tot topprestaties." }
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-purple-400" />
                        </div>
                        <span className="text-white/70 text-sm"><strong className="text-white">{item.label}:</strong> {item.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Amsterdamse markt */}
        <section className="py-20 bg-[#0d0415]">
          <div className="max-w-4xl mx-auto px-5">
            <RevealSection>
              <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>De Amsterdamse horeca markt</h2>
              <p className="text-white/60 leading-relaxed mb-6">
                Werken in Amsterdam vraagt om een specifieke mentaliteit. Het is vaak druk, internationaal en veeleisend. Onze medewerkers spreken uitstekend Nederlands en Engels, onmisbaar in een stad die jaarlijks miljoenen internationale toeristen en zakelijke reizigers verwelkomt.
              </p>
              <p className="text-white/60 leading-relaxed">
                Door te kiezen voor EXTRA als uw partner voor <strong className="text-white/80">horeca personeel in Amsterdam</strong>, kiest u voor zekerheid. Wij kennen de lokale regelgeving, de logistieke uitdagingen van de binnenstad en de verwachtingen van de Amsterdamse gast. Lees meer over onze aanpak als{" "}
                <Link href="/horeca-uitzendbureau-amsterdam" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">horeca uitzendbureau</Link> of bekijk de mogelijkheden voor{" "}
                <Link href="/horeca-personeel-inhuren" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">het inhuren van personeel</Link>.
              </p>
            </RevealSection>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Uw horeca team versterken?</h2>
              <p className="text-xl text-purple-100 mb-10">Ontdek de kracht van gemotiveerd personeel in Amsterdam.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-8 py-4 rounded-full hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl">
                  Personeelsaanvraag doen <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/30 transition-all">
                  Contact opnemen
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
                { label: "Horeca uitzendbureau", href: "/horeca-uitzendbureau-amsterdam" },
                { label: "Personeel inhuren", href: "/horeca-personeel-inhuren" },
                { label: "Hotel personeel", href: "/hotel-personeel-amsterdam" },
                { label: "Flexibel personeel", href: "/flexibel-horeca-personeel" },
                { label: "Tijdelijk personeel", href: "/tijdelijk-horeca-personeel" },
                { label: "Horeca personeel", href: "/horeca-personeel" },
                { label: "Restaurant personeel", href: "/restaurant-personeel-amsterdam" },
                { label: "Horeca vacatures", href: "/horeca-vacatures-amsterdam" }
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
