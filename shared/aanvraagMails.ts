/**
 * MAILS EN VALIDATIE ROND BINNENKOMENDE AANVRAGEN
 *
 * Eén plek voor alles wat er tekstueel gebeurt zodra iemand het
 * contactformulier of het personeelsaanvraagformulier verstuurt:
 *
 *  - validatie van een contactbericht (server-side; het formulier valideert
 *    ook client-side, maar dat is een gebruikersgemak, geen beveiliging);
 *  - de interne mail naar kantoor;
 *  - de bevestigingsmail naar de afzender.
 *
 * Waarom hier en niet in server/routes.ts: alles hieronder is puur — geen
 * database, geen Express, geen SendGrid — zodat `npm run aanvraagmails:test`
 * het onder kale tsx kan draaien. routes.ts is inmiddels bijna 9.000 regels;
 * daar hoort geen tekst in die je wilt kunnen testen.
 *
 * Alle waarden die van een bezoeker komen, gaan door escapeHtml() voordat ze
 * in HTML belanden. Deze mails komen in de inbox van kantoor terecht, en een
 * inbox is geen veilige plek om ongefilterde invoer te renderen.
 */

// ── Vaste gegevens ────────────────────────────────────────────────────────
// Eén bron van waarheid; deze stonden verspreid en op één plek zelfs verkeerd
// (de contactpagina toonde een placeholdernummer).
export const TELEFOON = "085 130 59 15";
export const TELEFOON_LINK = "tel:0851305915";
export const WHATSAPP_LINK = "https://wa.me/31851305915";
export const MAILADRES = "info@doehetextra.nl";
export const ADRES = "Herengracht 372, 1016 CH Amsterdam";
export const OPENINGSTIJDEN = "ma t/m vr 9:00 tot 18:00";
export const INTERNE_ONTVANGERS = ["max@doehetextra.nl", "eveline@doehetextra.nl"];
export const AFZENDER = "EXTRA <max@doehetextra.nl>";

import {
  escapeHtml, mailOpmaak, brancheVanLocatie,
  alinea, link, gegevens, donkerBlok, infoBlok, afsluiting,
} from "./mailOpmaak";

/** Minimale HTML-escaping voor waarden die uit een formulier komen (uit de gedeelde opmaak). */
export { escapeHtml };

/** Regeleindes naar <br> nadat er geëscaped is (voor vrije tekstvelden). */
export function tekstNaarHtml(waarde: unknown): string {
  return escapeHtml(waarde).replace(/\r?\n/g, "<br>");
}

// ── Contactbericht ────────────────────────────────────────────────────────

export interface ContactBericht {
  naam: string;
  email: string;
  bericht: string;
}

export interface ValidatieResultaat<T> {
  ok: boolean;
  fouten: Record<string, string>;
  waarden: T;
}

/**
 * Server-side validatie van een contactbericht. Bewust dezelfde grenzen als
 * het formulier, plus een bovengrens per veld: zonder maximum kan iemand een
 * bericht van megabytes insturen dat de mail onbruikbaar maakt.
 */
export function valideerContactBericht(invoer: any): ValidatieResultaat<ContactBericht> {
  const naam = typeof invoer?.naam === "string" ? invoer.naam.trim() : "";
  const email = typeof invoer?.email === "string" ? invoer.email.trim() : "";
  const bericht = typeof invoer?.bericht === "string" ? invoer.bericht.trim() : "";
  const fouten: Record<string, string> = {};

  if (naam.length < 2) fouten.naam = "Vul je naam in.";
  else if (naam.length > 120) fouten.naam = "Naam is te lang.";

  // Bewust een eenvoudige controle: iets@iets.iets zonder spaties. Een
  // strengere regex weigert geldige adressen en levert niets extra's op —
  // of het adres bestaat, weet je pas als de mail aankomt.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fouten.email = "Vul een geldig e-mailadres in.";
  else if (email.length > 254) fouten.email = "E-mailadres is te lang.";

  if (bericht.length < 10) fouten.bericht = "Vertel in een paar zinnen waar het over gaat.";
  else if (bericht.length > 5000) fouten.bericht = "Bericht is te lang (maximaal 5000 tekens).";

  return { ok: Object.keys(fouten).length === 0, fouten, waarden: { naam, email, bericht } };
}

export interface Mail {
  subject: string;
  html: string;
  text: string;
}

/** Bereikbaarheid onderaan de mails aan bezoekers. */
const BEREIKBAAR_HTML = alinea(
  `${link(escapeHtml(TELEFOON), TELEFOON_LINK)} (${escapeHtml(OPENINGSTIJDEN)}) · ${link("WhatsApp", WHATSAPP_LINK)} · ${link(escapeHtml(MAILADRES), `mailto:${MAILADRES}`)}`,
  { klein: true, marge: "18px 0 0" },
);

/** Naar kantoor: er is een bericht binnengekomen via /contact. */
export function contactBerichtInternMail(b: ContactBericht): Mail {
  const html = mailOpmaak({
    titel: "Nieuw bericht via de website",
    voorkop: "Contactformulier op doehetextra.nl",
    kop: "Nieuw bericht via de website",
    preheader: `${b.naam}: ${b.bericht.slice(0, 80)}`,
    voet: "kort",
    inhoud: gegevens([
      ["Naam", escapeHtml(b.naam)],
      ["E-mail", escapeHtml(b.email)],
      ["Bericht", tekstNaarHtml(b.bericht)],
    ]),
  });
  return {
    subject: `Contactbericht van ${b.naam}`,
    html,
    text: `Nieuw bericht via het contactformulier.\n\nNaam: ${b.naam}\nE-mail: ${b.email}\n\n${b.bericht}`,
  };
}

