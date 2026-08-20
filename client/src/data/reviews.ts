export type ReviewCategory = "hotels" | "events" | "museums" | "hospitality";

export interface ClientReview {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  companyType: string;
  categories: ReviewCategory[];
  logoKey?: string;
  /**
   * Engelse vertaling van dezelfde review, voor de /en/-pagina's.
   *
   * Vertaald, niet herschreven: het blijft het woord van de klant. De pagina
   * die ze toont zegt erbij dat het een vertaling is. Ontbreekt het veld (de
   * Marriott-review is al Engels), dan wordt `quote` zelf getoond.
   */
  quoteEn?: string;
  roleEn?: string;
  companyTypeEn?: string;
}

export const CLIENT_REVIEWS: ClientReview[] = [
  {
    id: "amrath",
    quote: "Wij werken samen met EXTRA sinds eind oktober 2025 voor de levering van kamermeisjes, AD-, turndown- en minibarmedewerkers aan Grand Hotel Amrâth Amsterdam. EXTRA heeft professionaliteit, betrouwbaarheid en een sterke toewijding aan kwaliteit getoond. De kamermeisjes hebben onze verwachtingen consequent waargemaakt en overtroffen, en zorgen dat onze hotelkamers aan de hoogste normen van netheid en gasttevredenheid voldoen. De communicatie is efficient en responsief, waardoor de samenwerking soepel verloopt. Wij aarzelen niet om EXTRA aan te bevelen bij ieder bedrijf dat op zoek is naar betrouwbare personeelsoplossingen.",
    quoteEn: "We have been working with EXTRA since late October 2025 for the supply of room attendants and AD, turndown and minibar staff at Grand Hotel Amrâth Amsterdam. EXTRA has shown professionalism, reliability and a strong commitment to quality. The room attendants have consistently met and exceeded our expectations, ensuring our hotel rooms meet the highest standards of cleanliness and guest satisfaction. Communication is efficient and responsive, which makes the collaboration run smoothly. We would not hesitate to recommend EXTRA to any company looking for reliable staffing solutions.",
    author: "D. Koops",
    role: "Hotelmanager",
    roleEn: "Hotel Manager",
    company: "Grand Hotel Amrâth Amsterdam",
    companyType: "5-sterren hotel, Amsterdam",
    companyTypeEn: "Five-star hotel, Amsterdam",
    categories: ["hotels", "hospitality"],
    logoKey: "amrath",
  },
  {
    id: "marriott",
    quote: "Extra has consistently supplied skilled and reliable personnel for our kitchen and stewarding departments. The team members provided by Extra have demonstrated excellent professionalism, strong work ethic, and the ability to adapt to the fast-paced environment of our hotel. Their culinary and operational skills have greatly supported our daily operations, and they have consistently met and exceeded our expectations. I confidently endorse Extra and their staff for any hotel or hospitality establishment seeking dedicated and competent personnel.",
    author: "G. Di Domenico",
    role: "Executive Chef",
    company: "Amsterdam Marriott Hotel",
    companyType: "Internationaal hotel, Amsterdam",
    companyTypeEn: "International hotel, Amsterdam",
    categories: ["hotels", "hospitality"],
    logoKey: "marriott",
  },
  {
    id: "radisson",
    quote: "Het proces rondom het uitzetten van diensten verloopt soepel en de kwaliteit van de medewerkers die jullie sturen is goed. Negen van de tien kandidaten die jullie hebben gestuurd, hebben uitstekend gewerkt. Eén kandidaat was wat minder passend, maar daar hebben jullie direct actie op ondernomen, wat we erg waarderen.",
    quoteEn: "The process of scheduling shifts runs smoothly and the quality of the staff you send is good. Nine out of the ten candidates you sent us did excellent work. One candidate was a less good fit, but you acted on that immediately, which we really appreciate.",
    author: "A. Schoenmaker",
    role: "Hotelmanager",
    roleEn: "Hotel Manager",
    company: "Radisson Blu Hotel Amsterdam Airport",
    companyType: "Internationaal hotel, Amsterdam Airport",
    companyTypeEn: "International hotel, Amsterdam Airport",
    categories: ["hotels", "hospitality"],
    logoKey: "radisson",
  },
  {
    id: "westweelde",
    quote: "Vanaf het begin hebben wij prettig en direct contact gehad met het team van EXTRA. Extra levert bij ons een breed scala aan personeelsleden. Waar de samenwerking begon met uitsluitend barpersoneel voor onze nachtclub, leveren zij inmiddels ook onze grootste poule aan BQT-medewerkers voor bruiloften en zakelijke evenementen, sitecrew voor de preproductie en zelfs schoonmaakmedewerkers tijdens de evenementen zelf. Wij zijn zeer tevreden over de kwaliteit van de medewerkers die via Extra bij ons werken. Tijdens de evenementen kunnen we direct schakelen met Extra wanneer zich uitdagingen voordoen en zij reageren snel en adequaat.",
    quoteEn: "From the very start we have had pleasant, direct contact with the EXTRA team. EXTRA supplies us with a wide range of staff. Where the collaboration began with bar staff for our nightclub only, they now also supply our largest pool of banqueting staff for weddings and corporate events, site crew for pre-production, and even cleaning staff during the events themselves. We are very happy with the quality of the people who work with us through EXTRA. During events we can liaise with EXTRA directly whenever challenges come up, and they respond quickly and effectively.",
    author: "D. Sarda",
    role: "Eventmanager",
    roleEn: "Event Manager",
    company: "Westweelde",
    companyType: "Eventlocatie, Amsterdam",
    companyTypeEn: "Event venue, Amsterdam",
    categories: ["events"],
    logoKey: "westweelde",
  },
  {
    id: "artzoo",
    quote: "Bij EXTRA wordt men snel en accuraat geholpen. Als er gebeld wordt voor personeel, maakt niet uit wanneer, er wordt altijd gereageerd en er wordt snel gehandeld zodat de aanvraag snel kan worden opgevuld. Bij EXTRA kan ook worden aangegeven welk niveau personeel er nodig is zodat er een goede match is tussen vraag en aanbod. De prijzen en afspraken zijn duidelijk en transparant en marktconform.",
    quoteEn: "At EXTRA you are helped quickly and accurately. Whenever we call for staff, no matter when, there is always a response and things move fast, so requests are filled quickly. With EXTRA you can also specify the level of staff you need, so supply and demand are well matched. Prices and agreements are clear, transparent and in line with the market.",
    author: "F. de Visser",
    role: "Eventcoordinator",
    roleEn: "Event Coordinator",
    company: "Art Zoo Amsterdam",
    companyType: "Evenementenlocatie, Amsterdam",
    companyTypeEn: "Event venue, Amsterdam",
    categories: ["events", "museums"],
    logoKey: undefined,
  },
  {
    id: "hart",
    quote: "Vanuit het H'ART Museum werken wij met enige regelmaat met personeel van Extra omdat we weten dat we goed gekwalificeerd personeel krijgen dat altijd verzorgd en goed op tijd is. Het team van Extra is duidelijk in de communicatie, zowel het personeel op de vloer als het planningspersoneel, en we werken graag met ze samen.",
    quoteEn: "At H'ART Museum we regularly work with staff from EXTRA because we know we get well-qualified people who are always well-presented and on time. The EXTRA team is clear in its communication, both the staff on the floor and the planning team, and we enjoy working with them.",
    author: "T. Bakkenes",
    role: "Hospitality Manager",
    company: "H'ART Museum",
    companyType: "Museum & culturele locatie, Amsterdam",
    companyTypeEn: "Museum & cultural venue, Amsterdam",
    categories: ["museums", "events"],
    logoKey: "hart",
  },
];

export function getReviewsByCategory(category: ReviewCategory): ClientReview[] {
  return CLIENT_REVIEWS.filter((r) => r.categories.includes(category));
}
