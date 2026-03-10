import { MailService } from '@sendgrid/mail';
import { storage } from './storage';
import { EmailTemplate, User } from '@shared/schema';
import fs from 'fs';
import path from 'path';

// Configuratie voor de mail service
let mailService: MailService | null = null;
let useMockService = false;
let mockMailLog: any[] = [];

// Banner als base64 data URI — laad eenmalig bij eerste gebruik
let _emailBannerDataUri = '';
function getEmailBannerSrc(): string {
  if (!_emailBannerDataUri) {
    try {
      const p = path.join(process.cwd(), 'client', 'public', 'email-banner-extra.jpg');
      if (fs.existsSync(p)) {
        _emailBannerDataUri = `data:image/jpeg;base64,${fs.readFileSync(p).toString('base64')}`;
      }
    } catch {}
  }
  return _emailBannerDataUri || 'https://www.doehetextra.nl/email-banner-extra.png';
}

// Gedeelde responsive CSS voor alle e-mails
function emailMobileCss(): string {
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
    if (params.attachments && params.attachments.length > 0) {
      msg.attachments = params.attachments.map(a => ({
        content: a.content,
        filename: a.filename,
        type: a.type,
        disposition: a.disposition || 'attachment',
      }));
    }
    await mailService.send(msg);
    console.log(`✅ E-mail succesvol verzonden naar ${Array.isArray(params.to) ? params.to.join(', ') : params.to} (onderwerp: ${params.subject})`);
    return true;
  } catch (error: any) {
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

  const CALENDLY_URL = "https://calendly.com/max-_zs/30min";
  const WHATSAPP_URL = "https://wa.me/31854012373";

  // ─── reusable style atoms ────────────────────────────────────────────────
  const card = `background:#ffffff;border-radius:16px;padding:28px 32px;margin-bottom:20px;border:1px solid #f0edf8;box-shadow:0 2px 12px rgba(109,40,217,0.06);`;
  const cardPurple = `background:#f5f3ff;border-radius:16px;padding:28px 32px;margin-bottom:20px;border:1px solid #ede9fe;`;
  const label = `display:inline-block;background:#ede9fe;color:#6d28d9;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;padding:4px 12px;border-radius:50px;margin-bottom:14px;`;
  const h2 = `margin:0 0 10px 0;font-size:20px;font-weight:900;color:#1a0a3e;line-height:1.3;font-family:'Arial Black',Arial,sans-serif;`;
  const body = `margin:0 0 0 0;font-size:15px;color:#4b5563;line-height:1.7;`;
  const btnPrimary = `display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:50px;font-family:Arial,sans-serif;letter-spacing:0.2px;`;
  const btnWa = `display:inline-block;background:#25d366;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:50px;font-family:Arial,sans-serif;letter-spacing:0.2px;`;

  // ─── NL content ──────────────────────────────────────────────────────────
  const nlBody = `
    <!-- 2. INTRO -->
    <tr><td style="padding:32px 32px 0;">
      <div style="${card}">
        <p style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#1a0a3e;">Hi ${candidate.firstName},</p>
        <p style="margin:0 0 12px 0;font-size:16px;color:#374151;line-height:1.75;">Top dat je je hebt aangemeld bij EXTRA ⚡</p>
        <p style="${body}margin-bottom:0;">We vinden het altijd leuk om nieuwe mensen te ontmoeten die zin hebben om lekker aan de slag te gaan.</p>
      </div>
    </td></tr>

    <!-- 3. WAT GEBEURT ER NU -->
    <tr><td style="padding:0 32px;">
      <div style="background:linear-gradient(135deg,#2e1065,#1e1b4b);border-radius:16px;padding:28px 32px;margin-bottom:20px;position:relative;overflow:hidden;">
        <span style="position:absolute;top:-20px;right:-10px;font-size:120px;font-weight:900;color:rgba(255,255,255,0.04);font-family:'Arial Black',Arial,sans-serif;line-height:1;">X</span>
        <span style="position:absolute;bottom:-30px;left:-5px;font-size:100px;font-weight:900;color:rgba(255,255,255,0.04);font-family:'Arial Black',Arial,sans-serif;line-height:1;">X</span>
        <div style="${label}background:rgba(255,255,255,0.15);color:#e9d5ff;">Wat gebeurt er nu?</div>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding:10px 0;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(167,139,250,0.25);text-align:center;line-height:36px;font-size:17px;">1️⃣</div>
                  </td>
                  <td valign="middle" style="padding:4px 0;">
                    <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;line-height:1.4;">Plan je kennismaking</p>
                    <p style="margin:2px 0 0;font-size:13px;color:rgba(233,213,255,0.8);line-height:1.5;">Kies een moment via Calendly. Duurt maar een paar seconden.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:2px 0 2px 18px;"><div style="width:1px;height:16px;background:rgba(167,139,250,0.2);"></div></td></tr>
          <tr>
            <td style="padding:10px 0;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(167,139,250,0.25);text-align:center;line-height:36px;font-size:17px;">2️⃣</div>
                  </td>
                  <td valign="middle" style="padding:4px 0;">
                    <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;line-height:1.4;">Kom langs bij EXTRA</p>
                    <p style="margin:2px 0 0;font-size:13px;color:rgba(233,213,255,0.8);line-height:1.5;">We ontmoeten je op ons kantoor aan de Herengracht 372 in Amsterdam.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:2px 0 2px 18px;"><div style="width:1px;height:16px;background:rgba(167,139,250,0.2);"></div></td></tr>
          <tr>
            <td style="padding:10px 0;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(167,139,250,0.25);text-align:center;line-height:36px;font-size:17px;">3️⃣</div>
                  </td>
                  <td valign="middle" style="padding:4px 0;">
                    <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;line-height:1.4;">Pak je eerste diensten</p>
                    <p style="margin:2px 0 0;font-size:13px;color:rgba(233,213,255,0.8);line-height:1.5;">Na de kennismaking word je ingepland bij hotels, evenementen en meer.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </td></tr>

    <!-- 4. AFSPRAAK CTA -->
    <tr><td style="padding:0 32px;">
      <div style="${cardPurple}">
        <div style="${label}">Kennismaking inplannen</div>
        <p style="${h2}">Nog geen afspraak ingepland?</p>
        <p style="${body}margin-bottom:20px;">Plan hier direct een moment in. Het duurt maar een paar seconden.</p>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:10px;"><a href="${CALENDLY_URL}" style="${btnPrimary}">Afspraak inplannen →</a></td>
          <td><a href="${WHATSAPP_URL}" style="${btnWa}">💬 WhatsApp</a></td>
        </tr></table>
      </div>
    </td></tr>

    <!-- 5. LOCATIE -->
    <tr><td style="padding:0 32px;">
      <div style="${card}">
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td width="44" valign="top">
            <div style="width:36px;height:36px;border-radius:10px;background:#ede9fe;text-align:center;line-height:36px;font-size:18px;">📍</div>
          </td>
          <td valign="top" style="padding-left:12px;">
            <p style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:#1a0a3e;">Kennismaking bij EXTRA</p>
            <p style="${body}">Je bent welkom bij ons op:<br><strong style="color:#1a0a3e;">Herengracht 372, Amsterdam</strong></p>
          </td>
        </tr></table>
      </div>
    </td></tr>

    <!-- 6. WAAROM EXTRA -->
    <tr><td style="padding:0 32px;">
      <div style="${card}">
        <div style="${label}">Werken bij EXTRA</div>
        <p style="${h2}margin-bottom:16px;">Waarom werken bij EXTRA?</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="33%" style="padding:10px 8px 10px 0;vertical-align:top;">
              <div style="background:#f5f3ff;border-radius:12px;padding:16px;text-align:center;">
                <div style="font-size:24px;margin-bottom:8px;">⚡</div>
                <p style="margin:0;font-size:13px;font-weight:700;color:#1a0a3e;line-height:1.4;">Flexibele diensten</p>
              </div>
            </td>
            <td width="33%" style="padding:10px 4px;vertical-align:top;">
              <div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
                <div style="font-size:24px;margin-bottom:8px;">💸</div>
                <p style="margin:0;font-size:13px;font-weight:700;color:#1a0a3e;line-height:1.4;">Snel uitbetaald</p>
              </div>
            </td>
            <td width="33%" style="padding:10px 0 10px 8px;vertical-align:top;">
              <div style="background:#fff7ed;border-radius:12px;padding:16px;text-align:center;">
                <div style="font-size:24px;margin-bottom:8px;">🎉</div>
                <p style="margin:0;font-size:13px;font-weight:700;color:#1a0a3e;line-height:1.4;">EXTRAATje beloningen</p>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </td></tr>

    <!-- 7. AFSLUITING -->
    <tr><td style="padding:0 32px 32px;">
      <div style="${card}margin-bottom:0;">
        <p style="${body}margin-bottom:12px;">Kun je toch niet op het geplande moment? Pas je afspraak dan gewoon even aan zodat we iemand anders kunnen inplannen.</p>
        <p style="${body}margin-bottom:20px;">We kijken ernaar uit om je te ontmoeten 🙌</p>
        <p style="margin:0;font-size:15px;color:#374151;line-height:1.75;">Groet,<br><strong style="color:#1a0a3e;">Team EXTRA</strong></p>
      </div>
    </td></tr>
  `;

  // ─── EN content ──────────────────────────────────────────────────────────
  const enBody = `
    <!-- 2. INTRO -->
    <tr><td style="padding:32px 32px 0;">
      <div style="${card}">
        <p style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#1a0a3e;">Hi ${candidate.firstName},</p>
        <p style="margin:0 0 12px 0;font-size:16px;color:#374151;line-height:1.75;">Great that you signed up with EXTRA ⚡</p>
        <p style="${body}margin-bottom:0;">We always love meeting new people who are ready to get to work.</p>
      </div>
    </td></tr>

    <!-- 3. WHAT HAPPENS NEXT -->
    <tr><td style="padding:0 32px;">
      <div style="background:linear-gradient(135deg,#2e1065,#1e1b4b);border-radius:16px;padding:28px 32px;margin-bottom:20px;position:relative;overflow:hidden;">
        <span style="position:absolute;top:-20px;right:-10px;font-size:120px;font-weight:900;color:rgba(255,255,255,0.04);font-family:'Arial Black',Arial,sans-serif;line-height:1;">X</span>
        <span style="position:absolute;bottom:-30px;left:-5px;font-size:100px;font-weight:900;color:rgba(255,255,255,0.04);font-family:'Arial Black',Arial,sans-serif;line-height:1;">X</span>
        <div style="${label}background:rgba(255,255,255,0.15);color:#e9d5ff;">What happens next?</div>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:10px 0;">
            <table cellpadding="0" cellspacing="0" width="100%"><tr>
              <td width="44" valign="top"><div style="width:36px;height:36px;border-radius:50%;background:rgba(167,139,250,0.25);text-align:center;line-height:36px;font-size:17px;">1️⃣</div></td>
              <td valign="middle" style="padding:4px 0;">
                <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;line-height:1.4;">Schedule your intro</p>
                <p style="margin:2px 0 0;font-size:13px;color:rgba(233,213,255,0.8);line-height:1.5;">Pick a moment via Calendly. Takes only a few seconds.</p>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:2px 0 2px 18px;"><div style="width:1px;height:16px;background:rgba(167,139,250,0.2);"></div></td></tr>
          <tr><td style="padding:10px 0;">
            <table cellpadding="0" cellspacing="0" width="100%"><tr>
              <td width="44" valign="top"><div style="width:36px;height:36px;border-radius:50%;background:rgba(167,139,250,0.25);text-align:center;line-height:36px;font-size:17px;">2️⃣</div></td>
              <td valign="middle" style="padding:4px 0;">
                <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;line-height:1.4;">Visit EXTRA</p>
                <p style="margin:2px 0 0;font-size:13px;color:rgba(233,213,255,0.8);line-height:1.5;">We will meet you at our office at Herengracht 372 in Amsterdam.</p>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:2px 0 2px 18px;"><div style="width:1px;height:16px;background:rgba(167,139,250,0.2);"></div></td></tr>
          <tr><td style="padding:10px 0;">
            <table cellpadding="0" cellspacing="0" width="100%"><tr>
              <td width="44" valign="top"><div style="width:36px;height:36px;border-radius:50%;background:rgba(167,139,250,0.25);text-align:center;line-height:36px;font-size:17px;">3️⃣</div></td>
              <td valign="middle" style="padding:4px 0;">
                <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;line-height:1.4;">Start your first shifts</p>
                <p style="margin:2px 0 0;font-size:13px;color:rgba(233,213,255,0.8);line-height:1.5;">After the intro you will be scheduled at hotels, events and more.</p>
              </td>
            </tr></table>
          </td></tr>
        </table>
      </div>
    </td></tr>

    <!-- 4. SCHEDULE CTA -->
    <tr><td style="padding:0 32px;">
      <div style="${cardPurple}">
        <div style="${label}">Schedule intro</div>
        <p style="${h2}">Haven't booked your intro yet?</p>
        <p style="${body}margin-bottom:20px;">Book a slot here. It only takes a few seconds.</p>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:10px;"><a href="${CALENDLY_URL}" style="${btnPrimary}">Schedule a meeting →</a></td>
          <td><a href="${WHATSAPP_URL}" style="${btnWa}">💬 WhatsApp</a></td>
        </tr></table>
      </div>
    </td></tr>

    <!-- 5. LOCATION -->
    <tr><td style="padding:0 32px;">
      <div style="${card}">
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td width="44" valign="top"><div style="width:36px;height:36px;border-radius:10px;background:#ede9fe;text-align:center;line-height:36px;font-size:18px;">📍</div></td>
          <td valign="top" style="padding-left:12px;">
            <p style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:#1a0a3e;">Meet us at EXTRA</p>
            <p style="${body}">You are welcome at:<br><strong style="color:#1a0a3e;">Herengracht 372, Amsterdam</strong></p>
          </td>
        </tr></table>
      </div>
    </td></tr>

    <!-- 6. WHY EXTRA -->
    <tr><td style="padding:0 32px;">
      <div style="${card}">
        <div style="${label}">Working at EXTRA</div>
        <p style="${h2}margin-bottom:16px;">Why work at EXTRA?</p>
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td width="33%" style="padding:10px 8px 10px 0;vertical-align:top;">
            <div style="background:#f5f3ff;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:24px;margin-bottom:8px;">⚡</div>
              <p style="margin:0;font-size:13px;font-weight:700;color:#1a0a3e;line-height:1.4;">Flexible shifts</p>
            </div>
          </td>
          <td width="33%" style="padding:10px 4px;vertical-align:top;">
            <div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:24px;margin-bottom:8px;">💸</div>
              <p style="margin:0;font-size:13px;font-weight:700;color:#1a0a3e;line-height:1.4;">Fast payment</p>
            </div>
          </td>
          <td width="33%" style="padding:10px 0 10px 8px;vertical-align:top;">
            <div style="background:#fff7ed;border-radius:12px;padding:16px;text-align:center;">
              <div style="font-size:24px;margin-bottom:8px;">🎉</div>
              <p style="margin:0;font-size:13px;font-weight:700;color:#1a0a3e;line-height:1.4;">EXTRAATje rewards</p>
            </div>
          </td>
        </tr></table>
      </div>
    </td></tr>

    <!-- 7. CLOSING -->
    <tr><td style="padding:0 32px 32px;">
      <div style="${card}margin-bottom:0;">
        <p style="${body}margin-bottom:12px;">Can't make it at the scheduled time? Just reschedule so we can plan someone else in.</p>
        <p style="${body}margin-bottom:20px;">Looking forward to meeting you 🙌</p>
        <p style="margin:0;font-size:15px;color:#374151;line-height:1.75;">Best regards,<br><strong style="color:#1a0a3e;">Team EXTRA</strong></p>
      </div>
    </td></tr>
  `;

  const html = `<!DOCTYPE html>
<html lang="${useEnglish ? 'en' : 'nl'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${useEnglish ? "Your application is in – EXTRA" : "Je aanmelding is binnen – EXTRA"}</title>
${emailMobileCss()}</head>
<body style="margin:0;padding:0;background:#f0eff5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0eff5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- ① HERO BANNER -->
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            <img src="${getEmailBannerSrc()}"
                 width="600" height="200"
                 alt="EXTRA"
                 style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:0;text-decoration:none;">
          </td>
        </tr>
        <!-- ① HERO GREETING -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f1a8f 0%,#2e1766 100%);padding:28px 32px 24px;text-align:center;">
            <div style="font-size:22px;font-weight:900;color:#ffffff;font-family:'Arial Black',Arial,sans-serif;line-height:1.25;margin-bottom:6px;">
              ${useEnglish ? "Application in. Let&#39;s go! 🚀" : "Aangemeld bij EXTRA. Let&#39;s go! 🚀"}
            </div>
            <div style="font-size:14px;color:rgba(233,213,255,0.80);line-height:1.5;">
              ${useEnglish ? "Welcome to EXTRA. Time to meet." : "Welkom bij EXTRA. Tijd om kennis te maken."}
            </div>
          </td>
        </tr>

        <!-- ② BODY SECTIONS -->
        <tr>
          <td style="background:#f7f5fb;border-radius:0 0 16px 16px;padding-bottom:8px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              ${useEnglish ? enBody : nlBody}

              <!-- ⑧ FOOTER -->
              <tr>
                <td style="padding:16px 32px 28px;">
                  <div style="border-top:1px solid #e9d5ff;padding-top:20px;text-align:center;">
                    <p style="margin:0 0 6px 0;font-size:20px;font-weight:900;color:#6d28d9;font-family:'Arial Black',Arial,sans-serif;letter-spacing:-0.5px;">EXTRA</p>
                    <p style="margin:0 0 6px 0;font-size:12px;color:#9ca3af;line-height:1.6;">${useEnglish ? "This is an automated email." : "Dit is een automatisch bericht."}</p>
                    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">${useEnglish ? "Questions?" : "Vragen?"} <a href="mailto:info@doehetextra.nl" style="color:#6d28d9;text-decoration:none;font-weight:600;">info@doehetextra.nl</a></p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = useEnglish
    ? `Hi ${candidate.firstName},

Great that you signed up with EXTRA ⚡

We always love meeting new people who are ready to get to work.

WHAT HAPPENS NEXT?
1. Schedule your intro
2. Visit EXTRA at Herengracht 372, Amsterdam
3. Start your first shifts

Haven't booked your intro yet?
Schedule here: ${CALENDLY_URL}
Or WhatsApp us: ${WHATSAPP_URL}

Can't make it at the scheduled time? Just reschedule so we can plan someone else in.

Looking forward to meeting you 🙌

Best regards,
Team EXTRA

Questions? info@doehetextra.nl`
    : `Hi ${candidate.firstName},

Top dat je je hebt aangemeld bij EXTRA ⚡

We vinden het altijd leuk om nieuwe mensen te ontmoeten die zin hebben om lekker aan de slag te gaan.

WAT GEBEURT ER NU?
1. Plan je kennismaking
2. Kom langs bij EXTRA — Herengracht 372, Amsterdam
3. Pak je eerste diensten

Nog geen afspraak ingepland?
Plan hier: ${CALENDLY_URL}
Of stuur ons een WhatsApp: ${WHATSAPP_URL}

Kun je toch niet? Pas je afspraak dan gewoon even aan zodat we iemand anders kunnen inplannen.

We kijken ernaar uit om je te ontmoeten 🙌

Groet,
Team EXTRA

Vragen? info@doehetextra.nl`;

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
}): Promise<boolean> {
  const functionLabels: Record<string, string> = {
    housekeeping: 'Housekeeping medewerker',
    horecamedewerker: 'Horecamedewerker',
    chef: 'Chef / Kok',
    frontoffice: 'Front office medewerker',
  };
  const functionLabel = functionLabels[candidate.functionType] || candidate.functionType;

  const baseUrl = candidate.baseUrl || process.env.BASE_URL || 'https://brochure.doehetextra.nl';
  const acceptUrl = candidate.reviewToken
    ? `${baseUrl}/api/candidates/${candidate.id}/accept?token=${candidate.reviewToken}`
    : `${baseUrl}/dashboard-mockup`;
  const rejectUrl = candidate.reviewToken
    ? `${baseUrl}/api/candidates/${candidate.id}/reject?token=${candidate.reviewToken}`
    : `${baseUrl}/dashboard-mockup`;

  const cell = (label: string, value: string | null | undefined) =>
    `<td style="padding:10px 14px;vertical-align:top;width:50%;border-bottom:1px solid #f3f4f6;">
      <div style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">${label}</div>
      <div style="color:#111827;font-size:14px;font-weight:600;">${value || '—'}</div>
    </td>`;

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">${emailMobileCss()}</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            <img src="${getEmailBannerSrc()}"
                 width="600" height="200"
                 alt="EXTRA"
                 style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:0;text-decoration:none;">
          </td>
        </tr>
        <tr>
          <td style="padding:20px 20px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <tr>
                ${cell('Voornaam', candidate.firstName)}
                ${cell('Achternaam', candidate.lastName)}
              </tr>
              <tr>
                ${cell('Functie', functionLabel)}
                ${cell('Woonplaats', candidate.city)}
              </tr>
              <tr>
                ${cell('Telefoonnummer', candidate.phone)}
                ${cell('E-mail', candidate.email)}
              </tr>
              <tr>
                ${cell('Geboortedatum', candidate.birthDate ? candidate.birthDate.split('-').reverse().join('-') : null)}
                ${cell('Nationaliteit', candidate.nationality)}
              </tr>
            </table>
            ${candidate.cvFilename ? `<div style="margin:16px 0 8px;padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:13px;color:#166534;">📎 CV bijgevoegd als bijlage bij deze mail</div>` : `<div style="margin:16px 0 8px;padding:10px 14px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;font-size:13px;color:#854d0e;">⚠️ Nog geen CV geüpload door kandidaat</div>`}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;margin-bottom:8px;">
              <tr>
                <td style="padding:0 0 8px 0;">
                  <a href="${acceptUrl}" style="display:block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:8px;font-size:15px;font-weight:700;text-align:center;">✅ Accepteren</a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 0 12px 0;">
                  <a href="${rejectUrl}" style="display:block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:8px;font-size:15px;font-weight:700;text-align:center;">❌ Afwijzen</a>
                </td>
              </tr>
              <tr>
                <td style="text-align:center;padding-bottom:4px;">
                  <a href="${baseUrl}/dashboard-mockup" style="display:inline-block;color:#7c3aed;text-decoration:underline;font-size:13px;">Bekijk in dashboard</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;">
            EXTRA · Herengracht 372 · Amsterdam
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Nieuwe aanmelding via doehetextra.nl\n\nVoornaam: ${candidate.firstName} | Achternaam: ${candidate.lastName}\nFunctie: ${functionLabel} | Woonplaats: ${candidate.city || '—'}\nE-mail: ${candidate.email || '—'} | Telefoonnummer: ${candidate.phone || '—'}\nGeboortedatum: ${candidate.birthDate || '—'} | Nationaliteit: ${candidate.nationality || '—'}\n\n✅ Accepteren: ${acceptUrl}\n❌ Afwijzen: ${rejectUrl}`;

  const recipients = getAdminRecipientsForFunction(candidate.functionType);

  // Laad CV bijlage als beschikbaar
  const attachments: EmailAttachment[] = [];
  if (candidate.cvFilename) {
    const cvPath = path.join(process.cwd(), 'uploads', 'cv', candidate.cvFilename);
    if (fs.existsSync(cvPath)) {
      try {
        const cvBuffer = fs.readFileSync(cvPath);
        const ext = path.extname(candidate.cvFilename).toLowerCase();
        const mimeType = ext === '.pdf' ? 'application/pdf'
          : ext === '.doc' ? 'application/msword'
          : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/octet-stream';
        attachments.push({
          content: cvBuffer.toString('base64'),
          filename: `CV_${candidate.firstName}_${candidate.lastName}${ext}`,
          type: mimeType,
          disposition: 'attachment',
        });
      } catch (err) {
        console.warn('Kon CV niet bijvoegen:', err);
      }
    }
  }

  // Stuur naar elke ontvanger afzonderlijk (SendGrid vereist dit voor attachments bij meerdere ontvangers)
  const results = await Promise.all(recipients.map(to =>
    sendEmail({
      to,
      from: 'EXTRA 🚀 <max@doehetextra.nl>',
      subject: `Nieuwe aanmelding – ${candidate.firstName} ${candidate.lastName} (${functionLabel})`,
      html,
      text,
      attachments,
    })
  ));
  return results.every(Boolean);
}

