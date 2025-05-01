import { useState } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Discount } from '@shared/schema';
import { 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ListFilter, 
  Plus,
  Search,
  Copy
} from 'lucide-react';

const discountFormSchema = z.object({
  name: z.string().min(2, { message: 'Naam moet minstens 2 tekens bevatten' }),
  description: z.string().min(10, { message: 'Beschrijving moet minstens 10 tekens bevatten' }),
  imageUrl: z.string().url({ message: 'Ongeldige URL voor afbeelding' }),
  partner: z.string().min(2, { message: 'Partner naam moet minstens 2 tekens bevatten' }),
  discountCode: z.string().min(3, { message: 'Discount code moet minstens 3 tekens bevatten' }),
  category: z.string().min(2, { message: 'Categorie moet minstens 2 tekens bevatten' }),
  status: z.enum(['active', 'hidden'])
});

type FormData = z.infer<typeof discountFormSchema>;

export function Discounts() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState<Discount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Query: Alle kortingsacties ophalen
  const { data: discounts, isLoading, error } = useQuery<Discount[]>({
    queryKey: ['/api/discounts']
  });

  // Form initialiseren
  const form = useForm<FormData>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      partner: '',
      discountCode: '',
      category: '',
      status: 'active'
    },
  });

  // Mutation: Nieuwe kortingsactie maken
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest('POST', '/api/discounts', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
      setIsEditModalOpen(false);
      form.reset();
      toast({
        title: 'Kortingsactie aangemaakt',
        description: 'De kortingsactie is succesvol toegevoegd.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout bij aanmaken',
        description: `Er is iets misgegaan: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Mutation: Kortingsactie bijwerken
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: FormData }) => {
      const res = await apiRequest('PUT', `/api/discounts/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
      setIsEditModalOpen(false);
      setCurrentDiscount(null);
      toast({
        title: 'Kortingsactie bijgewerkt',
        description: 'De kortingsactie is succesvol bijgewerkt.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout bij bijwerken',
        description: `Er is iets misgegaan: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Mutation: Kortingsactie verwijderen
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/discounts/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discounts'] });
      toast({
        title: 'Kortingsactie verwijderd',
        description: 'De kortingsactie is succesvol verwijderd.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout bij verwijderen',
        description: `Er is iets misgegaan: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Behandel formulier indiening
  const onSubmit = (data: FormData) => {
    if (currentDiscount) {
      updateMutation.mutate({ id: currentDiscount.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Open bewerk modal (leeg voor nieuw, gevuld voor bestaand)
  const openEditModal = (discount?: Discount) => {
    if (discount) {
      setCurrentDiscount(discount);
      form.reset({
        name: discount.name,
        description: discount.description || '',
        imageUrl: discount.imageUrl || '',
        partner: discount.partner,
        discountCode: discount.discountCode,
        category: discount.category || '',
        status: discount.status as 'active' | 'hidden',
      });
    } else {
      setCurrentDiscount(null);
      form.reset({
        name: '',
        description: '',
        imageUrl: '',
        partner: '',
        discountCode: '',
        category: '',
        status: 'active'
      });
    }
    setIsEditModalOpen(true);
  };

  // Status veranderen van de korting
  const toggleStatus = (discount: Discount) => {
    const newStatus = discount.status === 'active' ? 'hidden' : 'active';
    updateMutation.mutate({
      id: discount.id,
      data: { ...discount, status: newStatus } as FormData
    });
  };

  const copyDiscountCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code gekopieerd',
      description: `De kortingscode ${code} is gekopieerd naar het klembord.`
    });
  };

  // Filterfuncties
  const getFilteredDiscounts = () => {
    if (!discounts) return [];
    
    return discounts
      .filter(discount => 
        discount.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        discount.partner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (discount.description && discount.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter(discount => 
        statusFilter === 'all' || discount.status === statusFilter
      );
  };

  const filteredDiscounts = getFilteredDiscounts();

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kortingsacties beheren</h1>
        <Button onClick={() => openEditModal()}>
          <Plus className="mr-2 h-4 w-4" /> Nieuwe kortingsactie
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Zoeken op naam, partner of beschrijving..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <ListFilter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter op status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="active">Actief</SelectItem>
              <SelectItem value="hidden">Verborgen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">Kortingsacties laden...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">Fout bij laden van kortingsacties</div>
      ) : filteredDiscounts.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          {searchTerm || statusFilter !== 'all' 
            ? 'Geen kortingsacties gevonden met deze filteropties' 
            : 'Er zijn nog geen kortingsacties aangemaakt'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDiscounts.map((discount) => (
            <Card key={discount.id} className={`overflow-hidden ${discount.status === 'hidden' ? 'opacity-70' : ''}`}>
              {discount.imageUrl && (
                <div 
                  className="h-40 bg-cover bg-center" 
                  style={{ backgroundImage: `url(${discount.imageUrl})` }} 
                />
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{discount.name}</CardTitle>
                    <CardDescription>Partner: {discount.partner}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" onClick={() => toggleStatus(discount)} title={discount.status === 'active' ? 'Verbergen' : 'Actief maken'}>
                      {discount.status === 'active' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-gray-600">{discount.description || ''}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between">
                    <Label>Code:</Label>
                    <div className="flex items-center gap-1">
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">{discount.discountCode}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyDiscountCode(discount.discountCode)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Label>Categorie:</Label>
                    <span className="text-sm">{discount.category || 'Algemeen'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(discount)}>
                  <Edit className="mr-2 h-4 w-4" /> Bewerken
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(discount.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Verwijderen
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {currentDiscount ? 'Kortingsactie bewerken' : 'Nieuwe kortingsactie aanmaken'}
            </DialogTitle>
            <DialogDescription>
              Vul de onderstaande gegevens in om een kortingsactie {currentDiscount ? 'bij te werken' : 'aan te maken'}.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naam</FormLabel>
                      <FormControl>
                        <Input placeholder="10% korting bij Restaurant X" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner</FormLabel>
                      <FormControl>
                        <Input placeholder="Bedrijfsnaam van partner" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Beschrijf hier de details van de kortingsactie" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Afbeelding URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://voorbeeld.com/afbeelding.jpg" {...field} />
                    </FormControl>
                    <FormDescription>URL naar een afbeelding die de kortingsactie visualiseert</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kortingscode</FormLabel>
                      <FormControl>
                        <Input placeholder="EXTRA20" {...field} />
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
                      <FormControl>
                        <Input placeholder="eten, entertainment, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Actief</SelectItem>
                        <SelectItem value="hidden">Verborgen</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Verborgen kortingsacties worden niet getoond aan medewerkers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

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
                  ) : currentDiscount ? (
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
    </div>
  );
}

export default Discounts;