import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Bell, X, Check, UserPlus, FileText, ClipboardList, AlertTriangle, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

type NotificationType = 'new_candidate' | 'cv_uploaded' | 'sollicitatie_form' | 'twv_expiry' | 'staffing_request' | 'interview_reminder';

interface AdminNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  candidateId: number | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  new_candidate:     { icon: <UserPlus className="h-4 w-4" />,      color: 'text-purple-600', bg: 'bg-purple-50' },
  cv_uploaded:       { icon: <FileText className="h-4 w-4" />,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
  sollicitatie_form: { icon: <ClipboardList className="h-4 w-4" />,  color: 'text-indigo-600', bg: 'bg-indigo-50' },
  twv_expiry:        { icon: <AlertTriangle className="h-4 w-4" />,  color: 'text-orange-600', bg: 'bg-orange-50' },
  staffing_request:  { icon: <Building2 className="h-4 w-4" />,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
  interview_reminder:{ icon: <Calendar className="h-4 w-4" />,       color: 'text-rose-600',   bg: 'bg-rose-50'   },
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'zojuist';
  if (diffMin < 60) return `${diffMin}m geleden`;
  if (diffH < 24) return `${diffH}u geleden`;
  if (diffD === 1) return 'gisteren';
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery<AdminNotification[]>({
    queryKey: ['/api/admin/notifications'],
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const markAllRead = useMutation({
    mutationFn: () => apiRequest('PATCH', '/api/admin/notifications/read-all', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] }),
  });

  const markOneRead = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/admin/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] }),
  });

  // Sluit bij klik buiten
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleNotificationClick(n: AdminNotification) {
    if (!n.readAt) markOneRead.mutate(n.id);
    if (n.link) {
      // Navigate via query params if it includes ?tab=
      const url = new URL(n.link, window.location.origin);
      window.location.href = url.toString();
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Notificaties"
        className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
          unreadCount > 0
            ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-sm text-gray-800">Notificaties</span>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {unreadCount} nieuw
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50"
                  onClick={() => markAllRead.mutate()}
                >
                  <Check className="h-3 w-3" /> Alles gelezen
                </button>
              )}
              <button
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Lijst */}
          <div className="overflow-y-auto max-h-[480px] overscroll-contain">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">Geen notificaties</p>
                <p className="text-xs text-gray-400 mt-1">Nieuwe meldingen verschijnen hier automatisch.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => {
                  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.new_candidate;
                  const isUnread = !n.readAt;
                  return (
                    <div
                      key={n.id}
                      className={`group w-full px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${cfg.bg} ${cfg.color} flex items-center justify-center mt-0.5`}>
                        {cfg.icon}
                      </div>
                      <button
                        className="flex-1 min-w-0 text-left"
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-tight ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {n.title}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{formatTime(n.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      </button>
                      <div className="flex-shrink-0 flex items-center ml-1">
                        {isUnread ? (
                          <button
                            title="Markeer als gelezen"
                            onClick={(e) => { e.stopPropagation(); markOneRead.mutate(n.id); }}
                            className="w-6 h-6 rounded-full bg-blue-500 hover:bg-green-500 flex items-center justify-center transition-colors"
                          >
                            <Check className="h-3.5 w-3.5 text-white" />
                          </button>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
