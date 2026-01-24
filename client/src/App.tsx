import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

// Pagina's
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import EmployeesPage from "@/pages/admin/Employees";
import RewardsPage from "@/pages/admin/Rewards";
import DiscountsPage from "@/pages/admin/Discounts";
import ChallengesPage from "@/pages/AdminChallenges";
import AdminChallengesSync from "@/pages/AdminChallengesSync";
import RulesPage from "@/pages/admin/Rules";
import CandidatesPage from "@/pages/admin/Candidates";
import SollicitatieFormulier from "@/pages/SollicitatieFormulier";
import DashboardMockup from "@/pages/DashboardMockup";
import PitchPresentation from "@/pages/PitchPresentation";

import AnalyticsPage from "@/pages/admin/Analytics";
import SettingsPage from "@/pages/admin/Settings";
import WerkruimtePage from "@/pages/admin/Werkruimte";

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
      navigate("/login");
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
        <Route path="/login" component={Login} />
        <Route path="/sollicitatieformulier" component={SollicitatieFormulier} />
        <Route path="/pitch" component={PitchPresentation} />
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
        
        {/* Admin routes */}
        <Route path="/admin">
          {() => <ProtectedRoute component={AdminDashboard} adminOnly={true} />}
        </Route>
        <Route path="/admin/employees">
          {() => <ProtectedRoute component={EmployeesPage} adminOnly={true} />}
        </Route>
        <Route path="/admin/rewards">
          {() => <ProtectedRoute component={RewardsPage} adminOnly={true} />}
        </Route>
        <Route path="/admin/discounts">
          {() => <ProtectedRoute component={DiscountsPage} adminOnly={true} />}
        </Route>
        <Route path="/admin/challenges">
          {() => <ProtectedRoute component={ChallengesPage} adminOnly={true} />}
        </Route>
        <Route path="/admin/challenges/sync">
          {() => <ProtectedRoute component={AdminChallengesSync} adminOnly={true} />}
        </Route>
        <Route path="/admin/candidates">
          {() => <ProtectedRoute component={CandidatesPage} adminOnly={true} />}
        </Route>
        <Route path="/admin/rules">
          {() => <ProtectedRoute component={RulesPage} adminOnly={true} />}
        </Route>

        <Route path="/admin/analytics">
          {() => <ProtectedRoute component={AnalyticsPage} adminOnly={true} />}
        </Route>
        <Route path="/admin/settings">
          {() => <ProtectedRoute component={SettingsPage} adminOnly={true} />}
        </Route>
        <Route path="/admin/werkruimte">
          {() => <ProtectedRoute component={WerkruimtePage} adminOnly={true} />}
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
