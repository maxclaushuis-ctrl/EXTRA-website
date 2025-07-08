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
import { PushNotificationSettings } from '@/components/PushNotificationSettings';

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
    <div className="min-h-screen bg-gray-900">
      {/* Header section met blauwe achtergrond */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-white">
            {userData?.profileImage ? (
              <AvatarImage src={userData.profileImage} alt={userData.firstName} />
            ) : (
              <AvatarFallback className="text-2xl bg-white text-blue-600">
                {userData?.firstName?.[0]}
                {userData?.lastName?.[0]}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {userData?.firstName} {userData?.lastName}
            </h2>
            <p className="text-blue-100">{userData?.email}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
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

      {/* Container voor tabs */}
      <div className="p-4">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-4 w-full bg-gray-800 border-gray-700">
            <TabsTrigger value="personal" className="flex-1 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-600">
              Persoonlijke Gegevens
            </TabsTrigger>
            <TabsTrigger value="password" className="flex-1 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-600">
              Wachtwoord
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex-1 text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-600">
              Voorkeuren
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Persoonlijke gegevens</CardTitle>
                <CardDescription className="text-gray-400">
                  Beheer je persoonlijke informatie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-300">Voornaam</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-300">Achternaam</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">E-mailadres</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300">Telefoonnummer</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profileImage" className="text-gray-300">Profielfoto</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-gray-600">
                        {userData?.profileImage ? (
                          <AvatarImage src={userData.profileImage} alt={userData.firstName} />
                        ) : (
                          <AvatarFallback className="bg-gray-700 text-gray-300">
                            <UserIcon className="h-8 w-8" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <Button type="button" variant="outline" className="border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white">
                        <Upload className="mr-2 h-4 w-4" />
                        Foto Uploaden
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Wijzigingen opslaan
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Wachtwoord wijzigen</CardTitle>
                <CardDescription className="text-gray-400">
                  Wijzig je wachtwoord om je account te beveiligen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-gray-300">Huidig wachtwoord</Label>
                    <Input 
                      id="currentPassword" 
                      type="password"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-300">Nieuw wachtwoord</Label>
                    <Input 
                      id="newPassword" 
                      type="password"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-300">Bevestig nieuw wachtwoord</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Wachtwoord bijwerken
                  </Button>
                </form>
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="preferences">
            <div className="space-y-6">
              <PushNotificationSettings />
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Overige Voorkeuren</CardTitle>
                  <CardDescription className="text-gray-400">
                    Algemene app instellingen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">
                    Meer voorkeuren worden binnenkort toegevoegd.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}