/**
 * SEO-LANDINGSPAGINA'S (P10 uit de SEO-audit, juli 2026)
 *
 * Eén herbruikbaar, prerender-vriendelijk template + de content-configs voor de
 * zeven nieuwe landingspagina's (4 voor inleners, 3 voor uitzendkrachten).
 * Elke pagina: unieke content (500+ woorden), H1 met primair keyword, FAQ-sectie
 * met FAQPage-schema, CTA's voor beide doelgroepen en interne links.
 * Meta (title/description/canonical) komt uit shared/routeMeta.ts.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Check, ArrowRight, ChevronDown } from "lucide-react";

interface Faq { q: string; a: string }
interface Sectie { titel: string; tekst: string[] }
interface LandingConfig {
  id: string;
  badge: string;
  h1: string;
  h1Accent?: string;
  subtitel: string;
  intro: string[];
  usps: { titel: string; tekst: string }[];
  secties: Sectie[];
  faqs: Faq[];
  ctaTitel: string;
  ctaTekst: string;
  primaireCta: { label: string; href: string };
  secundaireCta: { label: string; href: string };
  gerelateerd: { label: string; href: string }[];
  serviceSchema?: { naam: string; beschrijving: string };
}

function useLandingSchemas(cfg: LandingConfig) {
  useEffect(() => {
    const addSchema = (id: string, data: object) => {
      document.getElementById(id)?.remove();
      const s = document.createElement("script");
      s.id = id; s.type = "application/ld+json"; s.text = JSON.stringify(data);
      document.head.appendChild(s);
    };
    addSchema(`faq-${cfg.id}`, {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": cfg.faqs.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    });
    if (cfg.serviceSchema) {
      addSchema(`service-${cfg.id}`, {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": cfg.serviceSchema.naam,
        "description": cfg.serviceSchema.beschrijving,
        "serviceType": cfg.serviceSchema.naam,
        "provider": { "@id": "https://www.doehetextra.nl/#organization" },
        "areaServed": { "@type": "City", "name": "Amsterdam" },
      });
    }
    return () => {
      document.getElementById(`faq-${cfg.id}`)?.remove();
      document.getElementById(`service-${cfg.id}`)?.remove();
    };
  }, [cfg]);
}

function SeoLanding({ cfg }: { cfg: LandingConfig }) {
  useLandingSchemas(cfg);
  useEffect(() => { window.scrollTo(0, 0); }, [cfg.id]);

  return (
    <div className="min-h-screen bg-white font-sans">
      <PublicNav forceDark={false} />
      {/* Hero */}
      <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24 overflow-hidden bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 text-purple-100 text-xs sm:text-sm font-semibold">
            {cfg.badge}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {cfg.h1}{cfg.h1Accent && <>{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-200">{cfg.h1Accent}</span></>}
          </h1>
          <p className="text-base sm:text-lg text-purple-100/85 leading-relaxed max-w-2xl mb-9">{cfg.subtitel}</p>
          <div className="flex flex-wrap gap-4">
            <Link href={cfg.primaireCta.href} className="inline-flex items-center gap-2 bg-white text-purple-950 font-bold px-7 py-3.5 rounded-full hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-0.5">
              {cfg.primaireCta.label} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href={cfg.secundaireCta.href} className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-white/10 transition-colors">
              {cfg.secundaireCta.label}
            </Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 space-y-5">
          {cfg.intro.map((p, i) => (
            <p key={i} className="text-gray-700 leading-relaxed text-base sm:text-lg">{p}</p>
          ))}
        </div>
      </section>

      {/* USP's */}
      <section className="pb-14 sm:pb-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cfg.usps.map((u) => (
            <div key={u.titel} className="rounded-2xl border border-purple-100 bg-purple-50/50 p-6">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center mb-4"><Check className="w-5 h-5 text-white" /></div>
              <h3 className="font-bold text-gray-900 mb-1.5">{u.titel}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{u.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contentsecties */}
      {cfg.secties.map((s) => (
        <section key={s.titel} className="pb-14 sm:pb-16">
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>{s.titel}</h2>
            <div className="space-y-4">
              {s.tekst.map((p, i) => <p key={i} className="text-gray-700 leading-relaxed">{p}</p>)}
            </div>
          </div>
        </section>
      ))}

      {/* FAQ */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Veelgestelde vragen</h2>
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {cfg.faqs.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-gray-900">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-purple-600 transition-transform group-open:rotate-180 shrink-0 ml-4" />
                </summary>
                <p className="mt-3 text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Gerelateerde pagina's */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Lees ook</h2>
          <ul className="flex flex-wrap gap-3">
            {cfg.gerelateerd.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-block text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-4 py-2 hover:bg-purple-100 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA-banner */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 px-8 py-12 sm:px-14 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>{cfg.ctaTitel}</h2>
            <p className="text-purple-100/85 max-w-xl mx-auto mb-8">{cfg.ctaTekst}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href={cfg.primaireCta.href} className="inline-flex items-center gap-2 bg-white text-purple-950 font-bold px-7 py-3.5 rounded-full hover:shadow-2xl transition-all hover:-translate-y-0.5">
                {cfg.primaireCta.label} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href={cfg.secundaireCta.href} className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-white/10 transition-colors">
                {cfg.secundaireCta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}

/* ═════════════════ CONTENT-CONFIGS ═════════════════ */

const WERKGEVER_CTA = { label: "Vraag personeel aan", href: "/personeelsaanvraag" };
const KANDIDAAT_CTA = { label: "Meld je aan", href: "/aanmelden" };

const CONFIGS: Record<string, LandingConfig> = {
  "horeca-personeel-inhuren": {
    id: "horeca-personeel-inhuren",
    badge: "Voor hotels, restaurants, cateraars en eventlocaties",
    h1: "Horeca personeel inhuren",
    h1Accent: "zonder gedoe",
    subtitel: "Vandaag aangevraagd, vaak binnen 48 uur ingepland. EXTRA levert gescreend horecapersoneel in Amsterdam — iedereen in loondienst, dus jij loopt geen risico op schijnzelfstandigheid.",
    intro: [
      "Horeca personeel inhuren via een uitzendbureau is de snelste manier om je bezetting rond te krijgen zonder zelf te werven, te selecteren en te verlonen. Bij EXTRA vraag je personeel aan voor één shift, een druk weekend of een heel seizoen. Wij matchen uit onze vaste poule van ervaren horecamedewerkers in Amsterdam: bediening, runners, bartenders, chefs, spoelkeuken en housekeeping.",
      "Het verschil met platforms en zzp-bemiddelaars: al onze medewerkers zijn bij ons in loondienst. Dat betekent geen discussies over de Wet DBA, geen facturen van tientallen losse zzp'ers en geen no-show zonder aanspreekpunt. Eén contactpersoon, één tarief, één factuur — en medewerkers die vaker bij dezelfde opdrachtgevers werken, zodat ze jouw locatie leren kennen.",
    ],
    usps: [
      { titel: "Snel geregeld", tekst: "Aanvraag vóór 12:00 betekent vaak dezelfde week nog ingepland — bij spoed regelmatig binnen 48 uur." },
      { titel: "Iedereen in loondienst", tekst: "Geen zzp-constructies of Wet DBA-risico. EXTRA is werkgever en regelt verloning, verzekering en administratie." },
      { titel: "Gescreende medewerkers", tekst: "Elke medewerker doorloopt een intake en meeloopshift voordat die bij jou op de vloer staat." },
      { titel: "Flexibel op- en afschalen", tekst: "Van één runner op vrijdagavond tot een compleet team voor het hoogseizoen." },
    ],
    secties: [
      {
        titel: "Wat kost horeca personeel inhuren?",
        tekst: [
          "Je betaalt bij EXTRA een all-in uurtarief per gewerkt uur. Daarin zitten loon, vakantiegeld, sociale premies, verzekeringen en onze marge — er komen dus geen verrassingen achteraf bij. Het tarief hangt af van de functie (een chef heeft een ander tarief dan een runner), de ervaring die je vraagt en de duur van de samenwerking. Voor structurele samenwerkingen en vaste poules maken we graag een maatwerkafspraak.",
          "Vergelijk je met de kosten van zelf werven: vacatureplaatsingen, gesprekken, inwerktijd en het risico dat iemand na twee weken weer vertrekt. Flexibel inhuren is dan vaak niet duurder, maar wél zonder risico — je betaalt alleen de uren die daadwerkelijk gewerkt worden.",
        ],
      },
      {
        titel: "Zo werkt personeel inhuren via EXTRA",
        tekst: [
          "Stap 1: je doet een aanvraag via het formulier of belt ons. Stap 2: wij stellen binnen één werkdag een match voor uit onze poule, afgestemd op jouw locatie, dresscode en tempo. Stap 3: de medewerker staat ingewerkt op de vloer; jij accordeert achteraf de gewerkte uren. Bevalt iemand goed? Dan plannen we diegene vaker bij je in en bouw je een vaste flexpoule op die jouw zaak kent.",
          "We leveren in heel Amsterdam en omgeving: van hotels aan de Zuidas tot restaurants in de Jordaan en eventlocaties in Noord. Bekijk ook onze werkwijze voor het volledige stappenplan.",
        ],
      },
    ],
    faqs: [
      { q: "Hoe snel kan ik horeca personeel inhuren?", a: "Bij spoed kunnen we regelmatig binnen 48 uur leveren. Hoe eerder je aanvraagt, hoe groter de kans op de perfecte match — maar ook last-minute denken we altijd mee." },
      { q: "Zijn jullie medewerkers in loondienst of zzp?", a: "Iedereen die via EXTRA werkt is bij ons in loondienst. Je loopt dus geen risico op schijnzelfstandigheid of naheffingen onder de Wet DBA, en medewerkers zijn verzekerd via ons." },
      { q: "Voor welke functies kan ik personeel inhuren?", a: "Bediening, runners, bartenders, hosts, chefs en keukenhulpen, spoelkeuken, housekeeping en front office. Voor specialistische functies denken we graag mee over een maatwerkoplossing." },
      { q: "Wat als een medewerker niet bevalt?", a: "Dat lossen we direct op: we plannen een vervanger en de feedback verwerken we in de volgende matches. Je zit nergens aan vast — je betaalt alleen gewerkte uren." },
      { q: "Kan ik een vaste poule opbouwen?", a: "Ja, dat is precies hoe de meeste klanten met ons werken. Medewerkers die goed bevallen plannen we vaker bij je in, zodat je een flexibele schil hebt die jouw zaak door en door kent." },
    ],
    ctaTitel: "Vandaag personeel nodig?",
    ctaTekst: "Doe een aanvraag en wij nemen binnen één werkdag contact op met een passende match uit onze poule.",
    primaireCta: WERKGEVER_CTA,
    secundaireCta: { label: "Bekijk onze werkwijze", href: "/horeca-uitzendbureau-amsterdam-werkwijze" },
    gerelateerd: [
      { label: "Horeca uitzendbureau Amsterdam", href: "/horeca-uitzendbureau-amsterdam" },
      { label: "Bediening inhuren", href: "/bediening-inhuren" },
      { label: "Tijdelijk horeca personeel", href: "/tijdelijk-horeca-personeel" },
      { label: "Hotelpersoneel inhuren", href: "/hotelpersoneel-inhuren" },
    ],
    serviceSchema: { naam: "Horeca personeel inhuren", beschrijving: "Flexibel horecapersoneel inhuren in Amsterdam via EXTRA: gescreende medewerkers in loondienst, snel geleverd." },
  },

  "bediening-inhuren": {
    id: "bediening-inhuren",
    badge: "Bediening · runners · hosts · bartenders",
    h1: "Bediening inhuren",
    h1Accent: "die je gasten onthouden",
    subtitel: "Representatieve bediening voor restaurants, hotels en events in Amsterdam. Ingewerkt, gastgericht en gewend aan tempo — via EXTRA, iedereen in loondienst.",
    intro: [
      "Goede bediening maakt of breekt de avond van je gasten. Wie bediening wil inhuren, zoekt daarom meer dan 'een paar handen': je zoekt mensen die een bord kunnen dragen én een tafel kunnen lezen. Bij EXTRA screenen we elke bedieningsmedewerker persoonlijk op ervaring, presentatie en werkhouding voordat die bij jou op de vloer staat.",
      "Onze poule bestaat uit ervaren horecatalenten — veel studenten en young professionals uit Amsterdam — die bewust kiezen voor flexibel werk. Via ons beloningssysteem EXTRAATJE worden ze beloond voor betrouwbaarheid en goede reviews van opdrachtgevers, dus gemotiveerd op de vloer verschijnen loont letterlijk.",
    ],
    usps: [
      { titel: "Gastgericht", tekst: "Geselecteerd op presentatie en hospitality-instinct, niet alleen op cv." },
      { titel: "Per shift inzetbaar", tekst: "Eén vrijdagavond, een festivalweekend of het hele terrasseizoen." },
      { titel: "Kent de standaard", tekst: "Ervaring in hotels, fine dining en high-volume events in Amsterdam." },
      { titel: "Eén aanspreekpunt", tekst: "Geen losse zzp'ers maar één planning, één factuur en één contactpersoon." },
    ],
    secties: [
      {
        titel: "Welke bediening kun je inhuren?",
        tekst: [
          "Van zelfstandig werkende bediening met wijnkennis tot runners die het tempo van een uitgeserveerd diner voor 300 gasten aankunnen: we matchen op het niveau dat jouw zaak vraagt. Ook bartenders, hosts en hostesses en banqueting-medewerkers voor hotels lever je via dezelfde aanvraag. Geef bij je aanvraag door welk serviceniveau je verwacht en of er specifieke eisen zijn (dresscode, talen, ervaring met fine dining), dan selecteren wij daarop.",
          "Voor terugkerende shifts bouwen we een vaste poule op: dezelfde gezichten die jouw kaart, looproutes en huisstijl kennen. Zo voelt flexibel personeel voor je gasten als vast personeel.",
        ],
      },
      {
        titel: "Bediening voor events en catering",
        tekst: [
          "Piekt je bezetting rond events, congressen of partijen? Voor grote producties leveren we complete bedieningsteams inclusief een ervaren aanspreekpunt op de vloer. Bekijk ook eventpersoneel inhuren en evenementen personeel inhuren voor de complete event-bezetting van bar tot garderobe.",
        ],
      },
    ],
    faqs: [
      { q: "Wat kost het om bediening in te huren?", a: "Je betaalt een all-in uurtarief dat afhangt van ervaring en functie. Daarin zitten loon, premies en verzekeringen — geen verborgen kosten. Vraag een offerte aan voor jouw situatie." },
      { q: "Kan ik dezelfde bediening vaker terugvragen?", a: "Ja. Medewerkers die goed bevallen plannen we met voorrang bij je in. Zo bouw je een vaste flexpoule op die jouw zaak kent." },
      { q: "Hebben jullie bediening met wijn- of cocktailkennis?", a: "Ja, geef het aan bij je aanvraag. We matchen op serviceniveau: van runners tot zelfstandige bediening met wijnkennis en ervaren bartenders." },
      { q: "Leveren jullie ook voor één enkele avond?", a: "Zeker — één shift is genoeg. Veel klanten starten met een losse avond en schalen daarna op naar een vaste samenwerking." },
    ],
    ctaTitel: "Bediening nodig voor je volgende shift?",
    ctaTekst: "Vraag vandaag aan en sta deze week nog met versterking op de vloer.",
    primaireCta: WERKGEVER_CTA,
    secundaireCta: { label: "Restaurantpersoneel bekijken", href: "/horecapersoneel-restaurants" },
    gerelateerd: [
      { label: "Horeca personeel inhuren", href: "/horeca-personeel-inhuren" },
      { label: "Restaurantpersoneel", href: "/horecapersoneel-restaurants" },
      { label: "Eventpersoneel inhuren", href: "/eventpersoneel-inhuren" },
      { label: "Klantcases", href: "/klantcases-horeca" },
    ],
    serviceSchema: { naam: "Bediening inhuren", beschrijving: "Representatieve bediening, runners en bartenders inhuren in Amsterdam via EXTRA — gescreend en in loondienst." },
  },

  "evenementen-personeel-inhuren": {
    id: "evenementen-personeel-inhuren",
    badge: "Events · congressen · festivals · partijen",
    h1: "Evenementen personeel inhuren",
    h1Accent: "van 5 tot 100+ mensen",
    subtitel: "Complete teams voor events in en rond Amsterdam: bediening, bar, catering, hosts en logistiek. Eén aanvraag, één aanspreekpunt, en een team dat gewend is aan tempo.",
    intro: [
      "Een evenement heeft geen tweede kans: de bezetting moet in één keer kloppen. Wie evenementen personeel wil inhuren heeft daarom een partner nodig die snel kan opschalen zonder in te leveren op kwaliteit. EXTRA levert eventteams van vijf tot ruim honderd medewerkers — voor congressen, bedrijfsfeesten, galadiners, festivals en productlanceringen.",
      "We leveren de complete bezetting: bediening en runners, bartenders, cateringpersoneel, hosts en hostesses voor ontvangst en garderobe, en logistieke krachten voor op- en afbouw. Bij grotere producties zetten we een ervaren teamcaptain in als jouw aanspreekpunt op de vloer, zodat jij je op je gasten kunt richten.",
    ],
    usps: [
      { titel: "Schaalbaar", tekst: "Van een borrel voor 50 gasten tot een festivalweekend met honderd man bezetting." },
      { titel: "Gewend aan tempo", tekst: "Onze eventmedewerkers kennen de piekmomenten: uitserveren, wisselen, doorpakken." },
      { titel: "Teamcaptains", tekst: "Bij grote producties krijg je een ervaren aanspreekpunt op de vloer." },
      { titel: "Ook last-minute", tekst: "Uitval of extra drukte? We schakelen snel bij — ook in het weekend." },
    ],
    secties: [
      {
        titel: "Cateringpersoneel voor events",
        tekst: [
          "Cateraars werken met krappe marges en strakke draaiboeken. Ons cateringpersoneel is gewend aan werken op locatie: mise-en-place in een tijdelijke keuken, uitgeserveerde diners met militaire precisie en buffetten die er na twee uur nog strak bijliggen. We leveren keukenhulpen, uitgeefkrachten en bediening die het draaiboek van jouw partij volgen. Kijk voor de vaste catering-bezetting ook op cateringpersoneel inhuren.",
        ],
      },
      {
        titel: "Zo plan je de bezetting van je event",
        tekst: [
          "Deel bij je aanvraag het draaiboek: aantal gasten, type service (walking dinner, buffet, uitgeserveerd), tijden en locatie. Wij adviseren over de juiste bezetting per onderdeel — hoeveel bediening per gast, hoeveel bar-krachten per tap — en plannen het team inclusief reserve. Na afloop accordeer je de gewerkte uren en ontvang je één factuur. Voor terugkerende events houden we je vaste team beschikbaar.",
        ],
      },
    ],
    faqs: [
      { q: "Hoeveel bediening heb ik nodig per gast?", a: "Vuistregel: bij een uitgeserveerd diner ongeveer één bediening per 10 tot 12 gasten, bij een borrel of buffet één per 25 tot 30. We adviseren graag op basis van jouw draaiboek." },
      { q: "Kunnen jullie ook last-minute opschalen?", a: "Ja. Door onze grote poule kunnen we ook kort van tevoren bijschakelen — handig bij onverwachte uitval of meer aanmeldingen dan verwacht." },
      { q: "Leveren jullie buiten Amsterdam?", a: "Onze basis is Amsterdam, maar voor events werken we in de hele regio en daarbuiten. Bespreek de locatie bij je aanvraag, dan kijken we wat mogelijk is." },
      { q: "Is er één aanspreekpunt tijdens het event?", a: "Bij grotere producties zetten we een teamcaptain in die de briefing kent, het team aanstuurt en schakelt met jouw eventmanager." },
      { q: "Zijn jullie eventmedewerkers verzekerd en in loondienst?", a: "Ja, iedereen werkt in loondienst bij EXTRA en is via ons verzekerd. Jij huurt in zonder werkgeversrisico's." },
    ],
    ctaTitel: "Event op de planning?",
    ctaTekst: "Stuur je draaiboek mee met de aanvraag en ontvang binnen één werkdag een bezettingsvoorstel.",
    primaireCta: WERKGEVER_CTA,
    secundaireCta: { label: "Eventpersoneel bekijken", href: "/eventpersoneel-inhuren" },
    gerelateerd: [
      { label: "Eventpersoneel inhuren", href: "/eventpersoneel-inhuren" },
      { label: "Cateringpersoneel inhuren", href: "/cateringpersoneel-inhuren" },
      { label: "Bediening inhuren", href: "/bediening-inhuren" },
      { label: "Onze werkwijze", href: "/onze-werkwijze" },
    ],
    serviceSchema: { naam: "Evenementen personeel inhuren", beschrijving: "Complete eventteams inhuren in Amsterdam: bediening, bar, catering en hosts via EXTRA — schaalbaar van 5 tot 100+ medewerkers." },
  },

  "tijdelijk-horeca-personeel": {
    id: "tijdelijk-horeca-personeel",
    badge: "Seizoen · piek · vervanging",
    h1: "Tijdelijk horeca personeel",
    h1Accent: "precies wanneer je het nodig hebt",
    subtitel: "Flexibel personeel inhuren voor het seizoen, een piekperiode of onverwachte uitval. Je betaalt alleen gewerkte uren — zonder werkgeversrisico's, via EXTRA.",
    intro: [
      "De horeca is nooit vlak: het terrasseizoen explodeert bij de eerste zonnestralen, december loopt over en in januari is het stil. Tijdelijk personeel inhuren is dé manier om je loonkosten mee te laten bewegen met je omzet. Bij EXTRA schaal je per week — of zelfs per dag — op en af, zonder contracten die doorlopen als het stil is.",
      "Ook bij ziekte, zwangerschapsverlof of een vertrokken kracht die nog niet is opgevolgd, overbrug je met tijdelijke medewerkers de periode zonder dat de kwaliteit inzakt. En anders dan bij losse oproepkrachten regelen wij de werving, screening, verloning en vervanging bij uitval.",
    ],
    usps: [
      { titel: "Betaal per gewerkt uur", tekst: "Geen vaste contracten of doorlopende kosten in stille weken." },
      { titel: "Seizoensproof", tekst: "Op tijd opgeschaald voor terras, december en het eventseizoen." },
      { titel: "Direct vervangen", tekst: "Uitval? Wij regelen vervanging, ook op korte termijn." },
      { titel: "Zonder risico", tekst: "Iedereen in loondienst bij EXTRA — geen Wet DBA-zorgen of naheffingen." },
    ],
    secties: [
      {
        titel: "Flexibel personeel inhuren: zo blijf je wendbaar",
        tekst: [
          "Een gezonde flexibele schil ligt voor de meeste horecazaken rond de 20 tot 30 procent van de totale bezetting. Genoeg om pieken op te vangen en uitval te dekken, zonder dat je afhankelijk wordt van losse krachten. Onze klanten combineren een klein vast team met een vaste flexpoule van EXTRA-medewerkers die het bedrijf kennen — het beste van twee werelden: continuïteit én wendbaarheid.",
          "Werkt een tijdelijke kracht zó goed dat je die vast in dienst wilt nemen? Dat juichen we toe; de voorwaarden daarvoor spreken we transparant met je af. Zo is tijdelijk personeel ook een risicoloze proefperiode voor vaste aanwas.",
        ],
      },
      {
        titel: "Voor welke periodes kun je inhuren?",
        tekst: [
          "Alles is mogelijk: een enkele shift, een paar weken rond de feestdagen, het volledige terrasseizoen of doorlopend elke vrijdag en zaterdag. Voor seizoensplanning geldt: hoe eerder je je verwachte bezetting deelt, hoe beter wij de juiste mensen voor je kunnen reserveren. Veel klanten plannen hun zomer- en decemberbezetting al maanden vooruit — dan staan de beste mensen voor jou klaar in plaats van bij de concurrent.",
        ],
      },
    ],
    faqs: [
      { q: "Wat is het verschil met een oproepkracht in eigen dienst?", a: "Bij EXTRA ligt het werkgeverschap bij ons: wij regelen werving, contracten, verloning, verzuim en vervanging. Jij betaalt alleen de gewerkte uren tegen een all-in tarief." },
      { q: "Hoe lang kan ik tijdelijk personeel inhuren?", a: "Van één shift tot doorlopend, zonder minimumduur. Je schaalt per week op en af, passend bij je omzet en seizoen." },
      { q: "Kan ik een tijdelijke kracht overnemen in vaste dienst?", a: "Ja, dat kan. We hanteren daar transparante afspraken voor — vraag ernaar bij je accountmanager." },
      { q: "Wat gebeurt er bij ziekte van de tijdelijke kracht?", a: "Dan regelen wij vervanging, vaak nog dezelfde dag. Het verzuimrisico ligt volledig bij EXTRA, niet bij jou." },
    ],
    ctaTitel: "Piek of gat in je planning?",
    ctaTekst: "Vertel ons je periode en bezetting — wij doen binnen één werkdag een voorstel.",
    primaireCta: WERKGEVER_CTA,
    secundaireCta: { label: "Flexibel horecapersoneel", href: "/flexibel-horeca-personeel" },
    gerelateerd: [
      { label: "Horeca personeel inhuren", href: "/horeca-personeel-inhuren" },
      { label: "Flexibel horecapersoneel", href: "/flexibel-horeca-personeel" },
      { label: "Horeca personeel Amsterdam", href: "/horeca-personeel-amsterdam" },
      { label: "Onze werkwijze", href: "/onze-werkwijze" },
    ],
    serviceSchema: { naam: "Tijdelijk horeca personeel inhuren", beschrijving: "Tijdelijk en flexibel horecapersoneel inhuren in Amsterdam voor seizoen, piek of vervanging — via EXTRA, betaal per gewerkt uur." },
  },

  "bijbaan-amsterdam": {
    id: "bijbaan-amsterdam",
    badge: "Voor studenten en young professionals",
    h1: "Bijbaan in Amsterdam",
    h1Accent: "die zich aanpast aan jouw week",
    subtitel: "Werk in de leukste hotels, restaurants en events van Amsterdam. Jij kiest je shifts, wij regelen de rest — met dagbetaling als je wilt en gewoon in loondienst.",
    intro: [
      "Een bijbaan in Amsterdam vinden is niet moeilijk — een bijbaan die zich aanpast aan jouw rooster wél. Tentamenweek? Dan werk je even niet. Kroegentocht van je dispuut op donderdag? Dan pak je vrijdag een shift. Via EXTRA kies je zelf wanneer je werkt, per shift, zonder minimum aantal uren.",
      "Je werkt op de mooiste plekken van de stad: vijfsterrenhotels aan de gracht, restaurants in de Jordaan, festivals en events in Noord. Geen saaie vaste plek, maar afwisseling — en overal ervaring die goed staat op je cv. Iedereen werkt gewoon in loondienst: vakantiegeld, verzekerd, en je uren netjes geregistreerd in de app.",
      "Het lekkerste verschil met andere bijbanen: dagbetaling. Werk je vandaag, dan kan je salaris er de volgende ochtend al staan. Geen maand wachten tot je huur eruit kan.",
    ],
    usps: [
      { titel: "Jij bepaalt je rooster", tekst: "Kies per week de shifts die passen — geen minimum, geen verplichtingen." },
      { titel: "Dagbetaling mogelijk", tekst: "Vandaag gewerkt, morgenochtend je geld. Handig aan het eind van de maand." },
      { titel: "Toplocaties", tekst: "Hotels, restaurants en events waar je vrienden jaloers van worden." },
      { titel: "EXTRAATJE-punten", tekst: "Spaar automatisch punten per shift en wissel ze in voor beloningen." },
    ],
    secties: [
      {
        titel: "Wat voor bijbaan past bij jou?",
        tekst: [
          "Geen horeca-ervaring? Geen probleem — voor functies als runner, buffetkracht of garderobe leer je het vak on the job, met een korte inwerkshift vooraf. Heb je al ervaring in de bediening, achter de bar of in de keuken, dan zetten we je in op shifts (en tarieven) die daarbij passen. Ook housekeeping in hotels en front office-shifts behoren tot de opties.",
          "Veel van onze mensen zijn studenten (UvA, VU, HvA) en young professionals die naast hun studie of baan flexibel willen bijverdienen. Gemiddeld werken ze één tot drie shifts per week — maar in een rustige periode mag ook een maand niks. Jouw beschikbaarheid is leidend.",
        ],
      },
      {
        titel: "Zo snel sta je op de vloer",
        tekst: [
          "Aanmelden duurt vijf minuten. Daarna volgt een korte (video)intake, zetten we je profiel klaar en kun je vaak dezelfde week al je eerste shift draaien. Vanaf 17 jaar kun je bij ons aan de slag. Je ziet beschikbare shifts in de app, schrijft je in op wat jou past en bouwt met elke gewerkte shift EXTRAATJE-punten en een sterker profiel op — waarmee je voorrang krijgt op de populairste shifts.",
        ],
      },
    ],
    faqs: [
      { q: "Hoeveel verdien ik met een bijbaan via EXTRA?", a: "Je uurloon hangt af van je leeftijd, ervaring en functie, en is altijd conform cao. Met toeslagen voor avond- en weekendshifts komt daar vaak nog wat bovenop. Bij je intake krijg je een concreet beeld." },
      { q: "Kan ik werken wanneer ik wil?", a: "Ja — jij schrijft je in op de shifts die jou passen. Geen minimum aantal uren, geen verplichte beschikbaarheid. In tentamenweken werk je gewoon even niet." },
      { q: "Vanaf welke leeftijd kan ik aan de slag?", a: "Bij EXTRA kun je vanaf 17 jaar aan de slag. Voor sommige shifts (zoals bardiensten met alcohol) geldt wettelijk een minimumleeftijd van 18 jaar." },
      { q: "Hoe werkt dagbetaling precies?", a: "Als je kiest voor dagbetaling staat je salaris de ochtend na je shift op je rekening. Alles verloopt automatisch en inzichtelijk via de app — lees er meer over op onze dagbetaling-pagina." },
      { q: "Heb ik horeca-ervaring nodig?", a: "Nee. Voor veel functies word je on the job ingewerkt. Ervaring is een plus en vertaalt zich in mooiere shifts en een hoger tarief, maar starten kan zonder." },
    ],
    ctaTitel: "Deze week nog je eerste shift?",
    ctaTekst: "Aanmelden duurt vijf minuten. Daarna kies jij de shifts die bij jouw week passen.",
    primaireCta: KANDIDAAT_CTA,
    secundaireCta: { label: "Bekijk vacatures", href: "/horeca-vacatures-amsterdam" },
    gerelateerd: [
      { label: "Dagbetaling", href: "/dagbetaling" },
      { label: "Werken in de horeca", href: "/werken-in-de-horeca" },
      { label: "Horeca werk Amsterdam", href: "/horeca-werk-amsterdam" },
      { label: "EXTRAATJE beloningen", href: "/extraatje" },
    ],
  },

  "dagbetaling": {
    id: "dagbetaling",
    badge: "Vandaag werken, morgen je geld",
    h1: "Dagbetaling:",
    h1Accent: "vandaag gewerkt, morgen betaald",
    subtitel: "Bij EXTRA hoef je niet tot het eind van de maand te wachten op je salaris. Kies voor dagbetaling en je geld staat de ochtend na je shift op je rekening.",
    intro: [
      "Dagelijks uitbetaald werk is in de horeca nog zeldzaam — bij EXTRA is het standaard een optie. Werk je vanavond een shift in een hotel of op een event, dan kan je salaris er de volgende ochtend al staan. Geen voorschotten aanvragen, geen wachten tot de 25e: gewoon je verdiende geld, direct beschikbaar.",
      "Dat is meer dan een handigheidje. Voor studenten betekent per dag uitbetaald krijgen dat je huur, boodschappen of een onverwachte rekening nooit hoeven te wachten op de betaaldatum. En omdat alles automatisch via de app verloopt, zie je per shift precies wat je gewerkt en verdiend hebt — transparant en zonder gedoe.",
    ],
    usps: [
      { titel: "De ochtend erna", tekst: "Shift vandaag afgerond? Je salaris staat er de volgende ochtend." },
      { titel: "Automatisch geregeld", tekst: "Geen aanvraag per keer nodig: kies één keer voor dagbetaling en het loopt." },
      { titel: "Volledig inzichtelijk", tekst: "Per shift zie je in de app je uren, toeslagen en uitbetaling." },
      { titel: "Gewoon in loondienst", tekst: "Dagbetaling mét vakantiegeld, verzekering en loonstrook. Geen trucs." },
    ],
    secties: [
      {
        titel: "Hoe werkt dagbetaling bij EXTRA?",
        tekst: [
          "Na je shift accordeert de opdrachtgever je gewerkte uren. Daarna wordt je salaris automatisch verwerkt en de volgende ochtend uitbetaald op je rekening. Je hoeft er zelf niets voor te doen — geen declaraties, geen verzoeken. In de app volg je realtime je verdiensten per shift, inclusief avond- en weekendtoeslagen.",
          "Belangrijk om te weten: dagbetaling is een keuze, geen verplichting. Wil je liever per week of per vier weken uitbetaald krijgen, dan kan dat net zo goed. En alles gebeurt binnen een gewone loondienstconstructie: je bouwt vakantiegeld op, bent verzekerd en krijgt een nette loonstrook. Vandaag werken, morgen uitbetaald — zonder concessies.",
        ],
      },
      {
        titel: "Voor wie is dagelijks uitbetaald werk ideaal?",
        tekst: [
          "Voor iedereen die grip wil op zijn geld. Studenten die hun bijbaan afstemmen op collegeweken en niet een maand willen wachten op de eerste betaling. Young professionals die naast hun baan flexibel bijverdienen. En iedereen die net begint via EXTRA: je eerste shift betaalt zich letterlijk de volgende dag uit. Combineer het met zelf je shifts kiezen en je hebt een bijbaan die zich volledig aanpast aan jouw leven — bekijk ook onze bijbaan in Amsterdam-pagina.",
        ],
      },
    ],
    faqs: [
      { q: "Wanneer staat mijn geld op mijn rekening?", a: "Na goedkeuring van je gewerkte uren wordt je salaris automatisch verwerkt en staat het de volgende ochtend op je rekening." },
      { q: "Kost dagbetaling mij iets extra?", a: "Nee. Dagbetaling is een service van EXTRA, geen betaalde optie. Je ontvangt gewoon je volledige salaris conform cao." },
      { q: "Krijg ik ook vakantiegeld en een loonstrook?", a: "Ja. Dagbetaling verandert niets aan je rechten: je bent in loondienst, bouwt vakantiegeld op, bent verzekerd en ontvangt loonstroken zoals het hoort." },
      { q: "Kan ik ook kiezen voor wekelijkse uitbetaling?", a: "Zeker. Dagbetaling is optioneel — je kiest zelf de uitbetaalfrequentie die bij je past en kunt die later aanpassen." },
      { q: "Geldt dagbetaling voor alle shifts?", a: "Ja, dagbetaling geldt voor al het werk dat je via EXTRA doet: hotels, restaurants, events en catering." },
    ],
    ctaTitel: "Morgen je eerste uitbetaling?",
    ctaTekst: "Meld je vandaag aan, draai deze week je eerste shift en zie je salaris de ochtend erna binnenkomen.",
    primaireCta: KANDIDAAT_CTA,
    secundaireCta: { label: "Bijbaan in Amsterdam", href: "/bijbaan-amsterdam" },
    gerelateerd: [
      { label: "Bijbaan Amsterdam", href: "/bijbaan-amsterdam" },
      { label: "Werken in de horeca", href: "/werken-in-de-horeca" },
      { label: "Horeca werk", href: "/horeca-werk" },
      { label: "EXTRAATJE beloningen", href: "/extraatje" },
    ],
  },

  "werken-in-de-horeca": {
    id: "werken-in-de-horeca",
    badge: "Alles wat je wilt weten voor je begint",
    h1: "Werken in de horeca:",
    h1Accent: "zo begin je",
    subtitel: "Van welke leeftijd je moet zijn tot wat je verdient en hoe je zonder ervaring start — de eerlijke gids voor werken in de horeca in Amsterdam.",
    intro: [
      "Werken in de horeca is de populairste eerste (bij)baan van Nederland, en niet voor niets: je werkt met mensen in plaats van achter een scherm, geen dienst is hetzelfde en je bouwt vaardigheden op — samenwerken onder druk, gastvrijheid, tempo maken — waar je je hele carrière iets aan hebt.",
      "Tegelijk komen er vragen bij kijken. Vanaf welke leeftijd mag je in de horeca werken? Wat verdien je er eigenlijk? En kun je starten zonder ervaring? Op deze pagina beantwoorden we de vragen die we het vaakst krijgen — eerlijk, zonder mooipraterij.",
    ],
    usps: [
      { titel: "Starten zonder ervaring", tekst: "Voor runners, buffet en garderobe word je on the job ingewerkt." },
      { titel: "Skills voor het leven", tekst: "Gastvrijheid, samenwerken en tempo — waardevol op elk cv." },
      { titel: "Flexibel te combineren", tekst: "Shifts die om je studie of andere baan heen passen." },
      { titel: "Via EXTRA in loondienst", tekst: "Cao-loon, verzekerd, vakantiegeld en dagbetaling mogelijk." },
    ],
    secties: [
      {
        titel: "Vanaf welke leeftijd mag je in de horeca werken?",
        tekst: [
          "Wettelijk mag je in Nederland vanaf 13 jaar licht, niet-industrieel werk doen, maar voor echt horecawerk gelden strengere regels. Vanaf 15 jaar mag je bijvoorbeeld helpen in een keuken of achter een counter, met beperkte werktijden. Vanaf 16 jaar mag je in de bediening werken — maar geen alcohol schenken achter de bar: daarvoor moet je 18 zijn. Ook voor late avondshifts gelden tot je 18e beperkingen in werktijden.",
          "Bij EXTRA kun je vanaf 17 jaar aan de slag. Zo weten we zeker dat je op vrijwel alle shifts inzetbaar bent en volwaardig kunt meedraaien in de teams bij onze opdrachtgevers.",
        ],
      },
      {
        titel: "Wat verdien je in de horeca?",
        tekst: [
          "Je loon hangt af van je leeftijd, functie en ervaring, en is bij EXTRA altijd conform cao. Boven op je basisuurloon komen vaak toeslagen voor avond-, nacht- en weekendwerk — juist de uren waarop de horeca draait. Wie doorgroeit naar zelfstandige bediening, bar of keuken ziet zijn tarief meegroeien. En via EXTRA kun je kiezen voor dagbetaling: je salaris staat dan de ochtend na je shift al op je rekening.",
        ],
      },
      {
        titel: "Starten zonder ervaring: zo pak je het aan",
        tekst: [
          "De horeca is een van de weinige sectoren waar je zonder diploma of ervaring op niveau kunt instromen. Begin als runner of buffetkracht en kijk de kunst af van ervaren collega's; binnen een paar maanden sta je zelfstandig in de bediening. Via EXTRA krijg je bij je eerste shift een inwerkmoment en werk je op locaties waar hoge standaarden gelden — de beste leerschool die er is. Meld je aan en je kunt vaak dezelfde week nog beginnen.",
        ],
      },
    ],
    faqs: [
      { q: "Vanaf welke leeftijd mag je in de horeca werken?", a: "Vanaf 15 jaar mag je licht horecawerk doen (bijv. in de keuken helpen), vanaf 16 mag je in de bediening, en alcohol schenken mag pas vanaf 18. Bij EXTRA kun je vanaf 17 jaar aan de slag." },
      { q: "Kan ik in de horeca werken zonder ervaring?", a: "Ja. Functies als runner, buffetkracht en garderobe zijn ideaal om te starten; je wordt on the job ingewerkt en kunt snel doorgroeien naar bediening of bar." },
      { q: "Wat verdien je in de horeca?", a: "Minimaal het cao-loon voor je leeftijd en functie, vaak aangevuld met avond- en weekendtoeslagen. Met ervaring en doorgroei stijgt je uurloon mee." },
      { q: "Is horecawerk goed te combineren met een studie?", a: "Juist wel: de meeste shifts vallen in avonden en weekenden. Via EXTRA kies je per week je shifts, dus in tentamenweken schaal je gewoon terug." },
      { q: "Wat is het verschil tussen werken via EXTRA en direct bij een zaak?", a: "Via EXTRA werk je op meerdere toplocaties in plaats van één zaak, kies je zelf je shifts, kun je kiezen voor dagbetaling en bouw je via EXTRAATJE punten op. Je bent gewoon in loondienst, met alle zekerheden." },
    ],
    ctaTitel: "Klaar voor je eerste horecashift?",
    ctaTekst: "Meld je aan bij EXTRA — vanaf 17 jaar, met of zonder ervaring — en sta deze week nog op de vloer.",
    primaireCta: KANDIDAAT_CTA,
    secundaireCta: { label: "Dagbetaling uitgelegd", href: "/dagbetaling" },
    gerelateerd: [
      { label: "Bijbaan Amsterdam", href: "/bijbaan-amsterdam" },
      { label: "Horeca vacatures Amsterdam", href: "/horeca-vacatures-amsterdam" },
      { label: "Dagbetaling", href: "/dagbetaling" },
      { label: "Housekeeping werk", href: "/housekeeping-werk" },
    ],
  },
};

export default function SeoLandingPagina({ page }: { page: string }) {
  const cfg = CONFIGS[page];
  if (!cfg) return null;
  return <SeoLanding cfg={cfg} />;
}
