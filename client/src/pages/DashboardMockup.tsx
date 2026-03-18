import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Bell, BellOff, ArrowUpDown, ShieldAlert, Download, AlertTriangle, CheckCircle2, GripVertical,
  Upload, FileSpreadsheet, ChevronRight, Info, BookOpen, Sparkles, Pencil, Globe, Rss, Send, Link, Copy, Loader2,
  Briefcase, MapPin, Pause, Archive, ExternalLink, SlidersHorizontal
} from 'lucide-react';
import WebsiteStatsTab from './dashboard/WebsiteStatsTab';

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
  const [medewerkerExpanded, setMedewerkerExpanded] = useState(true);
  const [bedrijvenExpanded, setBedrijvenExpanded] = useState(true);
  const [bedrijvenSearch, setBedrijvenSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('deze-maand');
  const [functionFilter, setFunctionFilter] = useState('alle');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('alle');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [kandidatenSubtab, setKandidatenSubtab] = useState<'in_proces' | 'beoordelen' | 'gesprek_gepland' | 'afgewezen'>('in_proces');
  const [kandidatenSearch, setKandidatenSearch] = useState('');
  const [kandidatenFunctionFilter, setKandidatenFunctionFilter] = useState('alle');
  const [kandidatenTaalFilter, setKandidatenTaalFilter] = useState('alle');
  const [kanSortDesc, setKanSortDesc] = useState(true);
  const [showWeekCalendar, setShowWeekCalendar] = useState(false);
  const [weekDayFilter, setWeekDayFilter] = useState<string | null>(null);
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
  const [appSortField, setAppSortField] = useState<string>('date');
  const [appPage, setAppPage] = useState(0);
  const APP_PAGE_SIZE = 50;
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [appDetailOpen, setAppDetailOpen] = useState(false);
  const [appRejectConfirmApp, setAppRejectConfirmApp] = useState<any | null>(null);

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importRole, setImportRole] = useState<'horeca' | 'housekeeping' | 'chef'>('horeca');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDryRun, setImportDryRun] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Blog & SEO tab state
  const [blogExpanded, setBlogExpanded] = useState(true);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogStatusFilter, setBlogStatusFilter] = useState('alle');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('alle');
  const [blogEditOpen, setBlogEditOpen] = useState(false);
  const [blogEditPost, setBlogEditPost] = useState<any | null>(null);
  const [blogForm, setBlogForm] = useState<any>({});
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogDeleteId, setBlogDeleteId] = useState<number | null>(null);
  const [blogAiOpen, setBlogAiOpen] = useState(false);
  const [blogAiTopic, setBlogAiTopic] = useState('');
  const [blogAiKeyword, setBlogAiKeyword] = useState('');
  const [blogAiCategory, setBlogAiCategory] = useState('Blog');
  const [blogAiLoading, setBlogAiLoading] = useState(false);
  const [blogAiError, setBlogAiError] = useState<string | null>(null);
  const [blogAiResult, setBlogAiResult] = useState<any | null>(null);
  const [blogAiAdvancedOpen, setBlogAiAdvancedOpen] = useState(false);
  const [blogAiContext, setBlogAiContext] = useState('');
  const [blogAiRefUrls, setBlogAiRefUrls] = useState('');
  const [blogAiInternalLinks, setBlogAiInternalLinks] = useState('');
  const [blogAiTone, setBlogAiTone] = useState('Informeel & energiek (EXTRA stijl)');
  const [blogAiAudience, setBlogAiAudience] = useState('Horeca ondernemers');
  const [blogPreviewPost, setBlogPreviewPost] = useState<any | null>(null);
  const [blogPreviewOpen, setBlogPreviewOpen] = useState(false);

  // Vacancy CMS tab state
  const [vacancySearch, setVacancySearch] = useState('');
  const [vacancyStatusFilter, setVacancyStatusFilter] = useState('alle');
  const [vacancyFunctionFilter, setVacancyFunctionFilter] = useState('alle');
  const [vacancyEditOpen, setVacancyEditOpen] = useState(false);
  const [vacancyEditPost, setVacancyEditPost] = useState<any | null>(null);
  const [vacancyForm, setVacancyForm] = useState<any>({});
  const [vacancySaving, setVacancySaving] = useState(false);
  const [vacancyDeleteId, setVacancyDeleteId] = useState<number | null>(null);
  const [vacancyFormTab, setVacancyFormTab] = useState<'basic' | 'content' | 'seo' | 'publish'>('basic');

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
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchInterval: 60000,
  });

  const rejectCandidateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest('PATCH', `/api/admin/candidates/${id}/status`, { status: 'afgewezen', rejectionReason: reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] }); },
  });

  const reviewCandidateMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'accept' | 'reject' }) =>
      apiRequest('POST', `/api/admin/candidates/${id}/review`, { action }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
      toast({ title: action === 'accept' ? '✅ Kandidaat geaccepteerd' : '❌ Kandidaat afgewezen', description: action === 'accept' ? 'Een Calendly-uitnodiging is verstuurd.' : 'Een afwijzingsmail is verstuurd.' });
    },
    onError: () => { toast({ title: 'Fout', description: 'Er is iets misgegaan.', variant: 'destructive' }); },
  });

  const { data: applicationsData, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery<{ applications: any[]; total: number }>({
    queryKey: ['/api/admin/applications'],
    enabled: isAuthenticated && user?.role === 'admin',
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchInterval: 60000,
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

  const { data: staffingRequestsData = [], isLoading: staffingRequestsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/staffing-requests'],
    enabled: isAuthenticated && user?.role === 'admin',
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });

  const { data: blogData, isLoading: blogLoading, refetch: refetchBlog } = useQuery<{ posts: any[]; total: number }>({
    queryKey: ['/api/admin/blog'],
    enabled: isAuthenticated && user?.role === 'admin',
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const blogPosts = blogData?.posts ?? [];

  const { data: vacancyData, isLoading: vacancyLoading, refetch: refetchVacancy } = useQuery<{ posts: any[]; total: number }>({
    queryKey: ['/api/admin/vacatures'],
    enabled: isAuthenticated && user?.role === 'admin',
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const vacancyPosts = vacancyData?.posts ?? [];

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

  const allCandidates = useMemo(() => candidatesData?.candidates || [], [candidatesData]);

  const filteredCandidates = useMemo(() => allCandidates.filter(c => {
    const matchesStatus = candidateStatusFilter === 'alle' || c.status === candidateStatusFilter;
    const searchTerm = candidateSearch.toLowerCase();
    const matchesSearch = candidateSearch === '' || 
      (c.firstName && c.firstName.toLowerCase().includes(searchTerm)) ||
      (c.lastName && c.lastName.toLowerCase().includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm)) ||
      (c.phone && c.phone.toLowerCase().includes(searchTerm));
    return matchesStatus && matchesSearch;
  }), [allCandidates, candidateStatusFilter, candidateSearch]);

  const candidateCounts = useMemo(() => ({
    total: allCandidates.length,
    inBehandeling: allCandidates.filter(c => c.status === 'in_behandeling').length,
    aangenomen: allCandidates.filter(c => c.status === 'aangenomen').length,
    afgewezen: allCandidates.filter(c => c.status === 'afgewezen').length,
  }), [allCandidates]);

  // Applications (sollicitanten) computed
  const allApplications: any[] = useMemo(() => applicationsData?.applications || [], [applicationsData]);
  const activeApplications = useMemo(() => allApplications.filter(a => a.status !== 'afgewezen'), [allApplications]);
  const rejectedApplications = useMemo(() => allApplications.filter(a => a.status === 'afgewezen'), [allApplications]);

  const filteredApplications = useMemo(() => {
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
      if (appSortField === 'date') {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return appSortDesc ? diff : -diff;
      }
      const av = (a as any)[appSortField] ?? null;
      const bv = (b as any)[appSortField] ?? null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return appSortDesc ? bv - av : av - bv;
    });
  }, [allApplications, appTab, appInterviewerFilter, appSearch, appSortField, appSortDesc, activeApplications, rejectedApplications]);

  const appCounts = useMemo(() => ({
    alle: activeApplications.length,
    afgewezen: rejectedApplications.length,
    horecamedewerker: activeApplications.filter(a => a.functionType === 'horecamedewerker').length,
    housekeeping: activeApplications.filter(a => a.functionType === 'housekeeping').length,
    chef: activeApplications.filter(a => a.functionType === 'chef').length,
    frontoffice: activeApplications.filter(a => a.functionType === 'frontoffice' || a.functionType === 'front-office').length,
  }), [activeApplications, rejectedApplications]);

  const pagedApplications = useMemo(
    () => filteredApplications.slice(appPage * APP_PAGE_SIZE, (appPage + 1) * APP_PAGE_SIZE),
    [filteredApplications, appPage]
  );
  const appTotalPages = Math.ceil(filteredApplications.length / APP_PAGE_SIZE);

  useEffect(() => { setAppPage(0); }, [appTab, appSearch, appInterviewerFilter, appSortField, appSortDesc]);

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
  const kanInProces = useMemo(() => allCandidates.filter(c => c.status !== 'afgewezen' && !c.hasCv && !c.interviewDate), [allCandidates]);
  const kanBeoordelen = useMemo(() => allCandidates.filter(c => c.status !== 'afgewezen' && !!c.hasCv && !c.interviewDate), [allCandidates]);
  const kanGesprekGepland = useMemo(() => allCandidates.filter(c => c.status !== 'afgewezen' && !!c.interviewDate), [allCandidates]);
  const kanAfgewezen = useMemo(() => allCandidates.filter(c => c.status === 'afgewezen'), [allCandidates]);
  const kanSubset = useMemo(() => {
    const kanSubsetMap: Record<string, Candidate[]> = { in_proces: kanInProces, beoordelen: kanBeoordelen, gesprek_gepland: kanGesprekGepland, afgewezen: kanAfgewezen };
    const kanRawSubset: Candidate[] = kanSubsetMap[kandidatenSubtab] || [];
    return kanRawSubset
      .filter(c => {
        const q = kandidatenSearch.toLowerCase();
        const matchQ = q === '' ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q);
        const matchFn = kandidatenFunctionFilter === 'alle' || c.functionType === kandidatenFunctionFilter;
        const matchTaal = kandidatenTaalFilter === 'alle' ||
          (c.language || '').toLowerCase().includes(kandidatenTaalFilter.toLowerCase());
        const matchDay = !weekDayFilter || (c.interviewDate && c.interviewDate.slice(0, 10) === weekDayFilter);
        return matchQ && matchFn && matchTaal && matchDay;
      })
      .sort((a, b) => {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return kanSortDesc ? diff : -diff;
      });
  }, [kanInProces, kanBeoordelen, kanGesprekGepland, kanAfgewezen, kandidatenSubtab, kandidatenSearch, kandidatenFunctionFilter, kandidatenTaalFilter, weekDayFilter, kanSortDesc]);
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

        <nav className="flex-1 px-2 overflow-y-auto pt-3">
          {/* Group: Medewerkers */}
          <button
            onClick={() => setMedewerkerExpanded(e => !e)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors mb-0.5"
          >
            <span>Medewerkers</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${medewerkerExpanded ? '' : '-rotate-90'}`} />
          </button>
          {medewerkerExpanded && (
            <>
              {[
                { icon: UserCheck, label: 'Kandidaten', tab: 'kandidaten' },
                { icon: UserPlus, label: 'Sollicitanten', tab: 'sollicitanten' },
                { icon: ShieldAlert, label: 'TWV', tab: 'twv' },
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors text-sm ${
                    activeTab === item.tab ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </>
          )}

          {/* Group: Bedrijven */}
          <button
            onClick={() => setBedrijvenExpanded(e => !e)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors mt-3 mb-0.5"
          >
            <span>Bedrijven</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${bedrijvenExpanded ? '' : '-rotate-90'}`} />
          </button>
          {bedrijvenExpanded && (
            <button
              onClick={() => { setActiveTab('bedrijven-aanvragen'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors text-sm ${
                activeTab === 'bedrijven-aanvragen' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Personeelsaanvragen</span>
            </button>
          )}

          {/* Group: Marketing & SEO */}
          <button
            onClick={() => setBlogExpanded(e => !e)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors mt-3 mb-0.5"
          >
            <span>Marketing & SEO</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${blogExpanded ? '' : '-rotate-90'}`} />
          </button>
          {blogExpanded && (
            <>
              <button
                onClick={() => { setActiveTab('blog'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors text-sm ${
                  activeTab === 'blog' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Blog & SEO</span>
                {blogPosts.filter((p: any) => p.status === 'scheduled').length > 0 && (
                  <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                    {blogPosts.filter((p: any) => p.status === 'scheduled').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('vacatures-cms'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors text-sm ${
                  activeTab === 'vacatures-cms' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Vacatures & SEO</span>
                {vacancyPosts.filter((p: any) => p.status === 'published').length > 0 && (
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                    {vacancyPosts.filter((p: any) => p.status === 'published').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('stats'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors text-sm ${
                  activeTab === 'stats' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Website Statistieken</span>
              </button>
            </>
          )}
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
                <button
                  onClick={() => { setShowWeekCalendar(v => !v); if (showWeekCalendar) setWeekDayFilter(null); }}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all duration-200 ${
                    showWeekCalendar
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Week agenda</span>
                  {kanGesprekGepland.length > 0 && !showWeekCalendar && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-0.5">{kanGesprekGepland.length}</span>
                  )}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
                <Card className="bg-white border-l-4 border-l-purple-500">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs text-gray-500 mb-1">In proces</p>
                    <p className="text-2xl font-bold text-purple-700">{kanInProces.length}</p>
                    <p className="text-xs text-gray-400 hidden sm:block">Wacht op CV</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-amber-500">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs text-gray-500 mb-1">Beoordelen</p>
                    <p className="text-2xl font-bold text-amber-600">{kanBeoordelen.length}</p>
                    <p className="text-xs text-gray-400 hidden sm:block">CV ter beoordeling</p>
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

              {/* Week Calendar Panel */}
              {showWeekCalendar && (() => {
                const today = new Date();
                const dow = today.getDay();
                const monday = new Date(today);
                monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
                monday.setHours(0, 0, 0, 0);

                const weekDays = Array.from({ length: 5 }, (_, i) => {
                  const d = new Date(monday);
                  d.setDate(monday.getDate() + i);
                  return d;
                });

                const dayLabels = ['Ma', 'Di', 'Wo', 'Do', 'Vr'];
                const monthNames = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

                const interviewsByDay: Record<string, typeof kanGesprekGepland> = {};
                kanGesprekGepland.forEach(c => {
                  if (c.interviewDate) {
                    const key = c.interviewDate.slice(0, 10);
                    if (!interviewsByDay[key]) interviewsByDay[key] = [];
                    interviewsByDay[key].push(c);
                  }
                });

                const totalThisWeek = weekDays.reduce((sum, d) => {
                  const key = d.toISOString().slice(0, 10);
                  return sum + (interviewsByDay[key]?.length || 0);
                }, 0);

                const isToday = (d: Date) => {
                  const now = new Date();
                  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
                };

                return (
                  <div className="mb-4">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                      {/* Calendar header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-gray-900">Deze week</span>
                            <span className="ml-2 text-xs text-gray-400 font-medium">
                              {weekDays[0].getDate()} – {weekDays[4].getDate()} {monthNames[weekDays[4].getMonth()]}
                            </span>
                          </div>
                          {totalThisWeek > 0 && (
                            <span className="ml-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {totalThisWeek} gesprek{totalThisWeek !== 1 ? 'ken' : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {weekDayFilter && (
                            <button
                              onClick={() => setWeekDayFilter(null)}
                              className="text-xs text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <X className="w-3 h-3" /> Toon alles
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Day columns */}
                      <div className="grid grid-cols-5">
                        {weekDays.map((day, i) => {
                          const key = day.toISOString().slice(0, 10);
                          const interviews = interviewsByDay[key] || [];
                          const isSelected = weekDayFilter === key;
                          const isPast = day < new Date(new Date().setHours(0,0,0,0));
                          const isTodayDay = isToday(day);

                          return (
                            <button
                              key={key}
                              onClick={() => {
                                if (interviews.length === 0) return;
                                setWeekDayFilter(isSelected ? null : key);
                                if (!isSelected) setKandidatenSubtab('gesprek_gepland');
                              }}
                              disabled={interviews.length === 0}
                              className={`relative flex flex-col items-center py-3 px-1 border-r last:border-r-0 border-gray-50 transition-all duration-150 min-h-[80px] ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : interviews.length > 0
                                    ? 'hover:bg-blue-50 cursor-pointer'
                                    : 'cursor-default opacity-60'
                              }`}
                            >
                              {/* Day label */}
                              <span className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                                isSelected ? 'text-blue-100' : isTodayDay ? 'text-blue-600' : 'text-gray-400'
                              }`}>
                                {dayLabels[i]}
                              </span>

                              {/* Date number */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-colors ${
                                isSelected
                                  ? 'bg-white text-blue-600'
                                  : isTodayDay
                                    ? 'bg-blue-600 text-white'
                                    : isPast
                                      ? 'text-gray-300'
                                      : 'text-gray-800'
                              }`}>
                                {day.getDate()}
                              </div>

                              {/* Interviews */}
                              {interviews.length > 0 ? (
                                <div className="flex flex-col items-center gap-1 w-full px-1">
                                  {interviews.slice(0, 2).map((c, ci) => (
                                    <div key={c.id} className={`w-full flex items-center gap-1 px-1.5 py-1 rounded-lg text-left ${
                                      isSelected ? 'bg-white/20' : 'bg-blue-50'
                                    }`}>
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                        isSelected ? 'bg-white text-blue-600' : 'bg-blue-200 text-blue-700'
                                      }`}>
                                        {(c.firstName?.[0] || '?')}
                                      </div>
                                      <div className="min-w-0 flex-1 hidden sm:block">
                                        <p className={`text-xs font-semibold truncate leading-tight ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                          {c.firstName}
                                        </p>
                                        {c.interviewTime && (
                                          <p className={`text-xs truncate leading-tight ${isSelected ? 'text-blue-200' : 'text-blue-500'}`}>
                                            {c.interviewTime.slice(0, 5)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {interviews.length > 2 && (
                                    <span className={`text-xs font-semibold ${isSelected ? 'text-blue-100' : 'text-blue-500'}`}>
                                      +{interviews.length - 2} meer
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className={`text-xs ${isPast ? 'text-gray-200' : 'text-gray-300'}`}>—</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {weekDayFilter && (
                      <p className="text-xs text-blue-600 font-medium mt-1.5 ml-1">
                        Gefilterd op {new Date(weekDayFilter + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} — {kanSubset.length} gesprek{kanSubset.length !== 1 ? 'ken' : ''}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Subtabs */}
              <div className="flex items-center gap-0 mb-4 border-b">
                {([
                  { key: 'in_proces', labelFull: 'In proces', labelShort: 'In proces', count: kanInProces.length, color: 'text-purple-700 border-purple-500' },
                  { key: 'beoordelen', labelFull: 'Beoordelen', labelShort: 'Beoordelen', count: kanBeoordelen.length, color: 'text-amber-600 border-amber-500' },
                  { key: 'gesprek_gepland', labelFull: 'Gesprek gepland', labelShort: 'Gepland', count: kanGesprekGepland.length, color: 'text-blue-600 border-blue-500' },
                  { key: 'afgewezen', labelFull: 'Afgewezen', labelShort: 'Afgewezen', count: kanAfgewezen.length, color: 'text-red-600 border-red-500' },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setKandidatenSubtab(tab.key); if (tab.key !== 'gesprek_gepland') setWeekDayFilter(null); }}
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
                              {kandidatenSubtab === 'gesprek_gepland' ? 'Gesprek' : 'Datum'} {kanSortDesc ? '↓' : '↑'}
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
                                {/* DATUM / GESPREK */}
                                <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap hidden sm:table-cell">
                                  {kandidatenSubtab === 'gesprek_gepland' && c.interviewDate ? (
                                    <div>
                                      <div className="font-medium text-gray-700">
                                        {new Date(c.interviewDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </div>
                                      {c.interviewTime && (
                                        <div className="text-blue-500 font-medium">{c.interviewTime.slice(0, 5)}</div>
                                      )}
                                    </div>
                                  ) : (
                                    new Date(c.createdAt).toLocaleDateString('nl-NL')
                                  )}
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
                                      <div className="text-xs text-gray-400 sm:hidden">
                                        {kandidatenSubtab === 'gesprek_gepland' && c.interviewDate
                                          ? `${new Date(c.interviewDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}${c.interviewTime ? ' ' + c.interviewTime.slice(0, 5) : ''}`
                                          : new Date(c.createdAt).toLocaleDateString('nl-NL')}
                                      </div>
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
                                  {kandidatenSubtab === 'beoordelen' ? (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={() => { setCvPreviewCandidate(c); setCvPreviewOpen(true); }}
                                        title={c.hasCv ? "CV bekijken" : "Geen CV"}
                                      >
                                        <Eye className={`h-3.5 w-3.5 ${c.hasCv ? 'text-green-500' : 'text-gray-300'}`} />
                                      </Button>
                                      {c.status === 'aangenomen' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200 whitespace-nowrap">
                                          ✓ Goedgekeurd
                                        </span>
                                      ) : (
                                        <>
                                          <Button
                                            size="sm"
                                            className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                                            disabled={reviewCandidateMutation.isPending}
                                            onClick={() => reviewCandidateMutation.mutate({ id: c.id, action: 'accept' })}
                                            title="Accepteren — stuurt Calendly-uitnodiging"
                                          >
                                            ✓ Accepteren
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                            disabled={reviewCandidateMutation.isPending}
                                            onClick={() => { setRejectReason('diensten'); setRejectConfirmId(c.id); }}
                                            title="Afwijzen"
                                          >
                                            ✗ Afwijzen
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  ) : (
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
                                  )}
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
              {/* Import XLSX Modal */}
              <Dialog open={importModalOpen} onOpenChange={(open) => { if (!importLoading) setImportModalOpen(open); }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      Import .xlsx — {importRole === 'horeca' ? 'Horecamedewerker' : importRole === 'chef' ? 'Chef' : 'Housekeeping'}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 pt-2">
                    {/* File picker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Excel-bestand (.xlsx)</label>
                      <div
                        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
                        onClick={() => document.getElementById('xlsx-file-input')?.click()}
                      >
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        {importFile ? (
                          <p className="text-sm font-medium text-green-700">{importFile.name} ({(importFile.size / 1024).toFixed(0)} KB)</p>
                        ) : (
                          <p className="text-sm text-gray-500">Klik om een .xlsx bestand te selecteren</p>
                        )}
                        <input
                          id="xlsx-file-input"
                          type="file"
                          accept=".xlsx"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setImportFile(f);
                            setImportPreview(null);
                            setImportResult(null);
                            setImportError(null);
                          }}
                        />
                      </div>
                    </div>

                    {/* Dry-run toggle */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <input
                        type="checkbox"
                        id="dry-run-toggle"
                        checked={importDryRun}
                        onChange={(e) => {
                          setImportDryRun(e.target.checked);
                          setImportResult(null);
                        }}
                        className="h-4 w-4 text-blue-600"
                      />
                      <label htmlFor="dry-run-toggle" className="text-sm">
                        <span className="font-medium text-blue-800">Dry-run (alleen preview)</span>
                        <span className="text-blue-600 ml-1">— analyseer het bestand zonder iets op te slaan</span>
                      </label>
                    </div>

                    {/* Analyse button */}
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!importFile || importLoading}
                      onClick={async () => {
                        if (!importFile) return;
                        setImportLoading(true);
                        setImportError(null);
                        setImportPreview(null);
                        setImportResult(null);
                        try {
                          const fd = new FormData();
                          fd.append('file', importFile);
                          const res = await fetch(`/api/import/${importRole}/preview`, {
                            method: 'POST', body: fd, credentials: 'include',
                          });
                          const json = await res.json();
                          if (!res.ok || json.error) throw new Error(json.error || 'Fout bij analyseren');
                          setImportPreview(json);
                          if (!importDryRun) {
                            const res2 = await fetch(`/api/import/${importRole}/commit`, {
                              method: 'POST', body: fd, credentials: 'include',
                            });
                            const json2 = await res2.json();
                            if (!res2.ok || json2.error) throw new Error(json2.error || 'Fout bij importeren');
                            setImportResult(json2);
                            queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
                            refetchApplications();
                          }
                        } catch (err: any) {
                          setImportError(err.message || 'Onbekende fout');
                        } finally {
                          setImportLoading(false);
                        }
                      }}
                    >
                      {importLoading ? (
                        <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />{importDryRun ? 'Analyseren...' : 'Importeren...'}</span>
                      ) : importDryRun ? 'Analyseer bestand' : 'Importeer nu'}
                    </Button>

                    {/* Error */}
                    {importError && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700">{importError}</p>
                      </div>
                    )}

                    {/* Preview */}
                    {importPreview && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          <div className="text-sm flex-1">
                            <span className="font-medium text-green-800">Sheet gevonden: "{importPreview.sheetName}"</span>
                            <span className="text-green-600 ml-2">— {importPreview.totalRows} rijen</span>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            importRole === 'horeca' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            importRole === 'chef' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                            'bg-cyan-100 text-cyan-700 border-cyan-200'
                          }`}>
                            Functie: {importRole === 'horeca' ? 'Horecamedewerker' : importRole === 'chef' ? 'Chef' : 'Housekeeping'}
                          </span>
                        </div>
                        {importPreview.availableSheets?.length > 1 && (
                          <div className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Info className="h-3 w-3 shrink-0" />
                            Alle tabbladen in dit bestand: {importPreview.availableSheets.join(', ')} — alleen "{importPreview.sheetName}" wordt geïmporteerd
                          </div>
                        )}

                        {/* Column mapping */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Kolom-mapping</h4>
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(importPreview.columnMapping || {}).map(([field, col]: [string, any]) => (
                              <div key={field} className="flex items-center gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                                <span className="text-gray-500">{field}</span>
                                <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
                                <span className="font-medium text-gray-700 truncate">{col}</span>
                              </div>
                            ))}
                            {(importPreview.missingFields || []).map((field: string) => (
                              <div key={field} className="flex items-center gap-1 text-xs">
                                <Info className="h-3 w-3 text-gray-400 shrink-0" />
                                <span className="text-gray-400 italic">{field} niet gevonden</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Preview rows */}
                        {importPreview.previewRows?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                              Preview (eerste {Math.min(importPreview.previewRows.length, 10)} rijen)
                            </h4>
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                              <table className="w-full text-xs">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Naam</th>
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Email</th>
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Telefoon</th>
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Stad</th>
                                    {importRole === 'horeca' && <>
                                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">SS</th>
                                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">Bar</th>
                                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">Bed.</th>
                                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">Din.</th>
                                    </>}
                                    {importRole !== 'horeca' && <th className="px-2 py-1.5 text-left font-medium text-gray-500">Score</th>}
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">TWV</th>
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">Datum</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {importPreview.previewRows.map((row: any, i: number) => (
                                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                                      <td className="px-2 py-1.5 font-medium">{row.fullName || '—'}</td>
                                      <td className="px-2 py-1.5 text-gray-500 max-w-[100px] truncate">{row.email || '—'}</td>
                                      <td className="px-2 py-1.5 text-gray-500">{row.phone || '—'}</td>
                                      <td className="px-2 py-1.5">{row.city || '—'}</td>
                                      {importRole === 'horeca' && <>
                                        <td className="px-2 py-1.5">{row.softskillsScore != null ? `${row.softskillsScore}%` : '—'}</td>
                                        <td className="px-2 py-1.5">{row.barScore != null ? `${row.barScore}%` : '—'}</td>
                                        <td className="px-2 py-1.5">{row.bedieningScore != null ? `${row.bedieningScore}%` : '—'}</td>
                                        <td className="px-2 py-1.5">{row.dinerScore != null ? `${row.dinerScore}%` : '—'}</td>
                                      </>}
                                      {importRole === 'housekeeping' && <td className="px-2 py-1.5">{row.indrukScore != null ? `${row.indrukScore}%` : '—'}</td>}
                                      {importRole === 'chef' && <td className="px-2 py-1.5">{row.totaalscore != null ? `${row.totaalscore}%` : '—'}</td>}
                                      <td className="px-2 py-1.5">{row.twv ? <span className="text-amber-600 font-medium">Ja</span> : 'Nee'}</td>
                                      <td className="px-2 py-1.5 text-gray-400">{row.appliedAt ? new Date(row.appliedAt).toLocaleDateString('nl-NL') : '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Importeer button (only in dry-run mode after preview) */}
                        {importDryRun && !importResult && (
                          <Button
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            disabled={importLoading}
                            onClick={async () => {
                              if (!importFile) return;
                              setImportLoading(true);
                              setImportError(null);
                              try {
                                const fd = new FormData();
                                fd.append('file', importFile);
                                const res = await fetch(`/api/import/${importRole}/commit`, {
                                  method: 'POST', body: fd, credentials: 'include',
                                });
                                const json = await res.json();
                                if (!res.ok || json.error) throw new Error(json.error || 'Fout bij importeren');
                                setImportResult(json);
                                queryClient.invalidateQueries({ queryKey: ['/api/admin/applications'] });
                                refetchApplications();
                              } catch (err: any) {
                                setImportError(err.message || 'Onbekende fout');
                              } finally {
                                setImportLoading(false);
                              }
                            }}
                          >
                            {importLoading ? <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Importeren...</span> : `Importeer nu (${importPreview.totalRows} rijen)`}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Result */}
                    {importResult && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800">Import voltooid!</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {[
                            { label: 'Nieuw', value: importResult.inserted, color: 'text-green-700' },
                            { label: 'Bijgewerkt', value: importResult.updated, color: 'text-blue-700' },
                            { label: 'Overgeslagen', value: importResult.skipped, color: 'text-gray-500' },
                            { label: 'Fouten', value: importResult.errors?.length || 0, color: 'text-red-600' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="bg-white rounded-lg p-2 border border-gray-100">
                              <div className={`text-xl font-bold ${color}`}>{value}</div>
                              <div className="text-xs text-gray-500">{label}</div>
                            </div>
                          ))}
                        </div>
                        {importResult.errors?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-red-700">Fouten:</p>
                            {importResult.errors.slice(0, 5).map((e: any, i: number) => (
                              <p key={i} className="text-xs text-red-600">Rij {e.row}: {e.reason}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

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
                  {['horecamedewerker', 'chef', 'housekeeping'].includes(appTab) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => {
                        const roleMap: Record<string, 'horeca' | 'housekeeping' | 'chef'> = {
                          horecamedewerker: 'horeca', chef: 'chef', housekeeping: 'housekeeping',
                        };
                        setImportRole(roleMap[appTab] || 'horeca');
                        setImportFile(null);
                        setImportPreview(null);
                        setImportResult(null);
                        setImportError(null);
                        setImportDryRun(true);
                        setImportModalOpen(true);
                      }}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1.5">Import .xlsx</span>
                    </Button>
                  )}
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
                    onClick={() => { setAppTab(val); setAppSortField('date'); setAppSortDesc(true); }}
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
                const SortTh = ({ field, children }: { field: string; children: React.ReactNode }) => {
                  const active = appSortField === field;
                  return (
                    <th
                      className="px-3 py-2.5 font-medium text-xs uppercase tracking-wide whitespace-nowrap bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition-colors group"
                      onClick={() => {
                        if (appSortField === field) setAppSortDesc(d => !d);
                        else { setAppSortField(field); setAppSortDesc(true); }
                      }}
                    >
                      <span className={`flex items-center gap-1 ${active ? 'text-purple-600' : 'text-gray-500'}`}>
                        {children}
                        {active
                          ? <span className="font-bold">{appSortDesc ? '↓' : '↑'}</span>
                          : <span className="opacity-0 group-hover:opacity-40 text-gray-400">↕</span>
                        }
                      </span>
                    </th>
                  );
                };
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

                const avatarClass = (ft: string) =>
                  ft === 'housekeeping' ? 'bg-cyan-100 text-cyan-700' :
                  ft === 'chef' ? 'bg-gray-100 text-gray-600' :
                  ft === 'horecamedewerker' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700';

                const MobileCard = ({ app }: { app: any }) => {
                  const scores: [string, number | null | undefined][] = [
                    ['SS', app.softskillsScore],
                    ['Bar', app.barScore],
                    ['Bed', app.bedieningScore],
                    ['Din', app.dinerScore],
                  ].filter(([, v]) => v !== null && v !== undefined) as [string, number][];

                  return (
                    <Card
                      className="shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
                      onClick={() => { setSelectedApp(app); setAppDetailOpen(true); }}
                    >
                      <CardContent className="p-3">
                        {/* Name row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarClass(app.functionType)}`}>
                              {getInitials(app.firstName, app.lastName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-gray-900 truncate">{app.firstName} {app.lastName}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${getFunctionBadgeColor(app.functionType)}`}>
                                  {fnLabels[app.functionType] || app.functionType}
                                </Badge>
                                {app.interviewer && <span className="text-[10px] text-gray-400">{app.interviewer}</span>}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0 pt-0.5">
                            {new Date(app.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>

                        {/* Scores */}
                        {scores.length > 0 && (
                          <div className="flex gap-1.5 mb-2 flex-wrap">
                            {scores.map(([label, score]) => (
                              <span key={label} className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                                (score as number) >= 70 ? 'bg-green-100 text-green-700' :
                                (score as number) >= 50 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {label}: {score}%
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Contact info */}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500 mb-2.5">
                          {app.phone && <span>{app.phone}</span>}
                          {app.city && <span>{app.city}</span>}
                          {app.language && <span>{app.language}</span>}
                          {app.email && <span className="truncate max-w-[180px]">{app.email}</span>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-2" onClick={(e) => e.stopPropagation()}>
                          {app.needsWorkPermit === 'ja' || app.formData?.needsWorkPermit === 'ja' ? (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">TWV nodig</span>
                          ) : <span />}
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedApp(app); setAppDetailOpen(true); }}>
                              <Eye className="h-3.5 w-3.5 text-purple-500" />
                            </Button>
                            {app.status !== 'afgewezen' && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => setAppRejectConfirmApp(app)}>
                                <X className="h-3.5 w-3.5 text-red-400" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                };

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
                  <>
                    {/* Mobile cards */}
                    <div className="block md:hidden space-y-2">
                      {pagedApplications.map(app => <MobileCard key={app.id} app={app} />)}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block">
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
                              {pagedApplications.map(app => (
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
                    </div>
                  </>
                );

                /* ---- HORECAMEDEWERKER tab ---- */
                if (appTab === 'horecamedewerker') return (
                  <>
                    <div className="block md:hidden space-y-2">
                      {pagedApplications.map(app => <MobileCard key={app.id} app={app} />)}
                    </div>
                    <div className="hidden md:block">
                    <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            <Th>Datum</Th>
                            <Th>Wie</Th>
                            <th className="px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap bg-gray-50 sticky left-0">Naam</th>
                            <SortTh field="softskillsScore">Softskills</SortTh>
                            <SortTh field="barScore">Bar</SortTh>
                            <SortTh field="bedieningScore">Bediening</SortTh>
                            <SortTh field="dinerScore">Diner</SortTh>
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
                          {pagedApplications.map(app => {
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
                    </div>
                  </>
                );

                /* ---- CHEF tab ---- */
                if (appTab === 'chef') return (
                  <>
                    <div className="block md:hidden space-y-2">
                      {pagedApplications.map(app => <MobileCard key={app.id} app={app} />)}
                    </div>
                    <div className="hidden md:block">
                  <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            <Th>Datum</Th>
                            <Th>Wie</Th>
                            <th className="px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap bg-gray-50 sticky left-0">Naam</th>
                            <SortTh field="softskillsScore">Score</SortTh>
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
                          {pagedApplications.map(app => {
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
                    </div>
                  </>
                );

                /* ---- HOUSEKEEPING tab ---- */
                if (appTab === 'housekeeping') return (
                  <>
                    <div className="block md:hidden space-y-2">
                      {pagedApplications.map(app => <MobileCard key={app.id} app={app} />)}
                    </div>
                    <div className="hidden md:block">
                  <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            <Th>Datum</Th>
                            <Th>Wie</Th>
                            <th className="px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap bg-gray-50 sticky left-0">Naam</th>
                            <SortTh field="softskillsScore">Indruk</SortTh>
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
                          {pagedApplications.map(app => {
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
                    </div>
                  </>
                );

                /* ---- FRONT-OFFICE tab ---- */
                return (
                  <>
                    <div className="block md:hidden space-y-2">
                      {pagedApplications.map(app => <MobileCard key={app.id} app={app} />)}
                    </div>
                    <div className="hidden md:block">
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
                          {pagedApplications.map(app => {
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
                    </div>
                  </>
                );
              })()}

              {/* Paginering */}
              {appTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                  <p className="text-sm text-gray-500">
                    {appPage * APP_PAGE_SIZE + 1}–{Math.min((appPage + 1) * APP_PAGE_SIZE, filteredApplications.length)} van {filteredApplications.length} sollicitaties
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={appPage === 0}
                      onClick={() => setAppPage(p => p - 1)}
                    >
                      ← Vorige
                    </Button>
                    <span className="text-sm text-gray-600 font-medium">
                      Pagina {appPage + 1} / {appTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={appPage >= appTotalPages - 1}
                      onClick={() => setAppPage(p => p + 1)}
                    >
                      Volgende →
                    </Button>
                  </div>
                </div>
              )}
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
          ) : activeTab === 'bedrijven-aanvragen' ? (
            /* ─── PERSONEELSAANVRAGEN tab ─── */
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-xl font-bold">Personeelsaanvragen</h1>
                  <p className="text-sm text-gray-500">Aanvragen van bedrijven via het personeelsaanvraagformulier</p>
                </div>
                <a
                  href="/personeelsaanvraag"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                >
                  <Building2 className="h-3.5 w-3.5" /> Formulier bekijken
                </a>
              </div>

              {/* Search */}
              <div className="relative mb-4 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek op bedrijf, contactpersoon of e-mail…"
                  value={bedrijvenSearch}
                  onChange={e => setBedrijvenSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {staffingRequestsLoading ? (
                <div className="flex gap-3 flex-col">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
              ) : (() => {
                const q = bedrijvenSearch.toLowerCase();
                const filtered = staffingRequestsData.filter((r: any) =>
                  !q ||
                  (r.companyName || '').toLowerCase().includes(q) ||
                  (r.contactName || '').toLowerCase().includes(q) ||
                  (r.email || '').toLowerCase().includes(q)
                );

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-16 text-gray-400">
                      <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{bedrijvenSearch ? 'Geen resultaten gevonden' : 'Nog geen personeelsaanvragen ontvangen'}</p>
                    </div>
                  );
                }

                return (
                  <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            {['Datum', 'Bedrijf', 'Contactpersoon', 'E-mail', 'Telefoon', 'Plaats', 'Functies', 'Bericht'].map(h => (
                              <th key={h} className="px-3 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((r: any) => (
                            <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                              <td className="px-3 py-2.5 text-xs font-medium text-gray-800 whitespace-nowrap">{r.companyName || '—'}</td>
                              <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">{r.contactName || '—'}</td>
                              <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                                <a href={`mailto:${r.email}`} className="hover:text-purple-600">{r.email || '—'}</a>
                              </td>
                              <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                                {r.phone ? <a href={`tel:${r.phone}`} className="hover:text-purple-600">{r.phone}</a> : '—'}
                              </td>
                              <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{r.locationAddress || r.locationName || '—'}</td>
                              <td className="px-3 py-2.5 text-xs text-gray-700 max-w-[160px]">
                                {Array.isArray(r.functions) && r.functions.length > 0
                                  ? <span className="flex flex-wrap gap-1">
                                      {r.functions.map((f: string) => (
                                        <span key={f} className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium">{f}</span>
                                      ))}
                                    </span>
                                  : '—'
                                }
                              </td>
                              <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[200px] truncate" title={r.notes || ''}>
                                {r.notes || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent></Card>
                );
              })()}
            </div>
          ) : activeTab === 'blog' ? (
            /* ─── BLOG & SEO tab ─── */
            <div className="p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-600" /> Blog & SEO</h1>
                  <p className="text-sm text-gray-500">Beheer SEO-artikelen, plan publicaties en genereer content met AI</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    className="gap-1.5 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => { setBlogAiResult(null); setBlogAiTopic(''); setBlogAiKeyword(''); setBlogAiError(null); setBlogAiOpen(true); }}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> AI Genereren
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      setBlogEditPost(null);
                      setBlogForm({ title: '', slug: '', content: '', excerpt: '', metaTitle: '', metaDescription: '', focusKeyword: '', category: 'Blog', status: 'draft', author: 'EXTRA Redactie', readTime: '5 min', imageUrl: '', imageAlt: '', tags: [] });
                      setBlogEditOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Nieuw artikel
                  </Button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Totaal', value: blogPosts.length, color: 'text-gray-700', bg: 'bg-gray-50' },
                  { label: 'Gepubliceerd', value: blogPosts.filter((p: any) => p.status === 'published').length, color: 'text-green-700', bg: 'bg-green-50' },
                  { label: 'Ingepland', value: blogPosts.filter((p: any) => p.status === 'scheduled').length, color: 'text-amber-700', bg: 'bg-amber-50' },
                  { label: 'Concept', value: blogPosts.filter((p: any) => p.status === 'draft').length, color: 'text-gray-500', bg: 'bg-gray-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-gray-100`}>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Zoek op titel, keyword…"
                    value={blogSearch}
                    onChange={e => setBlogSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <select value={blogStatusFilter} onChange={e => setBlogStatusFilter(e.target.value)} className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                  <option value="alle">Alle statussen</option>
                  <option value="published">Gepubliceerd</option>
                  <option value="scheduled">Ingepland</option>
                  <option value="draft">Concept</option>
                </select>
                <select value={blogCategoryFilter} onChange={e => setBlogCategoryFilter(e.target.value)} className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                  <option value="alle">Alle categorieën</option>
                  <option value="Blog">Blog</option>
                  <option value="Nieuws">Nieuws</option>
                  <option value="Kennisbank">Kennisbank</option>
                </select>
                <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => refetchBlog()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Blog post table */}
              {blogLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (() => {
                const q = blogSearch.toLowerCase();
                const filtered = blogPosts.filter((p: any) =>
                  (blogStatusFilter === 'alle' || p.status === blogStatusFilter) &&
                  (blogCategoryFilter === 'alle' || p.category === blogCategoryFilter) &&
                  (!q || (p.title || '').toLowerCase().includes(q) || (p.focusKeyword || '').toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q))
                );

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-400 mb-4">{blogSearch ? 'Geen resultaten gevonden' : 'Nog geen artikelen. Maak je eerste blog aan!'}</p>
                      <Button size="sm" onClick={() => { setBlogEditPost(null); setBlogForm({ title: '', slug: '', content: '', excerpt: '', metaTitle: '', metaDescription: '', focusKeyword: '', category: 'Blog', status: 'draft', author: 'EXTRA Redactie', readTime: '5 min', imageUrl: '', imageAlt: '', tags: [] }); setBlogEditOpen(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Eerste artikel aanmaken
                      </Button>
                    </div>
                  );
                }

                const statusBadge = (status: string) => {
                  if (status === 'published') return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Gepubliceerd</span>;
                  if (status === 'scheduled') return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Ingepland</span>;
                  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Concept</span>;
                };

                return (
                  <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {['Titel', 'Categorie', 'Focus keyword', 'Status', 'Auteur', 'Datum', ''].map(h => (
                              <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((post: any) => (
                            <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-3 max-w-[280px]">
                                <div className="font-medium text-gray-900 truncate">{post.title}</div>
                                <div className="text-xs text-gray-400 truncate">/nieuws/{post.slug}</div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">{post.category}</span>
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-500 max-w-[150px]">
                                <span className="truncate block">{post.focusKeyword || '—'}</span>
                              </td>
                              <td className="px-3 py-3">{statusBadge(post.status)}</td>
                              <td className="px-3 py-3 text-xs text-gray-500">{post.author || '—'}</td>
                              <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">
                                {post.status === 'scheduled' && post.scheduledAt
                                  ? new Date(post.scheduledAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                  : post.publishedAt
                                    ? new Date(post.publishedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : new Date(post.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                                }
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                  {post.status === 'published' && (
                                    <a href={`/nieuws/${post.slug}`} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors" title="Bekijk artikel">
                                      <Eye className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => { setBlogPreviewPost(post); setBlogPreviewOpen(true); }}
                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors" title="Preview"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setBlogEditPost(post);
                                      setBlogForm({ ...post, scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0,16) : '' });
                                      setBlogEditOpen(true);
                                    }}
                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors" title="Bewerken"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  {post.status !== 'published' && (
                                    <button
                                      onClick={async () => {
                                        await apiRequest('POST', `/api/admin/blog/${post.id}/publish`, {});
                                        queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
                                        toast({ title: 'Artikel gepubliceerd!' });
                                      }}
                                      className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Nu publiceren"
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setBlogDeleteId(post.id)}
                                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Verwijderen"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent></Card>
                );
              })()}

              {/* SEO tips banner */}
              <div className="mt-5 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-purple-800 mb-1">SEO Strategie — Publicatieschema</p>
                    <p className="text-xs text-purple-600 mb-2">Publiceer 3× per week (maandag, woensdag, vrijdag om 08:00) voor maximale SEO-groei. Plan artikelen in met status "Ingepland" + een datum/tijd.</p>
                    <div className="flex flex-wrap gap-2">
                      {['horeca uitzendbureau amsterdam', 'horeca personeel', 'flexibel horeca personeel', 'evenementen personeel', 'hotel personeel'].map(kw => (
                        <span key={kw} className="text-xs bg-white text-purple-600 px-2 py-0.5 rounded-full border border-purple-200">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── AI Generate Modal ─── */}
              <Dialog open={blogAiOpen} onOpenChange={setBlogAiOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-600" /> AI Blog Generator</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!blogAiResult ? (
                      <>
                        <p className="text-sm text-gray-500">Geef een onderwerp op en de AI genereert een volledig SEO-geoptimaliseerd artikel in het Nederlands (900–1300 woorden) met interne links en structured data.</p>

                        {/* Basic settings */}
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Onderwerp *</label>
                            <input
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="bijv. Hoe vind je snel horeca personeel in Amsterdam"
                              value={blogAiTopic}
                              onChange={e => setBlogAiTopic(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-700 mb-1 block">Focus keyword (optioneel)</label>
                              <input
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="bijv. horeca personeel amsterdam"
                                value={blogAiKeyword}
                                onChange={e => setBlogAiKeyword(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-700 mb-1 block">Categorie</label>
                              <select
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                                value={blogAiCategory}
                                onChange={e => setBlogAiCategory(e.target.value)}
                              >
                                <option>Blog</option>
                                <option>Nieuws</option>
                                <option>Kennisbank</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Advanced section toggle */}
                        <button
                          type="button"
                          onClick={() => setBlogAiAdvancedOpen(o => !o)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-xl text-sm font-semibold text-purple-700 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            Extra context voor AI (optioneel)
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${blogAiAdvancedOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Advanced fields */}
                        {blogAiAdvancedOpen && (
                          <div className="space-y-4 p-4 border border-purple-100 rounded-xl bg-purple-50/30">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">Tone of voice</label>
                                <select
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                                  value={blogAiTone}
                                  onChange={e => setBlogAiTone(e.target.value)}
                                >
                                  <option>Informeel & energiek (EXTRA stijl)</option>
                                  <option>Zakelijk</option>
                                  <option>Informatief</option>
                                  <option>Conversiegericht</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1 block">Doelgroep</label>
                                <select
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                                  value={blogAiAudience}
                                  onChange={e => setBlogAiAudience(e.target.value)}
                                >
                                  <option>Horeca ondernemers</option>
                                  <option>HR managers</option>
                                  <option>Hotels</option>
                                  <option>Restaurants</option>
                                  <option>Cateraars</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-700 mb-1 block">Extra instructies voor de AI</label>
                              <textarea
                                rows={4}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                                placeholder={`Bijvoorbeeld:\n- Specifieke invalshoek of uniek standpunt\n- Doelgroep details\n- Interne informatie over EXTRA die mee moet\n- Onderwerpen die vermeden moeten worden`}
                                value={blogAiContext}
                                onChange={e => setBlogAiContext(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-700 mb-1 block">Referentie artikelen (optioneel)</label>
                              <textarea
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none font-mono text-xs"
                                placeholder="https://example.com/artikel-1&#10;https://example.com/artikel-2"
                                value={blogAiRefUrls}
                                onChange={e => setBlogAiRefUrls(e.target.value)}
                              />
                              <p className="text-xs text-gray-400 mt-1">De AI gebruikt de structuur en onderwerpen als inspiratie. Plak meerdere URLs op aparte regels.</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-700 mb-1 block">Interne links die verwerkt moeten worden</label>
                              <textarea
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none font-mono text-xs"
                                placeholder="/horeca-personeel-gezocht&#10;/horeca-uitzendbureau-amsterdam&#10;/hotelpersoneel-inhuren"
                                value={blogAiInternalLinks}
                                onChange={e => setBlogAiInternalLinks(e.target.value)}
                              />
                              <p className="text-xs text-gray-400 mt-1">De AI verwerkt deze links op een natuurlijke manier in het artikel.</p>
                            </div>
                          </div>
                        )}

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-xs text-amber-700">
                            <strong>Voorbeeldonderwerpen:</strong> "7 oplossingen voor personeelstekort in de horeca" · "Wat kost horeca personeel via een uitzendbureau" · "Waarom hotels werken met een flexpool" · "Hoe voorkom je no-shows van personeel"
                          </p>
                        </div>
                        {blogAiError && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                            {blogAiError.includes('AI module') ? (
                              <span>{blogAiError} Activeer de OpenAI integratie via de Replit console om AI-generatie in te schakelen.</span>
                            ) : blogAiError}
                          </div>
                        )}
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={!blogAiTopic.trim() || blogAiLoading}
                          onClick={async () => {
                            setBlogAiLoading(true);
                            setBlogAiError(null);
                            try {
                              const result = await apiRequest('POST', '/api/admin/blog/generate', {
                                topic: blogAiTopic,
                                focusKeyword: blogAiKeyword,
                                category: blogAiCategory,
                                extraContext: blogAiContext,
                                referenceUrls: blogAiRefUrls,
                                internalLinks: blogAiInternalLinks,
                                toneOfVoice: blogAiTone,
                                targetAudience: blogAiAudience,
                              });
                              setBlogAiResult(result);
                            } catch (err: any) {
                              setBlogAiError(err.message || 'Generatie mislukt');
                            } finally {
                              setBlogAiLoading(false);
                            }
                          }}
                        >
                          {blogAiLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Artikel genereren...</span> : <><Sparkles className="h-4 w-4 mr-1.5" /> Genereer artikel</>}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="text-sm text-green-800 font-medium">Artikel gegenereerd! Controleer en sla op als concept.</span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-500">Titel</label>
                            <div className="text-sm font-medium">{blogAiResult.title}</div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Meta description</label>
                            <div className="text-sm text-gray-600">{blogAiResult.metaDescription}</div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Samenvatting</label>
                            <div className="text-sm text-gray-600">{blogAiResult.excerpt}</div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Content preview (eerste 300 tekens)</label>
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 max-h-24 overflow-hidden">{blogAiResult.content?.replace(/<[^>]+>/g, ' ').slice(0, 300)}…</div>
                          </div>
                          {blogAiResult.suggestedInternalLinks?.length > 0 && (
                            <div>
                              <label className="text-xs text-gray-500">Aanbevolen interne links</label>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {blogAiResult.suggestedInternalLinks.map((link: string, i: number) => (
                                  <span key={i} className="inline-flex items-center gap-1 text-xs font-mono bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">
                                    <Link className="h-3 w-3" />{link}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 text-sm" onClick={() => setBlogAiResult(null)}>
                            Opnieuw genereren
                          </Button>
                          <Button
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-sm"
                            onClick={async () => {
                              setBlogSaving(true);
                              try {
                                await apiRequest('POST', '/api/admin/blog', { ...blogAiResult, status: 'draft' });
                                queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
                                setBlogAiOpen(false);
                                setBlogAiResult(null);
                                toast({ title: 'Artikel opgeslagen als concept!' });
                              } catch (err: any) {
                                toast({ title: 'Fout bij opslaan', variant: 'destructive' });
                              } finally {
                                setBlogSaving(false);
                              }
                            }}
                            disabled={blogSaving}
                          >
                            {blogSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Opslaan als concept'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* ─── Create / Edit Modal ─── */}
              <Dialog open={blogEditOpen} onOpenChange={setBlogEditOpen}>
                <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{blogEditPost ? 'Artikel bewerken' : 'Nieuw artikel'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Titel *</label>
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={blogForm.title || ''}
                          onChange={e => {
                            const title = e.target.value;
                            const slug = !blogEditPost ? title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 60) : blogForm.slug;
                            setBlogForm((f: any) => ({ ...f, title, slug }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Slug (URL)</label>
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                          value={blogForm.slug || ''}
                          onChange={e => setBlogForm((f: any) => ({ ...f, slug: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Focus keyword</label>
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          placeholder="bijv. horeca personeel amsterdam"
                          value={blogForm.focusKeyword || ''}
                          onChange={e => setBlogForm((f: any) => ({ ...f, focusKeyword: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Samenvatting (excerpt) *</label>
                        <textarea
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          rows={2}
                          placeholder="Korte samenvatting die zichtbaar is op de blogoverzichtspagina"
                          value={blogForm.excerpt || ''}
                          onChange={e => setBlogForm((f: any) => ({ ...f, excerpt: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Meta titel (55-65 tekens)</label>
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={blogForm.metaTitle || ''}
                          onChange={e => setBlogForm((f: any) => ({ ...f, metaTitle: e.target.value }))}
                        />
                        <span className={`text-xs ${(blogForm.metaTitle || '').length > 65 ? 'text-red-500' : 'text-gray-400'}`}>{(blogForm.metaTitle || '').length}/65 tekens</span>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Meta description (150-160 tekens)</label>
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={blogForm.metaDescription || ''}
                          onChange={e => setBlogForm((f: any) => ({ ...f, metaDescription: e.target.value }))}
                        />
                        <span className={`text-xs ${(blogForm.metaDescription || '').length > 160 ? 'text-red-500' : 'text-gray-400'}`}>{(blogForm.metaDescription || '').length}/160 tekens</span>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Categorie</label>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={blogForm.category || 'Blog'}
                          onChange={e => setBlogForm((f: any) => ({ ...f, category: e.target.value }))}
                        >
                          <option>Blog</option>
                          <option>Nieuws</option>
                          <option>Kennisbank</option>
                          <option>Hospitality</option>
                          <option>Events & Catering</option>
                          <option>Horeca</option>
                          <option>Housekeeping</option>
                          <option>EXTRA Nieuws</option>
                          <option>Branche</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={blogForm.status || 'draft'}
                          onChange={e => setBlogForm((f: any) => ({ ...f, status: e.target.value }))}
                        >
                          <option value="draft">Concept</option>
                          <option value="scheduled">Ingepland</option>
                          <option value="published">Gepubliceerd</option>
                        </select>
                      </div>
                      {blogForm.status === 'scheduled' && (
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-gray-700 mb-1 block">Publicatiedatum &amp; tijd</label>
                          <input
                            type="datetime-local"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                            value={blogForm.scheduledAt || ''}
                            onChange={e => setBlogForm((f: any) => ({ ...f, scheduledAt: e.target.value }))}
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Auteur</label>
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={blogForm.author || ''}
                          onChange={e => setBlogForm((f: any) => ({ ...f, author: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Leestijd</label>
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          placeholder="bijv. 5 min"
                          value={blogForm.readTime || ''}
                          onChange={e => setBlogForm((f: any) => ({ ...f, readTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Afbeelding URL</label>
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          placeholder="https://..."
                          value={blogForm.imageUrl || ''}
                          onChange={e => setBlogForm((f: any) => ({ ...f, imageUrl: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Afbeelding alt-tekst</label>
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          placeholder="bijv. horeca personeel bediening restaurant"
                          value={blogForm.imageAlt || ''}
                          onChange={e => setBlogForm((f: any) => ({ ...f, imageAlt: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Content (HTML) *</label>
                        <textarea
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                          rows={12}
                          placeholder="<h2>Introductie</h2><p>...</p>"
                          value={blogForm.content || ''}
                          onChange={e => setBlogForm((f: any) => ({ ...f, content: e.target.value }))}
                        />
                        <p className="text-xs text-gray-400 mt-1">Gebruik HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;blockquote&gt;, &lt;a href="..."&gt;</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setBlogEditOpen(false)}>Annuleren</Button>
                      <Button
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        disabled={blogSaving || !blogForm.title || !blogForm.slug || !blogForm.content || !blogForm.excerpt}
                        onClick={async () => {
                          setBlogSaving(true);
                          try {
                            const payload = {
                              ...blogForm,
                              scheduledAt: blogForm.scheduledAt ? new Date(blogForm.scheduledAt).toISOString() : null,
                              publishedAt: blogForm.status === 'published' && !blogForm.publishedAt ? new Date().toISOString() : blogForm.publishedAt || null,
                            };
                            if (blogEditPost) {
                              await apiRequest('PUT', `/api/admin/blog/${blogEditPost.id}`, payload);
                            } else {
                              await apiRequest('POST', '/api/admin/blog', payload);
                            }
                            queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
                            setBlogEditOpen(false);
                            toast({ title: blogEditPost ? 'Artikel bijgewerkt!' : 'Artikel aangemaakt!' });
                          } catch (err: any) {
                            toast({ title: 'Fout bij opslaan: ' + err.message, variant: 'destructive' });
                          } finally {
                            setBlogSaving(false);
                          }
                        }}
                      >
                        {blogSaving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Opslaan…</span> : blogEditPost ? 'Wijzigingen opslaan' : 'Artikel aanmaken'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* ─── Preview Modal ─── */}
              <Dialog open={blogPreviewOpen} onOpenChange={setBlogPreviewOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Eye className="h-4 w-4" /> Preview: {blogPreviewPost?.title}
                    </DialogTitle>
                  </DialogHeader>
                  {blogPreviewPost && (
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1">
                        <div className="text-xs text-gray-500">Meta titel: <span className="text-gray-700 font-medium">{blogPreviewPost.metaTitle || blogPreviewPost.title}</span></div>
                        <div className="text-xs text-gray-500">Meta description: <span className="text-gray-700">{blogPreviewPost.metaDescription || '—'}</span></div>
                        <div className="text-xs text-gray-500">Focus keyword: <span className="text-purple-600 font-medium">{blogPreviewPost.focusKeyword || '—'}</span></div>
                        <div className="text-xs text-gray-500">URL: <span className="text-blue-600 font-mono">/nieuws/{blogPreviewPost.slug}</span></div>
                      </div>
                      <div
                        className="blog-content text-sm leading-relaxed"
                        style={{ fontFamily: 'inherit' }}
                        dangerouslySetInnerHTML={{ __html: blogPreviewPost.content }}
                      />
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* ─── Delete Confirm ─── */}
              <Dialog open={blogDeleteId !== null} onOpenChange={() => setBlogDeleteId(null)}>
                <DialogContent className="max-w-sm">
                  <DialogHeader><DialogTitle>Artikel verwijderen?</DialogTitle></DialogHeader>
                  <p className="text-sm text-gray-500">Dit kan niet ongedaan worden gemaakt.</p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setBlogDeleteId(null)}>Annuleren</Button>
                    <Button
                      variant="destructive" className="flex-1"
                      onClick={async () => {
                        if (!blogDeleteId) return;
                        await apiRequest('DELETE', `/api/admin/blog/${blogDeleteId}`, undefined);
                        queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
                        setBlogDeleteId(null);
                        toast({ title: 'Artikel verwijderd' });
                      }}
                    >
                      Verwijderen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

          ) : activeTab === 'vacatures-cms' ? (
            /* ─── VACATURES & SEO tab ─── */
            <div className="p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-purple-600" /> Vacatures &amp; SEO</h1>
                  <p className="text-sm text-gray-500">Beheer vacatures, publiceer naar de website en optimaliseer voor zoekmachines</p>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    setVacancyEditPost(null);
                    setVacancyFormTab('basic');
                    setVacancyForm({
                      title: '', slug: '', internalTitle: '', functionType: 'Bediening', serviceType: 'Oproep',
                      location: 'Amsterdam', region: 'Amsterdam', workplace: 'Restaurant', client: '',
                      salaryMin: '', shortDescription: '', introductionText: '', aboutRole: '',
                      responsibilities: '', requirements: '', offer: '', workEnvironment: '',
                      faqItems: '', ctaText: 'Meld je aan en begin vandaag', focusKeyword: '',
                      metaTitle: '', metaDescription: '', canonicalUrl: '', ogTitle: '', ogDescription: '',
                      featuredImage: '', featuredImageAlt: '', status: 'draft',
                    });
                    setVacancyEditOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Nieuwe vacature
                </Button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Totaal', value: vacancyPosts.length, color: 'text-gray-700', bg: 'bg-gray-50' },
                  { label: 'Gepubliceerd', value: vacancyPosts.filter((p: any) => p.status === 'published').length, color: 'text-green-700', bg: 'bg-green-50' },
                  { label: 'Gepauzeerd', value: vacancyPosts.filter((p: any) => p.status === 'paused').length, color: 'text-amber-700', bg: 'bg-amber-50' },
                  { label: 'Concept', value: vacancyPosts.filter((p: any) => p.status === 'draft').length, color: 'text-gray-500', bg: 'bg-gray-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-gray-100`}>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Zoek op titel, keyword, locatie…"
                    value={vacancySearch}
                    onChange={e => setVacancySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <select value={vacancyStatusFilter} onChange={e => setVacancyStatusFilter(e.target.value)} className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                  <option value="alle">Alle statussen</option>
                  <option value="published">Gepubliceerd</option>
                  <option value="draft">Concept</option>
                  <option value="paused">Gepauzeerd</option>
                  <option value="archived">Gearchiveerd</option>
                </select>
                <select value={vacancyFunctionFilter} onChange={e => setVacancyFunctionFilter(e.target.value)} className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                  <option value="alle">Alle functies</option>
                  {['Bediening','Bartender','Chef','Banqueting','Housekeeping','Front office'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => refetchVacancy()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Table */}
              {vacancyLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (() => {
                const q = vacancySearch.toLowerCase();
                const filtered = vacancyPosts.filter((p: any) =>
                  (vacancyStatusFilter === 'alle' || p.status === vacancyStatusFilter) &&
                  (vacancyFunctionFilter === 'alle' || p.functionType === vacancyFunctionFilter) &&
                  (!q || (p.title || '').toLowerCase().includes(q) || (p.focusKeyword || '').toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q))
                );

                const statusBadge = (s: string) => {
                  if (s === 'published') return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Gepubliceerd</span>;
                  if (s === 'paused') return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Gepauzeerd</span>;
                  if (s === 'archived') return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-medium">Gearchiveerd</span>;
                  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Concept</span>;
                };

                const seoScore = (p: any) => {
                  let score = 0;
                  if (p.metaTitle) score += 20;
                  if (p.metaDescription) score += 20;
                  if (p.focusKeyword) score += 20;
                  if (p.shortDescription) score += 20;
                  if (p.responsibilities?.length > 0) score += 10;
                  if (p.faqItems) score += 10;
                  return score;
                };

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <Briefcase className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-400 mb-4">{vacancySearch ? 'Geen resultaten gevonden' : 'Nog geen vacatures. Maak je eerste vacature aan!'}</p>
                      <Button size="sm" onClick={() => { setVacancyEditPost(null); setVacancyFormTab('basic'); setVacancyForm({ title: '', slug: '', functionType: 'Bediening', serviceType: 'Oproep', location: 'Amsterdam', region: 'Amsterdam', workplace: 'Restaurant', client: '', salaryMin: '', shortDescription: '', status: 'draft', metaTitle: '', metaDescription: '', focusKeyword: '', responsibilities: '', requirements: '', offer: '', faqItems: '', ctaText: 'Meld je aan en begin vandaag', introductionText: '', aboutRole: '', workEnvironment: '', canonicalUrl: '', ogTitle: '', ogDescription: '', featuredImage: '', featuredImageAlt: '', internalTitle: '' }); setVacancyEditOpen(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Eerste vacature aanmaken
                      </Button>
                    </div>
                  );
                }

                return (
                  <Card><CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            {['Titel', 'Functie', 'Locatie', 'Type', 'SEO', 'Status', 'Datum', ''].map(h => (
                              <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((post: any) => {
                            const score = seoScore(post);
                            return (
                              <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-3 max-w-[220px]">
                                  <div className="font-medium text-gray-900 truncate text-xs">{post.title}</div>
                                  <div className="text-[11px] text-gray-400 truncate">/vacatures/{post.slug}</div>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">{post.functionType}</span>
                                </td>
                                <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{post.location}</span>
                                </td>
                                <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{post.serviceType}</td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${score}%` }} />
                                    </div>
                                    <span className="text-[11px] text-gray-400">{score}%</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3">{statusBadge(post.status)}</td>
                                <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">
                                  {post.publishedAt
                                    ? new Date(post.publishedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : new Date(post.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-1 justify-end">
                                    {post.status === 'published' && (
                                      <a href={`/vacatures/${post.slug}`} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors" title="Bekijk op website">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => {
                                        setVacancyEditPost(post);
                                        setVacancyFormTab('basic');
                                        setVacancyForm({
                                          ...post,
                                          responsibilities: (post.responsibilities || []).join('\n'),
                                          requirements: (post.requirements || []).join('\n'),
                                          offer: (post.offer || []).join('\n'),
                                        });
                                        setVacancyEditOpen(true);
                                      }}
                                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors" title="Bewerken"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    {post.status !== 'published' && (
                                      <button
                                        onClick={async () => {
                                          await apiRequest('POST', `/api/admin/vacatures/${post.id}/publish`, {});
                                          queryClient.invalidateQueries({ queryKey: ['/api/admin/vacatures'] });
                                          toast({ title: 'Vacature gepubliceerd!' });
                                        }}
                                        className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Publiceer"
                                      >
                                        <Send className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    {post.status === 'published' && (
                                      <button
                                        onClick={async () => {
                                          await apiRequest('POST', `/api/admin/vacatures/${post.id}/pause`, {});
                                          queryClient.invalidateQueries({ queryKey: ['/api/admin/vacatures'] });
                                          toast({ title: 'Vacature gepauzeerd' });
                                        }}
                                        className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors" title="Pauzeer"
                                      >
                                        <Pause className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={async () => {
                                        await apiRequest('POST', `/api/admin/vacatures/${post.id}/duplicate`, {});
                                        queryClient.invalidateQueries({ queryKey: ['/api/admin/vacatures'] });
                                        toast({ title: 'Vacature gedupliceerd als concept' });
                                      }}
                                      className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Dupliceer"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setVacancyDeleteId(post.id)}
                                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Verwijderen"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent></Card>
                );
              })()}

              {/* SEO tips */}
              <div className="mt-5 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-purple-800 mb-1">SEO Tips voor vacatures</p>
                    <ul className="text-xs text-purple-600 space-y-1">
                      <li>• Gebruik het format: "<strong>Functie</strong> vacature Amsterdam | Werken via EXTRA" als SEO-titel</li>
                      <li>• Verwerk functie + locatie in de eerste alinea van de introductie</li>
                      <li>• Voeg minimaal 5 verantwoordelijkheden en 5 eisen toe voor een hoge SEO-score</li>
                      <li>• Elke vacaturepagina linkt automatisch naar de bijpassende categoriepagina</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ─── Create/Edit Modal ─── */}
              <Dialog open={vacancyEditOpen} onOpenChange={setVacancyEditOpen}>
                <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{vacancyEditPost ? 'Vacature bewerken' : 'Nieuwe vacature aanmaken'}</DialogTitle>
                  </DialogHeader>

                  {/* Form tabs */}
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-5">
                    {(['basic','content','seo','publish'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setVacancyFormTab(tab)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${vacancyFormTab === tab ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {tab === 'basic' ? '1. Basisinfo' : tab === 'content' ? '2. Inhoud' : tab === 'seo' ? '3. SEO' : '4. Publiceren'}
                      </button>
                    ))}
                  </div>

                  {/* SEO score */}
                  {(() => {
                    const score = [
                      vacancyForm.metaTitle, vacancyForm.metaDescription, vacancyForm.focusKeyword,
                      vacancyForm.shortDescription, vacancyForm.responsibilities, vacancyForm.faqItems
                    ].filter(Boolean).length;
                    const pct = Math.round((score / 6) * 100);
                    return (
                      <div className="mb-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500 font-medium">SEO volledigheid</span>
                            <span className={`text-xs font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-4">
                    {/* TAB 1: Basic info */}
                    {vacancyFormTab === 'basic' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Vacaturetitel *</label>
                            <input
                              value={vacancyForm.title || ''}
                              onChange={e => {
                                const title = e.target.value;
                                const slug = !vacancyEditPost
                                  ? title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80)
                                  : vacancyForm.slug;
                                setVacancyForm((f: any) => ({ ...f, title, slug }));
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="bv. Chef Amsterdam – Zelfstandig werkend kok gezocht"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Interne naam</label>
                            <input
                              value={vacancyForm.internalTitle || ''}
                              onChange={e => setVacancyForm((f: any) => ({ ...f, internalTitle: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="bv. Chef Amsterdam Q2 2026"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">URL Slug *</label>
                            <input
                              value={vacancyForm.slug || ''}
                              onChange={e => setVacancyForm((f: any) => ({ ...f, slug: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="chef-amsterdam"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">/vacatures/{vacancyForm.slug || '…'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Functiecategorie *</label>
                            <select value={vacancyForm.functionType || 'Bediening'} onChange={e => setVacancyForm((f: any) => ({ ...f, functionType: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                              {['Bediening','Bartender','Chef','Banqueting','Housekeeping','Front office'].map(v => <option key={v}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Diensttype *</label>
                            <select value={vacancyForm.serviceType || 'Oproep'} onChange={e => setVacancyForm((f: any) => ({ ...f, serviceType: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                              {['Fulltime','Parttime','Bijbaan','Oproep'].map(v => <option key={v}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Locatie *</label>
                            <input
                              value={vacancyForm.location || ''}
                              onChange={e => setVacancyForm((f: any) => ({ ...f, location: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="Amsterdam"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Regio *</label>
                            <select value={vacancyForm.region || 'Amsterdam'} onChange={e => setVacancyForm((f: any) => ({ ...f, region: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                              {['Amsterdam','Utrecht','Het Gooi','Randstad'].map(v => <option key={v}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Werkplek</label>
                            <select value={vacancyForm.workplace || 'Restaurant'} onChange={e => setVacancyForm((f: any) => ({ ...f, workplace: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                              {['Hotel','Eventlocatie','Catering','Restaurant'].map(v => <option key={v}>{v}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Opdrachtgever / Klant</label>
                            <input
                              value={vacancyForm.client || ''}
                              onChange={e => setVacancyForm((f: any) => ({ ...f, client: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="bv. NH Hotels Amsterdam"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Minimumloon (p/u)</label>
                            <input
                              value={vacancyForm.salaryMin || ''}
                              onChange={e => setVacancyForm((f: any) => ({ ...f, salaryMin: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="bv. 14.00"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Korte omschrijving * <span className="font-normal text-gray-400">(voor kaartjes op overzichtspagina)</span></label>
                            <textarea
                              value={vacancyForm.shortDescription || ''}
                              onChange={e => setVacancyForm((f: any) => ({ ...f, shortDescription: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                              rows={2}
                              placeholder="Max. 160 tekens voor de kaart op /vacatures"
                            />
                            <p className="text-[11px] text-gray-400 mt-0.5">{(vacancyForm.shortDescription || '').length}/160</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Content */}
                    {vacancyFormTab === 'content' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Introductie alinea <span className="font-normal text-gray-400">(H1 + eerste alinea)</span></label>
                          <textarea
                            value={vacancyForm.introductionText || ''}
                            onChange={e => setVacancyForm((f: any) => ({ ...f, introductionText: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                            rows={3}
                            placeholder="Verwerk functietitel + locatie + uniek voordeel EXTRA in de eerste alinea"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Over de functie</label>
                          <textarea
                            value={vacancyForm.aboutRole || ''}
                            onChange={e => setVacancyForm((f: any) => ({ ...f, aboutRole: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                            rows={3}
                            placeholder="Beschrijf de rol en dagelijkse werkzaamheden"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Verantwoordelijkheden <span className="font-normal text-gray-400">(één per regel)</span></label>
                          <textarea
                            value={vacancyForm.responsibilities || ''}
                            onChange={e => setVacancyForm((f: any) => ({ ...f, responsibilities: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                            rows={5}
                            placeholder={"Gasten ontvangen en aan tafel begeleiden\nBestellingen opnemen en verwerken\nTafels opmaken en afruimen"}
                          />
                          <p className="text-[11px] text-gray-400 mt-0.5">Aantal: {(vacancyForm.responsibilities || '').split('\n').filter((l: string) => l.trim()).length}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Eisen <span className="font-normal text-gray-400">(één per regel)</span></label>
                          <textarea
                            value={vacancyForm.requirements || ''}
                            onChange={e => setVacancyForm((f: any) => ({ ...f, requirements: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                            rows={4}
                            placeholder={"Minimaal 17 jaar oud\nRepresentatief voorkomen\nFlexibel beschikbaar in avonden"}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Wat biedt EXTRA <span className="font-normal text-gray-400">(één per regel)</span></label>
                          <textarea
                            value={vacancyForm.offer || ''}
                            onChange={e => setVacancyForm((f: any) => ({ ...f, offer: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                            rows={4}
                            placeholder={"Dagbetaling mogelijk\nEXTRAATje beloningssysteem\nIedereen in loondienst bij EXTRA"}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Werkomgeving omschrijving</label>
                          <textarea
                            value={vacancyForm.workEnvironment || ''}
                            onChange={e => setVacancyForm((f: any) => ({ ...f, workEnvironment: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                            rows={2}
                            placeholder="Beschrijf de werkplek en sfeer"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">FAQ <span className="font-normal text-gray-400">(JSON: [{'{\"q\":\"...\",\"a\":\"...\"}'}])</span></label>
                          <textarea
                            value={vacancyForm.faqItems || ''}
                            onChange={e => setVacancyForm((f: any) => ({ ...f, faqItems: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none font-mono text-xs"
                            rows={4}
                            placeholder={'[{"q":"Hoe solliciteer ik?","a":"Via het aanmeldformulier op onze website."}]'}
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB 3: SEO */}
                    {vacancyFormTab === 'seo' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Focus keyword <span className="font-normal text-gray-400">— primair zoekwoord</span></label>
                          <input
                            value={vacancyForm.focusKeyword || ''}
                            onChange={e => setVacancyForm((f: any) => ({ ...f, focusKeyword: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="bv. chef vacature amsterdam"
                          />
                          <p className="text-[11px] text-gray-400 mt-0.5">Tip: gebruik een longtail keyword met functie + locatie</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">SEO-titel <span className="font-normal text-gray-400">— max. 60 tekens</span></label>
                          <input
                            value={vacancyForm.metaTitle || ''}
                            onChange={e => setVacancyForm((f: any) => ({ ...f, metaTitle: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="Chef vacature Amsterdam | Werken via EXTRA"
                          />
                          <p className={`text-[11px] mt-0.5 ${(vacancyForm.metaTitle || '').length > 60 ? 'text-red-500' : 'text-gray-400'}`}>{(vacancyForm.metaTitle || '').length}/60</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Meta description <span className="font-normal text-gray-400">— max. 155 tekens</span></label>
                          <textarea
                            value={vacancyForm.metaDescription || ''}
                            onChange={e => setVacancyForm((f: any) => ({ ...f, metaDescription: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                            rows={2}
                            placeholder="Bekijk deze vacature voor chef in Amsterdam. Werk via EXTRA bij culinaire restaurants met flexibele diensten en dagbetaling."
                          />
                          <p className={`text-[11px] mt-0.5 ${(vacancyForm.metaDescription || '').length > 155 ? 'text-red-500' : 'text-gray-400'}`}>{(vacancyForm.metaDescription || '').length}/155</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Canonical URL</label>
                            <input
                              value={vacancyForm.canonicalUrl || ''}
                              onChange={e => setVacancyForm((f: any) => ({ ...f, canonicalUrl: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="/vacatures/chef-amsterdam"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Featured image URL</label>
                            <input
                              value={vacancyForm.featuredImage || ''}
                              onChange={e => setVacancyForm((f: any) => ({ ...f, featuredImage: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">OG Titel</label>
                            <input
                              value={vacancyForm.ogTitle || ''}
                              onChange={e => setVacancyForm((f: any) => ({ ...f, ogTitle: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="Chef vacature Amsterdam"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 mb-1 block">OG Beschrijving</label>
                            <input
                              value={vacancyForm.ogDescription || ''}
                              onChange={e => setVacancyForm((f: any) => ({ ...f, ogDescription: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="Werk als chef in Amsterdam via EXTRA"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: Publish */}
                    {vacancyFormTab === 'publish' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-2 block">Status</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: 'draft', label: 'Concept', desc: 'Niet zichtbaar op website', color: 'border-gray-300' },
                              { value: 'published', label: 'Gepubliceerd', desc: 'Direct zichtbaar op /vacatures', color: 'border-green-400' },
                              { value: 'paused', label: 'Gepauzeerd', desc: 'Tijdelijk offline gehaald', color: 'border-amber-400' },
                              { value: 'archived', label: 'Gearchiveerd', desc: 'Permanente status', color: 'border-gray-300' },
                            ].map(opt => (
                              <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${vacancyForm.status === opt.value ? `${opt.color} bg-purple-50` : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                  type="radio"
                                  name="status"
                                  value={opt.value}
                                  checked={vacancyForm.status === opt.value}
                                  onChange={() => setVacancyForm((f: any) => ({ ...f, status: opt.value }))}
                                  className="mt-0.5"
                                />
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                                  <p className="text-xs text-gray-500">{opt.desc}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-xs font-semibold text-blue-700 mb-2">Automatische SEO-instellingen bij publicatie</p>
                          <ul className="text-xs text-blue-600 space-y-1">
                            <li>✓ JobPosting schema markup wordt automatisch gegenereerd</li>
                            <li>✓ Interne links naar categoriepagina worden automatisch toegevoegd</li>
                            <li>✓ Gerelateerde vacatures worden automatisch getoond</li>
                            <li>✓ Vacature verschijnt in /vacatures overzicht en sitemap</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-4 border-t mt-2">
                    <div className="flex gap-2">
                      {vacancyFormTab !== 'basic' && (
                        <Button variant="outline" size="sm" onClick={() => setVacancyFormTab(t => t === 'content' ? 'basic' : t === 'seo' ? 'content' : 'seo')}>
                          ← Vorige
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {vacancyFormTab !== 'publish' ? (
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setVacancyFormTab(t => t === 'basic' ? 'content' : t === 'content' ? 'seo' : 'publish')}>
                          Volgende →
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={vacancySaving}
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={async () => {
                            if (!vacancyForm.title || !vacancyForm.slug) {
                              toast({ title: 'Vul minimaal titel en slug in', variant: 'destructive' });
                              return;
                            }
                            setVacancySaving(true);
                            try {
                              const payload = {
                                ...vacancyForm,
                                responsibilities: vacancyForm.responsibilities
                                  ? vacancyForm.responsibilities.split('\n').map((l: string) => l.trim()).filter(Boolean)
                                  : [],
                                requirements: vacancyForm.requirements
                                  ? vacancyForm.requirements.split('\n').map((l: string) => l.trim()).filter(Boolean)
                                  : [],
                                offer: vacancyForm.offer
                                  ? vacancyForm.offer.split('\n').map((l: string) => l.trim()).filter(Boolean)
                                  : [],
                                publishedAt: vacancyForm.status === 'published' ? new Date().toISOString() : vacancyForm.publishedAt || null,
                              };
                              if (vacancyEditPost) {
                                await apiRequest('PUT', `/api/admin/vacatures/${vacancyEditPost.id}`, payload);
                                toast({ title: 'Vacature opgeslagen' });
                              } else {
                                await apiRequest('POST', '/api/admin/vacatures', payload);
                                toast({ title: 'Vacature aangemaakt' });
                              }
                              queryClient.invalidateQueries({ queryKey: ['/api/admin/vacatures'] });
                              setVacancyEditOpen(false);
                            } catch (err: any) {
                              toast({ title: 'Fout bij opslaan', description: err.message, variant: 'destructive' });
                            } finally {
                              setVacancySaving(false);
                            }
                          }}
                        >
                          {vacancySaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                          {vacancyEditPost ? 'Opslaan' : 'Aanmaken'}
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Delete confirmation */}
              <Dialog open={!!vacancyDeleteId} onOpenChange={() => setVacancyDeleteId(null)}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Vacature verwijderen?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-gray-500">Deze actie kan niet ongedaan worden gemaakt. De vacaturepagina wordt ook offline gehaald.</p>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setVacancyDeleteId(null)}>Annuleren</Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={async () => {
                        if (!vacancyDeleteId) return;
                        await apiRequest('DELETE', `/api/admin/vacatures/${vacancyDeleteId}`, {});
                        queryClient.invalidateQueries({ queryKey: ['/api/admin/vacatures'] });
                        toast({ title: 'Vacature verwijderd' });
                        setVacancyDeleteId(null);
                      }}
                    >
                      Verwijderen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

          ) : activeTab === 'stats' ? (
            /* ─── WEBSITE STATISTIEKEN tab ─── */
            <WebsiteStatsTab />

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
