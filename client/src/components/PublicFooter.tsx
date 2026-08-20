import { Link, useLocation } from "wouter";
import { Mail, MapPin, ArrowRight, Instagram, Linkedin, Shield, ExternalLink } from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import { isEngelsPad } from "@shared/taal";

/**
 * Alle teksten en links van de footer, per taal.
 *
 * De footer stond tot 21 augustus 2026 volledig in het Nederlands — ook op de
 * zeventien Engelse pagina's. Dat is meer dan lelijk: de footer staat op elke
 * pagina, dus elke Engelse pagina serveerde een blok Nederlandse tekst met
 * links die de bezoeker de Engelse site uit duwden. Slecht voor de bezoeker
 * en slecht voor hoe zoekmachines de Engelse pagina's beoordelen.
 *
 * De Engelse kolommen linken naar de Engelse pagina's. Drie uitzonderingen
 * zijn bewust: het privacy-, voorwaarden- en cookiebeleid bestaan alleen in
 * het Nederlands (het zijn juridische teksten; een vertaling die afwijkt is
 * erger dan geen vertaling), en de NEN-certificeringspagina ook. Die houden
 * hun Nederlandse doel met een Engels label.
 *
 * "Request staff" wijst naar /en/contact en niet naar /personeelsaanvraag:
 * dat formulier is Nederlandstalig, en een Engelstalige opdrachtgever die
 * halverwege een Nederlands formulier strandt is erger dan eentje die een
 * kort Engels contactformulier invult.
 */