/** Naar de afzender: bevestiging dat het bericht is aangekomen. */
export function contactBerichtBevestigingMail(b: ContactBericht): Mail {
  const voornaam = b.naam.split(/\s+/)[0] || b.naam;
  const html = mailOpmaak({
    titel: "We hebben je bericht ontvangen",
    voorkop: "Bericht ontvangen",
    kop: "We hebben je bericht ontvangen",
    preheader: "We reageren tijdens kantooruren meestal dezelfde dag.",
    inhoud: [
      alinea(`Hoi ${escapeHtml(voornaam)},`),
      alinea(`Je bericht is bij ons binnengekomen. We lezen alles zelf en reageren tijdens kantooruren (${escapeHtml(OPENINGSTIJDEN)}) meestal dezelfde dag.`),
      alinea(`Heb je haast? Bel gerust ${link(escapeHtml(TELEFOON), TELEFOON_LINK)} of stuur een ${link("WhatsApp", WHATSAPP_LINK)}.`),
      infoBlok("algemeen", `<p style="margin:0;font-size:15px;line-height:1.6;color:#5C594F;">${tekstNaarHtml(b.bericht)}</p>`, { label: "Dit stuurde je ons" }),
      afsluiting("nl"),
      BEREIKBAAR_HTML,
    ].join(""),
  });
  return {
    subject: "We hebben je bericht ontvangen",
    html,
    text: `Hoi ${voornaam},\n\nJe bericht is bij ons binnengekomen. We reageren tijdens kantooruren (${OPENINGSTIJDEN}) meestal dezelfde dag.\n\nHeb je haast? Bel ${TELEFOON} of stuur een WhatsApp.\n\nDit stuurde je ons:\n${b.bericht}\n\nTot snel! 🤎\nTeam EXTRA\n\nEXTRA Uitzendbureau · ${ADRES}`,
  };
}

// ── Personeelsaanvraag ────────────────────────────────────────────────────

export interface AanvraagSamenvatting {
  bedrijfsnaam: string;
  contactpersoon: string;
  telefoon: string;
  email: string;
  locatienaam?: string | null;
  functies?: string[];
  opmerkingen?: string | null;
  /** Type locatie (hotel, restaurant, eventlocatie, cateraar, logistiek). Bepaalt de kleur van de mail. */
  locatieType?: string | null;
}

/**
 * Naar de aanvrager: bevestiging plus de verwachting wanneer er gebeld wordt.
 *
 * De belofte is bewust in twee delen gesplitst. De pagina zelf zegt "binnen
 * 1 uur", maar dat kan alleen tijdens kantooruren waargemaakt worden. Een
 * aanvraag die om 22:00 binnenkomt en pas de volgende ochtend een reactie
 * krijgt, is geen gebroken belofte zolang je dat vooraf zegt.
 */
export function aanvraagBevestigingMail(a: AanvraagSamenvatting): Mail {
  const voornaam = a.contactpersoon.split(/\s+/)[0] || a.contactpersoon;
  const rijen: [string, string][] = [
    ["Bedrijf", a.bedrijfsnaam],
    ["Contactpersoon", a.contactpersoon],
    ["Telefoon", a.telefoon],
  ];
  if (a.locatienaam) rijen.push(["Locatie", a.locatienaam]);
  if (a.functies && a.functies.length > 0) rijen.push(["Functies", a.functies.join(", ")]);
  if (a.opmerkingen) rijen.push(["Toelichting", a.opmerkingen]);

  const branche = brancheVanLocatie(a.locatieType);
  const html = mailOpmaak({
    branche,
    titel: "Je aanvraag is ontvangen",
    voorkop: "Personeelsaanvraag",
    kop: "Je aanvraag is ontvangen",
    preheader: "Tijdens kantooruren bellen we je meestal binnen een uur terug.",
    inhoud: [
      alinea(`Hoi ${escapeHtml(voornaam)},`),
      alinea(`We hebben je aanvraag binnen. Tijdens kantooruren (${escapeHtml(OPENINGSTIJDEN)}) bellen we je meestal binnen een uur terug op <b style="color:#37352C;">${escapeHtml(a.telefoon)}</b>. Komt je aanvraag 's avonds of in het weekend binnen, dan bellen we je de eerstvolgende werkdag in de ochtend.`, { marge: "0 0 22px" }),
      gegevens(rijen.map(([l, w]) => [l, tekstNaarHtml(w)] as [string, string]), { label: "Dit hebben we genoteerd" }),
      donkerBlok(branche, "Is het urgent, bijvoorbeeld voor morgenochtend?", "Bel dan gerust zelf. We zijn ook bereikbaar via WhatsApp.", [
        { tekst: `Bel ${escapeHtml(TELEFOON)}`, href: TELEFOON_LINK },
        { tekst: "WhatsApp", href: WHATSAPP_LINK },
      ]),
      alinea("Klopt er iets niet? Reageer op deze mail, dan passen we het aan.", { klein: true, marge: "0" }),
      afsluiting("nl"),
    ].join(""),
  });

  const tekstRegels = rijen.map(([l, v]) => `${l}: ${v}`).join("\n");
  return {
    subject: `Je aanvraag bij EXTRA is ontvangen`,
    html,
    text: `Hoi ${voornaam},\n\nWe hebben je aanvraag binnen. Tijdens kantooruren (${OPENINGSTIJDEN}) bellen we je meestal binnen een uur terug op ${a.telefoon}. Buiten kantooruren bellen we de eerstvolgende werkdag in de ochtend.\n\nIs het urgent? Bel ${TELEFOON} of stuur een WhatsApp.\n\nDit hebben we genoteerd:\n${tekstRegels}\n\nTot snel! 🤎\nTeam EXTRA\n\nEXTRA Uitzendbureau · ${ADRES}`,
  };
}
