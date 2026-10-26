/**
 * BEWAARD VOOR LATER: secties die op 26 oktober 2026 (op verzoek van Max) van
 * Hotelpersoneel inhuren zijn gehaald. Niet in gebruik; terugzetten door het
 * object weer in content/bedrijven.ts (hotels.secties) op te nemen.
 * Mock-up: bewaard-hotels-secties.html.
 */
import type { Sectie } from "../secties";

/** "Ons selectieproces: Hoe wij hotelpersoneel selecteren" */
export const selectieproces: Sectie = {
  "type": "hoe",
  "werk": false,
  "id": "selectie",
  "eyebrow": "Ons selectieproces",
  "h2": "Hoe wij hotelpersoneel [[selecteren]]",
  "lead": "Hotelpersoneel vraagt om meer dan vakkennis. Presentatie, houding en gastvrijheid bepalen de gastbeleving. Daarom selecteren wij op alle drie.",
  "stappen": [
    {
      "h3": "Persoonlijk gesprek op kantoor",
      "p": "Iedere kandidaat komt langs. We beoordelen presentatie, communicatie en hospitality mindset."
    },
    {
      "h3": "Selectie op soft en hard skills",
      "p": "Vakkennis is belangrijk, maar gastvrijheid, representativiteit en nauwkeurigheid zijn doorslaggevend bij hotelplaatsingen."
    },
    {
      "h3": "Hospitality ervaring verifiëren",
      "p": "We controleren eerdere hotelervaring en referenties voordat iemand bij een hotel wordt geplaatst."
    },
    {
      "h3": "Beoordeling na elke hotelplaatsing",
      "p": "Na iedere dienst meten we prestaties en bouwen we per hotel een poule van bewezen medewerkers."
    }
  ],
  "knop": {
    "tekst": "Bel mij terug",
    "href": "#aanvragen"
  },
  "standaard": "Niemand die via EXTRA bij een hotel werkt heeft géén persoonlijk gesprek gehad. [[Dat is onze standaard, geen uitzondering.]]"
};

/** "Waarom EXTRA: Waarom hotels voor EXTRA kiezen" */
export const waaromHotels: Sectie = {
  "type": "waarom",
  "eyebrow": "Waarom EXTRA",
  "h2": "Waarom hotels voor [[EXTRA kiezen]]",
  "lead": "Hotelpersoneel vraagt om meer dan alleen ervaring. Gastvrijheid, representativiteit en consistentie zijn essentieel. EXTRA begrijpt dat.",
  "punten": [
    {
      "ic": "hand",
      "h3": "Vertrouwd met hotelstandaarden",
      "p": "Onze medewerkers kennen het verschil tussen drie en vijf sterren service. Ze werken volgens hotelstandaarden, dresscodes en guestrelations protocollen."
    },
    {
      "ic": "ster",
      "h3": "Vaste gezichten per hotel",
      "p": "Via favorietenpoules bouwen we per hotel een vaste poule op. Medewerkers die jouw procedures kennen en direct inzetbaar zijn."
    },
    {
      "ic": "oog",
      "h3": "Geselecteerd op gastvrijheid",
      "p": "Representativiteit en gastvrijheid zijn doorslaggevend in onze selectie. Iedereen heeft eerst een persoonlijk gesprek gehad."
    },
    {
      "ic": "snel",
      "h3": "Snel schakelen bij uitval",
      "p": "Ziekte of last minute aanvragen? EXTRA is 24 uur per dag bereikbaar en kan snel schakelen."
    },
    {
      "ic": "tel",
      "h3": "Data per medewerker per hotel",
      "p": "Na iedere dienst meten we prestaties. Zo weten we precies wie op jouw locatie het beste presteert."
    },
    {
      "ic": "schild",
      "h3": "Volledig in loondienst",
      "p": "NEN 4400-1 gecertificeerd en conform arbeidswetgeving. Geen zzp-risico's voor hotels."
    }
  ],
  "check": "NEN 4400-1 gecertificeerd",
  "paddingTop": "110px"
};

/** "Data en inzicht: Geselecteerd op bewezen servicescores" */
export const dataInzicht: Sectie = {
  "type": "data",
  "eyebrow": "Data en inzicht",
  "h2": "Geselecteerd op bewezen [[servicescores]]",
  "lead": "Wij registreren elke plaatsing. Per medewerker zie je scores op houding, vaardigheid, kleding en uitstraling per hotelfunctie. Zo plaatsen wij altijd de persoon die bij jouw hotelstandaard en afdeling past, zonder gokken.",
  "lijst": [
    "Elk medewerkersprofiel met functie- en dienstscores",
    "Direct inzicht in wie past bij jouw hotel en afdeling",
    "Objectieve matching op basis van bewezen hotelervaring"
  ],
  "schermen": [
    {
      "src": "/d3/ev-overzicht.webp",
      "alt": "Dashboard met medewerkersoverzicht en scores"
    },
    {
      "src": "/d3/ev-profiel.webp",
      "alt": "Individueel medewerkersprofiel met beoordelingen"
    }
  ]
};
