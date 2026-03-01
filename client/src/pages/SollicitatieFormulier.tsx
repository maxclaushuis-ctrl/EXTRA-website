import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Check, User, Briefcase, Star, Calendar, Tag, Camera, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
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
  
  // Horeca achtergrond
  languages: z.array(z.string()).default([]),
  needsWorkPermit: z.enum(["ja", "nee"]).optional(),
  nationality: z.string().optional(),
  // Housekeeping achtergrond
  voertaal: z.enum(["nederlands", "engels"]).optional(),
  
  // Horeca ervaring
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
  // Housekeeping ervaring
  hkTasks: z.string().optional(),
  hkYearsExperience: z.string().optional(),
  hkLocationTypes: z.array(z.string()).default([]),
  hkHotelStars: z.array(z.string()).default([]),
  hkCompanies: z.string().optional(),
  hkReference: z.string().optional(),
  
  // Horeca praktisch
  hasDriversLicense: z.enum(["ja", "nee"]).optional(),
  hasStudentOV: z.enum(["ja", "nee"]).optional(),
  ovType: z.enum(["week", "weekend"]).optional(),
  workClothing: z.array(z.string()).default([]),
  // Housekeeping vervoer
  hasCar: z.enum(["ja", "nee"]).optional(),
  
  availableHours: z.string().optional(),
  preferredDays: z.array(z.string()).default([]),
  preferredTimes: z.array(z.string()).default([]),
  
  // Housekeeping tags (1-5 schalen)
  hkBetrouwbaarheid: z.number().min(1).max(5).optional(),
  hkCommunicatie: z.number().min(1).max(5).optional(),
  hkRepresentativiteit: z.number().min(1).max(5).optional(),

  // Chef specifieke velden
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

