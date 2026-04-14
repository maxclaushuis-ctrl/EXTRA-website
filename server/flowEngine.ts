// ─── Flow Engine — Stap 5 ─────────────────────────────────────────────────────
// Verwerkt flow stappen per contact en evalueert condities.

import { storage } from './storage';
import type { FlowContactProgress, FlowStep } from '@shared/schema';

// ─── Conditie evaluatie ────────────────────────────────────────────────────────

async function evaluateCondition(
  condition: any,
  contactId: number,
  campaignId: number
): Promise<boolean> {
  const { conditie, referentie_stap_id: refStapId, dagen = 3 } = condition;

  // Zoek de e-mail stap op om mail_send te vinden
  const emailStep = refStapId
    ? await storage.getFlowStepByStapId(campaignId, refStapId)
    : null;

  if (!emailStep) return false;

  // Vind de bijbehorende mail_sends voor dit contact + campagne
  const mailSends = await storage.getMailSendsByCampaign(campaignId);
  const contactMailSend = mailSends.find(ms => ms.contactId === contactId);
  if (!contactMailSend) return false;

  const events = await storage.getMailEventsByMailSend(contactMailSend.id);

  if (conditie === 'mail_geopend') {
    return events.some(e => e.type === 'open');
  }

  if (conditie === 'link_geklikt') {
    return events.some(e => e.type === 'click');
  }

  if (conditie === 'geen_actie') {
    const heeftActie = events.some(e => e.type === 'open' || e.type === 'click');
    if (heeftActie) return false;
    if (!contactMailSend.verzondenOp) return false;
    const dagenGeleden = (Date.now() - new Date(contactMailSend.verzondenOp).getTime()) / (1000 * 60 * 60 * 24);
    return dagenGeleden >= dagen;
  }

  return false;
}

// ─── Stap verwerking ──────────────────────────────────────────────────────────

export async function processFlowStep(progressId: number): Promise<void> {
  const progress = await storage.getFlowContactProgressById(progressId);
  if (!progress || progress.status !== 'actief') return;

  const step = await storage.getFlowStepByStapId(progress.campaignId, progress.huidigeStapId);
  if (!step) {
    await storage.updateFlowContactProgress(progressId, {
      status: 'error',
      foutMelding: `Stap '${progress.huidigeStapId}' niet gevonden`,
    });
    return;
  }

  let config: any = {};
  try { config = JSON.parse(step.config || '{}'); } catch {}

  try {
    switch (step.type) {

      case 'trigger':
        // Direct naar volgende stap
        await moveToNextStep(progress, step, null, progressId);
        break;

      case 'email': {
        // Verzend e-mail via emailService
        const { sendCampaignBatch } = await import('./emailService');
        const baseUrl = process.env.BASE_URL || 'https://doehetextra.nl';

        // Maak een tijdelijke mail_send voor dit contact en verzend
        const mailSend = await storage.createMailSend({
          campaignId: progress.campaignId,
          contactId: progress.contactId,
          email: '', // wordt gevuld door prepareMail via contactId
          variant: 'A',
          status: 'pending',
          verzondenOp: null,
          foutMelding: null,
          linkMap: null,
        });

        const { sendSingleMail } = await import('./emailService');
        await sendSingleMail(mailSend.id, baseUrl);
        await moveToNextStep(progress, step, null, progressId);
        break;
      }

      case 'wait': {
        const waarde = config.waarde || 1;
        const eenheid = config.eenheid || 'dagen';
        const msPerEenheid = eenheid === 'uren' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const wachtTot = new Date(Date.now() + waarde * msPerEenheid);
        await storage.updateFlowContactProgress(progressId, { wachtTot });
        console.log(`[FlowEngine] Contact ${progress.contactId} wacht tot ${wachtTot.toISOString()}`);
        break;
      }

      case 'condition': {
        const result = await evaluateCondition(config, progress.contactId, progress.campaignId);
        const nextId = result ? step.nextStapIdYes : step.nextStapId;
        await moveToNextStep(progress, step, nextId || null, progressId);
        break;
      }

      case 'tag_action': {
        const { actie, tag } = config;
        if (tag && progress.contactId) {
          const contact = await storage.getProspectContact(progress.contactId);
          if (contact) {
            const currentTags: string[] = contact.tags || [];
            let newTags: string[];
            if (actie === 'toevoegen') {
              newTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag];
            } else {
              newTags = currentTags.filter(t => t !== tag);
            }
            await storage.updateProspectContact(progress.contactId, { tags: newTags });
          }
        }
        await moveToNextStep(progress, step, null, progressId);
        break;
      }

      case 'end':
        await storage.updateFlowContactProgress(progressId, { status: 'voltooid' });
        console.log(`[FlowEngine] Contact ${progress.contactId} voltooid flow ${progress.campaignId}`);
        break;

      default:
        console.warn(`[FlowEngine] Onbekend stap type: ${step.type}`);
        await moveToNextStep(progress, step, null, progressId);
    }
  } catch (err: any) {
    console.error(`[FlowEngine] Fout bij verwerken stap ${step.stapId}:`, err.message);
    await storage.updateFlowContactProgress(progressId, {
      status: 'error',
      foutMelding: err.message || 'Onbekende fout',
    });
  }
}