// Stuur Calendly-uitnodiging naar geaccepteerde kandidaat
export async function sendCalendlyInviteEmail(candidate: {
  firstName: string;
  email: string;
}): Promise<boolean> {
  if (!candidate.email) return false;

  const calendlyUrl = 'https://calendly.com/max-_zs/30min';

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">${emailMobileCss()}</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            <img src="${getEmailBannerSrc()}"
                 width="600" height="200"
                 alt="EXTRA"
                 style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:0;text-decoration:none;">
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 24px;">
            <p style="margin:0 0 16px;font-size:15px;color:#111827;">Hi ${candidate.firstName},</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Wat leuk dat je je bij ons hebt aangemeld!</p>
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Op basis van je aanmelding en CV nodigen we je graag uit voor een kort kennismakingsgesprek. Tijdens dit gesprek vertellen we je meer over EXTRA en kijken we samen welke opdrachten goed bij je passen.</p>
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Plan hier eenvoudig een moment dat voor jou uitkomt:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td>
                  <a href="${calendlyUrl}" style="display:block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:8px;font-size:15px;font-weight:700;text-align:center;">📅 Plan een gesprek in</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;">Of kopieer de link: <a href="${calendlyUrl}" style="color:#7c3aed;word-break:break-all;">${calendlyUrl}</a></p>
            <p style="margin:20px 0 0;font-size:15px;color:#374151;">We spreken je snel!<br><br>Groet,<br><strong>Team EXTRA</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;">
            EXTRA · Herengracht 372 · Amsterdam
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${candidate.firstName},\n\nWat leuk dat je je bij ons hebt aangemeld!\n\nOp basis van je aanmelding en CV nodigen we je graag uit voor een kort kennismakingsgesprek. Tijdens dit gesprek vertellen we je meer over EXTRA en kijken we samen welke opdrachten goed bij je passen.\n\nPlan hier eenvoudig een moment dat voor jou uitkomt:\n${calendlyUrl}\n\nWe spreken je snel!\n\nGroet,\nTeam EXTRA`;

  return await sendEmail({
    to: candidate.email,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: 'Leuk dat je je hebt aangemeld bij EXTRA',
    html,
    text,
  });
}

// Stuur afwijzingsmail naar sollicitant
export async function sendApplicationRejectionEmail(applicant: {
  firstName: string;
  email: string;
}): Promise<boolean> {
  if (!applicant.email) return false;

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">${emailMobileCss()}</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            <img src="${getEmailBannerSrc()}"
                 width="600" height="200"
                 alt="EXTRA"
                 style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:0;text-decoration:none;">
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 16px;font-size:15px;color:#111827;">Hi ${applicant.firstName},</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Bedankt dat je laatst bij ons langs bent geweest voor het gesprek. Leuk om kennis te maken en meer over je te horen!</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Op dit moment hebben we helaas besloten om niet met je verder te gaan. Dit heeft vooral te maken met het aantal diensten dat we momenteel beschikbaar hebben in verhouding tot het aantal mensen in onze poule.</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Dat zegt dus niet per se iets over jou, maar meer over de planning en het aantal plekken dat we nu hebben.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">We wensen je in ieder geval veel succes met je verdere zoektocht en wie weet kruisen onze paden in de toekomst nog eens.</p>
            <p style="margin:0;font-size:15px;color:#374151;">Groet,<br><strong>Team EXTRA</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;">
            EXTRA · Herengracht 372 · Amsterdam
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${applicant.firstName},\n\nBedankt dat je laatst bij ons langs bent geweest voor het gesprek. Leuk om kennis te maken en meer over je te horen!\n\nOp dit moment hebben we helaas besloten om niet met je verder te gaan. Dit heeft vooral te maken met het aantal diensten dat we momenteel beschikbaar hebben in verhouding tot het aantal mensen in onze poule.\n\nDat zegt dus niet per se iets over jou, maar meer over de planning en het aantal plekken dat we nu hebben.\n\nWe wensen je in ieder geval veel succes met je verdere zoektocht en wie weet kruisen onze paden in de toekomst nog eens.\n\nGroet,\nTeam EXTRA`;

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
}): Promise<boolean> {
  if (!candidate.email) return false;

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">${emailMobileCss()}</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            <img src="${getEmailBannerSrc()}"
                 width="600" height="200"
                 alt="EXTRA"
                 style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:0;text-decoration:none;">
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 24px;">
            <p style="margin:0 0 16px;font-size:15px;color:#111827;">Hi ${candidate.firstName},</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Bedankt voor je aanmelding bij EXTRA en voor het opsturen van je CV.</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Op basis van de informatie die we nu hebben denken we dat we op dit moment helaas niet voldoende passende opdrachten voor je kunnen bieden.</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Daarom hebben we besloten om je aanmelding op dit moment niet verder in behandeling te nemen.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">We wensen je veel succes met je verdere zoektocht naar een leuke baan in de horeca.</p>
            <p style="margin:0;font-size:15px;color:#374151;">Groet,<br><strong>Team EXTRA</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;">
            EXTRA · Herengracht 372 · Amsterdam
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${candidate.firstName},\n\nBedankt voor je aanmelding bij EXTRA en voor het opsturen van je CV.\n\nOp basis van de informatie die we nu hebben denken we dat we op dit moment helaas niet voldoende passende opdrachten voor je kunnen bieden.\n\nDaarom hebben we besloten om je aanmelding op dit moment niet verder in behandeling te nemen.\n\nWe wensen je veel succes met je verdere zoektocht naar een leuke baan in de horeca.\n\nGroet,\nTeam EXTRA`;

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
}): Promise<boolean> {
  if (!candidate.email) return false;

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">${emailMobileCss()}</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            <img src="${getEmailBannerSrc()}"
                 width="600" height="200"
                 alt="EXTRA"
                 style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:0;text-decoration:none;">
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 16px;font-size:15px;color:#111827;">Hi ${candidate.firstName},</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Bedankt voor je interesse in EXTRA en het insturen van je gegevens.</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Na het bekijken van je CV hebben we besloten om op dit moment niet verder te gaan met de sollicitatie. Voor de opdrachten waar we momenteel mensen voor zoeken is meer relevante ervaring nodig.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">We wensen je veel succes met je verdere stappen en bedanken je voor je interesse in EXTRA.</p>
            <p style="margin:0;font-size:15px;color:#374151;">Groet,<br><strong>Team EXTRA</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;">
            EXTRA · Herengracht 372 · Amsterdam
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${candidate.firstName},\n\nBedankt voor je interesse in EXTRA en het insturen van je gegevens.\n\nNa het bekijken van je CV hebben we besloten om op dit moment niet verder te gaan met de sollicitatie. Voor de opdrachten waar we momenteel mensen voor zoeken is meer relevante ervaring nodig.\n\nWe wensen je veel succes met je verdere stappen en bedanken je voor je interesse in EXTRA.\n\nGroet,\nTeam EXTRA`;

  return await sendEmail({
    to: candidate.email,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: 'Update over je sollicitatie bij EXTRA',
    html,
    text,
  });
}

