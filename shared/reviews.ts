/**
 * REVIEWCIJFER — één bron van waarheid
 *
 * Op de site stonden vier verschillende reviewaantallen door elkaar: 188, 215,
 * 232 en 234, verdeeld over elf plekken. Twee daarvan stonden zelfs op dezelfde
 * pagina (de homepage: 234 in de statsbalk, 232 verderop). Een reviewcijfer is
 * bewijs, en bewijs dat zichzelf tegenspreekt is schadelijker dan geen bewijs —
 * zeker nu AI-modellen de gecommitte prerender-fragmenten letterlijk citeren.
 *
 * Vanaf hier komt elk reviewgetal op de publieke site uit dit bestand.
 * `shared/reviews.test.ts` scant de client-broncode en faalt zodra er ergens
 * weer een los getal ingetypt wordt.
 *
 * BIJWERKEN
 * 1. Pas REVIEW_AANTAL aan (en zo nodig REVIEW_SCORE).
 * 2. `npm run reviews:test`
 * 3. Draai de prerender opnieuw en commit de fragmenten mee — anders blijven
 *    crawlers en AI-modellen het oude getal lezen.
 *
 * Stand per 3 september 2026, bevestigd door Max: 237 reviews, gemiddeld 4,8.
 */

/** Aantal Google-reviews. */
export const REVIEW_AANTAL = 237;

/** Gemiddelde score op een schaal van 5. */
export const REVIEW_SCORE = 4.8;

export type Taal = "nl" | "en";

/**
 * De score als tekst: "4,8" in het Nederlands, "4.8" in het Engels.
 * Nederlandse pagina's schrijven een komma; dat stond er op sommige pagina's
 * wel en op andere niet.
 */
export function reviewScoreTekst(taal: Taal = "nl"): string {
  const tekst = REVIEW_SCORE.toFixed(1);
  return taal === "nl" ? tekst.replace(".", ",") : tekst;
}

/**
 * Het aantal met het woord erbij: "237 Google reviews".
 * Werkt ongewijzigd in het Engels — "Google reviews" wordt niet vertaald.
 */
export function reviewAantalTekst(): string {
  return `${REVIEW_AANTAL} Google reviews`;
}

/** "4,8/5" of "4.8/5", voor bewijsbalken waar de schaal erbij staat. */
export function reviewScoreUitVijf(taal: Taal = "nl"): string {
  return `${reviewScoreTekst(taal)}/5`;
}
