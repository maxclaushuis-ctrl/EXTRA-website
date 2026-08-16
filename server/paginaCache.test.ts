/**
 * Unit-tests voor server/paginaCache.ts
 * Run met:  npx tsx server/paginaCache.test.ts
 *
 * Geen test-framework: print PASS/FAIL en exit non-zero bij fouten.
 * Zelfde opzet als server/redirects.test.ts.
 *
 * De klok wordt geïnjecteerd, zodat verlopen getest wordt zonder te wachten.
 */
import { TtlCache, metCache } from "./paginaCache";

let passed = 0;
let failed = 0;

function ok(label: string, voorwaarde: boolean, extra?: string) {
  if (voorwaarde) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}${extra ? `\n      ${extra}` : ""}`); }
}

function eq(label: string, actual: unknown, expected: unknown) {
  const gelijk = JSON.stringify(actual) === JSON.stringify(expected);
  ok(label, gelijk, gelijk ? undefined : `actual: ${JSON.stringify(actual)}  expected: ${JSON.stringify(expected)}`);
}

/** Verstelbare klok. */
function klok(start = 1_000) {
  let t = start;
  return { nu: () => t, verder: (ms: number) => { t += ms; } };
}

console.log("\n— TtlCache: bewaren en teruggeven —");
{
  const k = klok();
  const c = new TtlCache<string>({ ttlMs: 1000, max: 10, nu: k.nu });
  eq("onbekende sleutel geeft undefined", c.get("a"), undefined);
  c.set("a", "waarde");
  eq("bewaarde sleutel komt terug", c.get("a"), "waarde");
  eq("grootte klopt", c.grootte, 1);
  c.set("a", "nieuwer");
  eq("overschrijven werkt", c.get("a"), "nieuwer");
  eq("en levert geen tweede vakje op", c.grootte, 1);
  c.leeg();
  eq("leeg() gooit alles weg", c.grootte, 0);
}

console.log("\n— TtlCache: verlopen —");
{
  const k = klok();
  const c = new TtlCache<string>({ ttlMs: 1000, max: 10, nu: k.nu });
  c.set("a", "waarde");
  k.verder(999);
  eq("net binnen de TTL blijft geldig", c.get("a"), "waarde");
  k.verder(1);
  eq("precies op de TTL is verlopen", c.get("a"), undefined);
  eq("het vakje is ook echt opgeruimd", c.grootte, 0);
}

console.log("\n— TtlCache: bovengrens —");
{
  const k = klok();
  const c = new TtlCache<number>({ ttlMs: 10_000, max: 3, nu: k.nu });
  for (let i = 1; i <= 5; i++) c.set(`sleutel-${i}`, i);
  eq("nooit meer vakjes dan max", c.grootte, 3);
  eq("de oudste is verdwenen", c.get("sleutel-1"), undefined);
  eq("de nieuwste staat er nog", c.get("sleutel-5"), 5);
  // Een bijgewerkte sleutel schuift achteraan aan en mag niet als eerste weg.
  c.set("sleutel-3", 33);
  c.set("sleutel-6", 6);
  eq("bijgewerkte sleutel overleeft de volgende opschoning", c.get("sleutel-3"), 33);
}

console.log("\n— metCache(): ophalen gebeurt één keer —");
{
  const k = klok();
  const c = new TtlCache<{ waarde: string | undefined }>({ ttlMs: 1000, max: 10, nu: k.nu });
  let aanroepen = 0;
  const ophalen = async () => { aanroepen++; return "uit de database"; };

  eq("eerste keer: waarde", await metCache(c, "slug", ophalen), "uit de database");
  eq("tweede keer: dezelfde waarde", await metCache(c, "slug", ophalen), "uit de database");
  eq("maar één databaseronde", aanroepen, 1);

  k.verder(1001);
  await metCache(c, "slug", ophalen);
  eq("na verlopen weer een ronde", aanroepen, 2);
}

console.log("\n— metCache(): 'niet gevonden' wordt ook onthouden —");
{
  const k = klok();
  const c = new TtlCache<{ waarde: string | undefined }>({ ttlMs: 1000, max: 10, nu: k.nu });
  let aanroepen = 0;
  const leeg = async () => { aanroepen++; return undefined; };

  eq("eerste keer: undefined", await metCache(c, "bestaat-niet", leeg), undefined);
  eq("tweede keer: nog steeds undefined", await metCache(c, "bestaat-niet", leeg), undefined);
  eq("en géén tweede databaseronde", aanroepen, 1);
}

console.log("\n— metCache(): een fout wordt niet onthouden —");
{
  const k = klok();
  const c = new TtlCache<{ waarde: string | undefined }>({ ttlMs: 1000, max: 10, nu: k.nu });
  let aanroepen = 0;
  const soms = async () => {
    aanroepen++;
    if (aanroepen === 1) throw new Error("database even weg");
    return "hersteld";
  };

  let gevangen = false;
  try { await metCache(c, "slug", soms); } catch { gevangen = true; }
  ok("de fout komt gewoon naar boven", gevangen);
  eq("het volgende verzoek probeert opnieuw", await metCache(c, "slug", soms), "hersteld");
  eq("twee pogingen", aanroepen, 2);
}

console.log("\n— metCache(): sleutels lopen niet door elkaar —");
{
  const k = klok();
  const c = new TtlCache<{ waarde: string | undefined }>({ ttlMs: 1000, max: 10, nu: k.nu });
  eq("a", await metCache(c, "a", async () => "artikel a"), "artikel a");
  eq("b", await metCache(c, "b", async () => "artikel b"), "artikel b");
  eq("a blijft a", await metCache(c, "a", async () => "fout"), "artikel a");
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