async function moveToNextStep(
  progress: FlowContactProgress,
  step: FlowStep,
  overrideNextId: string | null,
  progressId: number
): Promise<void> {
  const nextStapId = overrideNextId ?? step.nextStapId;
  if (!nextStapId) {
    // Geen volgende stap — als er een end-node is, markeer voltooid
    await storage.updateFlowContactProgress(progressId, { status: 'voltooid' });
    return;
  }
  await storage.updateFlowContactProgress(progressId, {
    huidigeStapId: nextStapId,
    wachtTot: null,
  });
  // Verwerk de volgende stap direct (recursief, tenzij het een wacht/eind stap is)
  const nextStep = await storage.getFlowStepByStapId(progress.campaignId, nextStapId);
  if (nextStep && nextStep.type !== 'wait' && nextStep.type !== 'end') {
    await processFlowStep(progressId);
  } else if (nextStep?.type === 'end') {
    await processFlowStep(progressId);
  }
}

// ─── Flow Scheduler ───────────────────────────────────────────────────────────

export async function runFlowScheduler(): Promise<void> {
  const actieve = await storage.getActiveFlowProgresses();
  if (actieve.length === 0) return;

  console.log(`[FlowEngine] Scheduler: ${actieve.length} contacten te verwerken`);
  let verwerkt = 0;

  for (const progress of actieve) {
    try {
      await processFlowStep(progress.id);
      verwerkt++;
    } catch (err: any) {
      console.error(`[FlowEngine] Fout bij progress ${progress.id}:`, err.message);
    }
  }

  console.log(`[FlowEngine] Scheduler klaar: ${verwerkt}/${actieve.length} verwerkt`);
}

// ─── Flow activeren ───────────────────────────────────────────────────────────

export async function activateFlow(campaignId: number): Promise<{ gestart: number }> {
  const campaign = await storage.getProspectCampaign(campaignId);
  if (!campaign) throw new Error('Campagne niet gevonden');

  // Haal trigger stap op
  const steps = await storage.getFlowSteps(campaignId);
  const trigger = steps.find(s => s.type === 'trigger');
  if (!trigger) throw new Error('Geen trigger stap gevonden');

  // Haal contacten op die voldoen aan de segmentfilters
  const allContacts = await storage.getProspectContacts({});
  const bf = Array.isArray(campaign.brancheFilter) ? campaign.brancheFilter : [];
  const ff = Array.isArray(campaign.functieFilter) ? campaign.functieFilter : [];

  const targets = allContacts.filter(c => {
    if (c.unsubscribed || c.contactStatus === 'uitgeschreven' || c.contactStatus === 'geblokkeerd') return false;
    if (campaign.typeFilter && campaign.typeFilter !== 'alles' && c.contactType !== campaign.typeFilter) return false;
    if (campaign.taalFilter && campaign.taalFilter !== 'alles' && c.taal !== campaign.taalFilter) return false;
    if (bf.length > 0 && !bf.some(b => c.branche === b)) return false;
    if (ff.length > 0 && !ff.some(f => (c.functieTags || []).includes(f))) return false;
    return !!c.email;
  });

  // Maak flow_contact_progress records aan
  let gestart = 0;
  for (const contact of targets) {
    if (!contact.id) continue;
    const bestaand = await storage.getFlowContactProgress(campaignId, contact.id);
    if (bestaand) continue; // Al gestart
    await storage.createFlowContactProgress({
      campaignId,
      contactId: contact.id,
      huidigeStapId: trigger.stapId,
      status: 'actief',
      wachtTot: null,
      foutMelding: null,
      bijgewerktOp: new Date(),
    });
    gestart++;
  }

  // Update campagne status
  await storage.updateProspectCampaign(campaignId, { status: 'actief' });

  console.log(`[FlowEngine] Flow ${campaignId} geactiveerd voor ${gestart} contacten`);

  // Direct de eerste stap verwerken
  setTimeout(() => runFlowScheduler().catch(console.error), 100);

  return { gestart };
}
