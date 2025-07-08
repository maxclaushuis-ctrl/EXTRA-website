import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Check, X } from 'lucide-react';

export function SafariNotificationTest() {
  const [isTestingBasic, setIsTestingBasic] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const testBasicNotification = async () => {
    setIsTestingBasic(true);
    setTestResults([]);
    
    try {
      // Request permission first
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Show a test notification
        const notification = new Notification('EXTRAATJE Test', {
          body: 'Dit is een test notificatie vanuit Safari! 🎉',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          requireInteraction: false
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        setTestResults(['✅ Notificatie toestemming verkregen', '✅ Test notificatie verzonden']);
        
        // Also register with server
        try {
          const response = await fetch('/api/push/subscribe-basic', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              type: 'basic',
              userAgent: navigator.userAgent
            })
          });

          if (response.ok) {
            setTestResults(prev => [...prev, '✅ Server registratie voltooid']);
          }
        } catch (error) {
          setTestResults(prev => [...prev, '⚠️ Server registratie mislukt (maar notificaties werken lokaal)']);
        }
      } else {
        setTestResults(['❌ Notificatie toestemming geweigerd']);
      }
    } catch (error) {
      setTestResults(['❌ Fout bij testen: ' + (error as Error).message]);
    } finally {
      setIsTestingBasic(false);
    }
  };

  const testBrowserSupport = () => {
    const results = [];
    
    if ('Notification' in window) {
      results.push('✅ Basis notificaties ondersteund');
    } else {
      results.push('❌ Basis notificaties niet ondersteund');
    }
    
    if ('serviceWorker' in navigator) {
      results.push('✅ Service Worker ondersteund');
    } else {
      results.push('❌ Service Worker niet ondersteund');
    }
    
    if ('PushManager' in window) {
      results.push('✅ Push Manager ondersteund');
    } else {
      results.push('⚠️ Push Manager niet ondersteund (Safari limitatie)');
    }
    
    results.push(`📱 Browser: ${navigator.userAgent.includes('Safari') ? 'Safari' : 'Andere'}`);
    results.push(`🔔 Huidige toestemming: ${Notification.permission}`);
    
    setTestResults(results);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Safari Notificatie Test
        </CardTitle>
        <CardDescription>
          Test of notificaties werken in jouw browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testBrowserSupport}
            variant="outline"
            className="flex-1"
          >
            Check Support
          </Button>
          <Button 
            onClick={testBasicNotification}
            disabled={isTestingBasic}
            className="flex-1"
          >
            {isTestingBasic ? 'Testen...' : 'Test Notificatie'}
          </Button>
        </div>
        
        {testResults.length > 0 && (
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm">
                    {result}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p><strong>Safari/iOS:</strong> Gebruikt basis notificaties</p>
          <p><strong>Chrome/Firefox:</strong> Gebruikt push notifications</p>
        </div>
      </CardContent>
    </Card>
  );
}