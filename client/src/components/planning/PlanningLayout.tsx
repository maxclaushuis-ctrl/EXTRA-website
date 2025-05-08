import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  LogOut,
  Calendar,
  Building,
  MapPin,
  Briefcase,
  UserPlus,
  Users,
  LayoutDashboard,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReactNode } from "react";

interface PlanningLayoutProps {
  children: ReactNode;
}

export function PlanningLayout({ children }: PlanningLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'admin';

  if (!user) return null;

  const getInitials = () => {
    if (!user.firstName || !user.lastName) return 'U';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center bg-blue-600 text-white px-4 shadow-md">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/planning/dashboard" className="font-bold text-lg hover:text-blue-100">
              EXTRA Planning
            </Link>
            
            <nav className="hidden md:flex gap-6 text-sm">
              <Link
                href="/planning/dashboard"
                className={`transition-colors hover:text-blue-100 ${
                  location === "/planning/dashboard" ? "text-white font-medium" : "text-blue-100"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/planning/clients"
                className={`transition-colors hover:text-blue-100 ${
                  location.startsWith("/planning/clients") ? "text-white font-medium" : "text-blue-100"
                }`}
              >
                Opdrachtgevers
              </Link>
              <Link
                href="/planning/locations"
                className={`transition-colors hover:text-blue-100 ${
                  location.startsWith("/planning/locations") ? "text-white font-medium" : "text-blue-100"
                }`}
              >
                Locaties
              </Link>
              <Link
                href="/planning/shifts"
                className={`transition-colors hover:text-blue-100 ${
                  location.startsWith("/planning/shifts") ? "text-white font-medium" : "text-blue-100"
                }`}
              >
                Diensten
              </Link>
              <Link
                href="/planning/assignments"
                className={`transition-colors hover:text-blue-100 ${
                  location.startsWith("/planning/assignments") ? "text-white font-medium" : "text-blue-100"
                }`}
              >
                Inschrijvingen
              </Link>
              <Link
                href="/planning/staffpools"
                className={`transition-colors hover:text-blue-100 ${
                  location.startsWith("/planning/staffpools") ? "text-white font-medium" : "text-blue-100"
                }`}
              >
                Teamgroepen
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="text-sm hover:text-blue-100 hidden md:flex items-center"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span>Terug naar EXTRAATJE</span>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2 md:hidden text-white hover:text-blue-100">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Planning Menu</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/planning/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/planning/clients">
                    <Building className="mr-2 h-4 w-4" />
                    Opdrachtgevers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/planning/locations">
                    <MapPin className="mr-2 h-4 w-4" />
                    Locaties
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/planning/shifts">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Diensten
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/planning/assignments">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Inschrijvingen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/planning/staffpools">
                    <Users className="mr-2 h-4 w-4" />
                    Teamgroepen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Terug naar EXTRAATJE
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-blue-400">
                  <Avatar className="h-8 w-8 border-2 border-blue-400">
                    <AvatarFallback className="bg-blue-500 text-white">{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50">
        {children}
      </main>

      <footer className="py-4 px-6 text-center text-sm text-gray-500 border-t">
        EXTRA Planning System • {new Date().getFullYear()}
      </footer>
    </div>
  );
}