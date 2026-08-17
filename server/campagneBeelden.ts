/**
 * AFBEELDINGEN IN CAMPAGNEMAILS — uploaden in plaats van meebakken.
 *
 * Aanleiding: de mailbouwer sloeg een geüploade afbeelding op als data:-URL,
 * dus als base64-tekst ín de mail. Een telefoonfoto van 3 MB wordt zo ruim 4 MB
 * HTML. Dat leverde bij een testmail letterlijk op: "Deze e-mail is te groot
 * voor de beveiligingsfilters" — de ontvanger zag de mail niet eens.
 *
 * Sinds die ontdekking gaat een afbeelding hierlangs. Drie dingen gebeuren er:
 *
 *   1. Verkleinen. Een mail is 600 pixels breed; alles daarboven is gewicht
 *      zonder zichtbaar verschil. We schalen naar maximaal 1200 pixels (twee
 *      keer zo groot, voor schermen met hoge resolutie) en zetten om naar JPEG.
 *      Een foto van 3 MB komt zo doorgaans onder de 200 kB uit.
 *   2. Opslaan in Object Storage. Niet op de schijf van de server: die is in
 *      een Replit-deploy vluchtig, en een mail die iemand volgende week opent
 *      moet de afbeelding dan nog kunnen ophalen.
 *   3. Teruggeven als absolute URL. In een e-mail bestaat "relatief" niet.
 *
 * Waarom JPEG en niet WebP: Outlook toont geen WebP. Een PNG met transparantie
 * wordt op wit platgelegd — in een mail met een witte achtergrond zie je daar
 * niets van, en het scheelt fors.
 */
import { objectStorageClient } from './replit_integrations/object_storage';

const PRIVATE_DIR = (process.env.PRIVATE_OBJECT_DIR || '').replace(/\/+$/, '');
const PREFIX = 'campagne-beelden';
const UPLOAD_TIMEOUT_MS = 30_000;

/** Maximale breedte in pixels. Een mail is 600 breed; dit is de dubbele. */
export const MAX_BREEDTE = 1200;

/** Het pad waarop een opgeslagen beeld publiek bereikbaar is. */
export const PUBLIEK_PAD = '/campagne-beeld';

/** Het canonieke domein — een mail heeft een absolute URL nodig. */
const SITE_ORIGIN = 'https://www.doehetextra.nl';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} duurde langer dan ${ms / 1000}s (time-out)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function parseObjectPath(fullPath: string): { bucketName: string; objectName: string } {
  const p = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
  const parts = p.split('/');
  return { bucketName: parts[1], objectName: parts.slice(2).join('/') };
}

/**
 * Bestandsnaam die veilig in een URL past.
 *
 * Alleen letters, cijfers, streepje en punt. Een naam die van een gebruiker komt
 * mag nooit een schuine streep of ".." bevatten — dat is het verschil tussen een
 * bestandsnaam en een pad.
 */
export function veiligeBestandsnaam(naam: string): string {
  return String(naam || '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+/, '')
    .slice(0, 80) || 'beeld';
}

/** Bouwt de publieke URL bij een opgeslagen bestandsnaam. */
export function publiekeUrl(bestandsnaam: string): string {
  return `${SITE_ORIGIN}${PUBLIEK_PAD}/${veiligeBestandsnaam(bestandsnaam)}`;
}

export interface OpslagResultaat {
  url: string;
  bestandsnaam: string;
  bytes: number;
  /** Grootte vóór het verkleinen, zodat het scherm de winst kan tonen. */
  origineleBytes: number;
}

/**
 * Verkleint en slaat op. Geeft de publieke URL terug.
 *
 * `stempel` bestaat om de bestandsnaam uniek te maken zonder Date.now() in de
 * functie zelf te gebruiken — dat maakt hem testbaar.
 */
export async function bewaarCampagneBeeld(
  buffer: Buffer,
  origineleNaam: string,
  stempel: string,
): Promise<OpslagResultaat> {
  if (!PRIVATE_DIR) {
    throw new Error('PRIVATE_OBJECT_DIR ontbreekt — Object Storage is niet geconfigureerd.');
  }

  const sharp = (await import('sharp')).default;
  const verkleind = await sharp(buffer)
    // .rotate() zonder argument past de EXIF-oriëntatie toe. Zonder dit staat
    // een foto die met een telefoon rechtop is gemaakt in de mail op zijn kant.
    .rotate()
    .resize({ width: MAX_BREEDTE, withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();

  const basis = veiligeBestandsnaam(origineleNaam.replace(/\.[a-zA-Z0-9]+$/, ''));
  const bestandsnaam = `${stempel}-${basis}.jpg`;

  const fullPath = `${PRIVATE_DIR}/${PREFIX}/${bestandsnaam}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const file = objectStorageClient.bucket(bucketName).file(objectName);

  await withTimeout(
    file.save(verkleind, {
      contentType: 'image/jpeg',
      metadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000, immutable' },
      resumable: false,
    }),
    UPLOAD_TIMEOUT_MS,
    'Uploaden naar Object Storage',
  );

  return {
    url: publiekeUrl(bestandsnaam),
    bestandsnaam,
    bytes: verkleind.length,
    origineleBytes: buffer.length,
  };
}

/**
 * Haalt een beeld op voor de publieke route. Geeft null als het er niet is.
 *
 * Deze route staat bewust open zonder inlog: een mailclient haalt de afbeelding
 * op namens de ontvanger en heeft geen sessie. De bestandsnaam wordt daarom
 * eerst opgeschoond — dit is de enige plek waar een buitenstaander invloed heeft
 * op welk object er wordt opgevraagd.
 */
export async function haalCampagneBeeld(bestandsnaam: string): Promise<Buffer | null> {
  if (!PRIVATE_DIR) return null;
  const veilig = veiligeBestandsnaam(bestandsnaam);
  if (!veilig || veilig !== bestandsnaam) return null;

  try {
    const fullPath = `${PRIVATE_DIR}/${PREFIX}/${veilig}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [bestaat] = await file.exists();
    if (!bestaat) return null;
    const [buf] = await file.download();
    return buf;
  } catch {
    return null;
  }
}
