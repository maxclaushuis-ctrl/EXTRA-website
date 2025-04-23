import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { 
  Users, Gift, BookOpen, Settings, 
  BarChart, ArrowUpRight, TrendingUp, 
  Activity, User
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: userStats, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/stats/users'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Kon statistieken niet ophalen');
      }
      return response.json();
    },
  });

  const dashboardItems = [
    {
      title: 'Medewerkers',
      description: 'Beheer medewerkers en hun punten',
      icon: <Users className="h-5 w-5" />,
      href: '/admin/employees',
      stats: usersLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{userStats?.totalUsers || 0}</span>
          <span className="text-sm text-muted-foreground">actieve medewerkers</span>
        </div>
      ),
    },
    {
      title: 'Beloningen',
      description: 'Voeg beloningen toe en beheer voorraad',
      icon: <Gift className="h-5 w-5" />,
      href: '/admin/rewards',
      stats: usersLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{userStats?.activeRewards || 0}</span>
          <span className="text-sm text-muted-foreground">actieve beloningen</span>
        </div>
      ),
    },
    {
      title: 'Regels',
      description: 'Stel regels in voor automatische beloning',
      icon: <BookOpen className="h-5 w-5" />,
      href: '/admin/rules',
      stats: usersLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{userStats?.activeRules || 0}</span>
          <span className="text-sm text-muted-foreground">actieve regels</span>
        </div>
      ),
    },
    {
      title: 'Instellingen',
      description: 'Configureer algemene systeeminstellingen',
      icon: <Settings className="h-5 w-5" />,
      href: '/admin/settings',
      stats: null,
    },
  ];

  const keyMetrics = [
    {
      title: 'Totaal Uitgegeven Punten',
      value: usersLoading ? <Skeleton className="h-8 w-20" /> : (userStats?.totalPointsAwarded || 0).toLocaleString(),
      icon: <BarChart className="h-4 w-4 text-blue-600" />,
      change: '+12%',
      changeDirection: 'up',
    },
    {
      title: 'Verzilverde Beloningen',
      value: usersLoading ? <Skeleton className="h-8 w-20" /> : (userStats?.totalRedemptions || 0).toLocaleString(),
      icon: <Gift className="h-4 w-4 text-purple-600" />,
      change: '+8%',
      changeDirection: 'up',
    },
    {
      title: 'Actieve Medewerkers',
      value: usersLoading ? <Skeleton className="h-8 w-20" /> : `${userStats?.activeUsersPercent || 0}%`,
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      change: '+5%',
      changeDirection: 'up',
    },
    {
      title: 'Betrokkenheid',
      value: usersLoading ? <Skeleton className="h-8 w-20" /> : `${userStats?.engagementRate || 0}%`,
      icon: <Activity className="h-4 w-4 text-yellow-600" />,
      change: '+2%',
      changeDirection: 'up',
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Beheer het beloningssysteem en bekijk statistieken
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <User className="mr-2 h-4 w-4" />
              Naar Gebruikersweergave
            </Link>
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {keyMetrics.map((metric, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                {metric.icon}
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <div className="flex items-center pt-1">
                  <span
                    className={`flex items-center text-xs ${
                      metric.changeDirection === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {metric.changeDirection === 'up' ? (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-3 w-3 rotate-180 transform" />
                    )}
                    {metric.change}
                  </span>
                  <span className="text-xs text-muted-foreground">sinds vorige maand</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main categories */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {dashboardItems.map((item, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                {item.icon}
                {item.title}
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {item.stats && (
                <div className="mb-4 mt-2">{item.stats}</div>
              )}
              <Button asChild className="mt-2 w-full">
                <Link href={item.href}>Beheren</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}