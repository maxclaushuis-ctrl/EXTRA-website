import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, Search, X, ExternalLink, Phone, Mail, Linkedin, Building2, MapPin,
  User, Calendar, Clock, CheckCircle, AlertCircle, Bell, ChevronRight,
  Pencil, Trash2, Star, MoreHorizontal, Globe, Users, TrendingUp, RefreshCw,
  FileText, MessageSquare, PhoneCall, AlignLeft, AlertTriangle, Upload
} from 'lucide-react';
import { ImportClientsDialog } from './ImportClientsDialog';
import { useToast } from '@/hooks/use-toast';

// ── Constants ──────────────────────────────────────────────────────────────

export const CRM_OWNERS = ['max', 'eveline', 'charlotte', 'lea'] as const;
export type CrmOwner = typeof CRM_OWNERS[number];

// Functies (sluit aan op het sollicitatieformulier)
export const FUNCTION_TAGS = [
  { value: 'horecamedewerker', label: 'Horecamedewerker' },
  { value: 'chef',             label: 'Chef' },
  { value: 'housekeeping',     label: 'Housekeeping' },
  { value: 'logistiek',        label: 'Logistiek' },
] as const;

const FUNCTION_LABELS: Record<string, string> = Object.fromEntries(
  FUNCTION_TAGS.map(f => [f.value, f.label])
);

const FUNCTION_COLORS: Record<string, string> = {
  horecamedewerker: 'bg-blue-50 text-blue-700 border-blue-200',
  chef:             'bg-amber-50 text-amber-700 border-amber-200',
  housekeeping:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  logistiek:        'bg-slate-50 text-slate-700 border-slate-200',
};

function FunctionBadge({ value, onRemove }: { value: string; onRemove?: () => void }) {
  const label = FUNCTION_LABELS[value] || value;
  const cls = FUNCTION_COLORS[value] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${cls}`}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 ml-0.5">
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}

function FunctionsEditor({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const available = FUNCTION_TAGS.filter(f => !values.includes(f.value));
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {values.length === 0 && <span className="text-xs text-gray-400">Nog geen functies geselecteerd</span>}
        {values.map(v => (
          <FunctionBadge key={v} value={v} onRemove={() => onChange(values.filter(x => x !== v))} />
        ))}
      </div>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {available.map(f => (
            <button
              key={f.value}
              type="button"
              className={`text-xs px-2 py-0.5 rounded-full border font-medium hover:opacity-80 transition-opacity ${FUNCTION_COLORS[f.value]}`}
              onClick={() => onChange([...values, f.value])}
            >
              + {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const CONTACT_TAGS = [
  { value: 'Bediening',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Housekeeping', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Keuken',       color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Logistiek',    color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { value: 'Front-office', color: 'bg-violet-50 text-violet-700 border-violet-200' },
] as const;

const CONTACT_TAG_COLORS: Record<string, string> = Object.fromEntries(
  CONTACT_TAGS.map(t => [t.value, t.color])
);

function ContactTagBadge({ value, onRemove }: { value: string; onRemove?: () => void }) {
  const cls = CONTACT_TAG_COLORS[value] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${cls}`}>
      {value}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:opacity-70 ml-0.5">
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}

