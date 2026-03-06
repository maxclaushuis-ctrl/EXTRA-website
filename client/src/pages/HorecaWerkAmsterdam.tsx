import PublicNav from "@/components/PublicNav";
  import PublicFooter from "@/components/PublicFooter";
  import { Link } from "wouter";
  import { ArrowRight, UtensilsCrossed, Beer, Coffee, Star } from "lucide-react";
  import { useEffect } from "react";

  export default function HorecaWerkAmsterdam() {
    useEffect(() => {
      document.title = "Horeca Werk Amsterdam | Vacatures & Direct aan de Slag | EXTRA";
    }, []);

    return (
      <div className="min-h-screen bg-white">
        <PublicNav forceDark={false} />
        
        <main>
          <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0a0310]">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]">
                  Horeca werk <span className="text-purple-500">Amsterdam</span>
                </h1>
                <p className="text-xl text-purple-100/80 mb-8 leading-relaxed">
                  Op zoek naar een leuke bijbaan in de Amsterdamse horeca? Bij EXTRA vind je de beste vacatures als ober, bediening, bar- of cateringmedewerker.
                </p>
                <Link href="/aanmelden">
                  <a className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-xl shadow-purple-600/20">
                    Meld je direct aan <ArrowRight className="w-5 h-5" />
                  </a>
                </Link>
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-black mb-6">Wat voor horeca werk bieden wij?</h2>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 text-purple-600">
                        <UtensilsCrossed className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">Bediening & Banqueting</h3>
                        <p className="text-gray-600 text-sm">Werk op luxe gala's, zakelijke evenementen of in gezellige restaurants.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 text-purple-600">
                        <Beer className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">Bar Medewerker</h3>
                        <p className="text-gray-600 text-sm">Tap biertjes op de grootste festivals of mix cocktails in trendy hotels.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 text-purple-600">
                        <Coffee className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">Catering & Hospitality</h3>
                        <p className="text-gray-600 text-sm">Help mee bij de catering op toplocaties in Amsterdam.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-3xl aspect-square relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20" />
                  <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
                    <p className="text-gray-400 italic">"Werken bij de leukste locaties van Amsterdam, met de vrijheid van een freelancer maar de zekerheid van loondienst."</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-black mb-12">Waarom werken via EXTRA?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  "Directe dagbetaling na je shift",
                  "Sparen voor leuke beloningen",
                  "Bepaal je eigen agenda",
                  "Iedereen in loondienst (geen ZZP)",
                  "Doorgroeimogelijkheden",
                  "Gezellig team van collega's"
                ].map((usp, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm flex items-center gap-4">
                    <Star className="w-5 h-5 text-purple-600 fill-purple-600" />
                    <span className="font-bold text-gray-800">{usp}</span>
                  </div>
                ))}
              </div>
              <div className="mt-16">
                <Link href="/horeca-vacatures-amsterdam">
                  <a className="text-purple-600 font-bold hover:underline">Bekijk alle vakgebieden</a>
                </Link>
              </div>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    );
  }