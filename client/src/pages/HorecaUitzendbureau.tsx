import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import FAQSection from "@/components/FAQSection";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Check, ChevronRight, Building2, ArrowRight, Star } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

export default function HorecaUitzendbureau() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const faqs = [
    { q: "Hoe snel kan EXTRA personeel leveren in Amsterdam?", a: "Dankzij onze focus op Amsterdam en ons grote bestand aan actieve medewerkers kunnen we vaak binnen 24 uur schakelen. Voor spoedaanvragen hebben we een dedicated team dat direct kijkt naar de beschikbaarheid van onze best getrainde mensen." },
    { q: "Is het personeel van EXTRA in loondienst of zijn het ZZP'ers?", a: "Bij EXTRA werken we uitsluitend met personeel in loondienst. Dit neemt alle risico's rondom schijnzelfstandigheid (Wet DBA) bij jou weg en zorgt voor een hogere betrokkenheid en kwaliteit van de medewerkers." },
    { q: "Welke training krijgen de horecamedewerkers?", a: "Onze medewerkers doorlopen de EXTRA Academy. Hier leren ze de basis van gastvrijheid, etiquette, serveertechnieken en specifieke vaardigheden voor hotels en high-end events. Zo garanderen we dat iedereen direct productief is op de werkvloer." },
    { q: "Hoe werkt het EXTRAATje beloningssysteem voor klanten?", a: "Het EXTRAATje systeem is uniek in de branche. Medewerkers verdienen punten voor goed werk, punctualiteit en positieve reviews. Dit motiveert hen om altijd dat stapje extra te zetten bij jou op de vloer, wat betere service voor je gasten oplevert." },
    { q: "Leveren jullie ook personeel buiten Amsterdam?", a: "Hoewel onze focus en expertise in Amsterdam liggen, ondersteunen we onze vaste partners ook regelmatig bij opdrachten in de omliggende regio's (Amstelveen, Zaandam, Haarlem). Neem contact met ons op voor de mogelijkheden." }
  ];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Organization",
    "name": "EXTRA Horeca Uitzendbureau Amsterdam",
    "url": "https://doehetextra.nl/horeca-uitzendbureau-amsterdam",
    "logo": "https://doehetextra.nl/assets/EXTRA_LOGO_BLAUW.png",
    "contactPoint": { "@type": "ContactPoint", "telephone": "+31-85-1305915", "contactType": "customer service", "areaServed": "Amsterdam", "availableLanguage": ["Dutch", "English"] },
    "description": "EXTRA is hét horeca uitzendbureau in Amsterdam voor hotels, events en restaurants. Wij leveren gecertificeerd personeel in loondienst."
  };

  return (
    <div className="min-h-screen bg-[#0a0310] text-white font-sans selection:bg-purple-500/30">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <PublicNav forceDark={false} />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#0a0310] to-[#0a0310]" />
          <XPatternBg count={3} opacity={0.1} color="rgba(168,85,247,0.5)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <nav className="flex mb-8 text-sm text-purple-300/60" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                  <li><ChevronRight className="w-4 h-4" /></li>
                  <li className="text-white font-medium">Horeca uitzendbureau Amsterdam</li>
                </ol>
              </nav>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                <Building2 className="w-4 h-4" /> Horeca Uitzendbureau Amsterdam
              </span>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Zo kies je een <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">horeca uitzendbureau</span> in Amsterdam
              </h1>
              <p className="text-xl text-purple-100/70 max-w-3xl mb-10 leading-relaxed">
                Alle bureaus beloven snel en betrouwbaar personeel. Het verschil zit in vijf dingen die je vooraf kunt controleren: wie de werkgever is, welk keurmerk erop zit, of je dezelfde mensen terugkrijgt, wie je belt als het misgaat en wat er in het tarief zit. Hieronder staan ze, met het antwoord van EXTRA erbij.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Personeel aanvragen <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/horeca-vacatures-amsterdam" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/20 transition-all">
                  Ik zoek werk
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Waar let je op — de vergelijkende kern van deze pagina */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Vijf vragen die het verschil laten zien
              </h2>
              <p className="text-white/60 max-w-2xl mb-12 leading-relaxed">
                Stel ze aan elk bureau dat je overweegt. De antwoorden lopen sterker uiteen dan de websites doen vermoeden.
              </p>
            </RevealSection>
            <div className="space-y-6">
              {[
                {
                  vraag: "Is het personeel in loondienst of zijn het zzp'ers?",
                  waarom: "Bij een zzp-constructie blijft het risico op schijnzelfstandigheid bij jou liggen, niet bij het bureau.",
                  extra: "Iedereen die via EXTRA werkt is bij ons in loondienst. Loonheffing, cao-beloning en verzekeringen liggen bij ons.",
                },
                {
                  vraag: "Welk keurmerk heeft het bureau?",
                  waarom: "Zonder keurmerk ben je als inlener aansprakelijk voor loonheffingen die het bureau niet afdraagt.",
                  extra: "EXTRA is NEN 4400-1 gecertificeerd en geregistreerd in het Waadi-register van de SNA.",
                  link: { href: "/nen-4400-1-certificering", label: "Wat NEN 4400-1 betekent" },
                },
                {
                  vraag: "Krijg ik dezelfde mensen terug?",
                  waarom: "Elke nieuwe medewerker kost inwerktijd. Een bureau dat steeds iemand anders stuurt, verschuift die kosten naar jou.",
                  extra: "Wie het bij jou goed doet, komt in je vaste poule en wordt bij een volgende aanvraag als eerste gevraagd.",
                },
                {
                  vraag: "Wie bel ik als er iemand niet komt opdagen?",
                  waarom: "Een centraal nummer zonder vast aanspreekpunt betekent dat je je verhaal elke keer opnieuw doet.",
                  extra: "Je hebt een vaste accountmanager die je locatie kent. Geen callcenter, geen ticketsysteem.",
                },
                {
                  vraag: "Wat zit er precies in het uurtarief?",
                  waarom: "Losse toeslagen, bureaukosten en reiskosten achteraf maken een laag uurtarief alsnog duur.",
                  extra: "Eén all-in uurtarief per gewerkt uur, inclusief loon, vakantiegeld, premies en verzekeringen.",
                  link: { href: "/horeca-personeel-inhuren", label: "Meer over inhuren en tarieven" },
                },
              ].map((item, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
                    <h3 className="text-xl font-bold text-white mb-3">{item.vraag}</h3>
                    <p className="text-white/50 leading-relaxed mb-4">{item.waarom}</p>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-white/80 leading-relaxed">
                        {item.extra}
                        {item.link && (
                          <>
                            {" "}
                            <Link href={item.link.href} className="text-purple-300 underline underline-offset-4 hover:text-purple-200 transition-colors">
                              {item.link.label}
                            </Link>
                            .
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* Branches */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>De nieuwe standaard in horeca-uitzending</h2>
              <p className="text-white/60 max-w-2xl mb-12 leading-relaxed">
                De Amsterdamse horeca is dynamisch, veeleisend en altijd in beweging. Bij EXTRA hebben we een unieke aanpak ontwikkeld die focust op kwaliteit, betrokkenheid en continuïteit. Wij werken uitsluitend met personeel in loondienst, wat jou zekerheid geeft en onze medewerkers loyaal houdt.
              </p>
              <h3 className="text-xl font-bold text-white/80 mb-8">Gespecialiseerd in diverse branches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { href: "/hotelpersoneel-inhuren", title: "Hotel personeel", desc: "Housekeeping, receptie en F&B medewerkers voor de top van de Amsterdamse hotellerie." },
                  { href: "/eventpersoneel-inhuren", title: "Evenementen personeel", desc: "Professionele gastheren, gastvrouwen en bediening voor zakelijke events en publieksbeurzen." },
                  { href: "/cateringpersoneel-inhuren", title: "Catering personeel", desc: "Flexibele krachten voor bedrijfscatering en partycatering op locatie." },
                  { href: "/horecapersoneel-restaurants", title: "Restaurant personeel", desc: "Ervaren kelners en barpersoneel die direct mee kunnen draaien in jouw service." }
                ].map((item, i) => (
                  <RevealSection key={i} delay={i * 100}>
                    <Link href={item.href} className="group block bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-purple-500/40 transition-all duration-300">
                      <h4 className="font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{item.title}</h4>
                      <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                      <span className="inline-flex items-center gap-1 text-purple-400 text-sm font-bold mt-4 group-hover:gap-2 transition-all">
                        Meer info <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* USPs */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Waarom kiezen voor EXTRA?</h2>
                <p className="text-white/60 max-w-2xl mx-auto">Wij zijn meer dan een uitzendbureau; wij zijn een verlengstuk van jouw team.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: "Lokaal Focus", desc: "We kennen de Amsterdamse markt als onze broekzak. Onze mensen wonen in de stad en kennen de weg." },
                  { title: "EXTRA Academy", desc: "Iedereen wordt getraind voordat ze aan de slag gaan. Gastvrijheid zit in ons DNA." },
                  { title: "Beloningssysteem", desc: "Ons unieke EXTRAATje systeem motiveert medewerkers om elke dienst boven verwachting te presteren." }
                ].map((usp, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <Check className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{usp.title}</h3>
                      <p className="text-white/60 leading-relaxed">{usp.desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* EXTRAATje + Flexibiliteit */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-4xl mx-auto px-5">
            <RevealSection>
              <h2 className="text-3xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Het EXTRAATje: Onze drijfveer</h2>
              <p className="text-white/60 leading-relaxed mb-6">
                Wat EXTRA uniek maakt in de wereld van <strong className="text-white/80">horeca uitzendbureaus in Amsterdam</strong>, is ons beloningssysteem: het EXTRAATje. We geloven dat waardering de sleutel is tot uitmuntende service. Onze medewerkers sparen punten bij elke gewerkte dienst, maar ze verdienen extra punten voor punctualiteit, positieve feedback van jou als klant en proactief handelen.
              </p>
              <p className="text-white/60 leading-relaxed mb-12">
                Deze punten kunnen zij verzilveren voor waardevolle beloningen, variërend van bioscoopbonnen en hippe gadgets tot unieke ervaringen. Het resultaat? Medewerkers die met een glimlach op de werkvloer verschijnen en altijd bereid zijn die 'extra' stap te zetten.
              </p>

              <h3 className="text-2xl font-black text-white mb-4">Flexibiliteit zonder zorgen</h3>
              <p className="text-white/60 leading-relaxed mb-6">
                Horeca is hollen of stilstaan. Onze systemen zijn erop ingericht om snel te kunnen schakelen. Via ons platform doe je eenvoudig een aanvraag en zie je direct wie er komt werken. Doordat wij alle administratieve lasten, verzekeringen en loonbetalingen op ons nemen, kun jij je volledig richten op je gasten.
              </p>
              <p className="text-white/60 leading-relaxed mb-6">
                Twijfel je nog tussen inlenen, uitbesteden of zelf mensen in dienst nemen? In ons artikel over{" "}
                <Link href="/blog/housekeeping-personeel-inhuren" className="text-purple-300 underline underline-offset-4 hover:text-purple-200 transition-colors">
                  housekeeping personeel inhuren
                </Link>{" "}
                zetten we de drie modellen naast elkaar op leiding, cao, kosten, opzegbaarheid en aansprakelijkheid.
              </p>
            </RevealSection>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Klaar om de service naar een hoger niveau te tillen?</h2>
              <p className="text-xl text-purple-100 mb-10">Bel ons voor een kennismaking, of doe direct een personeelsaanvraag.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/personeelsaanvraag" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-8 py-4 rounded-full hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl">
                  Start je aanvraag <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/30 transition-all">
                  Stel je vraag
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* FAQ */}
        <FAQSection
          heading="Veelgestelde vragen"
          faqs={faqs}
        />

        {/* Link Cloud */}
        <section className="py-12 bg-[#0a0310] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6 text-center">Gerelateerde pagina's</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Horeca personeel Amsterdam", href: "/horeca-personeel-amsterdam" },
                { label: "Hotel personeel Amsterdam", href: "/hotelpersoneel-inhuren" },
                { label: "Flexibel personeel", href: "/flexibel-horeca-personeel" },
                { label: "Horeca vacatures", href: "/horeca-vacatures-amsterdam" },
                { label: "Personeel inhuren", href: "/horeca-personeel-inhuren" },
                { label: "Restaurant personeel", href: "/horecapersoneel-restaurants" },
                { label: "Catering personeel", href: "/cateringpersoneel-inhuren" },
                { label: "Evenementen personeel", href: "/eventpersoneel-inhuren" }
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
