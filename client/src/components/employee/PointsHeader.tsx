import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import extraYellowLogo from '@/assets/extra-logo-yellow.svg';
import extraPattern from '@/assets/extra-pattern.svg';
import bannerExtraatje from '@/assets/Banner_Extraatje.jpg';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { BronzeBadge, SilverBadge, GoldBadge } from '@/components/ui/badges';

export function PointsHeader() {
  const { user } = useAuth();
  const points = user?.points || 0;
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Mijlpalen voor puntensysteem
  const milestones = [0, 500, 1000, 2500, 5000, 10000];
  
  // Badges voor mijlpalen
  const badges = {
    1000: { name: 'Bronze', icon: <BronzeBadge size={50} /> },
    2500: { name: 'Silver', icon: <SilverBadge size={50} /> },
    5000: { name: 'Gold', icon: <GoldBadge size={50} /> }
  };
  
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
  
  // Bereken progressie percentage voor de voortgangsbalk
  const calculateProgress = (pts: number) => {
    const { current, next } = getCurrentAndNextMilestone(pts);
    
    // Als de huidige punten precies op een mijlpaal zitten, toon 100%
    if (pts === current && current > 0) {
      return 100;
    }
    
    // Bereken percentage van voortgang tussen huidige en volgende mijlpaal
    const totalRange = next - current;
    const currentProgress = pts - current;
    
    // Voorkom delen door nul
    if (totalRange === 0) return 0;
    
    // Bereken percentage en rond af naar beneden
    const percentage = Math.floor((currentProgress / totalRange) * 100);
    
    // Beperk percentage tussen 0 en 100
    return Math.max(0, Math.min(100, percentage));
  };
  
  // Bereken volgende mijlpaal
  const getNextMilestone = (pts: number) => {
    const { next } = getCurrentAndNextMilestone(pts);
    return next;
  };
  
  // Bepaal het huidige badge niveau
  const getCurrentBadge = (pts: number) => {
    if (pts >= 5000) return badges[5000];
    if (pts >= 2500) return badges[2500];
    if (pts >= 1000) return badges[1000];
    return null;
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
      const duration = Math.min(300 + (endValue - startValue) * 2, 800); // Max 800ms, faster for smaller amounts
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
      </div>

      {/* Zwarte box met punten die over de banner heen valt */}
      <div className="absolute bottom-0 left-0 right-0 transform translate-y-3/4 px-4">
        <div className="bg-black text-white rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-gray-400 text-sm font-medium">{t('common.extraPoints')}</div>
              <div className={`text-white text-4xl font-bold mt-1 ${animating ? 'text-cyan-400' : ''}`} 
                   style={{ transition: 'color 0.5s ease' }}>
                {displayPoints}
              </div>
            </div>
            
            {/* Badge display */}
            {getCurrentBadge(points) && (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center bg-gray-800 rounded-full p-1">
                  {getCurrentBadge(points)?.icon}
                </div>
                <div className="text-xs text-white mt-1 font-medium">
                  {getCurrentBadge(points)?.name && t(`common.badges.${getCurrentBadge(points)?.name}`)}
                </div>
              </div>
            )}
          </div>
          
          {/* Mijlpaal voortgangsbalk */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">
                {t('common.currentPoints')}: <span className="text-white font-medium">{getCurrentAndNextMilestone(points).current}</span>
              </span>
              <span className="text-gray-400">
                {t('common.nextMilestone')}: <span className="text-cyan-400 font-medium">{getNextMilestone(points)}</span>
              </span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`bg-[#00AAFF] h-full ${animating ? 'animate-pulse' : ''}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}