/**
 * EXPORT-DYNAMIC-CONTENT — schrijft alle gepubliceerde vacatures en
 * blogartikelen weg als één JSON-bestand.
 *
 * Bestaat om scripts/prerender.ts te kunnen draaien in een omgeving zonder
 * databasetoegang (zoals de cloud-sandbox waarin dit script ontwikkeld is):
 * daar kan geen npm run prerender met echte vacature-/blogfragmenten draaien
 * omdat er geen DATABASE_URL is, maar met deze export (die WEL met de
 * database praat, hier in Replit) kan dat alsnog — zie PRERENDER_DYNAMIC_JSON
 * in scripts/prerender.ts.
 *
 * Bevat uitsluitend content die toch al publiek op de site staat (title,
 * beschrijving, vacaturetekst, etc.) — geen inloggegevens, geen persoons- of
 * kandidaatgegevens.
 *
 * Draaien met: npx tsx scripts/export-dynamic-content.ts
 * Schrijft naar: dynamic-content-export.json (projectroot)
 */
import fs from "fs";
import { storage } from "../server/storage";

async function main() {
  const { posts } = await storage.getBlogPosts({ status: "published", limit: 500 });
  const { posts: vacancies } = await storage.getVacancyPosts({ status: "published", limit: 500 });
  const out = { posts, vacancies };
  fs.writeFileSync("dynamic-content-export.json", JSON.stringify(out, null, 2));
  console.log(`Geschreven naar dynamic-content-export.json: ${posts.length} blogartikelen, ${vacancies.length} vacatures.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fout:", err);
    process.exit(1);
  });
