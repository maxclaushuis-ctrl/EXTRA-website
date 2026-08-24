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
export const OPENINGSTIJDEN = "ma–vr 9:00–18:00";
export const INTERNE_ONTVANGERS = ["max@doehetextra.nl", "eveline@doehetextra.nl"];
export const AFZENDER = "EXTRA <max@doehetextra.nl>";

/** Minimale HTML-escaping voor waarden die uit een formulier komen. */
export function escapeHtml(waarde: unknown): string {
  return String(waarde ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

const VOET_HTML = `
  <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.7;">
    EXTRA Uitzendbureau · ${escapeHtml(ADRES)}<br>
    <a href="${TELEFOON_LINK}" style="color:#7c3aed;">${escapeHtml(TELEFOON)}</a> (${escapeHtml(OPENINGSTIJDEN)}) ·
    <a href="${WHATSAPP_LINK}" style="color:#7c3aed;">WhatsApp</a> ·
    <a href="mailto:${MAILADRES}" style="color:#7c3aed;">${escapeHtml(MAILADRES)}</a>
  </p>`;

function omhulsel(titel: string, ondertitel: string, binnenkant: string): string {
  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#7c3aed;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;color:#fff;font-size:18px;">${escapeHtml(titel)}</h2>
    <p style="margin:4px 0 0;color:#ddd6fe;font-size:13px;">${escapeHtml(ondertitel)}</p>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;color:#111827;font-size:15px;line-height:1.65;">
    ${binnenkant}
  </div>
</div>`;
}

function tabel(rijen: [string, string][]): string {
  const cellen = rijen
    .map(
      ([label, waarde]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;width:150px;white-space:nowrap;">${escapeHtml(
          label,
        )}</td><td style="padding:6px 12px;color:#111827;border:1px solid #e5e7eb;">${tekstNaarHtml(waarde)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">${cellen}</table>`;
}

/** Naar kantoor: er is een bericht binnengekomen via /contact. */
export function contactBerichtInternMail(b: ContactBericht): Mail {
  const html = omhulsel(
    "Nieuw bericht via de website",
    "Verstuurd via het contactformulier op doehetextra.nl",
    tabel([
      ["Naam", b.naam],
      ["E-mail", b.email],
      ["Bericht", b.bericht],
    ]),
  );
  return {
    subject: `Contactbericht van ${b.naam}`,
    html,
    text: `Nieuw bericht via het contactformulier.\n\nNaam: ${b.naam}\nE-mail: ${b.email}\n\n${b.bericht}`,
  };
}

/** Naar de afzender: bevestiging dat het bericht is aangekomen. */
export function contactBerichtBevestigingMail(b: ContactBericht): Mail {
  const voornaam = b.naam.split(/\s+/)[0] || b.naam;
  const html = omhulsel(
    "We hebben je bericht ontvangen",
    "Bedankt voor je bericht aan EXTRA",
    `
    <p style="margin:0;">Hoi ${escapeHtml(voornaam)},</p>
    <p style="margin:14px 0 0;">Je bericht is bij ons binnengekomen. We lezen alles zelf en reageren tijdens kantooruren (${escapeHtml(
      OPENINGSTIJDEN,
    )}) meestal dezelfde dag.</p>
    <p style="margin:14px 0 0;">Heb je haast? Bel gerust <a href="${TELEFOON_LINK}" style="color:#7c3aed;font-weight:600;">${escapeHtml(
      TELEFOON,
    )}</a> of stuur een <a href="${WHATSAPP_LINK}" style="color:#7c3aed;font-weight:600;">WhatsApp</a>.</p>
    <div style="margin:22px 0 0;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Dit stuurde je ons</p>
      <p style="margin:0;color:#374151;">${tekstNaarHtml(b.bericht)}</p>
    </div>
    ${VOET_HTML}`,
  );
  return {
    subject: "We hebben je bericht ontvangen — EXTRA",
    html,
    text: `Hoi ${voornaam},\n\nJe bericht is bij ons binnengekomen. We reageren tijdens kantooruren (${OPENINGSTIJDEN}) meestal dezelfde dag.\n\nHeb je haast? Bel ${TELEFOON} of stuur een WhatsApp.\n\nDit stuurde je ons:\n${b.bericht}\n\nEXTRA Uitzendbureau · ${ADRES}`,
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

  const html = omhulsel(
    "Je aanvraag is ontvangen",
    "Personeelsaanvraag via doehetextra.nl",
    `
    <p style="margin:0;">Hoi ${escapeHtml(voornaam)},</p>
    <p style="margin:14px 0 0;">We hebben je aanvraag binnen. Tijdens kantooruren (${escapeHtml(
      OPENINGSTIJDEN,
    )}) bellen we je meestal binnen een uur terug op <strong>${escapeHtml(
      a.telefoon,
    )}</strong>. Komt je aanvraag 's avonds of in het weekend binnen, dan bellen we je de eerstvolgende werkdag in de ochtend.</p>
    <p style="margin:14px 0 0;">Is het urgent — bijvoorbeeld voor morgenochtend? Bel dan gerust zelf: <a href="${TELEFOON_LINK}" style="color:#7c3aed;font-weight:600;">${escapeHtml(
      TELEFOON,
    )}</a>. We zijn ook bereikbaar via <a href="${WHATSAPP_LINK}" style="color:#7c3aed;font-weight:600;">WhatsApp</a>.</p>
    <div style="margin:22px 0 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Dit hebben we genoteerd</p>
      ${tabel(rijen)}
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">Klopt er iets niet? Reageer op deze mail, dan passen we het aan.</p>
    ${VOET_HTML}`,
  );

  const tekstRegels = rijen.map(([l, v]) => `${l}: ${v}`).join("\n");
  return {
    subject: `Je aanvraag is ontvangen — EXTRA`,
    html,
    text: `Hoi ${voornaam},\n\nWe hebben je aanvraag binnen. Tijdens kantooruren (${OPENINGSTIJDEN}) bellen we je meestal binnen een uur terug op ${a.telefoon}. Buiten kantooruren bellen we de eerstvolgende werkdag in de ochtend.\n\nIs het urgent? Bel ${TELEFOON} of stuur een WhatsApp.\n\nDit hebben we genoteerd:\n${tekstRegels}\n\nEXTRA Uitzendbureau · ${ADRES}`,
  };
}
