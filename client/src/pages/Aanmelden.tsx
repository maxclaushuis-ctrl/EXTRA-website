import { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Briefcase, FileText, Check, ChevronRight, ChevronLeft,
  MapPin, Phone, Mail, Calendar, Globe, Upload, Clock,
  AlertCircle, CheckCircle2, XCircle, Info, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
    languageQuestion: "Welke talen spreek je goed genoeg om gasten te helpen?",
    dutch: "Nederlands",
    english: "Engels",
    otherLang: "Anders, namelijk...",
    functionConfirm: "Voor welke functie wil je solliciteren?",
    experienceQuestion: "Hoeveel relevante werkervaring heb je in deze functie?",
    distanceWarning: "We werken vooral in Amsterdam, Den Haag en Utrecht. Woon je wat verder weg, dan zijn diensten soms lastiger te combineren. Weet je zeker dat je je aanmelding wilt doorzetten?",
    yesContine: "Ja, ik wil doorgaan",
    noStop: "Nee, ik stop mijn aanmelding",
    ageTooYoung: "Je moet minimaal 17 jaar zijn om je bij EXTRA aan te melden.",
    noLanguage: "Bij bijna al onze opdrachten heb je Nederlands of Engels nodig om met gasten en collega's te kunnen werken. Omdat je aangaf dat je deze talen nog niet voldoende spreekt, kunnen we je nu helaas niet verder helpen.",
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
    languageQuestion: "What language do you speak most confidently at work?",
    dutch: "Dutch",
    english: "English",
    otherLang: "Other, namely...",
    functionConfirm: "Which role are you applying for?",
    experienceQuestion: "How many years of relevant experience do you have in this role?",
    distanceWarning: "Most of our shifts are in Amsterdam, The Hague and Utrecht. If you live further away, travel can be challenging. Are you sure you want to continue your application?",
    yesContine: "Yes, I want to continue",
    noStop: "No, I'll stop my application",
    ageTooYoung: "You must be at least 17 years old to register with EXTRA.",
    noLanguage: "Most of our assignments require you to communicate with guests and colleagues in Dutch or English. Since you indicated you don't speak these languages sufficiently, we unfortunately cannot proceed.",
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
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isDone ? "bg-green-500 text-white" : isActive ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "bg-gray-200 text-gray-500"}`}>
                {isDone ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : num}
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold mt-1.5 ${isActive ? "text-purple-600" : isDone ? "text-green-600" : "text-gray-400"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 sm:mx-2 rounded-full transition-all duration-300 ${isDone ? "bg-green-400" : "bg-gray-200"}`} />
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    city: "",
    postcode: "",
    phone: "",
    email: "",
    nationality: "",
    preferredFunction: "",
    speaksDutch: false,
    speaksEnglish: false,
    otherLanguage: "",
    experience: "",
    twvNeeded: "",
    hasExistingTwv: "",
    willingToStopTwv: "",
    preferredDate: "",
    preferredTime: "",
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
    if (!formData.phone.trim()) newErrors.phone = lang === "NL" ? "Telefoonnummer is verplicht" : "Phone number is required";
    if (!formData.email.trim()) newErrors.email = lang === "NL" ? "E-mailadres is verplicht" : "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = lang === "NL" ? "Ongeldig e-mailadres" : "Invalid email address";
    if (!formData.nationality) newErrors.nationality = lang === "NL" ? "Nationaliteit is verplicht" : "Nationality is required";
    if (!formData.preferredFunction) newErrors.preferredFunction = lang === "NL" ? "Kies een functie" : "Please select a role";

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
    if (!formData.speaksDutch && !formData.speaksEnglish) {
      newErrors.language = t.noLanguage;
    }
    if (!formData.experience) {
      newErrors.experience = lang === "NL" ? "Selecteer je ervaring" : "Please select your experience";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleStep1Next() {
    if (!validateStep1()) return;

    if (formData.birthDate && calculateAge(formData.birthDate) < 17) {
      setRejectionReason(t.ageTooYoung);
      setStep("rejected");
      return;
    }

    const detectedFlow = getFlow(formData.nationality);
    setFlow(detectedFlow);

    if (detectedFlow === "NON_EU") {
      const fn = formData.preferredFunction;
      if (fn === "horecamedewerker" || fn === "frontoffice") {
        setRejectionReason(COPY.EN.roleNotAvailable);
        setStep("rejected");
        return;
      }
    }

    const cityCheck = formData.city.trim();
    if (cityCheck && !isWithin50km(cityCheck)) {
      setStep("distance_check");
    } else {
      setStep("skills");
    }
  }

  function handleStep2Next() {
    if (!validateStep2()) return;

    if (!formData.speaksDutch && !formData.speaksEnglish) {
      setRejectionReason(t.noLanguage);
      setStep("rejected");
      return;
    }

    const fn = formData.preferredFunction as keyof ExperienceThresholds;
    const thresholds = flow === "NL" ? NL_THRESHOLDS : flow === "EU" ? EU_THRESHOLDS : NON_EU_THRESHOLDS;
    const allowed = thresholds[fn] || [];

    if (allowed.length === 0) {
      setRejectionReason(t.roleNotAvailable);
      setStep("rejected");
      return;
    }

    if (!allowed.includes(formData.experience)) {
      setRejectionReason(t.notEnoughExperience);
      setStep("rejected");
      return;
    }

    if (flow === "NON_EU") {
      setStep("twv");
    } else {
      setStep("cv_schedule");
    }
  }

  function handleTwvNext() {
    if (formData.twvNeeded === "yes" && formData.hasExistingTwv === "yes" && formData.willingToStopTwv === "no") {
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

  async function handleSubmit(skipCv = false) {
    setIsSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
        nationality: formData.nationality,
        city: formData.city,
        language: [
          formData.speaksDutch ? "Nederlands" : "",
          formData.speaksEnglish ? "Engels" : "",
          formData.otherLanguage,
        ].filter(Boolean).join(", "),
        functionType: formData.preferredFunction,
        horecaExperience: EXPERIENCE_MAP[formData.experience] || formData.experience,
        needsTwv: flow === "NON_EU" && formData.twvNeeded === "yes",
        interviewDate: formData.preferredDate || null,
        interviewTime: formData.preferredTime === "morning" ? "10:00" : formData.preferredTime === "afternoon" ? "14:00" : null,
        sourceChannel: "Website aanmeldflow",
        notes: skipCv ? (lang === "NL" ? "CV nog niet geüpload" : "CV not yet uploaded") : (cvFile ? `CV: ${cvFile.name}` : ""),
      };

      await apiRequest("POST", "/api/aanmelden", payload);

      if (cvFile && !skipCv) {
        const fd = new FormData();
        fd.append("cv", cvFile);
        fd.append("email", formData.email);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 text-[200px] sm:text-[350px] font-black text-purple-100/30 select-none leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>X</div>
        <div className="absolute bottom-20 left-10 text-[150px] sm:text-[250px] font-black text-purple-100/20 select-none leading-none rotate-12" style={{ fontFamily: "'Poppins', sans-serif" }}>X</div>
      </div>

      <div className="relative z-10">
        <header className="py-5 sm:py-6 px-5 sm:px-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a href="/landing" className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <span className="bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">EXTRA</span>
            </a>
            <a href="/landing" className="text-sm text-gray-500 hover:text-purple-600 transition-colors font-medium">
              {t.backToHome}
            </a>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
          {step !== "success" && step !== "rejected" && <ProgressBarComponent stepNumber={stepNumber} t={t} />}

          {step === "basics" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/5 border border-gray-100 p-6 sm:p-10 lg:p-12">
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
                <InputFieldComponent label={t.phone} value={formData.phone} onChange={(v) => updateField("phone", v)} type="tel" required placeholder="+31 6 12345678" error={errors.phone} />
                <div className="sm:col-span-2">
                  <InputFieldComponent label={t.email} value={formData.email} onChange={(v) => updateField("email", v)} type="email" required placeholder="jouw@email.nl" error={errors.email} />
                </div>
                <InputFieldComponent label={t.city} value={formData.city} onChange={(v) => updateField("city", v)} placeholder="Amsterdam" error={errors.city} />
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
              </div>

              <div className="mt-8 flex justify-end">
                <Button onClick={handleStep1Next} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-6 rounded-xl text-base shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all">
                  {t.continue} <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === "distance_check" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/5 border border-gray-100 p-6 sm:p-10 lg:p-12 max-w-2xl mx-auto text-center">
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
              <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/5 border border-gray-100 p-6 sm:p-10">
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
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">{t.languageQuestion}</Label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer">
                        <Checkbox checked={formData.speaksDutch} onCheckedChange={(v) => updateField("speaksDutch", !!v)} />
                        <span className="text-sm font-medium text-gray-700">{t.dutch}</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer">
                        <Checkbox checked={formData.speaksEnglish} onCheckedChange={(v) => updateField("speaksEnglish", !!v)} />
                        <span className="text-sm font-medium text-gray-700">{t.english}</span>
                      </label>
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
                        <span className="text-sm font-medium text-gray-500 flex-shrink-0">{t.otherLang}</span>
                        <Input
                          value={formData.otherLanguage}
                          onChange={(e) => updateField("otherLanguage", e.target.value)}
                          className="h-9 rounded-lg border-gray-200 text-sm"
                          placeholder="..."
                        />
                      </div>
                    </div>
                    {errors.language && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.language}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t.experienceQuestion}</Label>
                    <Select value={formData.experience} onValueChange={(v) => updateField("experience", v)}>
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
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/5 border border-gray-100 p-6 sm:p-10 max-w-2xl mx-auto">
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
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/5 border border-gray-100 p-6 sm:p-10 lg:p-12">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.step3Title}</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t.uploadCv}</h3>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">{t.uploadCvDesc}</p>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-purple-400 hover:bg-purple-50/50 ${cvUploaded ? "border-green-400 bg-green-50/50" : "border-gray-300"}`}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" />
                    {cvUploaded && cvFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                        <p className="text-sm font-semibold text-green-700">{cvFile.name}</p>
                        <p className="text-xs text-green-600">{(cvFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-10 h-10 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-700">{t.uploadBtn}</p>
                        <p className="text-xs text-gray-400">{t.acceptedFormats}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t.scheduleTitle}</h3>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">{t.scheduleDesc}</p>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t.preferredDate}</Label>
                      <Input
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => updateField("preferredDate", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="h-12 rounded-xl border-gray-200"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">{t.preferredTime}</Label>
                      <Select value={formData.preferredTime} onValueChange={(v) => updateField("preferredTime", v)}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200">
                          <SelectValue placeholder={lang === "NL" ? "Kies tijdslot" : "Choose time slot"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">{t.morning}</SelectItem>
                          <SelectItem value="afternoon">{t.afternoon}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3">
                <Button onClick={() => setStep(flow === "NON_EU" ? "twv" : "skills")} variant="outline" className="font-bold px-6 py-5 rounded-xl text-base border-gray-300">
                  <ChevronLeft className="w-5 h-5 mr-1" /> {t.back}
                </Button>
                <div className="flex gap-3">
                  {!cvUploaded && (
                    <Button onClick={() => handleSubmit(true)} variant="outline" disabled={isSubmitting} className="font-bold px-6 py-5 rounded-xl text-base border-gray-300">
                      {t.laterBtn}
                    </Button>
                  )}
                  <Button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-5 rounded-xl text-base shadow-lg shadow-purple-500/20">
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
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/5 border border-gray-100 p-8 sm:p-12 lg:p-16 max-w-2xl mx-auto text-center">
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
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/5 border border-gray-100 p-8 sm:p-12 lg:p-16 max-w-2xl mx-auto text-center">
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
