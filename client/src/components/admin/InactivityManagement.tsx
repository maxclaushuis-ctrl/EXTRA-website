import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Clock, Users, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface InactivityUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  points: number;
  lastActivityDate: string | null;
  inactivityResetOverride: boolean;
}

interface InactivityReport {
  usersChecked: number;
  usersReset: number;
  usersSkipped: number;
  details: {
    userId: number;
    name: string;
    lastActivity: string | null;
    pointsReset: number;
    reason: string;
  }[];
}

export default function InactivityManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReport, setShowReport] = useState(false);

  // Get users at risk of inactivity reset
  const { data: warningUsers, isLoading: loadingWarnings } = useQuery<InactivityUser[]>({
    queryKey: ['/api/admin/inactivity/warnings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/inactivity/warnings');
      if (!response.ok) throw new Error('Failed to fetch inactivity warnings');
      return response.json();
    }
  });

  // Run inactivity check mutation
  const inactivityCheckMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/inactivity/check', {
        method: 'POST'
      });
    },
    onSuccess: (data: InactivityReport) => {
      setShowReport(true);
      toast({
        title: 'Inactiviteitscontrole voltooid',
        description: `${data.usersReset} gebruikers gereset, ${data.usersSkipped} overgeslagen`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inactivity/warnings'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij inactiviteitscontrole',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Toggle inactivity override mutation
  const toggleOverrideMutation = useMutation({
    mutationFn: async ({ userId, override }: { userId: number; override: boolean }) => {
      return await apiRequest(`/api/admin/users/${userId}/inactivity-override`, {
        method: 'PATCH',
        body: { override }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inactivity/warnings'] });
      toast({
        title: 'Override bijgewerkt',
        description: 'Inactivity override status is bijgewerkt'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij bijwerken override',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const formatLastActivity = (dateString: string | null) => {
    if (!dateString) return 'Nooit';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Vandaag';
    if (diffDays === 1) return 'Gisteren';
    if (diffDays < 30) return `${diffDays} dagen geleden`;
    if (diffDays < 90) return `${Math.floor(diffDays / 30)} maanden geleden`;
    return `${Math.floor(diffDays / 30)} maanden geleden`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inactiviteitsbeheer</h2>
          <p className="text-muted-foreground">
            Beheer automatische punt resets voor inactieve gebruikers (3+ maanden geen activiteit)
          </p>
        </div>
        <Button
          onClick={() => inactivityCheckMutation.mutate()}
          disabled={inactivityCheckMutation.isPending}
          className="gap-2"
        >
          {inactivityCheckMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          Voer inactiviteitscontrole uit
        </Button>
      </div>

      {/* Warning Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Gebruikers met inactiviteitsrisico
          </CardTitle>
          <CardDescription>
            Gebruikers die binnen 2 weken hun punten kunnen verliezen wegens inactiviteit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingWarnings ? (
            <div className="text-center py-4">Laden...</div>
          ) : !warningUsers || warningUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>Geen gebruikers met inactiviteitsrisico</p>
            </div>
          ) : (
            <div className="space-y-4">
              {warningUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {user.firstName} {user.lastName}
                      </h4>
                      {user.inactivityResetOverride && (
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Override actief
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Punten: <strong>{user.points}</strong></span>
                      <span>Laatste activiteit: <strong>{formatLastActivity(user.lastActivityDate)}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Override:</span>
                      <Switch
                        checked={user.inactivityResetOverride}
                        onCheckedChange={(checked) =>
                          toggleOverrideMutation.mutate({
                            userId: user.id,
                            override: checked
                          })
                        }
                        disabled={toggleOverrideMutation.isPending}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Report */}
      {showReport && inactivityCheckMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Laatste inactiviteitsrapport</CardTitle>
            <CardDescription>
              Resultaten van de laatste inactiviteitscontrole
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{inactivityCheckMutation.data.usersChecked}</div>
                <div className="text-sm text-muted-foreground">Gecontroleerd</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{inactivityCheckMutation.data.usersReset}</div>
                <div className="text-sm text-muted-foreground">Gereset</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{inactivityCheckMutation.data.usersSkipped}</div>
                <div className="text-sm text-muted-foreground">Overgeslagen</div>
              </div>
            </div>
            
            {inactivityCheckMutation.data.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Details:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {inactivityCheckMutation.data.details.map((detail, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      <div className="flex justify-between">
                        <span className="font-medium">{detail.name}</span>
                        {detail.pointsReset > 0 && (
                          <span className="text-red-600">-{detail.pointsReset} punten</span>
                        )}
                      </div>
                      <div className="text-muted-foreground">{detail.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Gebruikers verliezen automatisch hun punten als ze 3 maanden geen activiteit hebben gehad.
          Admins kunnen een override instellen om specifieke gebruikers uit te sluiten van deze regel.
        </AlertDescription>
      </Alert>
    </div>
  );
}