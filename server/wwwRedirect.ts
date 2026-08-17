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
 */
export function wwwDoelUrl(host: string | undefined, url: string): string | null {
  if (!host) return null;

  // Poort eraf (localhost-achtige situaties en proxies die :443 meesturen).
  const hostnaam = String(host).toLowerCase().split(':')[0];
  if (hostnaam !== APEX) return null;

  const pad = url && url.startsWith('/') ? url : `/${url || ''}`;
  return `https://${DOEL_HOST}${pad}`;
}
