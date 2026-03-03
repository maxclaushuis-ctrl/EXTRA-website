import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  isIOSSafari: boolean;
  isIOSPWA: boolean;
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    error: null,
    isIOSSafari: false,
    isIOSPWA: false,
  });

  // Cache VAPID key and SW registration to avoid async calls during user gesture
  const vapidKeyRef = useRef<string | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafariEngine = /WebKit/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
    const isIOSSafari = isIOS && isSafariEngine;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    const isIOSPWA = isIOSSafari && isStandalone;

    const hasNotification = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;

    const isSupported = isIOSSafari
      ? isIOSPWA && hasNotification && hasServiceWorker
      : hasNotification && hasServiceWorker;

    console.log('Push support check:', { hasNotification, hasServiceWorker, isIOSSafari, isIOSPWA, isSupported });
    setState(prev => ({ ...prev, isSupported, isIOSSafari, isIOSPWA }));
  }, []);

  // Pre-load VAPID key and service worker registration when authenticated
  useEffect(() => {
    if (!state.isSupported || !isAuthenticated) return;

    const preload = async () => {
      try {
        // Register service worker
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('Service Worker geregistreerd:', reg.scope);

          // Wait for it to become active
          const readyReg = await navigator.serviceWorker.ready;
          swRegistrationRef.current = readyReg;

          // Check existing subscription
          if ('PushManager' in window && readyReg.pushManager) {
            const existing = await readyReg.pushManager.getSubscription();
            if (existing) {
              setState(prev => ({ ...prev, isSubscribed: true }));
            }
          }
        }

        // Pre-fetch VAPID key
        const response = await fetch('/api/push/vapid-key', { credentials: 'include' });
        if (response.ok) {
          const { publicKey } = await response.json();
          vapidKeyRef.current = publicKey;
          console.log('VAPID key voorgeladen');
        }
      } catch (err) {
        console.error('Preload service worker/VAPID mislukt:', err);
      }
    };

    preload();
  }, [state.isSupported, isAuthenticated]);

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
    if (!isAuthenticated) {
      console.warn('Subscribe geblokkeerd: niet ingelogd');
      return false;
    }
    if (!state.isSupported) {
      console.warn('Subscribe geblokkeerd: push niet ondersteund');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Request permission (user gesture context)
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      if (permission !== 'granted') {
        throw new Error('Meldingen zijn geblokkeerd. Geef toestemming in je instellingen.');
      }

      // Step 2: Get service worker (should be pre-loaded, use cached or get fresh)
      let registration = swRegistrationRef.current;
      if (!registration) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Service worker timeout na 10s')), 10000)
          );
          registration = await Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
          swRegistrationRef.current = registration;
        } catch (swErr) {
          throw new Error(`Service worker niet beschikbaar: ${swErr instanceof Error ? swErr.message : String(swErr)}`);
        }
      }

      // Step 3: Get VAPID key (should be pre-loaded, use cached or fetch fresh)
      let publicKey = vapidKeyRef.current;
      if (!publicKey) {
        const vapidResponse = await fetch('/api/push/vapid-key', { credentials: 'include' });
        if (!vapidResponse.ok) {
          throw new Error(`Kan serversleutel niet ophalen (${vapidResponse.status})`);
        }
        const data = await vapidResponse.json();
        publicKey = data.publicKey;
        vapidKeyRef.current = publicKey;
      }

      // Step 4: Unsubscribe existing (if any)
      try {
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
          console.log('Oud abonnement verwijderd');
        }
      } catch (unsubErr) {
        console.warn('Oud abonnement verwijderen mislukt (doorgaan):', unsubErr);
      }

      // Step 5: Create new push subscription (critical: must happen close to user gesture)
      let subscription: PushSubscription;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey!)
        });
        console.log('Push abonnement aangemaakt:', subscription.endpoint.slice(0, 50) + '...');
      } catch (subErr) {
        const msg = subErr instanceof Error ? subErr.message : String(subErr);
        throw new Error(`Abonnement aanmaken mislukt: ${msg}`);
      }

      // Step 6: Save subscription to server
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        const errText = await subscribeResponse.text();
        throw new Error(`Server kon abonnement niet opslaan (${subscribeResponse.status}): ${errText}`);
      }

      setState(prev => ({ ...prev, isSubscribed: true, isLoading: false, error: null }));
      console.log('Push notifications geactiveerd en opgeslagen');
      return true;

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Abonnement mislukt';
      console.error('Push subscription fout:', msg);
      setState(prev => ({ ...prev, isLoading: false, error: msg }));
      return false;
    }
  }, [state.isSupported, isAuthenticated]);

  const unsubscribe = useCallback(async () => {
    if (!state.isSupported || !isAuthenticated) return false;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const registration = swRegistrationRef.current || await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
      setState(prev => ({ ...prev, isSubscribed: false, isLoading: false }));
      console.log('Push notifications gedeactiveerd');
      return true;
    } catch (error) {
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: 2, type })
      });
      if (!response.ok) throw new Error('Test notificatie mislukt');
      const result = await response.json();
      console.log('Test notification sent:', result.message);
      return true;
    } catch (error) {
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
