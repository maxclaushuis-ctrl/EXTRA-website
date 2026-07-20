import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/use-analytics";
import LandingPage from "@/pages/LandingPage";

/**
 * Homepage: rendert de landingscontent DIRECT op "/" (geen redirect meer naar
 * /landing — dat was een SEO-probleem: twee URL's met dezelfde content en een
 * homepage zonder eigen content). /landing 301't server-side naar "/".
 *
 * Enige uitzondering: ingelogde admins worden nog steeds automatisch naar
 * /dashboard gestuurd, zodat de bestaande admin-flow blijft werken.
 */
export default function Home() {
  const [_, navigate] = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView({
      path: "/",
      variant: "a"
    });
  }, [trackPageView]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'admin') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  return <LandingPage />;
}
