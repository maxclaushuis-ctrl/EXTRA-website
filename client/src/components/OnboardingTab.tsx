import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Plus, Trash2, Copy, Star, FileText, Eye, RotateCcw, Upload, Download,
  Mail, Paperclip, Save, CheckCircle2, AlertCircle, X, GripVertical, Monitor, Smartphone,
} from 'lucide-react';
import type { OnboardingTemplate, OnboardingBijlage, OnboardingTemplateMetBijlagen } from '@shared/schema';
import OnboardingEmailBuilder, { migreerNaarBuilderContent } from '@/components/OnboardingEmailBuilder';
import type { BuilderContent } from '@/components/EmailBuilderPage';

const PERSONALISATIE_TAGS = [
  { tag: '{{voornaam}}', uitleg: 'Voornaam medewerker' },
  { tag: '{{achternaam}}', uitleg: 'Achternaam medewerker' },
  { tag: '{{naam}}', uitleg: 'Volledige naam' },
  { tag: '{{functie}}', uitleg: 'Functie, bijv. "housekeeping"' },
  { tag: '{{opdrachtgever}}', uitleg: 'Opdrachtgever, bijv. "Budbee"' },
  { tag: '{{startdatum}}', uitleg: 'Startdatum, bijv. "14 april 2026"' },
];

const FUNCTIE_OPTIES = ['housekeeping', 'horeca', 'logistiek', 'evenementen', 'overig'];

