import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Reward, User } from '@shared/schema';
import { Gift, Gem, HistoryIcon, User as UserIcon } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users', user?.id], 
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/users/${user.id}`);
      if (!response.ok) {
        throw new Error('Kon gebruikersgegevens niet ophalen');
      }
      return response.json() as Promise<User>;
    },
    enabled: !!user?.id,
  });

  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['/api/rewards'],
    queryFn: async () => {
      const response = await fetch('/api/rewards');
      if (!response.ok) {
        throw new Error('Kon beloningen niet ophalen');
      }
      return response.json() as Promise<Reward[]>;
    },
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/users/${user.id}/transactions`);
      if (!response.ok) {
        throw new Error('Kon transacties niet ophalen');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (userLoading) {
    return <div className="p-4">Laden...</div>;
  }

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {userData?.role === 'admin' && (
          <Button asChild>
            <Link href="/admin">Admin Dashboard</Link>
          </Button>
        )}
      </div>

      <div className="mb-8">
        <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-md">
          <h2 className="mb-2 text-2xl font-semibold">Welkom, {userData?.firstName || 'Gebruiker'}!</h2>
          <div className="flex items-center space-x-2">
            <Gem className="h-6 w-6" />
            <span className="text-3xl font-bold">{userData?.points || 0}</span>
            <span className="text-lg">punten</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              <Link href="/profile" className="flex items-center space-x-2 text-blue-600 hover:underline">
                <UserIcon className="h-5 w-5" />
                <span>Mijn Profiel</span>
              </Link>
            </CardTitle>
            <CardDescription>Bekijk en beheer je profiel</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              <Link href="/rewards" className="flex items-center space-x-2 text-blue-600 hover:underline">
                <Gift className="h-5 w-5" />
                <span>Beloningen</span>
              </Link>
            </CardTitle>
            <CardDescription>Bekijk beloningen en wissel je punten in</CardDescription>
          </CardHeader>
          <CardContent>
            {rewardsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {rewards?.length} beschikbare beloningen
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              <Link href="/history" className="flex items-center space-x-2 text-blue-600 hover:underline">
                <HistoryIcon className="h-5 w-5" />
                <span>Geschiedenis</span>
              </Link>
            </CardTitle>
            <CardDescription>Bekijk je punten geschiedenis</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {transactions?.length || 0} recente transacties
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              <Link href="/leaderboard" className="flex items-center space-x-2 text-blue-600 hover:underline">
                <Trophy className="h-5 w-5" />
                <span>Leaderboard</span>
              </Link>
            </CardTitle>
            <CardDescription>Bekijk de top 10 medewerkers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Maandelijkse ranglijst met realtime updates
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}