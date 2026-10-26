/**
 * GEGENEREERD uit de mock-up van design 3.0 (scripts buiten de repo).
 * Teksten mogen hier met de hand worden aangepast.
 */
import type { PaginaContent } from "../secties";

export const hotels: PaginaContent = {
  "sector": "horeca",
  "functies": [
    "Housekeeping",
    "Front office",
    "F&B",
    "Banqueting",
    "Keuken",
    "Afwas en keukenhulp"
  ],
  "secties": [
    {
      "type": "hero",
      "werk": false,
      "foto": "/d3/bellboy.webp",
      "pos": "50% 36%",
      "chip": "{reviews} · NEN-4400-1 gecertificeerd",
      "h1": [
        "Hotelpersoneel nodig?",
        "Wij [[cheffen]] het!"
      ],
      "reageer": "Reageer direct",
      "knoppen": [
        {
          "tekst": "Bel mij terug",
          "href": "#aanvragen",
          "vol": true,
          "tel": false
        },
        {
          "tekst": "Personeel aanvragen",
          "href": "/personeelsaanvraag?branche=hotel",
          "vol": false,
          "tel": false
        },
        {
          "tekst": "085 130 59 15",
          "href": "tel:0851305915",
          "vol": false,
          "tel": true
        }
      ],
      "lockup": [
        "Hospitality",
        "experts"
      ],
      "lead": "Van housekeeping tot banqueting, van front office tot F&B. EXTRA levert flexibel hotelpersoneel dat hotelstandaarden begrijpt. Iedere medewerker persoonlijk geselecteerd en volledig in loondienst.",
      "vink": [
        [
          "NEN 4400-1",
          "Gecertificeerd"
        ],
        [
          "in loondienst",
          "Iedereen"
        ],
        [
          "hotelstandaarden",
          "Ervaring met"
        ],
        [
          "48 uur",
          "Meestal binnen"
        ]
      ],
      "vink4": true
    },
    {
      "type": "hierwerk",
      "eyebrow": "Opdrachtgevers",
      "h2": "Vertrouwd door [[hotels]]",
      "p": "Van grand hotel tot boutique. Een paar van de hotels die met EXTRA werken.",
      "logos": [
        {
          "src": "/d3/Logo_amrath_1771267205959.webp",
          "alt": "Grand Hotel Amrâth",
          "h": 66,
          "vol": false
        },
        {
          "src": "/d3/Logo_Marriott_1771267205959.webp",
          "alt": "Marriott",
          "h": 60,
          "vol": false
        },
        {
          "src": "/d3/Logo_Hilton_1771267205959.webp",
          "alt": "Hilton",
          "h": 54,
          "vol": false
        },
        {
          "src": "/d3/Logo_Pulitzer_1773389329669.webp",
          "alt": "Pulitzer",
          "h": 44,
          "vol": false
        },
        {
          "src": "/d3/logo-mercure.webp",
          "alt": "Mercure",
          "h": 38,
          "vol": false
        }
      ]
    },
    {
      "type": "hoe",
      "werk": false,
      "id": "samenwerken",
      "eyebrow": "Samenwerken",
      "h2": "Snel het juiste personeel [[op de werkvloer]]",
      "lead": "Van eerste aanvraag tot vaste favorietenpoule. Vier stappen.",
      "stappen": [
        {
          "h3": "Vertel wat je zoekt",
          "p": "Welke functies, wanneer en hoeveel medewerkers? We denken direct mee over de beste aanpak."
        },
        {
          "h3": "Wij selecteren de juiste mensen",
          "p": "Op basis van ervaring, skills, beoordelingen en favorietenpoule zetten wij het beste team klaar."
        },
        {
          "h3": "Je team staat klaar",
          "p": "Een op maat samengesteld team, ingeroosterd en klaar om te starten. Jij hoeft niks te doen."
        },
        {
          "h3": "Evalueren en poule bouwen",
          "p": "Na elke opdracht feedback. Zo bouwen we samen aan een vaste, betrouwbare favorietenpoule."
        }
      ],
      "knop": {
        "tekst": "Vraag direct aan",
        "href": "/personeelsaanvraag?branche=hotel"
      },
      "standaard": null
    },
    {
      "type": "functies",
      "eyebrow": "Functies voor hotels",
      "h2": "Voor elke hotelfunctie de [[juiste mensen]]",
      "lead": "Of het nu gaat om dagelijkse bezetting of piekdrukte. EXTRA levert ervaren hotelpersoneel voor iedere rol binnen jouw hotel.",
      "label": "Hotelfuncties",
      "slides": [
        {
          "img": "/d3/f-housekeeping.webp",
          "h3": "Housekeeping",
          "href": "/housekeeping-personeel-inhuren",
          "p": "Ervaren kamermeisjes en room attendants die werken volgens jouw kwaliteitsstandaarden.",
          "tags": [
            "AD",
            "Turndown",
            "Welness",
            "Houseman",
            "Room attendant"
          ],
          "knop": {
            "tekst": "Bekijk housekeeping personeel",
            "href": "/housekeeping-personeel-inhuren"
          }
        },
        {
          "img": "/d3/f-frontoffice.webp",
          "h3": "Front Office",
          "href": "/front-office-personeel-inhuren",
          "p": "Representatieve medewerkers voor receptie, check in, check out en guestrelations. Professioneel, gastvrij en gewend aan hotelprocessen.",
          "tags": [
            "Receptie",
            "Check-in/out",
            "Guestrelations",
            "Conciërge"
          ],
          "knop": {
            "tekst": "Bekijk front office personeel",
            "href": "/front-office-personeel-inhuren"
          }
        },
        {
          "img": "/d3/f-fb.webp",
          "h3": "F&B Medewerkers",
          "href": "/fb-personeel-inhuren",
          "p": "Gastvrije F&B medewerkers voor hotelrestaurants, ontbijtservice, roomservice en banqueting.",
          "tags": [
            "Restaurantmedewerker",
            "Roomservice",
            "Ontbijtmedewerker",
            "Banqueting medewerker",
            "Runner"
          ],
          "knop": {
            "tekst": "Bekijk F&B personeel",
            "href": "/fb-personeel-inhuren"
          }
        },
        {
          "img": "/d3/f-banqueting.webp",
          "h3": "Banqueting",
          "href": "/banqueting-personeel-inhuren",
          "p": "Professionele service voor conferenties, gala diners, meetings en events. Ervaring met grotere groepen en hotelservice.",
          "tags": [
            "Conferenties",
            "Gala-diners",
            "Boardroom",
            "Events"
          ],
          "knop": {
            "tekst": "Bekijk banqueting personeel",
            "href": "/banqueting-personeel-inhuren"
          }
        },
        {
          "img": "/d3/f-keuken.webp",
          "h3": "Chefs en Keukenpersoneel",
          "href": "/keukenpersoneel-inhuren",
          "p": "Ervaren chefs, sous chefs en koks voor à la carte service, banqueting en ontbijtservice in hotels.",
          "tags": [
            "Chef de partie",
            "Sous-chef",
            "Zelfstandig werkend kok",
            "Commis"
          ],
          "knop": {
            "tekst": "Bekijk keukenpersoneel",
            "href": "/keukenpersoneel-inhuren"
          }
        },
        {
          "img": "/d3/f-afwas.webp",
          "h3": "Afwassers en Keukenondersteuning",
          "href": "/afwassers-inhuren",
          "p": "Betrouwbare ondersteuning voor drukke hotelkeukens. Afwassers en keukenhulpen die zorgen dat de keuken blijft draaien.",
          "tags": [
            "Afwasser",
            "Keukenhulp",
            "Spoelkeuken medewerker"
          ],
          "knop": {
            "tekst": "Bekijk afwassers en keukenhulp",
            "href": "/afwassers-inhuren"
          }
        }
      ]
    },
    {
      "type": "scores",
      "eyebrow": "Onze EXTRA's in cijfers",
      "h2": "Na elke dienst [[beoordeeld]]",
      "lead": "Hotels beoordelen onze medewerkers na iedere dienst op houding, vaardigheid, kleding en uitstraling. Zo zie je precies wie je binnenhaalt.",
      "lijst": [],
      "kaarten": [
        {
          "nr": "EXTRA #0412",
          "h3": "Room attendant",
          "sub": "Housekeeping · bij EXTRA sinds 2024",
          "status": "Diamond",
          "p": "98.0",
          "score": "9,8",
          "bars": [
            [
              "Houding",
              "100%"
            ],
            [
              "Vaardigheid",
              "100%"
            ],
            [
              "Kleding",
              "98%"
            ],
            [
              "Uitstraling",
              "96%"
            ]
          ],
          "cijfers": [
            [
              "Diensten",
              "214"
            ],
            [
              "Opkomst",
              "99%"
            ],
            [
              "Betrouwbaar",
              "9,9"
            ],
            [
              "EXTRA-punten",
              "18.450"
            ]
          ],
          "fav": [
            "Grand Hotel Amrâth Amsterdam",
            "Amrâth Kurhaus",
            "Pulitzer Amsterdam"
          ]
        },
        {
          "nr": "EXTRA #0938",
          "h3": "Receptionist",
          "sub": "Front Office · bij EXTRA sinds 2025",
          "status": "Gold",
          "p": "96.0",
          "score": "9,6",
          "bars": [
            [
              "Houding",
              "100%"
            ],
            [
              "Vaardigheid",
              "100%"
            ],
            [
              "Kleding",
              "96%"
            ],
            [
              "Uitstraling",
              "90%"
            ]
          ],
          "cijfers": [
            [
              "Diensten",
              "132"
            ],
            [
              "Opkomst",
              "98%"
            ],
            [
              "Betrouwbaar",
              "9,7"
            ],
            [
              "EXTRA-punten",
              "9.820"
            ]
          ],
          "fav": [
            "Hilton Amsterdam",
            "Radisson Blu Amsterdam Airport"
          ]
        },
        {
          "nr": "EXTRA #0655",
          "h3": "Chef de partie",
          "sub": "Keuken · bij EXTRA sinds 2024",
          "status": "Gold",
          "p": "97.0",
          "score": "9,7",
          "bars": [
            [
              "Houding",
              "98%"
            ],
            [
              "Vaardigheid",
              "100%"
            ],
            [
              "Kleding",
              "96%"
            ],
            [
              "Uitstraling",
              "98%"
            ]
          ],
          "cijfers": [
            [
              "Diensten",
              "176"
            ],
            [
              "Opkomst",
              "100%"
            ],
            [
              "Betrouwbaar",
              "10,0"
            ],
            [
              "EXTRA-punten",
              "14.300"
            ]
          ],
          "fav": [
            "Marriott Amsterdam",
            "Pulitzer Amsterdam"
          ]
        },
        {
          "nr": "EXTRA #1127",
          "h3": "Banqueting medewerker",
          "sub": "F&B · bij EXTRA sinds 2025",
          "status": "Silver",
          "p": "94.0",
          "score": "9,4",
          "bars": [
            [
              "Houding",
              "96%"
            ],
            [
              "Vaardigheid",
              "100%"
            ],
            [
              "Kleding",
              "94%"
            ],
            [
              "Uitstraling",
              "90%"
            ]
          ],
          "cijfers": [
            [
              "Diensten",
              "88"
            ],
            [
              "Opkomst",
              "97%"
            ],
            [
              "Betrouwbaar",
              "9,5"
            ],
            [
              "EXTRA-punten",
              "6.150"
            ]
          ],
          "fav": [
            "Mercure Amsterdam"
          ]
        }
      ],
      "noot": "Voorbeeldprofielen. Echte scores, diensten en punten komen rechtstreeks uit het EXTRA-dashboard.",
      "los": true
    },
    {
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
    },
    {
      "type": "reviews",
      "eyebrow": "Referenties",
      "h2": "Wat hotels over ons [[zeggen]]",
      "items": [
        {
          "quote": "Wij werken samen met EXTRA sinds eind oktober 2025 voor de levering van kamermeisjes, AD-, turndown- en minibarmedewerkers aan Grand Hotel Amrâth Amsterdam. EXTRA heeft professionaliteit, betrouwbaarheid en een sterke toewijding aan kwaliteit getoond.",
          "naam": "D. Koops",
          "rol": "Hotelmanager, Grand Hotel Amrâth Amsterdam · 5-sterren hotel"
        },
        {
          "quote": "Extra has consistently supplied skilled and reliable personnel for our kitchen and stewarding departments. They have consistently met and exceeded our expectations.",
          "naam": "G. Di Domenico",
          "rol": "Executive Chef, Amsterdam Marriott Hotel · Internationaal hotel"
        },
        {
          "quote": "Het proces rondom het uitzetten van diensten verloopt soepel en de kwaliteit van de medewerkers die jullie sturen is goed. Negen van de tien kandidaten die jullie hebben gestuurd, hebben uitstekend gewerkt.",
          "naam": "A. Schoenmaker",
          "rol": "Hotelmanager, Radisson Blu Hotel Amsterdam Airport"
        }
      ]
    },
    {
      "type": "screening",
      "eyebrow": "Screeningsproces",
      "h2": "Elke hotelmedewerker, [[persoonlijk gescreend]]",
      "lead": "Voordat een medewerker bij jouw hotel staat, is deze persoonlijk gezien op kantoor en digitaal beoordeeld op presentatie, gastvrijheid en vakkennis per hotelfunctie. Je weet altijd wie er achter je receptie of in je housekeeping staat.",
      "kaart": {
        "avatar": "JV",
        "b": "Voorbeeldprofiel",
        "span": "Housekeeping · beoordeeld op kantoor",
        "tags": [
          "Topper!",
          "Veel ervaring",
          "Verzorgd",
          "Enthousiast",
          "NL",
          "Housekeeping"
        ]
      }
    },
    {
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
    },
    {
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
    },
    {
      "type": "loon",
      "eyebrow": "EXTRAATje beloningssysteem",
      "h2": [
        "Gemotiveerd",
        "personeel levert",
        "betere service"
      ],
      "lead": "Medewerkers verdienen punten met elke dienst. Wie vaker bij jouw hotel werkt, bouwt meer op en komt graag terug.",
      "voordelen": [
        "Hogere motivatie",
        "Minder no-shows",
        "Vaste gezichten"
      ],
      "knop": {
        "tekst": "Lees meer over EXTRAATje",
        "href": null
      }
    },
    {
      "type": "vorm"
    },
    {
      "type": "faq",
      "eyebrow": "FAQ",
      "h2": "Veelgestelde vragen over [[hotelpersoneel]]",
      "items": [
        [
          "Hoe snel kunnen jullie hotelpersoneel leveren?",
          "Bij EXTRA kunnen we in veel gevallen binnen 48 uur geschikt hotelpersoneel leveren. Dankzij onze vaste poule van geselecteerde hotelmedewerkers kunnen we snel schakelen bij uitval, piekdrukte of last-minute aanvragen. Neem contact op en we kijken direct wat mogelijk is."
        ],
        [
          "Kunnen jullie housekeeping personeel leveren?",
          "Ja. Housekeeping is één van onze kernspecialisaties voor hotels. We leveren ervaren kamermeisjes en room attendants die vertrouwd zijn met hotelstandaarden en kwaliteitscontroles. Via onze favorietenpoule bouwen we een vast team op dat jouw hotel door en door kent."
        ],
        [
          "Kunnen jullie personeel leveren voor banqueting en conferenties?",
          "Ja. EXTRA levert professionele banqueting- en keukenmedewerkers voor banqueting, conferenties en events in hotels. Van kleine boardroom-lunches tot gala-diners van 300+ gasten. We hebben ervaren medewerkers die weten hoe formele hotelservice werkt."
        ],
        [
          "Hoe werkt het met vaste teams per hotel?",
          "EXTRA werkt met favorietenpoules per opdrachtgever. We bouwen per hotel een vaste poule op van medewerkers die jouw locatie kennen. Dezelfde gezichten, minder uitleg, hogere kwaliteit. Dit geldt per afdeling: housekeeping, F&B, banqueting en front office."
        ],
        [
          "Voor welke hotelfuncties kan ik personeel inhuren?",
          "Via EXTRA kun je personeel inhuren voor: housekeeping, front office, F&B, banqueting, keuken (chefs, sous-chefs, keukenmedewerkers), afwassers en roomservice. We kijken altijd welke medewerkers het beste passen bij jouw hotel en standaard."
        ],
        [
          "Hoe wordt de kwaliteit van hotelpersoneel bewaakt?",
          "Na elke dienst meten we hoe een medewerker heeft gepresteerd bij jouw hotel. Scores, complimenten en klachten worden geregistreerd. Zo weten we wie structureel goed presteert op jouw locatie en wie we prioriteit geven bij toekomstige aanvragen."
        ]
      ]
    },
    {
      "type": "slot",
      "foto": "/d3/p-chef.webp",
      "pos": null,
      "tag": "/d3/logo-tag-r.svg",
      "regels": [
        "Vraag",
        "direct EXTRA",
        "personeel aan"
      ],
      "kop": "Bel mij terug",
      "sub": "Laat je nummer achter, dan bellen we je terug met wie we kunnen sturen. Snel, betrouwbaar en volledig in loondienst.",
      "functies": [
        "Housekeeping",
        "Front office",
        "F&B",
        "Banqueting",
        "Keuken",
        "Afwas en keukenhulp"
      ],
      "gekozen": null,
      "laag": false,
      "id": null
    }
  ]
};

