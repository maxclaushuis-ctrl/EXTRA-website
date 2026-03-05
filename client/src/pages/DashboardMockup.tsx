import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Gift, LayoutDashboard, Trophy, Tag, BarChart3, Mail, Receipt,
  RefreshCw, Settings2, TrendingUp, Clock, UserPlus, UserCheck, Eye, Star, Trash2,
  Calendar, Search, Plus, MoreHorizontal, Phone, ChevronDown, LogOut, FileText, ChefHat, Building2, X, Menu,
  Bell, BellOff, ArrowUpDown, ShieldAlert, Download, AlertTriangle, CheckCircle2, GripVertical
} from 'lucide-react';

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  points: number;
  role: string;
  functionType?: string;
  lastLogin?: string;
};

type Candidate = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  functionType: string;
  status: string;
  city?: string;
  nationality?: string;
  language?: string;
  experienceLevel?: string;
  horecaExperience?: string;
  cvUrl?: string;
  hasCv?: boolean;
  cvFilename?: string;
  createdAt: string;
  interviewDate?: string;
  interviewTime?: string;
  assignedTo?: string;
};

type Transaction = {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  user?: User;
};

const sidebarItems = [
  { icon: UserCheck, label: 'Kandidaten', tab: 'kandidaten' },
  { icon: UserPlus, label: 'Sollicitanten', tab: 'sollicitanten' },
  { icon: ShieldAlert, label: 'TWV', tab: 'twv' },
];

type TwvCandidate = {
  id: number;
  firstName: string;
  lastName: string;
  nationality?: string;
  functionType: string;
  twvStatus?: 'twv_nodig' | 'twv_aangevraagd' | 'info_nodig' | 'twv_verstrekt' | 'twv_verlopen' | null;
  twvStartDate?: string | null;
  twvEndDate?: string | null;
  createdAt: string;
};

