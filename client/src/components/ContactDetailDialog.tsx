import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, insertUserSchema, userRoleEnum, userStatusEnum } from '@shared/schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import PointsCelebration from './PointsCelebration';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRound, Mail, Calendar, Phone, Building, Briefcase, Award, BarChart } from 'lucide-react';

// Uitgebreid formulier schema voor het bewerken van contacten
const formSchema = insertUserSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  birthDate: true,
  role: true,
  status: true,
});

type FormValues = z.infer<typeof formSchema>;

interface ContactDetailDialogProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactDetailDialog({ userId, isOpen, onClose }: ContactDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('profiel');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Kon gebruiker niet ophalen');
      }
      return response.json();
    },
    enabled: isOpen && userId !== null,
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/users', userId, 'transactions'],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/users/${userId}/transactions`);
      if (!response.ok) {
        throw new Error('Kon transacties niet ophalen');
      }
      return response.json();
    },
    enabled: isOpen && userId !== null,
  });

  const { data: redemptions, isLoading: isLoadingRedemptions } = useQuery({
    queryKey: ['/api/users', userId, 'redemptions'],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/users/${userId}/redemptions`);
      if (!response.ok) {
        throw new Error('Kon verzilveringen niet ophalen');
      }
      return response.json();
    },
    enabled: isOpen && userId !== null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      role: 'employee',
      status: 'active',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        birthDate: user.birthDate || '',
        role: user.role,
        status: user.status,
      });
    }
  }, [user, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!userId) return null;
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Contact kon niet worden bijgewerkt');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact bijgewerkt',
        description: 'De contactgegevens zijn succesvol bijgewerkt',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij bijwerken',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const pointsMutation = useMutation({
    mutationFn: async (points: number) => {
      if (!userId) return null;
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          points,
          type: 'earned',
          description: 'Handmatig toegekend',
          source: 'admin',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Punten konden niet worden toegekend');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Punten toegekend',
        description: 'De punten zijn succesvol toegekend aan de gebruiker',
      });
      // Invalideert alle belangrijke queries zodat de frontend overal wordt bijgewerkt
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] }); // Voor dashboard statistieken
      queryClient.invalidateQueries({ queryKey: ['/api/stats/users'] }); // Voor dashboard statistieken
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij toekennen punten',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Login versturen mutation
  const sendLoginMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return null;
      
      // Hier zal later de echte API-call komen voor het versturen van de inloggegevens
      // Voorlopig simuleren we een succesvolle verzending
      
      // Simuleer een API-aanroep met een korte timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Inloggegevens verstuurd',
        description: 'De inloggegevens zijn succesvol verstuurd naar de medewerker',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij verzenden',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data);
  };

  const handleAddPoints = () => {
    const points = prompt('Hoeveel punten wil je toekennen?');
    if (points) {
      const pointsNumber = parseInt(points, 10);
      if (!isNaN(pointsNumber) && pointsNumber > 0) {
        // Toon animatie voordat de punten worden toegekend
        setCelebrationPoints(pointsNumber);
        setShowCelebration(true);
        
        // Wacht even voordat we de API call doen om de animatie tijd te geven
        setTimeout(() => {
          pointsMutation.mutate(pointsNumber);
        }, 200);
      } else {
        toast({
          title: 'Ongeldige invoer',
          description: 'Vul een geldig positief getal in',
          variant: 'destructive',
        });
      }
    }
  };
  
  // Handler voor het versturen van inloggegevens
  const handleSendLogin = () => {
    if (user?.email) {
      if (confirm(`Weet je zeker dat je inloggegevens wilt versturen naar ${user.email}?`)) {
        sendLoginMutation.mutate();
      }
    } else {
      toast({
        title: 'E-mailadres ontbreekt',
        description: 'De gebruiker heeft geen geldig e-mailadres',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Contact details</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">Laden...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        {/* Points Celebration animatie */}
        <PointsCelebration 
          points={celebrationPoints} 
          isVisible={showCelebration} 
          onAnimationComplete={() => setShowCelebration(false)}
        />
        
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <div className="mr-2 h-10 w-10 overflow-hidden rounded-full bg-blue-100">
              <div className="flex h-full w-full items-center justify-center text-lg font-medium text-blue-600">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
            </div>
            <span>{user?.firstName} {user?.lastName}</span>
          </DialogTitle>
          <DialogDescription>
            Details en activiteiten van deze medewerker bekijken en bewerken
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="profiel" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profiel">
              <UserRound className="mr-2 h-4 w-4" />
              Profiel
            </TabsTrigger>
            <TabsTrigger value="punten">
              <Award className="mr-2 h-4 w-4" />
              Punten & Beloningen
            </TabsTrigger>
            <TabsTrigger value="activiteit">
              <BarChart className="mr-2 h-4 w-4" />
              Activiteit
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profiel" className="mt-4">
            {user && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voornaam</FormLabel>
                          <FormControl>
                            <Input placeholder="Voornaam" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Achternaam</FormLabel>
                          <FormControl>
                            <Input placeholder="Achternaam" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                            </span>
                            <Input placeholder="email@example.com" className="rounded-l-none" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefoonnummer (optioneel)</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                            </span>
                            <Input 
                              placeholder="+31 6 12345678" 
                              className="rounded-l-none" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geboortedatum (optioneel)</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                            </span>
                            <Input 
                              type="date"
                              placeholder="DD-MM-JJJJ" 
                              className="rounded-l-none" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Gebruikt voor verjaardagsautomatiseringen.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="employee" />
                                </FormControl>
                                <FormLabel className="font-normal">Medewerker</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="admin" />
                                </FormControl>
                                <FormLabel className="font-normal">Administrator</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
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
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="active" />
                                </FormControl>
                                <FormLabel className="font-normal">Actief</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="inactive" />
                                </FormControl>
                                <FormLabel className="font-normal">Inactief</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSendLogin}
                      disabled={sendLoginMutation.isPending}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {sendLoginMutation.isPending ? "Versturen..." : "Inlog versturen"}
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? "Opslaan..." : "Opslaan"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </TabsContent>
          
          <TabsContent value="punten" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Punten overzicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between border-b py-2">
                      <span className="text-sm font-medium">Huidige punten</span>
                      <span className="text-lg font-bold text-blue-600">{user?.points || 0}</span>
                    </div>
                    <div className="flex items-center justify-between border-b py-2">
                      <span className="text-sm font-medium">Totaal verdiend</span>
                      <span>{transactions?.filter(t => t.type === 'earned')?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0}</span>
                    </div>
                    <div className="flex items-center justify-between border-b py-2">
                      <span className="text-sm font-medium">Totaal verzilverd</span>
                      <span>{transactions?.filter(t => t.type === 'redeemed')?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium">Verzilverde beloningen</span>
                      <span>{redemptions?.length || 0}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Button 
                      className="w-full" 
                      variant="secondary"
                      onClick={handleAddPoints}
                      disabled={pointsMutation.isPending}
                    >
                      <Award className="mr-2 h-4 w-4" />
                      {pointsMutation.isPending ? "Toekennen..." : "Punten toekennen"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Recente beloningen</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingRedemptions ? (
                    <div className="flex justify-center py-8">Laden...</div>
                  ) : redemptions?.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      Nog geen beloningen verzilverd
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {redemptions?.slice(0, 5).map(redemption => (
                        <div key={redemption.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <div className="font-medium">{redemption.rewardName}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(redemption.createdAt).toLocaleDateString()} - {redemption.points} punten
                            </div>
                          </div>
                          <Badge
                            variant={
                              redemption.status === 'completed' ? 'default' :
                              redemption.status === 'processing' ? 'secondary' :
                              redemption.status === 'cancelled' ? 'destructive' : 'outline'
                            }
                          >
                            {redemption.status === 'completed' ? 'Voltooid' :
                             redemption.status === 'processing' ? 'In verwerking' :
                             redemption.status === 'cancelled' ? 'Geannuleerd' :
                             redemption.status === 'pending' ? 'In behandeling' : 'Onbekend'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="activiteit" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recente activiteiten</CardTitle>
                <CardDescription>Punten transacties en verzilveringen</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-8">Laden...</div>
                ) : transactions?.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Nog geen activiteiten
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions?.slice(0, 10).map(transaction => (
                      <div key={transaction.id} className="flex items-center gap-4 rounded-lg border p-3">
                        <div className={`rounded-full p-2 ${
                          transaction.type === 'earned' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {transaction.type === 'earned' ? (
                            <BarChart className="h-4 w-4" />
                          ) : (
                            <Award className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {transaction.description || (
                              transaction.type === 'earned' ? 'Punten verdiend' : 'Punten verzilverd'
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.type === 'earned' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {transaction.type === 'earned' ? '+' : '-'}{transaction.amount || 0} punten
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}