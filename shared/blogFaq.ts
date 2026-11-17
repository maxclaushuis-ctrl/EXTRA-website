/**
 * Haalt de veelgestelde vragen uit de HTML van een blogartikel, voor het
 * FAQPage-schema. Conventie in content/blog: een <h2> "Veelgestelde vragen",
 * daaronder per vraag een <h3> met direct daarna één <p> als antwoord.
 * Alleen die eerste alinea telt: de afsluitende alinea van het artikel staat
 * vaak direct onder het laatste antwoord en hoort er niet bij.
 */
function kaal(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function faqUitArtikel(html: string | null | undefined): [string, string][] {
  if (!html) return [];
  const kop = /<h2[^>]*>\s*Veelgestelde vragen[^<]*<\/h2>/i.exec(html);
  if (!kop) return [];
  let rest = html.slice(kop.index + kop[0].length);
  const volgende = rest.search(/<h2[\s>]/i);
  if (volgende >= 0) rest = rest.slice(0, volgende);
  const uit: [string, string][] = [];
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest))) {
    const vraag = kaal(m[1]);
    const antwoord = kaal(m[2]);
    if (vraag && antwoord) uit.push([vraag, antwoord]);
  }
  return uit;
}

/** FAQPage-schema, of undefined als er minder dan twee vragen zijn. */
export function faqPageJsonLd(items: [string, string][]): string | undefined {
  if (items.length < 2) return undefined;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  }).replace(/</g, "\\u003c");
}
