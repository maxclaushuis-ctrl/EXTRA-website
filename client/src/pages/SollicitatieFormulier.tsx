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

const formSchema = z.object({
  interviewer: z.string().min(1, "Selecteer een interviewer"),
  functionType: z.enum(["horecamedewerker", "chef", "housekeeping", "front_office"]),
  
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
  
  hasDriversLicense: z.enum(["ja", "nee"]).optional(),
  hasStudentOV: z.enum(["ja", "nee"]).optional(),
  ovType: z.enum(["week", "weekend"]).optional(),
  workClothing: z.array(z.string()).default([]),
  
  availableHours: z.string().optional(),
  preferredDays: z.array(z.string()).default([]),
  preferredTimes: z.array(z.string()).default([]),
  
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

const interviewers = ["Eveline", "Isa", "Britt", "Max", "Lea"];

const functionTypes = [
  { value: "horecamedewerker", label: "Horecamedewerker" },
  { value: "chef", label: "Chef" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "front_office", label: "Front-office" },
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
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      languages: [],
      experienceTypes: [],
      workClothing: [],
      preferredDays: [],
      preferredTimes: [],
    },
  });

  useEffect(() => {
    setIsSubmitted(false);
    setCurrentSection(0);
  }, []);

  const { register, watch, setValue, handleSubmit, formState: { errors } } = form;
  const watchedFunctionType = watch("functionType");

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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/sollicitatie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Fout bij versturen");
      }

      setIsSubmitted(true);
      toast({
        title: "Sollicitatie opgeslagen!",
        description: "De gegevens zijn succesvol opgeslagen.",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het opslaan. Probeer opnieuw.",
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
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
              {sections[currentSection].title}
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

            {currentSection === 3 && (
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

            {currentSection === 4 && (
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

            {currentSection === 5 && (
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
                  <Label className="text-base font-medium">Salaris *</Label>
                  <RadioGroup
                    value={watch("salaryScale")}
                    onValueChange={(val) => setValue("salaryScale", val)}
                  >
                    {[
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
                    ))}
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
