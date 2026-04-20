// ─── E-mail Generator ─────────────────────────────────────────────────────────
// Server-side HTML + plain text generation for prospect campaigns.

import { getEmailBannerSrc } from './mail';

export type ContactData = {
  voornaam?: string | null;
  achternaam?: string | null;
  naam?: string | null;
  bedrijf?: string | null;
  company?: string | null;
  functietitel?: string | null;
  stad?: string | null;
  taal?: string | null; // 'nl' | 'en' | 'Nederlands' | 'Engels'
  email?: string | null;
  id?: number;
};

type BuilderSettings = {
  achtergrond_email?: string;
  achtergrond_inhoud?: string;
  lettertype?: string;
  tekstkleur?: string;
  unsubscribe_tekst?: string;
  lay_out?: 'extra' | 'geen';
  header_kleur?: string;
  header_tekst?: string;
  footer_tekst?: string;
};

type BuilderBlock = {
  id: string;
  type: string;
  [key: string]: any;
};

type BuilderContent = {
  modus?: 'html' | 'plaintext';
  instellingen?: BuilderSettings;
  blokken?: BuilderBlock[];
};

const SIGNATURE_HTML = `<table style="font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:16px">
  <tr><td><strong>Max van der Berg</strong></td></tr>
  <tr><td>Commercieel Manager</td></tr>
  <tr><td>📞 <a href="tel:+31202443040" style="color:#7c3aed;text-decoration:none">+31 20 244 3040</a></td></tr>
  <tr><td>✉ <a href="mailto:max@doehetextra.nl" style="color:#7c3aed;text-decoration:none">max@doehetextra.nl</a></td></tr>
  <tr><td>🌐 <a href="https://doehetextra.nl" style="color:#7c3aed;text-decoration:none">doehetextra.nl</a></td></tr>
</table>`;

const SIGNATURE_TEXT = `--\nMax van der Berg\nCommercieel Manager\n+31 20 244 3040\nmax@doehetextra.nl\nhttps://doehetextra.nl`;

function isNl(taal?: string | null): boolean {
  if (!taal) return true;
  const t = taal.toLowerCase();
  return t === 'nl' || t === 'nederlands' || t === 'dutch';
}

export function personalizeText(text: string, contact: ContactData): string {
  const voornaam = contact.voornaam || '';
  const achternaam = contact.achternaam || '';
  const naam = contact.naam || [voornaam, achternaam].filter(Boolean).join(' ') || 'daar';
  const bedrijf = contact.bedrijf || contact.company || 'uw organisatie';
  const functietitel = contact.functietitel || '';
  const stad = contact.stad || '';

  return text
    .replace(/\{\{voornaam\}\}/gi, voornaam || 'daar')
    .replace(/\{\{achternaam\}\}/gi, achternaam)
    .replace(/\{\{naam\}\}/gi, naam)
    .replace(/\{\{bedrijf\}\}/gi, bedrijf)
    .replace(/\{\{bedrijfsnaam\}\}/gi, bedrijf)
    .replace(/\{\{functietitel\}\}/gi, functietitel)
    .replace(/\{\{stad\}\}/gi, stad);
}

export function generateEmailHTML(
  content: BuilderContent | string | null,
  contact: ContactData,
  trackingPixelUrl?: string,
  unsubscribeUrl?: string,
  clickTrackingUrl?: string
): string {
  // Parse content if string
  let parsed: BuilderContent;
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : (content ?? { blokken: [] });
  } catch {
    // Fallback: try as legacy array of old blocks
    try {
      const oldBlocks: any[] = typeof content === 'string' ? JSON.parse(content) : [];
      return generateLegacyHTML(oldBlocks, contact, trackingPixelUrl, unsubscribeUrl, clickTrackingUrl);
    } catch {
      return '<p>Geen e-mailinhoud</p>';
    }
  }

  // If legacy array format
  if (Array.isArray(parsed)) {
    return generateLegacyHTML(parsed as any[], contact, trackingPixelUrl, unsubscribeUrl, clickTrackingUrl);
  }

  const settings = parsed.instellingen ?? {};
  const bgEmail = settings.achtergrond_email || '#F9FAFB';
  const bgInhoud = settings.achtergrond_inhoud || '#FFFFFF';
  const font = settings.lettertype || 'Inter, Arial, sans-serif';
  const tekstkleur = settings.tekstkleur || '#111827';
  const unsubTekst = settings.unsubscribe_tekst || 'Wil je geen mails meer ontvangen? Klik hier om je uit te schrijven.';
  const layOut = settings.lay_out ?? 'extra';
  const headerKleur = settings.header_kleur || '#5b2eb5';
  const headerTekst = settings.header_tekst || 'EXTRA';
  const footerTekst = settings.footer_tekst || 'EXTRA · Herengracht 372 · Amsterdam';
  const nl = isNl(contact.taal);

  const blokken = parsed.blokken ?? [];

  const blocksHtml = blokken.map(blok => renderBlockHtml(blok, contact, nl, clickTrackingUrl)).join('\n');

  const unsubHtml = unsubscribeUrl
    ? `<p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb">
        <a href="${unsubscribeUrl}" style="color:#9ca3af">${personalizeText(unsubTekst, contact)}</a>
       </p>`
    : '';

  const pixel = trackingPixelUrl
    ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />`
    : '';

  // Preheader (first 100 chars of text content)
  const preheader = blokken
    .filter(b => b.type === 'paragraaf' || b.type === 'aanhef')
    .map(b => b.tekst || (nl ? b.nl : b.en) || '')
    .join(' ')
    .replace(/<[^>]+>/g, '')
    .slice(0, 100);

  // EXTRA branded shell — gebruikt EXACT dezelfde banner-afbeelding als de andere mails
  const bannerSrc = getEmailBannerSrc();
  const headerHtml = layOut === 'extra'
    ? `<tr><td style="padding:0;line-height:0;font-size:0">
         <img src="${bannerSrc}" width="600" height="200" alt="EXTRA"
              style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:0;text-decoration:none" />
       </td></tr>`
    : '';

  const footerHtml = layOut === 'extra'
    ? `<tr><td style="padding:14px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;font-family:${font}">${footerTekst}</td></tr>`
    : '';

  const contentRadius = layOut === 'extra' ? '0' : '8px';
  const contentPadding = layOut === 'extra' ? '28px 28px 20px' : '32px 28px';

  return `<!DOCTYPE html>
