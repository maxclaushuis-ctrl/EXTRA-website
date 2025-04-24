import { MailService } from '@sendgrid/mail';
import { storage } from './storage';
import { EmailTemplate, User } from '@shared/schema';

// Configuratie voor de mail service
let mailService: MailService | null = null;

// Initialiseer de mail service als de API key beschikbaar is
export function initMailService(): boolean {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  
  if (!SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY niet ingesteld, e-mailfunctionaliteit is uitgeschakeld");
    return false;
  }
  
  try {
    mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    console.log("Mail service succesvol geïnitialiseerd");
    return true;
  } catch (error) {
    console.error("Fout bij initialiseren van mail service:", error);
    mailService = null;
    return false;
  }
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
  return await sendTemplateEmail('birthday', user, { points });
}

// Helper functie om placeholders in templates te vervangen
function replaceTemplatePlaceholders(
  content: string,
  user: User,
  additionalData: Record<string, any> = {}
): string {
  let result = content;
  
  // Vervang gebruiker placeholders
  result = result.replace(/\{\{naam\}\}/g, user.name || '');
  result = result.replace(/\{\{email\}\}/g, user.email || '');
  result = result.replace(/\{\{punten\}\}/g, user.points?.toString() || '0');
  
  // Vervang alle additonele data placeholders
  for (const [key, value] of Object.entries(additionalData)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value?.toString() || '');
  }
  
  return result;
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