export async function sendCvUploadFirstEmail(candidate: { firstName: string; email: string; id: number }): Promise<boolean> {
  const uploadUrl = `https://www.doehetextra.nl/aanmelden`;

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Upload je cv bij EXTRA</title>${emailMobileCss()}</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);max-width:600px;width:100%;">
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            <img src="${getEmailBannerSrc()}"
                 width="600" height="200"
                 alt="EXTRA"
                 style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:0;text-decoration:none;">
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi ${candidate.firstName},</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Bedankt voor je aanmelding bij EXTRA! We hebben je gegevens goed ontvangen.</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Om een gesprek in te plannen hebben we nog je cv nodig. Zo kunnen we kijken of er een goede match is met onze opdrachten.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Het hele proces duurt nog maar een paar minuten.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${uploadUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;padding:14px 36px;border-radius:12px;">Upload je cv &rarr;</a>
            </div>
            <p style="margin:24px 0 0;font-size:14px;color:#9ca3af;line-height:1.6;">Zonder cv kunnen we helaas geen gesprek inplannen. Heb je vragen? App ons gerust.</p>
            <p style="margin:24px 0 0;font-size:15px;color:#374151;">Groet,<br><strong>Team EXTRA</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;">
            EXTRA · Herengracht 372 · Amsterdam
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return await sendEmail({
    to: candidate.email,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: 'Upload je cv om een gesprek in te plannen',
    html,
    text: `Hi ${candidate.firstName},\n\nBedankt voor je aanmelding bij EXTRA!\n\nOm een gesprek in te plannen hebben we nog je cv nodig. Ga naar ${uploadUrl} om je cv te uploaden.\n\nGroet,\nTeam EXTRA`,
  });
}

