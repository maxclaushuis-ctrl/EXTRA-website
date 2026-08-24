/**
 * BEDANKPAGINA NA EEN PERSONEELSAANVRAAG — /aanvraag-ontvangen
 *
 * Waarom een eigen pagina en niet een bevestiging op dezelfde URL:
 * het formulier wisselde na verzenden de kaart om zonder dat de URL veranderde.
 * Daardoor was er geen bedankpagina, en dus geen doel dat je in GA4 kunt
 * instellen: je kon niet zien hoeveel aanvragen de site opleverde zonder in de
 * database te kijken. Met een eigen URL wordt de aanvraag meetbaar — zowel als
 * paginaweergave als via het conversie-event hieronder.
 *
 * De pagina staat op noindex: hij hoort niet in de zoekresultaten, want hij
 * heeft alleen betekenis direct na het verzenden van het formulier.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Check, Phone, MessageCircle, ArrowRight, Clock } from "lucide-react";
import { TELEFOON, TELEFOON_LINK, WHATSAPP_LINK, OPENINGSTIJDEN } from "@shared/aanvraagMails";

export default function AanvraagOntvangen() {
  useEffect(() => {
    document.title = "Aanvraag ontvangen | EXTRA";

    // Conversie-event voor GA4. gtag staat in client/index.html; als er
    // (nog) geen gtag is, gebeurt er simpelweg niets.
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", "generate_lead", {
        event_category: "personeelsaanvraag",
        event_label: "formulier",
        value: 1,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicNav forceDark={false} />

      <main className="pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <div className="bg-white rounded-3xl shadow-xl shadow-purple-500/10 border border-purple-100 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>

            <h1
              className="text-3xl sm:text-4xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Je aanvraag is ontvangen
            </h1>

            <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
              Je krijgt binnen een paar minuten een bevestiging per mail. Tijdens kantooruren
              ({OPENINGSTIJDEN}) bellen we je meestal binnen een uur terug. Komt je aanvraag
              's avonds of in het weekend binnen, dan bellen we je de eerstvolgende werkdag in
              de ochtend.
            </p>

            <div className="mt-8 p-5 rounded-2xl bg-purple-50 border border-purple-100 text-left sm:text-center">
              <p className="text-sm font-semibold text-purple-900 flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4" /> Is het voor morgenochtend?
              </p>
              <p className="text-sm text-purple-900/70 leading-relaxed">
                Wacht dan niet op ons belletje — bel zelf even, dan kijken we meteen wie er
                beschikbaar is.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                <a
                  href={TELEFOON_LINK}
                  className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white font-bold px-6 py-3 rounded-full hover:bg-purple-700 transition-colors"
                >
                  <Phone className="w-4 h-4" /> {TELEFOON}
                </a>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border-2 border-purple-200 text-purple-700 font-bold px-6 py-3 rounded-full hover:border-purple-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-400 text-sm mb-4">Ondertussen</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/klantcases-horeca"
                className="inline-flex items-center justify-center gap-2 text-purple-700 font-semibold hover:text-purple-900 transition-colors"
              >
                Lees hoe andere hotels met EXTRA werken <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/horeca-uitzendbureau-amsterdam-werkwijze"
                className="inline-flex items-center justify-center gap-2 text-purple-700 font-semibold hover:text-purple-900 transition-colors"
              >
                Bekijk onze werkwijze <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
