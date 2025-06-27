import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, Target, Users, Share, 
  CheckCircle, Plus, Minus,
  Award, TrendingUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Challenge {
  id: number;
  title: string;
  description?: string;
  category?: string;
  type: 'eenmalig' | 'doorlopend';
  targetValue?: number;
  points?: number;
  status: string;
  steps?: ChallengeStep[];
}

interface ChallengeStep {
  id: number;
  challengeId: number;
  stepNumber: number;
  targetValue: number;
  pointsReward: number;
  title?: string;
  description?: string;
  isCompleted?: boolean;
}

interface UserChallengeProgress {
  id: number;
  userId: number;
  challengeId: number;
  currentStepId?: number;
  currentValue: number;
  completedSteps: number[];
  isCompleted: boolean;
  challenge?: Challenge;
}

interface UserChallengeProgressProps {
  userId: number;
}

const categoryIcons = {
  diensten: Trophy,
  "last-minute": Target,
  referrals: Users,
  social: Share,
} as const;

export default function UserChallengeProgress({ userId }: UserChallengeProgressProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updatingProgress, setUpdatingProgress] = useState<Record<number, boolean>>({});

  // Fetch user's challenge progress
  const { data: userProgress = [], isLoading } = useQuery<UserChallengeProgress[]>({
    queryKey: ["/api/users", userId, "challenges"],
  });

  // Fetch all available challenges
  const { data: allChallenges = [] } = useQuery<Challenge[]>({
    queryKey: ["/api/admin/challenges"],
  });

  // Complete a one-time challenge
  const completeChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      return apiRequest(`/api/admin/users/${userId}/challenges/${challengeId}/complete`, {
        method: "POST",
      });
    },
    onSuccess: (_, challengeId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "challenges"] });
      toast({
        title: "Challenge voltooid",
        description: "De challenge is succesvol als voltooid gemarkeerd.",
      });
      setUpdatingProgress(prev => ({ ...prev, [challengeId]: false }));
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij voltooien challenge",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
      setUpdatingProgress({});
    },
  });

  // Update progress for ongoing challenges
  const updateProgressMutation = useMutation({
    mutationFn: async ({ challengeId, newValue }: { challengeId: number; newValue: number }) => {
      return apiRequest(`/api/admin/users/${userId}/challenges/${challengeId}/progress`, {
        method: "PUT",
        body: JSON.stringify({ currentValue: newValue }),
      });
    },
    onSuccess: (_, { challengeId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "challenges"] });
      toast({
        title: "Voortgang bijgewerkt",
        description: "De challenge voortgang is succesvol bijgewerkt.",
      });
      setUpdatingProgress(prev => ({ ...prev, [challengeId]: false }));
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken voortgang",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
      setUpdatingProgress({});
    },
  });

  const handleCompleteChallenge = (challengeId: number) => {
    setUpdatingProgress(prev => ({ ...prev, [challengeId]: true }));
    completeChallengeMutation.mutate(challengeId);
  };

  const handleUpdateProgress = (challengeId: number, newValue: number) => {
    setUpdatingProgress(prev => ({ ...prev, [challengeId]: true }));
    updateProgressMutation.mutate({ challengeId, newValue });
  };

  const getUserProgressForChallenge = (challengeId: number) => {
    return userProgress.find(p => p.challengeId === challengeId);
  };

  const getChallengeById = (challengeId: number) => {
    return allChallenges.find(c => c.id === challengeId);
  };

  const getNextStep = (challenge: Challenge, currentValue: number) => {
    if (!challenge.steps) return null;
    return challenge.steps
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .find(step => currentValue < step.targetValue);
  };

  const getCompletedSteps = (challenge: Challenge, currentValue: number) => {
    if (!challenge.steps) return [];
    return challenge.steps
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .filter(step => currentValue >= step.targetValue);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Challenge Voortgang</h3>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Challenge Voortgang</h3>
          <p className="text-sm text-muted-foreground">
            Beheer de challenge voortgang van deze medewerker
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {allChallenges.map((challenge) => {
          const IconComponent = categoryIcons[challenge.category as keyof typeof categoryIcons] || Trophy;
          const userChallengeProgress = getUserProgressForChallenge(challenge.id);
          const currentValue = userChallengeProgress?.currentValue || 0;
          const isCompleted = userChallengeProgress?.isCompleted || false;
          const isUpdating = updatingProgress[challenge.id] || false;

          return (
            <Card key={challenge.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <Badge variant={challenge.type === "doorlopend" ? "default" : "secondary"}>
                      {challenge.type === "doorlopend" ? "Doorlopend" : "Eenmalig"}
                    </Badge>
                    {isCompleted && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Voltooid
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{challenge.title}</CardTitle>
                {challenge.description && (
                  <CardDescription>{challenge.description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {challenge.type === 'eenmalig' ? (
                  // One-time challenge
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">Doel:</span> {challenge.targetValue || 1}x
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Punten:</span> {challenge.points}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground">
                        Status: {currentValue >= (challenge.targetValue || 1) ? "Voltooid" : "In uitvoering"}
                      </div>
                      
                      {!isCompleted && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteChallenge(challenge.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Bezig..." : "Markeer als voltooid"}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Progressive challenge
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">Huidige voortgang:</span> {currentValue}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateProgress(challenge.id, Math.max(0, currentValue - 1))}
                          disabled={isUpdating || currentValue <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={currentValue}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            if (newValue !== currentValue) {
                              handleUpdateProgress(challenge.id, newValue);
                            }
                          }}
                          className="w-20 text-center"
                          min="0"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateProgress(challenge.id, currentValue + 1)}
                          disabled={isUpdating}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {challenge.steps && challenge.steps.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Stappen:</Label>
                        {challenge.steps
                          .sort((a, b) => a.stepNumber - b.stepNumber)
                          .map((step) => {
                            const isStepCompleted = currentValue >= step.targetValue;
                            const progress = Math.min((currentValue / step.targetValue) * 100, 100);
                            
                            return (
                              <div key={step.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      Stap {step.stepNumber}: {step.targetValue} {challenge.category}
                                    </span>
                                    {isStepCompleted && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {step.pointsReward} punten
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  <Progress value={progress} className="h-2" />
                                  <div className="text-xs text-muted-foreground">
                                    {currentValue}/{step.targetValue} ({Math.round(progress)}%)
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allChallenges.length === 0 && (
        <div className="text-center py-8">
          <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Geen challenges gevonden
          </h3>
          <p className="text-muted-foreground">
            Er zijn nog geen challenges aangemaakt in het systeem.
          </p>
        </div>
      )}
    </div>
  );
}