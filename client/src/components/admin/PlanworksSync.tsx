import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, AlertCircle, CheckCircle, Zap, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PlanworksStatus {
  configured: boolean;
  available: boolean;
  lastSync: string | null;
  message: string;
}

interface SyncResult {
  challengeId: number;
  challengeTitle: string;
  previousValue: number;
  newValue: number;
  updated: boolean;
}

export default function PlanworksSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncingAll, setSyncingAll] = useState(false);

  // Get Planworks status
  const { data: status, isLoading, error } = useQuery<PlanworksStatus>({
    queryKey: ["/api/admin/planworks/status"],
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async (userId?: number) => {
      const body = userId ? { userId } : {};
      return await apiRequest('/api/admin/planworks/sync', 'POST', body);
    },
    onSuccess: (data) => {
      toast({
        title: 'Synchronisatie voltooid',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/planworks/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Synchronisatie mislukt',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setSyncingAll(false);
    }
  });

  const handleSyncAll = () => {
    setSyncingAll(true);
    syncMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Planworks status controleren...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Fout bij laden Planworks status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Planworks Integratie</CardTitle>
          </div>
          <Badge variant={status?.available ? "default" : "secondary"}>
            {status?.available ? "Actief" : "Inactief"}
          </Badge>
        </div>
        <CardDescription>
          Synchroniseer challenge voortgang met planning systeem data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {status?.configured ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {status?.configured ? "API Geconfigureerd" : "API Niet Geconfigureerd"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {status?.available ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              <span className="text-sm font-medium">
                {status?.available ? "Service Beschikbaar" : "Service Niet Beschikbaar"}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Laatste sync:</span>
              <span className="ml-2 text-muted-foreground">
                {status?.lastSync ? new Date(status.lastSync).toLocaleString('nl-NL') : "Nog niet gesynchroniseerd"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Status:</span>
              <span className="ml-2 text-muted-foreground">{status?.message}</span>
            </div>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            onClick={handleSyncAll}
            disabled={!status?.available || syncMutation.isPending || syncingAll}
            className="flex items-center gap-2"
          >
            {syncingAll ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            {syncingAll ? "Bezig met synchroniseren..." : "Sync alle medewerkers"}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/planworks/status"] })}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Status vernieuwen
          </Button>
        </div>

        {/* Help Text */}
        {!status?.configured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Planworks integratie niet geconfigureerd</p>
                <p className="text-yellow-700 mt-1">
                  Voeg de <code>PLANWORKS_API_KEY</code> en <code>PLANWORKS_API_URL</code> environment variabelen toe om Planworks integratie in te schakelen.
                </p>
                <p className="text-yellow-700 mt-2">
                  <strong>Zonder integratie:</strong> Challenges voor categorieën zoals "diensten", "overwerk" en "stiptheid" moeten handmatig worden bijgewerkt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature List */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Planworks gekoppelde challenges:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Diensten draaien</strong> - Totaal aantal gedraaide diensten</li>
            <li>• <strong>Overwerk uren</strong> - Extra gewerkte uren</li>
            <li>• <strong>Last-minute inzet</strong> - Spoedingevallen diensten</li>
            <li>• <strong>Stiptheid</strong> - Op tijd komen percentage</li>
            <li>• <strong>Beschikbaarheid</strong> - Beschikbaarheid percentage</li>
            <li>• <strong>Klantbeoordelingen</strong> - Gemiddelde beoordelingen</li>
            <li>• <strong>Training voltooiing</strong> - Voltooide trainingen</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}