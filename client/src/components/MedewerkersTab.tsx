import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search, Plus, Mail, MailCheck, X, Pencil, Trash2, Paperclip, Loader2,
  CheckCircle2, Briefcase, MapPin, Phone, Calendar, Tag, FileText, Send, AlertCircle,
} from 'lucide-react';
import type { Employee, OnboardingLog, OnboardingTemplate, OnboardingBijlage } from '@shared/schema';

type TemplateLite = Pick<OnboardingTemplate, 'id' | 'naam' | 'taal' | 'functiegroep' | 'opdrachtgever'>;
type TemplateMetBijlagen = OnboardingTemplate & {
  bijlagen?: (OnboardingBijlage & { koppelingId: number; volgorde: number })[];
};

const BRANCHES = ['Hotel', 'Restaurant', 'Cateraar', 'Evenementenlocatie', 'Logistiek'];
const CONTRACT_TYPES = ['oproepkracht', 'parttimer', 'fulltimer'];
const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  nieuw: { label: 'Nieuw', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  actief: { label: 'Actief', cls: 'bg-green-100 text-green-700 border-green-200' },
  inactief: { label: 'Inactief', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  uitgestroomd: { label: 'Uitgestroomd', cls: 'bg-red-100 text-red-700 border-red-200' },
};

type EmployeeWithLogs = Employee & { onboardingLogs?: OnboardingLog[] };

export default function MedewerkersTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alles');
  const [brancheFilter, setBrancheFilter] = useState<string>('alles');
  const [opdrachtgeverFilter, setOpdrachtgeverFilter] = useState<string>('alles');
  const [languageFilter, setLanguageFilter] = useState<string>('alles');
  const [onboardingFilter, setOnboardingFilter] = useState<string>('alles');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileTab, setProfileTab] = useState<'gegevens' | 'historie' | 'shifts'>('gegevens');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [sendConfirmTemplate, setSendConfirmTemplate] = useState<TemplateLite | null>(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const { data: listData, isLoading } = useQuery<{ employees: Employee[]; total: number }>({
    queryKey: ['/api/admin/employees'],
    refetchInterval: 30000,
  });

  const employees = listData?.employees || [];

  const { data: detailData, refetch: refetchDetail } = useQuery<EmployeeWithLogs>({
    queryKey: ['/api/admin/employees', selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/employees/${selectedId}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    enabled: selectedId !== null,
  });

  const opdrachtgeverOpties = useMemo(
    () => Array.from(new Set(employees.map(e => e.opdrachtgever).filter(Boolean) as string[])).sort(),
    [employees],
  );

  const filtered = useMemo(() => {
    return employees.filter(e => {
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.firstName} ${e.lastName} ${e.email} ${e.opdrachtgever || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== 'alles' && e.status !== statusFilter) return false;
      if (brancheFilter !== 'alles' && e.branche !== brancheFilter) return false;
      if (opdrachtgeverFilter !== 'alles' && e.opdrachtgever !== opdrachtgeverFilter) return false;
      if (languageFilter !== 'alles' && e.language !== languageFilter) return false;
      if (onboardingFilter === 'ja' && !e.onboardingSent) return false;
      if (onboardingFilter === 'nee' && e.onboardingSent) return false;
      return true;
    });
  }, [employees, search, statusFilter, brancheFilter, opdrachtgeverFilter, languageFilter, onboardingFilter]);

  const stats = useMemo(() => {
    const totaal = employees.length;
    const actief = employees.filter(e => e.status === 'actief').length;
    const nieuw = employees.filter(e => e.status === 'nieuw').length;
    const onbTeSturen = employees.filter(e => !e.onboardingSent && (e.status === 'nieuw' || e.status === 'actief')).length;
    return { totaal, actief, nieuw, onbTeSturen };
  }, [employees]);

  const sendOnboardingMutation = useMutation({
    mutationFn: (vars: { id: number; templateId: number }) =>
      apiRequest('POST', `/api/admin/employees/${vars.id}/onboarding-versturen`, {
        templateId: vars.templateId,
      }),
    onSuccess: (data: any) => {
      const ontbrekend: string[] = data?.ontbrekendeBijlagen || [];
      if (ontbrekend.length > 0) {
        toast({
          title: 'Onboarding mail verstuurd ✓',
          description: `Let op: ${ontbrekend.length} bijlage(n) ontbraken op de server en zijn niet meegestuurd: ${ontbrekend.join(', ')}`,
        });
      } else {
        toast({ title: 'Onboarding mail verstuurd ✓' });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/statistieken'] });
      refetchDetail();
      setSendConfirmTemplate(null);
    },
    onError: (err: any) => {
      toast({ title: 'Versturen mislukt', description: err?.message || 'Er ging iets mis', variant: 'destructive' });
    },
  });

  const bulkSendMutation = useMutation({
    mutationFn: (vars: { medewerkerIds: number[] }) =>
      apiRequest('POST', '/api/admin/employees/onboarding-bulk', {
        medewerkerIds: vars.medewerkerIds,
      }),
    onSuccess: (data: any) => {
      const v = data?.verzonden || 0;
      const m = data?.mislukt || 0;
      toast({
        title: 'Bulk onboarding voltooid',
        description: `${v} mail${v === 1 ? '' : 's'} verstuurd${m > 0 ? `, ${m} mislukt` : ''}.`,
        variant: m > 0 ? 'destructive' : 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/statistieken'] });
      setBulkConfirmOpen(false);
      setBulkSelectedIds(new Set());
      setBulkSelectMode(false);
    },
    onError: (err: any) => {
      toast({ title: 'Bulk verzending mislukt', description: err?.message || 'Er ging iets mis', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; data: Partial<Employee> }) =>
      apiRequest('PUT', `/api/admin/employees/${vars.id}`, vars.data),
    onSuccess: () => {
      toast({ title: 'Medewerker bijgewerkt ✓' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      refetchDetail();
      setEditMode(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/employees/${id}`),
    onSuccess: () => {
      toast({ title: 'Medewerker verwijderd ✓' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setSelectedId(null);
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      toast({ title: 'Verwijderen mislukt', description: err?.message || 'Alleen uitgestroomde medewerkers kunnen verwijderd worden', variant: 'destructive' });
      setDeleteConfirmId(null);
    },
  });

  return (
    <div data-testid="medewerkers-tab">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Medewerkers</h1>
          <p className="text-sm text-gray-500">Beheer actieve medewerkers en stuur onboarding mails</p>
        </div>
        <div className="flex gap-2">
          {bulkSelectMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => { setBulkSelectMode(false); setBulkSelectedIds(new Set()); }}
                data-testid="btn-bulk-cancel"
              >
                <X className="h-4 w-4 mr-1" /> Annuleren
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                disabled={bulkSelectedIds.size === 0}
                onClick={() => setBulkConfirmOpen(true)}
                data-testid="btn-bulk-versturen"
              >
                <Send className="h-4 w-4 mr-1" /> Verstuur {bulkSelectedIds.size > 0 ? `(${bulkSelectedIds.size})` : ''}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => { setBulkSelectMode(true); setBulkSelectedIds(new Set()); }}
                data-testid="btn-bulk-mode"
              >
                <Mail className="h-4 w-4 mr-1" /> Bulk onboarding
              </Button>
              <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700" data-testid="btn-nieuwe-medewerker">
                <Plus className="h-4 w-4 mr-1" /> Nieuwe medewerker
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats balk */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Totaal" value={stats.totaal} />
        <StatCard label="Actief" value={stats.actief} accent="green" />
        <StatCard label="Nieuw" value={stats.nieuw} accent="blue" />
        <StatCard
          label="Onboarding nog te sturen"
          value={stats.onbTeSturen}
          accent="orange"
          onClick={() => { setOnboardingFilter('nee'); setStatusFilter('alles'); }}
        />
      </div>

      {/* Search + filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Zoek op naam, email of opdrachtgever…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-medewerkers"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(s => !s)}>
            Filters {showFilters ? '▴' : '▾'}
          </Button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alles">Alle statussen</SelectItem>
                <SelectItem value="nieuw">Nieuw</SelectItem>
                <SelectItem value="actief">Actief</SelectItem>
                <SelectItem value="inactief">Inactief</SelectItem>
                <SelectItem value="uitgestroomd">Uitgestroomd</SelectItem>
              </SelectContent>
            </Select>
            <Select value={brancheFilter} onValueChange={setBrancheFilter}>
              <SelectTrigger><SelectValue placeholder="Branche" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alles">Alle branches</SelectItem>
                {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={opdrachtgeverFilter} onValueChange={setOpdrachtgeverFilter}>
              <SelectTrigger><SelectValue placeholder="Opdrachtgever" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alles">Alle opdrachtgevers</SelectItem>
                {opdrachtgeverOpties.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger><SelectValue placeholder="Taal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alles">Alle talen</SelectItem>
                <SelectItem value="Nederlands">Nederlands</SelectItem>
                <SelectItem value="Engels">Engels</SelectItem>
              </SelectContent>
            </Select>
            <Select value={onboardingFilter} onValueChange={setOnboardingFilter}>
              <SelectTrigger><SelectValue placeholder="Onboarding" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alles">Onboarding (alle)</SelectItem>
                <SelectItem value="ja">Verstuurd</SelectItem>
                <SelectItem value="nee">Nog te sturen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Lijst */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Geen medewerkers gevonden</p>
            {employees.length === 0 && (
              <p className="text-xs mt-1">Begin door een sollicitant aan te nemen of maak handmatig een medewerker aan.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bulkSelectMode && (
              <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-3 text-sm">
                <Checkbox
                  checked={
                    filtered.filter(e => !e.onboardingSent).length > 0 &&
                    filtered.filter(e => !e.onboardingSent).every(e => bulkSelectedIds.has(e.id))
                  }
                  onCheckedChange={(c) => {
                    const ids = new Set(bulkSelectedIds);
                    const ongetuurd = filtered.filter(e => !e.onboardingSent);
                    if (c) ongetuurd.forEach(e => ids.add(e.id));
                    else ongetuurd.forEach(e => ids.delete(e.id));
                    setBulkSelectedIds(ids);
                  }}
                  data-testid="checkbox-select-all"
                />
                <span className="text-purple-700">
                  Selecteer alle nog niet verstuurde ({filtered.filter(e => !e.onboardingSent).length})
                </span>
              </div>
            )}
            {filtered.map(emp => {
              const st = STATUS_LABELS[emp.status] || STATUS_LABELS.nieuw;
              const checked = bulkSelectedIds.has(emp.id);
              const disableSelect = emp.onboardingSent;
              return (
                <div
                  key={emp.id}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedId === emp.id ? 'bg-purple-50' : ''
                  } ${bulkSelectMode && checked ? 'bg-purple-50' : ''}`}
                  data-testid={`row-employee-${emp.id}`}
                >
                  {bulkSelectMode && (
                    <Checkbox
                      checked={checked}
                      disabled={disableSelect}
                      onCheckedChange={(c) => {
                        const ids = new Set(bulkSelectedIds);
                        if (c) ids.add(emp.id); else ids.delete(emp.id);
                        setBulkSelectedIds(ids);
                      }}
                      data-testid={`checkbox-employee-${emp.id}`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (bulkSelectMode) {
                        if (disableSelect) return;
                        const ids = new Set(bulkSelectedIds);
                        if (ids.has(emp.id)) ids.delete(emp.id); else ids.add(emp.id);
                        setBulkSelectedIds(ids);
                      } else {
                        setSelectedId(emp.id); setEditMode(false); setProfileTab('gegevens');
                      }
                    }}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold shrink-0">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{emp.firstName} {emp.lastName}</span>
                        <span className="text-xs text-gray-400">— {emp.functie || 'geen functie'}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{emp.opdrachtgever || '—'}</div>
                    </div>
                    <Badge variant="outline" className={`${st.cls} text-xs`}>{st.label}</Badge>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (bulkSelectMode) return;
                      setSelectedId(emp.id);
                      setEditMode(false);
                      setProfileTab('gegevens');
                    }}
                    disabled={bulkSelectMode}
                    title={emp.onboardingSent ? 'Onboarding verstuurd — klik om opnieuw te versturen of details te bekijken' : 'Onboarding nog niet verstuurd — klik om te versturen'}
                    className="shrink-0 p-1 rounded hover:bg-gray-100 disabled:cursor-not-allowed"
                    data-testid={`btn-envelop-${emp.id}`}
                  >
                    {emp.onboardingSent ? (
                      <MailCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <Mail className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail slide-over */}
      <Dialog open={selectedId !== null} onOpenChange={open => { if (!open) { setSelectedId(null); setEditMode(false); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" data-testid="dialog-employee-detail">
          {detailData && (
            <EmployeeDetail
              employee={detailData}
              editMode={editMode}
              setEditMode={setEditMode}
              profileTab={profileTab}
              setProfileTab={setProfileTab}
              onUpdate={(data) => updateMutation.mutate({ id: detailData.id, data })}
              onDelete={() => setDeleteConfirmId(detailData.id)}
              onSendOnboarding={(template) => setSendConfirmTemplate(template)}
              isSaving={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create modal */}
      {showCreateModal && (
        <CreateEmployeeModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(emp) => {
            setShowCreateModal(false);
            setSelectedId(emp.id);
          }}
        />
      )}

      {/* Delete confirm */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Medewerker verwijderen</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Weet je zeker dat je deze medewerker wilt verwijderen? Alle gekoppelde gegevens (onboarding-historie, shifts e.d.) worden mee verwijderd. Dit kan niet ongedaan gemaakt worden.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Annuleren</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)} disabled={deleteMutation.isPending}>
              Verwijderen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send confirm */}
      <Dialog open={sendConfirmTemplate !== null} onOpenChange={(o) => { if (!o) setSendConfirmTemplate(null); }}>
        <DialogContent className="max-w-md" data-testid="dialog-send-confirm">
          <DialogHeader><DialogTitle>Onboarding mail versturen</DialogTitle></DialogHeader>
          {detailData && sendConfirmTemplate && (
            <SendConfirmContent
              employee={detailData}
              template={sendConfirmTemplate}
              onCancel={() => setSendConfirmTemplate(null)}
              onConfirm={() => sendOnboardingMutation.mutate({
                id: detailData.id,
                templateId: sendConfirmTemplate.id,
              })}
              isPending={sendOnboardingMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk confirm */}
      <Dialog open={bulkConfirmOpen} onOpenChange={(o) => { if (!o) setBulkConfirmOpen(false); }}>
        <DialogContent className="max-w-2xl" data-testid="dialog-bulk-confirm">
          <DialogHeader><DialogTitle>Bulk onboarding — preview</DialogTitle></DialogHeader>
          <BulkPreviewContent
            selectedEmployees={Array.from(bulkSelectedIds).map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[]}
            isPending={bulkSendMutation.isPending}
            onCancel={() => setBulkConfirmOpen(false)}
            onConfirm={(ids) => bulkSendMutation.mutate({ medewerkerIds: ids })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SendConfirmContent({
  employee, template, onCancel, onConfirm, isPending,
}: {
  employee: EmployeeWithLogs;
  template: TemplateLite;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const { data: tplDetail, isLoading } = useQuery<TemplateMetBijlagen>({
    queryKey: ['/api/onboarding/templates', template.id],
    queryFn: () => apiRequest(`/api/onboarding/templates/${template.id}`) as Promise<TemplateMetBijlagen>,
  });
  const bijlagen = tplDetail?.bijlagen || [];
  const [bevestig, setBevestig] = useState(false);
  return (
    <div className="space-y-3 text-sm">
      {employee.onboardingSent && (
        <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 flex items-start gap-2" data-testid="warn-already-sent">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-semibold text-amber-900">Onboarding mail is al verstuurd</div>
            <div className="text-xs text-amber-800 mt-0.5">
              Verzonden op{' '}
              {employee.onboardingSentAt
                ? new Date(employee.onboardingSentAt).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
                : '—'}.
              Bevestig hieronder dat je opnieuw wilt versturen.
            </div>
            <label className="flex items-center gap-2 mt-2 text-xs text-amber-900 cursor-pointer">
              <input
                type="checkbox"
                checked={bevestig}
                onChange={e => setBevestig(e.target.checked)}
                data-testid="checkbox-confirm-resend"
              />
              <span>Ja, opnieuw versturen aan {employee.firstName}</span>
            </label>
          </div>
        </div>
      )}
      <p>Versturen aan <strong>{employee.firstName} {employee.lastName}</strong></p>
      <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
        <div><span className="text-gray-500">E-mailadres:</span> <span className="font-medium">{employee.email}</span></div>
        <div><span className="text-gray-500">Template:</span> <span className="font-medium">{template.naam}</span></div>
        <div><span className="text-gray-500">Taal:</span> <span className="font-medium">{template.taal}</span></div>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" /> Bijlagen
        </div>
        {isLoading ? (
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Laden…
          </div>
        ) : bijlagen.length === 0 ? (
          <div className="text-xs text-gray-400 italic">Geen bijlagen aan deze template gekoppeld.</div>
        ) : (
          <ul className="space-y-1 text-xs bg-blue-50 border border-blue-100 rounded-lg p-2">
            {bijlagen.map(b => (
              <li key={b.id} className="flex items-center gap-2" data-testid={`bijlage-${b.id}`}>
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-medium">{b.naam}</span>
                <span className="text-gray-500">({Math.round((b.bestandsgrootte || 0) / 1024)} KB)</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>Annuleren</Button>
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isPending || (employee.onboardingSent && !bevestig)}
          onClick={onConfirm}
          data-testid="btn-confirm-send-onboarding"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Versturen…</>
          ) : employee.onboardingSent ? (
            <><Send className="h-4 w-4 mr-1" /> Opnieuw versturen</>
          ) : (
            <><Send className="h-4 w-4 mr-1" /> Versturen</>
          )}
        </Button>
      </div>
    </div>
  );
}

function BulkPreviewContent({
  selectedEmployees, isPending, onCancel, onConfirm,
}: {
  selectedEmployees: Employee[];
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (ids: number[]) => void;
}) {
  const [previews, setPreviews] = useState<Array<{
    employee: Employee;
    template: TemplateLite | null;
    bijlagenCount: number;
    error: string | null;
  }> | null>(null);

  useEffect(() => {
    let aborted = false;
    setPreviews(null);
    (async () => {
      const results = await Promise.all(selectedEmployees.map(async (e) => {
        const params = new URLSearchParams({
          taal: e.language || 'Nederlands',
          ...(e.functie ? { functie: e.functie } : {}),
          ...(e.opdrachtgever ? { opdrachtgever: e.opdrachtgever } : {}),
        });
        try {
          const res = await fetch(`/api/onboarding/templates/selecteer?${params}`, { credentials: 'include' });
          if (!res.ok) return { employee: e, template: null, bijlagenCount: 0, error: 'Geen template' };
          const tpl = await res.json();
          let bijlagenCount = 0;
          try {
            const detRes = await fetch(`/api/onboarding/templates/${tpl.id}`, { credentials: 'include' });
            if (detRes.ok) {
              const det = await detRes.json();
              bijlagenCount = (det.bijlagen || []).length;
            }
          } catch {}
          return { employee: e, template: tpl, bijlagenCount, error: null };
        } catch (err: any) {
          return { employee: e, template: null, bijlagenCount: 0, error: err?.message || 'Fout' };
        }
      }));
      if (!aborted) setPreviews(results);
    })();
    return () => { aborted = true; };
  }, [selectedEmployees]);

  const klaar = previews !== null;
  const verzendbaar = (previews || []).filter(p => p.template && p.employee.email);
  const geblokkeerd = (previews || []).filter(p => !p.template || !p.employee.email);
  const alVerstuurd = (previews || []).filter(p => p.employee.onboardingSent).length;

  return (
    <div className="space-y-3 text-sm">
      {!klaar ? (
        <div className="py-6 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Templates ophalen…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md bg-green-50 border border-green-200 p-2">
              <div className="font-semibold text-green-800">{verzendbaar.length}</div>
              <div className="text-green-700">verzendbaar</div>
            </div>
            <div className="rounded-md bg-amber-50 border border-amber-200 p-2">
              <div className="font-semibold text-amber-800">{alVerstuurd}</div>
              <div className="text-amber-700">al eerder verstuurd</div>
            </div>
            <div className="rounded-md bg-red-50 border border-red-200 p-2">
              <div className="font-semibold text-red-800">{geblokkeerd.length}</div>
              <div className="text-red-700">geblokkeerd</div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                <tr>
                  <th className="text-left p-2">Medewerker</th>
                  <th className="text-left p-2">Template</th>
                  <th className="text-left p-2">Bijlagen</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {previews!.map(p => (
                  <tr key={p.employee.id} className="border-t" data-testid={`bulk-preview-row-${p.employee.id}`}>
                    <td className="p-2">
                      <div className="font-medium text-gray-900">{p.employee.firstName} {p.employee.lastName}</div>
                      <div className="text-gray-500">{p.employee.email || '— geen email —'}</div>
                    </td>
                    <td className="p-2">
                      {p.template ? (
                        <div>
                          <div className="font-medium">{p.template.naam}</div>
                          <div className="text-gray-500">{p.template.taal}</div>
                        </div>
                      ) : (
                        <span className="text-red-600">{p.error || 'Geen match'}</span>
                      )}
                    </td>
                    <td className="p-2">
                      {p.bijlagenCount > 0 ? (
                        <Badge variant="outline" className="text-[10px]">
                          <Paperclip className="h-2.5 w-2.5 mr-0.5" /> {p.bijlagenCount}
                        </Badge>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="p-2">
                      {!p.employee.email ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 text-[10px]">geen email</Badge>
                      ) : !p.template ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 text-[10px]">geen template</Badge>
                      ) : p.employee.onboardingSent ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px]">opnieuw</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-[10px]">klaar</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {geblokkeerd.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                <strong>{geblokkeerd.length}</strong> medewerker(s) worden overgeslagen — los het probleem op of deselecteer ze om verder te gaan.
              </span>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>Annuleren</Button>
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isPending || !klaar || verzendbaar.length === 0}
          onClick={() => onConfirm(verzendbaar.map(p => p.employee.id))}
          data-testid="btn-confirm-bulk-send"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Bezig…</>
          ) : (
            <><Send className="h-4 w-4 mr-1" /> Verstuur {verzendbaar.length}</>
          )}
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, onClick }: { label: string; value: number; accent?: 'green' | 'blue' | 'orange'; onClick?: () => void }) {
  const ring = accent === 'orange' ? 'ring-2 ring-amber-400' : '';
  const valColor = accent === 'green' ? 'text-green-600' : accent === 'blue' ? 'text-blue-600' : accent === 'orange' ? 'text-amber-600' : 'text-gray-900';
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-4 ${ring} ${onClick ? 'hover:bg-gray-50 text-left cursor-pointer' : ''}`}
    >
      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</div>
      <div className={`text-2xl font-bold ${valColor}`}>{value}</div>
    </Comp>
  );
}

function EmployeeDetail({
  employee,
  editMode,
  setEditMode,
  profileTab,
  setProfileTab,
  onUpdate,
  onDelete,
  onSendOnboarding,
  isSaving,
}: {
  employee: EmployeeWithLogs;
  editMode: boolean;
  setEditMode: (b: boolean) => void;
  profileTab: 'gegevens' | 'historie' | 'shifts';
  setProfileTab: (t: 'gegevens' | 'historie' | 'shifts') => void;
  onUpdate: (data: Partial<Employee>) => void;
  onDelete: () => void;
  onSendOnboarding: (template: TemplateLite) => void;
  isSaving: boolean;
}) {
  const st = STATUS_LABELS[employee.status] || STATUS_LABELS.nieuw;
  const [draft, setDraft] = useState<Partial<Employee>>(employee);

  const { data: templates = [] } = useQuery<TemplateLite[]>({
    queryKey: ['/api/onboarding/templates'],
  });
  const activeTemplates = useMemo(
    () => templates.filter((t: any) => t.actief !== false),
    [templates]
  );

  const selecteerParams = new URLSearchParams({
    taal: employee.language || 'Nederlands',
    ...(employee.functie ? { functie: employee.functie } : {}),
    ...(employee.opdrachtgever ? { opdrachtgever: employee.opdrachtgever } : {}),
  });
  const { data: autoTemplate } = useQuery<TemplateLite>({
    queryKey: ['/api/onboarding/templates/selecteer', employee.id, employee.language, employee.functie, employee.opdrachtgever],
    queryFn: async () => {
      const res = await fetch(`/api/onboarding/templates/selecteer?${selecteerParams}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Geen template gevonden');
      return res.json();
    },
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const effectiveId = selectedTemplateId ?? autoTemplate?.id ?? activeTemplates[0]?.id ?? null;
  const selectedTemplate =
    activeTemplates.find(t => t.id === effectiveId) ||
    autoTemplate ||
    activeTemplates[0] ||
    null;

  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <DialogTitle className="text-xl">{employee.firstName} {employee.lastName}</DialogTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-gray-500">{employee.functie || '—'}</span>
              {employee.opdrachtgever && <span className="text-sm text-gray-400">· {employee.opdrachtgever}</span>}
              <Badge variant="outline" className={`${st.cls} text-xs`}>{st.label}</Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditMode(!editMode)} title={editMode ? 'Annuleren' : 'Bewerken'}>
              {editMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={onDelete} title="Verwijderen">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogHeader>

      {/* Onboarding banner */}
      {employee.onboardingSent ? (
        <div className="rounded-lg bg-green-50 border-l-4 border-green-600 p-4 my-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-green-800">Onboarding mail verstuurd</div>
              <div className="text-xs text-green-700 mt-0.5">
                Verzonden op: {employee.onboardingSentAt ? new Date(employee.onboardingSentAt).toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' }) : '—'}
              </div>
              {employee.onboardingLogs?.[0]?.templateName && (
                <div className="text-xs text-green-700">Template: "{employee.onboardingLogs[0].templateName}"</div>
              )}
            </div>
            <Button variant="outline" size="sm" disabled={!selectedTemplate} onClick={() => selectedTemplate && onSendOnboarding(selectedTemplate)}>
              Opnieuw sturen
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-blue-50 border-l-4 border-blue-600 p-4 my-3">
          <div className="flex items-start gap-2 mb-2">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-800">Onboarding mail nog niet verstuurd</div>
              <div className="text-xs text-blue-700">Stuur {employee.firstName} een welkomstmail om te starten.</div>
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <Select
              value={effectiveId !== null ? String(effectiveId) : ''}
              onValueChange={(v) => setSelectedTemplateId(parseInt(v))}
              disabled={activeTemplates.length === 0}
            >
              <SelectTrigger className="bg-white text-sm h-9">
                <SelectValue placeholder={activeTemplates.length === 0 ? 'Geen templates beschikbaar' : 'Kies template'} />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.naam} {autoTemplate && t.id === autoTemplate.id ? '(auto)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!employee.email ? (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Voeg eerst een e-mailadres toe om te kunnen versturen.
              </div>
            ) : (
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={!selectedTemplate}
                onClick={() => selectedTemplate && onSendOnboarding(selectedTemplate)}
                data-testid="btn-send-onboarding"
              >
                <Mail className="h-4 w-4 mr-1" /> Verstuur onboarding mail
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 -mx-6 px-6">
        {(['gegevens', 'historie', 'shifts'] as const).map(t => (
          <button
            key={t}
            onClick={() => setProfileTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              profileTab === t ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'gegevens' ? 'Gegevens' : t === 'historie' ? 'Onboarding historie' : 'Shifts / Historie'}
          </button>
        ))}
      </div>

      {profileTab === 'gegevens' && (
        <div className="py-4 space-y-4">
          {editMode ? (
            <EmployeeForm
              initial={draft}
              onChange={setDraft}
              onSubmit={() => onUpdate(draft)}
              isSaving={isSaving}
              onCancel={() => { setDraft(employee); setEditMode(false); }}
            />
          ) : (
            <>
              <DetailSection title="Persoonlijk">
                <Row icon={Mail} label="E-mail">{employee.email}</Row>
                <Row icon={Phone} label="Telefoon">{employee.phone || '—'}</Row>
                <Row icon={Calendar} label="Geboortedatum">{employee.birthDate || '—'}</Row>
                <Row icon={MapPin} label="Stad">{employee.city || '—'}</Row>
                <Row icon={FileText} label="Taal">{employee.language || '—'}</Row>
              </DetailSection>
              <DetailSection title="Werk">
                <Row icon={Briefcase} label="Functie">{employee.functie || '—'}</Row>
                <Row icon={Briefcase} label="Branche">{employee.branche || '—'}</Row>
                <Row icon={Briefcase} label="Opdrachtgever">{employee.opdrachtgever || '—'}</Row>
                <Row icon={Briefcase} label="Contract">{employee.contractType || '—'}</Row>
                <Row icon={Calendar} label="Startdatum">{employee.startDate || '—'}</Row>
              </DetailSection>
              <DetailSection title="Classificatie">
                <Row icon={Tag} label="Status">{st.label}</Row>
                <Row icon={Tag} label="Tags">{employee.tags?.length ? employee.tags.join(', ') : '—'}</Row>
                <Row icon={FileText} label="Notities">{employee.notes || '—'}</Row>
              </DetailSection>
            </>
          )}
        </div>
      )}

      {profileTab === 'historie' && (
        <div className="py-4">
          {employee.onboardingLogs && employee.onboardingLogs.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left p-2">Template</th>
                    <th className="text-left p-2">Verstuurd op</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.onboardingLogs.map(log => (
                    <tr key={log.id} className="border-t">
                      <td className="p-2">{log.templateName || `Template #${log.templateId}`}</td>
                      <td className="p-2 text-gray-600">{new Date(log.sentAt).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="p-2">
                        <Badge variant="outline" className={log.status === 'verzonden' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                          {log.status === 'verzonden' ? 'Verzonden ✓' : 'Mislukt'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nog geen onboarding mails verstuurd</p>
          )}
        </div>
      )}

      {profileTab === 'shifts' && (
        <div className="py-12 text-center text-sm text-gray-400">
          Shift-historie volgt binnenkort
        </div>
      )}
    </>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 border-b pb-1">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center text-sm py-1">
      <Icon className="h-3.5 w-3.5 text-gray-400 mr-2 shrink-0" />
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{children}</span>
    </div>
  );
}

function EmployeeForm({
  initial, onChange, onSubmit, onCancel, isSaving,
}: {
  initial: Partial<Employee>;
  onChange: (d: Partial<Employee>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const set = (k: keyof Employee, v: any) => onChange({ ...initial, [k]: v });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Voornaam"><Input value={initial.firstName || ''} onChange={e => set('firstName', e.target.value)} /></Field>
        <Field label="Achternaam"><Input value={initial.lastName || ''} onChange={e => set('lastName', e.target.value)} /></Field>
        <Field label="E-mail"><Input type="email" value={initial.email || ''} onChange={e => set('email', e.target.value)} /></Field>
        <Field label="Telefoon"><Input value={initial.phone || ''} onChange={e => set('phone', e.target.value)} /></Field>
        <Field label="Geboortedatum"><Input type="date" value={initial.birthDate || ''} onChange={e => set('birthDate', e.target.value)} /></Field>
        <Field label="Stad"><Input value={initial.city || ''} onChange={e => set('city', e.target.value)} /></Field>
        <Field label="Taal">
          <Select value={initial.language || 'Nederlands'} onValueChange={v => set('language', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Nederlands">Nederlands</SelectItem><SelectItem value="Engels">Engels</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={initial.status || 'nieuw'} onValueChange={v => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nieuw">Nieuw</SelectItem>
              <SelectItem value="actief">Actief</SelectItem>
              <SelectItem value="inactief">Inactief</SelectItem>
              <SelectItem value="uitgestroomd">Uitgestroomd</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Functie"><Input value={initial.functie || ''} onChange={e => set('functie', e.target.value)} /></Field>
        <Field label="Branche">
          <Select value={initial.branche || ''} onValueChange={v => set('branche', v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Opdrachtgever"><Input value={initial.opdrachtgever || ''} onChange={e => set('opdrachtgever', e.target.value)} /></Field>
        <Field label="Contract">
          <Select value={initial.contractType || ''} onValueChange={v => set('contractType', v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{CONTRACT_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Startdatum"><Input type="date" value={initial.startDate || ''} onChange={e => set('startDate', e.target.value)} /></Field>
      </div>
      <Field label="Notities">
        <textarea
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          rows={3}
          value={initial.notes || ''}
          onChange={e => set('notes', e.target.value)}
        />
      </Field>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Annuleren</Button>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSaving}>
          {isSaving ? 'Opslaan…' : 'Opslaan'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

function CreateEmployeeModal({ onClose, onCreated }: { onClose: () => void; onCreated: (emp: Employee) => void }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<Partial<Employee>>({ language: 'Nederlands', status: 'nieuw' });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Employee>) => apiRequest('POST', '/api/admin/employees', data) as Promise<Employee>,
    onSuccess: (emp: Employee) => {
      toast({ title: `Medewerker ${emp.firstName} ${emp.lastName} aangemaakt ✓` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      onCreated(emp);
    },
    onError: (err: any) => {
      toast({ title: 'Aanmaken mislukt', description: err?.message || 'Er ging iets mis', variant: 'destructive' });
    },
  });

  const canSubmit = draft.firstName && draft.lastName && draft.email;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-employee">
        <DialogHeader><DialogTitle>Nieuwe medewerker</DialogTitle></DialogHeader>
        <EmployeeForm
          initial={draft}
          onChange={setDraft}
          onSubmit={() => canSubmit && createMutation.mutate(draft)}
          onCancel={onClose}
          isSaving={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
