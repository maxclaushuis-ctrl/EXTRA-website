// ─── E-mail Service — Stap 4 ──────────────────────────────────────────────────
// Verzending, tracking, unsubscribe tokens en statistieken voor prospect campagnes.

import { createHmac, timingSafeEqual, createHash } from 'crypto';
import { storage } from './storage';
import { generateEmailHTML, generateEmailPlainText, type ContactData } from './emailGenerator';
import { sendEmail } from './mail';

// ─── Config ───────────────────────────────────────────────────────────────────
function getBaseUrl(req?: any): string {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  if (req) return `${req.protocol}://${req.get('host')}`;
  return 'https://doehetextra.nl';
}

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET;
if (!UNSUBSCRIBE_SECRET) {
  throw new Error('UNSUBSCRIBE_SECRET environment variable is not set');
}
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'max@doehetextra.nl';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Max van EXTRA';

// ─── Token Functions ──────────────────────────────────────────────────────────

export function generateUnsubscribeTokenValue(contactId: number): string {
  return createHmac('sha256', UNSUBSCRIBE_SECRET)
    .update(String(contactId))
    .digest('hex');
}

export async function getOrGenerateUnsubscribeToken(contactId: number): Promise<string> {
  const existing = await storage.getUnsubscribeTokenByContact(contactId);
  if (existing) return existing.token;
  const token = generateUnsubscribeTokenValue(contactId);
  await storage.getOrCreateUnsubscribeToken(contactId, token);
  return token;
}

export function validateUnsubscribeToken(contactId: number, token: string): boolean {
  try {
    const expected = generateUnsubscribeTokenValue(contactId);
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(token, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── Tracking Pixel ───────────────────────────────────────────────────────────

export type TrackingEventInsert = { mailSendId: number; type: string; url?: string | null; ipAdres?: string | null };

export function generateTrackingPixelHtml(mailSendId: number, baseUrl: string): string {
  return `<img src="${baseUrl}/track/open/${mailSendId}" width="1" height="1" style="display:block;border:0;" alt="" />`;
}

// ─── Click Tracking ───────────────────────────────────────────────────────────

export function wrapLinksWithTracking(html: string, mailSendId: number, baseUrl: string): {
  html: string; linkMap: Record<number, string>
} {
  const linkMap: Record<number, string> = {};
  let linkIndex = 0;

  const wrapped = html.replace(/<a\s+([^>]*?)href="([^"]+)"([^>]*?)>/gi, (match, before, url, after) => {
    // Don't wrap unsubscribe links, mailto:, tel:
    if (url.includes('/unsubscribe/') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
      return match;
    }
    const idx = linkIndex++;
    linkMap[idx] = url;
    const trackUrl = `${baseUrl}/track/click/${mailSendId}/${idx}?url=${encodeURIComponent(url)}`;
    return `<a ${before}href="${trackUrl}"${after}>`;
  });

  return { html: wrapped, linkMap };
}

// ─── Unsubscribe Link ─────────────────────────────────────────────────────────

export function generateUnsubscribeLink(contactId: number, token: string, baseUrl: string): string {
  return `${baseUrl}/unsubscribe/${contactId}/${token}`;
}

// ─── Prepare Mail ─────────────────────────────────────────────────────────────