export async function sendCvReminderEmail(candidate: { firstName: string; email: string; id: number }): Promise<boolean> {
  const uploadUrl = `https://www.doehetextra.nl/aanmelden`;

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reminder: upload je cv bij EXTRA</title>${emailMobileCss()}</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);max-width:600px;width:100%;">
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            <img src="${getEmailBannerSrc()}"
                 width="600" height="200"
                 alt="EXTRA"
                 style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:0;text-decoration:none;">
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi ${candidate.firstName},</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">We hebben je aanmelding bij EXTRA nog staan, maar je cv ontbreekt nog. Zonder cv kunnen we helaas geen gesprek inplannen.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Het uploaden duurt maar een minuutje — dan kunnen we snel kijken of er een goede match is!</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${uploadUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;padding:14px 36px;border-radius:12px;">Upload je cv nu &rarr;</a>
            </div>
            <p style="margin:24px 0 0;font-size:14px;color:#9ca3af;line-height:1.6;">Heb je vragen of wil je je aanmelding intrekken? Stuur ons dan even een berichtje.</p>
            <p style="margin:24px 0 0;font-size:15px;color:#374151;">Groet,<br><strong>Team EXTRA</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;">
            EXTRA · Herengracht 372 · Amsterdam
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return await sendEmail({
    to: candidate.email,
    from: 'EXTRA <max@doehetextra.nl>',
    subject: 'Reminder: upload je cv om een gesprek in te plannen',
    html,
    text: `Hi ${candidate.firstName},\n\nJe cv ontbreekt nog bij je aanmelding bij EXTRA. Zonder cv kunnen we geen gesprek inplannen.\n\nGa naar ${uploadUrl} om je cv te uploaden.\n\nGroet,\nTeam EXTRA`,
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

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>TWV verloopt binnenkort</title>${emailMobileCss()}</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);max-width:600px;width:100%;">
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            <img src="${getEmailBannerSrc()}"
                 width="600" height="200"
                 alt="EXTRA"
                 style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:0;text-decoration:none;">
          </td>
        </tr>
        <tr>
          <td style="background:linear-gradient(135deg,#d97706,#b45309);padding:16px 28px;text-align:center;">
            <div style="color:#ffffff;font-size:18px;font-weight:700;">⚠️ TWV verloopt binnenkort</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Beste collega,</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">De tewerkstellingsvergunning (TWV) van <strong>${fullName}</strong> verloopt over <strong>${candidate.daysLeft} dagen</strong> op <strong>${endDateFormatted}</strong>.</p>
            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:16px 20px;margin:20px 0;">
              <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">Actie vereist</p>
              <p style="margin:6px 0 0;font-size:14px;color:#78350f;line-height:1.5;">Vergeet niet op tijd een verlengingsaanvraag in te dienen bij het UWV om te voorkomen dat de medewerker zonder geldige vergunning werkt.</p>
            </div>
            <p style="margin:24px 0 0;font-size:15px;color:#374151;line-height:1.6;">Bekijk het TWV-overzicht in het dashboard voor meer details.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="https://app.doehetextra.nl/dashboard-mockup" style="display:inline-block;background:#d97706;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;padding:14px 36px;border-radius:12px;">Open TWV-dashboard &rarr;</a>
            </div>
            <p style="margin:24px 0 0;font-size:15px;color:#374151;">Groet,<br><strong>Team EXTRA – Geautomatiseerde melding</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;">
            EXTRA · Herengracht 372 · Amsterdam
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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