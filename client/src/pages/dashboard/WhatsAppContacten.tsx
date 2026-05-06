/**
 * WhatsApp Contacten — Fase 1.
 *
 * Toont alle sollicitanten, kandidaten en medewerkers in één overzicht met
 * hun WhatsApp opt-in-status. Planners kunnen handmatig een persoon op
 * "afgemeld" of "actief" zetten en zien direct de tellers per categorie.
 *
 * STOP-detectie en Meta-blokkades worden 100% achter de schermen door de
 * backend afgehandeld — dit scherm visualiseert de huidige status en biedt
 * een handmatige override-knop.
 */
import { useEffect, useMemo, useState } from 'react';
import { Users, Search, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Filter } from 'lucide-react';
import {
  haalContacten,
  haalContactenStats,
  updateContactOptIn,
  type WaContact,
  type WaContactType,
  type WaOptInStatus,
  type WaContactenStats,
} from '../../api/whatsappClient';

const NAVY = '#7E22CE';
const FONT = "'Poppins', system-ui, -apple-system, sans-serif";

const TYPE_LABEL: Record<WaContactType, string> = {
  sollicitant: 'Sollicitant',
  kandidaat:   'Kandidaat',
  medewerker:  'Medewerker',
};

const TYPE_KLEUR: Record<WaContactType, { bg: string; fg: string }> = {
  sollicitant: { bg: '#EFF6FF', fg: '#1D4ED8' },
  kandidaat:   { bg: '#ECFEFF', fg: '#0E7490' },
  medewerker:  { bg: '#F3E8FF', fg: '#7E22CE' },
};

const OPTIN_LABEL: Record<WaOptInStatus, string> = {
  actief:           'Actief',
  opt_out:          'Afgemeld',
  verzending_faalt: 'Verzending faalt',
};

const OPTIN_KLEUR: Record<WaOptInStatus, { bg: string; fg: string; icon: typeof CheckCircle2 }> = {
  actief:           { bg: '#DCFCE7', fg: '#166534', icon: CheckCircle2 },
  opt_out:          { bg: '#FEE2E2', fg: '#991B1B', icon: XCircle },
  verzending_faalt: { bg: '#FEF3C7', fg: '#92400E', icon: AlertTriangle },
};

// Sollicitant-functies komen uit de candidate_function-enum (lowercase tokens),
// medewerker-functies zijn vrije tekst maar in de praktijk ook deze waarden.
// Via deze map maken we het leesbaar (en consistent) in de tabel.
const FUNCTIE_LABEL: Record<string, string> = {
  housekeeping:     'Housekeeping',
  horecamedewerker: 'Bediening',
  bediening:        'Bediening',
  chef:             'Chef',
  frontoffice:      'Front-office',
  'front-office':   'Front-office',
  logistiek:        'Logistiek',
  orderpicker:      'Logistiek',
};

function functieLabel(raw: string | null): string {
  if (!raw) return '—';
  const key = raw.trim().toLowerCase();
  return FUNCTIE_LABEL[key] || raw;
}

function StatBlok({ titel, totaal, actief, optOut, faalt }: {
  titel: string; totaal: number; actief: number; optOut: number; faalt: number;
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 14, flex: 1, minWidth: 180,
    }}>
      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>{titel}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: NAVY, lineHeight: 1 }}>{totaal}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#166534' }}>● {actief} actief</span>
        <span style={{ fontSize: 11, color: '#991B1B' }}>● {optOut} afgemeld</span>
        {faalt > 0 && <span style={{ fontSize: 11, color: '#92400E' }}>● {faalt} faalt</span>}
      </div>
    </div>
  );
}

function OptInBadge({ status }: { status: WaOptInStatus }) {
  const s = OPTIN_KLEUR[status];
  const Icon = s.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.fg,
    }}>
      <Icon size={11} />
      {OPTIN_LABEL[status]}
    </span>
  );
}

function TypeBadge({ type }: { type: WaContactType }) {
  const c = TYPE_KLEUR[type];
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.fg,
    }}>
      {TYPE_LABEL[type]}
    </span>
  );
}

