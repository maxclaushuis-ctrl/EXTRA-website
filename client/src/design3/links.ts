/**
 * Navigatie en footer van design 3.0.
 *
 * Alle links wijzen naar bestaande routes uit shared/routeMeta.ts. Pagina's die
 * in design 3.0 nieuw zijn (functiepagina's, branchepagina's) komen hier pas bij
 * als hun route bestaat; tot die tijd linkt het menu naar de dichtstbijzijnde
 * bestaande pagina.
 */

export interface MenuLink {
  label: string;
  href: string;
  sub?: string;
  /** Kleur van de branche (CSS-variabele zonder --), bijv. "rose". */
  kleur?: string;
}

export interface MenuGroep {
  label: string;
  /** Kop van de lijst; het bolletje ervoor is off-white omdat de lijst algemeen is. */
  kop: string;
  /** Kleur van het bolletje voor de kop (standaard off-white). */
  stip?: string;
  links: MenuLink[];
  /** Het blok rechts in het uitklapmenu (niet in het mobiele menu). */
  cta?: { kop: string; knop: { label: string; href: string }; onder: { label: string; href: string; tel?: boolean } };
}

/**
 * Compact menu (voorstel #18): alleen de belangrijkste pagina's. Alle andere
 * pagina's staan in de footer en zijn via de pagina's zelf bereikbaar.
 * "Werk bij events" en "Werk in de logistiek" komen erbij zodra die pagina's
 * als route bestaan.
 */
export const MENU: MenuGroep[] = [
  {
    label: "Ik zoek extra personeel",
    kop: "Branches",
    links: [
      { label: "Hotels", href: "/hotelpersoneel-inhuren", sub: "Housekeeping, front office, F&B, keuken", kleur: "rose" },
      { label: "Events", href: "/eventpersoneel-inhuren", sub: "Bediening, bar, hosts, catering", kleur: "sky" },
      { label: "Logistiek", href: "/logistiek-personeel-inhuren", sub: "Orderpickers, heftruck, inpak", kleur: "pistachio" },
    ],
    cta: { kop: "Morgen iemand nodig?", knop: { label: "Bel mij terug", href: "/personeelsaanvraag" }, onder: { label: "085 130 59 15", href: "tel:0851305915", tel: true } },
  },
  {
    label: "Ik zoek extra werk",
    kop: "Werk",
    links: [
      { label: "Alle vacatures", href: "/vacatures" },
      { label: "Werk in hotels", href: "/horeca-vacatures-amsterdam", kleur: "rose" },
    ],
    cta: { kop: "Vandaag nog aan de slag?", knop: { label: "Solliciteer direct", href: "/aanmelden" }, onder: { label: "De volgende dag betaald", href: "/dagbetaling" } },
  },
  {
    label: "Over EXTRA",
    kop: "Over ons",
    stip: "pistachio",
    links: [
      { label: "Over EXTRA", href: "/over-extra" },
      { label: "Hoe het werkt", href: "/onze-werkwijze" },
      { label: "Klantcases", href: "/klantcases-horeca" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/** Footer: alle publieke pagina's, zodat geen pagina zonder interne link staat. */
export const FOOTER: { kop: string; links: MenuLink[] }[] = [
  {
    kop: "Werkgevers",
    links: [
      { label: "Personeel aanvragen", href: "/personeelsaanvraag" },
      { label: "Hoe het werkt", href: "/horeca-uitzendbureau-amsterdam-werkwijze" },
      { label: "Waarom EXTRA", href: "/horeca-uitzendbureau-amsterdam" },
      { label: "Horeca personeel Amsterdam", href: "/horeca-personeel-amsterdam" },
      { label: "Horeca personeel", href: "/horeca-personeel" },
      { label: "Hotelpersoneel inhuren", href: "/hotelpersoneel-inhuren" },
      { label: "Eventpersoneel inhuren", href: "/eventpersoneel-inhuren" },
      { label: "Logistiek personeel inhuren", href: "/logistiek-personeel-inhuren" },
      { label: "Evenementen personeel inhuren", href: "/evenementen-personeel-inhuren" },
      { label: "Cateringpersoneel inhuren", href: "/cateringpersoneel-inhuren" },
      { label: "Restaurantpersoneel", href: "/horecapersoneel-restaurants" },
      { label: "Flexibel horecapersoneel", href: "/flexibel-horeca-personeel" },
      { label: "Tijdelijk horecapersoneel", href: "/tijdelijk-horeca-personeel" },
      { label: "Horeca personeel inhuren", href: "/horeca-personeel-inhuren" },
      { label: "Horeca personeel gezocht", href: "/horeca-personeel-gezocht" },
      { label: "Bediening inhuren", href: "/bediening-inhuren" },
    ],
  },
  {
    kop: "Werkzoekenden",
    links: [
      { label: "Solliciteer direct", href: "/aanmelden" },
      { label: "Vacatures", href: "/vacatures" },
      { label: "Horeca vacatures Amsterdam", href: "/horeca-vacatures-amsterdam" },
      { label: "Horeca werk Amsterdam", href: "/horeca-werk-amsterdam" },
      { label: "Horeca werk", href: "/horeca-werk" },
      { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
      { label: "Housekeeping werk", href: "/housekeeping-werk" },
      { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
      { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" },
      { label: "Bijbaan Amsterdam", href: "/bijbaan-amsterdam" },
      { label: "Werken in de horeca", href: "/werken-in-de-horeca" },
      { label: "Hoe werkt dagbetaling", href: "/dagbetaling" },
      { label: "EXTRAATje beloningen", href: "/extraatje" },
    ],
  },
  {
    kop: "Bedrijf",
    links: [
      { label: "Over EXTRA", href: "/over-extra" },
      { label: "Ons team", href: "/ons-team" },
      { label: "Onze werkwijze", href: "/onze-werkwijze" },
      { label: "Klantcases", href: "/klantcases-horeca" },
      { label: "NEN 4400-1", href: "/nen-4400-1-certificering" },
      { label: "Nieuws & blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export const TELEFOON = "085 130 59 15";
export const TELEFOON_HREF = "tel:0851305915";
export const WHATSAPP_HREF = "https://wa.me/31851305915";
export const EMAIL = "info@doehetextra.nl";
