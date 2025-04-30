import { useLocation, Link } from 'wouter';
import { ArrowLeft, Settings, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Language, languageNames } from '@/contexts/LanguageContext';
import { FlagIcon } from '@/components/ui/flag-icon';

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
  const { language, setLanguage } = useLanguage();

  const goBack = () => {
    window.history.back();
  };

  const changeLanguage = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    console.log(`Taal veranderd naar: ${languageNames[selectedLanguage]}`);
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
            <div className="rounded-sm overflow-hidden border border-white/30">
              <FlagIcon language={language} size={22} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-gray-900 border-gray-800 text-white">
            <DropdownMenuItem 
              className="flex items-center justify-between"
              onClick={() => changeLanguage('nl')}
            >
              <div className="flex items-center gap-2">
                <FlagIcon language="nl" size={16} className="rounded-sm" />
                <span>Nederlands</span>
              </div>
              {language === 'nl' && <Check size={16} className="ml-2 text-[#c8ff00]" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center justify-between"
              onClick={() => changeLanguage('en')}
            >
              <div className="flex items-center gap-2">
                <FlagIcon language="en" size={16} className="rounded-sm" />
                <span>English</span>
              </div>
              {language === 'en' && <Check size={16} className="ml-2 text-[#c8ff00]" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center justify-between"
              onClick={() => changeLanguage('es')}
            >
              <div className="flex items-center gap-2">
                <FlagIcon language="es" size={16} className="rounded-sm" />
                <span>Español</span>
              </div>
              {language === 'es' && <Check size={16} className="ml-2 text-[#c8ff00]" />}
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