import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { motion } from "framer-motion";

const sections = [
  {
    title: "1. Wat zijn cookies",
    body: [
      "Cookies zijn kleine tekstbestanden die een website op je apparaat plaatst om informatie te onthouden, bijvoorbeeld om ingelogd te blijven of om te meten hoe de website gebruikt wordt. Naast cookies gebruiken sommige van de onderstaande diensten vergelijkbare technieken zoals lokale opslag; hieronder noemen we die gemakshalve ook \"cookies\".",
    ],
  },
  {
    title: "2. Welke cookies wij gebruiken",
    intro: "doehetextra.nl gebruikt de volgende categorieën cookies:",
    list: [
      "Noodzakelijke cookies: de sessiecookie extra.sid, die nodig is om ingelogde gebruikers (bijvoorbeeld medewerkers van EXTRA of Opdrachtgevers) tijdens hun bezoek herkend te houden. Deze cookie is 30 dagen geldig en wordt alleen geplaatst als je inlogt.",
      "Analytische cookies: Google Analytics (via Google Tag Manager) meet hoeveel bezoekers de website heeft en hoe zij de website gebruiken, zodat wij de website kunnen verbeteren. Deze cookies verzamelen geanonimiseerde gebruiksstatistieken.",
      "Analytische technieken zonder cookies: Ahrefs Web Analytics meet bezoekersaantallen zonder daarbij cookies te plaatsen of individuele bezoekers te volgen.",
    ],
  },
  {
    title: "3. Waarom wij deze cookies gebruiken",
    list: [
      "Om de website goed te laten werken voor ingelogde gebruikers.",
      "Om te begrijpen welke pagina's goed bezocht worden en waar bezoekers vastlopen, zodat wij de website kunnen verbeteren.",
      "Wij gebruiken geen cookies voor advertentiedoeleinden en verkopen geen gegevens uit cookies aan derden.",
    ],
  },
  {
    title: "4. Cookies beheren en uitschakelen",
    body: [
      "Je kunt cookies altijd zelf beheren of verwijderen via de instellingen van je browser. Houd er rekening mee dat de website zonder de noodzakelijke sessiecookie niet volledig werkt voor functies waarvoor inloggen nodig is.",
      "Analytische cookies van Google Analytics kun je apart blokkeren met een browser-extensie zoals de Google Analytics Opt-out Browser Add-on.",
    ],
  },
  {
    title: "5. Wijzigingen",
    body: [
      "Wij kunnen dit cookiebeleid van tijd tot tijd aanpassen, bijvoorbeeld wanneer wij een nieuwe dienst toevoegen die cookies gebruikt. De meest recente versie staat altijd op deze pagina, met bovenaan de datum van de laatste wijziging.",
    ],
  },
  {
    title: "6. Contact",
    body: ["Vragen over dit cookiebeleid? Neem contact op via info@doehetextra.nl."],
  },
];

export default function Cookiebeleid() {
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
                Cookie<span className="text-purple-400">beleid</span>
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
