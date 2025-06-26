import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Trophy, Target, Users, Share, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// Define types based on actual schema
type Challenge = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  steps?: ChallengeStep[];
};

type ChallengeStep = {
  id: number;
  challengeId: number;
  stepNumber: number;
  targetValue: number;
  pointsReward: number;
  title?: string;
  description?: string;
};

const categoryIcons = {
  diensten: Trophy,
  "last-minute": Target,
  referrals: Users,
  social: Share,
} as const;

export function Challenges() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  // Form states
  const [newChallengeTitle, setNewChallengeTitle] = useState("");
  const [newChallengeDescription, setNewChallengeDescription] = useState("");
  const [newChallengeCategory, setNewChallengeCategory] = useState("");
  const [newChallengePoints, setNewChallengePoints] = useState(100);
  const [newChallengeStatus, setNewChallengeStatus] = useState("active");

  // Fetch challenges
  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/admin/challenges"],
  });

  // Create challenge mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (challengeData: any) => {
      return apiRequest(`/api/admin/challenges`, {
        method: "POST",
        body: JSON.stringify(challengeData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/challenges"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Challenge aangemaakt",
        description: "De nieuwe challenge is succesvol aangemaakt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij aanmaken challenge",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewChallengeTitle("");
    setNewChallengeDescription("");
    setNewChallengeCategory("");
    setNewChallengePoints(100);
    setNewChallengeStatus("active");
  };

  const handleCreateChallenge = () => {
    if (!newChallengeTitle.trim()) {
      toast({
        title: "Titel vereist",
        description: "Voer een titel in voor de challenge.",
        variant: "destructive",
      });
      return;
    }

    createChallengeMutation.mutate({
      title: newChallengeTitle,
      description: newChallengeDescription,
      category: newChallengeCategory,
      points: newChallengePoints,
      status: newChallengeStatus,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Challenges</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Challenges</h2>
          <p className="text-muted-foreground">
            Beheer uitdagingen en doelen voor medewerkers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/challenges/sync">
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchronisatie
            </Link>
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Nieuwe Challenge Aanmaken</DialogTitle>
                <DialogDescription>
                  Maak een nieuwe challenge aan voor medewerkers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={newChallengeTitle}
                    onChange={(e) => setNewChallengeTitle(e.target.value)}
                    placeholder="Bijv. Draai 10 diensten"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={newChallengeDescription}
                    onChange={(e) => setNewChallengeDescription(e.target.value)}
                    placeholder="Beschrijf de challenge..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categorie</Label>
                  <Select value={newChallengeCategory} onValueChange={setNewChallengeCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diensten">Diensten draaien</SelectItem>
                      <SelectItem value="last-minute">Last-minute inzet</SelectItem>
                      <SelectItem value="referrals">Vrienden aandragen</SelectItem>
                      <SelectItem value="social">Social media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Punten</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newChallengePoints}
                    onChange={(e) => setNewChallengePoints(parseInt(e.target.value) || 100)}
                    placeholder="Aantal punten voor deze challenge"
                    min="1"
                  />
                  <p className="text-sm text-muted-foreground">
                    Het aantal punten dat medewerkers krijgen bij voltooiing van deze challenge
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newChallengeStatus} onValueChange={setNewChallengeStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="inactive">Inactief</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateChallenge}
                  disabled={createChallengeMutation.isPending}
                >
                  {createChallengeMutation.isPending ? "Bezig..." : "Challenge Aanmaken"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => {
          const IconComponent = categoryIcons[challenge.category as keyof typeof categoryIcons] || Trophy;
          
          return (
            <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <Badge variant={challenge.status === "active" ? "default" : "secondary"}>
                      {challenge.status === "active" ? "Actief" : "Inactief"}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{challenge.title}</CardTitle>
                {challenge.description && (
                  <CardDescription>{challenge.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Categorie: {challenge.category}
                  </div>
                  {challenge.steps && challenge.steps.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">{challenge.steps.length}</span> stappen
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Geen challenges gevonden
          </h3>
          <p className="text-muted-foreground mb-4">
            Maak je eerste challenge aan om medewerkers te motiveren.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Eerste Challenge Aanmaken
          </Button>
        </div>
      )}
    </div>
  );
}