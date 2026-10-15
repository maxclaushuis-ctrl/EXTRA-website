/**
 * Tests voor het uitlezen van het bezoekers-IP uit X-Forwarded-For.
 * Draaien: npm run clientip:test
 */
import { clientIp, lijktOpIpAdres, normaliseerIp, ontleedForwardedFor } from "./clientIp";

let gefaald = 0, geslaagd = 0;

function eq(omschrijving: string, gekregen: unknown, verwacht: unknown) {
  const gelijk = JSON.stringify(gekregen) === JSON.stringify(verwacht);
  if (!gelijk) {
    console.log(`    verwacht: ${JSON.stringify(verwacht)}`);
    console.log(`    gekregen: ${JSON.stringify(gekregen)}`);
    gefaald++; console.log(`  ✗ ${omschrijving}`);
  } else { geslaagd++; console.log(`  ✓ ${omschrijving}`); }
}
function ok(omschrijving: string, waar: boolean) {
  if (waar) { geslaagd++; console.log(`  ✓ ${omschrijving}`); }
  else { gefaald++; console.log(`  ✗ ${omschrijving}`); }
}

console.log("\nHERKENNEN VAN EEN IP-ADRES\n");

ok("gewoon ipv4", lijktOpIpAdres("192.0.2.10"));
ok("ipv6", lijktOpIpAdres("2a03:2880:f12f:83:face:b00c::25de"));
ok("ipv6 tussen blokhaken", lijktOpIpAdres("[2a03:2880::1]"));
ok("spaties eromheen", lijktOpIpAdres("  192.0.2.10 "));
ok("lege string niet", !lijktOpIpAdres(""));
ok("'unknown' niet", !lijktOpIpAdres("unknown"));
ok("getal boven 255 niet", !lijktOpIpAdres("999.1.1.1"));
ok("hostnaam niet", !lijktOpIpAdres("bot.openai.com"));

eq("ipv4 in ipv6-jas wordt kaal", normaliseerIp("::ffff:66.249.66.1"), "66.249.66.1");
eq("gewoon adres blijft", normaliseerIp("66.249.66.1"), "66.249.66.1");

console.log("\nX-FORWARDED-FOR ONTLEDEN\n");

eq("één adres", ontleedForwardedFor("203.0.113.9"), ["203.0.113.9"]);
eq(
  "bezoeker gevolgd door google",
  ontleedForwardedFor("203.0.113.9, 35.191.0.5"),
  ["203.0.113.9", "35.191.0.5"],
);
eq("spaties maken niet uit", ontleedForwardedFor("203.0.113.9,35.191.0.5"), ["203.0.113.9", "35.191.0.5"]);
eq("meerdere headers worden samengevoegd", ontleedForwardedFor(["203.0.113.9", "35.191.0.5"]), ["203.0.113.9", "35.191.0.5"]);
eq("onzin valt eruit", ontleedForwardedFor("unknown, 203.0.113.9"), ["203.0.113.9"]);
eq("ontbrekende header geeft niets", ontleedForwardedFor(undefined), []);
eq("lege header geeft niets", ontleedForwardedFor(""), []);

console.log("\nHET BEZOEKERSADRES KIEZEN\n");

eq(
  "de bot, niet de load balancer — dit is de hele bug",
  clientIp("23.98.142.176, 35.191.0.5", "35.191.0.5", "169.254.1.1"),
  "23.98.142.176",
);
eq(
  "drie hops: nog steeds de voorste",
  clientIp("23.98.142.176, 35.191.0.5, 10.0.0.1"),
  "23.98.142.176",
);
eq("zonder header valt hij terug op express", clientIp(undefined, "203.0.113.9"), "203.0.113.9");
eq("onzin in de header, dan express", clientIp("unknown", "203.0.113.9"), "203.0.113.9");
eq("daarna de socket", clientIp(undefined, undefined, "203.0.113.9"), "203.0.113.9");
eq("niets bruikbaars geeft leeg", clientIp(undefined, undefined, undefined), "");
eq("express met ipv6-jas wordt kaal", clientIp(undefined, "::ffff:203.0.113.9"), "203.0.113.9");

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald\n`);
process.exit(gefaald > 0 ? 1 : 0);
