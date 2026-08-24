/**
 * Verstuurt één voorbeeld-event naar de Promptwatch log-endpoint en drukt de
 * response af. Bedoeld als verificatie na het instellen van de API-key:
 *
 *   npm run promptwatch:test
 *
 * Vereist de Replit Secret PROMPTWATCH_LOGS_API_KEY. Verwachte uitkomst:
 * HTTP 200 met `"success": true`. Dat het event daarna als `dropped` telt is
 * normaal — dit test-event is immers geen AI-crawlerverkeer; het gaat erom
 * dat de endpoint bereikbaar is en de key geaccepteerd wordt.
 */

const ENDPOINT = "https://logs.promptwatch.com/event";

async function main() {
  const apiKey = process.env.PROMPTWATCH_LOGS_API_KEY;
  if (!apiKey) {
    console.error(
      "PROMPTWATCH_LOGS_API_KEY is niet gezet. Voeg de key toe als Replit Secret " +
      "en draai dit script opnieuw. (De key komt via een apart, veilig kanaal " +
      "van Wrkt Digital — nooit in code of chat plakken.)",
    );
    process.exit(1);
  }

  const event = {
    timestamp: new Date().toISOString(),
    status_code: 200,
    request_method: "GET",
    request_path: "/",
    query_string: null,
    content_type: "text/html",
    client_ip: "192.0.2.1",
    hostname: "www.doehetextra.nl",
    user_agent:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.3; +https://openai.com/gptbot",
    referrer: null,
  };

  console.log("POST", ENDPOINT);
  console.log(JSON.stringify([event], null, 2));

  const antwoord = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify([event]),
    signal: AbortSignal.timeout(30_000),
  });

  const tekst = await antwoord.text();
  console.log(`\nHTTP ${antwoord.status}`);
  try {
    console.log(JSON.stringify(JSON.parse(tekst), null, 2));
  } catch {
    console.log(tekst);
  }
  process.exit(antwoord.ok ? 0 : 1);
}

main().catch((err) => {
  console.error("Netwerkfout:", err?.message ?? err);
  process.exit(1);
});