function formatBytes(b?: number | null) {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function blokkenNaarTekst(content?: string | null): string {
  if (!content) return '';
  try {
    const json = JSON.parse(content);
    if (json?.blokken && Array.isArray(json.blokken)) {
      return json.blokken.map((b: any) => b.content || '').join('\n\n');
    }
  } catch {}
  return content;
}

function tekstNaarBlokken(tekst: string): string {
  return JSON.stringify({
    blokken: tekst.split(/\n{2,}/).filter(s => s.trim()).map(content => ({ type: 'tekst', content })),
  });
}

export default function OnboardingTab() {
  const [activeTab, setActiveTab] = useState<'templates' | 'bijlagen' | 'statistieken'>('templates');

  return (
    <div className="overflow-auto bg-gray-50" style={{ height: 'calc(100vh - 57px)' }}>
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
        </div>
        <div className="flex gap-1">
          {[
            { id: 'templates', label: 'Templates' },
            { id: 'bijlagen', label: 'Bijlagen' },
            { id: 'statistieken', label: 'Statistieken' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              data-testid={`tab-${t.id}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === t.id
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'bijlagen' && <BijlagenTab />}
        {activeTab === 'statistieken' && <StatistiekenTab />}
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATES TAB
// ============================================================================

function TemplatesTab() {
  const { toast } = useToast();
  const [filterTaal, setFilterTaal] = useState<string>('alles');
  const [filterFunctie, setFilterFunctie] = useState<string>('alles');
  const [filterOpdrachtgever, setFilterOpdrachtgever] = useState<string>('alles');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: templates = [], isLoading } = useQuery<OnboardingTemplate[]>({
    queryKey: ['/api/onboarding/templates'],
  });

  const opdrachtgeverOpties = useMemo(
    () => Array.from(new Set(templates.map(t => t.opdrachtgever).filter(Boolean))) as string[],
    [templates]
  );

  const filtered = templates.filter(t => {
    if (filterTaal !== 'alles' && t.taal !== filterTaal) return false;
    if (filterFunctie !== 'alles' && t.functiegroep !== filterFunctie) return false;
    if (filterOpdrachtgever !== 'alles' && t.opdrachtgever !== filterOpdrachtgever) return false;
    return true;
  });

  useEffect(() => {
    if (selectedId === null && filtered.length > 0) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '300px 1fr' }}>
      {/* Linker paneel: lijst */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 h-fit">
        <Button
          onClick={() => setShowCreate(true)}
          className="w-full mb-3 bg-purple-600 hover:bg-purple-700"
          data-testid="button-nieuwe-template"
        >
          <Plus className="h-4 w-4 mr-2" /> Nieuwe template
        </Button>

        <div className="space-y-2 mb-3">
          <Select value={filterTaal} onValueChange={setFilterTaal}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alles">Alle talen</SelectItem>
              <SelectItem value="Nederlands">Nederlands</SelectItem>
              <SelectItem value="Engels">Engels</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterFunctie} onValueChange={setFilterFunctie}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alles">Alle functies</SelectItem>
              {FUNCTIE_OPTIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          {opdrachtgeverOpties.length > 0 && (
            <Select value={filterOpdrachtgever} onValueChange={setFilterOpdrachtgever}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alles">Alle opdrachtgevers</SelectItem>
                {opdrachtgeverOpties.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-1 max-h-[calc(100vh-340px)] overflow-y-auto">
          {isLoading && <div className="text-sm text-gray-400 p-2">Laden...</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="text-sm text-gray-400 p-2">Geen templates gevonden</div>
          )}
          {filtered.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              data-testid={`template-item-${t.id}`}
              className={`w-full text-left p-2 rounded-md border transition-colors ${
                selectedId === t.id
                  ? 'bg-purple-50 border-purple-300'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold text-sm text-gray-900 break-words flex-1">
                  {t.naam}
                </div>
                {t.isStandaard && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 rounded-full">
                  {t.taal === 'Nederlands' ? 'NL' : 'EN'}
                </Badge>
                {!t.actief && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 rounded-full bg-gray-100 text-gray-500">
                    inactief
                  </Badge>
                )}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {t.functiegroep || 'Alle functies'} · {t.opdrachtgever || 'Alle opdrachtgevers'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Rechter paneel: detail */}
      <div>
        {selectedId ? (
          <TemplateDetail templateId={selectedId} onDeleted={() => setSelectedId(null)} onDuplicated={(id) => setSelectedId(id)} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-400">
            Selecteer een template links of maak een nieuwe aan
          </div>
        )}
      </div>

      <NieuweTemplateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => { setSelectedId(id); setShowCreate(false); }}
      />
    </div>
  );
}

function TemplateDetail({ templateId, onDeleted, onDuplicated }: { templateId: number; onDeleted: () => void; onDuplicated?: (newId: number) => void }) {
  const { toast } = useToast();
  const { data: tpl, isLoading } = useQuery<OnboardingTemplateMetBijlagen>({
    queryKey: ['/api/onboarding/templates', templateId],
    queryFn: () => apiRequest(`/api/onboarding/templates/${templateId}`) as Promise<OnboardingTemplateMetBijlagen>,
  });

  const [form, setForm] = useState<any>(null);
  const [builderContent, setBuilderContent] = useState<BuilderContent | null>(null);
  const [showBijlagePicker, setShowBijlagePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVoorvertoning, setShowVoorvertoning] = useState(false);
  const [showTestmail, setShowTestmail] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const bijlagenSectionRef = useRef<HTMLDivElement | null>(null);
  const [bijlagenFlash, setBijlagenFlash] = useState(false);
  const [verwijderdeKoppelingen, setVerwijderdeKoppelingen] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (tpl) {
      setForm({
        naam: tpl.naam,
        taal: tpl.taal,
        functiegroep: tpl.functiegroep || '',
        opdrachtgever: tpl.opdrachtgever || '',
        onderwerp: tpl.onderwerp,
        isStandaard: tpl.isStandaard,
        actief: tpl.actief,
      });
      setBuilderContent(migreerNaarBuilderContent(tpl.content));
    }
  }, [tpl]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/onboarding/templates/${templateId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates', templateId] });
      setSavedAt(new Date());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/onboarding/templates/${templateId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates'] });
      toast({ title: 'Template verwijderd' });
      onDeleted();
    },
  });

  const dupliceerMutation = useMutation({
    mutationFn: (naam: string) => apiRequest('POST', '/api/onboarding/templates', {
      naam: naam.trim() || `${form.naam} (kopie)`,
      taal: form.taal,
      functiegroep: form.functiegroep || null,
      opdrachtgever: form.opdrachtgever || null,
      onderwerp: form.onderwerp,
      content: builderContent ? JSON.stringify(builderContent) : '',
      isStandaard: false,
      actief: form.actief,
    }),
    onSuccess: (nieuw: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates'] });
      toast({ title: `Template '${nieuw?.naam}' aangemaakt ✓` });
      setShowDuplicateDialog(false);
      if (nieuw?.id) onDuplicated?.(nieuw.id);
    },
    onError: (e: any) => toast({ title: 'Dupliceren mislukt', description: e?.message, variant: 'destructive' }),
  });

  const openDuplicateDialog = () => {
    setDuplicateName(`${form.naam} (kopie)`);
    setShowDuplicateDialog(true);
  };

  const ontkoppelMutation = useMutation({
    mutationFn: (koppelingId: number) => apiRequest('DELETE', `/api/onboarding/template-bijlagen/${koppelingId}`),
    onMutate: async (koppelingId: number) => {
      // 1) Direct uit UI verwijderen via lokale state — geen wachten op cache of server
      setVerwijderdeKoppelingen(prev => {
        const n = new Set(prev);
        n.add(koppelingId);
        return n;
      });
      // 2) Cancel pending queries en update cache optimistisch
      await queryClient.cancelQueries({ queryKey: ['/api/onboarding/templates', templateId] });
      const previous = queryClient.getQueryData<OnboardingTemplateMetBijlagen>(['/api/onboarding/templates', templateId]);
      if (previous) {
        queryClient.setQueryData<OnboardingTemplateMetBijlagen>(
          ['/api/onboarding/templates', templateId],
          { ...previous, bijlagen: (previous.bijlagen || []).filter(b => b.koppelingId !== koppelingId) },
        );
      }
      return { previous };
    },
    onSuccess: (_data, koppelingId) => {
      // Server delete slaagde — laat lokale filter staan totdat de cache opnieuw geladen is
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates', templateId] });
    },
    onError: (err: any, koppelingId, ctx) => {
      // Server delete mislukte — terugzetten in UI
      setVerwijderdeKoppelingen(prev => {
        const n = new Set(prev);
        n.delete(koppelingId);
        return n;
      });
      if (ctx?.previous) {
        queryClient.setQueryData(['/api/onboarding/templates', templateId], ctx.previous);
      }
      toast({ title: 'Ontkoppelen mislukt', description: err?.message || 'Er ging iets mis', variant: 'destructive' });
    },
  });

  // Schoon de lokale verwijder-set zodra de server-data weer binnen is zonder die items
  useEffect(() => {
    if (!tpl?.bijlagen) return;
    const huidigeKoppelingen = new Set(tpl.bijlagen.map(b => b.koppelingId));
    setVerwijderdeKoppelingen(prev => {
      let veranderd = false;
      const n = new Set<number>();
      prev.forEach(id => {
        if (huidigeKoppelingen.has(id)) n.add(id);
        else veranderd = true;
      });
      return veranderd ? n : prev;
    });
  }, [tpl?.bijlagen]);

  const reorderMutation = useMutation({
    mutationFn: async ({ koppelingId, volgorde }: { koppelingId: number; volgorde: number }) =>
      apiRequest('PATCH', `/api/onboarding/template-bijlagen/${koppelingId}`, { volgorde }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates', templateId] }),
  });

  const swapBijlagen = async (idx: number, dir: -1 | 1) => {
    const list = tpl?.bijlagen || [];
    const a = list[idx];
    const b = list[idx + dir];
    if (!a || !b) return;
    await Promise.all([
      reorderMutation.mutateAsync({ koppelingId: a.koppelingId, volgorde: b.volgorde }),
      reorderMutation.mutateAsync({ koppelingId: b.koppelingId, volgorde: a.volgorde }),
    ]);
  };

  // Auto-save
  const triggerAutoSave = (next: any, content?: BuilderContent) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    const contentToSave = content ?? builderContent;
    autoSaveTimer.current = setTimeout(() => {
      updateMutation.mutate({
        ...next,
        functiegroep: next.functiegroep || null,
        opdrachtgever: next.opdrachtgever || null,
        content: contentToSave ? JSON.stringify(contentToSave) : '',
      });
    }, 1500);
  };

  const updateField = (field: string, value: any) => {
    const next = { ...form, [field]: value };
    setForm(next);
    triggerAutoSave(next);
  };

  const updateBuilderContent = (next: BuilderContent) => {
    setBuilderContent(next);
    triggerAutoSave(form, next);
  };

  const handleManualSave = () => {
    if (!form) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    updateMutation.mutate(
      {
        ...form,
        functiegroep: form.functiegroep || null,
        opdrachtgever: form.opdrachtgever || null,
        content: builderContent ? JSON.stringify(builderContent) : '',
      },
      {
        onSuccess: () => toast({ title: 'Template opgeslagen ✓' }),
        onError: (err: any) => toast({
          title: 'Opslaan mislukt',
          description: err?.message || 'Er ging iets mis',
          variant: 'destructive',
        }),
      },
    );
  };

  const handleBijlageGekoppeld = (aantal: number) => {
    bijlagenSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setBijlagenFlash(true);
    setTimeout(() => setBijlagenFlash(false), 1600);
    toast({
      title: `${aantal} bijlage${aantal === 1 ? '' : 'n'} gekoppeld ✓`,
      description: 'Te zien onder "Bijlagen" verderop in de template.',
    });
  };

  if (isLoading || !form || !tpl) {
    return <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-400">Laden...</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <div className="flex-1 min-w-0">
          <Input
            value={form.naam}
            onChange={e => updateField('naam', e.target.value)}
            className="text-xl font-bold border-0 shadow-none px-0 focus-visible:ring-0 h-auto w-full"
            data-testid="input-template-naam"
          />
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            {savedAt && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Opgeslagen om {savedAt.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>}
            {updateMutation.isPending && <span>Opslaan...</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 mr-1 px-3 py-1 bg-gray-50 rounded-md">
            <Switch
              checked={form.actief}
              onCheckedChange={v => updateField('actief', v)}
              data-testid="switch-actief"
            />
            <span className="text-sm">{form.actief ? 'Actief' : 'Inactief'}</span>
          </div>
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleManualSave}
            disabled={updateMutation.isPending}
            data-testid="button-opslaan-template"
          >
            <Save className="h-4 w-4 mr-1" />
            {updateMutation.isPending ? 'Opslaan…' : 'Opslaan'}
          </Button>
          <Button variant="outline" size="sm" onClick={openDuplicateDialog} data-testid="button-dupliceer" title="Dupliceren">
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            data-testid="button-verwijder"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Taal-validatie waarschuwing */}
      {!form.taal && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800">
            <strong>Taal ontbreekt.</strong> Kies een taal hieronder — zonder taal kan deze template
            niet automatisch worden geselecteerd voor medewerkers.
          </div>
        </div>
      )}

      {/* Instellingen */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Instellingen</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-gray-600">Taal</Label>
            <Select value={form.taal} onValueChange={v => updateField('taal', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Nederlands">Nederlands</SelectItem>
                <SelectItem value="Engels">Engels</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Functiegroep <span className="text-gray-400">(leeg = alle)</span></Label>
            <Select value={form.functiegroep || 'alles'} onValueChange={v => updateField('functiegroep', v === 'alles' ? '' : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alles">— Alle functies —</SelectItem>
                {FUNCTIE_OPTIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-gray-600">Opdrachtgever <span className="text-gray-400">(leeg = alle)</span></Label>
            <Input
              value={form.opdrachtgever}
              onChange={e => updateField('opdrachtgever', e.target.value)}
              placeholder="bijv. Budbee"
              data-testid="input-opdrachtgever"
            />
          </div>
          <div className="col-span-2 flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-md">
            <input
              type="checkbox"
              checked={form.isStandaard}
              onChange={e => updateField('isStandaard', e.target.checked)}
              className="mt-1"
              data-testid="checkbox-standaard"
            />
            <div className="text-sm">
              <div className="font-medium text-amber-900">Gebruik als standaard fallback voor deze taal</div>
              <div className="text-xs text-amber-700 mt-0.5">
                Als geen specifiekere template gevonden wordt, wordt deze gebruikt voor alle medewerkers met deze taal.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* E-mail inhoud */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">E-mail inhoud</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600">Onderwerp</Label>
            <Input
              value={form.onderwerp}
              onChange={e => updateField('onderwerp', e.target.value)}
              data-testid="input-onderwerp"
            />
            <p className="text-xs text-gray-400 mt-1">
              Gebruik <code className="bg-gray-100 px-1 rounded">{`{{voornaam}}`}</code>, <code className="bg-gray-100 px-1 rounded">{`{{opdrachtgever}}`}</code> etc. voor personalisatie
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">E-mail builder</Label>
            {builderContent && (
              <OnboardingEmailBuilder
                value={builderContent}
                onChange={updateBuilderContent}
                isSaving={updateMutation.isPending}
                savedAt={savedAt}
                onPreview={() => setShowVoorvertoning(true)}
                onTestmail={() => setShowTestmail(true)}
              />
            )}
          </div>
        </div>
      </section>

      {/* Bijlagen */}
      <section
        ref={bijlagenSectionRef}
        className={`scroll-mt-24 transition-all rounded-md ${
          bijlagenFlash ? 'ring-2 ring-purple-400 bg-purple-50/40 -m-2 p-2' : ''
        }`}
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Paperclip className="h-4 w-4" /> Bijlagen
          {(tpl.bijlagen?.length || 0) > 0 && (
            <Badge variant="outline" className="text-[10px] h-5">
              {tpl.bijlagen!.length}
            </Badge>
          )}
        </h3>
        <div className="space-y-2">
          {((tpl.bijlagen || []).filter(b => !verwijderdeKoppelingen.has(b.koppelingId))).length === 0 && (
            <div className="text-sm text-gray-400 italic">Nog geen bijlagen gekoppeld</div>
          )}
          {(tpl.bijlagen || []).filter(b => !verwijderdeKoppelingen.has(b.koppelingId)).map((b, idx, arr) => (
            <div key={b.koppelingId} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md">
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={idx === 0 || reorderMutation.isPending}
                  onClick={() => swapBijlagen(idx, -1)}
                  className="text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                  title="Naar boven"
                  data-testid={`btn-bijlage-up-${b.koppelingId}`}
                >▲</button>
                <button
                  type="button"
                  disabled={idx === arr.length - 1 || reorderMutation.isPending}
                  onClick={() => swapBijlagen(idx, 1)}
                  className="text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                  title="Naar beneden"
                  data-testid={`btn-bijlage-down-${b.koppelingId}`}
                >▼</button>
              </div>
              <FileText className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">{b.naam}</div>
                <div className="text-xs text-gray-500">{b.bestandsnaam} · {formatBytes(b.bestandsgrootte)} · {b.taal}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => ontkoppelMutation.mutate(b.koppelingId)} title="Ontkoppelen">
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setShowBijlagePicker(true)} data-testid="button-bijlage-toevoegen">
            <Plus className="h-4 w-4 mr-1" /> Bijlage(n) toevoegen
          </Button>
        </div>
      </section>

      {/* Personalisatie tags */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Beschikbare personalisatie-tags</h3>
        <div className="grid grid-cols-2 gap-2">
          {PERSONALISATIE_TAGS.map(p => (
            <div key={p.tag} className="flex items-center gap-3 text-xs">
              <code className="bg-gray-100 text-purple-700 px-2 py-1 rounded font-mono whitespace-nowrap">{p.tag}</code>
              <span className="text-gray-500">{p.uitleg}</span>
            </div>
          ))}
        </div>
      </section>

      <BijlagePickerModal
        open={showBijlagePicker}
        onClose={() => setShowBijlagePicker(false)}
        templateId={templateId}
        alGekoppeld={(tpl.bijlagen || []).map(b => b.id)}
        startVolgorde={(tpl.bijlagen || []).length}
        onGekoppeld={handleBijlageGekoppeld}
      />

      <VoorvertoningModal
        open={showVoorvertoning}
        onClose={() => setShowVoorvertoning(false)}
        templateId={templateId}
      />

      <TestmailModal
        open={showTestmail}
        onClose={() => setShowTestmail(false)}
        templateId={templateId}
      />

      <Dialog open={showDuplicateDialog} onOpenChange={(o) => !o && setShowDuplicateDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Template dupliceren</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm">Naam voor nieuwe template</Label>
            <Input
              value={duplicateName}
              onChange={e => setDuplicateName(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && duplicateName.trim()) dupliceerMutation.mutate(duplicateName); }}
              placeholder="bijv. Welkom Horeca NL — variant"
              data-testid="input-dupliceer-naam"
            />
            <p className="text-xs text-gray-500">Inhoud, bijlagen-instellingen, taal en functiegroep worden mee gekopieerd.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>Annuleren</Button>
            <Button
              onClick={() => dupliceerMutation.mutate(duplicateName)}
              disabled={!duplicateName.trim() || dupliceerMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="btn-dupliceer-bevestig"
            >
              {dupliceerMutation.isPending ? 'Dupliceren…' : 'Dupliceren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={(o) => !o && setShowDeleteConfirm(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Template verwijderen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Weet je zeker dat je <strong>"{form.naam}"</strong> wilt verwijderen? Dit kan niet ongedaan gemaakt worden.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuleren</Button>
            <Button
              variant="destructive"
              onClick={() => { setShowDeleteConfirm(false); deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type MedewerkerOpt = { id: number; firstName: string | null; lastName: string | null; email: string | null; opdrachtgever?: string | null };

function useMedewerkersOptions() {
  const { data } = useQuery<{ employees?: MedewerkerOpt[] } | MedewerkerOpt[]>({
    queryKey: ['/api/admin/employees'],
  });
  return useMemo(() => {
    const arr = Array.isArray(data) ? data : (data?.employees || []);
    return (arr || []).filter(m => m && m.email);
  }, [data]);
}

function VoorvertoningModal({ open, onClose, templateId }: { open: boolean; onClose: () => void; templateId: number }) {
  const medewerkers = useMedewerkersOptions();
  const [medewerkerId, setMedewerkerId] = useState<string>('');
  const [device, setDevice] = useState<'desktop' | 'mobiel'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (open) {
      setRefreshKey(k => k + 1);
    }
  }, [open, medewerkerId, templateId]);

  const url = `/api/onboarding/templates/${templateId}/preview-html${medewerkerId ? `?medewerkerId=${medewerkerId}` : ''}&_=${refreshKey}`;

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4" /> Voorvertoning</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs text-gray-500">Medewerker</Label>
            <Select value={medewerkerId || 'voorbeeld'} onValueChange={v => setMedewerkerId(v === 'voorbeeld' ? '' : v)}>
              <SelectTrigger data-testid="select-preview-medewerker"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="voorbeeld">— Voorbeeld medewerker —</SelectItem>
                {medewerkers.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.firstName} {m.lastName} {m.opdrachtgever ? `· ${m.opdrachtgever}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-1">
            <Button variant={device === 'desktop' ? 'default' : 'outline'} size="sm" onClick={() => setDevice('desktop')} data-testid="btn-preview-desktop">
              <Monitor className="h-4 w-4 mr-1" /> Desktop
            </Button>
            <Button variant={device === 'mobiel' ? 'default' : 'outline'} size="sm" onClick={() => setDevice('mobiel')} data-testid="btn-preview-mobile">
              <Smartphone className="h-4 w-4 mr-1" /> Mobiel
            </Button>
          </div>
        </div>
        <div className="bg-gray-100 p-3 rounded-lg flex justify-center">
          <iframe
            key={refreshKey}
            src={url}
            className="bg-white border border-gray-200 rounded shadow-sm"
            style={{ width: device === 'desktop' ? '100%' : '375px', height: '60vh', maxWidth: '100%' }}
            title="Voorvertoning"
            data-testid="iframe-preview"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Sluiten</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TestmailModal({ open, onClose, templateId }: { open: boolean; onClose: () => void; templateId: number }) {
  const { toast } = useToast();
  const medewerkers = useMedewerkersOptions();
  const [naar, setNaar] = useState('');
  const [medewerkerId, setMedewerkerId] = useState<string>('');
  const [foutmelding, setFoutmelding] = useState<string | null>(null);

  useEffect(() => { if (!open) { setNaar(''); setMedewerkerId(''); setFoutmelding(null); } }, [open]);

  const verstuurMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/onboarding/templates/${templateId}/testmail`, {
      naar,
      medewerkerId: medewerkerId ? Number(medewerkerId) : undefined,
    }),
    onSuccess: (res: any) => {
      const count = typeof res?.bijlagenCount === 'number' ? res.bijlagenCount : 0;
      const ontbrekend: string[] = Array.isArray(res?.ontbrekendeBijlagen) ? res.ontbrekendeBijlagen : [];
      const bijlageTekst = count === 0 ? 'zonder bijlagen' : `${count} bijlage${count === 1 ? '' : 'n'} meegestuurd`;
      const ontbrekendTekst = ontbrekend.length ? ` · ontbrekend: ${ontbrekend.join(', ')}` : '';
      setFoutmelding(null);
      toast({
        title: 'Testmail verzonden ✓',
        description: `Naar ${naar} — ${bijlageTekst}${ontbrekendTekst}`,
        variant: ontbrekend.length ? 'destructive' : 'default',
      });
      onClose();
    },
    onError: (e: any) => {
      const data = e?.data || {};
      const detail = data?.message || e?.message || 'Onbekende fout';
      setFoutmelding(detail);
      toast({ title: 'Versturen mislukt', description: detail, variant: 'destructive' });
    },
  });

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(naar);

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Testmail sturen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600">Naar e-mailadres</Label>
            <Input value={naar} onChange={e => setNaar(e.target.value)} placeholder="jouw@adres.nl" data-testid="input-testmail-naar" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Personaliseer met (optioneel)</Label>
            <Select value={medewerkerId || 'voorbeeld'} onValueChange={v => setMedewerkerId(v === 'voorbeeld' ? '' : v)}>
              <SelectTrigger data-testid="select-testmail-medewerker"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="voorbeeld">— Voorbeeld data —</SelectItem>
                {medewerkers.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.firstName} {m.lastName} {m.opdrachtgever ? `· ${m.opdrachtgever}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded px-2 py-1.5">
            Het onderwerp krijgt het prefix <code className="bg-white px-1 rounded">[TEST]</code>.
          </p>
          {foutmelding && (
            <div
              className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2"
              data-testid="testmail-error"
            >
              <div className="font-medium mb-0.5">Versturen mislukt</div>
              <div className="text-xs break-words">{foutmelding}</div>
              {/Maximum credits exceeded|credits/i.test(foutmelding) && (
                <div className="text-xs text-red-600 mt-1">
                  Je SendGrid-account heeft het mailcredit-limiet bereikt. Upgrade je SendGrid-plan of wacht tot de credits resetten.
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button disabled={!valid || verstuurMutation.isPending} onClick={() => verstuurMutation.mutate()} data-testid="btn-testmail-verstuur">
            {verstuurMutation.isPending ? 'Versturen…' : 'Verstuur testmail'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NieuweTemplateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: number) => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    naam: '',
    taal: 'Nederlands',
    functiegroep: '',
    opdrachtgever: '',
    isStandaard: false,
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/onboarding/templates', {
      naam: form.naam,
      taal: form.taal,
      functiegroep: form.functiegroep || null,
      opdrachtgever: form.opdrachtgever || null,
      onderwerp: `Welkom bij EXTRA, {{voornaam}}!`,
      content: tekstNaarBlokken('Hoi {{voornaam}},\n\nWelkom bij EXTRA!'),
      isStandaard: form.isStandaard,
      actief: true,
    }),
    onSuccess: (tpl: any) => {
      // Optimistisch toevoegen zodat de nieuwe template direct in de lijst staat
      queryClient.setQueryData<any[]>(['/api/onboarding/templates'], (old) => {
        if (!Array.isArray(old)) return [tpl];
        if (old.some(t => t.id === tpl.id)) return old;
        return [tpl, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates'] });
      toast({ title: `Template '${form.naam}' aangemaakt ✓` });
      setForm({ naam: '', taal: 'Nederlands', functiegroep: '', opdrachtgever: '', isStandaard: false });
      onCreated(tpl.id);
    },
    onError: (err: any) => {
      toast({ title: 'Aanmaken mislukt', description: err?.message || 'Er ging iets mis', variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Template aanmaken</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Naam *</Label>
            <Input value={form.naam} onChange={e => setForm({ ...form, naam: e.target.value })} placeholder="bijv. Welkom Horeca NL" data-testid="input-nieuw-naam" />
          </div>
          <div>
            <Label>Taal *</Label>
            <Select value={form.taal} onValueChange={v => setForm({ ...form, taal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Nederlands">Nederlands</SelectItem>
                <SelectItem value="Engels">Engels</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Functiegroep</Label>
            <Select value={form.functiegroep || 'leeg'} onValueChange={v => setForm({ ...form, functiegroep: v === 'leeg' ? '' : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="leeg">— Geen specifieke —</SelectItem>
                {FUNCTIE_OPTIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Opdrachtgever</Label>
            <Input value={form.opdrachtgever} onChange={e => setForm({ ...form, opdrachtgever: e.target.value })} placeholder="bijv. Budbee" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isStandaard} onChange={e => setForm({ ...form, isStandaard: e.target.checked })} />
            <span>Standaard fallback voor deze taal</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!form.naam || createMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-template-aanmaken"
          >
            Template aanmaken →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BijlagePickerModal({ open, onClose, templateId, alGekoppeld, startVolgorde, onGekoppeld }: { open: boolean; onClose: () => void; templateId: number; alGekoppeld: number[]; startVolgorde: number; onGekoppeld?: (aantal: number) => void }) {
  const { toast } = useToast();
  const { data: bijlagen = [] } = useQuery<OnboardingBijlage[]>({
    queryKey: ['/api/onboarding/bijlagen'],
    enabled: open,
  });
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  const koppelMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (let i = 0; i < ids.length; i++) {
        await apiRequest('POST', '/api/onboarding/template-bijlagen', {
          template_id: templateId,
          bijlage_id: ids[i],
          volgorde: startVolgorde + i,
        });
      }
    },
    onSuccess: async (_, ids) => {
      await queryClient.refetchQueries({ queryKey: ['/api/onboarding/templates', templateId] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates'] });
      onClose();
      if (onGekoppeld) onGekoppeld(ids.length);
      else toast({ title: `${ids.length} bijlage${ids.length === 1 ? '' : 'n'} gekoppeld ✓` });
    },
    onError: (err: any) => {
      toast({ title: 'Koppelen mislukt', description: err?.message || 'Er ging iets mis', variant: 'destructive' });
    },
  });
  const beschikbaar = bijlagen.filter(b => !alGekoppeld.includes(b.id));

  const toggle = (id: number) => {
    setSelected(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bijlage(n) koppelen</DialogTitle>
          <p className="text-xs text-gray-500 mt-1">Selecteer één of meerdere bijlagen.</p>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {beschikbaar.length === 0 && <div className="text-sm text-gray-400 p-4 text-center">Geen beschikbare bijlagen — upload eerst een PDF in de tab Bijlagen.</div>}
          {beschikbaar.map(b => {
            const isSel = selected.has(b.id);
            return (
              <label
                key={b.id}
                className={`w-full flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                  isSel ? 'bg-purple-50 border-purple-300' : 'border-gray-200 hover:bg-gray-50'
                }`}
                data-testid={`bijlage-pick-${b.id}`}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(b.id)}
                  className="h-4 w-4"
                />
                <FileText className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{b.naam}</div>
                  <div className="text-xs text-gray-500">{b.bestandsnaam} · {formatBytes(b.bestandsgrootte)} · {b.taal}</div>
                </div>
              </label>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={koppelMutation.isPending}>Annuleren</Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            disabled={selected.size === 0 || koppelMutation.isPending}
            onClick={() => koppelMutation.mutate(Array.from(selected))}
            data-testid="btn-koppel-bijlagen"
          >
            {koppelMutation.isPending ? 'Bezig…' : `Koppel ${selected.size > 0 ? `(${selected.size})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// BIJLAGEN TAB
// ============================================================================

function BijlagenTab() {
  const { toast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [vervangenId, setVervangenId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OnboardingBijlage | null>(null);
  const { data: bijlagen = [], isLoading } = useQuery<OnboardingBijlage[]>({
    queryKey: ['/api/onboarding/bijlagen'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/onboarding/bijlagen/${id}`),
    onSuccess: (_data, id) => {
      // Optimistisch verwijderen uit cache
      queryClient.setQueryData<OnboardingBijlage[]>(['/api/onboarding/bijlagen'], (old) =>
        Array.isArray(old) ? old.filter(b => b.id !== id) : old
      );
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/bijlagen'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/templates'] });
      toast({ title: 'Bijlage verwijderd ✓' });
      setDeleteTarget(null);
    },
    onError: (e: any) => {
      toast({ title: 'Verwijderen niet mogelijk', description: e?.message || 'Bijlage is gekoppeld aan actieve templates', variant: 'destructive' });
      setDeleteTarget(null);
    },
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Bijlagen bibliotheek</h2>
        <Button onClick={() => setShowUpload(true)} className="bg-purple-600 hover:bg-purple-700" data-testid="button-upload-bijlage">
          <Upload className="h-4 w-4 mr-2" /> Bijlage uploaden
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
            <th className="px-4 py-2">Naam</th>
            <th className="px-4 py-2">Bestandsnaam</th>
            <th className="px-4 py-2">Taal</th>
            <th className="px-4 py-2">Grootte</th>
            <th className="px-4 py-2">Versie</th>
            <th className="px-4 py-2">Geüpload</th>
            <th className="px-4 py-2 text-right">Acties</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <tr><td colSpan={7} className="p-6 text-center text-gray-400">Laden...</td></tr>}
          {!isLoading && bijlagen.length === 0 && (
            <tr><td colSpan={7} className="p-6 text-center text-gray-400">Nog geen bijlagen</td></tr>
          )}
          {bijlagen.map((b, i) => (
            <tr key={b.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 font-medium">{b.naam}</td>
              <td className="px-4 py-3 text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-600" /> {b.bestandsnaam}
              </td>
              <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] rounded-full">{b.taal}</Badge></td>
              <td className="px-4 py-3 text-gray-600">{formatBytes(b.bestandsgrootte)}</td>
              <td className="px-4 py-3 text-gray-600">{b.versie || '—'}</td>
              <td className="px-4 py-3 text-gray-600">{new Date(b.geuploadOp).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/api/onboarding/bijlagen/${b.id}/bekijken`, '_blank')} title="Bekijken">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setVervangenId(b.id)} title="Bestand vervangen (koppeling blijft behouden)" data-testid={`button-vervang-bijlage-${b.id}`}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Vervangen
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(b)} title="Verwijderen" data-testid={`button-delete-bijlage-${b.id}`}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <BijlageUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
      />
      <BijlageVervangenModal
        bijlageId={vervangenId}
        onClose={() => setVervangenId(null)}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => { if (!o && !deleteMutation.isPending) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm" data-testid="dialog-delete-bijlage">
          <DialogHeader><DialogTitle>Bijlage verwijderen</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              Weet je zeker dat je <strong>{deleteTarget?.naam}</strong> wilt verwijderen?
              Dit kan niet ongedaan gemaakt worden.
            </p>
            <p className="text-gray-500">
              Wil je alleen het PDF-bestand bijwerken? Gebruik dan <strong>Vervangen</strong> in
              plaats van verwijderen — zo blijft de koppeling met de template behouden. Bijlagen die
              nog aan een actieve template gekoppeld zijn, kunnen niet worden verwijderd.
            </p>
            <div className="flex flex-wrap gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
                Annuleren
              </Button>
              <Button
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={() => { if (deleteTarget) { setVervangenId(deleteTarget.id); setDeleteTarget(null); } }}
                disabled={deleteMutation.isPending}
                data-testid="button-vervang-in-plaats"
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Vervangen
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete-bijlage"
              >
                {deleteMutation.isPending ? 'Verwijderen…' : 'Verwijderen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BijlageUploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [naam, setNaam] = useState('');
  const [taal, setTaal] = useState('alles');
  const [versie, setVersie] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => { setNaam(''); setTaal('alles'); setVersie(''); setFile(null); };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Geen bestand');
      const fd = new FormData();
      fd.append('bestand', file);
      fd.append('naam', naam);
      fd.append('taal', taal);
      if (versie) fd.append('versie', versie);
      const res = await fetch('/api/onboarding/bijlagen', { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Upload mislukt');
      return res.json();
    },
    onSuccess: (nieuw: any) => {
      // Optimistisch prepend zodat hij direct in de bibliotheek staat
      queryClient.setQueryData<OnboardingBijlage[]>(['/api/onboarding/bijlagen'], (old) => {
        if (!Array.isArray(old)) return [nieuw];
        if (old.some(b => b.id === nieuw.id)) return old;
        return [nieuw, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/bijlagen'] });
      toast({ title: 'Bijlage geüpload ✓' });
      reset();
      onClose();
    },
    onError: (e: any) => toast({ title: 'Upload mislukt', description: e?.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Bijlage uploaden</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f && f.type === 'application/pdf') {
                setFile(f);
                if (!naam) setNaam(f.name.replace(/\.pdf$/i, ''));
              }
            }}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? 'border-purple-600 bg-purple-50' : 'border-gray-300 bg-gray-50'
            }`}
            style={{ minHeight: '160px' }}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-red-600" />
                <div className="text-left">
                  <div className="font-medium text-sm">{file.name}</div>
                  <div className="text-xs text-gray-500">{formatBytes(file.size)}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Drag & drop of klik om een PDF te selecteren</p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      if (!naam) setNaam(f.name.replace(/\.pdf$/i, ''));
                    }
                  }}
                  className="text-xs"
                  data-testid="input-file"
                />
                <p className="text-xs text-gray-400 mt-2">Alleen PDF, max 10 MB</p>
              </>
            )}
          </div>
          <div>
            <Label>Naam *</Label>
            <Input value={naam} onChange={e => setNaam(e.target.value)} placeholder="bijv. Afmeldprotocol" data-testid="input-bijlage-naam" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Taal</Label>
              <Select value={taal} onValueChange={setTaal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alles">Alles</SelectItem>
                  <SelectItem value="Nederlands">Nederlands</SelectItem>
                  <SelectItem value="Engels">Engels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Versie</Label>
              <Input value={versie} onChange={e => setVersie(e.target.value)} placeholder="bijv. v2.0" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Annuleren</Button>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!file || !naam || uploadMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-upload-bevestig"
          >
            {uploadMutation.isPending ? 'Uploaden...' : 'Uploaden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BijlageVervangenModal({ bijlageId, onClose }: { bijlageId: number | null; onClose: () => void }) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [versie, setVersie] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file || !bijlageId) throw new Error('Geen bestand');
      const fd = new FormData();
      fd.append('bestand', file);
      if (versie) fd.append('versie', versie);
      const res = await fetch(`/api/onboarding/bijlagen/${bijlageId}/vervangen`, { method: 'PUT', body: fd, credentials: 'include' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Vervangen mislukt');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/bijlagen'] });
      toast({ title: 'Bijlage vervangen ✓' });
      setFile(null); setVersie('');
      onClose();
    },
  });

  return (
    <Dialog open={bijlageId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Bijlage vervangen</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Upload een nieuwe versie. Koppelingen met templates blijven behouden.</p>
          <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
          <div>
            <Label>Nieuwe versie</Label>
            <Input value={versie} onChange={e => setVersie(e.target.value)} placeholder="bijv. v2.1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={() => mutation.mutate()} disabled={!file || mutation.isPending} className="bg-purple-600 hover:bg-purple-700">
            Vervangen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// STATISTIEKEN TAB
// ============================================================================

function StatistiekenTab() {
  const { data, isLoading } = useQuery<{
    totaalVerstuurd: number;
    dezeMaand: number;
    meestGebruikteTemplate: { naam: string; aantal: number } | null;
    laatste50: Array<any>;
  }>({ queryKey: ['/api/onboarding/statistieken'] });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Totaal verstuurd</div>
            <div className="text-3xl font-bold mt-1">{data?.totaalVerstuurd ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Deze maand</div>
            <div className="text-3xl font-bold mt-1">{data?.dezeMaand ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Meest gebruikt</div>
            <div className="text-lg font-semibold mt-1 line-clamp-1">{data?.meestGebruikteTemplate?.naam || '—'}</div>
            {data?.meestGebruikteTemplate && (
              <div className="text-xs text-gray-500">{data.meestGebruikteTemplate.aantal}× gebruikt</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Laatste 50 verzendingen</h2>
          <Button
            variant="outline"
            onClick={() => window.open('/api/onboarding/statistieken/export/csv', '_blank')}
            data-testid="button-csv-export"
          >
            <Download className="h-4 w-4 mr-2" /> Exporteer als CSV
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
              <th className="px-4 py-2">Medewerker</th>
              <th className="px-4 py-2">Template</th>
              <th className="px-4 py-2">Opdrachtgever</th>
              <th className="px-4 py-2">Verstuurd op</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Laden...</td></tr>}
            {!isLoading && (data?.laatste50?.length ?? 0) === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Nog geen onboarding mails verstuurd</td></tr>
            )}
            {data?.laatste50?.map((r: any, i: number) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.medewerkerNaam}</div>
                  <div className="text-xs text-gray-500">{r.medewerkerEmail}</div>
                </td>
                <td className="px-4 py-3">{r.templateName || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{r.opdrachtgever || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(r.sentAt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-4 py-3">
                  <Badge className={r.status === 'verzonden' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {r.status === 'verzonden' ? '✓ Verzonden' : r.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
