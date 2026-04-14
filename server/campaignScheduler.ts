import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  berekenWerkelijkVerzendMoment,
  formatNLDatum,
  berekenReden,
  logScheduler,
} from "./schedulerUtils";

export interface PlanResultaat {
  uitgesteld: boolean;
  werkelijkMoment: Date | null;
  leesbaar: string | null;
  gecorrigeerd: boolean;
  reden: string | null;
}

// ─── Haal campagne op ────────────────────────────────────────────────────────
async function getCampagne(campaignId: number) {
  const result = await db.execute(sql`
    SELECT id, name, status, verzend_direct, scheduled_at, werkelijk_verzend_op,
           alleen_werkdagen, tijdvenster_start, tijdvenster_eind, tijdzone
    FROM prospect_campaigns WHERE id = ${campaignId} LIMIT 1
  `);
  return (result.rows as any[])[0] ?? null;
}

// ─── Update campagne kolommen ────────────────────────────────────────────────
async function updateCampagneVelden(
  campaignId: number,
  velden: Record<string, any>,
): Promise<boolean> {
  const entries = Object.entries(velden);
  if (entries.length === 0) return false;

  const setClause = entries
    .map(([k]) => `${k} = $${entries.indexOf(entries.find(e => e[0] === k)!) + 2}`)
    .join(', ');

  const result = await db.execute(
    sql.raw(
      `UPDATE prospect_campaigns SET ${entries.map(([k], i) => `${k} = $${i + 2}`).join(', ')}, updated_at = NOW() WHERE id = $1`,
      [campaignId, ...entries.map(([, v]) => v)],
    ),
  );
  return (result.rowCount ?? 0) > 0;
}

