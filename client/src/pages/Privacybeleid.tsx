import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { motion } from "framer-motion";

const sections = [
  {
    title: "1. Wie zijn wij",
    body: [
      'De EXTRA Medewerker-app wordt aangeboden door EXTRA B.V. ("EXTRA", "wij"), een bemiddelaar in horecapersoneel in Nederland. In dit privacybeleid leggen wij uit welke persoonsgegevens wij verwerken wanneer je de app gebruikt, waarom wij dat doen en welke rechten je hebt. Voor vragen kun je contact opnemen via info@doehetextra.nl.',
    ],
  },
  {
    title: "2. Welke gegevens wij verwerken",
    intro: "Afhankelijk van hoe je de app gebruikt, verwerken wij de volgende gegevens:",
    list: [
      "Accountgegevens: je naam, e-mailadres en telefoonnummer.",
      "Werkgerelateerde gegevens: je functie, beschikbaarheid, de diensten waarvoor je je inschrijft, gewerkte uren en in- en uitkloktijden.",
      "Verdiensten: je all-in uurtarief en de vergoeding per dienst.",
      "Foto's: foto's die je zelf maakt of uploadt bij het afronden van een dienst (bijvoorbeeld een uitschrijflijst).",
      "Locatie (woonplaats): je opgegeven woonplaats, om diensten in jouw omgeving te kunnen tonen. De app volgt je locatie niet op de achtergrond.",
      "Apparaatgegevens: een notificatietoken om je pushmeldingen te kunnen sturen over nieuwe en aankomende diensten.",
      "Agenda: alleen met jouw toestemming voegen wij je diensten toe aan de agenda op je apparaat. Deze gegevens blijven op je apparaat.",
    ],
  },
  {
    title: "3. Waarvoor wij je gegevens gebruiken",
    list: [
      "Om je in te laten loggen en je account te beheren.",
      "Om beschikbare diensten te tonen die bij jou passen.",
      "Om je inschrijvingen, gewerkte uren en verdiensten bij te houden.",
      "Om je via pushmeldingen of e-mail op de hoogte te houden van diensten.",
      "Om opdrachtgevers de juiste informatie te geven over de ingeplande medewerker voor een dienst.",
    ],
  },
  {
    title: "4. Delen met anderen",
    intro: "Wij verkopen je gegevens nooit. Wij delen gegevens alleen wanneer dat nodig is:",
    list: [
      "Met de opdrachtgever (het horecabedrijf) waar je een dienst draait, voor zover nodig voor de uitvoering van die dienst.",
      "Met dienstverleners die ons helpen de app te laten werken, zoals onze e-mailprovider (voor inlog- en informatiemails) en onze hostingprovider (voor het veilig opslaan van gegevens en geuploade foto's). Deze partijen mogen de gegevens alleen namens ons verwerken.",
      "Wanneer wij daartoe wettelijk verplicht zijn.",
    ],
  },
  {
    title: "5. Bewaartermijn",
    body: [
      "Wij bewaren je gegevens niet langer dan nodig is voor de doelen hierboven of zolang dit wettelijk verplicht is (bijvoorbeeld voor de administratie van gewerkte uren). Daarna verwijderen wij je gegevens of maken wij ze anoniem.",
    ],
  },
  {
    title: "6. Beveiliging",
    body: [
      "Wachtwoorden worden versleuteld opgeslagen en verbindingen verlopen via beveiligde (HTTPS) verbindingen. Wij nemen passende technische en organisatorische maatregelen om je gegevens te beschermen.",
    ],
  },
  {
    title: "7. Je rechten",
    body: [
      "Je hebt het recht om je gegevens in te zien, te laten corrigeren of te laten verwijderen, en om bezwaar te maken tegen bepaalde verwerkingen. Je kunt je account laten verwijderen door een e-mail te sturen naar info@doehetextra.nl. Ook kun je een klacht indienen bij de Autoriteit Persoonsgegevens.",
    ],
  },
  {
    title: "8. Wijzigingen",
    body: [
      "Wij kunnen dit privacybeleid van tijd tot tijd aanpassen. De meest recente versie staat altijd op deze pagina, met bovenaan de datum van de laatste wijziging.",
    ],
  },
  {
    title: "9. Contact",
    body: ["EXTRA B.V.", "E-mail: info@doehetextra.nl"],
  },
];

export default function Privacybeleid() {
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
                Privacybeleid <span className="text-purple-400">EXTRA Medewerker-app</span>
              </h1>
              <p className="text-sm text-purple-300/60">Laatst bijgewerkt: 6 juni 2026</p>
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
                  {s.intro && (
                    <p className="text-purple-100/80 leading-relaxed mb-4">{s.intro}</p>
                  )}
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
