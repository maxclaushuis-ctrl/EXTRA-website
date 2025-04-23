import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Users, Gift, Settings, Upload, FileSpreadsheet,
  BarChart, ArrowUpRight, TrendingUp, Database,
  Activity, User, Import, Download
} from 'lucide-react';

import CSVImport from '@/components/CSVImport';
import APIImport from '@/components/APIImport';
import AddContactDialog from '@/components/AddContactDialog';
import ContactDetailDialog from '@/components/ContactDetailDialog';

// Deze imports worden later toegevoegd wanneer we de afzonderlijke tab-componenten maken
// import ContactsTab from './tabs/ContactsTab';
// import RewardsTab from './tabs/RewardsTab';
// import SettingsTab from './tabs/SettingsTab';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("contacten");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data: userStats, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/stats/users'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Kon statistieken niet ophalen');
      }
      return response.json();
    },
  });

  const keyMetrics = [
    {
      title: 'Totaal Uitgegeven Punten',
      value: usersLoading ? <Skeleton className="h-8 w-20" /> : (userStats?.totalPointsAwarded || 0).toLocaleString(),
      icon: <BarChart className="h-4 w-4 text-blue-600" />,
      change: '+12%',
      changeDirection: 'up',
    },
    {
      title: 'Verzilverde Beloningen',
      value: usersLoading ? <Skeleton className="h-8 w-20" /> : (userStats?.totalRedemptions || 0).toLocaleString(),
      icon: <Gift className="h-4 w-4 text-purple-600" />,
      change: '+8%',
      changeDirection: 'up',
    },
    {
      title: 'Actieve Medewerkers',
      value: usersLoading ? <Skeleton className="h-8 w-20" /> : `${userStats?.activeUsersPercent || 0}%`,
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      change: '+5%',
      changeDirection: 'up',
    },
    {
      title: 'Betrokkenheid',
      value: usersLoading ? <Skeleton className="h-8 w-20" /> : `${userStats?.engagementRate || 0}%`,
      icon: <Activity className="h-4 w-4 text-yellow-600" />,
      change: '+2%',
      changeDirection: 'up',
    },
  ];

  // Functie om een gebruiker te bewerken
  const handleEditUser = (userId: number) => {
    setSelectedUserId(userId);
    setIsDetailDialogOpen(true);
  };

  // Functie om punten toe te kennen aan een gebruiker
  const handleAssignPoints = (userId: number) => {
    const points = prompt('Hoeveel punten wil je toekennen?');
    if (points) {
      const pointsNumber = parseInt(points, 10);
      if (!isNaN(pointsNumber) && pointsNumber > 0) {
        // Implementatie van het toekennen van punten
        console.log(`${pointsNumber} punten toegekend aan gebruiker ${userId}`);
      } else {
        alert('Vul een geldig positief getal in');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Contact detail dialog */}
      <ContactDetailDialog 
        userId={selectedUserId} 
        isOpen={isDetailDialogOpen} 
        onClose={() => setIsDetailDialogOpen(false)} 
      />
      
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Beheer het beloningssysteem en bekijk statistieken
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <User className="mr-2 h-4 w-4" />
              Naar Gebruikersweergave
            </Link>
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {keyMetrics.map((metric, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                {metric.icon}
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <div className="flex items-center pt-1">
                  <span
                    className={`flex items-center text-xs ${
                      metric.changeDirection === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {metric.changeDirection === 'up' ? (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-3 w-3 rotate-180 transform" />
                    )}
                    {metric.change}
                  </span>
                  <span className="text-xs text-muted-foreground">sinds vorige maand</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbladen */}
      <Tabs defaultValue="contacten" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacten">
            <Users className="mr-2 h-4 w-4" />
            Contacten
          </TabsTrigger>
          <TabsTrigger value="beloningen">
            <Gift className="mr-2 h-4 w-4" />
            Beloningen
          </TabsTrigger>
          <TabsTrigger value="instellingen">
            <Settings className="mr-2 h-4 w-4" />
            Instellingen
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="contacten" className="mt-6">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
            <h2 className="text-2xl font-bold">Contacten</h2>
            <div className="flex-1"></div>
            <div className="flex flex-wrap gap-2">
              <AddContactDialog />
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Import className="mr-2 h-4 w-4" />
                    Importeren via API
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Importeer contacten via API</DialogTitle>
                    <DialogDescription>
                      Verbind met een externe API om contactgegevens te importeren.
                    </DialogDescription>
                  </DialogHeader>
                  <APIImport />
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    CSV Uploaden
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>CSV-bestand importeren</DialogTitle>
                    <DialogDescription>
                      Upload een CSV-bestand met contactgegevens.
                    </DialogDescription>
                  </DialogHeader>
                  <CSVImport />
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exporteren
              </Button>
            </div>
          </div>
          
          {/* Contacten tabel */}
          <div>
            {/* Hier zou normaal de geïmporteerde ContactsTab component staan */}
            {/* Omdat we in deze code nog geen aparte tab componenten hebben gemaakt
                is de tabel direct geïntegreerd */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="flex justify-center p-8">Contacten laden...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium">Naam</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Rol</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Punten</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Acties</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {/* Weergave van contacten met placeholder data */}
                        <tr className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                                <div className="flex h-full w-full items-center justify-center bg-blue-100 text-lg font-medium text-blue-600">
                                  AE
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="font-medium">Admin EXTRA</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">admin@extra.nl</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600">
                              Admin
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">0</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-600">
                              Actief
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                Bewerken
                              </Button>
                              <Button variant="outline" size="sm">
                                Punten toekennen
                              </Button>
                            </div>
                          </td>
                        </tr>
                        <tr className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                                <div className="flex h-full w-full items-center justify-center bg-blue-100 text-lg font-medium text-blue-600">
                                  TM
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="font-medium">Test Medewerker</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">employee@example.com</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                              Medewerker
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">250</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-600">
                              Actief
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                Bewerken
                              </Button>
                              <Button variant="outline" size="sm">
                                Punten toekennen
                              </Button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="beloningen" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Beloningen</h2>
            <Button>
              <Gift className="mr-2 h-4 w-4" />
              Nieuwe beloning toevoegen
            </Button>
          </div>
          
          {/* Beloningen grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Beloning kaart voorbeeld */}
            <Card>
              <div className="aspect-video w-full overflow-hidden bg-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1580508244245-c466a205d42e" 
                  alt="Extra Vrije Dag" 
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold">Extra Vrije Dag</h3>
                  <span className="font-semibold text-blue-600">500 punten</span>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">Een extra vrije dag naar keuze</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Beschikbaar: 10</span>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">Bewerken</Button>
                    <Button variant="outline" size="sm">Verwijderen</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <div className="aspect-video w-full overflow-hidden bg-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1608583020712-a43d0e94f3eb" 
                  alt="Cadeaubon €25" 
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold">Cadeaubon €25</h3>
                  <span className="font-semibold text-blue-600">250 punten</span>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">Een cadeaubon van €25 voor je favoriete winkel</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Beschikbaar: 25</span>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">Bewerken</Button>
                    <Button variant="outline" size="sm">Verwijderen</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="instellingen" className="mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Instellingen</h2>
          </div>
          
          {/* Instellingen secties */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold">API Configuratie</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">API Endpoint</label>
                    <div className="flex">
                      <input 
                        type="text" 
                        className="flex-1 rounded-l-md border px-3 py-2" 
                        value="https://api.voorbeeld.com/employees"
                        readOnly
                      />
                      <Button className="rounded-l-none">Verbinden</Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm font-medium">API Polling Interval (minuten)</label>
                    <input 
                      type="number" 
                      className="w-full rounded-md border px-3 py-2" 
                      defaultValue="60"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button>Instellingen opslaan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Algemene Instellingen</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Bedrijfsnaam</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border px-3 py-2" 
                      defaultValue="EXTRA"
                    />
                  </div>
                  
                  <div>
                    <label className="mb-2 block text-sm font-medium">Punt Vervaldatum (dagen)</label>
                    <input 
                      type="number" 
                      className="w-full rounded-md border px-3 py-2" 
                      defaultValue="365"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button>Instellingen opslaan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}