function getFunctionBadgeColor(functionType: string): string {
  switch (functionType?.toLowerCase()) {
    case 'housekeeping': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'horecamedewerker': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'chef': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'receptie':
    case 'front-office': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function getStatusBadgeColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'aangenomen': return 'bg-green-100 text-green-700 border-green-200';
    case 'afgewezen': return 'bg-red-100 text-red-700 border-red-200';
    case 'in_behandeling': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'aangenomen': return 'Aangenomen';
    case 'afgewezen': return 'Afgewezen';
    case 'in_behandeling': return 'In behandeling';
    default: return status;
  }
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

function daysSince(dateStr: string): number {
  if (!dateStr) return 999;
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardMockup() {
  const { user, isAuthenticated, login, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { notifications, clearNotifications } = useWebSocket();
  const { isSubscribed, isLoading: pushLoading, subscribe, unsubscribe, isIOSSafari, isIOSPWA, error: pushError } = usePushNotifications();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const seenNotifIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    document.title = 'Admin Dashboard – EXTRA';
  }, []);

  useEffect(() => {
    notifications.forEach((notif: any) => {
      if (notif.type === 'new_candidate') {
        const id = `${notif.type}-${notif.data?.candidateId}`;
        if (!seenNotifIds.current.has(id)) {
          seenNotifIds.current.add(id);
          toast({
            title: '📋 Nieuw formulier ingediend',
            description: notif.message || 'Er is een nieuwe kandidaat aangemeld.',
            duration: 8000,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
        }
      }
      if (notif.type === 'new_staffing_request') {
        const id = `${notif.type}-${notif.data?.requestId}`;
        if (!seenNotifIds.current.has(id)) {
          seenNotifIds.current.add(id);
          toast({
            title: '🏢 Nieuwe personeelsaanvraag',
            description: notif.message || 'Een werkgever heeft een personeelsaanvraag ingediend.',
            duration: 8000,
          });
        }
      }
    });
  }, [notifications, toast]);

  const [activeTab, setActiveTab] = useState('kandidaten');
  const [periodFilter, setPeriodFilter] = useState('deze-maand');
  const [functionFilter, setFunctionFilter] = useState('alle');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('alle');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [kandidatenSubtab, setKandidatenSubtab] = useState<'in_proces' | 'gesprek_gepland' | 'afgewezen'>('in_proces');
  const [kandidatenSearch, setKandidatenSearch] = useState('');
  const [kandidatenFunctionFilter, setKandidatenFunctionFilter] = useState('alle');
  const [kandidatenTaalFilter, setKandidatenTaalFilter] = useState('alle');
  const [kanSortDesc, setKanSortDesc] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedKandidate, setSelectedKandidate] = useState<Candidate | null>(null);
  const [kanDetailOpen, setKanDetailOpen] = useState(false);
  const [rejectConfirmId, setRejectConfirmId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<'diensten' | 'cv'>('diensten');
  const [cvPreviewOpen, setCvPreviewOpen] = useState(false);
  const [cvPreviewCandidate, setCvPreviewCandidate] = useState<Candidate | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);

  useEffect(() => {
    if (!cvPreviewOpen || !cvPreviewCandidate) {
      setDocxHtml(null);
      setDocxError(null);
      setDocxLoading(false);
      return;
    }
    const filename = cvPreviewCandidate.cvFilename || '';
    const isDocx = filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc');
    if (!isDocx || !cvPreviewCandidate.hasCv) return;

    setDocxLoading(true);
    setDocxHtml(null);
    setDocxError(null);

    const cvHtmlUrl = `/api/admin/candidates/${cvPreviewCandidate.id}/cv-html`;
    fetch(cvHtmlUrl, { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Fout bij laden');
        return r.text();
      })
      .then(html => {
        setDocxHtml(html);
        setDocxLoading(false);
      })
      .catch(() => {
        setDocxError('Het bestand kon niet worden geladen.');
        setDocxLoading(false);
      });
  }, [cvPreviewOpen, cvPreviewCandidate]);

  // TWV tab state
  const [twvSearch, setTwvSearch] = useState('');
  const [twvDragOver, setTwvDragOver] = useState<string | null>(null);
  const [twvEditOpen, setTwvEditOpen] = useState(false);
  const [twvEditCandidate, setTwvEditCandidate] = useState<TwvCandidate | null>(null);
  const [twvEditStartDate, setTwvEditStartDate] = useState('');
  const [twvEditEndDate, setTwvEditEndDate] = useState('');

  // Sollicitanten tab state
  const [appSearch, setAppSearch] = useState('');
  const [appTab, setAppTab] = useState('alle'); // 'alle' | 'horecamedewerker' | 'chef' | 'housekeeping' | 'frontoffice' | 'afgewezen'
  const [appInterviewerFilter, setAppInterviewerFilter] = useState('alle');
  const [appSortDesc, setAppSortDesc] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [appDetailOpen, setAppDetailOpen] = useState(false);
  const [appRejectConfirmApp, setAppRejectConfirmApp] = useState<any | null>(null);

  const [loginEmail, setLoginEmail] = useState('admin@extra.nl');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await login(loginEmail, loginPassword);
      // Invalidate all queries to refetch with new auth
      queryClient.invalidateQueries();
    } catch (error: any) {
      setLoginError(error.message || 'Inloggen mislukt');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    totalPointsAwarded?: number;
    totalRedemptions?: number;
    activeEmployees?: number;
    changes?: { pointsChange?: string; redemptionsChange?: string; activeUsersChange?: string };
  }>({
    queryKey: ['/api/stats'],
    enabled: isAuthenticated,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isAuthenticated,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: isAuthenticated,
  });

  const { data: candidatesData, isLoading: candidatesLoading, refetch: refetchCandidates } = useQuery<{ candidates: Candidate[]; total: number }>({
    queryKey: ['/api/admin/candidates'],
    enabled: isAuthenticated && user?.role === 'admin',
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const rejectCandidateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest('PATCH', `/api/admin/candidates/${id}/status`, { status: 'afgewezen', rejectionReason: reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] }); },
  });

  const { data: applicationsData, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery<{ applications: any[]; total: number }>({
    queryKey: ['/api/admin/applications'],
    enabled: isAuthenticated && user?.role === 'admin',
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const updateAppStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PATCH', `/api/admin/applications/${id}/status`, { status }),
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
      if (selectedApp?.id === id) setSelectedApp((prev: any) => prev ? { ...prev, status } : prev);
      toast({ title: 'Status bijgewerkt' });
    },
  });

  const { data: twvCandidates = [], isLoading: twvLoading, refetch: refetchTwv } = useQuery<TwvCandidate[]>({
    queryKey: ['/api/admin/twv'],
    enabled: isAuthenticated && user?.role === 'admin',
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const updateTwvMutation = useMutation({
    mutationFn: (data: { id: number; twvStatus?: string; twvStartDate?: string; twvEndDate?: string }) =>
      apiRequest('PATCH', `/api/admin/twv/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/twv'] });
      toast({ title: 'TWV status bijgewerkt' });
    },
    onError: () => toast({ title: 'Fout bij bijwerken TWV status', variant: 'destructive' }),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="bg-purple-600 text-white font-bold text-2xl px-4 py-2 rounded inline-block mb-4">
              EXTRA
            </div>
            <h1 className="text-xl font-bold text-gray-900">Beheerdersdashboard</h1>
            <p className="text-gray-500 mt-1">Log in om toegang te krijgen</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@extra.nl"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {loginError && (
              <p className="text-red-500 text-sm">{loginError}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Bezig met inloggen...' : 'Inloggen'}
            </Button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">
            Standaard: admin@extra.nl / admin123
          </p>
        </div>
      </div>
    );
  }

  const allCandidates = candidatesData?.candidates || [];

  const filteredCandidates = allCandidates.filter(c => {
    const matchesStatus = candidateStatusFilter === 'alle' || c.status === candidateStatusFilter;
    const searchTerm = candidateSearch.toLowerCase();
    const matchesSearch = candidateSearch === '' || 
      (c.firstName && c.firstName.toLowerCase().includes(searchTerm)) ||
      (c.lastName && c.lastName.toLowerCase().includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm)) ||
      (c.phone && c.phone.toLowerCase().includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  const candidateCounts = {
    total: allCandidates.length,
    inBehandeling: allCandidates.filter(c => c.status === 'in_behandeling').length,
    aangenomen: allCandidates.filter(c => c.status === 'aangenomen').length,
    afgewezen: allCandidates.filter(c => c.status === 'afgewezen').length,
  };

  // Applications (sollicitanten) computed
  const allApplications: any[] = applicationsData?.applications || [];
  const activeApplications = allApplications.filter(a => a.status !== 'afgewezen');
  const rejectedApplications = allApplications.filter(a => a.status === 'afgewezen');

  const filteredApplications = (() => {
    let base = appTab === 'afgewezen' ? rejectedApplications : activeApplications.filter(a => {
      if (appTab !== 'alle') {
        const fn = a.functionType === 'front-office' ? 'frontoffice' : a.functionType;
        if (fn !== appTab) return false;
      }
      return true;
    });
    const matchesIv = (a: any) => appInterviewerFilter === 'alle' || a.interviewer === appInterviewerFilter;
    const q = appSearch.toLowerCase();
    const matchesQ = (a: any) => !appSearch || `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q);
    base = base.filter(a => matchesIv(a) && matchesQ(a));
    return [...base].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return appSortDesc ? diff : -diff;
    });
  })();

  const appCounts = {
    alle: activeApplications.length,
    afgewezen: rejectedApplications.length,
    horecamedewerker: activeApplications.filter(a => a.functionType === 'horecamedewerker').length,
    housekeeping: activeApplications.filter(a => a.functionType === 'housekeeping').length,
    chef: activeApplications.filter(a => a.functionType === 'chef').length,
    frontoffice: activeApplications.filter(a => a.functionType === 'frontoffice' || a.functionType === 'front-office').length,
  };

  const topUsers = [...allUsers]
    .filter(u => u.role !== 'admin')
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 4);

  const inactiveUsers = [...allUsers]
    .filter(u => u.role !== 'admin' && daysSince(u.lastLogin || '') > 14)
    .sort((a, b) => daysSince(b.lastLogin || '') - daysSince(a.lastLogin || ''))
    .slice(0, 4);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const dashTotalUsers = 247;
  const dashActiveUsers = 189;
  const dashPoints = 12450;
  const dashGrowth = '+28';
  const gbTotalUsers = 893;
  const gbActiveUsers = 803;
  const gbPoints = 541300;
  const userGrowth = stats?.changes?.activeUsersChange || '+28';

  // Kandidaten tab computed values
  const kanInProces = allCandidates.filter(c => c.status !== 'afgewezen' && !c.interviewDate);
  const kanGesprekGepland = allCandidates.filter(c => c.status !== 'afgewezen' && !!c.interviewDate);
  const kanAfgewezen = allCandidates.filter(c => c.status === 'afgewezen');
  const kanSubsetMap: Record<string, Candidate[]> = { in_proces: kanInProces, gesprek_gepland: kanGesprekGepland, afgewezen: kanAfgewezen };
  const kanRawSubset: Candidate[] = kanSubsetMap[kandidatenSubtab] || [];
  const kanSubset = kanRawSubset
    .filter(c => {
      const q = kandidatenSearch.toLowerCase();
      const matchQ = q === '' ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q);
      const matchFn = kandidatenFunctionFilter === 'alle' || c.functionType === kandidatenFunctionFilter;
      const matchTaal = kandidatenTaalFilter === 'alle' ||
        (c.language || '').toLowerCase().includes(kandidatenTaalFilter.toLowerCase());
      return matchQ && matchFn && matchTaal;
    })
    .sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return kanSortDesc ? diff : -diff;
    });
  const kanMissingItems = (c: Candidate) => {
    const items: string[] = [];
    if (!c.cvUrl) items.push('CV ontbreekt');
    if (!c.interviewDate) items.push('Gesprek niet gepland');
    return items;
  };
  const kanExpLabel = (c: Candidate) => c.experienceLevel || c.horecaExperience || '—';

  return (
    <div className="normal-cursor flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-56 bg-white border-r border-gray-200 flex flex-col fixed h-full z-30 transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-purple-600 text-sm">EXTRAATJE</div>
              <div className="text-xs text-gray-400">Beheerdersdashboard</div>
            </div>
          </div>
          <button
            className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-2 text-xs text-gray-400 uppercase tracking-wider mt-4 px-4">Beheer</div>
        
        <nav className="flex-1 px-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors text-sm ${
                activeTab === item.tab 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 border-t">
          <div className="px-3 py-2 text-xs text-gray-400 truncate">{user?.firstName} {user?.lastName}</div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Uitloggen</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-56 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hidden md:flex">
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Welkom terug!</h2>
                <p className="text-xs text-gray-400">Dit is wat er vandaag gebeurt</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 relative ${isSubscribed ? 'text-purple-600' : 'text-gray-400'}`}
                onClick={async () => {
                  // iOS Safari without PWA: show installation guide
                  if (isIOSSafari && !isIOSPWA) {
                    setShowIOSGuide(true);
                    return;
                  }
                  // Must be logged in
                  if (!isAuthenticated) {
                    toast({
                      title: 'Niet ingelogd',
                      description: 'Log eerst in om meldingen in te schakelen.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  // Always try to subscribe fresh (handles stale old subscriptions)
                  const success = await subscribe();
                  if (success) {
                    toast({
                      title: '🔔 Meldingen ingeschakeld',
                      description: 'Je ontvangt nu een pushmelding bij elke nieuwe aanmelding.',
                    });
                  } else {
                    toast({
                      title: 'Kon meldingen niet inschakelen',
                      description: pushError || 'Zorg dat meldingen zijn toegestaan in je instellingen, of probeer opnieuw.',
                      variant: 'destructive',
                    });
                  }
                }}
                disabled={pushLoading}
                title={isSubscribed ? 'Notificaties uitschakelen' : 'Notificaties inschakelen'}
              >
                {isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                {isSubscribed && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </Button>
              <Avatar className="h-8 w-8 bg-purple-600">
                <AvatarFallback className="bg-purple-600 text-white text-xs">
                  {getInitials(user?.firstName || 'A', user?.lastName || 'D')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-6">
          {activeTab === 'kandidaten' ? (
            <div>
              {/* Kandidaat detail dialog */}
              <Dialog open={kanDetailOpen} onOpenChange={setKanDetailOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  {selectedKandidate && (
                    <>
                      <DialogHeader className="mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getFunctionBadgeColor(selectedKandidate.functionType)}`}>
                            {getInitials(selectedKandidate.firstName, selectedKandidate.lastName)}
                          </div>
                          <div>
                            <DialogTitle className="text-lg">{selectedKandidate.firstName} {selectedKandidate.lastName}</DialogTitle>
                            <p className="text-sm text-gray-500">{selectedKandidate.functionType}</p>
                          </div>
                        </div>
                      </DialogHeader>
                      <div className="space-y-3 text-sm">
                        {[
                          ['E-mail', selectedKandidate.email],
                          ['Telefoon', selectedKandidate.phone],
                          ['Woonplaats', selectedKandidate.city],
                          ['Geboortedatum', selectedKandidate.birthDate],
                          ['Nationaliteit', selectedKandidate.nationality],
                          ['Taal', selectedKandidate.language],
                          ['Aangemeld', new Date(selectedKandidate.createdAt).toLocaleDateString('nl-NL')],
                          ['Status', selectedKandidate.status],
                          ['Datum gesprek', selectedKandidate.interviewDate || null],
                        ].map(([label, value]) => value ? (
                          <div key={label as string} className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">{label}</span>
                            <span className="font-medium text-right">{value as string}</span>
                          </div>
                        ) : null)}
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>

              {/* Afwijs-bevestiging dialog met reden */}
              <Dialog open={rejectConfirmId !== null} onOpenChange={(open) => { if (!open) setRejectConfirmId(null); }}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Kandidaat afwijzen</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-gray-600 mb-3">Wat is de reden van afwijzing?</p>
                  <div className="space-y-2 mb-5">
                    {([
                      { value: 'diensten', label: 'Te weinig diensten beschikbaar' },
                      { value: 'cv', label: 'CV onvoldoende passend' },
                    ] as const).map(opt => (
                      <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${rejectReason === opt.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="rejectReason"
                          value={opt.value}
                          checked={rejectReason === opt.value}
                          onChange={() => setRejectReason(opt.value)}
                          className="accent-purple-600"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setRejectConfirmId(null)}>Annuleren</Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={rejectCandidateMutation.isPending}
                      onClick={() => {
                        if (rejectConfirmId !== null) {
                          rejectCandidateMutation.mutate({ id: rejectConfirmId, reason: rejectReason });
                          setRejectConfirmId(null);
                        }
                      }}
                    >
                      Afwijzen & e-mail sturen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* CV preview modal */}
              <Dialog open={cvPreviewOpen} onOpenChange={setCvPreviewOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-base">
                      CV — {cvPreviewCandidate?.firstName} {cvPreviewCandidate?.lastName}
                    </DialogTitle>
                  </DialogHeader>
                  {(() => {
                    if (!cvPreviewCandidate?.hasCv) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
                            <FileText className="h-7 w-7 text-red-400" />
                          </div>
                          <p className="text-gray-600 font-medium">Geen CV geüpload</p>
                          <p className="text-gray-400 text-sm mt-1">Deze kandidaat heeft nog geen CV geüpload.</p>
                        </div>
                      );
                    }
                    const cvUrl = `/api/admin/candidates/${cvPreviewCandidate.id}/cv`;
                    const filename = cvPreviewCandidate.cvFilename || '';
                    const isPdf = filename.toLowerCase().endsWith('.pdf');

                    if (!filename) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center mb-3">
                            <FileText className="h-7 w-7 text-yellow-500" />
                          </div>
                          <p className="text-gray-600 font-medium">CV geüpload maar niet beschikbaar</p>
                          <p className="text-gray-400 text-sm mt-1 mb-4">Dit CV is aangeleverd via een oudere versie van het systeem en kan niet worden voorvertoond.</p>
                          <a href={cvUrl} download className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg">
                            <FileText className="h-4 w-4" />
                            Probeer te downloaden
                          </a>
                        </div>
                      );
                    }

                    if (!isPdf) {
                      return (
                        <div className="flex flex-col gap-3">
                          {docxLoading && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-3" />
                              <p className="text-gray-500 text-sm">Word-document laden…</p>
                            </div>
                          )}
                          {docxError && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3">
                                <FileText className="h-7 w-7 text-red-400" />
                              </div>
                              <p className="text-gray-600 font-medium">Fout bij laden</p>
                              <p className="text-gray-400 text-sm mt-1 mb-4">{docxError}</p>
                            </div>
                          )}
                          {docxHtml && !docxLoading && (
                            <div
                              className="border border-gray-200 rounded-lg p-6 overflow-y-auto bg-white text-gray-800 text-sm leading-relaxed prose prose-sm max-w-none"
                              style={{ maxHeight: '60vh' }}
                              dangerouslySetInnerHTML={{ __html: docxHtml }}
                            />
                          )}
                          <div className="flex justify-end">
                            <a href={cvUrl} download className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg">
                              <FileText className="h-4 w-4" />
                              Downloaden ({filename.split('-').slice(-1)[0] || 'cv.docx'})
                            </a>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-3">
                        <div className="w-full rounded-lg overflow-hidden border border-gray-200" style={{ height: '65vh' }}>
                          <object
                            data={cvUrl}
                            type="application/pdf"
                            className="w-full h-full"
                          >
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
                              <FileText className="h-8 w-8 text-gray-400 mb-3" />
                              <p className="text-gray-600 text-sm mb-3">PDF kan niet worden voorvertoond in jouw browser.</p>
                              <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg">
                                Openen in nieuw tabblad
                              </a>
                            </div>
                          </object>
                        </div>
                        <div className="flex justify-end gap-2">
                          <a
                            href={cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 hover:bg-purple-50 text-sm font-medium rounded-lg"
                          >
                            Openen in nieuw tabblad
                          </a>
                          <a
                            href={cvUrl}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg"
                          >
                            <FileText className="h-4 w-4" />
                            Downloaden
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </DialogContent>
              </Dialog>

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold">Kandidaten</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Alle aanmeldingen via /aanmelden — realtime gesynchroniseerd</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                <Card className="bg-white border-l-4 border-l-purple-500">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs text-gray-500 mb-1">In proces</p>
                    <p className="text-2xl font-bold text-purple-700">{kanInProces.length}</p>
                    <p className="text-xs text-gray-400 hidden sm:block">Formulier ingevuld</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-blue-500">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs text-gray-500 mb-1 leading-tight">Gepland</p>
                    <p className="text-2xl font-bold text-blue-600">{kanGesprekGepland.length}</p>
                    <p className="text-xs text-gray-400 hidden sm:block">Interview ingepland</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-red-500">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs text-gray-500 mb-1">Afgewezen</p>
                    <p className="text-2xl font-bold text-red-600">{kanAfgewezen.length}</p>
                    <p className="text-xs text-gray-400 hidden sm:block">Niet geschikt</p>
                  </CardContent>
                </Card>
              </div>

              {/* Subtabs */}
              <div className="flex items-center gap-0 mb-4 border-b">
                {([
                  { key: 'in_proces', labelFull: 'In proces', labelShort: 'In proces', count: kanInProces.length, color: 'text-purple-700 border-purple-500' },
                  { key: 'gesprek_gepland', labelFull: 'Gesprek gepland', labelShort: 'Gepland', count: kanGesprekGepland.length, color: 'text-blue-600 border-blue-500' },
                  { key: 'afgewezen', labelFull: 'Afgewezen', labelShort: 'Afgewezen', count: kanAfgewezen.length, color: 'text-red-600 border-red-500' },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setKandidatenSubtab(tab.key)}
                    className={`flex-1 px-2 py-2.5 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-colors text-center ${
                      kandidatenSubtab === tab.key
                        ? tab.color + ' bg-transparent'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    <span className="sm:hidden">{tab.labelShort}</span>
                    <span className="hidden sm:inline">{tab.labelFull}</span>
                    <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      kandidatenSubtab === tab.key ? 'bg-gray-100' : 'bg-gray-100 text-gray-400'
                    }`}>{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Search + Filters */}
              <div className="space-y-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Zoek naam, e-mail of woonplaats..."
                    className="pl-10 h-9 text-sm w-full"
                    value={kandidatenSearch}
                    onChange={e => setKandidatenSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={kandidatenFunctionFilter} onValueChange={setKandidatenFunctionFilter}>
                    <SelectTrigger className="flex-1 h-9 text-sm min-w-0">
                      <SelectValue placeholder="Functie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle functies</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="horecamedewerker">Horeca</SelectItem>
                      <SelectItem value="chef">Chef / Kok</SelectItem>
                      <SelectItem value="frontoffice">Front-office</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={kandidatenTaalFilter} onValueChange={setKandidatenTaalFilter}>
                    <SelectTrigger className="flex-1 h-9 text-sm min-w-0">
                      <SelectValue placeholder="Taal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle talen</SelectItem>
                      <SelectItem value="nederlandsstalig">Nederlands</SelectItem>
                      <SelectItem value="english">Engels</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm shrink-0" onClick={() => refetchCandidates()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Vernieuwen</span>
                  </Button>
                </div>
              </div>

              {/* Table */}
              <Card>
                <CardContent className="p-0">
                  {candidatesLoading ? (
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : kanSubset.length === 0 ? (
                    <div className="p-12 text-center">
                      <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Geen kandidaten</h3>
                      <p className="text-gray-400 text-sm">Er zijn nog geen kandidaten in dit overzicht.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="text-sm w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th
                              className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap cursor-pointer select-none hover:text-gray-700 hidden sm:table-cell"
                              onClick={() => setKanSortDesc(v => !v)}
                            >
                              Datum {kanSortDesc ? '↓' : '↑'}
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Naam</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Functie</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap hidden md:table-cell">Woonplaats</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap hidden lg:table-cell">E-mail</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap hidden lg:table-cell">Telefoon</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap hidden xl:table-cell">Nat.</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap hidden xl:table-cell">Taal</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase">CV</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {kanSubset.map(c => {
                            const missing = kanMissingItems(c);
                            return (
                              <tr key={c.id} className="hover:bg-gray-50 align-middle">
                                {/* DATUM */}
                                <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap hidden sm:table-cell">
                                  {new Date(c.createdAt).toLocaleDateString('nl-NL')}
                                </td>
                                {/* NAAM */}
                                <td className="px-3 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <Avatar className="h-6 w-6 flex-shrink-0">
                                      <AvatarFallback className={`text-xs ${getFunctionBadgeColor(c.functionType)}`}>
                                        {getInitials(c.firstName, c.lastName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="font-medium text-gray-900 text-xs whitespace-nowrap">
                                        {c.firstName} {c.lastName}
                                      </span>
                                      <div className="text-xs text-gray-400 sm:hidden">{new Date(c.createdAt).toLocaleDateString('nl-NL')}</div>
                                    </div>
                                  </div>
                                </td>
                                {/* FUNCTIE */}
                                <td className="px-3 py-3 whitespace-nowrap">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getFunctionBadgeColor(c.functionType)} whitespace-nowrap`}
                                  >
                                    {c.functionType || '—'}
                                  </Badge>
                                </td>
                                {/* WOONPLAATS */}
                                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap hidden md:table-cell">
                                  {c.city || '—'}
                                </td>
                                {/* E-MAIL */}
                                <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap hidden lg:table-cell">
                                  {c.email || '—'}
                                </td>
                                {/* TELEFOON */}
                                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap hidden lg:table-cell">
                                  {c.phone || '—'}
                                </td>
                                {/* NATIONALITEIT */}
                                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap hidden xl:table-cell">
                                  {c.nationality || '—'}
                                </td>
                                {/* VOERTAAL */}
                                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap hidden xl:table-cell">
                                  {c.language || '—'}
                                </td>
                                {/* CV + ACTIES */}
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-0.5">
                                    <Button
                                      variant="ghost" size="icon" className="h-7 w-7"
                                      onClick={() => { setCvPreviewCandidate(c); setCvPreviewOpen(true); }}
                                      title={c.hasCv ? "CV bekijken" : "Geen CV geüpload"}
                                    >
                                      <Eye className={`h-3.5 w-3.5 ${c.hasCv ? 'text-green-500' : 'text-red-400'}`} />
                                    </Button>
                                    {kandidatenSubtab !== 'afgewezen' && (
                                      <Button
                                        variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={() => { setRejectReason('diensten'); setRejectConfirmId(c.id); }}
                                        title="Afwijzen"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                      </Button>
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
                </CardContent>
              </Card>
            </div>
          ) : activeTab === 'sollicitanten' ? (
            /* Sollicitanten Tab — Applications from HR intake form */
            <div>
              {/* Detail Modal */}
              <Dialog open={appDetailOpen} onOpenChange={setAppDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  {selectedApp && (() => {
                    const fd = selectedApp.formData || {};
                    const fn = selectedApp.functionType;

                    const renderStars = (val: any) => {
                      const n = parseInt(val) || 0;
                      return (
                        <span className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-4 w-4 ${i <= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                          ))}
                        </span>
                      );
                    };

                    const renderBool = (val: any) => val === true || val === 'true' || val === 'ja' ? 
                      <span className="text-green-600 font-medium">Ja</span> : 
                      <span className="text-gray-400">Nee</span>;

                    const renderVal = (val: any) => {
                      if (val === null || val === undefined || val === '') return <span className="text-gray-300">—</span>;
                      if (Array.isArray(val)) return val.length ? val.join(', ') : <span className="text-gray-300">—</span>;
                      if (typeof val === 'boolean') return renderBool(val);
                      return String(val);
                    };

                    const Section = ({ title, rows }: { title: string; rows: [string, any][] }) => (
                      <div className="mb-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 border-b pb-1">{title}</h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                          {rows.map(([label, val]) => (
                            <div key={label} className="flex justify-between text-sm py-0.5">
                              <span className="text-gray-500 shrink-0 mr-2">{label}</span>
                              <span className="font-medium text-right text-gray-800">{renderVal(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );

                    const RatingSection = ({ title, rows }: { title: string; rows: [string, any][] }) => (
                      <div className="mb-5">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 border-b pb-1">{title}</h4>
                        <div className="space-y-1.5">
                          {rows.map(([label, val]) => (
                            <div key={label} className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">{label}</span>
                              {renderStars(val)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );

                    return (
                      <>
                        <DialogHeader className="mb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                                fn === 'housekeeping' ? 'bg-cyan-100 text-cyan-700' :
                                fn === 'chef' ? 'bg-gray-100 text-gray-700' :
                                fn === 'horecamedewerker' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {getInitials(selectedApp.firstName, selectedApp.lastName)}
                              </div>
                              <div>
                                <DialogTitle className="text-xl">{selectedApp.firstName} {selectedApp.lastName}</DialogTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className={`text-xs ${getFunctionBadgeColor(fn)}`}>
                                    {fn === 'horecamedewerker' ? 'Horecamedewerker' :
                                     fn === 'housekeeping' ? 'Housekeeping' :
                                     fn === 'chef' ? 'Chef' : 'Front-office'}
                                  </Badge>
                                  <span className="text-xs text-gray-400">
                                    {new Date(selectedApp.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Select
                              value={selectedApp.status}
                              onValueChange={(s) => updateAppStatusMutation.mutate({ id: selectedApp.id, status: s })}
                            >
                              <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="nieuw">Nieuw</SelectItem>
                                <SelectItem value="beoordeeld">Beoordeeld</SelectItem>
                                <SelectItem value="aangenomen">Aangenomen</SelectItem>
                                <SelectItem value="afgewezen">Afgewezen</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </DialogHeader>

                        {/* Contact + Assessment overview */}
                        <div className="grid grid-cols-2 gap-4 mb-5">
                          <Card className="bg-gray-50 border-0">
                            <CardContent className="p-3 space-y-1.5 text-sm">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Contactgegevens</p>
                              {selectedApp.email && <div className="flex items-center gap-2 text-gray-700"><Mail className="h-3.5 w-3.5 text-gray-400" />{selectedApp.email}</div>}
                              {selectedApp.phone && <div className="flex items-center gap-2 text-gray-700"><Phone className="h-3.5 w-3.5 text-gray-400" />{selectedApp.phone}</div>}
                              {selectedApp.city && <div className="flex items-center gap-2 text-gray-700"><Building2 className="h-3.5 w-3.5 text-gray-400" />{selectedApp.city}</div>}
                              {selectedApp.interviewer && <div className="flex items-center gap-2 text-gray-700"><Users className="h-3.5 w-3.5 text-gray-400" />Interviewer: <span className="font-medium">{selectedApp.interviewer}</span></div>}
                              {selectedApp.salaryScale && <div className="flex items-center gap-2 text-gray-700"><Receipt className="h-3.5 w-3.5 text-gray-400" />Salariswens: <span className="font-medium">{selectedApp.salaryScale}</span></div>}
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-50 border-0">
                            <CardContent className="p-3 text-sm">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Beoordeling</p>
                              {selectedApp.assessmentRating ? (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-gray-500">Eindoordeel</span>
                                  <span className="flex gap-0.5">
                                    {[1,2,3,4,5].map(i => (
                                      <Star key={i} className={`h-4 w-4 ${i <= parseInt(selectedApp.assessmentRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                                    ))}
                                  </span>
                                </div>
                              ) : <p className="text-gray-400 text-xs">Nog geen eindoordeel</p>}
                              {fd.remarks && <p className="text-gray-600 text-xs mt-2 italic">"{fd.remarks}"</p>}
                            </CardContent>
                          </Card>
                        </div>

                        {/* Function-specific sections */}
                        {fn === 'horecamedewerker' && (
                          <>
                            <Section title="Achtergrond" rows={[
                              ['Voertaal', fd.languages],
                              ['Werkvergunning nodig', fd.needsWorkPermit],
                              ['Nationaliteit', fd.nationality],
                              ['Andere baan', fd.otherJob],
                            ]} />
                            <Section title="Werkervaring" rows={[
                              ['Ervaring in', fd.experienceTypes],
                              ['Horeca-ervaring', fd.horecaExperience ? `${fd.horecaExperience} jaar` : null],
                              ['Zelfstandig werken', fd.canWorkIndependently],
                              ['3 borden dragen', fd.canCarry3Plates],
                              ['Barista', fd.isBarista],
                              ['Cocktails', fd.canShakeCocktails],
                              ['Gerechten afwassen', fd.canWashDishes],
                              ['Assistent-kok', fd.isAssistantChef],
                              ['Promowerk', fd.isPromoWorker],
                            ]} />
                            <RatingSection title="Vaardigheden (1–5)" rows={[
                              ['Bediening', fd.serviceSkills],
                              ['Bar', fd.barSkills],
                              ['Diner', fd.dinerSkills],
                            ]} />
                            <Section title="Praktisch" rows={[
                              ['Rijbewijs', fd.hasDriversLicense],
                              ['OV-kaart', fd.hasStudentOV],
                              ['OV-type', fd.ovType],
                              ['Eigen kleding', fd.workClothing],
                            ]} />
                            <Section title="Beschikbaarheid" rows={[
                              ['Uren per week', fd.availableHours],
                              ['Voorkeursdagen', fd.preferredDays],
                              ['Voorkeurstijden', fd.preferredTimes],
                            ]} />
                            <RatingSection title="Beoordeling interviewer" rows={[
                              ['Ervaringsniveau', fd.experienceLevel],
                              ['Verschijning', fd.appearance],
                              ['Attitude', fd.attitude],
                              ['Communicatie', fd.communicationSkills],
                              ['Algemene indruk', fd.overallImpression],
                            ]} />
                          </>
                        )}

                        {fn === 'housekeeping' && (
                          <>
                            <Section title="Achtergrond" rows={[
                              ['Voertaal', fd.voertaal],
                              ['Werkvergunning nodig', fd.needsWorkPermit],
                              ['Nationaliteit', fd.nationality],
                            ]} />
                            <Section title="Werkervaring" rows={[
                              ['Taken', fd.hkTasks],
                              ['Jaren ervaring', fd.hkYearsExperience ? `${fd.hkYearsExperience} jaar` : null],
                              ['Locatietypes', fd.hkLocationTypes],
                              ['Hotelsterren', fd.hkHotelStars],
                              ['Vorige werkgevers', fd.hkCompanies],
                              ['Referentie', fd.hkReference],
                            ]} />
                            <Section title="Beschikbaarheid" rows={[
                              ['Uren per week', fd.availableHours],
                              ['Voorkeursdagen', fd.preferredDays],
                              ['Voorkeurstijden', fd.preferredTimes],
                              ['Eigen auto', fd.hasCar],
                            ]} />
                            <RatingSection title="Soft skills (1–5)" rows={[
                              ['Betrouwbaarheid', fd.hkBetrouwbaarheid],
                              ['Communicatie', fd.hkCommunicatie],
                              ['Representativiteit', fd.hkRepresentativiteit],
                            ]} />
                            <RatingSection title="Beoordeling interviewer" rows={[
                              ['Ervaringsniveau', fd.experienceLevel],
                              ['Verschijning', fd.appearance],
                              ['Attitude', fd.attitude],
                              ['Communicatie', fd.communicationSkills],
                              ['Algemene indruk', fd.overallImpression],
                            ]} />
                          </>
                        )}

                        {fn === 'chef' && (
                          <>
                            <Section title="Achtergrond" rows={[
                              ['Voertaal', fd.voertaal],
                              ['Werkvergunning nodig', fd.needsWorkPermit],
                              ['Nationaliteit', fd.nationality],
                            ]} />
                            <Section title="Hard skills" rows={[
                              ['Keukentypen', fd.chefKitchenTypes],
                              ['Diploma', fd.chefDiplomas],
                              ['Jaren als kok', fd.chefYearsAsKok ? `${fd.chefYearsAsKok} jaar` : null],
                              ['Leiderschapservaring', fd.chefLeadershipExp],
                              ['Hoofdkeuken', fd.chefMainKitchen],
                              ['Vorige werkgevers', fd.chefCompanies],
                            ]} />
                            <Section title="Beschikbaarheid & Vervoer" rows={[
                              ['Startdatum', fd.chefStartDate],
                              ['Uren per week', fd.availableHours],
                              ['Voorkeursdagen', fd.preferredDays],
                              ['Voorkeurstijden', fd.preferredTimes],
                              ['Eigen auto', fd.hasCar],
                            ]} />
                            <Section title="Kleding" rows={[
                              ['Koksbuis', fd.chefClothing?.includes?.('koksbuis') ?? (Array.isArray(fd.chefClothing) ? fd.chefClothing.includes('koksbuis') : null)],
                              ['Koksbroek', fd.chefClothing?.includes?.('koksbroek') ?? null],
                              ['Veiligheidsschoenen', fd.chefClothing?.includes?.('veiligheidsschoenen') ?? null],
                              ['Messenset', fd.chefClothing?.includes?.('messenset') ?? null],
                            ]} />
                            <RatingSection title="Tags & uitstraling (1–5)" rows={[
                              ['Professionele uitstraling', fd.chefProfessioneleUitstraling],
                              ['Communicatie', fd.communicationSkills],
                              ['Algemene indruk', fd.overallImpression],
                            ]} />
                            <RatingSection title="Beoordeling interviewer" rows={[
                              ['Ervaringsniveau', fd.experienceLevel],
                              ['Verschijning', fd.appearance],
                              ['Attitude', fd.attitude],
                            ]} />
                          </>
                        )}

                        {(fn === 'frontoffice' || fn === 'front-office') && (
                          <Section title="Formuliergegevens" rows={
                            Object.entries(fd)
                              .filter(([k]) => !['functionType','interviewer','firstName','lastName','email','phone','city','salaryScale','assessmentRating','remarks','linkedCandidateId'].includes(k))
                              .map(([k, v]) => [k, v] as [string, any])
                          } />
                        )}
                      </>
                    );
                  })()}
                </DialogContent>
              </Dialog>

              {/* Afwijs-bevestiging dialog voor sollicitanten */}
              <Dialog open={appRejectConfirmApp !== null} onOpenChange={(open) => { if (!open) setAppRejectConfirmApp(null); }}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Sollicitant afwijzen</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-gray-600 mb-1">Weet je zeker dat je de sollicitant wilt afwijzen?</p>
                  {appRejectConfirmApp?.email && (
                    <p className="text-xs text-gray-400 mb-4">Er wordt automatisch een afwijzingsmail gestuurd naar <span className="font-medium">{appRejectConfirmApp.email}</span>.</p>
                  )}
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setAppRejectConfirmApp(null)}>Annuleren</Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (appRejectConfirmApp) {
                          updateAppStatusMutation.mutate({ id: appRejectConfirmApp.id, status: 'afgewezen' });
                          setAppRejectConfirmApp(null);
                          setAppTab('afgewezen');
                        }
                      }}
                    >
                      Ja, afwijzen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold">Sollicitanten</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Ingevulde HR-intakeformulieren per functie</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => refetchApplications()}>
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1.5">Vernieuwen</span>
                  </Button>
                  <a href="/sollicitatieformulier" target="_blank">
                    <Button size="sm" className="h-8 bg-purple-600 hover:bg-purple-700">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1.5">Intakeformulier</span>
                    </Button>
                  </a>
                </div>
              </div>

              {/* Functie-tabs — primaire navigatie */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {[
                  { val: 'alle',            label: 'Alle',            count: appCounts.alle,            active: 'bg-purple-600 text-white', inactive: 'bg-white border border-gray-200 text-gray-600' },
                  { val: 'horecamedewerker',label: 'Horecamedewerker',count: appCounts.horecamedewerker,active: 'bg-orange-500 text-white',  inactive: 'bg-white border border-gray-200 text-gray-600' },
                  { val: 'chef',            label: 'Chef',            count: appCounts.chef,            active: 'bg-gray-700 text-white',   inactive: 'bg-white border border-gray-200 text-gray-600' },
                  { val: 'housekeeping',    label: 'Housekeeping',    count: appCounts.housekeeping,    active: 'bg-cyan-600 text-white',   inactive: 'bg-white border border-gray-200 text-gray-600' },
                  { val: 'frontoffice',     label: 'Front-office',    count: appCounts.frontoffice,     active: 'bg-blue-600 text-white',   inactive: 'bg-white border border-gray-200 text-gray-600' },
                  { val: 'afgewezen',       label: 'Afgewezen',       count: appCounts.afgewezen,       active: 'bg-red-500 text-white',    inactive: 'bg-white border border-red-200 text-red-600' },
                ].map(({ val, label, count, active, inactive }) => (
                  <button
                    key={val}
                    onClick={() => setAppTab(val)}
                    className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${appTab === val ? active : inactive}`}
                  >
                    {label}
                    <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${appTab === val ? 'bg-white/20' : val === 'afgewezen' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Filters — zoek + wie + datum sortering */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Naam of e-mail..."
                    className="pl-9"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                  />
                </div>
                <Select value={appInterviewerFilter} onValueChange={setAppInterviewerFilter}>
                  <SelectTrigger className="w-[100px] sm:w-[120px]">
                    <span className="text-sm truncate">
                      {appInterviewerFilter === 'alle' ? 'Wie' : appInterviewerFilter}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle interviewers</SelectItem>
                    {['Eveline', 'Isa', 'Charlotte', 'Max', 'Lea'].map(iv => (
                      <SelectItem key={iv} value={iv}>{iv}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 text-xs"
                  onClick={() => setAppSortDesc(prev => !prev)}
                  title="Sorteren op datum"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{appSortDesc ? 'Nieuwst eerst' : 'Oudst eerst'}</span>
                </Button>
              </div>

              {/* Applications Table */}
              {(() => {
                const calculateAge = (birthDate: string | undefined): string => {
                  if (!birthDate) return '—';
                  const birth = new Date(birthDate);
                  const today = new Date();
                  let age = today.getFullYear() - birth.getFullYear();
                  const m = today.getMonth() - birth.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                  return isNaN(age) ? '—' : String(age);
                };

                const ScoreCell = ({ score }: { score: number | null | undefined }) => {
                  if (score === null || score === undefined) return <span className="text-gray-300 text-xs">—</span>;
                  if (score === 100) return <span className="text-xs font-bold text-yellow-600">⭐ 100%</span>;
                  return <span className="text-xs font-semibold text-gray-700">{score}%</span>;
                };

                const boolCell = (v: any) => {
                  const yes = v === true || v === 'true' || v === 'ja';
                  return yes
                    ? <span className="text-green-600 text-xs font-medium">Ja</span>
                    : <span className="text-gray-300 text-xs">Nee</span>;
                };

                const fnLabels: Record<string, string> = {
                  horecamedewerker: 'Horeca', housekeeping: 'Housekeeping', chef: 'Chef',
                  frontoffice: 'Front-office', 'front-office': 'Front-office',
                };

                const ActionCell = ({ app }: { app: any }) => (
                  <td className="px-2 py-2 sticky right-0 bg-white border-l" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedApp(app); setAppDetailOpen(true); }}>
                        <Eye className="h-3.5 w-3.5 text-purple-500" />
                      </Button>
                      {app.status !== 'afgewezen' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50" onClick={() => setAppRejectConfirmApp(app)} title="Afwijzen">
                          <X className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </td>
                );

                const Th = ({ children }: { children: React.ReactNode }) => (
                  <th className="px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap bg-gray-50">{children}</th>
                );
                const Td = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
                  <td className={`px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap ${className}`}>{children}</td>
                );

                const rowClass = (app: any) => {
                  const ss = app.softskillsScore;
                  const base = 'border-b hover:bg-gray-50/60 cursor-pointer transition-colors';
                  if (ss !== null && ss !== undefined && ss < 40) return `${base} bg-red-50 hover:bg-red-100/60`;
                  return base;
                };

                const NameCell = ({ app }: { app: any }) => (
                  <td className="px-3 py-2.5 sticky left-0 bg-white border-r z-10">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        app.functionType === 'housekeeping' ? 'bg-cyan-100 text-cyan-700' :
                        app.functionType === 'chef' ? 'bg-gray-100 text-gray-600' :
                        app.functionType === 'horecamedewerker' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {getInitials(app.firstName, app.lastName)}
                      </div>
                      <span className="font-medium text-gray-900 text-xs whitespace-nowrap">{app.firstName} {app.lastName}</span>
                    </div>
                  </td>
                );

                if (applicationsLoading) return (
                  <Card><CardContent className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
                );

                if (filteredApplications.length === 0) return (
                  <Card><CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Geen sollicitaties gevonden</h3>
                    <p className="text-gray-400 text-sm">{appCounts.total === 0 ? 'Er zijn nog geen HR-intakeformulieren ingevuld.' : 'Geen resultaten voor de huidige filters.'}</p>
                    {appCounts.total === 0 && <p className="text-xs text-gray-400 mt-2">Formulier: <a href="/sollicitatieformulier" target="_blank" className="font-mono underline">/sollicitatieformulier</a></p>}
                  </CardContent></Card>
                );

                /* ---- ALLE tab ---- */
                if (appTab === 'alle' || appTab === 'afgewezen') return (
                  <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            <Th>Datum</Th>
                            <th className="px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap bg-gray-50 sticky left-0">Naam</th>
                            <Th>Functie</Th>
                            <Th>Woonplaats</Th>
                            <Th>E-mail</Th>
                            <Th>Telefoonnummer</Th>
                            <Th>Interviewer</Th>
                            <Th></Th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApplications.map(app => (
                            <tr key={app.id} className={rowClass(app)} onClick={() => { setSelectedApp(app); setAppDetailOpen(true); }}>
                              <Td>{new Date(app.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })}</Td>
                              <NameCell app={app} />
                              <Td><Badge variant="outline" className={`text-xs ${getFunctionBadgeColor(app.functionType)}`}>{fnLabels[app.functionType] || app.functionType}</Badge></Td>
                              <Td>{app.city || '—'}</Td>
                              <Td>{app.email || '—'}</Td>
                              <Td>{app.phone || '—'}</Td>
                              <Td>{app.interviewer || '—'}</Td>
                              <ActionCell app={app} />
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent></Card>
                );

                /* ---- HORECAMEDEWERKER tab ---- */
                if (appTab === 'horecamedewerker') return (
                  <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            <Th>Datum</Th>
                            <Th>Wie</Th>
                            <th className="px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap bg-gray-50 sticky left-0">Naam</th>
                            <Th>Softskills</Th>
                            <Th>Bar</Th>
                            <Th>Bediening</Th>
                            <Th>Diner</Th>
                            <Th>Telefoon</Th>
                            <Th>Taal</Th>
                            <Th>TWV</Th>
                            <Th>Woonplaats</Th>
                            <Th>Leeftijd</Th>
                            <Th>Nationaliteit</Th>
                            <Th>Horeca erv.</Th>
                            <Th>Bediening vaard.</Th>
                            <Th>Bar vaard.</Th>
                            <Th>Diner vaard.</Th>
                            <Th>3 borden</Th>
                            <Th>Barista</Th>
                            <Th>Cocktail</Th>
                            <Th>Afwas</Th>
                            <Th>Promotie</Th>
                            <Th>Ass. chef</Th>
                            <Th>Kanaal</Th>
                            <Th>Enige bijbaan</Th>
                            <Th>Werkervaring</Th>
                            <Th>Rijbewijs</Th>
                            <Th>OV-chipkaart</Th>
                            <Th>Werkkleding</Th>
                            <Th>Beschikbaarheid</Th>
                            <Th>Pref. dagen</Th>
                            <Th>Pref. moment</Th>
                            <Th>Beoordeling</Th>
                            <Th>Uiterlijk</Th>
                            <Th>Houding</Th>
                            <Th>Communicatie</Th>
                            <Th>Alg. indruk</Th>
                            <Th>Salaris</Th>
                            <Th>Opmerkingen</Th>
                            <Th></Th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApplications.map(app => {
                            const fd = (app.formData || {}) as any;
                            return (
                              <tr key={app.id} className={rowClass(app)} onClick={() => { setSelectedApp(app); setAppDetailOpen(true); }}>
                                <Td>{new Date(app.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })}</Td>
                                <Td>{app.interviewer || '—'}</Td>
                                <NameCell app={app} />
                                <Td><ScoreCell score={app.softskillsScore} /></Td>
                                <Td><ScoreCell score={app.barScore} /></Td>
                                <Td><ScoreCell score={app.bedieningScore} /></Td>
                                <Td><ScoreCell score={app.dinerScore} /></Td>
                                <Td>{app.phone || '—'}</Td>
                                <Td>{fd.languages ? (Array.isArray(fd.languages) ? fd.languages.join(', ') : fd.languages) : '—'}</Td>
                                <Td>{fd.needsWorkPermit === 'ja' ? <span className="text-amber-600 font-medium text-xs">Ja</span> : 'Nee'}</Td>
                                <Td>{app.city || '—'}</Td>
                                <Td>{calculateAge(fd.birthDate)}</Td>
                                <Td>{fd.nationality || '—'}</Td>
                                <Td>{fd.horecaExperience || '—'}</Td>
                                <Td>{fd.serviceSkills ? `${fd.serviceSkills}/5` : '—'}</Td>
                                <Td>{fd.barSkills ? `${fd.barSkills}/5` : '—'}</Td>
                                <Td>{fd.dinerSkills ? `${fd.dinerSkills}/5` : '—'}</Td>
                                <Td>{boolCell(fd.canCarry3Plates)}</Td>
                                <Td>{boolCell(fd.isBarista)}</Td>
                                <Td>{boolCell(fd.canShakeCocktails)}</Td>
                                <Td>{boolCell(fd.canWashDishes)}</Td>
                                <Td>{boolCell(fd.isPromoWorker)}</Td>
                                <Td>{boolCell(fd.isAssistantChef)}</Td>
                                <Td>{fd.channel || '—'}</Td>
                                <Td>{fd.otherJob ? 'Nee' : 'Ja'}</Td>
                                <Td className="max-w-[120px] truncate">{fd.experienceTypes ? (Array.isArray(fd.experienceTypes) ? fd.experienceTypes.join(', ') : fd.experienceTypes) : '—'}</Td>
                                <Td>{boolCell(fd.hasDriversLicense)}</Td>
                                <Td>{boolCell(fd.hasStudentOV)}</Td>
                                <Td className="max-w-[120px] truncate">{fd.workClothing ? (Array.isArray(fd.workClothing) ? fd.workClothing.join(', ') : fd.workClothing) : '—'}</Td>
                                <Td>{fd.availableHours || '—'}</Td>
                                <Td className="max-w-[120px] truncate">{fd.preferredDays ? (Array.isArray(fd.preferredDays) ? fd.preferredDays.join(', ') : fd.preferredDays) : '—'}</Td>
                                <Td className="max-w-[100px] truncate">{fd.preferredTimes ? (Array.isArray(fd.preferredTimes) ? fd.preferredTimes.join(', ') : fd.preferredTimes) : '—'}</Td>
                                <Td>{app.assessmentRating || '—'}</Td>
                                <Td>{fd.appearance || '—'}</Td>
                                <Td>{fd.attitude || '—'}</Td>
                                <Td>{fd.communicationSkills ? `${fd.communicationSkills}/5` : '—'}</Td>
                                <Td>{fd.overallImpression ? `${fd.overallImpression}/5` : '—'}</Td>
                                <Td>{app.salaryScale || '—'}</Td>
                                <Td className="max-w-[120px] truncate">{fd.remarks || '—'}</Td>
                                <ActionCell app={app} />
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent></Card>
                );

                /* ---- CHEF tab ---- */
                if (appTab === 'chef') return (
                  <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            <Th>Datum</Th>
                            <Th>Wie</Th>
                            <th className="px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap bg-gray-50 sticky left-0">Naam</th>
                            <Th>Softskills</Th>
                            <Th>Telefoon</Th>
                            <Th>Taal</Th>
                            <Th>TWV</Th>
                            <Th>Woonplaats</Th>
                            <Th>Leeftijd</Th>
                            <Th>Nationaliteit</Th>
                            <Th>Keuken typen</Th>
                            <Th>Diploma</Th>
                            <Th>Uitstraling</Th>
                            <Th>Communicatie</Th>
                            <Th>Alg. indruk</Th>
                            <Th>Beoordeling</Th>
                            <Th>Werkkleding</Th>
                            <Th>Salaris</Th>
                            <Th>Opmerkingen</Th>
                            <Th></Th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApplications.map(app => {
                            const fd = (app.formData || {}) as any;
                            return (
                              <tr key={app.id} className={rowClass(app)} onClick={() => { setSelectedApp(app); setAppDetailOpen(true); }}>
                                <Td>{new Date(app.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })}</Td>
                                <Td>{app.interviewer || '—'}</Td>
                                <NameCell app={app} />
                                <Td><ScoreCell score={app.softskillsScore} /></Td>
                                <Td>{app.phone || '—'}</Td>
                                <Td>{fd.languages ? (Array.isArray(fd.languages) ? fd.languages.join(', ') : fd.languages) : '—'}</Td>
                                <Td>{fd.needsWorkPermit === 'ja' ? <span className="text-amber-600 font-medium text-xs">Ja</span> : 'Nee'}</Td>
                                <Td>{app.city || '—'}</Td>
                                <Td>{calculateAge(fd.birthDate)}</Td>
                                <Td>{fd.nationality || '—'}</Td>
                                <Td className="max-w-[120px] truncate">{fd.chefKitchenTypes ? (Array.isArray(fd.chefKitchenTypes) ? fd.chefKitchenTypes.join(', ') : fd.chefKitchenTypes) : '—'}</Td>
                                <Td>{fd.chefDiploma || '—'}</Td>
                                <Td>{fd.chefProfessioneleUitstraling ? `${fd.chefProfessioneleUitstraling}/5` : '—'}</Td>
                                <Td>{fd.communicationSkills ? `${fd.communicationSkills}/5` : '—'}</Td>
                                <Td>{fd.overallImpression ? `${fd.overallImpression}/5` : '—'}</Td>
                                <Td>{app.assessmentRating || '—'}</Td>
                                <Td className="max-w-[120px] truncate">{fd.chefClothing ? (Array.isArray(fd.chefClothing) ? fd.chefClothing.join(', ') : fd.chefClothing) : '—'}</Td>
                                <Td>{app.salaryScale || '—'}</Td>
                                <Td className="max-w-[120px] truncate">{fd.remarks || '—'}</Td>
                                <ActionCell app={app} />
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent></Card>
                );

                /* ---- HOUSEKEEPING tab ---- */
                if (appTab === 'housekeeping') return (
                  <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            <Th>Datum</Th>
                            <Th>Wie</Th>
                            <th className="px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap bg-gray-50 sticky left-0">Naam</th>
                            <Th>Softskills</Th>
                            <Th>Telefoon</Th>
                            <Th>Taal</Th>
                            <Th>TWV</Th>
                            <Th>Woonplaats</Th>
                            <Th>Leeftijd</Th>
                            <Th>Nationaliteit</Th>
                            <Th>HK ervaring (jr)</Th>
                            <Th>Hotel sterren</Th>
                            <Th>Betrouwbaarheid</Th>
                            <Th>Communicatie</Th>
                            <Th>Representativiteit</Th>
                            <Th>Beoordeling</Th>
                            <Th>Salaris</Th>
                            <Th>Opmerkingen</Th>
                            <Th></Th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApplications.map(app => {
                            const fd = (app.formData || {}) as any;
                            return (
                              <tr key={app.id} className={rowClass(app)} onClick={() => { setSelectedApp(app); setAppDetailOpen(true); }}>
                                <Td>{new Date(app.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })}</Td>
                                <Td>{app.interviewer || '—'}</Td>
                                <NameCell app={app} />
                                <Td><ScoreCell score={app.softskillsScore} /></Td>
                                <Td>{app.phone || '—'}</Td>
                                <Td>{fd.languages ? (Array.isArray(fd.languages) ? fd.languages.join(', ') : fd.languages) : '—'}</Td>
                                <Td>{fd.needsWorkPermit === 'ja' ? <span className="text-amber-600 font-medium text-xs">Ja</span> : 'Nee'}</Td>
                                <Td>{app.city || '—'}</Td>
                                <Td>{calculateAge(fd.birthDate)}</Td>
                                <Td>{fd.nationality || '—'}</Td>
                                <Td>{fd.hkExperienceYears || '—'}</Td>
                                <Td>{fd.hkHotelStars ? `${fd.hkHotelStars}★` : '—'}</Td>
                                <Td>{fd.hkBetrouwbaarheid ? `${fd.hkBetrouwbaarheid}/5` : '—'}</Td>
                                <Td>{fd.hkCommunicatie ? `${fd.hkCommunicatie}/5` : '—'}</Td>
                                <Td>{fd.hkRepresentativiteit ? `${fd.hkRepresentativiteit}/5` : '—'}</Td>
                                <Td>{app.assessmentRating || '—'}</Td>
                                <Td>{app.salaryScale || '—'}</Td>
                                <Td className="max-w-[120px] truncate">{fd.remarks || '—'}</Td>
                                <ActionCell app={app} />
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent></Card>
                );

                /* ---- FRONT-OFFICE tab ---- */
                return (
                  <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            <Th>Datum</Th>
                            <Th>Wie</Th>
                            <th className="px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap bg-gray-50 sticky left-0">Naam</th>
                            <Th>Softskills</Th>
                            <Th>Telefoon</Th>
                            <Th>Taal</Th>
                            <Th>TWV</Th>
                            <Th>Woonplaats</Th>
                            <Th>Leeftijd</Th>
                            <Th>Nationaliteit</Th>
                            <Th>Horeca erv.</Th>
                            <Th>Beoordeling</Th>
                            <Th>Uiterlijk</Th>
                            <Th>Houding</Th>
                            <Th>Communicatie</Th>
                            <Th>Alg. indruk</Th>
                            <Th>Rijbewijs</Th>
                            <Th>OV-chipkaart</Th>
                            <Th>Beschikbaarheid</Th>
                            <Th>Salaris</Th>
                            <Th>Opmerkingen</Th>
                            <Th></Th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApplications.map(app => {
                            const fd = (app.formData || {}) as any;
                            return (
                              <tr key={app.id} className={rowClass(app)} onClick={() => { setSelectedApp(app); setAppDetailOpen(true); }}>
                                <Td>{new Date(app.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })}</Td>
                                <Td>{app.interviewer || '—'}</Td>
                                <NameCell app={app} />
                                <Td><ScoreCell score={app.softskillsScore} /></Td>
                                <Td>{app.phone || '—'}</Td>
                                <Td>{fd.languages ? (Array.isArray(fd.languages) ? fd.languages.join(', ') : fd.languages) : '—'}</Td>
                                <Td>{fd.needsWorkPermit === 'ja' ? <span className="text-amber-600 font-medium text-xs">Ja</span> : 'Nee'}</Td>
                                <Td>{app.city || '—'}</Td>
                                <Td>{calculateAge(fd.birthDate)}</Td>
                                <Td>{fd.nationality || '—'}</Td>
                                <Td>{fd.horecaExperience || '—'}</Td>
                                <Td>{app.assessmentRating || '—'}</Td>
                                <Td>{fd.appearance || '—'}</Td>
                                <Td>{fd.attitude || '—'}</Td>
                                <Td>{fd.communicationSkills ? `${fd.communicationSkills}/5` : '—'}</Td>
                                <Td>{fd.overallImpression ? `${fd.overallImpression}/5` : '—'}</Td>
                                <Td>{boolCell(fd.hasDriversLicense)}</Td>
                                <Td>{boolCell(fd.hasStudentOV)}</Td>
                                <Td>{fd.availableHours || '—'}</Td>
                                <Td>{app.salaryScale || '—'}</Td>
                                <Td className="max-w-[120px] truncate">{fd.remarks || '—'}</Td>
                                <ActionCell app={app} />
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent></Card>
                );
              })()}
            </div>
          ) : activeTab === 'twv' ? (
            /* TWV Tab — Tewerkstellingsvergunning Kanban */
            <div>
              {/* Edit dates modal */}
              <Dialog open={twvEditOpen} onOpenChange={setTwvEditOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>TWV datums instellen</DialogTitle>
                  </DialogHeader>
                  {twvEditCandidate && (
                    <div className="space-y-4 pt-2">
                      <p className="text-sm text-gray-600">
                        <strong>{twvEditCandidate.firstName} {twvEditCandidate.lastName}</strong>
                      </p>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Startdatum TWV</label>
                        <Input
                          type="date"
                          value={twvEditStartDate}
                          onChange={e => setTwvEditStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Einddatum TWV</label>
                        <Input
                          type="date"
                          value={twvEditEndDate}
                          onChange={e => setTwvEditEndDate(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          onClick={() => {
                            if (!twvEditCandidate) return;
                            updateTwvMutation.mutate({
                              id: twvEditCandidate.id,
                              twvStartDate: twvEditStartDate || undefined,
                              twvEndDate: twvEditEndDate || undefined,
                            });
                            setTwvEditOpen(false);
                          }}
                        >
                          Opslaan
                        </Button>
                        <Button variant="outline" onClick={() => setTwvEditOpen(false)}>Annuleren</Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                    TWV Beheer
                  </h1>
                  <p className="text-sm text-gray-500">Tewerkstellingsvergunningen overzicht en beheer</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => window.open('/api/admin/twv/export', '_blank')}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exporteer CSV
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-500 hover:bg-green-600 text-xs h-8"
                    onClick={() => refetchTwv()}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Vernieuwen
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Zoek op naam of ID…"
                  value={twvSearch}
                  onChange={e => setTwvSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-white"
                />
              </div>

              {(() => {
                const TWV_COLUMNS: { key: TwvCandidate['twvStatus']; label: string; color: string; bg: string; border: string }[] = [
                  { key: 'twv_nodig', label: 'TWV Nodig', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
                  { key: 'twv_aangevraagd', label: 'TWV Aangevraagd', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                  { key: 'info_nodig', label: 'Info nodig', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
                  { key: 'twv_verstrekt', label: 'TWV Verstrekt', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
                  { key: 'twv_verlopen', label: 'TWV Verlopen', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
                ];

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                function getTwvColor(c: TwvCandidate): 'green' | 'orange' | 'red' | null {
                  if (c.twvStatus !== 'twv_verstrekt' || !c.twvEndDate) return null;
                  const end = new Date(c.twvEndDate);
                  end.setHours(0, 0, 0, 0);
                  const days = Math.round((end.getTime() - today.getTime()) / 86400000);
                  if (days < 0) return 'red';
                  if (days <= 30) return 'orange';
                  return 'green';
                }

                const searchLower = twvSearch.toLowerCase();
                const filtered = twvCandidates.filter(c => {
                  if (!searchLower) return true;
                  return (
                    c.firstName.toLowerCase().includes(searchLower) ||
                    c.lastName.toLowerCase().includes(searchLower) ||
                    String(c.id).includes(searchLower)
                  );
                });

                // Auto-move expired to twv_verlopen column visually
                const displayCandidates = filtered.map(c => {
                  if (c.twvStatus === 'twv_verstrekt' && c.twvEndDate) {
                    const end = new Date(c.twvEndDate);
                    end.setHours(0, 0, 0, 0);
                    if (end < today) return { ...c, twvStatus: 'twv_verlopen' as const };
                  }
                  return c;
                });

                const byColumn = (key: TwvCandidate['twvStatus']) =>
                  displayCandidates.filter(c => (c.twvStatus ?? 'twv_nodig') === key);

                function handleDrop(e: React.DragEvent, targetStatus: string) {
                  e.preventDefault();
                  const id = parseInt(e.dataTransfer.getData('candidateId'));
                  if (!id) return;
                  setTwvDragOver(null);
                  updateTwvMutation.mutate({ id, twvStatus: targetStatus });
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {TWV_COLUMNS.map(col => {
                      const cards = byColumn(col.key);
                      return (
                        <div
                          key={col.key}
                          className={`rounded-xl border-2 ${col.border} ${col.bg} min-h-[400px] transition-all ${twvDragOver === col.key ? 'ring-2 ring-purple-400 scale-[1.01]' : ''}`}
                          onDragOver={e => { e.preventDefault(); setTwvDragOver(col.key as string); }}
                          onDragLeave={() => setTwvDragOver(null)}
                          onDrop={e => handleDrop(e, col.key as string)}
                        >
                          {/* Column header */}
                          <div className={`px-3 py-2.5 border-b ${col.border} flex items-center justify-between`}>
                            <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                              {cards.length}
                            </span>
                          </div>

                          {/* Cards */}
                          <div className="p-2 space-y-2">
                            {twvLoading ? (
                              <div className="space-y-2 p-2">
                                {[1,2].map(i => <div key={i} className="h-20 bg-white rounded-lg animate-pulse" />)}
                              </div>
                            ) : cards.length === 0 ? (
                              <div className="text-center py-8 text-xs text-gray-400">Geen medewerkers</div>
                            ) : cards.map(c => {
                              const twvColor = getTwvColor(c);
                              const daysLeft = c.twvEndDate ? Math.round((new Date(c.twvEndDate).setHours(0,0,0,0) - today.getTime()) / 86400000) : null;
                              return (
                                <div
                                  key={c.id}
                                  draggable
                                  onDragStart={e => { e.dataTransfer.setData('candidateId', String(c.id)); }}
                                  className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-start justify-between gap-1 mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 shrink-0">
                                        {c.firstName[0]}{c.lastName[0]}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium leading-tight">{c.firstName} {c.lastName}</p>
                                        <p className="text-xs text-gray-400">ID #{c.id}</p>
                                      </div>
                                    </div>
                                    <GripVertical className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                                  </div>

                                  {c.nationality && (
                                    <div className="text-xs text-gray-500 mb-2">
                                      🌍 {c.nationality}
                                    </div>
                                  )}

                                  {/* TWV dates (only for verstrekt) */}
                                  {col.key === 'twv_verstrekt' && (
                                    <div className="mt-2 space-y-1">
                                      {c.twvStartDate && (
                                        <div className="text-xs text-gray-500">
                                          Van: <span className="font-medium text-gray-700">{new Date(c.twvStartDate).toLocaleDateString('nl-NL')}</span>
                                        </div>
                                      )}
                                      {c.twvEndDate && (
                                        <div className="text-xs text-gray-500">
                                          Tot: <span className="font-medium text-gray-700">{new Date(c.twvEndDate).toLocaleDateString('nl-NL')}</span>
                                        </div>
                                      )}
                                      {/* Color indicator */}
                                      {twvColor && (
                                        <div className={`flex items-center gap-1 text-xs mt-1 font-medium ${
                                          twvColor === 'green' ? 'text-green-600' :
                                          twvColor === 'orange' ? 'text-amber-600' : 'text-red-600'
                                        }`}>
                                          {twvColor === 'green' && <><CheckCircle2 className="h-3.5 w-3.5" /> Geldig</>}
                                          {twvColor === 'orange' && <><AlertTriangle className="h-3.5 w-3.5" /> Verloopt over {daysLeft} dag{daysLeft !== 1 ? 'en' : ''}</>}
                                          {twvColor === 'red' && <><AlertTriangle className="h-3.5 w-3.5" /> Verlopen</>}
                                        </div>
                                      )}
                                      <button
                                        className="text-xs text-purple-600 hover:underline mt-1"
                                        onClick={() => {
                                          setTwvEditCandidate(c);
                                          setTwvEditStartDate(c.twvStartDate || '');
                                          setTwvEditEndDate(c.twvEndDate || '');
                                          setTwvEditOpen(true);
                                        }}
                                      >
                                        Datums aanpassen
                                      </button>
                                    </div>
                                  )}

                                  {/* Quick move buttons */}
                                  {col.key === 'twv_aangevraagd' && (
                                    <button
                                      className="text-xs text-orange-600 hover:underline mt-2 block"
                                      onClick={() => {
                                        updateTwvMutation.mutate({ id: c.id, twvStatus: 'info_nodig' });
                                      }}
                                    >
                                      → Info nodig
                                    </button>
                                  )}
                                  {col.key === 'info_nodig' && (
                                    <button
                                      className="text-xs text-green-600 hover:underline mt-2 block"
                                      onClick={() => {
                                        updateTwvMutation.mutate({ id: c.id, twvStatus: 'twv_verstrekt' });
                                      }}
                                    >
                                      → Markeer als verstrekt
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Legend */}
              <div className="mt-5 flex flex-wrap gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> TWV ruim geldig</div>
                <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" /> Verloopt binnen 30 dagen — automatische herinnering verzonden</div>
                <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> Verlopen</div>
                <div className="ml-auto flex items-center gap-1.5 text-gray-400">
                  <GripVertical className="h-3.5 w-3.5" /> Sleep kaarten tussen kolommen om status te wijzigen
                </div>
              </div>
            </div>
          ) : (
            /* Dashboard / Gebruikers Tab */
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold">{activeTab === 'gebruikers' ? 'Gebruikersbeheer' : 'Dashboard'}</h1>
                  <p className="text-sm text-gray-500">{activeTab === 'gebruikers' ? 'Beheer medewerkeraccounts, rollen en punten' : 'Overzicht van uw beloningsplatform voor medewerkers'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Periode:</span>
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deze-maand">Deze maand</SelectItem>
                        <SelectItem value="vorige-maand">Vorige maand</SelectItem>
                        <SelectItem value="dit-kwartaal">Dit kwartaal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Functie:</span>
                    <Select value={functionFilter} onValueChange={setFunctionFilter}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alle">Alle functies</SelectItem>
                        <SelectItem value="housekeeping">Housekeeping</SelectItem>
                        <SelectItem value="horecamedewerker">Horecamedewerker</SelectItem>
                        <SelectItem value="chef">Chef</SelectItem>
                        <SelectItem value="front-office">Front-office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-8">
                    <Settings2 className="h-3 w-3" />
                    Widgets beheren
                  </Button>
                  <Button size="sm" className="gap-1 bg-green-500 hover:bg-green-600 text-xs h-8" onClick={() => { refetchStats(); refetchCandidates(); }}>
                    <RefreshCw className="h-3 w-3" />
                    Vernieuwen
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className={`grid gap-4 mb-6 ${activeTab === 'gebruikers' ? 'grid-cols-3' : 'grid-cols-4'}`}>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Totaal Gebruikers</p>
                        <p className="text-2xl font-bold mt-1">
                          {activeTab === 'gebruikers' ? gbTotalUsers : dashTotalUsers}
                        </p>
                        <p className="text-xs text-gray-400">Geregistreerde medewerkers</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Actieve Gebruikers</p>
                        <p className="text-2xl font-bold mt-1">
                          {activeTab === 'gebruikers' ? gbActiveUsers : dashActiveUsers}
                        </p>
                        <p className="text-xs text-gray-400">Minimaal 1 actie deze periode</p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">{activeTab === 'gebruikers' ? 'Totaal Punten' : 'Uitgegeven Punten'}</p>
                        <p className="text-2xl font-bold mt-1">
                          {(activeTab === 'gebruikers' ? gbPoints : dashPoints).toLocaleString('nl-NL')}
                        </p>
                        <p className="text-xs text-gray-400">In geselecteerde periode</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {activeTab !== 'gebruikers' && (
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Gebruikersgroei</p>
                          <p className="text-2xl font-bold mt-1 text-green-600">
                            {dashGrowth}
                          </p>
                          <p className="text-xs text-gray-400">Nieuwe gebruikers deze periode</p>
                        </div>
                        <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-pink-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Three Column Layout */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Top Presteerders */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Top Presteerders
                      </CardTitle>
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400">Top 10 op basis van verdiende punten</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {topUsers.map((u, i) => (
                        <div key={u.id} className="flex items-center gap-3 py-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                            i === 1 ? 'bg-gray-100 text-gray-600' :
                            i === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-500'
                          }`}>{i + 1}</span>
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className={`text-xs ${getFunctionBadgeColor(u.functionType || '')}`}>
                              {getInitials(u.firstName, u.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-400">{u.functionType || 'Medewerker'}</p>
                          </div>
                          <span className="text-sm font-semibold">{u.points?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Inactieve Gebruikers */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        Inactieve Gebruikers
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">30 dagen</span>
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Geen login of punten activiteit</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {inactiveUsers.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 py-1">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className={`text-xs ${getFunctionBadgeColor(u.functionType || '')}`}>
                              {getInitials(u.firstName, u.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-400">{u.functionType || 'Medewerker'}</p>
                          </div>
                          <span className="text-xs text-orange-500">{daysSince(u.lastLogin || '')} dagen</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                      Exporteer lijst
                    </Button>
                  </CardContent>
                </Card>

                {/* Te doen */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Star className="h-4 w-4 text-green-500" />
                        Te doen
                        <Badge className="bg-green-100 text-green-700 text-xs">5</Badge>
                      </CardTitle>
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400">Beloningen en challenges die handmatige actie vereisen</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">Wellness Dagje</span>
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs">Beloning</Badge>
                        </div>
                        <p className="text-xs text-gray-500">Beloning verzilverd - bestelling plaatsen</p>
                        <p className="text-xs text-gray-400">Door: Emma de Vries • 2 dagen geleden • 500 punten</p>
                        <Button size="sm" className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-xs h-7">
                          Markeer als afgerond
                        </Button>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">Bol.com Cadeaubon €50</span>
                          <Badge className="bg-orange-100 text-orange-700 text-xs">Beloning</Badge>
                        </div>
                        <p className="text-xs text-gray-500">Beloning verzilverd - code versturen</p>
                        <p className="text-xs text-gray-400">Door: Jan Bakker • 3 dagen geleden • 1000 punten</p>
                        <Button size="sm" className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-xs h-7">
                          Markeer als afgerond
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-2 gap-4">
                {/* Meest Ingewisselde Beloningen */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Gift className="h-4 w-4 text-purple-500" />
                        Meest Ingewisselde Beloningen
                      </CardTitle>
                      <Select defaultValue="alle">
                        <SelectTrigger className="w-[120px] h-7 text-xs">
                          <SelectValue placeholder="Categorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alle">Alle categorieën</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-400 text-center py-8">Beloningen data wordt geladen...</p>
                  </CardContent>
                </Card>

                {/* Recente Activiteit */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Recente Activiteit
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-700 text-xs">Live</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {recentTransactions.map((tx) => (
                          <div key={tx.id} className="flex items-center gap-3 py-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              tx.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              <TrendingUp className={`h-3 w-3 ${
                                tx.type === 'earned' ? 'text-green-600' : 'text-red-600 rotate-180'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{tx.description}</p>
                              <p className="text-xs text-gray-400">
                                {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : 'Gebruiker'} • {new Date(tx.createdAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <Badge className={`text-xs ${tx.type === 'earned' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {tx.type === 'earned' ? '+' : '-'}{Math.abs(tx.amount)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>

      {/* iOS Safari installation guide */}
      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              🍎 Meldingen instellen op iPhone
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <p className="font-medium">
              Safari op iPhone vereist dat je de site eerst als app installeert voordat je meldingen kunt ontvangen. Dat doe je zo:
            </p>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                <span>Tik op de <strong>Deel-knop</strong> onderaan Safari (het vierkantje met een pijl omhoog)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                <span>Scroll naar beneden en tik op <strong>"Zet op beginscherm"</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                <span>Tik op <strong>"Voeg toe"</strong> rechtsboven</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                <span>Open het EXTRA-icoon op je beginscherm en log opnieuw in</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">5</span>
                <span>Tik dan op het <strong>bel-icoon</strong> en geef toestemming</span>
              </li>
            </ol>
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              Dit is een beperking van Apple — push meldingen in Safari werken alleen via een geïnstalleerde app (vereist iOS 16.4 of nieuwer).
            </p>
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setShowIOSGuide(false)}>
            Begrepen
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
