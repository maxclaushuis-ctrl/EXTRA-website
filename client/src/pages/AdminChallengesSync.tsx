import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Wifi, WifiOff, User, Users, Zap, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PlanningStatus {
  connected: boolean;
  message: string;
}

interface SyncResult {
  userId: number;
  challengeId: number;
  previousValue: number;
  newValue: number;
  stepsCompleted: number[];
  pointsAwarded: number;
  success: boolean;
  error?: string;
}

interface SyncSummary {
  totalUsers: number;
  successfulSyncs: number;
  errors: number;
  results: SyncResult[];
}

export default function AdminChallengesSync() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check planning system status
  const { data: planningStatus, isLoading: statusLoading } = useQuery<PlanningStatus>({
    queryKey: ["/api/admin/planning-status"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Get users list for individual sync
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Individual user sync mutation
  const syncUserMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("/api/admin/sync-challenges", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Synchronisatie voltooid",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Synchronisatie gefaald",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
    },
  });

  // Bulk sync mutation
  const syncAllMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/sync-challenges", {
      method: "POST",
      body: JSON.stringify({}),
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "Bulk synchronisatie voltooid",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk synchronisatie gefaald",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
    },
  });

  const handleUserSync = (userId: number) => {
    setSelectedUserId(userId);
    syncUserMutation.mutate(userId);
  };

  const handleBulkSync = () => {
    syncAllMutation.mutate();
  };

  if (statusLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Challenge Synchronisatie</h1>
        <p className="text-gray-600">Synchroniseer challenge voortgang met het plansysteem</p>
      </div>

      {/* Planning System Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {planningStatus?.connected ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                Planning System Status
              </CardTitle>
              <CardDescription>Verbindingsstatus met extern plansysteem</CardDescription>
            </div>
            <Badge variant={planningStatus?.connected ? "default" : "destructive"}>
              {planningStatus?.connected ? "Verbonden" : "Niet verbonden"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{planningStatus?.message}</p>
          {!planningStatus?.connected && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Let op:</strong> Het plansysteem is niet verbonden. Zorg ervoor dat de 
                PLANNING_API_URL en PLANNING_API_KEY environment variabelen correct zijn ingesteld.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk Synchronisatie
            </CardTitle>
            <CardDescription>
              Synchroniseer alle gebruikers in één keer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleBulkSync}
              disabled={syncAllMutation.isPending || !planningStatus?.connected}
              className="w-full"
            >
              {syncAllMutation.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Synchroniseren...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Synchroniseer Alle Gebruikers
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Individuele Synchronisatie
            </CardTitle>
            <CardDescription>
              Synchroniseer één specifieke gebruiker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.slice(0, 5).map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUserSync(user.id)}
                    disabled={
                      syncUserMutation.isPending && selectedUserId === user.id ||
                      !planningStatus?.connected
                    }
                  >
                    {syncUserMutation.isPending && selectedUserId === user.id ? (
                      <Clock className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
              {users.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  En {users.length - 5} andere gebruikers...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Information */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronisatie Informatie</CardTitle>
          <CardDescription>
            Hoe de automatische challenge synchronisatie werkt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Diensten Challenge</h4>
              <p className="text-sm text-gray-600">
                Synchroniseert met voltooide diensten uit het plansysteem.
                Telt alle shifts met status "completed".
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Last-minute Challenge</h4>
              <p className="text-sm text-gray-600">
                Synchroniseert met last-minute shifts uit het plansysteem.
                Telt shifts die als "isLastMinute" zijn gemarkeerd.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Vrienden Challenge</h4>
              <p className="text-sm text-gray-600">
                Synchroniseert met succesvolle referrals uit het plansysteem.
                Telt referrals met status "hired".
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Social Stories Challenge</h4>
              <p className="text-sm text-gray-600">
                Synchroniseert met geverifieerde social media posts.
                Telt posts die als "verified" zijn gemarkeerd.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Automatische Synchronisatie</h4>
            <p className="text-sm text-blue-800">
              Challenge voortgang wordt automatisch bijgewerkt wanneer medewerkers inloggen of 
              challenges bekijken. Je kunt ook handmatig synchroniseren met de knoppen hierboven.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}