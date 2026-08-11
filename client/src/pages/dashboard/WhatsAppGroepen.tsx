/**
 * Groepsgesprekken: WhatsApp-groepen die EXTRA zelf aanmaakt (max 8
 * deelnemers, de grens van de WhatsApp Groups API) om met klanten en/of
 * medewerkers te chatten — zichtbaar en te gebruiken door iedereen met
 * toegang tot het dashboard, niet gebonden aan wie de groep heeft
 * aangemaakt of aan één planner z'n eigen telefoon.
 *
 * BELANGRIJKE BEPERKING (zie ook de toelichting die aan Max is gegeven vóór
 * de bouw hiervan): dit kan alleen groepen tonen die HIER zijn aangemaakt.
 * Er is geen manier om mee te kijken in een bestaande groep die een klant of
 * medewerker zelf al ergens anders is gestart — dat staat WhatsApp niet toe.
 *
 * Deelnemers komen niet automatisch binnen via een webhook (het exacte
 * schema van group_participants_update kon bij de bouw niet met zekerheid
 * worden vastgesteld) — vandaar de losse "ververs deelnemers"-knop.
 *
 * Eigen sidebar-item (zie CommunicatieNav.tsx), los van de bestaande
 * bulk-verzendlijsten ("Groepen" in de backend) — dat is een ander concept
 * (geen echte WhatsApp-groep, geen wederzijds gesprek).
 */
