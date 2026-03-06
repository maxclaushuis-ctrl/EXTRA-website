import PublicNav from "@/components/PublicNav";
  import PublicFooter from "@/components/PublicFooter";
  import { Link } from "wouter";
  import { ArrowRight, UtensilsCrossed, BedDouble, ChefHat, ConciergeBell, Zap, Trophy, Gift } from "lucide-react";
  import { useEffect } from "react";
  import horecaImg from "@assets/Horecamedewerker_1771836004844.png";
  import housekeepingImg from "@assets/Housekeeping_1771842919384.png";
  import chefImg from "@assets/Chef_1771833440047.png";
  import frontOfficeImg from "@assets/Front-office_1771842663934.png";

  export default function HorecaVacaturesAmsterdam() {
    useEffect(() => {
      document.title = "Horeca Vacatures Amsterdam | Werken in de Horeca | EXTRA";
    }, []);

    const jobTypes = [
      {
        title: "Horeca werk",
        href: "/horeca-werk-amsterdam",
        img: horecaImg,
        icon: UtensilsCrossed,
        desc: "Bediening, bar, banqueting en events."
      },
      {
        title: "Housekeeping",
        href: "/housekeeping-vacatures-amsterdam",
        img: housekeepingImg,
        icon: BedDouble,
        desc: "Zorg voor een perfect verblijf in tophotels."
      },
      {
        title: "Chefs",
        href: "/chef-vacatures-amsterdam",
        img: chefImg,
        icon: ChefHat,
        desc: "Van hulpkok tot zelfstandig werkend kok."
      },
      {
        title: "Front-office",
        href: "/front-office-vacatures-amsterdam",
        img: frontOfficeImg,
        icon: ConciergeBell,
        desc: "Het visitekaartje van het hotel."
      }
    ];

    return (
      <div className="min-h-screen bg-white">
        <PublicNav forceDark={false} />
        
        <main>
          {/* Hero Section */}
          <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0a0310]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent" />
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]">
                  Klaar om iets <span className="text-purple-400">extra's</span> te laten zien?
                </h1>
                <p className="text-xl text-purple-100/80 mb-8 leading-relaxed">
                  Wil jij werken bij de mooiste hotels, leukste events en beste restaurants van Amsterdam? 
                  Bepaal zelf wanneer en waar je werkt met de EXTRA app.
                </p>
                <Link href="/aanmelden">
                  <a className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-xl shadow-purple-600/20">
                    Meld je direct aan <ArrowRight className="w-5 h-5" />
                  </a>
                </Link>
              </div>
            </div>
          </section>

          {/* Job Types Grid */}
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Kies je vakgebied</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Ontdek de verschillende mogelijkheden binnen EXTRA en vind de bijbaan die bij jou past.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {jobTypes.map((job) => (
                  <Link key={job.href} href={job.href}>
                    <a className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full">
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <img src={job.img} alt={job.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <job.icon className="w-5 h-5" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-6 flex-grow">{job.desc}</p>
                        <div className="flex items-center text-purple-600 font-bold text-sm group-hover:gap-2 transition-all">
                          Bekijk vacatures <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* USPs */}
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-12">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Dagbetaling</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Niet wachten op je geld aan het einde van de maand. Bij EXTRA word je na elke gewerkte shift direct uitbetaald.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                    <Trophy className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Punten verdienen</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Voor elk gewerkt uur spaar je punten. Hoe meer je werkt, hoe hoger je rank in het leaderboard.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                    <Gift className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">EXTRAATje beloningen</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Wissel je gespaarde punten in voor geweldige beloningen, van cadeaubonnen tot exclusieve EXTRA gadgets.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-purple-600 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-8">Klaar om te knallen?</h2>
              <Link href="/aanmelden">
                <a className="inline-flex items-center gap-2 bg-white text-purple-600 font-bold px-10 py-5 rounded-full transition-all hover:scale-105 shadow-2xl">
                  Meld je aan <ArrowRight className="w-5 h-5" />
                </a>
              </Link>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    );
  }