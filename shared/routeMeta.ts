/**
 * CENTRALE ROUTE-METADATA (SEO)
 *
 * Eén bron van waarheid voor title, meta description en canonical per publieke route.
 * Wordt gebruikt door:
 *  - server/seo.ts        → injecteert deze waarden server-side in de initiële HTML
 *  - scripts/prerender.ts  → bepaalt welke routes een prerendered HTML-fragment krijgen
 *  - scripts/check-seo.ts  → build-check: lengtes, uniciteit, canonicals
 *  - scripts/register-check.ts → build-check: staat elke indexeerbare route
 *    in docs/PAGINA-REGISTER.md (wie bezit welk zoekwoordcluster)
 *  - de sitemap-route in server/routes.ts (alleen routes zonder noindex)
 *
 * Regels (afgedwongen door scripts/check-seo.mjs):
 *  - title: max 60 tekens, primaire keyword vooraan, uniek (P17 verlaagde
 *    dit van 62 naar 60: daar kapt Google de meeste titles af)
 *  - description: 110–160 tekens, uniek, met concrete CTA waar passend
 *    (dit is de grens die scripts/check-seo.ts daadwerkelijk afdwingt;
 *    hier stond eerder 120–155, wat nergens werd gecontroleerd)
 *  - canonical: self-referencing, behalve bij bewuste duplicaten
 *
 * P14: de vier bekende duplicaten (/nieuws, /beloningssysteem, /hoe-extra-werkt,
 * /over-extra/ons-team) hebben hier bewust GEEN entry meer — ze zijn een echte
 * server-side 301 geworden (server/redirects.ts) en worden dus nooit meer met
 * een 200 geserveerd, dus een entry hier zou dode metadata zijn. Het
 * `canonical`-veld hieronder blijft bestaan voor een toekomstig duplicaat dat
 * nog wél als losse pagina moet blijven bestaan (dan is canonical zonder 301
 * de juiste keuze, zie de originele /nieuws-situatie vóór P14).
 */

export interface RouteMeta {
  /** Route-pad exact zoals in client/src/App.tsx */
  path: string;
  title: string;
  description: string;
  /** Canonical-pad; default = eigen pad. Alleen afwijkend bij bewuste duplicaat-routes. */
  canonical?: string;
  /** true → noindex,nofollow (interne tools, brochures, dashboards) */
  noindex?: boolean;
  /**
   * P18: alleen relevant in combinatie met noindex: true. true → "noindex,
   * follow" in plaats van het standaard "noindex, nofollow". Voor pagina's
   * die zelf niet in de zoekresultaten horen (bijv. klantspecifieke
   * landingspagina's) maar waarvan de uitgaande links wel gewoon gevolgd
   * mogen worden om de rest van de site te ontdekken/waarderen.
   */
  follow?: boolean;
  /** true → scripts/prerender.mjs maakt een statisch HTML-fragment voor deze route */
  prerender?: boolean;
  /** 'en' voor Engelstalige pagina's (og:locale) */
  lang?: "nl" | "en";
  /** Sitemap-prioriteit (alleen gebruikt voor indexeerbare routes) */
  priority?: string;
  changefreq?: string;
}

export const SITE_ORIGIN = "https://www.doehetextra.nl";

