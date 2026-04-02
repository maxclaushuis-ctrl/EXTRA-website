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

for (const account of ACCOUNTS) {
  accountState[account.id] = {
    ...account,
    status: 'disconnected',
    telefoon: null,
    qr: null,
    lastSeen: null,
    berichtenCount: 0,
    ongelezen: 0,
  };
  messageStore[account.id] = [];
}

export async function connectAccount(accountId: AccountId) {
  // Clear any pending reconnect timer
  if (reconnectTimers[accountId]) {
    clearTimeout(reconnectTimers[accountId]);
    delete reconnectTimers[accountId];
  }

  const sessieMap = path.join(process.cwd(), `sessions/${accountId}`);
  if (!fs.existsSync(sessieMap)) fs.mkdirSync(sessieMap, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessieMap);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['EXTRA Plansysteem', 'Chrome', '1.0.0'],
  });

  sockets[accountId] = socket;
  accountState[accountId].status = 'connecting';
  eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrBase64 = await QRCode.toDataURL(qr);
        accountState[accountId].status = 'qr_ready';
        accountState[accountId].qr = qrBase64;
        eventEmitter.emit('qr-update', accountId, qrBase64);
        eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });
      } catch (err) {
        console.error(`QR genereren mislukt voor ${accountId}:`, err);
      }
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? (lastDisconnect.error as Boom).output?.statusCode !== DisconnectReason.loggedOut
        : true;

      accountState[accountId].status = 'disconnected';
      accountState[accountId].qr = null;
      eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });

      if (shouldReconnect) {
        reconnectTimers[accountId] = setTimeout(() => connectAccount(accountId), 5000);
      }
    }

    if (connection === 'open') {
      accountState[accountId].status = 'connected';
      accountState[accountId].qr = null;
      accountState[accountId].telefoon = (socket.user?.id?.split(':')[0]) ?? null;
      accountState[accountId].lastSeen = new Date().toISOString();
      eventEmitter.emit('status-update', accountId, { ...accountState[accountId] });
    }
  });

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;

      const tekst =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

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
}

export async function stuurBericht(accountId: AccountId, nummer: string, tekst: string): Promise<Bericht> {
  const socket = sockets[accountId];
  if (!socket) throw new Error('Account niet verbonden');
  if (accountState[accountId].status !== 'connected') throw new Error('Account niet verbonden');

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
    } catch (err) {
      console.error(`WhatsApp init mislukt voor ${account.id}:`, err);
    }
  }
}
