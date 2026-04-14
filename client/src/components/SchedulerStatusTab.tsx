import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock, Clock, CheckCircle, AlertTriangle, RefreshCw, Play,
  Settings, Send, Zap, Info, History,
} from "lucide-react";

type SchedulerLog = {
  id: number;
  type: string;
  campaign_id: number | null;
  bericht: string | null;
  timestamp: string;
};

type GeplandeCampagne = {
  id: number;
  name: string;
  status: string;
  scheduled_at: string | null;
  werkelijk_verzend_op: string | null;
  alleen_werkdagen: boolean;
  tijdvenster_start: string;
  tijdvenster_eind: string;
};

type SchedulerStatus = {
  logs: SchedulerLog[];
  geplandeCampagnes: GeplandeCampagne[];
  serverTijd: string;
};

type Instellingen = Record<string, string>;

const LOG_TYPE_STYLES: Record<string, { cls: string; label: string }> = {
  campagne_ingepland:   { cls: 'bg-blue-100 text-blue-700',   label: 'Ingepland' },
  campagne_verschoven:  { cls: 'bg-amber-100 text-amber-700', label: 'Verschoven' },
  planning_geannuleerd: { cls: 'bg-slate-100 text-slate-600', label: 'Geannuleerd' },
  verzending_gestart:   { cls: 'bg-green-100 text-green-700', label: 'Verzending gestart' },
  verzending_voltooid:  { cls: 'bg-green-100 text-green-700', label: 'Voltooid' },
  verzending_fout:      { cls: 'bg-red-100 text-red-700',     label: 'Fout' },
  scheduler_run:        { cls: 'bg-purple-100 text-purple-600', label: 'Scheduler' },
  scheduler_error:      { cls: 'bg-red-100 text-red-700',     label: 'Fout' },
};