export default function WhatsAppContacten() {
  const [items, setItems] = useState<WaContact[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<WaContactenStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'alle' | WaContactType>('alle');
  const [filterOpt, setFilterOpt] = useState<'alle' | WaOptInStatus>('alle');
  const [filterLang, setFilterLang] = useState('');
  const [filterFunctie, setFilterFunctie] = useState('');
  const [zoek, setZoek] = useState('');
  const [zoekDebounced, setZoekDebounced] = useState('');
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [bezig, setBezig] = useState<string | null>(null); // "<type>:<id>" tijdens opt-in update

  // Debounce zoek-input
  useEffect(() => {
    const t = setTimeout(() => setZoekDebounced(zoek.trim()), 300);
    return () => clearTimeout(t);
  }, [zoek]);

  async function laad() {
    setLoading(true);
    setFoutmelding(null);
    try {
      const [lijst, st] = await Promise.all([
        haalContacten({
          type: filterType,
          opt_in: filterOpt,
          language: filterLang || undefined,
          q: zoekDebounced || undefined,
          pageSize: 500,
        }),
        haalContactenStats(),
      ]);
      setItems(lijst.items);
      setTotal(lijst.total);
      setStats(st);
    } catch (e: any) {
      setFoutmelding(e?.message || 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { laad(); /* eslint-disable-next-line */ }, [filterType, filterOpt, filterLang, zoekDebounced]);

  // Talen-opties op basis van data
  const talenOpties = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.language) set.add(i.language); });
    return Array.from(set).sort();
  }, [items]);

  // Functie-opties op basis van data — toon de leesbare labels en bewaar
  // de genormaliseerde sleutel zodat het filter robuust blijft als de
  // ruwe schrijfwijze tussen sollicitanten en medewerkers verschilt.
  const functieOpties = useMemo(() => {
    const map = new Map<string, string>(); // key (lowercase) → label
    items.forEach(i => {
      if (!i.functie) return;
      const key = i.functie.trim().toLowerCase();
      if (!map.has(key)) map.set(key, functieLabel(i.functie));
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  // Functie-filter wordt cliënt-side toegepast (vergelijkbaar met taal),
  // omdat de bron-velden op verschillende tabellen staan.
  const zichtbareItems = useMemo(() => {
    if (!filterFunctie) return items;
    const fk = filterFunctie.toLowerCase();
    return items.filter(i => (i.functie || '').trim().toLowerCase() === fk);
  }, [items, filterFunctie]);

  async function wijzigOptIn(rij: WaContact, nieuw: WaOptInStatus) {
    const huidigeStatus = rij.whatsappOptInStatus;
    if (nieuw === huidigeStatus) return;

    let reden = '';
    if (nieuw === 'opt_out') {
      const ingevoerd = window.prompt(
        `Markeer ${rij.firstName || ''} ${rij.lastName || ''} als afgemeld. Optionele reden:`,
        '',
      );
      if (ingevoerd === null) return; // geannuleerd
      reden = ingevoerd.trim();
    } else if (nieuw === 'actief' && huidigeStatus === 'opt_out') {
      const ok = window.confirm(
        `${rij.firstName || ''} ${rij.lastName || ''} weer activeren voor WhatsApp-berichten?`,
      );
      if (!ok) return;
      reden = 'Handmatig heractiveerd';
    }

    const sleutel = `${rij.contactType}:${rij.contactId}`;
    setBezig(sleutel);
    try {
      await updateContactOptIn(rij.contactType, rij.contactId, nieuw, reden);
      await laad();
    } catch (e: any) {
      setFoutmelding(e?.message || 'Wijziging mislukt');
    } finally {
      setBezig(null);
    }
  }

  return (
    <div style={{ fontFamily: FONT, padding: '4px 2px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111827' }}>
            <Users size={20} style={{ display: 'inline', verticalAlign: -3, marginRight: 8, color: NAVY }} />
            WhatsApp Contacten
          </h1>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>
            Sollicitanten, kandidaten en medewerkers met hun WhatsApp opt-in-status. STOP-detectie loopt automatisch op de achtergrond.
          </p>
        </div>
        <button onClick={laad} disabled={loading} style={{
          padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
          fontSize: 13, fontWeight: 600, color: '#374151', cursor: loading ? 'wait' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Vernieuwen
        </button>
      </div>

      {/* Statistiek-kaarten */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <StatBlok titel="Sollicitanten" totaal={stats.sollicitant.totaal}
                    actief={stats.sollicitant.actief} optOut={stats.sollicitant.opt_out} faalt={stats.sollicitant.verzending_faalt} />
          <StatBlok titel="Kandidaten" totaal={stats.kandidaat.totaal}
                    actief={stats.kandidaat.actief} optOut={stats.kandidaat.opt_out} faalt={stats.kandidaat.verzending_faalt} />
          <StatBlok titel="Medewerkers" totaal={stats.medewerker.totaal}
                    actief={stats.medewerker.actief} optOut={stats.medewerker.opt_out} faalt={stats.medewerker.verzending_faalt} />
        </div>
      )}

      {/* Filterbalk */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center',
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 12px',
      }}>
        <Filter size={14} style={{ color: '#6B7280' }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, fontFamily: FONT, background: '#fff' }}>
          <option value="alle">Alle types</option>
          <option value="sollicitant">Sollicitanten</option>
          <option value="kandidaat">Kandidaten</option>
          <option value="medewerker">Medewerkers</option>
        </select>

        <select value={filterOpt} onChange={e => setFilterOpt(e.target.value as any)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, fontFamily: FONT, background: '#fff' }}>
          <option value="alle">Alle statussen</option>
          <option value="actief">Actief</option>
          <option value="opt_out">Afgemeld</option>
          <option value="verzending_faalt">Verzending faalt</option>
        </select>

        <select value={filterLang} onChange={e => setFilterLang(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, fontFamily: FONT, background: '#fff' }}>
          <option value="">Alle talen</option>
          {talenOpties.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <select value={filterFunctie} onChange={e => setFilterFunctie(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, fontFamily: FONT, background: '#fff' }}>
          <option value="">Alle functies</option>
          {functieOpties.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>

        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek op naam, telefoon of e-mail…"
                 style={{
                   width: '100%', padding: '7px 10px 7px 30px', borderRadius: 8, border: '1px solid #E5E7EB',
                   fontSize: 12, fontFamily: FONT, background: '#fff',
                 }} />
        </div>

        <span style={{ fontSize: 12, color: '#6B7280' }}>
          {filterFunctie ? `${zichtbareItems.length} van ${total}` : `${total}`} resultaten
        </span>
      </div>

      {/* Foutmelding */}
      {foutmelding && (
        <div style={{
          background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 10,
          color: '#991B1B', fontSize: 12, marginBottom: 12,
        }}>
          {foutmelding}
        </div>
      )}

      {/* Lijst */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        {loading && zichtbareItems.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>Laden…</div>
        ) : zichtbareItems.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
            Geen contacten gevonden met deze filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: '#F9FAFB' }}>
                <tr style={{ textAlign: 'left' }}>
                  <th style={th}>Naam</th>
                  <th style={th}>Type</th>
                  <th style={th}>Functie</th>
                  <th style={th}>Telefoon</th>
                  <th style={th}>Taal</th>
                  <th style={th}>Status</th>
                  <th style={th}>Sinds</th>
                  <th style={th}>Reden</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actie</th>
                </tr>
              </thead>
              <tbody>
                {zichtbareItems.map((i) => {
                  const sleutel = `${i.contactType}:${i.contactId}`;
                  const isBezig = bezig === sleutel;
                  return (
                    <tr key={sleutel} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>
                          {i.firstName || ''} {i.lastName || ''}
                        </div>
                        {i.email && <div style={{ fontSize: 11, color: '#6B7280' }}>{i.email}</div>}
                      </td>
                      <td style={td}><TypeBadge type={i.contactType} /></td>
                      <td style={td}>
                        {i.functie
                          ? <span style={{
                              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: '#F3F4F6', color: '#374151',
                            }}>{functieLabel(i.functie)}</span>
                          : <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ ...td, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{i.phone || '—'}</td>
                      <td style={td}>{i.language || '—'}</td>
                      <td style={td}><OptInBadge status={i.whatsappOptInStatus} /></td>
                      <td style={{ ...td, fontSize: 11, color: '#6B7280' }}>
                        {i.whatsappOptInChangedAt
                          ? new Date(i.whatsappOptInChangedAt).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td style={{ ...td, fontSize: 11, color: '#6B7280', maxWidth: 220 }}>
                        <span title={i.whatsappOptInReason || ''} style={{
                          display: 'inline-block', maxWidth: 220, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle',
                        }}>{i.whatsappOptInReason || '—'}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        {i.whatsappOptInStatus === 'opt_out' ? (
                          <button disabled={isBezig} onClick={() => wijzigOptIn(i, 'actief')} style={btnSecondary(isBezig)}>
                            Heractiveren
                          </button>
                        ) : (
                          <button disabled={isBezig} onClick={() => wijzigOptIn(i, 'opt_out')} style={btnDanger(isBezig)}>
                            Afmelden
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '10px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.04em',
};
const td: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'middle' };

const btnSecondary = (disabled: boolean): React.CSSProperties => ({
  padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff',
  fontSize: 11, fontWeight: 600, color: '#374151', cursor: disabled ? 'wait' : 'pointer',
  fontFamily: FONT,
});

const btnDanger = (disabled: boolean): React.CSSProperties => ({
  padding: '5px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEE2E2',
  fontSize: 11, fontWeight: 600, color: '#991B1B', cursor: disabled ? 'wait' : 'pointer',
  fontFamily: FONT,
});
