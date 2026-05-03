// ─── Flow Engine — Stap 5 + Blok 4 ────────────────────────────────────────────
// Verwerkt flow stappen per contact en evalueert condities.
// Blok 4: auto-stop bij reply / bounce / spam / unsubscribe + slimme wait die
// vaste verzendslots respecteert wanneer de campagne deze heeft geconfigureerd.

import { storage } from './storage';
import type { FlowContactProgress, FlowStep, ProspectContact, ProspectCampaign } from '@shared/schema';
import { eerstvolgendSlot, berekenWerkelijkVerzendMoment } from './schedulerUtils';

// ─── Blok 4: skip-check op contact ────────────────────────────────────────────
//
// Bepaalt of een contact nog mail mag ontvangen in een lopende flow.
// Eén centrale lijst van redenen zodat zowel processFlowStep (vóór email) als
// runFlowScheduler (vóór elke iteratie) hetzelfde gedrag vertonen.
export type SkipReden =
  | 'reply_ontvangen'
  | 'in_gesprek'
  | 'klant'
  | 'uitgesloten'
  | 'uitgeschreven'
  | 'hard_bounce'
  | 'spam_gemeld';

export function bepaalSkipReden(contact: ProspectContact | null | undefined): SkipReden | null {
  if (!contact) return 'uitgesloten';
  if (contact.lastReplyAt) return 'reply_ontvangen';
  if (contact.phase === 'in_gesprek') return 'in_gesprek';
  if (contact.phase === 'klant') return 'klant';
  if (contact.phase === 'uitgesloten') return 'uitgesloten';
  if (contact.unsubscribed) return 'uitgeschreven';
  if (contact.bounceStatus === 'hard') return 'hard_bounce';
  if (contact.spamReported) return 'spam_gemeld';
  return null;
}

const SKIP_REDEN_TEKST: Record<SkipReden, string> = {
  reply_ontvangen: 'Contact heeft geantwoord — flow automatisch gestopt',
  in_gesprek:      'Contact staat in gesprek — geen verdere mailings',
  klant:           'Contact is klant geworden — geen verdere mailings',
  uitgesloten:     'Contact is uitgesloten van campagnes',
  uitgeschreven:   'Contact heeft zich uitgeschreven',
  hard_bounce:     'Hard bounce ontvangen — contact uitgesloten van mail',
  spam_gemeld:     'Spam-rapport ontvangen — contact uitgesloten van mail',
};

export function tekstVoorSkipReden(reden: SkipReden): string {
  return SKIP_REDEN_TEKST[reden] || reden;
}

// ─── Blok 4: slimme wait helper ──────────────────────────────────────────────
// Schuif een wachtTot-tijdstip door naar het eerstvolgende geldige verzendmoment
// volgens de campagne-configuratie (vaste slots > toegestane dagen + tijdvenster).
export function berekenSlimWachtTot(ruweWachtTot: Date, campaign: ProspectCampaign): Date {
  const tz = campaign.tijdzone || 'Europe/Amsterdam';
  const slots: any[] | null = (campaign as any).verzendSlots ?? null;
  if (slots && slots.length > 0) {
    const eerstvolgend = eerstvolgendSlot(ruweWachtTot, slots, tz);
    if (eerstvolgend) return eerstvolgend;
  }
  // Geen vaste slots — gebruik de generieke berekening met toegestane dagen +
  // tijdvenster zodat 's avonds-mailings/weekend-mailings worden vermeden.
  try {
    return berekenWerkelijkVerzendMoment(ruweWachtTot, {
      alleenWerkdagen: campaign.alleenWerkdagen ?? false,
      tijdvensterStart: campaign.tijdvensterStart || '08:00',
      tijdvensterEind:  campaign.tijdvensterEind  || '18:00',
      tijdzone: tz,
      verzendDagen: (campaign as any).verzendDagen ?? null,
      verzendSlots: slots,
    });
  } catch {
    return ruweWachtTot;
  }
}

