/**
 * Huistests: berichten bundelen voor Job (WhatsApp).
 * Run met:  npx tsx shared/jobBundel.test.ts
 */
import { Bundelaar, WACHT_MS, type Deel, type Klok } from "./jobBundel";

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean) {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}`); }
}

/** Nepklok: de tijd loopt alleen als de test dat zegt. */
function nepklok() {
  let nu = 0, id = 0;
  const taken = new Map<number, { op: number; fn: () => void }>();
  const klok: Klok = {
    zet: (fn, ms) => { id++; taken.set(id, { op: nu + ms, fn }); return id; },
    wis: (t) => { taken.delete(t as number); },
  };
  async function verder(ms: number) {
    const eind = nu + ms;
    for (;;) {
      const volgende = [...taken.entries()].filter(([, t]) => t.op <= eind).sort((a, b) => a[1].op - b[1].op)[0];
      if (!volgende) break;
      taken.delete(volgende[0]);
      nu = volgende[1].op;
      volgende[1].fn();
      await new Promise((r) => setImmediate(r));
    }
    nu = eind;
    await new Promise((r) => setImmediate(r));
  }
  return { klok, verder };
}

const tekst = (t: string): Deel => ({ tekst: t, knop: false });
const knop = (t: string): Deel => ({ tekst: t, knop: true });

async function main() {
  {
    const { klok, verder } = nepklok();
    const uit: string[][] = [];
    const b = new Bundelaar<number>(async (_k, d) => { uit.push(d.map((x) => x.tekst)); }, WACHT_MS, klok);
    b.voegToe(1, tekst("3 tot 4"));
    await verder(3000);
    test("Binnen de wachttijd nog niets verwerkt", uit.length === 0 && b.wachtend(1));
    b.voegToe(1, tekst("Amsterdam"));
    await verder(5000);
    test("Wachten begint opnieuw na het tweede bericht", uit.length === 0);
    await verder(1500);
    test("Twee berichten kort na elkaar: één keer verwerkt, samen", uit.length === 1 && JSON.stringify(uit[0]) === JSON.stringify(["3 tot 4", "Amsterdam"]));
    test("Daarna niets meer in de wachtrij", !b.wachtend(1));
  }
  {
    const { klok, verder } = nepklok();
    const uit: string[][] = [];
    const b = new Bundelaar<number>(async (_k, d) => { uit.push(d.map((x) => x.tekst)); }, WACHT_MS, klok);
    b.voegToe(1, knop("Tot 25 km"));
    await verder(0);
    test("Knop gaat meteen door", uit.length === 1 && uit[0][0] === "Tot 25 km");
    b.voegToe(1, tekst("ik woon in Diemen"));
    await verder(2000);
    b.voegToe(1, knop("Ochtend"));
    await verder(0);
    test("Knop neemt wachtend getypt bericht mee", uit.length === 2 && JSON.stringify(uit[1]) === JSON.stringify(["ik woon in Diemen", "Ochtend"]));
  }
  {
    const { klok, verder } = nepklok();
    const uit: string[][] = [];
    let klaar: () => void = () => {};
    const b = new Bundelaar<number>(async (_k, d) => { uit.push(d.map((x) => x.tekst)); if (uit.length === 1) await new Promise<void>((r) => { klaar = r; }); }, WACHT_MS, klok);
    b.voegToe(1, tekst("Twee jaar bediening"));
    await verder(WACHT_MS);
    test("Eerste bericht in verwerking", uit.length === 1);
    b.voegToe(1, tekst("bij een hotel"));
    b.voegToe(1, tekst("en een restaurant"));
    await verder(WACHT_MS * 3);
    test("Tijdens het nadenken: niets dubbel verwerkt", uit.length === 1 && b.wachtend(1));
    klaar();
    await verder(0);
    await verder(WACHT_MS);
    test("Na het antwoord gaan de nieuwe berichten samen door", uit.length === 2 && JSON.stringify(uit[1]) === JSON.stringify(["bij een hotel", "en een restaurant"]));
  }
  {
    const { klok, verder } = nepklok();
    const uit: string[] = [];
    const b = new Bundelaar<number>(async (k, d) => { uit.push(`${k}:${d.map((x) => x.tekst).join("+")}`); }, WACHT_MS, klok);
    b.voegToe(1, tekst("a"));
    b.voegToe(2, tekst("b"));
    await verder(WACHT_MS);
    test("Twee kandidaten los van elkaar", uit.length === 2 && uit.includes("1:a") && uit.includes("2:b"));
  }
  {
    const { klok, verder } = nepklok();
    let n = 0;
    const b = new Bundelaar<number>(async () => { n++; if (n === 1) throw new Error("kapot"); }, WACHT_MS, klok);
    const warn = console.warn; console.warn = () => {};
    b.voegToe(1, tekst("a"));
    await verder(WACHT_MS);
    console.warn = warn;
    b.voegToe(1, tekst("b"));
    await verder(WACHT_MS);
    test("Een fout blokkeert de volgende berichten niet", n === 2 && !b.wachtend(1));
  }
  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
main();
