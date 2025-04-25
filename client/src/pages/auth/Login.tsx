import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import extraLogo from '@/assets/EXTRA_LOGO_BLAUW.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Vul alle velden in',
        description: 'E-mail en wachtwoord zijn vereist',
        variant: 'destructive',
      });
      return;
    }
    
    // Debug info tonen
    console.log('Login poging: Inloggen met', email);
    
    setIsSubmitting(true);
    
    try {
      // Direct fetch gebruiken in plaats van login functie voor volledige controle
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      console.log('Login response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login succesvol, gebruiker:', data.user);
        
        // Zorg dat auth context wordt bijgewerkt
        if (login) {
          await login(email, password);
        }
        
        // Navigeer op basis van de rol
        if (data.user.role === 'admin') {
          toast({
            title: 'Ingelogd als admin',
            description: `Welkom ${data.user.firstName}`,
          });
          navigate('/admin'); // Admin dashboard
        } else {
          toast({
            title: 'Ingelogd',
            description: `Welkom ${data.user.firstName}`,
          });
          navigate('/dashboard'); // Standaard (employee) dashboard
        }
      } else {
        const errorData = await response.json();
        console.error('Login mislukt:', errorData);
        toast({
          title: 'Login mislukt',
          description: errorData.message || 'Ongeldige inloggegevens',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login mislukt',
        description: 'Er is een fout opgetreden bij het inloggen',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center blue-gradient-bg">
      <Card className="w-full max-w-md shadow-lg">
        <div className="mx-auto mb-4 mt-6 flex justify-center">
          <img src={extraLogo} alt="EXTRA Logo" className="h-16" />
        </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Inloggen</CardTitle>
          <CardDescription>
            Log in op je account om punten te verzamelen en beloningen te ontvangen
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                placeholder="jouw@email.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Wachtwoord</Label>
                <Button variant="link" className="px-0 text-xs text-[#00AAFF]" type="button">
                  Wachtwoord vergeten?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-[#00AAFF] text-white hover:bg-[#0088CC]" 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inloggen...
                </>
              ) : (
                'Inloggen'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}