export const events: PaginaContent = {
  "sector": "events",
  "functies": [
    "Bediening",
    "Barpersoneel",
    "Dinerlopers",
    "Runners",
    "Hosts en hostesses",
    "Event supervisor"
  ],
  "secties": [
    {
      "type": "hero",
      "werk": false,
      "foto": "/d3/e-hero.webp",
      "pos": "53% 20%",
      "chip": "{reviews} · NEN-4400-1 gecertificeerd",
      "h1": [
        "Eventpersoneel nodig?",
        "Wij [[shaken]] het voor elkaar."
      ],
      "reageer": "Reageer direct",
      "knoppen": [
        {
          "tekst": "Bel mij terug",
          "href": "#aanvragen",
          "vol": true,
          "tel": false
        },
        {
          "tekst": "Personeel aanvragen",
          "href": "/personeelsaanvraag?branche=event",
          "vol": false,
          "tel": false
        },
        {
          "tekst": "085 130 59 15",
          "href": "tel:0851305915",
          "vol": false,
          "tel": true
        }
      ],
      "lockup": [
        "Event",
        "manpower"
      ],
      "lead": "Van bediening tot bar, EXTRA levert snel eventpersoneel voor elk formaat. Iedereen persoonlijk geselecteerd en in loondienst.",
      "vink": [
        [
          "800+",
          "Actieve medewerkers"
        ],
        [
          "500+",
          "Events per jaar"
        ],
        [
          "48 uur",
          "Gemiddelde levertijd"
        ],
        [
          "24/7",
          "Bereikbaar voor spoed"
        ]
      ],
      "vink4": true
    },
    {
      "type": "hierwerk",
      "eyebrow": "Opdrachtgevers",
      "h2": "Vertrouwd door [[eventlocaties]]",
      "p": "Van museum tot stadion. Een paar van de locaties die met EXTRA werken.",
      "logos": [
        {
          "src": "/d3/logo-hart.webp",
          "alt": "H'ART Museum",
          "h": 56,
          "vol": false
        },
        {
          "src": "/d3/Logo_FcUtrecht_1771267205959.webp",
          "alt": "FC Utrecht",
          "h": 72,
          "vol": true
        },
        {
          "src": "/d3/logo-westweelde.webp",
          "alt": "Westweelde",
          "h": 46,
          "vol": false
        },
        {
          "src": "/d3/logo-appel.webp",
          "alt": "Appèl",
          "h": 56,
          "vol": true
        },
        {
          "src": "/d3/Logo_funda_1771267205959.webp",
          "alt": "Funda",
          "h": 48,
          "vol": true
        },
        {
          "src": "/d3/Logo_hetepeper_1771267205959.webp",
          "alt": "Hete Peper",
          "h": 22,
          "vol": false
        }
      ]
    },
    {
      "type": "functies",
      "eyebrow": "Functies voor events",
      "h2": "Elk soort event. [[Elke rol gevuld.]]",
      "lead": "Van de eerste gast die binnenkomt tot het laatste glas dat wordt opgeruimd. EXTRA levert voor iedere rol de juiste mensen.",
      "label": "Eventfuncties",
      "slides": [
        {
          "img": "/d3/e-bediening.webp",
          "h3": "Bediening",
          "href": null,
          "p": "Ervaren bedienend personeel voor diners, borrels en recepties. Professioneel, snel en gastgericht bij ieder type event.",
          "tags": [
            "Dinerservice",
            "Borrel",
            "Receptie",
            "Buffet"
          ],
          "knop": {
            "tekst": "Vraag eventpersoneel aan",
            "href": "#aanvragen"
          }
        },
        {
          "img": "/d3/e-bar.webp",
          "h3": "Barpersoneel",
          "href": null,
          "p": "Bartenders en barkeepers met eventervaring. Representatief, snel en gewend om hoge volumes te draaien.",
          "tags": [
            "Cocktails",
            "Wine service",
            "Drankservice",
            "Hoog tempo"
          ],
          "knop": {
            "tekst": "Vraag eventpersoneel aan",
            "href": "#aanvragen"
          }
        },
        {
          "img": "/d3/e-diner.webp",
          "h3": "Dinerlopers",
          "href": null,
          "p": "Snelle en efficiënte diner runners die schalen uitserveren, tafels ondersteunen en zorgen dat het diner soepel verloopt.",
          "tags": [
            "Uitserveren",
            "Schalen aanvullen",
            "Doorloop",
            "Assist"
          ],
          "knop": {
            "tekst": "Vraag eventpersoneel aan",
            "href": "#aanvragen"
          }
        },
        {
          "img": "/d3/e-runners.webp",
          "h3": "Runners",
          "href": null,
          "p": "Energieke runners voor logistieke ondersteuning tijdens events. Van keuken naar zaal en altijd in beweging.",
          "tags": [
            "Keuken-zaal",
            "Transport",
            "Ondersteuning",
            "Tempo"
          ],
          "knop": {
            "tekst": "Vraag eventpersoneel aan",
            "href": "#aanvragen"
          }
        },
        {
          "img": "/d3/e-hosts.webp",
          "h3": "Hosts en Hostesses",
          "href": null,
          "p": "Gastvrije hosts voor ontvangst, registratie, garderobe en begeleiding van gasten.",
          "tags": [
            "Ontvangst",
            "Coatcheck",
            "Registratie",
            "Begeleiding"
          ],
          "knop": {
            "tekst": "Vraag eventpersoneel aan",
            "href": "#aanvragen"
          }
        },
        {
          "img": "/d3/e-supervisor.webp",
          "h3": "Event Supervisors",
          "href": null,
          "p": "Ervaren supervisors die teams aansturen op locatie, communiceren met planners en kwaliteit bewaken.",
          "tags": [
            "Teamleiding",
            "Kwaliteitsbewaking",
            "On-site regie"
          ],
          "knop": {
            "tekst": "Vraag eventpersoneel aan",
            "href": "#aanvragen"
          }
        }
      ]
    },
    {
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
    },
    {
      "type": "reviews",
      "eyebrow": "Referenties",
      "h2": "Wat eventlocaties over ons [[zeggen]]",
      "items": [
        {
          "quote": "Vanaf het begin hebben wij prettig en direct contact gehad met het team van EXTRA. Wij zijn zeer tevreden over de kwaliteit van de medewerkers die via Extra bij ons werken.",
          "naam": "D. Sarda",
          "rol": "Eventmanager, Westweelde · Eventlocatie, Amsterdam"
        },
        {
          "quote": "Bij EXTRA wordt men snel en accuraat geholpen. Als er gebeld wordt voor personeel, maakt niet uit wanneer, er wordt altijd gereageerd en er wordt snel gehandeld.",
          "naam": "F. de Visser",
          "rol": "Eventcoordinator, Art Zoo Amsterdam · Evenementenlocatie"
        },
        {
          "quote": "Vanuit het H'ART Museum werken wij met enige regelmaat met personeel van Extra omdat we weten dat we goed gekwalificeerd personeel krijgen dat altijd verzorgd en goed op tijd is.",
          "naam": "T. Bakkenes",
          "rol": "Hospitality Manager, H'ART Museum · Museum & culturele locatie"
        }
      ]
    },
    {
      "type": "stapel2",
      "secties": [
        {
          "type": "poule",
          "eyebrow": "Favorietenpoules",
          "h2": "Vaste teams die [[jouw event kennen]]",
          "lead": "Voor terugkerende events of vaste locaties bouwt EXTRA een favorietenpoule op. Dezelfde medewerkers die jouw locatie, setup en verwachtingen kennen.",
          "items": [
            {
              "h3": "Vaste gala-ploeg",
              "sub": "Dezelfde bediening bij elk gala-diner op jouw locatie",
              "meta": [
                "Gala en diner"
              ],
              "b": "Vast",
              "small": "team"
            },
            {
              "h3": "Vaste bartenders",
              "sub": "Kennen jouw bar, drankenkaart en tempo",
              "meta": [
                "Bar"
              ],
              "b": "Vast",
              "small": "team"
            },
            {
              "h3": "Vaste runners",
              "sub": "Kennen de indeling en logistiek van jouw locatie",
              "meta": [
                "Runners"
              ],
              "b": "Vast",
              "small": "team"
            },
            {
              "h3": "Vaste host-ploeg",
              "sub": "Vertegenwoordigen jouw entree zoals jij dat wilt",
              "meta": [
                "Ontvangst"
              ],
              "b": "Vast",
              "small": "team"
            }
          ],
          "knop": null
        },
        {
          "type": "scores",
          "eyebrow": "Continue kwaliteitsmeting",
          "h2": "Elk event beter dan [[het vorige]]",
          "lead": "Na elk event meten we hoe het personeel gepresteerd heeft. Zo leren we wie het beste past bij jouw type event en wie we de volgende keer prioriteit geven. Geen giswerk. Data.",
          "lijst": [],
          "kaarten": [
            {
              "nr": "EXTRA #0377",
              "h3": "Bartender",
              "sub": "Bar · bij EXTRA sinds 2024",
              "status": "Diamond",
              "p": "98.0",
              "score": "9,8",
              "bars": [
                [
                  "Houding",
                  "100%"
                ],
                [
                  "Vaardigheid",
                  "100%"
                ],
                [
                  "Kleding",
                  "98%"
                ],
                [
                  "Uitstraling",
                  "96%"
                ]
              ],
              "cijfers": [
                [
                  "Diensten",
                  "198"
                ],
                [
                  "Opkomst",
                  "99%"
                ],
                [
                  "Betrouwbaar",
                  "9,9"
                ],
                [
                  "EXTRA-punten",
                  "17.240"
                ]
              ],
              "fav": [
                "Westweelde",
                "Art Zoo Amsterdam"
              ]
            },
            {
              "nr": "EXTRA #0612",
              "h3": "Host",
              "sub": "Ontvangst · bij EXTRA sinds 2025",
              "status": "Gold",
              "p": "96.0",
              "score": "9,6",
              "bars": [
                [
                  "Houding",
                  "100%"
                ],
                [
                  "Vaardigheid",
                  "100%"
                ],
                [
                  "Kleding",
                  "96%"
                ],
                [
                  "Uitstraling",
                  "90%"
                ]
              ],
              "cijfers": [
                [
                  "Diensten",
                  "126"
                ],
                [
                  "Opkomst",
                  "98%"
                ],
                [
                  "Betrouwbaar",
                  "9,7"
                ],
                [
                  "EXTRA-punten",
                  "9.360"
                ]
              ],
              "fav": [
                "H'ART Museum",
                "Westweelde"
              ]
            },
            {
              "nr": "EXTRA #0833",
              "h3": "Bediening",
              "sub": "Banqueting · bij EXTRA sinds 2024",
              "status": "Gold",
              "p": "97.0",
              "score": "9,7",
              "bars": [
                [
                  "Houding",
                  "98%"
                ],
                [
                  "Vaardigheid",
                  "100%"
                ],
                [
                  "Kleding",
                  "96%"
                ],
                [
                  "Uitstraling",
                  "96%"
                ]
              ],
              "cijfers": [
                [
                  "Diensten",
                  "164"
                ],
                [
                  "Opkomst",
                  "100%"
                ],
                [
                  "Betrouwbaar",
                  "10,0"
                ],
                [
                  "EXTRA-punten",
                  "13.120"
                ]
              ],
              "fav": [
                "Westweelde",
                "FC Utrecht"
              ]
            },
            {
              "nr": "EXTRA #1102",
              "h3": "Event supervisor",
              "sub": "Teamleiding · bij EXTRA sinds 2025",
              "status": "Silver",
              "p": "94.0",
              "score": "9,4",
              "bars": [
                [
                  "Houding",
                  "96%"
                ],
                [
                  "Vaardigheid",
                  "98%"
                ],
                [
                  "Kleding",
                  "94%"
                ],
                [
                  "Uitstraling",
                  "92%"
                ]
              ],
              "cijfers": [
                [
                  "Diensten",
                  "72"
                ],
                [
                  "Opkomst",
                  "97%"
                ],
                [
                  "Betrouwbaar",
                  "9,5"
                ],
                [
                  "EXTRA-punten",
                  "5.480"
                ]
              ],
              "fav": [
                "Art Zoo Amsterdam"
              ]
            }
          ],
          "noot": "Voorbeeldprofielen. Echte scores, diensten en punten komen rechtstreeks uit het EXTRA-dashboard."
        }
      ]
    },
    {
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
    },
    {
      "type": "loon",
      "eyebrow": "EXTRAATje beloningssysteem",
      "h2": [
        "Gemotiveerd",
        "personeel maakt",
        "het event"
      ],
      "lead": "Medewerkers verdienen punten met elke dienst. Wie vaker bij jouw events werkt, bouwt meer op en komt graag terug.",
      "voordelen": [
        "Hogere motivatie",
        "Minder no-shows",
        "Vaste gezichten"
      ],
      "knop": {
        "tekst": "Lees meer over EXTRAATje",
        "href": null
      }
    },
    {
      "type": "vorm"
    },
    {
      "type": "faq",
      "eyebrow": "FAQ",
      "h2": "Veelgestelde vragen over [[eventpersoneel]]",
      "items": [
        [
          "Kunnen jullie snel opschalen voor evenementen?",
          "Ja. Flexibel opschalen is één van de kernsterkten van EXTRA. Of je nu 5 of 80 medewerkers nodig hebt: we leveren snel en betrouwbaar, ook bij last-minute aanvragen. Neem contact op en we bespreken direct de mogelijkheden."
        ],
        [
          "Hoeveel personeel kunnen jullie leveren voor een event?",
          "We hebben een pool van 800+ actieve medewerkers. Voor grote events kunnen we tientallen tot honderd+ medewerkers leveren, afhankelijk van beschikbaarheid en functies. We hebben ervaring met events van 10 tot 300+ gasten."
        ],
        [
          "Hebben jullie personeel met eventervaring?",
          "Ja. Veel van onze medewerkers werken regelmatig bij events en eventlocaties. Ze zijn gewend aan drukke omgevingen, snelle service en grote aantallen gasten. Eventervaring weegt mee bij de matching."
        ],
        [
          "Kunnen jullie barpersoneel en bediening leveren voor events?",
          "Ja. We leveren ervaren barpersoneel, bediening, dinerlopers en runners voor events van elke omvang. Van borrel met 50 man tot gala met 500 gasten. Iedereen is geselecteerd op eventervaring en werkhouding."
        ],
        [
          "Kunnen jullie hosts en hostesses leveren voor evenementen?",
          "Ja. Onze hosts en hostesses zijn representatief, communicatief sterk en gewend aan gastgerichte rollen: ontvangst, coatcheck, registratie en begeleiding. Ze kennen het belang van een professionele eerste indruk."
        ],
        [
          "Hoe snel kunnen jullie eventpersoneel leveren?",
          "Bij EXTRA kunnen we in veel gevallen binnen 48 uur geschikt eventpersoneel leveren. Dankzij onze grote pool van ervaren medewerkers kunnen we snel schakelen, ook bij last-minute aanvragen."
        ],
        [
          "Hoeveel bediening heb ik nodig per gast?",
          "Vuistregel: bij een uitgeserveerd diner ongeveer één bediening per 10 tot 12 gasten, bij een borrel of buffet één per 25 tot 30. We adviseren graag op basis van jouw draaiboek."
        ],
        [
          "Is er één aanspreekpunt tijdens het event?",
          "Bij grotere producties zetten we een teamcaptain in die de briefing kent, het team aanstuurt en schakelt met jouw eventmanager."
        ],
        [
          "Leveren jullie ook buiten Amsterdam?",
          "Ja. Het overgrote deel van onze poule zit in de regio Amsterdam, maar we zijn daar niet toe beperkt. Bespreek de locatie bij je aanvraag, dan kijken we wat mogelijk is."
        ],
        [
          "Wat moet ik aanleveren bij mijn aanvraag?",
          "Het liefst je draaiboek: aantal gasten, type service (walking dinner, buffet of uitgeserveerd), tijden en locatie. Dan adviseren we over de juiste bezetting per onderdeel, van bediening tot bar."
        ],
        [
          "Kan ik ook personeel inhuren voor één avond?",
          "Ja, één shift is genoeg. Veel opdrachtgevers starten met een los event en schalen daarna op naar een vaste samenwerking."
        ],
        [
          "Wat kost eventpersoneel inhuren?",
          "Je betaalt een all-in uurtarief dat afhangt van functie en ervaring. Daarin zitten loon, premies en verzekeringen, zonder verborgen kosten. Je betaalt alleen gewerkte uren. Vraag een voorstel aan op basis van je draaiboek."
        ],
        [
          "Wat als iemand zich vlak voor het event ziek meldt?",
          "Dan regelen wij vervanging, vaak nog dezelfde dag. We zijn 24 uur per dag bereikbaar en het verzuimrisico ligt bij EXTRA, niet bij jou."
        ],
        [
          "Wat als een medewerker niet bevalt?",
          "Dat lossen we direct op: we plannen een vervanger en verwerken je feedback in de volgende matches. Je zit nergens aan vast."
        ],
        [
          "Stuur ik het eventpersoneel zelf aan?",
          "Ja. Bij inlening werken de medewerkers onder jouw leiding, of onder die van onze teamcaptain bij grotere producties. Jij bepaalt de briefing en de taakverdeling op de vloer."
        ]
      ]
    },
    {
      "type": "slot",
      "foto": "/d3/e-slot.webp",
      "pos": null,
      "tag": "/d3/logo-tag-b.svg",
      "regels": [
        "Vraag",
        "direct EXTRA",
        "personeel aan"
      ],
      "kop": "Bel mij terug",
      "sub": "Of je nu een eenmalig event organiseert of een vaste eventlocatie runt. Van 5 tot 100 plus medewerkers.",
      "functies": [
        "Bediening",
        "Barpersoneel",
        "Dinerlopers",
        "Runners",
        "Hosts en hostesses",
        "Event supervisor"
      ],
      "gekozen": null,
      "laag": true,
      "id": null
    }
  ]
};

