import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

// Pagina's
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import EmployeesPage from "@/pages/admin/Employees";
import RewardsPage from "@/pages/admin/Rewards";
import RulesPage from "@/pages/admin/Rules";
import MarketingPage from "@/pages/admin/Marketing";
import SettingsPage from "@/pages/admin/Settings";
import UserProfile from "@/pages/user/Profile";
import Rewards from "@/pages/user/Rewards";
import History from "@/pages/user/History";

// Auth context
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

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

function Router() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        
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
        <Route path="/history">
          {() => <ProtectedRoute component={History} />}
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
        <Route path="/admin/rules">
          {() => <ProtectedRoute component={RulesPage} adminOnly={true} />}
        </Route>
        <Route path="/admin/marketing">
          {() => <ProtectedRoute component={MarketingPage} adminOnly={true} />}
        </Route>
        <Route path="/admin/settings">
          {() => <ProtectedRoute component={SettingsPage} adminOnly={true} />}
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
