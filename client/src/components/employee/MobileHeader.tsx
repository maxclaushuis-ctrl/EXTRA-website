import { useLocation, Link } from 'wouter';
import { ArrowLeft, Settings } from 'lucide-react';

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showSettings?: boolean;
}

export function MobileHeader({ 
  title = 'EXTRAATJE', 
  showBackButton = true,
  showSettings = true
}: MobileHeaderProps) {
  const [location, navigate] = useLocation();

  const goBack = () => {
    window.history.back();
  };

  return (
    <header className="w-full bg-black text-white py-3 px-4 flex justify-between items-center">
      <div className="w-1/4">
        {showBackButton && (
          <button 
            onClick={goBack} 
            className="text-white"
          >
            <ArrowLeft size={24} />
          </button>
        )}
      </div>
      
      <div className="w-2/4 text-center">
        <h1 
          className="text-white text-xl tracking-wide" 
          style={{ 
            fontFamily: 'Poppins, sans-serif', 
            fontWeight: 900,
            letterSpacing: '0.02em'
          }}
        >
          {title}
        </h1>
      </div>
      
      <div className="w-1/4 flex justify-end">
        {showSettings && (
          <Link href="/settings">
            <Settings size={24} className="text-[#c8ff00]" />
          </Link>
        )}
      </div>
    </header>
  );
}