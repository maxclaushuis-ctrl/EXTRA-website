/**
 * Huistests voor shared/aanvraagInvoer.ts. Draaien met: npm run aanvraaginvoer:test
 */
import { controleerAanvraag } from "./aanvraagInvoer";

let gefaald = 0;
let geslaagd = 0;
function ok(omschrijving: string, waar: boolean) {
  if (waar) { geslaagd++; console.log(`  ✓ ${omschrijving}`); }
  else { gefaald++; console.log(`  ✗ ${omschrijving}`); }
}

console.log("\nPERSONEELSAANVRAAG CONTROLEREN\n");

const volledig = { companyName: "Hotel Test", contactName: "Sanne", email: "sanne@hotel.nl", phone: "06 12 34 56 78" };
ok("volledig formulier met alle velden is goed", controleerAanvraag(volledig).ok);
ok("volledig formulier zonder e-mail wordt geweigerd", !controleerAanvraag({ ...volledig, email: "" }).ok);
ok("terugbelformulier zonder e-mail is goed", controleerAanvraag({ ...volledig, email: undefined, bron: "terugbel" }).ok);
ok("terugbelformulier geeft een lege e-mail terug", controleerAanvraag({ ...volledig, email: undefined, bron: "terugbel" }).email === "");
ok("terugbelformulier zonder telefoon wordt geweigerd", !controleerAanvraag({ ...volledig, phone: "", bron: "terugbel" }).ok);
ok("terugbelformulier zonder bedrijfsnaam wordt geweigerd", !controleerAanvraag({ ...volledig, companyName: " ", bron: "terugbel" }).ok);
ok("een te kort telefoonnummer wordt geweigerd", !controleerAanvraag({ ...volledig, phone: "0612" }).ok);
ok("een ongeldig e-mailadres wordt geweigerd", !controleerAanvraag({ ...volledig, email: "sanne@" }).ok);
ok("spaties worden weggehaald", controleerAanvraag({ ...volledig, companyName: "  Hotel Test  " }).bedrijf === "Hotel Test");
ok("een andere bron telt niet als terugbelformulier", !controleerAanvraag({ ...volledig, email: "", bron: "iets" }).ok);
ok("niet-tekst velden worden genegeerd", !controleerAanvraag({ companyName: 5, contactName: [], phone: {}, bron: "terugbel" }).ok);

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald\n`);
process.exit(gefaald > 0 ? 1 : 0);
