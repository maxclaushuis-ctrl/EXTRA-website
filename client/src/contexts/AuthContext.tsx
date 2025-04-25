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
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Belangrijk: zorgt dat cookies worden meegestuurd
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Current user data:', data);
          setUser(data);
        } else {
          console.log('Geen ingelogde gebruiker gevonden');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  // Login function
  async function login(email: string, password: string): Promise<{ success: boolean; userData?: User }> {
    setIsLoading(true);
    try {
      // Gebruik gewone fetch in plaats van apiRequest om de login problemen te vermijden
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Belangrijk: zorgt dat cookies worden bewaard
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        toast({
          title: 'Ingelogd!',
          description: `Welkom ${data.user.firstName}`,
        });
        return { success: true, userData: data.user };
      } else {
        const errorData = await response.json();
        toast({
          title: 'Login mislukt',
          description: errorData.message || 'Ongeldige inloggegevens',
          variant: 'destructive',
        });
        return { success: false };
      }
    } catch (error) {
      console.error('Login error:', error);
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
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
      toast({
        title: 'Uitgelogd',
        description: 'Je bent succesvol uitgelogd',
      });
    } catch (error) {
      console.error('Logout error:', error);
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