// ─── Notificatie aanmaken ────────────────────────────────────────────────────
async function maakNotificatie(
  type: string,
  titel: string,
  bericht: string,
  link?: string,
): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO notificaties (type, titel, bericht, link, gelezen, aangemaakt_op)
      VALUES (${type}, ${titel}, ${bericht}, ${link ?? null}, 0, NOW())
    `);
  } catch (err) {
    console.error('[campaignScheduler] Notificatie fout:', err);
  }
}

// ─── Plan campagne ─────────────────────────────────────────────────────────
export async function planCampagne(
  campaignId: number,
  opties: {
    verzendDirect?: boolean;
    verzendOp?: Date | null;
    alleenWerkdagen?: boolean;
    tijdvensterStart?: string;
    tijdvensterEind?: string;
    dryRun?: boolean;
  } = {},
): Promise<PlanResultaat> {
  const campagne = await getCampagne(campaignId);
  if (!campagne) throw new Error(`Campagne ${campaignId} niet gevonden`);

  const alleenWerkdagen = opties.alleenWerkdagen ?? campagne.alleen_werkdagen ?? true;
  const tvStart = opties.tijdvensterStart ?? campagne.tijdvenster_start ?? '08:00';
  const tvEind = opties.tijdvensterEind ?? campagne.tijdvenster_eind ?? '18:00';
  const verzendDirect = opties.verzendDirect ?? campagne.verzend_direct ?? false;

  let gewenstMoment: Date;
  if (verzendDirect) {
    gewenstMoment = new Date();
  } else {
    const base = opties.verzendOp ?? (campagne.scheduled_at ? new Date(campagne.scheduled_at) : null);
    if (!base) throw new Error('Geen verzendmoment opgegeven');
    gewenstMoment = new Date(base);
  }

  const werkelijkMoment = berekenWerkelijkVerzendMoment(
    gewenstMoment,
    alleenWerkdagen,
    tvStart,
    tvEind,
  );

  const reden = berekenReden(gewenstMoment, werkelijkMoment, alleenWerkdagen, tvStart, tvEind);
  const gecorrigeerd = reden !== null;
  const leesbaar = formatNLDatum(werkelijkMoment);
  const verschilMs = werkelijkMoment.getTime() - Date.now();
  const uitgesteld = verschilMs > 60_000;

  if (opties.dryRun) {
    return { uitgesteld, werkelijkMoment, leesbaar, gecorrigeerd, reden };
  }

  // Sla op
  await db.execute(sql`
    UPDATE prospect_campaigns
    SET status = 'gepland',
        scheduled_at = ${gewenstMoment.toISOString()},
        werkelijk_verzend_op = ${werkelijkMoment.toISOString()},
        verzend_direct = ${verzendDirect},
        alleen_werkdagen = ${alleenWerkdagen},
        tijdvenster_start = ${tvStart},
        tijdvenster_eind = ${tvEind},
        updated_at = NOW()
    WHERE id = ${campaignId}
  `);

  // Notificatie
  const melding = gecorrigeerd
    ? `${campagne.name} is verschoven van ${formatNLDatum(gewenstMoment)} naar ${leesbaar} vanwege het werkdagen-tijdvenster`
    : `${campagne.name} is ingepland op ${leesbaar}`;

  await maakNotificatie(
    gecorrigeerd ? 'campagne_verschoven' : 'campagne_ingepland',
    `Campagne ingepland: ${campagne.name}`,
    melding,
    `/campaigns/${campaignId}`,
  );

  await logScheduler('campagne_ingepland', campaignId, melding);

  return { uitgesteld, werkelijkMoment, leesbaar, gecorrigeerd, reden };
}

// ─── Check geplande campagnes ─────────────────────────────────────────────────
export async function checkGeplandeCampagnes(): Promise<number> {
  try {
    // Haal alle campagnes op die klaar zijn om verzonden te worden
    const result = await db.execute(sql`
      SELECT id, name, status FROM prospect_campaigns
      WHERE status = 'gepland'
        AND werkelijk_verzend_op <= NOW()
        AND werkelijk_verzend_op IS NOT NULL
    `);
    const campagnes = result.rows as any[];

    let verwerkt = 0;
    for (const campagne of campagnes) {
      try {
        // Database-lock: update alleen als status nog 'gepland' is
        const lockResult = await db.execute(sql`
          UPDATE prospect_campaigns SET status = 'actief', updated_at = NOW()
          WHERE id = ${campagne.id} AND status = 'gepland'
        `);

        if ((lockResult.rowCount ?? 0) === 0) {
          console.log(`[CampaignScheduler] Campagne ${campagne.id} al verwerkt, overgeslagen`);
          continue;
        }

        await logScheduler('verzending_gestart', campagne.id, `Starten verzending: ${campagne.name}`);

        // Verzenden
        const { sendCampaignBatch } = await import('./emailService');
        const baseUrl = process.env.BASE_URL || 'https://doehetextra.nl';
        const resultaat = await sendCampaignBatch(campagne.id, baseUrl);

        // Markeer voltooid
        await db.execute(sql`
          UPDATE prospect_campaigns
          SET status = 'voltooid', sent_at = NOW(), updated_at = NOW()
          WHERE id = ${campagne.id}
        `);

        await maakNotificatie(
          'campagne_voltooid',
          `✅ Campagne verzonden: ${campagne.name}`,
          `Succesvol verzonden naar ${resultaat.verzonden ?? 0} contacten.${(resultaat.mislukt ?? 0) > 0 ? ` ${resultaat.mislukt} mislukt.` : ''}`,
          `/campaigns/${campagne.id}`,
        );

        await logScheduler('verzending_voltooid', campagne.id,
          `Campagne ${campagne.name} verzonden: ${resultaat.verzonden ?? 0} succesvol`);
        verwerkt++;

      } catch (err: any) {
        console.error(`[CampaignScheduler] Fout bij campagne ${campagne.id}:`, err);
        await db.execute(sql`
          UPDATE prospect_campaigns SET status = 'gestopt', updated_at = NOW()
          WHERE id = ${campagne.id}
        `);
        await logScheduler('verzending_fout', campagne.id, err?.message ?? 'Onbekende fout');
        await maakNotificatie(
          'campagne_fout',
          `⚠️ Verzendingsfout: ${campagne.name}`,
          `Er is een fout opgetreden bij het verzenden: ${err?.message ?? 'Onbekende fout'}`,
          `/campaigns/${campagne.id}`,
        );
      }
    }

    return verwerkt;
  } catch (err: any) {
    console.error('[CampaignScheduler] Fout bij checkGeplandeCampagnes:', err);
    return 0;
  }
}
