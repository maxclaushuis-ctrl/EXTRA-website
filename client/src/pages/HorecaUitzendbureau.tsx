import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Check, HelpCircle, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function HorecaUitzendbureau() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    {
      q: "Hoe snel kan EXTRA personeel leveren in Amsterdam?",
      a: "Dankzij onze focus op Amsterdam en ons grote bestand aan actieve medewerkers kunnen we vaak binnen 24 uur schakelen. Voor spoedaanvragen hebben we een dedicated team dat direct kijkt naar de beschikbaarheid van onze best getrainde mensen."
    },
    {
      q: "Is het personeel van EXTRA in loondienst of zijn het ZZP'ers?",
      a: "Bij EXTRA werken we uitsluitend met personeel in loondienst. Dit neemt alle risico's rondom schijnzelfstandigheid (Wet DBA) bij u weg en zorgt voor een hogere betrokkenheid en kwaliteit van de medewerkers."
    },
    {
      q: "Welke training krijgen de horecamedewerkers?",
      a: "Onze medewerkers doorlopen de EXTRA Academy. Hier leren ze de basis van gastvrijheid, etiquette, serveertechnieken en specifieke vaardigheden voor hotels en high-end events. Zo garanderen we dat iedereen direct productief is op de werkvloer."
    },
    {
      q: "Hoe werkt het EXTRAATje beloningssysteem voor klanten?",
      a: "Het EXTRAATje systeem is uniek in de branche. Medewerkers verdienen punten voor goed werk, punctualiteit en positieve reviews. Dit motiveert hen om altijd dat stapje extra te zetten bij uw onderneming, wat resulteert in betere service voor uw gasten."
    },
    {
      q: "Leveren jullie ook personeel buiten Amsterdam?",
      a: "Hoewel onze focus en expertise in Amsterdam liggen, ondersteunen we onze vaste partners ook regelmatig bij opdrachten in de omliggende regio's (Amstelveen, Zaandam, Haarlem). Neem contact met ons op voor de mogelijkheden."
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EXTRA Horeca Uitzendbureau Amsterdam",
    "url": "https://doehetextra.nl/horeca-uitzendbureau-amsterdam",
    "logo": "https://doehetextra.nl/assets/EXTRA_LOGO_BLAUW.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+31-20-1234567",
      "contactType": "customer service",
      "areaServed": "Amsterdam",
      "availableLanguage": ["Dutch", "English"]
    },
    "description": "EXTRA is hét horeca uitzendbureau in Amsterdam voor hotels, events en restaurants. Wij leveren gecertificeerd personeel in loondienst."
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
      <PublicNav forceDark={false} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0a0310]">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#6d28d9,transparent_70%)]" />
          </div>
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <nav className="flex mb-8 text-sm text-purple-300/60" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><ChevronRight className="w-4 h-4" /></li>
                <li className="text-white font-medium">Horeca uitzendbureau Amsterdam</li>
              </ol>
            </nav>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Dé horecapartner <span className="text-purple-400">van Amsterdam</span>
            </h1>
            <p className="text-xl text-purple-100/80 max-w-3xl mb-10 leading-relaxed">
              Bent u op zoek naar een betrouwbare partner die niet alleen handjes levert, maar echte gastvrijheid begrijpt? EXTRA is hét horeca uitzendbureau van Amsterdam, gespecialiseerd in het leveren van getraind personeel voor hotels, evenementen, cateraars en restaurants.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/personeelsaanvraag" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-purple-500/25">
                Personeel aanvragen
              </Link>
              <Link href="/horeca-vacatures-amsterdam" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold transition-all border border-white/20">
                Ik zoek werk
              </Link>
            </div>
          </div>
        </section>

        {/* Content Section 1 */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-5">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">De nieuwe standaard in horeca-uitzending</h2>
            <div className="prose prose-lg text-gray-600">
              <p>
                De Amsterdamse horeca is dynamisch, veeleisend en altijd in beweging. Of het nu gaat om een prestigieus vijfsterrenhotel aan de grachten, een grootschalig event in de RAI of een intiem diner in een boutique restaurant; de kwaliteit van het personeel bepaalt de gastervaring. Bij EXTRA begrijpen we dat als geen ander. Als gespecialiseerd <strong>horeca uitzendbureau in Amsterdam</strong> hebben we een unieke aanpak ontwikkeld die focust op kwaliteit, betrokkenheid en continuïteit.
              </p>
              <p>
                In tegenstelling tot veel andere bureaus, werken wij uitsluitend met personeel in loondienst. Dit is een bewuste keuze. Het biedt u als opdrachtgever de zekerheid dat alle sociale lasten en verzekeringen correct zijn geregeld, en het voorkomt risico's rondom de Wet DBA en schijnzelfstandigheid. Voor onze medewerkers betekent het zekerheid, wat zich vertaalt in een hogere mate van loyaliteit en inzet op uw werkvloer.
              </p>
              
              <h3 className="text-2xl font-bold mt-12 mb-6 text-gray-900">Gespecialiseerd in diverse branches</h3>
              <p>
                Onze expertise strekt zich uit over de gehele hospitality sector in de hoofdstad. We hebben specifieke teams en trainingsprogramma's voor verschillende disciplines:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 list-none p-0">
                <li className="bg-purple-50 p-6 rounded-2xl border border-purple-100 group hover:bg-purple-600 transition-all duration-300">
                  <Link href="/hotel-personeel-amsterdam" className="block">
                    <h4 className="font-bold text-purple-900 mb-2 group-hover:text-white transition-colors">Hotel personeel</h4>
                    <p className="text-sm text-purple-800/70 group-hover:text-white/80 transition-colors">Housekeeping, receptie en F&B medewerkers voor de top van de Amsterdamse hotellerie.</p>
                  </Link>
                </li>
                <li className="bg-purple-50 p-6 rounded-2xl border border-purple-100 group hover:bg-purple-600 transition-all duration-300">
                  <Link href="/evenementen-personeel-amsterdam" className="block">
                    <h4 className="font-bold text-purple-900 mb-2 group-hover:text-white transition-colors">Evenementen personeel</h4>
                    <p className="text-sm text-purple-800/70 group-hover:text-white/80 transition-colors">Professionele gastheren, gastvrouwen en bediening voor zakelijke events en publieksbeurzen.</p>
                  </Link>
                </li>
                <li className="bg-purple-50 p-6 rounded-2xl border border-purple-100 group hover:bg-purple-600 transition-all duration-300">
                  <Link href="/catering-personeel-amsterdam" className="block">
                    <h4 className="font-bold text-purple-900 mb-2 group-hover:text-white transition-colors">Catering personeel</h4>
                    <p className="text-sm text-purple-800/70 group-hover:text-white/80 transition-colors">Flexibele krachten voor bedrijfscatering en partycatering op locatie.</p>
                  </Link>
                </li>
                <li className="bg-purple-50 p-6 rounded-2xl border border-purple-100 group hover:bg-purple-600 transition-all duration-300">
                  <Link href="/restaurant-personeel-amsterdam" className="block">
                    <h4 className="font-bold text-purple-900 mb-2 group-hover:text-white transition-colors">Restaurant personeel</h4>
                    <p className="text-sm text-purple-800/70 group-hover:text-white/80 transition-colors">Ervaren kelners en barpersoneel die direct mee kunnen draaien in uw service.</p>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Feature/USP Section */}
        <section className="py-24 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Waarom kiezen voor EXTRA?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Wij zijn meer dan een uitzendbureau; wij zijn een verlengstuk van uw team.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Lokaal Focus", desc: "We kennen de Amsterdamse markt als onze broekzak. Onze mensen wonen in de stad en kennen de weg." },
                { title: "EXTRA Academy", desc: "Iedereen wordt getraind voordat ze aan de slag gaan. Gastvrijheid zit in ons DNA." },
                { title: "Beloningssysteem", desc: "Ons unieke EXTRAATje systeem motiveert medewerkers om elke dienst boven verwachting te presteren." }
              ].map((usp, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                    <Check className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{usp.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{usp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Section 2 */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-5">
            <div className="prose prose-lg text-gray-600">
              <h2 className="text-3xl font-bold mb-8 text-gray-900">Het EXTRAATje: Onze drijfveer</h2>
              <p>
                Wat EXTRA uniek maakt in de wereld van <strong>horeca uitzendbureaus in Amsterdam</strong>, is ons beloningssysteem: het EXTRAATje. We geloven dat waardering de sleutel is tot uitmuntende service. Onze medewerkers sparen punten bij elke gewerkte dienst, maar ze verdienen extra punten voor punctualiteit, positieve feedback van u als klant en proactief handelen.
              </p>
              <p>
                Deze punten kunnen zij verzilveren voor waardevolle beloningen, variërend van bioscoopbonnen en hippe gadgets tot unieke ervaringen. Het resultaat? Medewerkers die met een glimlach op de werkvloer verschijnen en altijd bereid zijn die 'extra' stap te zetten. Voor u betekent dit minder uitval, hogere kwaliteit en een betere sfeer in uw team.
              </p>

              <h3 className="text-2xl font-bold mt-12 mb-6 text-gray-900">Flexibiliteit zonder zorgen</h3>
              <p>
                Horeca is hollen of stilstaan. Een onverwachte zonnige dag op het terras, een last-minute groepsreservering of ziekte binnen uw vaste team; u heeft direct <strong>flexibel horeca personeel</strong> nodig. Onze systemen zijn erop ingericht om snel te kunnen schakelen. Via ons platform kunt u eenvoudig aanvragen doen en ziet u direct wie er komt werken.
              </p>
              <p>
                Doordat wij alle administratieve lasten, verzekeringen en loonbetalingen op ons nemen, kunt u zich volledig focussen op wat echt belangrijk is: uw gasten. Wij zorgen voor de back-office, de werving en de training, zodat u altijd beschikt over de juiste <Link href="/horeca-personeel-amsterdam" className="text-purple-600 hover:underline">horeca krachten in Amsterdam</Link>.
              </p>
              
              <div className="my-16 bg-purple-900 rounded-[2.5rem] p-10 lg:p-14 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-6">Klaar om de service naar een hoger niveau te tillen?</h3>
                  <p className="text-xl text-purple-100 mb-8">Neem contact met ons op voor een vrijblijvend kennismakingsgesprek of doe direct een personeelsaanvraag.</p>
                  <Link href="/personeelsaanvraag" className="inline-block bg-white text-purple-900 px-8 py-4 rounded-full font-bold hover:bg-purple-50 transition-colors">
                    Start nu uw aanvraag
                  </Link>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              </div>

              <h2 className="text-3xl font-bold mb-8 text-gray-900">Veelgestelde vragen over ons horeca uitzendbureau</h2>
              <div className="space-y-6 not-prose">
                {faqs.map((faq, i) => (
                  <div key={i} className="border-b border-gray-100 pb-6">
                    <h4 className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-3">
                      <HelpCircle className="w-5 h-5 text-purple-500 shrink-0" />
                      {faq.q}
                    </h4>
                    <p className="text-gray-600 ml-8 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Internal Link Cloud */}
        <section className="py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8 text-center">Gerelateerde pagina's</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Horeca personeel Amsterdam", href: "/horeca-personeel-amsterdam" },
                { label: "Hotel personeel Amsterdam", href: "/hotel-personeel-amsterdam" },
                { label: "Flexibel personeel", href: "/flexibel-horeca-personeel" },
                { label: "Horeca vacatures", href: "/horeca-vacatures-amsterdam" },
                { label: "Personeel inhuren", href: "/horeca-personeel-inhuren" },
                { label: "Restaurant personeel", href: "/restaurant-personeel-amsterdam" },
                { label: "Catering personeel", href: "/catering-personeel-amsterdam" },
                { label: "Evenementen personeel", href: "/evenementen-personeel-amsterdam" }
              ].map((link, i) => (
                <Link key={i} href={link.href} className="bg-white px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all">
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
