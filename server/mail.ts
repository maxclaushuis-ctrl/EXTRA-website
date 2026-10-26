import { MailService } from '@sendgrid/mail';
import { storage } from './storage';
import { EmailTemplate, User } from '@shared/schema';
import fs from 'fs';
import path from 'path';
import { downloadCvFile } from './objectStorageFiles';
import {
  mailOpmaak, bannerUrl, brancheVanFunctie, escapeHtml,
  alinea, tussenkop, knop, knoppen, link, infoBlok, stappen, gegevens, melding, afsluiting,
} from '@shared/mailOpmaak';

// Configuratie voor de mail service
let mailService: MailService | null = null;
let useMockService = false;
let mockMailLog: any[] = [];

/**
 * De algemene banner (off-white) uit de gedeelde opmaak in shared/mailOpmaak.ts.
 *
 * Alle mails in dit bestand gebruiken inmiddels mailOpmaak() en kiezen daar zelf
 * de banner van hun branche. Deze functie blijft voor code die alleen een
 * banner nodig heeft. De oude paarse banner (email-banner-extra.jpg) blijft op
 * de site staan, zodat oude mails in inboxen hun afbeelding houden.
 */
export function getEmailBannerSrc(): string {
  return bannerUrl('algemeen');
}

// Gedeelde responsive CSS voor alle e-mails
export function emailMobileCss(): string {
  return `<style type="text/css">
    body { margin:0 !important; padding:0 !important; }
    img { max-width:100% !important; height:auto !important; }
    table { border-collapse:collapse; }
    @media screen and (max-width:640px) {
      .ew { width:100% !important; max-width:100% !important; }
      .ep { padding:20px 16px !important; }
      .ep-sm { padding:14px 16px !important; }
      .ef { font-size:16px !important; }
      .eb { display:block !important; width:100% !important; box-sizing:border-box !important; }
      .outer-pad { padding:16px 8px !important; }
    }
  </style>`;
}

// Initialiseer de mail service als de API key beschikbaar is
export function initMailService(): boolean {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  
  if (SENDGRID_API_KEY) {
    try {
      mailService = new MailService();
      mailService.setApiKey(SENDGRID_API_KEY);
      useMockService = false;
      console.log("Mail service geïnitialiseerd met SendGrid API key");
    } catch (error) {
      console.error("Fout bij initialiseren van SendGrid:", error);
      mailService = null;
      useMockService = true;
      console.log("Mail service geïnitialiseerd in mock-modus (SendGrid fout)");
    }
  } else {
    useMockService = true;
    console.log("Mail service geïnitialiseerd in mock-modus - geen SENDGRID_API_KEY gevonden");
  }
  
  return true;
}

// Interface voor e-mail parameters
interface EmailAttachment {
  content: string;
  filename: string;
  type: string;
  disposition?: string;
}

interface EmailParams {
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  // Blok 3: extra metadata voor SendGrid event-tracking en reply-routing
  customArgs?: Record<string, string>;
  replyTo?: string;
}

// Houd de laatste fout bij zodat callers een specifieke foutboodschap kunnen tonen
let lastEmailError: { message: string; sendgridErrors?: any[] } | null = null;
export function getLastEmailError() {
  return lastEmailError;
}

// Blok 3: resultaat van een verzending inclusief SendGrid Message-ID
export interface SendEmailResult {
  ok: boolean;
  messageId: string | null;
  error?: { message: string; sendgridErrors?: any[] };
}

// Blok 3: variant die zowel succes als de SendGrid Message-ID teruggeeft.
// Gebruik dit voor prospect-campagnes zodat je de message-id in mail_sends
// kunt opslaan voor latere event-correlatie. Voor bestaande callers is sendEmail()
// hieronder een dunne wrapper die de boolean blijft teruggeven.
export async function sendEmailWithResult(params: EmailParams): Promise<SendEmailResult> {
  if (useMockService) {
    const mockId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    mockMailLog.push({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text?.substring(0, 200),
      html: params.html?.substring(0, 200),
      attachments: params.attachments?.map(a => a.filename),
      customArgs: params.customArgs,
      timestamp: new Date().toISOString(),
      messageId: mockId,
    });
    console.log(`Mock e-mail verzonden naar ${params.to} [${mockId}]`);
    return { ok: true, messageId: mockId };
  }
  if (!mailService) {
    console.warn('Mail service niet geïnitialiseerd, kan geen e-mail verzenden');
    return { ok: false, messageId: null, error: { message: 'Mail service niet geïnitialiseerd' } };
  }
  try {
    const msg: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };
    if (params.headers && Object.keys(params.headers).length > 0) msg.headers = params.headers;
    if (params.attachments && params.attachments.length > 0) {
      msg.attachments = params.attachments.map(a => ({
        content: a.content, filename: a.filename, type: a.type, disposition: a.disposition || 'attachment',
      }));
    }
    if (params.customArgs && Object.keys(params.customArgs).length > 0) msg.customArgs = params.customArgs;
    if (params.replyTo) msg.replyTo = params.replyTo;
    const [response] = await mailService.send(msg);
    lastEmailError = null;
    const rawMsgId = (response?.headers?.['x-message-id'] || response?.headers?.['X-Message-Id']) as string | undefined;
    return { ok: true, messageId: rawMsgId || null };
  } catch (error: any) {
    const sendgridErrors = error?.response?.body?.errors;
    const errInfo = {
      message: error?.message || String(error),
      sendgridErrors: Array.isArray(sendgridErrors) ? sendgridErrors : undefined,
    };
    lastEmailError = errInfo;
    console.error('❌ Fout bij verzenden van e-mail via SendGrid:', errInfo.message);
    return { ok: false, messageId: null, error: errInfo };
  }
}

