import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Award, Gift, TrendingUp } from 'lucide-react';
import { useAnalytics } from "@/hooks/use-analytics";

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { trackPageView } = useAnalytics();
  
  // Track page view
  useEffect(() => {
    trackPageView({
      path: "/",
      variant: "a"
    });
  }, [trackPageView]);
  
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
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Ingelogd!',
          description: `Welkom ${data.user.firstName}`,
        });
        
        // Redirect to appropriate dashboard based on role
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        const errorData = await response.json();
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="py-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Award className="h-10 w-10 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-900">BeloonX</h1>
            </div>
          </div>
          
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl font-bold text-slate-900">Welkom bij het BeloonX beloningssysteem</h2>
              <p className="mt-4 text-lg text-slate-600">
                Het moderne beloningssysteem voor bedrijven die hun medewerkers willen motiveren en waarderen.
              </p>
              
              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Stimuleer prestaties</h3>
                    <p className="text-slate-600">Beloon medewerkers voor hun harde werk en uitzonderlijke prestaties</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-100 p-2">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Verhoog betrokkenheid</h3>
                    <p className="text-slate-600">Zorg voor meer betrokkenheid en binding door erkenning en waardering</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-purple-100 p-2">
                    <Gift className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Aantrekkelijke beloningen</h3>
                    <p className="text-slate-600">Bied een scala aan beloningen die medewerkers kunnen inwisselen voor hun punten</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold">Inloggen</CardTitle>
                  <CardDescription>
                    Log in op je account om punten te verzamelen en te beheren
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
                        <Button variant="link" className="px-0 text-xs" type="button">
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
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Test gebruiker (medewerker): employee@example.com / password123</p>
                      <p>Test gebruiker (admin): admin@extra.nl / admin123</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" type="submit" disabled={isSubmitting}>
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
          </div>
        </div>
      </div>
    </div>
  );
}
