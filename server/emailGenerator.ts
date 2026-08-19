// ─── E-mail Generator ─────────────────────────────────────────────────────────
// Server-side HTML + plain text generation for prospect campaigns.

import { getEmailBannerSrc } from './mail';
import { kolommenHtml, kolommenTekst, KOLOM_MEDIA_CSS } from './emailKolommen';
import { personaliseer, type PersonalisatieContact } from './personalisatie';

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

// Inline-link parser: zet [tekst](url) om naar veilige <a>-tags
// Ondersteunt http(s):, mailto:, tel: schemes. Andere worden geweigerd.
export function renderInlineLinks(text: string): string {
  if (!text) return '';
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) => {
    const trimmed = url.trim();
    const safe = /^(https?:|mailto:|tel:)/i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`;
    const escapedUrl = safe.replace(/"/g, '&quot;');
    return `<a href="${escapedUrl}" style="color:#7c3aed;text-decoration:underline" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
}

/**
 * Vervangt merge-tags in een stuk tekst.
 *
 * De vervanging zelf staat in server/personalisatie.ts. Deze functie blijft
 * bestaan omdat hij op ruim tien plekken in dit bestand wordt aangeroepen, maar
 * doet zelf niets meer. Dat is met opzet: er stonden drie verschillende
 * vervangingen in de codebase (body, onderwerp, flow-mail), met verschillende
 * terugvalwaarden en verschillende schrijfwijzen. Nu is er één.
 */
