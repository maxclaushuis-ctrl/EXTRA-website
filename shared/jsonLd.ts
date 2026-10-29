/**
 * Zet structured data veilig in een <script type="application/ld+json">.
 * JSON.stringify laat "<" staan, waardoor tekst als "</script>" uit het
 * scriptblok kan breken. Door "<" als < te schrijven blijft de JSON
 * gelijk voor Google, maar kan de browser het blok niet meer afsluiten.
 */
export function veiligeJsonLd(data: unknown): string {
  const json = typeof data === "string" ? data : JSON.stringify(data);
  return json.replace(/</g, "\\u003c");
}
