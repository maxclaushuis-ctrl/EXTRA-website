import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Challenges } from '@/components/admin/Challenges';
import AddRewardDialog from '@/components/AddRewardDialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trophy, Gift, Coins, Trash2, LogOut } from 'lucide-react';
import type { Reward, User } from '@shared/schema';

function AdminLoginScreen() {
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('admin@extra.nl');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.');
      } else if (result.userData && result.userData.role !== 'admin') {
        await logout();
        setError('Dit account heeft geen beheerdersrechten.');
      }
    } catch {
      setError('Er ging iets mis bij het inloggen. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">EXTRAATJE Beheer</h1>
          <p className="text-white/60 text-sm mt-2">Log in als beheerder</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">E-mailadres</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">Wachtwoord</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-2.5 transition-colors"
          >
            {submitting ? 'Bezig met inloggen...' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}

function PointsOverview() {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const employees = [...users]
    .filter((u) => u.role !== 'admin')
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

  if (isLoading) {
    return <p className="text-muted-foreground py-8 text-center">Punten laden...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-purple-600" />
          Punten per medewerker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <p className="text-muted-foreground text-sm">Er zijn nog geen medewerkers.</p>
        ) : (
          <div className="divide-y">
            {employees.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{u.firstName} {u.lastName}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant="secondary" className="text-base font-bold">
                  {(u.points ?? 0).toLocaleString('nl-NL')} ptn
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RewardsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: rewards = [], isLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/rewards/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      toast({ title: 'Beloning verwijderd' });
    },
    onError: () => {
      toast({ title: 'Verwijderen mislukt', variant: 'destructive' });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-600" />
          Beloningen
        </CardTitle>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Beloning toevoegen
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center">Beloningen laden...</p>
        ) : rewards.length === 0 ? (
          <p className="text-muted-foreground text-sm">Er zijn nog geen beloningen. Voeg er een toe.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rewards.map((r) => (
              <div key={r.id} className="border rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  {r.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{r.pointsCost.toLocaleString('nl-NL')} ptn</Badge>
                    <Badge variant={r.status === 'available' ? 'default' : 'outline'}>
                      {r.status === 'available' ? 'Beschikbaar' : r.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Beloning "${r.name}" verwijderen?`)) {
                      deleteMutation.mutate(r.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <AddRewardDialog isOpen={addOpen} onClose={() => setAddOpen(false)} />
    </Card>
  );
}

export default function ExtraatjeAdmin() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (!isLoading) setBootstrapped(true);
  }, [isLoading]);

  if (!bootstrapped) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-[#00AAFF]">Laden...</div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <AdminLoginScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold">EXTRAATJE Beheer</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-1" />
            Uitloggen
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="punten">
          <TabsList className="mb-6">
            <TabsTrigger value="punten">
              <Coins className="h-4 w-4 mr-1" />
              Punten
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Trophy className="h-4 w-4 mr-1" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="beloningen">
              <Gift className="h-4 w-4 mr-1" />
              Beloningen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="punten">
            <PointsOverview />
          </TabsContent>
          <TabsContent value="challenges">
            <Challenges />
          </TabsContent>
          <TabsContent value="beloningen">
            <RewardsManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
