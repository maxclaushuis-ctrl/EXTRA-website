import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, Plus, UserPlus, Search, Trash2, CalendarDays, UserCog
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function StaffPoolsPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPoolDialog, setShowNewPoolDialog] = useState(false);
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolDescription, setNewPoolDescription] = useState("");
  const [isPrivatePool, setIsPrivatePool] = useState(false);

  // Pools ophalen
  const { data: staffPools, isLoading } = useQuery({
    queryKey: ['/api/planning/staff-pools'],
  });

  // Gebruikers ophalen voor eventuele toevoegingen (admin)
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: isAdmin
  });

  // Filter pools op basis van zoekopdracht
  const filteredPools = staffPools?.filter(pool => 
    pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Toegang tot staffpool bepalen
  const canManagePool = (pool) => {
    return isAdmin || pool.createdBy === user?.id;
  };

  // Mutaties voor pool acties
  const createPool = useMutation({
    mutationFn: async (poolData) => {
      const response = await fetch('/api/planning/staff-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poolData)
      });
      
      if (!response.ok) {
        throw new Error('Teamgroep aanmaken mislukt');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/planning/staff-pools'] });
      setShowNewPoolDialog(false);
      setNewPoolName("");
      setNewPoolDescription("");
      setIsPrivatePool(false);
      toast({
        title: "Teamgroep aangemaakt",
        description: "De nieuwe teamgroep is succesvol aangemaakt",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij aanmaken",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Pool verwijderen
  const deletePool = useMutation({
    mutationFn: async (poolId) => {
      const response = await fetch(`/api/planning/staff-pools/${poolId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Teamgroep verwijderen mislukt');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/planning/staff-pools'] });
      toast({
        title: "Teamgroep verwijderd",
        description: "De teamgroep is succesvol verwijderd",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle form submit
  const handleCreatePool = (e) => {
    e.preventDefault();
    
    if (!newPoolName.trim()) {
      toast({
        title: "Validatiefout",
        description: "Geef de teamgroep een naam",
        variant: "destructive"
      });
      return;
    }
    
    createPool.mutate({
      name: newPoolName,
      description: newPoolDescription,
      isPrivate: isPrivatePool,
      createdBy: user?.id
    });
  };

  // Renderhelper voor leden aantal
  const renderMemberCount = (pool) => {
    return (
      <div className="flex items-center mt-2 text-muted-foreground text-sm">
        <Users className="h-4 w-4 mr-1.5" />
        <span>
          {pool.memberCount || 0} {pool.memberCount === 1 ? 'lid' : 'leden'}
        </span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teamgroepen</h1>
        <Button onClick={() => setShowNewPoolDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Teamgroep
        </Button>
      </div>

      {/* Zoekbalk */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10"
          placeholder="Zoek naar teamgroepen..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Teamgroepen laden...</div>
      ) : filteredPools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map((pool) => (
            <Card key={pool.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{pool.name}</CardTitle>
                  {pool.isPrivate && <Badge variant="outline">Privé</Badge>}
                </div>
                {renderMemberCount(pool)}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {pool.description || "Geen beschrijving"}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                  <span>Aangemaakt op {new Date(pool.createdAt).toLocaleDateString('nl-NL')}</span>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/planning/staffpools/${pool.id}`)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Leden bekijken
                  </Button>
                  {canManagePool(pool) && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePool.mutate(pool.id)}
                      disabled={deletePool.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? 
            "Geen teamgroepen gevonden die overeenkomen met je zoekopdracht." :
            "Er zijn nog geen teamgroepen aangemaakt."
          }
          <div className="mt-4">
            <Button onClick={() => setShowNewPoolDialog(true)}>
              Maak je eerste teamgroep aan
            </Button>
          </div>
        </div>
      )}

      {/* Create Pool Dialog */}
      <Dialog open={showNewPoolDialog} onOpenChange={setShowNewPoolDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreatePool}>
            <DialogHeader>
              <DialogTitle>Nieuwe Teamgroep</DialogTitle>
              <DialogDescription>
                Maak een nieuwe teamgroep om medewerkers te organiseren voor diensten.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Naam
                </label>
                <Input
                  id="name"
                  placeholder="Naam van de teamgroep"
                  className="col-span-3"
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">
                  Beschrijving
                </label>
                <Input
                  id="description"
                  placeholder="Optionele beschrijving"
                  className="col-span-3"
                  value={newPoolDescription}
                  onChange={(e) => setNewPoolDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="isPrivate" className="text-right">
                  Privé
                </label>
                <div className="flex items-center col-span-3">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    className="mr-2"
                    checked={isPrivatePool}
                    onChange={(e) => setIsPrivatePool(e.target.checked)}
                  />
                  <label htmlFor="isPrivate" className="text-sm text-muted-foreground">
                    Alleen zichtbaar voor jou en teamleden
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewPoolDialog(false)}>
                Annuleren
              </Button>
              <Button type="submit" disabled={createPool.isPending}>
                {createPool.isPending ? "Bezig met aanmaken..." : "Aanmaken"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}