/**
 * Huistests voor shared/opschoning.ts. Draaien: npm run opschoning:test
 */
import { magOpgeschoond } from "./opschoning";

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}`); }
}
const nu = new Date("2026-11-16T02:00:00Z");
const oud = "2026-10-01T10:00:00Z", vers = "2026-11-10T10:00:00Z";
const basis = { hasCv: false, status: "in_behandeling", createdAt: oud, aanmeldVersie: null };

test("oud formulier, geen cv, 30 dagen oud: opschonen zoals altijd", magOpgeschoond(basis, nu));
test("aanmeldformulier 3 wordt nooit opgeschoond", !magOpgeschoond({ ...basis, aanmeldVersie: "3" }, nu));
test("aanmeldformulier 3, ook na een jaar niet", !magOpgeschoond({ ...basis, aanmeldVersie: "3", createdAt: "2025-01-01T00:00:00Z" }, nu));
test("met cv nooit", !magOpgeschoond({ ...basis, hasCv: true }, nu));
test("jonger dan 30 dagen nooit", !magOpgeschoond({ ...basis, createdAt: vers }, nu));
test("precies 30 dagen: nog niet", !magOpgeschoond({ ...basis, createdAt: "2026-10-17T02:00:00Z" }, nu));
test("andere status nooit", ["gepland", "aangenomen", "afgewezen"].every((status) => !magOpgeschoond({ ...basis, status }, nu)));
test("zonder of met ongeldige datum nooit", !magOpgeschoond({ ...basis, createdAt: null }, nu) && !magOpgeschoond({ ...basis, createdAt: "geen datum" }, nu));
test("datum als Date werkt ook", magOpgeschoond({ ...basis, createdAt: new Date(oud) }, nu));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
process.exit(gefaald > 0 ? 1 : 0);
