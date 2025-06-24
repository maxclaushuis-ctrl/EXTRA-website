import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; userData?: User }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    async function loadUser() {
      try {
        console.log('Controleren of gebruiker is ingelogd...');
        
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Belangrijk: zorgt dat cookies worden meegestuurd
        });
        
        console.log('Login check response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Ingelogde gebruiker gevonden:', data);
          setUser(data);
          toast({
            title: 'Welkom terug',
            description: `Ingelogd als ${data.firstName} ${data.lastName}`,
          });
        } else {
          console.log('Geen ingelogde gebruiker gevonden, status:', response.status);
          const errorText = await response.text();
          console.log('Error details:', errorText);
        }
      } catch (error) {
        console.error('Error tijdens gebruiker ophalen:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [toast]);

  // Login function
  async function login(email: string, password: string): Promise<{ success: boolean; userData?: User }> {
    setIsLoading(true);
    try {
      // Gebruik gewone fetch om de login te doen
      console.log('AuthContext - login poging voor:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Belangrijk: zorgt dat cookies worden bewaard
      });

      // Debug response status
      console.log('AuthContext - login response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext - login succesvol, data:', data);
        
        // Voeg ontbrekende punten toe aan de gebruiker als het een medewerker is
        const userWithPoints = {
          ...data.user,
          // Standaard 500 punten voor de medewerker login
          points: data.user.email === 'medewerker@extra.nl' ? 500 : (data.user.points || 0)
        };
        
        console.log('User met punten:', userWithPoints);
        
        // Stel user in met data.user informatie inclusief punten
        setUser(userWithPoints);
        
        // Nu even controleren of we daadwerkelijk met het juiste account zijn ingelogd
        try {
          const meResponse = await fetch('/api/auth/me', {
            credentials: 'include',
          });
          
          if (meResponse.ok) {
            const meData = await meResponse.json();
            console.log('AuthContext - /me check gelukt, gebruikersgegevens:', meData);
            // Update user met volledige data
            setUser(meData);
          } else {
            console.warn('AuthContext - /me check mislukt maar login was succesvol, vreemd!');
          }
        } catch (meError) {
          console.error('AuthContext - fout bij controleren van login via /me endpoint:', meError);
        }
        
        toast({
          title: 'Ingelogd!',
          description: `Welkom ${data.user.firstName}`,
        });
        return { success: true, userData: userWithPoints };
      } else {
        let errorMessage = 'Ongeldige inloggegevens';
        try {
          const errorData = await response.json();
          console.log('AuthContext - login mislukt, error data:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (err) {
          console.error('AuthContext - kon error data niet parsen:', err);
        }
        
        toast({
          title: 'Login mislukt',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false };
      }
    } catch (error) {
      console.error('AuthContext - login error:', error);
      toast({
        title: 'Login mislukt',
        description: 'Er is een fout opgetreden bij het inloggen',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }

  // Logout function
  async function logout(): Promise<void> {
    try {
      // Gebruik directe fetch met credentials om sessie-cookie mee te sturen
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        setUser(null);
        toast({
          title: 'Uitgelogd',
          description: 'Je bent succesvol uitgelogd',
        });
      } else {
        console.error('Logout response not OK:', response.status);
        // Reset user state toch maar voor het geval er iets mis is met de sessie
        setUser(null);
        toast({
          title: 'Uitloggen',
          description: 'Uitgelogd, maar er was een probleem met de server',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Reset user state toch maar voor het geval er iets mis is
      setUser(null);
      toast({
        title: 'Uitloggen mislukt',
        description: 'Er is een fout opgetreden bij het uitloggen',
        variant: 'destructive',
      });
    }
  }

  // WebSocket setup for realtime updates
  useEffect(() => {
    // Als gebruiker is ingelogd, maak een WebSocket verbinding
    if (user) {
      // Maak de WebSocket verbinding
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('WebSocket verbinding maken met:', wsUrl);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Event handlers
      socket.onopen = () => {
        console.log('WebSocket verbinding succesvol');
        
        // Authenticeer de verbinding met gebruikers-ID
        socket.send(JSON.stringify({
          type: 'auth',
          userId: user.id,
          userRole: user.role
        }));
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket bericht ontvangen:', message);
          
          // Verwerk verschillende soorten berichten
          if (message.type === 'auth_success') {
            console.log('WebSocket authenticatie succesvol');
          } 
          // Verwerk punten updates
          else if (message.type === 'points_update' && message.data && message.data.userId === user.id) {
            console.log('Punten update ontvangen:', message.data);
            
            // Update de gebruiker met nieuwe punten
            setUser(prevUser => {
              if (!prevUser) return null;
              
              const updatedUser = {
                ...prevUser,
                points: message.data.points,
                monthlyPoints: message.data.monthlyPoints || prevUser.monthlyPoints || 0
              };
              
              console.log('Gebruiker bijgewerkt met nieuwe punten:', updatedUser);
              return updatedUser;
            });
            
            // Toon notificatie
            toast({
              title: 'Punten bijgewerkt',
              description: message.message,
            });
          }
        } catch (error) {
          console.error('Fout bij verwerken WebSocket bericht:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket fout:', error);
      };
      
      socket.onclose = () => {
        console.log('WebSocket verbinding gesloten');
      };
      
      // Cleanup functie
      return () => {
        console.log('Cleanup WebSocket verbinding');
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
          socketRef.current = null;
        }
      };
    }
    
    // Als er geen gebruiker is, maak geen verbinding
    return undefined;
  }, [user?.id, toast]); // Alleen opnieuw verbinding maken als gebruiker ID verandert

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}