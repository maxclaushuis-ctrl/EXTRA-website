import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertUserSchema, userStatusEnum, userRoleEnum } from '@shared/schema';
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Schema voor het toevoegen van een nieuw contact
const formSchema = insertUserSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
}).extend({
  firstName: z.string().min(2, 'Voornaam moet minimaal 2 karakters bevatten'),
  lastName: z.string().min(2, 'Achternaam moet minimaal 2 karakters bevatten'),
  email: z.string().email('Ongeldig e-mailadres'),
  sendWelcomeEmail: z.boolean().default(true),
});

export default function AddContactDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'employee',
      status: 'active',
      sendWelcomeEmail: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Extracten van sendWelcomeEmail omdat dat geen deel is van insertUserSchema
      const { sendWelcomeEmail, ...userData } = values;
      
      // Aanmaken van een tijdelijk wachtwoord
      const data = {
        ...userData,
        password: 'temppassword123', // In productie zou dit een gegenereerd wachtwoord moeten zijn
      };

      // API aanroep naar de server
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          sendWelcomeEmail,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Contact kon niet worden toegevoegd');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contact toegevoegd',
        description: 'Het nieuwe contact is succesvol toegevoegd',
      });
      form.reset();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij toevoegen',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Contact toevoegen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nieuw contact toevoegen</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe medewerker of administrator toe.
          </DialogDescription>
        </DialogHeader>
        
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
                    <Input placeholder="email@example.com" {...field} />
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
                    <Input 
                      placeholder="+31 6 12345678" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
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
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="employee" />
                          </FormControl>
                          <FormLabel className="font-normal">Medewerker</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
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
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="active" />
                          </FormControl>
                          <FormLabel className="font-normal">Actief</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
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
            
            <FormField
              control={form.control}
              name="sendWelcomeEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Verstuur welkomst-email
                    </FormLabel>
                    <FormDescription>
                      De nieuwe gebruiker ontvangt een e-mail met inloggegevens.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Toevoegen..." : "Contact toevoegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}