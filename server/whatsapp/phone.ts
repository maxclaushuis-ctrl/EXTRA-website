/**
 * Telefoonnummer-normalisatie naar E.164 zonder leidende '+'.
 *
 * Voorbeelden:
 *   "0612345678"        -> "31612345678"
 *   "+31 6 1234 5678"   -> "31612345678"
 *   "0031 612345678"    -> "31612345678"
 *   "(06) 1234-5678"    -> "31612345678"
 *   "+1 415 555 0100"   -> "14155550100"
 *
 * Default landcode is NL (31) als geen + en geen 00-prefix.
 * Geeft `null` terug bij ongeldig formaat.
 */

const DEFAULT_COUNTRY_CODE = '31'; // NL

export type NormalizationFailure = 'empty' | 'no_digits' | 'too_short' | 'too_long' | 'invalid_country';

export interface NormalizationResult {
  normalized: string | null;
  reason?: NormalizationFailure;
}

/**
 * Geeft alleen het genormaliseerde nummer terug, of `null` bij ongeldig.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  return normalizePhoneDetailed(input).normalized;
}

/**
 * Variant met diagnostische `reason` bij falen — handig voor migration logging.
 */
export function normalizePhoneDetailed(input: string | null | undefined): NormalizationResult {
  if (input == null) return { normalized: null, reason: 'empty' };
  const trimmed = String(input).trim();
  if (trimmed === '') return { normalized: null, reason: 'empty' };

  const hasPlus = trimmed.startsWith('+');
  // Strip alles behalve cijfers
  let digits = trimmed.replace(/\D+/g, '');

  if (digits === '') return { normalized: null, reason: 'no_digits' };

  // 00-prefix is internationaal (00CC...) → behandel als +CC...
  let international = hasPlus;
  if (!international && digits.startsWith('00')) {
    international = true;
    digits = digits.slice(2);
  }

  if (!international) {
    // Lokaal NL-nummer: leidende 0 weghalen en NL-landcode prefixen
    if (digits.startsWith('0')) {
      digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
    } else {
      // Geen + en geen leidende 0 — kan al een internationaal nummer zonder + zijn
      // (bijv. "31612345678"). Accepteer als het een geldige lengte heeft.
      // Anders: prefix de default landcode.
      if (digits.length < 9) {
        digits = DEFAULT_COUNTRY_CODE + digits;
      }
    }
  }

  // Lengte-validatie volgens E.164 (min 8, max 15 totaal incl. landcode)
  if (digits.length < 8) return { normalized: null, reason: 'too_short' };
  if (digits.length > 15) return { normalized: null, reason: 'too_long' };

  // Landcode-sanity: eerste cijfer mag geen 0 zijn na normalisatie
  if (digits.startsWith('0')) return { normalized: null, reason: 'invalid_country' };

  return { normalized: digits };
}

/**
 * Vergelijkt twee ruwe nummers door beide te normaliseren.
 * Geeft `false` terug als één van de twee ongeldig is.
 */
export function phonesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  return !!na && !!nb && na === nb;
}