const FOOTER_COPY = {
  nl: {
    ctaKop: "Klaar om te starten?",
    ctaTekst: "Personeel nodig of op zoek naar extra werk?",
    ctaPrimair: { label: "Personeel aanvragen", href: "/personeelsaanvraag" },
    ctaSecundair: { label: "Solliciteer direct", href: "/aanmelden" },
    logoAlt: "EXTRA Horecapersoneel Amsterdam",
    merkTekst: (
      <>Hét horecauitzendbureau in Amsterdam voor hotels en evenementen. Flexibel horecapersoneel in loondienst, met het unieke beloningssysteem <span className="text-purple-300 font-semibold">EXTRAATje</span>.</>
    ),
    plaats: "Amsterdam, Nederland",
    kolom2Kop: "Werkgevers",
    kolom2: [
      { label: "Personeel aanvragen", href: "/personeelsaanvraag" },
      { label: "Hoe het werkt", href: "/horeca-uitzendbureau-amsterdam-werkwijze" },
      { label: "Waarom EXTRA", href: "/horeca-uitzendbureau-amsterdam" },
      // Label bewust "… Amsterdam": sinds /horeca-personeel er ook
      // in staat, moeten de twee labels uit elkaar te houden zijn.
      { label: "Horeca personeel Amsterdam", href: "/horeca-personeel-amsterdam" },
      { label: "Horeca personeel", href: "/horeca-personeel" },
      { label: "Hotelpersoneel inhuren", href: "/hotelpersoneel-inhuren" },
      { label: "Eventpersoneel inhuren", href: "/eventpersoneel-inhuren" },
      { label: "Evenementen personeel inhuren", href: "/evenementen-personeel-inhuren" },
      { label: "Cateringpersoneel inhuren", href: "/cateringpersoneel-inhuren" },
      { label: "Restaurantpersoneel", href: "/horecapersoneel-restaurants" },
      { label: "Flexibel horecapersoneel", href: "/flexibel-horeca-personeel" },
      { label: "Tijdelijk horecapersoneel", href: "/tijdelijk-horeca-personeel" },
    ],
    kolom3Kop: "Werkzoekenden",
    kolom3: [
      { label: "Solliciteer direct", href: "/aanmelden" },
      { label: "Sollicitatieformulier", href: "/sollicitatieformulier" },
      { label: "Vacatures", href: "/vacatures" },
      { label: "Horeca vacatures Amsterdam", href: "/horeca-vacatures-amsterdam" },
      { label: "Horeca werk Amsterdam", href: "/horeca-werk-amsterdam" },
      { label: "Horeca werk", href: "/horeca-werk" },
      { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
      { label: "Housekeeping werk", href: "/housekeeping-werk" },
      { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
      { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" },
      { label: "Hoe werkt dagbetaling", href: "/dagbetaling" },
      { label: "EXTRAATje beloningen", href: "/extraatje" },
    ],
    kolom4Kop: "Bedrijf",
    kolom4: [
      { label: "Over EXTRA", href: "/over-extra" },
      { label: "Ons team", href: "/ons-team" },
      { label: "Onze werkwijze", href: "/onze-werkwijze" },
      { label: "Klantcases", href: "/klantcases-horeca" },
      { label: "Nieuws & blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
    nenKop: "NEN 4400-1 gecertificeerd",
    nenSub: "Gecertificeerd uitzendbureau",
    privacy: "Privacybeleid",
    voorwaarden: "Algemene voorwaarden",
    cookies: "Cookiebeleid",
    contact: "Contact",
    contactHref: "/contact",
  },
  en: {
    ctaKop: "Ready to get started?",
    ctaTekst: "Need staff, or looking for shifts?",
    ctaPrimair: { label: "Request staff", href: "/en/contact" },
    ctaSecundair: { label: "Apply now", href: "/aanmelden?lang=en" },
    logoAlt: "EXTRA Hospitality Staffing Amsterdam",
    merkTekst: (
      <>The hospitality staffing agency in Amsterdam for hotels and events. Flexible hospitality staff, employed by us, with our unique <span className="text-purple-300 font-semibold">EXTRAATje</span> rewards programme.</>
    ),
    plaats: "Amsterdam, the Netherlands",
    kolom2Kop: "For employers",
    kolom2: [
      { label: "Request staff", href: "/en/contact" },
      { label: "How we work", href: "/en/how-we-work" },
      { label: "Why EXTRA", href: "/en/about" },
      { label: "Hospitality staff Amsterdam", href: "/en/hospitality-staff-amsterdam" },
      { label: "Hotel staffing", href: "/en/hotel-staffing-amsterdam" },
      { label: "Event staff", href: "/en/event-staff-amsterdam" },
      { label: "Catering staff", href: "/en/catering-staff-amsterdam" },
      { label: "Restaurant staff", href: "/en/restaurant-staff-amsterdam" },
    ],
    kolom3Kop: "For job seekers",
    kolom3: [
      { label: "Apply now", href: "/aanmelden?lang=en" },
      { label: "Hospitality jobs Amsterdam", href: "/en/hospitality-jobs" },
      { label: "Working in hospitality", href: "/en/hospitality-work" },
      { label: "Housekeeping jobs", href: "/en/housekeeping-jobs" },
      { label: "Chef jobs", href: "/en/chef-jobs" },
      { label: "Front office jobs", href: "/en/front-office-jobs" },
      { label: "EXTRAATje rewards", href: "/en/rewards" },
    ],
    kolom4Kop: "Company",
    kolom4: [
      { label: "About EXTRA", href: "/en/about" },
      { label: "Our team", href: "/en/our-team" },
      { label: "How we work", href: "/en/how-we-work" },
      { label: "Client stories", href: "/en/client-stories" },
      { label: "Contact", href: "/en/contact" },
    ],
    nenKop: "NEN 4400-1 certified",
    nenSub: "Certified staffing agency",
    privacy: "Privacy policy",
    voorwaarden: "Terms & conditions",
    cookies: "Cookie policy",
    contact: "Contact",
    contactHref: "/en/contact",
  },
} as const;

export default function PublicFooter() {
  const [locatie] = useLocation();
  const t = FOOTER_COPY[isEngelsPad(locatie) ? "en" : "nl"];
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
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">{t.ctaKop}</p>
                <p className="text-base sm:text-lg font-bold text-white">
                  {t.ctaTekst}
                </p>
              </div>
              <div className="flex flex-col xs:flex-row gap-3 shrink-0">
                <Link
                  href={t.ctaPrimair.href}
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-white text-sm transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                    boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                  }}
                >
                  {t.ctaPrimair.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={t.ctaSecundair.href}
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm border-2 border-white/20 hover:bg-white/10 hover:border-white/35 transition-all duration-200"
                >
                  {t.ctaSecundair.label}
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
                <img src={extraLogoWit} alt={t.logoAlt} className="h-8 w-auto mb-5" />
              </Link>
              <p className="text-sm leading-relaxed text-purple-200/65 mb-6 max-w-xs">
                {t.merkTekst}
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
                  {t.plaats}
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
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-5">{t.kolom2Kop}</p>
              <ul className="space-y-3">
                {t.kolom2.map((l) => (
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
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-5">{t.kolom3Kop}</p>
              <ul className="space-y-3">
                {t.kolom3.map((l) => (
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
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-5">{t.kolom4Kop}</p>
              <ul className="space-y-3 mb-7">
                {t.kolom4.map((l) => (
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

              {/* NEN trust badge — sinds P15 een link naar de eigen certificeringspagina */}
              <Link
                href="/nen-4400-1-certificering"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl hover:bg-purple-500/20 transition-colors"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
              >
                <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-purple-300">{t.nenKop}</p>
                  <p className="text-[10px] text-purple-400/60 leading-tight">{t.nenSub}</p>
                </div>
              </Link>
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
              {/* De beleidspagina's bestaan alleen in het Nederlands — het zijn
                  juridische teksten, en een vertaling die afwijkt is erger dan
                  geen vertaling. Engels label, Nederlands doel. */}
              <Link href="/privacybeleid" className="hover:text-white transition-colors">
                {t.privacy}
              </Link>
              {/* P15: /voorwaarden en /cookiebeleid waren hier verwijderd omdat de
                  pagina's nog niet bestonden (kapotte interne links). Nu terug. */}
              <Link href="/voorwaarden" className="hover:text-white transition-colors">
                {t.voorwaarden}
              </Link>
              <Link href="/cookiebeleid" className="hover:text-white transition-colors">
                {t.cookies}
              </Link>
              <Link href={t.contactHref} className="hover:text-white transition-colors">
                {t.contact}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
