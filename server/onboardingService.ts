// ─── Onboarding verzendservice (Stap 3) ───────────────────────────────────────
// Echte verzending van onboarding mails via SendGrid, met PDF bijlagen en
// personalisatie. Gebruikt dezelfde HTML generator als de campagnemodule
// maar zónder tracking-pixel en zónder unsubscribe-link (transactioneel).

import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { sendEmail } from './mail';
import { generateEmailHTML, generateEmailPlainText, type ContactData } from './emailGenerator';
import type { OnboardingTemplate, OnboardingTemplateMetBijlagen, Employee, OnboardingBijlage } from '@shared/schema';

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'max@doehetextra.nl';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Max van EXTRA';
const MAX_TOTAAL_BIJLAGEN_BYTES = 25 * 1024 * 1024; // 25 MB SendGrid limit

const FOOTER_TEXT = 'EXTRA B.V. — Amsterdam | doehetextra.nl';

function formatNLDatum(d: Date): string {
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export type OnboardingMedewerker = Pick<Employee,
  'id' | 'firstName' | 'lastName' | 'email' | 'functie' | 'opdrachtgever' | 'language' | 'startDate'>;

function buildTags(medewerker: OnboardingMedewerker): Record<string, string> {
  const voornaam = medewerker.firstName || 'daar';
  const achternaam = medewerker.lastName || '';
  const naam = `${medewerker.firstName || ''} ${medewerker.lastName || ''}`.trim() || 'daar';
  const startdatum = medewerker.startDate ? formatNLDatum(new Date(medewerker.startDate as any)) : '';
  return {
    '{{voornaam}}': voornaam,
    '{{achternaam}}': achternaam,
    '{{naam}}': naam,
    '{{functie}}': medewerker.functie || '',
    '{{opdrachtgever}}': medewerker.opdrachtgever || '',
    '{{startdatum}}': startdatum,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function vervangTags(text: string, medewerker: OnboardingMedewerker): string {
  const tags = buildTags(medewerker);
  let out = text || '';
  for (const [tag, value] of Object.entries(tags)) {
    out = out.replace(new RegExp(escapeRegex(tag), 'gi'), value);
  }
  return out;
}

function contactDataVoor(medewerker: OnboardingMedewerker): ContactData {
  return {
    voornaam: medewerker.firstName || '',
    achternaam: medewerker.lastName || '',
    naam: `${medewerker.firstName || ''} ${medewerker.lastName || ''}`.trim(),
    bedrijf: medewerker.opdrachtgever || '',
    company: medewerker.opdrachtgever || '',
    taal: (medewerker.language || '').toLowerCase().includes('engels') ? 'en' : 'nl',
    email: medewerker.email || '',
    id: medewerker.id,
  };
}

export async function genereerOnboardingHTML(
  template: OnboardingTemplate,
  medewerker: OnboardingMedewerker
): Promise<string> {
  const personalisedContent = vervangTags(template.content || '', medewerker);
  const contact = contactDataVoor(medewerker);

  // Geen tracking pixel, geen unsubscribe link (transactioneel)
  let html = generateEmailHTML(personalisedContent, contact, undefined, undefined, undefined);

  // Vervang eventuele unsubscribe-fragmenten die de generator standaard zou kunnen toevoegen
  html = html.replace(/Uitschrijven|Unsubscribe/gi, '');

  // Footer wordt nu door generateEmailHTML zelf gerenderd (EXTRA-shell) — geen dubbele footer toevoegen
  return html;
}

export function genereerOnboardingPlainText(
  template: OnboardingTemplate,
  medewerker: OnboardingMedewerker
): string {
  const personalisedContent = vervangTags(template.content || '', medewerker);
  const contact = contactDataVoor(medewerker);
  const text = generateEmailPlainText(personalisedContent, contact, undefined);
  return `${text}\n\n---\n${FOOTER_TEXT}\n`;
}

export type OnboardingAttachment = {
  naam: string;
  bestandsnaam: string;
  content: string;
  type: string;
  disposition: string;
  bestandsgrootte: number;
};

export async function haalBijlagenOp(
  template: OnboardingTemplateMetBijlagen
): Promise<{ attachments: OnboardingAttachment[]; ontbrekend: string[] }> {
  const attachments: OnboardingAttachment[] = [];
  const ontbrekend: string[] = [];

  for (const b of template.bijlagen || []) {
    const absPath = path.isAbsolute(b.bestandspad)
      ? b.bestandspad
      : path.resolve(process.cwd(), b.bestandspad);
    try {
      const data = await fs.promises.readFile(absPath);
      attachments.push({
        naam: b.naam,
        bestandsnaam: b.bestandsnaam,
        content: data.toString('base64'),
        type: 'application/pdf',
        disposition: 'attachment',
        bestandsgrootte: data.length,
      });
    } catch {
      ontbrekend.push(b.naam);
    }
  }

  return { attachments, ontbrekend };
}

export function controleerBijlagenGrootte(bijlagen: OnboardingAttachment[]):
  { geldig: true } | { geldig: false; melding: string } {
  const totaal = bijlagen.reduce((s, b) => s + b.bestandsgrootte, 0);
  if (totaal > MAX_TOTAAL_BIJLAGEN_BYTES) {
    return {
      geldig: false,
      melding: `Bijlagen zijn te groot (${(totaal / 1024 / 1024).toFixed(1)} MB). Maximum is 25 MB. Verwijder bijlagen of verklein de bestanden.`,
    };
  }
  return { geldig: true };
}

export type VerzendResult = {
  success: true;
  verstuurdOp: Date;
  templateNaam: string;
  bijlagenCount: number;
  ontbrekendeBijlagen: string[];
};

export async function verstuurOnboardingMail(
  medewerkerId: number,
  templateId: number,
  sentBy: string = 'handmatig'
): Promise<VerzendResult> {
  const medewerker = await storage.getEmployee(medewerkerId);
  if (!medewerker) throw new Error('Medewerker niet gevonden');
  if (!medewerker.email) throw new Error('Medewerker heeft geen e-mailadres. Voeg eerst een e-mailadres toe.');

  const template = await storage.getOnboardingTemplate(templateId);
  if (!template) throw new Error('Template niet gevonden');
  if (!template.content || !template.content.trim()) {
    throw new Error(`Template '${template.naam}' heeft nog geen e-mailinhoud. Maak de template eerst op via de e-mail builder.`);
  }
  if (!template.actief) {
    throw new Error(`Template '${template.naam}' is niet actief.`);
  }

  const html = await genereerOnboardingHTML(template, medewerker);
  const text = genereerOnboardingPlainText(template, medewerker);
  const onderwerp = vervangTags(template.onderwerp || '', medewerker) || `Welkom bij EXTRA, ${medewerker.firstName || ''}`;

  const { attachments, ontbrekend } = await haalBijlagenOp(template);
  const sizeCheck = controleerBijlagenGrootte(attachments);
  if (!sizeCheck.geldig) throw new Error(sizeCheck.melding);

  const ok = await sendEmail({
    to: medewerker.email,
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    subject: onderwerp,
    html,
    text,
    attachments: attachments.map(a => ({
      content: a.content,
      filename: a.bestandsnaam,
      type: a.type,
      disposition: a.disposition,
    })),
  });

  if (!ok) {
    throw new Error('Versturen via SendGrid mislukt. Probeer opnieuw of controleer de logs.');
  }

  // Markeer + log entry (markEmployeeOnboardingSent maakt automatisch een log met status 'verzonden')
  await storage.markEmployeeOnboardingSent(medewerkerId, templateId, template.naam);
  // Override sentBy als bulk
  if (sentBy !== 'handmatig') {
    // log opnieuw met bulk status
    await storage.createOnboardingLog({
      employeeId: medewerkerId,
      templateId,
      templateName: template.naam,
      sentBy,
      status: 'verzonden',
    } as any);
  }

  // Notificatie voor admin feed
  try {
    await storage.createNotificatie({
      type: 'onboarding_verzonden',
      titel: 'Onboarding mail verstuurd',
      bericht: `${medewerker.firstName} ${medewerker.lastName}${medewerker.opdrachtgever ? ` (${medewerker.opdrachtgever})` : ''} — "${template.naam}"`,
      link: `/dashboard?tab=medewerkers&id=${medewerkerId}`,
    } as any);
  } catch (err) {
    console.error('[onboarding] notificatie aanmaken mislukt:', err);
  }

  if (ontbrekend.length > 0) {
    console.warn(`[onboarding] mail verstuurd zonder ontbrekende bijlage(n): ${ontbrekend.join(', ')}`);
  }

  return {
    success: true,
    verstuurdOp: new Date(),
    templateNaam: template.naam,
    bijlagenCount: attachments.length,
    ontbrekendeBijlagen: ontbrekend,
  };
}

export async function logOnboardingFout(
  medewerkerId: number,
  templateId: number | null,
  fout: string
): Promise<void> {
  try {
    await storage.createOnboardingLog({
      employeeId: medewerkerId,
      templateId: templateId ?? 0,
      templateName: null,
      sentBy: 'handmatig',
      status: 'mislukt',
      errorMessage: fout.substring(0, 500),
    } as any);
  } catch (err) {
    console.error('[onboarding] logOnboardingFout error:', err);
  }
}

// Notificatie bij mislukking
export async function notificeerOnboardingFout(medewerker: OnboardingMedewerker, fout: string) {
  try {
    await storage.createNotificatie({
      type: 'onboarding_mislukt',
      titel: 'Onboarding mail mislukt',
      bericht: `${medewerker.firstName} ${medewerker.lastName} — ${fout.substring(0, 140)}`,
      link: `/dashboard?tab=medewerkers&id=${medewerker.id}`,
    } as any);
  } catch (err) {
    console.error('[onboarding] notificeerOnboardingFout error:', err);
  }
}

export async function notificeerBulkVoltooid(verzonden: number, mislukt: number) {
  try {
    await storage.createNotificatie({
      type: 'onboarding_bulk',
      titel: 'Bulk onboarding verstuurd',
      bericht: `${verzonden} mail${verzonden === 1 ? '' : 's'} verstuurd${mislukt > 0 ? `, ${mislukt} mislukt` : ''}`,
      link: '/dashboard?tab=onboarding',
    } as any);
  } catch (err) {
    console.error('[onboarding] notificeerBulkVoltooid error:', err);
  }
}