export async function prepareMail(
  campaignId: number,
  contactId: number | null,
  contactEmail: string,
  contactName: string | null,
  contactCompany: string | null,
  variant: 'A' | 'B',
  mailSendId: number,
  baseUrl: string
): Promise<{ to: string; subject: string; html: string; text: string; from: string }> {
  const campaign = await storage.getProspectCampaign(campaignId);
  if (!campaign) throw new Error(`Campagne ${campaignId} niet gevonden`);

  // Build contact data for personalization
  const nameParts = (contactName || '').trim().split(' ');
  const contactData: ContactData = {
    voornaam: nameParts[0] || '',
    achternaam: nameParts.slice(1).join(' ') || '',
    naam: contactName || '',
    bedrijf: contactCompany || '',
    company: contactCompany || '',
    taal: 'nl',
    email: contactEmail,
    id: contactId ?? undefined,
  };

  // Fetch full contact if we have the ID (for taal field, etc)
  if (contactId) {
    const contact = await storage.getProspectContact(contactId);
    if (contact) {
      contactData.voornaam = contact.voornaam || nameParts[0] || '';
      contactData.achternaam = contact.achternaam || nameParts.slice(1).join(' ') || '';
      contactData.naam = contact.name || contactName || '';
      contactData.bedrijf = contact.bedrijf || contact.company || contactCompany || '';
      contactData.functietitel = contact.functietitel || '';
      contactData.stad = contact.stad || '';
      contactData.taal = contact.taal || 'nl';
    }
  }

  // Choose content
  const rawContent = variant === 'B' ? (campaign.contentB || campaign.contentA) : campaign.contentA;

  // Unsubscribe token & link
  let unsubUrl = `${baseUrl}/unsubscribe/0/invalid`;
  if (contactId) {
    const token = await getOrGenerateUnsubscribeToken(contactId);
    unsubUrl = generateUnsubscribeLink(contactId, token, baseUrl);
  }

  // Generate tracking pixel
  const pixelHtml = generateTrackingPixelHtml(mailSendId, baseUrl);

  // Generate HTML
  let html = generateEmailHTML(rawContent, contactData, undefined, unsubUrl, undefined);

  // Wrap links with click tracking
  const { html: wrappedHtml, linkMap } = wrapLinksWithTracking(html, mailSendId, baseUrl);
  html = wrappedHtml;

  // Inject tracking pixel before </body>
  html = html.replace('</body>', `${pixelHtml}</body>`);
  if (!html.includes(pixelHtml)) html = html + pixelHtml;

  // Save link map to mail_send
  await storage.updateMailSend(mailSendId, { linkMap: JSON.stringify(linkMap) });

  // Generate plain text
  const text = generateEmailPlainText(rawContent, contactData, unsubUrl);

  // Personalize subject
  const subject = (campaign.subject || '')
    .replace(/\{\{voornaam\}\}/gi, contactData.voornaam || '')
    .replace(/\{\{bedrijf\}\}/gi, contactData.bedrijf || '')
    .replace(/\{\{naam\}\}/gi, contactData.naam || '');

  return {
    to: contactEmail,
    subject,
    html,
    text,
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
  };
}

// ─── Send Single Mail ─────────────────────────────────────────────────────────

