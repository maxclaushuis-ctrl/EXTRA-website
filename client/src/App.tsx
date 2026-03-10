import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

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
import HotelPersoneelGezocht from "@/pages/HotelPersoneelGezocht";
import EventPersoneelGezocht from "@/pages/EventPersoneelGezocht";
import CateringPersoneelGezocht from "@/pages/CateringPersoneelGezocht";
import RestaurantPersoneelGezocht from "@/pages/RestaurantPersoneelGezocht";
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
import Vacatures from "@/pages/Vacatures";
import VacatureDetail from "@/pages/VacatureDetail";

import HorecaPersoneelGezocht from "@/pages/HorecaPersoneelGezocht";

// Kandidaat pagina's
import HorecaVacaturesAmsterdam from "@/pages/HorecaVacaturesAmsterdam";
import HorecaWerkAmsterdam from "@/pages/HorecaWerkAmsterdam";
import HousekeepingVacaturesAmsterdam from "@/pages/HousekeepingVacaturesAmsterdam";
import ChefVacaturesAmsterdam from "@/pages/ChefVacaturesAmsterdam";
import FrontOfficeVacaturesAmsterdam from "@/pages/FrontOfficeVacaturesAmsterdam";

// SEO pillar & landingspagina's
import HorecaUitzendbureau from "@/pages/HorecaUitzendbureau";
import HorecaPersoneelAmsterdamPage from "@/pages/HorecaPersoneelAmsterdamPage";
import HorecaPersoneelPage from "@/pages/HorecaPersoneelPage";
import FlexibelHorecaPersoneel from "@/pages/FlexibelHorecaPersoneel";
import WerkwijzePage from "@/pages/WerkwijzePage";

// Overige pagina's
import KlantcasesHoreca from "@/pages/KlantcasesHoreca";
import Contact from "@/pages/Contact";

import UserProfile from "@/pages/user/Profile";
import Rewards from "@/pages/user/Rewards";
import RewardDetail from "@/pages/employee/RewardDetail";
import History from "@/pages/user/History";
import LeaderboardPage from "@/pages/LeaderboardPage";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MilestoneProvider } from "@/contexts/MilestoneContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotificationToast from "@/components/NotificationToast";
import { MainNav } from "@/components/MainNav";

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

  if (isLoading) return <div className="flex h-screen items-center justify-center">Laden...</div>;
  if (!isAuthenticated) return null;
  if (adminOnly && user?.role !== "admin") return null;

  return <Component {...rest} />;
}

const PUBLIC_PATHS = [
  '/landing', '/personeel-gezocht', '/horeca-personeel-gezocht', '/personeelsaanvraag', '/aanmelden',
  '/hotel-personeel-gezocht', '/hotelpersoneel-inhuren', '/event-personeel-gezocht', '/eventpersoneel-inhuren', '/cateringpersoneel-gezocht', '/horecapersoneel-gezocht', '/restaurant-personeel-gezocht',
  '/brochure', '/brochures', '/events', '/nieuws', '/extraatje',
  '/over-extra', '/hoe-extra-werkt', '/ik-zoek-extra-werk',
  '/hoe-werkt-dagbetaling',
  // Kandidaat routes
  '/horeca-vacatures-amsterdam', '/horeca-werk-amsterdam',
  '/housekeeping-vacatures-amsterdam', '/chef-vacatures-amsterdam',
  '/front-office-vacatures-amsterdam', '/horecapersoneel-gezocht',
  // SEO routes
  '/horeca-uitzendbureau-amsterdam', '/horeca-uitzendbureau-amsterdam-werkwijze',
  '/horeca-personeel-amsterdam', '/horeca-personeel', '/flexibel-horeca-personeel',
  // Alias routes
  '/blog', '/onze-werkwijze', '/beloningssysteem', '/ons-team',
  // Overige
  '/klantcases-horeca', '/contact',
  // Vacatures
  '/vacatures',
];

