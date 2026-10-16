/**
 * Tests voor de CV-koppeling met het Planbord.
 * Draaien: npm run planbordcv:test
 */
import {
  MAX_CV_BYTES,
  bestandsnaamUitPad,
  bouwCvBlok,
  cvOphaalbaar,
  extensieUitPad,
  isObjectStoragePad,
  magOphalen,
  mimeVoorPad,
  uploadtijdUitPad,
} from "./planbordCv";

let gefaald = 0, geslaagd = 0;
function ok(o: string, w: boolean) {
  if (w) { geslaagd++; console.log(`  ✓ ${o}`); } else { gefaald++; console.log(`  ✗ ${o}`); }
}
function eq(o: string, g: unknown, v: unknown) {
  const gelijk = JSON.stringify(g) === JSON.stringify(v);
  if (!gelijk) { console.log(`    verwacht: ${JSON.stringify(v)}`); console.log(`    gekregen: ${JSON.stringify(g)}`); }
  ok(o, gelijk);
}

const PAD = "/replit-objstore-abc123/.private/cvs/1760601600000-cv_voorbeeld.pdf";
const SHA = "a".repeat(64);

console.log("\nPAD HERKENNEN\n");

ok("object storage-pad", isObjectStoragePad(PAD));
ok("oude supabase-url telt niet", !isObjectStoragePad("https://xyz.supabase.co/storage/v1/cv.pdf"));
ok("leeg telt niet", !isObjectStoragePad(""));
ok("null telt niet", !isObjectStoragePad(null));

eq("extensie", extensieUitPad(PAD), "pdf");
eq("hoofdletters worden klein", extensieUitPad("/replit-objstore-a/cvs/1-CV.PDF"), "pdf");
eq("zonder punt geen extensie", extensieUitPad("/replit-objstore-a/cvs/1-cv"), "");

console.log("\nTOEGESTANE TYPES — alleen wat de upload ook accepteert\n");

eq("pdf", mimeVoorPad("/replit-objstore-a/cvs/1-x.pdf"), "application/pdf");
eq("doc", mimeVoorPad("/replit-objstore-a/cvs/1-x.doc"), "application/msword");
eq("docx", mimeVoorPad("/replit-objstore-a/cvs/1-x.docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
eq("jpg mag niet", mimeVoorPad("/replit-objstore-a/cvs/1-x.jpg"), null);
eq("png mag niet", mimeVoorPad("/replit-objstore-a/cvs/1-x.png"), null);
eq("exe mag al helemaal niet", mimeVoorPad("/replit-objstore-a/cvs/1-x.exe"), null);

console.log("\nBESTANDSNAAM EN UPLOADTIJD UIT HET PAD\n");

eq("tijdstempel eraf", bestandsnaamUitPad(PAD), "cv_voorbeeld.pdf");
eq("zonder tijdstempel blijft de naam", bestandsnaamUitPad("/replit-objstore-a/cvs/cv.pdf"), "cv.pdf");
eq("uploadtijd uit het pad", uploadtijdUitPad(PAD), new Date(1760601600000).toISOString());
eq("geen tijdstempel geeft null", uploadtijdUitPad("/replit-objstore-a/cvs/cv.pdf"), null);
eq("onzin-tijdstempel geeft null", uploadtijdUitPad("/replit-objstore-a/cvs/0-cv.pdf"), null);

console.log("\nIS HET CV OP TE HALEN\n");

ok("gewoon pdf", cvOphaalbaar(PAD));
ok("oude supabase-url niet", !cvOphaalbaar("https://xyz.supabase.co/storage/v1/cv.pdf"));
ok("leeg niet", !cvOphaalbaar(""));
ok("null niet", !cvOphaalbaar(null));
ok("verkeerd type niet", !cvOphaalbaar("/replit-objstore-a/cvs/1-foto.jpg"));

console.log("\nHET CV-BLOK VOOR DE PAYLOAD\n");

eq(
  "volledig blok",
  bouwCvBlok(PAD, 123456, SHA),
  {
    aanwezig: true,
    bestandsnaam: "cv_voorbeeld.pdf",
    mimeType: "application/pdf",
    grootte: 123456,
    sha256: SHA,
    bijgewerkt: new Date(1760601600000).toISOString(),
  },
);
eq("geen cv geeft null", bouwCvBlok(null, 1, SHA), null);
eq("supabase-url geeft null", bouwCvBlok("https://xyz.supabase.co/cv.pdf", 1, SHA), null);
eq("verkeerd type geeft null", bouwCvBlok("/replit-objstore-a/cvs/1-x.jpg", 1, SHA), null);
eq("leeg bestand geeft null", bouwCvBlok(PAD, 0, SHA), null);
eq("te groot geeft null", bouwCvBlok(PAD, MAX_CV_BYTES + 1, SHA), null);
eq("precies 10 MB mag nog", bouwCvBlok(PAD, MAX_CV_BYTES, SHA)?.grootte, MAX_CV_BYTES);
eq("onzin-hash geeft null", bouwCvBlok(PAD, 10, "geen-hash"), null);
eq("hoofdletters in de hash geven null", bouwCvBlok(PAD, 10, "A".repeat(64)), null);

console.log("\nWIE MAG HET OPHALEN\n");

ok("aangenomen mag", magOphalen("aangenomen"));
ok("nieuw mag niet", !magOphalen("nieuw"));
ok("beoordeeld mag niet", !magOphalen("beoordeeld"));
ok("afgewezen mag niet", !magOphalen("afgewezen"));
ok("zonder status mag niet", !magOphalen(null));
ok("onbekende status mag niet", !magOphalen("in_behandeling"));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald\n`);
process.exit(gefaald > 0 ? 1 : 0);
