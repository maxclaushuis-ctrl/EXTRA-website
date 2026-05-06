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
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Users, Search, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Filter,
  MoreVertical, MessageCircle, UserPlus, Ban, RotateCcw, Plus, ChevronRight,
} from 'lucide-react';
import {
  haalContacten,
  haalContactenStats,
  updateContactOptIn,
  haalGroepen,
  maakGroep,
  updateGroep,
  verwijderGroep,
  haalGroepLeden,
  voegLedenToe,
  verwijderLid,
  type WaContact,
  type WaContactType,
  type WaOptInStatus,
  type WaContactenStats,
  type Group,
  type GroupMember,
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

  // Kebab-menu: welke rij heeft het menu open + of de "Toevoegen aan groep"-submenu open is.
  const [openKebab, setOpenKebab] = useState<string | null>(null); // "<type>:<id>"
  const [openSubmenu, setOpenSubmenu] = useState(false);
  const [groepen, setGroepen] = useState<Group[]>([]);
  const [groepenGeladen, setGroepenGeladen] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; tekst: string } | null>(null);
  const kebabContainerRef = useRef<HTMLDivElement | null>(null);

  // Groepen-modals
  const [toonNieuweGroepModal, setToonNieuweGroepModal] = useState(false);
  const [openGroepId, setOpenGroepId] = useState<number | null>(null);
  const [addMembersToGroupId, setAddMembersToGroupId] = useState<number | null>(null);

  // Klik buiten het menu sluit het. Eén globale listener i.p.v. per rij.
  useEffect(() => {
    if (!openKebab) return;
    const handler = (e: MouseEvent) => {
      if (kebabContainerRef.current && !kebabContainerRef.current.contains(e.target as Node)) {
        setOpenKebab(null);
        setOpenSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openKebab]);

  // Toast verdwijnt na 3s.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function herlaadGroepen() {
    try {
      const g = await haalGroepen();
      setGroepen(g);
      setGroepenGeladen(true);
    } catch (e: any) {
      setToast({ kind: 'err', tekst: 'Kon groepen niet laden: ' + (e?.message || 'onbekende fout') });
    }
  }
  async function laadGroepenIndienNodig() {
    if (!groepenGeladen) await herlaadGroepen();
  }
  // Groepen direct laden bij mount zodat de Groepen-sectie meteen gevuld is.
  useEffect(() => { herlaadGroepen(); /* eslint-disable-next-line */ }, []);

  function openWhatsAppGesprek(rij: WaContact) {
    if (!rij.phone) {
      setToast({ kind: 'err', tekst: 'Geen telefoonnummer bekend voor dit contact.' });
      return;
    }
    // Deeplink naar WhatsApp-tab. DashboardMockup luistert op dit event en
    // schakelt naar tab 'whatsapp'. WhatsAppBeheer leest de phone uit
    // sessionStorage en selecteert (of maakt) het gesprek.
    try {
      sessionStorage.setItem('extra_open_wa_phone', rij.phone);
      sessionStorage.setItem('extra_open_wa_name',
        `${rij.firstName || ''} ${rij.lastName || ''}`.trim() || rij.phone);
    } catch {}
    window.dispatchEvent(new CustomEvent('extra:switch-tab', { detail: { tab: 'whatsapp' } }));
    setOpenKebab(null);
    setOpenSubmenu(false);
  }

  async function voegToeAanGroep(rij: WaContact, groep: Group) {
    if (!rij.phone) {
      setToast({ kind: 'err', tekst: 'Geen telefoonnummer bekend voor dit contact.' });
      return;
    }
    try {
      const r = await voegLedenToe(groep.id, [{
        phoneNumber: rij.phone,
        displayName: `${rij.firstName || ''} ${rij.lastName || ''}`.trim() || rij.phone,
        firstName: rij.firstName || undefined,
        lastName: rij.lastName || undefined,
      }]);
      if (r.added > 0) {
        setToast({ kind: 'ok', tekst: `Toegevoegd aan "${groep.name}".` });
      } else {
        setToast({ kind: 'ok', tekst: `Zat al in "${groep.name}".` });
      }
    } catch (e: any) {
      setToast({ kind: 'err', tekst: e?.message || 'Toevoegen mislukt' });
    } finally {
      setOpenKebab(null);
      setOpenSubmenu(false);
    }
  }

  async function nieuweGroepEnVoegToe(rij: WaContact) {
    const naam = window.prompt('Naam van de nieuwe groep:', '');
    if (!naam || !naam.trim()) return;
    try {
      const nieuwe = await maakGroep(naam.trim());
      // Lijst verversen zodat de nieuwe groep verschijnt.
      const g = await haalGroepen();
      setGroepen(g);
      await voegToeAanGroep(rij, nieuwe);
    } catch (e: any) {
      setToast({ kind: 'err', tekst: e?.message || 'Aanmaken mislukt' });
    }
  }

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

      {/* Groepen-sectie — horizontaal scrollbare rij van groep-kaartjes. */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#111827' }}>Groepen</h2>
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              {groepen.length} {groepen.length === 1 ? 'groep' : 'groepen'}
            </span>
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'thin',
        }}>
          {groepen.map(g => (
            <GroepKaartje key={g.id} groep={g} onOpen={() => setOpenGroepId(g.id)} />
          ))}
          <button
            onClick={() => setToonNieuweGroepModal(true)}
            style={{
              flex: '0 0 auto', minWidth: 200, height: 76, borderRadius: 10,
              border: `1.5px dashed ${NAVY}`, background: '#FAF5FF',
              cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600,
              color: NAVY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Plus size={16} /> Nieuwe groep
          </button>
        </div>
      </div>

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
                  <th style={{ ...th, textAlign: 'right', width: 56 }}></th>
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
                      <td style={{ ...td, textAlign: 'right', width: 56, position: 'relative' }}>
                        <div ref={openKebab === sleutel ? kebabContainerRef : undefined}
                             style={{ display: 'inline-block', position: 'relative' }}>
                          <button
                            disabled={isBezig}
                            onClick={(e) => {
                              e.stopPropagation();
                              const open = openKebab === sleutel;
                              setOpenKebab(open ? null : sleutel);
                              setOpenSubmenu(false);
                              if (!open) laadGroepenIndienNodig();
                            }}
                            title="Acties"
                            style={{
                              padding: 6, borderRadius: 6, border: '1px solid transparent',
                              background: openKebab === sleutel ? '#F3F4F6' : 'transparent',
                              cursor: isBezig ? 'wait' : 'pointer', color: '#6B7280',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openKebab === sleutel && (
                            <div style={{
                              position: 'absolute', right: 0, top: '100%', marginTop: 4,
                              minWidth: 220, background: '#fff', border: '1px solid #E5E7EB',
                              borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                              zIndex: 30, overflow: 'visible', fontFamily: FONT, fontSize: 13,
                              textAlign: 'left',
                            }}>
                              <KebabItem
                                icon={<MessageCircle size={14} />}
                                label="WhatsApp openen"
                                onClick={() => openWhatsAppGesprek(i)}
                                disabled={!i.phone}
                              />
                              <div
                                onMouseEnter={() => { setOpenSubmenu(true); laadGroepenIndienNodig(); }}
                                onMouseLeave={() => setOpenSubmenu(false)}
                                style={{ position: 'relative' }}
                              >
                                <KebabItem
                                  icon={<UserPlus size={14} />}
                                  label="Toevoegen aan groep"
                                  trailing={<ChevronRight size={14} color="#9CA3AF" />}
                                  onClick={() => { setOpenSubmenu(s => !s); laadGroepenIndienNodig(); }}
                                  disabled={!i.phone}
                                />
                                {openSubmenu && (
                                  <div style={{
                                    position: 'absolute', right: '100%', top: 0, marginRight: 4,
                                    minWidth: 220, maxHeight: 280, overflowY: 'auto',
                                    background: '#fff', border: '1px solid #E5E7EB',
                                    borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                    padding: '4px 0',
                                  }}>
                                    {!groepenGeladen ? (
                                      <div style={{ padding: '8px 12px', color: '#6B7280', fontSize: 12 }}>Laden…</div>
                                    ) : groepen.length === 0 ? (
                                      <div style={{ padding: '8px 12px', color: '#6B7280', fontSize: 12 }}>
                                        Nog geen groepen.
                                      </div>
                                    ) : (
                                      groepen.map(g => (
                                        <KebabItem
                                          key={g.id}
                                          label={g.name}
                                          trailing={<span style={{ fontSize: 11, color: '#9CA3AF' }}>{g.memberCount}</span>}
                                          onClick={() => voegToeAanGroep(i, g)}
                                        />
                                      ))
                                    )}
                                    <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 4, paddingTop: 4 }}>
                                      <KebabItem
                                        icon={<Plus size={14} />}
                                        label="Nieuwe groep…"
                                        onClick={() => nieuweGroepEnVoegToe(i)}
                                        accent
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 4, paddingTop: 4 }}>
                                {i.whatsappOptInStatus === 'opt_out' ? (
                                  <KebabItem
                                    icon={<RotateCcw size={14} />}
                                    label="Opt-out ongedaan maken"
                                    onClick={() => { setOpenKebab(null); setOpenSubmenu(false); wijzigOptIn(i, 'actief'); }}
                                  />
                                ) : (
                                  <KebabItem
                                    icon={<Ban size={14} />}
                                    label="Opt-out instellen"
                                    onClick={() => { setOpenKebab(null); setOpenSubmenu(false); wijzigOptIn(i, 'opt_out'); }}
                                    danger
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {toonNieuweGroepModal && (
        <NieuweGroepModal
          onClose={() => setToonNieuweGroepModal(false)}
          onCreated={async (g) => {
            setToonNieuweGroepModal(false);
            await herlaadGroepen();
            setOpenGroepId(g.id);
            setToast({ kind: 'ok', tekst: `Groep "${g.name}" aangemaakt.` });
          }}
          onError={(msg) => setToast({ kind: 'err', tekst: msg })}
        />
      )}

      {openGroepId !== null && (
        <GroepDetailModal
          groep={groepen.find(g => g.id === openGroepId) || null}
          alleContacten={items}
          onClose={() => setOpenGroepId(null)}
          onChanged={async () => { await herlaadGroepen(); }}
          onDeleted={async () => {
            const naam = groepen.find(g => g.id === openGroepId)?.name || 'Groep';
            setOpenGroepId(null);
            await herlaadGroepen();
            setToast({ kind: 'ok', tekst: `Groep "${naam}" verwijderd.` });
          }}
          onAddMembersClick={() => setAddMembersToGroupId(openGroepId)}
          onError={(msg) => setToast({ kind: 'err', tekst: msg })}
        />
      )}

      {addMembersToGroupId !== null && (
        <LidToevoegenModal
          groep={groepen.find(g => g.id === addMembersToGroupId) || null}
          alleContacten={items}
          onClose={() => setAddMembersToGroupId(null)}
          onAdded={async (n) => {
            setAddMembersToGroupId(null);
            await herlaadGroepen();
            setToast({ kind: 'ok', tekst: `${n} ${n === 1 ? 'lid' : 'leden'} toegevoegd.` });
          }}
          onError={(msg) => setToast({ kind: 'err', tekst: msg })}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          padding: '10px 14px', borderRadius: 8,
          background: toast.kind === 'ok' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${toast.kind === 'ok' ? '#A7F3D0' : '#FCA5A5'}`,
          color: toast.kind === 'ok' ? '#065F46' : '#991B1B',
          fontSize: 13, fontFamily: FONT, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', maxWidth: 360,
        }}>
          {toast.tekst}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Groepen UI ──────────────────────────────────────────────────────────────

function GroepKaartje({ groep, onOpen }: { groep: Group; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      style={{
        flex: '0 0 auto', minWidth: 200, height: 76, padding: '10px 12px',
        borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff',
        cursor: 'pointer', fontFamily: FONT, textAlign: 'left',
        position: 'relative', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = NAVY; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontSize: 13, fontWeight: 600, color: '#111827',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
        }}>{groep.name}</span>
        <span
          title="Komt in volgende fase"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 6, color: '#D1D5DB',
            cursor: 'not-allowed',
          }}
        >
          <MessageCircle size={14} />
        </span>
      </div>
      <span style={{ fontSize: 11, color: '#6B7280' }}>
        {groep.memberCount} {groep.memberCount === 1 ? 'lid' : 'leden'}
      </span>
    </button>
  );
}

function NieuweGroepModal({ onClose, onCreated, onError }: {
  onClose: () => void;
  onCreated: (g: Group) => void;
  onError: (msg: string) => void;
}) {
  const [naam, setNaam] = useState('');
  const [omschrijving, setOmschrijving] = useState('');
  const [bezig, setBezig] = useState(false);

  async function aanmaken() {
    if (!naam.trim()) return;
    setBezig(true);
    try {
      const g = await maakGroep(naam.trim(), omschrijving.trim() || undefined);
      onCreated(g);
    } catch (e: any) {
      onError(e?.message || 'Aanmaken mislukt');
    } finally {
      setBezig(false);
    }
  }

  return (
    <ModalShell onClose={onClose} titel="Nieuwe groep">
      <Veld label="Naam *">
        <input
          autoFocus value={naam} onChange={e => setNaam(e.target.value)}
          placeholder="bijv. Bediening Amsterdam"
          style={inputStyle}
        />
      </Veld>
      <Veld label="Beschrijving (optioneel)">
        <textarea
          value={omschrijving} onChange={e => setOmschrijving(e.target.value)}
          rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: FONT }}
        />
      </Veld>
      <div style={modalActions}>
        <button onClick={onClose} style={btnGhost}>Annuleren</button>
        <button onClick={aanmaken} disabled={!naam.trim() || bezig} style={btnPrimary(!naam.trim() || bezig)}>
          {bezig ? 'Aanmaken…' : 'Aanmaken'}
        </button>
      </div>
    </ModalShell>
  );
}

function GroepDetailModal({ groep, alleContacten, onClose, onChanged, onDeleted, onAddMembersClick, onError }: {
  groep: Group | null;
  alleContacten: WaContact[];
  onClose: () => void;
  onChanged: () => Promise<void>;
  onDeleted: () => Promise<void>;
  onAddMembersClick: () => void;
  onError: (msg: string) => void;
}) {
  const [leden, setLeden] = useState<GroupMember[] | null>(null);
  const [naam, setNaam] = useState('');
  const [omschrijving, setOmschrijving] = useState('');
  const [opslaanBezig, setOpslaanBezig] = useState(false);
  const [verwijderBezig, setVerwijderBezig] = useState<string | null>(null);

  useEffect(() => {
    if (!groep) return;
    setNaam(groep.name);
    setOmschrijving(groep.description || '');
    haalGroepLeden(groep.id).then(setLeden).catch(e => onError(e?.message || 'Kon leden niet laden'));
  }, [groep?.id]);

  if (!groep) return null;

  const isVeranderd = naam.trim() !== groep.name || (omschrijving || '') !== (groep.description || '');

  async function herlaadLeden() {
    if (!groep) return;
    try { setLeden(await haalGroepLeden(groep.id)); } catch {}
  }

  async function opslaan() {
    if (!groep || !naam.trim()) return;
    setOpslaanBezig(true);
    try {
      await updateGroep(groep.id, naam.trim(), omschrijving.trim() || undefined);
      await onChanged();
    } catch (e: any) {
      onError(e?.message || 'Opslaan mislukt');
    } finally {
      setOpslaanBezig(false);
    }
  }

  async function verwijderen() {
    if (!groep) return;
    if (!window.confirm(`Groep "${groep.name}" definitief verwijderen? Leden worden uit de groep gehaald (contacten zelf blijven bestaan).`)) return;
    try {
      await verwijderGroep(groep.id);
      await onDeleted();
    } catch (e: any) {
      onError(e?.message || 'Verwijderen mislukt');
    }
  }

  async function lidVerwijderen(phone: string) {
    if (!groep) return;
    setVerwijderBezig(phone);
    try {
      await verwijderLid(groep.id, phone);
      await herlaadLeden();
      await onChanged();
    } catch (e: any) {
      onError(e?.message || 'Lid verwijderen mislukt');
    } finally {
      setVerwijderBezig(null);
    }
  }

  return (
    <ModalShell onClose={onClose} titel={`Groep: ${groep.name}`} breed>
      <Veld label="Groepsnaam">
        <input value={naam} onChange={e => setNaam(e.target.value)} style={inputStyle} />
      </Veld>
      <Veld label="Beschrijving">
        <textarea value={omschrijving} onChange={e => setOmschrijving(e.target.value)} rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: FONT }} />
      </Veld>
      {isVeranderd && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={opslaan} disabled={opslaanBezig || !naam.trim()} style={btnPrimary(opslaanBezig || !naam.trim())}>
            {opslaanBezig ? 'Opslaan…' : 'Wijzigingen opslaan'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Leden ({leden?.length ?? '…'})
        </div>
        <button onClick={onAddMembersClick} style={btnPrimary(false)}>
          <Plus size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> Lid toevoegen
        </button>
      </div>

      <div style={{
        border: '1px solid #E5E7EB', borderRadius: 8, maxHeight: 320, overflowY: 'auto', background: '#fff',
      }}>
        {leden === null ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>Laden…</div>
        ) : leden.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
            Nog geen leden in deze groep.
          </div>
        ) : (
          leden.map(l => {
            const koppel = alleContacten.find(c => (c.phone || '').replace(/\D/g, '') === (l.phoneNumber || '').replace(/\D/g, ''));
            return (
              <div key={l.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderTop: '1px solid #F3F4F6', fontSize: 13,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.displayName || `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.phoneNumber}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'ui-monospace, monospace' }}>
                    {l.phoneNumber}{koppel?.contactType ? ` · ${TYPE_LABEL[koppel.contactType]}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => lidVerwijderen(l.phoneNumber)}
                  disabled={verwijderBezig === l.phoneNumber}
                  title="Verwijder uit groep"
                  style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: '#9CA3AF', padding: 6, borderRadius: 6,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2'; (e.currentTarget as HTMLButtonElement).style.color = '#B91C1C'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; }}
                >
                  <XCircle size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={verwijderen} style={{
          padding: '8px 12px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2',
          color: '#B91C1C', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
        }}>
          Groep verwijderen
        </button>
        <button onClick={onClose} style={btnGhost}>Sluiten</button>
      </div>
    </ModalShell>
  );
}

function LidToevoegenModal({ groep, alleContacten, onClose, onAdded, onError }: {
  groep: Group | null;
  alleContacten: WaContact[];
  onClose: () => void;
  onAdded: (n: number) => void;
  onError: (msg: string) => void;
}) {
  const [zoek, setZoek] = useState('');
  const [bestaandeLeden, setBestaandeLeden] = useState<Set<string>>(new Set());
  const [geselecteerd, setGeselecteerd] = useState<Set<number>>(new Set()); // contactId
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (!groep) return;
    haalGroepLeden(groep.id).then(leden => {
      setBestaandeLeden(new Set(leden.map(l => (l.phoneNumber || '').replace(/\D/g, ''))));
    }).catch(() => {});
  }, [groep?.id]);

  if (!groep) return null;

  // Alleen contacten met telefoon EN niet al in de groep EN actief opt-in.
  const z = zoek.trim().toLowerCase();
  const beschikbaar = alleContacten.filter(c => {
    if (!c.phone) return false;
    if (c.whatsappOptInStatus !== 'actief') return false;
    if (bestaandeLeden.has(c.phone.replace(/\D/g, ''))) return false;
    if (z) {
      const naam = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      if (!naam.includes(z) && !(c.phone || '').includes(z) && !(c.email || '').toLowerCase().includes(z)) return false;
    }
    return true;
  });

  function toggle(c: WaContact) {
    setGeselecteerd(prev => {
      const n = new Set(prev);
      const key = c.contactId * 10 + (c.contactType === 'sollicitant' ? 1 : c.contactType === 'kandidaat' ? 2 : 3);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  }
  function isGeselecteerd(c: WaContact) {
    const key = c.contactId * 10 + (c.contactType === 'sollicitant' ? 1 : c.contactType === 'kandidaat' ? 2 : 3);
    return geselecteerd.has(key);
  }

  async function toevoegen() {
    if (!groep) return;
    const teVoegen = beschikbaar.filter(isGeselecteerd);
    if (teVoegen.length === 0) return;
    setBezig(true);
    try {
      const r = await voegLedenToe(groep.id, teVoegen.map(c => ({
        phoneNumber: c.phone!,
        displayName: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.phone!,
        firstName: c.firstName || undefined,
        lastName: c.lastName || undefined,
      })));
      onAdded(r.added);
    } catch (e: any) {
      onError(e?.message || 'Toevoegen mislukt');
    } finally {
      setBezig(false);
    }
  }

  return (
    <ModalShell onClose={onClose} titel={`Leden toevoegen aan: ${groep.name}`} breed>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek op naam, telefoon of e-mail…"
               style={{ ...inputStyle, paddingLeft: 30 }} />
      </div>
      <div style={{
        border: '1px solid #E5E7EB', borderRadius: 8, maxHeight: 360, overflowY: 'auto',
      }}>
        {beschikbaar.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
            Geen contacten gevonden. Alleen actieve contacten met telefoonnummer kunnen toegevoegd worden.
          </div>
        ) : (
          beschikbaar.slice(0, 200).map(c => (
            <label key={`${c.contactType}:${c.contactId}`} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              borderTop: '1px solid #F3F4F6', cursor: 'pointer', fontSize: 13,
            }}>
              <input type="checkbox" checked={isGeselecteerd(c)} onChange={() => toggle(c)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.firstName || ''} {c.lastName || ''}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>
                  {TYPE_LABEL[c.contactType]} · <span style={{ fontFamily: 'ui-monospace, monospace' }}>{c.phone}</span>
                </div>
              </div>
            </label>
          ))
        )}
      </div>
      <div style={{ ...modalActions, justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#6B7280' }}>{geselecteerd.size} geselecteerd</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={btnGhost}>Annuleren</button>
          <button onClick={toevoegen} disabled={geselecteerd.size === 0 || bezig} style={btnPrimary(geselecteerd.size === 0 || bezig)}>
            {bezig ? 'Toevoegen…' : `Toevoegen (${geselecteerd.size})`}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({ titel, breed, children, onClose }: {
  titel: string; breed?: boolean; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', zIndex: 80,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: FONT,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: breed ? 640 : 460,
        maxHeight: '90vh', overflowY: 'auto', padding: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111827' }}>{titel}</h2>
          <button onClick={onClose} style={{
            border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', padding: 4,
          }}><XCircle size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Veld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB',
  fontSize: 13, fontFamily: FONT, background: '#fff', boxSizing: 'border-box',
};
const modalActions: React.CSSProperties = {
  display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16,
};
const btnGhost: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
  fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: FONT,
};
const btnPrimary = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 14px', borderRadius: 8, border: 'none',
  background: disabled ? '#D1D5DB' : NAVY, color: '#fff',
  fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: FONT,
});

function KebabItem({ icon, label, trailing, onClick, disabled, danger, accent }: {
  icon?: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', background: 'transparent', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#9CA3AF' : danger ? '#B91C1C' : accent ? NAVY : '#374151',
        fontFamily: FONT, fontSize: 13, fontWeight: 500, textAlign: 'left',
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {icon && <span style={{ display: 'inline-flex', color: 'inherit' }}>{icon}</span>}
      <span style={{ flex: 1 }}>{label}</span>
      {trailing}
    </button>
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
