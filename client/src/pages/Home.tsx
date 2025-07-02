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
      if (isAuthenticated && user) {
        // User is already logged in, redirect to appropriate dashboard
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        // User is not logged in, redirect to login page
        navigate('/login');
      }
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
