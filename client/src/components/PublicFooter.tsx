import { Link } from "wouter";
import { Mail, Phone, MapPin } from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";

export default function PublicFooter() {
  return (
    <footer style={{ backgroundColor: "#0a0310" }} className="text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/landing">
              <img src={extraLogoWit} alt="EXTRA" className="h-8 w-auto mb-4" />
            </Link>
            <p className="text-purple-300/70 text-sm leading-relaxed mb-4">
              Hét horeca uitzendbureau van Amsterdam. Flexibel, betrouwbaar en altijd in loondienst.
            </p>
            <div className="space-y-2 text-sm text-purple-300/60">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:info@doehetextra.nl" className="hover:text-white transition-colors">
                  info@doehetextra.nl
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <a href="tel:0201234567" className="hover:text-white transition-colors">
                  020-123 45 67
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Amsterdam, Nederland</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">
              Voor opdrachtgevers
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Ik zoek extra personeel", href: "/horeca-personeel-inhuren" },
                { label: "Horeca personeel Amsterdam", href: "/horeca-personeel-amsterdam" },
                { label: "Hotel personeel", href: "/hotel-personeel-amsterdam" },
                { label: "Evenementen personeel", href: "/evenementen-personeel-amsterdam" },
                { label: "Flexibel horeca personeel", href: "/flexibel-horeca-personeel" },
                { label: "Personeelsaanvraag", href: "/personeelsaanvraag" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-purple-300/70 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">
              Voor kandidaten
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Horeca vacatures Amsterdam", href: "/horeca-vacatures-amsterdam" },
                { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
                { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
                { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" },
                { label: "Horeca werk Amsterdam", href: "/horeca-werk-amsterdam" },
                { label: "Aanmelden", href: "/aanmelden" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-purple-300/70 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">
              Over EXTRA
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Over ons", href: "/over-extra" },
                { label: "Onze werkwijze", href: "/onze-werkwijze" },
                { label: "Ons team", href: "/ons-team" },
                { label: "Beloningssysteem", href: "/beloningssysteem" },
                { label: "Klantcases", href: "/klantcases-horeca" },
                { label: "Nieuws & Blogs", href: "/blog" },
                { label: "Contact", href: "/contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-purple-300/70 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-purple-300/40">
          <p>© {new Date().getFullYear()} EXTRA Uitzendbureau B.V. · KvK 12345678 · Amsterdam</p>
          <div className="flex gap-5">
            <Link href="/privacybeleid" className="hover:text-white transition-colors">Privacybeleid</Link>
            <Link href="/voorwaarden" className="hover:text-white transition-colors">Voorwaarden</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
