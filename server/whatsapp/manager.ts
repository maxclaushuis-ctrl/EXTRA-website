import makeWASocket, { DisconnectReason, useMultiFileAuthState, type WASocket } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import eventEmitter from './events';
import pino from 'pino';

const ACCOUNTS = [
  { id: 'horeca',       label: 'Horeca',       categorie: 'horeca' },
  { id: 'logistiek',    label: 'Logistiek',    categorie: 'logistiek' },
  { id: 'housekeeping', label: 'Housekeeping', categorie: 'housekeeping' },
] as const;

type AccountId = 'horeca' | 'logistiek' | 'housekeeping';

export interface AccountState {
  id: AccountId;
  label: string;
  categorie: string;
  status: 'disconnected' | 'qr_ready' | 'connecting' | 'connected';
  telefoon: string | null;
  qr: string | null;
  lastSeen: string | null;
  berichtenCount: number;
  ongelezen: number;
  fout?: string | null;
}

export interface Bericht {
  id: string;
  accountId: AccountId;
  van?: string;
  naar?: string;
  naam?: string;
  tekst: string;
  tijdstip: string;
  gelezen: boolean;
  inkomend: boolean;
}

const sockets: Partial<Record<AccountId, WASocket>> = {};
const accountState: Record<AccountId, AccountState> = {} as any;
const messageStore: Record<AccountId, Bericht[]> = {} as any;
const reconnectTimers: Partial<Record<AccountId, ReturnType<typeof setTimeout>>> = {};
const qrTimeouts: Partial<Record<AccountId, ReturnType<typeof setTimeout>>> = {};
const connecting: Partial<Record<AccountId, boolean>> = {};

for (const account of ACCOUNTS) {
  accountState[account.id] = {
    ...account,
    status: 'disconnected',
    telefoon: null,
    qr: null,
    lastSeen: null,
    berichtenCount: 0,
    ongelezen: 0,
    fout: null,
  };
  messageStore[account.id] = [];
}

function closeSocket(accountId: AccountId) {
  const socket = sockets[accountId];
  if (socket) {
    try { socket.end(); } catch { /* ignore */ }
    try { (socket as any).ws?.close(); } catch { /* ignore */ }
    delete sockets[accountId];
  }
  if (qrTimeouts[accountId]) { clearTimeout(qrTimeouts[accountId]); delete qrTimeouts[accountId]; }
  if (reconnectTimers[accountId]) { clearTimeout(reconnectTimers[accountId]); delete reconnectTimers[accountId]; }
}

