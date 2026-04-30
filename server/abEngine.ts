// ─── A/B Engine — Stap 6 ──────────────────────────────────────────────────────
// Winnaarbepaling, doorstuurlogica en scheduler voor A/B test campagnes.

import { storage } from './storage';
import type { ProspectCampaign } from '@shared/schema';

// ─── Winnaar bepalen ───────────────────────────────────────────────────────────

export async function bepaalABWinnaar(
  campaignId: number,
  negeerDrempel = false
): Promise<{ winnaar: 'A' | 'B'; reden: string } | null> {
  const campaign = await storage.getProspectCampaign(campaignId);
  if (!campaign) throw new Error('Campagne niet gevonden');
  if (!campaign.abTestActief) return null;

  const stats = await storage.getABStats(campaignId);
  const { variantA: a, variantB: b } = stats;

  console.log(`[ABEngine] Campagne ${campaignId}: A=${a.geopendPct}% open / B=${b.geopendPct}% open`);

  // Minimale drempel: als beide 0% zijn, wacht of kies A
  const winnaarOp = campaign.abWinnaarOp || 'open_rate';
  const aScore = winnaarOp === 'click_rate' ? a.gekliktPct : a.geopendPct;
  const bScore = winnaarOp === 'click_rate' ? b.gekliktPct : b.geopendPct;

  if (!negeerDrempel && aScore === 0 && bScore === 0 && a.verzonden > 0) {
    console.log(`[ABEngine] Campagne ${campaignId}: Beide varianten 0% — wacht nog`);
    return null;
  }

  const winnaar: 'A' | 'B' = bScore > aScore ? 'B' : 'A';
  const reden = `Variant ${winnaar} wint met ${Math.max(aScore, bScore).toFixed(1)}% ${winnaarOp === 'click_rate' ? 'click rate' : 'open rate'} vs ${Math.min(aScore, bScore).toFixed(1)}%`;

  // Sla winnaar op
  await storage.updateProspectCampaign(campaignId, {
    abWinnaarVariant: winnaar,
    abWinnaarBepaaldOp: new Date(),
    abTestFase: 'doorgestuurd',
  } as any);

  console.log(`[ABEngine] Campagne ${campaignId}: ${reden}`);

  // Stuur winnaar naar rest
  try {
    await verstuurWinnaarNaarRest(campaignId, winnaar);
  } catch (err: any) {
    console.error(`[ABEngine] Fout bij doorsturen winnaar:`, err.message);
  }

  // Stuur notificatie
  try {
    const cName = campaign.name;
    const pct = Math.max(aScore, bScore).toFixed(1);
    await storage.createNotificatie({
      type: 'ab_winnaar',
      titel: `🏆 A/B winnaar bepaald`,
      bericht: `Campagne "${cName}": Variant ${winnaar} wint met ${pct}% ${winnaarOp === 'click_rate' ? 'click rate' : 'open rate'}`,
      link: `/campaigns/${campaignId}`,
      gelezen: 0,
    });
  } catch (notifErr: any) {
    console.error(`[ABEngine] Notificatie fout:`, notifErr.message);
  }

  return { winnaar, reden };
}

// ─── Winnaar naar rest sturen ─────────────────────────────────────────────────

export async function verstuurWinnaarNaarRest(
  campaignId: number,
  winnaarVariant: 'A' | 'B'
): Promise<{ verzonden: number; mislukt: number }> {
  const campaign = await storage.getProspectCampaign(campaignId);
  if (!campaign) throw new Error('Campagne niet gevonden');

  const baseUrl = process.env.BASE_URL || 'https://doehetextra.nl';

  // Haal alle contacten op die voldoen aan segmentfilters (incl. Blok 1 phase + functionTagIds)
  const { resolveCampaignAudience } = await import('./prospectSegmentResolver');
  const targets = await resolveCampaignAudience(campaign);

  // Filter contacten die al een mail_send hebben voor deze campagne
  const bestaandeSends = await storage.getMailSendsByCampaign(campaignId);
  const bestaandeContactIds = new Set(bestaandeSends.map(s => s.contactId).filter(Boolean));

  const rest = targets.filter(c => c.id && !bestaandeContactIds.has(c.id));

  if (rest.length === 0) {
    console.log(`[ABEngine] Campagne ${campaignId}: Geen resterende contacten om winnaar naar te sturen`);
    await storage.updateProspectCampaign(campaignId, { status: 'voltooid', abTestFase: 'voltooid' } as any);
    return { verzonden: 0, mislukt: 0 };
  }

  console.log(`[ABEngine] Campagne ${campaignId}: Winnaar variant ${winnaarVariant} sturen naar ${rest.length} contacten`);

  // Maak mail_send records aan met isAbTestSend = 0
  const mailSendIds: number[] = [];
  const { sendSingleMail } = await import('./emailService');

  for (const contact of rest) {
    const ms = await storage.createMailSend({
      campaignId,
      contactId: contact.id ?? null,
      email: contact.email!,
      variant: winnaarVariant,
      isAbTestSend: 0,
      status: 'pending',
      verzondenOp: null,
      foutMelding: null,
      linkMap: null,
    } as any);
    mailSendIds.push(ms.id);
  }

  // Verzend in batches van 50
  const BATCH_SIZE = 50;
  let verzonden = 0;
  let mislukt = 0;

  for (let i = 0; i < mailSendIds.length; i += BATCH_SIZE) {
    const batch = mailSendIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map(id => sendSingleMail(id, baseUrl)));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) verzonden++;
      else mislukt++;
    }
    if (i + BATCH_SIZE < mailSendIds.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Update campagne naar voltooid
  await storage.updateProspectCampaign(campaignId, {
    status: 'voltooid',
    abTestFase: 'voltooid',
  } as any);

  console.log(`[ABEngine] Winnaar verzonden: ${verzonden}/${rest.length}, ${mislukt} mislukt`);
  return { verzonden, mislukt };
}

// ─── A/B Winnaar scheduler ────────────────────────────────────────────────────

export async function checkABWinners(): Promise<void> {
  let campagnes: ProspectCampaign[];
  try {
    campagnes = await storage.getCampaignsForABCheck();
  } catch (err: any) {
    console.error('[ABEngine] getCampaignsForABCheck fout:', err.message);
    return;
  }

  if (campagnes.length === 0) return;

  console.log(`[ABEngine] ${campagnes.length} campagne(s) controleren op AB winnaar`);

  for (const camp of campagnes) {
    try {
      const stats = await storage.getABStats(camp.id);
      if (!stats.variantA.eersteVerzondenOp) continue;

      const urenGeleden = (Date.now() - stats.variantA.eersteVerzondenOp.getTime()) / (1000 * 3600);
      const naUren = camp.abWinnaarNaUren || 24;

      if (urenGeleden >= naUren) {
        console.log(`[ABEngine] Campagne ${camp.id} "${camp.name}": ${urenGeleden.toFixed(1)}u >= ${naUren}u — winnaar bepalen`);
        await bepaalABWinnaar(camp.id);
      }
    } catch (err: any) {
      console.error(`[ABEngine] Fout bij campagne ${camp.id}:`, err.message);
    }
  }
}
