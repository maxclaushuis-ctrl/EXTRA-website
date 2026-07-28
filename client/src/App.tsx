import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect, lazy, Suspense, Component, ReactNode } from "react";
import { ROUTE_META_BY_PATH, SITE_ORIGIN } from "@shared/routeMeta";

const Home = lazy(() => import("@/pages/Home"));
const NotFound = lazy(() => import("@/pages/not-found"));
const SollicitatieFormulier = lazy(() => import("@/pages/SollicitatieFormulier"));
const DashboardMockup = lazy(() => import("@/pages/DashboardMockup"));
const WachtwoordInstellen = lazy(() => import("@/pages/WachtwoordInstellen"));
const Brochure = lazy(() => import("@/pages/Brochure"));
const BrochureEN = lazy(() => import("@/pages/BrochureEN"));
const BrochureEvents = lazy(() => import("@/pages/BrochureEvents"));
const BrochureLofi = lazy(() => import("@/pages/BrochureLofi"));
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
const SeoLandingPagina = lazy(() => import("@/pages/SeoLandingPaginas"));
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
const XebiaPage = lazy(() => import("@/pages/XebiaPage"));
const Contact = lazy(() => import("@/pages/Contact"));
const Privacybeleid = lazy(() => import("@/pages/Privacybeleid"));

const LandingPageEn = lazy(() => import("@/pages/en/LandingPageEn"));
const HospitalityStaffAmsterdam = lazy(() => import("@/pages/en/HospitalityStaffAmsterdam"));
const HotelStaffingAmsterdam = lazy(() => import("@/pages/en/HotelStaffingAmsterdam"));
const EventStaffAmsterdam = lazy(() => import("@/pages/en/EventStaffAmsterdam"));
const CateringStaffAmsterdam = lazy(() => import("@/pages/en/CateringStaffAmsterdam"));
const RestaurantStaffAmsterdam = lazy(() => import("@/pages/en/RestaurantStaffAmsterdam"));
const AboutExtra = lazy(() => import("@/pages/en/AboutExtra"));
const OurTeam = lazy(() => import("@/pages/en/OurTeam"));
const ContactEn = lazy(() => import("@/pages/en/ContactEn"));
const ClientStories = lazy(() => import("@/pages/en/ClientStories"));
const HowWeWork = lazy(() => import("@/pages/en/HowWeWork"));
const RewardsEn = lazy(() => import("@/pages/en/RewardsEn"));
const HospitalityJobsAmsterdam = lazy(() => import("@/pages/en/HospitalityJobsAmsterdam"));
const HospitalityWorkEn = lazy(() => import("@/pages/en/HospitalityWorkEn"));
const HousekeepingJobsEn = lazy(() => import("@/pages/en/HousekeepingJobsEn"));
const ChefJobsEn = lazy(() => import("@/pages/en/ChefJobsEn"));
const FrontOfficeJobsEn = lazy(() => import("@/pages/en/FrontOfficeJobsEn"));

