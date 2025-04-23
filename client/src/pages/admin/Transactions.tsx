import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  ArrowDown, 
  ArrowUp, 
  CalendarIcon, 
  Download, 
  Filter, 
  Gift, 
  Plus, 
  SearchIcon, 
  User,
  Check,
  Clock,
  Truck,
  XCircle,
  PackageOpen,
  Building2,
  MoreVertical,
  Zap,
  Star,
  Calendar,
  Percent,
  Settings2,
  X,
  Save,
  Award,
  CalculatorIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PointTransaction, Redemption, Rule, insertRuleSchema } from '@shared/schema';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('points');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Rule form schema
  const ruleFormSchema = insertRuleSchema.extend({
    pointsValue: z.coerce.number().min(1, {
      message: "Waarde moet minimaal 1 zijn",
    }),
    source: z.string().default("score"),
  });
  
  type RuleFormValues = z.infer<typeof ruleFormSchema>;

  // Fetch all point transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Kon transacties niet ophalen');
      }
      return response.json() as Promise<PointTransaction[]>;
    },
  });

  // Fetch all redemptions (reward transactions)
  const { data: redemptions, isLoading: redemptionsLoading } = useQuery({
    queryKey: ['/api/redemptions'],
    queryFn: async () => {
      const response = await fetch('/api/redemptions');
      if (!response.ok) {
        throw new Error('Kon verzilveringen niet ophalen');
      }
      return response.json() as Promise<Redemption[]>;
    },
  });

  // Fetch all users for reference
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Kon gebruikers niet ophalen');
      }
      return response.json();
    },
  });

  // Fetch all rewards for reference
  const { data: rewards } = useQuery({
    queryKey: ['/api/rewards'],
    queryFn: async () => {
      const response = await fetch('/api/rewards');
      if (!response.ok) {
        throw new Error('Kon beloningen niet ophalen');
      }
      return response.json();
    },
  });
  
  // Fetch all rules
  const { data: rules, isLoading: rulesLoading, refetch: refetchRules } = useQuery({
    queryKey: ['/api/rules'],
    queryFn: async () => {
      const response = await fetch('/api/rules');
      if (!response.ok) {
        throw new Error('Kon regels niet ophalen');
      }
      return response.json() as Promise<Rule[]>;
    },
  });

  // Filter transactions based on search query
  const filteredTransactions = transactions?.filter(transaction => {
    if (!searchQuery) return true;
    
    const user = users?.find((u: { id: number }) => u.id === transaction.userId);
    if (!user) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      transaction.description.toLowerCase().includes(searchLower)
    );
  });

  // Filter redemptions based on search query
  const filteredRedemptions = redemptions?.filter(redemption => {
    if (!searchQuery) return true;
    
    const user = users?.find((u: { id: number }) => u.id === redemption.userId);
    const reward = rewards?.find((r: { id: number }) => r.id === redemption.rewardId);
    if (!user || !reward) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      reward.name.toLowerCase().includes(searchLower) ||
      redemption.status.toLowerCase().includes(searchLower)
    );
  });

  // Get user info by ID
  const getUserInfo = (userId: number) => {
    const user = users?.find((u: { 
      id: number; 
      firstName: string; 
      lastName: string;
      email: string;
    }) => u.id === userId);
    
    return { 
      name: user ? `${user.firstName} ${user.lastName}` : 'Onbekende gebruiker',
      email: user?.email || 'onbekend@example.com',
      initials: user ? (user.firstName[0] + user.lastName[0]).toUpperCase() : '??'
    };
  };

  // Get reward name by ID
  const getRewardName = (rewardId: number) => {
    const reward = rewards?.find((r: { id: number; name: string }) => r.id === rewardId);
    return reward ? reward.name : 'Onbekende beloning';
  };

  // Format date
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'dd MMM yyyy, HH:mm', { locale: nl });
    } catch (error) {
      return 'Ongeldige datum';
    }
  };

  // Status icon for redemptions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <PackageOpen className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Form voor het aanmaken van een nieuwe regel
  const addRuleForm = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "fixed",
      pointsValue: 10,
      source: "score",
      condition: { type: "min", value: 0 },
      isActive: true
    }
  });
  
  // Form voor het bewerken van een bestaande regel
  const editRuleForm = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "fixed",
      pointsValue: 10,
      source: "score",
      condition: { type: "min", value: 0 },
      isActive: true
    }
  });
  
  // Mutation voor het aanmaken van een nieuwe regel
  const createRuleMutation = useMutation({
    mutationFn: async (data: RuleFormValues) => {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kon regel niet aanmaken');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsAddRuleDialogOpen(false);
      addRuleForm.reset();
      refetchRules();
      toast({
        title: "Regel aangemaakt",
        description: "De regel is succesvol aangemaakt en is nu actief.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij aanmaken regel",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation voor het bijwerken van een bestaande regel
  const updateRuleMutation = useMutation({
    mutationFn: async (data: RuleFormValues & { id: number }) => {
      const { id, ...ruleData } = data;
      const response = await fetch(`/api/rules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kon regel niet bijwerken');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsEditRuleDialogOpen(false);
      setSelectedRuleId(null);
      editRuleForm.reset();
      refetchRules();
      toast({
        title: "Regel bijgewerkt",
        description: "De regel is succesvol bijgewerkt.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij bijwerken regel",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation voor het verwijderen van een regel
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/rules/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kon regel niet verwijderen');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchRules();
      toast({
        title: "Regel verwijderd",
        description: "De regel is succesvol verwijderd.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij verwijderen regel",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation voor het aan/uitzetten van een regel
  const toggleRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/rules/${id}/toggle`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kon regelstatus niet wijzigen');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchRules();
      toast({
        title: "Regelstatus gewijzigd",
        description: "De status van de regel is succesvol gewijzigd.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij wijzigen regelstatus",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handler voor het indienen van een nieuwe regel
  const onSubmitAddRule = (data: RuleFormValues) => {
    createRuleMutation.mutate(data);
  };
  
  // Handler voor het bewerken van een bestaande regel
  const onSubmitEditRule = (data: RuleFormValues) => {
    if (selectedRuleId) {
      updateRuleMutation.mutate({ ...data, id: selectedRuleId });
    }
  };
  
  // Handler voor het openen van de bewerkingsdialoog
  const handleEditRule = (rule: Rule) => {
    setSelectedRuleId(rule.id);
    editRuleForm.reset({
      name: rule.name,
      description: rule.description || "",
      type: rule.type as "fixed" | "multiplication" | "custom",
      pointsValue: rule.pointsValue,
      source: "score", // Default waarde indien niet aanwezig in model
      condition: rule.condition as { type: string; value: number; operator?: string },
      isActive: rule.isActive
    });
    setIsEditRuleDialogOpen(true);
  };
  
  // Handler voor het verwijderen van een regel
  const handleDeleteRule = (id: number) => {
    if (confirm("Weet je zeker dat je deze regel wilt verwijderen?")) {
      deleteRuleMutation.mutate(id);
    }
  };
  
  // Handler voor het in-/uitschakelen van een regel
  const handleToggleRule = (id: number) => {
    toggleRuleMutation.mutate(id);
  };
  
  // Functie om regels handmatig uit te voeren
  const processRules = async () => {
    try {
      const response = await fetch('/api/integration/process-rules', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kon regels niet verwerken');
      }
      
      const result = await response.json();
      
      toast({
        title: "Regels verwerkt",
        description: `Regels zijn succesvol verwerkt. ${result.processed} transacties aangemaakt.`,
      });
      
      // Vernieuw de transacties en statistieken
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
    } catch (error) {
      toast({
        title: "Fout bij verwerken regels",
        description: error instanceof Error ? error.message : 'Onbekende fout',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 p-4 pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold">Transacties</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporteren
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-md mb-4">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Zoek transacties..."
          className="w-full pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="points" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="points">
            <Plus className="h-4 w-4 mr-2" />
            Punttransacties
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Gift className="h-4 w-4 mr-2" />
            Beloningsverzilveringen
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Zap className="h-4 w-4 mr-2" />
            Regels
          </TabsTrigger>
        </TabsList>

        {/* Punttransacties tab */}
        <TabsContent value="points">
          <Card>
            <CardHeader className="px-6 pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Punttransacties</CardTitle>
                  <CardDescription>
                    Overzicht van alle toegekende en afgeschreven punten
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filteren
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transactionsLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !filteredTransactions?.length ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <p className="text-center text-muted-foreground">
                    Geen punttransacties gevonden
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-medium">E-mail</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Vestiging</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Punten</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Kanaal</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Aangemaakt op</th>
                        <th className="px-3 py-3 text-center text-sm font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredTransactions?.slice().sort((a, b) => 
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      ).map((transaction) => {
                        const user = getUserInfo(transaction.userId);
                        return (
                          <tr key={transaction.id} className="hover:bg-muted/30">
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                  <AvatarFallback>{user.initials}</AvatarFallback>
                                </Avatar>
                                <span>{user.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center mr-2">
                                  <Building2 className="h-4 w-4 text-blue-600" />
                                </div>
                                <span>EXTRA</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              <span className={transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}>
                                {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {transaction.source || 'admin'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="px-3 py-4 text-sm">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Beloningsverzilveringen tab */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader className="px-6 pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Beloningsverzilveringen</CardTitle>
                  <CardDescription>
                    Overzicht van verzilverde beloningen en puntenminderingen
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filteren
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {redemptionsLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !filteredRedemptions?.length ? (
                <div className="flex justify-center py-8 px-4">
                  <p className="text-center text-muted-foreground">
                    Geen beloningsverzilveringen gevonden
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-medium">E-mail</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Beloning</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Punten</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Datum</th>
                        <th className="px-3 py-3 text-center text-sm font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredRedemptions?.slice().sort((a, b) => 
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      ).map((redemption) => {
                        const user = getUserInfo(redemption.userId);
                        return (
                          <tr key={redemption.id} className="hover:bg-muted/30">
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                  <AvatarFallback>{user.initials}</AvatarFallback>
                                </Avatar>
                                <span>{user.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {getRewardName(redemption.rewardId)}
                            </td>
                            <td className="px-6 py-4 text-sm text-red-600 font-medium">
                              -{redemption.pointsCost}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center">
                                {getStatusIcon(redemption.status)}
                                <span className="ml-1.5 capitalize">
                                  {redemption.status === 'pending' ? 'In afwachting' : 
                                   redemption.status === 'processing' ? 'In behandeling' :
                                   redemption.status === 'shipped' ? 'Verzonden' :
                                   redemption.status === 'completed' ? 'Voltooid' :
                                   redemption.status === 'cancelled' ? 'Geannuleerd' :
                                   redemption.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {formatDate(redemption.createdAt)}
                            </td>
                            <td className="px-3 py-4 text-sm">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Regels tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader className="px-6 pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Automatiseringsregels</CardTitle>
                  <CardDescription>
                    Beheer regels voor het automatisch toekennen van punten
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={processRules}
                    size="sm"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Regels verwerken
                  </Button>
                  <Button 
                    onClick={() => setIsAddRuleDialogOpen(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Regel toevoegen
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {rulesLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !rules?.length ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <Zap className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium mb-2">Geen regels gevonden</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Maak automatiseringsregels aan om medewerkers te belonen voor prestaties zoals hoge scores, gewerkte shifts of andere doelstellingen.
                  </p>
                  <Button onClick={() => setIsAddRuleDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Eerste regel aanmaken
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-medium">Naam</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Type</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Voorwaarde</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Punten</th>
                        <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-6 py-3 text-right text-sm font-medium">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rules?.map((rule) => (
                        <tr key={rule.id} className="hover:bg-muted/30">
                          <td className="px-6 py-4 text-sm">
                            <div>
                              <div className="font-medium">{rule.name}</div>
                              <div className="text-muted-foreground text-xs">{rule.description}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {rule.type === 'fixed' ? 'Vast aantal' : 
                             rule.type === 'multiplication' ? 'Vermenigvuldiging' : 
                             'Aangepast'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {rule.condition.type === 'min' 
                              ? `Minimaal ${rule.condition.value}` 
                              : rule.condition.type === 'max' 
                                ? `Maximaal ${rule.condition.value}` 
                                : `Gelijk aan ${rule.condition.value}`}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-green-600">
                            {rule.type === 'fixed' 
                              ? `+${rule.pointsValue}` 
                              : rule.type === 'multiplication' 
                                ? `${rule.condition.type} × ${rule.pointsValue}` 
                                : `+${rule.pointsValue}`}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge variant={rule.isActive ? "default" : "outline"}>
                              {rule.isActive ? 'Actief' : 'Inactief'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleRule(rule.id)}
                                className="h-8 w-8 p-0"
                              >
                                {rule.isActive ? (
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Check className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRule(rule)}
                                className="h-8 w-8 p-0"
                              >
                                <Settings2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Dialoogvenster voor het toevoegen van een nieuwe regel */}
        <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nieuwe regel aanmaken</DialogTitle>
              <DialogDescription>
                Maak een nieuwe regel aan om automatisch punten toe te kennen aan medewerkers 
                op basis van bepaalde criteria of prestaties.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...addRuleForm}>
              <form onSubmit={addRuleForm.handleSubmit(onSubmitAddRule)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={addRuleForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Naam</FormLabel>
                        <FormControl>
                          <Input placeholder="Bijv. Score beloning" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addRuleForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gegevensbron</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een bron" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="score">Score</SelectItem>
                            <SelectItem value="shift">Shifts</SelectItem>
                            <SelectItem value="hours">Uren</SelectItem>
                            <SelectItem value="sales">Verkopen</SelectItem>
                            <SelectItem value="custom">Aangepast</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          De bron waarop deze regel wordt toegepast
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={addRuleForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschrijving</FormLabel>
                      <FormControl>
                        <Input placeholder="Beschrijf de regel..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Een korte beschrijving van het doel van deze regel
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={addRuleForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type berekening</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Vast aantal punten</SelectItem>
                            <SelectItem value="multiplication">Vermenigvuldiging</SelectItem>
                            <SelectItem value="custom">Aangepaste formule</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Hoe worden punten berekend?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addRuleForm.control}
                    name="pointsValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waarde</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormDescription>
                          {addRuleForm.watch("type") === "fixed" 
                            ? "Aantal vaste punten om toe te kennen" 
                            : addRuleForm.watch("type") === "multiplication" 
                              ? "Vermenigvuldigingsfactor (bijv. score × deze waarde)" 
                              : "Waarde voor aangepaste formule"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={addRuleForm.control}
                    name="condition.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conditietype</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een conditietype" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="min">Minimum (&gt;=)</SelectItem>
                            <SelectItem value="max">Maximum (&lt;=)</SelectItem>
                            <SelectItem value="equals">Gelijk aan (==)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Wanneer wordt deze regel toegepast?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addRuleForm.control}
                    name="condition.value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conditiewaarde</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="bijv. 7 voor minimale score van 7" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          De waarde waaraan moet worden voldaan
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={addRuleForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Actief</FormLabel>
                        <FormDescription>
                          Automatisch punten toekennen wanneer aan deze regel wordt voldaan
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddRuleDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={createRuleMutation.isPending}>
                    {createRuleMutation.isPending ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Opslaan...
                      </>
                    ) : "Regel opslaan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Dialoogvenster voor het bewerken van een regel */}
        <Dialog open={isEditRuleDialogOpen} onOpenChange={setIsEditRuleDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Regel bewerken</DialogTitle>
              <DialogDescription>
                Werk de geselecteerde regel bij om het gedrag aan te passen.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editRuleForm}>
              <form onSubmit={editRuleForm.handleSubmit(onSubmitEditRule)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={editRuleForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Naam</FormLabel>
                        <FormControl>
                          <Input placeholder="Bijv. Score beloning" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editRuleForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gegevensbron</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een bron" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="score">Score</SelectItem>
                            <SelectItem value="shift">Shifts</SelectItem>
                            <SelectItem value="hours">Uren</SelectItem>
                            <SelectItem value="sales">Verkopen</SelectItem>
                            <SelectItem value="custom">Aangepast</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          De bron waarop deze regel wordt toegepast
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editRuleForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschrijving</FormLabel>
                      <FormControl>
                        <Input placeholder="Beschrijf de regel..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Een korte beschrijving van het doel van deze regel
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={editRuleForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type berekening</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Vast aantal punten</SelectItem>
                            <SelectItem value="multiplication">Vermenigvuldiging</SelectItem>
                            <SelectItem value="custom">Aangepaste formule</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Hoe worden punten berekend?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editRuleForm.control}
                    name="pointsValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waarde</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormDescription>
                          {editRuleForm.watch("type") === "fixed" 
                            ? "Aantal vaste punten om toe te kennen" 
                            : editRuleForm.watch("type") === "multiplication" 
                              ? "Vermenigvuldigingsfactor (bijv. score × deze waarde)" 
                              : "Waarde voor aangepaste formule"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={editRuleForm.control}
                    name="condition.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conditietype</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een conditietype" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="min">Minimum (&gt;=)</SelectItem>
                            <SelectItem value="max">Maximum (&lt;=)</SelectItem>
                            <SelectItem value="equals">Gelijk aan (==)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Wanneer wordt deze regel toegepast?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editRuleForm.control}
                    name="condition.value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conditiewaarde</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="bijv. 7 voor minimale score van 7" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          De waarde waaraan moet worden voldaan
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editRuleForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Actief</FormLabel>
                        <FormDescription>
                          Automatisch punten toekennen wanneer aan deze regel wordt voldaan
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditRuleDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={updateRuleMutation.isPending}>
                    {updateRuleMutation.isPending ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Opslaan...
                      </>
                    ) : "Wijzigingen opslaan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
      </Tabs>
    </div>
  );
}