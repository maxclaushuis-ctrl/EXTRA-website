/**
 * SYNCHRONISATIE CRM → VERZENDLIJST.
 *
 * De vertaalregels staan in server/crmNaarMail.ts en raken de database niet.
 * Dit bestand is het deel dat wél leest en schrijft, en verder zo dom mogelijk
 * is gehouden: ophalen, vergelijken, wegschrijven, tellen.
 *
 * TWEE MANIEREN OM EEN BESTAANDE RIJ TE HERKENNEN
 * -----------------------------------------------
 * Eerst op crm_contact_id — dan weet je het zeker. Bestaat die koppeling nog
 * niet, dan op e-mailadres. Dat tweede is nodig bij de allereerste run: er
 * stonden al contacten in de verzendlijst, met afmeldingen en bounces eraan.
 * Die moeten geadopteerd worden, niet gedupliceerd. Een tweede rij met hetzelfde
 * adres betekent dat iemand die zich had afgemeld gewoon weer post krijgt.
 *
 * DE REGEL DIE ALLES OVERRULET
 * ----------------------------
 * Een adres waar al een rij voor bestaat, krijgt er nooit een tweede bij, en
 * een bestaand adres wordt nooit overgeschreven met het adres van een ander.
 * Dat klinkt vanzelfsprekend, maar het is precies de plek waar een afmelding
 * ongemerkt verdwijnt: rij A is afgemeld, iemand corrigeert in het CRM het
 * adres van contactpersoon B naar dat van A, en B is opeens weer mailbaar op
 * hetzelfde adres. Zie `emailBotst` verderop.
 *
 * WAT ER NIET GEBEURT
 * -------------------
 * Er wordt nooit een rij verwijderd. Aan een verzendrij hangt geschiedenis:
 * verzonden mails, opens, kliks, bounces, WhatsApp-gesprekken. Verdwijnt de
 * contactpersoon uit het CRM, dan wordt de rij geblokkeerd (zie
 * blokkeerVerwijderdeContacten) — zichtbaar, terug te draaien, en zonder dat
 * de statistieken gaten krijgen.
 */
import { storage } from './storage';
import type { InsertProspectContact } from '@shared/schema';
import {
  mailVeldenUitCrm, verschil, aanvullingen, beginwaarden, emailSleutel,
  type CrmBedrijfInvoer, type CrmContactInvoer,
} from './crmNaarMail';

export interface SyncResultaat {
  /** Aantal CRM-bedrijven dat is doorlopen. */
  bedrijven: number;
  /**
   * Bedrijven zonder één contactpersoon.
   *
   * Staat er alleen in om het te kunnen melden, en dat is belangrijker dan het
   * lijkt: een bedrijf zonder contactpersoon levert geen ontvanger op. Zonder
   * dit getal lijkt een import van 337 klanten die 12 ontvangers oplevert een
   * bug, terwijl er gewoon bij 325 bedrijven geen naam en e-mailadres staat.
   */
  bedrijvenZonderContact: number;
  /** Aantal CRM-contactpersonen dat is bekeken. */
  bekeken: number;
  /** Nieuwe rijen in de verzendlijst. */
  nieuw: number;
  /** Bestaande rijen waarvan een CRM-veld is bijgewerkt. */
  bijgewerkt: number;
  /** Bestaande rijen die op e-mailadres aan een CRM-contact zijn gekoppeld. */
  geadopteerd: number;
  /** Contactpersonen zonder bruikbaar e-mailadres — die kun je niet mailen. */
  zonderEmail: number;
  /** Contactpersonen waarvan het adres al bij een ander CRM-contact hoort. */
  dubbel: number;
  /** Adreswijzigingen die zijn geweigerd omdat het adres al bezet was. */
  adresBotsing: number;
  /** Rijen waarop het schrijven misging. De rest van de ronde gaat gewoon door. */
  mislukt: number;
  ongewijzigd: number;
  duurMs: number;
}

