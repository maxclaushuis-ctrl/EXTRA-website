import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Check, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function HorecaPersoneelAmsterdamPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicNav forceDark={false} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-purple-900 to-indigo-950">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <nav className="flex mb-8 text-sm text-purple-300/60" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><ChevronRight className="w-4 h-4" /></li>
                <li className="text-white font-medium">Horeca personeel Amsterdam</li>
              </ol>
            </nav>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Horeca personeel <span className="text-purple-400">Amsterdam</span>
            </h1>
            <p className="text-xl text-purple-100/80 max-w-3xl mb-10 leading-relaxed">
              Professioneel en getraind personeel voor de Amsterdamse hospitality sector. Ontdek hoe EXTRA de werving en selectie van uw horeca personeel in de hoofdstad professionaliseert.
            </p>
            <Link href="/personeelsaanvraag" className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold transition-all">
              Direct personeel aanvragen
            </Link>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-5">
            <div className="prose prose-lg text-gray-600 max-w-none">
              <p>
                Amsterdam is het epicentrum van de Nederlandse horeca. Met duizenden horecagelegenheden, van bruine cafés in de Jordaan tot sterrenrestaurants aan de Zuidas en luxe hotels in het centrum, is de vraag naar kwalitatief <strong>horeca personeel in Amsterdam</strong> groter dan ooit. Bij EXTRA begrijpen we dat de selectie van de juiste mensen het fundament is van uw succes.
              </p>

              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">Types horeca personeel in Amsterdam</h2>
              <p>
                De behoefte aan personeel varieert sterk per type onderneming. Bij EXTRA hebben we ons gespecialiseerd in het leveren van diverse rollen, waarbij we altijd kijken naar de specifieke match tussen de medewerker en uw bedrijfscultuur.
              </p>
              
              <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Bediening en Bar</h3>
              <p>
                Onze bedieningsmedewerkers zijn meer dan alleen 'bestellers'. Ze zijn getraind in actieve verkoop, gastvrijheidsetiquette en productkennis. Of het nu gaat om het serveren van een perfect getapt biertje of het toelichten van de menukaart bij een uitgebreid diner; onze krachten staan hun mannetje.
              </p>

              <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Hotel-specifiek personeel</h3>
              <p>
                In de hotellerie gelden andere standaarden. Onze medewerkers voor de hotelsector in Amsterdam zijn getraind in specifieke disciplines zoals housekeeping, ontbijtservice en front-office ondersteuning. Ze begrijpen het belang van discretie, oog voor detail en een onberispelijke presentatie.
              </p>

              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">Werving en selectie in een krappe markt</h2>
              <p>
                Het is geen geheim dat de arbeidsmarkt in de Amsterdamse horeca krap is. Juist daarom is een samenwerking met een gespecialiseerd bureau als EXTRA essentieel. Wij werven continu nieuw talent, vaak jonge professionals en studenten die in Amsterdam wonen en op zoek zijn naar een uitdagende bijbaan of een start van hun hospitality-carrière.
              </p>
              <p>
                Onze selectieprocedure is streng. We kijken niet alleen naar ervaring op het CV, maar vooral naar instelling en passie voor het vak. Iedereen die voor EXTRA aan de slag gaat, doorloopt onze eigen onboarding. Hierdoor weten we zeker dat we alleen de beste <strong>horeca krachten in Amsterdam</strong> bij u over de vloer sturen.
              </p>

              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">De Amsterdamse horeca markt</h2>
              <p>
                Werken in Amsterdam vraagt om een specifieke mentaliteit. Het is vaak druk, internationaal en veeleisend. Onze medewerkers spreken uitstekend Nederlands en Engels, wat onmisbaar is in een stad die jaarlijks miljoenen internationale toeristen en zakelijke reizigers verwelkomt. Ze zijn gewend aan de hectiek van de stad en weten hoe ze onder druk moeten presteren zonder de glimlach te verliezen.
              </p>
              <p>
                Door te kiezen voor EXTRA als uw partner voor <strong>horeca personeel in Amsterdam</strong>, kiest u voor zekerheid. Wij kennen de lokale regelgeving, de logistieke uitdagingen van de binnenstad en de verwachtingen van de Amsterdamse gast.
              </p>

              <div className="my-12 p-8 bg-gray-50 rounded-3xl border border-gray-100">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Voordelen op een rij:</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                    <span><strong>Direct inzetbaar:</strong> Getraind personeel dat weet wat er gevraagd wordt.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                    <span><strong>Lokaal talent:</strong> Mensen uit Amsterdam voor de Amsterdamse horeca.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                    <span><strong>Geen ZZP-risico:</strong> Iedereen is bij ons in loondienst.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-1" />
                    <span><strong>Focus op kwaliteit:</strong> Ons beloningssysteem motiveert tot topprestaties.</span>
                  </li>
                </ul>
              </div>

              <p>
                Wilt u meer weten over onze diensten of direct bekijken wat we voor uw onderneming kunnen betekenen? Lees meer over onze aanpak als <Link href="/horeca-uitzendbureau-amsterdam" className="text-purple-600 hover:underline">horeca uitzendbureau</Link> of bekijk de mogelijkheden voor het <Link href="/horeca-personeel-inhuren" className="text-purple-600 hover:underline">inhuren van personeel</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#0a0310] text-white">
          <div className="max-w-4xl mx-auto px-5 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-6">Uw horeca team versterken?</h2>
            <p className="text-xl text-purple-200/80 mb-10">Ontdek de kracht van gemotiveerd personeel in Amsterdam.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/personeelsaanvraag" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold transition-all">
                Personeelsaanvraag doen
              </Link>
              <Link href="/contact" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold transition-all border border-white/20">
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
