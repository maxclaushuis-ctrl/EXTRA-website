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
import { Plus, Edit, Trash2, Target, Zap, Users, Trophy, Clock, TrendingUp, Star, GraduationCap, Share2, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Challenge, ChallengeStep } from "@shared/schema";
import PlanworksSync from "@/components/admin/PlanworksSync";

const challengeFormSchema = z.object({
  title: z.string().min(2, { message: 'Titel moet minstens 2 tekens bevatten' }),
  description: z.string().min(10, { message: 'Beschrijving moet minstens 10 tekens bevatten' }),
  category: z.enum([
    'shifts', // Totaal aantal gedraaide diensten
    'overtime', // Overwerk uren
    'lastminute', // Last-minute diensten  
    'punctuality', // Stiptheid (op tijd komen)
    'availability', // Beschikbaarheid percentages
    'client_rating', // Klantbeoordelingen
    'training_completion', // Training voltooiing
    'referrals', // Vrienden werven
    'social_media', // Social media activiteit
    'special_events' // Speciale evenementen
  ]),
  type: z.enum(['eenmalig', 'doorlopend']),
  status: z.enum(['active', 'inactive']),
  autoSync: z.boolean().optional()
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
      case 'overtime': return <Clock className="h-4 w-4" />;
      case 'lastminute': return <Zap className="h-4 w-4" />;
      case 'punctuality': return <Clock className="h-4 w-4" />;
      case 'availability': return <TrendingUp className="h-4 w-4" />;
      case 'client_rating': return <Star className="h-4 w-4" />;
      case 'training_completion': return <GraduationCap className="h-4 w-4" />;
      case 'referrals': return <Users className="h-4 w-4" />;
      case 'social_media': return <Share2 className="h-4 w-4" />;
      case 'special_events': return <Calendar className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'shifts': return 'Diensten draaien';
      case 'overtime': return 'Overwerk uren';
      case 'lastminute': return 'Last-minute inzet';
      case 'punctuality': return 'Stiptheid';
      case 'availability': return 'Beschikbaarheid';
      case 'client_rating': return 'Klantbeoordelingen';
      case 'training_completion': return 'Training voltooiing';
      case 'referrals': return 'Vrienden werven';
      case 'social_media': return 'Social media';
      case 'special_events': return 'Speciale evenementen';
      default: return category;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'shifts': return 'Gebaseerd op totaal aantal gedraaide diensten uit Planworks';
      case 'overtime': return 'Gebaseerd op overwerk uren uit planning systeem';
      case 'lastminute': return 'Gebaseerd op last-minute ingevallen diensten';
      case 'punctuality': return 'Gebaseerd op stiptheid score uit Planworks';
      case 'availability': return 'Gebaseerd op beschikbaarheid percentage';
      case 'client_rating': return 'Gebaseerd op klantbeoordelingen uit systeem';
      case 'training_completion': return 'Gebaseerd op voltooide trainingen';
      case 'referrals': return 'Handmatig bijgehouden referrals';
      case 'social_media': return 'Handmatig bijgehouden social media activiteit';
      case 'special_events': return 'Handmatig bijgehouden speciale evenementen';
      default: return 'Challenge categorie';
    }
  };

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

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'shifts': return 'Automatisch gesynchroniseerd vanuit Planworks planning data';
      case 'overtime': return 'Gebaseerd op extra gewerkte uren uit Planworks';
      case 'lastminute': return 'Tracking van spoedinzet diensten uit Planworks';
      case 'punctuality': return 'Stiptheidsscore berekend uit Planworks check-in data';
      case 'availability': return 'Beschikbaarheidspercentage uit Planworks';
      case 'client_rating': return 'Gemiddelde klantbeoordelingen uit Planworks';
      case 'training_completion': return 'Voltooide trainingen uit Planworks systeem';
      case 'referrals': return 'Handmatig beheerd - nieuwe medewerkers aangebracht';
      case 'social_media': return 'Handmatig beheerd - social media activiteit';
      default: return 'Challenge categorie';
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

      {/* Planworks Integration Section */}
      <div className="mb-8">
        <PlanworksSync />
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
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline">
                  {getCategoryLabel(challenge.category)}
                </Badge>
                {isPlanworksCategory(challenge.category) && (
                  <Badge variant="secondary" className="text-xs">
                    🔗 Planworks
                  </Badge>
                )}
                <Badge variant={challenge.type === 'eenmalig' ? 'default' : 'secondary'} className="text-xs">
                  {challenge.type === 'eenmalig' ? 'Eenmalig' : 'Doorlopend'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {getCategoryDescription(challenge.category)}
              </p>
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
                        <optgroup label="🔗 Planworks Gekoppeld">
                          <SelectItem value="shifts">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Diensten draaien</div>
                                <div className="text-xs text-muted-foreground">Totaal aantal gedraaide diensten</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="overtime">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Overwerk uren</div>
                                <div className="text-xs text-muted-foreground">Extra gewerkte uren</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="lastminute">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Last-minute inzet</div>
                                <div className="text-xs text-muted-foreground">Spoedingevallen diensten</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="punctuality">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Stiptheid</div>
                                <div className="text-xs text-muted-foreground">Op tijd komen</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="availability">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Beschikbaarheid</div>
                                <div className="text-xs text-muted-foreground">Beschikbaarheid percentage</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="client_rating">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Klantbeoordelingen</div>
                                <div className="text-xs text-muted-foreground">Gemiddelde beoordeling</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="training_completion">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Training voltooiing</div>
                                <div className="text-xs text-muted-foreground">Voltooide trainingen</div>
                              </div>
                            </div>
                          </SelectItem>
                        </optgroup>
                        <optgroup label="✋ Handmatig Beheerd">
                          <SelectItem value="referrals">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Vrienden werven</div>
                                <div className="text-xs text-muted-foreground">Nieuwe medewerkers aanbrengen</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="social_media">
                            <div className="flex items-center gap-2">
                              <Share2 className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Social media</div>
                                <div className="text-xs text-muted-foreground">Social media activiteit</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="special_events">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <div>
                                <div className="font-medium">Speciale evenementen</div>
                                <div className="text-xs text-muted-foreground">Bijzondere activiteiten</div>
                              </div>
                            </div>
                          </SelectItem>
                        </optgroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <div className="text-sm text-muted-foreground mt-2">
                      💡 Planworks gekoppelde categorieën worden automatisch gesynchroniseerd
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challenge Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer challenge type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="eenmalig">
                          <div>
                            <div className="font-medium">Eenmalig</div>
                            <div className="text-xs text-muted-foreground">Challenge wordt eenmalig voltooid</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="doorlopend">
                          <div>
                            <div className="font-medium">Doorlopend</div>
                            <div className="text-xs text-muted-foreground">Challenge heeft meerdere stappen</div>
                          </div>
                        </SelectItem>
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