import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

// Pagina's
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import SollicitatieFormulier from "@/pages/SollicitatieFormulier";
import DashboardMockup from "@/pages/DashboardMockup";
import Brochure from "@/pages/Brochure";
import BrochureEN from "@/pages/BrochureEN";
import BrochureEvents from "@/pages/BrochureEvents";
import LandingPage from "@/pages/LandingPage";
import PersoneelGezocht from "@/pages/PersoneelGezocht";
import PersoneelsAanvraag from "@/pages/PersoneelsAanvraag";
import Aanmelden from "@/pages/Aanmelden";
import NieuwsPage from "@/pages/NieuwsPage";
import NieuwsArtikel from "@/pages/NieuwsArtikel";
import Extraatje from "@/pages/Extraatje";
import OverExtra from "@/pages/OverExtra";
import OnsTeam from "@/pages/OnsTeam";
import HoeExtraWerkt from "@/pages/HoeExtraWerkt";
import IkZoekExtraWerk from "@/pages/IkZoekExtraWerk";
import HoeWerktDagbetaling from "@/pages/HoeWerktDagbetaling";

import UserProfile from "@/pages/user/Profile";
import Rewards from "@/pages/user/Rewards";
import RewardDetail from "@/pages/employee/RewardDetail";
import History from "@/pages/user/History";
import LeaderboardPage from "@/pages/LeaderboardPage";



// Contexts
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MilestoneProvider } from "@/contexts/MilestoneContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Beschermde route component
function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: 
  { component: React.ComponentType<any>, adminOnly?: boolean, [key: string]: any }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/");
    } else if (!isLoading && adminOnly && user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, adminOnly, user, navigate]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Laden...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (adminOnly && user?.role !== "admin") {
    return null;
  }

  return <Component {...rest} />;
}

// Notificatie en navigatie componenten
import NotificationToast from "@/components/NotificationToast";
import { MainNav } from "@/components/MainNav";


function Router() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  
  // Bepaal of we op de medewerker dashboard pagina zijn, daar willen we geen navigatie tonen
  const isEmployeeDashboard = location === '/dashboard' && user?.role !== 'admin';
  
  // Check of we op een planningspagina zijn
  const isPlanningPage = location.startsWith('/planning');

  // Dashboard mockup heeft eigen navigatie
  const isDashboardMockup = location.startsWith('/dashboard-mockup');

  // Publieke pagina's krijgen nooit de interne nav te zien
  const isPublicPage = ['/landing', '/personeel-gezocht', '/personeelsaanvraag', '/aanmelden', '/brochure', '/brochures', '/events', '/nieuws', '/extraatje', '/over-extra', '/hoe-extra-werkt', '/ik-zoek-extra-werk', '/hoe-werkt-dagbetaling'].some(
    p => location === p || location.startsWith(p + '/')
  );
  
  return (
    <>
      {/* Notificatie en navigatie, maar niet op employee dashboard, dashboard mockup of publieke pagina's */}
      {isAuthenticated && !isEmployeeDashboard && !isPlanningPage && !isDashboardMockup && !isPublicPage && (
        <>
          <MainNav />
          <NotificationToast />
        </>
      )}
      
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sollicitatieformulier" component={SollicitatieFormulier} />
        <Route path="/brochure" component={Brochure} />
        <Route path="/brochures" component={BrochureEN} />
        <Route path="/events" component={BrochureEvents} />
        <Route path="/landing" component={LandingPage} />
        <Route path="/personeel-gezocht" component={PersoneelGezocht} />
        <Route path="/personeelsaanvraag" component={PersoneelsAanvraag} />
        <Route path="/aanmelden" component={Aanmelden} />
        <Route path="/nieuws" component={NieuwsPage} />
        <Route path="/nieuws/:slug" component={NieuwsArtikel} />
        <Route path="/extraatje" component={Extraatje} />
        <Route path="/hoe-extra-werkt" component={HoeExtraWerkt} />
        <Route path="/ik-zoek-extra-werk" component={IkZoekExtraWerk} />
        <Route path="/hoe-werkt-dagbetaling" component={HoeWerktDagbetaling} />
        <Route path="/over-extra/ons-team" component={OnsTeam} />
        <Route path="/over-extra" component={OverExtra} />
        <Route path="/dashboard-mockup" component={DashboardMockup} />
        
        {/* Gebruiker routes */}
        <Route path="/dashboard">
          {() => <ProtectedRoute component={Dashboard} />}
        </Route>
        <Route path="/profile">
          {() => <ProtectedRoute component={UserProfile} />}
        </Route>
        <Route path="/rewards">
          {() => <ProtectedRoute component={Rewards} />}
        </Route>
        <Route path="/employee/rewards/:id">
          {() => <ProtectedRoute component={RewardDetail} />}
        </Route>
        <Route path="/history">
          {() => <ProtectedRoute component={History} />}
        </Route>
        <Route path="/leaderboard">
          {() => <ProtectedRoute component={LeaderboardPage} />}
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MilestoneProvider>
          <Router />
        </MilestoneProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
