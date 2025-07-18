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
  Award, TrendingUp, Zap, Clock, Star, GraduationCap, Calendar, Edit3
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
  shifts: Trophy,
  overtime: Zap,
  lastminute: Target,
  punctuality: Clock,
  availability: Calendar,
  client_rating: Star,
  training_completion: GraduationCap,
  referrals: Users,
  social_media: Share,
} as const;

const isPlanworksCategory = (category: string) => {
  return ['shifts', 'overtime', 'lastminute', 'punctuality', 'availability', 'client_rating', 'training_completion'].includes(category);
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'shifts': return 'Diensten';
    case 'overtime': return 'Overwerk';
    case 'lastminute': return 'Last-minute';
    case 'punctuality': return 'Stiptheid';
    case 'availability': return 'Beschikbaarheid';
    case 'client_rating': return 'Klantbeoordeling';
    case 'training_completion': return 'Training';
    case 'referrals': return 'Referrals';
    case 'social_media': return 'Social Media';
    default: return 'Overig';
  }
};

export default function UserChallengeProgress({ userId }: UserChallengeProgressProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updatingProgress, setUpdatingProgress] = useState<Record<number, boolean>>({});
  const [editingValues, setEditingValues] = useState<Record<number, number>>({});

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
      return apiRequest(`/api/admin/users/${userId}/challenges/${challengeId}/progress`, 'PUT', { currentValue: newValue });
    },
    onSuccess: (data, { challengeId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "challenges"] });
      toast({
        title: "Voortgang bijgewerkt",
        description: data.message || "De challenge voortgang is succesvol bijgewerkt.",
      });
      setUpdatingProgress(prev => ({ ...prev, [challengeId]: false }));
      setEditingValues(prev => ({ ...prev, [challengeId]: 0 }));
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

  const handleUpdateProgress = (challengeId: number, newValue: number) => {
    if (newValue < 0) return;
    
    setUpdatingProgress(prev => ({ ...prev, [challengeId]: true }));
    updateProgressMutation.mutate({ challengeId, newValue });
  };

  const handleCompleteChallenge = (challengeId: number) => {
    setUpdatingProgress(prev => ({ ...prev, [challengeId]: true }));
    completeChallengeMutation.mutate(challengeId);
  };

  const incrementProgress = (challengeId: number, currentValue: number) => {
    const newValue = currentValue + 1;
    handleUpdateProgress(challengeId, newValue);
  };

  const decrementProgress = (challengeId: number, currentValue: number) => {
    const newValue = Math.max(0, currentValue - 1);
    handleUpdateProgress(challengeId, newValue);
  };

  const updateProgressToValue = (challengeId: number, targetValue: number) => {
    const editValue = editingValues[challengeId];
    const newValue = editValue !== undefined ? editValue : targetValue;
    handleUpdateProgress(challengeId, newValue);
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
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(challenge.category)}
                    </Badge>
                    {isPlanworksCategory(challenge.category) && (
                      <Badge variant="secondary" className="text-xs">
                        🔗 Planworks
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium">
                    Huidige waarde: {currentValue}
                  </span>
                </div>

                {challenge.type === "doorlopend" && challenge.steps && (
                  <div className="space-y-3">
                    {challenge.steps
                      .sort((a, b) => a.stepNumber - b.stepNumber)
                      .map((step) => {
                        const isStepCompleted = currentValue >= step.targetValue;
                        const progress = Math.min((currentValue / step.targetValue) * 100, 100);
                        
                        return (
                          <div key={step.id} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                Stap {step.stepNumber}: {step.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${isStepCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                                  {currentValue}/{step.targetValue}
                                </span>
                                {isStepCompleted && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {step.description} • {step.pointsReward} punten
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Manual editing controls for non-Planworks challenges */}
                {!isPlanworksCategory(challenge.category) && (
                  <div className="space-y-3 mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Handmatig bijwerken:</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => decrementProgress(challenge.id, currentValue)}
                          disabled={isUpdating || currentValue <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          value={editingValues[challenge.id] !== undefined ? editingValues[challenge.id] : currentValue}
                          onChange={(e) => setEditingValues(prev => ({ 
                            ...prev, 
                            [challenge.id]: parseInt(e.target.value) || 0 
                          }))}
                          className="w-16 text-center"
                          disabled={isUpdating}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => incrementProgress(challenge.id, currentValue)}
                          disabled={isUpdating}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const newValue = editingValues[challenge.id];
                          if (newValue !== undefined && newValue !== currentValue) {
                            handleUpdateProgress(challenge.id, newValue);
                          }
                        }}
                        disabled={isUpdating || editingValues[challenge.id] === undefined || editingValues[challenge.id] === currentValue}
                        className="flex-1"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Update naar waarde
                      </Button>
                      
                      {challenge.type === "eenmalig" && !isCompleted && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleCompleteChallenge(challenge.id)}
                          disabled={isUpdating}
                          className="flex-1"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Markeer voltooid
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Info for Planworks challenges */}
                {isPlanworksCategory(challenge.category) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-800">Automatische synchronisatie</p>
                          <p className="text-blue-700 mt-1">
                            Deze challenge wordt automatisch bijgewerkt vanuit Planworks data. 
                            Gebruik de Planworks Sync functie bovenaan de pagina om handmatig te synchroniseren.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isUpdating && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Bezig met bijwerken...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {allChallenges.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Geen challenges beschikbaar
          </CardContent>
        </Card>
      )}
    </div>
  );
}