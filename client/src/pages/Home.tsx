import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/use-analytics";

export default function Home() {
  const [_, navigate] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { trackPageView } = useAnalytics();
  
  // Track page view
  useEffect(() => {
    trackPageView({
      path: "/",
      variant: "a"
    });
  }, [trackPageView]);
  
  // Iedereen die naar / gaat, sturen naar de landingspagina
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/landing');
      } else if (user?.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/landing');
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

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
