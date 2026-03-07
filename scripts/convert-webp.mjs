import sharp from "sharp";
import { statSync, existsSync } from "fs";
import { dirname } from "path";

const images = [
  "attached_assets/hero-background.png",
  "attached_assets/Chef_1771833440047.png",
  "attached_assets/Horecamedewerker_1771836004844.png",
  "attached_assets/Front-office_1771842809388.png",
  "attached_assets/Housekeeping_1771842919384.png",
  "attached_assets/JBL_1771872665358.png",
  "attached_assets/Padelracket_1771872665358.png",
  "attached_assets/Pathe_1771872665358.png",
  "attached_assets/Dinerbon_1771872665358.png",
  "attached_assets/airtag_1771872665358.png",
  "attached_assets/Museumjaarkaart_1771872665358.png",
  "attached_assets/Airpods_1771872665358.png",
  "attached_assets/Gig_1771872665358.png",
  "attached_assets/IMG_8971_1772395165096.png",
  "attached_assets/Logo_amrath_1771267205959.png",
  "attached_assets/Logo_FcUtrecht_1771267205959.png",
  "attached_assets/Logo_funda_1771267205959.png",
  "attached_assets/Logo_H'art-museum_1771267205959.png",
  "attached_assets/Logo_hetepeper_1771267205959.png",
  "attached_assets/Logo_Hilton_1771267205959.png",
  "attached_assets/Logo_Marriott_1771267205959.png",
  "attached_assets/Logo_select-catering_1771267205959.png",
  "attached_assets/Logo-Appel_1771267205959.png",
  "attached_assets/EXTRA_LOGO_WIT_1771406959468.png",
  "attached_assets/X_patroon_1771260543289.png",
  "attached_assets/EXTRA_app_1772394156269.png",
  "attached_assets/EXTRA_app_1772394156269.png",
];

let totalSaved = 0;

for (const img of images) {
  if (!existsSync(img)) {
    console.log(`SKIP (not found): ${img}`);
    continue;
  }
  const webp = img.replace(".png", ".webp");
  try {
    await sharp(img).webp({ quality: 82, effort: 4 }).toFile(webp);
    const orig = statSync(img).size;
    const newSize = statSync(webp).size;
    const saved = orig - newSize;
    totalSaved += saved;
    const name = img.split("/").pop();
    console.log(`${name}: ${Math.round(orig/1024)}KB → ${Math.round(newSize/1024)}KB (${Math.round((1-newSize/orig)*100)}% kleiner)`);
  } catch (e) {
    console.error(`FOUT ${img}: ${e.message}`);
  }
}

console.log(`\nTotaal bespaard: ${Math.round(totalSaved/1024)}KB (${Math.round(totalSaved/1024/1024*10)/10}MB)`);
