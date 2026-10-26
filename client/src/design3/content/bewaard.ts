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

// Op 26 oktober 2026 van Eventpersoneel inhuren en Logistiek personeel inhuren gehaald
// (zelfde indeling als hotels). Mock-up: bewaard-bedrijven-secties.html.

export const waaromEvents: Sectie = {
  "type": "waarom",
  "eyebrow": "Bij events telt alles",
  "h2": "Waarom [[EXTRA]]",
  "lead": "Elke gast, elke dienst, elk moment. Eventlocaties die structureel goed personeel willen, kiezen voor EXTRA.",
  "punten": [
    {
      "ic": "snel",
      "h3": "Flexibel opschalen",
      "p": "Van kleine events tot volle zalen. EXTRA helpt locaties snel opschalen met ervaren personeel dat gewend is aan drukte."
    },
    {
      "ic": "oog",
      "h3": "Persoonlijk geselecteerd",
      "p": "Iedere medewerker heeft eerst een persoonlijk gesprek gehad voordat hij of zij via EXTRA werkt."
    },
    {
      "ic": "hand",
      "h3": "Ervaring met grote events",
      "p": "Onze medewerkers zijn gewend aan volle zalen, strakke planningen en hoge verwachtingen van gasten."
    },
    {
      "ic": "tel",
      "h3": "24 uur per dag bereikbaar",
      "p": "Ook buiten kantooruren staan onze planners klaar wanneer je snel moet schakelen."
    },
    {
      "ic": "ster",
      "h3": "Continu beoordeeld",
      "p": "Na iedere dienst verzamelen we feedback van opdrachtgevers. Alleen medewerkers die goed presteren blijven actief."
    },
    {
      "ic": "schild",
      "h3": "Geen zzp-risico",
      "p": "Alle medewerkers werken bij ons in loondienst en voldoen aan de NEN 4400-1 norm."
    }
  ],
  "check": "NEN 4400-1 gecertificeerd",
  "paddingTop": "110px"
};

export const selectieEvents: Sectie = {
  "type": "hoe",
  "werk": false,
  "id": null,
  "eyebrow": "Selectieproces",
  "h2": "Zo selecteren we [[de juiste mensen]]",
  "lead": "Kwaliteit bij events ontstaat niet vanzelf. We kijken verder dan alleen een cv.",
  "stappen": [
    {
      "h3": "Persoonlijke intake",
      "p": "Iedere medewerker doorloopt een gesprek en beoordeling voordat hij of zij aan de slag kan."
    },
    {
      "h3": "Ervaring en houding",
      "p": "We kijken verder dan werkervaring. Service, houding en werkmentaliteit zijn net zo belangrijk."
    },
    {
      "h3": "Representativiteit",
      "p": "Onze medewerkers zien er verzorgd uit en spreken de taal van hospitality."
    },
    {
      "h3": "Beoordeling na iedere dienst",
      "p": "Opdrachtgevers geven feedback na elk event. Alleen medewerkers die structureel goed presteren blijven actief."
    }
  ],
  "knop": {
    "tekst": "Bel mij terug",
    "href": "#aanvragen"
  },
  "standaard": null
};

export const waaromLogistiek: Sectie = {
  "type": "waarom",
  "eyebrow": "Zekerheid over wie er komt",
  "h2": "Waarom [[EXTRA]]",
  "lead": "Geen gedoe met inwerken, papieren of uitval. Dit is wat je van ons kunt verwachten.",
  "punten": [
    {
      "ic": "hand",
      "h3": "Niemand meer inwerken",
      "p": "Na de eerste keer hoef je niemand meer in te werken. Medewerkers die het bij jou goed doen, zet je in je vaste poule. Bij je volgende aanvraag vragen we hen als eerste."
    },
    {
      "ic": "oog",
      "h3": "Gemeten, niet gegokt",
      "p": "Wij weten wie bij jou goed presteert, omdat we het meten. Na elke dienst leggen we vast hoe iemand het deed. Die beoordelingen bepalen wie we de volgende keer sturen."
    },
    {
      "ic": "schild",
      "h3": "Geen zzp-risico",
      "p": "Iedereen is in loondienst. Loonheffing, cao-beloning en verzekeringen liggen bij ons, niet bij jou. Geen discussie achteraf over schijnzelfstandigheid."
    },
    {
      "ic": "snel",
      "h3": "Snel bij piek en uitval",
      "p": "Ziekmelding om zes uur 's ochtends of een order die er ineens uit moet? Bel ons, dan kijken we meteen wie er beschikbaar is."
    }
  ],
  "check": "NEN 4400-1 gecertificeerd",
  "paddingTop": "110px"
};

export const pouleLogistiek: Sectie = {
  "type": "poule",
  "eyebrow": "Vaste poule",
  "h2": "Dezelfde gezichten, [[elke dienst]]",
  "lead": "Je bouwt je eigen team op. Wie het goed doet, komt terug. Zo ken je de mensen op je vloer en kennen zij jouw procedures.",
  "items": [
    {
      "h3": "Je beoordeelt na elke dienst",
      "sub": "Kort en snel, per medewerker",
      "meta": [
        "Na de dienst"
      ],
      "b": "Jij",
      "small": "beoordeelt"
    },
    {
      "h3": "Goede medewerkers gaan in je poule",
      "sub": "Je eigen favorieten voor jouw locatie",
      "meta": [
        "Vaste poule"
      ],
      "b": "Favoriet",
      "small": "bij jou"
    },
    {
      "h3": "Bij je volgende aanvraag vragen we hen eerst",
      "sub": "Dezelfde gezichten, dezelfde procedures",
      "meta": [
        "Volgende aanvraag"
      ],
      "b": "Eerst",
      "small": "gevraagd"
    }
  ],
  "knop": null
};