// Verzend een e-mail met opgegeven parameters
export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Check of we in mock-modus zijn
  if (useMockService) {
    // Log de e-mail in console en in-memory voor debugging
    const mockEmail = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text?.substring(0, 200) + (params.text && params.text.length > 200 ? '...' : ''),
      html: params.html?.substring(0, 200) + (params.html && params.html.length > 200 ? '...' : ''),
      attachments: params.attachments?.map(a => a.filename),
      timestamp: new Date().toISOString()
    };
    
    mockMailLog.push(mockEmail);
    console.log('Mock e-mail verzonden:');
    console.log(JSON.stringify(mockEmail, null, 2));
    return true;
  }
  
  // Als niet in mock-modus, gebruik echte SendGrid service
  if (!mailService) {
    console.warn("Mail service niet geïnitialiseerd, kan geen e-mail verzenden");
    return false;
  }
  
  try {
    const msg: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };
    if (params.headers && Object.keys(params.headers).length > 0) {
      msg.headers = params.headers;
    }
    if (params.attachments && params.attachments.length > 0) {
      msg.attachments = params.attachments.map(a => ({
        content: a.content,
        filename: a.filename,
        type: a.type,
        disposition: a.disposition || 'attachment',
      }));
    }
    // Blok 3: customArgs (komen terug in event-webhook) en replyTo (voor inbound-parse)
    if (params.customArgs && Object.keys(params.customArgs).length > 0) {
      msg.customArgs = params.customArgs;
    }
    if (params.replyTo) {
      msg.replyTo = params.replyTo;
    }
    await mailService.send(msg);
    lastEmailError = null;
    console.log(`✅ E-mail succesvol verzonden naar ${Array.isArray(params.to) ? params.to.join(', ') : params.to} (onderwerp: ${params.subject})`);
    return true;
  } catch (error: any) {
    const sendgridErrors = error?.response?.body?.errors;
    lastEmailError = {
      message: error?.message || String(error),
      sendgridErrors: Array.isArray(sendgridErrors) ? sendgridErrors : undefined,
    };
    console.error('❌ Fout bij verzenden van e-mail via SendGrid:');
    console.error('  - Naar:', params.to);
    console.error('  - Van:', params.from);
    console.error('  - Fout:', error?.message || error);
    if (error?.response?.body) {
      console.error('  - SendGrid response:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

// Verzend een e-mail op basis van een template
export async function sendTemplateEmail(
  templateType: string,
  user: User,
  additionalData: Record<string, any> = {}
): Promise<boolean> {
  try {
    // Haal template op
    const templates = await storage.getEmailTemplatesByType(templateType);
    if (templates.length === 0) {
      console.warn(`Geen e-mailsjabloon gevonden van type '${templateType}'`);
      return false;
    }
    
    // Gebruik het eerste template van het opgegeven type
    const template = templates[0];
    
    // Haal e-mail instellingen op
    const fromEmail = await getSettingValue('email_from_address', 'noreply@extra.nl');
    const fromName = await getSettingValue('email_from_name', 'EXTRA');
    
    // Vervang placeholders
    const htmlContent = replaceTemplatePlaceholders(template.htmlContent, user, additionalData);
    const textContent = replaceTemplatePlaceholders(template.textContent, user, additionalData);
    const subject = replaceTemplatePlaceholders(template.subject, user, additionalData);
    
    // Verzend e-mail
    return await sendEmail({
      to: user.email,
      from: `${fromName} <${fromEmail}>`,
      subject,
      html: htmlContent,
      text: textContent
    });
  } catch (error) {
    console.error(`Fout bij verzenden van ${templateType} e-mail:`, error);
    return false;
  }
}

// Verzend een verjaardag e-mail
export async function sendBirthdayEmail(user: User, points: number): Promise<boolean> {
  try {
    // Gebruik de volledige naam van de gebruiker of val terug op de eerste naam
    const userName = `${user.firstName} ${user.lastName}`.trim() || user.firstName || "";
    
    return await sendTemplateEmail('birthday', user, { 
      points: points, 
      naam: userName
    });
  } catch (error) {
    console.error("Fout bij verzenden verjaardags e-mail:", error);
    return false;
  }
}

// Helper functie om placeholders in templates te vervangen
function replaceTemplatePlaceholders(
  content: string,
  user: User,
  additionalData: Record<string, any> = {}
): string {
  let result = content;
  
  // Vervang gebruiker placeholders
  const userName = `${user.firstName} ${user.lastName}`.trim();
  result = result.replace(/\{\{naam\}\}/g, userName || '');
  result = result.replace(/\{\{email\}\}/g, user.email || '');
  result = result.replace(/\{\{punten\}\}/g, user.points?.toString() || '0');
  
  // Vervang alle additonele data placeholders
  for (const [key, value] of Object.entries(additionalData)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value?.toString() || '');
  }
  
  return result;
}

// ─── Mails aan kandidaten en kantoor ─────────────────────────────────────────
// Alle mails hieronder gebruiken de gedeelde opmaak uit shared/mailOpmaak.ts.
// Een mail geeft alleen de branche mee; banner en accentkleur volgen daaruit.

const FUNCTIE_LABELS: Record<string, string> = {
  housekeeping: 'Housekeeping medewerker',
  horecamedewerker: 'Horecamedewerker',
  chef: 'Chef / Kok',
  frontoffice: 'Front office medewerker',
};

const functieLabel = (functionType: string) => FUNCTIE_LABELS[functionType] || functionType;

/** Voor interne overzichten: een leeg veld wordt "Niet ingevuld" in plaats van weggelaten. */
const ofNiet = (waarde: string | null | undefined) =>
  waarde && String(waarde).trim() ? escapeHtml(waarde) : `<span style="font-weight:400;color:#8A8578;">Niet ingevuld</span>`;

const datumNl = (iso: string | null | undefined) => (iso ? iso.split('-').reverse().join('-') : null);

// Stuur bevestigingsmail aan nieuwe kandidaat na aanmelding
export async function sendCandidateConfirmationEmail(candidate: {
  firstName: string;
  lastName: string;
  email: string | null;
  functionType: string;
  nationality?: string | null;
  language?: string | null;
  interviewDate?: string | null;
  interviewTime?: string | null;
}): Promise<boolean> {
  if (!candidate.email) {
    console.warn("Geen e-mailadres voor kandidaat, bevestigingsmail overgeslagen");
    return false;
  }

  const speaksDutch = (candidate.language || "").toLowerCase().includes("nederland");
  const isNlNationality = (candidate.nationality || "").toLowerCase().includes("nederland");
  const useEnglish = !speaksDutch && !isNlNationality;

  const fromEmail = "max@doehetextra.nl";
  const fromName = "EXTRA";

  const INSTAGRAM_URL = "https://www.instagram.com/doehetextra/";
  const branche = brancheVanFunctie(candidate.functionType);
  const voornaam = escapeHtml(candidate.firstName);

  const inhoud = useEnglish
    ? [
        alinea(`Hi ${voornaam},`),
        alinea(`Great that you signed up with EXTRA! 🙌`),
        alinea(`We have received your application and CV. Our team will now review your profile to see if it matches the roles and clients we work with.`),
        tussenkop(`What happens next? 👇`),
        stappen(branche, [
          `We review your CV and application`,
          `Does your profile match EXTRA? Then we will send you an invitation to schedule a meeting 📅`,
          `In that meeting we get to know you better and look at which roles suit you best 🤝`,
        ]),
        alinea(`You will hear from us soon! Thanks for your interest in EXTRA ⚡`),
        infoBlok(branche, `<p style="margin:0 0 14px;font-size:15px;line-height:1.5;">Curious about the kind of work we do? Check out our Instagram 👀</p>${knop('View our Instagram', INSTAGRAM_URL, 'rand')}`),
        afsluiting('en'),
      ].join('')
    : [
        alinea(`Hi ${voornaam},`),
        alinea(`Leuk dat je je hebt aangemeld bij EXTRA! 🙌`),
        alinea(`We hebben je aanmelding en CV goed ontvangen. Ons team gaat er nu mee aan de slag en kijkt of je profiel aansluit bij de functies en opdrachtgevers waar we mee werken.`),
        tussenkop(`Wat gebeurt er nu? 👇`),
        stappen(branche, [
          `We bekijken je CV en aanmelding`,
          `Past je profiel bij EXTRA? Dan sturen we je een uitnodiging om een gesprek in te plannen 📅`,
          `In dat gesprek leren we je beter kennen en kijken we welke opdrachten goed bij je passen 🤝`,
        ]),
        alinea(`Je hoort dus snel van ons! Bedankt voor je interesse in EXTRA ⚡`),
        infoBlok(branche, `<p style="margin:0 0 14px;font-size:15px;line-height:1.5;">Benieuwd wat voor opdrachten we doen? Bekijk alvast onze Instagram 👀</p>${knop('Bekijk onze Instagram', INSTAGRAM_URL, 'rand')}`),
        afsluiting('nl'),
      ].join('');

  const html = mailOpmaak({
    branche,
    taal: useEnglish ? 'en' : 'nl',
    titel: useEnglish ? "Your application is in" : "Je aanmelding is binnen",
    voorkop: useEnglish ? 'Application' : 'Aanmelding',
    kop: useEnglish ? `Your application is in, ${voornaam}!` : `Je aanmelding is binnen, ${voornaam}!`,
    preheader: useEnglish ? 'We have received your application and CV.' : 'We hebben je aanmelding en CV goed ontvangen.',
    inhoud,
  });

  const text = useEnglish
    ? `Hi ${candidate.firstName},

Great that you signed up with EXTRA! 🙌

We have received your application and CV. Our team will now review your profile to see if it matches the roles and clients we work with.

WHAT HAPPENS NEXT?
1. We review your CV and application
2. Does your profile match EXTRA? Then we will send you an invitation to schedule a meeting 📅
3. In that meeting we get to know you better and look at which roles suit you best 🤝

You will hear from us soon!

Thanks for your interest in EXTRA ⚡

Check out our Instagram: ${INSTAGRAM_URL}

See you soon! 🤎
Team EXTRA`
    : `Hi ${candidate.firstName},

Leuk dat je je hebt aangemeld bij EXTRA! 🙌

We hebben je aanmelding en CV goed ontvangen. Ons team gaat er nu mee aan de slag en kijkt of je profiel aansluit bij de functies en opdrachtgevers waar we mee werken.

WAT GEBEURT ER NU?
1. We bekijken je CV en aanmelding
2. Past je profiel bij EXTRA? Dan sturen we je een uitnodiging om een gesprek in te plannen 📅
3. In dat gesprek leren we je beter kennen en kijken we welke opdrachten goed bij je passen 🤝

Je hoort dus snel van ons!

Bedankt voor je interesse in EXTRA ⚡

Bekijk onze Instagram: ${INSTAGRAM_URL}

Tot snel! 🤎
Team EXTRA`;

  return await sendEmail({
    to: candidate.email,
    from: `${fromName} <${fromEmail}>`,
    subject: useEnglish
      ? `Your application is in, let's go! 🚀`
      : `Je aanmelding is binnen, let's go! 🚀`,
    html,
    text,
  });
}

// Bepaal ontvangers op basis van functietype
function getAdminRecipientsForFunction(functionType: string): string[] {
  if (functionType === 'housekeeping') {
    return ['eveline@doehetextra.nl', 'charlotte@doehetextra.nl', 'max@doehetextra.nl'];
  }
  // horecamedewerker, chef, frontoffice en overige
  return ['lea@doehetextra.nl', 'eveline@doehetextra.nl', 'max@doehetextra.nl'];
}

/** Gegevens van een kandidaat voor de interne meldingen. */
function kandidaatGegevens(candidate: {
  firstName: string; lastName: string; functionType: string; city?: string | null; email?: string | null;
  birthDate?: string | null; phone?: string | null; nationality?: string | null; sourceChannel?: string | null;
}): string {
  const rijen: [string, string][] = [
    ['Naam', escapeHtml(`${candidate.firstName} ${candidate.lastName}`)],
    ['Functie', escapeHtml(functieLabel(candidate.functionType))],
    ['Woonplaats', ofNiet(candidate.city)],
    ['Telefoon', ofNiet(candidate.phone)],
    ['E-mail', ofNiet(candidate.email)],
    ['Geboortedatum', ofNiet(datumNl(candidate.birthDate))],
    ['Nationaliteit', ofNiet(candidate.nationality)],
  ];
  if (candidate.sourceChannel) rijen.push(['Binnenkomst via', escapeHtml(candidate.sourceChannel)]);
  return gegevens(rijen);
}

const tekstGegevens = (candidate: {
  firstName: string; lastName: string; functionType: string; city?: string | null; email?: string | null;
  birthDate?: string | null; phone?: string | null; nationality?: string | null; sourceChannel?: string | null;
}) => {
  const n = (w: string | null | undefined) => (w && String(w).trim() ? w : 'niet ingevuld');
  return `Naam: ${candidate.firstName} ${candidate.lastName}\nFunctie: ${functieLabel(candidate.functionType)}\nWoonplaats: ${n(candidate.city)}\nTelefoon: ${n(candidate.phone)}\nE-mail: ${n(candidate.email)}\nGeboortedatum: ${n(candidate.birthDate)}\nNationaliteit: ${n(candidate.nationality)}\nBinnenkomst via: ${n(candidate.sourceChannel)}`;
};

// Stuur admin-notificatiemail bij nieuwe voltooide aanmelding
export async function sendAdminCandidateNotificationEmail(candidate: {
  id: number;
  firstName: string;
  lastName: string;
  functionType: string;
  city?: string | null;
  email?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  nationality?: string | null;
  cvFilename?: string | null;
  reviewToken?: string | null;
  baseUrl?: string | null;
  sourceChannel?: string | null;
}): Promise<boolean> {
  const label = functieLabel(candidate.functionType);

  const baseUrl = candidate.baseUrl || process.env.BASE_URL || 'https://brochure.doehetextra.nl';
  const acceptUrl = candidate.reviewToken
    ? `${baseUrl}/api/candidates/${candidate.id}/accept?token=${candidate.reviewToken}`
    : `${baseUrl}/dashboard`;
  const rejectUrl = candidate.reviewToken
    ? `${baseUrl}/api/candidates/${candidate.id}/reject?token=${candidate.reviewToken}`
    : `${baseUrl}/dashboard`;

  // Laad CV bijlage uit Replit Object Storage (vóór het opbouwen van de HTML,
  // zodat de "CV bijgevoegd"-melding klopt met wat daadwerkelijk is bijgesloten)
  const attachments: EmailAttachment[] = [];
  if (candidate.cvFilename) {
    try {
      const cvData = await downloadCvFile(candidate.cvFilename);
      if (cvData) {
        const { buffer: cvBuffer, ext } = cvData;
        const dotExt = `.${ext}`;
        const mimeType = ext === 'pdf' ? 'application/pdf'
          : ext === 'doc' ? 'application/msword'
          : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/octet-stream';
        attachments.push({
          content: cvBuffer.toString('base64'),
          filename: `CV_${candidate.firstName}_${candidate.lastName}${dotExt}`,
          type: mimeType,
          disposition: 'attachment',
        });
      }
    } catch (err) {
      console.warn('Kon CV niet bijvoegen vanuit Object Storage:', err);
    }
  }
  const hasAttachableCv = attachments.length > 0;

  const html = mailOpmaak({
    branche: brancheVanFunctie(candidate.functionType),
    titel: `Nieuwe aanmelding: ${candidate.firstName} ${candidate.lastName}`,
    voorkop: 'Nieuwe aanmelding via doehetextra.nl',
    kop: escapeHtml(`${candidate.firstName} ${candidate.lastName}`),
    preheader: `${label}${candidate.city ? `, ${candidate.city}` : ''}`,
    voet: 'kort',
    inhoud: [
      kandidaatGegevens(candidate),
      hasAttachableCv
        ? melding('goed', 'CV bijgevoegd', 'Je vindt het cv als bijlage bij deze mail.')
        : melding('let-op', 'Nog geen cv', 'De kandidaat heeft nog geen cv geüpload.'),
      knoppen(knop('Accepteren', acceptUrl, 'vol'), knop('Afwijzen', rejectUrl, 'rand')),
      alinea(`Of ${link('bekijk de aanmelding in het dashboard', `${baseUrl}/dashboard`)}.`, { klein: true, marge: '4px 0 0' }),
    ].join(''),
  });

  const text = `Nieuwe aanmelding via doehetextra.nl\n\n${tekstGegevens(candidate)}\n\nAccepteren: ${acceptUrl}\nAfwijzen: ${rejectUrl}`;

  const recipients = getAdminRecipientsForFunction(candidate.functionType);

  // Stuur naar elke ontvanger afzonderlijk (SendGrid vereist dit voor attachments bij meerdere ontvangers)
  const results = await Promise.all(recipients.map(to =>
    sendEmail({
      to,
      from: 'EXTRA 🚀 <max@doehetextra.nl>',
      subject: `Nieuwe aanmelding: ${candidate.firstName} ${candidate.lastName} (${label})`,
      html,
      text,
      attachments,
    })
  ));
  return results.every(Boolean);
}

// Interne admin-melding zonder CV (alleen informatief, geen accept/afwijs knoppen)
export async function sendAdminCandidateNoCvEmail(candidate: {
  id: number;
  firstName: string;
  lastName: string;
  functionType: string;
  city?: string | null;
  email?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  nationality?: string | null;
  baseUrl?: string | null;
  sourceChannel?: string | null;
}): Promise<boolean> {
  const label = functieLabel(candidate.functionType);
  const baseUrl = candidate.baseUrl || process.env.BASE_URL || 'https://brochure.doehetextra.nl';
  const dashboardUrl = `${baseUrl}/dashboard`;

  const html = mailOpmaak({
    branche: brancheVanFunctie(candidate.functionType),
    titel: `Nieuwe aanmelding zonder cv: ${candidate.firstName} ${candidate.lastName}`,
    voorkop: 'Nieuwe aanmelding, nog zonder cv',
    kop: escapeHtml(`${candidate.firstName} ${candidate.lastName}`),
    preheader: `${label}. Accepteren of afwijzen kan zodra het cv er is.`,
    voet: 'kort',
    inhoud: [
      alinea(`Er is een nieuwe aanmelding binnen, <b style="color:#37352C;">nog zonder cv</b>. Zodra de kandidaat het cv uploadt, krijg je een nieuwe mail waarin je kunt accepteren of afwijzen.`),
      kandidaatGegevens(candidate),
      melding('let-op', 'Wacht op het cv', 'De kandidaat is uitgenodigd om het cv te uploaden. Accepteren of afwijzen kan pas als het cv binnen is.'),
      knoppen(knop('Bekijk in dashboard', dashboardUrl, 'vol')),
    ].join(''),
  });

  const text = `Nieuwe aanmelding ontvangen (nog geen cv)\n\n${tekstGegevens(candidate)}\n\nDe kandidaat heeft nog geen cv geüpload. Je ontvangt een tweede mail zodra het cv er is.\n\nBekijk in dashboard: ${dashboardUrl}`;

  const recipients = getAdminRecipientsForFunction(candidate.functionType);
  const results = await Promise.all(recipients.map(to =>
    sendEmail({
      to,
      from: 'EXTRA 🚀 <max@doehetextra.nl>',
      subject: `Nieuwe aanmelding zonder cv: ${candidate.firstName} ${candidate.lastName} (${label})`,
      html,
      text,
    })
  ));
  return results.every(Boolean);
}

// Stuur Calendly-uitnodiging naar geaccepteerde kandidaat
export async function sendCalendlyInviteEmail(candidate: {
  firstName: string;
  email: string;
  functionType?: string | null;
}): Promise<boolean> {
  if (!candidate.email) return false;

  const calendlyUrl = 'https://calendly.com/max-_zs/30min';
  const voornaam = escapeHtml(candidate.firstName);

  const html = mailOpmaak({
    branche: brancheVanFunctie(candidate.functionType),
    titel: 'Plan je gesprek bij EXTRA',
    voorkop: 'Kennismaking',
    kop: 'Plan je gesprek in',
    preheader: 'We nodigen je graag uit voor een kort kennismakingsgesprek.',
    inhoud: [
      alinea(`Hi ${voornaam},`),
      alinea('Wat leuk dat je je bij ons hebt aangemeld!'),
      alinea('Op basis van je aanmelding en CV nodigen we je graag uit voor een kort kennismakingsgesprek. Tijdens dit gesprek vertellen we je meer over EXTRA en kijken we samen welke opdrachten goed bij je passen.'),
      alinea('Plan hier eenvoudig een moment dat voor jou uitkomt:'),
      knoppen(knop('📅 Plan een gesprek in', calendlyUrl, 'vol')),
      alinea(`Of kopieer de link: ${link(calendlyUrl, calendlyUrl)}`, { klein: true }),
      afsluiting('nl', { groet: 'We spreken je snel!' }),
    ].join(''),
  });

  const text = `Hi ${candidate.firstName},\n\nWat leuk dat je je bij ons hebt aangemeld!\n\nOp basis van je aanmelding en CV nodigen we je graag uit voor een kort kennismakingsgesprek. Tijdens dit gesprek vertellen we je meer over EXTRA en kijken we samen welke opdrachten goed bij je passen.\n\nPlan hier eenvoudig een moment dat voor jou uitkomt:\n${calendlyUrl}\n\nWe spreken je snel! 🤎\nTeam EXTRA`;

  return await sendEmail({
    to: candidate.email,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: 'Plan je gesprek 📅',
    html,
    text,
  });
}

/** Gedeelde opbouw voor de drie afwijzingsmails: zelfde toon, andere tekst. */
function afwijzingsMail(o: { voornaam: string; functionType?: string | null; alineas: string[]; titel: string }): { html: string; text: string } {
  const html = mailOpmaak({
    branche: brancheVanFunctie(o.functionType),
    titel: o.titel,
    voorkop: 'Je sollicitatie',
    kop: 'Een update over je sollicitatie',
    inhoud: [
      alinea(`Hi ${escapeHtml(o.voornaam)},`),
      ...o.alineas.map(a => alinea(a)),
      afsluiting('nl', { groet: 'Groet,', hartje: false }),
    ].join(''),
  });
  const text = `Hi ${o.voornaam},\n\n${o.alineas.join('\n\n')}\n\nGroet,\nTeam EXTRA`;
  return { html, text };
}

// Stuur afwijzingsmail naar sollicitant
export async function sendApplicationRejectionEmail(applicant: {
  firstName: string;
  email: string;
  functionType?: string | null;
}): Promise<boolean> {
  if (!applicant.email) return false;

  const { html, text } = afwijzingsMail({
    voornaam: applicant.firstName,
    functionType: applicant.functionType,
    titel: 'Update over je sollicitatie bij EXTRA',
    alineas: [
      'Bedankt dat je laatst bij ons langs bent geweest voor het gesprek. Leuk om kennis te maken en meer over je te horen!',
      'Op dit moment hebben we helaas besloten om niet met je verder te gaan. Dit heeft vooral te maken met het aantal diensten dat we momenteel beschikbaar hebben in verhouding tot het aantal mensen in onze poule.',
      'Dat zegt dus niet per se iets over jou, maar meer over de planning en het aantal plekken dat we nu hebben.',
      'We wensen je in ieder geval veel succes met je verdere zoektocht en wie weet kruisen onze paden in de toekomst nog eens.',
    ],
  });

  return await sendEmail({
    to: applicant.email,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: 'Update over je sollicitatie bij EXTRA',
    html,
    text,
  });
}

export async function sendCandidateRejectionEmailDiensten(candidate: {
  firstName: string;
  email: string;
  functionType?: string | null;
}): Promise<boolean> {
  if (!candidate.email) return false;

  const { html, text } = afwijzingsMail({
    voornaam: candidate.firstName,
    functionType: candidate.functionType,
    titel: 'Bedankt voor je aanmelding bij EXTRA',
    alineas: [
      'Bedankt voor je aanmelding bij EXTRA en voor het opsturen van je CV.',
      'Op basis van de informatie die we nu hebben denken we dat we op dit moment helaas niet voldoende passende opdrachten voor je kunnen bieden.',
      'Daarom hebben we besloten om je aanmelding op dit moment niet verder in behandeling te nemen.',
      'We wensen je veel succes met je verdere zoektocht naar een leuke baan in de horeca.',
    ],
  });

  return await sendEmail({
    to: candidate.email,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: 'Bedankt voor je aanmelding bij EXTRA',
    html,
    text,
  });
}

export async function sendCandidateRejectionEmailCv(candidate: {
  firstName: string;
  email: string;
  functionType?: string | null;
}): Promise<boolean> {
  if (!candidate.email) return false;

  const { html, text } = afwijzingsMail({
    voornaam: candidate.firstName,
    functionType: candidate.functionType,
    titel: 'Update over je sollicitatie bij EXTRA',
    alineas: [
      'Bedankt voor je interesse in EXTRA en het insturen van je gegevens.',
      'Na het bekijken van je CV hebben we besloten om op dit moment niet verder te gaan met de sollicitatie. Voor de opdrachten waar we momenteel mensen voor zoeken is meer relevante ervaring nodig.',
      'We wensen je veel succes met je verdere stappen en bedanken je voor je interesse in EXTRA.',
    ],
  });

  return await sendEmail({
    to: candidate.email,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: 'Update over je sollicitatie bij EXTRA',
    html,
    text,
  });
}

type CvUploadKandidaat = { firstName: string; email: string; id: number; cvUploadToken?: string | null; baseUrl?: string; functionType?: string | null };

function cvUploadUrl(candidate: CvUploadKandidaat): string {
  const base = candidate.baseUrl || process.env.BASE_URL || 'https://brochure.doehetextra.nl';
  return candidate.cvUploadToken
    ? `${base}/cv-upload?token=${candidate.cvUploadToken}`
    : `${base}/aanmelden`;
}

export async function sendCvUploadFirstEmail(candidate: CvUploadKandidaat): Promise<boolean> {
  const uploadUrl = cvUploadUrl(candidate);

  const html = mailOpmaak({
    branche: brancheVanFunctie(candidate.functionType),
    titel: 'Upload je cv bij EXTRA',
    voorkop: 'Je aanmelding',
    kop: 'Nog één stap: je cv',
    preheader: 'Om een gesprek in te plannen hebben we nog je cv nodig.',
    inhoud: [
      alinea(`Hi ${escapeHtml(candidate.firstName)},`),
      alinea('Bedankt voor je aanmelding bij EXTRA! We hebben je gegevens goed ontvangen.'),
      alinea('Om een gesprek in te plannen hebben we nog je cv nodig. Zo kunnen we kijken of er een goede match is met onze opdrachten.'),
      alinea('Het hele proces duurt nog maar een paar minuten.'),
      knoppen(knop('Upload je cv', uploadUrl, 'vol')),
      alinea('Zonder cv kunnen we helaas geen gesprek inplannen. Heb je vragen? App ons gerust.', { klein: true }),
      afsluiting('nl'),
    ].join(''),
  });

  return await sendEmail({
    to: candidate.email,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: 'Upload je cv om een gesprek in te plannen',
    html,
    text: `Hi ${candidate.firstName},\n\nBedankt voor je aanmelding bij EXTRA!\n\nOm een gesprek in te plannen hebben we nog je cv nodig. Ga naar ${uploadUrl} om je cv te uploaden.\n\nTot snel! 🤎\nTeam EXTRA`,
  });
}

export async function sendCvReminderEmail(candidate: CvUploadKandidaat): Promise<boolean> {
  const uploadUrl = cvUploadUrl(candidate);

  const html = mailOpmaak({
    branche: brancheVanFunctie(candidate.functionType),
    titel: 'Herinnering: upload je cv bij EXTRA',
    voorkop: 'Herinnering',
    kop: 'Je cv ontbreekt nog',
    preheader: 'Zonder cv kunnen we geen gesprek inplannen.',
    inhoud: [
      alinea(`Hi ${escapeHtml(candidate.firstName)},`),
      alinea('We hebben je aanmelding bij EXTRA nog staan, maar je cv ontbreekt nog. Zonder cv kunnen we helaas geen gesprek inplannen.'),
      alinea('Het uploaden duurt maar een minuutje. Dan kunnen we snel kijken of er een goede match is!'),
      knoppen(knop('Upload je cv nu', uploadUrl, 'vol')),
      alinea('Heb je vragen of wil je je aanmelding intrekken? Stuur ons dan even een berichtje.', { klein: true }),
      afsluiting('nl'),
    ].join(''),
  });

  return await sendEmail({
    to: candidate.email,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: 'Herinnering: upload je cv om een gesprek in te plannen',
    html,
    text: `Hi ${candidate.firstName},\n\nJe cv ontbreekt nog bij je aanmelding bij EXTRA. Zonder cv kunnen we geen gesprek inplannen.\n\nGa naar ${uploadUrl} om je cv te uploaden.\n\nTot snel! 🤎\nTeam EXTRA`,
  });
}

export async function sendTwvExpiryReminderEmail(candidate: {
  firstName: string;
  lastName: string;
  id: number;
  twvEndDate: string;
  daysLeft: number;
}): Promise<boolean> {
  const recipients = ['max@doehetextra.nl', 'eveline@doehetextra.nl'];
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const endDateFormatted = new Date(candidate.twvEndDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  const dashboardUrl = `${process.env.BASE_URL || 'https://brochure.doehetextra.nl'}/dashboard`;

  const html = mailOpmaak({
    titel: 'TWV verloopt binnenkort',
    voorkop: 'Automatische melding',
    kop: 'TWV verloopt binnenkort',
    preheader: `De TWV van ${fullName} verloopt over ${candidate.daysLeft} dagen.`,
    voet: 'kort',
    inhoud: [
      alinea('Beste collega,'),
      alinea(`De tewerkstellingsvergunning (TWV) van <b style="color:#37352C;">${escapeHtml(fullName)}</b> verloopt over <b style="color:#37352C;">${candidate.daysLeft} dagen</b> op <b style="color:#37352C;">${endDateFormatted}</b>.`),
      melding('let-op', 'Actie vereist', 'Vergeet niet op tijd een verlengingsaanvraag in te dienen bij het UWV, zodat de medewerker niet zonder geldige vergunning werkt.'),
      alinea('Bekijk het TWV-overzicht in het dashboard voor meer details.'),
      knoppen(knop('Open TWV-dashboard', dashboardUrl, 'vol')),
      afsluiting('nl', { groet: 'Groet,', afzender: 'Team EXTRA, automatische melding', hartje: false }),
    ].join(''),
  });

  let allOk = true;
  for (const to of recipients) {
    const ok = await sendEmail({
      to,
      from: 'EXTRA Systeem <max@doehetextra.nl>',
      subject: `⚠️ TWV van ${fullName} verloopt over ${candidate.daysLeft} dagen`,
      html,
      text: `De TWV van ${fullName} verloopt over ${candidate.daysLeft} dagen op ${endDateFormatted}. Neem actie voor verlengingsaanvraag.`,
    });
    if (!ok) allOk = false;
  }
  return allOk;
}

/**
 * Melding dat een tewerkstellingsvergunning AL verlopen is.
 *
 * Bewust een aparte mail naast sendTwvExpiryReminderEmail. Die waarschuwt
 * vooruit ("verloopt over X dagen") en stopt zodra de datum voorbij is (de
 * filter daar is daysLeft > 0). Precies op het moment dat het probleem echt
 * ontstaat, kreeg niemand dus nog iets. Deze mail vult dat gat.
 *
 * De toon is anders omdat de situatie anders is: bij de eerste kan er nog
 * verlengd worden, bij deze mag de medewerker niet meer ingezet worden. Een
 * rode melding in plaats van een gele, en de tekst zegt wat er nú niet meer mag
 * in plaats van wat er straks moet gebeuren.
 *
 * Gaat naar de admins, nooit naar de kandidaat.
 */
export async function sendTwvExpiredNotice(candidate: {
  firstName: string;
  lastName: string;
  id: number;
  twvEndDate: string;
  dagenVerlopen: number;
}): Promise<boolean> {
  const recipients = ['max@doehetextra.nl', 'eveline@doehetextra.nl'];
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const endDateFormatted = new Date(candidate.twvEndDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  const sinds = candidate.dagenVerlopen === 1 ? 'sinds gisteren' : `sinds ${candidate.dagenVerlopen} dagen`;
  const dashboardUrl = `${process.env.BASE_URL || 'https://brochure.doehetextra.nl'}/dashboard`;

  const html = mailOpmaak({
    titel: 'TWV is verlopen',
    voorkop: 'Automatische melding',
    kop: 'TWV is verlopen',
    preheader: `${fullName} is niet meer inzetbaar.`,
    voet: 'kort',
    inhoud: [
      alinea('Beste collega,'),
      alinea(`De tewerkstellingsvergunning van <b style="color:#37352C;">${escapeHtml(fullName)}</b> is verlopen op <b style="color:#37352C;">${endDateFormatted}</b>, ${sinds}.`),
      melding('stop', 'Niet meer inzetbaar', 'Zonder geldige vergunning mag deze medewerker niet worden ingepland. Haal openstaande diensten weg en neem contact op over een verlenging.'),
      alinea('De status in het TWV-overzicht staat inmiddels op <b style="color:#37352C;">TWV Verlopen</b>.'),
      knoppen(knop('Open TWV-dashboard', dashboardUrl, 'vol')),
      afsluiting('nl', { groet: 'Groet,', afzender: 'Team EXTRA, automatische melding', hartje: false }),
    ].join(''),
  });

  let allOk = true;
  for (const to of recipients) {
    const ok = await sendEmail({
      to,
      from: 'EXTRA Systeem <max@doehetextra.nl>',
      subject: `TWV van ${fullName} is verlopen, niet meer inzetbaar`,
      html,
      text: `De TWV van ${fullName} is verlopen op ${endDateFormatted}, ${sinds}. Deze medewerker mag niet worden ingepland zonder geldige vergunning.`,
    });
    if (!ok) allOk = false;
  }
  return allOk;
}

// Helper functie om instellingen op te halen
async function getSettingValue(key: string, defaultValue: string): Promise<string> {
  try {
    const setting = await storage.getSetting(key);
    return setting?.value || defaultValue;
  } catch (error) {
    console.error(`Fout bij ophalen van instelling ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Stuur een welkomstmail naar een nieuw aangemaakt admin-account.
 * Bevat de inloggegevens en een link naar het admin-portaal.
 */
export async function sendAdminWelcomeEmail(params: {
  to: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  loginUrl: string;
}): Promise<boolean> {
  const { to, firstName, email, password, loginUrl } = params;

  const html = mailOpmaak({
    titel: 'Welkom bij het EXTRA admin-portaal',
    voorkop: 'Welkom',
    kop: `Welkom bij het admin-portaal, ${escapeHtml(firstName)}!`,
    inhoud: [
      alinea('Je account is aangemaakt. Hieronder vind je jouw inloggegevens voor het admin-portaal van EXTRA. Bewaar ze goed en deel ze niet met anderen.'),
      infoBlok('algemeen',
        `<p style="margin:0 0 8px;font-size:15px;line-height:1.5;"><b>E-mailadres:</b> ${escapeHtml(email)}</p>` +
        `<p style="margin:0;font-size:15px;line-height:1.5;"><b>Wachtwoord:</b> <span style="display:inline-block;background:#FFFFFF;border-radius:8px;padding:4px 10px;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:15px;letter-spacing:.04em;">${escapeHtml(password)}</span></p>`,
        { label: 'Jouw inloggegevens' }),
      alinea('Wijzig je wachtwoord direct na de eerste aanmelding via je profielinstellingen.', { klein: true }),
      knoppen(knop('Inloggen in het admin-portaal', loginUrl, 'vol')),
      afsluiting('nl'),
    ].join(''),
  });

  const text = `Welkom bij het EXTRA admin-portaal, ${firstName}!\n\nJe inloggegevens:\nE-mailadres: ${email}\nWachtwoord: ${password}\n\nInloggen: ${loginUrl}\n\nWijzig je wachtwoord direct na de eerste aanmelding.`;

  return sendEmail({
    to,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: `Welkom bij het EXTRA admin-portaal, ${firstName}!`,
    html,
    text,
  });
}
