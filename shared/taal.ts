/**
 * TAALDETECTIE — op welke taalhelft van de site staat de bezoeker?
 *
 * Aanleiding: de Engelse pagina's (/en/*) deelden componenten met de
 * Nederlandse site die geen taal kenden. De footer stond volledig in het
 * Nederlands op elke Engelse pagina, de laadtekst was "Even laden...", en de
 * "Lees meer"-knop onder reviews bleef Nederlands. PublicNav had als enige een
 * eigen lijstje Engelse paden — een tweede lijst naast HREFLANG_GROUPS, die
 * uit elkaar kunnen lopen zodra er een pagina bijkomt.
 *
 * Dit is de ene plek waar die vraag beantwoord wordt. De regel is bewust dom:
 * alles onder /en is Engels. Geen lijst die onderhouden moet worden, geen
 * pagina die vergeten kan worden.
 */

/** True als dit pad bij de Engelse site hoort. */
export function isEngelsPad(pad: string | null | undefined): boolean {
  if (!pad || typeof pad !== 'string') return false;
  // Query-string en hash tellen niet mee voor de taal.
  const kaal = pad.split(/[?#]/)[0];
  return kaal === '/en' || kaal === '/en/' || kaal.startsWith('/en/');
}

export type Taal = 'nl' | 'en';

/** De taal van een pad. */
export function taalVanPad(pad: string | null | undefined): Taal {
  return isEngelsPad(pad) ? 'en' : 'nl';
}
