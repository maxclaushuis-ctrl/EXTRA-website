import { useEffect, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { Link, useParams } from "wouter";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Calendar, ArrowRight, Tag } from "lucide-react";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import extraLogoDark from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import blogHousekeeping from "../assets/images/blog-housekeeping.webp";
import blogCatering from "../assets/images/blog-catering.webp";
import blogBarista from "../assets/images/blog-barista.webp";
import blogTeam from "../assets/images/blog-team.webp";
import blogHotel from "../assets/images/blog-hotel.webp";

function XPatternBg({ count = 3, opacity = 0.08, color = "rgba(139,92,246,1)" }: { count?: number; opacity?: number; color?: string }) {
  const positions = [
    { left: "5%", top: "8%", size: 180, rotate: 15 },
    { left: "82%", top: "18%", size: 150, rotate: -25 },
    { left: "55%", top: "55%", size: 220, rotate: 35 },
    { left: "12%", top: "72%", size: 160, rotate: -10 },
    { left: "88%", top: "78%", size: 130, rotate: 45 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {positions.slice(0, count).map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: pos.left, top: pos.top,
            width: pos.size, height: pos.size,
            transform: `rotate(${pos.rotate}deg)`,
            opacity,
            WebkitMaskImage: `url(${xPatroon})`,
            maskImage: `url(${xPatroon})`,
            WebkitMaskSize: "contain", maskSize: "contain",
            WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
            WebkitMaskPosition: "center", maskPosition: "center",
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  "Hospitality":      { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  "Events & Catering":{ bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  "Horeca":           { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  "Housekeeping":     { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  "EXTRA Nieuws":     { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
  "Branche":          { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
};

type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "tip"; text: string }
  | { type: "quote"; text: string; author?: string };

interface Article {
  slug: string;
  image: string;
  category: string;
  title: string;
  summary: string;
  date: string;
  readTime: string;
  content: ArticleBlock[];
}

const articles: Article[] = [
  {
    slug: "vijf-tips-onvergetelijke-gastervaring",
    image: blogHousekeeping,
    category: "Hospitality",
    title: "Vijf tips voor een onvergetelijke gastervaring in je hotel",
    summary: "Van persoonlijke welkomstmomenten tot kleine verrassingen op de kamer, ontdek hoe tophotels het verschil maken en gasten keer op keer terug laten komen.",
    date: "18 feb 2026",
    readTime: "4 min",
    content: [
      { type: "p", text: "Een hotel kan nog zulke mooie kamers hebben, als de gastervaring tegenvalt, onthouden mensen dat. En in de horecawereld van vandaag verspreid een negatieve review zich sneller dan een glimlach bij de receptie. Dus: hoe zorg je ervoor dat gasten niet alleen tevreden vertrekken, maar écht blij?" },
      { type: "h2", text: "1. Maak van het eerste moment een statement" },
      { type: "p", text: "De eerste indruk wordt gevormd in de eerste tien seconden. Dat betekent: een warme begroeting bij de ingang, snel inchecken zonder gedoe, en liefst een kleine verrassing, een welkomstdrankje, een persoonlijke noot op de kamer. Kleine dingen, groot effect." },
      { type: "h2", text: "2. Ken je gast voor ze binnenstapt" },
      { type: "p", text: "Gebruik de informatie die je al hebt. Viert iemand een verjaardag? Noteert een gast bij de reservering dat ze allergisch zijn voor bloemen? Gebruik dat. Gasten voelen het als je écht aandacht hebt besteed aan wie ze zijn." },
      { type: "tip", text: "Vraag bij de reservering altijd om het aankomstdoel, zakelijk, vakantie, speciale gelegenheid. Zo kan je personeel de juiste sfeer neerzetten vóór de gast er is." },
      { type: "h2", text: "3. Train je mensen op menselijkheid" },
      { type: "p", text: "Scripts zijn handig, maar gastvrijheid kun je niet scriptmatig overbrengen. Train je medewerkers op empathie, improvisatievermogen en het lef om een gast verrast achter te laten. Bij EXTRA selecteren en trainen we medewerkers juist op die menselijke kant, niet alleen op de technische vaardigheden." },
      { type: "ul", items: [
        "Oogcontact maken en een echte glimlach",
        "Actief luisteren zonder de gast te onderbreken",
        "Problemen oplossen zonder te escaleren naar een manager",
        "Kleine extra's aanbieden zonder dat het opdringerig voelt",
      ]},
      { type: "h2", text: "4. Zorg voor consistentie op elk touchpoint" },
      { type: "p", text: "De gastervaring stopt niet bij de receptie. Roomservice, het restaurant, de spa, de checkout, elk moment telt. Zorg ervoor dat de toon en het servicelevel overal hetzelfde zijn. Gasten merken inconsistentie meteen." },
      { type: "h2", text: "5. Vraag om feedback en doe er écht iets mee" },
      { type: "p", text: "Een feedbackkaartje op de kamer is aardig. Een follow-up na het verblijf is beter. Maar het échte verschil maak je door die feedback intern te verwerken, in trainingen, in procedures, in je cultuur. Een gastervaring verbeter je nooit alleen op papier." },
      { type: "quote", text: "Gasten vergeten wat je zei, maar nooit hoe je ze het gevoel gaf.", author: "Maya Angelou (vrij vertaald naar hospitality)" },
      { type: "p", text: "Bij EXTRA leveren we hotelmedewerkers die niet alleen de functie uitvoeren, maar écht bijdragen aan die onvergetelijke ervaring. Wil je weten hoe wij dat doen? Neem dan gerust contact op." },
    ],
  },
  {
    slug: "perfecte-catering-bedrijfsevent",
    image: blogCatering,
    category: "Events & Catering",
    title: "Hoe plan je de perfecte catering voor een bedrijfsevent?",
    summary: "Een goed doordacht menu en professioneel serviceteam tillen elk evenement naar een hoger niveau. Wij delen de beste praktijktips.",
    date: "12 feb 2026",
    readTime: "5 min",
    content: [
      { type: "p", text: "Een bedrijfsevent organiseren is al complex genoeg. Maar dan de catering ook nog goed neerzetten? Dat vraagt planning, het juiste personeel en oog voor detail. Of het nu gaat om een borrel voor 50 mensen of een driedaagse conferentie voor 500, de catering bepaalt mede hoe jouw evenement wordt herinnerd." },
      { type: "h2", text: "Begin met de juiste vragen" },
      { type: "p", text: "Voordat je ook maar een hapje plant, moet je een paar dingen weten. Hoeveel gasten komen er precies? Zijn er dieetwensen of allergieën? Wat is de sfeer, formeel, informeel, zakelijk, feestelijk? En misschien wel het belangrijkst: wat is het doel van het evenement?" },
      { type: "ul", items: [
        "Netwerkevent → bites en drankjes die rondlopen makkelijk maken",
        "Teamdag → een warme gezamenlijke lunch creëert verbinding",
        "Productpresentatie → catering mag niet afleiden, maar wel imponeren",
        "Gala → meergangendiner met gepresenteerde service",
      ]},
      { type: "h2", text: "Kies een menu dat iedereen raakt" },
      { type: "p", text: "Diversiteit in je menu is tegenwoordig geen luxe maar een must. Zorg voor vegane, vegetarische en glutenvrije opties, niet als afterthought, maar als volwaardige onderdelen van het menu. Gasten die iets niet kunnen eten, voelen dat je aan ze hebt gedacht." },
      { type: "tip", text: "Vraag na aanmelding altijd naar dieetwensen. En communiceer dat intern aan je cateringteam met een duidelijke lijst, niet een aantekening op een post-it." },
      { type: "h2", text: "Het team maakt het verschil" },
      { type: "p", text: "Het mooiste menu valt in het niet als het serviceteam het niet waar kan maken. Denk aan: voldoende mensen voor de bezetting, duidelijke taakverdeling, en medewerkers die onder druk vriendelijk en snel blijven. Dat is precies het type personeel dat wij bij EXTRA leveren voor events en catering." },
      { type: "h2", text: "Timing is alles" },
      { type: "p", text: "Catering moet niet concurreren met het programma. Plan de drinkjes vóór de opening, de lunch tussen de sessies, en de borrel ná het officiële gedeelte. Klinkt logisch, maar je ziet het nog vaak mis gaan. Bespreek de tijdlijn met je cateringteam tot op het kwartier nauwkeurig." },
      { type: "h2", text: "Presentatie doet ertoe" },
      { type: "p", text: "Food styling is niet alleen voor Instagram. Een mooi gepresenteerde buffettafel verhoogt de perceptie van kwaliteit, zelfs als het dezelfde kaas is als bij de supermarkt. Zorg voor goede schalen, hoogteverschillen, verse kruiden als garnering en een opgeruimde opstelling." },
      { type: "quote", text: "Een event is geslaagd als de catering onzichtbaar was, en de gasten er toch over praten.", author: "Eventmanager, Amsterdam" },
      { type: "p", text: "Heb jij een event gepland en zoek je cateringpersoneel dat het écht waarmaakt? EXTRA levert flexibele, getrainde medewerkers voor elk formaat event." },
    ],
  },
  {
    slug: "barista-als-visitekaartje",
    image: blogBarista,
    category: "Horeca",
    title: "De barista als visitekaartje: waarom kwaliteit telt",
    summary: "Gasten verwachten meer dan koffie. Een goede barista biedt beleving, snelheid en een glimlach. Zo maak jij het verschil.",
    date: "5 feb 2026",
    readTime: "3 min",
    content: [
      { type: "p", text: "Koffie is allang geen bijzaak meer. De barista is voor veel gasten de eerste medewerker die ze zien, de eerste interactie van hun dag. Dat maakt de barista, misschien meer dan wie dan ook, het visitekaartje van je zaak." },
      { type: "h2", text: "Meer dan een goede espresso" },
      { type: "p", text: "Een goede barista beheerst de techniek: de juiste maling, de perfecte extractietijd, het schuimen van melk zonder luchtbelletjes. Maar dat is pas het begin. De echte toegevoegde waarde zit in de interactie. Een gast die gehaast binnenkomt, verdient een snelle maar vriendelijke afhandeling. Een gast die wil kletsen, een open houding." },
      { type: "ul", items: [
        "Consistente kwaliteit, ook in de ochtendspits",
        "Snelheid zonder dat het gejaagd voelt",
        "Onthoud vaste klanten en hun bestelling",
        "Zorg dat de koffiebar er altijd verzorgd uitziet",
      ]},
      { type: "h2", text: "Training maakt het verschil" },
      { type: "p", text: "De beste barista's zijn niet vanzelf zo geworden. Regelmatige training, zowel op techniek als op gastheerschap, houdt de kwaliteit hoog. Laat barista's onderling proeven, bespreek kwaliteitsverschillen, en investeer in goede apparatuur die consistent werkt." },
      { type: "tip", text: "Laat barista's maandelijks een blinde smaaktest doen van hun eigen koffie versus een referentie. Je zult zien dat kleine aanpassingen in maling of temperatuur grote impact hebben." },
      { type: "h2", text: "De beleving verkoopt meer" },
      { type: "p", text: "Een gast die blij is met zijn koffie-ervaring, bestelt vaker een extra koek, komt sneller terug, en tipt vrienden. Het is geen toeval dat de meest succesvolle koffiezaken investeren in het vak, en in de mensen die het vak uitoefenen." },
      { type: "quote", text: "Een perfecte flat white is goed. Een perfecte flat white gemaakt door iemand die blij is om je te zien? Dat is onbetaalbaar.", author: "Horecaondernemer, Utrecht" },
      { type: "p", text: "Bij EXTRA leveren we barista's en horecamedewerkers die niet alleen technisch goed zijn, maar ook de juiste energie meebrengen. Want die combinatie is wat je zaak onderscheidt." },
    ],
  },
  {
    slug: "medewerker-van-de-maand-priya",
    image: blogTeam,
    category: "EXTRA Nieuws",
    title: "Medewerker van de maand: het verhaal van Priya",
    summary: "Na drie maanden bij EXTRA verdiende Priya haar eerste beloning. Lees hoe het EXTRAATje-systeem haar motiveert om elke dag het beste te geven.",
    date: "28 jan 2026",
    readTime: "4 min",
    content: [
      { type: "p", text: "Priya werkt nu vier maanden bij EXTRA. Ze begon als horecamedewerker bij een van onze vaste opdrachtgevers, een hotelrestaurant in het centrum van Amsterdam. Wat haar opviel? Dat ze punten kon verdienen voor iets wat ze toch al deed: haar werk goed doen." },
      { type: "h2", text: "Haar eerste dienst bij EXTRA" },
      { type: "p", text: "\"Ik kende het systeem niet, maar mijn teamleider legde het uit. Na de eerste dienst zag ik al punten op mijn account. Dat gaf een goed gevoel, niet alleen het werk zelf, maar ook de erkenning eromheen.\"" },
      { type: "p", text: "Priya werkte eerder bij een paar andere uitzendbureaus. Het verschil met EXTRA, zegt ze, is de communicatie. \"Je weet altijd waar je aan toe bent. En als er iets is, bel je gewoon.\"" },
      { type: "h2", text: "Challenges als extra motivatie" },
      { type: "p", text: "Via het EXTRAATje-platform kan je deelnemen aan challenges, kleine doelen die je extra punten opleveren. Denk aan: 5 diensten draaien in één maand, last-minute beschikbaar zijn, of een 5-sterrenreview krijgen van een opdrachtgever." },
      { type: "ul", items: [
        "Diensten Draaier: punten voor elke gewerkte shift",
        "Last-minute Held: beschikbaar zijn wanneer het telt",
        "Klantfavoriet: een 5-sterren review verdienen",
        "Verjaardag: een extraatje op je bijzondere dag",
      ]},
      { type: "tip", text: "Je kunt je punten inzien via de app en precies zien hoeveel je nog nodig hebt voor je volgende beloning. Dat geeft richting." },
      { type: "h2", text: "Haar eerste beloning" },
      { type: "p", text: "Na drie maanden had Priya genoeg punten voor een Pathé bioscoopbon. \"Ik had hem al een tijdje in het oog, ik ga zelden naar de bioscoop omdat het duur is. En nu kon ik dat gewoon inruilen voor punten die ik verdiend had met werken. Dat vond ik echt gaaf.\"" },
      { type: "quote", text: "Het gevoel dat je werk wordt opgemerkt, dat maakt het verschil. Niet alleen het geld, maar de waardering.", author: "Priya, horecamedewerker bij EXTRA" },
      { type: "h2", text: "Wat motiveert haar nu?" },
      { type: "p", text: "Priya heeft haar oog laten vallen op de AirPods Pro. \"Nog een paar maanden goed werken en dan is het zover.\" Ze lacht. Dat is precies het punt van EXTRAATje: kleine doelen, echte beloningen, en medewerkers die gemotiveerd blijven." },
    ],
  },
  {
    slug: "personeelstekort-horeca-2026",
    image: blogHotel,
    category: "Branche",
    title: "Personeelstekort in de horeca: trends en oplossingen voor 2026",
    summary: "De horecasector kampt met structurele tekorten. EXTRA zet in op beloning, begeleiding en flexibiliteit als antwoord op deze uitdaging.",
    date: "20 jan 2026",
    readTime: "6 min",
    content: [
      { type: "p", text: "Het is geen geheim: de horecasector heeft moeite om voldoende mensen te vinden én te behouden. In 2025 stond gemiddeld één op de tien horecafuncties open. In 2026 is dat beeld nauwelijks verbeterd. Maar wat zijn de oorzaken, en belangrijker, wat werkt er wél?" },
      { type: "h2", text: "De oorzaken op een rij" },
      { type: "p", text: "Het tekort is niet één probleem maar een samenspel van factoren. De arbeidsmarkt is krap, de instroom vanuit opleidingen daalt, en de uitstroom neemt toe. Horecamedewerkers geven aan dat onregelmatige werktijden, beperkte doorgroeimogelijkheden en gebrek aan waardering hen doen vertrekken." },
      { type: "ul", items: [
        "Onregelmatige diensten die het privéleven beïnvloeden",
        "Weinig transparantie over werkomstandigheden en beloning",
        "Beperkte erkenning voor goed werk",
        "Hoge werkdruk in combinatie met seizoenspieken",
        "Nieuwe arbeidswetgeving die zzp-constructies inperkt",
      ]},
      { type: "h2", text: "Wat verandert er in 2026?" },
      { type: "p", text: "De nieuwe arbeidswetgeving van 2026 maakt zzp-constructies in de horeca een stuk lastiger. Dat betekent dat bedrijven die veel met zelfstandigen werkten, nu op zoek moeten naar betrouwbare alternatieven. De vraag naar goed georganiseerde uitzendbureaus stijgt daardoor fors." },
      { type: "tip", text: "Check of je huidige personeelsbeleid klaar is voor de nieuwe wetgeving. EXTRA werkt uitsluitend met medewerkers in loondienst, zo ben je altijd compliant." },
      { type: "h2", text: "Waarom beloning het verschil maakt" },
      { type: "p", text: "Onderzoek toont aan dat medewerkers langer blijven als ze zich gewaardeerd voelen, niet alleen financieel, maar ook immaterieel. Erkenning voor goed werk, doorgroeimogelijkheden en flexibiliteit zijn even belangrijk als het salaris. Dat is de gedachte achter ons EXTRAATje-beloningssysteem." },
      { type: "h2", text: "Flexibiliteit als oplossing" },
      { type: "p", text: "De horeca heeft van nature pieken en dalen. De oplossing is niet meer vast personeel aannemen dan nodig, dat levert bij dalen juist problemen op. De oplossing is een betrouwbare, flexibele schil: medewerkers die beschikbaar zijn wanneer je ze nodig hebt, goed getraind, en gemotiveerd om terug te komen." },
      { type: "quote", text: "De horecasector heeft geen personeelsprobleem. Het heeft een waarderingsprobleem. Los dat op, en de mensen komen vanzelf.", author: "Sectoranalist, Koninklijke Horeca Nederland" },
      { type: "h2", text: "Wat doet EXTRA anders?" },
      { type: "p", text: "EXTRA biedt medewerkers zekerheid (loondienst), erkenning (punten en beloningen), en begeleiding (feedback na elke dienst). Voor opdrachtgevers betekent dat: mensen die gemotiveerd zijn, terugkomen, en het verschil maken op de werkvloer." },
    ],
  },
  {
    slug: "housekeeping-standaarden-verhogen",
    image: blogHousekeeping,
    category: "Housekeeping",
    title: "Housekeeping: zo verhoog je de standaard in jouw hotel",
    summary: "Schone kamers zijn de basis, maar échte gastvrijheid gaat verder. Ontdek de nieuwste trends in housekeeping die het verschil maken.",
    date: "15 jan 2026",
    readTime: "4 min",
    content: [
      { type: "p", text: "Een hotel is zo goed als zijn slechtste kamer. Housekeeping is de ruggengraat van elk verblijf, en toch wordt het vaak onderschat. Niet omdat mensen het niet waarderen, maar omdat het onzichtbaar moet zijn. En dat is precies de kunst." },
      { type: "h2", text: "Schoon is niet hetzelfde als hospitality" },
      { type: "p", text: "Een kamer kan technisch schoon zijn en toch een onprettig gevoel geven. De temperatuur klopt niet, het kussen ruikt naar wasmiddel, de afstandsbediening lag verkeerd. Housekeeping die écht klasse heeft, let op de details die gasten niet bewust opmerken, maar wél onbewust voelen." },
      { type: "ul", items: [
        "Kamers die ruiken naar frisheid, niet naar chemie",
        "Beddengoed dat perfect glad ligt, zonder kreukels",
        "Persoonlijke touches: een welkomstkaartje, netjes gerangschikte toiletartikelen",
        "Zichtbaar toezicht op elk detail vóór de kamer wordt vrijgegeven",
      ]},
      { type: "h2", text: "Efficiëntie en kwaliteit hand in hand" },
      { type: "p", text: "Housekeepingteams staan onder druk: meer kamers in minder tijd, terwijl de standaard omhoog gaat. De sleutel is een goed systeem. Vaste kamervolgorde, duidelijke checklists, en medewerkers die weten wat prioriteit heeft bij tijdgebrek." },
      { type: "tip", text: "Gebruik een digitale kamerlijst die in real time wordt bijgewerkt. Zo weet de receptie altijd welke kamer beschikbaar is, en kunnen gasten eerder inchecken, wat direct impact heeft op de beoordeling." },
      { type: "h2", text: "Investeer in je housekeeping team" },
      { type: "p", text: "Housekeeping wordt vaak als laagdrempelig gezien, maar goed housekeepingpersoneel is schaars. Medewerkers die trots zijn op hun werk, consistent presteren en oog hebben voor detail, dat zijn mensen die je wilt behouden." },
      { type: "p", text: "Bij EXTRA selecteren we housekeepingmedewerkers die meer doen dan de basics. Ze worden begeleid, beoordeeld na elke opdracht, en beloond voor consistent goed werk via ons EXTRAATje-systeem." },
      { type: "h2", text: "De trend: duurzaamheid in housekeeping" },
      { type: "p", text: "Steeds meer gasten letten op duurzaamheid. Dat betekent: linnenwissel op aanvraag, refillbare dispensers in plaats van kleine flesjes, en schoonmaakmiddelen zonder schadelijke stoffen. Hotels die dit goed doen, scoren hoger op reviewplatformen én verlagen hun kosten." },
      { type: "quote", text: "Een schone kamer is niet het einde van ons werk, het is het begin van een goed verblijf.", author: "Housekeeping supervisor, EXTRA" },
      { type: "p", text: "Wil je de housekeeping in jouw hotel naar een hoger niveau tillen? EXTRA levert getrainde medewerkers die de lat leggen waar jij hem wil. Vraag gerust een offerte aan." },
    ],
  },
];

export default function NieuwsArtikel() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const staticArticle = articles.find(a => a.slug === slug);

  const { data: dbPost, isLoading: dbLoading } = useQuery<any>({
    queryKey: [`/api/blog/${slug}`],
    staleTime: 60000,
    retry: false,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (dbLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!dbPost && !staticArticle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-5">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Artikel niet gevonden</h1>
        <Link href="/nieuws" className="text-purple-600 font-semibold hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Terug naar nieuws
        </Link>
      </div>
    );
  }

  // If DB post exists, render it as HTML
  if (dbPost) {
    const cat = categoryColors[dbPost.category] || { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" };
    const pubDate = dbPost.publishedAt ? new Date(dbPost.publishedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const baseUrl = 'https://www.doehetextra.nl';

    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": dbPost.title,
      "description": dbPost.metaDescription || dbPost.excerpt,
      "image": dbPost.imageUrl || `${baseUrl}/og-image.jpg`,
      "datePublished": dbPost.publishedAt || dbPost.createdAt,
      "dateModified": dbPost.updatedAt || dbPost.publishedAt || dbPost.createdAt,
      "author": { "@type": "Organization", "name": dbPost.author || "EXTRA Redactie", "url": baseUrl },
      "publisher": { "@type": "Organization", "name": "EXTRA", "url": baseUrl, "logo": { "@type": "ImageObject", "url": `${baseUrl}/logo.png` } },
      "url": `${baseUrl}/nieuws/${dbPost.slug}`,
      "keywords": dbPost.focusKeyword,
    };

    return (
      <div className="min-h-screen bg-white font-sans antialiased" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
        {dbPost.metaTitle && <title>{dbPost.metaTitle}</title>}

        <PublicNav />

        {/* Hero */}
        <div className="relative pt-16 sm:pt-20 overflow-hidden">
          <div className="relative h-[260px] sm:h-[360px] lg:h-[440px] overflow-hidden">
            {dbPost.imageUrl ? (
              <img src={dbPost.imageUrl} alt={dbPost.imageAlt || dbPost.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
          </div>
        </div>

        {/* Content */}
        <div className="relative bg-white overflow-hidden">
          <XPatternBg count={4} opacity={0.04} color="rgba(139,92,246,1)" />
          <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 lg:px-6 py-10 sm:py-16">
            <Link href="/nieuws" className="inline-flex items-center gap-1.5 text-sm text-purple-600 font-medium hover:text-purple-800 mb-6 sm:mb-8 group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Alle artikelen
            </Link>

            <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-4 border ${cat.bg} ${cat.text} ${cat.border}`}>{dbPost.category}</span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-5 sm:mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>{dbPost.title}</h1>
            {dbPost.metaDescription && <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6 border-l-4 border-purple-200 pl-4 italic">{dbPost.metaDescription}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8 sm:mb-12 pb-8 sm:pb-10 border-b border-gray-100">
              {pubDate && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{pubDate}</span>}
              {dbPost.readTime && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{dbPost.readTime} lezen</span>}
              {dbPost.author && <span className="flex items-center gap-1.5 text-purple-600 font-medium">{dbPost.author}</span>}
            </div>

            <div
              className="max-w-none
                [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-gray-100
                [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-5
                [&_ul]:my-5 [&_ul]:space-y-2
                [&_li]:text-gray-700 [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li]:before:content-['→'] [&_li]:before:text-purple-400 [&_li]:before:font-bold [&_li]:before:mt-0.5 [&_li]:before:shrink-0
                [&_blockquote]:border-l-4 [&_blockquote]:border-purple-300 [&_blockquote]:bg-purple-50 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:rounded-r-xl [&_blockquote]:my-8 [&_blockquote]:text-purple-900 [&_blockquote]:italic [&_blockquote]:text-lg
                [&_.tip]:bg-amber-50 [&_.tip]:border [&_.tip]:border-amber-200 [&_.tip]:rounded-xl [&_.tip]:px-5 [&_.tip]:py-4 [&_.tip]:my-6 [&_.tip]:text-amber-900 [&_.tip]:text-sm
                [&_a]:text-purple-600 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-purple-800
                [&_strong]:text-gray-900 [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(dbPost.content) }}
            />

            {/* Internal links CTA */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 sm:p-8 text-white">
                <h3 className="text-lg sm:text-xl font-bold mb-2">Horeca personeel nodig?</h3>
                <p className="text-purple-200 text-sm sm:text-base mb-4">EXTRA is hét horeca uitzendbureau in Amsterdam. Flexibel, betrouwbaar en snel geschakeld.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/werkgevers" className="bg-white text-purple-700 font-semibold px-4 py-2 rounded-full text-sm hover:bg-purple-50 transition-colors">Personeel aanvragen</Link>
                  <Link href="/ik-zoek-extra-werk" className="border border-white/30 text-white font-semibold px-4 py-2 rounded-full text-sm hover:bg-white/10 transition-colors">Werk zoeken</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PublicFooter />
      </div>
    );
  }

  // Fall back to static article
  const article = staticArticle!;
  const cat = categoryColors[article.category] || { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" };
  const related = articles.filter(a => a.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-white font-sans antialiased" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <PublicNav />

      {/* ── HERO / HEADER ── */}
      <div className="relative pt-16 sm:pt-20 overflow-hidden">
        <div className="relative h-[260px] sm:h-[360px] lg:h-[440px] overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-transparent" />
        </div>
      </div>

      {/* ── ARTIKEL INHOUD ── */}
      <div className="relative bg-white overflow-hidden">
        <XPatternBg count={4} opacity={0.04} color="rgba(139,92,246,1)" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 lg:px-6 py-10 sm:py-16">

          {/* Teruglink boven artikel */}
          <Link
            href="/nieuws"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Terug naar nieuws &amp; blogs
          </Link>

          {/* Categorie badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
              <Tag className="w-3 h-3" />
              {article.category}
            </span>
          </div>

          {/* Titel */}
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-5 sm:mb-6"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {article.title}
          </h1>

          {/* Meta: datum + leestijd */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 sm:mb-10 pb-8 sm:pb-10 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              {article.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              {article.readTime} lezen
            </span>
          </div>

          {/* Samenvatting */}
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-10 sm:mb-12 font-medium border-l-4 border-purple-400 pl-5 bg-purple-50/50 py-4 rounded-r-xl">
            {article.summary}
          </p>

          {/* Artikel blocks */}
          <div className="space-y-6 sm:space-y-8">
            {article.content.map((block, i) => {
              if (block.type === "p") {
                return (
                  <p key={i} className="text-gray-700 text-base sm:text-lg leading-relaxed sm:leading-loose">
                    {block.text}
                  </p>
                );
              }
              if (block.type === "h2") {
                return (
                  <h2 key={i} className="text-xl sm:text-2xl font-black text-gray-900 mt-10 sm:mt-14 mb-2 pt-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "h3") {
                return (
                  <h3 key={i} className="text-lg sm:text-xl font-bold text-gray-800 mt-6 sm:mt-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {block.text}
                  </h3>
                );
              }
              if (block.type === "ul") {
                return (
                  <ul key={i} className="space-y-3">
                    {block.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-gray-700 text-base sm:text-lg leading-relaxed">
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (block.type === "tip") {
                return (
                  <div key={i} className="relative rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-5 sm:p-6 my-8 sm:my-10">
                    <span className="inline-block text-xs font-black text-purple-600 uppercase tracking-wider mb-2">💡 Tip</span>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed">{block.text}</p>
                  </div>
                );
              }
              if (block.type === "quote") {
                return (
                  <blockquote key={i} className="relative my-10 sm:my-14 pl-6 sm:pl-8 border-l-4 border-purple-500">
                    <p className="text-xl sm:text-2xl font-semibold text-gray-800 leading-snug italic mb-3">
                      &ldquo;{block.text}&rdquo;
                    </p>
                    {block.author && (
                      <cite className="text-sm text-gray-500 not-italic">— {block.author}</cite>
                    )}
                  </blockquote>
                );
              }
              return null;
            })}
          </div>

          {/* CTA onderaan */}
          <div className="mt-14 sm:mt-20 pt-10 sm:pt-12 border-t border-gray-100">
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 p-7 sm:p-10 text-center">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Interesse in samenwerken?
              </h3>
              <p className="text-purple-200 text-sm sm:text-base mb-6 max-w-md mx-auto">
                Of je nu personeel zoekt of op zoek bent naar een leuke job, EXTRA helpt je verder.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/personeelsaanvraag"
                  className="group inline-flex items-center justify-center gap-2 bg-white text-purple-700 font-bold px-6 py-3 rounded-full hover:shadow-lg transition-all hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  Personeel aanvragen
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a
                  href="/aanmelden"
                  className="group inline-flex items-center justify-center gap-2 border border-white/30 text-white font-bold px-6 py-3 rounded-full hover:bg-white/10 transition-all hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  Ik zoek werk
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── GERELATEERDE ARTIKELEN ── */}
      <div className="relative bg-gradient-to-br from-purple-50 via-white to-purple-50 overflow-hidden py-14 sm:py-20">
        <XPatternBg count={3} opacity={0.05} color="rgba(139,92,246,1)" />
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-6">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Meer artikelen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {related.map(rel => {
              const relCat = categoryColors[rel.category] || { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" };
              return (
                <Link key={rel.slug} href={`/nieuws/${rel.slug}`}>
                  <article className="group bg-white rounded-2xl overflow-hidden border border-purple-100 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <div className="relative h-[160px] sm:h-[180px] overflow-hidden">
                      <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className={`absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${relCat.bg} ${relCat.text} ${relCat.border}`}>
                        {rel.category}
                      </span>
                    </div>
                    <div className="p-4 sm:p-5">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
                        {rel.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{rel.date}</span>
                        <span>{rel.readTime} lezen</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/nieuws"
              className="inline-flex items-center gap-2 text-purple-600 font-bold hover:text-purple-800 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" /> Alle artikelen bekijken
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
