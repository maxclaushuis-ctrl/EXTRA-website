/**
 * Legt bij elke build vast welke commit er gebouwd is: dist/versie.json. In de testomgeving toont
 * /api/testomgeving/status die versie, zodat je na het publiceren kunt controleren wat er echt draait.
 * Lukt git niet (geen .git in de bouwomgeving), dan staat er "onbekend".
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

function git(opdracht: string): string {
  try { return execSync(`git ${opdracht}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; }
}

const commit = git("rev-parse HEAD") || "onbekend";
const gewijzigd = git("status --porcelain --untracked-files=no").split("\n").filter(Boolean).map((r) => r.slice(3));
mkdirSync("dist", { recursive: true });
writeFileSync("dist/versie.json", JSON.stringify({ commit, kort: commit.slice(0, 7), gewijzigd, gebouwd: new Date().toISOString() }, null, 2));
console.log(`Versie vastgelegd: ${commit.slice(0, 7)}${gewijzigd.length ? ` (lokaal gewijzigd: ${gewijzigd.join(", ")})` : ""}`);
