/**
 * Pure logica voor WhatsApp-templates: geen database, geen provider-calls.
 * Losgetrokken uit templates.ts zodat dit bestand zonder DATABASE_URL
 * unit-test-baar is (zelfde reden waarom phone.ts los staat van storage.ts) —
 * zie server/whatsapp/__tests__/templates.test.ts.
 */
import type { WhatsappTemplate } from '@shared/schema';

export const TEMPLATE_CATEGORIES = ['UTILITY', 'MARKETING'] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

// ─── Slug ────────────────────────────────────────────────────────────────────

/** lowercase, a-z/0-9/underscore, max 60 tekens — komt overeen met Meta's regels voor template-namen. */
export function slugify(input: string): string {
  const base = (input || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // diakrieten weg
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return base || 'template';
}

// ─── Variabelen ──────────────────────────────────────────────────────────────

/**
 * Leest {naam}-placeholders uit de bodytekst, in eerste-voorkomen-volgorde,
 * gededupliceerd. Deze volgorde bepaalt de positionele mapping naar Meta's
 * {{1}}, {{2}}, ... — zie toProviderBodyText().
 */
export function extractVariables(body: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const re = /\{(\w+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body || '')) !== null) {
    const name = m[1];
    if (!seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

/** Zet {naam}-placeholders om naar {{1}}, {{2}}, ... op basis van de variables-volgorde. */
export function toProviderBodyText(body: string, variables: string[]): string {
  let result = body || '';
  variables.forEach((name, i) => {
    result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), `{{${i + 1}}}`);
  });
  return result;
}

// ─── Statusvertaling ─────────────────────────────────────────────────────────

/**
 * Vertaalt de ruwe providerstatus naar onze 3 na-indienen-statussen. Wordt
 * uitsluitend aangeroepen vanuit syncTemplateStatus() in templates.ts — nooit
 * handmatig gezet.
 */
export function mapProviderStatus(raw: string | null | undefined): 'in_review' | 'approved' | 'rejected' {
  const v = (raw || '').toLowerCase();
  if (v.includes('approv')) return 'approved';
  if (v.includes('reject') || v.includes('disabl')) return 'rejected';
  return 'in_review'; // submitted | pending | in_appeal | onbekend
}

// ─── Validatie ───────────────────────────────────────────────────────────────

export interface ValidationError { field: string; message: string; }

export function validateButtonFields(args: {
  buttonText?: string | null;
  buttonUrl?: string | null;
}): ValidationError[] {
  const errors: ValidationError[] = [];
  const hasText = !!(args.buttonText && args.buttonText.trim());
  const hasUrl = !!(args.buttonUrl && args.buttonUrl.trim());
  if (!hasText && !hasUrl) return errors; // geen knop — toegestaan

  if (!hasText) {
    errors.push({ field: 'buttonText', message: 'Knoptekst is verplicht als er een knop-URL is ingevuld' });
  } else if (args.buttonText!.trim().length > 25) {
    errors.push({ field: 'buttonText', message: 'Knoptekst mag maximaal 25 tekens zijn (Meta-limiet)' });
  }
  if (!hasUrl) {
    errors.push({ field: 'buttonUrl', message: 'Knop-URL is verplicht als er een knoptekst is ingevuld' });
  } else if (!/^https:\/\//i.test(args.buttonUrl!.trim())) {
    errors.push({ field: 'buttonUrl', message: 'Knop-URL moet met https:// beginnen' });
  }
  return errors;
}

/** Alles wat vóór indienen bij de provider moet kloppen — server is hier altijd de autoriteit, de UI doet alleen een voorcheck. */
export function validateBeforeSubmit(tpl: WhatsappTemplate): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!tpl.name?.trim()) errors.push({ field: 'name', message: 'Naam is verplicht' });
  if (!tpl.bodyPreview?.trim()) errors.push({ field: 'bodyPreview', message: 'Bodytekst is verplicht' });
  if (!TEMPLATE_CATEGORIES.includes(tpl.category as TemplateCategory)) {
    errors.push({ field: 'category', message: 'Categorie moet UTILITY of MARKETING zijn' });
  }

  const variables: string[] = Array.isArray(tpl.variables) ? (tpl.variables as string[]) : [];
  const exampleValues = (tpl.exampleValues as Record<string, string>) || {};
  for (const v of variables) {
    if (!exampleValues[v] || !String(exampleValues[v]).trim()) {
      errors.push({ field: `exampleValues.${v}`, message: `Voorbeeldwaarde voor {${v}} is verplicht vóór indienen` });
    }
  }

  errors.push(...validateButtonFields({ buttonText: tpl.buttonText, buttonUrl: tpl.buttonUrl }));
  if (tpl.buttonDynamic && tpl.buttonUrl && (!tpl.buttonExample || !tpl.buttonExample.trim())) {
    errors.push({ field: 'buttonExample', message: 'Voorbeeldwaarde voor de dynamische knop is verplicht vóór indienen' });
  }
  return errors;
}

// ─── Component-opbouw voor de provider-payload ─────────────────────────────

/**
 * Bouwt de components-array voor waProvider.submitTemplate(), in de vorm die
 * zowel Meta als 360dialog verwachten: BODY (met example.body_text) en
 * optioneel één BUTTONS-component met een enkele URL-knop. Geen header/footer/
 * media — dat is bewust buiten scope, net als in het blauwdruk-project.
 */
export function buildTemplateComponents(tpl: WhatsappTemplate): any[] {
  const variables: string[] = Array.isArray(tpl.variables) ? (tpl.variables as string[]) : [];
  const exampleValues = (tpl.exampleValues as Record<string, string>) || {};
  const components: any[] = [];

  const bodyComponent: any = { type: 'BODY', text: toProviderBodyText(tpl.bodyPreview, variables) };
  if (variables.length > 0) {
    bodyComponent.example = { body_text: [variables.map(v => exampleValues[v] ?? '')] };
  }
  components.push(bodyComponent);

  if (tpl.buttonText && tpl.buttonUrl) {
    const button: any = { type: 'URL', text: tpl.buttonText, url: tpl.buttonUrl };
    // Bij een dynamische URL is `example` de kale variabelewaarde (het stuk ná
    // de vaste prefix), NIET de volledige URL — zelfde vorm als de body-example.
    if (tpl.buttonDynamic && tpl.buttonExample) button.example = [tpl.buttonExample];
    components.push({ type: 'BUTTONS', buttons: [button] });
  }

  return components;
}