export default function SchedulerStatusTab() {
  const { toast } = useToast();
  const [instEdit, setInstEdit] = useState(false);
  const [alleenWerkdagen, setAlleenWerkdagen] = useState(true);
  const [tijdvensterStart, setTijdvensterStart] = useState('08:00');
  const [tijdvensterEind, setTijdvensterEind] = useState('18:00');

  const { data: status, isLoading, refetch } = useQuery<SchedulerStatus>({
    queryKey: ['/api/admin/scheduler/status'],
    refetchInterval: 30000,
  });

  const { data: instellingen } = useQuery<Instellingen>({
    queryKey: ['/api/admin/instellingen/verzend'],
  });

  // Sync instellingen to edit state when loaded
  const prevInstRef = useRef<string>('');
  if (instellingen) {
    const key = JSON.stringify(instellingen);
    if (key !== prevInstRef.current) {
      prevInstRef.current = key;
      setAlleenWerkdagen(instellingen['verzend_alleen_werkdagen'] === '1');
      setTijdvensterStart(instellingen['verzend_tijdvenster_start'] || '08:00');
      setTijdvensterEind(instellingen['verzend_tijdvenster_eind'] || '18:00');
    }
  }

  const runMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/scheduler/run', {});
      if (!res.ok) throw new Error('Fout bij uitvoeren');
      return res.json();
    },
    onSuccess: (data) => {
      refetch();
      toast({
        title: '✅ Scheduler uitgevoerd',
        description: `${data.verwerkt ?? 0} campagne(s) verwerkt`,
      });
    },
    onError: (err: Error) => toast({ title: 'Fout', description: err.message, variant: 'destructive' }),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', '/api/admin/instellingen/verzend', {
        verzend_alleen_werkdagen: alleenWerkdagen ? '1' : '0',
        verzend_tijdvenster_start: tijdvensterStart,
        verzend_tijdvenster_eind: tijdvensterEind,
      });
      if (!res.ok) throw new Error('Opslaan mislukt');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/instellingen/verzend'] });
      setInstEdit(false);
      toast({ title: '✅ Instellingen opgeslagen' });
    },
    onError: (err: Error) => toast({ title: 'Fout', description: err.message, variant: 'destructive' }),
  });

  const geplandCampagnes = status?.geplandeCampagnes ?? [];
  const logs = (status?.logs ?? []).slice(0, 20);

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-purple-600" />
            Verzend Scheduler
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Bewaking van geplande campagnes en verzendtijdlogica</p>
        </div>
        <div className="flex items-center gap-2">
          {status?.serverTijd && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Servertijd: {new Date(status.serverTijd).toLocaleTimeString('nl-NL')}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Vernieuwen
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700" disabled={runMut.isPending} onClick={() => runMut.mutate()}>
            {runMut.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
            Nu uitvoeren
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <div>
            <p className="text-xs text-green-600 font-medium">Status</p>
            <p className="text-sm font-semibold text-green-800">Actief (elke 5 min)</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium mb-0.5">Geplande campagnes</p>
          <p className="text-2xl font-bold text-blue-800">{geplandCampagnes.length}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium mb-0.5">Recente logs</p>
          <p className="text-2xl font-bold text-slate-700">{logs.length}</p>
        </div>
      </div>

      {/* Geplande campagnes */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Send className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-700">Ingeplande campagnes</h3>
          {geplandCampagnes.length > 0 && (
            <Badge className="bg-blue-100 text-blue-700 text-xs px-1.5">{geplandCampagnes.length}</Badge>
          )}
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />Laden...
          </div>
        ) : geplandCampagnes.length === 0 ? (
          <div className="p-6 text-center">
            <Info className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Geen ingeplande campagnes</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {geplandCampagnes.map(c => {
              const werkelijk = c.werkelijk_verzend_op ? new Date(c.werkelijk_verzend_op) : null;
              const isPast = werkelijk ? werkelijk.getTime() < Date.now() : false;
              return (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      {c.alleen_werkdagen && <span>Werkdagen</span>}
                      <span>Venster: {c.tijdvenster_start}–{c.tijdvenster_eind}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    {werkelijk ? (
                      <>
                        <p className={`text-xs font-medium capitalize ${isPast ? 'text-orange-600' : 'text-blue-700'}`}>
                          {werkelijk.toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {isPast && <p className="text-[10px] text-orange-500">Wacht op uitvoering...</p>}
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">Geen moment</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recente logs */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Recente scheduler logs</h3>
        </div>
        {logs.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">Nog geen logs</div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {logs.map(log => {
              const style = LOG_TYPE_STYLES[log.type] ?? { cls: 'bg-slate-100 text-slate-600', label: log.type };
              return (
                <div key={log.id} className="px-4 py-2.5 flex items-start gap-3">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${style.cls}`}>
                    {style.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-600 truncate">{log.bericht || '—'}</p>
                    {log.campaign_id && (
                      <p className="text-[10px] text-slate-400">Campagne #{log.campaign_id}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Standaard verzend instellingen */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">Standaard verzend­instellingen</h3>
          </div>
          {!instEdit ? (
            <Button size="sm" variant="outline" onClick={() => setInstEdit(true)}>Bewerken</Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setInstEdit(false)}>Annuleren</Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
                {saveMut.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Opslaan
              </Button>
            </div>
          )}
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-slate-500">
            Deze instellingen worden gebruikt als standaard bij het aanmaken van nieuwe campagnes. Per campagne kunnen ze worden overschreven.
          </p>
          {instEdit ? (
            <>
              <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-700">Alleen werkdagen</p>
                  <p className="text-xs text-slate-400">Weekend worden automatisch overgeslagen</p>
                </div>
                <Switch checked={alleenWerkdagen} onCheckedChange={setAlleenWerkdagen} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5 block">Tijdvenster start</Label>
                  <Input type="time" value={tijdvensterStart} onChange={e => setTijdvensterStart(e.target.value)} className="text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5 block">Tijdvenster eind</Label>
                  <Input type="time" value={tijdvensterEind} onChange={e => setTijdvensterEind(e.target.value)} className="text-sm" />
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                <p className="text-xs text-slate-400 mb-0.5">Alleen werkdagen</p>
                <p className="text-sm font-medium text-slate-700">
                  {instellingen?.['verzend_alleen_werkdagen'] === '1' ? (
                    <span className="flex items-center gap-1 text-green-700"><CheckCircle className="h-3.5 w-3.5" />Ja</span>
                  ) : 'Nee'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                <p className="text-xs text-slate-400 mb-0.5">Tijdvenster start</p>
                <p className="text-sm font-semibold text-slate-700">{instellingen?.['verzend_tijdvenster_start'] || '08:00'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                <p className="text-xs text-slate-400 mb-0.5">Tijdvenster eind</p>
                <p className="text-sm font-semibold text-slate-700">{instellingen?.['verzend_tijdvenster_eind'] || '18:00'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
