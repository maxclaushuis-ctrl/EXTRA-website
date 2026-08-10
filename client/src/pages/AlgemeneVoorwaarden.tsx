import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { motion } from "framer-motion";

const sections = [
  {
    title: "1. Definities",
    list: [
      "EXTRA: EXTRA Uitzendbureau B.V., gevestigd aan Herengracht 372, 1016 CH Amsterdam, KvK 91860903.",
      "Opdrachtgever: de horecaonderneming of andere organisatie die via EXTRA personeel inhuurt.",
      "Medewerker: de natuurlijke persoon die zich bij EXTRA inschrijft en via EXTRA diensten werkt.",
      "Diensten: de bemiddeling en uitzending van personeel door EXTRA aan een Opdrachtgever.",
      "Website: doehetextra.nl en de bijbehorende (web)applicaties.",
    ],
  },
  {
    title: "2. Toepasselijkheid",
    body: [
      "Deze algemene voorwaarden zijn van toepassing op elk gebruik van de Website, op elke aanvraag van personeel door een Opdrachtgever en op elke inschrijving en elke Dienst van een Medewerker via EXTRA.",
      "Afwijkingen van deze voorwaarden zijn alleen geldig als EXTRA die uitdrukkelijk en schriftelijk heeft bevestigd.",
    ],
  },
  {
    title: "3. Dienstverlening",
    body: [
      "EXTRA bemiddelt tussen Opdrachtgevers die tijdelijk horecapersoneel nodig hebben en Medewerkers die via EXTRA willen werken. Medewerkers werken bij het uitvoeren van een Dienst in loondienst bij EXTRA; EXTRA stelt hen ter beschikking aan de Opdrachtgever voor de duur van die Dienst.",
      "EXTRA spant zich in om een passende match te maken, maar garandeert niet dat voor elke aanvraag van een Opdrachtgever tijdig een Medewerker beschikbaar is, of dat voor elke ingeschreven Medewerker doorlopend Diensten beschikbaar zijn.",
    ],
  },
  {
    title: "4. Aanvragen door Opdrachtgevers",
    body: [
      "Een Opdrachtgever kan personeel aanvragen via de Website of telefonisch. Een aanvraag is pas definitief zodra EXTRA de aanvraag schriftelijk (waaronder per e-mail) heeft bevestigd, met daarin de afgesproken functie, periode en het tarief.",
      "De Opdrachtgever is verantwoordelijk voor een veilige werkplek en voor het geven van de instructies die nodig zijn om de Dienst goed te kunnen uitvoeren, en houdt zich aan de op de werkplek geldende wet- en regelgeving, waaronder de Arbeidsomstandighedenwet.",
    ],
  },
  {
    title: "5. Inschrijving door Medewerkers",
    body: [
      "Een Medewerker schrijft zich in via de Website of het aanmeldformulier. Inschrijving verplicht een Medewerker niet tot het aannemen van een Dienst; EXTRA verplicht zich niet tot het doorlopend aanbieden van Diensten.",
      "Een Medewerker is verplicht om juiste en volledige gegevens te verstrekken (waaronder een geldige werkvergunning indien van toepassing) en om tijdig te melden wanneer die gegevens wijzigen.",
    ],
  },
  {
    title: "6. Tarieven en facturatie",
    body: [
      "Het tarief voor een Dienst wordt voorafgaand aan de Dienst met de Opdrachtgever afgesproken en schriftelijk bevestigd. Alle door EXTRA genoemde tarieven zijn exclusief btw, tenzij anders vermeld.",
      "EXTRA factureert op basis van de daadwerkelijk gewerkte uren, tenzij schriftelijk anders is overeengekomen. De betaaltermijn is 14 dagen na factuurdatum, tenzij anders overeengekomen.",
    ],
  },
  {
    title: "7. Annulering en wijziging",
    body: [
      "Een Opdrachtgever kan een bevestigde Dienst kosteloos annuleren of wijzigen tot 24 uur voor aanvang. Bij annulering binnen 24 uur voor aanvang kan EXTRA een redelijke vergoeding in rekening brengen, om de reeds ingeplande Medewerker te compenseren.",
      "Een Medewerker die een bevestigde Dienst niet kan uitvoeren, meldt dit zo snel mogelijk bij EXTRA, zodat tijdig vervanging gezocht kan worden.",
    ],
  },
  {
    title: "8. Aansprakelijkheid",
    body: [
      "EXTRA spant zich in om zorgvuldig personeel te selecteren, maar is niet aansprakelijk voor schade die voortvloeit uit het handelen of nalaten van een Medewerker tijdens een Dienst, behalve voor zover die schade het gevolg is van opzet of bewuste roekeloosheid van EXTRA zelf.",
      "De aansprakelijkheid van EXTRA is in alle gevallen beperkt tot het bedrag dat in het betreffende geval door de aansprakelijkheidsverzekering van EXTRA wordt uitgekeerd, vermeerderd met het eigen risico. Is er geen uitkering vanuit die verzekering, dan is de aansprakelijkheid beperkt tot het factuurbedrag van de Dienst waarop de schade betrekking heeft.",
      "Deze beperking geldt niet voor schade die het gevolg is van opzet of bewuste roekeloosheid van EXTRA, en niet voor zover dwingend recht een verdergaande aansprakelijkheid voorschrijft.",
    ],
  },
  {
    title: "9. Persoonsgegevens",
    body: [
      "EXTRA verwerkt persoonsgegevens van Opdrachtgevers en Medewerkers voor zover nodig voor de uitvoering van de Diensten. Hoe EXTRA met persoonsgegevens omgaat staat beschreven in het privacybeleid.",
    ],
  },
  {
    title: "10. Intellectueel eigendom",
    body: [
      "Alle rechten van intellectueel eigendom op de Website en de daarop gepubliceerde content berusten bij EXTRA of haar licentiegevers. Niets van de Website mag zonder voorafgaande schriftelijke toestemming van EXTRA worden verveelvoudigd of openbaar gemaakt, anders dan voor persoonlijk, niet-commercieel gebruik.",
    ],
  },
  {
    title: "11. Wijzigingen van deze voorwaarden",
    body: [
      "EXTRA kan deze algemene voorwaarden van tijd tot tijd wijzigen. De meest recente versie staat altijd op deze pagina, met bovenaan de datum van de laatste wijziging. Voor lopende afspraken blijft de versie gelden die van toepassing was op het moment dat de afspraak werd bevestigd.",
    ],
  },
  {
    title: "12. Toepasselijk recht en geschillen",
    body: [
      "Op deze voorwaarden en op alle overeenkomsten met EXTRA is Nederlands recht van toepassing. Geschillen worden zoveel mogelijk in onderling overleg opgelost. Komen partijen er niet uit, dan is de rechtbank Amsterdam bevoegd, tenzij dwingend recht een andere rechter voorschrijft.",
    ],
  },
  {
    title: "13. Contact",
    body: ["EXTRA Uitzendbureau B.V.", "Herengracht 372, 1016 CH Amsterdam", "KvK 91860903", "E-mail: info@doehetextra.nl"],
  },
];

export default function AlgemeneVoorwaarden() {
  return (
    <div className="min-h-screen bg-[#0a0310] text-white font-poppins">
      <PublicNav forceDark />

      <main className="pt-24 pb-20">
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                Algemene <span className="text-purple-400">voorwaarden</span>
              </h1>
              <p className="text-sm text-purple-300/60">Laatst bijgewerkt: 10 augustus 2026</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-12 space-y-10"
            >
              {sections.map((s) => (
                <div key={s.title}>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-4">{s.title}</h2>
                  {s.body?.map((p, i) => (
                    <p key={i} className="text-purple-100/80 leading-relaxed mb-3">
                      {p}
                    </p>
                  ))}
                  {s.list && (
                    <ul className="space-y-3">
                      {s.list.map((item, i) => (
                        <li key={i} className="flex gap-3 text-purple-100/80 leading-relaxed">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
