// ─── Centrale segment-resolver voor prospect-campagnes (Blok 1) ──────────────
// Gebruikt door emailService, abEngine en flowEngine om consistente filtering
// toe te passen, inclusief de nieuwe phaseFilter en functionTagIds.
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
  const functionTagIds: number[] = Array.isArray((campaign as any).functionTagIds) ? (campaign as any).functionTagIds : [];

  // Pre-filter zonder m2m lookup
  const preFiltered = allContacts.filter(c => {
    if (c.unsubscribed || c.contactStatus === 'uitgeschreven' || c.contactStatus === 'geblokkeerd') return false;
    if (campaign.typeFilter && campaign.typeFilter !== 'alles' && c.contactType !== campaign.typeFilter) return false;
    if (campaign.taalFilter && campaign.taalFilter !== 'alles' && c.taal !== campaign.taalFilter) return false;
    if (bf.length > 0 && !bf.some(b => c.branche === b || (c.brancheTags || []).includes(b))) return false;
    if (ff.length > 0 && !ff.some(f => (c.functieTags || []).includes(f))) return false;
    if (tags.length > 0) {
      let cTags: string[] = [];
      try { cTags = JSON.parse(c.customTags || '[]'); } catch {}
      if (!tags.some(t => cTags.includes(t))) return false;
    }
    if (phaseFilter.length > 0 && !phaseFilter.includes((c as any).phase || 'nieuw')) return false;
    return !!c.email;
  });

  // M2m: gestandaardiseerde functietags pas filteren als nodig
  if (functionTagIds.length === 0) return preFiltered;

  const ids = preFiltered.map(c => c.id);
  const tagMap = await storage.getFunctionTagIdsByContactIds(ids);
  return preFiltered.filter(c => {
    const ctags = tagMap.get(c.id) || [];
    return functionTagIds.some(id => ctags.includes(id));
  });
}
