import PublicNav from "@/components/PublicNav";
  import PublicFooter from "@/components/PublicFooter";
  import { Link } from "wouter";
  import { ArrowRight, ConciergeBell, Users, Globe } from "lucide-react";
  import { useEffect } from "react";

  export default function FrontOfficeVacaturesAmsterdam() {
    useEffect(() => {
      document.title = "Front Office Vacatures Amsterdam | Receptie Jobs | EXTRA";
    }, []);

    return (
      <div className="min-h-screen bg-white">
        <PublicNav forceDark={false} />
        
        <main>
          <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0a0310]">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]">
                  Front office <span className="text-purple-500">vacatures Amsterdam</span>
                </h1>
                <p className="text-xl text-purple-100/80 mb-8 leading-relaxed">
                  Ben jij het gastvrije gezicht van het hotel? Word receptionist(e) bij de mooiste 4- en 5-sterrenhotels in Amsterdam.
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
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-3xl font-black mb-6">Jouw rol als Front Office medewerker</h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Als Front Office medewerker ben je het eerste aanspreekpunt voor gasten van over de hele wereld. Je zorgt voor een vlekkeloze check-in, geeft de beste Amsterdamse tips en lost eventuele problemen professioneel op.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-purple-50 rounded-2xl">
                      <Globe className="w-6 h-6 text-purple-600 mb-2" />
                      <h4 className="font-bold text-sm">Internationaal</h4>
                      <p className="text-xs text-gray-500">Gasten uit alle windstreken.</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-2xl">
                      <ConciergeBell className="w-6 h-6 text-purple-600 mb-2" />
                      <h4 className="font-bold text-sm">Gastvrij</h4>
                      <p className="text-xs text-gray-500">Service met een glimlach.</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-2xl">
                      <Users className="w-6 h-6 text-purple-600 mb-2" />
                      <h4 className="font-bold text-sm">Teamwork</h4>
                      <p className="text-xs text-gray-500">Samen met je collega's.</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-2xl">
                      <ArrowRight className="w-6 h-6 text-purple-600 mb-2" />
                      <h4 className="font-bold text-sm">Doorgroei</h4>
                      <p className="text-xs text-gray-500">Ontwikkel je talent.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="aspect-[4/3] bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center">
                     <ConciergeBell className="w-32 h-32 text-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-black mb-8">Ready to join our team?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                We zoeken representatieve, communicatief sterke medewerkers die vloeiend Nederlands en Engels spreken. Ervaring is een pré, maar een positieve instelling is het belangrijkst!
              </p>
              <Link href="/aanmelden">
                <a className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all">
                  Meld je aan <ArrowRight className="w-5 h-5" />
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