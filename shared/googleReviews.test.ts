/**
 * Huistests voor shared/googleReviews.ts. Draaien met: npm run googlereviews:test
 */
import {
  sterrenUitGoogle,
  oorspronkelijkeTekst,
  naarRij,
  selecteerMedewerkers,
  publiekeStand,
  scoreTekst,
  toestemmingsUrl,
  reviewsPad,
  isCategorie,
  MIN_STERREN_PUBLIEK,
  type OpgeslagenReview,
} from "./googleReviews";
import { REVIEW_AANTAL, REVIEW_SCORE } from "./reviews";

let gefaald = 0;
let geslaagd = 0;

function ok(omschrijving: string, waar: boolean) {
  if (waar) {
    geslaagd++;
    console.log(`  ✓ ${omschrijving}`);
  } else {
    gefaald++;
    console.log(`  ✗ ${omschrijving}`);
  }
}

function eq(omschrijving: string, gekregen: unknown, verwacht: unknown) {
  const gelijk = JSON.stringify(gekregen) === JSON.stringify(verwacht);
  if (!gelijk) {
    console.log(`    verwacht: ${JSON.stringify(verwacht)}`);
    console.log(`    gekregen: ${JSON.stringify(gekregen)}`);
  }
  ok(omschrijving, gelijk);
}

console.log("\nGOOGLE-REVIEWS\n");

console.log("Sterren");
eq("FIVE wordt 5", sterrenUitGoogle("FIVE"), 5);
eq("ONE wordt 1", sterrenUitGoogle("ONE"), 1);
eq("kleine letters werken ook", sterrenUitGoogle("four"), 4);
eq("onbekende waarde wordt null", sterrenUitGoogle("STAR_RATING_UNSPECIFIED"), null);
eq("ontbrekend wordt null", sterrenUitGoogle(undefined), null);

console.log("\nVertaalde reviews");
eq(
  "bij een vertaling blijft de oorspronkelijke tekst over",
  oorspronkelijkeTekst("(Translated by Google) Great agency\n\n(Original)\nTop uitzendbureau"),
  "Top uitzendbureau",
);
eq("zonder vertaling blijft de tekst gelijk", oorspronkelijkeTekst("Fijn team"), "Fijn team");
eq("alleen het vertaalvoorvoegsel gaat eraf", oorspronkelijkeTekst("(Translated by Google) Nice"), "Nice");
eq("geen tekst wordt een lege string", oorspronkelijkeTekst(undefined), "");

console.log("\nOmzetten naar een rij");
const rij = naarRij({
  reviewId: "abc",
  reviewer: { displayName: " Sanne de Vries ", profilePhotoUrl: "https://foto" },
  starRating: "FIVE",
  comment: "Leuke klussen",
  createTime: "2026-09-01T10:00:00Z",
  updateTime: "2026-09-02T10:00:00Z",
  reviewReply: { comment: "Dank je!" },
});
eq("id, naam, sterren en tekst", [rij?.reviewId, rij?.auteur, rij?.sterren, rij?.tekst], ["abc", "Sanne de Vries", 5, "Leuke klussen"]);
eq("de reactie van EXTRA gaat mee", rij?.reactie, "Dank je!");
ok("de datum is een echte datum", rij?.geplaatstOp instanceof Date);
eq("id uit het name-pad als reviewId ontbreekt", naarRij({ name: "accounts/1/locations/2/reviews/xyz" })?.reviewId, "xyz");
eq("zonder id geen rij", naarRij({ comment: "x" }), null);
const anoniem = naarRij({ reviewId: "q", reviewer: { displayName: "Echte Naam", profilePhotoUrl: "f", isAnonymous: true } });
eq("anonieme review toont geen naam of foto", [anoniem?.auteur, anoniem?.auteurFoto], ["Anonieme Google-gebruiker", null]);
eq("een ongeldige datum wordt null", naarRij({ reviewId: "d", createTime: "geen datum" })?.geplaatstOp, null);

console.log("\nSelectie voor de tab Medewerkers");
const r = (o: Partial<OpgeslagenReview>): OpgeslagenReview => ({
  auteur: "A", auteurFoto: null, sterren: 5, tekst: "tekst", categorie: "medewerker", geplaatstOp: "2026-01-01T00:00:00Z", ...o,
});
const lijst = [
  r({ auteur: "oud", geplaatstOp: "2025-01-01T00:00:00Z" }),
  r({ auteur: "nieuw", geplaatstOp: "2026-09-01T00:00:00Z" }),
  r({ auteur: "klant", categorie: "klant" }),
  r({ auteur: "verborgen", categorie: "verborgen" }),
  r({ auteur: "onbekend", categorie: "onbekend" }),
  r({ auteur: "drie sterren", sterren: 3 }),
  r({ auteur: "vier sterren", sterren: 4, geplaatstOp: "2026-05-01T00:00:00Z" }),
  r({ auteur: "geen tekst", tekst: "   " }),
  r({ auteur: "geen sterren", sterren: null }),
];
const gekozen = selecteerMedewerkers(lijst);
eq("alleen medewerkers met minimaal vier sterren en tekst, nieuwste eerst", gekozen.map((x) => x.naam), ["nieuw", "vier sterren", "oud"]);
eq("de drempel is vier sterren", MIN_STERREN_PUBLIEK, 4);
eq("het maximum werkt", selecteerMedewerkers(lijst, 1).map((x) => x.naam), ["nieuw"]);
eq("de datum gaat mee als ISO", gekozen[0].datum, "2026-09-01T00:00:00.000Z");
eq("een lege lijst geeft een lege lijst", selecteerMedewerkers([]), []);

console.log("\nScore en aantal");
eq("een stand van Google wint", publiekeStand({ gemiddelde: 4.76, totaal: 241 }), { score: 4.8, aantal: 241, bron: "google" });
eq("zonder koppeling het vaste getal", publiekeStand(null), { score: REVIEW_SCORE, aantal: REVIEW_AANTAL, bron: "vast" });
eq("nul reviews is geen bruikbare stand", publiekeStand({ gemiddelde: 5, totaal: 0 }).bron, "vast");
eq("een onmogelijke score is geen bruikbare stand", publiekeStand({ gemiddelde: 7, totaal: 10 }).bron, "vast");
eq("ontbrekende velden geven het vaste getal", publiekeStand({ gemiddelde: null, totaal: null }).bron, "vast");
eq("score in het Nederlands", scoreTekst(4.8), "4,8");
eq("score in het Engels", scoreTekst(4.8, "en"), "4.8");

console.log("\nKoppelen");
const url = new URL(toestemmingsUrl("cid", "https://www.doehetextra.nl/api/admin/google/callback", "st"));
eq("naar de toestemmingspagina van Google", url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
eq("offline toegang, anders geen refresh token", url.searchParams.get("access_type"), "offline");
eq("altijd opnieuw toestemming vragen", url.searchParams.get("prompt"), "consent");
eq("alleen de Business Profile-scope", url.searchParams.get("scope"), "https://www.googleapis.com/auth/business.manage");
eq("state gaat mee tegen vervalsing", url.searchParams.get("state"), "st");
eq("v4-pad uit account en locatie", reviewsPad("accounts/9", "locations/123"), "accounts/9/locations/123/reviews");
eq("v4-pad als de locatie al een account bevat", reviewsPad("accounts/9", "accounts/9/locations/123"), "accounts/9/locations/123/reviews");

console.log("\nCategorieën");
ok("medewerker is een categorie", isCategorie("medewerker"));
ok("iets anders niet", !isCategorie("admin"));

console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald\n`);
process.exit(gefaald > 0 ? 1 : 0);
