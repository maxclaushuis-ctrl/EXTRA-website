import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { ChevronRight, Zap, Clock, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function FlexibelHorecaPersoneel() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicNav forceDark={false} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <nav className="flex mb-8 text-sm text-purple-300/60" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><ChevronRight className="w-4 h-4" /></li>
                <li className="text-white font-medium">Flexibel horeca personeel</li>
              </ol>
            </nav>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Wanneer jij het nodig hebt, <span className="text-purple-400">zijn wij er</span>
            </h1>
            <p className="text-xl text-purple-100/80 max-w-3xl mb-10 leading-relaxed">
              Vang pieken op, vervang zieken direct en houd de controle over uw personeelskosten. Ontdek de kracht van flexibiliteit met de hospitality talenten van EXTRA.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-5">
            <div className="prose prose-lg text-gray-600 max-w-none">
              <p>
                De horeca is een wereld van uitersten. Het ene moment is het terras leeg door een regenbui, het volgende moment stroomt het vol door een onverwachte zonnestraal of een groot evenement in de stad. In deze dynamische omgeving is de inzet van <strong>flexibel horeca personeel</strong> geen luxe, maar een noodzaak voor een gezonde bedrijfsvoering.
              </p>

              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">Vast versus Flexibel: De perfecte balans</h2>
              <p>
                Veel horecaondernemers worstelen met de vraag: hoeveel mensen neem ik in vaste dienst? Een te groot vast team zorgt voor hoge kosten bij rustige momenten, terwijl een te klein team leidt tot overbelasting en kwaliteitsverlies bij drukte. Door een strategische schil van <strong>flexibel personeel</strong> om uw vaste kern heen te bouwen, creëert u een wendbare organisatie.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12 not-prose">
                <div className="p-8 bg-purple-50 rounded-3xl border border-purple-100">
                  <TrendingUp className="w-10 h-10 text-purple-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Schaalbaarheid</h3>
                  <p className="text-gray-600">Schakel moeiteloos op tijdens feestdagen, events of het terrasseizoen zonder langetermijnverplichtingen.</p>
                </div>
                <div className="p-8 bg-purple-50 rounded-3xl border border-purple-100">
                  <Clock className="w-10 h-10 text-purple-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Kostenbeheersing</h3>
                  <p className="text-gray-600">U betaalt alleen voor de gewerkte uren. Geen doorbetaling bij ziekte of rustige periodes voor de flexibele schil.</p>
                </div>
              </div>

              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">Hoe EXTRA de pieken en dalen oplost</h2>
              <p>
                Bij EXTRA hebben we ons proces volledig ingericht op snelheid en kwaliteit. Wij begrijpen dat 'nu nodig' ook echt 'nu' betekent. Ons bestand aan medewerkers in Amsterdam is groot genoeg om op zeer korte termijn gaten in uw rooster op te vullen.
              </p>
              <p>
                Maar flexibiliteit mag nooit ten koste gaan van kwaliteit. Daarom investeren we in onze mensen. Door het unieke beloningssysteem van EXTRA voelen onze flexibele medewerkers zich net zo verantwoordelijk voor het resultaat als uw vaste team. Zij komen niet alleen 'een dienstje draaien', ze komen om te presteren.
              </p>

              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">De voordelen van uitbesteden via EXTRA</h2>
              <p>
                Wanneer u kiest voor <strong>flexibel horeca personeel</strong> via EXTRA, nemen wij u al het werk uit handen:
              </p>
              <ul>
                <li><strong>Werving & Selectie:</strong> Wij zoeken continu naar de beste hospitality talenten.</li>
                <li><strong>Planning:</strong> Geen eindeloos gebel; wij regelen de poppetjes op de juiste plek.</li>
                <li><strong>Verloning & Administratie:</strong> Geen zorgen over contracten, pensioenen of verzekeringen.</li>
                <li><strong>Kwaliteitscontrole:</strong> Wij monitoren prestaties en sturen bij waar nodig.</li>
              </ul>

              <div className="my-16 bg-purple-600 rounded-[2.5rem] p-10 lg:p-14 text-white">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-4">Nooit meer een tekort aan personeel?</h3>
                    <p className="text-lg text-purple-100 mb-6">Ontdek hoe onze flexibele poule uw onderneming kan versterken, ook op de drukste momenten van het jaar.</p>
                    <Link href="/horeca-personeel-inhuren" className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-bold hover:bg-purple-50 transition-colors">
                      Bekijk de mogelijkheden
                    </Link>
                  </div>
                  <div className="w-32 h-32 md:w-48 md:h-48 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                    <Zap className="w-16 h-16 md:w-24 h-24 text-white" />
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">Continuïteit in uw bedrijfsvoering</h2>
              <p>
                Een stabiele bezetting is de droom van elke manager. Door een partner als EXTRA in de arm te nemen voor uw <strong>flexibele schil</strong>, bouwt u aan die continuïteit. We streven ernaar om vaak dezelfde gezichten naar uw locatie te sturen, zodat de inwerktijd minimaal is en de binding met uw gasten maximaal.
              </p>
              <p>
                Wilt u meer weten over onze specifieke focus in de hoofdstad? Bekijk dan onze pagina over ons <Link href="/horeca-uitzendbureau-amsterdam" className="text-purple-600 hover:underline">horeca uitzendbureau in Amsterdam</Link> of lees meer over <Link href="/horeca-personeel-amsterdam" className="text-purple-600 hover:underline">horeca personeel in Amsterdam</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-5 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-6">Flexibiliteit die loont</h2>
            <p className="text-xl text-gray-600 mb-10">Ontvang een voorstel voor uw flexibele personeelsschil.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/personeelsaanvraag" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold transition-all">
                Personeel aanvragen
              </Link>
              <Link href="/contact" className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-full font-bold transition-all border border-gray-200">
                Contact opnemen
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