export const ROUTE_META: RouteMeta[] = [
  // ── KERNPAGINA'S (NL) ──────────────────────────────────────────────
  {
    path: "/",
    title: "Horeca uitzendbureau Amsterdam | EXTRA",
    description:
      "EXTRA levert flexibel horecapersoneel voor hotels, restaurants, events en cateraars in Amsterdam. Iedereen in loondienst, dagbetaling mogelijk.",
    prerender: true,
    priority: "1.0",
    changefreq: "weekly",
  },
  // /landing bestaat niet meer als eigen pagina: "/" rendert de landings-
  // content nu direct en /landing 301't naar "/" (server/redirects.ts).
  {
    path: "/horeca-uitzendbureau-amsterdam",
    title: "Horeca uitzendbureau Amsterdam | Persoonlijk | EXTRA",
    description:
      "Op zoek naar een horeca uitzendbureau in Amsterdam? EXTRA levert gescreend horecapersoneel, iedereen in loondienst. Ontdek onze aanpak en vraag aan.",
    prerender: true,
    priority: "1.0",
    changefreq: "weekly",
  },
  {
    path: "/horeca-uitzendbureau-amsterdam-werkwijze",
    title: "Werkwijze horeca uitzendbureau EXTRA Amsterdam",
    description:
      "Zo werkt personeel inhuren via EXTRA: aanvraag, match uit onze vaste poule en bevestiging binnen één werkdag. Bekijk de werkwijze en vraag direct aan.",
    prerender: true,
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    path: "/horeca-personeel-amsterdam",
    title: "Horeca personeel Amsterdam nodig? | EXTRA",
    description:
      "Horeca personeel in Amsterdam nodig? EXTRA levert bediening, keuken en housekeeping — gescreend en direct inzetbaar. Vraag vandaag nog personeel aan.",
    prerender: true,
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    path: "/horeca-personeel",
    title: "Horeca personeel gezocht? Snel geregeld | EXTRA",
    description:
      "EXTRA levert horeca personeel voor hotels, restaurants, cateraars en events. Flexibel op- en afschalen, iedereen in loondienst. Vraag direct aan.",
    prerender: true,
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    path: "/flexibel-horeca-personeel",
    title: "Flexibel horeca personeel inhuren | EXTRA",
    description:
      "Flexibel horecapersoneel dat meebeweegt met jouw bezetting: per shift, per seizoen of structureel. Gescreende medewerkers in loondienst. Vraag aan.",
    prerender: true,
    priority: "0.9",
    changefreq: "weekly",
  },

  // ── WERKGEVERS: SECTORPAGINA'S ─────────────────────────────────────
  {
    path: "/horeca-personeel-gezocht",
    title: "Horeca personeel gezocht | Flexibel via EXTRA",
    description:
      "Horeca personeel nodig? EXTRA levert flexibel horecapersoneel voor hotels, restaurants, cateraars en events. Gescreend, betrouwbaar en direct inzetbaar.",
    prerender: true,
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    path: "/horecapersoneel-restaurants",
    title: "Restaurantpersoneel inhuren | Bediening & keuken",
    description:
      "Horecapersoneel voor jouw restaurant: ervaren bediening, runners, bartenders en keukenpersoneel via EXTRA. Flexibel en direct inzetbaar. Vraag aan.",
    prerender: true,
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    path: "/hotelpersoneel-inhuren",
    title: "Hotelpersoneel inhuren | Housekeeping & F&B | EXTRA",
    description:
      "Hotelpersoneel nodig? EXTRA levert ervaren medewerkers voor housekeeping, front office, banqueting en F&B die hotelstandaarden begrijpen. Vraag aan.",
    prerender: true,
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    path: "/eventpersoneel-inhuren",
    title: "Eventpersoneel inhuren | Bediening, bar & hosts",
    description:
      "Eventpersoneel nodig? EXTRA levert ervaren bediening, bartenders, runners en hosts voor events — representatief en gewend aan tempo. Vraag direct aan.",
    prerender: true,
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    path: "/cateringpersoneel-inhuren",
    title: "Cateringpersoneel inhuren | Bediening & chefs",
    description:
      "Cateringpersoneel nodig? EXTRA levert ervaren bediening, runners, chefs en keukenondersteuning voor cateraars en grote events. Vraag direct aan.",
    prerender: true,
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    path: "/personeelsaanvraag",
    title: "Horeca personeel inhuren | Vraag direct aan | EXTRA",
    description:
      "Vraag flexibel horecapersoneel aan via EXTRA. Vul het formulier in en wij nemen binnen één werkdag contact op met een passende match uit onze poule.",
    prerender: true,
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    // Bedankpagina na het aanvraagformulier. Bewust noindex: hij heeft alleen
    // betekenis direct na verzenden. Wel follow, zodat de links naar de
    // klantcases en de werkwijze gewoon meetellen.
    //
    // prerender bewust false: de pagina heeft geen SEO-doel en check-seo eist
    // een gecommit fragment voor elke route met prerender: true.
    path: "/aanvraag-ontvangen",
    title: "Aanvraag ontvangen | EXTRA",
    description:
      "Bedankt voor je aanvraag. Je krijgt een bevestiging per mail en wij nemen tijdens kantooruren meestal binnen een uur telefonisch contact op.",
    noindex: true,
    follow: true,
    prerender: false,
  },
  {
    path: "/klantcases-horeca",
    title: "Klantcases horeca | Zo werken klanten met EXTRA",
    description:
      "Lees hoe hotels, restaurants en eventlocaties in Amsterdam met EXTRA werken: van losse shifts tot vaste poules. Bekijk de klantcases en vraag aan.",
    prerender: true,
    priority: "0.75",
    changefreq: "monthly",
  },
  {
    path: "/BHG-group",
    title: "BHG Group & EXTRA | Horecapersoneel op maat",
    description:
      "Zo werkt BHG Group met EXTRA: flexibel horecapersoneel dat de locaties kent en meebeweegt met de bezetting. Lees de samenwerking en vraag zelf aan.",
    prerender: true,
    // P18: klantspecifieke landingspagina, bewust niet gelinkt vanuit de site
    // en niet bedoeld voor de zoekresultaten. noindex zodat hij niet als
    // orphan-pagina in een volgende audit terugkomt; follow zodat de
    // uitgaande links op de pagina (naar bijv. /cateringpersoneel-inhuren)
    // gewoon meetellen.
    noindex: true,
    follow: true,
  },
  {
    path: "/xebia",
    title: "Xebia & EXTRA | Hospitality op kantoor",
    description:
      "Zo ondersteunt EXTRA Xebia met hospitality-professionals op kantoor: ontvangst, catering en events. Lees de case en ontdek wat EXTRA kan leveren.",
    prerender: true,
    // P18: zelfde situatie als /BHG-group hierboven.
    noindex: true,
    follow: true,
  },

  // ── KANDIDATEN (NL) ────────────────────────────────────────────────
  {
    path: "/horeca-vacatures-amsterdam",
    title: "Extra werk in de horeca Amsterdam | EXTRA",
    description:
      "Via EXTRA werk je bij hotels, restaurants en events in Amsterdam wanneer het jou uitkomt. Dagbetaling mogelijk, iedereen in loondienst. Schrijf je in.",
    prerender: true,
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    path: "/horeca-werk-amsterdam",
    title: "Horeca werk Amsterdam | Direct aan de slag | EXTRA",
    description:
      "Horeca werk zoeken in Amsterdam? Kies je eigen shifts bij tophotels, restaurants en events. Dagbetaling mogelijk via EXTRA. Meld je vandaag nog aan.",
    prerender: true,
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    path: "/horeca-werk",
    title: "Horeca werk | Flexibele shifts met dagbetaling",
    description:
      "Op zoek naar horeca werk? Werk wanneer jij wilt bij hotels, restaurants en events. Flexibele horeca vacatures met dagbetaling via EXTRA. Meld je aan.",
    prerender: true,
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    path: "/housekeeping-vacatures-amsterdam",
    title: "Housekeeping vacatures Amsterdam | EXTRA",
    description:
      "Housekeeping vacatures in Amsterdam: werk als room attendant in tophotels met flexibele diensten en snelle uitbetaling via EXTRA. Solliciteer direct.",
    prerender: true,
    priority: "0.9",
    changefreq: "weekly",
  },
  {
    path: "/housekeeping-werk",
    title: "Housekeeping werk Amsterdam | Tophotels | EXTRA",
    description:
      "Housekeeping werk in Amsterdam: aan de slag als room attendant of hotelschoonmaker in tophotels. Flexibele diensten, snelle uitbetaling. Meld je aan.",
    prerender: true,
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    path: "/chef-vacatures-amsterdam",
    title: "Chef vacatures Amsterdam | Kok werk via EXTRA",
    description:
      "Op zoek naar chef of kok werk in Amsterdam? Werk in hotels, restaurants en events via EXTRA met flexibele diensten en dagbetaling. Solliciteer direct.",
    prerender: true,
    priority: "0.85",
    changefreq: "weekly",
  },
  {
    path: "/front-office-vacatures-amsterdam",
    title: "Front office vacatures Amsterdam | EXTRA",
    description:
      "Front office vacatures of receptionist werk in Amsterdam? Via EXTRA werk je in tophotels met flexibele diensten en dagbetaling. Solliciteer direct.",
    prerender: true,
    priority: "0.85",
    changefreq: "weekly",
  },
  {
    path: "/vacatures",
    title: "Horeca vacatures Amsterdam | Bediening & chef",
    description:
      "Actuele horeca vacatures in Amsterdam via EXTRA: bediening, chef, bartender en housekeeping bij tophotels en eventlocaties. Solliciteer vandaag nog.",
    prerender: true,
    priority: "0.9",
    changefreq: "daily",
  },
  {
    path: "/aanmelden",
    title: "Aanmelden als horecamedewerker | EXTRA",
    description:
      "Meld je aan bij EXTRA en werk flexibel in de horeca in Amsterdam. Kies je eigen shifts, krijg dagbetaling en bouw ervaring op. Inschrijven is gratis.",
    prerender: true,
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    path: "/cv-upload",
    title: "Upload je cv | Solliciteer bij EXTRA",
    description:
      "Upload je cv en solliciteer bij EXTRA. Wij matchen je met horeca werk in Amsterdam dat past bij jouw ervaring en beschikbaarheid. Snel geregeld.",
    // Noindex: deze pagina werkt alléén met een persoonlijke uploadlink uit een
    // WhatsApp-bericht. Zonder token valt er niets te uploaden, dus wie hier via
    // Google binnenkomt, komt per definitie verkeerd uit — Ahrefs zag dan ook
    // een <h1> "Ongeldige of verlopen link" onder een titel die uploaden
    // belooft. follow: true, want de links naar /aanmelden en het
    // sollicitatieformulier mogen wél gevolgd worden.
    noindex: true,
    follow: true,
    prerender: true,
    priority: "0.6",
    changefreq: "monthly",
  },
  {
    path: "/sollicitatieformulier",
    title: "Sollicitatieformulier | Werken via EXTRA",
    description:
      "Vul het sollicitatieformulier in en ga aan de slag via EXTRA: horeca, housekeeping of logistiek werk in Amsterdam. Binnen enkele minuten geregeld.",
    prerender: true,
    priority: "0.6",
    changefreq: "monthly",
  },
  // /hoe-werkt-dagbetaling is per SEO-audit (P10) vervangen door /dagbetaling
  // en 301't daarnaartoe (server/redirects.ts).

  // ── SEO-LANDINGSPAGINA'S (P10, juli 2026) ──────────────────────────
  {
    path: "/horeca-personeel-inhuren",
    title: "Horeca personeel inhuren | Snel geregeld | EXTRA",
    description:
      "Horeca personeel inhuren in Amsterdam? EXTRA levert gescreende medewerkers in loondienst — vaak binnen 48 uur. Eén tarief, één factuur. Vraag direct aan.",
    prerender: true,
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    path: "/bediening-inhuren",
    title: "Bediening inhuren | Representatief & ingewerkt",
    description:
      "Bediening inhuren voor je restaurant, hotel of event? EXTRA levert gastgerichte bediening, runners en bartenders in Amsterdam. Vraag vandaag aan.",
    prerender: true,
    priority: "0.85",
    changefreq: "weekly",
  },
  {
    path: "/evenementen-personeel-inhuren",
    title: "Evenementen personeel inhuren | 5 tot 100+ | EXTRA",
    description:
      "Evenementen personeel inhuren? EXTRA levert complete eventteams in Amsterdam: bediening, bar, catering en hosts. Schaalbaar en snel. Vraag direct aan.",
    prerender: true,
    priority: "0.85",
    changefreq: "weekly",
  },
  {
    path: "/tijdelijk-horeca-personeel",
    title: "Tijdelijk horeca personeel | Betaal per uur | EXTRA",
    description:
      "Tijdelijk personeel inhuren voor seizoen, piek of vervanging? Via EXTRA schaal je per week op en af en betaal je alleen gewerkte uren. Vraag direct aan.",
    prerender: true,
    priority: "0.85",
    changefreq: "weekly",
  },
  {
    path: "/bijbaan-amsterdam",
    title: "Bijbaan Amsterdam | Kies je eigen shifts | EXTRA",
    description:
      "Op zoek naar een bijbaan in Amsterdam? Werk in tophotels, restaurants en events, kies zelf je shifts en krijg dagbetaling via EXTRA. Meld je gratis aan.",
    prerender: true,
    priority: "0.95",
    changefreq: "weekly",
  },
  {
    path: "/dagbetaling",
    title: "Dagbetaling | Vandaag werken, morgen betaald",
    description:
      "Dagelijks uitbetaald werk via EXTRA: na je shift staat je salaris de volgende ochtend op je rekening. Gewoon in loondienst, zonder extra kosten. Meld je aan.",
    prerender: true,
    priority: "0.9",
    changefreq: "monthly",
  },
  {
    path: "/werken-in-de-horeca",
    title: "Werken in de horeca | Leeftijd, loon & starten",
    description:
      "Alles over werken in de horeca: vanaf welke leeftijd het mag, wat je verdient en hoe je zonder ervaring start. Begin via EXTRA in Amsterdam. Meld je aan.",
    prerender: true,
    priority: "0.85",
    changefreq: "monthly",
  },

  // ── OVER EXTRA (NL) ────────────────────────────────────────────────
  {
    path: "/over-extra",
    title: "Over EXTRA | Hospitality staffing Amsterdam",
    description:
      "EXTRA is een jong hospitality staffing bureau in Amsterdam. Wij matchen de beste horeca-, housekeeping- en front-office-talenten met topwerkgevers.",
    prerender: true,
    priority: "0.8",
    changefreq: "monthly",
  },
  {
    path: "/ons-team",
    title: "Ons team | De mensen achter EXTRA",
    description:
      "Maak kennis met het team achter EXTRA. Wij zorgen er elke dag voor dat de beste horecamedewerkers matchen met de mooiste opdrachtgevers in Amsterdam.",
    prerender: true,
    priority: "0.7",
    changefreq: "monthly",
  },
  // /over-extra/ons-team had hier eerder een entry met canonical: "/ons-team"
  // — sinds P14 is dat pad een echte server-side 301 (server/redirects.ts),
  // dus nooit meer met een 200 geserveerd. Zie de toelichting bij /nieuws
  // verderop voor waarom zo'n entry dan verwijderd wordt in plaats van blijven
  // staan.
  {
    path: "/onze-werkwijze",
    title: "Onze werkwijze | Zo werkt EXTRA voor jou",
    description:
      "Ontdek hoe EXTRA werkt, van eerste contact tot vaste poule. Duidelijke stappen voor werkgevers en medewerkers. Snel, menselijk en resultaatgericht.",
    prerender: true,
    priority: "0.8",
    changefreq: "monthly",
  },
  // /hoe-extra-werkt had hier eerder een entry met canonical: "/onze-werkwijze"
  // — sinds P14 een echte server-side 301, zelfde reden als hierboven.
  {
    path: "/extraatje",
    title: "EXTRAATJE | Het beloningssysteem van EXTRA",
    description:
      "EXTRAATJE is het puntensysteem van EXTRA: verdien automatisch punten voor elke shift, challenge en prestatie en wissel ze in voor beloningen.",
    prerender: true,
    priority: "0.8",
    changefreq: "monthly",
  },
  // /beloningssysteem had hier eerder een entry met canonical: "/extraatje"
  // — sinds P14 een echte server-side 301, zelfde reden als hierboven.
  {
    path: "/contact",
    title: "Contact | EXTRA horeca uitzendbureau Amsterdam",
    description:
      "Neem contact op met EXTRA in Amsterdam: bel, mail of loop binnen op de Herengracht. Voor personeelsaanvragen reageren we binnen één werkdag.",
    prerender: true,
    priority: "0.8",
    changefreq: "monthly",
  },
  {
    path: "/privacybeleid",
    title: "Privacybeleid | EXTRA",
    description:
      "Lees hoe EXTRA omgaat met jouw persoonsgegevens: welke gegevens we verwerken, waarom, hoe lang we ze bewaren en welke rechten je hebt als betrokkene.",
    prerender: true,
    priority: "0.3",
    changefreq: "yearly",
  },
  // P15: /voorwaarden, /cookiebeleid en /nen-4400-1-certificering bestonden
  // nog niet, terwijl er intern al naar gelinkt werd (footer, WerkwijzePage) —
  // dat gaf 404's voor bezoekers en crawlers. Nu echte pagina's.
  {
    path: "/voorwaarden",
    title: "Algemene voorwaarden | EXTRA",
    description:
      "Lees de algemene voorwaarden van EXTRA: onze dienstverlening, tarieven en facturatie, annulering, aansprakelijkheid en het toepasselijk recht.",
    prerender: true,
    priority: "0.3",
    changefreq: "yearly",
  },
  {
    path: "/cookiebeleid",
    title: "Cookiebeleid | EXTRA",
    description:
      "Lees welke cookies doehetextra.nl gebruikt, waarom we ze gebruiken en hoe je cookies zelf kunt beheren of uitschakelen via je browserinstellingen.",
    prerender: true,
    priority: "0.3",
    changefreq: "yearly",
  },
  {
    path: "/nen-4400-1-certificering",
    title: "NEN 4400-1 certificering | EXTRA",
    description:
      "EXTRA is geregistreerd volgens de NEN 4400-1-norm. Lees wat die norm inhoudt en wat dat betekent voor opdrachtgevers en medewerkers van EXTRA.",
    prerender: true,
    priority: "0.4",
    changefreq: "yearly",
  },
  {
    path: "/blog",
    title: "Blog & nieuws | Horeca en werken via EXTRA",
    description:
      "Nieuws en artikelen van EXTRA over werken in de horeca, personeel inhuren, dagbetaling en de Amsterdamse hospitality. Lees de laatste updates.",
    prerender: true,
    priority: "0.9",
    changefreq: "daily",
  },
  // /nieuws had hier eerder een entry met canonical: "/blog" — sinds P14 is
  // /nieuws een echte server-side 301 naar /blog (server/redirects.ts,
  // REDIRECT_PATTERNS), dus deze route wordt nooit meer met een 200 vanuit
  // server/seo.ts geserveerd. Een ROUTE_META-entry die nooit meer gerenderd
  // wordt is geen metadata meer, dus weg — de canonical stond hier alleen om
  // hetzelfde probleem op te lossen dat de 301 nu structureel afdekt.

  // ── ENGELS ─────────────────────────────────────────────────────────
  {
    path: "/en",
    title: "Hospitality staffing agency Amsterdam | EXTRA",
    description:
      "EXTRA supplies flexible hospitality staff for hotels, restaurants, caterers and events in Amsterdam. Everyone on payroll, same-day pay possible.",
    prerender: true,
    lang: "en",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/en/hospitality-staff-amsterdam",
    title: "Hospitality staff Amsterdam | Flexible via EXTRA",
    description:
      "Need hospitality staff in Amsterdam? EXTRA supplies flexible staff for hotels, restaurants, caterers and events. Vetted and immediately deployable.",
    prerender: true,
    lang: "en",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/en/hotel-staffing-amsterdam",
    title: "Hotel staff Amsterdam | Housekeeping & F&B | EXTRA",
    description:
      "Need hotel staff? EXTRA supplies experienced staff for housekeeping, front office, banqueting and F&B who understand hotel standards. Request now.",
    prerender: true,
    lang: "en",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/en/event-staff-amsterdam",
    title: "Event staff Amsterdam | Experienced teams | EXTRA",
    description:
      "Need event staff in Amsterdam? EXTRA supplies experienced hospitality teams for conferences, galas, festivals and corporate events. Request today.",
    prerender: true,
    lang: "en",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/en/catering-staff-amsterdam",
    title: "Catering staff Amsterdam | Fast & reliable | EXTRA",
    description:
      "Need catering staff in Amsterdam? EXTRA supplies experienced service staff, runners, bar staff and kitchen support for caterers and large events.",
    prerender: true,
    lang: "en",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/en/restaurant-staff-amsterdam",
    title: "Restaurant staff Amsterdam | On payroll | EXTRA",
    description:
      "Need restaurant staff in Amsterdam? EXTRA supplies experienced waitstaff, bartenders, runners and kitchen support. Handpicked and delivered fast.",
    prerender: true,
    lang: "en",
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    path: "/en/about",
    title: "About EXTRA | Hospitality staffing Amsterdam",
    description:
      "EXTRA is a young hospitality staffing agency in Amsterdam matching top hospitality, housekeeping and front-office talent with leading employers.",
    prerender: true,
    lang: "en",
    priority: "0.6",
    changefreq: "monthly",
  },
  {
    path: "/en/our-team",
    title: "Our team | The people behind EXTRA",
    description:
      "Meet the team behind EXTRA. Every day we match the best hospitality professionals with Amsterdam's finest hotels, restaurants and event venues.",
    prerender: true,
    lang: "en",
    priority: "0.5",
    changefreq: "monthly",
  },
  {
    path: "/en/contact",
    title: "Contact EXTRA | Hospitality staffing Amsterdam",
    description:
      "Get in touch with EXTRA in Amsterdam: call, email or visit us at Herengracht 372. For staffing requests we respond within one business day.",
    prerender: true,
    lang: "en",
    priority: "0.6",
    changefreq: "monthly",
  },
  {
    path: "/en/client-stories",
    title: "Client stories | How clients work with EXTRA",
    description:
      "Read how hotels, restaurants and event venues in Amsterdam work with EXTRA: from single shifts to dedicated staffing pools. See the client stories.",
    prerender: true,
    lang: "en",
    priority: "0.5",
    changefreq: "monthly",
  },
  {
    path: "/en/how-we-work",
    title: "How we work | Hospitality staffing by EXTRA",
    description:
      "From request to match: this is how EXTRA works for employers and staff in Amsterdam hospitality. See the steps and start with flexible staff today.",
    prerender: true,
    lang: "en",
    priority: "0.6",
    changefreq: "monthly",
  },
  {
    path: "/en/rewards",
    title: "EXTRAATJE rewards | Points & benefits | EXTRA",
    description:
      "EXTRAATJE is EXTRA's unique points system: employees automatically earn points for every shift, challenge and micro-achievement. See how it works.",
    prerender: true,
    lang: "en",
    priority: "0.5",
    changefreq: "monthly",
  },
  {
    path: "/en/hospitality-jobs",
    title: "Hospitality jobs Amsterdam | Flexible via EXTRA",
    description:
      "Looking for hospitality jobs in Amsterdam? Work flexible shifts at top hotels, restaurants and events with same-day pay via EXTRA. Sign up today.",
    prerender: true,
    lang: "en",
    priority: "0.7",
    changefreq: "weekly",
  },
  {
    path: "/en/hospitality-work",
    title: "Hospitality work Amsterdam | Flexible shifts",
    description:
      "Looking for hospitality work in Amsterdam? Work when you want at hotels, restaurants and events. Flexible shifts with same-day pay via EXTRA.",
    prerender: true,
    lang: "en",
    priority: "0.7",
    changefreq: "weekly",
  },
  {
    path: "/en/housekeeping-jobs",
    title: "Housekeeping jobs Amsterdam | Top hotels | EXTRA",
    description:
      "Looking for housekeeping work in Amsterdam? Work as a room attendant at top hotels with flexible shifts and fast pay via EXTRA. Apply today.",
    prerender: true,
    lang: "en",
    priority: "0.7",
    changefreq: "weekly",
  },
  {
    path: "/en/chef-jobs",
    title: "Chef jobs Amsterdam | Kitchen work via EXTRA",
    description:
      "Looking for chef or kitchen work in Amsterdam? Work in hotels, restaurants and events via EXTRA with flexible shifts and same-day pay. Apply now.",
    prerender: true,
    lang: "en",
    priority: "0.6",
    changefreq: "weekly",
  },
  {
    path: "/en/front-office-jobs",
    title: "Front office jobs Amsterdam | Hotels | EXTRA",
    description:
      "Looking for front office vacancies or receptionist work in Amsterdam? Via EXTRA you work in top hotels with flexible shifts and same-day pay.",
    prerender: true,
    lang: "en",
    priority: "0.6",
    changefreq: "weekly",
  },

  // ── INTERN / NIET INDEXEREN ────────────────────────────────────────
  { path: "/brochure", title: "Brochure | EXTRA", description: "Interne brochurepagina van EXTRA.", noindex: true },
  { path: "/brochures", title: "Brochure (EN) | EXTRA", description: "Internal brochure page of EXTRA.", noindex: true, lang: "en" },
  { path: "/events", title: "Brochure events | EXTRA", description: "Interne eventbrochure van EXTRA.", noindex: true },
  { path: "/lofi", title: "Brochure lofi | EXTRA", description: "Interne conceptpagina van EXTRA.", noindex: true },
  { path: "/dashboard", title: "Dashboard | EXTRA", description: "Interne omgeving van EXTRA.", noindex: true },
  { path: "/profile", title: "Profiel | EXTRA", description: "Interne omgeving van EXTRA.", noindex: true },
  { path: "/rewards", title: "Rewards | EXTRA", description: "Interne omgeving van EXTRA.", noindex: true },
  { path: "/history", title: "Historie | EXTRA", description: "Interne omgeving van EXTRA.", noindex: true },
  { path: "/leaderboard", title: "Leaderboard | EXTRA", description: "Interne omgeving van EXTRA.", noindex: true },
  { path: "/extraatje-dashboard", title: "EXTRAATJE dashboard | EXTRA", description: "Interne omgeving van EXTRA.", noindex: true },
  { path: "/extraatje-admin", title: "EXTRAATJE admin | EXTRA", description: "Interne omgeving van EXTRA.", noindex: true },
  { path: "/dashboard-mockup", title: "Admin dashboard | EXTRA", description: "Interne omgeving van EXTRA.", noindex: true },
];

