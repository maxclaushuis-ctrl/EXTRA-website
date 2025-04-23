import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User as UserIcon, Save, Upload } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/users', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/users/${user.id}`);
      if (!response.ok) {
        throw new Error('Kon gebruikersgegevens niet ophalen');
      }
      return response.json() as Promise<User>;
    },
    enabled: !!user?.id,
    onSuccess: (data) => {
      if (data) {
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || '',
        });
      }
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (!user?.id) throw new Error('Gebruiker niet ingelogd');
      
      const response = await apiRequest(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Kon profiel niet bijwerken');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id] });
      toast({
        title: 'Profiel bijgewerkt',
        description: 'Je profiel is succesvol bijgewerkt',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout bij bijwerken',
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-4">Laden...</div>;
  }

  return (
    <div className="container mx-auto max-w-5xl p-4">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Mijn Profiel</h1>
          <p className="text-muted-foreground">
            Bekijk en beheer je persoonlijke gegevens
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-md">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <Avatar className="h-24 w-24 border-4 border-white">
            {userData?.profileImage ? (
              <AvatarImage src={userData.profileImage} alt={userData.firstName} />
            ) : (
              <AvatarFallback className="text-2xl">
                {userData?.firstName?.[0]}
                {userData?.lastName?.[0]}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">
              {userData?.firstName} {userData?.lastName}
            </h2>
            <p className="text-blue-100">{userData?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="rounded-full bg-blue-500 px-3 py-1 text-sm">
                {userData?.role === 'admin' ? 'Admin' : 'Medewerker'}
              </div>
              <div className="rounded-full bg-blue-500 px-3 py-1 text-sm">
                {userData?.points} punten
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="mb-4">
          <TabsTrigger value="personal">Persoonlijke Gegevens</TabsTrigger>
          <TabsTrigger value="password">Wachtwoord</TabsTrigger>
          <TabsTrigger value="preferences">Voorkeuren</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Persoonlijke gegevens</CardTitle>
              <CardDescription>
                Beheer je persoonlijke informatie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Voornaam</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Achternaam</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mailadres</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoonnummer</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileImage">Profielfoto</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      {userData?.profileImage ? (
                        <AvatarImage src={userData.profileImage} alt={userData.firstName} />
                      ) : (
                        <AvatarFallback>
                          <UserIcon className="h-8 w-8" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <Button type="button" variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Foto Uploaden
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="mt-4">
                  <Save className="mr-2 h-4 w-4" />
                  Wijzigingen opslaan
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Wachtwoord wijzigen</CardTitle>
              <CardDescription>
                Wijzig je wachtwoord om je account te beveiligen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Huidig wachtwoord</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Bevestig nieuw wachtwoord</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button className="mt-4">
                  <Save className="mr-2 h-4 w-4" />
                  Wachtwoord bijwerken
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Voorkeuren</CardTitle>
              <CardDescription>
                Pas je voorkeuren aan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Voorkeuren worden binnenkort toegevoegd.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}