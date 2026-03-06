import PublicNav from "@/components/PublicNav";
  import PublicFooter from "@/components/PublicFooter";
  import { Link } from "wouter";
  import { ArrowRight, BedDouble, Sparkles, CheckCircle } from "lucide-react";
  import { useEffect } from "react";

  export default function HousekeepingVacaturesAmsterdam() {
    useEffect(() => {
      document.title = "Housekeeping Vacatures Amsterdam | EXTRA";
    }, []);

    return (
      <div className="min-h-screen bg-white">
        <PublicNav forceDark={false} />
        
        <main>
          <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0a0310]">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]">
                  Housekeeping <span className="text-purple-500">vacatures Amsterdam</span>
                </h1>
                <p className="text-xl text-purple-100/80 mb-8 leading-relaxed">
                  Word jij blij van een perfect schone hotelkamer? Bij EXTRA vind je housekeeping vacatures bij de meest exclusieve hotels van Amsterdam.
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
                <div className="order-2 md:order-1 bg-gray-100 rounded-3xl aspect-[4/5] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center p-12 text-center text-gray-400">
                    <Sparkles className="w-20 h-20 mb-4 opacity-20 mx-auto" />
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <h2 className="text-3xl font-black mb-6">Werken in de housekeeping</h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
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
                        <div className="text-purple-600">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-800">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-gray-50">
            <div className="max-w-4xl mx-auto px-5 text-center">
              <h2 className="text-3xl font-black mb-6">Geen ervaring? Geen probleem!</h2>
              <p className="text-gray-600 mb-10 leading-relaxed">
                Heb je nog nooit in de housekeeping gewerkt? Geen zorgen. Wij leren je de fijne kneepjes van het vak, zodat je met een zelfverzekerd gevoel aan de slag kunt.
              </p>
              <Link href="/aanmelden">
                <a className="bg-purple-600 text-white font-bold px-8 py-4 rounded-full inline-block hover:bg-purple-700 transition-colors">
                  Schrijf je nu in
                </a>
              </Link>
              <div className="mt-12">
                <Link href="/horeca-vacatures-amsterdam">
                  <a className="text-purple-600 font-bold hover:underline">Terug naar alle vacatures</a>
                </Link>
              </div>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    );
  }