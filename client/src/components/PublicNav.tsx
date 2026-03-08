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
    const handleScroll = () => setScrolled(window.scrollY > 20);
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
        { label: "Hotels", href: "/hotel-personeel-gezocht", icon: Hotel },
        { label: "Eventlocaties", href: "/event-personeel-gezocht", icon: PartyPopper },
        { label: "Cateraars", href: "/cateringpersoneel-gezocht", icon: UtensilsCrossed },
        { label: "Restaurants", href: "/restaurant-personeel-gezocht", icon: Wine },
      ],
    },
    {
      key: "werk",
      label: "Ik zoek extra werk",
      icon: UserCheck,
      href: "/horeca-vacatures-amsterdam",
      items: [
        { label: "Horeca", href: "/horeca-werk-amsterdam", icon: UtensilsCrossed },
        { label: "Housekeeping", href: "/housekeeping-vacatures-amsterdam", icon: Heart },
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
          ? "bg-white/97 backdrop-blur-xl shadow-md border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo */}
          <Link href="/landing">
            <img
              src={extraLogoWit}
              alt="EXTRA"
              className={`h-8 sm:h-9 w-auto transition-all duration-300 ${isDark ? "brightness-0" : ""}`}
            />
          </Link>

          {/* Desktop nav — 3 dropdown groups centered */}
          <div className="hidden lg:flex items-center gap-1">
            {navGroups.map((group) => (
              <div
                key={group.key}
                className="relative"
                onMouseEnter={() => handleMouseEnter(group.key)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={group.href}
                  className={`flex items-center gap-1.5 text-[15px] font-bold px-4 py-3 rounded-lg transition-all ${
                    activeDropdown === group.key
                      ? isDark ? "text-purple-700 bg-purple-50" : "text-white bg-white/10"
                      : isDark
                        ? "text-gray-800 hover:text-purple-700 hover:bg-purple-50/50"
                        : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <group.icon className="w-4 h-4 shrink-0" />
                  {group.label}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
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
                  <div className="bg-white rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-100/60 p-2 min-w-[220px]">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 group-hover/item:bg-purple-200 flex items-center justify-center transition-colors shrink-0">
                          <item.icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-semibold">{item.label}</span>
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
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-[15px] font-bold px-7 py-3 rounded-full transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 border border-purple-500/20"
            >
              <Phone className="w-4 h-4" />
              Personeel aanvragen
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isDark ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
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
                    className="flex items-center gap-2 flex-1 py-2.5 text-sm font-bold text-gray-800 hover:text-purple-700"
                  >
                    <group.icon className="w-4 h-4 text-purple-500" />
                    {group.label}
                  </Link>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === group.key ? null : group.key)}
                    className="p-2 text-gray-500"
                    aria-label="Submenu openen"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        activeDropdown === group.key ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
                {activeDropdown === group.key && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-purple-100 pl-3 pb-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-purple-700"
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
                className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-full"
              >
                <Phone className="w-4 h-4" />
                Personeel aanvragen
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