export function personalizeText(text: string, contact: ContactData): string {
  return personaliseer(text || '', contact as PersonalisatieContact);
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

  // ── Platte-tekst-modus: render zonder branded shell, banner of Poppins.
  // Levert toch HTML af zodat link-tracking en de tracking-pixel werken,
  // maar visueel oogt het als een persoonlijke 1-op-1 mail.
  if (parsed.modus === 'plaintext') {
    return generatePlainTextHTML(parsed, contact, trackingPixelUrl, unsubscribeUrl, clickTrackingUrl);
  }

  const settings = parsed.instellingen ?? {};
  const bgEmail = settings.achtergrond_email || '#F9FAFB';
  const bgInhoud = settings.achtergrond_inhoud || '#FFFFFF';
  const fontName = settings.lettertype || 'Poppins';
  const font = `'${fontName}', Arial, Helvetica, sans-serif`;
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

  // Preheader — de voorbeeldtekst die in de inbox naast de onderwerpregel staat.
  //
  // Deze werd opgebouwd uit de ruwe bloktekst, zónder de merge-tags te
  // vervangen. Daardoor stond er bij iedereen letterlijk "Beste {{voornaam}},
  // Fijn dat we voor {{bedrijf}}..." in de inbox — nog vóór het openen van de
  // mail. Het was daarmee de enige plek waar een onvervangen tag écht zichtbaar
  // werd, en meteen de meest zichtbare plek die er is.
  //
  // De personalisatie moet dus vóór het afkappen op 100 tekens, niet erna:
  // anders wordt een tag halverwege doorgesneden en is hij onvervangbaar.
  const preheader = personalizeText(
    blokken
      .filter(b => b.type === 'paragraaf' || b.type === 'aanhef' || b.type === 'kolommen')
      .map(b => b.tekst || (nl ? b.nl : b.en) || '')
      .join(' ')
      .replace(/<[^>]+>/g, ''),
    contact,
  ).slice(0, 100);

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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <!--[if mso]><style>* { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
  <style>
    body { margin:0; padding:0; background-color:${bgEmail}; font-family:${font}; }
    h1, h2, h3, .email-heading { font-family:${font} !important; font-weight:800 !important; letter-spacing:-0.01em; }
    @media only screen and (max-width:600px) { .email-wrapper { width:100% !important; } .email-content { padding:24px 18px !important; } ${KOLOM_MEDIA_CSS} }
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
      return `<${tag} class="email-heading" style="font-size:${size};font-weight:800;color:${blok.kleur || '#111827'};text-align:${blok.uitlijning || 'left'};margin:0 0 16px;letter-spacing:-0.01em">${renderInlineLinks(p(blok.tekst || ''))}</${tag}>`;
    }
    case 'paragraaf':
      return `<p style="font-size:15px;color:${blok.kleur || '#374151'};text-align:${blok.uitlijning || 'left'};margin:0 0 16px;line-height:1.7">${renderInlineLinks(p(blok.tekst || '')).replace(/\n/g, '<br/>')}</p>`;
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
    case 'kolommen':
      // De tekst gaat door dezelfde molen als een gewone paragraaf; het blok
      // zelf gaat alleen over de opmaak (server/emailKolommen.ts).
      return kolommenHtml({
        tekstHtml: renderInlineLinks(p(blok.tekst || '')).replace(/\n/g, '<br/>'),
        kleur: blok.kleur,
        beeldUrl: blok.url,
        beeldAlt: blok.alt,
        beeldLink: blok.link,
        beeldPositie: blok.beeldPositie,
        verhouding: blok.verhouding,
        verticaal: blok.verticaal,
      });
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

// Render een platte-tekstmail als minimal HTML: systeemfont, geen banner,
// behoudt alinea-witregels, maakt URLs klikbaar (en houdt link-tracking intact).
function generatePlainTextHTML(
  parsed: BuilderContent,
  contact: ContactData,
  trackingPixelUrl?: string,
  unsubscribeUrl?: string,
  clickTrackingUrl?: string
): string {
  const nl = isNl(contact.taal);
  const settings = parsed.instellingen ?? {};
  const unsubTekst = settings.unsubscribe_tekst || (nl
    ? 'Wil je geen mails meer ontvangen? Klik hier om je uit te schrijven.'
    : 'No longer want to receive these emails? Unsubscribe here.');
  const blokken = parsed.blokken ?? [];
  const p = (t: string) => personalizeText(t || '', contact);

  // Escape HTML special chars, dan inline-links omzetten naar <a>, dan \n → <br>
  const renderTextAsHtml = (raw: string): string => {
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Markdown-stijl links eerst
    const withLinks = escaped.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, url: string) => {
      const trimmed = url.trim();
      const safe = /^(https?:|mailto:|tel:)/i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`;
      const finalUrl = clickTrackingUrl && /^https?:/i.test(safe)
        ? `${clickTrackingUrl}?dest=${encodeURIComponent(safe)}`
        : safe;
      return `<a href="${finalUrl.replace(/"/g, '&quot;')}" style="color:#2563eb;text-decoration:underline">${label}</a>`;
    });
    // Naakte URLs auto-linken (alleen die nog geen <a> wrap hebben)
    const withAutoLinks = withLinks.replace(
      /(^|[\s])((https?:\/\/|www\.)[^\s<]+)(?=[.,;!?)]?(\s|$))/g,
      (_m, pre, url) => {
        const safe = url.startsWith('www.') ? `https://${url}` : url;
        const finalUrl = clickTrackingUrl ? `${clickTrackingUrl}?dest=${encodeURIComponent(safe)}` : safe;
        return `${pre}<a href="${finalUrl}" style="color:#2563eb;text-decoration:underline">${url}</a>`;
      }
    );
    return withAutoLinks.replace(/\n/g, '<br/>');
  };

  const paragraphs: string[] = [];
  for (const blok of blokken) {
    switch (blok.type) {
      case 'aanhef': {
        const aanhef = nl ? (blok.nl || 'Beste {{voornaam}},') : (blok.en || 'Hi {{voornaam}},');
        paragraphs.push(renderTextAsHtml(p(aanhef)));
        break;
      }
      case 'koptekst':
      case 'paragraaf':
        if (blok.tekst) paragraphs.push(renderTextAsHtml(p(blok.tekst)));
        break;
      case 'kolommen': {
        // In een tekstmail valt de afbeelding weg; de tekst blijft.
        const tekst = kolommenTekst(blok.tekst);
        if (tekst) paragraphs.push(renderTextAsHtml(p(tekst)));
        break;
      }
      case 'taalvariant': {
        const tekst = nl ? (blok.nl || '') : (blok.en || '');
        if (tekst) paragraphs.push(renderTextAsHtml(p(tekst)));
        break;
      }
      case 'knop': {
        const label = p(blok.tekst || '');
        const url = p(blok.url || '');
        if (label && url) {
          const safe = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url.replace(/^\/+/, '')}`;
          const finalUrl = clickTrackingUrl && /^https?:/i.test(safe)
            ? `${clickTrackingUrl}?dest=${encodeURIComponent(safe)}`
            : safe;
          paragraphs.push(`${label}: <a href="${finalUrl}" style="color:#2563eb;text-decoration:underline">${safe}</a>`);
        }
        break;
      }
      case 'lijn':
        paragraphs.push('---');
        break;
      case 'ruimte':
        paragraphs.push('');
        break;
      case 'handtekening':
        // Plain-text vriendelijke variant van de handtekening
        paragraphs.push(SIGNATURE_TEXT.replace(/\n/g, '<br/>'));
        break;
      case 'afbeelding':
      default:
        // Afbeeldingen, knoppen-in-fancy etc. worden in plain-text-modus genegeerd.
        break;
    }
  }

  const bodyHtml = paragraphs
    .map(par => par === '' ? '<br/>' : `<p style="margin:0 0 12px">${par}</p>`)
    .join('');

  const unsubHtml = unsubscribeUrl
    ? `<p style="font-size:11px;color:#9ca3af;margin-top:24px"><a href="${unsubscribeUrl}" style="color:#9ca3af">${personalizeText(unsubTekst, contact)}</a></p>`
    : '';

  const pixel = trackingPixelUrl
    ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />`
    : '';

  return `<!DOCTYPE html>
<html lang="${nl ? 'nl' : 'en'}">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:16px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#111827">
${bodyHtml}
${unsubHtml}
${pixel}
</body>
</html>`;
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
      case 'kolommen': return p(kolommenTekst(blok.tekst));
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
