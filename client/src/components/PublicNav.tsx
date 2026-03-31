import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu, X, ChevronDown, Phone, Briefcase, UserCheck, Star,
  Hotel, PartyPopper, UtensilsCrossed, Wine, Heart, Award, Handshake,
  Clock, Trophy, Gift, Users, Globe
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";

interface PublicNavProps {
  forceDark?: boolean;
}

const LANG_MAP: Record<string, string> = {
  "/horeca-personeel-gezocht": "/en/hospitality-staff-amsterdam",
  "/hotelpersoneel-inhuren": "/en/hotel-staffing-amsterdam",
  "/eventpersoneel-inhuren": "/en/event-staff-amsterdam",
  "/cateringpersoneel-inhuren": "/en/catering-staff-amsterdam",
  "/horecapersoneel-restaurants": "/en/restaurant-staff-amsterdam",
  "/over-extra": "/en/about",
  "/ons-team": "/en/our-team",
  "/contact": "/en/contact",
  "/klantcases-horeca": "/en/client-stories",
  "/horeca-uitzendbureau-amsterdam-werkwijze": "/en/how-we-work",
  "/beloningssysteem": "/en/rewards",
  "/horeca-vacatures-amsterdam": "/en/hospitality-jobs",
  "/horeca-werk": "/en/hospitality-work",
  "/housekeeping-vacatures-amsterdam": "/en/housekeeping-jobs",
  "/chef-vacatures-amsterdam": "/en/chef-jobs",
  "/front-office-vacatures-amsterdam": "/en/front-office-jobs",
  "/en/hospitality-staff-amsterdam": "/horeca-personeel-gezocht",
  "/en/hotel-staffing-amsterdam": "/hotelpersoneel-inhuren",
  "/en/event-staff-amsterdam": "/eventpersoneel-inhuren",
  "/en/catering-staff-amsterdam": "/cateringpersoneel-inhuren",
  "/en/restaurant-staff-amsterdam": "/horecapersoneel-restaurants",
  "/en/about": "/over-extra",
  "/en/our-team": "/ons-team",
  "/en/contact": "/contact",
  "/en/client-stories": "/klantcases-horeca",
  "/en/how-we-work": "/horeca-uitzendbureau-amsterdam-werkwijze",
  "/en/rewards": "/beloningssysteem",
  "/en/hospitality-jobs": "/horeca-vacatures-amsterdam",
  "/en/hospitality-work": "/horeca-werk",
  "/en/housekeeping-jobs": "/housekeeping-vacatures-amsterdam",
  "/en/chef-jobs": "/chef-vacatures-amsterdam",
  "/en/front-office-jobs": "/front-office-vacatures-amsterdam",
};

const EN_PATHS = [
  "/en/hospitality-staff-amsterdam",
  "/en/hotel-staffing-amsterdam",
  "/en/event-staff-amsterdam",
  "/en/catering-staff-amsterdam",
  "/en/restaurant-staff-amsterdam",
  "/en/about",
  "/en/our-team",
  "/en/contact",
  "/en/client-stories",
  "/en/how-we-work",
  "/en/rewards",
  "/en/hospitality-jobs",
  "/en/hospitality-work",
  "/en/housekeeping-jobs",
  "/en/chef-jobs",
  "/en/front-office-jobs",
];

