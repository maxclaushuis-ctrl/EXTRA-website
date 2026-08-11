/**
 * WhatsApp-templates: aanmaken, indienen bij Meta/360dialog voor goedkeuring,
 * status verversen, verwijderen — en een goedgekeurd template versturen naar
 * een bestaande groep (server/whatsapp/templates.ts + POST /groups/:id/send).
 *
 * Eigen sidebar-item (zie CommunicatieNav.tsx) i.p.v. een tab in de oude
 * WhatsAppBeheer.tsx: dat scherm is sinds de Fase 2-inbox (dashboard/whatsapp/)
 * niet meer gerouteerd, dus een nieuwe tab daar zou nergens klikbaar zijn.
 */
import { useState, useEffect, useMemo } from 'react';
import { Plus, Send, RefreshCw, Trash2, Pencil, UploadCloud, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  haalTemplates,
  maakTemplate,
  bewerkTemplate,
  verwijderTemplate,
  dienTemplateIn,
  verversTemplateStatus,
  extractVariabelen,
  haalGroepen,
  stuurTemplateBericht,
  type WhatsappTemplate,
  type TemplateFormInput,
  type TemplateCategory,
  type Group,
} from '../../api/whatsappClient';

const NAVY = '#7E22CE';
const FONT = "'Poppins', system-ui, -apple-system, sans-serif";

const STATUS_LABEL: Record<WhatsappTemplate['status'], string> = {
  concept: 'Concept',
  in_review: 'In behandeling',
  approved: 'Goedgekeurd',
  rejected: 'Afgewezen',
};
const STATUS_COLOR: Record<WhatsappTemplate['status'], { bg: string; fg: string }> = {
  concept: { bg: '#F3F4F6', fg: '#4B5563' },
  in_review: { bg: '#FEF3C7', fg: '#92400E' },
  approved: { bg: '#DCFCE7', fg: '#166534' },
  rejected: { bg: '#FEE2E2', fg: '#991B1B' },
};

const AUTO_VARS = new Set(['voornaam', 'achternaam', 'naam']);

