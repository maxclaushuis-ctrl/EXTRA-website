import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}