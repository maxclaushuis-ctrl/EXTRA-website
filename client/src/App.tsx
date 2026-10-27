import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect, lazy, Suspense, Component, ReactNode } from "react";
import { ROUTE_META_BY_PATH, SITE_ORIGIN } from "@shared/routeMeta";
import { isEngelsPad } from "@shared/taal";

import { maakFragmentRoute } from "@/design3/fragmentRoute";
const Home = lazy(() => import("@/pages/d3/Home"));
// Design 3.0, levering 2: inhoudspagina's uit de mock-up (client/src/design3/paginas).
const D3_cateringpersoneel_inhuren = maakFragmentRoute("cateringpersoneel-inhuren");
const D3_horeca_uitzendbureau_amsterdam = maakFragmentRoute("horeca-uitzendbureau-amsterdam");
const D3_uitzenden_of_zzp = maakFragmentRoute("uitzenden-of-zzp");
const D3_horecapersoneel_restaurants = maakFragmentRoute("horecapersoneel-restaurants");
const D3_horeca_personeel_gezocht = maakFragmentRoute("horeca-personeel-gezocht");
const D3_horeca_personeel_amsterdam = maakFragmentRoute("horeca-personeel-amsterdam");
const D3_horeca_personeel = maakFragmentRoute("horeca-personeel");
const D3_flexibel_horeca_personeel = maakFragmentRoute("flexibel-horeca-personeel");
const D3_tijdelijk_horeca_personeel = maakFragmentRoute("tijdelijk-horeca-personeel");
const D3_horeca_personeel_inhuren = maakFragmentRoute("horeca-personeel-inhuren");
const D3_bediening_inhuren = maakFragmentRoute("bediening-inhuren");
const D3_horeca_uitzendbureau_amsterdam_werkwijze = maakFragmentRoute("horeca-uitzendbureau-amsterdam-werkwijze");
// Engelse site in design 3.0 (mock-up en/*.html), gegenereerd door fragment.py.
const EN_home = maakFragmentRoute("en");
const EN_about = maakFragmentRoute("en-about");
const EN_banqueting_staff = maakFragmentRoute("en-banqueting-staff");
const EN_catering_staff_amsterdam = maakFragmentRoute("en-catering-staff-amsterdam");
const EN_chef_jobs = maakFragmentRoute("en-chef-jobs");
const EN_client_stories = maakFragmentRoute("en-client-stories");
const EN_contact = maakFragmentRoute("en-contact");
const EN_cookie_policy = maakFragmentRoute("en-cookie-policy");
const EN_daily_pay = maakFragmentRoute("en-daily-pay");
const EN_dishwashers = maakFragmentRoute("en-dishwashers");
const EN_event_jobs = maakFragmentRoute("en-event-jobs");
const EN_event_staff_amsterdam = maakFragmentRoute("en-event-staff-amsterdam");
const EN_food_and_beverage_staff = maakFragmentRoute("en-food-and-beverage-staff");
const EN_front_office_jobs = maakFragmentRoute("en-front-office-jobs");
const EN_front_office_staff = maakFragmentRoute("en-front-office-staff");
const EN_hospitality_jobs = maakFragmentRoute("en-hospitality-jobs");
const EN_hospitality_staff_amsterdam = maakFragmentRoute("en-hospitality-staff-amsterdam");
const EN_hospitality_work = maakFragmentRoute("en-hospitality-work");
const EN_hotel_staffing_amsterdam = maakFragmentRoute("en-hotel-staffing-amsterdam");
const EN_housekeeping_jobs = maakFragmentRoute("en-housekeeping-jobs");
const EN_housekeeping_staff = maakFragmentRoute("en-housekeeping-staff");
const EN_how_we_select = maakFragmentRoute("en-how-we-select");
const EN_how_we_work = maakFragmentRoute("en-how-we-work");
const EN_kitchen_staff = maakFragmentRoute("en-kitchen-staff");
const EN_logistics_jobs = maakFragmentRoute("en-logistics-jobs");
const EN_logistics_staff_amsterdam = maakFragmentRoute("en-logistics-staff-amsterdam");
const EN_nen_4400_1_certification = maakFragmentRoute("en-nen-4400-1-certification");
const EN_our_team = maakFragmentRoute("en-our-team");
const EN_part_time_jobs_amsterdam = maakFragmentRoute("en-part-time-jobs-amsterdam");
const EN_privacy_policy = maakFragmentRoute("en-privacy-policy");
const EN_restaurant_staff_amsterdam = maakFragmentRoute("en-restaurant-staff-amsterdam");
const EN_rewards = maakFragmentRoute("en-rewards");
const EN_terms_and_conditions = maakFragmentRoute("en-terms-and-conditions");
const EN_waiting_staff = maakFragmentRoute("en-waiting-staff");
const EN_working_in_hospitality = maakFragmentRoute("en-working-in-hospitality");
const D3_horeca_vacatures_amsterdam = maakFragmentRoute("horeca-vacatures-amsterdam");
const D3_horeca_werk = maakFragmentRoute("horeca-werk");
const D3_horeca_werk_amsterdam = maakFragmentRoute("horeca-werk-amsterdam");
const D3_housekeeping_werk = maakFragmentRoute("housekeeping-werk");
const D3_housekeeping_vacatures_amsterdam = maakFragmentRoute("housekeeping-vacatures-amsterdam");
const D3_chef_vacatures_amsterdam = maakFragmentRoute("chef-vacatures-amsterdam");
const D3_front_office_vacatures_amsterdam = maakFragmentRoute("front-office-vacatures-amsterdam");
const D3_bijbaan_amsterdam = maakFragmentRoute("bijbaan-amsterdam");
const D3_werken_in_de_horeca = maakFragmentRoute("werken-in-de-horeca");
const D3_dagbetaling = maakFragmentRoute("dagbetaling");
const D3_extraatje = maakFragmentRoute("extraatje");
const D3_over_extra = maakFragmentRoute("over-extra");
const D3_ons_team = maakFragmentRoute("ons-team");
const D3_onze_werkwijze = maakFragmentRoute("onze-werkwijze");
const D3_klantcases_horeca = maakFragmentRoute("klantcases-horeca");
const D3_nen_4400_1_certificering = maakFragmentRoute("nen-4400-1-certificering");
const D3_contact = maakFragmentRoute("contact");
const D3_privacybeleid = maakFragmentRoute("privacybeleid");
const D3_voorwaarden = maakFragmentRoute("voorwaarden");
const D3_housekeeping_personeel_inhuren = maakFragmentRoute("housekeeping-personeel-inhuren");
const D3_front_office_personeel_inhuren = maakFragmentRoute("front-office-personeel-inhuren");
const D3_fb_personeel_inhuren = maakFragmentRoute("fb-personeel-inhuren");
const D3_banqueting_personeel_inhuren = maakFragmentRoute("banqueting-personeel-inhuren");
const D3_keukenpersoneel_inhuren = maakFragmentRoute("keukenpersoneel-inhuren");
const D3_afwassers_inhuren = maakFragmentRoute("afwassers-inhuren");
const D3_events_werk = maakFragmentRoute("events-werk");
const D3_logistiek_werk = maakFragmentRoute("logistiek-werk");
const D3_hotels = maakFragmentRoute("hotels");
const D3_evenementen = maakFragmentRoute("evenementen");
const D3_logistiek = maakFragmentRoute("logistiek");
const D3_selectieproces = maakFragmentRoute("selectieproces");
const D3_cookiebeleid = maakFragmentRoute("cookiebeleid");
const NotFound = maakFragmentRoute("niet-gevonden");
const SollicitatieFormulier = lazy(() => import("@/pages/SollicitatieFormulier"));
// Oude opmaak, tijdelijk: deze twee pagina's kregen in oktober 2026 in productie nieuwe inhoud
// (aparte zoekintentie, nieuwe pagina) die nog geen design 3.0-versie heeft.
const DashboardMockup = lazy(() => import("@/pages/DashboardMockup"));
const WachtwoordInstellen = lazy(() => import("@/pages/WachtwoordInstellen"));
const Brochure = lazy(() => import("@/pages/Brochure"));
const BrochureEN = lazy(() => import("@/pages/BrochureEN"));
const BrochureEvents = lazy(() => import("@/pages/BrochureEvents"));
const BrochureLofi = lazy(() => import("@/pages/BrochureLofi"));
const HotelPersoneelGezocht = lazy(() => import("@/pages/d3/Bedrijven").then((m) => ({ default: m.HotelsBedrijven })));
const EventPersoneelGezocht = lazy(() => import("@/pages/d3/Bedrijven").then((m) => ({ default: m.EventsBedrijven })));
const PersoneelsAanvraag = lazy(() => import("@/pages/d3/Aanvraag").then((m) => ({ default: m.PersoneelAanvragen })));
const AanvraagOntvangen = lazy(() => import("@/pages/d3/Aanvraag").then((m) => ({ default: m.AanvraagOntvangen })));
// Stijlpilot, noindex — zie shared/routeMeta.ts
const LogistiekPersoneelInhuren = lazy(() => import("@/pages/d3/Bedrijven").then((m) => ({ default: m.LogistiekBedrijven })));
// Campagnepagina voor de gastles bij InHolland, noindex — zie shared/routeMeta.ts
const InHolland = lazy(() => import("@/pages/InHolland"));
const Aanmelden = lazy(() => import("@/pages/d3/Aanmelden"));
const CvUpload = lazy(() => import("@/pages/CvUpload"));
const NieuwsPage = lazy(() => import("@/pages/d3/Blog").then((m) => ({ default: m.BlogOverzicht })));
const NieuwsArtikel = lazy(() => import("@/pages/d3/Blog").then((m) => ({ default: m.BlogArtikel })));
const Vacatures = lazy(() => import("@/pages/Vacatures"));
const VacatureDetail = lazy(() => import("@/pages/VacatureDetail"));



