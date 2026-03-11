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
}

export const CLIENT_REVIEWS: ClientReview[] = [
  {
    id: "amrath",
    quote: "Bij EXTRA wordt men snel en accuraat geholpen. Als er gebeld wordt voor personeel, maakt niet uit wanneer, er wordt altijd gereageerd en er wordt snel gehandeld zodat de aanvraag snel kan worden opgevuld. Bij EXTRA kan ook worden aangegeven welk niveau personeel er nodig is zodat er een goede match is tussen vraag en aanbod. De prijzen en afspraken zijn duidelijk en transparant en marktconform. Het is ook geen probleem als de aanvraag toch anders wordt opgevuld en niet door EXTRA. Kortom, bij EXTRA wordt men gehoord, gezien en geaccepteerd.",
    author: "D. Koops",
    role: "Hotelmanager",
    company: "Grand Hotel Amrâth Amsterdam",
    companyType: "5-sterren hotel, Amsterdam",
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
    categories: ["hotels", "hospitality"],
    logoKey: "marriott",
  },
  {
    id: "radisson",
    quote: "Het proces rondom het uitzetten van diensten verloopt soepel en de kwaliteit van de medewerkers die jullie sturen is goed. Negen van de tien kandidaten die jullie hebben gestuurd, hebben uitstekend gewerkt. Eén kandidaat was wat minder passend, maar daar hebben jullie direct actie op ondernomen, wat we erg waarderen.",
    author: "A. Schoenmaker",
    role: "Hotelmanager",
    company: "Radisson Blu Hotel Amsterdam Airport",
    companyType: "Internationaal hotel, Amsterdam Airport",
    categories: ["hotels", "hospitality"],
    logoKey: "radisson",
  },
  {
    id: "westweelde",
    quote: "Vanaf het begin hebben wij prettig en direct contact gehad met het team van EXTRA. Extra levert bij ons een breed scala aan personeelsleden. Waar de samenwerking begon met uitsluitend barpersoneel voor onze nachtclub, leveren zij inmiddels ook onze grootste poule aan BQT-medewerkers voor bruiloften en zakelijke evenementen, sitecrew voor de preproductie en zelfs schoonmaakmedewerkers tijdens de evenementen zelf. Wij zijn zeer tevreden over de kwaliteit van de medewerkers die via Extra bij ons werken. Tijdens de evenementen kunnen we direct schakelen met Extra wanneer zich uitdagingen voordoen en zij reageren snel en adequaat.",
    author: "D. Sarda",
    role: "Eventmanager",
    company: "Westweelde",
    companyType: "Eventlocatie, Amsterdam",
    categories: ["events"],
    logoKey: "westweelde",
  },
  {
    id: "artzoo",
    quote: "Bij EXTRA wordt men snel en accuraat geholpen. Als er gebeld wordt voor personeel, maakt niet uit wanneer, er wordt altijd gereageerd en er wordt snel gehandeld zodat de aanvraag snel kan worden opgevuld. Bij EXTRA kan ook worden aangegeven welk niveau personeel er nodig is zodat er een goede match is tussen vraag en aanbod. De prijzen en afspraken zijn duidelijk en transparant en marktconform.",
    author: "F. de Visser",
    role: "Eventcoordinator",
    company: "Art Zoo Amsterdam",
    companyType: "Evenementenlocatie, Amsterdam",
    categories: ["events", "museums"],
    logoKey: undefined,
  },
  {
    id: "hart",
    quote: "Vanuit het H'ART Museum werken wij met enige regelmaat met personeel van Extra omdat we weten dat we goed gekwalificeerd personeel krijgen dat altijd verzorgd en goed op tijd is. Het team van Extra is duidelijk in de communicatie, zowel het personeel op de vloer als het planningspersoneel, en we werken graag met ze samen.",
    author: "T. Bakkenes",
    role: "Hospitality Manager",
    company: "H'ART Museum",
    companyType: "Museum & culturele locatie, Amsterdam",
    categories: ["museums", "events"],
    logoKey: "hart",
  },
];

export function getReviewsByCategory(category: ReviewCategory): ClientReview[] {
  return CLIENT_REVIEWS.filter((r) => r.categories.includes(category));
}
