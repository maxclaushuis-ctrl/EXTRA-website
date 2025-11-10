import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Reward } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function RewardDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reward, isLoading } = useQuery<Reward>({
    queryKey: ['/api/rewards', id],
    queryFn: async () => {
      const response = await fetch(`/api/rewards/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Fout bij het ophalen van beloning');
      }
      return response.json();
    },
    enabled: !!id
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest('/api/redemptions', {
        method: 'POST',
        body: JSON.stringify({ rewardId }),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      toast({
        title: 'Beloning inwisselen gelukt!',
        description: 'Je beloning wordt zo snel mogelijk verwerkt',
      });
      setLocation('/rewards');
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij inwisselen',
        description: error.message || 'Er is iets misgegaan',
        variant: 'destructive'
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!reward) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Beloning niet gevonden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => setLocation('/rewards')}
        className="flex items-center gap-2"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar beloningen
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{reward.name}</CardTitle>
          <CardDescription className="text-lg">
            {reward.pointsCost} punten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reward.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={reward.imageUrl}
                alt={reward.name}
                className="w-full h-64 object-cover"
                data-testid="img-reward"
              />
            </div>
          )}

          {reward.description && (
            <div>
              <h3 className="font-semibold mb-2">Beschrijving</h3>
              <p className="text-muted-foreground">{reward.description}</p>
            </div>
          )}

          {reward.extraDescription && (
            <div>
              <h3 className="font-semibold mb-2">Meer informatie</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {reward.extraDescription}
              </p>
            </div>
          )}

          {reward.stock !== null && (
            <div>
              <h3 className="font-semibold mb-2">Voorraad</h3>
              <p className="text-muted-foreground">
                {reward.stock > 0 ? `${reward.stock} beschikbaar` : 'Uitverkocht'}
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={() => redeemMutation.mutate(reward.id)}
              disabled={redeemMutation.isPending || (reward.stock !== null && reward.stock <= 0)}
              className="w-full"
              size="lg"
              data-testid="button-redeem"
            >
              <Gift className="mr-2 h-5 w-5" />
              {redeemMutation.isPending ? 'Bezig met inwisselen...' : `Wissel in voor ${reward.pointsCost} punten`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
