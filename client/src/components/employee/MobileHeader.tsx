import { useLocation, Link } from 'wouter';
import { ArrowLeft, Settings } from 'lucide-react';

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showSettings?: boolean;
}

export function MobileHeader({ 
  title = 'EXTRA@JE', 
  showBackButton = true,
  showSettings = true
}: MobileHeaderProps) {
  const [location, navigate] = useLocation();

  const goBack = () => {
    window.history.back();
  };

  return (
    <header className="w-full bg-black text-white py-4 px-4 flex justify-between items-center">
      <div className="w-1/3">
        {showBackButton && (
          <button 
            onClick={goBack} 
            className="text-white"
          >
            <ArrowLeft size={24} />
          </button>
        )}
      </div>
      
      <div className="w-1/3 text-center">
        <h1 className="font-bold text-lg">{title}</h1>
      </div>
      
      <div className="w-1/3 flex justify-end">
        {showSettings && (
          <Link href="/settings">
            <Settings size={24} className="text-[#E0FF00]" />
          </Link>
        )}
      </div>
    </header>
  );
}