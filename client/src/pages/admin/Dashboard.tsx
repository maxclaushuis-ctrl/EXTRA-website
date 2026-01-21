import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Gift, LayoutDashboard, Trophy, Tag, BarChart3, Mail, Receipt,
  RefreshCw, Settings2, TrendingUp, Clock, CheckCircle2, 
  FileDown, Bell, Star, Menu, MessageSquare
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
  profilePhotoUrl?: string;
};

type Transaction = {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  source?: string;
  createdAt: string;
  user?: User;
};

type Redemption = {
  id: number;
  userId: number;
  rewardId: number;
  status: string;
  createdAt: string;
  user?: User;
  reward?: { name: string; pointsCost: number };
};

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', active: true },
  { icon: Users, label: 'Gebruikers', href: '/admin', tab: 'contacten' },
  { icon: Trophy, label: 'Uitdagingen', href: '/admin', tab: 'challenges' },
  { icon: Gift, label: 'Beloningen', href: '/admin', tab: 'beloningen' },
  { icon: Tag, label: 'Kortingen', href: '/admin', tab: 'kortingsacties' },
  { icon: BarChart3, label: 'Klassement', href: '/admin', tab: 'ranglijst' },
  { icon: Mail, label: 'E-mailcampagnes', href: '/admin', tab: 'marketing' },
  { icon: Receipt, label: 'Transacties', href: '/admin', tab: 'transacties' },
];

