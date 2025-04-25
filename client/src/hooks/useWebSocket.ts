import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { setWsAuthenticatedStatus } from '@/lib/queryClient';

interface Notification {
  type: string;
  message: string;
  timestamp: string;
  data?: any;
}

interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  notifications: Notification[];
  clearNotifications: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  // Functie om notificaties te wissen
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    // Maak verbinding alleen als er een gebruiker is ingelogd
    if (!user) {
      setConnected(false);
      setConnecting(false);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    // Voorkom dubbele verbindingen
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnecting(true);

    // Bepaal het juiste protocol op basis van HTTPS/HTTP
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Maak een nieuwe verbinding
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket verbinding geopend');
      setConnected(true);
      setConnecting(false);
      
      // Authenticeer de verbinding
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id,
        userRole: user.role
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket bericht ontvangen:', data);
        
        // Update WebSocket authenticatie status als we een auth_success bericht ontvangen
        if (data.type === 'auth_success') {
          setWsAuthenticatedStatus(true);
          console.log('WebSocket authenticatie succesvol, headers zullen nu worden toegevoegd aan API-verzoeken');
        }
        // Verwerk alleen notificaties, niet auth berichten
        else if (data.type) {
          setNotifications(prev => [...prev, data]);
        }
      } catch (error) {
        console.error('Fout bij verwerken WebSocket bericht:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket verbinding gesloten');
      setConnected(false);
      setConnecting(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket fout:', error);
      setConnected(false);
      setConnecting(false);
    };

    // Cleanup functie
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user]);

  return {
    connected,
    connecting,
    notifications,
    clearNotifications
  };
};