const LEEG: Omit<SyncResultaat, 'duurMs'> = {
  bedrijven: 0, bedrijvenZonderContact: 0,
  bekeken: 0, nieuw: 0, bijgewerkt: 0, geadopteerd: 0,
  zonderEmail: 0, dubbel: 0, adresBotsing: 0, mislukt: 0, ongewijzigd: 0,
};

/**
 * Twee rondes tegelijk laten lopen levert dubbele rijen op: allebei zien ze
 * dezelfde lege plek en allebei maken ze hem aan. Binnen dit proces is één
 * ronde tegelijk genoeg — de unieke index in de database is het vangnet voor
 * het geval er ooit een tweede proces bijkomt.
 */
let lopendeRonde: Promise<SyncResultaat> | null = null;

/** Is deze rij een afmelding of blokkade? Die mag nooit verloren gaan. */
function isOnderdrukt(rij: any): boolean {
  return !!rij?.unsubscribed
    || rij?.contactStatus === 'uitgeschreven'
    || rij?.contactStatus === 'geblokkeerd'
    || rij?.bounceStatus === 'hard'
    || !!rij?.spamReported;
}

/**
 * Welke van twee rijen met hetzelfde adres is de juiste om aan het CRM te
 * koppelen?
 *
 * Een onderdrukte rij wint altijd: die draagt het "nee". Daarna de oudste, want
 * daar hangt de geschiedenis aan. Sorteren op naam — wat de standaardvolgorde
 * van de query is — zou hier willekeurig kiezen.
 */
function beste(a: any, b: any): any {
  if (isOnderdrukt(a) !== isOnderdrukt(b)) return isOnderdrukt(a) ? a : b;
  const ta = new Date(a?.createdAt ?? 0).getTime();
  const tb = new Date(b?.createdAt ?? 0).getTime();
  if (ta !== tb) return ta < tb ? a : b;
  return (a?.id ?? 0) <= (b?.id ?? 0) ? a : b;
}

/**
 * Zet het CRM om naar de verzendlijst.
 *
 * Zonder `bedrijfId` gaat het over alle bedrijven; met `bedrijfId` alleen over
 * dat ene. Dat tweede is wat er gebeurt als iemand in het CRM een
 * contactpersoon bewerkt — een volledige run bij elke toetsaanslag zou
 * honderden bedrijven doorlopen voor één wijziging.
 */
export function synchroniseerCrmNaarMail(
  opties: { bedrijfId?: number } = {},
): Promise<SyncResultaat> {
  const volgende = () => draaiRonde(opties);
  lopendeRonde = lopendeRonde ? lopendeRonde.then(volgende, volgende) : volgende();
  const deze = lopendeRonde;
  deze.finally(() => { if (lopendeRonde === deze) lopendeRonde = null; }).catch(() => {});
  return deze;
}