function getFunctionBadgeColor(functionType: string): string {
  switch (functionType?.toLowerCase()) {
    case 'housekeeping': return 'bg-cyan-100 text-cyan-800';
    case 'horecamedewerker': return 'bg-orange-100 text-orange-800';
    case 'chef': return 'bg-gray-100 text-gray-800';
    case 'receptie':
    case 'front-office': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-600';
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [periodFilter, setPeriodFilter] = useState('deze-maand');
  const [functionFilter, setFunctionFilter] = useState('alle');

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

  const { data: redemptions = [] } = useQuery<Redemption[]>({
    queryKey: ['/api/admin/redemptions'],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: rewards = [] } = useQuery<{ id: number; name: string; pointsCost: number; timesRedeemed?: number }[]>({
    queryKey: ['/api/rewards'],
  });

  const updateRedemptionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/admin/redemptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/redemptions'] });
      toast({ title: "Status bijgewerkt" });
    }
  });

  const topUsers = [...allUsers]
    .filter(u => u.role !== 'admin')
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 10);

  const inactiveUsers = [...allUsers]
    .filter(u => u.role !== 'admin' && daysSince(u.lastLogin || '') > 14)
    .sort((a, b) => daysSince(b.lastLogin || '') - daysSince(a.lastLogin || ''))
    .slice(0, 5);

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending').slice(0, 5);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const topRewards = [...rewards]
    .sort((a, b) => (b.timesRedeemed || 0) - (a.timesRedeemed || 0))
    .slice(0, 5);

  const totalUsers = allUsers.filter(u => u.role !== 'admin').length;
  const activeUsers = allUsers.filter(u => u.role !== 'admin' && daysSince(u.lastLogin || '') <= 30).length;
  const totalPoints = stats?.totalPointsAwarded || 0;
  const userGrowth = stats?.changes?.activeUsersChange || '+0';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Menu className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-purple-600">EXTRAATJE</div>
              <div className="text-xs text-gray-500">Beheerdersdashboard</div>
            </div>
          </div>
        </div>

        <div className="p-2 text-xs text-gray-400 uppercase tracking-wider mt-4 px-4">Beheer</div>
        
        <nav className="flex-1 px-2">
          {sidebarItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <a
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  item.active 
                    ? 'bg-purple-100 text-purple-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Welkom terug!</h2>
                <p className="text-sm text-gray-500">Dit is wat er vandaag gebeurt</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">2</span>
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-purple-600 text-white">
                  {getInitials(user?.firstName || 'A', user?.lastName || 'D')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard Title & Filters */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-500">Overzicht van uw beloningsplatform voor medewerkers</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">📅 Periode:</span>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-[140px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deze-maand">Deze maand</SelectItem>
                    <SelectItem value="vorige-maand">Vorige maand</SelectItem>
                    <SelectItem value="dit-kwartaal">Dit kwartaal</SelectItem>
                    <SelectItem value="dit-jaar">Dit jaar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">🏢 Functie:</span>
                <Select value={functionFilter} onValueChange={setFunctionFilter}>
                  <SelectTrigger className="w-[160px] bg-white">
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
              <Button variant="outline" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Widgets beheren
              </Button>
              <Button className="gap-2 bg-green-500 hover:bg-green-600" onClick={() => refetchStats()}>
                <RefreshCw className="h-4 w-4" />
                Vernieuwen
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Totaal Gebruikers</p>
                    <p className="text-3xl font-bold mt-1">
                      {statsLoading ? <Skeleton className="h-9 w-16" /> : totalUsers}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Geregistreerde medewerkers</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Actieve Gebruikers</p>
                    <p className="text-3xl font-bold mt-1">
                      {usersLoading ? <Skeleton className="h-9 w-16" /> : activeUsers}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Minimaal 1 actie deze periode</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Uitgegeven Punten</p>
                    <p className="text-3xl font-bold mt-1">
                      {statsLoading ? <Skeleton className="h-9 w-20" /> : totalPoints.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">In geselecteerde periode</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Gebruikersgroei</p>
                    <p className="text-3xl font-bold mt-1 text-green-600">
                      {statsLoading ? <Skeleton className="h-9 w-16" /> : userGrowth}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Nieuwe gebruikers deze periode</p>
                  </div>
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Top Presteerders */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Presteerders
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Select defaultValue="dec-2025">
                    <SelectTrigger className="h-8 text-xs w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dec-2025">Dec 2025</SelectItem>
                      <SelectItem value="jan-2026">Jan 2026</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="alle">
                    <SelectTrigger className="h-8 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle functies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-400 mt-2">Top 10 op basis van verdiende punten</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3">
                    {topUsers.map((u, idx) => (
                      <div key={u.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                          idx === 2 ? 'bg-orange-300 text-orange-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.profilePhotoUrl} />
                          <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                            {getInitials(u.firstName, u.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">{u.functionType || 'Medewerker'}</p>
                        </div>
                        <div className="font-semibold text-sm">{(u.points || 0).toLocaleString()}</div>
                      </div>
                    ))}
                    {topUsers.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Geen gegevens beschikbaar</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Inactieve Gebruikers */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Inactieve Gebruikers
                  </CardTitle>
                  <Select defaultValue="30">
                    <SelectTrigger className="h-8 text-xs w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="14">14 dagen</SelectItem>
                      <SelectItem value="30">30 dagen</SelectItem>
                      <SelectItem value="60">60 dagen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-400 mt-2">Geen login of punten activiteit</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3">
                    {inactiveUsers.map((u) => (
                      <div key={u.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.profilePhotoUrl} />
                          <AvatarFallback className={`text-xs ${getFunctionBadgeColor(u.functionType || '')}`}>
                            {getInitials(u.firstName, u.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">{u.functionType || 'Medewerker'}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-red-50 text-red-600">
                          {daysSince(u.lastLogin || '')} dagen
                        </Badge>
                      </div>
                    ))}
                    {inactiveUsers.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Geen inactieve gebruikers</p>
                    )}
                  </div>
                </ScrollArea>
                <Button variant="outline" className="w-full mt-4 text-sm">
                  <FileDown className="h-4 w-4 mr-2" />
                  Exporteer lijst
                </Button>
              </CardContent>
            </Card>

            {/* Te doen */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Te doen
                    <Badge className="bg-green-100 text-green-700 ml-1">{pendingRedemptions.length}</Badge>
                  </CardTitle>
                </div>
                <p className="text-xs text-gray-400 mt-2">Beloningen en challenges die handmatige actie vereisen</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {pendingRedemptions.map((r) => (
                      <div key={r.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-medium text-sm">{r.reward?.name || 'Beloning'}</span>
                            <Badge className="ml-2 text-xs bg-orange-100 text-orange-700">Beloning</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          Beloning verzilverd - bestelling plaatsen
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                          Door: {r.user?.firstName} {r.user?.lastName} • {new Date(r.createdAt).toLocaleDateString('nl-NL')}
                        </p>
                        <Button 
                          size="sm" 
                          className="w-full bg-orange-400 hover:bg-orange-500 text-white"
                          onClick={() => updateRedemptionMutation.mutate({ id: r.id, status: 'completed' })}
                        >
                          Markeer als afgerond
                        </Button>
                      </div>
                    ))}
                    {pendingRedemptions.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Alles is afgehandeld!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meest Ingewisselde Beloningen */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gift className="h-5 w-5 text-purple-500" />
                    Meest Ingewisselde Beloningen
                  </CardTitle>
                  <Select defaultValue="alle">
                    <SelectTrigger className="h-8 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle categorieën</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topRewards.map((reward, idx) => (
                    <div key={reward.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Gift className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{reward.name}</p>
                        <p className="text-xs text-gray-400">{reward.pointsCost} punten</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{reward.timesRedeemed || 0}x</p>
                        <p className="text-xs text-gray-400">ingewisseld</p>
                      </div>
                    </div>
                  ))}
                  {topRewards.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Geen beloningen ingewisseld</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recente Activiteit */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Recente Activiteit
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 inline-block"></span>
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {recentTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          tx.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <TrendingUp className={`h-4 w-4 ${
                            tx.type === 'earned' ? 'text-green-600' : 'text-red-600 rotate-180'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{tx.description}</p>
                          <p className="text-xs text-gray-400">
                            {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : 'Gebruiker'} • {new Date(tx.createdAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Badge className={tx.type === 'earned' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {tx.type === 'earned' ? '+' : '-'}{Math.abs(tx.amount)}
                        </Badge>
                      </div>
                    ))}
                    {recentTransactions.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Geen recente activiteit</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
