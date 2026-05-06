import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, ChevronDown, Save, Check, AlertCircle } from 'lucide-react';
import {
  haalAiSettings,
  updateAiSettings,
  haalAiKnowledge,
  maakAiKnowledge,
  updateAiKnowledge,
  verwijderAiKnowledge,
  haalAiAttachments,
  uploadAiAttachment,
  updateAiAttachment,
  verwijderAiAttachment,
  type AiSettings,
  type AiKnowledgeEntry,
  type AiAttachment,
  type AiAttachmentFieldKey,
} from '../../api/whatsappClient';

const NAVY = '#7E22CE';
const FONT = "'Poppins', system-ui, -apple-system, sans-serif";

// De 8 hoofdvelden die de globale "Opslaan"-knop persisteert. Alleen wijzigingen
// in deze velden triggeren de "(niet opgeslagen wijzigingen)"-indicator.
// Protocollen (knowledge) hebben hun eigen per-item Opslaan-knop.
type SettingsCore = Pick<AiSettings,
  | 'toneOfVoice'
  | 'voiceExamples'
  | 'guidelines'
  | 'cancellationProtocol'
  | 'extraContext'
  | 'autoReplyEnabled'
  | 'autoReplyOnlyForKnown'
  | 'autoReplyMinIntervalSec'
>;

function pickCore(s: AiSettings): SettingsCore {
  return {
    toneOfVoice: s.toneOfVoice,
    voiceExamples: s.voiceExamples,
    guidelines: s.guidelines,
    cancellationProtocol: s.cancellationProtocol,
    extraContext: s.extraContext,
    autoReplyEnabled: s.autoReplyEnabled,
    autoReplyOnlyForKnown: s.autoReplyOnlyForKnown,
    autoReplyMinIntervalSec: s.autoReplyMinIntervalSec,
  };
}

