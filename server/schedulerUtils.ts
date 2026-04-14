import { db } from "./db";
import { sql } from "drizzle-orm";

// ─── Werkdag utiliteiten ────────────────────────────────────────────────────

export function isWerkdag(datum: Date): boolean {
  const dag = datum.getDay();
  return dag !== 0 && dag !== 6;
}

export function isBinnenTijdvenster(datum: Date, start: string, eind: string): boolean {
  const uren = datum.getHours();
  const minuten = datum.getMinutes();
  const [startUur, startMin] = start.split(':').map(Number);
  const [eindUur, eindMin] = eind.split(':').map(Number);
  const huidigMinuten = uren * 60 + minuten;
  const startMinuten = startUur * 60 + startMin;
  const eindMinuten = eindUur * 60 + eindMin;
  return huidigMinuten >= startMinuten && huidigMinuten <= eindMinuten;
}

export function getVolgendeWerkdag(datum: Date): Date {
  const d = new Date(datum);
  d.setDate(d.getDate() + 1);
  while (!isWerkdag(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function berekenWerkelijkVerzendMoment(
  gewenstMoment: Date,
  alleenWerkdagen: boolean,
  tijdvensterStart: string,
  tijdvensterEind: string,
): Date {
  let moment = new Date(gewenstMoment);
  const [startUur, startMin] = tijdvensterStart.split(':').map(Number);
  const [eindUur, eindMin] = tijdvensterEind.split(':').map(Number);

  const setNaarStart = (d: Date): Date => {
    const n = new Date(d);
    n.setHours(startUur, startMin, 0, 0);
    return n;
  };

  const huidigMinuten = moment.getHours() * 60 + moment.getMinutes();
  const startMinuten = startUur * 60 + startMin;
  const eindMinuten = eindUur * 60 + eindMin;

  // Als alleen werkdagen en het is weekend → volgende maandag op start
  if (alleenWerkdagen && !isWerkdag(moment)) {
    while (!isWerkdag(moment)) {
      moment.setDate(moment.getDate() + 1);
    }
    return setNaarStart(moment);
  }

  // Tijdstip voor tijdvenster_start → verschuif naar start van dezelfde dag
  if (huidigMinuten < startMinuten) {
    moment = setNaarStart(moment);
    if (alleenWerkdagen && !isWerkdag(moment)) {
      moment = setNaarStart(getVolgendeWerkdag(moment));
    }
    return moment;
  }

  // Tijdstip na tijdvenster_eind → volgende dag op start
  if (huidigMinuten > eindMinuten) {
    const volgendeDag = new Date(moment);
    volgendeDag.setDate(volgendeDag.getDate() + 1);
    let resultaat = setNaarStart(volgendeDag);
    if (alleenWerkdagen && !isWerkdag(resultaat)) {
      resultaat = setNaarStart(getVolgendeWerkdag(resultaat));
    }
    return resultaat;
  }

  // Tijdstip is binnen venster en op werkdag → geen correctie
  return moment;
}

export function formatNLDatum(datum: Date): string {
  const dagen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const maanden = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const dag = dagen[datum.getDay()];
  const maand = maanden[datum.getMonth()];
  const uren = datum.getHours().toString().padStart(2, '0');
  const minuten = datum.getMinutes().toString().padStart(2, '0');
  return `${dag} ${datum.getDate()} ${maand} ${datum.getFullYear()} om ${uren}:${minuten}`;
}

export function berekenReden(
  gewenst: Date,
  werkelijk: Date,
  alleenWerkdagen: boolean,
  tijdvensterStart: string,
  tijdvensterEind: string,
): string | null {
  if (Math.abs(gewenst.getTime() - werkelijk.getTime()) < 60000) return null;
  const dagNamen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  if (alleenWerkdagen && !isWerkdag(gewenst)) {
    return `Tijdstip valt in het weekend (${dagNamen[gewenst.getDay()]})`;
  }
  const [startUur, startMin] = tijdvensterStart.split(':').map(Number);
  const [eindUur, eindMin] = tijdvensterEind.split(':').map(Number);
  const gewenstMin = gewenst.getHours() * 60 + gewenst.getMinutes();
  const startMinuten = startUur * 60 + startMin;
  const eindMinuten = eindUur * 60 + eindMin;
  const gUrMin = `${gewenst.getHours().toString().padStart(2,'0')}:${gewenst.getMinutes().toString().padStart(2,'0')}`;
  if (gewenstMin < startMinuten) return `Tijdstip (${gUrMin}) valt voor het verzendvenster (start: ${tijdvensterStart})`;
  if (gewenstMin > eindMinuten) return `Tijdstip (${gUrMin}) valt na het verzendvenster (eind: ${tijdvensterEind})`;
  return 'Verzendmoment is aangepast';
}

// ─── Scheduler logger ────────────────────────────────────────────────────────
export async function logScheduler(
  type: string,
  campaignId: number | null,
  bericht: string,
): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO scheduler_log (type, campaign_id, bericht, timestamp)
      VALUES (${type}, ${campaignId ?? null}, ${bericht}, NOW())
    `);
  } catch (err) {
    console.error('[schedulerLog] Write fout:', err);
  }
}

// ─── Instellingen ────────────────────────────────────────────────────────────
export async function getInstelling(sleutel: string, standaard: string): Promise<string> {
  try {
    const result = await db.execute(sql`
      SELECT waarde FROM instellingen WHERE sleutel = ${sleutel} LIMIT 1
    `);
    const row = (result.rows as any[])[0];
    return row?.waarde ?? standaard;
  } catch {
    return standaard;
  }
}

export async function setInstelling(sleutel: string, waarde: string): Promise<void> {
  await db.execute(sql`
    INSERT INTO instellingen (sleutel, waarde, bijgewerkt_op)
    VALUES (${sleutel}, ${waarde}, NOW())
    ON CONFLICT (sleutel) DO UPDATE SET waarde = ${waarde}, bijgewerkt_op = NOW()
  `);
}

export async function initInstellingen(): Promise<void> {
  const defaults: Record<string, string> = {
    'verzend_alleen_werkdagen': '1',
    'verzend_tijdvenster_start': '08:00',
    'verzend_tijdvenster_eind': '18:00',
    'tijdzone': 'Europe/Amsterdam',
    'email_from_address': 'max@doehetextra.nl',
    'email_from_name': 'EXTRA',
  };
  for (const [sleutel, waarde] of Object.entries(defaults)) {
    await db.execute(sql`
      INSERT INTO instellingen (sleutel, waarde)
      VALUES (${sleutel}, ${waarde})
      ON CONFLICT (sleutel) DO NOTHING
    `);
  }
}
