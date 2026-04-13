import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Gift, Plus, Pencil, Trash2, Phone, Mail, Building2,
  PartyPopper, Calendar, Search, AlertCircle
} from 'lucide-react';

interface ClientBirthday {
  id: number;
  name: string;
  company: string | null;
  role: string | null;
  birthDay: number;
  birthMonth: number;
  birthYear: number | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
}

const MONTHS = [
  '', 'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'
];

function daysUntilBirthday(day: number, month: number): number {
  const today = new Date();
  const thisYear = today.getFullYear();
  let next = new Date(thisYear, month - 1, day);
  if (next < today) next = new Date(thisYear + 1, month - 1, day);
  // Same day = 0
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((next.getTime() - todayMidnight.getTime()) / 86400000);
}

function formatBirthday(day: number, month: number, year?: number | null): string {
  return `${day} ${MONTHS[month]}${year ? ` ${year}` : ''}`;
}

function getAge(year: number | null | undefined, day: number, month: number): number | null {
  if (!year) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
  return age;
}

const EMPTY_FORM = {
  name: '', company: '', role: '', birthDay: '', birthMonth: '',
  birthYear: '', email: '', phone: '', notes: '',
};

export default function VerjaardagenTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClientBirthday | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ClientBirthday | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: birthdays = [], isLoading } = useQuery<ClientBirthday[]>({
    queryKey: ['/api/admin/client-birthdays'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/client-birthdays', data),
    onSuccess: (newBirthday: any) => {
      queryClient.setQueryData(['/api/admin/client-birthdays'], (old: any) =>
        [...(old ?? []), newBirthday]
      );
      toast({ title: 'Persoon toegevoegd' });
      closeModal();
    },
    onError: () => toast({ title: 'Fout bij opslaan', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest('PATCH', `/api/admin/client-birthdays/${id}`, data),
    onSuccess: (updated: any) => {
      queryClient.setQueryData(['/api/admin/client-birthdays'], (old: any) =>
        (old ?? []).map((b: any) => b.id === updated.id ? updated : b)
      );
      toast({ title: 'Gewijzigd' });
      closeModal();
    },
    onError: () => toast({ title: 'Fout bij opslaan', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/client-birthdays/${id}`),
    onSuccess: (_: any, deletedId: number) => {
      queryClient.setQueryData(['/api/admin/client-birthdays'], (old: any) =>
        (old ?? []).filter((b: any) => b.id !== deletedId)
      );
      toast({ title: 'Verwijderd' });
      setDeleteConfirm(null);
    },
  });

  function openAdd() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(b: ClientBirthday) {
    setEditTarget(b);
    setForm({
      name: b.name,
      company: b.company ?? '',
      role: b.role ?? '',
      birthDay: String(b.birthDay),
      birthMonth: String(b.birthMonth),
      birthYear: b.birthYear ? String(b.birthYear) : '',
      email: b.email ?? '',
      phone: b.phone ?? '',
      notes: b.notes ?? '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
  }

  function handleSubmit() {
    const day = parseInt(form.birthDay);
    const month = parseInt(form.birthMonth);
    if (!form.name.trim()) return toast({ title: 'Naam is verplicht', variant: 'destructive' });
    if (isNaN(day) || day < 1 || day > 31) return toast({ title: 'Ongeldige dag', variant: 'destructive' });
    if (isNaN(month) || month < 1 || month > 12) return toast({ title: 'Ongeldige maand (1–12)', variant: 'destructive' });

    const payload: any = {
      name: form.name.trim(),
      company: form.company.trim() || null,
      role: form.role.trim() || null,
      birthDay: day,
      birthMonth: month,
      birthYear: form.birthYear ? parseInt(form.birthYear) : null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  // Sorteer op dagen tot verjaardag
  const sorted = [...birthdays].sort((a, b) =>
    daysUntilBirthday(a.birthDay, a.birthMonth) - daysUntilBirthday(b.birthDay, b.birthMonth)
  );

  const filtered = sorted.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.company ?? '').toLowerCase().includes(q) ||
      (b.role ?? '').toLowerCase().includes(q)
    );
  });

  const upcoming = sorted.filter(b => daysUntilBirthday(b.birthDay, b.birthMonth) <= 14);
  const todayBirthdays = sorted.filter(b => daysUntilBirthday(b.birthDay, b.birthMonth) === 0);

  // Bouw de komende 7 dagen op
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const jarigen = birthdays.filter(b => b.birthDay === day && b.birthMonth === month);
    const isToday = i === 0;
    const weekday = d.toLocaleDateString('nl-NL', { weekday: 'short' });
    return { day, month, jarigen, isToday, weekday, label: `${day} ${MONTHS[month].slice(0, 3)}` };
  });

  function getBadge(days: number) {
    if (days === 0) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">🎂 Vandaag!</Badge>;
    if (days <= 3) return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Over {days} dag{days !== 1 ? 'en' : ''}</Badge>;
    if (days <= 7) return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Over {days} dagen</Badge>;
    if (days <= 14) return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Over {days} dagen</Badge>;
    return null;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            Verjaardagen opdrachtgevers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Houd verjaardagen bij en stuur iets leuks op de grote dag.
            Meldingen worden 3 dagen van tevoren verstuurd.
          </p>
        </div>
        <Button onClick={openAdd} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Persoon toevoegen
        </Button>
      </div>

      {/* Deze week jarig — weekstrip */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> Deze week
        </p>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(({ day, month, weekday, label, jarigen, isToday }) => {
            const hasJarige = jarigen.length > 0;
            return (
              <div
                key={`${day}-${month}`}
                className={`rounded-xl p-2.5 flex flex-col items-center gap-1.5 border transition-colors ${
                  isToday
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : hasJarige
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'text-purple-200' : 'text-gray-400'}`}>
                  {weekday}
                </span>
                <span className={`text-lg font-bold leading-none ${isToday ? 'text-white' : hasJarige ? 'text-yellow-700' : 'text-gray-700'}`}>
                  {day}
                </span>
                {hasJarige ? (
                  <div className="flex flex-col items-center gap-0.5 w-full">
                    {jarigen.map(b => (
                      <div key={b.id} className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-white text-[10px] font-bold" title={b.name}>
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-purple-400' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Namen onder de strip */}
        {weekDays.some(d => d.jarigen.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {weekDays.filter(d => d.jarigen.length > 0).map(({ label, jarigen, isToday }) =>
              jarigen.map(b => (
                <span key={b.id} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  isToday ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {isToday ? '🎂' : '🎁'} {b.name}
                  <span className="text-gray-400 font-normal">{label}</span>
                </span>
              ))
            )}
          </div>
        )}
      </div>

      {/* Binnenkort jarig — komende 14 dagen */}
      {upcoming.length > 0 && (
        <Card className="mb-5 border-purple-100 bg-purple-50/30">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-purple-600 flex items-center gap-2">
              <PartyPopper className="h-3.5 w-3.5" />
              Komende 14 dagen
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {upcoming.map(b => {
                const days = daysUntilBirthday(b.birthDay, b.birthMonth);
                return (
                  <div key={b.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-purple-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{b.name}</p>
                        {b.company && <p className="text-xs text-gray-400">{b.company}{b.role ? ` · ${b.role}` : ''}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatBirthday(b.birthDay, b.birthMonth)}</span>
                      {getBadge(days)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zoekbalk + lijst */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Zoek op naam, bedrijf…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <span className="text-xs text-gray-400">{birthdays.length} personen</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-400">Laden…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <Gift className="h-10 w-10 opacity-20" />
              <p className="text-sm">{search ? 'Geen resultaten' : 'Nog geen personen toegevoegd'}</p>
              {!search && (
                <Button variant="outline" size="sm" onClick={openAdd} className="mt-1">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Eerste persoon toevoegen
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(b => {
                const days = daysUntilBirthday(b.birthDay, b.birthMonth);
                const age = getAge(b.birthYear, b.birthDay, b.birthMonth);
                return (
                  <div key={b.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm shrink-0">
                      {b.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-800">{b.name}</span>
                        {getBadge(days)}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {b.company && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />{b.company}{b.role ? ` · ${b.role}` : ''}
                          </span>
                        )}
                        {b.email && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />{b.email}
                          </span>
                        )}
                        {b.phone && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />{b.phone}
                          </span>
                        )}
                      </div>
                      {b.notes && <p className="text-xs text-gray-400 mt-0.5 italic truncate">{b.notes}</p>}
                    </div>

                    {/* Verjaardag */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium">{formatBirthday(b.birthDay, b.birthMonth)}</span>
                        {age !== null && <span className="text-xs text-gray-400">({age + 1} jaar)</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {days === 0 ? '🎂 Vandaag!' : `over ${days} dagen`}
                      </p>
                    </div>

                    {/* Acties */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button
                        onClick={() => openEdit(b)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"
                        title="Bewerken"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(b)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600"
                        title="Verwijderen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toevoegen / bewerken modal */}
      <Dialog open={modalOpen} onOpenChange={open => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Persoon bewerken' : 'Persoon toevoegen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs mb-1 block">Naam *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="bijv. Jan de Vries" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Bedrijf</Label>
                <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="bijv. Hotel Arena" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Functie</Label>
                <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="bijv. F&B Manager" />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Verjaardag *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={form.birthDay}
                  onChange={e => setForm(f => ({ ...f, birthDay: e.target.value }))}
                  placeholder="Dag"
                  type="number" min={1} max={31}
                />
                <Input
                  value={form.birthMonth}
                  onChange={e => setForm(f => ({ ...f, birthMonth: e.target.value }))}
                  placeholder="Maand"
                  type="number" min={1} max={12}
                />
                <Input
                  value={form.birthYear}
                  onChange={e => setForm(f => ({ ...f, birthYear: e.target.value }))}
                  placeholder="Jaar (opt.)"
                  type="number" min={1940} max={2010}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Dag / Maand (1–12) / Jaar (optioneel)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">E-mail</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="naam@bedrijf.nl" type="email" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Telefoon</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="06-12345678" />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Notities</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="bijv. houdt van boekenbon, stuur kaart per post" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeModal} disabled={isPending}>Annuleren</Button>
              <Button onClick={handleSubmit} disabled={isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
                {isPending ? 'Opslaan…' : (editTarget ? 'Opslaan' : 'Toevoegen')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verwijder bevestiging */}
      <Dialog open={deleteConfirm !== null} onOpenChange={open => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Verwijderen
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Weet je zeker dat je <span className="font-semibold">{deleteConfirm?.name}</span> wilt verwijderen?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuleren</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            >
              {deleteMutation.isPending ? 'Verwijderen…' : 'Verwijderen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
