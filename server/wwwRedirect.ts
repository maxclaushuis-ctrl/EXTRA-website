/**
 * APEX NAAR WWW — één domein, één sitemap.
 *
 * Aanleiding: de Ahrefs-crawl van 17 augustus meldde 68 pagina's als "Page in
 * multiple sitemaps". Elke pagina stond zowel in https://doehetextra.nl/sitemap.xml
 * als in https://www.doehetextra.nl/sitemap.xml — twee sitemaps met dezelfde
 * inhoud, omdat de site op beide hostnamen gewoon antwoordt.
 *
 * Dat is geen sitemapprobleem maar een domeinprobleem: elke URL bestaat twee
 * keer. De canonical wijst al naar www, dus Google kiest waarschijnlijk goed,
 * maar crawlers verdoen er de helft van hun tijd mee en elke externe link naar
 * de apex geeft zijn waarde aan de verkeerde variant.
 *
 * Eén 301 van de apex naar www lost het in één keer op.
 *
 * BEWUST ALLEEN DE APEX
 * ---------------------
 * De controle kijkt naar exact "doehetextra.nl" en niets anders. Niet naar
 * "eindigt op doehetextra.nl", want dan zou de redirect ook afgaan op de
 * Replit-preview en op interne health checks van de deploy — en die draaien op
 * heel andere hostnamen. Een redirect die de preview onbruikbaar maakt, merk je
 * pas als je hem nodig hebt.
 */

/** De hostnamen die naar www moeten. Poortnummers worden apart afgehandeld. */
const APEX = 'doehetextra.nl';
const DOEL_HOST = 'www.doehetextra.nl';

/**
 * Geeft de volledige doel-URL terug, of null als er niets hoeft te gebeuren.
 *
 * `url` is het pad inclusief query-string, zoals Express het in req.url zet.
 * `protocol` is de waarde van de x-forwarded-proto-header — zie hieronder.
 *
 * IN ÉÉN SPRONG, NIET IN TWEE
 * ---------------------------
 * De Ahrefs-crawl van 20 augustus meldt één redirectketen:
 *
 *     http://doehetextra.nl/  →  https://doehetextra.nl/  →  https://www.doehetextra.nl/
 *
 * Twee sprongen dus, en bij elke sprong lekt een beetje linkwaarde weg. De
 * eerste sprong (http naar https, met de apex-host intact) komt niet uit deze
 * code maar van de laag ervoor. Bereikt zo'n verzoek Express tóch — en dat
 * gebeurt zodra de proxy alleen doorstuurt in plaats van zelf te antwoorden —
 * dan kunnen we het in één keer goed doen: meteen naar https én www.
 *
 * Daarom kijkt deze functie ook naar het protocol. Alleen als de header
 * letterlijk 'http' zegt: ontbreekt hij, dan weten we het niet en doen we niets.
 * Dat laatste is belangrijk voor de Replit-preview en voor localhost, waar geen
 * proxy meekijkt en een gedwongen https-redirect de boel onbruikbaar maakt.
 */
export function wwwDoelUrl(
  host: string | undefined,
  url: string,
  protocol?: string | string[] | undefined,
): string | null {
  if (!host) return null;

  // API-verkeer nooit omleiden. Een 301 is prima voor een pagina en funest
  // voor een API: een browser volgt hem, een webhook-verzender niet. Die ziet
  // een 3xx, telt dat als mislukte aflevering en stopt na zijn retry-window.
  // Precies zo viel de WhatsApp-koppeling stil toen deze redirect live ging:
  // de webhook stond bij 360dialog op de apex geregistreerd. Voor SEO maakt
  // het niets uit -- /api staat in geen sitemap en wordt niet geindexeerd.
  const padVoorApiCheck = url && url.startsWith('/') ? url : `/${url || ''}`;
  if (padVoorApiCheck === '/api' || padVoorApiCheck.startsWith('/api/')) return null;

  // Poort eraf (localhost-achtige situaties en proxies die :443 meesturen).
  const hostnaam = String(host).toLowerCase().split(':')[0];

  // Een proxy mag meerdere waarden meesturen ("http, https"); de eerste is de
  // oorspronkelijke aanvraag van de bezoeker.
  const ruw = Array.isArray(protocol) ? protocol[0] : protocol;
  const proto = typeof ruw === 'string' ? ruw.split(',')[0].trim().toLowerCase() : '';

  const isApex = hostnaam === APEX;
  const isWww = hostnaam === DOEL_HOST;
  const onbeveiligd = proto === 'http';

  // Alleen onze eigen twee hostnamen. Nooit de preview, nooit localhost, nooit
  // een hostnaam die er alleen op lijkt.
  if (!isApex && !isWww) return null;

  // www over https is de eindbestemming: niets doen, anders krijg je een lus.
  if (isWww && !onbeveiligd) return null;

  const pad = url && url.startsWith('/') ? url : `/${url || ''}`;
  return `https://${DOEL_HOST}${pad}`;
}
