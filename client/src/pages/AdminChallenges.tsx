import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Trophy, Target, Users, Share, Sync } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
// Define types based on actual schema
type Challenge = {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  steps?: ChallengeStep[];
};

type ChallengeStep = {
  id: number;
  challengeId: number;
  stepNumber: number;
  targetValue: number;
  pointsReward: number;
  badgeTitle: string | null;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function AdminChallenges() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    category: "",
    status: "active"
  });
  const [newStep, setNewStep] = useState({
    stepNumber: 1,
    targetValue: 0,
    pointsReward: 0,
    description: ""
  });
  const [editingSteps, setEditingSteps] = useState<ChallengeStep[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const createChallengeMutation = useMutation({
    mutationFn: (challengeData: any) => apiRequest("/api/challenges", {
      method: "POST",
      body: JSON.stringify(challengeData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setIsCreateDialogOpen(false);
      setNewChallenge({ title: "", description: "", category: "", status: "active" });
      setEditingSteps([]);
      toast({
        title: "Challenge aangemaakt",
        description: "De nieuwe challenge is succesvol toegevoegd.",
      });
    },
  });

  const updateChallengeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/challenges/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setEditingChallenge(null);
      toast({
        title: "Challenge bijgewerkt",
        description: "De challenge is succesvol bijgewerkt.",
      });
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/challenges/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Challenge verwijderd",
        description: "De challenge is succesvol verwijderd.",
      });
    },
  });

  const handleCreateChallenge = () => {
    if (!newChallenge.title || !newChallenge.category) {
      toast({
        title: "Fout",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    createChallengeMutation.mutate({
      ...newChallenge,
      steps: editingSteps
    });
  };

  const handleUpdateChallenge = () => {
    if (!editingChallenge) return;

    updateChallengeMutation.mutate({
      id: editingChallenge.id,
      data: {
        title: editingChallenge.title,
        description: editingChallenge.description,
        category: editingChallenge.category,
        status: editingChallenge.status
      }
    });
  };

  const addStep = () => {
    const step: ChallengeStep = {
      id: Date.now(), // Temporary ID for new steps
      challengeId: editingChallenge?.id || 0,
      stepNumber: newStep.stepNumber,
      targetValue: newStep.targetValue,
      pointsReward: newStep.pointsReward,
      badgeTitle: null,
      description: newStep.description || `Stap ${newStep.stepNumber}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setEditingSteps([...editingSteps, step]);
    setNewStep({
      stepNumber: newStep.stepNumber + 1,
      targetValue: 0,
      pointsReward: 0,
      description: ""
    });
  };

  const removeStep = (stepId: number) => {
    setEditingSteps(editingSteps.filter(step => step.id !== stepId));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'diensten': return <Target className="h-4 w-4" />;
      case 'last-minute': return <Trophy className="h-4 w-4" />;
      case 'vrienden': return <Users className="h-4 w-4" />;
      case 'stories': return <Share className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'diensten': return 'Diensten draaien';
      case 'last-minute': return 'Last-minute inzet';
      case 'vrienden': return 'Vrienden aandragen';
      case 'stories': return 'Deel een story';
      default: return category;
    }
  };

  const filteredChallenges = challenges.filter((challenge: Challenge) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "active") return challenge.status === "active";
    if (selectedTab === "inactive") return challenge.status === "inactive";
    return challenge.category === selectedTab;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Challenges Beheer</h1>
          <p className="text-gray-600">Beheer uitdagingen en doelen voor medewerkers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/challenges/sync">
              <Sync className="mr-2 h-4 w-4" />
              Synchronisatie
            </Link>
          </Button>
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
                Maak een nieuwe challenge aan met stappen en beloningen.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Titel
                </Label>
                <Input
                  id="title"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  className="col-span-3"
                  placeholder="Bijv. Diensten draaien"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Categorie
                </Label>
                <Select
                  value={newChallenge.category}
                  onValueChange={(value) => setNewChallenge({ ...newChallenge, category: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecteer categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diensten">Diensten draaien</SelectItem>
                    <SelectItem value="last-minute">Last-minute inzet</SelectItem>
                    <SelectItem value="vrienden">Vrienden aandragen</SelectItem>
                    <SelectItem value="stories">Deel een story</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Beschrijving
                </Label>
                <Textarea
                  id="description"
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Beschrijving van de challenge..."
                />
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Challenge Stappen</h4>
                <div className="space-y-3">
                  {editingSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <span className="font-medium">Stap {step.stepNumber}:</span>
                      <span>Target {step.targetValue}</span>
                      <span className="text-blue-600">({step.pointsReward} punten)</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-4 gap-3 mt-3">
                  <Input
                    type="number"
                    placeholder="Target"
                    value={newStep.targetValue}
                    onChange={(e) => setNewStep({ ...newStep, targetValue: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    type="number"
                    placeholder="Punten"
                    value={newStep.pointsReward}
                    onChange={(e) => setNewStep({ ...newStep, pointsReward: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    placeholder="Beschrijving (optioneel)"
                    value={newStep.description}
                    onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                  />
                  <Button onClick={addStep} variant="outline" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Stap
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateChallenge}
                disabled={createChallengeMutation.isPending}
              >
                {createChallengeMutation.isPending ? "Bezig..." : "Challenge Aanmaken"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="active">Actief</TabsTrigger>
          <TabsTrigger value="inactive">Inactief</TabsTrigger>
          <TabsTrigger value="diensten">Diensten</TabsTrigger>
          <TabsTrigger value="last-minute">Last-minute</TabsTrigger>
          <TabsTrigger value="vrienden">Vrienden</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map((challenge: Challenge) => (
          <Card key={challenge.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(challenge.category)}
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                </div>
                <Badge variant={challenge.status === "active" ? "default" : "secondary"}>
                  {challenge.status === "active" ? "Actief" : "Inactief"}
                </Badge>
              </div>
              <CardDescription>{challenge.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Categorie:</strong> {getCategoryName(challenge.category)}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Aantal stappen:</strong> {challenge.steps?.length || 0}
                </div>
                {challenge.steps && challenge.steps.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <strong>Punten bereik:</strong> {Math.min(...challenge.steps.map((s: ChallengeStep) => s.pointsReward))} - {Math.max(...challenge.steps.map((s: ChallengeStep) => s.pointsReward))} punten
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingChallenge(challenge);
                    setEditingSteps(challenge.steps || []);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Bewerken
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteChallengeMutation.mutate(challenge.id)}
                  disabled={deleteChallengeMutation.isPending}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Verwijderen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingChallenge && (
        <Dialog open={!!editingChallenge} onOpenChange={() => setEditingChallenge(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Challenge Bewerken</DialogTitle>
              <DialogDescription>
                Wijzig de eigenschappen van deze challenge.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">
                  Titel
                </Label>
                <Input
                  id="edit-title"
                  value={editingChallenge.title}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Beschrijving
                </Label>
                <Textarea
                  id="edit-description"
                  value={editingChallenge.description}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <Select
                  value={editingChallenge.status}
                  onValueChange={(value) => setEditingChallenge({ ...editingChallenge, status: value })}
                >
                  <SelectTrigger className="col-span-3">
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
                type="submit"
                onClick={handleUpdateChallenge}
                disabled={updateChallengeMutation.isPending}
              >
                {updateChallengeMutation.isPending ? "Bezig..." : "Opslaan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}