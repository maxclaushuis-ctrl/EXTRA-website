/**
 * Huistests voor de afgeschermde verzending (shared/testAfscherming.ts en de verzendpoort in server/mail.ts).
 * Draaien: npx tsx shared/testAfscherming.test.ts
 */
import { readFileSync } from "fs";
import * as afscherming from "./testAfscherming";
// Dynamisch, zodat deze test ook op een oudere versie draait en daar zichtbaar faalt in plaats van niet te laden.
const A: any = afscherming;
const isFictiefAdres: (a: string) => boolean = A.isFictiefAdres;
const bevatFictief: (to: string | string[]) => boolean = A.bevatFictief ?? ((to: string | string[]) => !!A.alleenFictief?.(to));
const metAfscherming = A.metAfscherming as undefined | (<T>(p: any, b: (m: any) => void, v: () => Promise<T>, r: T) => Promise<T>);

let geslaagd = 0, gefaald = 0;
function test(naam: string, ok: boolean, uitleg = "") {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); } else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ""}`); }
}

async function main() {
  test("fictief adres herkend", isFictiefAdres("job-test.abc@voorbeeld.nl") && isFictiefAdres("Test <JOB-TEST@Voorbeeld.NL>"));
  test("echt adres niet", !isFictiefAdres("max@doehetextra.nl") && !isFictiefAdres("iemand@voorbeeld.nl.com") && !isFictiefAdres(""));
  test("gemengde ontvangers: afgeschermd (de hele mail blijft binnen)", bevatFictief(["a@voorbeeld.nl", "max@doehetextra.nl"]) && bevatFictief("max@doehetextra.nl, a@voorbeeld.nl"));
  test("alleen echte ontvangers: niet afgeschermd", !bevatFictief("max@doehetextra.nl") && !bevatFictief(["a@doehetextra.nl", "b@doehetextra.nl"]) && !bevatFictief(""));

  // De verzendpoort zelf: tel hoe vaak de echte verzending (SendGrid) wordt aangeroepen.
  test("de verzendpoort bestaat", typeof metAfscherming === "function");
  const poort = async (to: string | string[]) => {
    let sendgrid = 0;
    const bewaard: any[] = [];
    if (!metAfscherming) return { sendgrid: -1, bewaard, uit: "geen verzendpoort" };
    const uit = await metAfscherming({ to, subject: "Test" }, (m: any) => bewaard.push(m), async () => { sendgrid++; return "verstuurd"; }, "afgeschermd");
    return { sendgrid, bewaard, uit };
  };
  const gemengd = await poort(["kandidaat@voorbeeld.nl", "max@doehetextra.nl"]);
  test("verzendpoort, gemengd: SendGrid nul keer aangeroepen, mail in het mailvenster", gemengd.sendgrid === 0 && gemengd.bewaard.length === 1 && gemengd.bewaard[0].afgeschermd === true && gemengd.uit === "afgeschermd", JSON.stringify(gemengd));
  const fictief = await poort("kandidaat@voorbeeld.nl");
  test("verzendpoort, alleen fictief: SendGrid nul keer", fictief.sendgrid === 0 && fictief.bewaard.length === 1);
  const echt = await poort("max@doehetextra.nl");
  test("verzendpoort, alleen echt: gewoon één keer verstuurd, niets afgeschermd", echt.sendgrid === 1 && echt.bewaard.length === 0 && echt.uit === "verstuurd");

  // Alle mail gaat door die poort: in server/mail.ts roept alleen de functie achter de poort SendGrid aan.
  const bron = readFileSync(new URL("../server/mail.ts", import.meta.url), "utf8");
  const blok = (naam: string) => { const i = bron.indexOf(naam); const j = bron.indexOf("\n}\n", i); return i >= 0 ? bron.slice(i, j) : ""; };
  test("server/mail.ts: sendEmail en sendEmailWithResult gaan door de verzendpoort",
    /^export async function sendEmail\(params: EmailParams\): Promise<boolean> \{\s*return metAfscherming\(/.test(blok("export async function sendEmail(")) &&
    /^export async function sendEmailWithResult\(params: EmailParams\): Promise<SendEmailResult> \{\s*return metAfscherming\(/.test(blok("export async function sendEmailWithResult(")));
  const aanroepen = (bron.match(/mailService\.send\(/g) || []).length;
  const binnenPoort = (blok("async function sendEmailEcht(").match(/mailService\.send\(/g) || []).length + (blok("async function sendEmailWithResultEcht(").match(/mailService\.send\(/g) || []).length;
  test("server/mail.ts: SendGrid wordt nergens buiten de poort aangeroepen", aanroepen > 0 && aanroepen === binnenPoort, `${aanroepen} aanroepen, ${binnenPoort} achter de poort`);

  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
main();
