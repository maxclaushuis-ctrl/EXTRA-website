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
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="h-5 w-5" />
          Push Notificaties
          <Badge variant={isSubscribed ? "default" : "secondary"} className={isSubscribed ? "bg-blue-600" : "bg-gray-600"}>
            {isSubscribed ? "Actief" : "Inactief"}
          </Badge>
        </CardTitle>
        <CardDescription className="text-gray-400">
          Ontvang real-time notificaties voor achievements, challenges en leaderboard updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications" className="text-base text-white">
              Push Notificaties
            </Label>
            <div className="text-sm text-gray-400">
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
            <Label className="text-sm font-medium text-gray-300">Je ontvangt notificaties voor:</Label>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-300">🎉 Achievement behaald (punten verdiend)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-300">🎯 Challenge voortgang updates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-300">🏆 Leaderboard positie wijzigingen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-300">🎁 Nieuwe beloningen beschikbaar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-300">💪 Dagelijkse motivatie berichten</span>
              </div>
            </div>
          </div>
        )}

        {/* Test Notifications */}
        {isSubscribed && (
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <Label className="text-sm font-medium text-gray-300">Test Notificaties</Label>
            <div className="flex items-center gap-2">
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger className="w-[200px] bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Kies test type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="test" className="text-white hover:bg-gray-600">Algemene Test</SelectItem>
                  <SelectItem value="achievement" className="text-white hover:bg-gray-600">Achievement</SelectItem>
                  <SelectItem value="challenge" className="text-white hover:bg-gray-600">Challenge Update</SelectItem>
                  <SelectItem value="leaderboard" className="text-white hover:bg-gray-600">Leaderboard</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleTestNotification}
                disabled={isTesting}
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
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
            <p className="text-xs text-gray-400">
              Test of push notificaties correct werken op je apparaat
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Notificatie-instellingen worden bijgewerkt...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}