<html lang="${nl ? 'nl' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-mail</title>
  <style>
    body { margin:0; padding:0; background-color:${bgEmail}; font-family:${font}; }
    @media only screen and (max-width:600px) { .email-wrapper { width:100% !important; } .email-content { padding:24px 18px !important; } }
  </style>
</head>
<body>
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${bgEmail};padding:24px 16px">
    <tr><td align="center">
      <table class="email-wrapper" width="600" cellpadding="0" cellspacing="0" border="0"
        style="background-color:${bgInhoud};border-radius:8px;color:${tekstkleur};font-family:${font};font-size:15px;line-height:1.6;overflow:hidden">
        ${headerHtml}
        <tr><td class="email-content" style="background:${bgInhoud};padding:${contentPadding};border-radius:${contentRadius}">
          ${blocksHtml}
          ${unsubHtml}
        </td></tr>
        ${footerHtml}
      </table>
      ${pixel}
    </td></tr>
  </table>
</body>
</html>`;
}

function renderBlockHtml(blok: BuilderBlock, contact: ContactData, nl: boolean, clickUrl?: string): string {
  const p = (t: string) => personalizeText(t, contact);

  switch (blok.type) {
    case 'koptekst': {
      const tag = blok.niveau || 'h2';
      const size = tag === 'h1' ? '26px' : tag === 'h2' ? '22px' : '18px';
      return `<${tag} style="font-size:${size};font-weight:700;color:${blok.kleur || '#111827'};text-align:${blok.uitlijning || 'left'};margin:0 0 16px">${p(blok.tekst || '')}</${tag}>`;
    }
    case 'paragraaf':
      return `<p style="font-size:15px;color:${blok.kleur || '#374151'};text-align:${blok.uitlijning || 'left'};margin:0 0 16px;line-height:1.7">${p(blok.tekst || '').replace(/\n/g, '<br/>')}</p>`;
    case 'knop': {
      const url = clickUrl
        ? `${clickUrl}?dest=${encodeURIComponent(blok.url || '#')}`
        : p(blok.url || '#');
      const align = blok.uitlijning || 'left';
      return `<div style="text-align:${align};margin:20px 0"><a href="${url}" style="background:${blok.achtergrond || '#7c3aed'};color:${blok.tekstkleur || '#fff'};padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">${p(blok.tekst || 'Meer informatie')}</a></div>`;
    }
    case 'lijn':
      return `<hr style="border:none;border-top:${blok.dikte || 1}px solid ${blok.kleur || '#e5e7eb'};margin:16px 0"/>`;
    case 'ruimte':
      return `<div style="height:${blok.hoogte || 24}px"></div>`;
    case 'afbeelding':
      if (!blok.url) return '';
      const imgTag = `<img src="${blok.url}" alt="${blok.alt || ''}" style="max-width:100%;border-radius:8px;display:block;margin:0 auto 16px"/>`;
      return blok.link ? `<a href="${blok.link}">${imgTag}</a>` : imgTag;
    case 'handtekening':
      return SIGNATURE_HTML;
    case 'taalvariant':
      return `<p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.7">${p(nl ? (blok.nl || '') : (blok.en || '')).replace(/\n/g, '<br/>')}</p>`;
    case 'aanhef': {
      const aanhef = nl ? (blok.nl || 'Beste {{voornaam}},') : (blok.en || 'Hi {{voornaam}},');
      return `<p style="font-size:15px;color:#374151;margin:0 0 16px"><strong>${p(aanhef)}</strong></p>`;
    }
    // Legacy
    case 'heading':
    case 'text':
    case 'button':
    case 'divider':
    case 'spacer':
    case 'image':
      return renderLegacyBlockHtml(blok, contact, clickUrl);
    default:
      return '';
  }
}

