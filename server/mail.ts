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
    console.log(`E-mail succesvol verzonden naar ${params.to}`);
    return true;
  } catch (error) {
    console.error('Fout bij verzenden van e-mail:', error);
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
  interviewDate?: string | null;
  interviewTime?: string | null;
}): Promise<boolean> {
  if (!candidate.email) {
    console.warn("Geen e-mailadres voor kandidaat, bevestigingsmail overgeslagen");
    return false;
  }

  const fullName = `${candidate.firstName} ${candidate.lastName}`.trim();
  const fromEmail = "info@doehetextra.nl";
  const fromName = "EXTRA";

  const functionLabels: Record<string, string> = {
    housekeeping: "Housekeeping medewerker",
    horecamedewerker: "Horecamedewerker",
    chef: "Chef / Kok",
    frontoffice: "Front office medewerker",
  };
  const functionLabel = functionLabels[candidate.functionType] || candidate.functionType;

  const interviewInfo = candidate.interviewDate
    ? `<p style="margin:0 0 8px 0;">Je gesprek is ingepland op <strong>${candidate.interviewDate}</strong>${candidate.interviewTime ? ` om <strong>${candidate.interviewTime}</strong>` : ""}.</p>`
    : `<p style="margin:0 0 8px 0;">We nemen binnenkort contact met je op om een gesprek in te plannen.</p>`;

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Aanmelding ontvangen – EXTRA</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6c2bd9 0%,#9333ea 100%);padding:40px 40px 32px;text-align:center;">
            <div style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-1px;">EXTRA</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:4px;letter-spacing:2px;text-transform:uppercase;">hospitality staffing</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 16px 0;font-size:24px;color:#1a1a2e;font-weight:700;">Aanmelding ontvangen! 🎉</h1>
            <p style="margin:0 0 16px 0;font-size:16px;color:#4b5563;line-height:1.6;">Hoi ${candidate.firstName},</p>
            <p style="margin:0 0 24px 0;font-size:16px;color:#4b5563;line-height:1.6;">
              Bedankt voor je aanmelding bij <strong>EXTRA</strong>. We hebben je gegevens ontvangen en gaan er zo snel mogelijk mee aan de slag!
            </p>
            <!-- Samenvatting -->
            <div style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:24px;">
              <h2 style="margin:0 0 16px 0;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Jouw aanmelding</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6b7280;width:40%;">Naam</td>
                  <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:600;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6b7280;">Gewenste functie</td>
                  <td style="padding:6px 0;font-size:14px;color:#1a1a2e;font-weight:600;">${functionLabel}</td>
                </tr>
              </table>
            </div>
            <!-- Volgende stap -->
            <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
              <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#15803d;">Wat nu?</h3>
              ${interviewInfo}
              <p style="margin:0;font-size:14px;color:#166534;line-height:1.5;">Heb je vragen? Stuur ons een berichtje via WhatsApp of mail naar <a href="mailto:info@doehetextra.nl" style="color:#166534;">info@doehetextra.nl</a>.</p>
            </div>
            <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.6;">Welkom bij de EXTRA-familie! We kijken ernaar uit om je te leren kennen.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0 0 4px 0;font-size:13px;color:#9ca3af;">EXTRA Hospitality Staffing</p>
            <p style="margin:0;font-size:12px;color:#d1d5db;">Dit is een automatisch gegenereerde e-mail. Neem contact op via info@doehetextra.nl voor vragen.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hoi ${candidate.firstName},

Bedankt voor je aanmelding bij EXTRA!

We hebben je aanmelding ontvangen voor de functie: ${functionLabel}

${candidate.interviewDate
  ? `Je gesprek is ingepland op ${candidate.interviewDate}${candidate.interviewTime ? ` om ${candidate.interviewTime}` : ""}.`
  : "We nemen binnenkort contact met je op om een gesprek in te plannen."}

Heb je vragen? Stuur ons een e-mail via info@doehetextra.nl.

Met vriendelijke groet,
Het EXTRA team`;

  return await sendEmail({
    to: candidate.email,
    from: `${fromName} <${fromEmail}>`,
    subject: `✅ Aanmelding ontvangen, ${candidate.firstName}! – EXTRA`,
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