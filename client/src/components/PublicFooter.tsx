import { Link } from "wouter";
import { Mail, MapPin, ArrowRight, Instagram, Linkedin, Shield, ExternalLink } from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";

export default function PublicFooter() {
  return (
    <footer className="relative text-white overflow-hidden">
      {/* Gradient: smooth transition from purple sections above → very dark */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, #1a0533 0%, #0f0320 30%, #0a0310 100%)",
        }}
      />
      {/* Subtle purple radial glow at top */}
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.10), transparent)",
        }}
      />

      <div className="relative z-10">

        {/* ── CTA STRIP ── */}
        <div className="border-b border-white/8" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">Klaar om te starten?</p>
                <p className="text-base sm:text-lg font-bold text-white">
                  Personeel nodig of op zoek naar extra werk?
                </p>
              </div>
              <div className="flex flex-col xs:flex-row gap-3 shrink-0">
                <Link
                  href="/personeelsaanvraag"
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-white text-sm transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                    boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                  }}
                >
                  Personeel aanvragen
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/aanmelden"
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm border-2 border-white/20 hover:bg-white/10 hover:border-white/35 transition-all duration-200"
                >
                  Solliciteer direct
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN COLUMNS ── */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-16 sm:pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-14 sm:mb-16">

            {/* Kolom 1: Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/">
                <img src={extraLogoWit} alt="EXTRA Horecapersoneel Amsterdam" className="h-8 w-auto mb-5" />
              </Link>
              <p className="text-sm leading-relaxed text-purple-200/65 mb-6 max-w-xs">
                Hét horecauitzendbureau in Amsterdam voor hotels en evenementen. Flexibel horecapersoneel in loondienst, met het unieke beloningssysteem <span className="text-purple-300 font-semibold">EXTRAATje</span>.
              </p>

              {/* Contact info */}
              <div className="space-y-2.5 text-sm text-purple-300/60 mb-6">
                <a
                  href="mailto:info@doehetextra.nl"
                  className="flex items-center gap-2.5 hover:text-white transition-colors group"
                >
                  <Mail className="w-4 h-4 shrink-0 group-hover:text-purple-400 transition-colors" />
                  info@doehetextra.nl
                </a>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  Amsterdam, Nederland
                </div>
              </div>

              {/* Social icons */}
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/doehetextra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4 text-purple-300" />
                </a>
                <a
                  href="https://linkedin.com/company/doehetextra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4 text-purple-300" />
                </a>
              </div>
            </div>

            {/* Kolom 2: Werkgevers */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-5">Werkgevers</p>
              <ul className="space-y-3">
                {[
                  { label: "Personeel aanvragen", href: "/personeelsaanvraag" },
                  { label: "Hoe het werkt", href: "/horeca-uitzendbureau-amsterdam-werkwijze" },
                  { label: "Waarom EXTRA", href: "/horeca-uitzendbureau-amsterdam" },
                  { label: "Horeca personeel", href: "/horeca-personeel-amsterdam" },
                  { label: "Hotel personeel", href: "/hotel-personeel-amsterdam" },
                  { label: "Evenementen personeel", href: "/evenementen-personeel-amsterdam" },
                  { label: "Catering personeel", href: "/catering-personeel-amsterdam" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-purple-300/60 hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kolom 3: Werkzoekenden */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-5">Werkzoekenden</p>
              <ul className="space-y-3">
                {[
                  { label: "Solliciteer direct", href: "/aanmelden" },
                  { label: "Vacatures", href: "/vacatures" },
                  { label: "Horeca vacatures Amsterdam", href: "/horeca-vacatures-amsterdam" },
                  { label: "Horeca werk Amsterdam", href: "/horeca-werk-amsterdam" },
                  { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
                  { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
                  { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" },
                  { label: "EXTRAATje beloningen", href: "/beloningssysteem" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-purple-300/60 hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kolom 4: Bedrijf + trust */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-5">Bedrijf</p>
              <ul className="space-y-3 mb-7">
                {[
                  { label: "Over EXTRA", href: "/over-extra" },
                  { label: "Ons team", href: "/ons-team" },
                  { label: "Klantcases", href: "/klantcases-horeca" },
                  { label: "Nieuws & blog", href: "/blog" },
                  { label: "Contact", href: "/contact" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-purple-300/60 hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* NEN trust badge */}
              <div
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
              >
                <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-purple-300">NEN 4400-1 gecertificeerd</p>
                  <p className="text-[10px] text-purple-400/60 leading-tight">Gecertificeerd uitzendbureau</p>
                </div>
              </div>
            </div>

          </div>

          {/* ── BOTTOM BAR ── */}
          <div
            className="border-t pt-7 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs text-purple-300/35 text-center sm:text-left">
              © {new Date().getFullYear()} EXTRA Uitzendbureau B.V. · KvK 91860903 · Amsterdam
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-purple-300/40">
              <Link href="/privacybeleid" className="hover:text-white transition-colors">
                Privacybeleid
              </Link>
              <Link href="/voorwaarden" className="hover:text-white transition-colors">
                Algemene voorwaarden
              </Link>
              <Link href="/cookiebeleid" className="hover:text-white transition-colors">
                Cookiebeleid
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
