/**
 * Huistests: inkomende WhatsApp naar Job, de AI-recruiter.
 * Run met:  npx tsx server/whatsapp/__tests__/jobInbound.test.ts
 *
 * Geen database, geen netwerk: de verwerking krijgt nep-deps. Het punt:
 *  - Een kandidaat met een gesprek met Job krijgt antwoord van Job, niet van
 *    de gewone auto-reply.
 *  - Een kandidaat zonder gesprek met Job merkt niets: de auto-reply blijft.
 *  - Een knop uit een sjabloon ("Ik kom") komt als tekst bij Job aan.
 *  - Een document gaat als cv naar Job; STOP zet Job stil.
 *  - Een spraakbericht gaat naar Job (Job 3.0), die vraagt om te typen.
 */
import { processIncomingPayload, antwoordVoorJob, type InboundProcessorDeps, type JobInboundArgs } from '../inboundProcessor';
import { normalizePhone } from '../phone';

let geslaagd = 0;
let gefaald = 0;
function test(naam: string, ok: boolean, uitleg = '') {
  if (ok) { geslaagd++; console.log(`✓ ${naam}`); }
  else { gefaald++; console.log(`✗ ${naam}${uitleg ? ` (${uitleg})` : ''}`); }
}

function deps(jobNeemtOver: boolean) {
  const log = { job: [] as JobInboundArgs[], autoReply: 0, stop: 0 };
  const d: InboundProcessorDeps = {
    storage: {
      async applyStatusEvent() { return true; },
      async resolveAndUpsertConversation() { return { candidateId: 7, prospectContactId: null, category: 'candidate' as const }; },
      async insertInboundMessage() { return 1; },
      async insertAppEcho() { return 2; },
      async clearEscalation() {},
      describeNonTextMessage(type: string) { return `[${type}]`; },
      async updateMessageMedia() {},
    },
    optInService: {
      isBlockedByUserError() { return false; },
      async findConversationContact() { return { candidateId: 7, prospectContactId: null }; },
      async handleBlockedByUser() {},
      isStopMessage(t?: string | null) { return (t || '').trim().toLowerCase() === 'stop'; },
      async handleIncomingStop() { log.stop++; },
    },
    normalizePhone,
    tryAutoReply: async () => { log.autoReply++; },
    jobInbound: async (args) => { log.job.push(args); return jobNeemtOver; },
    haalMediaOpEnBewaar: async (args) => ({ ok: true, objectPath: `/test/wa-media/${args.mediaId}.pdf`, mimeType: 'application/pdf', filename: 'cv.pdf' }),
    logPrefix: '[test]',
  };
  return { d, log };
}

const payload = (msg: any) => ({ entry: [{ changes: [{ value: { contacts: [{ profile: { name: 'Lisa' }, wa_id: '31600000005' }], messages: [{ from: '31600000005', id: `wamid.${Math.random()}`, timestamp: '1762500000', ...msg }] } }] }] });
const wacht = () => new Promise((r) => setTimeout(r, 10));

async function main() {
  {
    const { d, log } = deps(true);
    await processIncomingPayload(payload({ type: 'text', text: { body: 'Twee jaar bediening' } }), d);
    test('tekst van een kandidaat met Job gaat naar Job', log.job.length === 1 && log.job[0].body === 'Twee jaar bediening' && log.job[0].candidateId === 7);
    test('dan geen gewone auto-reply', log.autoReply === 0);
  }
  {
    const { d, log } = deps(false);
    await processIncomingPayload(payload({ type: 'text', text: { body: 'Hoe laat begint mijn dienst?' } }), d);
    test('zonder gesprek met Job: gewone auto-reply blijft', log.job.length === 1 && log.autoReply === 1);
  }
  {
    const { d, log } = deps(true);
    await processIncomingPayload(payload({ type: 'button', button: { text: 'Ik kom', payload: 'Ik kom' } }), d);
    test('knop uit een sjabloon komt als tekst bij Job', log.job.length === 1 && log.job[0].type === 'text' && log.job[0].body === 'Ik kom');
  }
  {
    const { d, log } = deps(true);
    await processIncomingPayload(payload({ type: 'document', document: { id: 'MEDIA1', mime_type: 'application/pdf', filename: 'cv.pdf' } }), d);
    test('document gaat met het opgeslagen pad naar Job (het cv)', log.job.length === 1 && log.job[0].type === 'document' && log.job[0].media?.objectPath === '/test/wa-media/MEDIA1.pdf');
    test('een document geeft geen auto-reply', log.autoReply === 0);
  }
  {
    const { d, log } = deps(true);
    await processIncomingPayload(payload({ type: 'text', text: { body: 'STOP' } }), d);
    await wacht();
    test('STOP: opt-out én Job stil', log.stop === 1 && log.job.length === 1 && log.job[0].type === 'stop');
    test('STOP: geen auto-reply', log.autoReply === 0);
  }
  {
    const { d, log } = deps(true);
    await processIncomingPayload(payload({ type: 'audio', audio: { id: 'MEDIA2', mime_type: 'audio/ogg' } }), d);
    test('spraakbericht gaat als audio naar Job (Job vraagt om te typen)', log.job.length === 1 && log.job[0].type === 'audio' && !log.job[0].media);
    test('spraakbericht: geen auto-reply', log.autoReply === 0);
  }
  {
    const { d, log } = deps(false);
    await processIncomingPayload(payload({ type: 'audio', audio: { id: 'MEDIA3', mime_type: 'audio/ogg' } }), d);
    test('spraakbericht zonder gesprek met Job: niets verandert', log.job.length === 1 && log.autoReply === 0);
  }
  test('antwoordVoorJob: tekst', antwoordVoorJob('text', 'hoi', {}) === 'hoi');
  test('antwoordVoorJob: interactieve knop', antwoordVoorJob('interactive', '', { interactive: { button_reply: { title: 'Verzetten' } } }) === 'Verzetten');
  test('antwoordVoorJob: foto zonder tekst is geen antwoord', antwoordVoorJob('image', '[image]', {}) === null);

  console.log(`\n${geslaagd} geslaagd, ${gefaald} gefaald`);
  process.exit(gefaald > 0 ? 1 : 0);
}
main();