export default function PublicNav({ forceDark = false }: PublicNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [location] = useLocation();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const langTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEnglish = EN_PATHS.includes(location);
  const altPath = LANG_MAP[location];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
    setLangOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isDark = scrolled || forceDark || mobileOpen;

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  const handleMouseEnter = (key: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(key);
  };

  const handleLangMouseEnter = () => {
    if (langTimeout.current) clearTimeout(langTimeout.current);
    setLangOpen(true);
  };

  const handleLangMouseLeave = () => {
    langTimeout.current = setTimeout(() => setLangOpen(false), 200);
  };

  const navGroups = isEnglish
    ? [
        {
          key: "staff",
          label: "Hire hospitality staff",
          icon: Briefcase,
          href: "/en/hospitality-staff-amsterdam",
          items: [
            { label: "Hotels", href: "/en/hotel-staffing-amsterdam", icon: Hotel },
            { label: "Events", href: "/en/event-staff-amsterdam", icon: PartyPopper },
            { label: "Catering", href: "/en/catering-staff-amsterdam", icon: UtensilsCrossed },
            { label: "Restaurants", href: "/en/restaurant-staff-amsterdam", icon: UtensilsCrossed },
          ],
        },
        {
          key: "work",
          label: "Find hospitality work",
          icon: UserCheck,
          href: "/en/hospitality-jobs",
          items: [
            { label: "F&B / Hospitality", href: "/en/hospitality-work", icon: UtensilsCrossed },
            { label: "Housekeeping", href: "/en/housekeeping-jobs", icon: Heart },
            { label: "Chef", href: "/en/chef-jobs", icon: Award },
            { label: "Front office", href: "/en/front-office-jobs", icon: Handshake },
          ],
        },
        {
          key: "about",
          label: "About EXTRA",
          icon: Star,
          href: "/en/about",
          items: [
            { label: "How we work", href: "/en/how-we-work", icon: Clock },
            { label: "Client stories", href: "/en/client-stories", icon: Trophy },
            { label: "Rewards system", href: "/en/rewards", icon: Gift },
            { label: "Our team", href: "/en/our-team", icon: Users },
          ],
        },
      ]
    : [
        {
          key: "personeel",
          label: "Ik zoek extra personeel",
          icon: Briefcase,
          href: "/personeel-gezocht",
          items: [
            { label: "Hotels", href: "/hotelpersoneel-inhuren", icon: Hotel },
            { label: "Eventlocaties", href: "/eventpersoneel-inhuren", icon: PartyPopper },
            { label: "Cateraars", href: "/cateringpersoneel-inhuren", icon: UtensilsCrossed },
            { label: "Restaurants", href: "/horecapersoneel-restaurants", icon: UtensilsCrossed },
          ],
        },
        {
          key: "werk",
          label: "Ik zoek extra werk",
          icon: UserCheck,
          href: "/horeca-vacatures-amsterdam",
          items: [
            { label: "Horeca", href: "/horeca-werk", icon: UtensilsCrossed },
            { label: "Housekeeping", href: "/housekeeping-werk", icon: Heart },
            { label: "Chefs", href: "/chef-vacatures-amsterdam", icon: Award },
            { label: "Front-office", href: "/front-office-vacatures-amsterdam", icon: Handshake },
          ],
        },
        {
          key: "over",
          label: "Over EXTRA",
          icon: Star,
          href: "/over-extra",
          items: [
            { label: "Onze werkwijze", href: "/horeca-uitzendbureau-amsterdam-werkwijze", icon: Clock },
            { label: "Klantcases", href: "/klantcases-horeca", icon: Trophy },
            { label: "Beloningssysteem", href: "/beloningssysteem", icon: Gift },
            { label: "Ons team", href: "/ons-team", icon: Users },
          ],
        },
      ];

  const ctaLabel = isEnglish ? "Request staff" : "Personeel aanvragen";
  const ctaHref = "/personeelsaanvraag";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDark
          ? "bg-white backdrop-blur-xl shadow-lg border-b border-gray-100/80"
          : "bg-gradient-to-b from-black/35 via-black/15 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href={isEnglish ? "/en/hospitality-staff-amsterdam" : "/landing"}>
            <img
              src={extraLogoWit}
              alt="EXTRA"
              className={`h-9 sm:h-10 w-auto transition-all duration-300 ${isDark ? "brightness-0" : ""}`}
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-2">
            {navGroups.map((group) => (
              <div
                key={group.key}
                className="relative"
                onMouseEnter={() => handleMouseEnter(group.key)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={group.href}
                  className={`flex items-center gap-1.5 text-[13px] xl:text-[16px] font-bold px-3 xl:px-5 py-2.5 xl:py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                    activeDropdown === group.key
                      ? isDark
                        ? "text-purple-700 bg-purple-50"
                        : "text-white bg-white/15"
                      : isDark
                        ? "text-gray-800 hover:text-purple-700 hover:bg-purple-50/60"
                        : "text-white hover:text-white hover:bg-white/15"
                  }`}
                >
                  <group.icon className="w-4 h-4 xl:w-5 xl:h-5 shrink-0 opacity-80 hidden xl:inline-block" />
                  {group.label}
                  <ChevronDown
                    className={`w-3.5 h-3.5 xl:w-4 xl:h-4 opacity-70 transition-transform duration-200 ${
                      activeDropdown === group.key ? "rotate-180" : ""
                    }`}
                  />
                </Link>

                {/* Dropdown */}
                <div
                  className={`absolute top-full left-0 pt-2 transition-all duration-200 ${
                    activeDropdown === group.key
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/15 border border-purple-100/60 p-2 min-w-[220px]">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 group-hover/item:bg-purple-200 flex items-center justify-center transition-colors shrink-0">
                          <item.icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-[15px] font-semibold">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right side: lang switcher + CTA */}
          <div className="hidden lg:flex items-center gap-3">

            {/* Language switcher */}
            <div
              className="relative"
              onMouseEnter={handleLangMouseEnter}
              onMouseLeave={handleLangMouseLeave}
            >
              <button
                className={`flex items-center gap-1.5 text-[13px] xl:text-[14px] font-bold px-3 xl:px-4 py-2 rounded-lg transition-all duration-200 ${
                  isDark
                    ? "text-gray-700 hover:text-purple-700 hover:bg-purple-50/60"
                    : "text-white hover:bg-white/15"
                }`}
                aria-label="Switch language"
              >
                <Globe className="w-4 h-4 opacity-80" />
                <span>{isEnglish ? "EN" : "NL"}</span>
                <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute top-full right-0 pt-2 transition-all duration-200 ${
                  langOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/15 border border-purple-100/60 p-2 min-w-[160px]">
                  <Link
                    href={isEnglish ? (altPath || "/horeca-personeel-gezocht") : location}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      !isEnglish ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                    }`}
                  >
                    <span className="text-xl">🇳🇱</span>
                    <div>
                      <div className="text-[14px] font-bold">Nederlands</div>
                      <div className="text-[11px] text-gray-400">NL</div>
                    </div>
                    {!isEnglish && <div className="ml-auto w-2 h-2 bg-purple-600 rounded-full" />}
                  </Link>
                  <Link
                    href={isEnglish ? location : (altPath || "/en/hospitality-staff-amsterdam")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isEnglish ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                    }`}
                  >
                    <span className="text-xl">🇬🇧</span>
                    <div>
                      <div className="text-[14px] font-bold">English</div>
                      <div className="text-[11px] text-gray-400">EN</div>
                    </div>
                    {isEnglish && <div className="ml-auto w-2 h-2 bg-purple-600 rounded-full" />}
                  </Link>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              href={ctaHref}
              className={`inline-flex items-center gap-2 xl:gap-2.5 text-[13px] xl:text-[16px] font-black px-5 xl:px-8 py-2.5 xl:py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl whitespace-nowrap ${
                isDark
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border border-purple-500/20 hover:shadow-purple-500/30"
                  : "bg-white text-purple-700 border-2 border-white hover:shadow-white/30"
              }`}
            >
              <Phone className="w-4 h-4 xl:w-[18px] xl:h-[18px]" />
              {ctaLabel}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`lg:hidden p-3 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isDark ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/15"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Menu sluiten" : "Menu openen"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {navGroups.map((group) => (
              <div key={group.key}>
                <div className="flex items-center justify-between">
                  <Link
                    href={group.href}
                    className="flex items-center gap-3 flex-1 px-4 py-3.5 rounded-xl text-gray-800 font-bold text-base hover:bg-purple-50 hover:text-purple-700 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <group.icon className="w-5 h-5 text-purple-600" />
                    </div>
                    {group.label}
                  </Link>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === group.key ? null : group.key)}
                    className="p-2 text-gray-500 hover:text-purple-600"
                    aria-label="Submenu openen"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        activeDropdown === group.key ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
                {activeDropdown === group.key && (
                  <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-purple-100 pl-3 pb-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 py-3 px-2 text-[15px] font-semibold text-gray-600 hover:text-purple-700 min-h-[44px]"
                      >
                        <item.icon className="w-3.5 h-3.5 text-purple-400" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile language switcher */}
            <div className="border-t border-gray-100 pt-3 pb-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">Language</p>
              <div className="flex gap-2 px-4">
                <Link
                  href={isEnglish ? (altPath || "/horeca-personeel-gezocht") : location}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 justify-center ${
                    !isEnglish ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  🇳🇱 Nederlands
                </Link>
                <Link
                  href={isEnglish ? location : (altPath || "/en/hospitality-staff-amsterdam")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 justify-center ${
                    isEnglish ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  🇬🇧 English
                </Link>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <Link
                href={ctaHref}
                className="flex items-center justify-center gap-2.5 w-full py-4 text-base font-black text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-full shadow-md hover:from-purple-700 hover:to-purple-800 transition-all"
              >
                <Phone className="w-[18px] h-[18px]" />
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