const UserProfile = lazy(() => import("@/pages/user/Profile"));
const Rewards = lazy(() => import("@/pages/user/Rewards"));
const RewardDetail = lazy(() => import("@/pages/employee/RewardDetail"));
const History = lazy(() => import("@/pages/user/History"));
const LeaderboardPage = lazy(() => import("@/pages/LeaderboardPage"));
const ExtraatjeDashboard = lazy(() => import("@/pages/dashboard"));
const ExtraatjeAdmin = lazy(() => import("@/pages/ExtraatjeAdmin"));

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MilestoneProvider } from "@/contexts/MilestoneContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotificationToast from "@/components/NotificationToast";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error('React Error Boundary caught:', error, info);
    const isChunkError =
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Importing a module script failed') ||
      (error as any).name === 'ChunkLoadError';
    if (isChunkError) {
      window.location.reload();
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Er is een fout opgetreden</h2>
            <p className="text-gray-500 text-sm mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
            >
              Pagina herladen
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  '/brochure', '/brochures', '/events', '/lofi', '/nieuws', '/extraatje',
  '/over-extra', '/hoe-extra-werkt', '/ik-zoek-extra-werk',
  '/hoe-werkt-dagbetaling',
  '/dagbetaling',
  '/bijbaan-amsterdam',
  '/werken-in-de-horeca',
  '/horeca-personeel-inhuren',
  '/bediening-inhuren',
  '/evenementen-personeel-inhuren',
  '/tijdelijk-horeca-personeel',
  '/horeca-vacatures-amsterdam', '/horeca-werk-amsterdam',
  '/housekeeping-vacatures-amsterdam', '/chef-vacatures-amsterdam',
  '/front-office-vacatures-amsterdam', '/horecapersoneel-gezocht',
  '/ik-zoek-extra-werk/horeca', '/ik-zoek-extra-werk/chef', '/ik-zoek-extra-werk/front-office',
  '/horeca-werk', '/housekeeping-werk',
  '/horeca-uitzendbureau-amsterdam', '/horeca-uitzendbureau-amsterdam-werkwijze',
  '/horeca-personeel-amsterdam', '/horeca-personeel', '/flexibel-horeca-personeel',
  '/blog', '/onze-werkwijze', '/beloningssysteem', '/ons-team',
  '/klantcases-horeca', '/contact', '/privacybeleid',
  '/vacatures',
  '/en',
  '/en/hospitality-staff-amsterdam', '/en/hotel-staffing-amsterdam',
  '/en/event-staff-amsterdam', '/en/catering-staff-amsterdam', '/en/restaurant-staff-amsterdam',
  '/en/about', '/en/our-team', '/en/contact', '/en/client-stories',
  '/en/how-we-work', '/en/rewards',
  '/en/hospitality-jobs', '/en/hospitality-work',
  '/en/housekeeping-jobs', '/en/chef-jobs', '/en/front-office-jobs',
];

function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        <span className="text-white/60 text-sm font-medium">Even laden...</span>
      </div>
    </div>
  );
}

/**
 * Houdt title/description/canonical na hydratatie in sync met shared/routeMeta.ts
 * (dezelfde bron als de server-side injectie). Draait als parent-effect NA de
 * mount-effecten van pagina's, dus dit wint van verouderde per-pagina
 * document.title-overrides — zonder 44 pagina-bestanden aan te passen.
 * Dynamische routes (blog-/vacature-slugs) staan niet in het manifest en
 * behouden hun eigen titellogica.
 */
function useRouteMetaSync(location: string) {
  useEffect(() => {
    const normalized = location === "/" ? "/" : location.toLowerCase().replace(/\/$/, "");
    const meta = ROUTE_META_BY_PATH[normalized];
    if (!meta) return;
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    const canonicalPath = meta.canonical ?? meta.path;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `${SITE_ORIGIN}${canonicalPath}`);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", meta.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", meta.description);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", `${SITE_ORIGIN}${canonicalPath}`);
    document.querySelector('meta[name="robots"]')?.setAttribute("content", meta.noindex ? "noindex, nofollow" : "index, follow");
  }, [location]);
}

