import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

// Pagina's
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import SollicitatieFormulier from "@/pages/SollicitatieFormulier";
import DashboardMockup from "@/pages/DashboardMockup";
import PitchPresentation from "@/pages/PitchPresentation";
import BusinessPresentation from "@/pages/BusinessPresentation";
import Brochure from "@/pages/Brochure";

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
  
  return (
    <>
      {/* Notificatie en navigatie, maar niet op employee dashboard */}
      {isAuthenticated && !isEmployeeDashboard && !isPlanningPage && (
        <>
          <MainNav />
          <NotificationToast />
        </>
      )}
      
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sollicitatieformulier" component={SollicitatieFormulier} />
        <Route path="/pitch" component={PitchPresentation} />
        <Route path="/presentatie" component={BusinessPresentation} />
        <Route path="/brochure" component={Brochure} />
        <Route path="/dashboard-mockup">
          {() => <ProtectedRoute component={DashboardMockup} adminOnly={true} />}
        </Route>
        
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
