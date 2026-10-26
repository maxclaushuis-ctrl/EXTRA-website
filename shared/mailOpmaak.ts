/**
 * GEDEELDE OPMAAK VOOR ALLE MAILS (design 3.0)
 *
 * Eén plek voor hoe een mail van EXTRA eruitziet: banner, kop, knoppen,
 * info-blokken, stappen, gegevens en de donkere voet. Elke mail geeft alleen de
 * branche mee; kleur en banner volgen daaruit.
 *
 *  - algemeen  (onbekend, wachtwoord, interne meldingen): off-white, net als de
 *    algemene pagina's op de site.
 *  - hotels: roze, events: blauw, logistiek: groen.
 *
 * Bewust puur (geen server-imports), zodat `npm run mailopmaak:test` het onder
 * kale tsx kan draaien en zodat shared/aanvraagMails.ts het ook kan gebruiken.
 *
 * Opbouw met tabellen en inline stijlen: Outlook en Gmail negeren de meeste CSS
 * in <style>. De <style> in de kop regelt alleen de kleinere marges op mobiel.
 * Afbeeldingen zijn JPG en PNG (Gmail toont geen SVG) en staan op de site zelf,
 * in client/public/email/.
 *
 * Alle helpers krijgen HTML binnen. Waarden die van een bezoeker of uit de
 * database komen, gaan eerst door escapeHtml().
 */

export type Branche = "algemeen" | "hotels" | "events" | "logistiek";
export type Taal = "nl" | "en";

/** Waar de afbeeldingen staan. Altijd de live site, ook vanuit een testomgeving. */
export const MAIL_BEELDEN = "https://www.doehetextra.nl/email";

export const KLEUR = {
  espresso: "#37352C",
  tekst2: "#5C594F",
  label: "#7A7468",
  zacht: "#8A8578",
  buiten: "#EDEAE4",
  offwhite: "#F8F7F4",
  rand: "#E4E0D8",
  wit: "#FFFFFF",
} as const;

interface Accent {
  /** Bolletje bij de kop en de cijfers van de stappen. */
  stip: string;
  /** Achtergrond van info-blokken. */
  vlak: string;
  /** Rand om bolletjes en blokken; alleen bij algemeen, anders vallen ze weg op wit. */
  rand: string | null;
  /** Tekst bovenin de banner, voor de alt-tekst. */
  bannerTekst: string;
}

export const ACCENT: Record<Branche, Accent> = {
  algemeen: { stip: KLEUR.offwhite, vlak: KLEUR.offwhite, rand: KLEUR.espresso, bannerTekst: "Het uitzendbureau dat werkt" },
  hotels: { stip: "#EBD0E4", vlak: "#F6ECF3", rand: null, bannerTekst: "Hospitality experts" },
  events: { stip: "#C7DFF4", vlak: "#EAF3FB", rand: null, bannerTekst: "Event manpower" },
  logistiek: { stip: "#CEDBBC", vlak: "#EEF3E7", rand: null, bannerTekst: "Logistic professionals" },
};

export const BEDRIJF = {
  naam: "EXTRA B.V.",
  adres: "Herengracht 372, Amsterdam",
  site: "https://www.doehetextra.nl",
  instagram: "https://www.instagram.com/doehetextra/",
  mail: "info@doehetextra.nl",
} as const;

