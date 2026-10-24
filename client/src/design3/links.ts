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
}

export interface MenuGroep {
  label: string;
  /** Kolommen in het uitklapmenu; elke kolom heeft een kop en links. */
  kolommen: { kop: string; links: MenuLink[] }[];
}

export const MENU: MenuGroep[] = [
  {
    label: "Ik zoek extra personeel",
    kolommen: [
      {
        kop: "Branches",
        links: [
          { label: "Hotels", href: "/hotelpersoneel-inhuren", sub: "Housekeeping, front office, F&B en keuken" },
          { label: "Events", href: "/eventpersoneel-inhuren", sub: "Bediening, bar, hosts en supervisors" },
          { label: "Logistiek", href: "/logistiek-personeel-inhuren", sub: "Orderpickers, heftruck en magazijn" },
          { label: "Catering", href: "/cateringpersoneel-inhuren" },
          { label: "Restaurants", href: "/horecapersoneel-restaurants" },
        ],
      },
      {
        kop: "Direct regelen",
        links: [
          { label: "Personeel aanvragen", href: "/personeelsaanvraag" },
          { label: "Hoe het werkt", href: "/onze-werkwijze" },
          { label: "NEN 4400-1", href: "/nen-4400-1-certificering" },
          { label: "Klantcases", href: "/klantcases-horeca" },
        ],
      },
    ],
  },
  {
    label: "Ik zoek extra werk",
    kolommen: [
      {
        kop: "Werk",
        links: [
          { label: "Werk in hotels", href: "/horeca-vacatures-amsterdam", sub: "Housekeeping, front office, keuken en F&B" },
          { label: "Alle vacatures", href: "/vacatures" },
          { label: "Housekeeping werk", href: "/housekeeping-werk" },
          { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
          { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" },
        ],
      },
      {
        kop: "Werken via EXTRA",
        links: [
          { label: "Solliciteer direct", href: "/aanmelden" },
          { label: "Dagbetaling", href: "/dagbetaling" },
          { label: "EXTRAATje beloningen", href: "/extraatje" },
          { label: "Bijbaan Amsterdam", href: "/bijbaan-amsterdam" },
        ],
      },
    ],
  },
  {
    label: "Over EXTRA",
    kolommen: [
      {
        kop: "Over ons",
        links: [
          { label: "Over EXTRA", href: "/over-extra" },
          { label: "Ons team", href: "/ons-team" },
          { label: "Onze werkwijze", href: "/onze-werkwijze" },
          { label: "Klantcases", href: "/klantcases-horeca" },
        ],
      },
      {
        kop: "Meer",
        links: [
          { label: "Nieuws en blog", href: "/blog" },
          { label: "Contact", href: "/contact" },
        ],
      },
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
      { label: "Sollicitatieformulier", href: "/sollicitatieformulier" },
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
