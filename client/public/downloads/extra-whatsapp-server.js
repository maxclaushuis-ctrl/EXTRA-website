require('dotenv').config();
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const pino = require('pino');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');

const API_KEY = process.env.API_KEY || 'REMOVED_WHATSAPP_API_KEY';
const PORT = process.env.PORT || 3001;
const AUTH_DIR = process.env.AUTH_DIR || './auth';

const app = express();
app.use(cors());
app.use(express.json());

// API key middleware
app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) return res.status(401).json({ error: 'Ongeldig API key' });
  next();
});

const ACCOUNTS = [
  { id: 'horeca',       label: 'Horeca',       categorie: 'horeca' },
  { id: 'logistiek',    label: 'Logistiek',    categorie: 'logistiek' },
  { id: 'housekeeping', label: 'Housekeeping', categorie: 'housekeeping' },
];

// State per account
const state = {};
const sockets = {};
const berichten = {};
const sseClients = new Set();

for (const acc of ACCOUNTS) {
  state[acc.id] = {
    ...acc,
    status: 'disconnected',
    telefoon: null,
    qr: null,
    ongelezen: 0,
    fout: null,
  };
  berichten[acc.id] = [];
}

function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch {}
  }
}

async function connectAccount(accountId) {
  if (sockets[accountId]) {
    try { sockets[accountId].end(); } catch {}
    sockets[accountId] = null;
  }

  const authPath = path.join(AUTH_DIR, accountId);
  fs.mkdirSync(authPath, { recursive: true });

  const { state: authState, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    version,
    auth: authState,
    logger,
    printQRInTerminal: false,
    browser: ['Extra Horeca', 'Chrome', '120.0.0'],
  });

  sockets[accountId] = sock;
  state[accountId].status = 'connecting';
  state[accountId].qr = null;
  state[accountId].fout = null;
  broadcastSSE('status', { id: accountId, state: state[accountId] });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrDataUrl = await qrcode.toDataURL(qr, { width: 300, margin: 2 });
        state[accountId].status = 'qr_ready';
        state[accountId].qr = qrDataUrl;
        broadcastSSE('status', { id: accountId, state: state[accountId] });
        console.log(`[${accountId}] QR gegenereerd — scan met WhatsApp`);
      } catch (err) {
        console.error(`[${accountId}] QR fout:`, err.message);
      }
    }

    if (connection === 'open') {
      const phone = sock.user?.id?.split(':')[0] || null;
      state[accountId].status = 'connected';
      state[accountId].telefoon = phone;
      state[accountId].qr = null;
      state[accountId].fout = null;
      broadcastSSE('status', { id: accountId, state: state[accountId] });
      console.log(`[${accountId}] Verbonden! Telefoon: +${phone}`);
    }

    if (connection === 'close') {
      const errCode = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output?.statusCode
        : null;
      const loggedOut = errCode === DisconnectReason.loggedOut;

      console.log(`[${accountId}] Verbinding gesloten, code:`, errCode);

      state[accountId].status = 'disconnected';
      state[accountId].qr = null;

      if (loggedOut) {
        state[accountId].fout = 'Uitgelogd — koppel opnieuw via QR-scan';
        // Verwijder auth zodat QR opnieuw verschijnt
        const authPath = path.join(AUTH_DIR, accountId);
        fs.rmSync(authPath, { recursive: true, force: true });
      } else {
        state[accountId].fout = null;
        // Herverbinden na 5 seconden
        setTimeout(() => connectAccount(accountId), 5000);
      }

      broadcastSSE('status', { id: accountId, state: state[accountId] });
    }
  });

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const van = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
      const naam = msg.pushName || van;
      const tekst =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '[Media bericht]';

      const bericht = {
        id: msg.key.id,
        inkomend: true,
        naam,
        van,
        tekst,
        tijdstip: new Date(msg.messageTimestamp * 1000).toISOString(),
      };

      berichten[accountId].push(bericht);
      if (berichten[accountId].length > 200) berichten[accountId].shift();

      state[accountId].ongelezen = (state[accountId].ongelezen || 0) + 1;
      broadcastSSE('bericht', { id: accountId, bericht });
      console.log(`[${accountId}] Nieuw bericht van +${van}: ${tekst.substring(0, 50)}`);
    }
  });
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET /accounts
app.get('/accounts', (req, res) => {
  res.json(ACCOUNTS.map(acc => state[acc.id]));
});

// POST /accounts/:id/connect
app.post('/accounts/:id/connect', async (req, res) => {
  const { id } = req.params;
  if (!state[id]) return res.status(404).json({ error: 'Account niet gevonden' });
  try {
    await connectAccount(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /accounts/:id/berichten
app.get('/accounts/:id/berichten', (req, res) => {
  const { id } = req.params;
  if (!berichten[id]) return res.status(404).json({ error: 'Account niet gevonden' });
  res.json(berichten[id]);
});

// POST /accounts/:id/stuur
app.post('/accounts/:id/stuur', async (req, res) => {
  const { id } = req.params;
  const { nummer, tekst } = req.body;
  if (!nummer || !tekst) return res.status(400).json({ error: 'nummer en tekst zijn verplicht' });
  if (!sockets[id] || state[id].status !== 'connected') {
    return res.status(503).json({ error: 'Account niet verbonden' });
  }
  try {
    const jid = `${nummer.replace(/\D/g, '')}@s.whatsapp.net`;
    await sockets[id].sendMessage(jid, { text: tekst });

    const bericht = {
      id: `out_${Date.now()}`,
      inkomend: false,
      naam: null,
      van: null,
      tekst,
      tijdstip: new Date().toISOString(),
    };
    berichten[id].push(bericht);
    res.json(bericht);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /accounts/:id/gelezen
app.post('/accounts/:id/gelezen', (req, res) => {
  const { id } = req.params;
  if (state[id]) state[id].ongelezen = 0;
  res.json({ success: true });
});

// GET /stream — SSE
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // Stuur huidige state direct
  for (const acc of ACCOUNTS) {
    res.write(`event: status\ndata: ${JSON.stringify({ id: acc.id, state: state[acc.id] })}\n\n`);
  }

  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch {}
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Extra WhatsApp server gestart op poort ${PORT}`);
  console.log(`📱 Drie accounts: horeca, logistiek, housekeeping`);
  console.log(`🔑 API key: ${API_KEY}`);
  console.log(`\nVerbind een account via:`);
  console.log(`  curl -X POST -H "x-api-key: ${API_KEY}" http://localhost:${PORT}/accounts/horeca/connect\n`);
});
