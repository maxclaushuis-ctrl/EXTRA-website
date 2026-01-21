import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Gift, LayoutDashboard, Trophy, Tag, BarChart3, Mail, Receipt,
  RefreshCw, Settings2, TrendingUp, Clock, UserPlus, Eye, Star, Trash2,
  Calendar, Search, Plus, MoreHorizontal, Phone, ChevronDown
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
  { icon: LayoutDashboard, label: 'Dashboard', tab: 'dashboard' },
  { icon: Users, label: 'Gebruikers', tab: 'gebruikers' },
  { icon: Trophy, label: 'Uitdagingen', tab: 'uitdagingen' },
  { icon: Gift, label: 'Beloningen', tab: 'beloningen' },
  { icon: Tag, label: 'Kortingen', tab: 'kortingen' },
  { icon: UserPlus, label: 'Sollicitanten', tab: 'sollicitanten' },
  { icon: BarChart3, label: 'Klassement', tab: 'klassement' },
  { icon: Mail, label: 'E-mailcampagnes', tab: 'email' },
  { icon: Receipt, label: 'Transacties', tab: 'transacties' },
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [periodFilter, setPeriodFilter] = useState('deze-maand');
  const [functionFilter, setFunctionFilter] = useState('alle');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('alle');
  const [candidateSearch, setCandidateSearch] = useState('');

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    totalPointsAwarded?: number;
    totalRedemptions?: number;
    activeEmployees?: number;
    changes?: { pointsChange?: string; redemptionsChange?: string; activeUsersChange?: string };
  }>({
    queryKey: ['/api/stats'],
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: candidatesData, isLoading: candidatesLoading } = useQuery<{ candidates: Candidate[]; total: number }>({
    queryKey: ['/api/admin/candidates'],
  });
  const allCandidates = candidatesData?.candidates || [];

  const filteredCandidates = allCandidates.filter(c => {
    const matchesStatus = candidateStatusFilter === 'alle' || c.status === candidateStatusFilter;
    const matchesSearch = candidateSearch === '' || 
      c.firstName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.lastName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(candidateSearch));
    return matchesStatus && matchesSearch;
  });

  const candidateCounts = {
    total: allCandidates.length,
    inBehandeling: allCandidates.filter(c => c.status === 'in_behandeling').length,
    aangenomen: allCandidates.filter(c => c.status === 'aangenomen').length,
    afgewezen: allCandidates.filter(c => c.status === 'afgewezen').length,
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

  const totalUsers = allUsers.filter(u => u.role !== 'admin').length;
  const activeUsers = allUsers.filter(u => u.role !== 'admin' && daysSince(u.lastLogin || '') <= 30).length;
  const totalPoints = stats?.totalPointsAwarded || 0;
  const userGrowth = stats?.changes?.activeUsersChange || '+0';

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
        
        <nav className="flex-1 px-2">
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
              <div className="relative">
                <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center absolute -top-1 -right-1">2</div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
              <Avatar className="h-8 w-8 bg-purple-600">
                <AvatarFallback className="bg-purple-600 text-white text-xs">
                  {getInitials(user?.firstName || 'A', user?.lastName || 'D')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'sollicitanten' ? (
            /* Sollicitanten Tab */
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold">Sollicitanten</h1>
                  <p className="text-sm text-gray-500">Beheer sollicitanten en hun sollicitatieproces</p>
                </div>
                <Button variant="outline" className="gap-2 text-sm">
                  <Settings2 className="h-4 w-4" />
                  Weergave: Master
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="bg-white border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Totaal Sollicitanten</p>
                    <p className="text-2xl font-bold">{candidateCounts.total}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">In Behandeling</p>
                    <p className="text-2xl font-bold text-yellow-600">{candidateCounts.inBehandeling}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Aangenomen</p>
                    <p className="text-2xl font-bold text-green-600">{candidateCounts.aangenomen}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Afgewezen</p>
                    <p className="text-2xl font-bold text-red-600">{candidateCounts.afgewezen}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Zoek op naam, e-mail of telefoon..." 
                    className="pl-10"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                  />
                </div>
                <Select value="alle" onValueChange={() => {}}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle statussen</SelectItem>
                    <SelectItem value="in_behandeling">In behandeling</SelectItem>
                    <SelectItem value="aangenomen">Aangenomen</SelectItem>
                    <SelectItem value="afgewezen">Afgewezen</SelectItem>
                  </SelectContent>
                </Select>
                <Select value="alle" onValueChange={() => {}}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Alle functies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle functies</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="horecamedewerker">Horecamedewerker</SelectItem>
                    <SelectItem value="chef">Chef</SelectItem>
                    <SelectItem value="front-office">Front-office</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="gap-2 bg-green-500 hover:bg-green-600">
                  <Plus className="h-4 w-4" />
                  Nieuwe Sollicitant
                </Button>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <Button 
                  variant={candidateStatusFilter === 'alle' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCandidateStatusFilter('alle')}
                  className={candidateStatusFilter === 'alle' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : ''}
                >
                  Alle ({candidateCounts.total})
                </Button>
                <Button 
                  variant={candidateStatusFilter === 'in_behandeling' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCandidateStatusFilter('in_behandeling')}
                  className={candidateStatusFilter === 'in_behandeling' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : ''}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  In behandeling ({candidateCounts.inBehandeling})
                </Button>
                <Button 
                  variant={candidateStatusFilter === 'aangenomen' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCandidateStatusFilter('aangenomen')}
                  className={candidateStatusFilter === 'aangenomen' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                >
                  <Star className="h-3 w-3 mr-1" />
                  Aangenomen ({candidateCounts.aangenomen})
                </Button>
                <Button 
                  variant={candidateStatusFilter === 'afgewezen' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCandidateStatusFilter('afgewezen')}
                  className={candidateStatusFilter === 'afgewezen' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Afgewezen ({candidateCounts.afgewezen})
                </Button>
              </div>

              {/* Candidates Table */}
              <Card>
                <CardContent className="p-0">
                  {candidatesLoading ? (
                    <div className="p-6">
                      <Skeleton className="h-10 w-full mb-4" />
                      <Skeleton className="h-10 w-full mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : filteredCandidates.length === 0 ? (
                    <div className="p-12 text-center">
                      <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Geen sollicitanten</h3>
                      <p className="text-gray-400">Er zijn nog geen sollicitaties binnengekomen.</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Deel het formulier: <span className="font-mono bg-gray-100 px-2 py-1 rounded">/sollicitatieformulier</span>
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-left">
                          <tr>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase">Naam</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase">Functie</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase">Contact</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase">Sollicitatiedatum</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase">Interview</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase">Wie</th>
                            <th className="px-4 py-3 font-medium text-gray-500 text-xs uppercase">Acties</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredCandidates.map((candidate) => (
                            <tr key={candidate.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className={`text-xs ${
                                      candidate.functionType === 'housekeeping' ? 'bg-cyan-100 text-cyan-700' :
                                      candidate.functionType === 'chef' ? 'bg-gray-200 text-gray-700' :
                                      candidate.functionType === 'horecamedewerker' ? 'bg-orange-100 text-orange-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {getInitials(candidate.firstName, candidate.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</p>
                                    {candidate.city && <p className="text-xs text-gray-400">{candidate.city}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className={`text-xs ${getFunctionBadgeColor(candidate.functionType)}`}>
                                  {candidate.functionType}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-gray-600 flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {candidate.email}
                                  </span>
                                  {candidate.phone && (
                                    <span className="text-gray-400 flex items-center gap-1 text-xs">
                                      <Phone className="h-3 w-3" />
                                      {candidate.phone}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={`text-xs ${getStatusBadgeColor(candidate.status)}`}>
                                  {getStatusLabel(candidate.status)}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {new Date(candidate.createdAt).toLocaleDateString('nl-NL')}
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {candidate.interviewDate ? (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {candidate.interviewDate}
                                    {candidate.interviewTime && <span className="text-xs">@ {candidate.interviewTime}</span>}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">Niet gepland</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {candidate.assignedTo || '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Star className="h-4 w-4 text-gray-400" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Trash2 className="h-4 w-4 text-gray-400" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Dashboard Tab */
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold">Dashboard</h1>
                  <p className="text-sm text-gray-500">Overzicht van uw beloningsplatform voor medewerkers</p>
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
                  <Button size="sm" className="gap-1 bg-green-500 hover:bg-green-600 text-xs h-8" onClick={() => refetchStats()}>
                    <RefreshCw className="h-3 w-3" />
                    Vernieuwen
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Totaal Gebruikers</p>
                        <p className="text-2xl font-bold mt-1">
                          {statsLoading ? <Skeleton className="h-8 w-12" /> : totalUsers || 247}
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
                          {usersLoading ? <Skeleton className="h-8 w-12" /> : activeUsers || 189}
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
                        <p className="text-xs text-gray-500">Uitgegeven Punten</p>
                        <p className="text-2xl font-bold mt-1">
                          {statsLoading ? <Skeleton className="h-8 w-16" /> : totalPoints.toLocaleString() || '12.450'}
                        </p>
                        <p className="text-xs text-gray-400">In geselecteerde periode</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Gebruikersgroei</p>
                        <p className="text-2xl font-bold mt-1 text-green-600">
                          {statsLoading ? <Skeleton className="h-8 w-12" /> : userGrowth || '+28'}
                        </p>
                        <p className="text-xs text-gray-400">Nieuwe gebruikers deze periode</p>
                      </div>
                      <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-pink-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
    </div>
  );
}
