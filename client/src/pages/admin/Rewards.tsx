import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Plus,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import AddRewardDialog from '@/components/AddRewardDialog';
import { Reward } from '@shared/schema';

export default function Rewards() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<number | null>(null);
  
  // Rewards ophalen
  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
    queryFn: async () => {
      const response = await fetch('/api/rewards');
      if (!response.ok) {
        throw new Error('Kon beloningen niet laden');
      }
      return response.json();
    },
  });

  // Delete reward mutatie
  const deleteRewardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/rewards/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Kon beloning niet verwijderen');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      toast({
        title: 'Beloning verwijderd',
        description: 'De beloning is succesvol verwijderd',
      });
      setRewardToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij verwijderen',
        description: error.message,
        variant: 'destructive',
      });
      setRewardToDelete(null);
    },
  });

  // Status label functie
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Beschikbaar</Badge>;
      case 'outofstock':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Niet op voorraad</Badge>;
      case 'hidden':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Verborgen</Badge>;
      default:
        return <Badge variant="outline">Onbekend</Badge>;
    }
  };

  // Beloningkaarten renderen
  const renderRewards = () => {
    if (isLoading) {
      return Array(6).fill(0).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mt-2 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ));
    }

    if (!rewards || rewards.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <Gift className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Geen beloningen gevonden</h3>
          <p className="mb-4 text-muted-foreground">
            Er zijn nog geen beloningen toegevoegd aan het systeem.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Beloning toevoegen
          </Button>
        </div>
      );
    }

    return rewards.map((reward) => (
      <Card key={reward.id} className="overflow-hidden">
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          {reward.imageUrl ? (
            <img 
              src={reward.imageUrl} 
              alt={reward.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Gift className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">{reward.name}</h3>
            <span className="font-semibold text-blue-600">{reward.pointsCost} punten</span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{reward.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusLabel(reward.status)}
              {reward.stock !== null && (
                <span className="text-xs text-muted-foreground">
                  Beschikbaar: {reward.stock}
                </span>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acties</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Bewerken
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => setRewardToDelete(reward.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Verwijderen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Beloningen</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Gift className="mr-2 h-4 w-4" />
          Nieuwe beloning toevoegen
        </Button>
      </div>

      {/* Beloningen grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {renderRewards()}
      </div>

      {/* Add dialog */}
      <AddRewardDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={rewardToDelete !== null} onOpenChange={() => setRewardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Beloning verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze beloning wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => rewardToDelete && deleteRewardMutation.mutate(rewardToDelete)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}