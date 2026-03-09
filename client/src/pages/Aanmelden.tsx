import { useState, useCallback, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Briefcase, FileText, Check, ChevronRight, ChevronLeft,
  MapPin, Phone, Mail, Calendar, Globe, Upload, Clock,
  AlertCircle, CheckCircle2, XCircle, Info, ArrowRight, MessageCircle
} from "lucide-react";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type FlowType = "NL" | "EU" | "NON_EU";
type WizardStep = "basics" | "distance_check" | "skills" | "twv" | "cv_schedule" | "success" | "rejected";


const EU_EER_COUNTRIES = [
  "Oostenrijk", "België", "Bulgarije", "Kroatië", "Cyprus", "Tsjechië",
  "Denemarken", "Estland", "Finland", "Frankrijk", "Duitsland", "Griekenland",
  "Hongarije", "Ierland", "Italië", "Letland", "Litouwen", "Luxemburg",
  "Malta", "Polen", "Portugal", "Roemenië", "Slowakije", "Slovenië",
  "Spanje", "Zweden", "IJsland", "Liechtenstein", "Noorwegen", "Zwitserland"
];

const ALL_COUNTRIES = [
  "Nederland", ...EU_EER_COUNTRIES.sort(),
  "---",
  "Afghanistan", "Albanië", "Algerije", "Angola", "Argentinië", "Armenië",
  "Australië", "Azerbeidzjan", "Bangladesh", "Belarus", "Bhutan", "Bolivia",
  "Bosnië en Herzegovina", "Brazilië", "Cambodja", "Cameroen", "Canada",
  "Chili", "China", "Colombia", "Congo", "Cuba", "Dominicaanse Republiek",
  "Ecuador", "Egypte", "El Salvador", "Eritrea", "Ethiopië", "Filipijnen",
  "Georgië", "Ghana", "Guatemala", "Guinee", "Haïti", "Honduras",
  "India", "Indonesië", "Irak", "Iran", "Israël", "Ivoorkust",
  "Jamaica", "Japan", "Jemen", "Jordanië", "Kaapverdië", "Kazachstan",
  "Kenia", "Kirgizië", "Kosovo", "Koeweit", "Laos", "Libanon",
  "Libië", "Marokko", "Mexico", "Moldavië", "Mongolië", "Montenegro",
  "Mozambique", "Myanmar", "Nepal", "Nicaragua", "Nigeria", "Noord-Macedonië",
  "Oekraïne", "Oezbekistan", "Oman", "Pakistan", "Panama", "Paraguay",
  "Peru", "Russische Federatie", "Rwanda", "Saudi-Arabië", "Senegal",
  "Servië", "Sierra Leone", "Singapore", "Somalië", "Sri Lanka",
  "Sudan", "Suriname", "Syrië", "Tadzjikistan", "Tanzania", "Thailand",
  "Togo", "Tunesië", "Turkije", "Turkmenistan", "Uganda", "Uruguay",
  "Venezuela", "Verenigd Koninkrijk", "Verenigde Arabische Emiraten",
  "Verenigde Staten", "Vietnam", "Zuid-Afrika", "Zuid-Korea", "Zuid-Sudan"
];

const FUNCTIONS = [
  { value: "horecamedewerker", labelNL: "Horecamedewerker (bediening/bar)", labelEN: "Hospitality staff (service/bar)" },
  { value: "housekeeping", labelNL: "Housekeeping", labelEN: "Housekeeping" },
  { value: "frontoffice", labelNL: "Front-office / receptie", labelEN: "Front-office / reception" },
  { value: "chef", labelNL: "Chef / keuken (kok, souschef, zelfstandig werkend kok)", labelEN: "Chef / kitchen (cook, sous chef)" },
];

const EXPERIENCE_OPTIONS_NL = [
  { value: "none", label: "Geen ervaring" },
  { value: "lt6", label: "< 6 maanden" },
  { value: "6to12", label: "6–12 maanden" },
  { value: "1to3", label: "1–3 jaar" },
  { value: "3plus", label: "3+ jaar" },
];

const EXPERIENCE_OPTIONS_EN = [
  { value: "none", label: "No experience" },
  { value: "lt6", label: "< 6 months" },
  { value: "6to12", label: "6–12 months" },
  { value: "1to3", label: "1–3 years" },
  { value: "3plus", label: "3+ years" },
];

const EXPERIENCE_MAP: Record<string, string> = {
  "none": "Geen ervaring",
  "lt6": "< 6 maanden",
  "6to12": "6 - 12 maanden",
  "1to3": "1 - 3 jaar",
  "3plus": "3+ jaar",
};

