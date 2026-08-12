/**
 * Rechterpaneel (300px) — naamkop, Profiel-rijen, Labels-pills,
 * Snelle antwoorden, Toewijzen, Interne notities (inklapbaar) en Opt-in-status.
 * Stijl uit mockups/extra-whatsapp-mockup.html; data via bestaande endpoints.
 */
import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import { Contact as ContactIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  haalContacten,
  updateContactOptIn,
  updateContactProfiel,
  updateConversationCategory,
  updateConversationDisplayName,
  updateImportedContactName,
  haalNotities,
  maakNotitie,
  updateLabels,
  wijsGesprekToe,
  zetAiCategorie,
  AI_CATEGORIES,
  AI_CATEGORY_LABELS,
  ESCALATION_REASON_LABELS,
  WA_FUNCTIES,
  WA_FUNCTIE_LABELS,
  WA_STATUSSEN,
  type AiCategory,
  type Conversation,
  type TeamMember,
  type InternalNote,
  type WaContact,
  type WaProfielPatch,
} from '../../../api/whatsappClient';
import { WA, WA_TEKST, WA_GEWICHT, formatDate, formatPhone, voornaamVan } from './theme';
import { KLEUR } from '../../../lib/huisstijl';

// Volgorde en labels identiek aan Sidebar/ConversationList: candidate=Medewerkers
// (aangenomen), unmatched=Kandidaten, prospect=Klanten.
const TABBLAD_OPTIES: Array<{ waarde: 'candidate' | 'unmatched' | 'prospect'; label: string }> = [
  { waarde: 'candidate', label: 'Medewerkers' },
  { waarde: 'unmatched', label: 'Kandidaten' },
  { waarde: 'prospect', label: 'Klanten' },
];

interface Props {
  conv: Conversation;
  teamMembers: TeamMember[];
  /** Zet de tekst van een snel antwoord in de composer. */
  onQuickReply: (text: string) => void;
  /** Na assign/labels wijziging: gesprekkenlijst verversen. */
  onConversationChanged: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ padding: 16, borderBottom: '1px solid #f2f2f2' }}>
      {/* fontFamily: 'inherit' is hier GEEN overbodige regel. index.css heeft een
          basisregel `h1,h2,h3,h4,h5,h6 { @apply font-poppins font-bold }`, en die
          wint van een geërfd lettertype. Zonder deze regel staan "PROFIEL",
          "LABELS" enzovoort in Poppins terwijl de rest van het paneel Inter is. */}
      <h4 style={{
        margin: '0 0 10px', fontSize: WA_TEKST.badge, letterSpacing: '.05em',
        textTransform: 'uppercase', color: WA.textSub, fontWeight: WA_GEWICHT.bold,
        fontFamily: 'inherit',
      }}>{title}</h4>
      {children}
    </div>
  );
}

function InfoRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', fontSize: WA_TEKST.body,
      padding: '6px 0', borderBottom: last ? 'none' : '1px dashed #ececec', gap: 8,
    }}>
      <span style={{ color: WA.textSub, flexShrink: 0 }}>{k}</span>
      <span style={{ fontWeight: WA_GEWICHT.semibold, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

/**
 * Fase 3E — regel met een bewerkbaar veld. Zelfde ritme als InfoRow (label
 * links, waarde rechts) zodat de sectie niet ineens een formulier lijkt; het
 * verschil is dat de rechterkant een control is in plaats van tekst.
 */
function EditRow({ k, children, last, melding }: {
  k: string;
  children: ReactNode;
  last?: boolean;
  /** Korte terugkoppeling onder het veld: opgeslagen, bezig of een fout. */
  melding?: { tekst: string; kleur: string } | null;
}) {
  return (
    <div style={{ padding: '6px 0', borderBottom: last ? 'none' : '1px dashed #ececec' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, gap: 8 }}>
        <span style={{ color: WA.textSub, flexShrink: 0 }}>{k}</span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
      </div>
      {melding && (
        <div style={{ fontSize: 10.5, color: melding.kleur, textAlign: 'right', marginTop: 3 }}>{melding.tekst}</div>
      )}
    </div>
  );
}

// Gedeelde stijl voor de bewerkbare tekstvelden (Naam/Telefoon blijven kale
// <input>'s — de dropdowns hiernaast gebruiken sinds kort het gedeelde
// Select-component, zie SELECT_TRIGGER_COMPACT hieronder, en niet meer dit
// object).
const VELD_STIJL = {
  width: '100%', maxWidth: 165, fontSize: 12.5, padding: '4px 6px',
  borderRadius: 6, border: `1px solid ${WA.border}`,
  background: '#fff', color: WA.text, fontFamily: 'inherit',
  textAlign: 'right' as const,
};

/**
 * Radix' Select.Item accepteert geen lege string als value (die is intern
 * gereserveerd om de placeholder te tonen). Voor de velden hieronder die wél
 * een "niets gekozen"-status kennen (Functie, Onderwerp, Toewijzen) staat
 * deze sentinel voor die lege waarde; bij het opslaan wordt hij weer terug-
 * vertaald naar '' / null.
 */
const LEEG_WAARDE = '__leeg__';

// Compacte trigger-stijl voor de dropdowns in een EditRow (label links,
// veld rechts, net als de Naam/Telefoon-invoervelden ernaast) — dezelfde
// rechthoek/pijltje-look als de filterbalken elders in het systeem (zie
// bijv. de Kandidaten-lijst), maar smal genoeg voor dit rechterpaneel.
const SELECT_TRIGGER_COMPACT = 'h-8 w-[150px] px-2 py-1 text-xs';
// Volle breedte voor de dropdowns die los in een Section staan (Onderwerp,
// Tabblad, Toewijzen) — zelfde hoogte/tekstgrootte als bijv. SalesFlowTab.
const SELECT_TRIGGER_VOL = 'h-9 w-full text-sm';

const FUNCTIE_WEERGAVE: Record<string, string> = {
  horeca: 'Horeca', horecamedewerker: 'Horeca', bediening: 'Horeca',
  chef: 'Chef', housekeeping: 'Housekeeping',
  logistiek: 'Logistiek', orderpicker: 'Logistiek',
  frontoffice: 'Front office', 'front-office': 'Front office',
};

/**
 * Functie-dropdown voor gesprekken ZONDER gekoppeld contact (bv. Jorge: een
 * kandidaat die net voor het eerst appt en nog geen kandidaat/medewerker-
 * record heeft). Er is dan geen contact.functie-kolom om naar te schrijven,
 * dus gebruiken we hetzelfde label-mechanisme als de Labels-sectie hieronder
 * — de canonieke waarde staat links, dezelfde die FUNCTIE_WEERGAVE hierboven
 * al herkent zodat de rest van het dashboard (bv. de subregel in ChatView)
 * de keuze meteen correct toont.
 */
const FUNCTIE_CATEGORIE_OPTIES: Array<{ waarde: string; label: string }> = [
  { waarde: 'logistiek', label: 'Logistiek' },
  { waarde: 'chef', label: 'Chef' },
  { waarde: 'horeca', label: 'Horecamedewerker' },
  { waarde: 'housekeeping', label: 'Housekeeping' },
  { waarde: 'frontoffice', label: 'Front office' },
];

/** Elke bekende schrijfwijze van een functie-label wijst terug naar zijn canonieke waarde hierboven. */
const FUNCTIE_LABEL_NAAR_CATEGORIE: Record<string, string> = {
  horeca: 'horeca', horecamedewerker: 'horeca', bediening: 'horeca',
  chef: 'chef', housekeeping: 'housekeeping',
  logistiek: 'logistiek', orderpicker: 'logistiek',
  frontoffice: 'frontoffice', 'front-office': 'frontoffice',
};

const STATUS_WEERGAVE: Record<string, string> = {
  in_behandeling: 'Sollicitant',
  gepland: 'In kennismaking',
  aangenomen: 'Aangenomen',
  nieuw: 'Nieuw',
  actief: 'Actief',
};

const OPT_IN_WEERGAVE: Record<string, { label: string; kleur: string }> = {
  actief: { label: 'Actief', kleur: '#059669' },
  opt_out: { label: 'Opt-out', kleur: '#e63946' },
  verzending_faalt: { label: 'Verzending faalt', kleur: '#f0a500' },
};

// Vaste snelle antwoorden zoals in de mockup.
function quickReplies(voornaam: string): Array<{ icon: string; label: string; text: string }> {
  return [
    {
      icon: '📋', label: 'Uitleg dienstenrooster',
      text: `Hoi ${voornaam}! In de EXTRA-app zie je onder 'Diensten' alle beschikbare diensten. Je plant jezelf direct in op de diensten die jou passen — wijzigingen zie je meteen in je rooster. Lukt er iets niet? Laat het me weten!`,
    },
    {
      icon: '📎', label: 'Stuur afmeldprotocol',
      text: `Hoi ${voornaam}, hierbij ons afmeldprotocol: kun je een dienst onverhoopt niet werken, meld je dan uiterlijk 24 uur van tevoren af via de EXTRA-app of stuur ons hier een berichtje. Zo kunnen we op tijd vervanging regelen.`,
    },
    {
      icon: '🔗', label: 'Link naar Medewerkers App',
      text: `Hoi ${voornaam}! Via deze link kom je bij de EXTRA Medewerkers App: https://doehetextra.nl/employee-app — daar zie je je diensten, punten en beschikbaarheid.`,
    },
  ];
}

export default function ProfilePanel({ conv, teamMembers, onQuickReply, onConversationChanged }: Props) {
  const [contact, setContact] = useState<WaContact | null>(null);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [optInBusy, setOptInBusy] = useState(false);
  const [catBusy, setCatBusy] = useState(false);
  const [tabBusy, setTabBusy] = useState(false);

  // Fase 3E — bewerkbare profielvelden.
  type Veld = 'naam' | 'functie' | 'status' | 'phone';
  /** Losse tekst-state voor het naamveld: opslaan gebeurt op blur/Enter, zelfde ritme als telefoon. */
  const [naamInput, setNaamInput] = useState('');
  /** Welk veld nu een verzoek heeft lopen (control staat zolang uit). */
  const [veldBezig, setVeldBezig] = useState<Veld | null>(null);
  /** Korte terugkoppeling per veld; verdwijnt vanzelf. Geen opslaan-knop. */
  const [veldMelding, setVeldMelding] = useState<{ veld: Veld; tekst: string; kleur: string } | null>(null);
  /** Losse tekst-state voor het telefoonveld: opslaan gebeurt op blur/Enter. */
  const [telInput, setTelInput] = useState('');
  /**
   * Waarschuwing die BLIJFT staan, in tegenstelling tot veldMelding. Twee
   * gevallen waarin de planner iets moet weten dat hij anders pas veel later
   * merkt: een status die het contact uit de contactenlijst haalt, en een
   * gewijzigd nummer (het gesprek is op nummer gekoppeld).
   */
  const [profielWaarschuwing, setProfielWaarschuwing] = useState<string | null>(null);

  // Losse tekst-state + status voor het naamveld van gesprekken ZONDER
  // gekoppeld contact (bv. klanten, of nog niet-gematchte nummers). Los van
  // naamInput/veldBezig/veldMelding hierboven, want dat pad schrijft naar
  // het contact-record (bewaarProfiel) — dit pad schrijft rechtstreeks naar
  // whatsappConversations.displayName via een eigen endpoint.
  const [naamZonderContactInput, setNaamZonderContactInput] = useState('');
  const [naamZonderContactBezig, setNaamZonderContactBezig] = useState(false);
  const [naamZonderContactMelding, setNaamZonderContactMelding] = useState<{ tekst: string; kleur: string } | null>(null);

  // Losse voornaam/achternaam-correctie voor diezelfde contactloze gesprekken
  // — dit is NIET hetzelfde als naamZonderContact hierboven (die schrijft één
  // samengevoegde weergavenaam naar whatsappConversations.displayName). Dit
  // pad schrijft de gesplitste voornaam/achternaam naar
  // whatsapp_imported_contacts, want dát is wat WhatsApp-template-variabelen
  // als {{voornaam}} straks nodig hebben (zie server/routes.ts
  // .../geimporteerde-naam). Best-effort ingevuld door de eenmalige backfill,
  // hier per contact handmatig te corrigeren.
  const [voornaamCorrectieInput, setVoornaamCorrectieInput] = useState('');
  const [achternaamCorrectieInput, setAchternaamCorrectieInput] = useState('');
  const [naamCorrectieBezig, setNaamCorrectieBezig] = useState(false);
  const [naamCorrectieMelding, setNaamCorrectieMelding] = useState<{ tekst: string; kleur: string } | null>(null);

  // Functie-dropdown voor diezelfde contactloze gesprekken — zie
  // FUNCTIE_CATEGORIE_OPTIES hierboven. Schrijft naar conv.labels, dus geen
  // los input-veld nodig (geen tussenstate om te typen, alleen een keuze).
  const [functieZonderContactBezig, setFunctieZonderContactBezig] = useState(false);
  const [functieZonderContactMelding, setFunctieZonderContactMelding] = useState<{ tekst: string; kleur: string } | null>(null);

  /** Fase 3: handmatige override van het onderwerp-label (null = terug naar AI). */
  async function handleCategorie(category: AiCategory | null) {
    setCatBusy(true);
    try {
      await zetAiCategorie(conv.phoneNumber, category);
      onConversationChanged();
    } catch { /* stil falen; de poll zet de waarde terug */ }
    finally { setCatBusy(false); }
  }

  /**
   * Handmatige tab-override — verplaatst dit gesprek naar Medewerkers/
   * Kandidaten/Klanten, zonder dat de automatische matcher het terugzet.
   * Geen apart 'handmatig ingedeeld'-label: de gekozen waarde wint stilzwijgend.
   */
  async function handleTabblad(next: 'candidate' | 'unmatched' | 'prospect') {
    setTabBusy(true);
    try {
      await updateConversationCategory(conv.phoneNumber, next);
      onConversationChanged();
    } catch { /* stil falen; de poll zet de waarde terug */ }
    finally { setTabBusy(false); }
  }

  // Naam: een gekoppeld contact (candidate/employee-record) is de bewerkbare
  // bron van waarheid — die kan net gewijzigd zijn zonder dat conv.displayName
  // al is bijgewerkt (dat veld wordt apart door de matcher gezet). Klanten
  // hebben geen zo'n record (contact is dan null) en vallen terug op
  // conv.displayName. Helemaal onbekende nummers tonen, waar bekend, de naam
  // uit de eenmalige contactenimport met een dun icoontje als signaal.
  const contactNaam = contact ? [contact.firstName, contact.lastName].filter(Boolean).join(' ') : '';
  const naam = contactNaam || conv.displayName || conv.importedContactName || `+${conv.phoneNumber}`;
  const naamUitImport = !contactNaam && !conv.displayName && !!conv.importedContactName;
  const rol = conv.matchCategory === 'candidate' ? 'Medewerker'
    : conv.matchCategory === 'prospect' ? 'Klant'
    : 'Kandidaat';

  // Contact-lookup (functie/status/opt-in) via het bestaande /contacten endpoint.
  useEffect(() => {
    let stop = false;
    setContact(null);
    const digits = conv.phoneNumber.replace(/\D/g, '');
    const zoek = digits.slice(-8);
    if (!zoek) return;
    haalContacten({ q: zoek, pageSize: 10 })
      .then(r => {
        if (stop) return;
        const match = r.items.find(it => (it.phone || '').replace(/\D/g, '').endsWith(zoek));
        setContact(match || r.items[0] || null);
      })
      .catch(() => {});
    return () => { stop = true; };
  }, [conv.phoneNumber]);

  useEffect(() => {
    setNotes([]);
    setNewNote('');
    haalNotities(conv.phoneNumber).then(setNotes).catch(() => {});
  }, [conv.phoneNumber]);

  // Ander gesprek = schone lei voor de bewerkbare velden. Zonder dit blijft een
  // melding of waarschuwing van het vorige contact hangen boven een ander mens.
  useEffect(() => {
    setVeldBezig(null);
    setVeldMelding(null);
    setProfielWaarschuwing(null);
    setNaamZonderContactBezig(false);
    setNaamZonderContactMelding(null);
    setFunctieZonderContactBezig(false);
    setFunctieZonderContactMelding(null);
    setNaamCorrectieBezig(false);
    setNaamCorrectieMelding(null);
  }, [conv.phoneNumber]);

  // Naamveld zonder gekoppeld contact volgt displayName (handmatig gezet) of,
  // bij ontbreken daarvan, de naam uit de eenmalige contactenimport — zelfde
  // volgorde als de `naam`-berekening hieronder, zodat het veld altijd toont
  // wat er nu daadwerkelijk zichtbaar is in de kop en de gesprekkenlijst.
  useEffect(() => {
    setNaamZonderContactInput(conv.displayName || conv.importedContactName || '');
  }, [conv.phoneNumber, conv.displayName, conv.importedContactName]);

  // Voornaam/achternaam-correctievelden volgen de laatst bekende (best-effort
  // of al eerder handmatig gecorrigeerde) split uit de contactenimport.
  useEffect(() => {
    setVoornaamCorrectieInput(conv.importedFirstName || '');
    setAchternaamCorrectieInput(conv.importedLastName || '');
  }, [conv.phoneNumber, conv.importedFirstName, conv.importedLastName]);

  // Het telefoonveld volgt het geladen contact, maar valt terug op het nummer
  // van het gesprek: dat is het nummer waarop we deze persoon kennen.
  useEffect(() => {
    setTelInput(formatPhone(contact?.phone || conv.phoneNumber || ''));
  }, [contact?.contactId, contact?.phone, conv.phoneNumber]);

  // Naamveld volgt het geladen contact, zelfde ritme als telefoon hierboven.
  useEffect(() => {
    setNaamInput([contact?.firstName, contact?.lastName].filter(Boolean).join(' '));
  }, [contact?.contactId, contact?.firstName, contact?.lastName]);

  /** Alleen cijfers, om "+31 6 12 34 56 78" met "31612345678" te kunnen vergelijken. */
  const cijfers = (v: string | null | undefined) => (v || '').replace(/\D/g, '');

  // Voor de Functie-dropdown bij gesprekken zónder gekoppeld contact: de
  // canonieke categorie die al in conv.labels staat, ongeacht welke
  // schrijfwijze — zodat de dropdown een eerder gekozen waarde herkent.
  const huidigeFunctieCategorie = (conv.labels || []).map(l => FUNCTIE_LABEL_NAAR_CATEGORIE[l]).find(Boolean) || '';
  const status =
    (contact?.sourceStatus && (STATUS_WEERGAVE[contact.sourceStatus] || contact.sourceStatus)) ||
    (conv.inboxStatus === 'resolved' ? 'Opgelost' : conv.inboxStatus === 'spam' ? 'Spam' : 'Open');

  /**
   * Fase 3E — één veld opslaan. Direct bij wijzigen, geen opslaan-knop: de
   * planner zit hier met een gesprek open, niet met een formulier.
   *
   * De lokale state wordt meteen bijgewerkt (zoals toggleOptIn dat ook doet) en
   * bij een fout teruggedraaid, zodat het veld nooit een waarde toont die niet
   * in de database staat.
   */
  async function bewaarProfiel(veld: Veld, patch: WaProfielPatch) {
    if (!contact || veldBezig) return;
    const vorige = contact;
    setVeldBezig(veld);
    setVeldMelding(null);
    try {
      const r = await updateContactProfiel(contact.contactType, contact.contactId, patch);
      setContact({
        ...contact,
        functie: r.functie ?? contact.functie,
        sourceStatus: r.status ?? contact.sourceStatus,
        phone: r.phone ?? contact.phone,
        firstName: r.firstName ?? contact.firstName,
        lastName: r.lastName ?? contact.lastName,
      });
      if (r.phone) setTelInput(formatPhone(r.phone));
      if (veld === 'naam') setNaamInput([r.firstName, r.lastName].filter(Boolean).join(' '));
      setVeldMelding({ veld, tekst: 'Opgeslagen', kleur: '#059669' });

      if (veld === 'status' && r.uitContactenlijst) {
        setProfielWaarschuwing(
          'Met deze status staat dit contact niet meer in de WhatsApp-contactenlijst. ' +
          'Zolang je dit gesprek open houdt kun je het hier terugzetten; na verversen ' +
          'toont dit paneel geen gekoppeld contact meer.',
        );
      } else if (veld === 'phone' && r.phone && vorige.phone && r.phone !== vorige.phone) {
        setProfielWaarschuwing(
          `Nummer opgeslagen als ${formatPhone(r.phone)}. Let op: gesprekken worden op nummer ` +
          'gekoppeld, dus dit gesprek hoort vanaf nu bij het oude nummer.',
        );
      } else if (veld === 'status') {
        setProfielWaarschuwing(null);
      }
    } catch (e: any) {
      setContact(vorige);
      setTelInput(formatPhone(vorige.phone || conv.phoneNumber || ''));
      setNaamInput([vorige.firstName, vorige.lastName].filter(Boolean).join(' '));
      setVeldMelding({ veld, tekst: e?.message || 'Opslaan mislukt', kleur: '#b91c1c' });
    } finally {
      setVeldBezig(null);
    }
  }

  // "Opgeslagen" hoort te verdwijnen; een foutmelding blijft staan tot je het
  // opnieuw probeert, anders mist de planner precies het bericht dat telt.
  useEffect(() => {
    if (!veldMelding || veldMelding.kleur !== '#059669') return;
    const t = setTimeout(() => setVeldMelding(null), 2500);
    return () => clearTimeout(t);
  }, [veldMelding]);

  useEffect(() => {
    if (!naamZonderContactMelding || naamZonderContactMelding.kleur !== '#059669') return;
    const t = setTimeout(() => setNaamZonderContactMelding(null), 2500);
    return () => clearTimeout(t);
  }, [naamZonderContactMelding]);

  useEffect(() => {
    if (!naamCorrectieMelding || naamCorrectieMelding.kleur !== '#059669') return;
    const t = setTimeout(() => setNaamCorrectieMelding(null), 2500);
    return () => clearTimeout(t);
  }, [naamCorrectieMelding]);

  useEffect(() => {
    if (!functieZonderContactMelding || functieZonderContactMelding.kleur !== '#059669') return;
    const t = setTimeout(() => setFunctieZonderContactMelding(null), 2500);
    return () => clearTimeout(t);
  }, [functieZonderContactMelding]);

  /**
   * Naam opslaan voor een gesprek ZONDER gekoppeld contact — bv. een klant of
   * een nog niet-gematchte kandidaat. Schrijft rechtstreeks naar
   * whatsappConversations.displayName; upsertConversation() bewaart die
   * waarde daarna gewoon, tenzij de matcher ooit een échte naam vindt (zie
   * server/whatsapp/storage.ts) — dus dit kan nooit een toekomstige, betere
   * match blokkeren.
   */
  async function bewaarNaamZonderContact() {
    const ingevoerd = naamZonderContactInput.trim();
    const huidig = conv.displayName || conv.importedContactName || '';
    if (!ingevoerd || ingevoerd === huidig) { setNaamZonderContactInput(huidig); return; }
    setNaamZonderContactBezig(true);
    setNaamZonderContactMelding(null);
    try {
      await updateConversationDisplayName(conv.phoneNumber, ingevoerd);
      setNaamZonderContactMelding({ tekst: 'Opgeslagen', kleur: '#059669' });
      onConversationChanged();
    } catch (e: any) {
      setNaamZonderContactInput(huidig);
      setNaamZonderContactMelding({ tekst: e?.message || 'Opslaan mislukt', kleur: '#b91c1c' });
    } finally {
      setNaamZonderContactBezig(false);
    }
  }

  /**
   * Voornaam/achternaam opslaan voor WhatsApp-templatevariabelen zoals
   * {{voornaam}} — voor een gesprek zónder gekoppeld kandidaat/prospect-
   * record. Schrijft naar whatsapp_imported_contacts (zie
   * PUT .../geimporteerde-naam), NIET naar whatsappConversations.displayName
   * — dat blijft de losse "Naam"-editor hierboven. Beide velden leeg is niet
   * toegestaan (de server wijst dat ook af), zodat er nooit een lege rij
   * ontstaat die een latere echte match in de weg zou kunnen zitten.
   */
  async function bewaarNaamCorrectie() {
    const voornaam = voornaamCorrectieInput.trim();
    const achternaam = achternaamCorrectieInput.trim();
    const huidigVoornaam = conv.importedFirstName || '';
    const huidigAchternaam = conv.importedLastName || '';
    if (voornaam === huidigVoornaam && achternaam === huidigAchternaam) return;
    if (!voornaam && !achternaam) {
      setVoornaamCorrectieInput(huidigVoornaam);
      setAchternaamCorrectieInput(huidigAchternaam);
      return;
    }
    setNaamCorrectieBezig(true);
    setNaamCorrectieMelding(null);
    try {
      await updateImportedContactName(conv.phoneNumber, voornaam, achternaam);
      setNaamCorrectieMelding({ tekst: 'Opgeslagen', kleur: '#059669' });
      onConversationChanged();
    } catch (e: any) {
      setVoornaamCorrectieInput(huidigVoornaam);
      setAchternaamCorrectieInput(huidigAchternaam);
      setNaamCorrectieMelding({ tekst: e?.message || 'Opslaan mislukt', kleur: '#b91c1c' });
    } finally {
      setNaamCorrectieBezig(false);
    }
  }

  /**
   * Functie kiezen voor een gesprek zonder gekoppeld contact. Er is geen
   * kandidaat/medewerker-record om naartoe te schrijven, dus vervangt dit de
   * bestaande functie-achtige labels (elke schrijfwijze uit
   * FUNCTIE_LABEL_NAAR_CATEGORIE) door precies de nieuw gekozen — nooit
   * stapelen, net zoals contact.functie ook maar één waarde tegelijk is.
   * Lege keuze ("— kies een functie —") verwijdert 'm gewoon weer.
   */
  async function bewaarFunctieZonderContact(nieuweCategorie: string) {
    setFunctieZonderContactBezig(true);
    setFunctieZonderContactMelding(null);
    try {
      const overigeLabels = (conv.labels || []).filter(l => !(l in FUNCTIE_LABEL_NAAR_CATEGORIE));
      const volgende = nieuweCategorie ? [...overigeLabels, nieuweCategorie] : overigeLabels;
      await updateLabels(conv.phoneNumber, volgende);
      setFunctieZonderContactMelding({ tekst: 'Opgeslagen', kleur: '#059669' });
      onConversationChanged();
    } catch (e: any) {
      setFunctieZonderContactMelding({ tekst: e?.message || 'Opslaan mislukt', kleur: '#b91c1c' });
    } finally {
      setFunctieZonderContactBezig(false);
    }
  }

  async function handleAssign(value: string) {
    if (value === '') {
      await wijsGesprekToe(conv.phoneNumber, null, null);
    } else {
      const member = teamMembers.find(m => m.id === parseInt(value, 10));
      if (member) await wijsGesprekToe(conv.phoneNumber, member.id, member.name);
    }
    onConversationChanged();
  }

  async function handleAddLabel(e: FormEvent) {
    e.preventDefault();
    const nieuw = labelInput.trim().toLowerCase();
    if (!nieuw) return;
    const huidige = conv.labels || [];
    if (!huidige.includes(nieuw)) {
      await updateLabels(conv.phoneNumber, [...huidige, nieuw]);
      onConversationChanged();
    }
    setLabelInput('');
    setShowLabelInput(false);
  }

  async function handleRemoveLabel(label: string) {
    await updateLabels(conv.phoneNumber, (conv.labels || []).filter(l => l !== label));
    onConversationChanged();
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNoteSaving(true);
    try {
      await maakNotitie(conv.phoneNumber, newNote.trim());
      setNewNote('');
      setNotes(await haalNotities(conv.phoneNumber));
    } catch { /* ignore */ }
    setNoteSaving(false);
  }

  async function toggleOptIn() {
    if (!contact || optInBusy) return;
    setOptInBusy(true);
    const doel = contact.whatsappOptInStatus === 'actief' ? 'opt_out' : 'actief';
    try {
      await updateContactOptIn(contact.contactType, contact.contactId, doel, 'Handmatig gewijzigd via inbox');
      setContact({ ...contact, whatsappOptInStatus: doel });
    } catch { /* ignore */ }
    setOptInBusy(false);
  }

  const optIn = contact ? OPT_IN_WEERGAVE[contact.whatsappOptInStatus] : null;

  return (
    <div style={{
      width: 300, background: '#fff', borderLeft: `1px solid ${WA.border}`,
      display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
    }}>
      {/* Header. De grote gradient-avatar met initialen stond hier; die is weg,
          en daarmee ook het centreren — dat was er alleen om de cirkel te
          balanceren. Naam en subregel staan nu links uitgelijnd, gelijk met de
          Secties eronder, en de padding is verticaal ingekort zodat er geen
          lege band overblijft waar de cirkel stond. */}
      <div style={{
        background: WA.panel, padding: '13px 16px',
        borderBottom: `1px solid ${WA.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontWeight: WA_GEWICHT.bold, fontSize: WA_TEKST.h3 }}>{naam}</div>
          {naamUitImport && (
            <span title="Naam uit geïmporteerde contactenlijst" style={{ display: 'inline-flex', flexShrink: 0 }}>
              <ContactIcon size={13} strokeWidth={1.5} color={KLEUR.muted} />
            </span>
          )}
        </div>
        <div style={{ fontSize: WA_TEKST.secundair, color: WA.textSub, marginTop: 2 }}>
          {rol} sinds {formatDate(conv.createdAt)}
        </div>
      </div>

      {/* Profiel — Fase 3E bewerkbaar, mits er een gekoppeld contact is.
          Klantgesprekken (prospect) hebben geen record in candidates/employees;
          daar blijft dit een leesweergave. Een dropdown die nergens naartoe
          schrijft is erger dan geen dropdown. */}
      <Section title="Profiel">
        {contact ? (
          <>
            <EditRow
              k="Naam"
              melding={veldMelding?.veld === 'naam' ? veldMelding : null}
            >
              <input
                value={naamInput}
                disabled={veldBezig !== null}
                onChange={e => setNaamInput(e.target.value)}
                // Opslaan op blur én Enter, niet op elke toetsaanslag — zelfde
                // ritme als het telefoonveld hieronder.
                onBlur={() => {
                  const ingevoerd = naamInput.trim();
                  const huidig = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
                  if (!ingevoerd || ingevoerd === huidig) { setNaamInput(huidig); return; }
                  // Eerste woord = voornaam, de rest = achternaam. Simpel en
                  // voorspelbaar; tussenvoegsels ("van der") komen gewoon in de
                  // achternaam terecht, precies zoals ze getypt worden.
                  const [voornaam, ...rest] = ingevoerd.split(/\s+/);
                  bewaarProfiel('naam', { firstName: voornaam, lastName: rest.join(' ') });
                }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                placeholder="Naam"
                style={{ ...VELD_STIJL, outline: 'none' }}
              />
            </EditRow>

            <EditRow
              k="Functie"
              melding={veldMelding?.veld === 'functie' ? veldMelding : null}
            >
              <Select
                value={(contact.functie || '').toLowerCase() || LEEG_WAARDE}
                disabled={veldBezig !== null}
                onValueChange={v => bewaarProfiel('functie', { functie: v === LEEG_WAARDE ? '' : v })}
              >
                <SelectTrigger className={SELECT_TRIGGER_COMPACT}><SelectValue /></SelectTrigger>
                <SelectContent align="end">
                  {/* Bestaande vrije-tekstwaarde die niet in de lijst staat blijft
                      zichtbaar tot je hem vervangt — anders lijkt het veld leeg
                      terwijl er wel degelijk iets in de database staat. */}
                  {!WA_FUNCTIES.includes((contact.functie || '').toLowerCase() as any) && (
                    <SelectItem value={(contact.functie || '').toLowerCase() || LEEG_WAARDE}>
                      {contact.functie ? (FUNCTIE_WEERGAVE[contact.functie.toLowerCase()] || contact.functie) : '— niet ingevuld —'}
                    </SelectItem>
                  )}
                  {WA_FUNCTIES.map(f => (
                    <SelectItem key={f} value={f}>{WA_FUNCTIE_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditRow>

            <EditRow
              k="Telefoon"
              melding={veldMelding?.veld === 'phone' ? veldMelding : null}
            >
              <input
                value={telInput}
                disabled={veldBezig !== null}
                onChange={e => setTelInput(e.target.value)}
                // Opslaan op blur én Enter, niet op elke toetsaanslag: anders
                // gaat er een verzoek uit voor elk half nummer.
                onBlur={() => {
                  const ingevoerd = telInput.trim();
                  if (!ingevoerd) { setTelInput(formatPhone(contact.phone || conv.phoneNumber)); return; }
                  if (cijfers(ingevoerd) === cijfers(contact.phone)) return;
                  bewaarProfiel('phone', { phone: ingevoerd });
                }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                placeholder="+31 6 …"
                style={{ ...VELD_STIJL, outline: 'none' }}
              />
            </EditRow>

            <EditRow
              k="Status"
              last
              melding={veldMelding?.veld === 'status' ? veldMelding : null}
            >
              <Select
                value={contact.sourceStatus || LEEG_WAARDE}
                disabled={veldBezig !== null}
                onValueChange={v => bewaarProfiel('status', { status: v === LEEG_WAARDE ? '' : v })}
              >
                <SelectTrigger className={SELECT_TRIGGER_COMPACT}><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent align="end">
                  {(() => {
                    const set = WA_STATUSSEN[contact.contactType === 'medewerker' ? 'medewerker' : 'kandidaat'];
                    const huidig = contact.sourceStatus || '';
                    return (
                      <>
                        {/* Zelfde reden als bij Functie: een status die niet in
                            deze set hoort (bv. een medewerker die ooit als
                            kandidaat is aangemaakt) blijft leesbaar staan. */}
                        {huidig && !set.some(s => s.waarde === huidig) && (
                          <SelectItem value={huidig}>{STATUS_WEERGAVE[huidig] || huidig}</SelectItem>
                        )}
                        {set.map(s => (
                          <SelectItem key={s.waarde} value={s.waarde}>
                            {s.label}{s.uitLijst ? ' ⚠' : ''}
                          </SelectItem>
                        ))}
                      </>
                    );
                  })()}
                </SelectContent>
              </Select>
            </EditRow>

            {profielWaarschuwing && (
              <div style={{
                marginTop: 9, fontSize: 11, lineHeight: 1.45, padding: '7px 9px',
                borderRadius: 8, background: '#fffbeb', color: '#92400e',
                border: '1px solid #fde68a',
              }}>
                {profielWaarschuwing}
              </div>
            )}
          </>
        ) : (
          <>
            <EditRow
              k="Naam"
              melding={naamZonderContactMelding}
            >
              <input
                value={naamZonderContactInput}
                disabled={naamZonderContactBezig}
                onChange={e => setNaamZonderContactInput(e.target.value)}
                // Opslaan op blur én Enter, zelfde ritme als de andere velden
                // in dit paneel — niet op elke toetsaanslag.
                onBlur={bewaarNaamZonderContact}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                placeholder={`+${conv.phoneNumber}`}
                style={{ ...VELD_STIJL, outline: 'none' }}
              />
            </EditRow>
            {/* Los van "Naam" hierboven (die is voor de weergave in dit
                dashboard): voornaam/achternaam die WhatsApp-templates zoals
                {{voornaam}} straks gebruiken. Best-effort voorgevuld vanuit
                de eenmalige contactenimport, hier per contact te corrigeren. */}
            <EditRow
              k="Voornaam"
              melding={null}
            >
              <input
                value={voornaamCorrectieInput}
                disabled={naamCorrectieBezig}
                onChange={e => setVoornaamCorrectieInput(e.target.value)}
                onBlur={bewaarNaamCorrectie}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                placeholder="—"
                style={{ ...VELD_STIJL, outline: 'none' }}
              />
            </EditRow>
            <EditRow
              k="Achternaam"
              melding={naamCorrectieMelding}
            >
              <input
                value={achternaamCorrectieInput}
                disabled={naamCorrectieBezig}
                onChange={e => setAchternaamCorrectieInput(e.target.value)}
                onBlur={bewaarNaamCorrectie}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                placeholder="—"
                style={{ ...VELD_STIJL, outline: 'none' }}
              />
            </EditRow>
            <div style={{ fontSize: 10, color: WA.textSub, textAlign: 'right', marginTop: -4, marginBottom: 6 }}>
              Voor WhatsApp-sjablonen (bv. {'{{voornaam}}'}) — best-effort, controleer bij twijfel.
            </div>
            <EditRow
              k="Functie"
              melding={functieZonderContactMelding}
            >
              <Select
                value={huidigeFunctieCategorie || LEEG_WAARDE}
                disabled={functieZonderContactBezig}
                onValueChange={v => bewaarFunctieZonderContact(v === LEEG_WAARDE ? '' : v)}
              >
                <SelectTrigger className={SELECT_TRIGGER_COMPACT}><SelectValue /></SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value={LEEG_WAARDE}>— kies een functie —</SelectItem>
                  {FUNCTIE_CATEGORIE_OPTIES.map(o => (
                    <SelectItem key={o.waarde} value={o.waarde}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditRow>
            <InfoRow k="Telefoon" v={formatPhone(conv.phoneNumber)} />
            <InfoRow k="Status" v={status} last />
          </>
        )}
      </Section>

      {/* Fase 3 — onderwerp: door de AI bepaald, door de planner te overrulen.
          Eén veld, geen tweede statusveld dat kan afwijken. */}
      <Section title="Onderwerp">
        <Select
          value={conv.aiCategory ?? LEEG_WAARDE}
          disabled={catBusy}
          onValueChange={v => handleCategorie(v === LEEG_WAARDE ? null : (v as AiCategory))}
        >
          <SelectTrigger className={SELECT_TRIGGER_VOL}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={LEEG_WAARDE}>— nog niet bepaald —</SelectItem>
            {AI_CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{AI_CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div style={{ fontSize: WA_TEKST.badge, color: WA.textSub, marginTop: 6, lineHeight: 1.45 }}>
          {conv.aiCategorySource === 'handmatig' ? (
            <>
              Handmatig gezet — de AI past dit niet meer aan.{' '}
              <span
                onClick={() => !catBusy && handleCategorie(null)}
                style={{ color: WA.purpleDark, fontWeight: WA_GEWICHT.semibold, cursor: 'pointer' }}
              >Weer door AI laten bepalen</span>
            </>
          ) : (
            'Automatisch bepaald door de AI bij elk inkomend bericht.'
          )}
        </div>
        {conv.displayStatus === 'wacht_op_planner' && conv.escalationReason && (
          <div style={{
            marginTop: 8, fontSize: WA_TEKST.badge, padding: '6px 9px', borderRadius: 8,
            background: '#fef2f2', color: '#b91c1c', fontWeight: WA_GEWICHT.semibold,
          }}>
            Wacht op planner — {ESCALATION_REASON_LABELS[conv.escalationReason]}
          </div>
        )}
      </Section>

      {/* Tabblad — handmatig verplaatsen tussen Medewerkers/Kandidaten/Klanten.
          Losstaand van "Onderwerp" hierboven: dat is de AI-gelabelde inhoud van
          het gesprek, dit is welk tabblad het gesprek toont. Bewust geen apart
          label of tag: de gekozen waarde wint gewoon stilzwijgend van de
          automatische matching. */}
      <Section title="Tabblad">
        <Select
          value={conv.matchCategory}
          disabled={tabBusy}
          onValueChange={v => handleTabblad(v as 'candidate' | 'unmatched' | 'prospect')}
        >
          <SelectTrigger
            className={SELECT_TRIGGER_VOL}
            title="Verplaats dit gesprek naar een ander tabblad. Handmatige keuze blijft staan ook bij nieuwe berichten."
          ><SelectValue /></SelectTrigger>
          <SelectContent>
            {TABBLAD_OPTIES.map(o => (
              <SelectItem key={o.waarde} value={o.waarde}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      {/* Labels */}
      <Section title="Labels">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {(conv.labels || []).map(l => (
            <span
              key={l}
              title="Klik om label te verwijderen"
              onClick={() => handleRemoveLabel(l)}
              style={{
                fontSize: WA_TEKST.badge, padding: '4px 10px', borderRadius: 14,
                background: '#f1e9ff', color: WA.purpleDark, fontWeight: WA_GEWICHT.semibold, cursor: 'pointer',
              }}
            >{l}</span>
          ))}
          {showLabelInput ? (
            <form onSubmit={handleAddLabel} style={{ display: 'inline-flex' }}>
              <input
                autoFocus
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                onBlur={() => { setShowLabelInput(false); setLabelInput(''); }}
                placeholder="label…"
                style={{
                  fontSize: WA_TEKST.badge, padding: '3px 8px', borderRadius: 14, width: 90,
                  border: `1px solid ${WA.border}`, outline: 'none', fontFamily: 'inherit',
                }}
              />
            </form>
          ) : (
            <span
              onClick={() => setShowLabelInput(true)}
              style={{
                fontSize: WA_TEKST.badge, padding: '4px 10px', borderRadius: 14, cursor: 'pointer',
                background: '#fff', color: WA.textSub, fontWeight: WA_GEWICHT.semibold, border: `1px dashed ${WA.border}`,
              }}
            >+ label</span>
          )}
        </div>
      </Section>

      {/* Snelle antwoorden */}
      <Section title="Snelle antwoorden">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quickReplies(voornaamVan(conv.displayName)).map(q => (
            <div
              key={q.label}
              onClick={() => onQuickReply(q.text)}
              style={{
                fontSize: WA_TEKST.secundair, background: WA.panel, padding: '8px 10px',
                borderRadius: 6, color: WA.text, cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#e9ebee'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = WA.panel; }}
            >{q.icon} {q.label}</div>
          ))}
        </div>
      </Section>

      {/* Toewijzen */}
      <Section title="Toewijzen">
        <Select
          value={conv.assignedToId != null ? String(conv.assignedToId) : LEEG_WAARDE}
          onValueChange={v => handleAssign(v === LEEG_WAARDE ? '' : v)}
        >
          <SelectTrigger className={SELECT_TRIGGER_VOL}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={LEEG_WAARDE}>Niet toegewezen</SelectItem>
            {teamMembers.map(m => (
              <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      {/* Interne notities (inklapbaar) */}
      <div style={{ padding: 16, borderBottom: '1px solid #f2f2f2' }}>
        <h4
          onClick={() => setNotesOpen(v => !v)}
          style={{
            margin: 0, fontSize: WA_TEKST.badge, letterSpacing: '.05em', textTransform: 'uppercase',
            color: WA.textSub, fontWeight: WA_GEWICHT.bold, cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            // Zie de Section-kop hierboven: anders pakt de h4-basisregel Poppins.
            fontFamily: 'inherit',
          }}
        >
          <span>Interne notities{notes.length > 0 ? ` (${notes.length})` : ''}</span>
          <span style={{ fontSize: WA_TEKST.mini }}>{notesOpen ? '▲' : '▼'}</span>
        </h4>
        {notesOpen && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {notes.length === 0 && (
                <div style={{ fontSize: WA_TEKST.secundair, color: WA.textSub }}>Nog geen notities</div>
              )}
              {notes.map(n => (
                <div key={n.id} style={{ background: '#fffbea', border: '1px solid #f5e6a8', borderRadius: 6, padding: '6px 8px' }}>
                  <div style={{ fontSize: WA_TEKST.secundair, color: WA.text, whiteSpace: 'pre-wrap' }}>{n.body}</div>
                  <div style={{ fontSize: WA_TEKST.mini, color: WA.textSub, marginTop: 3 }}>
                    {n.authorName} · {formatDate(n.createdAt)}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Nieuwe notitie…"
                style={{
                  flex: 1, fontSize: WA_TEKST.secundair, padding: '6px 8px', borderRadius: 6,
                  border: `1px solid ${WA.border}`, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                disabled={noteSaving || !newNote.trim()}
                style={{
                  border: 'none', background: WA.purple, color: '#fff', borderRadius: 6,
                  padding: '6px 10px', fontSize: WA_TEKST.secundair, fontWeight: WA_GEWICHT.semibold,
                  cursor: noteSaving ? 'wait' : 'pointer', opacity: newNote.trim() ? 1 : 0.5,
                }}
              >+</button>
            </form>
          </div>
        )}
      </div>

      {/* Opt-in-status */}
      <Section title="Opt-in-status">
        {contact && optIn ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: WA_TEKST.body, fontWeight: WA_GEWICHT.semibold }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: optIn.kleur, display: 'inline-block' }} />
              {optIn.label}
            </span>
            <button
              type="button"
              onClick={toggleOptIn}
              disabled={optInBusy}
              style={{
                border: `1px solid ${WA.border}`, background: '#fff', color: WA.textSub,
                borderRadius: 6, padding: '4px 8px', fontSize: WA_TEKST.badge, fontWeight: WA_GEWICHT.semibold,
                cursor: optInBusy ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {contact.whatsappOptInStatus === 'actief' ? 'Zet op opt-out' : 'Zet op actief'}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: WA_TEKST.secundair, color: WA.textSub }}>Geen gekoppeld contact gevonden</div>
        )}
      </Section>
    </div>
  );
}
