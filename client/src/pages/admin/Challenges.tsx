import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { Plus, Edit, Trash2, Target, Zap, Users, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Challenge, ChallengeStep } from "@shared/schema";

const challengeFormSchema = z.object({
  title: z.string().min(2, { message: 'Titel moet minstens 2 tekens bevatten' }),
  description: z.string().min(10, { message: 'Beschrijving moet minstens 10 tekens bevatten' }),
  category: z.enum(['shifts', 'lastminute', 'referrals', 'other']),
  status: z.enum(['active', 'inactive'])
});

const stepFormSchema = z.object({
  stepNumber: z.number().min(1),
  title: z.string().min(2, { message: 'Titel moet minstens 2 tekens bevatten' }),
  description: z.string().min(10, { message: 'Beschrijving moet minstens 10 tekens bevatten' }),
  targetValue: z.number().min(1, { message: 'Doelwaarde moet minstens 1 zijn' }),
  pointsReward: z.number().min(1, { message: 'Puntenbeloning moet minstens 1 zijn' }),
  badgeTitle: z.string().optional()
});

type FormData = z.infer<typeof challengeFormSchema>;
type StepFormData = z.infer<typeof stepFormSchema>;

type ChallengeWithSteps = Challenge & { steps?: ChallengeStep[] };

export function Challenges() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);

  // Query: Alle challenges ophalen
  const { data: challenges, isLoading, error } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges']
  });

  // Query: Challenge steps ophalen
  const { data: challengeSteps } = useQuery<ChallengeStep[]>({
    queryKey: ['/api/challenges', selectedChallengeId, 'steps'],
    enabled: !!selectedChallengeId,
    queryFn: async () => {
      const response = await fetch(`/api/challenges/${selectedChallengeId}/steps`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch steps');
      return response.json();
    }
  });

  // Form initialiseren
  const form = useForm<FormData>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'shifts',
      status: 'active'
    },
  });

  const stepForm = useForm<StepFormData>({
    resolver: zodResolver(stepFormSchema),
    defaultValues: {
      stepNumber: 1,
      title: '',
      description: '',
      targetValue: 1,
      pointsReward: 100,
      badgeTitle: ''
    },
  });

  // Mutation: Nieuwe challenge maken
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('/api/challenges', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'Challenge aangemaakt',
        description: 'De nieuwe challenge is succesvol aangemaakt.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      setIsEditModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij aanmaken',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation: Challenge bijwerken
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      return await apiRequest(`/api/challenges/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: 'Challenge bijgewerkt',
        description: 'De challenge is succesvol bijgewerkt.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      setIsEditModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij bijwerken',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation: Challenge verwijderen
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/challenges/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Challenge verwijderd',
        description: 'De challenge is succesvol verwijderd.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij verwijderen',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation: Challenge step maken
  const createStepMutation = useMutation({
    mutationFn: async (data: StepFormData) => {
      return await apiRequest(`/api/challenges/${selectedChallengeId}/steps`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'Challenge stap aangemaakt',
        description: 'De nieuwe challenge stap is succesvol aangemaakt.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges', selectedChallengeId, 'steps'] });
      setIsStepModalOpen(false);
      stepForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij aanmaken stap',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Behandel formulier indiening
  const onSubmit = (data: FormData) => {
    if (currentChallenge) {
      updateMutation.mutate({ id: currentChallenge.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const onStepSubmit = (data: StepFormData) => {
    createStepMutation.mutate(data);
  };

  // Open bewerk modal
  const openEditModal = (challenge?: Challenge) => {
    if (challenge) {
      setCurrentChallenge(challenge);
      form.reset({
        title: challenge.title,
        description: challenge.description,
        category: challenge.category as FormData['category'],
        status: challenge.status as FormData['status'],
      });
    } else {
      setCurrentChallenge(null);
      form.reset({
        title: '',
        description: '',
        category: 'shifts',
        status: 'active'
      });
    }
    setIsEditModalOpen(true);
  };

  const openStepModal = (challengeId: number) => {
    setSelectedChallengeId(challengeId);
    const existingSteps = challengeSteps?.length || 0;
    stepForm.reset({
      stepNumber: existingSteps + 1,
      title: '',
      description: '',
      targetValue: 1,
      pointsReward: 100,
      badgeTitle: ''
    });
    setIsStepModalOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'shifts': return <Target className="h-4 w-4" />;
      case 'lastminute': return <Zap className="h-4 w-4" />;
      case 'referrals': return <Users className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'shifts': return 'Diensten';
      case 'lastminute': return 'Last-minute';
      case 'referrals': return 'Referrals';
      default: return 'Overig';
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-6">Challenges laden...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-6 text-red-500">Fout bij laden van challenges</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Challenges beheren</h1>
        <Button onClick={() => openEditModal()}>
          <Plus className="mr-2 h-4 w-4" /> Nieuwe challenge
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges?.map((challenge) => (
          <Card key={challenge.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(challenge.category)}
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                </div>
                <Badge variant={challenge.status === 'active' ? 'default' : 'secondary'}>
                  {challenge.status === 'active' ? 'Actief' : 'Inactief'}
                </Badge>
              </div>
              <CardDescription>{challenge.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">
                  {getCategoryLabel(challenge.category)}
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => openStepModal(challenge.id)}
                className="w-full"
              >
                Stappen beheren
              </Button>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(challenge)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(challenge.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Challenge Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentChallenge ? 'Challenge bewerken' : 'Nieuwe challenge'}
            </DialogTitle>
            <DialogDescription>
              {currentChallenge
                ? 'Bewerk de gegevens van deze challenge.'
                : 'Voeg een nieuwe challenge toe.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel</FormLabel>
                    <FormControl>
                      <Input placeholder="Challenge titel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Challenge beschrijving" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een categorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="shifts">Diensten</SelectItem>
                        <SelectItem value="lastminute">Last-minute</SelectItem>
                        <SelectItem value="referrals">Referrals</SelectItem>
                        <SelectItem value="other">Overig</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Actief</SelectItem>
                        <SelectItem value="inactive">Inactief</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    'Bezig met opslaan...'
                  ) : currentChallenge ? (
                    'Bijwerken'
                  ) : (
                    'Aanmaken'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Step Modal */}
      <Dialog open={isStepModalOpen} onOpenChange={setIsStepModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Challenge stap toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe stap toe aan deze challenge.
            </DialogDescription>
          </DialogHeader>
          <Form {...stepForm}>
            <form onSubmit={stepForm.handleSubmit(onStepSubmit)} className="space-y-4">
              <FormField
                control={stepForm.control}
                name="stepNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stap nummer</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stepForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel</FormLabel>
                    <FormControl>
                      <Input placeholder="Stap titel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stepForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Stap beschrijving" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stepForm.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doelwaarde</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stepForm.control}
                name="pointsReward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puntenbeloning</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stepForm.control}
                name="badgeTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge titel (optioneel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Badge naam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStepModalOpen(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit" disabled={createStepMutation.isPending}>
                  {createStepMutation.isPending ? 'Bezig met opslaan...' : 'Stap toevoegen'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Challenges;