async function draaiRonde(opties: { bedrijfId?: number }): Promise<SyncResultaat> {
  const start = Date.now();
  const telling = { ...LEEG };

  const bedrijven: CrmBedrijfInvoer[] = opties.bedrijfId
    ? ([await storage.getCrmCompanyById(opties.bedrijfId)].filter(Boolean) as any[])
    : ((await storage.getCrmCompanies()) as any[]);

  if (bedrijven.length === 0) return { ...telling, duurMs: Date.now() - start };

  const bedrijfPerId = new Map<number, CrmBedrijfInvoer>();
  for (const b of bedrijven) bedrijfPerId.set(b.id, b);

  const crmContacten = (await storage.getCrmContactsByCompanyIds(
    bedrijven.map((b) => b.id),
  )) as unknown as CrmContactInvoer[];

  telling.bedrijven = bedrijven.length;
  const metContact = new Set(crmContacten.map((c) => c.companyId));
  telling.bedrijvenZonderContact = bedrijven.filter((b) => !metContact.has(b.id)).length;

  // De verzendlijst wordt altijd in zijn geheel opgehaald, ook bij één bedrijf:
  // een adres kan bij een ander bedrijf al bestaan, en dan mag er geen tweede
  // rij bij komen.
  const mailContacten = (await storage.getProspectContacts({})) as any[];

  const perCrmId = new Map<number, any>();
  const perEmail = new Map<string, any>();
  for (const m of mailContacten) {
    if (m.crmContactId) perCrmId.set(m.crmContactId, m);
    const sleutel = emailSleutel(m.email);
    if (!sleutel) continue;
    const zittend = perEmail.get(sleutel);
    perEmail.set(sleutel, zittend ? beste(zittend, m) : m);
  }

  /**
   * Hoort dit adres al bij een ándere rij dan deze?
   *
   * Zo ja, dan gaat de adreswijziging niet door. Liever een verouderd adres in
   * de verzendlijst dan twee rijen op hetzelfde adres waarvan er één een
   * afmelding draagt.
   */
  const emailBotst = (email: string, eigenId: number | null): boolean => {
    const zittend = perEmail.get(email);
    return !!zittend && zittend.id !== eigenId;
  };

  for (const contact of crmContacten) {
    telling.bekeken++;
    const bedrijf = bedrijfPerId.get(contact.companyId);
    if (!bedrijf) continue;

    const gewenst = mailVeldenUitCrm(bedrijf, contact);
    if (!gewenst) { telling.zonderEmail++; continue; }

    let bestaand = perCrmId.get(contact.id);
    let adoptie = false;

    if (!bestaand) {
      const kandidaat = perEmail.get(gewenst.email);
      if (kandidaat) {
        if (kandidaat.crmContactId && kandidaat.crmContactId !== contact.id) {
          // Al aan een ander CRM-contact gekoppeld: hier niets doen, anders
          // gaan twee CRM-rijen om dezelfde verzendrij vechten.
          telling.dubbel++;
          continue;
        }
        bestaand = kandidaat;
        adoptie = true;
      }
    }

    try {
      if (!bestaand) {
        // De sleutels komen uit CRM_VELDEN en beginwaarden(); dat ze bestaan
        // op prospect_contacts wordt bewaakt door server/crmNaarMail.test.ts.
        const rij = {
          ...beginwaarden(contact, gewenst.contactType),
          ...gewenst,
        } as unknown as InsertProspectContact;
        const aangemaakt = await storage.createProspectContact(rij);
        // Meteen in beide registers, zodat een tweede CRM-contact met hetzelfde
        // adres verderop in deze ronde niet nóg een rij aanmaakt.
        perCrmId.set(contact.id, aangemaakt);
        perEmail.set(gewenst.email, aangemaakt);
        telling.nieuw++;
        continue;
      }

      const wijziging: Record<string, unknown> = {
        ...verschil(bestaand, gewenst),
        ...aanvullingen(bestaand, contact),
      };

      // Een adreswijziging naar een adres dat al van een andere rij is, gaat
      // niet door. De rest van de wijzigingen wel.
      if ('email' in wijziging && emailBotst(String(wijziging.email), bestaand.id ?? null)) {
        delete wijziging.email;
        telling.adresBotsing++;
      }

      if (Object.keys(wijziging).length === 0) {
        // Ook zonder wijziging de registers bijwerken: de rij is nu bezet.
        perCrmId.set(contact.id, bestaand);
        perEmail.set(emailSleutel(bestaand.email), bestaand);
        telling.ongewijzigd++;
        continue;
      }

      await storage.updateProspectContact(bestaand.id, wijziging as unknown as Partial<InsertProspectContact>);

      const bijgewerkt = { ...bestaand, ...wijziging };
      perCrmId.set(contact.id, bijgewerkt);
      // Het oude adres vrijgeven en het nieuwe bezetten, allebei wijzend op
      // hetzelfde object — anders claimt een volgend CRM-contact dezelfde rij.
      const oudeSleutel = emailSleutel(bestaand.email);
      const nieuweSleutel = emailSleutel(bijgewerkt.email);
      if (oudeSleutel !== nieuweSleutel && perEmail.get(oudeSleutel)?.id === bestaand.id) {
        perEmail.delete(oudeSleutel);
      }
      perEmail.set(nieuweSleutel, bijgewerkt);

      if (adoptie) telling.geadopteerd++; else telling.bijgewerkt++;
    } catch (err: any) {
      // Eén rij die niet wil, mag de rest van de ronde niet meenemen.
      telling.mislukt++;
      console.error(
        `[crm-sync] contact ${contact.id} (${gewenst.email}) mislukt:`,
        err?.message || err,
      );
    }
  }

  return { ...telling, duurMs: Date.now() - start };
}

