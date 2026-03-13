import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Link } from "wouter";
import { ArrowRight, UtensilsCrossed, BedDouble, ChefHat, ConciergeBell, Zap, Trophy, Gift, Heart, Star } from "lucide-react";
import { useEffect } from "react";
import horecaImg from "@assets/Horecamedewerker_1771836004844.webp";
import housekeepingImg from "@assets/Housekeeping_1771842919384.webp";
import chefImg from "@assets/Chef_1771833440047.webp";
import frontOfficeImg from "@assets/Front-office_1771842663934.webp";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

const medewerkerReviews = [
  { quote: "Ontzettend leuk uitzendbureau! Open en flexibel team, leuke klussen", name: "Sophie Sybrandy", rating: 5 },
  { quote: "Extra is nice platform for from entry level to become a pro at hospitality industry.", name: "Oliur Rahman", rating: 5 },
  { quote: "Geweldig uitzendbureau met goede en leerzame opdrachten. Werkt met mooie locaties waar altijd een fijne sfeer hangt en goed personeel rondloopt. De communicatie in het bedrijf zelf verloopt goed waardoor je zonder problemen en miscommunicaties aan het werk kan.", name: "Nathalie Siegerma", rating: 5 },
];

export default function HorecaVacaturesAmsterdam() {
  useEffect(() => {
    document.title = "Horeca Vacatures Amsterdam | Werken in de Horeca | EXTRA";
  }, []);

  const jobTypes = [
    { title: "Horeca werk", href: "/horeca-werk-amsterdam", img: horecaImg, icon: UtensilsCrossed, desc: "Bediening, bar, banqueting en events." },
    { title: "Housekeeping", href: "/housekeeping-vacatures-amsterdam", img: housekeepingImg, icon: BedDouble, desc: "Zorg voor een perfect verblijf in tophotels." },
    { title: "Chefs", href: "/chef-vacatures-amsterdam", img: chefImg, icon: ChefHat, desc: "Van hulpkok tot zelfstandig werkend kok." },
    { title: "Front-office", href: "/front-office-vacatures-amsterdam", img: frontOfficeImg, icon: ConciergeBell, desc: "Het visitekaartje van het hotel." }
  ];

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
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                <UtensilsCrossed className="w-4 h-4" /> Vacatures Amsterdam
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Klaar om iets <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">extra's</span> te laten zien?
              </h1>
              <p className="text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl">
                Wil jij werken bij de mooiste hotels, leukste events en beste restaurants van Amsterdam? Bepaal zelf wanneer en waar je werkt met de EXTRA app.
              </p>
              <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                Meld je direct aan <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* Job Types Grid */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Kies je vakgebied</h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  Ontdek de verschillende mogelijkheden binnen EXTRA en vind de bijbaan die bij jou past.
                </p>
              </div>
            </RevealSection>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {jobTypes.map((job, i) => (
                <RevealSection key={job.href} delay={i * 100}>
                  <Link href={job.href} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col h-full">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={job.img} alt={job.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0310]/80 to-transparent" />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-600 transition-colors">
                          <job.icon className="w-5 h-5 text-purple-400 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{job.title}</h3>
                      </div>
                      <p className="text-white/50 text-sm mb-4 flex-grow">{job.desc}</p>
                      <div className="flex items-center text-purple-400 font-bold text-sm gap-1 group-hover:gap-2 transition-all">
                        Bekijk vacatures <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <XDivider />

        {/* USPs */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Waarom werken via EXTRA?</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { Icon: Zap, title: "Dagbetaling", desc: "Niet wachten op je geld aan het einde van de maand. Bij EXTRA word je na elke gewerkte shift direct uitbetaald." },
                  { Icon: Trophy, title: "Punten verdienen", desc: "Voor elk gewerkt uur spaar je punten. Hoe meer je werkt, hoe hoger je rank in het leaderboard." },
                  { Icon: Gift, title: "EXTRAATje beloningen", desc: "Wissel je gespaarde punten in voor geweldige beloningen, van cadeaubonnen tot exclusieve EXTRA gadgets." }
                ].map(({ Icon, title, desc }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <Icon className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Ervaringen */}
        <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
          <XPatternBg count={3} opacity={0.08} color="rgba(139,92,246,1)" />
          <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <div className="text-center mb-10 sm:mb-14">
                <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-5 bg-purple-100/50 px-4 sm:px-5 py-2 rounded-full">
                  <Heart className="w-4 h-4" /> Ervaringen
                </span>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Wat anderen zeggen
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mt-4 sm:mt-6">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <span className="text-base sm:text-xl font-bold text-gray-900 ml-0.5">4,8</span>
                  </div>
                  <span className="text-sm sm:text-base text-gray-500">gemiddeld uit <span className="font-semibold text-gray-700">232 Google reviews</span></span>
                </div>
              </div>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
              {medewerkerReviews.map((review, i) => (
                <RevealSection key={i} delay={i * 120}>
                  <div className="bg-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-9 border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                      <div className="flex gap-1">
                        {[...Array(review.rating)].map((_, j) => (
                          <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div className="mb-6 sm:mb-8 flex-1">
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">"{review.quote}"</p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                        <span className="text-white font-bold text-sm sm:text-base">{review.name.split(" ").map((n: string) => n[0]).join("")}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{review.name}</p>
                        <p className="text-xs sm:text-sm text-gray-400 font-medium">Review van Google</p>
                      </div>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>Klaar om te knallen?</h2>
              <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-10 py-5 rounded-full transition-all hover:scale-105 shadow-2xl">
                Meld je aan <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* Link Cloud */}
        <section className="py-12 bg-[#0a0310] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6 text-center">Gerelateerde pagina's</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Horeca werk Amsterdam", href: "/horeca-werk-amsterdam" },
                { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
                { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
                { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" },
                { label: "Over EXTRA", href: "/horeca-uitzendbureau-amsterdam" }
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
