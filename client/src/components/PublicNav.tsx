import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";

const navItems = [
  {
    label: "Home",
    href: "/landing",
    dropdown: null,
  },
  {
    label: "Ik zoek extra personeel",
    href: "/horeca-personeel-inhuren",
    dropdown: [
      { label: "Hotels", href: "/hotel-personeel-amsterdam" },
      { label: "Eventlocaties", href: "/evenementen-personeel-amsterdam" },
      { label: "Cateraars", href: "/catering-personeel-amsterdam" },
      { label: "Restaurants", href: "/restaurant-personeel-amsterdam" },
    ],
  },
  {
    label: "Ik zoek extra werk",
    href: "/horeca-vacatures-amsterdam",
    dropdown: [
      { label: "Horeca", href: "/horeca-werk-amsterdam" },
      { label: "Housekeeping", href: "/housekeeping-vacatures-amsterdam" },
      { label: "Chefs", href: "/chef-vacatures-amsterdam" },
      { label: "Front-office", href: "/front-office-vacatures-amsterdam" },
    ],
  },
  {
    label: "Over EXTRA",
    href: "/over-extra",
    dropdown: [
      { label: "Onze werkwijze", href: "/onze-werkwijze" },
      { label: "Klantcases", href: "/klantcases-horeca" },
      { label: "Beloningssysteem", href: "/beloningssysteem" },
      { label: "Ons team", href: "/ons-team" },
    ],
  },
  {
    label: "Nieuws & Blogs",
    href: "/blog",
    dropdown: null,
  },
  {
    label: "Contact",
    href: "/contact",
    dropdown: null,
  },
];

interface PublicNavProps {
  forceDark?: boolean;
}

export default function PublicNav({ forceDark = false }: PublicNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location]);

  const isDark = scrolled || forceDark || mobileOpen;

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
          <Link href="/landing">
            <img
              src={extraLogoWit}
              alt="EXTRA"
              className={`h-8 sm:h-9 w-auto transition-all duration-300 ${isDark ? "brightness-0" : ""}`}
            />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.href}
                className="relative group"
                onMouseEnter={() => item.dropdown && setOpenDropdown(item.href)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark
                      ? "text-gray-700 hover:text-purple-700 hover:bg-purple-50"
                      : "text-white/85 hover:text-white hover:bg-white/10"
                  } ${location === item.href ? (isDark ? "text-purple-700" : "text-white") : ""}`}
                >
                  {item.label}
                  {item.dropdown && (
                    <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                  )}
                </Link>

                {item.dropdown && openDropdown === item.href && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/horeca-vacatures-amsterdam"
              className={`text-sm font-semibold px-4 py-2 rounded-full transition-all border ${
                isDark
                  ? "border-purple-200 text-purple-700 hover:bg-purple-50"
                  : "border-white/30 text-white hover:bg-white/10"
              }`}
            >
              Werk zoeken
            </Link>
            <Link
              href="/personeelsaanvraag"
              className="text-sm font-semibold px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              Personeel aanvragen
            </Link>
          </div>

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

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <div key={item.href}>
                <div className="flex items-center justify-between">
                  <Link
                    href={item.href}
                    className="flex-1 py-2.5 text-sm font-medium text-gray-800 hover:text-purple-700"
                  >
                    {item.label}
                  </Link>
                  {item.dropdown && (
                    <button
                      onClick={() =>
                        setOpenDropdown(openDropdown === item.href ? null : item.href)
                      }
                      className="p-2 text-gray-500"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          openDropdown === item.href ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>
                {item.dropdown && openDropdown === item.href && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-purple-100 pl-3">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block py-2 text-sm text-gray-600 hover:text-purple-700"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href="/horeca-vacatures-amsterdam"
                className="text-center py-2.5 text-sm font-semibold text-purple-700 border border-purple-200 rounded-full hover:bg-purple-50"
              >
                Werk zoeken
              </Link>
              <Link
                href="/personeelsaanvraag"
                className="text-center py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-full"
              >
                Personeel aanvragen
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
