import { useLocation, Link } from 'wouter';
import { ArrowLeft, Check, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Language, languageNames } from '@/contexts/LanguageContext';
import { FlagIcon } from '@/components/ui/flag-icon';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export function MobileHeader({ 
  title = 'EXTRAATJE', 
  showBackButton = true
}: MobileHeaderProps) {
  const [location, navigate] = useLocation();
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();

  const goBack = () => {
    window.history.back();
  };

  const changeLanguage = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    console.log(`Taal veranderd naar: ${languageNames[selectedLanguage]}`);
  };

  const getInitials = () => {
    if (!user?.firstName || !user?.lastName) return 'U';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
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
      
      <div className="w-1/4 flex justify-end items-center gap-3">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8 border border-[#c8ff00]">
                <AvatarFallback className="bg-[#c8ff00] text-black text-xs font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800 text-white">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs leading-none text-gray-400">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              
              <DropdownMenuItem asChild className="hover:bg-gray-800">
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span className="text-white">Mijn Profiel</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                onClick={logout}
                className="hover:bg-gray-800 text-red-400 hover:text-red-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Uitloggen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}