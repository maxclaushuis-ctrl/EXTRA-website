import { useState } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, TestTube, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { SafariNotificationTest } from './SafariNotificationTest';

export function PushNotificationSettings() {
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    error, 
    subscribe, 
    unsubscribe, 
    sendTestNotification 
  } = usePushNotifications();
  const { toast } = useToast();
  const [testType, setTestType] = useState('test');
  const [isTesting, setIsTesting] = useState(false);

  const handleToggleNotifications = async () => {
    const success = isSubscribed ? await unsubscribe() : await subscribe();
    
    if (success) {
      toast({
        title: isSubscribed ? 'Notificaties uitgeschakeld' : 'Notificaties ingeschakeld',
        description: isSubscribed 
          ? 'Je ontvangt geen push notificaties meer'
          : 'Je ontvangt nu push notificaties voor belangrijke updates',
      });
    } else {
      toast({
        title: 'Fout',
        description: error || 'Er ging iets mis bij het wijzigen van de notificatie-instellingen',
        variant: 'destructive',
      });
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    const success = await sendTestNotification(testType);
    
    if (success) {
      toast({
        title: 'Test notificatie verzonden',
        description: 'Check je notificaties om te zien of het werkt',
      });
    } else {
      toast({
        title: 'Test mislukt',
        description: error || 'Er ging iets mis bij het verzenden van de test notificatie',
        variant: 'destructive',
      });
    }
    setIsTesting(false);
  };

  if (!isSupported) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellOff className="h-5 w-5" />
              Push Notificaties
            </CardTitle>
            <CardDescription>
              Je browser ondersteunt geen push notificaties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Push notificaties zijn niet beschikbaar in deze browser
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Safari test component */}
        <SafariNotificationTest />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notificaties
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? "Actief" : "Inactief"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Ontvang real-time notificaties voor achievements, challenges en leaderboard updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications" className="text-base">
              Push Notificaties
            </Label>
            <div className="text-sm text-muted-foreground">
              Krijg notificaties voor belangrijke updates
            </div>
          </div>
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Notification Types Info */}
        {isSubscribed && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Je ontvangt notificaties voor:</Label>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>🎉 Achievement behaald (punten verdiend)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>🎯 Challenge voortgang updates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>🏆 Leaderboard positie wijzigingen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>🎁 Nieuwe beloningen beschikbaar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>💪 Dagelijkse motivatie berichten</span>
              </div>
            </div>
          </div>
        )}

        {/* Test Notifications */}
        {isSubscribed && (
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">Test Notificaties</Label>
            <div className="flex items-center gap-2">
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Kies test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Algemene Test</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="challenge">Challenge Update</SelectItem>
                  <SelectItem value="leaderboard">Leaderboard</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleTestNotification}
                disabled={isTesting}
                variant="outline"
                size="sm"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verzenden...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Verzenden
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Test of push notificaties correct werken op je apparaat
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Notificatie-instellingen worden bijgewerkt...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}