/** Snelle lookup op genormaliseerd (lowercase, zonder trailing slash) pad. */
export const ROUTE_META_BY_PATH: Record<string, RouteMeta> = Object.fromEntries(
  ROUTE_META.map((m) => [normalizeMetaPath(m.path), m])
);

export function normalizeMetaPath(p: string): string {
  const lower = p.toLowerCase();
  return lower !== "/" && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

/**
 * Dynamische routepatronen die server-side een DB-lookup krijgen.
 *
 * /nieuws/:slug stond hier vroeger ook (canonicalBase "/blog"), maar sinds
 * P14 vangt server/redirects.ts (REDIRECT_PATTERNS) elke /nieuws/:slug al af
 * met een 301 vóórdat het verzoek hier komt — dus dat patroon werd nooit meer
 * gematcht en is verwijderd in plaats van als dode code te blijven staan.
 */
export const DYNAMIC_ROUTE_PATTERNS = [
  { pattern: /^\/blog\/([^/]+)$/, type: "blog" as const, canonicalBase: "/blog" },
  { pattern: /^\/vacatures\/([^/]+)$/, type: "vacature" as const, canonicalBase: "/vacatures" },
];

/**
 * CENTRALE HREFLANG-KOPPELING (P13, 2 paren gecorrigeerd tijdens P14)
 *
 * Eén bron van waarheid voor welke NL-pagina bij welke EN-pagina hoort.
 * server/seo.ts leidt hier bij elke request de hreflang-alternates + x-default
 * uit af (zie hreflangTags() aldaar) — nooit per pagina los gezet, zodat beide
 * kanten per definitie synchroon blijven. Vóór P13 declareerde alleen de
 * EN-kant (client-side, per pagina hardcoded) hreflang-alternates; de NL-kant
 * verwees nergens naar terug ("Incomplete_group") en x-default ontbrak overal.
 *
 * Elke entry hier moet naar bestaande, self-canonical routes in ROUTE_META
 * wijzen (geen pad dat zelf een afwijkende `canonical` heeft — zie
 * hreflangTags(), die dat ook afdwingt). Waar een EN-pagina geen 1-op-1 NL-pad
 * met identieke naam heeft, is het inhoudelijk best passende NL-landingspagina
 * gekozen (bijv. /en/rewards ↔ /extraatje, /en/how-we-work ↔ /onze-werkwijze —
 * de twee NL-duplicaten /beloningssysteem en /hoe-extra-werkt canonicaliseren
 * zelf al naar die pagina's, dus hun hreflang-partner is dezelfde).
 *
 * P14-correctie: bij het bijwerken van de taalwisselaar (client/src/components/
 * PublicNav.tsx, LANG_MAP) bleek die tabel op 5 punten van deze mapping af te
 * wijken. Bij woord-voor-woord vergelijking van title/description bleken 2
 * daarvan hier fout gekoppeld te zijn (op "Amsterdam in de titel" i.p.v. de
 * werkelijke tekstinhoud):
 *  - /en/hospitality-staff-amsterdam ↔ /horeca-personeel-gezocht (niet
 *    /horeca-personeel-amsterdam — de EN-description noemt letterlijk
 *    "hotels, restaurants, caterers and events", identiek aan de lijst in
 *    /horeca-personeel-gezocht; /horeca-personeel-amsterdam noemt een heel
 *    andere lijst, "bediening, keuken en housekeeping").
 *  - /en/hospitality-work ↔ /horeca-werk (niet /horeca-werk-amsterdam — de
 *    EN-description "Work when you want at hotels, restaurants and events"
 *    is een letterlijke vertaling van /horeca-werk's "Werk wanneer jij wilt
 *    bij hotels, restaurants en events"; /horeca-werk-amsterdam gebruikt een
 *    andere formulering, "Kies je eigen shifts").
 * De overige 3 afwijkingen zaten in LANG_MAP zelf (die tabel is daar
 * gecorrigeerd, deze mapping bleek al juist), plus /beloningssysteem dat door
 * P14 sowieso naar /extraatje canonicaliseert.
 *
 * Alleen routes die hier voorkomen krijgen hreflang-tags; NL-only landingspaginas
 * zonder Engelse vertaling (bijv. /horeca-personeel) krijgen er terecht geen —
 * daar is niets om naar te verwijzen.
 */
export const HREFLANG_GROUPS: { nl: string; en: string }[] = [
  { nl: "/", en: "/en" },
  { nl: "/horeca-personeel-gezocht", en: "/en/hospitality-staff-amsterdam" },
  { nl: "/hotelpersoneel-inhuren", en: "/en/hotel-staffing-amsterdam" },
  { nl: "/eventpersoneel-inhuren", en: "/en/event-staff-amsterdam" },
  { nl: "/cateringpersoneel-inhuren", en: "/en/catering-staff-amsterdam" },
  { nl: "/horecapersoneel-restaurants", en: "/en/restaurant-staff-amsterdam" },
  { nl: "/over-extra", en: "/en/about" },
  { nl: "/ons-team", en: "/en/our-team" },
  { nl: "/contact", en: "/en/contact" },
  { nl: "/klantcases-horeca", en: "/en/client-stories" },
  { nl: "/onze-werkwijze", en: "/en/how-we-work" },
  { nl: "/extraatje", en: "/en/rewards" },
  { nl: "/horeca-vacatures-amsterdam", en: "/en/hospitality-jobs" },
  { nl: "/horeca-werk", en: "/en/hospitality-work" },
  { nl: "/housekeeping-werk", en: "/en/housekeeping-jobs" },
  { nl: "/chef-vacatures-amsterdam", en: "/en/chef-jobs" },
  { nl: "/front-office-vacatures-amsterdam", en: "/en/front-office-jobs" },
];

/** Snelle lookup: genormaliseerd pad → de andere taalversie. Uit HREFLANG_GROUPS afgeleid, niet los onderhouden. */
export const HREFLANG_PARTNER: Record<string, { path: string; lang: "nl" | "en" }> = Object.fromEntries(
  HREFLANG_GROUPS.flatMap(({ nl, en }) => [
    [normalizeMetaPath(nl), { path: en, lang: "en" as const }],
    [normalizeMetaPath(en), { path: nl, lang: "nl" as const }],
  ])
);