function generateLegacyHTML(blocks: any[], contact: ContactData, pixelUrl?: string, unsubUrl?: string, clickUrl?: string): string {
  const bodyStyle = 'font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px 24px';
  const inner = blocks.map(b => renderLegacyBlockHtml(b, contact, clickUrl)).join('\n');
  const pixel = pixelUrl ? `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />` : '';
  const unsub = unsubUrl ? `<p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:24px"><a href="${unsubUrl}" style="color:#9ca3af">Uitschrijven</a></p>` : '';
  return `<div style="${bodyStyle}">\n${inner}\n${unsub}\n${pixel}\n</div>`;
}

function renderLegacyBlockHtml(b: any, contact: ContactData, clickUrl?: string): string {
  const p = (t: string) => personalizeText(t || '', contact);
  if (b.type === 'heading') return `<h2 style="font-size:22px;font-weight:700;color:#1e1b4b;margin:0 0 12px;text-align:${b.align || 'left'}">${p(b.text)}</h2>`;
  if (b.type === 'text') return `<p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 12px">${p(b.text).replace(/\n/g, '<br/>')}</p>`;
  if (b.type === 'button') {
    const url = clickUrl ? `${clickUrl}?dest=${encodeURIComponent(b.url || '#')}` : p(b.url || '#');
    return `<div style="text-align:center;margin:20px 0"><a href="${url}" style="background:${b.color};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">${p(b.label)}</a></div>`;
  }
  if (b.type === 'spacer') return `<div style="height:${b.height}px"></div>`;
  if (b.type === 'divider') return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>`;
  if (b.type === 'image' && b.url) return `<img src="${b.url}" alt="${b.alt || ''}" style="max-width:100%;border-radius:8px;display:block;margin:0 auto 12px"/>`;
  return '';
}

export function generateEmailPlainText(
  content: BuilderContent | string | null,
  contact: ContactData,
  unsubscribeUrl?: string
): string {
  let parsed: BuilderContent;
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : (content ?? { blokken: [] });
  } catch {
    return '';
  }

  if (Array.isArray(parsed)) {
    const lines = (parsed as any[]).map(b => {
      if (b.type === 'text' || b.type === 'paragraaf') return personalizeText(b.text || '', contact);
      if (b.type === 'heading' || b.type === 'koptekst') return `\n${personalizeText(b.text || b.tekst || '', contact).toUpperCase()}\n`;
      if (b.type === 'button' || b.type === 'knop') return `${personalizeText(b.label || b.tekst || '', contact)}: ${personalizeText(b.url || '', contact)}`;
      if (b.type === 'divider' || b.type === 'lijn') return '---';
      return '';
    }).filter(Boolean);
    return lines.join('\n\n') + (unsubscribeUrl ? `\n\nUitschrijven: ${unsubscribeUrl}` : '');
  }

  const nl = isNl(contact.taal);
  const blokken = parsed.blokken ?? [];
  const settings = parsed.instellingen ?? {};
  const unsubTekst = settings.unsubscribe_tekst || 'Uitschrijven';

  const lines = blokken.map(blok => {
    const p = (t: string) => personalizeText(t || '', contact);
    switch (blok.type) {
      case 'koptekst': return `\n${p(blok.tekst || '').toUpperCase()}\n`;
      case 'paragraaf': return p(blok.tekst || '');
      case 'knop': return `${p(blok.tekst || '')}:\n${p(blok.url || '')}`;
      case 'lijn': return '---';
      case 'ruimte': return '';
      case 'afbeelding': return blok.url ? `[Afbeelding: ${blok.url}]` : '';
      case 'handtekening': return SIGNATURE_TEXT;
      case 'taalvariant': return p(nl ? (blok.nl || '') : (blok.en || ''));
      case 'aanhef': {
        const aanhef = nl ? (blok.nl || 'Beste {{voornaam}},') : (blok.en || 'Hi {{voornaam}},');
        return p(aanhef);
      }
      default: return '';
    }
  }).filter(s => s !== null && s !== undefined && s.trim() !== '');

  let text = lines.join('\n\n');
  if (unsubscribeUrl) {
    text += `\n\n---\n${personalizeText(unsubTekst, contact)}: ${unsubscribeUrl}`;
  }
  return text;
}
