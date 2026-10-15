/**
 * HET ECHTE IP-ADRES VAN DE BEZOEKER
 *
 * Aanleiding: Wrkt meldde op 13 oktober 2026 dat Promptwatch sinds de
 * koppeling geen enkel bezoek van OpenAI of Perplexity registreert, terwijl
 * robots.txt die bots toelaat en een handmatige test met hun user-agents
 * gewoon een 200 met de volledige pagina teruggeeft. Claude-bezoeken komen wél
 * binnen, maar als "Unverified".
 *
 * Promptwatch controleert aan de hand van het IP-adres of een bezoek echt van
 * die partij komt. Kreeg het het verkeerde adres, dan lukt die verificatie
 * nooit — precies het beeld dat Wrkt beschrijft.
 *
 * En dat is wat er gebeurde. De site draait achter de load balancer van Google
 * (Replit-deployments draaien daarop). Die zet in X-Forwarded-For het echte
 * adres van de bezoeker, gevolgd door het adres van de doorstuurregel:
 *
 *     X-Forwarded-For: <bezoeker>, <google>
 *
 * Express stond op `trust proxy: 1`. Die instelling telt vanaf rechts en slaat
 * één adres over, en levert dus het Google-adres op in plaats van dat van de
 * bezoeker. Promptwatch kreeg daardoor van elk bezoek hetzelfde Google-IP.
 *
 * Deze module pakt het adres dat de load balancer vooraan heeft gezet. Dat is
 * bewust iets anders dan req.ip repareren: req.ip wordt ook gebruikt door vijf
 * rate limiters en door de auditlogging, en dat gedrag wijzig ik niet zonder
 * eerst te meten hoe de keten er werkelijk uitziet. Daarvoor is
 * GET /api/admin/proxy-check.
 *
 * Let op: het eerste adres in X-Forwarded-For is door een bezoeker te
 * vervalsen. Dat mag hier, want deze waarde wordt uitsluitend doorgestuurd
 * naar Promptwatch, dat er zelf een verificatie op doet — een vervalst adres
 * komt daar simpelweg als niet-geverifieerd binnen. Gebruik deze functie dus
 * niet voor toegang, limieten of iets anders waar een leugen schade doet.
 */

/** Een ruwe headerwaarde kan een string of een lijst zijn. */
export type HeaderWaarde = string | string[] | undefined;

/**
 * Oppervlakkige controle: ziet dit eruit als een IP-adres?
 * Geen volledige validatie — we willen alleen voorkomen dat onzin als
 * "unknown" of een lege string als adres wordt doorgestuurd.
 */
export function lijktOpIpAdres(waarde: string): boolean {
  const kaal = waarde.trim().replace(/^\[|\]$/g, "");
  if (!kaal) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(kaal)) {
    return kaal.split(".").every(deel => Number(deel) <= 255);
  }
  // IPv6: minstens twee dubbele punten of een geldige compacte notatie.
  return /^[0-9a-f:]+$/i.test(kaal) && kaal.includes(":");
}

/** "::ffff:1.2.3.4" → "1.2.3.4". Laat al het andere ongemoeid. */
export function normaliseerIp(waarde: string): string {
  const kaal = waarde.trim().replace(/^\[|\]$/g, "");
  const m = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(kaal);
  return m ? m[1] : kaal;
}

/**
 * Alle adressen uit X-Forwarded-For, van links naar rechts, zonder poorten
 * en zonder lege waarden. Meerdere headers worden samengevoegd.
 */
export function ontleedForwardedFor(header: HeaderWaarde): string[] {
  const ruw = Array.isArray(header) ? header.join(",") : (header ?? "");
  return ruw
    .split(",")
    .map(deel => normaliseerIp(deel))
    .filter(deel => lijktOpIpAdres(deel));
}

/**
 * Het adres van de bezoeker zelf: het eerste adres dat de load balancer in
 * X-Forwarded-For heeft gezet. Is die header er niet of staat er onzin in, dan
 * valt hij terug op wat Express ervan maakt, en daarna op de socket.
 */
export function clientIp(
  forwardedFor: HeaderWaarde,
  expressIp?: string | null,
  socketIp?: string | null,
): string {
  const keten = ontleedForwardedFor(forwardedFor);
  if (keten.length > 0) return keten[0];
  // Eerst normaliseren, dan pas controleren: "::ffff:203.0.113.9" is een geldig
  // adres maar haalt de controle in die vorm niet, omdat het punten én dubbele
  // punten bevat. Andersom viel een adres uit Node (dat die vorm vaak heeft)
  // ten onrechte af.
  for (const kandidaat of [expressIp, socketIp]) {
    if (!kandidaat) continue;
    const kaal = normaliseerIp(kandidaat);
    if (lijktOpIpAdres(kaal)) return kaal;
  }
  return "";
}
