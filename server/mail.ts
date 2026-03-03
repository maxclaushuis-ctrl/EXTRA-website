import { MailService } from '@sendgrid/mail';
import { storage } from './storage';
import { EmailTemplate, User } from '@shared/schema';

// Configuratie voor de mail service
let mailService: MailService | null = null;
let useMockService = false;
let mockMailLog: any[] = [];

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
interface EmailParams {
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
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
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`✅ E-mail succesvol verzonden naar ${params.to} (onderwerp: ${params.subject})`);
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

  // Taal bepalen: Engels als nationaliteit niet NL is EN geen Nederlands opgegeven als taal
  const speaksDutch = (candidate.language || "").toLowerCase().includes("nederland");
  const isNlNationality = (candidate.nationality || "").toLowerCase().includes("nederland");
  const useEnglish = !speaksDutch && !isNlNationality;

  const fromEmail = "max@doehetextra.nl";
  const fromName = "EXTRA";

  const functionLabelsNL: Record<string, string> = {
    housekeeping: "Housekeeping medewerker",
    horecamedewerker: "Horecamedewerker",
    chef: "Chef / Kok",
    frontoffice: "Front office medewerker",
  };
  const functionLabelsEN: Record<string, string> = {
    housekeeping: "Housekeeping staff",
    horecamedewerker: "Hospitality staff",
    chef: "Chef / Cook",
    frontoffice: "Front office staff",
  };
  const functionLabel = useEnglish
    ? (functionLabelsEN[candidate.functionType] || candidate.functionType)
    : (functionLabelsNL[candidate.functionType] || candidate.functionType);

  const CALENDLY_URL = "https://calendly.com/max-_zs/30min";
  const WHATSAPP_URL = "https://wa.me/31854012373";

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Je aanmelding is binnen – EXTRA</title></head>
<body style="margin:0;padding:0;background:#f0eff5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0eff5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 4px 24px rgba(30,10,70,0.10);">

        <!-- ===== BANNER 600×200 ===== -->
        <tr>
          <td height="200" style="padding:0;overflow:hidden;background:#1a0a3e;">
            <div style="position:relative;overflow:hidden;height:200px;width:600px;background:linear-gradient(135deg, #2e1065 0%, #1a0a3e 48%, #1e1b4b 100%);">

              <!-- Radiale gloed in centrum-boven -->
              <div style="position:absolute;top:-60px;left:50%;width:340px;height:280px;margin-left:-170px;background:radial-gradient(ellipse at center, rgba(120,40,210,0.22) 0%, rgba(30,10,80,0) 70%);border-radius:50%;"></div>

              <!-- X-patronen -->
              <span style="position:absolute;top:-28px;left:-22px;font-size:170px;font-weight:900;color:rgba(255,255,255,0.055);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-8px;">X</span>
              <span style="position:absolute;bottom:-55px;right:-18px;font-size:195px;font-weight:900;color:rgba(255,255,255,0.055);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-8px;">X</span>
              <span style="position:absolute;top:8px;right:110px;font-size:105px;font-weight:900;color:rgba(255,255,255,0.04);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-4px;">X</span>
              <span style="position:absolute;bottom:2px;left:155px;font-size:88px;font-weight:900;color:rgba(255,255,255,0.038);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-3px;">X</span>
              <span style="position:absolute;top:-14px;left:300px;font-size:76px;font-weight:900;color:rgba(255,255,255,0.032);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-3px;">X</span>
              <span style="position:absolute;bottom:20px;right:270px;font-size:60px;font-weight:900;color:rgba(255,255,255,0.03);font-family:'Arial Black',Arial,sans-serif;line-height:1;letter-spacing:-2px;">X</span>

              <!-- EXTRA logo gecentreerd -->
              <table width="600" height="200" cellpadding="0" cellspacing="0" style="position:absolute;top:0;left:0;">
                <tr>
                  <td align="center" valign="middle" style="padding:0;">
                    <span style="font-size:58px;font-weight:900;color:#ffffff;letter-spacing:-2px;font-family:'Arial Black',Arial,sans-serif;line-height:1;display:block;">EXTRA</span>
                  </td>
                </tr>
              </table>

            </div>
          </td>
        </tr>

        <!-- ===== BODY ===== -->
        <tr>
          <td style="padding:40px 44px 12px;">
            ${useEnglish ? `
            <p style="margin:0 0 20px 0;font-size:17px;color:#1a0a3e;line-height:1.7;">Hi ${candidate.firstName},</p>
            <p style="margin:0 0 16px 0;font-size:16px;color:#374151;line-height:1.75;">Great that you've signed up with EXTRA — happy to have you on board! ⚡</p>
            <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.75;">We always love meeting new people who are ready to get to work.</p>
            <div style="background:#f5f3ff;border-radius:12px;padding:24px 28px;margin-bottom:28px;border:1px solid #ede9fe;">
              <p style="margin:0 0 10px 0;font-size:16px;color:#1a0a3e;font-weight:700;line-height:1.5;">Haven't scheduled your introduction yet?</p>
              <p style="margin:0 0 18px 0;font-size:15px;color:#4b5563;line-height:1.65;">Book your slot here:</p>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="border-radius:50px;background:#2e1065;padding-right:12px;">
                  <a href="${CALENDLY_URL}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.2px;">Schedule a meeting →</a>
                </td>
                <td style="border-radius:50px;background:#25d366;">
                  <a href="${WHATSAPP_URL}" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.2px;">💬 WhatsApp</a>
                </td>
              </tr></table>
            </div>
            <p style="margin:0 0 16px 0;font-size:16px;color:#374151;line-height:1.75;">You're welcome to visit us at <strong>Herengracht 372</strong> in Amsterdam.</p>
            <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.75;">Can't make it? No worries — <a href="${CALENDLY_URL}" style="color:#6d28d9;font-weight:600;text-decoration:none;">reschedule your appointment</a> so we can plan someone else in.</p>
            <p style="margin:0 0 32px 0;font-size:16px;color:#374151;line-height:1.75;">Looking forward to meeting you. See you soon! 🙌</p>
            <p style="margin:0;font-size:16px;color:#374151;line-height:1.75;">Best regards,<br><strong style="color:#1a0a3e;">Team EXTRA</strong></p>
            ` : `
            <p style="margin:0 0 20px 0;font-size:17px;color:#1a0a3e;line-height:1.7;">Hi ${candidate.firstName},</p>
            <p style="margin:0 0 16px 0;font-size:16px;color:#374151;line-height:1.75;">Top dat je je hebt aangemeld bij EXTRA, mooi dat je erbij wil horen! ⚡</p>
            <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.75;">We vinden het altijd leuk om nieuwe mensen te ontmoeten die zin hebben om lekker aan de slag te gaan.</p>
            <div style="background:#f5f3ff;border-radius:12px;padding:24px 28px;margin-bottom:28px;border:1px solid #ede9fe;">
              <p style="margin:0 0 10px 0;font-size:16px;color:#1a0a3e;font-weight:700;line-height:1.5;">Heb je nog geen datum ingepland voor je kennismaking?</p>
              <p style="margin:0 0 18px 0;font-size:15px;color:#4b5563;line-height:1.65;">Plan 'm dan hier in:</p>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="border-radius:50px;background:#2e1065;padding-right:12px;">
                  <a href="${CALENDLY_URL}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.2px;">Afspraak inplannen →</a>
                </td>
                <td style="border-radius:50px;background:#25d366;">
                  <a href="${WHATSAPP_URL}" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;letter-spacing:0.2px;">💬 WhatsApp</a>
                </td>
              </tr></table>
            </div>
            <p style="margin:0 0 16px 0;font-size:16px;color:#374151;line-height:1.75;">Je bent welkom bij ons op <strong>Herengracht 372</strong> in Amsterdam.</p>
            <p style="margin:0 0 28px 0;font-size:16px;color:#374151;line-height:1.75;">Kun je toch niet? No stress, <a href="${CALENDLY_URL}" style="color:#6d28d9;font-weight:600;text-decoration:none;">pas je afspraak even aan</a> zodat we iemand anders kunnen inplannen.</p>
            <p style="margin:0 0 32px 0;font-size:16px;color:#374151;line-height:1.75;">We kijken ernaar uit om je te ontmoeten. Tot snel! 🙌</p>
            <p style="margin:0;font-size:16px;color:#374151;line-height:1.75;">Groet,<br><strong style="color:#1a0a3e;">Team EXTRA</strong></p>
            `}
          </td>
        </tr>

        <!-- ===== FOOTER ===== -->
        <tr>
          <td style="padding:28px 44px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">${useEnglish
              ? `This is an automated email. For questions, contact us at <a href="mailto:max@doehetextra.nl" style="color:#6d28d9;text-decoration:none;">max@doehetextra.nl</a>.`
              : `Dit is een automatisch gegenereerde e-mail. Neem voor vragen contact op via <a href="mailto:max@doehetextra.nl" style="color:#6d28d9;text-decoration:none;">max@doehetextra.nl</a>.`
            }</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = useEnglish
    ? `Hi ${candidate.firstName},

Great that you've signed up with EXTRA — happy to have you on board! ⚡

We always love meeting new people who are ready to get to work.

Haven't scheduled your introduction yet?
Book your slot here: ${CALENDLY_URL}
Or send us a WhatsApp: ${WHATSAPP_URL}

You're welcome to visit us at Herengracht 372 in Amsterdam.

Can't make it? No worries — reschedule your appointment so we can plan someone else in.

Looking forward to meeting you. See you soon! 🙌

Best regards,
Team EXTRA`
    : `Hi ${candidate.firstName},

Top dat je je hebt aangemeld bij EXTRA, mooi dat je erbij wil horen! ⚡

We vinden het altijd leuk om nieuwe mensen te ontmoeten die zin hebben om lekker aan de slag te gaan.

Heb je nog geen datum ingepland voor je kennismaking?
Plan 'm dan hier in: ${CALENDLY_URL}
Of stuur ons een WhatsApp: ${WHATSAPP_URL}

Je bent welkom bij ons op Herengracht 372 in Amsterdam.

Kun je toch niet? No stress, pas je afspraak even aan zodat we iemand anders kunnen inplannen.

We kijken ernaar uit om je te ontmoeten. Tot snel! 🙌

Groet,
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

// Stuur admin-notificatiemail bij nieuwe voltooide aanmelding
export async function sendAdminCandidateNotificationEmail(candidate: {
  firstName: string;
  lastName: string;
  functionType: string;
  city?: string | null;
  email?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  nationality?: string | null;
}): Promise<boolean> {
  const functionLabels: Record<string, string> = {
    housekeeping: 'Housekeeping medewerker',
    horecamedewerker: 'Horecamedewerker',
    chef: 'Chef / Kok',
    frontoffice: 'Front office medewerker',
  };
  const functionLabel = functionLabels[candidate.functionType] || candidate.functionType;

  const row = (label: string, value: string | null | undefined) =>
    value
      ? `<tr><td style="padding:8px 12px;color:#6b7280;font-size:14px;white-space:nowrap;width:160px;">${label}</td><td style="padding:8px 12px;color:#111827;font-size:14px;font-weight:500;">${value}</td></tr>`
      : '';

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px 32px;">
            <div style="color:#ffffff;font-size:22px;font-weight:700;">📋 Nieuwe aanmelding</div>
            <div style="color:#ddd6fe;font-size:14px;margin-top:4px;">Er heeft iemand het aanmeldformulier ingevuld op doehetextra.nl</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              ${row('Voornaam', candidate.firstName)}
              ${row('Achternaam', candidate.lastName)}
              ${row('Functie', functionLabel)}
              ${row('Woonplaats', candidate.city)}
              ${row('E-mail', candidate.email)}
              ${row('Geboortedatum', candidate.birthDate)}
              ${row('Telefoonnummer', candidate.phone)}
              ${row('Nationaliteit', candidate.nationality)}
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="https://www.doehetextra.nl/dashboard-mockup" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">Bekijk in dashboard</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;">
            EXTRA · Herengracht 372 · Amsterdam
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Nieuwe aanmelding via doehetextra.nl\n\nVoornaam: ${candidate.firstName}\nAchternaam: ${candidate.lastName}\nFunctie: ${functionLabel}\nWoonplaats: ${candidate.city || '—'}\nE-mail: ${candidate.email || '—'}\nGeboortedatum: ${candidate.birthDate || '—'}\nTelefoonnummer: ${candidate.phone || '—'}\nNationaliteit: ${candidate.nationality || '—'}`;

  return await sendEmail({
    to: 'max@doehetextra.nl',
    from: 'max@doehetextra.nl',
    subject: 'Nieuwe aanmelding',
    html,
    text,
  });
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