export const logistiek: PaginaContent = {
  "sector": "logistiek",
  "functies": [
    "Orderpicker",
    "Heftruck of reachtruck",
    "Inpak en productie",
    "Expeditie",
    "Magazijnmedewerker",
    "Voorraad en kwaliteit"
  ],
  "secties": [
    {
      "type": "hero",
      "werk": false,
      "foto": "/d3/l-hero.webp",
      "pos": "55% 30%",
      "chip": "{reviews} · NEN-4400-1 gecertificeerd",
      "h1": [
        "Logistiek personeel nodig?",
        "Wij [[pakken]] het op."
      ],
      "reageer": "Reageer direct",
      "knoppen": [
        {
          "tekst": "Bel mij terug",
          "href": "#aanvragen",
          "vol": true,
          "tel": false
        },
        {
          "tekst": "Personeel aanvragen",
          "href": "/personeelsaanvraag?branche=logistiek",
          "vol": false,
          "tel": false
        },
        {
          "tekst": "085 130 59 15",
          "href": "tel:0851305915",
          "vol": false,
          "tel": true
        }
      ],
      "lockup": [
        "Logistic",
        "professionals"
      ],
      "lead": "EXTRA levert orderpickers, heftruckchauffeurs en inpakkers in loondienst, persoonlijk gescreend en snel inzetbaar.",
      "vink": [
        [
          "NEN 4400-1",
          "Gecertificeerd"
        ],
        [
          "in loondienst",
          "Iedereen"
        ],
        [
          "gecontroleerd",
          "Heftruckcertificaten"
        ],
        [
          "minimumafname",
          "Geen"
        ]
      ],
      "vink4": true
    },
    {
      "type": "functies",
      "eyebrow": "Functies voor logistiek",
      "h2": "Voor elke logistieke rol de [[juiste mensen]]",
      "lead": "Of het nu gaat om dagelijkse bezetting of een piek in het seizoen: wij leveren mensen voor iedere rol in je magazijn of distributiecentrum.",
      "label": "Logistieke functies",
      "slides": [
        {
          "img": "/d3/l-orderpick.webp",
          "h3": "Orderpickers",
          "href": null,
          "p": "Pickers die uit de voeten kunnen met voice picking, scanners en pick-to-light, zonder lange inwerktijd.",
          "tags": [
            "Voice picking",
            "Scannen",
            "Batchpicken"
          ],
          "knop": {
            "tekst": "Vraag logistiek personeel aan",
            "href": "#aanvragen"
          }
        },
        {
          "img": "/d3/l-heftruck.webp",
          "h3": "Heftruck en reachtruck",
          "href": null,
          "p": "Chauffeurs met een geldig certificaat, gewend aan smalle gangpaden en werken tussen collega's op de vloer.",
          "tags": [
            "Heftruck",
            "Reachtruck",
            "EPT"
          ],
          "knop": {
            "tekst": "Vraag logistiek personeel aan",
            "href": "#aanvragen"
          }
        },
        {
          "img": "/d3/l-inpak.webp",
          "h3": "Inpak en productie",
          "href": null,
          "p": "Nauwkeurige inpakkers voor orderverwerking, ompakwerk en seizoenspieken. Tempo houden zonder fouten.",
          "tags": [
            "Inpakken",
            "Ompakken",
            "Etiketteren"
          ],
          "knop": {
            "tekst": "Vraag logistiek personeel aan",
            "href": "#aanvragen"
          }
        },
        {
          "img": "/d3/l-expeditie.webp",
          "h3": "Expeditie en verzending",
          "href": null,
          "p": "Medewerkers die laden, lossen en verzendklaar maken volgens jouw procedures, ook als de trailer om vier uur weg moet.",
          "tags": [
            "Laden en lossen",
            "Docking",
            "Retouren"
          ],
          "knop": {
            "tekst": "Vraag logistiek personeel aan",
            "href": "#aanvragen"
          }
        },
        {
          "img": "/d3/l-magazijn.webp",
          "h3": "Magazijnmedewerkers",
          "href": null,
          "p": "Breed inzetbaar door het hele magazijn: van goederenontvangst en opslag tot aanvullen en uitgifte.",
          "tags": [
            "Ontvangst",
            "Opslag",
            "Uitgifte"
          ],
          "knop": {
            "tekst": "Vraag logistiek personeel aan",
            "href": "#aanvragen"
          }
        },
        {
          "img": "/d3/l-voorraad.webp",
          "h3": "Voorraad en kwaliteit",
          "href": null,
          "p": "Tellen, controleren en corrigeren, zodat je voorraadstanden kloppen en je doorlooptijd voorspelbaar blijft.",
          "tags": [
            "Cyclisch tellen",
            "Inventarisatie",
            "Controle"
          ],
          "knop": {
            "tekst": "Vraag logistiek personeel aan",
            "href": "#aanvragen"
          }
        }
      ]
    },
    {
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
    },
    {
      "type": "stapel2",
      "secties": [
        {
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
        },
        {
          "type": "scores",
          "eyebrow": "Onze EXTRA's in cijfers",
          "h2": "Na elke dienst [[beoordeeld]]",
          "lead": "Na elke dienst leggen we vast hoe iemand scoort op houding, vaardigheid, kleding en uitstraling. Die beoordelingen bepalen wie we de volgende keer sturen.",
          "lijst": [],
          "kaarten": [
            {
              "nr": "EXTRA #0518",
              "h3": "Orderpicker",
              "sub": "Magazijn · bij EXTRA sinds 2025",
              "status": "Gold",
              "p": "96.0",
              "score": "9,6",
              "bars": [
                [
                  "Houding",
                  "100%"
                ],
                [
                  "Vaardigheid",
                  "98%"
                ],
                [
                  "Kleding",
                  "96%"
                ],
                [
                  "Uitstraling",
                  "92%"
                ]
              ],
              "cijfers": [
                [
                  "Diensten",
                  "148"
                ],
                [
                  "Opkomst",
                  "99%"
                ],
                [
                  "Betrouwbaar",
                  "9,8"
                ],
                [
                  "EXTRA-punten",
                  "10.240"
                ]
              ],
              "fav": [
                "Distributiecentrum",
                "E-commerce magazijn"
              ]
            },
            {
              "nr": "EXTRA #0721",
              "h3": "Heftruckchauffeur",
              "sub": "Magazijn · bij EXTRA sinds 2024",
              "status": "Diamond",
              "p": "98.0",
              "score": "9,8",
              "bars": [
                [
                  "Houding",
                  "100%"
                ],
                [
                  "Vaardigheid",
                  "100%"
                ],
                [
                  "Kleding",
                  "98%"
                ],
                [
                  "Uitstraling",
                  "98%"
                ]
              ],
              "cijfers": [
                [
                  "Diensten",
                  "206"
                ],
                [
                  "Opkomst",
                  "100%"
                ],
                [
                  "Betrouwbaar",
                  "9,9"
                ],
                [
                  "EXTRA-punten",
                  "16.880"
                ]
              ],
              "fav": [
                "Distributiecentrum",
                "Cross-dock"
              ]
            },
            {
              "nr": "EXTRA #0904",
              "h3": "Inpakker",
              "sub": "Productie · bij EXTRA sinds 2025",
              "status": "Gold",
              "p": "95.0",
              "score": "9,5",
              "bars": [
                [
                  "Houding",
                  "98%"
                ],
                [
                  "Vaardigheid",
                  "100%"
                ],
                [
                  "Kleding",
                  "94%"
                ],
                [
                  "Uitstraling",
                  "92%"
                ]
              ],
              "cijfers": [
                [
                  "Diensten",
                  "121"
                ],
                [
                  "Opkomst",
                  "98%"
                ],
                [
                  "Betrouwbaar",
                  "9,6"
                ],
                [
                  "EXTRA-punten",
                  "8.430"
                ]
              ],
              "fav": [
                "E-commerce magazijn"
              ]
            },
            {
              "nr": "EXTRA #1046",
              "h3": "Expeditiemedewerker",
              "sub": "Expeditie · bij EXTRA sinds 2025",
              "status": "Silver",
              "p": "93.0",
              "score": "9,3",
              "bars": [
                [
                  "Houding",
                  "96%"
                ],
                [
                  "Vaardigheid",
                  "98%"
                ],
                [
                  "Kleding",
                  "92%"
                ],
                [
                  "Uitstraling",
                  "90%"
                ]
              ],
              "cijfers": [
                [
                  "Diensten",
                  "84"
                ],
                [
                  "Opkomst",
                  "97%"
                ],
                [
                  "Betrouwbaar",
                  "9,4"
                ],
                [
                  "EXTRA-punten",
                  "5.610"
                ]
              ],
              "fav": [
                "Distributiecentrum"
              ]
            }
          ],
          "noot": "Voorbeeldprofielen. Echte scores, diensten en punten komen rechtstreeks uit het EXTRA-dashboard."
        }
      ]
    },
    {
      "type": "hoe",
      "werk": false,
      "id": null,
      "eyebrow": "Zo gaat het",
      "h2": "Zo werken [[we]]",
      "lead": "Van je eerste aanvraag tot een vaste poule die zichzelf opbouwt.",
      "stappen": [
        {
          "h3": "Je aanvraag",
          "p": "Vertel welke rollen je nodig hebt, wanneer en op welke locatie."
        },
        {
          "h3": "Wij bellen terug",
          "p": "We bespreken je proces, je tijden en waar het nu misgaat in de bezetting."
        },
        {
          "h3": "Voorstel met namen",
          "p": "Je hoort wie we sturen en wat die mensen eerder hebben gedaan. Heftruckcertificaten zijn dan al gecontroleerd."
        },
        {
          "h3": "Beoordeling na de dienst",
          "p": "Jouw beoordeling bepaalt wie er terugkomt. Zo bouwt je vaste poule zichzelf op."
        }
      ],
      "knop": {
        "tekst": "Bel mij terug",
        "href": "#aanvragen"
      },
      "standaard": null
    },
    {
      "type": "loon",
      "eyebrow": "EXTRAATje beloningssysteem",
      "h2": [
        "Gemotiveerd",
        "personeel komt",
        "graag terug"
      ],
      "lead": "Medewerkers verdienen punten met elke dienst. Wie vaker op jouw locatie werkt, bouwt meer op en komt graag terug.",
      "voordelen": [
        "Hogere motivatie",
        "Minder no-shows",
        "Vaste gezichten"
      ],
      "knop": {
        "tekst": "Lees meer over EXTRAATje",
        "href": null
      }
    },
    {
      "type": "vorm"
    },
    {
      "type": "faq",
      "eyebrow": "FAQ",
      "h2": "Veelgestelde [[vragen]]",
      "items": [
        [
          "Zijn de heftruckcertificaten gecontroleerd?",
          "Altijd. We controleren het certificaat op geldigheid en leggen dat vast in het dossier. Zonder geldig certificaat plaatsen we niemand op een truck."
        ],
        [
          "Werken jullie ook in ploegendienst en in het weekend?",
          "Ja. Vroege, late en nachtdiensten zijn mogelijk, net als weekendbezetting tijdens piekperiodes. Toeslagen lopen volgens de inlenersbeloning van jouw cao."
        ],
        [
          "Loop ik risico op schijnzelfstandigheid?",
          "Nee. Iedereen die via EXTRA werkt is in loondienst en we zijn NEN 4400-1 gecertificeerd. Er komt geen zzp-constructie aan te pas."
        ],
        [
          "Wat gebeurt er als iemand niet komt opdagen?",
          "Je belt ons en wij zoeken vervanging. Daarnaast telt het mee in de beoordeling van die medewerker: wie niet komt opdagen, komt niet terug in jouw poule."
        ],
        [
          "Kunnen we eerst één dienst proberen?",
          "Dat kan. Er is geen minimumafname en geen opzegtermijn. Je betaalt per gewerkt uur."
        ]
      ]
    },
    {
      "type": "slot",
      "foto": "/d3/l-slot.webp",
      "pos": null,
      "tag": "/d3/logo-tag-g.svg",
      "regels": [
        "Vraag",
        "direct EXTRA",
        "personeel aan"
      ],
      "kop": "Bel mij terug",
      "sub": "Laat je nummer achter, dan bellen we je terug met wie we kunnen sturen.",
      "functies": [
        "Orderpicker",
        "Heftruck of reachtruck",
        "Inpak en productie",
        "Expeditie",
        "Magazijnmedewerker",
        "Voorraad en kwaliteit"
      ],
      "gekozen": null,
      "laag": false,
      "id": null
    }
  ]
};