export async function sendSingleMail(mailSendId: number, baseUrl: string): Promise<boolean> {
  const mailSend = await storage.getMailSend(mailSendId);
  if (!mailSend) {
    console.error(`[EmailService] mailSend ${mailSendId} niet gevonden`);
    return false;
  }

  try {
    const { to, subject, html, text } = await prepareMail(
      mailSend.campaignId,
      mailSend.contactId,
      mailSend.email,
      null,
      null,
      (mailSend.variant || 'A') as 'A' | 'B',
      mailSendId,
      baseUrl
    );

    const unsubUrl = mailSend.contactId
      ? generateUnsubscribeLink(mailSend.contactId, generateUnsubscribeTokenValue(mailSend.contactId), baseUrl)
      : `${baseUrl}/unsubscribe/0/invalid`;

    const ok = await sendEmail({
      to,
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      subject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (ok) {
      await storage.updateMailSend(mailSendId, { status: 'sent', verzondenOp: new Date() });
      console.log(`[EmailService] ✓ Verstuurd naar ${to} (campagne ${mailSend.campaignId})`);
      return true;
    } else {
      await storage.updateMailSend(mailSendId, { status: 'failed', foutMelding: 'SendGrid retourneerde false' });
      console.error(`[EmailService] ✗ Mislukt voor ${to}`);
      return false;
    }
  } catch (err: any) {
    await storage.updateMailSend(mailSendId, { status: 'failed', foutMelding: err?.message || 'Onbekende fout' });
    console.error(`[EmailService] ✗ Fout voor mailSend ${mailSendId}:`, err?.message);
    return false;
  }
}

// ─── Send Campaign Batch ──────────────────────────────────────────────────────

export async function sendCampaignBatch(
  campaignId: number,
  baseUrl: string,
  onProgress?: (sent: number, total: number, failed: number) => void
): Promise<{ totaal: number; verzonden: number; mislukt: number }> {
  const campaign = await storage.getProspectCampaign(campaignId);
  if (!campaign) throw new Error(`Campagne ${campaignId} niet gevonden`);

  // Get segmented contacts (incl. Blok 1 phase + functionTagIds)
  const { resolveCampaignAudience } = await import('./prospectSegmentResolver');
  const targets = await resolveCampaignAudience(campaign);

  if (targets.length === 0) return { totaal: 0, verzonden: 0, mislukt: 0 };

  // ── A/B Test: 40% testgroep logica ──────────────────────────────────────────
  const isABTest = campaign.abTestActief && !!campaign.contentB;

  // Validatie: te weinig contacten voor A/B test
  if (isABTest && targets.length < 10) {
    console.log(`[EmailService] Te weinig contacten (${targets.length}) voor A/B test — variant A naar iedereen`);
    // Stuur iedereen variant A
    const mailSendIds: number[] = [];
    for (const contact of targets) {
      const ms = await storage.createMailSend({
        campaignId, contactId: contact.id ?? null, email: contact.email!,
        variant: 'A', isAbTestSend: 0, status: 'pending', verzondenOp: null, foutMelding: null, linkMap: null,
      } as any);
      mailSendIds.push(ms.id);
    }
    let verzonden = 0, mislukt = 0;
    for (let i = 0; i < mailSendIds.length; i += 50) {
      const batch = mailSendIds.slice(i, i + 50);
      const results = await Promise.allSettled(batch.map(id => sendSingleMail(id, baseUrl)));
      for (const r of results) { if (r.status === 'fulfilled' && r.value) verzonden++; else mislukt++; }
      onProgress?.(verzonden, targets.length, mislukt);
    }
    await storage.updateProspectCampaign(campaignId, { status: 'voltooid', abTestFase: 'voltooid' } as any);
    return { totaal: targets.length, verzonden, mislukt };
  }

  // Schud de lijst willekeurig
  const shuffled = [...targets].sort(() => Math.random() - 0.5);

  // Bereken testgroep (max 40%, min bij kleine lijsten)
  const testGroepAantal = shuffled.length <= 20 ? shuffled.length : Math.min(shuffled.length, Math.ceil(shuffled.length * 0.4));
  const testGroep = shuffled.slice(0, testGroepAantal);

  // A/B split binnen testgroep
  const splitPct = campaign.abSplitPct || 50;
  const splitIdx = isABTest ? Math.ceil(testGroepAantal * splitPct / 100) : testGroepAantal;

  // Maak mail_send records aan voor testgroep
  const mailSendIds: number[] = [];
  for (let i = 0; i < testGroep.length; i++) {
    const contact = testGroep[i];
    const variant: 'A' | 'B' = (isABTest && i >= splitIdx) ? 'B' : 'A';
    const ms = await storage.createMailSend({
      campaignId,
      contactId: contact.id ?? null,
      email: contact.email!,
      variant,
      isAbTestSend: isABTest ? 1 : 0,
      status: 'pending',
      verzondenOp: null,
      foutMelding: null,
      linkMap: null,
    } as any);
    mailSendIds.push(ms.id);
  }

  if (isABTest) {
    // Update campagne fase naar 'test'
    await storage.updateProspectCampaign(campaignId, { abTestFase: 'test' } as any);
    console.log(`[EmailService] A/B test: ${testGroepAantal}/${shuffled.length} contacten in testgroep, ${shuffled.length - testGroepAantal} wachten op winnaar`);
  }

  // Send in batches of 50 with 200ms between batches
  const BATCH_SIZE = 50;
  let verzonden = 0;
  let mislukt = 0;

  for (let i = 0; i < mailSendIds.length; i += BATCH_SIZE) {
    const batch = mailSendIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map(id => sendSingleMail(id, baseUrl)));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) verzonden++;
      else mislukt++;
    }
    onProgress?.(verzonden, testGroep.length, mislukt);
    if (i + BATCH_SIZE < mailSendIds.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  if (!isABTest) {
    await storage.updateProspectCampaign(campaignId, { status: 'voltooid' } as any);
  }

  console.log(`[EmailService] Campagne ${campaignId} klaar: ${verzonden}/${testGroep.length} verzonden, ${mislukt} mislukt${isABTest ? ` (A/B test, ${shuffled.length - testGroepAantal} wachten)` : ''}`);
  return { totaal: testGroep.length, verzonden, mislukt };
}

// ─── Tracking pixel GIF ───────────────────────────────────────────────────────
export const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// ─── Unsubscribe page HTML ────────────────────────────────────────────────────
export function unsubscribePageHtml(error = false): string {
  if (error) {
    return `<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Fout — EXTRA</title><style>body{font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F9FAFB;color:#111827}.card{background:white;border-radius:16px;padding:48px;max-width:480px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}.icon{font-size:48px;margin-bottom:16px}h1{font-size:24px;font-weight:700;margin-bottom:12px}p{color:#6B7280;line-height:1.6}</style></head><body><div class="card"><div class="icon">⚠️</div><h1>Ongeldige link</h1><p>Deze uitschrijflink is niet geldig of al verlopen.</p></div></body></html>`;
  }
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Uitgeschreven — EXTRA</title><style>body{font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F9FAFB;color:#111827}.card{background:white;border-radius:16px;padding:48px;max-width:480px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}.icon{font-size:48px;margin-bottom:16px}h1{font-size:24px;font-weight:700;margin-bottom:12px}p{color:#6B7280;line-height:1.6}.footer{margin-top:32px;font-size:13px;color:#9CA3AF}</style></head><body><div class="card"><div class="icon">✓</div><h1>Je bent uitgeschreven</h1><p>Je ontvangt geen e-mails meer van EXTRA. Je kunt dit venster sluiten.</p><div class="footer">EXTRA B.V. — Amsterdam<br><a href="https://doehetextra.nl" style="color:#7C3AED">doehetextra.nl</a></div></div></body></html>`;
}
