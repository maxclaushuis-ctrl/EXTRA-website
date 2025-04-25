import { useAuth } from '@/contexts/AuthContext';
import extraYellowLogo from '@/assets/extra-logo-yellow.svg';
import extraPattern from '@/assets/extra-pattern.svg';

export function PointsHeader() {
  const { user } = useAuth();
  const points = user?.points || 0;

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
        </div>
      </div>
    </div>
  );
}