import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { ChevronRight, Zap, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

export default function FlexibelHorecaPersoneel() {
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
                  <li className="text-white font-medium">Flexibel horeca personeel</li>
                </ol>
              </nav>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                <Zap className="w-4 h-4" /> Flexibel & Snel
              </span>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wanneer jij het nodig hebt, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">zijn wij er</span>
              </h1>
              <p className="text-xl text-purple-100/70 max-w-3xl mb-10 leading-relaxed">
                Vang pieken op, vervang zieken direct en houd de controle over uw personeelskosten. Ontdek de kracht van flexibiliteit met de hospitality talenten van EXTRA.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Personeel aanvragen <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/20 transition-all">
                  Stel uw vraag
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Vast vs Flexibel */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="max-w-3xl mb-12">
                <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Vast versus Flexibel: De perfecte balans</h2>
                <p className="text-white/60 leading-relaxed mb-4">
                  De horeca is een wereld van uitersten. Een te groot vast team zorgt voor hoge kosten bij rustige momenten, terwijl een te klein team leidt tot overbelasting bij drukte. Door een strategische schil van <strong className="text-white/80">flexibel personeel</strong> om uw vaste kern heen te bouwen, creëert u een wendbare organisatie.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { Icon: TrendingUp, title: "Schaalbaarheid", desc: "Schakel moeiteloos op tijdens feestdagen, events of het terrasseizoen zonder langetermijnverplichtingen." },
                  { Icon: Clock, title: "Kostenbeheersing", desc: "U betaalt alleen voor de gewerkte uren. Geen doorbetaling bij ziekte of rustige periodes voor de flexibele schil." }
                ].map(({ Icon, title, desc }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                      <p className="text-white/60 leading-relaxed">{desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* Hoe EXTRA het oplost */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-4xl mx-auto px-5">
            <RevealSection>
              <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Hoe EXTRA de pieken en dalen oplost</h2>
              <p className="text-white/60 leading-relaxed mb-6">
                Bij EXTRA hebben we ons proces volledig ingericht op snelheid en kwaliteit. Wij begrijpen dat 'nu nodig' ook echt 'nu' betekent. Ons bestand aan medewerkers in Amsterdam is groot genoeg om op zeer korte termijn gaten in uw rooster op te vullen.
              </p>
              <p className="text-white/60 leading-relaxed mb-12">
                Maar flexibiliteit mag nooit ten koste gaan van kwaliteit. Daarom investeren we in onze mensen. Door het unieke beloningssysteem van EXTRA voelen onze flexibele medewerkers zich net zo verantwoordelijk voor het resultaat als uw vaste team.
              </p>

              <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>De voordelen van uitbesteden via EXTRA</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Werving & Selectie", desc: "Wij zoeken continu naar de beste hospitality talenten." },
                  { title: "Planning", desc: "Geen eindeloos gebel; wij regelen de poppetjes op de juiste plek." },
                  { title: "Verloning & Administratie", desc: "Geen zorgen over contracten, pensioenen of verzekeringen." },
                  { title: "Kwaliteitscontrole", desc: "Wij monitoren prestaties en sturen bij waar nodig." }
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 transition-colors">
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Continuïteit */}
        <section className="py-20 bg-[#0d0415]">
          <div className="max-w-4xl mx-auto px-5">
            <RevealSection>
              <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Continuïteit in uw bedrijfsvoering</h2>
              <p className="text-white/60 leading-relaxed mb-4">
                Een stabiele bezetting is de droom van elke manager. Door een partner als EXTRA in de arm te nemen voor uw <strong className="text-white/80">flexibele schil</strong>, bouwt u aan die continuïteit. We streven ernaar om vaak dezelfde gezichten naar uw locatie te sturen, zodat de inwerktijd minimaal is en de binding met uw gasten maximaal.
              </p>
              <p className="text-white/60 leading-relaxed">
                Wilt u meer weten over onze specifieke focus in de hoofdstad? Bekijk dan onze pagina over ons{" "}
                <Link href="/horeca-uitzendbureau-amsterdam" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">horeca uitzendbureau in Amsterdam</Link> of lees meer over{" "}
                <Link href="/horeca-personeel-amsterdam" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">horeca personeel in Amsterdam</Link>.
              </p>
            </RevealSection>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Flexibiliteit die loont</h2>
              <p className="text-xl text-purple-100 mb-10">Ontvang een voorstel voor uw flexibele personeelsschil.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-8 py-4 rounded-full hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl">
                  Personeel aanvragen <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
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
                { label: "Personeel Amsterdam", href: "/horeca-personeel-amsterdam" },
                { label: "Horeca personeel", href: "/horeca-personeel" },
                { label: "Personeel inhuren", href: "/horeca-personeel-inhuren" },
                { label: "Restaurant personeel", href: "/horecapersoneel-restaurants" }
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
