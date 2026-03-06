import { useState, useEffect } from "react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Check, User, Briefcase, Star, Calendar, Tag, Camera, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface IntakeCandidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  postcode?: string;
  nationality?: string;
  birthDate?: string;
  functionType?: string;
  language?: string;
  horecaExperience?: string;
  experienceLevel?: string;
}

const formSchema = z.object({
  interviewer: z.string().min(1, "Selecteer een interviewer"),
  functionType: z.enum(["horecamedewerker", "chef", "housekeeping", "frontoffice"]),

  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  phone: z.string().optional(),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  birthDate: z.string().optional(),
  city: z.string().optional(),
  channel: z.string().optional(),

  languages: z.array(z.string()).default([]),
  needsWorkPermit: z.enum(["ja", "nee"]).optional(),
  nationality: z.string().optional(),
  voertaal: z.enum(["nederlands", "engels"]).optional(),

  otherJob: z.string().optional(),
  experienceTypes: z.array(z.string()).default([]),
  horecaExperience: z.string().optional(),
  canWorkIndependently: z.enum(["ja", "nee"]).optional(),
  canCarry3Plates: z.enum(["ja", "nee"]).optional(),
  isBarista: z.enum(["ja", "nee"]).optional(),
  canShakeCocktails: z.enum(["ja", "nee"]).optional(),
  serviceSkills: z.number().min(1).max(5).optional(),
  barSkills: z.number().min(1).max(5).optional(),
  dinerSkills: z.number().min(1).max(5).optional(),
  isAssistantChef: z.enum(["ja", "nee"]).optional(),
  canWashDishes: z.enum(["ja", "nee"]).optional(),
  isPromoWorker: z.enum(["ja", "nee"]).optional(),

  hkTasks: z.string().optional(),
  hkYearsExperience: z.string().optional(),
  hkLocationTypes: z.array(z.string()).default([]),
  hkHotelStars: z.array(z.string()).default([]),
  hkCompanies: z.string().optional(),
  hkReference: z.string().optional(),

  hasDriversLicense: z.enum(["ja", "nee"]).optional(),
  hasStudentOV: z.enum(["ja", "nee"]).optional(),
  ovType: z.enum(["week", "weekend"]).optional(),
  workClothing: z.array(z.string()).default([]),
  hasCar: z.enum(["ja", "nee"]).optional(),

  availableHours: z.string().optional(),
  preferredDays: z.array(z.string()).default([]),
  preferredTimes: z.array(z.string()).default([]),

  hkBetrouwbaarheid: z.number().min(1).max(5).optional(),
  hkCommunicatie: z.number().min(1).max(5).optional(),
  hkRepresentativiteit: z.number().min(1).max(5).optional(),

  chefKitchenTypes: z.array(z.string()).default([]),
  chefDiplomas: z.array(z.string()).default([]),
  chefYearsAsKok: z.string().optional(),
  chefLeadershipExp: z.string().optional(),
  chefMainKitchen: z.string().optional(),
  chefCompanies: z.string().optional(),
  chefClothing: z.array(z.string()).default([]),
  chefStartDate: z.string().optional(),
  chefProfessioneleUitstraling: z.number().min(1).max(5).optional(),

  assessmentRating: z.string().optional(),
  experienceLevel: z.string().optional(),
  appearance: z.string().optional(),
  attitude: z.string().optional(),
  communicationSkills: z.number().min(1).max(5).optional(),
  overallImpression: z.number().min(1).max(5).optional(),

  salaryScale: z.string().optional(),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const interviewers = ["Eveline", "Isa", "Charlotte", "Max", "Lea"];

const functionTypes = [
  { value: "horecamedewerker", label: "Horecamedewerker" },
  { value: "chef", label: "Chef" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "frontoffice", label: "Front-office" },
];

const sections = [
  { id: "start", title: "Start", icon: User },
  { id: "basic", title: "Basisinformatie", icon: User },
  { id: "background", title: "Achtergrond", icon: Briefcase },
  { id: "experience", title: "Ervaring & Vaardigheden", icon: Star },
  { id: "practical", title: "Praktische zaken", icon: Briefcase },
  { id: "availability", title: "Beschikbaarheid", icon: Calendar },
  { id: "assessment", title: "Beoordeling", icon: Tag },
  { id: "finish", title: "Afronden", icon: Camera },
];

function getRequiredScoreFields(functionType?: string): string[] {
  if (!functionType) return [];
  const common = ["communicationSkills", "overallImpression", "assessmentRating"];
  if (functionType === "horecamedewerker") return [...common, "serviceSkills", "barSkills", "dinerSkills"];
  if (functionType === "housekeeping") return [...common, "hkBetrouwbaarheid", "hkCommunicatie", "hkRepresentativiteit"];
  if (functionType === "chef") return [...common, "chefProfessioneleUitstraling"];
  return common;
}

const scoreFieldLabels: Record<string, string> = {
  serviceSkills: "Bediening vaardigheden",
  barSkills: "Bar vaardigheden",
  dinerSkills: "Diner vaardigheden",
  hkBetrouwbaarheid: "Betrouwbaarheid en werkhouding",
  hkCommunicatie: "Communicatieve vaardigheden (HK)",
  hkRepresentativiteit: "Representativiteit & houding",
  chefProfessioneleUitstraling: "Professionele uitstraling (chef)",
  communicationSkills: "Communicatieve vaardigheden",
  overallImpression: "Algehele indruk",
  assessmentRating: "Beoordeling",
};

export default function SollicitatieFormulier() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [intakeCandidates, setIntakeCandidates] = useState<IntakeCandidate[]>([]);
  const [intakeCandidatesLoading, setIntakeCandidatesLoading] = useState(false);
  const [selectedIntakeId, setSelectedIntakeId] = useState<number | null>(null);
  const [intakeCandidateSearch, setIntakeCandidateSearch] = useState('');
  const [scoreErrors, setScoreErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      languages: [],
      experienceTypes: [],
      workClothing: [],
      preferredDays: [],
      preferredTimes: [],
      hkLocationTypes: [],
      hkHotelStars: [],
      chefKitchenTypes: [],
      chefDiplomas: [],
      chefClothing: [],
    },
  });

  useEffect(() => {
    document.title = 'Sollicitatieformulier – EXTRA';
    setIsSubmitted(false);
    setCurrentSection(0);
  }, []);

  const { register, watch, setValue, handleSubmit, formState: { errors } } = form;
  const watchedFunctionType = watch("functionType");

  useEffect(() => {
    if (!watchedFunctionType) return;
    setIntakeCandidatesLoading(true);
    setSelectedIntakeId(null);
    setIntakeCandidateSearch('');
    fetch(`/api/intake/candidates?functionType=${encodeURIComponent(watchedFunctionType)}`)
      .then(r => r.ok ? r.json() : { candidates: [] })
      .then(json => setIntakeCandidates(json.candidates || []))
      .catch(() => setIntakeCandidates([]))
      .finally(() => setIntakeCandidatesLoading(false));
  }, [watchedFunctionType]);

  const hkSectionTitles = ["Start", "Basisinformatie", "Achtergrond", "Housekeeping ervaring", "Beschikbaarheid & vervoer", "Tags", "Beoordeling", "Afronden"];
  const chefSectionTitles = ["Start", "Basisinformatie", "Achtergrond", "Hard skills en ervaring", "Beschikbaarheid & vervoer", "Kleding", "Tags & Beoordeling", "Afronden"];
  const getSectionTitle = (idx: number) => {
    if (watchedFunctionType === "housekeeping") return hkSectionTitles[idx] ?? sections[idx].title;
    if (watchedFunctionType === "chef") return chefSectionTitles[idx] ?? sections[idx].title;
    return sections[idx].title;
  };

  const section3ScoreFields: Record<string, string[]> = {
    horecamedewerker: ["serviceSkills", "barSkills", "dinerSkills"],
    housekeeping: ["hkBetrouwbaarheid", "hkCommunicatie", "hkRepresentativiteit"],
    chef: [],
  };
  const section6ScoreFields = ["communicationSkills", "overallImpression", "assessmentRating", "chefProfessioneleUitstraling"];

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      const functionType = watch("functionType") as string | undefined;

      if (currentSection === 3 && functionType) {
        const fieldsToCheck = section3ScoreFields[functionType] || [];
        const missing = fieldsToCheck.filter(f => {
          const val = (watch as any)(f);
          return val === undefined || val === null || val === "" || val === 0;
        });
        if (missing.length > 0) {
          const labels = missing.map(f => scoreFieldLabels[f] || f);
          setScoreErrors(labels);
          toast({
            title: "Vul alle verplichte scores in",
            description: `Ontbrekend: ${labels.join(", ")}`,
            variant: "destructive",
          });
          window.scrollTo(0, 0);
          return;
        }
      }

      if (currentSection === 6) {
        const fieldsToCheck = section6ScoreFields.filter(f => {
          if (f === "chefProfessioneleUitstraling" && functionType !== "chef") return false;
          return true;
        });
        const missing = fieldsToCheck.filter(f => {
          const val = (watch as any)(f);
          return val === undefined || val === null || val === "" || val === 0;
        });
        if (missing.length > 0) {
          const labels = missing.map(f => scoreFieldLabels[f] || f);
          setScoreErrors(labels);
          toast({
            title: "Vul alle verplichte scores in",
            description: `Ontbrekend: ${labels.join(", ")}`,
            variant: "destructive",
          });
          window.scrollTo(0, 0);
          return;
        }
      }

      setScoreErrors([]);
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setScoreErrors([]);
      window.scrollTo(0, 0);
    }
  };

  function applyIntakeCandidate(candidate: IntakeCandidate) {
    setValue("firstName", candidate.firstName || '');
    setValue("lastName", candidate.lastName || '');
    setValue("email", candidate.email || '');
    setValue("phone", candidate.phone || '');
    setValue("city", candidate.city || '');
    setValue("birthDate", candidate.birthDate || '');
    if (candidate.nationality) setValue("nationality", candidate.nationality);
    if (candidate.horecaExperience) setValue("horecaExperience", candidate.horecaExperience);
    setSelectedIntakeId(candidate.id);
  }

  const onSubmit = async (data: FormData) => {
    if (currentSection !== sections.length - 1) {
      handleNext();
      return;
    }

    const requiredFields = getRequiredScoreFields(data.functionType);
    const missing = requiredFields.filter(f => {
      const val = (data as any)[f];
      return val === undefined || val === null || val === "";
    });

    if (missing.length > 0) {
      const labels = missing.map(f => scoreFieldLabels[f] || f);
      setScoreErrors(labels);
      toast({
        title: "Vul alle verplichte scores in",
        description: `Ontbrekend: ${labels.join(", ")}`,
        variant: "destructive",
      });
      const sec3Fields = ["serviceSkills", "barSkills", "dinerSkills", "hkBetrouwbaarheid", "hkCommunicatie", "hkRepresentativiteit"];
      const hasSec3Missing = missing.some(f => sec3Fields.includes(f));
      setCurrentSection(hasSec3Missing ? 3 : 6);
      window.scrollTo(0, 0);
      return;
    }

    setScoreErrors([]);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/sollicitatie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, linkedCandidateId: selectedIntakeId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Fout bij versturen");
      }

      queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
      setIsSubmitted(true);
      toast({
        title: "Sollicitatie opgeslagen!",
        description: "De gegevens zijn succesvol opgeslagen.",
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Er ging iets mis bij het opslaan. Probeer opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArrayValue = (field: keyof FormData, value: string) => {
    const currentValues = watch(field) as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    setValue(field, newValues as any);
  };

  const StarRating = ({
    name,
    value,
    onChange,
    hasError,
  }: {
    name: string;
    value?: number;
    onChange: (val: number) => void;
    hasError?: boolean;
  }) => (
    <div className={`flex gap-3 justify-center py-3 px-4 rounded-2xl ${hasError ? "bg-red-50 border-2 border-red-300" : "bg-gray-50 border-2 border-gray-100"}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-5xl leading-none transition-all active:scale-90 select-none touch-manipulation w-16 h-16 flex items-center justify-center rounded-xl ${
            value && star <= value
              ? "text-yellow-400 bg-yellow-50"
              : "text-gray-300 hover:text-yellow-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );

  const RadioCard = ({
    value,
    currentValue,
    onSelect,
    children,
    id,
  }: {
    value: string;
    currentValue?: string;
    onSelect: (v: string) => void;
    children: React.ReactNode;
    id: string;
  }) => (
    <div
      onClick={() => onSelect(value)}
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 cursor-pointer transition-all touch-manipulation min-h-[56px] ${
        currentValue === value
          ? "border-purple-500 bg-purple-50"
          : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30"
      }`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
        currentValue === value ? "border-purple-600" : "border-gray-300"
      }`}>
        {currentValue === value && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
      </div>
      <Label htmlFor={id} className="cursor-pointer text-base leading-snug flex-1">{children}</Label>
    </div>
  );

  const CheckCard = ({
    checked,
    onToggle,
    children,
    id,
  }: {
    checked: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    id: string;
  }) => (
    <div
      onClick={onToggle}
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 cursor-pointer transition-all touch-manipulation min-h-[56px] ${
        checked
          ? "border-purple-500 bg-purple-50"
          : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30"
      }`}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onToggle}
        className="w-5 h-5 flex-shrink-0"
      />
      <Label htmlFor={id} className="cursor-pointer text-base leading-snug flex-1">{children}</Label>
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="normal-cursor min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Opgeslagen!</h1>
          <p className="text-gray-600 mb-8 text-lg">De sollicitatie is succesvol toegevoegd aan het systeem.</p>
          <Button
            onClick={() => {
              setIsSubmitted(false);
              setCurrentSection(0);
              setIntakeCandidates([]);
              setSelectedIntakeId(null);
              setIntakeCandidateSearch('');
              setScoreErrors([]);
              form.reset();
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 h-14 text-lg rounded-xl"
          >
            Nieuwe Sollicitatie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="normal-cursor min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      {/* Header */}
      <div className="bg-purple-700 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={extraLogoWit} alt="EXTRA" className="h-8 w-auto" />
            <div className="w-px h-6 bg-white/30" />
            <span className="text-base font-semibold tracking-wide">Sollicitatieformulier</span>
          </div>
          <span className="text-purple-200 text-sm font-medium">
            {currentSection + 1} / {sections.length}
          </span>
        </div>

        {/* Step dots */}
        <div className="max-w-5xl mx-auto px-6 pb-3 flex items-center gap-2">
          {sections.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < currentSection ? "bg-green-400" :
                i === currentSection ? "bg-white" :
                "bg-white/20"
              }`} />
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="max-w-5xl mx-auto px-4 py-6">

        {/* Section card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

          {/* Section title bar */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-5">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = sections[currentSection].icon;
                return <Icon className="w-6 h-6 opacity-80" />;
              })()}
              <h2 className="text-xl font-bold">{getSectionTitle(currentSection)}</h2>
            </div>
          </div>

          {/* Score errors banner */}
          {scoreErrors.length > 0 && (
            <div className="mx-6 mt-6 flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 text-sm">Vul alle verplichte scorevelden in:</p>
                <ul className="mt-1 space-y-0.5">
                  {scoreErrors.map(e => (
                    <li key={e} className="text-sm text-red-600">• {e}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="p-8 space-y-8">

            {/* ═══ SECTIE 0: START ═══ */}
            {currentSection === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-800">Gesprek afgenomen door *</Label>
                  <div className="space-y-2.5">
                    {interviewers.map((name) => (
                      <RadioCard
                        key={name}
                        value={name}
                        currentValue={watch("interviewer")}
                        onSelect={(v) => setValue("interviewer", v)}
                        id={`interviewer-${name}`}
                      >
                        {name}
                      </RadioCard>
                    ))}
                  </div>
                  {errors.interviewer && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />{errors.interviewer.message}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-800">Voor welke functie? *</Label>
                  <div className="space-y-2.5">
                    {functionTypes.map((type) => (
                      <RadioCard
                        key={type.value}
                        value={type.value}
                        currentValue={watch("functionType")}
                        onSelect={(v) => setValue("functionType", v as any)}
                        id={`functype-${type.value}`}
                      >
                        {type.label}
                      </RadioCard>
                    ))}
                  </div>
                  {errors.functionType && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />{errors.functionType.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ═══ SECTIE 1: BASISINFORMATIE ═══ */}
            {currentSection === 1 && (
              <>
                {intakeCandidatesLoading && (
                  <div className="flex items-center gap-3 text-sm text-purple-600 bg-purple-50 border border-purple-100 rounded-2xl px-5 py-4">
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    Kandidaten ophalen…
                  </div>
                )}

                {!intakeCandidatesLoading && intakeCandidates.length > 0 && (
                  <div className="rounded-2xl border-2 border-purple-100 bg-white overflow-hidden shadow-sm">
                    <div className="px-5 pt-5 pb-4 border-b border-gray-100 bg-purple-50/50">
                      <p className="text-sm font-bold text-gray-800 mb-3">Welke kandidaat zit nu bij je aan tafel?</p>
                      <div className="relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
                        <input
                          value={intakeCandidateSearch}
                          onChange={e => setIntakeCandidateSearch(e.target.value)}
                          placeholder="Zoek op naam…"
                          className="w-full pl-11 pr-4 py-3 text-base rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all"
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                      {intakeCandidates
                        .filter(c => {
                          const q = intakeCandidateSearch.toLowerCase();
                          return q === '' ||
                            `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
                            (c.email || '').toLowerCase().includes(q);
                        })
                        .map(c => {
                          const initials = `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase();
                          const isSelected = selectedIntakeId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => applyIntakeCandidate(c)}
                              className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-colors ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-base font-semibold truncate ${isSelected ? 'text-purple-900' : 'text-gray-800'}`}>
                                  {c.firstName} {c.lastName}
                                </p>
                                <p className="text-sm text-gray-400 truncate">{c.city || '—'} · {c.email}</p>
                              </div>
                              {isSelected && (
                                <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                    </div>
                    {selectedIntakeId && (
                      <div className="px-5 py-3 border-t border-gray-100 bg-green-50">
                        <p className="text-sm text-green-700 font-semibold">✓ Gegevens vooraf ingevuld — je kunt ze nog aanpassen</p>
                      </div>
                    )}
                  </div>
                )}

                {!intakeCandidatesLoading && intakeCandidates.length === 0 && watchedFunctionType && (
                  <div className="rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-500 bg-gray-50">
                    Geen aangemelde kandidaten voor deze functie — vul de gegevens hieronder handmatig in.
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Voornaam *</Label>
                    <Input {...register("firstName")} placeholder="Voornaam" className="h-14 text-base rounded-xl" />
                    {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Achternaam *</Label>
                    <Input {...register("lastName")} placeholder="Achternaam" className="h-14 text-base rounded-xl" />
                    {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Telefoonnummer</Label>
                    <Input {...register("phone")} placeholder="06-12345678" type="tel" className="h-14 text-base rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">E-mailadres</Label>
                    <Input {...register("email")} placeholder="email@voorbeeld.nl" type="email" className="h-14 text-base rounded-xl" />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Geboortedatum</Label>
                    <Input {...register("birthDate")} type="date" className="h-14 text-base rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Woonplaats</Label>
                    <Input {...register("city")} placeholder="Amsterdam" className="h-14 text-base rounded-xl" />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-base font-medium">Kanaal (hoe heeft de sollicitant ons gevonden?)</Label>
                    <Input {...register("channel")} placeholder="Indeed, Instagram, via via..." className="h-14 text-base rounded-xl" />
                  </div>
                </div>
              </>
            )}

            {/* ═══ SECTIE 2: ACHTERGROND ═══ */}
            {currentSection === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {(watchedFunctionType === "housekeeping" || watchedFunctionType === "chef") ? (
                  <>
                    <div className="space-y-4">
                      <Label className="text-base font-semibold text-gray-800">Voertaal van de sollicitant</Label>
                      <div className="space-y-2.5">
                        {[{ value: "nederlands", label: "Nederlands" }, { value: "engels", label: "Engels" }].map(opt => (
                          <RadioCard key={opt.value} value={opt.value} currentValue={watch("voertaal")} onSelect={(v) => setValue("voertaal", v as any)} id={`voertaal-${opt.value}`}>
                            {opt.label}
                          </RadioCard>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold text-gray-800">Tewerkstellingsvergunning nodig?</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[{ value: "ja", label: "Ja" }, { value: "nee", label: "Nee" }].map(opt => (
                          <RadioCard key={opt.value} value={opt.value} currentValue={watch("needsWorkPermit")} onSelect={(v) => setValue("needsWorkPermit", v as any)} id={`permit-${opt.value}`}>
                            {opt.label}
                          </RadioCard>
                        ))}
                      </div>
                      <div className="space-y-2 pt-2">
                        <Label className="text-base font-medium">Indien TWV: land van herkomst / nationaliteit</Label>
                        <Input {...register("nationality")} placeholder="Jouw antwoord" className="h-14 text-base rounded-xl" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <Label className="text-base font-semibold text-gray-800">Taalvaardigheid</Label>
                      <div className="space-y-2.5">
                        {["Nederlands", "Engels", "Duits", "Frans", "Spaans"].map((lang) => (
                          <CheckCard
                            key={lang}
                            id={`lang-${lang}`}
                            checked={(watch("languages") || []).includes(lang)}
                            onToggle={() => toggleArrayValue("languages", lang)}
                          >
                            {lang}
                          </CheckCard>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold text-gray-800">Tewerkstellingsvergunning nodig?</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[{ value: "ja", label: "Ja" }, { value: "nee", label: "Nee" }].map(opt => (
                          <RadioCard key={opt.value} value={opt.value} currentValue={watch("needsWorkPermit")} onSelect={(v) => setValue("needsWorkPermit", v as any)} id={`permit2-${opt.value}`}>
                            {opt.label}
                          </RadioCard>
                        ))}
                      </div>
                      <div className="space-y-2 pt-2">
                        <Label className="text-base font-medium">Nationaliteit</Label>
                        <Input {...register("nationality")} placeholder="Nederlands" className="h-14 text-base rounded-xl" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ═══ SECTIE 3: ERVARING (Housekeeping) ═══ */}
            {currentSection === 3 && watchedFunctionType === "housekeeping" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-gray-800">Welke taken heb je eerder gedaan?</Label>
                    <Textarea {...register("hkTasks")} placeholder="Jouw antwoord" className="min-h-[100px] text-base rounded-xl" />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Jaren ervaring in housekeeping *</Label>
                    <div className="space-y-2.5">
                      {["1-3 jaar ervaring", "3-5 jaar ervaring", "5-10 jaar ervaring", "10> jaar ervaring"].map((opt) => (
                        <RadioCard key={opt} value={opt} currentValue={watch("hkYearsExperience")} onSelect={(v) => setValue("hkYearsExperience", v)} id={`hkyears-${opt}`}>
                          {opt}
                        </RadioCard>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Type locatie</Label>
                    <div className="space-y-2">
                      {["Hotel", "Hostel", "Ziekenhuis", "Kantoor", "Verzorgingstehuis", "Particulier/ bij mensen thuis", "Anders"].map((loc) => (
                        <CheckCard key={loc} id={`hkloc-${loc}`} checked={(watch("hkLocationTypes") || []).includes(loc)} onToggle={() => toggleArrayValue("hkLocationTypes", loc)}>
                          {loc}
                        </CheckCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Hoeveel sterren hotels?</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {["1 Ster", "2 Sterren", "3 Sterren", "4 Sterren", "5 Sterren"].map((star) => (
                        <CheckCard key={star} id={`hkstar-${star}`} checked={(watch("hkHotelStars") || []).includes(star)} onToggle={() => toggleArrayValue("hkHotelStars", star)}>
                          {star}
                        </CheckCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium">Bij welke bedrijven gewerkt?</Label>
                    <Textarea {...register("hkCompanies")} placeholder="Jouw antwoord" className="min-h-[80px] text-base rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium">Referentie opvragen bij?</Label>
                    <Textarea {...register("hkReference")} placeholder="Jouw antwoord" className="min-h-[80px] text-base rounded-xl" />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SECTIE 3: ERVARING (Chef) ═══ */}
            {currentSection === 3 && watchedFunctionType === "chef" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Soorten keuken met ervaring</Label>
                    <div className="space-y-2.5">
                      {["Ontbijt", "Lunch", "Fine dining", "Banqueting", "Mise-en-place"].map((keuken) => (
                        <CheckCard key={keuken} id={`keuken-${keuken}`} checked={(watch("chefKitchenTypes") || []).includes(keuken)} onToggle={() => toggleArrayValue("chefKitchenTypes", keuken)}>
                          {keuken}
                        </CheckCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Diploma's of certificaten</Label>
                    <div className="space-y-2.5">
                      {["Koksdiploma", "HACCP", "SVH"].map((dip) => (
                        <CheckCard key={dip} id={`diploma-${dip}`} checked={(watch("chefDiplomas") || []).includes(dip)} onToggle={() => toggleArrayValue("chefDiplomas", dip)}>
                          {dip}
                        </CheckCard>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Jaren ervaring als kok *</Label>
                    <div className="space-y-2.5">
                      {["1-3 jaar ervaring", "3-5 jaar ervaring", "5-10 jaar ervaring", "10> jaar ervaring"].map((opt) => (
                        <RadioCard key={opt} value={opt} currentValue={watch("chefYearsAsKok")} onSelect={(v) => setValue("chefYearsAsKok", v)} id={`chefyears-${opt}`}>
                          {opt}
                        </RadioCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Leidinggevende ervaring</Label>
                    <div className="space-y-2.5">
                      {["1-2 jaar ervaring", "3-5 jaar ervaring", "5> jaar ervaring", "Geen"].map((opt) => (
                        <RadioCard key={opt} value={opt} currentValue={watch("chefLeadershipExp")} onSelect={(v) => setValue("chefLeadershipExp", v)} id={`chefleider-${opt}`}>
                          {opt}
                        </RadioCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium">Meeste ervaring in welke keuken?</Label>
                    <Input {...register("chefMainKitchen")} placeholder="Jouw antwoord" className="h-14 text-base rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium">Bij welke bedrijven gewerkt?</Label>
                    <Textarea {...register("chefCompanies")} placeholder="Jouw antwoord" className="min-h-[80px] text-base rounded-xl" />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SECTIE 3: ERVARING (Horeca / Front-office) ═══ */}
            {currentSection === 3 && watchedFunctionType !== "housekeeping" && watchedFunctionType !== "chef" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-gray-800">Andere bijbaan?</Label>
                    <Input {...register("otherJob")} placeholder="Zo ja, vul hieronder de baan in" className="h-14 text-base rounded-xl" />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Type ervaring</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {["Festival", "Fine dining", "Hotel", "Restaurant", "Café/bar", "High-end events"].map((type) => (
                        <CheckCard key={type} id={`exp-${type}`} checked={(watch("experienceTypes") || []).includes(type)} onToggle={() => toggleArrayValue("experienceTypes", type)}>
                          {type}
                        </CheckCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Horeca ervaring *</Label>
                    <div className="space-y-2">
                      {["Geen ervaring", "<6 maanden", "6-12 maanden", "1-2 jaar", "2-3 jaar", "3-5 jaar", "5+ jaar"].map((exp) => (
                        <RadioCard key={exp} value={exp} currentValue={watch("horecaExperience")} onSelect={(v) => setValue("horecaExperience", v)} id={`horeca-${exp}`}>
                          {exp}
                        </RadioCard>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {watchedFunctionType === "horecamedewerker" && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-800">Zelfstandig een dienst draaien? *</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                            <RadioCard key={o.v} value={o.v} currentValue={watch("canWorkIndependently")} onSelect={(v) => setValue("canWorkIndependently", v as any)} id={`independent-${o.v}`}>{o.l}</RadioCard>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-800">3 borden lopen *</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                            <RadioCard key={o.v} value={o.v} currentValue={watch("canCarry3Plates")} onSelect={(v) => setValue("canCarry3Plates", v as any)} id={`plates-${o.v}`}>{o.l}</RadioCard>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-800">Barista</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                            <RadioCard key={o.v} value={o.v} currentValue={watch("isBarista")} onSelect={(v) => setValue("isBarista", v as any)} id={`barista-${o.v}`}>{o.l}</RadioCard>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-800">Cocktailshaker</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                            <RadioCard key={o.v} value={o.v} currentValue={watch("canShakeCocktails")} onSelect={(v) => setValue("canShakeCocktails", v as any)} id={`cocktail-${o.v}`}>{o.l}</RadioCard>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-800">Bediening vaardigheden *</Label>
                        <StarRating name="serviceSkills" value={watch("serviceSkills")} onChange={(val) => setValue("serviceSkills", val)} hasError={scoreErrors.includes("Bediening vaardigheden")} />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-800">Bar vaardigheden *</Label>
                        <StarRating name="barSkills" value={watch("barSkills")} onChange={(val) => setValue("barSkills", val)} hasError={scoreErrors.includes("Bar vaardigheden")} />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-800">Diner vaardigheden *</Label>
                        <StarRating name="dinerSkills" value={watch("dinerSkills")} onChange={(val) => setValue("dinerSkills", val)} hasError={scoreErrors.includes("Diner vaardigheden")} />
                      </div>
                    </>
                  )}

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Assistent chef</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                        <RadioCard key={o.v} value={o.v} currentValue={watch("isAssistantChef")} onSelect={(v) => setValue("isAssistantChef", v as any)} id={`asschef-${o.v}`}>{o.l}</RadioCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Afwas</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                        <RadioCard key={o.v} value={o.v} currentValue={watch("canWashDishes")} onSelect={(v) => setValue("canWashDishes", v as any)} id={`dishes-${o.v}`}>{o.l}</RadioCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-800">Promotiemedewerker</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                        <RadioCard key={o.v} value={o.v} currentValue={watch("isPromoWorker")} onSelect={(v) => setValue("isPromoWorker", v as any)} id={`promo-${o.v}`}>{o.l}</RadioCard>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SECTIE 4: PRAKTISCH (Housekeeping) ═══ */}
            {currentSection === 4 && watchedFunctionType === "housekeeping" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Beschikbaarheid per week (in dagen)</Label>
                    <Input {...register("availableHours")} placeholder="Jouw antwoord" className="h-14 text-base rounded-xl" />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Voorkeur werkdagen</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag", "N.v.t."].map((day) => (
                        <CheckCard key={day} id={`hkday-${day}`} checked={(watch("preferredDays") || []).includes(day)} onToggle={() => toggleArrayValue("preferredDays", day)}>
                          {day}
                        </CheckCard>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Voorkeur moment van de dag</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {["Ochtend", "Middag", "Avond", "N.v.t."].map((time) => (
                        <CheckCard key={time} id={`hktime-${time}`} checked={(watch("preferredTimes") || []).includes(time)} onToggle={() => toggleArrayValue("preferredTimes", time)}>
                          {time}
                        </CheckCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Heb je een auto?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                        <RadioCard key={o.v} value={o.v} currentValue={watch("hasCar")} onSelect={(v) => setValue("hasCar", v as any)} id={`hkcar-${o.v}`}>{o.l}</RadioCard>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SECTIE 4: PRAKTISCH (Chef) ═══ */}
            {currentSection === 4 && watchedFunctionType === "chef" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Beschikbaarheid per week (in dagen)</Label>
                    <Input {...register("availableHours")} placeholder="Jouw antwoord" className="h-14 text-base rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Vanaf wanneer kan je starten? *</Label>
                    <Input {...register("chefStartDate")} type="date" className="h-14 text-base rounded-xl" />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Voorkeur werkdagen</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag", "N.v.t."].map((day) => (
                        <CheckCard key={day} id={`cday-${day}`} checked={(watch("preferredDays") || []).includes(day)} onToggle={() => toggleArrayValue("preferredDays", day)}>
                          {day}
                        </CheckCard>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Voorkeur moment van de dag</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {["Ochtend", "Middag", "Avond", "N.v.t."].map((time) => (
                        <CheckCard key={time} id={`ctime-${time}`} checked={(watch("preferredTimes") || []).includes(time)} onToggle={() => toggleArrayValue("preferredTimes", time)}>
                          {time}
                        </CheckCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Heb je een auto?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                        <RadioCard key={o.v} value={o.v} currentValue={watch("hasCar")} onSelect={(v) => setValue("hasCar", v as any)} id={`chefcar-${o.v}`}>{o.l}</RadioCard>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SECTIE 4: PRAKTISCH (Horeca / Front-office) ═══ */}
            {currentSection === 4 && watchedFunctionType !== "housekeeping" && watchedFunctionType !== "chef" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Rijbewijs</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                        <RadioCard key={o.v} value={o.v} currentValue={watch("hasDriversLicense")} onSelect={(v) => setValue("hasDriversLicense", v as any)} id={`license-${o.v}`}>{o.l}</RadioCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Studenten OV-Chipkaart</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ v: "ja", l: "Ja" }, { v: "nee", l: "Nee" }].map(o => (
                        <RadioCard key={o.v} value={o.v} currentValue={watch("hasStudentOV")} onSelect={(v) => setValue("hasStudentOV", v as any)} id={`ov-${o.v}`}>{o.l}</RadioCard>
                      ))}
                    </div>
                  </div>

                  {watch("hasStudentOV") === "ja" && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Week of weekend OV-Chipkaart?</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[{ v: "week", l: "Week" }, { v: "weekend", l: "Weekend" }].map(o => (
                          <RadioCard key={o.v} value={o.v} currentValue={watch("ovType")} onSelect={(v) => setValue("ovType", v as any)} id={`ovtype-${o.v}`}>{o.l}</RadioCard>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Werkkleding</Label>
                    <div className="space-y-2.5">
                      {["Wit hemd", "Zwarte pantalon", "Nette zwarte schoenen"].map((item) => (
                        <CheckCard key={item} id={`clothing-${item}`} checked={(watch("workClothing") || []).includes(item)} onToggle={() => toggleArrayValue("workClothing", item)}>
                          {item}
                        </CheckCard>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SECTIE 5: BESCHIKBAARHEID (Housekeeping: Tags) ═══ */}
            {currentSection === 5 && watchedFunctionType === "housekeeping" && (
              <>
                <p className="text-sm text-gray-500 bg-purple-50 border border-purple-100 rounded-xl px-5 py-3">
                  Selecteer per categorie welke score van toepassing is op basis van het gesprek.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {[
                    {
                      field: "hkBetrouwbaarheid" as const,
                      label: "Betrouwbaarheid en werkhouding *",
                      desc: "Komt degene over als iemand die afspraken nakomt en gemotiveerd is?",
                      low: "Onbetrouwbaar, weinig motivatie",
                      high: "Zeer betrouwbaar en gemotiveerd",
                    },
                    {
                      field: "hkCommunicatie" as const,
                      label: "Communicatieve vaardigheden *",
                      desc: "Kan de kandidaat voldoende NL of EN om instructies te begrijpen?",
                      low: "Communicatie lastig",
                      high: "Communiceert helder",
                    },
                    {
                      field: "hkRepresentativiteit" as const,
                      label: "Representativiteit & houding *",
                      desc: "Komt de kandidaat verzorgd en geschikt over voor een hotelomgeving?",
                      low: "Onverzorgd of ongepaste houding",
                      high: "Zeer representatief",
                    },
                  ].map(({ field, label, desc, low, high }) => (
                    <div key={field} className="bg-gray-50 rounded-2xl p-5 space-y-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-base">{label}</p>
                        <p className="text-sm text-gray-500 mt-1">{desc}</p>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>{low}</span>
                        <span>{high}</span>
                      </div>
                      <StarRating
                        name={field}
                        value={watch(field)}
                        onChange={(val) => setValue(field, val)}
                        hasError={scoreErrors.includes(scoreFieldLabels[field])}
                      />
                      {watch(field) && (
                        <p className="text-center text-sm font-bold text-purple-700">{watch(field)} / 5</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ═══ SECTIE 5: KLEDING (Chef) ═══ */}
            {currentSection === 5 && watchedFunctionType === "chef" && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Beschikt de chef over de juiste kleding?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["Koksbroek", "Koksbuis", "Veiligheidsschoenen", "Messenset"].map((item) => (
                    <CheckCard key={item} id={`chefcloth-${item}`} checked={(watch("chefClothing") || []).includes(item)} onToggle={() => toggleArrayValue("chefClothing", item)}>
                      {item}
                    </CheckCard>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ SECTIE 5: BESCHIKBAARHEID (Horeca / Front-office) ═══ */}
            {currentSection === 5 && watchedFunctionType !== "housekeeping" && watchedFunctionType !== "chef" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Beschikbaarheid per week (in uren)</Label>
                    <Input {...register("availableHours")} placeholder="bijv. 16-24 uur" className="h-14 text-base rounded-xl" />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Voorkeur werkdagen</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag", "N.v.t."].map((day) => (
                        <CheckCard key={day} id={`day-${day}`} checked={(watch("preferredDays") || []).includes(day)} onToggle={() => toggleArrayValue("preferredDays", day)}>
                          {day}
                        </CheckCard>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Voorkeur moment van de dag</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {["Ochtend", "Middag", "Avond", "N.v.t."].map((time) => (
                        <CheckCard key={time} id={`time-${time}`} checked={(watch("preferredTimes") || []).includes(time)} onToggle={() => toggleArrayValue("preferredTimes", time)}>
                          {time}
                        </CheckCard>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SECTIE 6: BEOORDELING ═══ */}
            {currentSection === 6 && (
              <div className="space-y-8">
                {watchedFunctionType === "chef" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                      <p className="font-semibold text-gray-900">Professionele uitstraling *</p>
                      <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>❌ Onverzorgd</span>
                        <span>⭐ Zeer representatief</span>
                      </div>
                      <StarRating name="chefProfessioneleUitstraling" value={watch("chefProfessioneleUitstraling")} onChange={(val) => setValue("chefProfessioneleUitstraling", val)} hasError={scoreErrors.includes("Professionele uitstraling (chef)")} />
                      {watch("chefProfessioneleUitstraling") && <p className="text-center text-sm font-bold text-purple-700">{watch("chefProfessioneleUitstraling")} / 5</p>}
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                      <p className="font-semibold text-gray-900">Communicatieve vaardigheden *</p>
                      <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>❌ Gesloten</span>
                        <span>⭐ Super vlot</span>
                      </div>
                      <StarRating name="communicationSkills" value={watch("communicationSkills")} onChange={(val) => setValue("communicationSkills", val)} hasError={scoreErrors.includes("Communicatieve vaardigheden")} />
                      {watch("communicationSkills") && <p className="text-center text-sm font-bold text-purple-700">{watch("communicationSkills")} / 5</p>}
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                      <p className="font-semibold text-gray-900">Algehele indruk *</p>
                      <StarRating name="overallImpression" value={watch("overallImpression")} onChange={(val) => setValue("overallImpression", val)} hasError={scoreErrors.includes("Algehele indruk")} />
                      {watch("overallImpression") && <p className="text-center text-sm font-bold text-purple-700">{watch("overallImpression")} / 5</p>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Beoordeling *</Label>
                    <div className="space-y-2.5">
                      {[
                        { value: "topper", label: "Topper", emoji: "✨" },
                        { value: "goede_indruk", label: "Goede indruk", emoji: "✅" },
                        { value: "middelmatig", label: "Middelmatig", emoji: "🚩" },
                      ].map((option) => (
                        <RadioCard key={option.value} value={option.value} currentValue={watch("assessmentRating")} onSelect={(v) => setValue("assessmentRating", v)} id={`rating-${option.value}`}>
                          {option.emoji} {option.label}
                        </RadioCard>
                      ))}
                    </div>
                    {scoreErrors.includes("Beoordeling") && (
                      <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Selecteer een beoordeling</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Ervaring</Label>
                    <div className="space-y-2.5">
                      {[
                        { value: "veel", label: "Veel ervaring", emoji: "🏆" },
                        { value: "beperkt", label: "Beperkte ervaring", emoji: "🤔" },
                        { value: "geen", label: "Geen ervaring", emoji: "🆕" },
                      ].map((option) => (
                        <RadioCard key={option.value} value={option.value} currentValue={watch("experienceLevel")} onSelect={(v) => setValue("experienceLevel", v)} id={`explevel-${option.value}`}>
                          {option.emoji} {option.label}
                        </RadioCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Uiterlijke verzorging</Label>
                    <div className="space-y-2.5">
                      {[
                        { value: "verzorgd", label: "Verzorgd (hygiënisch, nette kleding)", emoji: "💇" },
                        { value: "onverzorgd", label: "Onverzorgd", emoji: "😬" },
                      ].map((option) => (
                        <RadioCard key={option.value} value={option.value} currentValue={watch("appearance")} onSelect={(v) => setValue("appearance", v)} id={`appear-${option.value}`}>
                          {option.emoji} {option.label}
                        </RadioCard>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Houding</Label>
                    <div className="space-y-2.5">
                      {[
                        { value: "super_enthousiast", label: "Super enthousiast", emoji: "🤩" },
                        { value: "spontaan", label: "Spontaan", emoji: "🖐" },
                        { value: "verlegen", label: "Verlegen", emoji: "😊" },
                        { value: "ongeinteresseerd", label: "Ongeïnteresseerd", emoji: "😐" },
                      ].map((option) => (
                        <RadioCard key={option.value} value={option.value} currentValue={watch("attitude")} onSelect={(v) => setValue("attitude", v)} id={`attitude-${option.value}`}>
                          {option.emoji} {option.label}
                        </RadioCard>
                      ))}
                    </div>
                  </div>
                </div>

                {watchedFunctionType !== "chef" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                      <p className="font-semibold text-gray-900">Communicatieve vaardigheden *</p>
                      <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>❌ Gesloten</span>
                        <span>⭐ Super vlot</span>
                      </div>
                      <StarRating name="communicationSkills" value={watch("communicationSkills")} onChange={(val) => setValue("communicationSkills", val)} hasError={scoreErrors.includes("Communicatieve vaardigheden")} />
                      {watch("communicationSkills") && <p className="text-center text-sm font-bold text-purple-700">{watch("communicationSkills")} / 5</p>}
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                      <p className="font-semibold text-gray-900">Algehele indruk *</p>
                      <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>❌ Onverzorgd en ongeïnteresseerd</span>
                        <span>⭐ Super enthousiast en representatief</span>
                      </div>
                      <StarRating name="overallImpression" value={watch("overallImpression")} onChange={(val) => setValue("overallImpression", val)} hasError={scoreErrors.includes("Algehele indruk")} />
                      {watch("overallImpression") && <p className="text-center text-sm font-bold text-purple-700">{watch("overallImpression")} / 5</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ SECTIE 7: AFRONDEN ═══ */}
            {currentSection === 7 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Afgesproken Salaris *</Label>
                  <div className="space-y-2.5">
                    {(watchedFunctionType === "housekeeping"
                      ? [
                          { value: "17", label: "17 jaar: €10,-" },
                          { value: "18", label: "18 jaar: €11,-" },
                          { value: "19", label: "19 jaar: €12,50" },
                          { value: "20", label: "20 jaar: €14,-" },
                          { value: "21", label: "21 jaar: €17,29" },
                        ]
                      : watchedFunctionType === "chef"
                      ? [
                          { value: "assistent_chef", label: "Assistent chef: €20,-" },
                          { value: "zwk_licht", label: "ZWK licht ervaren (0-5 jaar): €21,-" },
                          { value: "zwk_goed", label: "ZWK goed ervaren (5-12 jaar): €22,50" },
                          { value: "zwk_zwaar", label: "ZWK zwaar ervaren (12+ jaar): €24,-" },
                        ]
                      : [
                          { value: "15", label: "15 jaar: €8,-" },
                          { value: "16", label: "16 jaar: €9,-" },
                          { value: "17", label: "17 jaar: €10,-" },
                          { value: "18", label: "18 jaar: €11,-" },
                          { value: "19", label: "19 jaar: €12,50" },
                          { value: "20", label: "20 jaar: €14,-" },
                          { value: "21", label: "21 jaar: €17,29" },
                        ]
                    ).map((option) => (
                      <RadioCard key={option.value} value={option.value} currentValue={watch("salaryScale")} onSelect={(v) => setValue("salaryScale", v)} id={`salary-${option.value}`}>
                        {option.label}
                      </RadioCard>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Overige opmerkingen of bijzonderheden</Label>
                    <Textarea
                      {...register("remarks")}
                      placeholder="Vul hier eventuele opmerkingen in..."
                      className="min-h-[160px] text-base rounded-xl"
                    />
                  </div>

                  <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200">
                    <p className="text-sm text-purple-700 leading-relaxed">
                      <strong>Let op:</strong> Na het versturen worden de gegevens direct gekoppeld aan het sollicitanten overzicht in het dashboard.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Navigation */}
          <div className="px-8 py-5 bg-gray-50 border-t-2 border-gray-100 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentSection === 0}
              className="flex items-center gap-2 h-14 px-8 text-base rounded-xl border-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Vorige
            </Button>

            <div className="flex items-center gap-2">
              {sections.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentSection
                      ? "w-6 h-3 bg-purple-600"
                      : i < currentSection
                      ? "w-3 h-3 bg-green-400"
                      : "w-3 h-3 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {currentSection === sections.length - 1 ? (
              <Button
                type="button"
                onClick={() => handleSubmit(onSubmit)()}
                disabled={isSubmitting}
                className="flex items-center gap-2 h-14 px-8 text-base rounded-xl bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Opslaan…
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Versturen
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 h-14 px-8 text-base rounded-xl bg-purple-600 hover:bg-purple-700"
              >
                Volgende
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
