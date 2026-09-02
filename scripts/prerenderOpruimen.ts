/**
 * OPRUIMEN VAN VEROUDERDE PRERENDER-FRAGMENTEN.
 *
 * WAAROM DIT BESTAAT
 * ------------------
 * scripts/prerender.ts schrijft fragmenten, maar verwijderde er nooit één. Een
 * blogartikel dat uit de database verdwijnt of op concept wordt gezet, laat dus
 * zijn fragment achter in client/public/prerender/ — en dat fragment blijft
 * gewoon meegecommit en meegedeployd.
 *
 * Dat is niet alleen rommel. De achtergebleven fragmenten van /blog en van een
 * artikel bleven linken naar zeven artikelen die niet meer bestonden. Voor een
 * bezoeker met JavaScript viel dat niet op — de React-app haalt zijn lijst uit
 * /api/blog en filtert die slugs eruit. Maar juist de crawlers waarvoor die
 * fragmenten bedoeld zijn voeren geen JavaScript uit: die volgden elf interne
 * links naar zeven 404's. Ahrefs meldde het op 27 augustus 2026.
 *
 * DE REGEL
 * --------
 * Een fragment van een dynamische route (blog__…, nieuws__… of vacatures__…
 * met een slug) hoort alleen te bestaan zolang die route in deze run ook
 * daadwerkelijk gegenereerd is. Wat overblijft, hoort weg.
 *
 * Fragmenten van statische routes blijven altijd staan: die horen bij
 * shared/routeMeta.ts en check-seo.ts faalt hard als er één ontbreekt. Let op
 * het verschil tussen "blog.html" (statische route /blog — blijft) en
 * "blog__slug.html" (artikel — kan weg).
 *
 * VEILIGHEIDSKLEP
 * ---------------
 * Opruimen mag alleen als er in deze run écht dynamische routes zijn
 * geprobeerd. Draait prerender zonder databasetoegang, dan zijn er nul
 * dynamische routes en zou dit anders élk artikelfragment wissen. Zie de
 * aanroep in scripts/prerender.ts.
 */

/** Fragmentnamen die bij een dynamische route horen: prefix__slug.html */
const DYNAMISCHE_PREFIXEN = ["blog__", "nieuws__", "vacatures__"];

export function isDynamischFragment(bestandsnaam: string): boolean {
  if (!bestandsnaam.endsWith(".html")) return false;
  return DYNAMISCHE_PREFIXEN.some((p) => bestandsnaam.startsWith(p));
}

/**
 * Welke bestanden weg mogen: alle dynamische fragmenten die deze run niet
 * opnieuw heeft geschreven. Verandert niets aan de invoer en raakt nooit een
 * fragment van een statische route.
 */
export function verouderdeFragmenten(
  aanwezig: string[],
  geschreven: string[],
): string[] {
  const behouden = new Set(geschreven);
  return aanwezig
    .filter(isDynamischFragment)
    .filter((naam) => !behouden.has(naam))
    .sort();
}
