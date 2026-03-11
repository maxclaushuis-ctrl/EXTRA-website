import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu, X, ChevronDown, Phone, Briefcase, UserCheck, Star,
  Hotel, PartyPopper, UtensilsCrossed, Wine, Heart, Award, Handshake,
  Clock, Trophy, Gift, Users
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";

interface PublicNavProps {
  forceDark?: boolean;
}

export default function PublicNav({ forceDark = false }: PublicNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [location] = useLocation();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [location]);

  const isDark = scrolled || forceDark || mobileOpen;

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  const handleMouseEnter = (key: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(key);
  };

  const navGroups = [
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
          <Link href="/landing">
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

          {/* CTA right */}
          <div className="hidden lg:block">
            <Link
              href="/personeelsaanvraag"
              className={`inline-flex items-center gap-2 xl:gap-2.5 text-[13px] xl:text-[16px] font-black px-5 xl:px-8 py-2.5 xl:py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl whitespace-nowrap ${
                isDark
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border border-purple-500/20 hover:shadow-purple-500/30"
                  : "bg-white text-purple-700 border-2 border-white hover:shadow-white/30"
              }`}
            >
              <Phone className="w-4 h-4 xl:w-[18px] xl:h-[18px]" />
              Personeel aanvragen
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isDark ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/15"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu openen"
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
                        className="flex items-center gap-2 py-2.5 text-[14px] font-semibold text-gray-600 hover:text-purple-700"
                      >
                        <item.icon className="w-3.5 h-3.5 text-purple-400" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <Link
                href="/personeelsaanvraag"
                className="flex items-center justify-center gap-2.5 w-full py-4 text-base font-black text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-full shadow-md hover:from-purple-700 hover:to-purple-800 transition-all"
              >
                <Phone className="w-[18px] h-[18px]" />
                Personeel aanvragen
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
