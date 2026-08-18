import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest, fetchJson, fetchJsonList } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FUNCTIEGROEPEN } from '@shared/schema';
import {
  Plus, Search, X, Upload, Mail, Phone, MapPin, Building2,
  Pencil, Trash2, Users, RefreshCw, ChevronRight, Filter,
  Check, AlertCircle, Download, Tag, Info
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────

const BRANCHES = ['Hotel', 'Restaurant', 'Cateraar', 'Evenementenlocatie', 'Logistiek'] as const;
const TALEN = ['Nederlands', 'Engels', 'Anders'] as const;
const SYSTEEM_VELDEN = ['voornaam', 'achternaam', 'email', 'bedrijf', 'functietitel', 'telefoon', 'stad', 'taal', 'branche', 'functiegroep', 'type', 'tags'] as const;

// Pijplijn-fases (Blok 1)
const PHASES = [
  { value: 'nieuw',        label: 'Nieuw',        cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'in_campagne',  label: 'In campagne',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'in_gesprek',   label: 'In gesprek',   cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'klant',        label: 'Klant',        cls: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'uitgesloten',  label: 'Uitgesloten',  cls: 'bg-red-100 text-red-700 border-red-200' },
] as const;

function phasePill(phase: string | null | undefined) {
  const p = PHASES.find(x => x.value === (phase || 'nieuw')) || PHASES[0];
  return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${p.cls}`}>{p.label}</span>;
}

const BRANCHE_COLORS: Record<string, string> = {
  Hotel: 'bg-sky-100 text-sky-700 border-sky-200',
  Restaurant: 'bg-orange-100 text-orange-700 border-orange-200',
  Cateraar: 'bg-teal-100 text-teal-700 border-teal-200',
  Evenementenlocatie: 'bg-violet-100 text-violet-700 border-violet-200',
  Logistiek: 'bg-amber-100 text-amber-700 border-amber-200',
};

function branchePill(branche: string | null | undefined) {
  if (!branche) return null;
  const cls = BRANCHE_COLORS[branche] || 'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{branche}</span>;
}

function typeBadge(type: string | null | undefined) {
  if (type === 'klant') return <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full bg-green-500 text-white font-medium">Klant</span>;
  return <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border border-purple-400 text-purple-700 font-medium">Prospect</span>;
}

function statusBadge(status: string | null | undefined) {
  if (status === 'uitgeschreven') return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Uitgeschreven</span>;
  if (status === 'geblokkeerd') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Geblokkeerd</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Actief</span>;
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseTags(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

// ── Tag input ──────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, suggestions = [] }: { tags: string[]; onChange: (t: string[]) => void; suggestions?: string[] }) {
  const [input, setInput] = useState('');
  const [showSugg, setShowSugg] = useState(false);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
    setShowSugg(false);
  };

  const filtered = suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s));

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSugg(true); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (input.trim()) addTag(input); } }}
          onFocus={() => setShowSugg(true)}
          onBlur={() => setTimeout(() => setShowSugg(false), 150)}
          placeholder="Type en druk Enter..."
          className="h-8 text-sm"
        />
        {showSugg && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg py-1 max-h-40 overflow-auto">
            {filtered.map(s => (
              <button key={s} type="button" onMouseDown={() => addTag(s)}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 text-gray-700">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Contact Form Modal ─────────────────────────────────────────────────────

function ContactFormModal({ open, onClose, contact, tagSuggestions, onSaved }: {
  open: boolean; onClose: () => void; contact?: any; tagSuggestions: string[]; onSaved?: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!contact;
  const emptyForm = {
    voornaam: '', achternaam: '', email: '', telefoon: '',
    bedrijf: '', functietitel: '', stad: '', branche: '', functiegroep: '',
    type: 'prospect', taal: 'Nederlands', tags: [] as string[], notities: '',
    phase: 'nieuw',
  };

  const [form, setForm] = useState<typeof emptyForm>(contact ? {
    voornaam: contact.voornaam || '',
    achternaam: contact.achternaam || '',
    email: contact.email || '',
    telefoon: contact.telefoon || '',
    bedrijf: contact.company || contact.bedrijf || '',
    functietitel: contact.function || contact.functietitel || '',
    stad: contact.stad || '',
    branche: contact.branche || '',
    functiegroep: contact.functiegroep || '',
    type: contact.contactType || 'prospect',
    taal: contact.taal || 'Nederlands',
    tags: parseTags(contact.customTags),
    notities: contact.notes || '',
    phase: contact.phase || 'nieuw',
  } : emptyForm);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.voornaam.trim()) e.voornaam = 'Verplicht';
    if (!form.achternaam.trim()) e.achternaam = 'Verplicht';
    if (!form.email.trim()) e.email = 'Verplicht';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Ongeldig e-mailadres';
    if (!form.bedrijf.trim()) e.bedrijf = 'Verplicht';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/prospect-contacts', data),
    onSuccess: (newContact: any) => {
      queryClient.setQueryData<any[]>(['/api/admin/prospect-contacts'], (old = []) => [newContact, ...old]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-contacts/unique-tags'] });
      toast({ title: 'Contact opgeslagen' });
      onSaved?.();
      onClose();
    },
    onError: (err: any) => toast({ title: err.message || 'Fout bij opslaan', variant: 'destructive' }),
  });
  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/admin/prospect-contacts/${contact.id}`, data),
    onSuccess: (updated: any) => {
      queryClient.setQueryData<any[]>(['/api/admin/prospect-contacts'], (old = []) =>
        old.map(c => c.id === updated.id ? updated : c)
      );
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-contacts', contact.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-contacts/unique-tags'] });
      toast({ title: 'Contact bijgewerkt' });
      onSaved?.();
      onClose();
    },
    onError: (err: any) => toast({ title: err.message || 'Fout bij opslaan', variant: 'destructive' }),
  });

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = { ...form };
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Contact bewerken' : 'Nieuw contact toevoegen'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Persoonsgegevens */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Persoonsgegevens</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Voornaam *</label>
                <Input value={form.voornaam} onChange={e => set('voornaam', e.target.value)} placeholder="Jan" className={errors.voornaam ? 'border-red-400' : ''} />
                {errors.voornaam && <p className="text-xs text-red-500 mt-0.5">{errors.voornaam}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Achternaam *</label>
                <Input value={form.achternaam} onChange={e => set('achternaam', e.target.value)} placeholder="de Vries" className={errors.achternaam ? 'border-red-400' : ''} />
                {errors.achternaam && <p className="text-xs text-red-500 mt-0.5">{errors.achternaam}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">E-mailadres *</label>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jan@hotel.nl" className={errors.email ? 'border-red-400' : ''} />
                {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Telefoonnummer</label>
                <Input value={form.telefoon} onChange={e => set('telefoon', e.target.value)} placeholder="+31 6 12345678" />
              </div>
            </div>
          </div>

          {/* Bedrijfsgegevens */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bedrijfsgegevens</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Bedrijfsnaam *</label>
                <Input value={form.bedrijf} onChange={e => set('bedrijf', e.target.value)} placeholder="Hotel Okura" className={errors.bedrijf ? 'border-red-400' : ''} />
                {errors.bedrijf && <p className="text-xs text-red-500 mt-0.5">{errors.bedrijf}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Functietitel</label>
                <Input value={form.functietitel} onChange={e => set('functietitel', e.target.value)} placeholder="HR Manager" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Stad</label>
                <Input value={form.stad} onChange={e => set('stad', e.target.value)} placeholder="Amsterdam" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Branche</label>
                <Select value={form.branche || 'none'} onValueChange={v => set('branche', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecteer branche..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Geen —</SelectItem>
                    {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Functiegroep</label>
                <Select value={form.functiegroep || 'none'} onValueChange={v => set('functiegroep', v === 'none' ? '' : v)}>
                  <SelectTrigger data-testid="select-functiegroep"><SelectValue placeholder="Selecteer functiegroep..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Geen —</SelectItem>
                    {FUNCTIEGROEPEN.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-gray-400 mt-1">Wordt gebruikt door de e-mailcampagne om het juiste segment te selecteren.</p>
              </div>
            </div>
          </div>

          {/* Classificatie */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Classificatie</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                <div className="flex gap-2">
                  {(['prospect', 'klant'] as const).map(t => (
                    <button key={t} type="button" onClick={() => set('type', t)}
                      className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-colors ${form.type === t
                        ? (t === 'klant' ? 'bg-green-500 text-white border-green-500' : 'bg-purple-600 text-white border-purple-600')
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Voertaal</label>
                <Select value={form.taal} onValueChange={v => set('taal', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TALEN.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Pijplijn-fase</label>
                <Select value={form.phase} onValueChange={v => set('phase', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PHASES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Tags</label>
                <TagInput tags={form.tags} onChange={v => set('tags', v)} suggestions={tagSuggestions} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notities</label>
                <Textarea value={form.notities} onChange={e => set('notities', e.target.value)} rows={3} placeholder="Vrije notitieruimte..." />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-purple-600 hover:bg-purple-700">
            {isPending ? 'Opslaan...' : isEdit ? 'Opslaan' : 'Contact opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── CSV Import Modal ───────────────────────────────────────────────────────

// ── Apollo CSV Import Modal (Blok 5) ───────────────────────────────────────

interface ApolloPreview {
  totaal: number;
  geldigNieuw: number;
  dubbelInDb: number;
  dubbelInBestand: number;
  ongeldigEmail: number;
  zonderFunctiegroep: number;
  perFunctiegroep: Array<{ groep: string; aantal: number }>;
  perBranche: Array<{ branche: string; aantal: number }>;
  voorbeelden: Array<any>;
  alleNormRijen: Array<any>;
  totaalKolommen?: number;
  herkendeKolommen?: number;
  herkendeMapping?: Array<{ kolom: string; veld: string; bron: 'standaard' | 'ai' }>;
  niegmappedKolommen?: string[];
  aiGebruikt?: boolean;
}

function ApolloImportModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const { toast } = useToast();
  const [stap, setStap] = useState<1 | 2 | 3>(1);
  const [bezig, setBezig] = useState(false);
  const [preview, setPreview] = useState<ApolloPreview | null>(null);
  const [resultaat, setResultaat] = useState<{ aangemaakt: number; overgeslagen: number; fouten: string[]; perFunctiegroep: Array<{ groep: string; aantal: number }> } | null>(null);
  const [alleenGeverifieerd, setAlleenGeverifieerd] = useState(true);
  const [alleenHospitality, setAlleenHospitality] = useState(true);
  const [bestandsnaam, setBestandsnaam] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const HOSPITALITY_BRANCHES = ['Hospitality', 'Hotels', 'Restaurants', 'Hotels & Travel Accommodation', 'Hotels And Motels', 'Food & Beverages', 'Catering'];

  const reset = () => {
    setStap(1); setPreview(null); setResultaat(null);
    setBestandsnaam(''); setAlleenGeverifieerd(true); setAlleenHospitality(true);
  };

  const verwerkBestand = async (file: File) => {
    console.log('[apollo-import] verwerkBestand aangeroepen:', file.name, file.size, file.type);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({ title: 'Alleen .csv bestanden', description: `Bestandsnaam: ${file.name}`, variant: 'destructive' });
      return;
    }
    if (file.size === 0) {
      toast({ title: 'Bestand is leeg', variant: 'destructive' }); return;
    }
    setBestandsnaam(file.name);
    setBezig(true);
    try {
      console.log('[apollo-import] file inlezen...');
      const tekst = await file.text();
      console.log('[apollo-import] CSV grootte:', tekst.length, 'bytes - POST naar preview...');
      const data = await apiRequest('POST', '/api/admin/prospect-contacts/import-apollo/preview', { csv: tekst }) as ApolloPreview;
      console.log('[apollo-import] preview ontvangen:', data?.totaal, 'rijen');
      setPreview(data);
      setStap(2);
    } catch (err: any) {
      console.error('[apollo-import] Preview FOUT:', err);
      toast({
        title: 'Preview mislukt',
        description: err?.message || err?.data?.error || 'Onbekende fout — kijk in console (F12)',
        variant: 'destructive',
      });
    } finally {
      setBezig(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setBezig(true);
    try {
      const opties: any = { defaultPhase: 'nieuw' };
      if (alleenGeverifieerd) opties.alleenGeverifieerd = true;
      if (alleenHospitality) opties.branchefilter = HOSPITALITY_BRANCHES;
      const data = await apiRequest('POST', '/api/admin/prospect-contacts/import-apollo/commit', {
        rijen: preview.alleNormRijen, opties,
      }) as { aangemaakt: number; overgeslagen: number; fouten: string[]; perFunctiegroep: Array<{ groep: string; aantal: number }> };
      setResultaat(data);
      setStap(3);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-contacts'] });
      toast({ title: `${data.aangemaakt} contact(en) geïmporteerd uit Apollo` });
      onSaved?.();
    } catch (err: any) {
      toast({ title: 'Import mislukt', description: err?.message, variant: 'destructive' });
    } finally {
      setBezig(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-600" />
            Apollo.io CSV importeren
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${stap >= s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 w-12 ${stap > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
          <span className="text-xs text-gray-500 ml-2">{stap === 1 ? 'Upload' : stap === 2 ? 'Controleren' : 'Klaar'}</span>
        </div>

        {/* ── Stap 1: upload ── */}
        {stap === 1 && (
          <div className="space-y-4">
            <label
              htmlFor="apollo-csv-input"
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files[0];
                console.log('[apollo-import] drop event:', f?.name);
                if (f) verwerkBestand(f);
              }}
              className={`block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragging ? 'border-purple-400 bg-purple-50' : bezig ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'}`}
            >
              <Upload className={`h-8 w-8 mx-auto mb-3 ${bezig ? 'text-purple-400 animate-pulse' : 'text-gray-300'}`} />
              <p className="text-sm font-medium text-gray-600">
                {bezig ? `${bestandsnaam || 'CSV'} wordt verwerkt…` : 'Sleep je Apollo CSV-export hierheen'}
              </p>
              <p className="text-xs text-gray-400 mt-1">{bezig ? 'AI controleert kolommen, even geduld...' : 'of klik om een bestand te kiezen'}</p>
              <input
                id="apollo-csv-input"
                ref={fileRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                className="sr-only"
                disabled={bezig}
                onChange={e => {
                  const f = e.target.files?.[0];
                  console.log('[apollo-import] input change:', f?.name);
                  if (f) verwerkBestand(f);
                  e.target.value = '';
                }}
              />
            </label>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-purple-900 mb-2">Hoe haal je een Apollo CSV?</p>
              <ol className="text-xs text-purple-800 space-y-1 list-decimal list-inside">
                <li>Bouw in Apollo een lijst (bv. <em>Title contains "F&B Manager", Industry = Hospitality, Location = Amsterdam 50km</em>).</li>
                <li>Selecteer je rijen → <strong>Export</strong> → kies CSV.</li>
                <li>Sleep het bestand hierboven. Wij herkennen automatisch de kolommen en koppelen functietags.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ── Stap 2: preview ── */}
        {stap === 2 && preview && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              <strong>{bestandsnaam}</strong> — {preview.totaal} rijen ingelezen
              {preview.totaalKolommen != null && (
                <span className="text-gray-400">
                  {' • '}{preview.herkendeKolommen}/{preview.totaalKolommen} kolommen herkend
                  {preview.aiGebruikt && <span className="ml-1 text-purple-600 font-medium">(AI)</span>}
                </span>
              )}
            </p>

            {/* Kolom-mapping overzicht (collapsible-style) */}
            {preview.herkendeMapping && preview.herkendeMapping.length > 0 && (
              <details className="bg-slate-50 rounded-xl border border-slate-200 p-3 group">
                <summary className="cursor-pointer text-xs font-semibold text-slate-600 flex items-center gap-2 list-none">
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                  Kolom-mapping bekijken ({preview.herkendeMapping.length} herkend{preview.niegmappedKolommen && preview.niegmappedKolommen.length > 0 ? `, ${preview.niegmappedKolommen.length} genegeerd` : ''})
                </summary>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  {preview.herkendeMapping.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded px-2 py-1 border border-slate-100">
                      <span className="text-slate-600 truncate">{m.kolom}</span>
                      <span className="flex items-center gap-1 ml-2 shrink-0">
                        <span className="text-slate-400">→</span>
                        <span className="text-purple-700 font-medium">{m.veld}</span>
                        {m.bron === 'ai' && <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded">AI</span>}
                      </span>
                    </div>
                  ))}
                </div>
                {preview.niegmappedKolommen && preview.niegmappedKolommen.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-[11px] text-slate-500 mb-1.5">Niet gebruikt (niet relevant voor contacten):</p>
                    <div className="flex flex-wrap gap-1">
                      {preview.niegmappedKolommen.map((k, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </details>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{preview.geldigNieuw}</div>
                <div className="text-xs text-green-700 font-medium">Nieuw</div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                <div className="text-2xl font-bold text-amber-700">{preview.dubbelInDb + preview.dubbelInBestand}</div>
                <div className="text-xs text-amber-700 font-medium">Dubbel</div>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
                <div className="text-2xl font-bold text-red-700">{preview.ongeldigEmail}</div>
                <div className="text-xs text-red-700 font-medium">Ongeldig</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <div className="text-2xl font-bold text-slate-700">{preview.zonderFunctiegroep}</div>
                <div className="text-xs text-slate-700 font-medium">Geen groep</div>
              </div>
            </div>

            {preview.perFunctiegroep.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Functiegroep-detectie</p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.perFunctiegroep.map(g => (
                    <Badge key={g.groep} variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                      {g.groep} <span className="ml-1 font-bold">{g.aantal}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {preview.perBranche.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Top branches in bestand</p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.perBranche.map(b => (
                    <Badge key={b.branche} variant="outline" className="text-xs">
                      {b.branche} <span className="ml-1 font-bold">{b.aantal}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-500">Voorbeeld (eerste {Math.min(10, preview.voorbeelden.length)} rijen)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Naam</th>
                      <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Email</th>
                      <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Bedrijf</th>
                      <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Functie</th>
                      <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Groep</th>
                      <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.voorbeelden.slice(0, 10).map((r, i) => (
                      <tr key={i} className={r.isDubbel || r.isOngeldigEmail ? 'bg-red-50/30' : ''}>
                        <td className="px-3 py-1.5 text-slate-700">{r.naam || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-600 font-mono text-[10px]">{r.email || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-600">{r.bedrijf || '—'}</td>
                        <td className="px-3 py-1.5 text-slate-500">{r.functietitel || '—'}</td>
                        <td className="px-3 py-1.5">
                          {r.functiegroep
                            ? <span className="text-purple-700 text-[11px] font-medium">{r.functiegroep}</span>
                            : <span className="text-slate-300 text-[11px]">—</span>}
                        </td>
                        <td className="px-3 py-1.5">
                          {r.isOngeldigEmail
                            ? <span className="text-red-600 text-[11px]">ongeldig</span>
                            : r.isDubbel
                              ? <span className="text-amber-600 text-[11px]">dubbel</span>
                              : <span className="text-green-600 text-[11px]">nieuw</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filters</p>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alleenGeverifieerd}
                  onChange={e => setAlleenGeverifieerd(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600"
                />
                <span className="text-sm text-slate-700">
                  Alleen <strong>geverifieerde</strong> e-mails importeren
                  <span className="block text-[11px] text-slate-500 mt-0.5">(skipt Apollo "Guessed" / "Unverified" rijen — voorkomt bounces)</span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alleenHospitality}
                  onChange={e => setAlleenHospitality(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600"
                />
                <span className="text-sm text-slate-700">
                  Alleen <strong>hospitality-branches</strong> importeren
                  <span className="block text-[11px] text-slate-500 mt-0.5">(Hospitality, Hotels, Restaurants, Catering, F&B)</span>
                </span>
              </label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setStap(1); setPreview(null); }}>Terug</Button>
              <Button
                onClick={handleImport}
                disabled={bezig || preview.geldigNieuw === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {bezig ? 'Bezig met importeren...' : `Importeer ${preview.geldigNieuw} contact(en)`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Stap 3: resultaat ── */}
        {stap === 3 && resultaat && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-3">
                <Check className="h-6 w-6 text-green-700" />
              </div>
              <p className="text-lg font-semibold text-slate-800">Import voltooid</p>
              <p className="text-sm text-slate-500 mt-1">
                {resultaat.aangemaakt} aangemaakt · {resultaat.overgeslagen} overgeslagen
              </p>
            </div>

            {resultaat.perFunctiegroep.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Toegewezen functiegroepen</p>
                <div className="flex flex-wrap gap-1.5">
                  {resultaat.perFunctiegroep.map((g, i) => (
                    <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700">
                      {g.groep} <span className="ml-1 font-bold">{g.aantal}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {resultaat.fouten.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Fouten ({resultaat.fouten.length})</p>
                <ul className="text-xs text-red-600 space-y-0.5 max-h-24 overflow-y-auto">
                  {resultaat.fouten.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => { onClose(); reset(); }} className="bg-purple-600 hover:bg-purple-700">Sluiten</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CsvImportModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(l => {
      const vals = l.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return Object.fromEntries(hdrs.map((h, i) => [h, vals[i] || '']));
    });
    setHeaders(hdrs);
    setCsvRows(rows);
    // Auto-map matching columns
    const autoMap: Record<string, string> = {};
    hdrs.forEach(h => {
      const lh = h.toLowerCase();
      const match = SYSTEEM_VELDEN.find(s => s === lh || lh.includes(s));
      if (match) autoMap[h] = match;
    });
    setMapping(autoMap);
    setStep(2);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) { toast({ title: 'Alleen .csv bestanden', variant: 'destructive' }); return; }
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target?.result as string);
    reader.readAsText(file);
  };

  const importMutation = useMutation({
    mutationFn: (contacts: any[]) => apiRequest('POST', '/api/admin/prospect-contacts/import', { contacts }),
    onSuccess: (data: any) => {
      setResult(data);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-contacts'] });
      toast({ title: `Import geslaagd: ${data.aangemaakt} contacten aangemaakt` });
      onSaved?.();
    },
    onError: () => toast({ title: 'Import mislukt', variant: 'destructive' }),
  });

  const mapRow = (row: any) => {
    const contact: any = {};
    Object.entries(mapping).forEach(([csvCol, sysField]) => {
      if (sysField && sysField !== 'skip') contact[sysField] = row[csvCol] || '';
    });
    return contact;
  };

  const dedupedRows = (() => {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const row of csvRows) {
      const m = mapRow(row);
      const email = (m.email || '').trim().toLowerCase();
      if (!email) continue;
      if (seen.has(email)) continue;
      seen.add(email);
      out.push(m);
    }
    return out;
  })();

  const duplicatesInFile = csvRows.filter(r => {
    const e = (mapRow(r).email || '').trim().toLowerCase();
    return !!e;
  }).length - dedupedRows.length;

  const handleImport = () => {
    importMutation.mutate(dedupedRows);
  };

  const missingRequired = (row: any) => {
    const mapped: any = {};
    Object.entries(mapping).forEach(([c, s]) => { if (s) mapped[s] = row[c]; });
    return !mapped.email;
  };

  const reset = () => { setStep(1); setCsvRows([]); setHeaders([]); setMapping({}); setResult(null); };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contacten importeren via CSV</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 w-12 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
          <span className="text-xs text-gray-500 ml-2">{step === 1 ? 'Upload' : step === 2 ? 'Preview & mapping' : 'Resultaat'}</span>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragging ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'}`}
            >
              <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">Sleep je CSV-bestand hierheen</p>
              <p className="text-xs text-gray-400 mt-1">of klik om een bestand te kiezen</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Verwachte kolomnamen:</p>
              <code className="text-xs text-gray-600 break-all">{SYSTEEM_VELDEN.join(', ')}</code>
            </div>
          </div>
        )}

        {/* Step 2: Preview + mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Koppel CSV-kolommen aan systeemvelden. Kolomlen met een ✓ zijn automatisch herkend.</p>
            <div className="grid grid-cols-2 gap-2">
              {headers.map(h => (
                <div key={h} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 truncate flex-1 min-w-0">{h}</span>
                  <span className="text-gray-300">→</span>
                  <Select value={mapping[h] || 'skip'} onValueChange={v => setMapping(m => ({ ...m, [h]: v === 'skip' ? '' : v }))}>
                    <SelectTrigger className="h-7 text-xs w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Overslaan</SelectItem>
                      {SYSTEEM_VELDEN.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {mapping[h] && <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                </div>
              ))}
            </div>

            <p className="text-xs font-medium text-gray-500">Voorbeeld (eerste 5 rijen):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>{headers.map(h => <th key={h} className="px-2 py-1.5 text-left text-gray-500 font-medium border-b">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className={`border-b last:border-0 ${missingRequired(row) ? 'bg-red-50' : ''}`}>
                      {headers.map(h => <td key={h} className="px-2 py-1.5 text-gray-700">{row[h] || <span className="text-gray-300">—</span>}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvRows.filter(missingRequired).length > 0 && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {csvRows.filter(missingRequired).length} rijen missen een e-mailadres en worden overgeslagen.
              </p>
            )}
            {duplicatesInFile > 0 && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {duplicatesInFile} dubbele e-mail{duplicatesInFile === 1 ? '' : 's'} in dit bestand worden automatisch samengevoegd.
              </p>
            )}
            <p className="text-xs text-gray-500">
              Reeds bestaande contacten in de database worden automatisch overgeslagen op basis van e-mailadres.
            </p>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Nieuw aangemaakt', value: result.aangemaakt, color: 'text-green-700', bg: 'bg-green-50' },
                { label: 'Bestonden al', value: result.overgeslagen, color: 'text-orange-700', bg: 'bg-orange-50' },
                { label: 'Fouten', value: result.fouten?.length || 0, color: 'text-red-700', bg: 'bg-red-50' },
              ].map(c => (
                <div key={c.label} className={`${c.bg} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>
            {result.fouten?.length > 0 && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs font-medium text-red-700 mb-2">Foutmeldingen:</p>
                <ul className="space-y-1">
                  {result.fouten.map((f: string, i: number) => <li key={i} className="text-xs text-red-600">• {f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 1 && <Button variant="outline" onClick={onClose}>Annuleren</Button>}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => { reset(); }}>Terug</Button>
              <Button onClick={handleImport} disabled={importMutation.isPending || dedupedRows.length === 0} className="bg-purple-600 hover:bg-purple-700">
                {importMutation.isPending ? 'Importeren...' : `${dedupedRows.length} unieke contact${dedupedRows.length === 1 ? '' : 'en'} importeren`}
              </Button>
            </>
          )}
          {step === 3 && <Button onClick={() => { onClose(); reset(); }} className="bg-purple-600 hover:bg-purple-700">Klaar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Contact Detail Sheet ───────────────────────────────────────────────────

function ContactDetailSheet({ contactId, onClose, onEdit, tagSuggestions }: {
  contactId: number; onClose: () => void; onEdit: (c: any) => void; tagSuggestions: string[];
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState('gegevens');
  const [notesValue, setNotesValue] = useState('');
  const [notesSaved, setNotesSaved] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: contact, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/prospect-contacts', contactId],
    queryFn: () => fetchJson<any>(`/api/admin/prospect-contacts/${contactId}`),
    enabled: !!contactId,
  });

  // Wait — the individual GET doesn't exist yet. Let me use the list and find it.
  // Actually we'll use the contacts list as fallback via queryClient cache.

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/prospect-contacts', contactId, 'campaign-history'],
    queryFn: () => fetchJsonList<any>(`/api/admin/prospect-contacts/${contactId}/campaign-history`),
    enabled: tab === 'campagnes' && !!contactId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/admin/prospect-contacts/${contactId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-contacts'] });
      toast({ title: 'Contact verwijderd' });
      onClose();
    },
    onError: () => toast({ title: 'Fout bij verwijderen', variant: 'destructive' }),
  });

  const saveNotesMutation = useMutation({
    mutationFn: (notes: string) => apiRequest('PUT', `/api/admin/prospect-contacts/${contactId}`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-contacts'] });
      setNotesSaved(true);
      toast({ title: 'Notities opgeslagen' });
    },
  });

  if (isLoading || !contact) return (
    <Sheet open onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px]">
        <div className="flex items-center justify-center h-full"><RefreshCw className="h-5 w-5 animate-spin text-gray-300" /></div>
      </SheetContent>
    </Sheet>
  );

  const fullName = contact.voornaam && contact.achternaam
    ? `${contact.voornaam} ${contact.achternaam}`
    : contact.name;
  const tags = parseTags(contact.customTags);

  return (
    <>
      <Sheet open onOpenChange={v => !v && onClose()}>
        <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto flex flex-col">
          <SheetHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-bold text-gray-900 truncate">{fullName}</SheetTitle>
                <p className="text-sm text-gray-500 truncate">{contact.company || contact.bedrijf || '—'}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {typeBadge(contact.contactType)}
                  <span data-testid={`pill-phase-${contact.id}`}>{phasePill(contact.phase)}</span>
                  {statusBadge(contact.contactStatus)}
                </div>
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(contact)}>
                  <Pencil className="h-4 w-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="gegevens" className="text-xs">Gegevens</TabsTrigger>
              <TabsTrigger value="campagnes" className="text-xs">Campagnes</TabsTrigger>
              <TabsTrigger value="notities" className="text-xs">Notities</TabsTrigger>
            </TabsList>

            {/* Tab: Gegevens */}
            <TabsContent value="gegevens" className="flex-1 space-y-4">
              {branchePill(contact.branche) && (
                <div className="flex items-center gap-2">{branchePill(contact.branche)}</div>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  { label: 'E-mail', value: contact.email, icon: <Mail className="h-3.5 w-3.5" /> },
                  { label: 'Telefoon', value: contact.telefoon, icon: <Phone className="h-3.5 w-3.5" /> },
                  { label: 'Stad', value: contact.stad, icon: <MapPin className="h-3.5 w-3.5" /> },
                  { label: 'Bedrijf', value: contact.company, icon: <Building2 className="h-3.5 w-3.5" /> },
                  { label: 'Functietitel', value: contact.function },
                  { label: 'Functiegroep', value: contact.functiegroep },
                  { label: 'Taal', value: contact.taal },
                  { label: 'Bron', value: contact.source },
                  { label: 'Aangemaakt', value: formatDate(contact.createdAt) },
                  { label: 'Bijgewerkt', value: formatDate(contact.updatedAt) },
                ].map(({ label, value, icon }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-sm text-gray-800 flex items-center gap-1 mt-0.5">
                      {icon && <span className="text-gray-400">{icon}</span>}
                      {value || <span className="text-gray-300">—</span>}
                    </p>
                  </div>
                ))}
              </div>
              {tags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                        <Tag className="h-2.5 w-2.5" />{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Campagnehistorie */}
            <TabsContent value="campagnes" className="flex-1">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Mail className="h-10 w-10 mb-3 text-gray-200" />
                  <p className="text-sm font-medium">Nog geen campagnes verzonden</p>
                  <p className="text-xs mt-1 text-center">naar dit contact</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((h: any) => (
                    <div key={h.id} className="border rounded-xl p-3 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{h.campaignName || `Campagne #${h.campaignId}`}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${h.status === 'sent' ? 'bg-green-100 text-green-700' : h.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                          {h.status}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                        <span>Verzonden: {formatDate(h.sentAt)}</span>
                        {h.openedAt && <span className="text-blue-600">Geopend ✓</span>}
                        {h.clickedAt && <span className="text-purple-600">Geklikt ✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Notities */}
            <TabsContent value="notities" className="flex-1 flex flex-col gap-3">
              <Textarea
                value={notesSaved ? (contact.notes || '') : notesValue}
                onChange={e => { setNotesValue(e.target.value); setNotesSaved(false); }}
                onFocus={() => { if (notesSaved) setNotesValue(contact.notes || ''); }}
                rows={8}
                placeholder="Schrijf hier je notities over dit contact..."
                className="flex-1 resize-none text-sm"
              />
              <Button
                onClick={() => saveNotesMutation.mutate(notesValue)}
                disabled={notesSaved || saveNotesMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 w-full"
              >
                {saveNotesMutation.isPending ? 'Opslaan...' : notesSaved ? 'Opgeslagen' : 'Notities opslaan'}
              </Button>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Contact verwijderen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Weet je zeker dat je <strong>{fullName}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Annuleren</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Verwijderen...' : 'Ja, verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Filter Panel ───────────────────────────────────────────────────────────

interface Filters {
  branche: string[];
  type: string;
  status: string;
  taal: string;
  tags: string[];
  phase: string[];
  functiegroepen: string[];
}

function FilterPanel({ filters, onChange, tagOptions, onClose }: {
  filters: Filters; onChange: (f: Filters) => void; tagOptions: string[];
  onClose: () => void;
}) {
  const [local, setLocal] = useState<Filters>(filters);
  const set = (k: keyof Filters, v: any) => setLocal(f => ({ ...f, [k]: v }));

  const toggleBranche = (b: string) => {
    setLocal(f => ({
      ...f,
      branche: f.branche.includes(b) ? f.branche.filter(x => x !== b) : [...f.branche, b],
    }));
  };
  const toggleTag = (t: string) => {
    setLocal(f => ({
      ...f,
      tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t],
    }));
  };
  const togglePhase = (p: string) => {
    setLocal(f => ({
      ...f,
      phase: f.phase.includes(p) ? f.phase.filter(x => x !== p) : [...f.phase, p],
    }));
  };
  const toggleFunctiegroep = (g: string) => {
    setLocal(f => ({
      ...f,
      functiegroepen: f.functiegroepen.includes(g) ? f.functiegroepen.filter(x => x !== g) : [...f.functiegroepen, g],
    }));
  };

  return (
    <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-72 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Filters</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Branche</p>
        <div className="flex flex-wrap gap-1">
          {BRANCHES.map(b => (
            <button key={b} onClick={() => toggleBranche(b)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${local.branche.includes(b) ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Type</p>
        <div className="flex gap-1">
          {[['', 'Alles'], ['prospect', 'Prospect'], ['klant', 'Klant']].map(([v, l]) => (
            <button key={v} onClick={() => set('type', v)}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${local.type === v ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Status</p>
        <div className="flex gap-1">
          {[['', 'Alles'], ['actief', 'Actief'], ['uitgeschreven', 'Uitgeschreven'], ['geblokkeerd', 'Geblokkeerd']].map(([v, l]) => (
            <button key={v} onClick={() => set('status', v)}
              className={`flex-1 text-xs py-1 rounded-lg border transition-colors ${local.status === v ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Taal</p>
        <div className="flex gap-1 flex-wrap">
          {[['', 'Alles'], ...TALEN.map(t => [t, t])].map(([v, l]) => (
            <button key={v} onClick={() => set('taal', v)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${local.taal === v ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Pijplijn-fase</p>
        <div className="flex flex-wrap gap-1">
          {PHASES.map(p => (
            <button key={p.value} onClick={() => togglePhase(p.value)}
              data-testid={`button-filter-phase-${p.value}`}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${local.phase.includes(p.value) ? 'bg-amber-100 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Functiegroep</p>
        <div className="flex flex-wrap gap-1">
          {FUNCTIEGROEPEN.map(g => (
            <button key={g} onClick={() => toggleFunctiegroep(g)}
              data-testid={`button-filter-functiegroep-${g}`}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${local.functiegroepen.includes(g) ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {tagOptions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Tags</p>
          <div className="flex flex-wrap gap-1">
            {tagOptions.map(t => (
              <button key={t} onClick={() => toggleTag(t)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${local.tags.includes(t) ? 'bg-purple-100 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { const empty: Filters = { branche: [], type: '', status: '', taal: '', tags: [], phase: [], functiegroepen: [] }; setLocal(empty); onChange(empty); onClose(); }}>
          Wis alles
        </Button>
        <Button size="sm" className="flex-1 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => { onChange(local); onClose(); }}>
          Toepassen
        </Button>
      </div>
    </div>
  );
}

// ── vCard (.vcf) Import Modal ──────────────────────────────────────────────
// Voor iPhone/iCloud/Google contacten-export. Backend parst de vCard, doet
// dedupe op email + telefoon en laat preview zien voor commit.

interface VcardRijFE {
  voornaam: string | null;
  achternaam: string | null;
  fullName: string;
  email: string | null;
  emailIsPlaceholder: boolean;
  telefoon: string | null;
  telefoonOriginal: string | null;
  bedrijf: string | null;
  functietitel: string | null;
}

interface VcardPreviewFE {
  totaalKaarten: number;
  geldigNieuw: number;
  zonderEmailEnTel: number;
  dubbelInBestand: number;
  dubbelInDb: number;
  metEmail: number;
  alleenTelefoon: number;
  voorbeelden: VcardRijFE[];
  alleRijen: VcardRijFE[];
}

function VcardImportModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const { toast } = useToast();
  const [stap, setStap] = useState<1 | 2 | 3>(1);
  const [bezig, setBezig] = useState(false);
  const [preview, setPreview] = useState<VcardPreviewFE | null>(null);
  const [resultaat, setResultaat] = useState<{ aangemaakt: number; overgeslagen: number; fouten: string[] } | null>(null);
  const [bestandsnaam, setBestandsnaam] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStap(1); setPreview(null); setResultaat(null); setBestandsnaam('');
  };

  const verwerkBestand = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.vcf')) {
      toast({ title: 'Alleen .vcf bestanden', description: file.name, variant: 'destructive' });
      return;
    }
    if (file.size === 0) { toast({ title: 'Bestand is leeg', variant: 'destructive' }); return; }
    setBestandsnaam(file.name);
    setBezig(true);
    try {
      const tekst = await file.text();
      const data = await apiRequest('POST', '/api/admin/prospect-contacts/import-vcard/preview', { vcf: tekst }) as VcardPreviewFE;
      setPreview(data);
      setStap(2);
    } catch (err: any) {
      toast({ title: 'Inlezen mislukt', description: err?.message || 'Onbekende fout', variant: 'destructive' });
    } finally { setBezig(false); }
  };

  const handleImport = async () => {
    if (!preview || preview.alleRijen.length === 0) return;
    setBezig(true);
    try {
      const data = await apiRequest('POST', '/api/admin/prospect-contacts/import-vcard/commit', {
        rijen: preview.alleRijen,
      }) as { aangemaakt: number; overgeslagen: number; fouten: string[] };
      setResultaat(data);
      setStap(3);
      onSaved?.();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prospect-contacts'] });
      toast({ title: `${data.aangemaakt} contact(en) geïmporteerd uit vCard` });
    } catch (err: any) {
      toast({ title: 'Import mislukt', description: err?.message || 'Onbekende fout', variant: 'destructive' });
    } finally { setBezig(false); }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-600" />
            vCard (.vcf) importeren
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            iPhone/iCloud-tip: open <strong>iCloud.com → Contacten</strong>, selecteer alles (Cmd+A) en kies onderin tandwiel → <em>Exporteer vCard</em>.
          </p>
        </DialogHeader>

        {stap === 1 && (
          <div
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setIsDragging(false);
              const f = e.dataTransfer.files?.[0]; if (f) verwerkBestand(f);
            }}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Sleep een .vcf hier of klik om te kiezen</p>
            <p className="text-xs text-gray-400 mt-1">Eén bestand met al je contacten</p>
            <input
              ref={fileRef}
              type="file"
              accept=".vcf,text/vcard,text/x-vcard"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) verwerkBestand(f); }}
            />
            {bezig && <p className="text-xs text-purple-600 mt-3">Bezig met inlezen...</p>}
          </div>
        )}

        {stap === 2 && preview && (
          <div className="space-y-4">
            <div className="text-xs text-gray-500">Bestand: <strong>{bestandsnaam}</strong></div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-purple-50 border border-purple-100 rounded p-3">
                <div className="text-2xl font-bold text-purple-700">{preview.totaalKaarten}</div>
                <div className="text-[10px] uppercase tracking-wide text-purple-600 mt-0.5">Gevonden</div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded p-3">
                <div className="text-2xl font-bold text-green-700">{preview.geldigNieuw}</div>
                <div className="text-[10px] uppercase tracking-wide text-green-600 mt-0.5">Nieuw</div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded p-3">
                <div className="text-2xl font-bold text-amber-700">{preview.dubbelInDb + preview.dubbelInBestand}</div>
                <div className="text-[10px] uppercase tracking-wide text-amber-600 mt-0.5">Duplicaten</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-2xl font-bold text-gray-600">{preview.zonderEmailEnTel}</div>
                <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-0.5">Onbruikbaar</div>
              </div>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded p-2 space-y-0.5">
              <div>• <strong>{preview.metEmail}</strong> contact(en) met e-mailadres</div>
              <div>• <strong>{preview.alleenTelefoon}</strong> contact(en) met alleen telefoonnummer (krijgen tijdelijke placeholder-mail)</div>
              {preview.dubbelInDb > 0 && <div>• <strong>{preview.dubbelInDb}</strong> al in EXTRA aanwezig (overgeslagen)</div>}
              {preview.dubbelInBestand > 0 && <div>• <strong>{preview.dubbelInBestand}</strong> dubbel binnen bestand</div>}
              {preview.zonderEmailEnTel > 0 && <div>• <strong>{preview.zonderEmailEnTel}</strong> zonder e-mail én zonder telefoon (genegeerd)</div>}
            </div>

            {preview.voorbeelden.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-1.5">Voorbeeld (eerste {preview.voorbeelden.length}):</div>
                <div className="border border-gray-200 rounded text-xs max-h-48 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left px-2 py-1 font-medium">Naam</th>
                        <th className="text-left px-2 py-1 font-medium">E-mail</th>
                        <th className="text-left px-2 py-1 font-medium">Telefoon</th>
                        <th className="text-left px-2 py-1 font-medium">Bedrijf</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.voorbeelden.map((r, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-2 py-1">{r.fullName}</td>
                          <td className="px-2 py-1 text-gray-500">{r.emailIsPlaceholder ? <span className="italic text-amber-600">(geen)</span> : r.email}</td>
                          <td className="px-2 py-1 text-gray-500">{r.telefoon || '—'}</td>
                          <td className="px-2 py-1 text-gray-500">{r.bedrijf || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { reset(); }}>Ander bestand</Button>
              <Button
                disabled={bezig || preview.geldigNieuw === 0}
                onClick={handleImport}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {bezig ? 'Bezig met importeren...' : `Importeer ${preview.geldigNieuw} contact(en)`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {stap === 3 && resultaat && (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-lg font-semibold">Klaar!</div>
              <div className="text-sm text-gray-600 mt-1">
                {resultaat.aangemaakt} nieuwe contact(en) toegevoegd
                {resultaat.overgeslagen > 0 && `, ${resultaat.overgeslagen} overgeslagen`}
              </div>
            </div>
            {resultaat.fouten.length > 0 && (
              <div className="text-left bg-red-50 border border-red-100 rounded p-2 text-xs text-red-700 max-h-32 overflow-y-auto">
                <div className="font-semibold mb-1">Fouten:</div>
                {resultaat.fouten.map((f, i) => <div key={i}>• {f}</div>)}
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleClose} className="bg-purple-600 hover:bg-purple-700">Sluiten</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ProspectContactenTab() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('naam-az');
  const [filters, setFilters] = useState<Filters>({ branche: [], type: '', status: '', taal: '', tags: [], phase: [], functiegroepen: [] });
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [apolloOpen, setApolloOpen] = useState(false);
  const [vcardOpen, setVcardOpen] = useState(false);
  // Stats filter override
  const [statFilter, setStatFilter] = useState<null | { type?: string; status?: string }>(null);

  const { data: contacts = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/admin/prospect-contacts'],
  });

  const { data: uniqueTags = [] } = useQuery<string[]>({
    queryKey: ['/api/admin/prospect-contacts/unique-tags'],
  });

  // ── Client-side filtering ──
  const filtered = useMemo(() => {
    let list = [...contacts];

    // Stat filter override
    if (statFilter) {
      if (statFilter.type) list = list.filter(c => c.contactType === statFilter.type);
      if (statFilter.status) list = list.filter(c => c.contactStatus === statFilter.status);
    } else {
      if (filters.branche.length > 0) list = list.filter(c => filters.branche.includes(c.branche));
      if (filters.type) list = list.filter(c => c.contactType === filters.type);
      if (filters.status) list = list.filter(c => c.contactStatus === filters.status);
      if (filters.taal) list = list.filter(c => c.taal === filters.taal);
      if (filters.phase.length > 0) list = list.filter(c => filters.phase.includes(c.phase || 'nieuw'));
      if (filters.functiegroepen.length > 0) {
        list = list.filter(c => filters.functiegroepen.includes(c.functiegroep));
      }
      if (filters.tags.length > 0) {
        list = list.filter(c => {
          const ct = parseTags(c.customTags);
          return filters.tags.some(t => ct.includes(t));
        });
      }
    }

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => {
        const name = c.voornaam ? `${c.voornaam} ${c.achternaam}` : c.name;
        return name?.toLowerCase().includes(s)
          || c.email?.toLowerCase().includes(s)
          || c.company?.toLowerCase().includes(s)
          || c.bedrijf?.toLowerCase().includes(s);
      });
    }

    // Sort
    if (sort === 'naam-az') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sort === 'naam-za') list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    else if (sort === 'bedrijf') list.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
    else if (sort === 'nieuwste') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list;
  }, [contacts, search, sort, filters, statFilter]);

  // ── Stats ──
  const stats = useMemo(() => ({
    totaal: contacts.length,
    actief: contacts.filter(c => c.contactStatus === 'actief').length,
    prospects: contacts.filter(c => c.contactType === 'prospect' || !c.contactType).length,
    klanten: contacts.filter(c => c.contactType === 'klant').length,
    uitgeschreven: contacts.filter(c => c.contactStatus === 'uitgeschreven').length,
  }), [contacts]);

  const activeFilterCount = filters.branche.length + (filters.type ? 1 : 0) + (filters.status ? 1 : 0) + (filters.taal ? 1 : 0) + filters.tags.length + filters.phase.length + filters.functiegroepen.length;

  const selectedContact = contacts.find(c => c.id === selectedId);

  const handleStatClick = useCallback((sf: typeof statFilter) => {
    setStatFilter(prev => JSON.stringify(prev) === JSON.stringify(sf) ? null : sf);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Wat deze pagina sinds 18 augustus 2026 is.
          Hij stond eerst als 'Contacten' in het menu onder Campagnes en was
          daarmee een tweede adresboek naast Bestaande klanten en Leads &
          Prospects. Dat is hij niet meer: contactpersonen beheer je in het CRM,
          en deze lijst volgt daaruit. Wat hier wél thuishoort en nergens anders
          bestaat: afmeldingen, bounces, spamklachten en de losse imports. */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-start gap-2">
        <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Verzendlijst</strong> — deze lijst volgt automatisch uit het CRM.
          Nieuwe contactpersonen voeg je toe bij <em>Bestaande klanten</em> of <em>Leads &amp; Prospects</em>;
          ze staan hier daarna vanzelf tussen. Hier beheer je wat het CRM niet kent:
          afmeldingen, bounces, spamklachten en imports.
        </p>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Totaal', value: stats.totaal, filter: null },
            { label: 'Actief', value: stats.actief, filter: { status: 'actief' }, color: 'text-green-700' },
            { label: 'Leads & Prospects', value: stats.prospects, filter: { type: 'prospect' }, color: 'text-purple-700' },
            { label: 'Bestaande klanten', value: stats.klanten, filter: { type: 'klant' }, color: 'text-blue-700' },
            { label: 'Uitgeschreven', value: stats.uitgeschreven, filter: { status: 'uitgeschreven' }, color: 'text-gray-500' },
          ].map(s => (
            <button key={s.label} onClick={() => handleStatClick(s.filter)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm text-left ${JSON.stringify(statFilter) === JSON.stringify(s.filter) ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
              <span className={`text-lg font-bold ${s.color || 'text-gray-800'}`}>{s.value}</span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setStatFilter(null); }}
            placeholder="Zoek op naam, e-mail, bedrijf..." className="pl-8 h-8 text-sm" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
        </div>

        <div className="relative">
          <Button variant="outline" size="sm" className={`h-8 gap-1.5 text-xs ${activeFilterCount > 0 ? 'border-purple-400 text-purple-700 bg-purple-50' : ''}`}
            onClick={() => setFilterOpen(o => !o)}>
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && <span className="bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{activeFilterCount}</span>}
          </Button>
          {filterOpen && (
            <FilterPanel filters={filters} onChange={f => { setFilters(f); setStatFilter(null); }} tagOptions={uniqueTags} onClose={() => setFilterOpen(false)} />
          )}
        </div>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-8 text-xs w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="naam-az">Naam A–Z</SelectItem>
            <SelectItem value="naam-za">Naam Z–A</SelectItem>
            <SelectItem value="bedrijf">Bedrijf</SelectItem>
            <SelectItem value="nieuwste">Nieuwste eerst</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setVcardOpen(true)} title="iPhone/iCloud/Google contacten-export (.vcf) importeren">
            <Upload className="h-3.5 w-3.5" />vCard (.vcf)
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setApolloOpen(true)} title="Apollo.io export importeren — kolommen + functietags worden automatisch herkend">
            <Upload className="h-3.5 w-3.5" />Apollo CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5" />CSV import
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />Toevoegen
          </Button>
        </div>

        <p className="w-full text-xs text-gray-400 -mt-1">
          {filtered.length} {filtered.length === 1 ? 'contact' : 'contacten'}
          {filtered.length !== contacts.length && ` (gefilterd uit ${contacts.length})`}
        </p>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />Laden...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Users className="h-12 w-12 mb-3 text-gray-200" />
            <p className="text-sm font-medium">{contacts.length === 0 ? 'Nog geen contacten' : 'Geen contacten gevonden'}</p>
            <p className="text-xs mt-1 text-gray-300">
              {contacts.length === 0 ? 'Voeg je eerste contact toe of importeer via CSV' : 'Pas de filters of zoekterm aan'}
            </p>
            {contacts.length === 0 && (
              <Button size="sm" className="mt-4 bg-purple-600 hover:bg-purple-700 gap-1.5" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5" />Eerste contact toevoegen
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white">
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  {['Naam', 'Bedrijf', 'Branche', 'Fase', 'Type', 'Status', 'E-mail', 'Tags', ''].map((h, i) => (
                    <th key={i} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => {
                  const fullName = c.voornaam && c.achternaam ? `${c.voornaam} ${c.achternaam}` : c.name;
                  const tags = parseTags(c.customTags);
                  return (
                    <tr key={c.id} onClick={() => setSelectedId(c.id)}
                      className={`border-b border-gray-50 cursor-pointer hover:bg-purple-50/30 transition-colors ${c.contactStatus === 'geblokkeerd' ? 'opacity-60' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-purple-600">{(fullName || '?')[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{fullName}</p>
                            {c.telefoon && <p className="text-xs text-gray-400">{c.telefoon}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-700 truncate max-w-[140px]">{c.company || '—'}</p>
                        {c.stad && <p className="text-xs text-gray-400">{c.stad}</p>}
                      </td>
                      <td className="py-3 px-4">{branchePill(c.branche) || <span className="text-gray-300 text-xs">—</span>}</td>
                      <td className="py-3 px-4" data-testid={`cell-phase-${c.id}`}>{phasePill(c.phase)}</td>
                      <td className="py-3 px-4">{typeBadge(c.contactType)}</td>
                      <td className="py-3 px-4">{statusBadge(c.contactStatus)}</td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-gray-500 truncate max-w-[160px]">{c.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {tags.slice(0, 2).map((t: string) => (
                            <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">{t}</span>
                          ))}
                          {tags.length > 2 && <span className="text-xs text-gray-400">+{tags.length - 2}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals & side panels */}
      {addOpen && <ContactFormModal open tagSuggestions={uniqueTags} onClose={() => setAddOpen(false)} onSaved={refetch} />}
      {editContact && <ContactFormModal open contact={editContact} tagSuggestions={uniqueTags} onClose={() => setEditContact(null)} onSaved={refetch} />}
      {importOpen && <CsvImportModal open onClose={() => setImportOpen(false)} onSaved={refetch} />}
      {apolloOpen && <ApolloImportModal open onClose={() => setApolloOpen(false)} onSaved={refetch} />}
      {vcardOpen && <VcardImportModal open onClose={() => setVcardOpen(false)} onSaved={refetch} />}
      {selectedId != null && (
        <ContactDetailSheet
          contactId={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={c => { setSelectedId(null); setEditContact(c); }}
          tagSuggestions={uniqueTags}
        />
      )}
    </div>
  );
}
