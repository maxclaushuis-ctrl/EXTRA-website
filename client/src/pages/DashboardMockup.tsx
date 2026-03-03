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
  Calendar, Search, Plus, MoreHorizontal, Phone, ChevronDown, LogOut, FileText, ChefHat, Building2, X,
  Bell, BellOff
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
];

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

  // Sollicitanten tab state
  const [appSearch, setAppSearch] = useState('');
  const [appFunctionFilter, setAppFunctionFilter] = useState('alle');
  const [appInterviewerFilter, setAppInterviewerFilter] = useState('alle');
  const [appStatusFilter, setAppStatusFilter] = useState('alle');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [appDetailOpen, setAppDetailOpen] = useState(false);

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
    refetchInterval: 30000,
  });

  const rejectCandidateMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest('PATCH', `/api/admin/candidates/${id}`, { status: 'afgewezen' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] }); },
  });

  const { data: applicationsData, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery<{ applications: any[]; total: number }>({
    queryKey: ['/api/admin/applications'],
    enabled: isAuthenticated && user?.role === 'admin',
    staleTime: 0,
    refetchOnWindowFocus: true,
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
  const filteredApplications = allApplications.filter(a => {
    const matchesFn = appFunctionFilter === 'alle' || a.functionType === appFunctionFilter;
    const matchesIv = appInterviewerFilter === 'alle' || a.interviewer === appInterviewerFilter;
    const matchesSt = appStatusFilter === 'alle' || a.status === appStatusFilter;
    const q = appSearch.toLowerCase();
    const matchesQ = !appSearch || `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q);
    return matchesFn && matchesIv && matchesSt && matchesQ;
  });
  const appCounts = {
    total: allApplications.length,
    nieuw: allApplications.filter(a => a.status === 'nieuw').length,
    beoordeeld: allApplications.filter(a => a.status === 'beoordeeld').length,
    aangenomen: allApplications.filter(a => a.status === 'aangenomen').length,
    afgewezen: allApplications.filter(a => a.status === 'afgewezen').length,
    horecamedewerker: allApplications.filter(a => a.functionType === 'horecamedewerker').length,
    housekeeping: allApplications.filter(a => a.functionType === 'housekeeping').length,
    chef: allApplications.filter(a => a.functionType === 'chef').length,
    frontoffice: allApplications.filter(a => a.functionType === 'frontoffice' || a.functionType === 'front-office').length,
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-purple-600 text-sm">EXTRAATJE</div>
              <div className="text-xs text-gray-400">Beheerdersdashboard</div>
            </div>
          </div>
        </div>

        <div className="p-2 text-xs text-gray-400 uppercase tracking-wider mt-4 px-4">Beheer</div>
        
        <nav className="flex-1 px-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.tab)}
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
      <main className="flex-1 ml-56 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
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

        <div className="p-6">
          {activeTab === 'kandidaten' ? (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold">Kandidaten</h1>
                  <p className="text-sm text-gray-500">Alle aanmeldingen via /aanmelden — realtime gesynchroniseerd</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-white border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">In proces</p>
                    <p className="text-2xl font-bold text-purple-700">{kanInProces.length}</p>
                    <p className="text-xs text-gray-400">Formulier ingevuld, nog niet compleet</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Gesprek gepland</p>
                    <p className="text-2xl font-bold text-blue-600">{kanGesprekGepland.length}</p>
                    <p className="text-xs text-gray-400">Interview ingepland via Calendly</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Afgewezen</p>
                    <p className="text-2xl font-bold text-red-600">{kanAfgewezen.length}</p>
                    <p className="text-xs text-gray-400">Niet geschikt bevonden</p>
                  </CardContent>
                </Card>
              </div>

              {/* Subtabs */}
              <div className="flex items-center gap-1 mb-5 border-b">
                {([
                  { key: 'in_proces', label: 'In proces', count: kanInProces.length, color: 'text-purple-700 border-purple-500' },
                  { key: 'gesprek_gepland', label: 'Gesprek gepland', count: kanGesprekGepland.length, color: 'text-blue-600 border-blue-500' },
                  { key: 'afgewezen', label: 'Afgewezen', count: kanAfgewezen.length, color: 'text-red-600 border-red-500' },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setKandidatenSubtab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                      kandidatenSubtab === tab.key
                        ? tab.color + ' bg-transparent'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      kandidatenSubtab === tab.key ? 'bg-gray-100' : 'bg-gray-100 text-gray-400'
                    }`}>{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Search + Filters */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Zoek op naam, e-mail of woonplaats..."
                    className="pl-10 h-9 text-sm"
                    value={kandidatenSearch}
                    onChange={e => setKandidatenSearch(e.target.value)}
                  />
                </div>
                <Select value={kandidatenFunctionFilter} onValueChange={setKandidatenFunctionFilter}>
                  <SelectTrigger className="w-[150px] h-9 text-sm">
                    <SelectValue placeholder="Alle functies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle functies</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="horecamedewerker">Horecamedewerker</SelectItem>
                    <SelectItem value="chef">Chef / Kok</SelectItem>
                    <SelectItem value="frontoffice">Front-office</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={kandidatenTaalFilter} onValueChange={setKandidatenTaalFilter}>
                  <SelectTrigger className="w-[150px] h-9 text-sm">
                    <SelectValue placeholder="Alle talen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle talen</SelectItem>
                    <SelectItem value="nederlandsstalig">Nederlands</SelectItem>
                    <SelectItem value="english">Engels</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" onClick={() => refetchCandidates()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Vernieuwen
                </Button>
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
                      <table className="text-sm" style={{ minWidth: '1200px' }}>
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {/* AANGEMELD — klikbaar voor sortering */}
                            <th
                              className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap cursor-pointer select-none hover:text-gray-700"
                              onClick={() => setKanSortDesc(v => !v)}
                            >
                              Aangemeld {kanSortDesc ? '↓' : '↑'}
                            </th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Naam</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Functie</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Woonplaats</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">E-mail</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Telefoon</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Nat.</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Ervaring</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Taal</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Status</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Ontbrekend</th>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {kanSubset.map(c => {
                            const missing = kanMissingItems(c);
                            return (
                              <tr key={c.id} className="hover:bg-gray-50 align-middle">
                                {/* AANGEMELD */}
                                <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">
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
                                    <span className="font-medium text-gray-900 text-xs whitespace-nowrap">
                                      {c.firstName} {c.lastName}
                                    </span>
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
                                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                                  {c.city || '—'}
                                </td>
                                {/* E-MAIL */}
                                <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">
                                  {c.email || '—'}
                                </td>
                                {/* TELEFOON */}
                                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                                  {c.phone || '—'}
                                </td>
                                {/* NATIONALITEIT */}
                                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                                  {c.nationality || '—'}
                                </td>
                                {/* ERVARING */}
                                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                                  {kanExpLabel(c)}
                                </td>
                                {/* VOERTAAL */}
                                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                                  {c.language || '—'}
                                </td>
                                {/* STATUS */}
                                <td className="px-3 py-3 whitespace-nowrap">
                                  {kandidatenSubtab === 'in_proces' && (
                                    <Badge className="text-xs bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">In proces</Badge>
                                  )}
                                  {kandidatenSubtab === 'gesprek_gepland' && (
                                    <Badge className="text-xs bg-blue-100 text-blue-700 border border-blue-200 whitespace-nowrap">
                                      <Calendar className="h-2.5 w-2.5 mr-1" />{c.interviewDate}
                                    </Badge>
                                  )}
                                  {kandidatenSubtab === 'afgewezen' && (
                                    <Badge className="text-xs bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">Afgewezen</Badge>
                                  )}
                                </td>
                                {/* ONTBREKEND */}
                                <td className="px-3 py-3 whitespace-nowrap">
                                  {missing.length > 0 ? (
                                    <div className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                                      <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                      <span>{missing.join(', ')}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-green-600 font-medium whitespace-nowrap">✓ Compleet</span>
                                  )}
                                </td>
                                {/* ACTIES */}
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-0.5">
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <Eye className="h-3 w-3 text-gray-400" />
                                    </Button>
                                    {kandidatenSubtab !== 'afgewezen' && (
                                      <Button
                                        variant="ghost" size="icon" className="h-6 w-6"
                                        onClick={() => rejectCandidateMutation.mutate(c.id)}
                                        title="Afwijzen"
                                      >
                                        <Trash2 className="h-3 w-3 text-red-400" />
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

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold">Sollicitanten</h1>
                  <p className="text-sm text-gray-500">Ingevulde HR-intakeformulieren per functie</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2 text-sm" onClick={() => refetchApplications()}>
                    <RefreshCw className="h-4 w-4" />
                    Vernieuwen
                  </Button>
                  <a href="/sollicitatieformulier" target="_blank">
                    <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 text-sm">
                      <FileText className="h-4 w-4" />
                      Intakeformulier
                    </Button>
                  </a>
                </div>
              </div>

              {/* Stats Cards — status overzicht */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <Card className="bg-white border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Totaal ingevuld</p>
                    <p className="text-2xl font-bold">{appCounts.total}</p>
                    <p className="text-xs text-gray-400 mt-1">Alle formulieren</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-blue-400">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Nieuw</p>
                    <p className="text-2xl font-bold text-blue-600">{appCounts.nieuw}</p>
                    <p className="text-xs text-gray-400 mt-1">Nog te beoordelen</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Aangenomen</p>
                    <p className="text-2xl font-bold text-green-600">{appCounts.aangenomen}</p>
                    <p className="text-xs text-gray-400 mt-1">Goedgekeurd</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-red-400">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Afgewezen</p>
                    <p className="text-2xl font-bold text-red-500">{appCounts.afgewezen}</p>
                    <p className="text-xs text-gray-400 mt-1">Niet doorgegaan</p>
                  </CardContent>
                </Card>
              </div>

              {/* Function breakdown */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Horecamedewerker', count: appCounts.horecamedewerker, color: 'bg-orange-50 border-orange-200 text-orange-700' },
                  { label: 'Housekeeping', count: appCounts.housekeeping, color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
                  { label: 'Chef', count: appCounts.chef, color: 'bg-gray-50 border-gray-200 text-gray-700' },
                  { label: 'Front-office', count: appCounts.frontoffice, color: 'bg-blue-50 border-blue-200 text-blue-700' },
                ].map(({ label, count, color }) => (
                  <button
                    key={label}
                    onClick={() => setAppFunctionFilter(appFunctionFilter === label.toLowerCase().replace('-', '') ? 'alle' : label.toLowerCase().replace('-office', 'office').replace('horecamedewerker', 'horecamedewerker').replace('housekeeping', 'housekeeping').replace('chef', 'chef'))}
                    className={`border rounded-lg p-3 flex items-center justify-between transition-all hover:shadow-sm ${color}`}
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xl font-bold">{count}</span>
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Zoek op naam of e-mail..."
                    className="pl-9"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                  />
                </div>
                <Select value={appFunctionFilter} onValueChange={setAppFunctionFilter}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Alle functies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle functies</SelectItem>
                    <SelectItem value="horecamedewerker">Horecamedewerker</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="chef">Chef</SelectItem>
                    <SelectItem value="frontoffice">Front-office</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={appInterviewerFilter} onValueChange={setAppInterviewerFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Alle interviewers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle interviewers</SelectItem>
                    {['Eveline', 'Isa', 'Charlotte', 'Max', 'Lea'].map(iv => (
                      <SelectItem key={iv} value={iv}>{iv}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle statussen</SelectItem>
                    <SelectItem value="nieuw">Nieuw</SelectItem>
                    <SelectItem value="beoordeeld">Beoordeeld</SelectItem>
                    <SelectItem value="aangenomen">Aangenomen</SelectItem>
                    <SelectItem value="afgewezen">Afgewezen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status tab pills */}
              <div className="flex items-center gap-2 mb-4 border-b pb-3">
                {[
                  { val: 'alle', label: `Alle (${appCounts.total})`, cls: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                  { val: 'nieuw', label: `Nieuw (${appCounts.nieuw})`, cls: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                  { val: 'beoordeeld', label: `Beoordeeld (${appCounts.beoordeeld})`, cls: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                  { val: 'aangenomen', label: `Aangenomen (${appCounts.aangenomen})`, cls: 'bg-green-100 text-green-700 hover:bg-green-200' },
                  { val: 'afgewezen', label: `Afgewezen (${appCounts.afgewezen})`, cls: 'bg-red-100 text-red-700 hover:bg-red-200' },
                ].map(({ val, label, cls }) => (
                  <Button
                    key={val}
                    variant={appStatusFilter === val ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAppStatusFilter(val)}
                    className={appStatusFilter === val ? cls : 'text-gray-500'}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Applications Table */}
              <Card>
                <CardContent className="p-0">
                  {applicationsLoading ? (
                    <div className="p-6 space-y-3">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : filteredApplications.length === 0 ? (
                    <div className="p-12 text-center">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Geen sollicitaties gevonden</h3>
                      <p className="text-gray-400 text-sm">
                        {appCounts.total === 0
                          ? 'Er zijn nog geen HR-intakeformulieren ingevuld.'
                          : 'Geen resultaten voor de huidige filters.'}
                      </p>
                      {appCounts.total === 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          Formulier: <a href="/sollicitatieformulier" target="_blank" className="font-mono underline">/sollicitatieformulier</a>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Datum</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Naam</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Functie</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">E-mail</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Interviewer</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Beoordeling</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredApplications.map((app) => {
                            const rating = parseInt(app.assessmentRating) || 0;
                            const statusColors: Record<string, string> = {
                              nieuw: 'bg-blue-100 text-blue-700',
                              beoordeeld: 'bg-yellow-100 text-yellow-700',
                              aangenomen: 'bg-green-100 text-green-700',
                              afgewezen: 'bg-red-100 text-red-700',
                            };
                            const fnLabels: Record<string, string> = {
                              horecamedewerker: 'Horeca',
                              housekeeping: 'Housekeeping',
                              chef: 'Chef',
                              frontoffice: 'Front-office',
                              'front-office': 'Front-office',
                            };
                            return (
                              <tr key={app.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedApp(app); setAppDetailOpen(true); }}>
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                  {new Date(app.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                      app.functionType === 'housekeeping' ? 'bg-cyan-100 text-cyan-700' :
                                      app.functionType === 'chef' ? 'bg-gray-100 text-gray-600' :
                                      app.functionType === 'horecamedewerker' ? 'bg-orange-100 text-orange-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {getInitials(app.firstName, app.lastName)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{app.firstName} {app.lastName}</p>
                                      {app.city && <p className="text-xs text-gray-400">{app.city}</p>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className={`text-xs ${getFunctionBadgeColor(app.functionType)}`}>
                                    {fnLabels[app.functionType] || app.functionType}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-gray-600 text-xs">{app.email || '—'}</td>
                                <td className="px-4 py-3 text-gray-600 text-xs">{app.interviewer || '—'}</td>
                                <td className="px-4 py-3">
                                  <span className="flex gap-0.5">
                                    {[1,2,3,4,5].map(i => (
                                      <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                                    ))}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className={`text-xs ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
                                    {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => { setSelectedApp(app); setAppDetailOpen(true); }}
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    Bekijken
                                  </Button>
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