/**
 * Blokkeert de verzendrijen van contactpersonen die uit het CRM verdwijnen.
 *
 * Aanroepen vóór het verwijderen, want daarna zijn de id's weg en is niet meer
 * te zien welke verzendrij erbij hoorde. Blokkeren en niet verwijderen: de
 * mailgeschiedenis blijft zo intact, en iemand die per ongeluk uit het CRM
 * wordt gehaald is met één klik weer actief te zetten.
 *
 * De koppeling wordt losgelaten (crm_contact_id op null). Zonder dat zou
 * dezelfde persoon opnieuw invoeren in het CRM nergens toe leiden: de rij zou
 * eeuwig aan een verwijderd id hangen en bij elke ronde als "dubbel" worden
 * afgeserveerd. Nu wordt de rij weer geadopteerd — geblokkeerd, dus nog steeds
 * niet mailbaar, maar wél zichtbaar en met één klik te herstellen.
 */
export async function blokkeerVerwijderdeContacten(
  crmContactIds: number[],
  reden = 'Contactpersoon verwijderd uit het CRM',
): Promise<number> {
  if (!crmContactIds.length) return 0;
  const ids = new Set(crmContactIds);
  const mailContacten = (await storage.getProspectContacts({})) as any[];
  let aantal = 0;

  for (const m of mailContacten) {
    if (!m.crmContactId || !ids.has(m.crmContactId)) continue;
    try {
      const datum = new Date().toISOString().slice(0, 10);
      const notitie = `${m.notes ? `${m.notes}\n` : ''}[${datum}] ${reden}`;
      await storage.updateProspectContact(m.id, {
        contactStatus: 'geblokkeerd',
        crmContactId: null,
        notes: notitie,
      } as unknown as Partial<InsertProspectContact>);
      aantal++;
    } catch (err: any) {
      console.error(`[crm-sync] blokkeren van mailcontact ${m.id} mislukt:`, err?.message || err);
    }
  }
  return aantal;
}

/**
 * Draait de synchronisatie zonder dat de aanroeper hoeft te wachten of iets
 * hoeft af te vangen.
 *
 * Gebruikt na een bewerking in het CRM: de gebruiker heeft zijn wijziging al
 * opgeslagen, en een mislukte synchronisatie mag dat antwoord niet omzetten in
 * een foutmelding. Het mag alleen nooit stil misgaan, vandaar de logregel.
 */
export function syncOpAchtergrond(bedrijfId?: number): void {
  synchroniseerCrmNaarMail(bedrijfId ? { bedrijfId } : {})
    .then((r) => {
      if (r.nieuw || r.bijgewerkt || r.geadopteerd || r.mislukt || r.adresBotsing) {
        console.log(
          `[crm-sync] bedrijf=${bedrijfId ?? 'alle'} nieuw=${r.nieuw} bijgewerkt=${r.bijgewerkt} geadopteerd=${r.geadopteerd} zonderEmail=${r.zonderEmail} dubbel=${r.dubbel} adresBotsing=${r.adresBotsing} mislukt=${r.mislukt}`,
        );
      }
    })
    .catch((err) => {
      console.error('[crm-sync] mislukt:', err?.message || err);
    });
}
