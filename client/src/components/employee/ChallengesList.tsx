import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Trophy, Target, Zap, Users, CheckCircle } from "lucide-react";
import type { UserChallengeProgress, Challenge, ChallengeStep } from "@shared/schema";

type UserChallengeProgressWithDetails = UserChallengeProgress & {
  challenge: Challenge;
  currentStep?: ChallengeStep;
  nextStep?: ChallengeStep;
};

export default function ChallengesList() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [completingStepId, setCompletingStepId] = useState<number | null>(null);

  const { data: userProgress, isLoading, error } = useQuery<UserChallengeProgressWithDetails[]>({
    queryKey: ["/api/user/challenges"],
    queryFn: async () => {
      const response = await fetch('/api/user/challenges', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }
  });

  // Remove the separate challenges query since userProgress includes challenge details

  const completeStepMutation = useMutation({
    mutationFn: async ({ challengeId, stepId }: { challengeId: number; stepId: number }) => {
      const response = await fetch(`/api/user/challenges/${challengeId}/complete-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stepId }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Er is iets misgegaan bij het voltooien van de challenge');
      }
      
      return await response.json();
    },
    onMutate: (variables) => {
      setCompletingStepId(variables.stepId);
    },
    onSuccess: (data) => {
      toast({
        title: 'Challenge stap voltooid! 🔥',
        description: `Je hebt ${data.pointsAwarded} punten verdiend!`,
      });
      
      // Invalidate relevante queries
      queryClient.invalidateQueries({ queryKey: ['/api/user/challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Challenge voltooien mislukt',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setCompletingStepId(null);
    }
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'shifts': return <Target className="h-5 w-5" />;
      case 'lastminute': return <Zap className="h-5 w-5" />;
      case 'referrals': return <Users className="h-5 w-5" />;
      case 'social': return <Trophy className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'shifts': return 'bg-blue-600';
      case 'lastminute': return 'bg-orange-600';
      case 'referrals': return 'bg-green-600';
      case 'social': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4 pb-16">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-none bg-gray-900 animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded mb-4 w-2/3"></div>
              <div className="h-2 bg-gray-700 rounded mb-3"></div>
              <div className="h-8 bg-gray-700 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('Challenge loading error:', error);
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Fout bij het laden van challenges</p>
        <p className="text-sm text-gray-400 mt-2">{error.message}</p>
      </div>
    );
  }

  // Use the user progress data which already includes challenge details
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-400">Challenges laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 pb-16">
      {userProgress?.map((progress) => {
        const { challenge, currentStep, nextStep } = progress;
        const isCompleted = progress.isCompleted;
        const currentValue = progress.currentValue;
        const activeStep = currentStep || nextStep;
        const targetValue = activeStep?.targetValue || 0;
        const progressPercentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
        
        return (
          <Card key={progress.challengeId} className="border-none bg-gray-900 text-white overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${getCategoryColor(challenge.category)} flex items-center justify-center`}>
                    {getCategoryIcon(challenge.category)}
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">{challenge.title}</h3>
                    <p className="text-gray-400 text-sm">{challenge.description}</p>
                  </div>
                </div>
                
                {isCompleted && (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                )}
              </div>

              {activeStep && (
                <>
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">
                        {activeStep.title}
                      </span>
                      <span className="text-sm text-gray-400">
                        {currentValue}/{activeStep.targetValue}
                      </span>
                    </div>
                    <Progress 
                      value={progressPercentage} 
                      className="h-2 bg-gray-700"
                    />
                  </div>

                  <p className="text-gray-400 text-sm mb-3">
                    {activeStep.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700">
                        {activeStep.pointsReward} punten
                      </Badge>
                      {activeStep.badgeTitle && (
                        <Badge variant="outline" className="bg-yellow-900 text-yellow-300 border-yellow-700">
                          {activeStep.badgeTitle}
                        </Badge>
                      )}
                    </div>
                    
                    {currentValue >= activeStep.targetValue && currentStep && !isCompleted && (
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => completeStepMutation.mutate({ 
                          challengeId: challenge.id, 
                          stepId: activeStep.id 
                        })}
                        disabled={completeStepMutation.isPending && completingStepId === activeStep.id}
                      >
                        {completeStepMutation.isPending && completingStepId === activeStep.id ? (
                          'Voltooien...'
                        ) : (
                          'Voltooien'
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}
              
              {isCompleted && (
                <div className="text-center py-4">
                  <p className="text-green-400 font-medium">Challenge voltooid! 🎉</p>
                  <p className="text-gray-400 text-sm">Je hebt alle stappen succesvol afgerond</p>
                </div>
              )}
              
              {!activeStep && !isCompleted && (
                <div className="text-center py-4">
                  <p className="text-gray-400">Challenge wordt binnenkort beschikbaar</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      {!userProgress || userProgress.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Geen challenges beschikbaar</p>
        </div>
      )}
    </div>
  );
}