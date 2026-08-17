// ─── Centrale segment-resolver voor prospect-campagnes ──────────────────────
// Gebruikt door emailService, abEngine en flowEngine om consistente filtering
// toe te passen.
//
// De beslisregels zelf staan in server/campagneDoelgroep.ts: die zijn puur en
// getest. Dit bestand doet nog één ding — de contacten ophalen — zodat de
// regels niet aan de database vastzitten en er geen tweede plek kan ontstaan
// waar "wie krijgt deze mail" net iets anders wordt beantwoord.
import { storage } from './storage';
import { doelgroep, type DoelgroepFilters } from './campagneDoelgroep';
import type { ProspectCampaign, ProspectContact } from '@shared/schema';

export async function resolveCampaignAudience(
  campaign: ProspectCampaign,
): Promise<ProspectContact[]> {
  const allContacts = await storage.getProspectContacts({});
  return doelgroep(allContacts as any, campaign as unknown as DoelgroepFilters) as ProspectContact[];
}
