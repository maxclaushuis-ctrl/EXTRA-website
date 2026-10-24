/**
 * Controle van een personeelsaanvraag (POST /api/staffing-request).
 *
 * Er zijn twee soorten aanvragen:
 *  - het volledige formulier op /personeelsaanvraag: e-mail is verplicht;
 *  - het korte "Bel mij terug"-formulier op de sectorpagina's van design 3.0
 *    (bron "terugbel"): alleen bedrijfsnaam, naam, telefoon en functie. Daar
 *    is e-mail optioneel, want EXTRA belt terug. De kolom email is NOT NULL,
 *    dus een ontbrekend adres wordt een lege string en er gaat dan geen
 *    bevestigingsmail uit.
 */
export interface AanvraagInvoer {
  companyName?: unknown;
  contactName?: unknown;
  email?: unknown;
  phone?: unknown;
  bron?: unknown;
}

export interface AanvraagControle {
  ok: boolean;
  fout?: string;
  /** Opgeschoonde waarden. */
  bedrijf: string;
  naam: string;
  email: string;
  telefoon: string;
  terugbel: boolean;
}

const tekst = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function controleerAanvraag(body: AanvraagInvoer): AanvraagControle {
  const terugbel = body.bron === "terugbel";
  const bedrijf = tekst(body.companyName);
  const naam = tekst(body.contactName);
  const email = tekst(body.email);
  const telefoon = tekst(body.phone);
  const basis = { bedrijf, naam, email, telefoon, terugbel };
  if (!bedrijf || !naam || !telefoon || (!email && !terugbel)) {
    return { ...basis, ok: false, fout: "Vul alle verplichte velden in." };
  }
  if (telefoon.replace(/\D/g, "").length < 8) {
    return { ...basis, ok: false, fout: "Vul een geldig telefoonnummer in." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ...basis, ok: false, fout: "Vul een geldig e-mailadres in." };
  }
  return { ...basis, ok: true };
}
