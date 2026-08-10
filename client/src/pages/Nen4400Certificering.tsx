import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { motion } from "framer-motion";
import { Shield, CheckCircle2, FileCheck } from "lucide-react";

const sections = [
  {
    title: "Wat is NEN 4400-1",
    body: [
      "NEN 4400-1 is de Nederlandse norm voor de inlenersaansprakelijkheid bij het ter beschikking stellen van arbeidskrachten door uitzendbureaus die in Nederland zijn gevestigd. De norm toetst of een uitzendbureau voldoet aan zijn verplichtingen rond loonheffingen, omzetbelasting en het minimumloon, en of het bureau werkt volgens de relevante wet- en regelgeving voor het ter beschikking stellen van personeel.",
      "Een NEN 4400-1-registratie wordt onafhankelijk gecontroleerd. Dat geeft Opdrachtgevers zekerheid: wie personeel inhuurt via een gecertificeerd bureau, loopt aanzienlijk minder risico op inlenersaansprakelijkheid voor onbetaalde loonheffingen of btw.",
    ],
  },
  {
    title: "Wat dit voor jou als Opdrachtgever betekent",
    list: [
      "Iedereen die via EXTRA werkt, is bij EXTRA in loondienst — geen zzp-constructies en geen schijnzelfstandigheid.",
      "Loonheffingen en btw worden door EXTRA correct afgedragen, gecontroleerd volgens de NEN 4400-1-norm.",
      "Minder risico op inlenersaansprakelijkheid: je huurt personeel in bij een bureau dat onafhankelijk getoetst is.",
      "Duidelijke, controleerbare afspraken over tarieven, uren en facturatie.",
    ],
  },
  {
    title: "Wat dit voor jou als Medewerker betekent",
    list: [
      "Je werkt in loondienst bij EXTRA, met de bijbehorende arbeidsrechtelijke bescherming.",
      "Je pensioenopbouw, vakantiegeld en overige verplichte afdrachten lopen zoals wettelijk voorgeschreven.",
      "Je hoeft je geen zorgen te maken over correcte belastingafdracht: dat regelt EXTRA.",
    ],
  },
];

export default function Nen4400Certificering() {
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
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-400/30 rounded-full px-4 py-1.5 mb-6">
                <Shield className="w-4 h-4 text-purple-300" />
                <span className="text-sm font-semibold text-purple-200">NEN 4400-1 gecertificeerd</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                NEN 4400-1 <span className="text-purple-400">certificering</span>
              </h1>
              <p className="text-purple-100/80 leading-relaxed max-w-2xl">
                EXTRA Uitzendbureau B.V. is geregistreerd volgens de NEN 4400-1-norm. Op deze pagina lees je
                wat die norm inhoudt en wat dat concreet betekent voor Opdrachtgevers en Medewerkers.
              </p>
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
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-purple-400 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              <div className="rounded-2xl border border-purple-400/20 bg-purple-500/5 p-6 flex items-start gap-4">
                <FileCheck className="w-6 h-6 text-purple-300 shrink-0 mt-0.5" />
                <p className="text-purple-100/80 leading-relaxed text-sm">
                  Wil je onze registratiegegevens controleren, of heb je andere vragen over hoe EXTRA aan de
                  norm voldoet? Neem contact op via{" "}
                  <a href="mailto:info@doehetextra.nl" className="text-purple-300 hover:text-white underline">
                    info@doehetextra.nl
                  </a>.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