export async function connectAccount(accountId: AccountId) {
  // Voorkom dubbele simultane connect-pogingen
  if (connecting[accountId]) {
    console.log(`[WA:${accountId}] Verbinding al bezig, sla over`);
    return;
  }
  connecting[accountId] = true;

  // Sluit bestaande socket
  closeSocket(accountId);

  accountState[accountId].status = 'connecting';
  accountState[accountId].qr = null;
  accountState[accountId].fout = null;
  eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });

  console.log(`[WA:${accountId}] Verbinding starten...`);

  const sessieMap = path.join(process.cwd(), `sessions/${accountId}`);
  if (!fs.existsSync(sessieMap)) fs.mkdirSync(sessieMap, { recursive: true });

  let socket: WASocket;
  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessieMap);

    socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'warn' }),
      browser: ['EXTRA Plansysteem', 'Chrome', '1.0.0'],
      connectTimeoutMs: 30000,
      keepAliveIntervalMs: 10000,
    });

    sockets[accountId] = socket;

    // Timeout: als na 30 sec nog geen QR/connected → disconnected
    qrTimeouts[accountId] = setTimeout(() => {
      if (accountState[accountId].status === 'connecting') {
        console.log(`[WA:${accountId}] Timeout — geen QR ontvangen na 30s`);
        accountState[accountId].status = 'disconnected';
        accountState[accountId].fout = 'Timeout: WhatsApp servers niet bereikbaar. Probeer opnieuw.';
        connecting[accountId] = false;
        closeSocket(accountId);
        eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });
      }
    }, 30000);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log(`[WA:${accountId}] connection.update:`, { connection, hasQR: !!qr });

      if (qr) {
        try {
          const qrBase64 = await QRCode.toDataURL(qr);
          accountState[accountId].status = 'qr_ready';
          accountState[accountId].qr = qrBase64;
          accountState[accountId].fout = null;
          connecting[accountId] = false;
          if (qrTimeouts[accountId]) { clearTimeout(qrTimeouts[accountId]); delete qrTimeouts[accountId]; }
          console.log(`[WA:${accountId}] ✅ QR gegenereerd`);
          eventEmitter.emit('qr-update', accountId, qrBase64);
          eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });
        } catch (err) {
          console.error(`[WA:${accountId}] QR genereren mislukt:`, err);
        }
      }

      if (connection === 'close') {
        const errCode = (lastDisconnect?.error instanceof Boom)
          ? (lastDisconnect.error as Boom).output?.statusCode
          : null;

        // 405 = WhatsApp blokkeert deze server-IP (cloud datacenter)
        // 401 = uitgelogd. Beide: niet automatisch herverbinden.
        const permanentFail = errCode === 405 || errCode === DisconnectReason.loggedOut;
        const shouldReconnect = !permanentFail;

        console.log(`[WA:${accountId}] Verbinding gesloten, code:`, errCode, 'herverbinden:', shouldReconnect);

        accountState[accountId].status = 'disconnected';
        accountState[accountId].qr = null;
        connecting[accountId] = false;
        if (qrTimeouts[accountId]) { clearTimeout(qrTimeouts[accountId]); delete qrTimeouts[accountId]; }

        if (errCode === 405) {
          accountState[accountId].fout = 'WhatsApp blokkeert verbindingen van cloud-servers (code 405). Dit werkt wel op een gedeployde productieserver of eigen VPS met een zakelijk IP-adres.';
        } else if (errCode === DisconnectReason.loggedOut) {
          accountState[accountId].fout = 'Uitgelogd — koppel het account opnieuw via QR-scan.';
        }

        eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });

        if (shouldReconnect) {
          reconnectTimers[accountId] = setTimeout(() => connectAccount(accountId), 8000);
        }
      }

      if (connection === 'open') {
        accountState[accountId].status = 'connected';
        accountState[accountId].qr = null;
        accountState[accountId].fout = null;
        accountState[accountId].telefoon = (socket.user?.id?.split(':')[0]) ?? null;
        accountState[accountId].lastSeen = new Date().toISOString();
        connecting[accountId] = false;
        if (qrTimeouts[accountId]) { clearTimeout(qrTimeouts[accountId]); delete qrTimeouts[accountId]; }
        console.log(`[WA:${accountId}] ✅ Verbonden als +${accountState[accountId].telefoon}`);
        eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });
      }
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        const tekst = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        if (!tekst) continue;
        const bericht: Bericht = {
          id: msg.key.id ?? `in_${Date.now()}`,
          accountId,
          van: msg.key.remoteJid?.replace('@s.whatsapp.net', ''),
          naam: msg.pushName ?? 'Onbekend',
          tekst,
          tijdstip: new Date((msg.messageTimestamp as number) * 1000).toISOString(),
          gelezen: false,
          inkomend: true,
        };
        messageStore[accountId].unshift(bericht);
        if (messageStore[accountId].length > 200) messageStore[accountId] = messageStore[accountId].slice(0, 200);
        accountState[accountId].berichtenCount++;
        accountState[accountId].ongelezen++;
        eventEmitter.emit('nieuw-bericht', accountId, bericht);
      }
    });

  } catch (err: any) {
    console.error(`[WA:${accountId}] Fout bij aanmaken socket:`, err?.message);
    accountState[accountId].status = 'disconnected';
    accountState[accountId].fout = err?.message || 'Onbekende fout';
    connecting[accountId] = false;
    eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });
  }
}

export async function stuurBericht(accountId: AccountId, nummer: string, tekst: string): Promise<Bericht> {
  const socket = sockets[accountId];
  if (!socket || accountState[accountId].status !== 'connected') throw new Error('Account niet verbonden');
  const jid = `${nummer.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
  await socket.sendMessage(jid, { text: tekst });
  const bericht: Bericht = {
    id: `out_${Date.now()}`,
    accountId,
    naar: nummer,
    tekst,
    tijdstip: new Date().toISOString(),
    gelezen: true,
    inkomend: false,
  };
  messageStore[accountId].unshift(bericht);
  eventEmitter.emit('bericht-verstuurd', accountId, bericht);
  return bericht;
}

export function getAccountStates(): AccountState[] {
  return Object.values(accountState);
}

export function getBerichten(accountId: AccountId, limit = 50): Bericht[] {
  return (messageStore[accountId] ?? []).slice(0, limit);
}

export function markeerGelezen(accountId: AccountId) {
  accountState[accountId].ongelezen = 0;
  eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });
}

export async function initAlleAccounts() {
  for (const account of ACCOUNTS) {
    try {
      await connectAccount(account.id);
      // Kleine vertraging tussen accounts
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[WA] Init mislukt voor ${account.id}:`, err);
    }
  }
}