function Router() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  useRouteMetaSync(location);

  const isPlanningPage = location.startsWith('/planning');
  const isDashboardMockup = location.startsWith('/dashboard');
  const isPublicPage = PUBLIC_PATHS.some(p => location === p || location.startsWith(p + '/'));

  return (
    <>
      {isAuthenticated && !isPlanningPage && !isDashboardMockup && !isPublicPage && (
        <NotificationToast />
      )}

      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/sollicitatieformulier" component={SollicitatieFormulier} />
          <Route path="/brochure" component={Brochure} />
          <Route path="/brochures" component={BrochureEN} />
          <Route path="/events" component={BrochureEvents} />
          <Route path="/lofi" component={BrochureLofi} />
          <Route path="/landing">{() => { window.location.replace('/'); return null; }}</Route>

          {/* Werkgever routes */}
          <Route path="/horecapersoneel-restaurants" component={RestaurantPersoneelGezocht} />
          <Route path="/horecapersoneel-gezocht">{() => { window.location.replace('/horecapersoneel-restaurants'); return null; }}</Route>
          <Route path="/horeca-personeel-gezocht" component={PersoneelGezocht} />
          <Route path="/personeel-gezocht">{() => { window.location.replace('/horeca-personeel-gezocht'); return null; }}</Route>
          {/* SEO-landingspagina's (P10, juli 2026) */}
          <Route path="/horeca-personeel-inhuren">{() => <SeoLandingPagina page="horeca-personeel-inhuren" />}</Route>
          <Route path="/bediening-inhuren">{() => <SeoLandingPagina page="bediening-inhuren" />}</Route>
          <Route path="/evenementen-personeel-inhuren">{() => <SeoLandingPagina page="evenementen-personeel-inhuren" />}</Route>
          <Route path="/tijdelijk-horeca-personeel">{() => <SeoLandingPagina page="tijdelijk-horeca-personeel" />}</Route>
          <Route path="/bijbaan-amsterdam">{() => <SeoLandingPagina page="bijbaan-amsterdam" />}</Route>
          <Route path="/dagbetaling">{() => <SeoLandingPagina page="dagbetaling" />}</Route>
          <Route path="/werken-in-de-horeca">{() => <SeoLandingPagina page="werken-in-de-horeca" />}</Route>
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

          {/* English landing page */}
          <Route path="/en" component={LandingPageEn} />

          {/* English employer pages */}
          <Route path="/en/hospitality-staff-amsterdam" component={HospitalityStaffAmsterdam} />
          <Route path="/en/hotel-staffing-amsterdam" component={HotelStaffingAmsterdam} />
          <Route path="/en/event-staff-amsterdam" component={EventStaffAmsterdam} />
          <Route path="/en/catering-staff-amsterdam" component={CateringStaffAmsterdam} />
          <Route path="/en/restaurant-staff-amsterdam" component={RestaurantStaffAmsterdam} />

          {/* English other pages */}
          <Route path="/en/about" component={AboutExtra} />
          <Route path="/en/our-team" component={OurTeam} />
          <Route path="/en/contact" component={ContactEn} />
          <Route path="/en/client-stories" component={ClientStories} />
          <Route path="/en/how-we-work" component={HowWeWork} />
          <Route path="/en/rewards" component={RewardsEn} />

          {/* English candidate pages */}
          <Route path="/en/hospitality-jobs" component={HospitalityJobsAmsterdam} />
          <Route path="/en/hospitality-work" component={HospitalityWorkEn} />
          <Route path="/en/housekeeping-jobs" component={HousekeepingJobsEn} />
          <Route path="/en/chef-jobs" component={ChefJobsEn} />
          <Route path="/en/front-office-jobs" component={FrontOfficeJobsEn} />

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
          <Route path="/xebia" component={XebiaPage} />

          {/* Overige publieke routes */}
          <Route path="/personeelsaanvraag" component={PersoneelsAanvraag} />
          <Route path="/aanmelden" component={Aanmelden} />
          <Route path="/cv-upload" component={CvUpload} />
          <Route path="/horeca-werk" component={HorecaWerk} />
          <Route path="/housekeeping-werk" component={HousekeepingWerk} />
          <Route path="/extraatje" component={Extraatje} />
          <Route path="/hoe-extra-werkt" component={HoeExtraWerkt} />
          <Route path="/ik-zoek-extra-werk">{() => { window.location.replace('/horeca-vacatures-amsterdam'); return null; }}</Route>
          <Route path="/dagbetaling">{() => { window.location.replace('/dagbetaling'); return null; }}</Route>
          <Route path="/vacatures" component={Vacatures} />
          <Route path="/vacatures/:slug" component={VacatureDetail} />
          <Route path="/contact" component={Contact} />
          <Route path="/privacybeleid" component={Privacybeleid} />
          <Route path="/dashboard" component={DashboardMockup} />
          <Route path="/wachtwoord-instellen" component={WachtwoordInstellen} />

          {/* Beschermde routes */}
          <Route path="/profile">{() => <ProtectedRoute component={UserProfile} />}</Route>
          <Route path="/rewards">{() => <ProtectedRoute component={Rewards} />}</Route>
          <Route path="/employee/rewards/:id">{() => <ProtectedRoute component={RewardDetail} />}</Route>
          <Route path="/history">{() => <ProtectedRoute component={History} />}</Route>
          <Route path="/leaderboard">{() => <ProtectedRoute component={LeaderboardPage} />}</Route>
          <Route path="/extraatje-dashboard" component={ExtraatjeDashboard} />
          <Route path="/extraatje-admin" component={ExtraatjeAdmin} />

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <MilestoneProvider>
            <Router />
          </MilestoneProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
