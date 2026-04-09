import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/use-analytics";

export default function Home() {
  const [_, navigate] = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { trackPageView } = useAnalytics();
  
  // Track page view
  useEffect(() => {
    trackPageView({
      path: "/",
      variant: "a"
    });
  }, [trackPageView]);
  
  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user && user.role !== 'admin') {
        // Medewerkers gaan naar hun eigen dashboard
        navigate('/mijn-dashboard');
      } else if (!isAuthenticated) {
        // Niet ingelogd → landingspagina
        navigate('/landing');
      }
      // Admins blijven op de landingspagina (geen automatische redirect naar /dashboard)
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  // This component only serves as a redirect, so we don't render anything
  return null;
}
