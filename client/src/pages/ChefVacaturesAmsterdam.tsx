import PublicNav from "@/components/PublicNav";
  import PublicFooter from "@/components/PublicFooter";
  import { Link } from "wouter";
  import { ArrowRight, ChefHat, Flame, Award } from "lucide-react";
  import { useEffect } from "react";

  export default function ChefVacaturesAmsterdam() {
    useEffect(() => {
      document.title = "Chef Vacatures Amsterdam | Keukenpersoneel Gezocht | EXTRA";
    }, []);

    return (
      <div className="min-h-screen bg-white">
        <PublicNav forceDark={false} />
        
        <main>
          <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0a0310]">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]">
                  Chef <span className="text-purple-500">vacatures Amsterdam</span>
                </h1>
                <p className="text-xl text-purple-100/80 mb-8 leading-relaxed">
                  Breng je passie voor koken naar de beste keukens van Amsterdam. Van hulpkok tot chef de partie, wij hebben de uitdaging die bij je past.
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
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <ChefHat className="w-10 h-10 text-purple-600 mb-6" />
                  <h3 className="text-xl font-bold mb-4">Hulpkok</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">Ideaal als je net begint in de keuken of wilt bijleren naast je studie.</p>
                  <div className="text-purple-600 font-bold text-sm">Flexibele shifts</div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-purple-600">
                  <Flame className="w-10 h-10 text-purple-600 mb-6" />
                  <h3 className="text-xl font-bold mb-4">Zelfstandig Werkend Kok</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">Draai mee in hoogwaardige keukens en laat zien wat je in huis hebt.</p>
                  <div className="text-purple-600 font-bold text-sm">Mooie locaties</div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <Award className="w-10 h-10 text-purple-600 mb-6" />
                  <h3 className="text-xl font-bold mb-4">Chef de Partie</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">Neem verantwoordelijkheid voor je eigen sectie in de keuken.</p>
                  <div className="text-purple-600 font-bold text-sm">Dagbetaling</div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-gray-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <div className="bg-purple-900 rounded-[3rem] p-12 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <ChefHat className="w-64 h-64" />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <h2 className="text-3xl font-black mb-6">Waarom chefs kiezen voor EXTRA</h2>
                  <p className="text-purple-100 mb-8">
                    Wij begrijpen de dynamiek van de keuken. Daarom bieden we je de vrijheid om te koken op verschillende locaties, terwijl je de zekerheid hebt van een betrouwbare werkgever die je direct uitbetaalt.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <span className="bg-white/10 px-4 py-2 rounded-full text-sm font-bold">Dagbetaling via Jixbee</span>
                    <span className="bg-white/10 px-4 py-2 rounded-full text-sm font-bold">Topkeukens in Amsterdam</span>
                    <span className="bg-white/10 px-4 py-2 rounded-full text-sm font-bold">Punten voor EXTRAATje</span>
                  </div>
                </div>
              </div>
              <div className="mt-12 text-center">
                <Link href="/horeca-vacatures-amsterdam">
                  <a className="text-purple-600 font-bold hover:underline">Bekijk alle vacatures</a>
                </Link>
              </div>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    );
  }