export function escapeHtml(waarde: unknown): string {
  return String(waarde ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function bannerUrl(branche: Branche): string {
  return `${MAIL_BEELDEN}/banner-${branche}.jpg`;
}

// ── Welke branche hoort bij een mail ──────────────────────────────────────

/**
 * Branche uit een functie van een medewerker of kandidaat. Housekeeping,
 * bediening, bar, keuken en front office zijn hotels; logistieke functies zijn
 * logistiek; eventfuncties events. Onbekend is algemeen.
 */
export function brancheVanFunctie(functie: string | null | undefined): Branche {
  const f = (functie || "").toLowerCase();
  if (!f.trim()) return "algemeen";
  if (/logist|magazijn|orderpick|heftruck|reachtruck|warehouse|inpak|productie/.test(f)) return "logistiek";
  if (/event|festival|stage ?hand|crew|op- en afbouw|opbouw|afbouw|hostess|host\b/.test(f)) return "events";
  if (/housekeep|kamer|room|schoonma|front ?office|receptie|reception|horeca|bediening|bar|f&b|f ?& ?b|food|banquet|kok|chef|keuken|kitchen|afwas|steward|hotel|ontbijt|breakfast|runner|gastvrouw|gastheer/.test(f)) return "hotels";
  return "algemeen";
}

/** Branche uit het type locatie van een aanvraag of bedrijf in het CRM. */
export function brancheVanLocatie(locatie: string | null | undefined): Branche {
  const l = (locatie || "").toLowerCase();
  if (/hotel|restaurant|horeca/.test(l)) return "hotels";
  if (/event|cater|festival/.test(l)) return "events";
  if (/logist|magazijn|warehouse/.test(l)) return "logistiek";
  return "algemeen";
}

// ── Bouwstenen ────────────────────────────────────────────────────────────

const FONT = "'Plus Jakarta Sans',Arial,Helvetica,sans-serif";

/** Een alinea. `klein` voor voetnoten, `sterk` voor donkere tekst. */
export function alinea(html: string, o: { klein?: boolean; sterk?: boolean; marge?: string } = {}): string {
  const grootte = o.klein ? "13px" : "16px";
  const kleur = o.klein ? KLEUR.zacht : o.sterk ? KLEUR.espresso : KLEUR.tekst2;
  return `<p style="margin:${o.marge ?? "0 0 16px"};font-size:${grootte};line-height:${o.klein ? "1.5" : "1.6"};color:${kleur};">${html}</p>`;
}

/** Een tussenkop binnen de mail. */
export function tussenkop(html: string): string {
  return `<p style="margin:26px 0 12px;font-size:17px;line-height:1.3;font-weight:800;letter-spacing:-0.02em;color:${KLEUR.espresso};">${html}</p>`;
}

/** Klein label in hoofdletters, zoals "Jouw inloggegevens". */
export function label(html: string): string {
  return `<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${KLEUR.label};">${html}</p>`;
}

/**
 * Een knop. `vol` is donker met lichte tekst, `rand` wit met donkere rand.
 * De pijl is een gewoon teken, zodat hij ook zonder afbeeldingen werkt.
 */
export function knop(tekst: string, href: string, soort: "vol" | "rand" = "vol"): string {
  const stijl = soort === "vol"
    ? `background:${KLEUR.espresso};color:${KLEUR.offwhite};border:1.5px solid ${KLEUR.espresso};`
    : `background:${KLEUR.wit};color:${KLEUR.espresso};border:1.5px solid ${KLEUR.espresso};`;
  return `<a href="${escapeHtml(href)}" style="display:inline-block;${stijl}text-decoration:none;font-size:15px;font-weight:700;line-height:1.2;padding:13px 22px;border-radius:12px;margin:0 8px 8px 0;font-family:${FONT};">${tekst} &nbsp;&#8594;</a>`;
}

/** Eén of meer knoppen naast elkaar, met wat ruimte erboven en eronder. */
export function knoppen(...html: string[]): string {
  return `<div style="margin:8px 0 16px;">${html.join("")}</div>`;
}

/** Een link in de lopende tekst. */
export function link(tekst: string, href: string): string {
  return `<a href="${escapeHtml(href)}" style="color:${KLEUR.espresso};font-weight:700;text-decoration:underline;">${tekst}</a>`;
}

/** Een blok in de accentkleur van de branche. */
export function infoBlok(branche: Branche, html: string, o: { label?: string } = {}): string {
  const a = ACCENT[branche];
  const rand = a.rand ? `border:1px solid ${KLEUR.rand};` : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${a.vlak};${rand}border-radius:16px;margin:4px 0 20px;">
  <tr><td style="padding:22px 24px;font-size:15px;line-height:1.5;color:${KLEUR.espresso};">${o.label ? label(o.label) : ""}${html}</td></tr>
</table>`;
}

/** Een bolletje in de kleur van de branche, met een rand als het off-white is. */
function bolletje(branche: Branche, maat: number, inhoud = ""): string {
  const a = ACCENT[branche];
  const binnen = a.rand ? maat - 3 : maat;
  const rand = a.rand ? `border:1.5px solid ${a.rand};` : "";
  const tekst = inhoud
    ? `line-height:${binnen}px;text-align:center;color:${KLEUR.espresso};font-weight:700;font-size:13px;`
    : "";
  return `<span style="display:inline-block;width:${binnen}px;height:${binnen}px;border-radius:50%;background:${a.stip};${rand}${tekst}">${inhoud}</span>`;
}

/** Genummerde stappen met cijfers in de accentkleur. */
export function stappen(branche: Branche, items: string[]): string {
  const rijen = items
    .map((t, i) => `<tr><td valign="top" style="padding:0 12px 10px 0;width:26px;">${bolletje(branche, 26, String(i + 1))}</td><td style="padding:3px 0 10px;font-size:15px;line-height:1.5;color:${KLEUR.tekst2};">${t}</td></tr>`)
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${rijen}</table>`;
}

/**
 * Gegevens als label en waarde onder elkaar in een off-white blok, zoals
 * "Dit hebben we genoteerd". Waarden zijn HTML; lege waarden vallen weg.
 */
export function gegevens(rijen: [string, string | null | undefined][], o: { label?: string } = {}): string {
  const gevuld = rijen.filter(([, w]) => w !== null && w !== undefined && String(w).trim() !== "");
  const regels = gevuld
    .map(([l, w], i) => {
      const boven = i === 0 ? 18 : 6;
      const onder = i === gevuld.length - 1 ? 18 : 6;
      return `<tr><td valign="top" style="padding:${boven}px 12px ${onder}px 22px;color:${KLEUR.label};width:38%;">${escapeHtml(l)}</td><td valign="top" style="padding:${boven}px 22px ${onder}px 0;font-weight:700;color:${KLEUR.espresso};word-break:break-word;">${w}</td></tr>`;
    })
    .join("");
  return `${o.label ? label(o.label) : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${KLEUR.offwhite};border-radius:16px;font-size:15px;line-height:1.5;margin:0 0 20px;">${regels}</table>`;
}

/**
 * Een melding die eruit moet springen. `let-op` is voor iets wat nog kan
 * (een TWV die bijna verloopt), `stop` voor iets wat nu niet meer mag,
 * `goed` voor iets wat klaar is (cv bijgevoegd).
 */
export function melding(soort: "let-op" | "stop" | "goed", kop: string, html = ""): string {
  const s = {
    "let-op": { vlak: "#FBF1DC", rand: "#EBCF95" },
    stop: { vlak: "#F9E3E1", rand: "#E6B3AE" },
    goed: { vlak: "#EEF3E7", rand: "#CEDBBC" },
  }[soort];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${s.vlak};border:1px solid ${s.rand};border-radius:14px;margin:4px 0 20px;">
  <tr><td style="padding:16px 20px;color:${KLEUR.espresso};font-size:15px;line-height:1.5;"><b>${kop}</b>${html ? `<br><span style="color:${KLEUR.tekst2};">${html}</span>` : ""}</td></tr>
</table>`;
}

/** Donker blok voor een tweede actie, zoals "Is het urgent?". */
export function donkerBlok(branche: Branche, kop: string, html: string, acties: { tekst: string; href: string }[] = []): string {
  const knopjes = acties
    .map((k, i) => i === 0
      ? `<a href="${escapeHtml(k.href)}" style="display:inline-block;background:${branche === "algemeen" ? KLEUR.offwhite : ACCENT[branche].stip};color:${KLEUR.espresso};text-decoration:none;font-size:15px;font-weight:700;padding:13px 20px;border-radius:12px;margin:0 8px 6px 0;">${k.tekst}</a>`
      : `<a href="${escapeHtml(k.href)}" style="display:inline-block;background:transparent;color:${KLEUR.offwhite};text-decoration:none;font-size:15px;font-weight:700;padding:12px 20px;border-radius:12px;border:1.5px solid rgba(248,247,244,.45);margin:0 0 6px;">${k.tekst}</a>`)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${KLEUR.espresso};border-radius:16px;margin:8px 0 20px;">
  <tr><td style="padding:22px 24px;color:${KLEUR.offwhite};">
    <p style="margin:0 0 4px;font-size:17px;font-weight:800;letter-spacing:-0.02em;">${kop}</p>
    <p style="margin:0 0 ${acties.length ? 16 : 0}px;font-size:15px;line-height:1.5;color:rgba(248,247,244,.75);">${html}</p>
    ${knopjes}
  </td></tr>
</table>`;
}

/** Afsluiting met het bruine hartje. */
export function afsluiting(taal: Taal = "nl", o: { groet?: string; afzender?: string; hartje?: boolean } = {}): string {
  const groet = o.groet ?? (taal === "en" ? "See you soon!" : "Tot snel!");
  const afzender = o.afzender ?? "Team EXTRA";
  const hartje = o.hartje === false ? "" : " &#129294;";
  return `<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:${KLEUR.espresso};">${groet}${hartje}<br><span style="color:${KLEUR.tekst2};">${afzender}</span></p>`;
}

// ── De mail zelf ──────────────────────────────────────────────────────────

export interface MailOpmaak {
  branche?: Branche;
  taal?: Taal;
  /** <title> van het document; ook wat sommige clients als voorbeeld tonen. */
  titel: string;
  /** Tekst naast het bolletje boven de kop, bijvoorbeeld "Welkom". */
  voorkop?: string;
  /** De grote kop. Weglaten mag, dan begint de mail direct met de inhoud. */
  kop?: string;
  /** Voorbeeldtekst in de inbox naast het onderwerp. */
  preheader?: string;
  /** De inhoud, opgebouwd met de helpers hierboven. */
  inhoud: string;
  /**
   * `volledig`: logo, iconen (Instagram, site, mail) en adres.
   * `kort`: logo en adres, voor interne meldingen.
   */
  voet?: "volledig" | "kort";
  /** Extra regel onder het adres in de voet, bijvoorbeeld een uitschrijflink (HTML). */
  voetExtra?: string;
  /** Wordt onderaan geplaatst, voor een trackingpixel (HTML). */
  na?: string;
}

const MOBIEL_CSS = `<style type="text/css">
  @font-face{font-family:'Plus Jakarta Sans';font-style:normal;font-weight:200 800;src:url(https://www.doehetextra.nl/d3/plus-jakarta-sans-latin-wght-normal.woff2) format('woff2');}
  body{margin:0!important;padding:0!important;}
  img{border:0;}
  @media screen and (max-width:640px){
    .em-buiten{padding:0 8px!important;}
    .em-p{padding-left:20px!important;padding-right:20px!important;}
    .em-kop{font-size:28px!important;}
  }
</style>`;

function voet(soort: "volledig" | "kort", extra?: string): string {
  const iconen = soort === "volledig"
    ? `<p style="margin:18px 0 18px;font-size:0;line-height:0;">${[
        ["icoon-instagram.png", "Instagram", BEDRIJF.instagram],
        ["icoon-website.png", "Website", BEDRIJF.site],
        ["icoon-mail.png", "E-mail", `mailto:${BEDRIJF.mail}`],
      ]
        .map(([b, alt, href]) => `<a href="${href}" style="display:inline-block;margin:0 5px;"><img src="${MAIL_BEELDEN}/${b}" width="38" height="38" alt="${alt}" style="display:block;width:38px;height:38px;border:0;"></a>`)
        .join("")}</p>`
    : `<p style="margin:0 0 14px;font-size:0;line-height:0;">&nbsp;</p>`;
  return `<tr><td class="em-p" style="background:${KLEUR.espresso};padding:30px 40px 28px;border-radius:0 0 20px 20px;text-align:center;font-family:${FONT};">
        <img src="${MAIL_BEELDEN}/logo-wit.png" width="96" height="25" alt="EXTRA" style="display:inline-block;width:96px;height:auto;border:0;">
        ${iconen}
        <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(248,247,244,.6);">${BEDRIJF.naam} · ${BEDRIJF.adres} · <a href="${BEDRIJF.site}" style="color:rgba(248,247,244,.85);text-decoration:underline;">doehetextra.nl</a></p>
        ${extra ? `<p style="margin:10px 0 0;font-size:11px;line-height:1.5;color:rgba(248,247,244,.6);">${extra}</p>` : ""}
      </td></tr>`;
}

/** Bouwt de volledige mail. */
export function mailOpmaak(o: MailOpmaak): string {
  const branche = o.branche ?? "algemeen";
  const taal = o.taal ?? "nl";
  const a = ACCENT[branche];
  const voorkop = o.voorkop
    ? `<p style="margin:0 0 14px;font-size:14px;font-weight:600;color:${KLEUR.espresso};">${bolletje(branche, 9).replace("display:inline-block;", "display:inline-block;margin-right:8px;vertical-align:1px;")}${o.voorkop}</p>`
    : "";
  const kop = o.kop
    ? `<h1 class="em-kop" style="margin:0 0 16px;font-size:32px;line-height:1.1;font-weight:800;letter-spacing:-0.04em;color:${KLEUR.espresso};font-family:${FONT};">${o.kop}</h1>`
    : "";
  const preheader = o.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${KLEUR.buiten};">${escapeHtml(o.preheader)}</div>`
    : "";
  return `<!DOCTYPE html>
<html lang="${taal}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>${escapeHtml(o.titel)}</title>
${MOBIEL_CSS}
</head>
<body style="margin:0;padding:0;background:${KLEUR.buiten};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${KLEUR.buiten};">
  <tr><td align="center" class="em-buiten" style="padding:24px 16px 32px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;font-family:${FONT};color:${KLEUR.espresso};">
      <tr><td style="padding:0;line-height:0;font-size:0;"><img src="${bannerUrl(branche)}" width="600" alt="EXTRA, ${escapeHtml(a.bannerTekst.toLowerCase())}" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:20px 20px 0 0;"></td></tr>
      <tr><td class="em-p" style="background:${KLEUR.wit};padding:40px 40px 36px;font-family:${FONT};">
        ${voorkop}${kop}${o.inhoud}
      </td></tr>
      ${voet(o.voet ?? "volledig", o.voetExtra)}
    </table>
    ${o.na ?? ""}
  </td></tr>
</table>
</body>
</html>`;
}

/** Vervangt het paarse hartje van de oude huisstijl door het bruine. */
export function bruinHartje(tekst: string): string {
  // split/join in plaats van een regex met de u-vlag: tsc staat hier op ES5.
  return (tekst || "").split("\uD83D\uDC9C").join("\uD83E\uDD0E");
}

/**
 * Kleuren uit de oude paarse huisstijl die nog in opgeslagen templates staan
 * (knoppen, koppen, links). Bij het opbouwen van de mail worden ze vervangen,
 * zodat er niets in de database hoeft te veranderen.
 */
const PAARS_NAAR_DESIGN3: Record<string, string> = {
  "#7c3aed": KLEUR.espresso,
  "#6d28d9": KLEUR.espresso,
  "#5b21b6": KLEUR.espresso,
  "#5b2eb5": KLEUR.espresso,
  "#4c1d95": KLEUR.espresso,
  "#8b5cf6": KLEUR.espresso,
  "#1e1b4b": KLEUR.espresso,
  "#a78bfa": "#EBD0E4",
  "#c4b5fd": "#EBD0E4",
  "#ddd6fe": KLEUR.rand,
  "#ede9fe": KLEUR.offwhite,
  "#f5f3ff": KLEUR.offwhite,
  "#faf5ff": KLEUR.offwhite,
  "#f0eff5": KLEUR.buiten,
};

export function zonderPaars(kleur: string | null | undefined, standaard: string): string {
  if (!kleur) return standaard;
  return PAARS_NAAR_DESIGN3[kleur.trim().toLowerCase()] ?? kleur;
}
