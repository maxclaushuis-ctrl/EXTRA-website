import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { ChevronRight, Users, Star, Shield } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function HorecaPersoneelPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicNav forceDark={false} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-purple-900">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <nav className="flex mb-8 text-sm text-purple-300/60" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><ChevronRight className="w-4 h-4" /></li>
                <li className="text-white font-medium">Horeca personeel</li>
              </ol>
            </nav>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Horeca <span className="text-purple-300">personeel</span> voor elke gelegenheid
            </h1>
            <p className="text-xl text-purple-100/80 max-w-3xl mb-10 leading-relaxed">
              Van kleinschalige diners tot grootschalige evenementen. EXTRA levert het hospitality talent dat uw merk versterkt en uw gasten een onvergetelijke ervaring biedt.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-5">
            <div className="prose prose-lg text-gray-600 max-w-none">
              <p>
                In de hospitality industrie draait alles om mensen. Kwalitatief <strong>horeca personeel</strong> is de belangrijkste schakel tussen uw product en de beleving van uw gast. Bij EXTRA begrijpen we deze verantwoordelijkheid. Wij leveren niet zomaar medewerkers; we leveren gastheren en gastvrouwen die passie hebben voor het vak.
              </p>

              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">Waarom goed horeca personeel het verschil maakt</h2>
              <p>
                Een glimlach bij binnenkomst, een proactieve houding als een glas bijna leeg is, en de souplesse om met drukte om te gaan; dat zijn de details die een gast onthoudt. Professioneel <strong>horeca personeel</strong> verhoogt niet alleen de klanttevredenheid, maar vaak ook de omzet door middel van actieve verkoop en efficiënt werken.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12 not-prose">
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 text-center">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">Teamspirit</h3>
                  <p className="text-sm">Onze mensen zijn gewend om snel in een nieuw team te integreren.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 text-center">
                  <Star className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">Gastvrijheid</h3>
                  <p className="text-sm">Getraind op etiquette en oog voor de behoefte van de gast.</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 text-center">
                  <Shield className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">Betrouwbaarheid</h3>
                  <p className="text-sm">Gemotiveerd door ons unieke beloningssysteem en coaching.</p>
                </div>
              </div>

              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">Meer dan alleen Amsterdam</h2>
              <p>
                Hoewel onze wortels diep in de Amsterdamse grond zitten, reikt onze expertise verder. We ondersteunen horecaondernemers en eventorganisatoren door heel Nederland die op zoek zijn naar de Amsterdamse flair en professionaliteit. Ons bestand bestaat uit een diverse groep medewerkers, van ervaren rotten in het vak tot aanstormend talent.
              </p>
              
              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">Training en Kwaliteitsbewaking</h2>
              <p>
                Kwaliteit is bij ons geen toevalstreffer. Via de EXTRA Academy zorgen we dat onze medewerkers up-to-date blijven met de laatste trends en technieken in de horeca. We trainen op:
              </p>
              <ul>
                <li><strong>Serveertechnieken:</strong> Van plateau-lopen tot uitserveren van meergangen diners.</li>
                <li><strong>Barvaardigheden:</strong> Basiskennis van dranken, tappen en snelle service.</li>
                <li><strong>Communicatie:</strong> Hoe ga je om met lastige situaties en internationale gasten.</li>
                <li><strong>Hygiëne (HACCP):</strong> Veilig werken met voeding en dranken.</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">Samenwerken met EXTRA</h2>
              <p>
                Of u nu op zoek bent naar eenmalige ondersteuning voor een event of een structurele partner voor uw personeelsplanning; wij denken graag met u mee. Onze focus ligt op het bouwen van duurzame relaties. Hoe beter we uw onderneming kennen, hoe beter we de juiste mensen kunnen selecteren.
              </p>
              <p>
                Bent u specifiek op zoek naar ondersteuning in de hoofdstad? Kijk dan op onze pagina over <Link href="/horeca-personeel-amsterdam" className="text-purple-600 hover:underline">horeca personeel in Amsterdam</Link>. Voor een breder overzicht van onze diensten kunt u terecht op de pagina over ons <Link href="/horeca-uitzendbureau-amsterdam" className="text-purple-600 hover:underline">horeca uitzendbureau</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-5 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-6">Personeel nodig dat echt het verschil maakt?</h2>
            <p className="text-xl text-gray-600 mb-10">Neem contact met ons op voor een voorstel op maat.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/horeca-personeel-inhuren" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-purple-500/25">
                Mogelijkheden bekijken
              </Link>
              <Link href="/contact" className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-full font-bold transition-all border border-gray-200">
                Neem contact op
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
