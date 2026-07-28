import { useEffect } from "react";
import { useAnalytics } from "@/hooks/use-analytics";
import LandingPage from "@/pages/LandingPage";

/**
 * Homepage: rendert de landingscontent DIRECT op "/" (geen redirect meer naar
 * /landing — dat was een SEO-probleem: twee URL's met dezelfde content en een
 * homepage zonder eigen content). /landing 301't server-side naar "/".
 *
 * Géén automatische doorverwijzing meer voor ingelogde admins: de website is
 * altijd gewoon te bekijken; het dashboard bereik je bewust via /dashboard.
 */
export default function Home() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView({
      path: "/",
      variant: "a"
    });
  }, [trackPageView]);

  return <LandingPage />;
}