function Router() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();

  const isEmployeeDashboard = location === '/dashboard' && user?.role !== 'admin';
  const isPlanningPage = location.startsWith('/planning');
  const isDashboardMockup = location.startsWith('/dashboard-mockup');
  const isPublicPage = PUBLIC_PATHS.some(p => location === p || location.startsWith(p + '/'));

  return (
    <>
      {isAuthenticated && !isEmployeeDashboard && !isPlanningPage && !isDashboardMockup && !isPublicPage && (
        <NotificationToast />
      )}

      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sollicitatieformulier" component={SollicitatieFormulier} />
        <Route path="/brochure" component={Brochure} />
        <Route path="/brochures" component={BrochureEN} />
        <Route path="/events" component={BrochureEvents} />
        <Route path="/landing" component={LandingPage} />

        {/* Werkgever routes */}
        <Route path="/horecapersoneel-gezocht" component={RestaurantPersoneelGezocht} />
        <Route path="/horeca-personeel-gezocht" component={PersoneelGezocht} />
        <Route path="/personeel-gezocht">{() => { window.location.replace('/horeca-personeel-gezocht'); return null; }}</Route>
        <Route path="/horeca-personeel-inhuren">{() => { window.location.replace('/horeca-personeel-gezocht'); return null; }}</Route>
        <Route path="/hotelpersoneel-inhuren" component={HotelPersoneelGezocht} />
        <Route path="/hotel-personeel-gezocht">{() => { window.location.replace('/hotelpersoneel-inhuren'); return null; }}</Route>
        <Route path="/hotel-personeel-amsterdam">{() => { window.location.replace('/hotelpersoneel-inhuren'); return null; }}</Route>
        <Route path="/eventpersoneel-inhuren" component={EventPersoneelGezocht} />
        <Route path="/event-personeel-gezocht">{() => { window.location.replace('/eventpersoneel-inhuren'); return null; }}</Route>
        <Route path="/evenementen-personeel-amsterdam">{() => { window.location.replace('/eventpersoneel-inhuren'); return null; }}</Route>
        <Route path="/catering-personeel-amsterdam">{() => { window.location.replace('/cateringpersoneel-gezocht'); return null; }}</Route>
        <Route path="/restaurant-personeel-amsterdam">{() => { window.location.replace('/restaurant-personeel-gezocht'); return null; }}</Route>
        <Route path="/restaurant-personeel-gezocht">{() => { window.location.replace('/horecapersoneel-gezocht'); return null; }}</Route>

        {/* Kandidaat routes */}
        <Route path="/horeca-vacatures-amsterdam" component={IkZoekExtraWerk} />
        <Route path="/horeca-werk-amsterdam" component={HorecaWerkAmsterdam} />
        <Route path="/housekeeping-vacatures-amsterdam" component={HousekeepingVacaturesAmsterdam} />
        <Route path="/chef-vacatures-amsterdam" component={ChefVacaturesAmsterdam} />
        <Route path="/front-office-vacatures-amsterdam" component={FrontOfficeVacaturesAmsterdam} />

        {/* SEO pillar & landingspagina's */}
        <Route path="/horeca-uitzendbureau-amsterdam" component={HorecaUitzendbureau} />
        <Route path="/horeca-uitzendbureau-amsterdam-werkwijze" component={WerkwijzePage} />
        <Route path="/horeca-personeel-amsterdam" component={HorecaPersoneelAmsterdamPage} />
        <Route path="/horeca-personeel" component={HorecaPersoneelPage} />
        <Route path="/flexibel-horeca-personeel" component={FlexibelHorecaPersoneel} />

        {/* Blog - primair op /blog, ook /nieuws behouden */}
        <Route path="/blog" component={NieuwsPage} />
        <Route path="/blog/:slug" component={NieuwsArtikel} />
        <Route path="/nieuws" component={NieuwsPage} />
        <Route path="/nieuws/:slug" component={NieuwsArtikel} />

        {/* Over EXTRA sub-routes */}
        <Route path="/over-extra/ons-team" component={OnsTeam} />
        <Route path="/over-extra" component={OverExtra} />
        <Route path="/onze-werkwijze" component={HoeExtraWerkt} />
        <Route path="/ons-team" component={OnsTeam} />
        <Route path="/beloningssysteem" component={Extraatje} />
        <Route path="/klantcases-horeca" component={KlantcasesHoreca} />

        {/* Overige publieke routes */}
        <Route path="/cateringpersoneel-gezocht" component={CateringPersoneelGezocht} />
        <Route path="/personeelsaanvraag" component={PersoneelsAanvraag} />
        <Route path="/aanmelden" component={Aanmelden} />
        <Route path="/extraatje" component={Extraatje} />
        <Route path="/hoe-extra-werkt" component={HoeExtraWerkt} />
        <Route path="/ik-zoek-extra-werk">{() => { window.location.replace('/horeca-vacatures-amsterdam'); return null; }}</Route>
        <Route path="/hoe-werkt-dagbetaling" component={HoeWerktDagbetaling} />
        <Route path="/vacatures" component={Vacatures} />
        <Route path="/vacatures/:slug" component={VacatureDetail} />
        <Route path="/contact" component={Contact} />
        <Route path="/dashboard-mockup" component={DashboardMockup} />

        {/* Beschermde routes */}
        <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
        <Route path="/profile">{() => <ProtectedRoute component={UserProfile} />}</Route>
        <Route path="/rewards">{() => <ProtectedRoute component={Rewards} />}</Route>
        <Route path="/employee/rewards/:id">{() => <ProtectedRoute component={RewardDetail} />}</Route>
        <Route path="/history">{() => <ProtectedRoute component={History} />}</Route>
        <Route path="/leaderboard">{() => <ProtectedRoute component={LeaderboardPage} />}</Route>

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
