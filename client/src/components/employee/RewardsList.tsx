import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Reward } from '@shared/schema';
import { Loader2, ShoppingBag, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export function RewardsList() {
  const { user } = useAuth();
  const userPoints = user?.points || 0;
  const { toast } = useToast();
  const { t } = useLanguage();
  const [redeemingRewardId, setRedeemingRewardId] = useState<number | null>(null);

  const { data: rewards, isLoading, error } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
    queryFn: async () => {
      console.log('Beloningen ophalen voor gebruiker:', user?.id, user?.role);
      
      // We gebruiken hier een speciale header voor authenticatie omdat we problemen hebben
      // met sessie cookies. Dit is een tijdelijke oplossing tot we het sessieprobleem oplossen.
      const response = await fetch('/api/rewards', {
        credentials: 'include',
        headers: {
          'x-internal-auth': 'employee_access', // Speciale header die we hebben toegevoegd
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Beloningen ophalen response status:', response.status);
      
      if (!response.ok) {
        console.error('Fout bij ophalen beloningen:', response.status, response.statusText);
        const textError = await response.text(); 
        console.error('Error details:', textError);
        
        // Probeer nogmaals, maar nu met een directe fetch zonder cookies
        console.log('Proberen met directe fetch zonder credentials...');
        const retryResponse = await fetch('/api/rewards', {
          headers: {
            'x-internal-auth': 'employee_access'
          }
        });
        
        if (retryResponse.ok) {
          console.log('Succesvolle retry met directe fetch!');
          const data = await retryResponse.json();
          console.log('Beloningen succesvol opgehaald:', data.length, 'items');
          return data;
        }
        
        throw new Error(`Kon beloningen niet ophalen: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Beloningen succesvol opgehaald:', data.length, 'items');
      return data;
    },
    retry: 3,
    retryDelay: 1000
  });
  
  // Mutatie voor het inwisselen van een beloning
  const redeemMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      // Valideren of gebruiker is ingelogd
      if (!user || !user.id) {
        throw new Error('Je moet ingelogd zijn om beloningen in te wisselen');
      }
      
      const response = await fetch('/api/redemptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          rewardId: rewardId,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Er is iets misgegaan bij het inwisselen');
      }
      
      return await response.json();
    },
    onMutate: (rewardId) => {
      setRedeemingRewardId(rewardId);
    },
    onSuccess: (data, rewardId) => {
      // Gevonden beloning in de cache
      const reward = rewards?.find(r => r.id === rewardId);
      
      toast({
        title: 'Beloning ingewisseld!',
        description: `Je hebt ${reward?.name || 'een beloning'} ingewisseld voor ${reward?.pointsCost || '?'} punten`,
      });
      
      // Invalidate relevante queries om data te verversen
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'redemptions'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Inwisselen mislukt',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setRedeemingRewardId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-[#00AAFF]" />
      </div>
    );
  }

  // Als er een fout is opgetreden, toon die dan
  if (error) {
    console.error('Error in RewardsList component:', error);
    return (
      <div className="p-4 text-center text-red-500">
        Er is een fout opgetreden bij het laden van de beloningen: {error instanceof Error ? error.message : 'Onbekende fout'}
      </div>
    );
  }

  if (!rewards || rewards.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Geen beloningen beschikbaar op dit moment.
      </div>
    );
  }

  // Sorteer de beloningen op puntwaarde van laag naar hoog
  const sortedRewards = [...rewards]
    .filter(reward => reward.status === 'available')
    .sort((a, b) => a.pointsCost - b.pointsCost);

  return (
    <>
      <div className="space-y-4 pb-16">
        
        {sortedRewards.map((reward) => {
        const pointsNeeded = Math.max(0, reward.pointsCost - userPoints);
        const canRedeem = userPoints >= reward.pointsCost;
        
        return (
          <div key={reward.id} className="mb-4">
            <Link href={`/employee/rewards/${reward.id}`}>
              <div 
                className="bg-gray-900 border border-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:border-[#00AAFF] transition-colors relative"
                data-testid={`card-reward-${reward.id}`}
              >
              {/* Info icoon in rechterbovenhoek */}
              {reward.extraDescription && (
                <div className="absolute top-3 right-3 text-gray-400 hover:text-[#00AAFF]">
                  <Info className="h-5 w-5" />
                </div>
              )}
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Beloningsnaam */}
                    <div className="text-white text-lg font-medium">{reward.name}</div>
                    
                    {/* Afbeelding van beloning indien beschikbaar */}
                    {reward.imageUrl && (
                      <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img 
                          src={reward.imageUrl} 
                          alt={reward.name}
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    )}
                    
                    {/* Fallback icoon als er geen afbeelding is */}
                    {!reward.imageUrl && (
                      <div className="w-12 h-12 bg-gray-800 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-6 h-6 text-[#00AAFF]" />
                      </div>
                    )}
                  </div>
                  
                  {/* Beloningspunten */}
                  <div className="bg-[#00AAFF] text-white font-bold px-3 py-1 rounded-md inline-block">
                    {reward.pointsCost} {t('common.points')}
                  </div>
                </div>
              </div>
              
              {/* Korte beschrijving indien aanwezig */}
              {reward.description && (
                <div className="text-gray-400 text-sm mt-1">{reward.description}</div>
              )}
              
              {/* Progressbar en resterende punten */}
              <div className="mt-4">
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#00AAFF] h-full" 
                    style={{ width: `${Math.min(100, (userPoints / reward.pointsCost) * 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  {pointsNeeded > 0 ? (
                    <div className="text-gray-400 text-sm">
                      {t('common.pointsNeeded').replace('{amount}', pointsNeeded.toString())}
                    </div>
                  ) : (
                    <div className="text-green-400 text-sm">
                      {t('common.enoughPoints')}
                    </div>
                  )}
                  
                  {canRedeem && (
                    <button 
                      className="bg-[#00AAFF] text-white text-sm font-medium px-4 py-1 rounded-md"
                      disabled={redeemMutation.isPending && redeemingRewardId === reward.id}
                      onClick={(e) => {
                        e.stopPropagation(); // Stop event van bubbling naar card
                        // Bevestiging vragen voor het inwisselen
                        const confirmMsg = `${t('common.redeem')} ${reward.name} ${t('common.for')} ${reward.pointsCost} ${t('common.points')}?`;
                        if (window.confirm(confirmMsg)) {
                          redeemMutation.mutate(reward.id);
                        }
                      }}
                      data-testid={`button-redeem-${reward.id}`}
                    >
                      {redeemMutation.isPending && redeemingRewardId === reward.id ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 inline animate-spin" />
                          {t('common.redeeming')}
                        </>
                      ) : (
                        t('common.redeem')
                      )}
                    </button>
                  )}
                </div>
              </div>
              </div>
            </Link>
          </div>
        );
        })}
      </div>
    </>
  );
}

