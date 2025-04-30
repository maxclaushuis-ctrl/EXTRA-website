import { useLocation, Link } from 'wouter';
import { useState } from 'react';
import { ArrowLeft, Settings, Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [currentLanguage, setCurrentLanguage] = useState('Nederlands');

  const goBack = () => {
    window.history.back();
  };

  const changeLanguage = (language: string) => {
    setCurrentLanguage(language);
    // Hier zou je normaal gesproken een taal-service aanroepen
    console.log(`Taal veranderd naar: ${language}`);
  };

  return (
    <header className="w-full bg-black text-white py-3 px-4 flex justify-between items-center">
      <div className="w-1/4 flex items-center">
        {showBackButton && (
          <button 
            onClick={goBack} 
            className="text-white mr-3"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center focus:outline-none">
            <Globe size={20} className="text-[#c8ff00]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-gray-900 border-gray-800 text-white">
            <DropdownMenuItem 
              className="flex items-center justify-between"
              onClick={() => changeLanguage('Nederlands')}
            >
              Nederlands
              {currentLanguage === 'Nederlands' && <Check size={16} className="ml-2 text-[#c8ff00]" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center justify-between"
              onClick={() => changeLanguage('English')}
            >
              English
              {currentLanguage === 'English' && <Check size={16} className="ml-2 text-[#c8ff00]" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center justify-between"
              onClick={() => changeLanguage('Español')}
            >
              Español
              {currentLanguage === 'Español' && <Check size={16} className="ml-2 text-[#c8ff00]" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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