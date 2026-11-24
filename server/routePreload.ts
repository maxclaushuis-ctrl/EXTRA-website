/**
 * PAGINACODE ALVAST LADEN (PageSpeed, mobiel)
 *
 * Elke pagina is een losse JavaScript-chunk (lazy route in client/src/App.tsx).
 * Zonder hulp ontdekt de browser die chunk pas nadat index.js binnen is en
 * draait: eerst index.js downloaden, dan pas de pagina zelf. Op een trage
 * mobiele verbinding is dat een hele extra ronde voordat de eerste foto staat
 * (Largest Contentful Paint).
 *
 * Hier zoekt de server bij het opgevraagde pad de chunk van die pagina op in
 * het Vite-manifest (dist/public/.vite/manifest.json) en zet hij er
 * <link rel="modulepreload"> en <link rel="preload" as="style"> voor in de
 * <head>. De browser haalt de pagina dan tegelijk met index.js op. Er
 * verandert niets aan wat er draait of hoe het eruitziet: dezelfde bestanden,
 * alleen eerder opgehaald.
 *
 * Geen manifest of onbekend pad: dan komt er niets bij, precies zoals voorheen.
 * Puur, getest in server/routePreload.test.ts.
 */

export interface ManifestChunk {
  file: string;
  src?: string;
  isEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
}
export type ViteManifest = Record<string, ManifestChunk>;

/** Pagina's met een eigen component; de rest van de publieke pagina's is een fragmentpagina. */
const VASTE_PAGINAS: [RegExp, string][] = [
  [/^\/$/, "src/pages/d3/Home.tsx"],
  [/^\/blog(\/[^/]+)?$/, "src/pages/d3/Blog.tsx"],
  [/^\/vacatures$/, "src/pages/Vacatures.tsx"],
  [/^\/vacatures\/[^/]+$/, "src/pages/VacatureDetail.tsx"],
  [/^\/(personeelsaanvraag|aanvraag-ontvangen)$/, "src/pages/d3/Aanvraag.tsx"],
  [/^\/(aanmelden|en\/apply)$/, "src/pages/d3/Aanmelden.tsx"],
];

/**
 * De manifest-sleutels van de pagina op dit pad. Fragmentpagina's volgen één
 * regel: /hotels laadt paginas/hotels.ts, /en/about laadt paginas/en-about.ts
 * (zie maakFragmentRoute; de test controleert dat dit voor alle routes klopt).
 */
export function paginaSleutels(pad: string, manifest: ViteManifest): string[] {
  const p = pad.length > 1 ? pad.replace(/\/+$/, "").toLowerCase() : pad;
  for (const [patroon, sleutel] of VASTE_PAGINAS) {
    if (patroon.test(p)) return manifest[sleutel] ? [sleutel] : [];
  }
  const naam = p.replace(/^\//, "").replace(/\//g, "-");
  const fragment = `src/design3/paginas/${naam}.ts`;
  if (!naam || !manifest[fragment]) return [];
  return manifest["src/design3/Fragment.tsx"] ? ["src/design3/Fragment.tsx", fragment] : [fragment];
}

/** Alle chunks die het entry-script (index.html) al statisch laadt: die staan al in de HTML. */
function alGeladen(manifest: ViteManifest): Set<string> {
  const klaar = new Set<string>();
  const loop = (sleutel: string) => {
    if (klaar.has(sleutel) || !manifest[sleutel]) return;
    klaar.add(sleutel);
    for (const i of manifest[sleutel].imports ?? []) loop(i);
  };
  for (const [sleutel, c] of Object.entries(manifest)) if (c.isEntry) loop(sleutel);
  return klaar;
}

const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * De <link>-tags voor deze pagina: de chunk zelf, alles wat hij statisch
 * importeert (behalve wat index.html al laadt) en hun CSS.
 */
export function preloadTags(pad: string, manifest: ViteManifest): string {
  const sleutels = paginaSleutels(pad, manifest);
  if (!sleutels.length) return "";
  const entry = alGeladen(manifest);
  const js: string[] = [];
  const css: string[] = [];
  const gezien = new Set<string>();
  const loop = (sleutel: string) => {
    if (gezien.has(sleutel) || entry.has(sleutel)) return;
    const c = manifest[sleutel];
    if (!c) return;
    gezien.add(sleutel);
    if (c.file.endsWith(".js")) js.push(c.file);
    for (const bestand of c.css ?? []) if (!css.includes(bestand)) css.push(bestand);
    for (const i of c.imports ?? []) loop(i);
  };
  for (const s of sleutels) loop(s);
  return [
    ...css.map((f) => `<link rel="preload" as="style" href="/${attr(f)}">`),
    ...js.map((f) => `<link rel="modulepreload" crossorigin href="/${attr(f)}">`),
  ].join("\n");
}

/** Zet de tags vlak voor </head>. Zonder tags blijft de HTML ongewijzigd. */
export function voegPreloadToe(html: string, tags: string): string {
  return tags ? html.replace("</head>", `${tags}\n</head>`) : html;
}
