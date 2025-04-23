import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Reward, User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, ArrowLeft, Gem } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function UserRewards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redemptionNote, setRedemptionNote] = useState('');

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

  const redeemMutation = useMutation({
    mutationFn: async ({
      rewardId,
      notes,
    }: {
      rewardId: number;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Gebruiker niet ingelogd');
      
      const selectedReward = rewards?.find(r => r.id === rewardId);
      if (!selectedReward) throw new Error('Beloning niet gevonden');
      
      const response = await apiRequest('/api/redemptions', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          rewardId,
          pointsCost: selectedReward.pointsCost,
          notes,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kon beloning niet inwisselen');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'redemptions'] });
      
      toast({
        title: 'Beloning ingewisseld!',
        description: 'Je beloning is succesvol ingewisseld',
      });
      
      setSelectedReward(null);
      setRedemptionNote('');
    },
    onError: (error) => {
      toast({
        title: 'Fout bij inwisselen',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRedeemReward = () => {
    if (!selectedReward) return;
    
    if (userData && userData.points < selectedReward.pointsCost) {
      toast({
        title: 'Niet genoeg punten',
        description: `Je hebt ${selectedReward.pointsCost - userData.points} punten tekort om deze beloning in te wisselen`,
        variant: 'destructive',
      });
      return;
    }
    
    redeemMutation.mutate({
      rewardId: selectedReward.id,
      notes: redemptionNote || undefined,
    });
  };

  const availableRewards = rewards?.filter(
    (reward) => 
      reward.status === 'available' && 
      (reward.stock === null || reward.stock > 0) &&
      (!searchQuery || 
        reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reward.description && reward.description.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  if (userLoading || rewardsLoading) {
    return <div className="p-4">Laden...</div>;
  }

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Beloningen</h1>
          <p className="text-muted-foreground">
            Wissel je punten in voor geweldige beloningen
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-semibold">Beschikbare Punten</h2>
            <div className="flex items-center space-x-2">
              <Gem className="h-6 w-6" />
              <span className="text-3xl font-bold">{userData?.points || 0}</span>
              <span className="text-lg">punten</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-blue-100">Deze maand verdiend:</div>
            <div className="text-2xl font-semibold">+120 punten</div>
          </div>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Beschikbare Beloningen</CardTitle>
          <CardDescription>
            Wissel je punten in voor één van deze geweldige beloningen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek beloningen..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {availableRewards?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-lg font-medium">Geen beloningen gevonden</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? `Geen resultaten voor "${searchQuery}"`
              : 'Er zijn momenteel geen beloningen beschikbaar'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableRewards?.map((reward) => (
            <Card key={reward.id} className="overflow-hidden">
              <div className="aspect-video w-full overflow-hidden bg-gray-100">
                {reward.imageUrl ? (
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                    Geen afbeelding
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle>{reward.name}</CardTitle>
                <CardDescription>
                  {reward.description || 'Geen beschrijving beschikbaar'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Gem className="mr-1 h-4 w-4 text-blue-600" />
                    <span className="text-lg font-bold text-blue-600">{reward.pointsCost}</span>
                    <span className="ml-1 text-sm text-muted-foreground">punten</span>
                  </div>
                  {reward.stock !== null && (
                    <Badge variant="outline">Nog {reward.stock} beschikbaar</Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Dialog
                  open={selectedReward?.id === reward.id}
                  onOpenChange={(open) => {
                    if (!open) setSelectedReward(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      onClick={() => setSelectedReward(reward)}
                      disabled={userData && userData.points < reward.pointsCost}
                    >
                      {userData && userData.points < reward.pointsCost
                        ? `Nog ${reward.pointsCost - userData.points} punten nodig`
                        : 'Inwisselen'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Beloning inwisselen</DialogTitle>
                      <DialogDescription>
                        Weet je zeker dat je deze beloning wilt inwisselen?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{reward.name}</span>
                        <div className="flex items-center">
                          <Gem className="mr-1 h-4 w-4 text-blue-600" />
                          <span className="font-bold text-blue-600">{reward.pointsCost}</span>
                          <span className="ml-1 text-sm text-muted-foreground">punten</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="notes">Opmerkingen (optioneel)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Eventuele opmerkingen of voorkeuren"
                          value={redemptionNote}
                          onChange={(e) => setRedemptionNote(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSelectedReward(null)}>
                        Annuleren
                      </Button>
                      <Button onClick={handleRedeemReward} disabled={redeemMutation.isPending}>
                        {redeemMutation.isPending ? 'Bezig met inwisselen...' : 'Bevestigen'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}