const BHGGroupPage = lazy(() => import("@/pages/BHGGroupPage"));
const XebiaPage = lazy(() => import("@/pages/XebiaPage"));


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
  '/logistiek-personeel-inhuren',
  '/inholland',
  '/bediening-inhuren',
  '/tijdelijk-horeca-personeel',
  '/uitzenden-of-zzp',
  '/horeca-vacatures-amsterdam', '/horeca-werk-amsterdam',
  '/housekeeping-vacatures-amsterdam', '/chef-vacatures-amsterdam',
  '/front-office-vacatures-amsterdam', '/horecapersoneel-gezocht',
  '/ik-zoek-extra-werk/horeca', '/ik-zoek-extra-werk/chef', '/ik-zoek-extra-werk/front-office',
  '/horeca-werk', '/housekeeping-werk',
  '/housekeeping-personeel-inhuren', '/front-office-personeel-inhuren', '/fb-personeel-inhuren', '/banqueting-personeel-inhuren', '/keukenpersoneel-inhuren', '/afwassers-inhuren', '/events-werk', '/logistiek-werk',
  '/horeca-uitzendbureau-amsterdam', '/horeca-uitzendbureau-amsterdam-werkwijze',
  '/horeca-personeel-amsterdam', '/horeca-personeel', '/flexibel-horeca-personeel',
  '/blog', '/onze-werkwijze', '/beloningssysteem', '/ons-team',
  '/klantcases-horeca', '/contact', '/privacybeleid',
  '/voorwaarden', '/cookiebeleid', '/nen-4400-1-certificering',
  '/vacatures',
  '/en',
];

