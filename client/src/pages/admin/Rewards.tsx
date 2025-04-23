import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Reward } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, PlusCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import AddRewardDialog from '@/components/AddRewardDialog';

export default function RewardsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);

  const { data: rewards, isLoading } = useQuery({
    queryKey: ['/api/rewards'],
    queryFn: async () => {
      const response = await fetch('/api/rewards');
      if (!response.ok) {
        throw new Error('Kon beloningen niet ophalen');
      }
      return response.json() as Promise<Reward[]>;
    },
  });

  const filteredRewards = rewards?.filter(
    (reward) =>
      reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reward.description && reward.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper function for status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Beschikbaar</Badge>;
      case 'outofstock':
        return <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600">Niet op voorraad</Badge>;
      case 'hidden':
        return <Badge variant="outline">Verborgen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Beloningen</h1>
          <p className="text-muted-foreground">
            Beheer beloningen die medewerkers kunnen inwisselen
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Beloningen beheren</CardTitle>
          <CardDescription>
            Voeg beloningen toe die medewerkers kunnen inwisselen met hun punten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek beloningen..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="shrink-0" onClick={() => setIsAddRewardOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Beloning toevoegen
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-8">Beloningen laden...</div>
      ) : filteredRewards?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-lg font-medium">Geen beloningen gevonden</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? `Geen resultaten voor "${searchQuery}"`
              : 'Voeg beloningen toe om te beginnen'}
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setIsAddRewardOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Beloning toevoegen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRewards?.map((reward) => (
            <Card key={reward.id} className="overflow-hidden">
              <div className="aspect-video w-full overflow-hidden bg-gray-100">
                {reward.imageUrl ? (
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                    Geen afbeelding
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{reward.name}</CardTitle>
                  <div className="ml-2">{getStatusBadge(reward.status)}</div>
                </div>
                <CardDescription>
                  {reward.description || 'Geen beschrijving beschikbaar'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-blue-600">{reward.pointsCost}</span>
                    <span className="ml-1 text-sm text-muted-foreground">punten</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Voorraad: {reward.stock !== null ? reward.stock : 'Onbeperkt'}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    Bewerken
                  </Button>
                  <Button variant="secondary" className="flex-1">
                    Voorraad
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog voor toevoegen beloning */}
      <AddRewardDialog 
        isOpen={isAddRewardOpen} 
        onClose={() => setIsAddRewardOpen(false)}
      />
    </div>
  );
}