// LocalStorage-helpers voor per-sectie inklap-state. Patroon volgt
// `nav_campagnes_ingeklapt` uit DashboardMockup.tsx: '1' = ingeklapt, anders open.
function loadCollapsed(key: string): boolean {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}
function saveCollapsed(key: string, collapsed: boolean) {
  try { localStorage.setItem(key, collapsed ? '1' : '0'); } catch { /* ignore */ }
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({
  storageKey, icon, title, subtitle, children,
}: {
  storageKey: string;
  icon: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState<boolean>(() => loadCollapsed(storageKey));
  const toggle = () => {
    setCollapsed(c => {
      const next = !c;
      saveCollapsed(storageKey, next);
      return next;
    });
  };
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
      marginBottom: 14, overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
          borderBottom: collapsed ? 'none' : '1px solid #F3F4F6',
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        <ChevronDown
          size={18}
          style={{
            color: '#9CA3AF',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>
      {!collapsed && (
        <div style={{ padding: '14px 18px 18px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Hoofdcomponent ──────────────────────────────────────────────────────────
export default function WhatsAppAIInstellingen() {
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  // Snapshot van laatst-geladen/opgeslagen kernvelden — referentie voor dirty-detectie.
  const [savedCore, setSavedCore] = useState<SettingsCore | null>(null);
  const [aiKnowledge, setAiKnowledge] = useState<AiKnowledgeEntry[]>([]);
  const [aiAttachments, setAiAttachments] = useState<AiAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Korte status-flits naast de Opslaan-knop ('saved' = groen, 'error' = rood).
  const [savedFlash, setSavedFlash] = useState<'saved' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newKnowledgeTitle, setNewKnowledgeTitle] = useState('');
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('');
  const [knowledgeSavingId, setKnowledgeSavingId] = useState<number | 'new' | null>(null);
  const [attachmentUploadingKey, setAttachmentUploadingKey] = useState<string | null>(null);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [s, k, a] = await Promise.all([haalAiSettings(), haalAiKnowledge(), haalAiAttachments()]);
        if (cancelled) return;
        setAiSettings(s);
        setSavedCore(pickCore(s));
        setAiKnowledge(k);
        setAiAttachments(a);
      } catch (e: any) {
        if (!cancelled) setErrorMsg(e?.message || 'Laden mislukt');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Dirty-detectie op de 8 kernvelden ────────────────────────────────────
  const isDirty = useMemo(() => {
    if (!aiSettings || !savedCore) return false;
    return JSON.stringify(pickCore(aiSettings)) !== JSON.stringify(savedCore);
  }, [aiSettings, savedCore]);

  // Browser-waarschuwing bij sluiten met onopgeslagen wijzigingen.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ─── Save (alleen 8 kernvelden) ───────────────────────────────────────────
  const saveCore = useCallback(async () => {
    if (!aiSettings || !isDirty || saving) return;
    setSaving(true);
    setSavedFlash(null);
    setErrorMsg(null);
    try {
      const updated = await updateAiSettings(pickCore(aiSettings));
      setAiSettings(updated);
      setSavedCore(pickCore(updated));
      setSavedFlash('saved');
      setTimeout(() => setSavedFlash(null), 2000);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Opslaan mislukt');
      setSavedFlash('error');
      setTimeout(() => setSavedFlash(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [aiSettings, isDirty, saving]);

  // Cmd/Ctrl+S → opslaan.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCore();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveCore]);

  // ─── Bijlage-handlers (PDF per veld of per protocol) ──────────────────────
  async function handleAttachmentUpload(fieldKey: AiAttachmentFieldKey, file: File, knowledgeId?: number | null) {
    if (file.type !== 'application/pdf') {
      alert('Alleen PDF-bestanden zijn toegestaan');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert('Bestand is groter dan 25 MB');
      return;
    }
    const key = `${fieldKey}:${knowledgeId ?? ''}`;
    setAttachmentUploadingKey(key);
    try {
      const created = await uploadAiAttachment(fieldKey, file, knowledgeId ?? null);
      setAiAttachments(prev => [...prev, created]);
    } catch (e: any) {
      alert(e?.message || 'Upload mislukt');
    } finally {
      setAttachmentUploadingKey(null);
    }
  }

  async function handleAttachmentToggle(att: AiAttachment) {
    try {
      const updated = await updateAiAttachment(att.id, { enabled: !att.enabled });
      setAiAttachments(prev => prev.map(a => a.id === att.id ? updated : a));
    } catch (e: any) {
      alert(e?.message || 'Wijzigen mislukt');
    }
  }

  async function handleAttachmentDelete(att: AiAttachment) {
    if (!window.confirm(`PDF "${att.filename}" verwijderen?`)) return;
    try {
      await verwijderAiAttachment(att.id);
      setAiAttachments(prev => prev.filter(a => a.id !== att.id));
    } catch (e: any) {
      alert(e?.message || 'Verwijderen mislukt');
    }
  }

  function renderAttachmentList(fieldKey: AiAttachmentFieldKey, knowledgeId?: number | null) {
    const filtered = aiAttachments.filter(a =>
      a.fieldKey === fieldKey && (fieldKey !== 'knowledge' || a.knowledgeId === (knowledgeId ?? null))
    );
    const key = `${fieldKey}:${knowledgeId ?? ''}`;
    const isUploading = attachmentUploadingKey === key;
    const fmtBytes = (n: number) => n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
    return (
      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {filtered.map(att => (
          <div key={att.id}
            title={att.enabled ? `Geüpload ${new Date(att.uploadedAt).toLocaleDateString('nl-NL')} · klik om uit te schakelen` : 'Klik om in te schakelen'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 8px',
              background: att.enabled ? '#EFF6FF' : '#F3F4F6',
              border: `1px solid ${att.enabled ? '#BFDBFE' : '#E5E7EB'}`,
              borderRadius: 12, fontSize: 11,
              color: att.enabled ? NAVY : '#6B7280',
              opacity: att.enabled ? 1 : 0.7,
            }}>
            <span onClick={() => handleAttachmentToggle(att)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span>📎</span>
              <span style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.filename}</span>
              <span style={{ color: '#9CA3AF', fontSize: 10 }}>({fmtBytes(att.fileSize)})</span>
              {!att.enabled && <span style={{ fontSize: 10, color: '#9CA3AF' }}>uit</span>}
            </span>
            <button onClick={() => handleAttachmentDelete(att)} title="Verwijderen"
              style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
          </div>
        ))}
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 8px', borderRadius: 12,
          background: isUploading ? '#F3F4F6' : '#fff',
          border: '1px dashed #CBD5E1', color: '#6B7280',
          fontSize: 11, cursor: isUploading ? 'wait' : 'pointer',
        }}>
          <span>📄</span>
          <span>{isUploading ? 'Uploaden...' : 'PDF toevoegen'}</span>
          <input type="file" accept="application/pdf" disabled={isUploading}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleAttachmentUpload(fieldKey, f, knowledgeId);
              e.target.value = '';
            }}
            style={{ display: 'none' }} />
        </label>
      </div>
    );
  }

  // ─── Knowledge / Protocollen CRUD ─────────────────────────────────────────
  async function addKnowledgeEntry() {
    if (!newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) return;
    setKnowledgeSavingId('new');
    try {
      const created = await maakAiKnowledge({ title: newKnowledgeTitle.trim(), content: newKnowledgeContent.trim() });
      setAiKnowledge(prev => [...prev, created]);
      setNewKnowledgeTitle('');
      setNewKnowledgeContent('');
    } catch (e: any) {
      alert(e?.message || 'Toevoegen mislukt');
    } finally {
      setKnowledgeSavingId(null);
    }
  }

  async function saveKnowledgeEntry(entry: AiKnowledgeEntry) {
    setKnowledgeSavingId(entry.id);
    try {
      const updated = await updateAiKnowledge(entry.id, {
        title: entry.title,
        content: entry.content,
        enabled: entry.enabled,
      });
      setAiKnowledge(prev => prev.map(k => k.id === entry.id ? updated : k));
    } catch (e: any) {
      alert(e?.message || 'Opslaan mislukt');
    } finally {
      setKnowledgeSavingId(null);
    }
  }

  async function removeKnowledgeEntry(id: number) {
    if (!window.confirm('Weet je zeker dat je dit protocol wilt verwijderen?')) return;
    try {
      await verwijderAiKnowledge(id);
      setAiKnowledge(prev => prev.filter(k => k.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Verwijderen mislukt');
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6" style={{ fontFamily: FONT }}>
        <div className="mb-4">
          <h1 className="text-xl font-bold">AI-instellingen</h1>
          <p className="text-xs text-gray-500">Configureer hoe de WhatsApp-bot reageert</p>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          Laden...
        </div>
      </div>
    );
  }

  if (!aiSettings) {
    return (
      <div className="p-6" style={{ fontFamily: FONT }}>
        <div className="mb-4">
          <h1 className="text-xl font-bold">AI-instellingen</h1>
        </div>
        <div style={{ padding: 20, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: 13 }}>
          {errorMsg || 'Instellingen konden niet worden geladen.'}
        </div>
      </div>
    );
  }

  // Kleur van de Opslaan-knop:
  //  - paars (#7E22CE) actief zodra er wijzigingen zijn
  //  - lichter / disabled-achtig als alles up-to-date is
  const saveBtnBg = saving ? '#A78BFA' : (isDirty ? NAVY : '#E9D5FF');
  const saveBtnColor = (isDirty || saving) ? '#fff' : '#A78BFA';
  const saveBtnCursor = saving ? 'wait' : (isDirty ? 'pointer' : 'default');

  return (
    <div className="p-6" style={{ fontFamily: FONT, paddingBottom: 80 }}>
      {/* ── Sticky top-bar: titel + Opslaan-knop + status ────────────────── */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(249, 250, 251, 0.95)', backdropFilter: 'blur(6px)',
          margin: '-24px -24px 18px', padding: '16px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1 className="text-xl font-bold" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Sparkles size={20} style={{ color: NAVY }} />
            AI-instellingen
          </h1>
          <p className="text-xs text-gray-500" style={{ margin: '2px 0 0' }}>
            Configureer hoe de WhatsApp-bot reageert
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isDirty && !saving && savedFlash !== 'saved' && (
            <span style={{ fontSize: 11, color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              <AlertCircle size={13} /> Niet opgeslagen wijzigingen
            </span>
          )}
          {savedFlash === 'saved' && (
            <span style={{ fontSize: 11, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <Check size={13} /> Opgeslagen
            </span>
          )}
          {savedFlash === 'error' && (
            <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
              {errorMsg || 'Opslaan mislukt'}
            </span>
          )}
          <button
            type="button"
            onClick={saveCore}
            disabled={!isDirty || saving}
            title={isDirty ? 'Wijzigingen opslaan (Ctrl/Cmd+S)' : 'Geen wijzigingen om op te slaan'}
            style={{
              background: saveBtnBg, color: saveBtnColor,
              border: 'none', borderRadius: 8,
              padding: '8px 18px', fontSize: 13, fontWeight: 600,
              cursor: saveBtnCursor, fontFamily: FONT,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <Save size={14} />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* ─── Sectie 1: Stijl & toon ──────────────────────────────────────── */}
      <Section
        storageKey="ai_section_stijl_collapsed"
        icon="🎯"
        title="Stijl & toon"
        subtitle="Hoe de bot klinkt — toon, voorbeeldberichten en algemene richtlijnen"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tone of voice</label>
            <textarea
              value={aiSettings.toneOfVoice}
              onChange={e => setAiSettings({ ...aiSettings, toneOfVoice: e.target.value })}
              rows={2}
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Bijv: Professioneel maar warm en persoonlijk..." />
            {renderAttachmentList('tone_of_voice')}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              ✍️ Voorbeeldberichten (eigen schrijfstijl)
            </label>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
              Plak hier 3-5 berichten die jij of je collega's eerder hebben gestuurd. De AI bootst deze stijl na — toon, lengte, emoji-gebruik, aanspreekvorm. Scheid berichten met een lege regel of "---".
            </div>
            <textarea
              value={aiSettings.voiceExamples}
              onChange={e => setAiSettings({ ...aiSettings, voiceExamples: e.target.value })}
              rows={6}
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder={`Hé! Bedankt voor je bericht 🙌 Ik kijk er even naar en kom zo bij je terug.\n\n---\n\nTop dat je beschikbaar bent! Ik zet je in de planning, je krijgt vanavond bevestiging.\n\n---\n\nGoedemorgen, hoe is je shift gisteren bevallen?`} />
            {renderAttachmentList('voice_examples')}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Algemene richtlijnen</label>
            <textarea
              value={aiSettings.guidelines}
              onChange={e => setAiSettings({ ...aiSettings, guidelines: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Bijv: Je bent een planningsassistent van EXTRA..." />
            {renderAttachmentList('guidelines')}
          </div>
        </div>
      </Section>

      {/* ─── Sectie 2: Protocollen ──────────────────────────────────────── */}
      <Section
        storageKey="ai_section_protocollen_collapsed"
        icon="📋"
        title="Protocollen"
        subtitle="Afmeldprotocol en kennisbank — concrete situaties die de AI moet kennen"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Afmeldprotocol</label>
            <textarea
              value={aiSettings.cancellationProtocol}
              onChange={e => setAiSettings({ ...aiSettings, cancellationProtocol: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Bijv: Als iemand zich wil afmelden voor een dienst..." />
            {renderAttachmentList('cancellation_protocol')}
          </div>

          <div style={{ paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>📚 Kennisbank / Protocollen</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>
              Voeg zoveel protocollen of context-stukken toe als je wilt. De AI gebruikt elk ingeschakeld item bij het genereren van antwoorden. Elke regel wordt los opgeslagen via de groene Opslaan-knop.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {aiKnowledge.map(entry => (
                <div key={entry.id} style={{
                  border: '1px solid #E5E7EB', borderRadius: 8, padding: 10,
                  background: entry.enabled ? '#fff' : '#F9FAFB', opacity: entry.enabled ? 1 : 0.6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <input type="checkbox" checked={entry.enabled}
                      onChange={e => setAiKnowledge(prev => prev.map(k => k.id === entry.id ? { ...k, enabled: e.target.checked } : k))}
                      title="Actief"
                      style={{ cursor: 'pointer' }} />
                    <input type="text" value={entry.title}
                      onChange={e => setAiKnowledge(prev => prev.map(k => k.id === entry.id ? { ...k, title: e.target.value } : k))}
                      placeholder="Titel (bijv. Afmeldprotocol)"
                      style={{ flex: 1, padding: '6px 8px', fontSize: 12, fontWeight: 600, border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: FONT, color: NAVY, boxSizing: 'border-box' }} />
                    <button onClick={() => saveKnowledgeEntry(entry)} disabled={knowledgeSavingId === entry.id}
                      style={{ background: knowledgeSavingId === entry.id ? '#E5E7EB' : '#10B981', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      title="Opslaan">
                      {knowledgeSavingId === entry.id ? '...' : 'Opslaan'}
                    </button>
                    <button onClick={() => removeKnowledgeEntry(entry.id)}
                      style={{ background: 'transparent', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                      title="Verwijderen">
                      ×
                    </button>
                  </div>
                  <textarea value={entry.content}
                    onChange={e => setAiKnowledge(prev => prev.map(k => k.id === entry.id ? { ...k, content: e.target.value } : k))}
                    rows={3} style={{ width: '100%', padding: '6px 8px', fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder="Inhoud van het protocol..." />
                  {renderAttachmentList('knowledge', entry.id)}
                </div>
              ))}

              {/* Nieuw protocol toevoegen */}
              <div style={{ border: '1px dashed #D1D5DB', borderRadius: 8, padding: 10, background: '#FAFBFC' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>➕ Nieuw protocol toevoegen</div>
                <input type="text" value={newKnowledgeTitle} onChange={e => setNewKnowledgeTitle(e.target.value)}
                  placeholder="Titel (bijv. Vakantieperiode)"
                  style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: FONT, marginBottom: 6, boxSizing: 'border-box' }} />
                <textarea value={newKnowledgeContent} onChange={e => setNewKnowledgeContent(e.target.value)}
                  rows={2} style={{ width: '100%', padding: '6px 8px', fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box', marginBottom: 6 }}
                  placeholder="Inhoud van het protocol..." />
                <button onClick={addKnowledgeEntry}
                  disabled={knowledgeSavingId === 'new' || !newKnowledgeTitle.trim() || !newKnowledgeContent.trim()}
                  style={{
                    background: (knowledgeSavingId === 'new' || !newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) ? '#E5E7EB' : NAVY,
                    color: (knowledgeSavingId === 'new' || !newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) ? '#9CA3AF' : '#fff',
                    border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                  {knowledgeSavingId === 'new' ? 'Toevoegen...' : 'Toevoegen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Sectie 3: Modus & context ──────────────────────────────────── */}
      <Section
        storageKey="ai_section_modus_collapsed"
        icon="⚙️"
        title="Modus & context"
        subtitle="Auto-antwoord aan/uit, intervalbeperking en eventuele extra context"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>🤖 Auto-antwoord modus</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>
              Wanneer ingeschakeld, beantwoordt de AI inkomende berichten zelfstandig zonder dat een planner hoeft te bevestigen.
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: aiSettings.autoReplyEnabled ? '#FEF3C7' : '#fff', border: `1px solid ${aiSettings.autoReplyEnabled ? '#F59E0B' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={aiSettings.autoReplyEnabled}
                onChange={e => setAiSettings({ ...aiSettings, autoReplyEnabled: e.target.checked })}
                style={{ cursor: 'pointer', width: 16, height: 16 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: aiSettings.autoReplyEnabled ? '#92400E' : NAVY }}>
                  {aiSettings.autoReplyEnabled ? '🟢 AAN — bot reageert automatisch' : '⚪ UIT — alleen suggesties tonen'}
                </div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>
                  Bij twijfel of gevoelige onderwerpen escaleert de AI automatisch naar de planner.
                </div>
              </div>
            </label>

            {aiSettings.autoReplyEnabled && (
              <div style={{ marginTop: 10, padding: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={aiSettings.autoReplyOnlyForKnown}
                    onChange={e => setAiSettings({ ...aiSettings, autoReplyOnlyForKnown: e.target.checked })}
                    style={{ cursor: 'pointer' }} />
                  <span>Alleen automatisch antwoorden bij <strong>bekende contacten</strong> (kandidaten/klanten in de database)</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#374151' }}>
                  <span>Minimaal interval tussen auto-antwoorden:</span>
                  <input type="number" min={0} max={3600}
                    value={aiSettings.autoReplyMinIntervalSec}
                    onChange={e => setAiSettings({ ...aiSettings, autoReplyMinIntervalSec: Math.max(0, Number(e.target.value) || 0) })}
                    style={{ width: 60, padding: '4px 6px', fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: FONT, boxSizing: 'border-box' }} />
                  <span>seconden</span>
                </div>
                <div style={{ fontSize: 10, color: '#92400E', background: '#FEF3C7', padding: '6px 8px', borderRadius: 4, border: '1px solid #FDE68A' }}>
                  ⚠ Let op: berichten worden direct verstuurd. Test dit eerst grondig en houd de eerste dagen het gesprek in de gaten.
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Extra context</label>
            <textarea
              value={aiSettings.extraContext}
              onChange={e => setAiSettings({ ...aiSettings, extraContext: e.target.value })}
              rows={2}
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Eventuele extra instructies of context voor de AI..." />
            {renderAttachmentList('extra_context')}
          </div>
        </div>
      </Section>

      <div style={{ marginTop: 4, padding: '10px 14px', background: '#F0F4FA', borderRadius: 8, fontSize: 11, color: '#6B7280' }}>
        Deze richtlijnen + kennisbank worden gebruikt door de AI om antwoordsuggesties te genereren bij inkomende WhatsApp-berichten. Met de auto-antwoord modus reageert de bot zelf zonder tussenkomst.
      </div>
    </div>
  );
}