function getFlow(nationality: string): FlowType {
  if (nationality === "Nederland") return "NL";
  if (EU_EER_COUNTRIES.includes(nationality)) return "EU";
  return "NON_EU";
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const CITY_COORDS: Record<string, [number, number]> = {
  "amsterdam": [52.3676, 4.9041],
  "den haag": [52.0705, 4.3007],
  "scheveningen": [52.0990, 4.2761],
  "utrecht": [52.0907, 5.1214],
};

function isWithin50km(city: string): boolean {
  const c = city.toLowerCase().trim();
  const knownClose = [
    "amsterdam", "den haag", "utrecht", "haarlem", "leiden", "delft",
    "rotterdam", "amstelveen", "diemen", "zaandam", "hilversum",
    "hoofddorp", "schiphol", "almere", "amersfoort", "gouda",
    "zoetermeer", "rijswijk", "voorburg", "leidschendam", "wassenaar",
    "noordwijk", "katwijk", "alphen aan den rijn", "woerden", "nieuwegein",
    "ijmuiden", "beverwijk", "heemstede", "purmerend", "hoorn",
    "naarden", "bussum", "baarn", "soest", "zeist", "bilthoven",
    "maarssen", "breukelen", "abcoude", "weesp", "muiden",
    "scheveningen", "den haag", "the hague", "lisse", "sassenheim",
    "voorhout", "oegstgeest", "rijnsburg", "dordrecht", "vlaardingen",
    "schiedam", "capelle aan den ijssel", "waddinxveen", "bodegraven",
    "huizen", "laren", "blaricum", "eemnes", "bunschoten",
  ];
  return knownClose.includes(c);
}

interface ExperienceThresholds {
  housekeeping: string[];
  horecamedewerker: string[];
  frontoffice: string[];
  chef: string[];
}

const NL_THRESHOLDS: ExperienceThresholds = {
  housekeeping: ["3plus"],
  horecamedewerker: ["6to12", "1to3", "3plus"],
  frontoffice: ["1to3", "3plus"],
  chef: ["1to3", "3plus"],
};

const EU_THRESHOLDS: ExperienceThresholds = {
  housekeeping: ["3plus"],
  horecamedewerker: ["1to3", "3plus"],
  frontoffice: ["1to3", "3plus"],
  chef: ["1to3", "3plus"],
};

const NON_EU_THRESHOLDS: ExperienceThresholds = {
  housekeeping: ["3plus"],
  horecamedewerker: ["1to3", "3plus"],
  frontoffice: ["1to3", "3plus"],
  chef: ["1to3", "3plus"],
};

function XPatternBg({ count = 4, opacity = 0.08 }: { count?: number; opacity?: number }) {
  const positions = [
    { left: "5%", top: "8%", size: 180, rotate: 15 },
    { left: "78%", top: "15%", size: 150, rotate: -20 },
    { left: "45%", top: "55%", size: 220, rotate: 30 },
    { left: "12%", top: "72%", size: 160, rotate: -8 },
    { left: "88%", top: "75%", size: 130, rotate: 40 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {positions.slice(0, count).map((pos, i) => (
        <div key={i} className="absolute" style={{
          left: pos.left, top: pos.top, width: pos.size, height: pos.size,
          transform: `rotate(${pos.rotate}deg)`, opacity,
          WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          backgroundColor: "rgba(255,255,255,0.9)",
        }} />
      ))}
    </div>
  );
}

const COPY = {
  NL: {
    step1Title: "Eerst wat basics",
    step2Title: "Taal & ervaring",
    step3Title: "CV & gesprek",
    firstName: "Voornaam",
    lastName: "Achternaam",
    birthDate: "Geboortedatum",
    city: "Woonplaats",
    postcode: "Postcode",
    phone: "Telefoonnummer",
    email: "E-mailadres",
    nationality: "Nationaliteit",
    preferredFunction: "Voorkeursfunctie",
    continue: "Ga verder",
    back: "Terug",
    submit: "Verstuur aanmelding",
    dutchLevelQuestion: "Hoe goed spreek je Nederlands?",
    englishLevelQuestion: "Hoe goed spreek je Engels?",
    langLevelNiet: "Niet",
    langLevelBasis: "Basis",
    langLevelRedelijk: "Redelijk",
    langLevelGoed: "Goed",
    functionConfirm: "Voor welke functie wil je solliciteren?",
    experienceQuestion: "Hoeveel relevante werkervaring heb je in deze functie?",
    distanceWarning: "We werken vooral in Amsterdam, Den Haag en Utrecht. Woon je wat verder weg, dan zijn diensten soms lastiger te combineren. Weet je zeker dat je je aanmelding wilt doorzetten?",
    yesContine: "Ja, ik wil doorgaan",
    noStop: "Nee, ik stop mijn aanmelding",
    ageTooYoung: "Je moet minimaal 17 jaar zijn om je bij EXTRA aan te melden.",
    noLanguage: "Bij bijna al onze opdrachten heb je Nederlands of Engels nodig. Omdat je hebt aangegeven beide talen niet goed genoeg te spreken, kunnen we je helaas niet verder helpen.",
    noCvBlocker: "Om een gesprek in te plannen vragen we je eerst je cv te uploaden. Zo kunnen we kijken of er een goede match is met onze opdrachten.",
    noCvHelper: "Je cv helpt ons om je sneller te matchen met opdrachten. Zonder cv kun je nog geen gesprek inplannen.",
    notEnoughExperience: "Voor de opdrachten die we nu hebben, vragen onze klanten meer ervaring in deze functie. Dat wil niet zeggen dat je geen talent hebt, maar nu matcht het nog niet goed genoeg. Je kunt je later altijd opnieuw aanmelden.",
    roleNotAvailable: "Vanwege Nederlandse wetgeving rond werkvergunningen kunnen we voor deze functie op dit moment alleen kandidaten aannemen met een andere verblijfsstatus. Dat is geen beoordeling van jou als persoon, maar puur een juridische voorwaarde.",
    uploadCv: "Upload je cv",
    uploadCvDesc: "Voordat je een gesprek inplant, willen we je cv erbij. Zo kunnen we gericht meekijken welke opdrachten bij je passen.",
    uploadBtn: "Kies bestand",
    acceptedFormats: "PDF, DOC of DOCX (max. 10 MB)",
    scheduleTitle: "Plan je gesprek",
    scheduleDesc: "Kies een datum en tijd die jou uitkomt. We nemen dan contact met je op om het gesprek te bevestigen.",
    successTitle: "Top, je aanmelding is ontvangen!",
    successDesc: "Je ontvangt zo een bevestiging per mail met alle details. App ons gerust als je nog vragen hebt.",
    laterBtn: "Ik upload mijn cv later",
    whyWeAsk: "Waarom vragen we dit?",
    whyLanguage: "Bij bijna al onze opdrachten heb je contact met gasten en collega's. Goed kunnen communiceren in Nederlands of Engels is daardoor essentieel.",
    whyExperience: "Onze klanten verwachten een bepaald ervaringsniveau. Zo kunnen we de juiste match maken.",
    progressStep1: "Persoonlijk",
    progressStep2: "Skills",
    progressStep3: "CV & gesprek",
    preferredDate: "Voorkeursdatum",
    preferredTime: "Voorkeurstijd",
    morning: "Ochtend (9:00 - 12:00)",
    afternoon: "Middag (12:00 - 17:00)",
    stoppedTitle: "Bedankt voor je interesse!",
    stoppedDesc: "Fijn dat je het overwoog. Je bent altijd later welkom om je opnieuw aan te melden bij EXTRA.",
    backToHome: "Terug naar de homepage",
    channelLabel: "Via welk kanaal ben je bij EXTRA terechtgekomen?",
    channelPlaceholder: "Bijv. Instagram, Indeed, via een vriend...",
  },
  EN: {
    step1Title: "Let's start with the basics",
    step2Title: "Language & experience",
    step3Title: "CV & interview",
    firstName: "First name",
    lastName: "Last name",
    birthDate: "Date of birth",
    city: "City",
    postcode: "Postal code",
    phone: "Phone number",
    email: "Email address",
    nationality: "Nationality",
    preferredFunction: "Preferred role",
    continue: "Continue",
    back: "Back",
    submit: "Submit application",
    dutchLevelQuestion: "How well do you speak Dutch?",
    englishLevelQuestion: "How well do you speak English?",
    langLevelNiet: "Not at all",
    langLevelBasis: "Basic",
    langLevelRedelijk: "Conversational",
    langLevelGoed: "Fluent",
    functionConfirm: "Which role are you applying for?",
    experienceQuestion: "How many years of relevant experience do you have in this role?",
    distanceWarning: "Most of our shifts are in Amsterdam, The Hague and Utrecht. If you live further away, travel can be challenging. Are you sure you want to continue your application?",
    yesContine: "Yes, I want to continue",
    noStop: "No, I'll stop my application",
    ageTooYoung: "You must be at least 17 years old to register with EXTRA.",
    noLanguage: "Most of our assignments require Dutch or English. Since you indicated you don't speak either language sufficiently, we unfortunately cannot proceed.",
    noCvBlocker: "To schedule an interview, we need your CV first. This helps us find the best assignments for you.",
    noCvHelper: "Your CV helps us match you faster with assignments. Without a CV, you cannot yet schedule an interview.",
    notEnoughExperience: "For the assignments we currently have, our clients require more experience in this role. This doesn't mean you lack talent, but it's not the right match at this time. You're always welcome to reapply later.",
    roleNotAvailable: "Due to Dutch labour law and work permit regulations, we can only accept candidates with a different residency status for this role at this time. This is not a judgment of you as a person, but purely a legal requirement.",
    uploadCv: "Upload your CV",
    uploadCvDesc: "Before scheduling an interview, we'd like to see your CV. This helps us find the best assignments for you.",
    uploadBtn: "Choose file",
    acceptedFormats: "PDF, DOC or DOCX (max. 10 MB)",
    scheduleTitle: "Schedule your interview",
    scheduleDesc: "Choose a date and time that works for you. We'll contact you to confirm the interview.",
    successTitle: "Great, your application has been received!",
    successDesc: "You'll receive a confirmation email shortly with all the details. Feel free to message us if you have any questions.",
    laterBtn: "I'll upload my CV later",
    whyWeAsk: "Why do we ask this?",
    whyLanguage: "Most of our assignments involve direct contact with guests and colleagues. Being able to communicate well in Dutch or English is essential.",
    whyExperience: "Our clients expect a certain level of experience. This helps us make the right match.",
    progressStep1: "Personal",
    progressStep2: "Skills",
    progressStep3: "CV & interview",
    preferredDate: "Preferred date",
    preferredTime: "Preferred time",
    morning: "Morning (9:00 - 12:00)",
    afternoon: "Afternoon (12:00 - 17:00)",
    stoppedTitle: "Thank you for your interest!",
    stoppedDesc: "We appreciate you considering us. You're always welcome to reapply with EXTRA later.",
    backToHome: "Back to homepage",
    channelLabel: "How did you find EXTRA?",
    channelPlaceholder: "E.g. Instagram, Indeed, via a friend...",
  }
};

const NON_EU_DISCLAIMER_EN = "Because of Dutch labour law and work permit regulations, we need a few extra questions. We treat every application equally, but we must check if working in the Netherlands is legally possible.";

type CopyType = typeof COPY.NL;

function ProgressBarComponent({ stepNumber, t }: { stepNumber: number; t: CopyType }) {
  const steps = [t.progressStep1, t.progressStep2, t.progressStep3];
  return (
    <div className="flex items-center justify-center gap-0 mb-8 sm:mb-12 max-w-md mx-auto">
      {steps.map((label, i) => {
        const num = i + 1;
        const isActive = stepNumber === num;
        const isDone = stepNumber > num;
        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isDone ? "bg-green-500 text-white" : isActive ? "bg-white text-purple-700 shadow-lg shadow-white/20" : "bg-white/10 text-white/40"}`}>
                {isDone ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : num}
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold mt-1.5 ${isActive ? "text-white" : isDone ? "text-green-400" : "text-white/40"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 sm:mx-2 rounded-full transition-all duration-300 ${isDone ? "bg-green-400" : "bg-white/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InputFieldComponent({ label, value, onChange, type = "text", required = false, placeholder = "", error }: {
  label: string; value: string; onChange: (val: string) => void; type?: string; required?: boolean; placeholder?: string; error?: string;
}) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 ${error ? "border-red-400 focus:border-red-500" : ""}`}
      />
      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  );
}

const COUNTRY_CODES = [
  { flag: "🇳🇱", code: "+31", name: "Nederland" },
  { flag: "🇧🇪", code: "+32", name: "België" },
  { flag: "🇩🇪", code: "+49", name: "Duitsland" },
  { flag: "🇬🇧", code: "+44", name: "Verenigd Koninkrijk" },
  { flag: "🇫🇷", code: "+33", name: "Frankrijk" },
  { flag: "🇵🇱", code: "+48", name: "Polen" },
  { flag: "🇷🇴", code: "+40", name: "Roemenië" },
  { flag: "🇹🇷", code: "+90", name: "Turkije" },
  { flag: "🇲🇦", code: "+212", name: "Marokko" },
  { flag: "🇳🇬", code: "+234", name: "Nigeria" },
  { flag: "🇮🇳", code: "+91", name: "India" },
  { flag: "🇸🇷", code: "+597", name: "Suriname" },
  { flag: "🇧🇬", code: "+359", name: "Bulgarije" },
  { flag: "🇭🇺", code: "+36", name: "Hongarije" },
  { flag: "🇮🇹", code: "+39", name: "Italië" },
  { flag: "🇪🇸", code: "+34", name: "Spanje" },
  { flag: "🇵🇹", code: "+351", name: "Portugal" },
  { flag: "🇺🇸", code: "+1", name: "VS / Canada" },
  { flag: "🌍", code: "+other", name: "Anders" },
];

export function normalizeToE164(countryCode: string, localNumber: string): string {
  let digits = localNumber.replace(/[\s\-().]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return `${countryCode}${digits}`;
}

export function isValidE164(e164: string): boolean {
  return /^\+\d{7,15}$/.test(e164);
}

function PhoneInputComponent({ countryCode, localNumber, onCountryChange, onNumberChange, error, label, lang }: {
  countryCode: string;
  localNumber: string;
  onCountryChange: (code: string) => void;
  onNumberChange: (num: string) => void;
  error?: string;
  label: string;
  lang: "NL" | "EN";
}) {
  const [open, setOpen] = useState(false);
  const selected = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  const handleNumberInput = (val: string) => {
    const cleaned = val.replace(/[^\d\s\-().+]/g, "");
    onNumberChange(cleaned);
  };

  const placeholder = countryCode === "+31" ? "06 12345678" : "Jouw nummer";

  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
        {label} <span className="text-red-500">*</span>
      </Label>
      <div className={`flex h-12 rounded-xl border bg-white overflow-hidden transition-colors ${error ? "border-red-400" : "border-gray-200 focus-within:border-purple-500"}`}>
        {/* Country code selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 h-full bg-gray-50 hover:bg-gray-100 border-r border-gray-200 text-sm font-medium text-gray-700 min-w-[80px] transition-colors"
          >
            <span>{selected.flag}</span>
            <span>{countryCode === "+other" ? "+" : selected.code}</span>
            <svg className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-xl min-w-[220px] max-h-64 overflow-y-auto">
              {COUNTRY_CODES.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onCountryChange(c.code); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-purple-50 text-left transition-colors ${c.code === countryCode ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-700"}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-gray-400 text-xs">{c.code === "+other" ? "" : c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Number input */}
        <input
          type="tel"
          value={localNumber}
          onChange={e => handleNumberInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
          inputMode="tel"
        />
      </div>

      {/* Hint */}
      <p className="text-gray-400 text-xs mt-1">
        {lang === "NL"
          ? `Bijv. 06 12345678 → wordt opgeslagen als ${normalizeToE164(countryCode === "+other" ? "+31" : countryCode, "612345678")}`
          : `E.g. 06 12345678 → saved as ${normalizeToE164(countryCode === "+other" ? "+31" : countryCode, "612345678")}`}
      </p>

      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  );
}

function WhyCardComponent({ text, whyLabel }: { text: string; whyLabel: string }) {
  return (
    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 sm:p-5">
      <div className="flex items-start gap-2.5">
        <Info className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-purple-700 mb-1">{whyLabel}</p>
          <p className="text-sm text-purple-600/80 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function Aanmelden() {
  const [step, setStep] = useState<WizardStep>("basics");
  const [flow, setFlow] = useState<FlowType>("NL");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploaded, setCvUploaded] = useState(false);
  const [showCvBlocker, setShowCvBlocker] = useState(false);
  const [savedCandidateId, setSavedCandidateId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (step === "success") {
      try {
        const w = window as any;
        if (!w.jobster) w.jobster = [];
        w.jobster.push(function() {
          w.jobster.conversion("1a0c9513-ffae-436e-b8cc-2945905f1e5c", "customer");
        });
      } catch (_) {}
    }
  }, [step]);


  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    city: "",
    postcode: "",
    phone: "",
    phoneCountryCode: "+31",
    email: "",
    nationality: "",
    preferredFunction: "",
    dutchLevel: "",
    englishLevel: "",
    experience: "",
    twvNeeded: "",
    hasExistingTwv: "",
    willingToStopTwv: "",
    preferredDate: "",
    preferredTime: "",
    channel: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const lang = flow === "NL" ? "NL" : "EN";
  const t = COPY[lang];

  const stepNumber = step === "basics" ? 1 : step === "distance_check" ? 1 : (step === "skills" || step === "twv") ? 2 : 3;
  const totalSteps = 3;

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  function validateStep1(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = lang === "NL" ? "Voornaam is verplicht" : "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = lang === "NL" ? "Achternaam is verplicht" : "Last name is required";
    if (!formData.birthDate) newErrors.birthDate = lang === "NL" ? "Geboortedatum is verplicht" : "Date of birth is required";
    if (!formData.city.trim()) newErrors.city = lang === "NL" ? "Woonplaats is verplicht" : "City is required";
    if (!formData.email.trim()) newErrors.email = lang === "NL" ? "E-mailadres is verplicht" : "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = lang === "NL" ? "Ongeldig e-mailadres" : "Invalid email address";
    if (!formData.nationality) newErrors.nationality = lang === "NL" ? "Nationaliteit is verplicht" : "Nationality is required";
    if (!formData.preferredFunction) newErrors.preferredFunction = lang === "NL" ? "Kies een functie" : "Please select a role";

    const code = formData.phoneCountryCode === "+other" ? "" : formData.phoneCountryCode;
    if (!formData.phone.trim()) {
      newErrors.phone = lang === "NL" ? "Telefoonnummer is verplicht" : "Phone number is required";
    } else if (code) {
      const e164 = normalizeToE164(code, formData.phone);
      if (!isValidE164(e164)) {
        newErrors.phone = lang === "NL"
          ? "Voer een geldig telefoonnummer in (minimaal 7 cijfers)"
          : "Enter a valid phone number (at least 7 digits)";
      }
    }

    if (formData.birthDate) {
      const age = calculateAge(formData.birthDate);
      if (age < 17) {
        newErrors.birthDate = t.ageTooYoung;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep2(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.dutchLevel) {
      newErrors.dutchLevel = lang === "NL" ? "Geef je Nederlands niveau op" : "Please select your Dutch level";
    }
    const needsEnglish = formData.dutchLevel === "niet" || formData.dutchLevel === "basis";
    if (needsEnglish && !formData.englishLevel) {
      newErrors.englishLevel = lang === "NL" ? "Geef je Engels niveau op" : "Please select your English level";
    }
    if (!formData.experience) {
      newErrors.experience = lang === "NL" ? "Selecteer je ervaring" : "Please select your experience";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function isLanguageSufficient(): boolean {
    if (formData.dutchLevel === "redelijk" || formData.dutchLevel === "goed") return true;
    if ((formData.dutchLevel === "niet" || formData.dutchLevel === "basis") &&
        (formData.englishLevel === "redelijk" || formData.englishLevel === "goed")) return true;
    return false;
  }

  async function saveCandidate(status: "in_behandeling" | "afgewezen", partial: boolean, rejReason?: string): Promise<number | null> {
    try {
      const phone = formData.phoneCountryCode !== "+other"
        ? normalizeToE164(formData.phoneCountryCode, formData.phone)
        : formData.phone;

      const body: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone,
        birthDate: formData.birthDate,
        nationality: formData.nationality,
        city: formData.city,
        functionType: formData.preferredFunction,
        sourceChannel: formData.channel ? `Website - ${formData.channel}` : "Website aanmeldflow",
        status,
        partial,
        notes: rejReason ? `Afgewezen reden: ${rejReason}` : undefined,
      };

      if (savedCandidateId) {
        await apiRequest(`/api/aanmelden/${savedCandidateId}`, {
          method: "PATCH",
          body: JSON.stringify({ email: formData.email, status, partial, rejectionReason: rejReason }),
        });
        return savedCandidateId;
      } else {
        const res: any = await apiRequest("/api/aanmelden", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (res?.id) {
          setSavedCandidateId(res.id);
          return res.id;
        }
      }
    } catch (err: any) {
      if (err?.status === 409) {
        console.log("Kandidaat al aangemeld met dit e-mailadres");
      } else {
        console.error("Fout bij opslaan kandidaat:", err);
      }
    }
    return null;
  }

  async function handleStep1Next() {
    if (!validateStep1()) return;

    if (formData.birthDate && calculateAge(formData.birthDate) < 17) {
      await saveCandidate("afgewezen", false, "Te jong (< 17 jaar)");
      setRejectionReason(t.ageTooYoung);
      setStep("rejected");
      return;
    }

    const detectedFlow = getFlow(formData.nationality);
    setFlow(detectedFlow);

    if (detectedFlow === "NON_EU") {
      const fn = formData.preferredFunction;
      if (fn === "horecamedewerker" || fn === "frontoffice") {
        await saveCandidate("afgewezen", false, "Functie niet beschikbaar voor non-EU");
        setRejectionReason(COPY.EN.roleNotAvailable);
        setStep("rejected");
        return;
      }
    }

    await saveCandidate("in_behandeling", true);

    const cityCheck = formData.city.trim();
    if (cityCheck && !isWithin50km(cityCheck)) {
      setStep("distance_check");
    } else {
      setStep("skills");
    }
  }

  async function handleStep2Next() {
    if (!validateStep2()) return;

    if (!isLanguageSufficient()) {
      await saveCandidate("afgewezen", false, "Geen taalvaardigheid Nederlands/Engels");
      setRejectionReason(t.noLanguage);
      setStep("rejected");
      return;
    }

    const fn = formData.preferredFunction as keyof ExperienceThresholds;
    const thresholds = flow === "NL" ? NL_THRESHOLDS : flow === "EU" ? EU_THRESHOLDS : NON_EU_THRESHOLDS;
    const allowed = thresholds[fn] || [];

    if (allowed.length === 0) {
      await saveCandidate("afgewezen", false, "Functie niet beschikbaar");
      setRejectionReason(t.roleNotAvailable);
      setStep("rejected");
      return;
    }

    if (!allowed.includes(formData.experience)) {
      await saveCandidate("afgewezen", false, "Onvoldoende ervaring");
      setRejectionReason(t.notEnoughExperience);
      setStep("rejected");
      return;
    }

    if (!cvUploaded) {
      const candidateId = await saveCandidate("in_behandeling", true);
      if (candidateId) {
        fetch(`/api/aanmelden/${candidateId}/cv-reminder`, { method: "POST" }).catch(() => {});
      }
      setShowCvBlocker(true);
      return;
    }

    setShowCvBlocker(false);
    if (flow === "NON_EU") {
      setStep("twv");
    } else {
      setStep("cv_schedule");
    }
  }

  async function handleTwvNext() {
    if (formData.twvNeeded === "yes" && formData.hasExistingTwv === "yes" && formData.willingToStopTwv === "no") {
      await saveCandidate("afgewezen", false, "TWV blokkeert samenwerking");
      setRejectionReason(lang === "EN"
        ? "We can only continue if your work permit allows you to work via EXTRA."
        : "We kunnen alleen verder als je werkvergunning het toelaat om via EXTRA te werken."
      );
      setStep("rejected");
      return;
    }
    setStep("cv_schedule");
  }

  function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!validTypes.includes(file.type)) {
      toast({ title: lang === "NL" ? "Ongeldig bestandstype" : "Invalid file type", description: t.acceptedFormats, variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: lang === "NL" ? "Bestand te groot" : "File too large", description: lang === "NL" ? "Maximaal 10 MB" : "Maximum 10 MB", variant: "destructive" });
      return;
    }
    setCvFile(file);
    setCvUploaded(true);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phoneCountryCode !== "+other"
          ? normalizeToE164(formData.phoneCountryCode, formData.phone)
          : formData.phone,
        birthDate: formData.birthDate,
        nationality: formData.nationality,
        city: formData.city,
        language: (() => {
          const parts: string[] = [];
          if (formData.dutchLevel && formData.dutchLevel !== "niet") {
            const map: Record<string, string> = { basis: "Basis", redelijk: "Redelijk", goed: "Goed" };
            parts.push(`${map[formData.dutchLevel] || formData.dutchLevel} Nederlands`);
          }
          if (formData.englishLevel && formData.englishLevel !== "niet") {
            const map: Record<string, string> = { basis: "Basis", redelijk: "Redelijk", goed: "Goed" };
            parts.push(`${map[formData.englishLevel] || formData.englishLevel} Engels`);
          }
          return parts.join(", ") || "Geen";
        })(),
        functionType: formData.preferredFunction,
        horecaExperience: EXPERIENCE_MAP[formData.experience] || formData.experience,
        needsTwv: flow === "NON_EU" && formData.twvNeeded === "yes",
        interviewDate: null,
        interviewTime: null,
        sourceChannel: formData.channel ? `Website - ${formData.channel}` : "Website aanmeldflow",
        notes: [cvFile ? `CV: ${cvFile.name}` : null, "Gesprek ingepland via Calendly", formData.channel ? `Gevonden via: ${formData.channel}` : null].filter(Boolean).join(" | "),
      };

      if (savedCandidateId) {
        await apiRequest(`/api/aanmelden/${savedCandidateId}`, {
          method: "PATCH",
          body: JSON.stringify({
            email: formData.email,
            language: payload.language,
            horecaExperience: payload.horecaExperience,
            needsTwv: payload.needsTwv,
            notes: payload.notes,
            partial: false,
          }),
        });
      } else {
        await apiRequest("/api/aanmelden", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (cvFile) {
        const fd = new FormData();
        fd.append("cv", cvFile);
        fd.append("email", formData.email);
        if (savedCandidateId) fd.append("candidateId", String(savedCandidateId));
        await fetch("/api/aanmelden/cv", { method: "POST", body: fd });
      }

      setStep("success");
    } catch (error) {
      toast({
        title: lang === "NL" ? "Er ging iets mis" : "Something went wrong",
        description: lang === "NL" ? "Probeer het opnieuw" : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-[#1a0a3e] to-indigo-950" />
      <XPatternBg count={4} opacity={0.07} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-purple-950/60 pointer-events-none" />

      <div className="relative z-10">
        <header className="py-5 sm:py-6 px-5 sm:px-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a href="/landing">
              <img src={extraLogoWit} alt="EXTRA" className="h-8 sm:h-9 w-auto" />
            </a>
            <a href="/landing" className="text-sm text-white/60 hover:text-white transition-colors font-medium">
              {t.backToHome}
            </a>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
          {step !== "success" && step !== "rejected" && <ProgressBarComponent stepNumber={stepNumber} t={t} />}

          {step === "basics" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-950/50 border border-white/10 p-6 sm:p-10 lg:p-12">
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.step1Title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <InputFieldComponent label={t.firstName} value={formData.firstName} onChange={(v) => updateField("firstName", v)} required error={errors.firstName} />
                <InputFieldComponent label={t.lastName} value={formData.lastName} onChange={(v) => updateField("lastName", v)} required error={errors.lastName} />
                <InputFieldComponent label={t.birthDate} value={formData.birthDate} onChange={(v) => updateField("birthDate", v)} type="date" required error={errors.birthDate} />
                <PhoneInputComponent
                  countryCode={formData.phoneCountryCode}
                  localNumber={formData.phone}
                  onCountryChange={(v) => updateField("phoneCountryCode", v)}
                  onNumberChange={(v) => updateField("phone", v)}
                  error={errors.phone}
                  label={t.phone}
                  lang={lang}
                />
                <div className="sm:col-span-2">
                  <InputFieldComponent label={t.email} value={formData.email} onChange={(v) => updateField("email", v)} type="email" required placeholder="jouw@email.nl" error={errors.email} />
                </div>
                <InputFieldComponent label={t.city} value={formData.city} onChange={(v) => updateField("city", v)} required placeholder="Amsterdam" error={errors.city} />
                <InputFieldComponent label={t.postcode} value={formData.postcode} onChange={(v) => updateField("postcode", v)} placeholder="1012 AB" error={errors.postcode} />

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    {t.nationality} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.nationality} onValueChange={(v) => updateField("nationality", v)}>
                    <SelectTrigger className={`h-12 rounded-xl border-gray-200 ${errors.nationality ? "border-red-400" : ""}`}>
                      <SelectValue placeholder={lang === "NL" ? "Selecteer land" : "Select country"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {ALL_COUNTRIES.filter(c => c !== "---").map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.nationality && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.nationality}</p>}
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    {t.preferredFunction} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.preferredFunction} onValueChange={(v) => updateField("preferredFunction", v)}>
                    <SelectTrigger className={`h-12 rounded-xl border-gray-200 ${errors.preferredFunction ? "border-red-400" : ""}`}>
                      <SelectValue placeholder={lang === "NL" ? "Kies een functie" : "Choose a role"} />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNCTIONS.map((fn) => (
                        <SelectItem key={fn.value} value={fn.value}>{lang === "NL" ? fn.labelNL : fn.labelEN}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.preferredFunction && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.preferredFunction}</p>}
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-purple-500" />
                      {t.channelLabel}
                    </span>
                  </Label>
                  <Input
                    type="text"
                    value={formData.channel}
                    onChange={(e) => updateField("channel", e.target.value)}
                    placeholder={t.channelPlaceholder}
                    className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button onClick={handleStep1Next} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-6 rounded-xl text-base shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all">
                  {t.continue} <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === "distance_check" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-950/50 border border-white/10 p-6 sm:p-10 lg:p-12 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {lang === "NL" ? "Even checken..." : "Just checking..."}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-8 text-base sm:text-lg">
                {t.distanceWarning}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => setStep("skills")} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-5 rounded-xl text-base shadow-lg shadow-purple-500/20">
                  {t.yesContine}
                </Button>
                <Button onClick={() => { setRejectionReason(t.stoppedDesc); setStep("rejected"); }} variant="outline" className="font-bold px-8 py-5 rounded-xl text-base border-gray-300">
                  {t.noStop}
                </Button>
              </div>
            </div>
          )}

          {step === "skills" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-950/50 border border-white/10 p-6 sm:p-10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.step2Title}</h2>
                </div>

                {flow === "NON_EU" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800 leading-relaxed">{NON_EU_DISCLAIMER_EN}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Vraag 1: Nederlands niveau */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">{t.dutchLevelQuestion}</Label>
                    <div className="space-y-2">
                      {[
                        { value: "niet", label: t.langLevelNiet },
                        { value: "basis", label: t.langLevelBasis },
                        { value: "redelijk", label: t.langLevelRedelijk },
                        { value: "goed", label: t.langLevelGoed },
                      ].map((opt) => (
                        <label key={opt.value} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${formData.dutchLevel === opt.value ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/30"}`}>
                          <input
                            type="radio"
                            name="dutchLevel"
                            value={opt.value}
                            checked={formData.dutchLevel === opt.value}
                            onChange={(e) => { updateField("dutchLevel", e.target.value); updateField("englishLevel", ""); setShowCvBlocker(false); }}
                            className="accent-purple-600 w-4 h-4"
                          />
                          <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors.dutchLevel && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.dutchLevel}</p>}
                  </div>

                  {/* Vraag 2: Engels niveau (conditioneel) */}
                  {(formData.dutchLevel === "niet" || formData.dutchLevel === "basis") && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <Label className="text-sm font-semibold text-gray-700 mb-3 block">{t.englishLevelQuestion}</Label>
                      <div className="space-y-2">
                        {[
                          { value: "niet", label: t.langLevelNiet },
                          { value: "basis", label: t.langLevelBasis },
                          { value: "redelijk", label: t.langLevelRedelijk },
                          { value: "goed", label: t.langLevelGoed },
                        ].map((opt) => (
                          <label key={opt.value} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${formData.englishLevel === opt.value ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/30"}`}>
                            <input
                              type="radio"
                              name="englishLevel"
                              value={opt.value}
                              checked={formData.englishLevel === opt.value}
                              onChange={(e) => { updateField("englishLevel", e.target.value); setShowCvBlocker(false); }}
                              className="accent-purple-600 w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                      {errors.englishLevel && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.englishLevel}</p>}
                    </div>
                  )}

                  {/* Vraag 3: Werkervaring */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t.experienceQuestion}</Label>
                    <Select value={formData.experience} onValueChange={(v) => { updateField("experience", v); setShowCvBlocker(false); }}>
                      <SelectTrigger className={`h-12 rounded-xl border-gray-200 ${errors.experience ? "border-red-400" : ""}`}>
                        <SelectValue placeholder={lang === "NL" ? "Selecteer ervaring" : "Select experience"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(lang === "NL" ? EXPERIENCE_OPTIONS_NL : EXPERIENCE_OPTIONS_EN).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.experience && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.experience}</p>}
                  </div>

                  {/* CV upload */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">{t.uploadCv}</h3>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">{t.noCvHelper}</p>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-purple-400 hover:bg-purple-50/50 ${cvUploaded ? "border-green-400 bg-green-50/50" : "border-gray-200 bg-gray-50/50"}`}
                    >
                      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" />
                      {cvUploaded && cvFile ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                          <p className="text-sm font-semibold text-green-700">{cvFile.name}</p>
                          <p className="text-xs text-green-600">{(cvFile.size / 1024 / 1024).toFixed(1)} MB · <span className="underline cursor-pointer">{lang === "NL" ? "Ander bestand kiezen" : "Choose different file"}</span></p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <p className="text-sm font-semibold text-gray-700">{t.uploadBtn}</p>
                          <p className="text-xs text-gray-400">{t.acceptedFormats}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CV blocker melding */}
                  {showCvBlocker && !cvUploaded && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 leading-relaxed">{t.noCvBlocker}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-between">
                  <Button onClick={() => setStep("basics")} variant="outline" className="font-bold px-6 py-5 rounded-xl text-base border-gray-300">
                    <ChevronLeft className="w-5 h-5 mr-1" /> {t.back}
                  </Button>
                  <Button onClick={handleStep2Next} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-5 rounded-xl text-base shadow-lg shadow-purple-500/20">
                    {t.continue} <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <WhyCardComponent text={t.whyLanguage} whyLabel={t.whyWeAsk} />
                <WhyCardComponent text={t.whyExperience} whyLabel={t.whyWeAsk} />
              </div>
            </div>
          )}

          {step === "twv" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-950/50 border border-white/10 p-6 sm:p-10 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Work permit (TWV)</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Do you need a work permit (TWV) to work in the Netherlands?</Label>
                  <div className="space-y-2">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "unknown", label: "I don't know" },
                    ].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${formData.twvNeeded === opt.value ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                        <input type="radio" name="twv" value={opt.value} checked={formData.twvNeeded === opt.value} onChange={(e) => updateField("twvNeeded", e.target.value)} className="accent-purple-600 w-4 h-4" />
                        <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {formData.twvNeeded === "unknown" && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-sm text-amber-800">If you are not an EU/EEA or Swiss citizen, you usually need a TWV. Our team will check this with you in the interview.</p>
                    </div>
                  )}
                </div>

                {formData.twvNeeded === "yes" && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">Do you already have a valid TWV for another employer in the Netherlands?</Label>
                    <div className="space-y-2">
                      {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map((opt) => (
                        <label key={opt.value} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${formData.hasExistingTwv === opt.value ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                          <input type="radio" name="existingTwv" value={opt.value} checked={formData.hasExistingTwv === opt.value} onChange={(e) => updateField("hasExistingTwv", e.target.value)} className="accent-purple-600 w-4 h-4" />
                          <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.twvNeeded === "yes" && formData.hasExistingTwv === "yes" && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">Are you willing to stop that TWV if you start working via EXTRA?</Label>
                    <div className="space-y-2">
                      {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map((opt) => (
                        <label key={opt.value} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${formData.willingToStopTwv === opt.value ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                          <input type="radio" name="willingStop" value={opt.value} checked={formData.willingToStopTwv === opt.value} onChange={(e) => updateField("willingToStopTwv", e.target.value)} className="accent-purple-600 w-4 h-4" />
                          <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <Button onClick={() => setStep("skills")} variant="outline" className="font-bold px-6 py-5 rounded-xl text-base border-gray-300">
                  <ChevronLeft className="w-5 h-5 mr-1" /> {t.back}
                </Button>
                <Button onClick={handleTwvNext} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-5 rounded-xl text-base shadow-lg shadow-purple-500/20">
                  {t.continue} <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === "cv_schedule" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-950/50 border border-white/10 p-6 sm:p-10 lg:p-12">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.step3Title}</h2>
                </div>

                {/* Checklist */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-8 p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    {lang === "NL" ? "CV geüpload" : "CV uploaded"}
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    {lang === "NL" ? "Aanmelding compleet" : "Registration complete"}
                  </div>
                </div>

                {/* What happens next */}
                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-6 mb-2">
                  <h3 className="text-base font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">📬</span>
                    {lang === "NL" ? "Wat gebeurt er nu?" : "What happens next?"}
                  </h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3 text-sm text-purple-800">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">1</span>
                      <span>{lang === "NL" ? "Ons team bekijkt je aanmelding en CV — dit duurt meestal 1–2 werkdagen." : "Our team reviews your application and CV — this usually takes 1–2 business days."}</span>
                    </li>
                    <li className="flex gap-3 text-sm text-purple-800">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">2</span>
                      <span>{lang === "NL" ? "Als je profiel past, sturen we je een e-mail met een link om direct een gesprekstijd te kiezen." : "If your profile is a match, we'll send you an email with a link to pick an interview time."}</span>
                    </li>
                    <li className="flex gap-3 text-sm text-purple-800">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">3</span>
                      <span>{lang === "NL" ? "Na het gesprek hoor je snel of je welkom bent bij EXTRA!" : "After the interview you'll quickly hear if you're welcome at EXTRA!"}</span>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Submit bar */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-950/50 border border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button onClick={() => setStep(flow === "NON_EU" ? "twv" : "skills")} variant="outline" className="font-bold px-6 py-5 rounded-xl text-base border-gray-300 w-full sm:w-auto">
                  <ChevronLeft className="w-5 h-5 mr-1" /> {t.back}
                </Button>

                <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 font-bold px-8 py-5 rounded-xl text-base w-full sm:w-auto transition-all"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {lang === "NL" ? "Bezig..." : "Sending..."}
                      </div>
                    ) : (
                      <>{t.submit} <ArrowRight className="w-5 h-5 ml-1" /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-950/50 border border-white/10 p-8 sm:p-12 lg:p-16 max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.successTitle}</h2>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg mb-8">{t.successDesc}</p>
              <a href="/landing" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-xl text-base shadow-lg shadow-purple-500/20 transition-all">
                {t.backToHome} <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          )}

          {step === "rejected" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-950/50 border border-white/10 p-8 sm:p-12 lg:p-16 max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {rejectionReason === t.stoppedDesc ? t.stoppedTitle : (lang === "NL" ? "Helaas..." : "Unfortunately...")}
              </h2>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg mb-8">{rejectionReason}</p>
              <a href="/landing" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-xl text-base shadow-lg shadow-purple-500/20 transition-all">
                {t.backToHome} <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
