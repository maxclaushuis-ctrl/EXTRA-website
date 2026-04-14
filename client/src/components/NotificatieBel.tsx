import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlaskConical, Bell, BellDot, Megaphone, Check, Trophy, AlertCircle, Info } from "lucide-react";

type Notificatie = {
  id: number;
  type: string;
  titel: string;
  bericht: string;
  link: string | null;
  gelezen: boolean;
  aangemaaktOp: string;
};

type NotificatiesResponse = {
  notificaties: Notificatie[];
  ongelezen: number;
};

function getIcon(type: string) {
  switch (type) {
    case 'ab_winnaar': return <Trophy className="h-3.5 w-3.5 text-yellow-500" />;
    case 'ab_test': return <FlaskConical className="h-3.5 w-3.5 text-purple-500" />;
    case 'campagne': return <Megaphone className="h-3.5 w-3.5 text-blue-500" />;
    case 'waarschuwing': return <AlertCircle className="h-3.5 w-3.5 text-orange-500" />;
    default: return <Info className="h-3.5 w-3.5 text-slate-400" />;
  }
}

function tijdGeleden(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Zojuist';
  if (mins < 60) return `${mins}m`;
  const uren = Math.floor(mins / 60);
  if (uren < 24) return `${uren}u`;
  return `${Math.floor(uren / 24)}d`;
}

export default function NotificatieBel({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery<NotificatiesResponse>({
    queryKey: ['/api/admin/notificaties'],
    queryFn: () => fetch('/api/admin/notificaties', { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 30_000,
  });

  const markeerGelezenMut = useMutation({
    mutationFn: () => apiRequest('PUT', '/api/admin/notificaties/markeer-gelezen', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/notificaties'] }),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notificaties = data?.notificaties || [];
  const ongelezen = data?.ongelezen || 0;

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && ongelezen > 0) {
      setTimeout(() => markeerGelezenMut.mutate(), 2000);
    }
  };

  const handleKlik = (n: Notificatie) => {
    setOpen(false);
    if (n.link && onNavigate) {
      const parts = n.link.split(':');
      if (parts.length > 1) onNavigate(parts[1]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 relative text-slate-500 hover:text-slate-700"
        onClick={handleOpen}
        title="A/B Test notificaties"
      >
        {ongelezen > 0 ? (
          <BellDot className="h-4 w-4 text-purple-600" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {ongelezen > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-600 rounded-full text-[9px] text-white font-bold flex items-center justify-center leading-none">
            {ongelezen > 9 ? '9+' : ongelezen}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-slate-800">Notificaties</span>
              {ongelezen > 0 && (
                <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{ongelezen}</span>
              )}
            </div>
            {ongelezen > 0 && (
              <button
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                onClick={() => markeerGelezenMut.mutate()}
              >
                <Check className="h-3 w-3" />Alles gelezen
              </button>
            )}
          </div>

          <ScrollArea className="max-h-80">
            {notificaties.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Geen notificaties</p>
              </div>
            ) : (
              <div>
                {notificaties.map(n => (
                  <button
                    key={n.id}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.gelezen ? 'bg-purple-50/50' : ''}`}
                    onClick={() => handleKlik(n)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex-shrink-0">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold truncate ${!n.gelezen ? 'text-slate-800' : 'text-slate-600'}`}>
                            {n.titel}
                          </p>
                          <span className="text-[10px] text-slate-300 flex-shrink-0 mt-0.5">
                            {tijdGeleden(n.aangemaaktOp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.bericht}</p>
                      </div>
                      {!n.gelezen && (
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {notificaties.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
              <p className="text-[10px] text-slate-400 text-center">Automatisch gegenereerd door A/B test engine</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