function PageLoader() {
  // Dit is het allereerste wat een bezoeker ziet, op élke pagina — dus ook op
  // de Engelse. "Even laden..." op /en/hotel-staffing-amsterdam is precies het
  // verkeerde welkom. window.location in plaats van useLocation: de loader
  // rendert als Suspense-fallback en moet nergens van afhangen.
  const engels = isEngelsPad(typeof window !== "undefined" ? window.location.pathname : "");
  return (
    <div className="min-h-screen bg-[#37352C] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#F8F7F4]/20 border-t-[#F8F7F4] animate-spin" />
        <span className="text-[#F8F7F4]/60 text-sm font-medium">{engels ? "Loading..." : "Even laden..."}</span>
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
    document.querySelector('meta[name="robots"]')?.setAttribute(
      "content",
      meta.noindex ? (meta.follow ? "noindex, follow" : "noindex, nofollow") : "index, follow"
    );
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
          <Route path="/horecapersoneel-restaurants" component={D3_horecapersoneel_restaurants} />
          <Route path="/horecapersoneel-gezocht">{() => { window.location.replace('/horecapersoneel-restaurants'); return null; }}</Route>
          <Route path="/horeca-personeel-gezocht" component={D3_horeca_personeel_gezocht} />
          <Route path="/personeel-gezocht">{() => { window.location.replace('/horeca-personeel-gezocht'); return null; }}</Route>
          {/* SEO-landingspagina's (P10, juli 2026) */}
          <Route path="/horeca-personeel-inhuren" component={D3_horeca_personeel_inhuren} />
          <Route path="/bediening-inhuren" component={D3_bediening_inhuren} />
          <Route path="/evenementen-personeel-inhuren">{() => { window.location.replace('/eventpersoneel-inhuren'); return null; }}</Route>
          <Route path="/tijdelijk-horeca-personeel" component={D3_tijdelijk_horeca_personeel} />
          {/* Nog in de oude opmaak tot de design 3.0-versie is goedgekeurd (productie, september 2026). */}
          <Route path="/uitzenden-of-zzp" component={D3_uitzenden_of_zzp} />
          <Route path="/bijbaan-amsterdam" component={D3_bijbaan_amsterdam} />
          <Route path="/dagbetaling" component={D3_dagbetaling} />
          <Route path="/werken-in-de-horeca" component={D3_werken_in_de_horeca} />
          <Route path="/hotelpersoneel-inhuren" component={HotelPersoneelGezocht} />
          <Route path="/hotel-personeel-gezocht">{() => { window.location.replace('/hotelpersoneel-inhuren'); return null; }}</Route>
          <Route path="/hotel-personeel-amsterdam">{() => { window.location.replace('/hotelpersoneel-inhuren'); return null; }}</Route>
          <Route path="/eventpersoneel-inhuren" component={EventPersoneelGezocht} />
          <Route path="/event-personeel-gezocht">{() => { window.location.replace('/eventpersoneel-inhuren'); return null; }}</Route>
          <Route path="/evenementen-personeel-amsterdam">{() => { window.location.replace('/eventpersoneel-inhuren'); return null; }}</Route>
          <Route path="/cateringpersoneel-inhuren" component={D3_cateringpersoneel_inhuren} />
          <Route path="/cateringpersoneel-gezocht">{() => { window.location.replace('/cateringpersoneel-inhuren'); return null; }}</Route>
          <Route path="/catering-personeel-amsterdam">{() => { window.location.replace('/cateringpersoneel-inhuren'); return null; }}</Route>
          <Route path="/restaurant-personeel-gezocht">{() => { window.location.replace('/horecapersoneel-restaurants'); return null; }}</Route>
          <Route path="/restaurant-personeel-amsterdam">{() => { window.location.replace('/horecapersoneel-restaurants'); return null; }}</Route>

          {/* Kandidaat routes */}
          <Route path="/ik-zoek-extra-werk/horeca">{() => { window.location.replace('/horeca-werk'); return null; }}</Route>
          <Route path="/horeca-vacatures-amsterdam" component={D3_horeca_vacatures_amsterdam} />
          <Route path="/horeca-werk-amsterdam" component={D3_horeca_werk_amsterdam} />
          <Route path="/housekeeping-vacatures-amsterdam" component={D3_housekeeping_vacatures_amsterdam} />
          <Route path="/chef-vacatures-amsterdam" component={D3_chef_vacatures_amsterdam} />
          <Route path="/ik-zoek-extra-werk/chef">{() => { window.location.replace('/chef-vacatures-amsterdam'); return null; }}</Route>
          <Route path="/front-office-vacatures-amsterdam" component={D3_front_office_vacatures_amsterdam} />
          <Route path="/ik-zoek-extra-werk/front-office">{() => { window.location.replace('/front-office-vacatures-amsterdam'); return null; }}</Route>

          {/* SEO pillar & landingspagina's */}
          <Route path="/horeca-uitzendbureau-amsterdam" component={D3_horeca_uitzendbureau_amsterdam} />
          <Route path="/horeca-uitzendbureau-amsterdam-werkwijze" component={D3_horeca_uitzendbureau_amsterdam_werkwijze} />
          <Route path="/horeca-personeel-amsterdam" component={D3_horeca_personeel_amsterdam} />
          <Route path="/horeca-personeel" component={D3_horeca_personeel} />
          <Route path="/flexibel-horeca-personeel" component={D3_flexibel_horeca_personeel} />

          {/* Engelse site in design 3.0. Formulieren en vacatures zijn de Nederlandse componenten, die hun taal uit het pad halen. */}
          <Route path="/en" component={EN_home} />
          <Route path="/en/about" component={EN_about} />
          <Route path="/en/banqueting-staff" component={EN_banqueting_staff} />
          <Route path="/en/catering-staff-amsterdam" component={EN_catering_staff_amsterdam} />
          <Route path="/en/chef-jobs" component={EN_chef_jobs} />
          <Route path="/en/client-stories" component={EN_client_stories} />
          <Route path="/en/contact" component={EN_contact} />
          <Route path="/en/cookie-policy" component={EN_cookie_policy} />
          <Route path="/en/daily-pay" component={EN_daily_pay} />
          <Route path="/en/dishwashers" component={EN_dishwashers} />
          <Route path="/en/event-jobs" component={EN_event_jobs} />
          <Route path="/en/event-staff-amsterdam" component={EN_event_staff_amsterdam} />
          <Route path="/en/food-and-beverage-staff" component={EN_food_and_beverage_staff} />
          <Route path="/en/front-office-jobs" component={EN_front_office_jobs} />
          <Route path="/en/front-office-staff" component={EN_front_office_staff} />
          <Route path="/en/hospitality-jobs" component={EN_hospitality_jobs} />
          <Route path="/en/hospitality-staff-amsterdam" component={EN_hospitality_staff_amsterdam} />
          <Route path="/en/hospitality-work" component={EN_hospitality_work} />
          <Route path="/en/hotel-staffing-amsterdam" component={EN_hotel_staffing_amsterdam} />
          <Route path="/en/housekeeping-jobs" component={EN_housekeeping_jobs} />
          <Route path="/en/housekeeping-staff" component={EN_housekeeping_staff} />
          <Route path="/en/how-we-select" component={EN_how_we_select} />
          <Route path="/en/how-we-work" component={EN_how_we_work} />
          <Route path="/en/kitchen-staff" component={EN_kitchen_staff} />
          <Route path="/en/logistics-jobs" component={EN_logistics_jobs} />
          <Route path="/en/logistics-staff-amsterdam" component={EN_logistics_staff_amsterdam} />
          <Route path="/en/nen-4400-1-certification" component={EN_nen_4400_1_certification} />
          <Route path="/en/our-team" component={EN_our_team} />
          <Route path="/en/part-time-jobs-amsterdam" component={EN_part_time_jobs_amsterdam} />
          <Route path="/en/privacy-policy" component={EN_privacy_policy} />
          <Route path="/en/restaurant-staff-amsterdam" component={EN_restaurant_staff_amsterdam} />
          <Route path="/en/rewards" component={EN_rewards} />
          <Route path="/en/terms-and-conditions" component={EN_terms_and_conditions} />
          <Route path="/en/waiting-staff" component={EN_waiting_staff} />
          <Route path="/en/working-in-hospitality" component={EN_working_in_hospitality} />
          <Route path="/en/request-staff" component={PersoneelsAanvraag} />
          <Route path="/en/request-received" component={AanvraagOntvangen} />
          <Route path="/en/jobs" component={Vacatures} />
          <Route path="/en/apply" component={Aanmelden} />

          {/* Blog */}
          <Route path="/blog" component={NieuwsPage} />
          <Route path="/blog/:slug" component={NieuwsArtikel} />
          {/* P14: /nieuws en /blog renderden dezelfde component op twee URL's
              (identieke content, zie shared/routeMeta.ts canonical: "/blog" op
              /nieuws). Server-side 301 (server/redirects.ts REDIRECT_PATTERNS)
              vangt alle echte navigatie af; deze stubs zijn de fallback voor
              wie al client-side in de SPA zit — zelfde patroon als de andere
              window.location.replace-stubs hieronder. */}
          <Route path="/nieuws">{() => { window.location.replace('/blog'); return null; }}</Route>
          <Route path="/nieuws/:slug">{(params) => { window.location.replace(`/blog/${params.slug}`); return null; }}</Route>

          {/* Over EXTRA sub-routes */}
          {/* P14: /over-extra/ons-team was een tweede URL voor dezelfde OnsTeam-
              component als /ons-team (identieke content). Server-side 301 vangt
              echte navigatie af; deze stub is de client-side fallback. */}
          <Route path="/over-extra/ons-team">{() => { window.location.replace('/ons-team'); return null; }}</Route>
          <Route path="/over-extra" component={D3_over_extra} />
          <Route path="/onze-werkwijze" component={D3_onze_werkwijze} />
          <Route path="/ons-team" component={D3_ons_team} />
          <Route path="/klantcases-horeca" component={D3_klantcases_horeca} />
          <Route path="/BHG-group" component={BHGGroupPage} />
          <Route path="/xebia" component={XebiaPage} />

          {/* Overige publieke routes */}
          <Route path="/personeelsaanvraag" component={PersoneelsAanvraag} />
          {/* Stijlpilot, bewust niet in de navigatie of sitemap opgenomen. */}
          <Route path="/logistiek-personeel-inhuren" component={LogistiekPersoneelInhuren} />
          {/* QR-bestemming voor de gastles bij InHolland. */}
          <Route path="/inholland" component={InHolland} />
          <Route path="/aanvraag-ontvangen" component={AanvraagOntvangen} />
          <Route path="/aanmelden" component={Aanmelden} />
          <Route path="/cv-upload" component={CvUpload} />
          <Route path="/horeca-werk" component={D3_horeca_werk} />
          <Route path="/housekeeping-werk" component={D3_housekeeping_werk} />
          <Route path="/housekeeping-personeel-inhuren" component={D3_housekeeping_personeel_inhuren} />
          <Route path="/front-office-personeel-inhuren" component={D3_front_office_personeel_inhuren} />
          <Route path="/fb-personeel-inhuren" component={D3_fb_personeel_inhuren} />
          <Route path="/banqueting-personeel-inhuren" component={D3_banqueting_personeel_inhuren} />
          <Route path="/keukenpersoneel-inhuren" component={D3_keukenpersoneel_inhuren} />
          <Route path="/afwassers-inhuren" component={D3_afwassers_inhuren} />
          <Route path="/events-werk" component={D3_events_werk} />
          <Route path="/logistiek-werk" component={D3_logistiek_werk} />
          <Route path="/hotels" component={D3_hotels} />
          <Route path="/evenementen" component={D3_evenementen} />
          <Route path="/logistiek" component={D3_logistiek} />
          <Route path="/selectieproces" component={D3_selectieproces} />
          <Route path="/extraatje" component={D3_extraatje} />
          {/* P14: /beloningssysteem en /hoe-extra-werkt waren tweede URL's voor
              dezelfde Extraatje- resp. HoeExtraWerkt-component als /extraatje
              en /onze-werkwijze (identieke content). Server-side 301 vangt
              echte navigatie af; deze stubs zijn de client-side fallback. */}
          <Route path="/beloningssysteem">{() => { window.location.replace('/extraatje'); return null; }}</Route>
          <Route path="/hoe-extra-werkt">{() => { window.location.replace('/onze-werkwijze'); return null; }}</Route>
          <Route path="/ik-zoek-extra-werk">{() => { window.location.replace('/horeca-vacatures-amsterdam'); return null; }}</Route>
          <Route path="/dagbetaling">{() => { window.location.replace('/dagbetaling'); return null; }}</Route>
          <Route path="/vacatures" component={Vacatures} />
          <Route path="/vacatures/:slug" component={VacatureDetail} />
          <Route path="/contact" component={D3_contact} />
          <Route path="/privacybeleid" component={D3_privacybeleid} />
          {/* P15: bestonden nog niet, terwijl er wel intern naar gelinkt werd
              (footer, WerkwijzePage) — daardoor 404's in de crawl. */}
          <Route path="/voorwaarden" component={D3_voorwaarden} />
          <Route path="/cookiebeleid" component={D3_cookiebeleid} />
          <Route path="/nen-4400-1-certificering" component={D3_nen_4400_1_certificering} />
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
