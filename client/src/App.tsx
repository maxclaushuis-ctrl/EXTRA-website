import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect, lazy, Suspense } from "react";

const Home = lazy(() => import("@/pages/Home"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const SollicitatieFormulier = lazy(() => import("@/pages/SollicitatieFormulier"));
const DashboardMockup = lazy(() => import("@/pages/DashboardMockup"));
const Brochure = lazy(() => import("@/pages/Brochure"));
const BrochureEN = lazy(() => import("@/pages/BrochureEN"));
const BrochureEvents = lazy(() => import("@/pages/BrochureEvents"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const PersoneelGezocht = lazy(() => import("@/pages/PersoneelGezocht"));
const HotelPersoneelGezocht = lazy(() => import("@/pages/HotelPersoneelGezocht"));
const EventPersoneelGezocht = lazy(() => import("@/pages/EventPersoneelGezocht"));
const CateringPersoneelGezocht = lazy(() => import("@/pages/CateringPersoneelGezocht"));
const RestaurantPersoneelGezocht = lazy(() => import("@/pages/RestaurantPersoneelGezocht"));
const PersoneelsAanvraag = lazy(() => import("@/pages/PersoneelsAanvraag"));
const Aanmelden = lazy(() => import("@/pages/Aanmelden"));
const CvUpload = lazy(() => import("@/pages/CvUpload"));
const HorecaWerk = lazy(() => import("@/pages/HorecaWerk"));
const HousekeepingWerk = lazy(() => import("@/pages/HousekeepingWerk"));
const NieuwsPage = lazy(() => import("@/pages/NieuwsPage"));
const NieuwsArtikel = lazy(() => import("@/pages/NieuwsArtikel"));
const Extraatje = lazy(() => import("@/pages/Extraatje"));
const OverExtra = lazy(() => import("@/pages/OverExtra"));
const OnsTeam = lazy(() => import("@/pages/OnsTeam"));
const HoeExtraWerkt = lazy(() => import("@/pages/HoeExtraWerkt"));
const IkZoekExtraWerk = lazy(() => import("@/pages/IkZoekExtraWerk"));
const HoeWerktDagbetaling = lazy(() => import("@/pages/HoeWerktDagbetaling"));
const Vacatures = lazy(() => import("@/pages/Vacatures"));
const VacatureDetail = lazy(() => import("@/pages/VacatureDetail"));
const HorecaPersoneelGezocht = lazy(() => import("@/pages/HorecaPersoneelGezocht"));

const HorecaVacaturesAmsterdam = lazy(() => import("@/pages/HorecaVacaturesAmsterdam"));
const HorecaWerkAmsterdam = lazy(() => import("@/pages/HorecaWerkAmsterdam"));
const HousekeepingVacaturesAmsterdam = lazy(() => import("@/pages/HousekeepingVacaturesAmsterdam"));
const ChefVacaturesAmsterdam = lazy(() => import("@/pages/ChefVacaturesAmsterdam"));
const FrontOfficeVacaturesAmsterdam = lazy(() => import("@/pages/FrontOfficeVacaturesAmsterdam"));

const HorecaUitzendbureau = lazy(() => import("@/pages/HorecaUitzendbureau"));
const HorecaPersoneelAmsterdamPage = lazy(() => import("@/pages/HorecaPersoneelAmsterdamPage"));
const HorecaPersoneelPage = lazy(() => import("@/pages/HorecaPersoneelPage"));
const FlexibelHorecaPersoneel = lazy(() => import("@/pages/FlexibelHorecaPersoneel"));
const WerkwijzePage = lazy(() => import("@/pages/WerkwijzePage"));

const KlantcasesHoreca = lazy(() => import("@/pages/KlantcasesHoreca"));
const BHGGroupPage = lazy(() => import("@/pages/BHGGroupPage"));
const Contact = lazy(() => import("@/pages/Contact"));

const HospitalityStaffAmsterdam = lazy(() => import("@/pages/en/HospitalityStaffAmsterdam"));
const HotelStaffingAmsterdam = lazy(() => import("@/pages/en/HotelStaffingAmsterdam"));
const EventStaffAmsterdam = lazy(() => import("@/pages/en/EventStaffAmsterdam"));
const CateringStaffAmsterdam = lazy(() => import("@/pages/en/CateringStaffAmsterdam"));
const RestaurantStaffAmsterdam = lazy(() => import("@/pages/en/RestaurantStaffAmsterdam"));

const UserProfile = lazy(() => import("@/pages/user/Profile"));
const Rewards = lazy(() => import("@/pages/user/Rewards"));
const RewardDetail = lazy(() => import("@/pages/employee/RewardDetail"));
const History = lazy(() => import("@/pages/user/History"));
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage"));

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MilestoneProvider } from "@/contexts/MilestoneContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotificationToast from "@/components/NotificationToast";

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
  '/hotel-personeel-gezocht', '/hotelpersoneel-inhuren', '/event-personeel-gezocht', '/eventpersoneel-inhuren', '/cateringpersoneel-gezocht', '/cateringpersoneel-inhuren', '/horecapersoneel-gezocht', '/horecapersoneel-restaurants', '/restaurant-personeel-gezocht',
  '/brochure', '/brochures', '/events', '/nieuws', '/extraatje',
  '/over-extra', '/hoe-extra-werkt', '/ik-zoek-extra-werk',
  '/hoe-werkt-dagbetaling',
  '/horeca-vacatures-amsterdam', '/horeca-werk-amsterdam',
  '/housekeeping-vacatures-amsterdam', '/chef-vacatures-amsterdam',
  '/front-office-vacatures-amsterdam', '/horecapersoneel-gezocht',
  '/ik-zoek-extra-werk/horeca', '/ik-zoek-extra-werk/chef', '/ik-zoek-extra-werk/front-office',
  '/horeca-werk', '/housekeeping-werk',
  '/horeca-uitzendbureau-amsterdam', '/horeca-uitzendbureau-amsterdam-werkwijze',
  '/horeca-personeel-amsterdam', '/horeca-personeel', '/flexibel-horeca-personeel',
  '/blog', '/onze-werkwijze', '/beloningssysteem', '/ons-team',
  '/klantcases-horeca', '/contact',
  '/vacatures',
  '/en/hospitality-staff-amsterdam', '/en/hotel-staffing-amsterdam',
  '/en/event-staff-amsterdam', '/en/catering-staff-amsterdam', '/en/restaurant-staff-amsterdam',
];

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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

      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/sollicitatieformulier" component={SollicitatieFormulier} />
          <Route path="/brochure" component={Brochure} />
          <Route path="/brochures" component={BrochureEN} />
          <Route path="/events" component={BrochureEvents} />
          <Route path="/landing" component={LandingPage} />

          {/* Werkgever routes */}
          <Route path="/horecapersoneel-restaurants" component={RestaurantPersoneelGezocht} />
          <Route path="/horecapersoneel-gezocht">{() => { window.location.replace('/horecapersoneel-restaurants'); return null; }}</Route>
          <Route path="/horeca-personeel-gezocht" component={PersoneelGezocht} />
          <Route path="/personeel-gezocht">{() => { window.location.replace('/horeca-personeel-gezocht'); return null; }}</Route>
          <Route path="/horeca-personeel-inhuren">{() => { window.location.replace('/horeca-personeel-gezocht'); return null; }}</Route>
          <Route path="/hotelpersoneel-inhuren" component={HotelPersoneelGezocht} />
          <Route path="/hotel-personeel-gezocht">{() => { window.location.replace('/hotelpersoneel-inhuren'); return null; }}</Route>
          <Route path="/hotel-personeel-amsterdam">{() => { window.location.replace('/hotelpersoneel-inhuren'); return null; }}</Route>
          <Route path="/eventpersoneel-inhuren" component={EventPersoneelGezocht} />
          <Route path="/event-personeel-gezocht">{() => { window.location.replace('/eventpersoneel-inhuren'); return null; }}</Route>
          <Route path="/evenementen-personeel-amsterdam">{() => { window.location.replace('/eventpersoneel-inhuren'); return null; }}</Route>
          <Route path="/cateringpersoneel-inhuren" component={CateringPersoneelGezocht} />
          <Route path="/cateringpersoneel-gezocht">{() => { window.location.replace('/cateringpersoneel-inhuren'); return null; }}</Route>
          <Route path="/catering-personeel-amsterdam">{() => { window.location.replace('/cateringpersoneel-inhuren'); return null; }}</Route>
          <Route path="/restaurant-personeel-gezocht">{() => { window.location.replace('/horecapersoneel-restaurants'); return null; }}</Route>
          <Route path="/restaurant-personeel-amsterdam">{() => { window.location.replace('/horecapersoneel-restaurants'); return null; }}</Route>

          {/* Kandidaat routes */}
          <Route path="/ik-zoek-extra-werk/horeca">{() => { window.location.replace('/horeca-werk'); return null; }}</Route>
          <Route path="/horeca-vacatures-amsterdam" component={IkZoekExtraWerk} />
          <Route path="/horeca-werk-amsterdam" component={HorecaWerkAmsterdam} />
          <Route path="/housekeeping-vacatures-amsterdam" component={HousekeepingVacaturesAmsterdam} />
          <Route path="/chef-vacatures-amsterdam" component={ChefVacaturesAmsterdam} />
          <Route path="/ik-zoek-extra-werk/chef">{() => { window.location.replace('/chef-vacatures-amsterdam'); return null; }}</Route>
          <Route path="/front-office-vacatures-amsterdam" component={FrontOfficeVacaturesAmsterdam} />
          <Route path="/ik-zoek-extra-werk/front-office">{() => { window.location.replace('/front-office-vacatures-amsterdam'); return null; }}</Route>

          {/* SEO pillar & landingspagina's */}
          <Route path="/horeca-uitzendbureau-amsterdam" component={HorecaUitzendbureau} />
          <Route path="/horeca-uitzendbureau-amsterdam-werkwijze" component={WerkwijzePage} />
          <Route path="/horeca-personeel-amsterdam" component={HorecaPersoneelAmsterdamPage} />
          <Route path="/horeca-personeel" component={HorecaPersoneelPage} />
          <Route path="/flexibel-horeca-personeel" component={FlexibelHorecaPersoneel} />

          {/* English employer pages */}
          <Route path="/en/hospitality-staff-amsterdam" component={HospitalityStaffAmsterdam} />
          <Route path="/en/hotel-staffing-amsterdam" component={HotelStaffingAmsterdam} />
          <Route path="/en/event-staff-amsterdam" component={EventStaffAmsterdam} />
          <Route path="/en/catering-staff-amsterdam" component={CateringStaffAmsterdam} />
          <Route path="/en/restaurant-staff-amsterdam" component={RestaurantStaffAmsterdam} />

          {/* Blog */}
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
          <Route path="/BHG-group" component={BHGGroupPage} />

          {/* Overige publieke routes */}
          <Route path="/personeelsaanvraag" component={PersoneelsAanvraag} />
          <Route path="/aanmelden" component={Aanmelden} />
          <Route path="/cv-upload" component={CvUpload} />
          <Route path="/horeca-werk" component={HorecaWerk} />
          <Route path="/housekeeping-werk" component={HousekeepingWerk} />
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
      </Suspense>
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
