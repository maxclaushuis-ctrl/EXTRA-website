import { useAuth } from '@/contexts/AuthContext';
import extraYellowLogo from '@/assets/extra-logo-yellow.svg';
import extraPattern from '@/assets/extra-pattern.svg';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function PointsHeader() {
  const { user } = useAuth();
  const points = user?.points || 0;
  const { toast } = useToast();

  // Test functie om punten toe te voegen
  const handleAddPoints = async () => {
    if (!user) return;
    
    try {
      // API aanroep om punten toe te voegen aan de gebruiker
      const response = await fetch(`/api/users/${user.id}/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          points: 25, 
          description: 'Test punten toevoeging'
        }),
        credentials: 'include',
      });
      
      if (response.ok) {
        toast({
          title: "Opdracht verzonden",
          description: "Punten worden toegevoegd. WebSocket update volgt...",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Fout bij toevoegen punten",
          description: errorData.message || "Er is een fout opgetreden",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fout bij het toevoegen van punten:", error);
      toast({
        title: "Fout bij toevoegen punten",
        description: "Er is een fout opgetreden bij het toevoegen van punten",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative w-full">
      {/* Blauwe achtergrond met patroon */}
      <div className="w-full h-48 blue-gradient-bg relative overflow-hidden extra-pattern-bg">
        {/* EXTRA logo in het midden */}
        <div className="flex justify-center items-center h-full">
          <img 
            src={extraYellowLogo} 
            alt="EXTRA" 
            className="w-48 h-auto"
          />
        </div>
      </div>

      {/* Zwarte box met punten die over de banner heen valt */}
      <div className="absolute bottom-0 left-0 right-0 transform translate-y-1/2 px-4">
        <div className="bg-black text-white rounded-lg shadow-lg p-4">
          <div className="text-gray-400 text-sm font-medium">EXTRA punten</div>
          <div className="text-white text-4xl font-bold mt-1">{points}</div>
          
          {/* Test knop om punten toe te voegen - alleen zichtbaar in ontwikkelomgeving */}
          {import.meta.env.DEV && (
            <Button
              onClick={handleAddPoints}
              variant="outline"
              className="mt-2 bg-green-800 hover:bg-green-700 border-none text-white"
              size="sm"
            >
              Test: +25 punten
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}