function StatusBadge({ status }: { status: WhatsappTemplate['status'] }) {
  const c = STATUS_COLOR[status];
  return (
    <span style={{
      background: c.bg, color: c.fg, fontSize: 11, fontWeight: 700,
      padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Aanmaak-/bewerkformulier ────────────────────────────────────────────────
function TemplateForm({
  bewerk, onCancel, onSaved,
}: {
  bewerk: WhatsappTemplate | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [naam, setNaam] = useState(bewerk?.name || '');
  const [omschrijving, setOmschrijving] = useState(bewerk?.description || '');
  const [categorie, setCategorie] = useState<TemplateCategory>(bewerk?.category || 'UTILITY');
  const [taal, setTaal] = useState(bewerk?.language || 'nl');
  const [bodyTekst, setBodyTekst] = useState(bewerk?.bodyPreview || '');
  const [voorbeeldwaarden, setVoorbeeldwaarden] = useState<Record<string, string>>(bewerk?.exampleValues || {});
  const [knopTekst, setKnopTekst] = useState(bewerk?.buttonText || '');
  const [knopUrl, setKnopUrl] = useState(bewerk?.buttonUrl || '');
  const [knopDynamisch, setKnopDynamisch] = useState(!!bewerk?.buttonDynamic);
  const [knopVoorbeeld, setKnopVoorbeeld] = useState(bewerk?.buttonExample || '');
  const [busy, setBusy] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const variabelen = useMemo(() => extractVariabelen(bodyTekst), [bodyTekst]);
  const SUGGESTIES: Record<string, string> = { voornaam: 'Max', opdrachtgever: 'Hotel Okura', datum: '12 maart', tijd: '17:00' };

  async function opslaan() {
    if (!naam.trim() || !bodyTekst.trim()) {
      setFout('Naam en bodytekst zijn verplicht');
      return;
    }
    setBusy(true);
    setFout(null);
    const input: TemplateFormInput = {
      naam, omschrijving: omschrijving || undefined, categorie, taal, bodyTekst,
      voorbeeldwaarden, knopTekst: knopTekst || undefined, knopUrl: knopUrl || undefined,
      knopDynamisch, knopVoorbeeld: knopVoorbeeld || undefined,
    };
    try {
      if (bewerk) await bewerkTemplate(bewerk.key, input);
      else await maakTemplate(input);
      onSaved();
    } catch (e: any) {
      setFout(e.message || 'Opslaan mislukt');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: 560, maxWidth: '100%',
        maxHeight: '90vh', overflowY: 'auto', padding: 24, fontFamily: FONT,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>
            {bewerk ? `Template bewerken — ${bewerk.name}` : 'Nieuw template'}
          </h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
          <label>
            Naam
            <input value={naam} onChange={e => setNaam(e.target.value)} style={inputStyle} placeholder="bv. Herinnering kennismakingsgesprek" />
          </label>
          <label>
            Omschrijving (intern, optioneel)
            <input value={omschrijving} onChange={e => setOmschrijving(e.target.value)} style={inputStyle} />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ flex: 1 }}>
              Categorie
              <select value={categorie} onChange={e => setCategorie(e.target.value as TemplateCategory)} style={inputStyle}>
                <option value="UTILITY">UTILITY</option>
                <option value="MARKETING">MARKETING</option>
              </select>
            </label>
            <label style={{ flex: 1 }}>
              Taal
              <input value={taal} onChange={e => setTaal(e.target.value)} style={inputStyle} placeholder="nl" />
            </label>
          </div>
          <label>
            Bodytekst — gebruik <code>{'{variabele}'}</code> voor dynamische tekst
            <textarea
              value={bodyTekst}
              onChange={e => setBodyTekst(e.target.value)}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: FONT }}
              placeholder={'Hoi {voornaam}, ...'}
            />
          </label>

          {variabelen.length > 0 && (
            <div style={{ background: '#FAFBFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>Voorbeeldwaarden per variabele (verplicht vóór indienen)</div>
              {variabelen.map(v => (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 110, fontFamily: 'monospace', color: '#6B7280' }}>{'{' + v + '}'}</span>
                  <input
                    value={voorbeeldwaarden[v] || ''}
                    onChange={e => setVoorbeeldwaarden(prev => ({ ...prev, [v]: e.target.value }))}
                    placeholder={SUGGESTIES[v.toLowerCase()] || 'voorbeeldwaarde'}
                    style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>Knop (optioneel — max 1 URL-knop)</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ flex: 1 }}>
                Knoptekst (max 25 tekens)
                <input value={knopTekst} onChange={e => setKnopTekst(e.target.value)} maxLength={25} style={inputStyle} />
              </label>
              <label style={{ flex: 2 }}>
                Knop-URL (https://...)
                <input value={knopUrl} onChange={e => setKnopUrl(e.target.value)} style={inputStyle} />
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <input type="checkbox" checked={knopDynamisch} onChange={e => setKnopDynamisch(e.target.checked)} />
              URL is dynamisch (eindigt op een variabele, bv. <code>.../shift/{'{{1}}'}</code>)
            </label>
            {knopDynamisch && (
              <label style={{ display: 'block', marginTop: 8 }}>
                Voorbeeldwaarde voor de dynamische knop
                <input value={knopVoorbeeld} onChange={e => setKnopVoorbeeld(e.target.value)} style={inputStyle} />
              </label>
            )}
          </div>

          {fout && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
              {fout}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button onClick={onCancel} style={secondaryBtn}>Annuleren</button>
            <button onClick={opslaan} disabled={busy} style={primaryBtn(busy)}>
              {busy ? 'Bezig...' : 'Opslaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Versturen naar een groep ────────────────────────────────────────────────
function SendModal({ template, onClose }: { template: WhatsappTemplate; onClose: () => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => { haalGroepen().then(setGroups).catch(() => {}); }, []);

  const extraVars = (template.variables || []).filter(v => !AUTO_VARS.has(v.toLowerCase()));

  async function versturen() {
    if (!groupId) { setFout('Kies een groep'); return; }
    if (!reason.trim()) { setFout('Aanleiding is verplicht'); return; }
    setBusy(true);
    setFout(null);
    try {
      const r = await stuurTemplateBericht(groupId, template.key, reason, extra);
      setResult({ sent: r.sent, failed: r.failed, total: r.total });
    } catch (e: any) {
      setFout(e.message || 'Versturen mislukt');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 440, maxWidth: '100%', padding: 24, fontFamily: FONT }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>Versturen — {template.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
        </div>

        {result ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', marginBottom: 12 }}>
              <CheckCircle2 size={18} />
              <span>{result.sent} van {result.total} verstuurd{result.failed > 0 ? `, ${result.failed} mislukt` : ''}</span>
            </div>
            <button onClick={onClose} style={primaryBtn(false)}>Sluiten</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <label>
              Groep
              <select value={groupId ?? ''} onChange={e => setGroupId(e.target.value ? Number(e.target.value) : null)} style={inputStyle}>
                <option value="">Kies een groep...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.memberCount} leden)</option>)}
              </select>
            </label>
            <label>
              Aanleiding (voor het audit-spoor)
              <input value={reason} onChange={e => setReason(e.target.value)} style={inputStyle} placeholder="bv. wervingsactie augustus" />
            </label>
            {extraVars.length > 0 && (
              <div style={{ background: '#FAFBFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                  Waarden voor deze verzending ({'{voornaam}'}/{'{achternaam}'}/{'{naam}'} worden automatisch per ontvanger ingevuld)
                </div>
                {extraVars.map(v => (
                  <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 110, fontFamily: 'monospace', color: '#6B7280' }}>{'{' + v + '}'}</span>
                    <input
                      value={extra[v] || ''}
                      onChange={e => setExtra(prev => ({ ...prev, [v]: e.target.value }))}
                      style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                    />
                  </div>
                ))}
              </div>
            )}
            {fout && (
              <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                {fout}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={onClose} style={secondaryBtn}>Annuleren</button>
              <button onClick={versturen} disabled={busy} style={primaryBtn(busy)}>
                {busy ? 'Bezig...' : 'Versturen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

// ─── Hoofdscherm ─────────────────────────────────────────────────────────────
export default function WhatsAppTemplates() {
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [bewerk, setBewerk] = useState<WhatsappTemplate | null>(null);
  const [sendTarget, setSendTarget] = useState<WhatsappTemplate | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [meldingen, setMeldingen] = useState<Record<string, string>>({});

  async function laden() {
    setLoading(true);
    try {
      setTemplates(await haalTemplates());
    } catch { /* ignore */ }
    setLoading(false);
  }
  useEffect(() => { laden(); }, []);

  async function indienen(t: WhatsappTemplate) {
    setBusyKey(t.key);
    setMeldingen(prev => ({ ...prev, [t.key]: '' }));
    const r = await dienTemplateIn(t.key);
    if (!r.ok) {
      const msg = r.errors?.map(e => e.message).join(' · ') || r.providerError || r.error || 'Indienen mislukt';
      setMeldingen(prev => ({ ...prev, [t.key]: msg }));
    } else {
      await laden();
    }
    setBusyKey(null);
  }

  async function statusVerversen(t: WhatsappTemplate) {
    setBusyKey(t.key);
    setMeldingen(prev => ({ ...prev, [t.key]: '' }));
    const r = await verversTemplateStatus(t.key);
    if (!r.ok) {
      setMeldingen(prev => ({ ...prev, [t.key]: r.error || r.providerError || 'Statussync mislukt' }));
    } else {
      await laden();
    }
    setBusyKey(null);
  }

  async function verwijderen(t: WhatsappTemplate) {
    if (!confirm(`Template "${t.name}" verwijderen?`)) return;
    setBusyKey(t.key);
    try {
      await verwijderTemplate(t.key);
      await laden();
    } catch (e: any) {
      setMeldingen(prev => ({ ...prev, [t.key]: e.message || 'Verwijderen mislukt' }));
    }
    setBusyKey(null);
  }

  return (
    <div style={{ padding: 24, fontFamily: FONT, maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>WhatsApp-templates</h1>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>
            Aanmaken, indienen bij Meta voor goedkeuring en versturen naar een groep.
          </p>
        </div>
        <button onClick={() => { setBewerk(null); setFormOpen(true); }} style={{ ...primaryBtn(false), display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Nieuw template
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#6B7280', fontSize: 13 }}>Laden...</div>
      ) : templates.length === 0 ? (
        <div style={{ color: '#6B7280', fontSize: 13, padding: 24, textAlign: 'center', border: '1px dashed #E5E7EB', borderRadius: 12 }}>
          Nog geen templates. Klik op "Nieuw template" om te beginnen.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map(t => (
            <div key={t.key} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</span>
                    <StatusBadge status={t.status} />
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{t.category} · {t.language}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {t.bodyPreview}
                  </div>
                  {t.status === 'rejected' && t.metaStatusReason && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#991B1B', marginTop: 6 }}>
                      <AlertTriangle size={12} /> {t.metaStatusReason}
                    </div>
                  )}
                  {meldingen[t.key] && (
                    <div style={{ fontSize: 11, color: '#DC2626', marginTop: 6 }}>{meldingen[t.key]}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {(t.status === 'concept' || t.status === 'rejected') && (
                    <button title="Bewerken" onClick={() => { setBewerk(t); setFormOpen(true); }} style={iconBtn}><Pencil size={14} /></button>
                  )}
                  {(t.status === 'concept' || t.status === 'rejected') && (
                    <button title="Indienen bij provider" disabled={busyKey === t.key} onClick={() => indienen(t)} style={iconBtn}><UploadCloud size={14} /></button>
                  )}
                  {(t.status === 'in_review' || t.status === 'approved' || t.status === 'rejected') && (
                    <button title="Status verversen" disabled={busyKey === t.key} onClick={() => statusVerversen(t)} style={iconBtn}><RefreshCw size={14} /></button>
                  )}
                  {t.status === 'approved' && (
                    <button title="Versturen naar groep" onClick={() => setSendTarget(t)} style={iconBtn}><Send size={14} /></button>
                  )}
                  {t.status !== 'approved' && (
                    <button title="Verwijderen" disabled={busyKey === t.key} onClick={() => verwijderen(t)} style={iconBtn}><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <TemplateForm
          bewerk={bewerk}
          onCancel={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); laden(); }}
        />
      )}
      {sendTarget && (
        <SendModal template={sendTarget} onClose={() => { setSendTarget(null); laden(); }} />
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6,
  padding: '6px 8px', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center',
};
