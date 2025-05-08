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
  UserCircle,
  LayoutDashboard,
  Users,
  Gift,
  LineChart,
  Settings,
  LogOut,
  Mail,
  Tag,
  BarChart,
  ClipboardList,
  FileCheck,
  Calendar,
  Building,
  MapPin,
  Briefcase,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function MainNav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'admin';

  if (!user) return null;

  const getInitials = () => {
    if (!user.firstName || !user.lastName) return 'U';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  return (
    <div className="flex items-center justify-between w-full py-3 px-4 border-b">
      <div className="flex items-center gap-6">
        <div className="font-bold text-lg">EXTRAATJE</div>
        
        {isAdmin && (
          <nav className="hidden md:flex gap-6 text-sm">
            <Link
              href="/admin"
              className={`transition-colors hover:text-primary ${
                location === "/admin" ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/planning/dashboard"
              className={`transition-colors hover:text-primary ${
                location.startsWith("/planning") ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              Planning
            </Link>
            <Link
              href="/admin/rewards"
              className={`transition-colors hover:text-primary ${
                location === "/admin/rewards" ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              Beloningen
            </Link>
            <Link
              href="/admin/discounts"
              className={`transition-colors hover:text-primary ${
                location === "/admin/discounts" ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              Kortingsacties
            </Link>
            <Link
              href="/admin/werkruimte"
              className={`transition-colors hover:text-primary ${
                location === "/admin/werkruimte" ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              Werkruimte
            </Link>
            <Link
              href="/admin/twv"
              className={`transition-colors hover:text-primary ${
                location === "/admin/twv" ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              TWV's
            </Link>
            <Link
              href="/admin/marketing"
              className={`transition-colors hover:text-primary ${
                location === "/admin/marketing" ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              Marketing
            </Link>
            <Link
              href="/admin/settings"
              className={`transition-colors hover:text-primary ${
                location === "/admin/settings" ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              Instellingen
            </Link>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-2 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Navigatie</DropdownMenuLabel>
            {isAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/werkruimte">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Werkruimte
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/twv">
                    <FileCheck className="mr-2 h-4 w-4" />
                    TWV's
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/marketing">
                    <Mail className="mr-2 h-4 w-4" />
                    Marketing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Instellingen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Planning Systeem</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/planning/dashboard">
                    <Calendar className="mr-2 h-4 w-4" />
                    Planning Dashboard
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
                <DropdownMenuLabel className="text-xs text-muted-foreground">Andere pagina's</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/admin/contacts">
                    <Users className="mr-2 h-4 w-4" />
                    Contacten
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/transactions">
                    <BarChart className="mr-2 h-4 w-4" />
                    Transacties
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/rewards">
                    <Gift className="mr-2 h-4 w-4" />
                    Beloningen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/discounts">
                    <Tag className="mr-2 h-4 w-4" />
                    Kortingsacties
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/analytics">
                    <LineChart className="mr-2 h-4 w-4" />
                    Analytics
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials()}</AvatarFallback>
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
  );
}