// ─── Blok 4: directe stop bij reply (gebruikt door inbound webhook) ──────────
// Stopt alle actieve flow-progresses voor een contact, ongeacht in welke
// campagne. Wordt aangeroepen vanuit sendgridInboundHandler zodra een echte
// reply binnenkomt zodat we niet hoeven te wachten op de scheduler-tick.
export async function stopFlowsBijReply(contactId: number, reden: SkipReden = 'reply_ontvangen'): Promise<{ gestopt: number }> {
  let gestopt = 0;
  try {
    const actieve = await storage.getActiveFlowProgressesByContact(contactId);
    for (const p of actieve) {
      await storage.updateFlowContactProgress(p.id, {
        status: 'gestopt',
        foutMelding: tekstVoorSkipReden(reden),
        wachtTot: null,
      });
      gestopt++;
    }
  } catch (err) {
    console.warn('[FlowEngine] stopFlowsBijReply mislukt:', err);
  }
  return { gestopt };
}

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

  // P1-fix: reply-condities. We controleren of het contact heeft gereageerd
  // NA het versturen van de referentie-mail. Zowel via contact.lastReplyAt als
  // (als fallback) via prospect_replies tabel.
  if (conditie === 'reply_ontvangen' || conditie === 'geen_reply') {
    if (!contactMailSend.verzondenOp) {
      return conditie === 'geen_reply';
    }
    const verzondenOp = new Date(contactMailSend.verzondenOp).getTime();
    const contact = await storage.getProspectContact(contactId);
    let heeftReply = !!(contact?.lastReplyAt && new Date(contact.lastReplyAt).getTime() >= verzondenOp);
    if (!heeftReply) {
      try {
        const replies = await storage.listProspectReplies({ contactId, campaignId, limit: 50 });
        heeftReply = replies.some((r: any) => r.receivedAt && new Date(r.receivedAt).getTime() >= verzondenOp);
      } catch { /* tabel niet beschikbaar — val terug op lastReplyAt-resultaat */ }
    }
    return conditie === 'reply_ontvangen' ? heeftReply : !heeftReply;
  }

  return false;
}

// ─── Trigger op event (klik/open in andere campagne) — P0-fix Flow Builder ──
// Wordt aangeroepen vanuit /track/click en /track/open. Vindt actieve flow-
// campagnes met een matching trigger-config en start dit contact in stap 1.
export async function triggerFlowsForEvent(
  sourceCampaignId: number,
  contactId: number | null,
  triggerType: 'klik_in_campagne' | 'open_van_campagne'
): Promise<void> {
  if (!contactId) return;
  try {
    const campaigns = await storage.getProspectCampaigns({});
    for (const c of campaigns) {
      if (c.status !== 'actief') continue;
      const steps = await storage.getFlowSteps(c.id);
      const trigger = steps.find(s => s.type === 'trigger');
      if (!trigger) continue;
      let cfg: any = {};
      try { cfg = JSON.parse(trigger.config || '{}'); } catch {}
      if (cfg.triggerType !== triggerType) continue;
      if (Number(cfg.bronCampagneId) !== Number(sourceCampaignId)) continue;
      // Skip-redenen: contact mag al uitgeschreven/klant/etc. zijn
      const contact = await storage.getProspectContact(contactId);
      if (bepaalSkipReden(contact)) continue;
      const bestaand = await storage.getFlowContactProgress(c.id, contactId);
      if (bestaand) continue;
      const progress = await storage.createFlowContactProgress({
        campaignId: c.id, contactId, huidigeStapId: trigger.stapId,
        status: 'actief', wachtTot: null, foutMelding: null, bijgewerktOp: new Date(),
      });
      console.log(`[FlowEngine] Trigger ${triggerType} → flow ${c.id} gestart voor contact ${contactId}`);
      // Direct doorzetten naar volgende stap
      setTimeout(() => processFlowStep(progress.id).catch(err => console.error('[FlowEngine] processFlowStep na trigger:', err)), 100);
    }
  } catch (err) {
    console.warn('[FlowEngine] triggerFlowsForEvent fout:', err);
  }
}

