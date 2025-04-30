import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import extraYellowLogo from '@/assets/extra-logo-yellow.svg';
import extraPattern from '@/assets/extra-pattern.svg';
import bannerExtraatje from '@/assets/Banner_Extraatje.jpg';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export function PointsHeader() {
  const { user } = useAuth();
  const points = user?.points || 0;
  const { toast } = useToast();
  
  // Mijlpalen voor puntensysteem
  const milestones = [0, 100, 250, 500, 1000, 2500, 5000, 10000];
  
  // State voor geanimeerde progressbar
  const [progress, setProgress] = useState(0);
  const [animating, setAnimating] = useState(false);
  
  // Bereken huidige mijlpaal en volgende mijlpaal
  const getCurrentAndNextMilestone = (pts: number) => {
    // Vind de eerstvolgende mijlpaal die hoger is dan de huidige punten
    const nextMilestoneIndex = milestones.findIndex(milestone => milestone > pts);
    
    // Als alle mijlpalen zijn bereikt, gebruik de laatste als next en de een-na-laatste als current
    if (nextMilestoneIndex === -1) {
      return {
        current: milestones[milestones.length - 2],
        next: milestones[milestones.length - 1]
      };
    }
    
    // Anders is de huidige mijlpaal de vorige van de volgende
    return {
      current: milestones[Math.max(0, nextMilestoneIndex - 1)],
      next: milestones[nextMilestoneIndex]
    };
  };
  
  // Bereken progressie percentage
  const calculateProgress = (pts: number) => {
    const { current, next } = getCurrentAndNextMilestone(pts);
    
    // Bereken percentage van voortgang tussen huidige en volgende mijlpaal
    const totalRange = next - current;
    const currentProgress = pts - current;
    const percentage = Math.floor((currentProgress / totalRange) * 100);
    
    // Beperk percentage tussen 0 en 100
    return Math.max(0, Math.min(100, percentage));
  };
  
  // Bereken volgende mijlpaal
  const getNextMilestone = (pts: number) => {
    const { next } = getCurrentAndNextMilestone(pts);
    return next;
  };
  
  // State voor geanimeerde puntenteller
  const [displayPoints, setDisplayPoints] = useState(points);
  
  // Update progress bar wanneer punten veranderen
  useEffect(() => {
    const newProgress = calculateProgress(points);
    
    // Trigger animatie als het een positieve verandering is
    if (points > displayPoints) {
      // Start animatie
      setAnimating(true);
      
      // Teller animatie voor punten (van huidige naar nieuwe waarde)
      let startValue = displayPoints;
      const endValue = points;
      const duration = 1000;
      const startTime = Date.now();
      
      const countUp = () => {
        const now = Date.now();
        const elapsedTime = now - startTime;
        
        if (elapsedTime < duration) {
          // Bereken tussentijdse waarde (met easing)
          const progress = elapsedTime / duration;
          // Easing functie: cubic-bezier
          const easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);
          
          setDisplayPoints(currentValue);
          requestAnimationFrame(countUp);
        } else {
          // Animatie compleet
          setDisplayPoints(endValue);
        }
      };
      
      // Start count-up animatie
      requestAnimationFrame(countUp);
      
      // Reset pulse animatie na een bepaalde tijd
      setTimeout(() => setAnimating(false), 1500);
    }
    
    setProgress(newProgress);
  }, [points, displayPoints]);

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
      {/* Banner afbeelding */}
      <div className="w-full h-48 relative overflow-hidden">
        {/* Banner achtergrond */}
        <img 
          src={bannerExtraatje}
          alt="EXTRA Banner" 
          className="w-full h-full object-cover"
        />
        
        {/* EXTRAATJE tekst centraal in Poppins Extra Bold */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl font-black text-[#c8ff00]" 
            style={{ 
              fontFamily: 'Poppins, sans-serif', 
              fontWeight: 900,
              textShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
            }}
          >
            EXTRAATJE
          </h1>
        </div>
      </div>

      {/* Zwarte box met punten die over de banner heen valt */}
      <div className="absolute bottom-0 left-0 right-0 transform translate-y-3/4 px-4">
        <div className="bg-black text-white rounded-lg shadow-lg p-4">
          <div className="text-gray-400 text-sm font-medium">EXTRA punten</div>
          <div className={`text-white text-4xl font-bold mt-1 ${animating ? 'text-cyan-400' : ''}`} 
               style={{ transition: 'color 0.5s ease' }}>
            {displayPoints}
          </div>
          
          {/* Mijlpaal voortgangsbalk */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Huidige punten</span>
              <span className="text-gray-400">
                Volgende mijlpaal: <span className="text-cyan-400 font-medium">{getNextMilestone(points)}</span>
              </span>
            </div>
            <Progress 
              value={progress} 
              className={`h-2 ${animating ? 'animate-pulse' : ''}`}
              style={{
                background: animating 
                  ? 'linear-gradient(90deg, #22d3ee 0%, #3b82f6 100%)' 
                  : 'linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)'
              }}
            />
          </div>
          
          {/* Test knop om punten toe te voegen - alleen zichtbaar in ontwikkelomgeving */}
          {import.meta.env.DEV && (
            <Button
              onClick={handleAddPoints}
              variant="outline"
              className="mt-3 bg-green-800 hover:bg-green-700 border-none text-white"
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