// ─── Centrale segment-resolver voor prospect-campagnes ──────────────────────
// Gebruikt door emailService, abEngine en flowEngine om consistente filtering
// toe te passen. Sinds april 2026 is de bron van waarheid voor functie-targeting
// het veld `functiegroep` op prospect_contacts (4 vaste opties uit
// FUNCTIEGROEPEN). De legacy `functieTags` array wordt nog meegenomen voor
// backwards compat met oude data, maar nieuwe campagnes gebruiken alleen
// `functiegroep`.
import { storage } from './storage';
import type { ProspectCampaign, ProspectContact } from '@shared/schema';

export async function resolveCampaignAudience(
  campaign: ProspectCampaign,
): Promise<ProspectContact[]> {
  const allContacts = await storage.getProspectContacts({});
  const bf = Array.isArray(campaign.brancheFilter) ? (campaign.brancheFilter as string[]) : [];
  const ff = Array.isArray(campaign.functieFilter) ? (campaign.functieFilter as string[]) : [];
  const tags: string[] = (() => {
    try { return JSON.parse((campaign as any).tagFilter || '[]'); } catch { return []; }
  })();
  const phaseFilter: string[] = Array.isArray((campaign as any).phaseFilter) ? (campaign as any).phaseFilter : [];
  const excludedIds = new Set<number>(
    Array.isArray((campaign as any).excludedContactIds)
      ? ((campaign as any).excludedContactIds as number[])
      : []
  );

  return allContacts.filter(c => {
    if (excludedIds.has(c.id)) return false;
    if (c.unsubscribed || c.contactStatus === 'uitgeschreven' || c.contactStatus === 'geblokkeerd') return false;
    if (campaign.typeFilter && campaign.typeFilter !== 'alles' && c.contactType !== campaign.typeFilter) return false;
    if (campaign.taalFilter && campaign.taalFilter !== 'alles' && c.taal !== campaign.taalFilter) return false;
    if (bf.length > 0 && !bf.some(b => c.branche === b || (c.brancheTags || []).includes(b))) return false;
    if (ff.length > 0) {
      // Primair: match op het gestandaardiseerde `functiegroep` veld.
      // Fallback: legacy `functieTags` array voor oude contacten.
      const cg = (c.functiegroep || '').toLowerCase();
      const cTagsLower = (c.functieTags || []).map(t => (t || '').toLowerCase());
      const ffLower = ff.map(f => f.toLowerCase());
      const matchPrimair = ffLower.includes(cg);
      const matchLegacy  = ffLower.some(f => cTagsLower.includes(f));
      if (!matchPrimair && !matchLegacy) return false;
    }
    if (tags.length > 0) {
      let cTags: string[] = [];
      try { cTags = JSON.parse(c.customTags || '[]'); } catch {}
      if (!tags.some(t => cTags.includes(t))) return false;
    }
    if (phaseFilter.length > 0 && !phaseFilter.includes((c as any).phase || 'nieuw')) return false;
    return !!c.email;
  });
}