// ─── Stap verwerking ──────────────────────────────────────────────────────────

export async function processFlowStep(progressId: number): Promise<void> {
  const progress = await storage.getFlowContactProgressById(progressId);
  if (!progress || progress.status !== 'actief') return;

  // ─── Blok 4: auto-stop bij reply / opt-out / hard bounce / spam ────────────
  // Vóór ÉLKE stap een verse contact-check. Zo onderbreken we ook lopende
  // wait-periodes zodra een contact heeft geantwoord (de scheduler haalt deze
  // progress weer op zodra wachtTot bereikt is, of direct via reageerOpReply).
  const contact = await storage.getProspectContact(progress.contactId);
  const skipReden = bepaalSkipReden(contact);
  if (skipReden) {
    await storage.updateFlowContactProgress(progressId, {
      status: 'gestopt',
      foutMelding: tekstVoorSkipReden(skipReden),
      wachtTot: null,
    });
    console.log(`[FlowEngine] Contact ${progress.contactId} gestopt: ${skipReden}`);
    return;
  }

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
        const baseUrl = process.env.BASE_URL || 'https://doehetextra.nl';

        // Vul email in vanuit contact (anders kan SendGrid het niet versturen)
        const contactForMail = await storage.getProspectContact(progress.contactId);
        const mailSend = await storage.createMailSend({
          campaignId: progress.campaignId,
          contactId: progress.contactId,
          email: contactForMail?.email || '',
          variant: 'A',
          status: 'pending',
          verzondenOp: null,
          foutMelding: null,
          linkMap: null,
        });

        // P0-fix: per-stap eigen onderwerp + content. Valt terug op
        // campaign.contentA wanneer de stap geen eigen onderwerp/content heeft.
        const heeftEigenContent =
          !!(config.onderwerp || config.subject) &&
          !!(config.htmlContent || config.textContent);
        if (heeftEigenContent) {
          const { sendSingleFlowMail } = await import('./emailService');
          await sendSingleFlowMail(mailSend.id, baseUrl, {
            subject: config.onderwerp || config.subject,
            html: config.htmlContent,
            text: config.textContent,
          });
        } else {
          const { sendSingleMail } = await import('./emailService');
          await sendSingleMail(mailSend.id, baseUrl);
        }
        await moveToNextStep(progress, step, null, progressId);
        break;
      }

      case 'wait': {
        const waarde = config.waarde || 1;
        const eenheid = config.eenheid || 'dagen';
        const msPerEenheid = eenheid === 'uren' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        let wachtTot = new Date(Date.now() + waarde * msPerEenheid);

        // ─── Blok 4: slimme wait — respecteer verzendslots/-dagen van campagne ──
        // Als de campagne vaste slots of toegestane dagen + tijdvenster heeft,
        // schuiven we wachtTot door naar het eerstvolgende geldige verzendmoment.
        // Dat voorkomt mailings buiten de afgesproken vensters (bijv. 's avonds
        // of in het weekend) ook bij flow-driven stappen.
        try {
          const campaign = await storage.getProspectCampaign(progress.campaignId);
          if (campaign) {
            const verschoven = berekenSlimWachtTot(wachtTot, campaign);
            if (verschoven && verschoven.getTime() !== wachtTot.getTime()) {
              console.log(`[FlowEngine] Slimme wait: ${wachtTot.toISOString()} → ${verschoven.toISOString()} voor contact ${progress.contactId}`);
              wachtTot = verschoven;
            }
          }
        } catch (err) {
          console.warn('[FlowEngine] Slimme-wait-berekening mislukt, fallback op ruwe wachtTot:', err);
        }

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

  // Haal contacten op die voldoen aan de segmentfilters (incl. Blok 1 phase + functionTagIds)
  const { resolveCampaignAudience } = await import('./prospectSegmentResolver');
  const targets = await resolveCampaignAudience(campaign);

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