export default function SollicitatieFormulier() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [intakeCandidates, setIntakeCandidates] = useState<IntakeCandidate[]>([]);
  const [intakeCandidatesLoading, setIntakeCandidatesLoading] = useState(false);
  const [selectedIntakeId, setSelectedIntakeId] = useState<number | null>(null);
  const [intakeCandidateSearch, setIntakeCandidateSearch] = useState('');
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
    setIsSubmitted(false);
    setCurrentSection(0);
  }, []);

  const { register, watch, setValue, handleSubmit, formState: { errors } } = form;
  const watchedFunctionType = watch("functionType");

  // Fetch candidates automatically when functionType changes
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

  const progress = ((currentSection + 1) / sections.length) * 100;

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
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

      // Ververs de Kandidaten-tab zodat de nieuwe kandidaat direct zichtbaar is
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

  const StarRating = ({ name, value, onChange }: { name: string; value?: number; onChange: (val: number) => void }) => (
    <div className="flex gap-2 justify-center py-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition-colors ${
            value && star <= value ? "text-yellow-400" : "text-gray-300"
          } hover:text-yellow-400`}
        >
          ★
        </button>
      ))}
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="normal-cursor min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sollicitatie Opgeslagen!</h1>
          <p className="text-gray-600 mb-6">De sollicitatie is succesvol toegevoegd aan het systeem.</p>
          <Button 
            onClick={() => {
              setIsSubmitted(false);
              setCurrentSection(0);
              setIntakeCandidates([]);
              setSelectedIntakeId(null);
              setIntakeCandidateSearch('');
              form.reset();
            }}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Nieuwe Sollicitatie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="normal-cursor min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      <div className="bg-purple-600 text-white py-4 px-6 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-purple-600 font-bold text-xl px-3 py-1 rounded">
              EXTRA
            </div>
            <span className="text-lg font-medium">Sollicitatieformulier</span>
          </div>
          <span className="text-purple-200 text-sm">
            Stap {currentSection + 1} van {sections.length}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-2">
        <Progress value={progress} className="h-2" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-purple-600 text-white px-6 py-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {(() => {
                const Icon = sections[currentSection].icon;
                return <Icon className="w-5 h-5" />;
              })()}
              {getSectionTitle(currentSection)}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {currentSection === 0 && (
              <>
                <div className="space-y-4">
                  <Label className="text-base font-medium">Sollicitatie wordt afgenomen door? *</Label>
                  <RadioGroup
                    value={watch("interviewer")}
                    onValueChange={(val) => setValue("interviewer", val)}
                  >
                    {interviewers.map((name) => (
                      <div key={name} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50 transition-colors">
                        <RadioGroupItem value={name} id={`interviewer-${name}`} />
                        <Label htmlFor={`interviewer-${name}`} className="flex-1 cursor-pointer">{name}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.interviewer && <p className="text-red-500 text-sm">{errors.interviewer.message}</p>}
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Voor welke functie is dit gesprek? *</Label>
                  <Select value={watch("functionType")} onValueChange={(val: any) => setValue("functionType", val)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Kies een functie" />
                    </SelectTrigger>
                    <SelectContent>
                      {functionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.functionType && <p className="text-red-500 text-sm">{errors.functionType.message}</p>}
                </div>

              </>
            )}

            {currentSection === 1 && (
              <>
                {/* ── Kandidaatpicker ── */}
                {intakeCandidatesLoading && (
                  <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    Kandidaten ophalen…
                  </div>
                )}

                {!intakeCandidatesLoading && intakeCandidates.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 mb-2.5">Welke kandidaat zit nu bij je aan tafel?</p>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
                        <input
                          value={intakeCandidateSearch}
                          onChange={e => setIntakeCandidateSearch(e.target.value)}
                          placeholder="Zoek op naam…"
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all"
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
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
                              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                                isSelected
                                  ? 'bg-purple-50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-purple-900' : 'text-gray-800'}`}>
                                  {c.firstName} {c.lastName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{c.city || '—'} · {c.email}</p>
                              </div>
                              {isSelected && (
                                <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                              )}
                            </button>
                          );
                        })}
                    </div>
                    {selectedIntakeId && (
                      <div className="px-4 py-2.5 border-t border-gray-100 bg-purple-50">
                        <p className="text-xs text-purple-700 font-medium">✓ Gegevens vooraf ingevuld — je kunt ze nog aanpassen</p>
                      </div>
                    )}
                  </div>
                )}

                {!intakeCandidatesLoading && intakeCandidates.length === 0 && watchedFunctionType && (
                  <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500 bg-gray-50">
                    Geen aangemelde kandidaten voor deze functie — vul de gegevens hieronder handmatig in.
                  </div>
                )}
                {/* ── Einde kandidaatpicker ── */}

                <div className="space-y-2">
                  <Label>Voornaam + achternaam *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input {...register("firstName")} placeholder="Voornaam" className="h-12" />
                    <Input {...register("lastName")} placeholder="Achternaam" className="h-12" />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Telefoonnummer</Label>
                  <Input {...register("phone")} placeholder="06-12345678" type="tel" className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label>E-mailadres</Label>
                  <Input {...register("email")} placeholder="email@voorbeeld.nl" type="email" className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label>Geboortedatum</Label>
                  <Input {...register("birthDate")} type="date" className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label>Woonplaats</Label>
                  <Input {...register("city")} placeholder="Amsterdam" className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label>Kanaal (hoe heeft de sollicitant ons gevonden?)</Label>
                  <Input {...register("channel")} placeholder="Indeed, Instagram, via via..." className="h-12" />
                </div>
              </>
            )}

            {currentSection === 2 && (
              <>
                {(watchedFunctionType === "housekeeping" || watchedFunctionType === "chef") ? (
                  <>
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Wat is de voertaal van de sollicitant?</Label>
                      <RadioGroup
                        value={watch("voertaal")}
                        onValueChange={(val: any) => setValue("voertaal", val)}
                      >
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                          <RadioGroupItem value="nederlands" id="voertaal-nl" />
                          <Label htmlFor="voertaal-nl" className="cursor-pointer">Nederlands</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                          <RadioGroupItem value="engels" id="voertaal-en" />
                          <Label htmlFor="voertaal-en" className="cursor-pointer">Engels</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Tewerkstellingsvergunning nodig?</Label>
                      <RadioGroup
                        value={watch("needsWorkPermit")}
                        onValueChange={(val: any) => setValue("needsWorkPermit", val)}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="ja" id="permit-ja" />
                            <Label htmlFor="permit-ja" className="cursor-pointer">Ja</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="nee" id="permit-nee" />
                            <Label htmlFor="permit-nee" className="cursor-pointer">Nee</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label>Indien TWV of buiten NL: welk land van herkomst of welke nationaliteit</Label>
                      <Input {...register("nationality")} placeholder="Jouw antwoord" className="h-12" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Taalvaardigheid</Label>
                      <div className="space-y-2">
                        {["Nederlands", "Engels", "Duits", "Frans", "Spaans"].map((lang) => (
                          <div key={lang} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                            <Checkbox
                              id={`lang-${lang}`}
                              checked={(watch("languages") || []).includes(lang)}
                              onCheckedChange={() => toggleArrayValue("languages", lang)}
                            />
                            <Label htmlFor={`lang-${lang}`} className="flex-1 cursor-pointer">{lang}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Tewerkstellingsvergunning nodig?</Label>
                      <RadioGroup
                        value={watch("needsWorkPermit")}
                        onValueChange={(val: any) => setValue("needsWorkPermit", val)}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="ja" id="permit-ja" />
                            <Label htmlFor="permit-ja" className="cursor-pointer">Ja</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="nee" id="permit-nee" />
                            <Label htmlFor="permit-nee" className="cursor-pointer">Nee</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label>Nationaliteit</Label>
                      <Input {...register("nationality")} placeholder="Nederlands" className="h-12" />
                    </div>
                  </>
                )}
              </>
            )}

            {currentSection === 3 && watchedFunctionType === "housekeeping" && (
              <>
                <div className="space-y-2">
                  <Label>Welke taken heb je eerder gedaan in de housekeeping?</Label>
                  <Textarea
                    {...register("hkTasks")}
                    placeholder="Jouw antwoord"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Hoeveel jaar heb je in de housekeeping? *</Label>
                  <RadioGroup
                    value={watch("hkYearsExperience")}
                    onValueChange={(val) => setValue("hkYearsExperience", val)}
                  >
                    {["1-3 jaar ervaring", "3-5 jaar ervaring", "5-10 jaar ervaring", "10> jaar ervaring"].map((opt) => (
                      <div key={opt} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <RadioGroupItem value={opt} id={`hkyears-${opt}`} />
                        <Label htmlFor={`hkyears-${opt}`} className="cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Op welke type locatie heb je gewerkt?</Label>
                  <div className="space-y-2">
                    {["Hotel", "Hostel", "Ziekenhuis", "Kantoor", "Verzorgingstehuis", "Particulier/ bij mensen thuis", "Anders"].map((loc) => (
                      <div key={loc} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`hkloc-${loc}`}
                          checked={(watch("hkLocationTypes") || []).includes(loc)}
                          onCheckedChange={() => toggleArrayValue("hkLocationTypes", loc)}
                        />
                        <Label htmlFor={`hkloc-${loc}`} className="flex-1 cursor-pointer">{loc}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Bij hoeveel sterren hotels heb je gewerkt?</Label>
                  <div className="space-y-2">
                    {["1 Ster", "2 Sterren", "3 Sterren", "4 Sterren", "5 Sterren"].map((star) => (
                      <div key={star} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`hkstar-${star}`}
                          checked={(watch("hkHotelStars") || []).includes(star)}
                          onCheckedChange={() => toggleArrayValue("hkHotelStars", star)}
                        />
                        <Label htmlFor={`hkstar-${star}`} className="flex-1 cursor-pointer">{star}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bij welke bedrijven heb je allemaal gewerkt?</Label>
                  <Textarea
                    {...register("hkCompanies")}
                    placeholder="Jouw antwoord"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bij wie mogen wij eventueel een referentie opvragen om een beter beeld te krijgen van je eerdere werkzaamheden?</Label>
                  <Textarea
                    {...register("hkReference")}
                    placeholder="Jouw antwoord"
                    className="min-h-[80px]"
                  />
                </div>
              </>
            )}

            {currentSection === 3 && watchedFunctionType === "chef" && (
              <>
                <div className="space-y-4">
                  <Label className="text-base font-medium">In welke soorten keuken heb je ervaring?</Label>
                  <div className="space-y-2">
                    {["Ontbijt", "Lunch", "Fine dining", "Banqueting", "Mise-en-place"].map((keuken) => (
                      <div key={keuken} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`keuken-${keuken}`}
                          checked={(watch("chefKitchenTypes") || []).includes(keuken)}
                          onCheckedChange={() => toggleArrayValue("chefKitchenTypes", keuken)}
                        />
                        <Label htmlFor={`keuken-${keuken}`} className="flex-1 cursor-pointer">{keuken}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Welke diploma's of certificaten heb je?</Label>
                  <div className="space-y-2">
                    {["Koksdiploma", "HACCP", "SVH"].map((dip) => (
                      <div key={dip} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`diploma-${dip}`}
                          checked={(watch("chefDiplomas") || []).includes(dip)}
                          onCheckedChange={() => toggleArrayValue("chefDiplomas", dip)}
                        />
                        <Label htmlFor={`diploma-${dip}`} className="flex-1 cursor-pointer">{dip}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Hoeveel jaar heb je ervaring als kok? *</Label>
                  <RadioGroup
                    value={watch("chefYearsAsKok")}
                    onValueChange={(val) => setValue("chefYearsAsKok", val)}
                  >
                    {["1-3 jaar ervaring", "3-5 jaar ervaring", "5-10 jaar ervaring", "10> jaar ervaring"].map((opt) => (
                      <div key={opt} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <RadioGroupItem value={opt} id={`chefyears-${opt}`} />
                        <Label htmlFor={`chefyears-${opt}`} className="cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Leidinggevende ervaring:</Label>
                  <RadioGroup
                    value={watch("chefLeadershipExp")}
                    onValueChange={(val) => setValue("chefLeadershipExp", val)}
                  >
                    {["1-2 jaar ervaring", "3-5 jaar ervaring", "5> jaar ervaring", "Geen"].map((opt) => (
                      <div key={opt} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <RadioGroupItem value={opt} id={`chefleider-${opt}`} />
                        <Label htmlFor={`chefleider-${opt}`} className="cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>In welke keuken heb je de meeste ervaring?</Label>
                  <Input {...register("chefMainKitchen")} placeholder="Jouw antwoord" className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label>Bij welke bedrijven heb je gewerkt?</Label>
                  <Textarea
                    {...register("chefCompanies")}
                    placeholder="Jouw antwoord"
                    className="min-h-[80px]"
                  />
                </div>
              </>
            )}

            {currentSection === 3 && watchedFunctionType !== "housekeeping" && watchedFunctionType !== "chef" && (
              <>
                <div className="space-y-2">
                  <Label>Heeft de sollicitant een andere bijbaan?</Label>
                  <Input {...register("otherJob")} placeholder="Zo ja, vul hieronder de baan in" className="h-12" />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Type ervaring</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Festival", "Fine dining", "Hotel", "Restaurant", "Café/bar", "High-end events"].map((type) => (
                      <div key={type} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`exp-${type}`}
                          checked={(watch("experienceTypes") || []).includes(type)}
                          onCheckedChange={() => toggleArrayValue("experienceTypes", type)}
                        />
                        <Label htmlFor={`exp-${type}`} className="cursor-pointer text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Horeca ervaring *</Label>
                  <RadioGroup
                    value={watch("horecaExperience")}
                    onValueChange={(val) => setValue("horecaExperience", val)}
                  >
                    {["Geen ervaring", "<6 maanden", "6-12 maanden", "1-2 jaar", "2-3 jaar", "3-5 jaar", "5+ jaar"].map((exp) => (
                      <div key={exp} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <RadioGroupItem value={exp} id={`horeca-${exp}`} />
                        <Label htmlFor={`horeca-${exp}`} className="cursor-pointer">{exp}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {watchedFunctionType === "horecamedewerker" && (
                  <>
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Kan je zelfstandig een dienst draaien? *</Label>
                      <RadioGroup
                        value={watch("canWorkIndependently")}
                        onValueChange={(val: any) => setValue("canWorkIndependently", val)}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="ja" id="independent-ja" />
                            <Label htmlFor="independent-ja" className="cursor-pointer">Ja</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="nee" id="independent-nee" />
                            <Label htmlFor="independent-nee" className="cursor-pointer">Nee</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">3 borden lopen *</Label>
                      <RadioGroup
                        value={watch("canCarry3Plates")}
                        onValueChange={(val: any) => setValue("canCarry3Plates", val)}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="ja" id="plates-ja" />
                            <Label htmlFor="plates-ja" className="cursor-pointer">Ja</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="nee" id="plates-nee" />
                            <Label htmlFor="plates-nee" className="cursor-pointer">Nee</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Barista</Label>
                      <RadioGroup
                        value={watch("isBarista")}
                        onValueChange={(val: any) => setValue("isBarista", val)}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="ja" id="barista-ja" />
                            <Label htmlFor="barista-ja" className="cursor-pointer">Ja</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="nee" id="barista-nee" />
                            <Label htmlFor="barista-nee" className="cursor-pointer">Nee</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Cocktailshaker</Label>
                      <RadioGroup
                        value={watch("canShakeCocktails")}
                        onValueChange={(val: any) => setValue("canShakeCocktails", val)}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="ja" id="cocktail-ja" />
                            <Label htmlFor="cocktail-ja" className="cursor-pointer">Ja</Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                            <RadioGroupItem value="nee" id="cocktail-nee" />
                            <Label htmlFor="cocktail-nee" className="cursor-pointer">Nee</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Bediening vaardigheden *</Label>
                      <StarRating
                        name="serviceSkills"
                        value={watch("serviceSkills")}
                        onChange={(val) => setValue("serviceSkills", val)}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Bar vaardigheden *</Label>
                      <StarRating
                        name="barSkills"
                        value={watch("barSkills")}
                        onChange={(val) => setValue("barSkills", val)}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Diner vaardigheden *</Label>
                      <StarRating
                        name="dinerSkills"
                        value={watch("dinerSkills")}
                        onChange={(val) => setValue("dinerSkills", val)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-4">
                  <Label className="text-base font-medium">Assistent chef</Label>
                  <RadioGroup
                    value={watch("isAssistantChef")}
                    onValueChange={(val: any) => setValue("isAssistantChef", val)}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="ja" id="chef-ja" />
                        <Label htmlFor="chef-ja" className="cursor-pointer">Ja</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="nee" id="chef-nee" />
                        <Label htmlFor="chef-nee" className="cursor-pointer">Nee</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Afwas</Label>
                  <RadioGroup
                    value={watch("canWashDishes")}
                    onValueChange={(val: any) => setValue("canWashDishes", val)}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="ja" id="dishes-ja" />
                        <Label htmlFor="dishes-ja" className="cursor-pointer">Ja</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="nee" id="dishes-nee" />
                        <Label htmlFor="dishes-nee" className="cursor-pointer">Nee</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Promotiemedewerker</Label>
                  <RadioGroup
                    value={watch("isPromoWorker")}
                    onValueChange={(val: any) => setValue("isPromoWorker", val)}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="ja" id="promo-ja" />
                        <Label htmlFor="promo-ja" className="cursor-pointer">Ja</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="nee" id="promo-nee" />
                        <Label htmlFor="promo-nee" className="cursor-pointer">Nee</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {currentSection === 4 && watchedFunctionType === "housekeeping" && (
              <>
                <div className="space-y-2">
                  <Label>Beschikbaarheid per week (in dagen)</Label>
                  <Input {...register("availableHours")} placeholder="Jouw antwoord" className="h-12" />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Voorkeur werkdagen</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag", "N.v.t."].map((day) => (
                      <div key={day} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`day-${day}`}
                          checked={(watch("preferredDays") || []).includes(day)}
                          onCheckedChange={() => toggleArrayValue("preferredDays", day)}
                        />
                        <Label htmlFor={`day-${day}`} className="cursor-pointer text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Voorkeur moment van de dag</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Ochtend", "Middag", "Avond", "N.v.t."].map((time) => (
                      <div key={time} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`time-${time}`}
                          checked={(watch("preferredTimes") || []).includes(time)}
                          onCheckedChange={() => toggleArrayValue("preferredTimes", time)}
                        />
                        <Label htmlFor={`time-${time}`} className="cursor-pointer text-sm">{time}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Heb je een auto?</Label>
                  <RadioGroup
                    value={watch("hasCar")}
                    onValueChange={(val: any) => setValue("hasCar", val)}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="ja" id="car-ja" />
                        <Label htmlFor="car-ja" className="cursor-pointer">Ja</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="nee" id="car-nee" />
                        <Label htmlFor="car-nee" className="cursor-pointer">Nee</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {currentSection === 4 && watchedFunctionType === "chef" && (
              <>
                <div className="space-y-2">
                  <Label>Beschikbaarheid per week (in dagen)</Label>
                  <Input {...register("availableHours")} placeholder="Jouw antwoord" className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label>Vanaf wanneer kan je starten? *</Label>
                  <Input {...register("chefStartDate")} type="date" className="h-12" />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Voorkeur werkdagen</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag", "N.v.t."].map((day) => (
                      <div key={day} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`cday-${day}`}
                          checked={(watch("preferredDays") || []).includes(day)}
                          onCheckedChange={() => toggleArrayValue("preferredDays", day)}
                        />
                        <Label htmlFor={`cday-${day}`} className="cursor-pointer text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Voorkeur moment van de dag</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Ochtend", "Middag", "Avond", "N.v.t."].map((time) => (
                      <div key={time} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`ctime-${time}`}
                          checked={(watch("preferredTimes") || []).includes(time)}
                          onCheckedChange={() => toggleArrayValue("preferredTimes", time)}
                        />
                        <Label htmlFor={`ctime-${time}`} className="cursor-pointer text-sm">{time}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Heb je een auto?</Label>
                  <RadioGroup
                    value={watch("hasCar")}
                    onValueChange={(val: any) => setValue("hasCar", val)}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="ja" id="chef-car-ja" />
                        <Label htmlFor="chef-car-ja" className="cursor-pointer">Ja</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="nee" id="chef-car-nee" />
                        <Label htmlFor="chef-car-nee" className="cursor-pointer">Nee</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {currentSection === 4 && watchedFunctionType !== "housekeeping" && watchedFunctionType !== "chef" && (
              <>
                <div className="space-y-4">
                  <Label className="text-base font-medium">Rijbewijs</Label>
                  <RadioGroup
                    value={watch("hasDriversLicense")}
                    onValueChange={(val: any) => setValue("hasDriversLicense", val)}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="ja" id="license-ja" />
                        <Label htmlFor="license-ja" className="cursor-pointer">Ja</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="nee" id="license-nee" />
                        <Label htmlFor="license-nee" className="cursor-pointer">Nee</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Studenten OV-Chipkaart</Label>
                  <RadioGroup
                    value={watch("hasStudentOV")}
                    onValueChange={(val: any) => setValue("hasStudentOV", val)}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="ja" id="ov-ja" />
                        <Label htmlFor="ov-ja" className="cursor-pointer">Ja</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                        <RadioGroupItem value="nee" id="ov-nee" />
                        <Label htmlFor="ov-nee" className="cursor-pointer">Nee</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {watch("hasStudentOV") === "ja" && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Zo ja, week of weekend OV-Chipkaart?</Label>
                    <RadioGroup
                      value={watch("ovType")}
                      onValueChange={(val: any) => setValue("ovType", val)}
                    >
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                          <RadioGroupItem value="week" id="ov-week" />
                          <Label htmlFor="ov-week" className="cursor-pointer">Week</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 flex-1 hover:bg-purple-50">
                          <RadioGroupItem value="weekend" id="ov-weekend" />
                          <Label htmlFor="ov-weekend" className="cursor-pointer">Weekend</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-base font-medium">Werkkleding</Label>
                  <div className="space-y-2">
                    {["Wit hemd", "Zwarte pantalon", "Nette zwarte schoenen"].map((item) => (
                      <div key={item} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`clothing-${item}`}
                          checked={(watch("workClothing") || []).includes(item)}
                          onCheckedChange={() => toggleArrayValue("workClothing", item)}
                        />
                        <Label htmlFor={`clothing-${item}`} className="flex-1 cursor-pointer">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentSection === 5 && watchedFunctionType === "housekeeping" && (
              <>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">Selecteer per categorie welke tag van toepassing is.</p>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Betrouwbaarheid en werkhouding *</Label>
                    <p className="text-sm text-gray-500 mt-1">Komt degene over als iemand die afspraken nakomt en gemotiveerd is?</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 px-2">
                    <span className="text-xs max-w-[40%] text-center">Onbetrouwbare indruk, weinig motivatie</span>
                    <span className="text-xs max-w-[40%] text-center">Zeer betrouwbaar en gemotiveerd</span>
                  </div>
                  <StarRating
                    name="hkBetrouwbaarheid"
                    value={watch("hkBetrouwbaarheid")}
                    onChange={(val) => setValue("hkBetrouwbaarheid", val)}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Communicatieve vaardigheden *</Label>
                    <p className="text-sm text-gray-500 mt-1">Kan de kandidaat voldoende Nederlands of Engels om instructies te begrijpen en zich verstaanbaar te maken?</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 px-2">
                    <span className="text-xs max-w-[40%] text-center">Begrijpt nauwelijks iets, communicatie lastig</span>
                    <span className="text-xs max-w-[40%] text-center">Spreekt goed, communiceert helder</span>
                  </div>
                  <StarRating
                    name="hkCommunicatie"
                    value={watch("hkCommunicatie")}
                    onChange={(val) => setValue("hkCommunicatie", val)}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Representativiteit & houding *</Label>
                    <p className="text-sm text-gray-500 mt-1">Komt de kandidaat verzorgd, vriendelijk en geschikt over om in een hotelomgeving te werken?</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 px-2">
                    <span className="text-xs max-w-[40%] text-center">Onverzorgd of ongepaste houding</span>
                    <span className="text-xs max-w-[40%] text-center">Zeer representatief, prettige uitstraling</span>
                  </div>
                  <StarRating
                    name="hkRepresentativiteit"
                    value={watch("hkRepresentativiteit")}
                    onChange={(val) => setValue("hkRepresentativiteit", val)}
                  />
                </div>
              </>
            )}

            {currentSection === 5 && watchedFunctionType === "chef" && (
              <>
                <div className="space-y-4">
                  <Label className="text-base font-medium">Beschikt de chef over de juiste kleding?</Label>
                  <div className="space-y-2">
                    {["Koksbroek", "Koksbuis", "Veiligheidsschoenen", "Messenset"].map((item) => (
                      <div key={item} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`chefcloth-${item}`}
                          checked={(watch("chefClothing") || []).includes(item)}
                          onCheckedChange={() => toggleArrayValue("chefClothing", item)}
                        />
                        <Label htmlFor={`chefcloth-${item}`} className="flex-1 cursor-pointer">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentSection === 5 && watchedFunctionType !== "housekeeping" && watchedFunctionType !== "chef" && (
              <>
                <div className="space-y-2">
                  <Label>Beschikbaarheid per week (in uren)</Label>
                  <Input {...register("availableHours")} placeholder="bijv. 16-24 uur" className="h-12" />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Voorkeur werkdagen</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag", "N.v.t."].map((day) => (
                      <div key={day} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`day-${day}`}
                          checked={(watch("preferredDays") || []).includes(day)}
                          onCheckedChange={() => toggleArrayValue("preferredDays", day)}
                        />
                        <Label htmlFor={`day-${day}`} className="cursor-pointer text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Voorkeur moment van de dag</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Ochtend", "Middag", "Avond", "N.v.t."].map((time) => (
                      <div key={time} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <Checkbox
                          id={`time-${time}`}
                          checked={(watch("preferredTimes") || []).includes(time)}
                          onCheckedChange={() => toggleArrayValue("preferredTimes", time)}
                        />
                        <Label htmlFor={`time-${time}`} className="cursor-pointer text-sm">{time}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentSection === 6 && (
              <>
                {watchedFunctionType === "chef" && (
                  <>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">Selecteer per categorie welke tag van toepassing is.</p>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Professionele uitstraling (chef): *</Label>
                      <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                        <span>❌ Onverzorgd</span>
                        <span>⭐ Zeer representatief</span>
                      </div>
                      <StarRating
                        name="chefProfessioneleUitstraling"
                        value={watch("chefProfessioneleUitstraling")}
                        onChange={(val) => setValue("chefProfessioneleUitstraling", val)}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Communicatieve vaardigheden (chef): *</Label>
                      <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                        <span>❌ Gesloten</span>
                        <span>⭐ Super vlot</span>
                      </div>
                      <StarRating
                        name="communicationSkills"
                        value={watch("communicationSkills")}
                        onChange={(val) => setValue("communicationSkills", val)}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Algehele indruk: *</Label>
                      <StarRating
                        name="overallImpression"
                        value={watch("overallImpression")}
                        onChange={(val) => setValue("overallImpression", val)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-4">
                  <Label className="text-base font-medium">Beoordeling</Label>
                  <RadioGroup
                    value={watch("assessmentRating")}
                    onValueChange={(val) => setValue("assessmentRating", val)}
                  >
                    {[
                      { value: "topper", label: "Topper", emoji: "✨" },
                      { value: "goede_indruk", label: "Goede indruk", emoji: "✅" },
                      { value: "middelmatig", label: "Middelmatig", emoji: "🚩" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <RadioGroupItem value={option.value} id={`rating-${option.value}`} />
                        <Label htmlFor={`rating-${option.value}`} className="cursor-pointer">
                          {option.emoji} {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Ervaring</Label>
                  <RadioGroup
                    value={watch("experienceLevel")}
                    onValueChange={(val) => setValue("experienceLevel", val)}
                  >
                    {[
                      { value: "veel", label: "Veel ervaring", emoji: "🏆" },
                      { value: "beperkt", label: "Beperkte ervaring", emoji: "🤔" },
                      { value: "geen", label: "Geen ervaring", emoji: "🆕" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <RadioGroupItem value={option.value} id={`exp-level-${option.value}`} />
                        <Label htmlFor={`exp-level-${option.value}`} className="cursor-pointer">
                          {option.emoji} {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Uiterlijke verzorging</Label>
                  <RadioGroup
                    value={watch("appearance")}
                    onValueChange={(val) => setValue("appearance", val)}
                  >
                    {[
                      { value: "verzorgd", label: "Verzorgd (hygiënisch, nette kleding, verzorgd)", emoji: "💇" },
                      { value: "onverzorgd", label: "Onverzorgd", emoji: "😬" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <RadioGroupItem value={option.value} id={`appearance-${option.value}`} />
                        <Label htmlFor={`appearance-${option.value}`} className="cursor-pointer">
                          {option.emoji} {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Houding</Label>
                  <RadioGroup
                    value={watch("attitude")}
                    onValueChange={(val) => setValue("attitude", val)}
                  >
                    {[
                      { value: "super_enthousiast", label: "Super enthousiast", emoji: "🤩" },
                      { value: "spontaan", label: "Spontaan", emoji: "🖐" },
                      { value: "verlegen", label: "Verlegen", emoji: "😊" },
                      { value: "ongeinteresseerd", label: "Ongeïnteresseerd", emoji: "😐" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                        <RadioGroupItem value={option.value} id={`attitude-${option.value}`} />
                        <Label htmlFor={`attitude-${option.value}`} className="cursor-pointer">
                          {option.emoji} {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Communicatieve vaardigheden *</Label>
                  <div className="flex items-center justify-between text-sm text-gray-500 px-2">
                    <span>❌ Gesloten</span>
                    <span>⭐ Super vlot</span>
                  </div>
                  <StarRating
                    name="communicationSkills"
                    value={watch("communicationSkills")}
                    onChange={(val) => setValue("communicationSkills", val)}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Algehele indruk *</Label>
                  <div className="flex items-center justify-between text-sm text-gray-500 px-2">
                    <span>❌ Onverzorgd en ongeïnteresseerd</span>
                    <span>⭐ Super enthousiast en representatief</span>
                  </div>
                  <StarRating
                    name="overallImpression"
                    value={watch("overallImpression")}
                    onChange={(val) => setValue("overallImpression", val)}
                  />
                </div>
              </>
            )}

            {currentSection === 7 && (
              <>
                <div className="space-y-4">
                  <Label className="text-base font-medium">Afgesproken Salaris *</Label>
                  <RadioGroup
                    value={watch("salaryScale")}
                    onValueChange={(val) => setValue("salaryScale", val)}
                  >
                    {watchedFunctionType === "housekeeping" ? (
                      [
                        { value: "17", label: "17 jaar: €10,-" },
                        { value: "18", label: "18 jaar: €11,-" },
                        { value: "19", label: "19 jaar: €12,50" },
                        { value: "20", label: "20 jaar: €14,-" },
                        { value: "21", label: "21 jaar: €17,29" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                          <RadioGroupItem value={option.value} id={`salary-${option.value}`} />
                          <Label htmlFor={`salary-${option.value}`} className="cursor-pointer">{option.label}</Label>
                        </div>
                      ))
                    ) : watchedFunctionType === "chef" ? (
                      [
                        { value: "assistent_chef", label: "Assistent chef: €20,-" },
                        { value: "zwk_licht", label: "ZWK licht ervaren (0-5 jaar): €21,-" },
                        { value: "zwk_goed", label: "ZWK goed ervaren (5-12 jaar): €22,50" },
                        { value: "zwk_zwaar", label: "ZWK zwaar ervaren (12+ jaar): €24,-" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                          <RadioGroupItem value={option.value} id={`salary-${option.value}`} />
                          <Label htmlFor={`salary-${option.value}`} className="cursor-pointer">{option.label}</Label>
                        </div>
                      ))
                    ) : (
                      [
                        { value: "15", label: "15 jaar: €8,-" },
                        { value: "16", label: "16 jaar: €9,-" },
                        { value: "17", label: "17 jaar: €10,-" },
                        { value: "18", label: "18 jaar: €11,-" },
                        { value: "19", label: "19 jaar: €12,50" },
                        { value: "20", label: "20 jaar: €14,-" },
                        { value: "21", label: "21 jaar: €17,29" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-purple-50">
                          <RadioGroupItem value={option.value} id={`salary-${option.value}`} />
                          <Label htmlFor={`salary-${option.value}`} className="cursor-pointer">{option.label}</Label>
                        </div>
                      ))
                    )}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Overige opmerkingen of bijzonderheden</Label>
                  <Textarea
                    {...register("remarks")}
                    placeholder="Vul hier eventuele opmerkingen in..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700">
                    <strong>Let op:</strong> Na het versturen worden de gegevens direct gekoppeld aan het sollicitanten overzicht in het dashboard.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentSection === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Vorige
            </Button>

            {currentSection === sections.length - 1 ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>Bezig met opslaan...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Versturen
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                Volgende
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Pagina {currentSection + 1} van {sections.length}
        </p>
      </form>
    </div>
  );
}