import { useState, useEffect, useRef } from 'react';
import { Plus, X, RefreshCw, Copy, Trash2, Send, Users, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import {
  haalGroepsgesprekken,
  haalGroepsgesprek,
  maakGroepsgesprek,
  stuurGroepsBericht,
  versGroepsgesprek,
  verwijderGroepsDeelnemer,
  type GroupChat,
  type GroupChatDetail,
  type GroupChatMessage,
} from '../../api/whatsappClient';

const NAVY = '#7E22CE';
const FONT = "'Poppins', system-ui, -apple-system, sans-serif";
const MAX_PARTICIPANTS = 8;

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
  border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box',
};
const primaryBtn = (busy: boolean): React.CSSProperties => ({
  background: busy ? '#C4B5FD' : NAVY, color: '#fff', border: 'none', borderRadius: 6,
  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer',
});
const secondaryBtn: React.CSSProperties = {
  background: '#fff', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 6,
  padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const iconBtn: React.CSSProperties = {
  background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6,
  padding: '6px 8px', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center',
};

const STATUS_LABEL: Record<GroupChat['status'], string> = {
  active: 'Actief',
  suspended: 'Opgeschort',
  deleted: 'Verwijderd',
};
const STATUS_COLOR: Record<GroupChat['status'], { bg: string; fg: string }> = {
  active: { bg: '#DCFCE7', fg: '#166534' },
  suspended: { bg: '#FEF3C7', fg: '#92400E' },
  deleted: { bg: '#FEE2E2', fg: '#991B1B' },
};

// ─── Aanmaak-modal ───────────────────────────────────────────────────────────
function CreateModal({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [naam, setNaam] = useState('');
  const [omschrijving, setOmschrijving] = useState('');
  const [deelnemers, setDeelnemers] = useState<Array<{ telefoon: string; naam: string }>>([{ telefoon: '', naam: '' }]);
  const [busy, setBusy] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<{ inviteLink: string | null } | null>(null);

  function zetDeelnemer(i: number, veld: 'telefoon' | 'naam', waarde: string) {
    setDeelnemers(prev => prev.map((d, idx) => idx === i ? { ...d, [veld]: waarde } : d));
  }
  function voegDeelnemerToe() {
    if (deelnemers.length >= MAX_PARTICIPANTS) return;
    setDeelnemers(prev => [...prev, { telefoon: '', naam: '' }]);
  }
  function verwijderRij(i: number) {
    setDeelnemers(prev => prev.filter((_, idx) => idx !== i));
  }

  async function aanmaken() {
    if (!naam.trim()) { setFout('Naam van de groep is verplicht'); return; }
    setBusy(true);
    setFout(null);
    try {
      const ingevuld = deelnemers.filter(d => d.telefoon.trim());
      const r = await maakGroepsgesprek({
        naam,
        omschrijving: omschrijving || undefined,
        deelnemers: ingevuld.map(d => ({ telefoon: d.telefoon, naam: d.naam || undefined })),
      });
      if (!r.ok) {
        setFout(r.errors?.map(e => e.message).join(' · ') || r.providerError || r.error || 'Aanmaken mislukt');
        return;
      }
      setResultaat({ inviteLink: r.groupChat?.inviteLink ?? null });
    } catch (e: any) {
      setFout(e.message || 'Aanmaken mislukt');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 520, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24, fontFamily: FONT }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>Nieuw groepsgesprek</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
        </div>

        {resultaat ? (
          <div style={{ fontSize: 13 }}>
            <div style={{ color: '#166534', marginBottom: 12 }}>Groep aangemaakt. Deel de uitnodigingslink met de deelnemers — WhatsApp staat geen automatisch toevoegen toe, joinen gaat alleen via deze link.</div>
            {resultaat.inviteLink ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAFBFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 10 }}>
                <LinkIcon size={14} color="#6B7280" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12 }}>{resultaat.inviteLink}</span>
                <button onClick={() => navigator.clipboard.writeText(resultaat.inviteLink!)} style={iconBtn} title="Kopiëren"><Copy size={14} /></button>
              </div>
            ) : (
              <div style={{ color: '#92400E', fontSize: 12 }}>
                Geen uitnodigingslink ontvangen bij het aanmaken — open de groep en klik op "Ververs deelnemers" om 'm alsnog op te halen.
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={onCreated} style={primaryBtn(false)}>Sluiten</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <label>
              Naam van de groep
              <input value={naam} onChange={e => setNaam(e.target.value)} style={inputStyle} placeholder="bv. Klus Dutch Rental Company" maxLength={128} />
            </label>
            <label>
              Omschrijving (optioneel)
              <input value={omschrijving} onChange={e => setOmschrijving(e.target.value)} style={inputStyle} />
            </label>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Deelnemers (max {MAX_PARTICIPANTS})</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{deelnemers.filter(d => d.telefoon.trim()).length}/{MAX_PARTICIPANTS}</span>
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>
                Alleen ter documentatie — mensen worden pas lid via de uitnodigingslink hierna, niet automatisch door dit in te vullen.
              </div>
              {deelnemers.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <input value={d.telefoon} onChange={e => zetDeelnemer(i, 'telefoon', e.target.value)} placeholder="06..." style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
                  <input value={d.naam} onChange={e => zetDeelnemer(i, 'naam', e.target.value)} placeholder="Naam (optioneel)" style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
                  <button onClick={() => verwijderRij(i)} style={iconBtn} title="Verwijderen"><X size={14} /></button>
                </div>
              ))}
              {deelnemers.length < MAX_PARTICIPANTS && (
                <button onClick={voegDeelnemerToe} style={{ ...secondaryBtn, fontSize: 12, padding: '6px 10px' }}>+ Deelnemer</button>
              )}
            </div>

            {fout && (
              <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                {fout}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button onClick={onCancel} style={secondaryBtn}>Annuleren</button>
              <button onClick={aanmaken} disabled={busy} style={primaryBtn(busy)}>{busy ? 'Bezig...' : 'Aanmaken'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Thread-weergave ─────────────────────────────────────────────────────────
function GroupThread({ id, onChanged }: { id: number; onChanged: () => void }) {
  const [detail, setDetail] = useState<GroupChatDetail | null>(null);
  const [tekst, setTekst] = useState('');
  const [versturen, setVersturen] = useState(false);
  const [verversen, setVerversen] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function laden() {
    try {
      setDetail(await haalGroepsgesprek(id));
    } catch { /* ignore */ }
  }
  useEffect(() => { laden(); }, [id]);
  useEffect(() => {
    const t = setInterval(laden, 5000);
    return () => clearInterval(t);
  }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [detail?.messages.length]);

  async function versturenKlik() {
    if (!tekst.trim()) return;
    setVersturen(true);
    setFout(null);
    try {
      const r = await stuurGroepsBericht(id, tekst);
      if (!r.ok) {
        setFout(r.errors?.map(e => e.message).join(' · ') || r.providerError || r.error || 'Versturen mislukt');
      } else {
        setTekst('');
        await laden();
      }
    } catch (e: any) {
      setFout(e.message || 'Versturen mislukt');
    } finally {
      setVersturen(false);
    }
  }

  async function verversenKlik() {
    setVerversen(true);
    setFout(null);
    try {
      const r = await versGroepsgesprek(id);
      if (!r.ok) setFout(r.providerError || r.error || 'Verversen mislukt');
      await laden();
      onChanged();
    } catch (e: any) {
      setFout(e.message || 'Verversen mislukt');
    } finally {
      setVerversen(false);
    }
  }

  async function deelnemerVerwijderen(phone: string) {
    if (!confirm(`Deelnemer ${phone} uit de groep verwijderen?`)) return;
    try {
      await verwijderGroepsDeelnemer(id, phone);
      await laden();
    } catch (e: any) {
      setFout(e.message || 'Verwijderen mislukt');
    }
  }

  if (!detail) return <div style={{ padding: 24, color: '#6B7280', fontSize: 13 }}>Laden...</div>;

  const c = STATUS_COLOR[detail.status];

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{detail.subject}</span>
              <span style={{ background: c.bg, color: c.fg, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                {STATUS_LABEL[detail.status]}
              </span>
            </div>
            {detail.description && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{detail.description}</div>}
          </div>
          <button onClick={verversenKlik} disabled={verversen} style={{ ...iconBtn, gap: 6 }} title="Ververs deelnemers">
            <RefreshCw size={14} /> {verversen ? 'Bezig...' : 'Ververs deelnemers'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10, background: '#FAFBFC' }}>
          {detail.messages.length === 0 && (
            <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 24 }}>Nog geen berichten in deze groep.</div>
          )}
          {detail.messages.map(m => <MessageBubble key={m.id} m={m} />)}
          <div ref={bottomRef} />
        </div>

        {fout && (
          <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 12, padding: '8px 18px' }}>{fout}</div>
        )}

        <div style={{ padding: 12, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 8 }}>
          <input
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); versturenKlik(); } }}
            placeholder={detail.status === 'active' ? 'Typ een bericht...' : 'Deze groep is niet meer actief'}
            disabled={detail.status !== 'active'}
            style={{ ...inputStyle, marginTop: 0, flex: 1 }}
          />
          <button onClick={versturenKlik} disabled={versturen || detail.status !== 'active' || !tekst.trim()} style={{ ...primaryBtn(versturen), display: 'flex', alignItems: 'center', gap: 6 }}>
            <Send size={14} /> Sturen
          </button>
        </div>
      </div>

      <div style={{ width: 240, flexShrink: 0, borderLeft: '1px solid #E5E7EB', padding: 16, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
          <Users size={14} /> Deelnemers ({detail.participantCount})
        </div>
        {detail.participants.length === 0 && (
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>Nog niemand toegetreden — deel de uitnodigingslink.</div>
        )}
        {detail.participants.map(p => (
          <div key={p.phone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
            <span>{p.naam || p.phone}</span>
            <button onClick={() => deelnemerVerwijderen(p.phone)} title="Verwijderen" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        {detail.inviteLink ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Uitnodigingslink</div>
            <button
              onClick={() => navigator.clipboard.writeText(detail.inviteLink!)}
              style={{ ...secondaryBtn, fontSize: 11, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
            >
              <Copy size={12} /> Kopiëren
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 16, fontSize: 11, color: '#92400E', display: 'flex', gap: 6 }}>
            <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
            Geen uitnodigingslink bekend — probeer "Ververs deelnemers".
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: GroupChatMessage }) {
  const eigen = m.direction === 'outbound';
  return (
    <div style={{ display: 'flex', justifyContent: eigen ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '70%', background: eigen ? '#EDE9FE' : '#fff', border: '1px solid #E5E7EB',
        borderRadius: 10, padding: '8px 12px', fontSize: 13,
      }}>
        {!eigen && (
          <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, marginBottom: 2 }}>
            {m.participantName || m.participantPhone || 'Onbekend'}
          </div>
        )}
        {eigen && m.sentByName && (
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 2 }}>{m.sentByName}</div>
        )}
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' }}>
          {new Date(m.createdAt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ─── Hoofdscherm ─────────────────────────────────────────────────────────────
export default function WhatsAppGroepen() {
  const [groepen, setGroepen] = useState<GroupChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [geselecteerd, setGeselecteerd] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  async function laden() {
    setLoading(true);
    try {
      setGroepen(await haalGroepsgesprekken());
    } catch { /* ignore */ }
    setLoading(false);
  }
  useEffect(() => { laden(); }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 57px)', minHeight: 480, fontFamily: FONT, background: '#fff' }}>
      <div style={{ width: 320, minWidth: 260, borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Groepsgesprekken</h1>
            <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>Max {MAX_PARTICIPANTS} deelnemers per groep</p>
          </div>
          <button onClick={() => setCreateOpen(true)} style={{ ...iconBtn }} title="Nieuw groepsgesprek"><Plus size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 16, color: '#6B7280', fontSize: 13 }}>Laden...</div>
          ) : groepen.length === 0 ? (
            <div style={{ padding: 16, color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
              Nog geen groepsgesprekken. Klik op + om er een te starten.
            </div>
          ) : (
            groepen.map(g => (
              <div
                key={g.id}
                onClick={() => setGeselecteerd(g.id)}
                style={{
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6',
                  background: geselecteerd === g.id ? '#F5F3FF' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{g.subject}</span>
                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>{g.participantCount}/{MAX_PARTICIPANTS}</span>
                </div>
                {g.lastMessagePreview && (
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.lastMessagePreview}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {geselecteerd ? (
          <GroupThread id={geselecteerd} onChanged={laden} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: 13 }}>
            Kies een groepsgesprek, of maak een nieuwe aan.
          </div>
        )}
      </div>

      {createOpen && (
        <CreateModal
          onCancel={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); laden(); }}
        />
      )}
    </div>
  );
}
