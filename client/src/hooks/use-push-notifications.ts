import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    error: null
  });

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      // Basic notification support check
      const hasNotification = 'Notification' in window;
      
      // More lenient check for Safari/iOS
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      
      // Consider supported if we have at least basic notifications
      const isSupported = hasNotification && (hasServiceWorker || hasPushManager);
      
      console.log('Push notification support check:', {
        hasNotification,
        hasServiceWorker,
        hasPushManager,
        isSupported,
        userAgent: navigator.userAgent
      });
      
      setState(prev => ({ ...prev, isSupported }));
    };

    checkSupport();
  }, []);

  // Register service worker
  useEffect(() => {
    if (state.isSupported && isAuthenticated) {
      registerServiceWorker();
    }
  }, [state.isSupported, isAuthenticated]);

  const registerServiceWorker = async () => {
    try {
      // Try to register service worker if available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered:', registration);
        
        // Check if already subscribed (if PushManager is available)
        if ('PushManager' in window && registration.pushManager) {
          const subscription = await registration.pushManager.getSubscription();
          setState(prev => ({ ...prev, isSubscribed: !!subscription }));
        } else {
          // Fallback for Safari - just enable basic notification permission
          const permission = await Notification.requestPermission();
          setState(prev => ({ ...prev, isSubscribed: permission === 'granted' }));
        }
      } else {
        // Fallback for browsers without service worker
        const permission = await Notification.requestPermission();
        setState(prev => ({ ...prev, isSubscribed: permission === 'granted' }));
      }
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      // Try basic notification permission as fallback
      try {
        const permission = await Notification.requestPermission();
        setState(prev => ({ ...prev, isSubscribed: permission === 'granted' }));
      } catch (fallbackError) {
        setState(prev => ({ 
          ...prev, 
          error: 'Notificatie registratie mislukt' 
        }));
      }
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = useCallback(async () => {
    if (!state.isSupported || !isAuthenticated) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission geweigerd');
      }

      // Check if we have push manager support
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Get VAPID public key from server
        const vapidResponse = await fetch('/api/push/vapid-key', {
          credentials: 'include'
        });
        
        if (!vapidResponse.ok) {
          throw new Error('Kan VAPID key niet ophalen');
        }
        
        const { publicKey } = await vapidResponse.json();
        
        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        // Send subscription to server
        const subscribeResponse = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
            }
          })
        });

        if (!subscribeResponse.ok) {
          throw new Error('Server subscription mislukt');
        }

        setState(prev => ({ 
          ...prev, 
          isSubscribed: true, 
          isLoading: false 
        }));
        
        console.log('Push notifications geactiveerd');
        return true;
      } else {
        // Fallback for Safari/browsers without push manager
        // Just register basic notification permission
        const fallbackResponse = await fetch('/api/push/subscribe-basic', {
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

        setState(prev => ({ 
          ...prev, 
          isSubscribed: true, 
          isLoading: false 
        }));
        
        console.log('Basis notificaties geactiveerd (Safari fallback)');
        return true;
      }

    } catch (error) {
      console.error('Push subscription error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Abonnement mislukt' 
      }));
      return false;
    }
  }, [state.isSupported, isAuthenticated]);

  const unsubscribe = useCallback(async () => {
    if (!state.isSupported || !isAuthenticated) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe from push service
        await subscription.unsubscribe();
        
        // Tell server to remove subscription
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: false, 
        isLoading: false 
      }));
      
      console.log('Push notifications gedeactiveerd');
      return true;

    } catch (error) {
      console.error('Push unsubscription error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Uitschrijven mislukt' 
      }));
      return false;
    }
  }, [state.isSupported, isAuthenticated]);

  const sendTestNotification = useCallback(async (type: string = 'test') => {
    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          userId: 2, // Test with current user
          type 
        })
      });

      if (!response.ok) {
        throw new Error('Test notificatie mislukt');
      }

      const result = await response.json();
      console.log('Test notification sent:', result.message);
      return true;

    } catch (error) {
      console.error('Test notification error:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Test notificatie mislukt' 
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
}