/**
 * Kleine CSV-parser volgens RFC 4180.
 *
 * WAAROM DIT BESTAAT
 * ------------------
 * De TWV-import deed `line.split(',')`. Dat gaat goed tot iemand een komma in
 * een notitieveld zet — en `twvNotes` is precies het veld waar dat gebeurt
 * ("Verlengd, wacht op IND"). Eén komma verschoof dan de hele rij, waardoor een
 * datum in het notitieveld belandde of een status in een datumveld. Zonder
 * foutmelding: de rij werd gewoon verkeerd geïmporteerd.
 *
 * Waarom geen bibliotheek: dit project heeft geen enkele CSV-dependency (alleen
 * exceljs voor xlsx), en een nieuwe afhankelijkheid toevoegen voor vijftig
 * regels code die volledig te testen zijn, is duurder dan hem schrijven.
 *
 * WAT HIJ AANKAN
 * --------------
 * Velden tussen aanhalingstekens, komma's en regeleindes bínnen zo'n veld, een
 * dubbel aanhalingsteken als ontsnapping ("" wordt "), een BOM aan het begin,
 * en zowel \\n als \\r\\n als regeleinde. Een ander scheidingsteken (bijvoorbeeld
 * de puntkomma die Excel in Nederland gebruikt) kan mee als argument.
 */

export interface CsvOpties {
  /** Standaard de komma. Excel-NL exporteert vaak met een puntkomma. */
  scheidingsteken?: string;
}

/**
 * Splitst ruwe CSV-tekst in rijen van velden. Lege regels vervallen; een regel
 * met alleen scheidingstekens blijft staan, want dat is een rij met lege velden.
 */
export function parseCsv(tekst: string, opties?: CsvOpties): string[][] {
  const sep = opties?.scheidingsteken ?? ",";
  // Byte order mark van Excel weghalen, anders heet de eerste kolomkop "﻿email".
  const invoer = tekst.charCodeAt(0) === 0xfeff ? tekst.slice(1) : tekst;

  const rijen: string[][] = [];
  let rij: string[] = [];
  let veld = "";
  let inAanhaling = false;
  let veldBegonnen = false;

  const sluitVeld = () => { rij.push(veld); veld = ""; veldBegonnen = false; };
  const sluitRij = () => {
    sluitVeld();
    // Een rij die alleen uit één leeg veld bestaat was een lege regel.
    if (!(rij.length === 1 && rij[0] === "")) rijen.push(rij);
    rij = [];
  };

  for (let i = 0; i < invoer.length; i++) {
    const teken = invoer[i];

    if (inAanhaling) {
      if (teken === '"') {
        if (invoer[i + 1] === '"') { veld += '"'; i++; }  // "" is één "
        else inAanhaling = false;
      } else {
        veld += teken;
      }
      continue;
    }

    if (teken === '"' && !veldBegonnen) { inAanhaling = true; veldBegonnen = true; continue; }
    if (teken === sep) { sluitVeld(); continue; }
    if (teken === "\r") { if (invoer[i + 1] === "\n") i++; sluitRij(); continue; }
    if (teken === "\n") { sluitRij(); continue; }

    veld += teken;
    veldBegonnen = true;
  }

  // Laatste veld/rij afronden als het bestand niet op een regeleinde eindigt.
  if (veld !== "" || rij.length > 0) sluitRij();

  return rijen;
}

/**
 * Zelfde parser, maar met de eerste rij als kolomkoppen. Koppen worden
 * kleingemaakt en ontdaan van spaties, zodat "TWV Status" en "twvstatus"
 * hetzelfde opleveren. Rijen met minder velden dan koppen krijgen lege strings.
 */
export function parseCsvMetKoppen(tekst: string, opties?: CsvOpties): Record<string, string>[] {
  const rijen = parseCsv(tekst, opties);
  if (rijen.length === 0) return [];
  const koppen = rijen[0].map(k => k.trim().toLowerCase());
  return rijen.slice(1).map(velden => {
    const obj: Record<string, string> = {};
    koppen.forEach((kop, i) => { obj[kop] = (velden[i] ?? "").trim(); });
    return obj;
  });
}