function ContactTagsEditor({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const available = CONTACT_TAGS.filter(t => !values.includes(t.value));
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5 min-h-[20px]">
        {values.length === 0 && <span className="text-xs text-gray-400">Nog geen tags geselecteerd</span>}
        {values.map(v => (
          <ContactTagBadge key={v} value={v} onRemove={() => onChange(values.filter(x => x !== v))} />
        ))}
      </div>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {available.map(t => (
            <button
              key={t.value}
              type="button"
              className={`text-xs px-2 py-0.5 rounded-full border font-medium hover:opacity-80 transition-opacity ${t.color}`}
              onClick={() => onChange([...values, t.value])}
            >
              + {t.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const CRM_TAGS = [
  'Hot lead',
  'Warm lead',
  'Cold lead',
  'VIP klant',
  'Urgent',
  'Follow-up',
  'Offerte verstuurd',
  'Contract besproken',
  'Terugkerende klant',
  'Nieuw contact',
] as const;

const TAG_COLORS: Record<string, string> = {
  'Hot lead':          'bg-red-100 text-red-700 border-red-200',
  'Warm lead':         'bg-orange-100 text-orange-700 border-orange-200',
  'Cold lead':         'bg-slate-100 text-slate-600 border-slate-200',
  'VIP klant':         'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Urgent':            'bg-rose-100 text-rose-700 border-rose-200',
  'Follow-up':         'bg-blue-100 text-blue-600 border-blue-200',
  'Offerte verstuurd': 'bg-violet-100 text-violet-700 border-violet-200',
  'Contract besproken':'bg-purple-100 text-purple-700 border-purple-200',
  'Terugkerende klant':'bg-green-100 text-green-700 border-green-200',
  'Nieuw contact':     'bg-teal-100 text-teal-600 border-teal-200',
};

function getTagStyle(tag: string): string {
  return TAG_COLORS[tag] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function TagBadge({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${getTagStyle(tag)}`}>
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 ml-0.5">
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}

function FunctionsInlineEditor({ companyId, initialFunctions }: { companyId: number; initialFunctions: string[] }) {
  const [localFunctions, setLocalFunctions] = useState<string[]>(initialFunctions);
  const [saving, setSaving] = useState(false);

  const prevId = useRef(companyId);
  if (prevId.current !== companyId) { prevId.current = companyId; setLocalFunctions(initialFunctions); }

  const save = async (newFns: string[]) => {
    setLocalFunctions(newFns);
    setSaving(true);
    try {
      await apiRequest('PATCH', `/api/admin/crm/companies/${companyId}`, { functions: newFns });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-gray-500">Functies waarvoor uitzendkrachten worden ingezet</p>
        {saving && <span className="text-xs text-gray-400">Opslaan...</span>}
      </div>
      <FunctionsEditor values={localFunctions} onChange={save} />
    </div>
  );
}

function TagsInlineEditor({ companyId, initialTags }: { companyId: number; initialTags: string[] }) {
  const [localTags, setLocalTags] = useState<string[]>(initialTags);
  const [saving, setSaving] = useState(false);

  // Sync when parent data changes (e.g. query refetch or different company)
  const prevId = useRef(companyId);
  const prevTags = useRef(initialTags);
  if (prevId.current !== companyId) { prevId.current = companyId; prevTags.current = initialTags; setLocalTags(initialTags); }

  const save = async (newTags: string[]) => {
    setLocalTags(newTags);
    setSaving(true);
    try {
      await apiRequest('PATCH', `/api/admin/crm/companies/${companyId}`, { tags: newTags });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-gray-500">Tags</p>
        {saving && <span className="text-xs text-gray-400">Opslaan...</span>}
      </div>
      <TagEditor tags={localTags} onChange={save} />
    </div>
  );
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const available = CRM_TAGS.filter(t => !tags.includes(t));

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {tags.map(tag => (
          <TagBadge key={tag} tag={tag} onRemove={() => onChange(tags.filter(t => t !== tag))} />
        ))}
      </div>
      {available.length > 0 && (
        <div className="relative">
          <Button type="button" size="sm" variant="outline" className="h-6 text-xs gap-1" onClick={() => setOpen(o => !o)}>
            <Plus className="h-3 w-3" />Tag toevoegen
          </Button>
          {open && (
            <div className="absolute z-50 mt-1 bg-white border rounded-lg shadow-lg p-2 flex flex-wrap gap-1.5 max-w-xs">
              {available.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium hover:opacity-80 transition-opacity ${getTagStyle(tag)}`}
                  onClick={() => { onChange([...tags, tag]); setOpen(false); }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const OWNER_COLORS: Record<string, string> = {
  max: 'bg-blue-100 text-blue-700',
  eveline: 'bg-purple-100 text-purple-700',
  charlotte: 'bg-pink-100 text-pink-700',
  lea: 'bg-amber-100 text-amber-700',
};

const PHASE_LABELS: Record<string, string> = {
  nieuw: 'Nieuw',
  eerste_contact: 'Eerste contact',
  afspraak_gepland: 'Afspraak gepland',
  voorstel_verstuurd: 'Voorstel verstuurd',
  follow_up: 'Follow-up',
  gewonnen: 'Gewonnen',
  verloren: 'Verloren',
  on_hold: 'On hold',
};

const PHASE_COLORS: Record<string, string> = {
  nieuw: 'bg-gray-100 text-gray-600',
  eerste_contact: 'bg-indigo-100 text-indigo-700',
  afspraak_gepland: 'bg-amber-100 text-amber-700',
  voorstel_verstuurd: 'bg-orange-100 text-orange-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
  gewonnen: 'bg-green-100 text-green-700',
  verloren: 'bg-red-100 text-red-600',
  on_hold: 'bg-slate-100 text-slate-500',
};

const TYPE_LABELS: Record<string, string> = {
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  eventlocatie: 'Eventlocatie',
  cateraar: 'Cateraar',
  logistiek: 'Logistiek',
};

const TYPE_COLORS: Record<string, string> = {
  hotel: 'bg-sky-100 text-sky-700',
  restaurant: 'bg-orange-100 text-orange-700',
  eventlocatie: 'bg-violet-100 text-violet-700',
  cateraar: 'bg-teal-100 text-teal-700',
  logistiek: 'bg-slate-100 text-slate-700',
};

const ABC_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800 font-bold',
  B: 'bg-blue-100 text-blue-700 font-bold',
  C: 'bg-gray-100 text-gray-600 font-bold',
};

const NOTE_TYPE_ICONS: Record<string, any> = {
  note: AlignLeft,
  call: PhoneCall,
  email: Mail,
  meeting: Users,
  follow_up: RefreshCw,
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  note: 'Notitie',
  call: 'Telefoongesprek',
  email: 'E-mail',
  meeting: 'Meeting',
  follow_up: 'Follow-up',
};

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getReminderStyle(status: string, dueDate: string): { badge: string; row: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (status === 'completed') return { badge: 'bg-green-100 text-green-700', row: '' };
  if (status === 'overdue' || dueDate < today) return { badge: 'bg-red-100 text-red-700', row: 'bg-red-50/30' };
  if (dueDate === today) return { badge: 'bg-orange-100 text-orange-700', row: 'bg-orange-50/30' };
  return { badge: 'bg-blue-100 text-blue-700', row: '' };
}

function getReminderLabel(status: string, dueDate: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (status === 'completed') return 'Afgerond';
  if (status === 'overdue' || dueDate < today) return 'Verlopen';
  if (dueDate === today) return 'Vandaag';
  return 'Gepland';
}

// ── Company Form Modal ─────────────────────────────────────────────────────

function CompanyFormModal({
  open, onClose, company, allCompanies, defaultIsClient = false,
}: {
  open: boolean;
  onClose: () => void;
  company?: any;
  allCompanies: any[];
  defaultIsClient?: boolean;
}) {
  const isEdit = !!company;
  const [form, setForm] = useState<any>(company || {
    name: '', type: 'hotel', isClient: defaultIsClient, phase: 'nieuw', abc: '',
    owner: 'max', accountOwner: '', city: '', region: '', website: '', linkedin: '',
    potential: 'midden', source: 'inbound', parentCompanyId: null,
    attentionNeeded: false, risk: false, busyPeriods: '', planningNotes: '', notes: '',
    tags: [], functions: [],
  });

  const { toast } = useToast();
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/crm/companies', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies'] }); onClose(); },
    onError: (e: any) => toast({ title: 'Opslaan mislukt', description: e?.message || 'Onbekende fout', variant: 'destructive' }),
  });
  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/admin/crm/companies/${company.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', company.id] });
      onClose();
    },
    onError: (e: any) => toast({ title: 'Opslaan mislukt', description: e?.message || 'Onbekende fout', variant: 'destructive' }),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  const buildPayload = () => {
    const COMPANY_FIELDS = [
      'name', 'type', 'isClient', 'phase', 'abc', 'owner', 'accountOwner',
      'city', 'region', 'website', 'linkedin', 'potential', 'source',
      'parentCompanyId', 'attentionNeeded', 'risk', 'busyPeriods',
      'planningNotes', 'notes', 'tags', 'functions',
    ];
    const out: any = {};
    for (const k of COMPANY_FIELDS) if (form[k] !== undefined) out[k] = form[k];
    return out;
  };

  const handleSubmit = () => {
    if (!form.name?.trim()) return;
    const payload = buildPayload();
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Bedrijf bewerken' : 'Nieuw bedrijf toevoegen'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Bedrijfsnaam *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Naam bedrijf" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
            <Select value={form.type} onValueChange={v => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Type relatie</label>
            <Select value={form.isClient ? 'klant' : 'prospect'} onValueChange={v => set('isClient', v === 'klant')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect / Lead</SelectItem>
                <SelectItem value="klant">Bestaande klant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!form.isClient && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Fase</label>
              <Select value={form.phase} onValueChange={v => set('phase', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PHASE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.isClient && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">A/B/C classificatie</label>
              <Select value={form.abc || ''} onValueChange={v => set('abc', v)}>
                <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A klant</SelectItem>
                  <SelectItem value="B">B klant</SelectItem>
                  <SelectItem value="C">C klant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Eigenaar</label>
            <Select value={form.owner || 'max'} onValueChange={v => set('owner', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CRM_OWNERS.map(o => <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.isClient && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Account owner</label>
              <Select value={form.accountOwner || ''} onValueChange={v => set('accountOwner', v)}>
                <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                <SelectContent>
                  {CRM_OWNERS.map(o => <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Stad</label>
            <Input value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="Amsterdam" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Regio</label>
            <Input value={form.region || ''} onChange={e => set('region', e.target.value)} placeholder="Noord-Holland" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Omzetpotentie</label>
            <Select value={form.potential || 'midden'} onValueChange={v => set('potential', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="laag">Laag</SelectItem>
                <SelectItem value="midden">Midden</SelectItem>
                <SelectItem value="hoog">Hoog</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Bron</label>
            <Select value={form.source || 'inbound'} onValueChange={v => set('source', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['linkedin', 'referral', 'website', 'inbound', 'netwerk', 'anders'].map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Website</label>
            <Input value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">LinkedIn pagina</label>
            <Input value={form.linkedin || ''} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/company/..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Moederbedrijf</label>
            <Select value={form.parentCompanyId?.toString() || 'none'} onValueChange={v => set('parentCompanyId', v === 'none' ? null : parseInt(v))}>
              <SelectTrigger><SelectValue placeholder="Geen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen (zelfstandig)</SelectItem>
                {allCompanies.filter(c => c.id !== company?.id).map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.isClient && (
            <>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Drukke periodes</label>
                <Input value={form.busyPeriods || ''} onChange={e => set('busyPeriods', e.target.value)} placeholder="Dec-jan, zomer..." />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Planning / belangrijke notities</label>
                <Textarea value={form.planningNotes || ''} onChange={e => set('planningNotes', e.target.value)} rows={2} />
              </div>
              <div className="flex items-center gap-6 col-span-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!form.attentionNeeded} onChange={e => set('attentionNeeded', e.target.checked)} className="rounded" />
                  Aandacht nodig
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!form.risk} onChange={e => set('risk', e.target.checked)} className="rounded" />
                  Risico
                </label>
              </div>
            </>
          )}
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Functies waarvoor uitzendkrachten worden ingezet</label>
            <FunctionsEditor values={form.functions || []} onChange={v => set('functions', v)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Tags</label>
            <TagEditor tags={form.tags || []} onChange={v => set('tags', v)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notities</label>
            <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Algemene notities over dit bedrijf..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.name.trim()} className="bg-purple-600 hover:bg-purple-700">
            {isPending ? 'Opslaan...' : isEdit ? 'Opslaan' : 'Toevoegen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Reminder Form Modal ────────────────────────────────────────────────────

function ReminderFormModal({ open, onClose, companyId, companyName, contacts = [], reminder }: {
  open: boolean; onClose: () => void; companyId?: number; companyName?: string;
  contacts?: any[]; reminder?: any;
}) {
  const isEdit = !!reminder;
  const [form, setForm] = useState<any>(reminder || {
    companyId: companyId || '',
    contactId: null,
    title: '',
    dueDate: new Date().toISOString().slice(0, 10),
    owner: 'max',
    note: '',
    status: 'open',
  });

  const { data: allCompanies = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/crm/companies'],
    enabled: !companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/crm/reminders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/reminders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] });
      onClose();
    },
  });
  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/admin/crm/reminders/${reminder.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/reminders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', form.companyId] });
      onClose();
    },
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!form.title.trim() || !form.dueDate || !form.companyId) return;
    const payload = { ...form, companyId: parseInt(form.companyId), contactId: form.contactId || null };
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Reminder bewerken' : 'Nieuwe reminder'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Actie / titel *</label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Bellen voor afspraak..." />
          </div>
          {!companyId && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Bedrijf *</label>
              <Select value={form.companyId?.toString() || ''} onValueChange={v => set('companyId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecteer bedrijf..." /></SelectTrigger>
                <SelectContent>
                  {(allCompanies as any[]).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {contacts.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Contactpersoon (optioneel)</label>
              <Select value={form.contactId?.toString() || 'none'} onValueChange={v => set('contactId', v === 'none' ? null : parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Geen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen</SelectItem>
                  {contacts.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Datum *</label>
              <Input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Eigenaar</label>
              <Select value={form.owner} onValueChange={v => set('owner', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CRM_OWNERS.map(o => <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notitie (optioneel)</label>
            <Textarea value={form.note || ''} onChange={e => set('note', e.target.value)} rows={2} placeholder="Context..." />
          </div>
          {isEdit && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="completed">Afgerond</SelectItem>
                  <SelectItem value="overdue">Verlopen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.title.trim() || !form.companyId} className="bg-purple-600 hover:bg-purple-700">
            {isPending ? 'Opslaan...' : isEdit ? 'Opslaan' : 'Aanmaken'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Contact Form Modal ─────────────────────────────────────────────────────

function ContactFormModal({ open, onClose, companyId, contact }: {
  open: boolean; onClose: () => void; companyId: number; contact?: any;
}) {
  const isEdit = !!contact;
  const [form, setForm] = useState<any>(contact ? { ...contact, tags: contact.tags || [] } : { companyId, name: '', function: '', email: '', phone: '', linkedin: '', isPrimary: false, tags: [] });

  const { toast } = useToast();
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/crm/contacts', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] }); onClose(); },
    onError: (e: any) => toast({ title: 'Opslaan mislukt', description: e?.message || 'Onbekende fout', variant: 'destructive' }),
  });
  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/admin/crm/contacts/${contact.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] }); onClose(); },
    onError: (e: any) => toast({ title: 'Opslaan mislukt', description: e?.message || 'Onbekende fout', variant: 'destructive' }),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const buildPayload = () => ({
    name: (form.name || '').trim(),
    function: form.function?.trim() || null,
    email: form.email?.trim() || null,
    phone: form.phone?.trim() || null,
    linkedin: form.linkedin?.trim() || null,
    isPrimary: !!form.isPrimary,
    tags: Array.isArray(form.tags) ? form.tags : [],
  });
  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const payload = buildPayload();
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate({ ...payload, companyId });
  };
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? 'Contactpersoon bewerken' : 'Contactpersoon toevoegen'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Naam *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Volledige naam" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Functie</label>
              <Input value={form.function || ''} onChange={e => set('function', e.target.value)} placeholder="Manager, HR..." />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail</label>
              <Input value={form.email || ''} onChange={e => set('email', e.target.value)} type="email" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Telefoon</label>
              <Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+31..." />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">LinkedIn</label>
              <Input value={form.linkedin || ''} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Tags</label>
            <ContactTagsEditor values={form.tags || []} onChange={v => set('tags', v)} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!form.isPrimary} onChange={e => set('isPrimary', e.target.checked)} />
            Primaire contactpersoon
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.name.trim()} className="bg-purple-600 hover:bg-purple-700">
            {isPending ? 'Opslaan...' : isEdit ? 'Opslaan' : 'Toevoegen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Company Detail Drawer ──────────────────────────────────────────────────

function CrmCompanyDrawer({ companyId, onClose, allCompanies }: {
  companyId: number | null;
  onClose: () => void;
  allCompanies: any[];
}) {
  const [activeTab, setActiveTab] = useState('overzicht');
  const [editOpen, setEditOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [reminderFormOpen, setReminderFormOpen] = useState(false);
  const [editReminder, setEditReminder] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('note');
  const [noteOwner, setNoteOwner] = useState('max');
  const [noteLoading, setNoteLoading] = useState(false);

  const { data: company, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/crm/companies', companyId],
    queryFn: () => fetch(`/api/admin/crm/companies/${companyId}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!companyId,
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/crm/contacts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] }),
  });
  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/crm/notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] }),
  });
  const completeReminderMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/admin/crm/reminders/${id}`, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/reminders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] });
    },
  });
  const deleteReminderMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/crm/reminders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/reminders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] });
    },
  });
  const updatePhaseMutation = useMutation({
    mutationFn: ({ phase }: { phase: string }) => apiRequest('PATCH', `/api/admin/crm/companies/${companyId}`, { phase }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] });
    },
  });
  const deleteCompanyMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/admin/crm/companies/${companyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies'] });
      onClose();
    },
  });

  const addNote = async () => {
    if (!noteText.trim() || !companyId) return;
    setNoteLoading(true);
    try {
      await apiRequest('POST', '/api/admin/crm/notes', { companyId, owner: noteOwner, text: noteText, type: noteType });
      setNoteText('');
      await queryClient.refetchQueries({ queryKey: ['/api/admin/crm/companies', companyId] });
    } finally {
      setNoteLoading(false);
    }
  };

  const parentCompany = company?.parentCompanyId ? allCompanies.find((c: any) => c.id === company.parentCompanyId) : null;

  return (
    <Sheet open={!!companyId} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {isLoading || !company ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Laden...</div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b z-10 px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[company.type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[company.type] || company.type}
                    </span>
                    {company.isClient ? (
                      company.abc && <span className={`text-xs px-2 py-0.5 rounded-full ${ABC_COLORS[company.abc]}`}>{company.abc} klant</span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PHASE_COLORS[company.phase || 'nieuw']}`}>
                        {PHASE_LABELS[company.phase || 'nieuw']}
                      </span>
                    )}
                    {company.risk && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Risico</span>}
                    {company.attentionNeeded && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Aandacht</span>}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-1 truncate">{company.name}</h2>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                    {company.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{company.city}</span>}
                    {company.owner && <span className={`px-1.5 py-0.5 rounded-full ${OWNER_COLORS[company.owner]}`}>{company.owner.charAt(0).toUpperCase() + company.owner.slice(1)}</span>}
                    {parentCompany && <span className="text-gray-400">→ {parentCompany.name}</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-3 w-3" />Bewerken
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    disabled={deleteCompanyMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Weet je zeker dat je "${company.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
                        deleteCompanyMutation.mutate();
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />{deleteCompanyMutation.isPending ? 'Verwijderen...' : 'Verwijderen'}
                  </Button>
                </div>
              </div>
              {/* Quick phase change for prospects */}
              {!company.isClient && (
                <div className="mt-3">
                  <Select value={company.phase || 'nieuw'} onValueChange={v => updatePhaseMutation.mutate({ phase: v })}>
                    <SelectTrigger className="h-7 text-xs w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PHASE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="border-b px-6 bg-white sticky top-[84px] z-10">
                <TabsList className="h-9 bg-transparent gap-0 p-0 rounded-none">
                  {[
                    { id: 'overzicht', label: 'Overzicht' },
                    { id: 'contacten', label: `Contacten (${company.contacts?.length || 0})` },
                    { id: 'notities', label: `Notities (${company.noteEntries?.length || 0})` },
                    { id: 'reminders', label: `Reminders (${company.reminders?.filter((r: any) => r.status !== 'completed').length || 0})` },
                    { id: 'vestigingen', label: `Vestigingen (${company.subLocations?.length || 0})` },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`px-3 h-9 text-xs font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </TabsList>
              </div>

              <div className="p-6">
                {/* OVERZICHT */}
                {activeTab === 'overzicht' && (
                  <div className="space-y-4">
                    {/* Tags inline */}
                    <TagsInlineEditor companyId={companyId!} initialTags={company.tags || []} />
                    {/* Functies inline */}
                    <FunctionsInlineEditor companyId={companyId!} initialFunctions={company.functions || []} />
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Type', value: TYPE_LABELS[company.type] },
                        { label: 'Stad', value: company.city || '—' },
                        { label: 'Regio', value: company.region || '—' },
                        { label: 'Potentie', value: company.potential ? company.potential.charAt(0).toUpperCase() + company.potential.slice(1) : '—' },
                        { label: 'Bron', value: company.source ? company.source.charAt(0).toUpperCase() + company.source.slice(1) : '—' },
                        { label: 'Eigenaar', value: company.owner ? company.owner.charAt(0).toUpperCase() + company.owner.slice(1) : '—' },
                        ...(company.isClient ? [
                          { label: 'Account owner', value: company.accountOwner ? company.accountOwner.charAt(0).toUpperCase() + company.accountOwner.slice(1) : '—' },
                          { label: 'Drukke periodes', value: company.busyPeriods || '—' },
                        ] : []),
                        { label: 'Toegevoegd', value: formatDate(company.createdAt) },
                      ].map((row, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-0.5">{row.label}</p>
                          <p className="text-sm font-medium text-gray-800">{row.value}</p>
                        </div>
                      ))}
                    </div>
                    {(company.website || company.linkedin) && (
                      <div className="flex gap-2 flex-wrap">
                        {company.website && (
                          <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                            <Globe className="h-3 w-3" />Website
                          </a>
                        )}
                        {company.linkedin && (
                          <a href={company.linkedin.startsWith('http') ? company.linkedin : `https://${company.linkedin}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                            <Linkedin className="h-3 w-3" />LinkedIn
                          </a>
                        )}
                      </div>
                    )}
                    {company.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-amber-700 mb-1">Notities</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{company.notes}</p>
                      </div>
                    )}
                    {company.isClient && company.planningNotes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 mb-1">Planning</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{company.planningNotes}</p>
                      </div>
                    )}
                    {/* Performance placeholder */}
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                      <TrendingUp className="h-5 w-5 text-gray-300 mx-auto mb-1" />
                      <p className="text-xs text-gray-400 font-medium">Prestaties</p>
                      <p className="text-xs text-gray-400">Uren, omzet en medewerkers — beschikbaar na koppeling planningssysteem</p>
                    </div>
                  </div>
                )}

                {/* CONTACTEN */}
                {activeTab === 'contacten' && (
                  <div className="space-y-3">
                    <Button size="sm" className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => { setEditContact(null); setContactFormOpen(true); }}>
                      <Plus className="h-3.5 w-3.5" />Contactpersoon toevoegen
                    </Button>
                    {(company.contacts || []).length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">Nog geen contactpersonen</div>
                    ) : (
                      (company.contacts || []).map((c: any) => (
                        <div key={c.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-gray-900">{c.name}</span>
                                {c.isPrimary && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Star className="h-2.5 w-2.5" />Primair</span>}
                              </div>
                              {c.function && <p className="text-xs text-gray-500 mt-0.5">{c.function}</p>}
                              {c.tags && c.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {c.tags.map((t: string) => <ContactTagBadge key={t} value={t} />)}
                                </div>
                              )}
                              <div className="flex gap-3 mt-1.5 flex-wrap">
                                {c.email && <a href={`mailto:${c.email}`} className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><Mail className="h-3 w-3" />{c.email}</a>}
                                {c.phone && <a href={`tel:${c.phone}`} className="text-xs text-gray-600 flex items-center gap-1 hover:underline"><Phone className="h-3 w-3" />{c.phone}</a>}
                                {c.linkedin && <a href={c.linkedin.startsWith('http') ? c.linkedin : `https://${c.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><Linkedin className="h-3 w-3" />LinkedIn</a>}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditContact(c); setContactFormOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => deleteContactMutation.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {contactFormOpen && companyId && (
                      <ContactFormModal open={contactFormOpen} onClose={() => { setContactFormOpen(false); setEditContact(null); }} companyId={companyId} contact={editContact} />
                    )}
                  </div>
                )}

                {/* NOTITIES */}
                {activeTab === 'notities' && (
                  <div className="space-y-4">
                    {/* Add note form */}
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex gap-2 mb-2">
                        <Select value={noteType} onValueChange={setNoteType}>
                          <SelectTrigger className="h-7 text-xs w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(NOTE_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={noteOwner} onValueChange={setNoteOwner}>
                          <SelectTrigger className="h-7 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CRM_OWNERS.map(o => <SelectItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Notitie toevoegen..."
                        rows={2}
                        className="text-sm bg-white"
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote(); }}
                      />
                      <div className="flex justify-end mt-2">
                        <Button size="sm" onClick={addNote} disabled={noteLoading || !noteText.trim()} className="bg-purple-600 hover:bg-purple-700 text-xs h-7 gap-1.5">
                          <Plus className="h-3 w-3" />{noteLoading ? 'Opslaan...' : 'Toevoegen'}
                        </Button>
                      </div>
                    </div>
                    {/* Notes timeline */}
                    {(company.noteEntries || []).length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">Nog geen notities</div>
                    ) : (
                      <div className="space-y-2">
                        {(company.noteEntries || []).map((n: any) => {
                          const NoteIcon = NOTE_TYPE_ICONS[n.type] || AlignLeft;
                          return (
                            <div key={n.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                  <NoteIcon className="h-3 w-3 text-purple-600" />
                                </div>
                                <div className="flex-1 w-px bg-gray-200 mt-1 min-h-[12px]" />
                              </div>
                              <div className="flex-1 pb-3 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${OWNER_COLORS[n.owner] || 'bg-gray-100 text-gray-600'}`}>
                                    {n.owner?.charAt(0).toUpperCase() + (n.owner?.slice(1) || '')}
                                  </span>
                                  <span className="text-xs text-gray-400">{NOTE_TYPE_LABELS[n.type] || n.type}</span>
                                  <span className="text-xs text-gray-400 ml-auto">{formatDateTime(n.createdAt)}</span>
                                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-gray-300 hover:text-red-500" onClick={() => deleteNoteMutation.mutate(n.id)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* REMINDERS */}
                {activeTab === 'reminders' && companyId && (
                  <div className="space-y-3">
                    <Button size="sm" className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => { setEditReminder(null); setReminderFormOpen(true); }}>
                      <Plus className="h-3.5 w-3.5" />Reminder toevoegen
                    </Button>
                    {(company.reminders || []).length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">Geen reminders</div>
                    ) : (
                      (company.reminders || []).map((r: any) => {
                        const style = getReminderStyle(r.status, r.dueDate);
                        const label = getReminderLabel(r.status, r.dueDate);
                        return (
                          <div key={r.id} className={`border rounded-lg p-3 ${style.row} ${r.status === 'completed' ? 'opacity-60' : ''}`}>
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{label}</span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(r.dueDate)}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${OWNER_COLORS[r.owner] || 'bg-gray-100 text-gray-600'}`}>
                                    {r.owner?.charAt(0).toUpperCase() + (r.owner?.slice(1) || '')}
                                  </span>
                                </div>
                                <p className={`text-sm font-medium mt-1 ${r.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{r.title}</p>
                                {r.note && <p className="text-xs text-gray-500 mt-0.5">{r.note}</p>}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {r.status !== 'completed' && (
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-500 hover:text-green-700" title="Afronden" onClick={() => completeReminderMutation.mutate(r.id)}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditReminder(r); setReminderFormOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => deleteReminderMutation.mutate(r.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {reminderFormOpen && companyId && (
                      <ReminderFormModal
                        open={reminderFormOpen}
                        onClose={() => { setReminderFormOpen(false); setEditReminder(null); }}
                        companyId={companyId}
                        companyName={company.name}
                        contacts={company.contacts || []}
                        reminder={editReminder}
                      />
                    )}
                  </div>
                )}

                {/* VESTIGINGEN */}
                {activeTab === 'vestigingen' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">Vestigingen en sub-locaties gekoppeld aan {company.name}</p>
                    {(company.subLocations || []).length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        <Building2 className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                        Geen sub-locaties gevonden
                      </div>
                    ) : (
                      (company.subLocations || []).map((loc: any) => (
                        <div key={loc.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-gray-800">{loc.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_COLORS[loc.type]}`}>{TYPE_LABELS[loc.type]}</span>
                                {loc.city && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{loc.city}</span>}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Tabs>

            {editOpen && (
              <CompanyFormModal open={editOpen} onClose={() => setEditOpen(false)} company={company} allCompanies={allCompanies} />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Inline Type Editor ─────────────────────────────────────────────────────

function InlineTypeEditor({ companyId, value }: { companyId: number; value: string }) {
  const mutation = useMutation({
    mutationFn: (type: string) => apiRequest('PATCH', `/api/admin/crm/companies/${companyId}`, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies', companyId] });
    },
  });
  return (
    <Select value={value} onValueChange={v => mutation.mutate(v)}>
      <SelectTrigger
        className={`h-6 text-xs px-2 py-0 rounded-full border-0 font-medium w-auto gap-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-50 ${TYPE_COLORS[value] || 'bg-gray-100 text-gray-600'}`}
      >
        <SelectValue>{TYPE_LABELS[value] || value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ── Company Row ────────────────────────────────────────────────────────────

function LeadRow({ company, onClick }: { company: any; onClick: () => void }) {
  const openReminders = (company.reminders || []).filter((r: any) => r.status !== 'completed').length;
  const functions: string[] = company.functions || [];
  return (
    <tr onClick={onClick} className="hover:bg-purple-50/30 cursor-pointer transition-colors border-b border-gray-100 last:border-0">
      {/* Bedrijf + Locatie */}
      <td className="py-2.5 px-3">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{company.name}</p>
            {(company.city || company.region) && (
              <p className="text-xs text-gray-400 flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {[company.city, company.region].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      </td>
      {/* Type */}
      <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
        <InlineTypeEditor companyId={company.id} value={company.type} />
      </td>
      {/* Functies */}
      <td className="py-2.5 px-3">
        {functions.length === 0 ? (
          <span className="text-xs text-gray-300">—</span>
        ) : (
          <span className="text-xs text-gray-600">
            {functions.slice(0, 3).map(f => FUNCTION_LABELS[f] || f).join(', ')}
            {functions.length > 3 && <span className="text-gray-400"> +{functions.length - 3}</span>}
          </span>
        )}
      </td>
      {/* Fase */}
      <td className="py-2.5 px-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${PHASE_COLORS[company.phase || 'nieuw']}`}>
          {PHASE_LABELS[company.phase || 'nieuw']}
        </span>
      </td>
      {/* Eigenaar */}
      <td className="py-2.5 px-3">
        {company.owner ? (
          <span className="text-xs text-gray-700">
            {company.owner.charAt(0).toUpperCase() + company.owner.slice(1)}
          </span>
        ) : <span className="text-xs text-gray-300">—</span>}
      </td>
      {/* Potentie */}
      <td className="py-2.5 px-3">
        {company.potential ? (
          <span className="text-xs text-gray-600 capitalize">{company.potential}</span>
        ) : <span className="text-xs text-gray-300">—</span>}
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1">
          {openReminders > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">{openReminders}</span>
          )}
          {company.risk && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
          {company.attentionNeeded && <AlertCircle className="h-3.5 w-3.5 text-orange-400" />}
          <ChevronRight className="h-4 w-4 text-gray-300 ml-1" />
        </div>
      </td>
    </tr>
  );
}

function CompanyRow({ company, onClick, showAbc = false }: { company: any; onClick: () => void; showAbc?: boolean }) {
  const openReminders = (company.reminders || []).filter((r: any) => r.status !== 'completed').length;
  const tags: string[] = company.tags || [];
  return (
    <tr onClick={onClick} className="hover:bg-purple-50/30 cursor-pointer transition-colors border-b border-gray-100 last:border-0">
      <td className="py-2.5 px-3">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">{company.name}</p>
            {company.city && <p className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{company.city}</p>}
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[company.type] || 'bg-gray-100 text-gray-600'}`}>{TYPE_LABELS[company.type] || company.type}</span>
      </td>
      <td className="py-2.5 px-3">
        {showAbc ? (
          company.abc ? <span className={`text-xs px-2 py-0.5 rounded-full ${ABC_COLORS[company.abc]}`}>{company.abc}</span> : <span className="text-xs text-gray-300">—</span>
        ) : (
          <span className={`text-xs px-2 py-0.5 rounded-full ${PHASE_COLORS[company.phase || 'nieuw']}`}>{PHASE_LABELS[company.phase || 'nieuw']}</span>
        )}
      </td>
      {/* Tags column */}
      <td className="py-2.5 px-3">
        <div className="flex flex-wrap gap-1">
          {tags.length === 0
            ? <span className="text-xs text-gray-300">—</span>
            : tags.slice(0, 2).map(tag => <TagBadge key={tag} tag={tag} />)
          }
          {tags.length > 2 && <span className="text-xs text-gray-400">+{tags.length - 2}</span>}
        </div>
      </td>
      <td className="py-2.5 px-3">
        {company.owner ? (
          <span className={`text-xs px-2 py-0.5 rounded-full ${OWNER_COLORS[company.owner]}`}>{company.owner.charAt(0).toUpperCase() + company.owner.slice(1)}</span>
        ) : <span className="text-xs text-gray-300">—</span>}
      </td>
      <td className="py-2.5 px-3">
        {company.potential ? (
          <span className="text-xs text-gray-600 capitalize">{company.potential}</span>
        ) : <span className="text-xs text-gray-300">—</span>}
      </td>
      <td className="py-2.5 px-3">
        <span className="text-xs text-gray-400">{formatDate(company.createdAt)}</span>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1">
          {openReminders > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">{openReminders}</span>
          )}
          {company.risk && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
          {company.attentionNeeded && <AlertCircle className="h-3.5 w-3.5 text-orange-400" />}
          <ChevronRight className="h-4 w-4 text-gray-300 ml-1" />
        </div>
      </td>
    </tr>
  );
}

// ── CRM Leads Tab ──────────────────────────────────────────────────────────

export function CrmLeadsTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('alle');
  const [phaseFilter, setPhaseFilter] = useState('alle');
  const [ownerFilter, setOwnerFilter] = useState('alle');
  const [potentialFilter, setPotentialFilter] = useState('alle');
  const [tagFilter, setTagFilter] = useState('alle');
  const [functionFilter, setFunctionFilter] = useState('alle');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Doorklik vanuit Reminders: open direct het meegegeven bedrijf.
  useEffect(() => {
    const id = sessionStorage.getItem('crmOpenCompanyId');
    if (id) { sessionStorage.removeItem('crmOpenCompanyId'); setSelectedId(Number(id)); }
  }, []);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: companies = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/admin/crm/companies', 'prospects'],
    queryFn: () => fetch('/api/admin/crm/companies?isClient=false', { credentials: 'include' }).then(r => r.json()),
  });

  const dedupeMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/crm/companies/dedupe', {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/companies'] });
      toast({
        title: 'Opschonen voltooid',
        description: data?.removedCount > 0
          ? `${data.removedCount} dubbel(e) bedrijf/bedrijven verwijderd uit ${data.groupsFound} groep(en).`
          : 'Geen dubbele bedrijven gevonden.',
      });
    },
    onError: (e: any) => {
      toast({ title: 'Opschonen mislukt', description: e?.message || 'Onbekende fout', variant: 'destructive' });
    },
  });

  const filtered = useMemo(() => companies.filter((c: any) => {
    if (typeFilter !== 'alle' && c.type !== typeFilter) return false;
    if (phaseFilter !== 'alle' && c.phase !== phaseFilter) return false;
    if (ownerFilter !== 'alle' && c.owner !== ownerFilter) return false;
    if (potentialFilter !== 'alle' && c.potential !== potentialFilter) return false;
    if (tagFilter !== 'alle' && !(c.tags || []).includes(tagFilter)) return false;
    if (functionFilter !== 'alle' && !(c.functions || []).includes(functionFilter)) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.name?.toLowerCase().includes(s) || c.city?.toLowerCase().includes(s) || c.region?.toLowerCase().includes(s);
    }
    return true;
  }), [companies, typeFilter, phaseFilter, ownerFilter, potentialFilter, tagFilter, functionFilter, search]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leads & Prospects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} van {companies.length} bedrijven</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => refetch()}><RefreshCw className="h-3.5 w-3.5" />Vernieuwen</Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            disabled={dedupeMutation.isPending}
            onClick={() => {
              if (window.confirm('Dubbele bedrijven worden samengevoegd op basis van naam + stad. De oudste blijft behouden, de rest wordt verwijderd. Doorgaan?')) {
                dedupeMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />{dedupeMutation.isPending ? 'Bezig...' : 'Opschonen'}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5" />Importeren
          </Button>
          <Button size="sm" className="gap-1.5 text-xs h-8 bg-purple-600 hover:bg-purple-700" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />Nieuw bedrijf
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek op naam, stad..." className="pl-8 h-8 text-xs" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
        </div>
        {[
          { value: typeFilter, onChange: setTypeFilter, placeholder: 'Type', options: [['alle', 'Alle typen'], ...Object.entries(TYPE_LABELS)] },
          { value: functionFilter, onChange: setFunctionFilter, placeholder: 'Functie', options: [['alle', 'Alle functies'], ...FUNCTION_TAGS.map(f => [f.value, f.label])] },
          { value: phaseFilter, onChange: setPhaseFilter, placeholder: 'Fase', options: [['alle', 'Alle fases'], ...Object.entries(PHASE_LABELS)] },
          { value: ownerFilter, onChange: setOwnerFilter, placeholder: 'Eigenaar', options: [['alle', 'Alle eigenaren'], ...CRM_OWNERS.map(o => [o, o.charAt(0).toUpperCase() + o.slice(1)])] },
          { value: potentialFilter, onChange: setPotentialFilter, placeholder: 'Potentie', options: [['alle', 'Alle potentie'], ['laag', 'Laag'], ['midden', 'Midden'], ['hoog', 'Hoog']] },
          { value: tagFilter, onChange: setTagFilter, placeholder: 'Tag', options: [['alle', 'Alle tags'], ...CRM_TAGS.map(t => [t, t])] },
        ].map((f, i) => (
          <Select key={i} value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-[120px]"><SelectValue placeholder={f.placeholder} /></SelectTrigger>
            <SelectContent>
              {f.options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
        {(typeFilter !== 'alle' || phaseFilter !== 'alle' || ownerFilter !== 'alle' || potentialFilter !== 'alle' || tagFilter !== 'alle' || functionFilter !== 'alle' || search) && (
          <button className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1" onClick={() => { setTypeFilter('alle'); setPhaseFilter('alle'); setOwnerFilter('alle'); setPotentialFilter('alle'); setTagFilter('alle'); setFunctionFilter('alle'); setSearch(''); }}>
            <X className="h-3 w-3" />Wis filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm"><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Building2 className="h-10 w-10 mb-3 text-gray-200" />
            <p className="text-sm font-medium">Geen bedrijven gevonden</p>
            <p className="text-xs mt-1">Voeg een nieuw bedrijf toe of pas de filters aan</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Bedrijf', 'Type', 'Functies', 'Fase', 'Eigenaar', 'Potentie', ''].map((h, i) => (
                  <th key={i} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <LeadRow key={c.id} company={c} onClick={() => setSelectedId(c.id)} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedId && <CrmCompanyDrawer companyId={selectedId} onClose={() => setSelectedId(null)} allCompanies={companies} />}
      {addOpen && <CompanyFormModal open={addOpen} onClose={() => setAddOpen(false)} allCompanies={companies} defaultIsClient={false} />}
      <ImportClientsDialog open={importOpen} onOpenChange={setImportOpen} defaultIsClient={false} />
    </div>
  );
}

// ── CRM Klanten Tab ────────────────────────────────────────────────────────

export function CrmKlantenTab() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('alle');
  const [abcFilter, setAbcFilter] = useState('alle');
  const [ownerFilter, setOwnerFilter] = useState('alle');
  const [potentialFilter, setPotentialFilter] = useState('alle');
  const [attentionFilter, setAttentionFilter] = useState('alle');
  const [tagFilter, setTagFilter] = useState('alle');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: companies = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/admin/crm/companies', 'klanten'],
    queryFn: () => fetch('/api/admin/crm/companies?isClient=true', { credentials: 'include' }).then(r => r.json()),
  });

  const filtered = useMemo(() => companies.filter((c: any) => {
    if (typeFilter !== 'alle' && c.type !== typeFilter) return false;
    if (abcFilter !== 'alle' && c.abc !== abcFilter) return false;
    if (ownerFilter !== 'alle' && (c.owner !== ownerFilter && c.accountOwner !== ownerFilter)) return false;
    if (potentialFilter !== 'alle' && c.potential !== potentialFilter) return false;
    if (attentionFilter === 'aandacht' && !c.attentionNeeded) return false;
    if (attentionFilter === 'risico' && !c.risk) return false;
    if (tagFilter !== 'alle' && !(c.tags || []).includes(tagFilter)) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.name?.toLowerCase().includes(s) || c.city?.toLowerCase().includes(s) || c.region?.toLowerCase().includes(s);
    }
    return true;
  }), [companies, typeFilter, abcFilter, ownerFilter, potentialFilter, attentionFilter, tagFilter, search]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bestaande klanten</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} van {companies.length} klanten</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => refetch()}><RefreshCw className="h-3.5 w-3.5" />Vernieuwen</Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5" />Importeren
          </Button>
          <Button size="sm" className="gap-1.5 text-xs h-8 bg-purple-600 hover:bg-purple-700" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />Klant toevoegen
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek op naam, stad..." className="pl-8 h-8 text-xs" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X className="h-3.5 w-3.5" /></button>}
        </div>
        {[
          { value: typeFilter, onChange: setTypeFilter, options: [['alle', 'Alle typen'], ...Object.entries(TYPE_LABELS)] },
          { value: abcFilter, onChange: setAbcFilter, options: [['alle', 'Alle klassen'], ['A', 'A klant'], ['B', 'B klant'], ['C', 'C klant']] },
          { value: ownerFilter, onChange: setOwnerFilter, options: [['alle', 'Alle eigenaren'], ...CRM_OWNERS.map(o => [o, o.charAt(0).toUpperCase() + o.slice(1)])] },
          { value: potentialFilter, onChange: setPotentialFilter, options: [['alle', 'Alle potentie'], ['laag', 'Laag'], ['midden', 'Midden'], ['hoog', 'Hoog']] },
          { value: attentionFilter, onChange: setAttentionFilter, options: [['alle', 'Alle statussen'], ['aandacht', 'Aandacht nodig'], ['risico', 'Risico']] },
          { value: tagFilter, onChange: setTagFilter, options: [['alle', 'Alle tags'], ...CRM_TAGS.map(t => [t, t])] },
        ].map((f, i) => (
          <Select key={i} value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {f.options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
        {(typeFilter !== 'alle' || abcFilter !== 'alle' || ownerFilter !== 'alle' || potentialFilter !== 'alle' || attentionFilter !== 'alle' || tagFilter !== 'alle' || search) && (
          <button className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1" onClick={() => { setTypeFilter('alle'); setAbcFilter('alle'); setOwnerFilter('alle'); setPotentialFilter('alle'); setAttentionFilter('alle'); setTagFilter('alle'); setSearch(''); }}>
            <X className="h-3 w-3" />Wis filters
          </button>
        )}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm"><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Building2 className="h-10 w-10 mb-3 text-gray-200" />
            <p className="text-sm font-medium">Geen klanten gevonden</p>
            <p className="text-xs mt-1">Voeg een klant toe of pas de filters aan</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Bedrijf', 'Type', 'Klasse', 'Tags', 'Eigenaar', 'Potentie', 'Toegevoegd', ''].map((h, i) => (
                  <th key={i} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <CompanyRow key={c.id} company={c} onClick={() => setSelectedId(c.id)} showAbc />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedId && <CrmCompanyDrawer companyId={selectedId} onClose={() => setSelectedId(null)} allCompanies={companies} />}
      {addOpen && <CompanyFormModal open={addOpen} onClose={() => setAddOpen(false)} allCompanies={companies} defaultIsClient={true} />}
      <ImportClientsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

// ── CRM Reminders Tab ──────────────────────────────────────────────────────

export function CrmRemindersTab({ onOpenCompany }: { onOpenCompany?: (companyId: number) => void } = {}) {
  const [ownerFilter, setOwnerFilter] = useState('alle');
  const [statusFilter, setStatusFilter] = useState('open'); // open | overdue | today | completed
  const [addOpen, setAddOpen] = useState(false);
  const [editReminder, setEditReminder] = useState<any>(null);
  const [bevestigVerwijder, setBevestigVerwijder] = useState<number | null>(null);

  // Defensief: geeft de server iets anders terug dan een lijst (bv. oude
  // servercode of een foutobject), dan vallen we terug op een lege lijst.
  const { data: remindersData, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/crm/reminders'],
    queryFn: () => fetch('/api/admin/crm/reminders', { credentials: 'include' }).then(r => r.json()).catch(() => []),
    refetchInterval: 60000,
  });
  const reminders = Array.isArray(remindersData) ? remindersData : [];
  // Eigenaren volgen automatisch de admin-accounts (zelfde bron als Salesflow).
  const { data: ownersData } = useQuery<{ id: number; naam: string; email: string }[]>({
    queryKey: ['/api/sales/flow/owners'],
    queryFn: () => fetch('/api/sales/flow/owners', { credentials: 'include' }).then(r => r.ok ? r.json() : []).catch(() => []),
    staleTime: 300000,
  });
  const owners = Array.isArray(ownersData) ? ownersData : [];
  const ownerOpties: [string, string][] = owners.length > 0
    ? owners.map(o => [o.email.split('@')[0].toLowerCase(), o.naam] as [string, string])
    : CRM_OWNERS.map(o => [o, o.charAt(0).toUpperCase() + o.slice(1)] as [string, string]);

  const filtered = useMemo(() => reminders.filter((r: any) => {
    if (ownerFilter !== 'alle' && r.owner !== ownerFilter) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (statusFilter === 'open' && r.status === 'completed') return false;
    if (statusFilter === 'overdue' && (r.status === 'completed' || r.dueDate >= today)) return false;
    if (statusFilter === 'today' && (r.status === 'completed' || r.dueDate !== today)) return false;
    if (statusFilter === 'completed' && r.status !== 'completed') return false;
    return true;
  }), [reminders, ownerFilter, statusFilter]);

  const completeReminderMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/admin/crm/reminders/${id}`, { status: 'completed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/reminders'] }),
  });
  const deleteReminderMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/crm/reminders/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/reminders'] }); setBevestigVerwijder(null); },
  });
  // Uitstellen: nieuwe datum = vandaag + N dagen; status terug naar open.
  const snoozeMutation = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) => {
      const d = new Date(); d.setDate(d.getDate() + days);
      return apiRequest('PATCH', `/api/admin/crm/reminders/${id}`, { dueDate: d.toISOString().slice(0, 10), status: 'open' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/crm/reminders'] }),
  });

  const today = new Date().toISOString().slice(0, 10);
  const overdue = reminders.filter((r: any) => r.status !== 'completed' && r.dueDate < today).length;
  const dueToday = reminders.filter((r: any) => r.status !== 'completed' && r.dueDate === today).length;
  const upcoming = reminders.filter((r: any) => r.status !== 'completed' && r.dueDate > today).length;
  const completed = reminders.filter((r: any) => r.status === 'completed').length;

  // Tijdsgroepen: Verlopen · Vandaag · Morgen · Deze week · Later (afgerond = platte lijst)
  const groepen = useMemo(() => {
    if (statusFilter === 'completed') return [{ titel: null as string | null, items: filtered }];
    const morgenD = new Date(); morgenD.setDate(morgenD.getDate() + 1);
    const morgen = morgenD.toISOString().slice(0, 10);
    // Einde van de week = aankomende zondag.
    const zondagD = new Date(); zondagD.setDate(zondagD.getDate() + ((7 - zondagD.getDay()) % 7));
    const zondag = zondagD.toISOString().slice(0, 10);
    const m: Record<string, any[]> = { Verlopen: [], Vandaag: [], Morgen: [], 'Deze week': [], Later: [] };
    for (const r of filtered) {
      if (r.dueDate < today) m['Verlopen'].push(r);
      else if (r.dueDate === today) m['Vandaag'].push(r);
      else if (r.dueDate === morgen) m['Morgen'].push(r);
      else if (r.dueDate <= zondag) m['Deze week'].push(r);
      else m['Later'].push(r);
    }
    return Object.entries(m).filter(([, items]) => items.length > 0).map(([titel, items]) => ({ titel: titel as string | null, items }));
  }, [filtered, statusFilter, today]);

  const tegels = [
    { label: 'Verlopen', count: overdue, actiefKleur: 'bg-red-50 border-red-200', cijferKleur: 'text-red-700', filter: 'overdue' },
    { label: 'Vandaag', count: dueToday, actiefKleur: 'bg-orange-50 border-orange-200', cijferKleur: 'text-orange-700', filter: 'today' },
    { label: 'Gepland', count: upcoming, actiefKleur: 'bg-blue-50 border-blue-200', cijferKleur: 'text-blue-700', filter: 'open' },
    { label: 'Afgerond', count: completed, actiefKleur: 'bg-green-50 border-green-200', cijferKleur: 'text-green-700', filter: 'completed' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reminders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} {filtered.length === 1 ? 'reminder' : 'reminders'}</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8 bg-purple-600 hover:bg-purple-700" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />Nieuwe reminder
        </Button>
      </div>

      {/* Statustegels = filter. Kleur alleen als er iets te melden is (teller > 0). */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {tegels.map((t) => (
          <button key={t.filter} onClick={() => setStatusFilter(statusFilter === t.filter && t.filter !== 'open' ? 'open' : t.filter)}
            className={`border rounded-xl p-3 text-left transition-all hover:shadow-sm ${t.count > 0 ? t.actiefKleur : 'bg-white border-gray-200'} ${statusFilter === t.filter ? 'ring-2 ring-purple-400' : ''}`}>
            <p className={`text-2xl font-bold ${t.count > 0 ? t.cijferKleur : 'text-gray-300'}`}>{t.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t.label}</p>
          </button>
        ))}
      </div>

      {/* Eigenaar-filter (status gaat via de tegels) */}
      <div className="flex gap-2 mb-4">
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="h-8 text-xs w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle eigenaren</SelectItem>
            {ownerOpties.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lijst, gegroepeerd op tijd */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm"><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell className="h-10 w-10 mb-3 text-gray-200" />
            <p className="text-sm font-medium">Geen reminders in deze weergave</p>
            <p className="text-xs mt-1">Reminders ontstaan automatisch vanuit de Salesflow, of maak er zelf één aan.</p>
          </div>
        ) : (
          groepen.map(groep => (
            <div key={groep.titel ?? 'alles'}>
              {groep.titel && (
                <p className={`text-[11px] font-semibold uppercase tracking-wide mt-4 mb-1.5 ${groep.titel === 'Verlopen' ? 'text-red-500' : 'text-gray-400'}`}>
                  {groep.titel} <span className="font-normal">({groep.items.length})</span>
                </p>
              )}
              <div className="space-y-2">
                {groep.items.map((r: any) => {
                  const style = getReminderStyle(r.status, r.dueDate);
                  const label = getReminderLabel(r.status, r.dueDate);
                  return (
                    <div key={r.id} className={`border rounded-xl p-3.5 bg-white ${style.row} ${r.status === 'completed' ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{label}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(r.dueDate)}</span>
                            {r.viaSalesflow && <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">Salesflow</span>}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ml-auto ${OWNER_COLORS[r.owner] || 'bg-gray-100'}`}>
                              {r.owner?.charAt(0).toUpperCase() + (r.owner?.slice(1) || '')}
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${r.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{r.title}</p>
                          {r.companyName && (
                            <button onClick={() => onOpenCompany?.(r.companyId)} title="Open bedrijf"
                              className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 hover:text-purple-700 hover:underline">
                              <Building2 className="h-3 w-3" />{r.companyName}
                            </button>
                          )}
                          {r.note && r.note !== r.companyName && <p className="text-xs text-gray-500 mt-0.5">{r.note}</p>}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {r.status !== 'completed' && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 px-1.5 text-[11px] text-gray-400 hover:text-gray-700" title="Uitstellen naar morgen" onClick={() => snoozeMutation.mutate({ id: r.id, days: 1 })}>+1d</Button>
                              <Button size="sm" variant="ghost" className="h-7 px-1.5 text-[11px] text-gray-400 hover:text-gray-700" title="Uitstellen met een week" onClick={() => snoozeMutation.mutate({ id: r.id, days: 7 })}>+1w</Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-500 hover:text-green-700" title="Afronden" onClick={() => completeReminderMutation.mutate(r.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Bewerken" onClick={() => setEditReminder(r)}><Pencil className="h-3 w-3" /></Button>
                          {bevestigVerwijder === r.id ? (
                            <Button size="sm" variant="ghost" className="h-7 px-1.5 text-[11px] font-semibold text-red-600 hover:text-red-700" title="Klik om definitief te verwijderen"
                              onClick={() => deleteReminderMutation.mutate(r.id)}>Zeker?</Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-1 text-red-400 hover:text-red-600" title="Verwijderen"
                              onClick={() => { setBevestigVerwijder(r.id); setTimeout(() => setBevestigVerwijder(v => v === r.id ? null : v), 3000); }}><Trash2 className="h-3 w-3" /></Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {addOpen && <ReminderFormModal open={addOpen} onClose={() => setAddOpen(false)} />}
      {editReminder && <ReminderFormModal open={!!editReminder} onClose={() => setEditReminder(null)} reminder={editReminder} companyId={editReminder.companyId} />}
    </div>
  );
}

// ── CRM Dashboard Widgets ──────────────────────────────────────────────────

export function CrmDashboardWidgets() {
  const { data: reminders = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/crm/reminders'],
    queryFn: () => fetch('/api/admin/crm/reminders', { credentials: 'include' }).then(r => r.json()),
    staleTime: 60000,
  });
  const { data: prospects = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/crm/companies', 'prospects'],
    queryFn: () => fetch('/api/admin/crm/companies?isClient=false', { credentials: 'include' }).then(r => r.json()),
    staleTime: 60000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const overdueReminders = reminders.filter(r => r.status !== 'completed' && r.dueDate < today);
  const todayReminders = reminders.filter(r => r.status !== 'completed' && r.dueDate === today);
  const recentLeads = prospects.filter(c => {
    const d = new Date(c.createdAt);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d > sevenDaysAgo;
  });

  if (overdueReminders.length === 0 && todayReminders.length === 0 && recentLeads.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {overdueReminders.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />Verlopen reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-red-700">{overdueReminders.length}</p>
            <div className="space-y-1 mt-1">
              {overdueReminders.slice(0, 2).map(r => (
                <p key={r.id} className="text-xs text-red-600 truncate">• {r.title} {r.companyName && `— ${r.companyName}`}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {todayReminders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5" />Reminders vandaag
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-orange-700">{todayReminders.length}</p>
            <div className="space-y-1 mt-1">
              {todayReminders.slice(0, 2).map(r => (
                <p key={r.id} className="text-xs text-orange-600 truncate">• {r.title} {r.companyName && `— ${r.companyName}`}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {recentLeads.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />Nieuwe leads (7d)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-blue-700">{recentLeads.length}</p>
            <div className="space-y-1 mt-1">
              {recentLeads.slice(0, 2).map(c => (
                <p key={c.id} className="text-xs text-blue-600 truncate">• {c.name}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
