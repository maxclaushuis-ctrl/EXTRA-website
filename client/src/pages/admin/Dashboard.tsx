import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMilestoneContext } from '@/contexts/MilestoneContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Activity, User, Import, Download, Receipt,
  Mail, Zap, LineChart, Send, Plus, FileCheck,
  Shield
} from 'lucide-react';

import Transactions from './Transactions';
import Rewards from './Rewards';
import { Challenges } from '@/components/admin/Challenges';
import Discounts from './Discounts';
import LeaderboardComponent from '@/components/Leaderboard';
import SystemManagement from './SystemManagement';


import CSVImport from '@/components/CSVImport';
import APIImport from '@/components/APIImport';
import AddContactDialog from '@/components/AddContactDialog';
import ContactDetailDialog from '@/components/ContactDetailDialog';
import ContactsTable from '@/components/ContactsTable';
// Import overige componenten

// Deze imports worden later toegevoegd wanneer we de afzonderlijke tab-componenten maken
// import ContactsTab from './tabs/ContactsTab';
// import RewardsTab from './tabs/RewardsTab';
// import SettingsTab from './tabs/SettingsTab';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("contacten");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // Import de confetti & mijlpalen functionaliteit
  const { 
    triggerCustomMilestone, 
    milestoneTriggered
  } = useMilestoneContext();

  const { data: userStats, isLoading: usersLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/stats'],
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
      change: userStats?.changes?.pointsChange || '+0%',
      changeDirection: 'up',
    },
    {
      title: 'Verzilverde Beloningen',
      value: usersLoading ? <Skeleton className="h-8 w-20" /> : (userStats?.totalRedemptions || 0).toLocaleString(),
      icon: <Gift className="h-4 w-4 text-purple-600" />,
      change: userStats?.changes?.redemptionsChange || '+0%',
      changeDirection: 'up',
    },
    {
      title: 'Actieve Medewerkers',
      // Toon nu het absolute aantal in plaats van percentage
      value: usersLoading ? <Skeleton className="h-8 w-20" /> : (userStats?.activeEmployees || 0).toString(),
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      change: userStats?.changes?.activeUsersChange || '+0%',
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
        fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            amount: pointsNumber,
            type: 'earned',
            description: 'Handmatig toegekend',
            source: 'admin',
          }),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Punten konden niet worden toegekend');
          }
          return response.json();
        })
        .then(() => {
          // Vernieuw alle statistieken en lijsten
          refetchStats();
          
          // Toon confetti als er een aanzienlijk aantal punten is toegekend
          if (pointsNumber >= 50) {
            // Kies het juiste confetti-type op basis van het aantal punten
            if (pointsNumber >= 500) {
              triggerCustomMilestone('achievement', `Wow! ${pointsNumber} punten toegekend!`);
            } else if (pointsNumber >= 100) {
              triggerCustomMilestone('reward', `${pointsNumber} punten toegekend!`);
            } else {
              triggerCustomMilestone('points', `${pointsNumber} punten toegekend!`);
            }
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Er is een fout opgetreden bij het toekennen van punten.');
        });
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="contacten">
            <Users className="mr-2 h-4 w-4" />
            Contacten
          </TabsTrigger>
          <TabsTrigger value="beloningen">
            <Gift className="mr-2 h-4 w-4" />
            Beloningen
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <TrendingUp className="mr-2 h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="ranglijst">
            <BarChart className="mr-2 h-4 w-4" />
            Ranglijst
          </TabsTrigger>
          <TabsTrigger value="kortingsacties">
            <Receipt className="mr-2 h-4 w-4" />
            Kortingsacties
          </TabsTrigger>

          <TabsTrigger value="marketing">
            <Send className="mr-2 h-4 w-4" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="transacties">
            <Receipt className="mr-2 h-4 w-4" />
            Transacties
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
            <ContactsTable 
              onEditUser={handleEditUser}
              onAssignPoints={handleAssignPoints}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="transacties" className="mt-6">
          {/* Transacties component */}
          <Transactions />
        </TabsContent>
        
        <TabsContent value="beloningen" className="mt-6">
          <Rewards />
        </TabsContent>

        <TabsContent value="challenges" className="mt-6">
          <Challenges />
        </TabsContent>

        <TabsContent value="ranglijst" className="mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Ranglijst</h2>
            <p className="text-muted-foreground">
              Bekijk de maandelijkse ranglijst met de beste presteerders
            </p>
          </div>
          
          <div className="grid gap-6">
            <LeaderboardComponent />
          </div>
        </TabsContent>
        
        <TabsContent value="kortingsacties" className="mt-6">
          <Discounts />
        </TabsContent>

        <TabsContent value="systeembeheer" className="mt-6">
          <SystemManagement />
        </TabsContent>
        


        
        <TabsContent value="instellingen" className="mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Instellingen</h2>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Test Confetti Effecten</h3>
            <p className="text-muted-foreground mb-4">Test de verschillende confetti animaties voor beloningen en mijlpalen</p>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => triggerCustomMilestone('reward', 'Beloning uitgereikt!')}
              >
                Beloning Confetti
              </Button>
              <Button
                variant="outline"
                onClick={() => triggerCustomMilestone('birthday', 'Gefeliciteerd met je verjaardag!')}
              >
                Verjaardag Confetti
              </Button>
              <Button
                variant="outline"
                onClick={() => triggerCustomMilestone('achievement', 'Mijlpaal bereikt!')}
              >
                Prestatie Confetti
              </Button>
              <Button
                variant="outline"
                onClick={() => triggerCustomMilestone('points', '500 punten behaald!')}
              >
                Punten Confetti
              </Button>
            </div>
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

        {/* Marketing */}
        <TabsContent value="marketing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>E-mail Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Nieuwe Template
                  </Button>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600">Geen templates gevonden. Maak je eerste e-mail template aan.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Campagnes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Nieuwe Campagne
                  </Button>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600">Geen campagnes gevonden. Start je eerste marketing campagne.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Marketing Statistieken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Verzonden E-mails</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0%</div>
                  <div className="text-sm text-gray-600">Open Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0%</div>
                  <div className="text-sm text-gray-600">Click Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-gray-600">Actieve Campagnes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}