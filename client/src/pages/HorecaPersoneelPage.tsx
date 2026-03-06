import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { ChevronRight, Users, Star, Shield, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

export default function HorecaPersoneelPage() {
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
                  <li className="text-white font-medium">Horeca personeel</li>
                </ol>
              </nav>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                <Users className="w-4 h-4" /> Horeca personeel
              </span>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Goed horecapersoneel <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">maakt het verschil</span>
              </h1>
              <p className="text-xl text-purple-100/70 max-w-3xl mb-10 leading-relaxed">
                Van kleinschalige diners tot grootschalige evenementen. EXTRA levert het hospitality talent dat uw merk versterkt en uw gasten een onvergetelijke ervaring biedt.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/horeca-personeel-inhuren" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Mogelijkheden bekijken <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/20 transition-all">
                  Neem contact op
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Intro + pillars */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="max-w-3xl mb-16">
                <p className="text-white/60 leading-relaxed">
                  In de hospitality industrie draait alles om mensen. Kwalitatief <strong className="text-white/80">horeca personeel</strong> is de belangrijkste schakel tussen uw product en de beleving van uw gast. Bij EXTRA leveren we niet zomaar medewerkers; we leveren gastheren en gastvrouwen die passie hebben voor het vak.
                </p>
              </div>
              <h2 className="text-3xl font-black text-white mb-10" style={{ fontFamily: "'Poppins', sans-serif" }}>Waarom goed horeca personeel het verschil maakt</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { Icon: Users, title: "Teamspirit", desc: "Onze mensen zijn gewend om snel in een nieuw team te integreren." },
                  { Icon: Star, title: "Gastvrijheid", desc: "Getraind op etiquette en oog voor de behoefte van de gast." },
                  { Icon: Shield, title: "Betrouwbaarheid", desc: "Gemotiveerd door ons unieke beloningssysteem en coaching." }
                ].map(({ Icon, title, desc }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <Icon className="w-7 h-7 text-purple-400" />
                      </div>
                      <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                      <p className="text-sm text-white/60">{desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* Training */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-4xl mx-auto px-5">
            <RevealSection>
              <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Meer dan alleen Amsterdam</h2>
              <p className="text-white/60 leading-relaxed mb-10">
                Hoewel onze wortels diep in de Amsterdamse grond zitten, reikt onze expertise verder. We ondersteunen horecaondernemers en eventorganisatoren door heel Nederland die op zoek zijn naar de Amsterdamse flair en professionaliteit.
              </p>

              <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Training en Kwaliteitsbewaking</h2>
              <p className="text-white/60 leading-relaxed mb-8">
                Kwaliteit is bij ons geen toevalstreffer. Via de EXTRA Academy zorgen we dat onze medewerkers up-to-date blijven met de laatste trends en technieken in de horeca.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Serveertechnieken", desc: "Van plateau-lopen tot uitserveren van meergangen diners." },
                  { title: "Barvaardigheden", desc: "Basiskennis van dranken, tappen en snelle service." },
                  { title: "Communicatie", desc: "Omgaan met lastige situaties en internationale gasten." },
                  { title: "Hygiëne (HACCP)", desc: "Veilig werken met voeding en dranken." }
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

        {/* Samenwerken */}
        <section className="py-20 bg-[#0d0415]">
          <div className="max-w-4xl mx-auto px-5">
            <RevealSection>
              <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Samenwerken met EXTRA</h2>
              <p className="text-white/60 leading-relaxed mb-6">
                Of u nu op zoek bent naar eenmalige ondersteuning voor een event of een structurele partner voor uw personeelsplanning; wij denken graag met u mee. Hoe beter we uw onderneming kennen, hoe beter we de juiste mensen kunnen selecteren.
              </p>
              <p className="text-white/60 leading-relaxed">
                Bent u specifiek op zoek naar ondersteuning in de hoofdstad? Kijk dan op onze pagina over{" "}
                <Link href="/horeca-personeel-amsterdam" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">horeca personeel in Amsterdam</Link>. Voor een breder overzicht van onze diensten kunt u terecht op de pagina over ons{" "}
                <Link href="/horeca-uitzendbureau-amsterdam" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">horeca uitzendbureau</Link>.
              </p>
            </RevealSection>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Personeel nodig dat echt het verschil maakt?</h2>
              <p className="text-xl text-purple-100 mb-10">Neem contact met ons op voor een voorstel op maat.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/horeca-personeel-inhuren" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-8 py-4 rounded-full hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl">
                  Mogelijkheden bekijken <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/30 transition-all">
                  Neem contact op
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
                { label: "Horeca uitzendbureau Amsterdam", href: "/horeca-uitzendbureau-amsterdam" },
                { label: "Personeel Amsterdam", href: "/horeca-personeel-amsterdam" },
                { label: "Personeel inhuren", href: "/horeca-personeel-inhuren" },
                { label: "Flexibel personeel", href: "/flexibel-horeca-personeel" },
                { label: "Restaurant personeel", href: "/restaurant-personeel-amsterdam" }
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
