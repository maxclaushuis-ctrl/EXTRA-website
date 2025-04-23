import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema voor e-mailsjabloon formulier
const templateFormSchema = z.object({
  name: z.string().min(1, {
    message: "Sjabloonnaam is verplicht.",
  }),
  subject: z.string().min(1, {
    message: "Onderwerp is verplicht.",
  }),
  type: z.string({
    required_error: "Selecteer een type sjabloon.",
  }),
  htmlContent: z.string().min(1, {
    message: "HTML inhoud is verplicht.",
  }),
  textContent: z.string().min(1, {
    message: "Tekst inhoud is verplicht.",
  }),
});

// Schema voor automatisering formulier
const automationFormSchema = z.object({
  name: z.string().min(1, {
    message: "Automatiseringsnaam is verplicht.",
  }),
  triggerType: z.string({
    required_error: "Selecteer een trigger type.",
  }),
  templateId: z.string({
    required_error: "Selecteer een e-mailsjabloon.",
  }),
  points: z.number().min(0).optional(),
  enabled: z.boolean().default(true),
});

// Placeholder voor e-mailsjablonen
const emailTemplates = [
  { id: "1", name: "Inlog Versturen", type: "account", subject: "Jouw inloggegevens voor EXTRA" },
  { id: "2", name: "Verjaardag", type: "birthday", subject: "Gefeliciteerd met je verjaardag!" },
  { id: "3", name: "Welkom", type: "welcome", subject: "Welkom bij EXTRA" },
];

// Placeholder voor automatiseringen
const automations = [
  { 
    id: "1", 
    name: "Verjaardag Bonus", 
    triggerType: "birthday", 
    templateId: "2", 
    points: 25, 
    enabled: true 
  },
  { 
    id: "2", 
    name: "Welkom Bericht", 
    triggerType: "userCreated", 
    templateId: "3", 
    points: 10, 
    enabled: true 
  },
];

export default function EmailTemplateEditor() {
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof emailTemplates[0] | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<typeof automations[0] | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Template formulier setup
  const templateForm = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      subject: "",
      type: "account",
      htmlContent: "",
      textContent: "",
    },
  });

  // Automation formulier setup
  const automationForm = useForm<z.infer<typeof automationFormSchema>>({
    resolver: zodResolver(automationFormSchema),
    defaultValues: {
      name: "",
      triggerType: "birthday",
      templateId: "",
      points: 0,
      enabled: true,
    },
  });

  // Bij het selecteren van een template
  const handleSelectTemplate = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      templateForm.reset({
        name: template.name,
        subject: template.subject,
        type: template.type,
        htmlContent: "<p>Beste {{firstName}},</p><p>Je kan nu inloggen met de volgende gegevens:</p><p>Email: {{email}}<br>Wachtwoord: {{password}}</p><p>Met vriendelijke groet,<br>EXTRA Team</p>",
        textContent: "Beste {{firstName}},\n\nJe kan nu inloggen met de volgende gegevens:\n\nEmail: {{email}}\nWachtwoord: {{password}}\n\nMet vriendelijke groet,\nEXTRA Team",
      });
    }
  };

  // Bij het selecteren van een automatisering
  const handleSelectAutomation = (automationId: string) => {
    const automation = automations.find(a => a.id === automationId);
    if (automation) {
      setSelectedAutomation(automation);
      automationForm.reset({
        name: automation.name,
        triggerType: automation.triggerType,
        templateId: automation.templateId,
        points: automation.points,
        enabled: automation.enabled,
      });
    }
  };

  // Template formulier submit handler
  const onTemplateSubmit = (values: z.infer<typeof templateFormSchema>) => {
    console.log("Template form submitted:", values);

    toast({
      title: "Sjabloon opgeslagen",
      description: "Het e-mailsjabloon is succesvol opgeslagen.",
    });

    // Reset form en selectie
    templateForm.reset();
    setSelectedTemplate(null);
  };

  // Automation formulier submit handler
  const onAutomationSubmit = (values: z.infer<typeof automationFormSchema>) => {
    console.log("Automation form submitted:", values);

    toast({
      title: "Automatisering opgeslagen",
      description: "De automatisering is succesvol opgeslagen.",
    });

    // Reset form en selectie
    automationForm.reset();
    setSelectedAutomation(null);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">
            E-mailsjablonen
          </TabsTrigger>
          <TabsTrigger value="automations">
            Automatiseringen
          </TabsTrigger>
        </TabsList>

        {/* E-mailsjablonen tabblad */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">E-mailsjablonen</h3>
            <Button 
              onClick={() => {
                setSelectedTemplate(null);
                templateForm.reset({
                  name: "",
                  subject: "",
                  type: "account",
                  htmlContent: "",
                  textContent: "",
                });
              }}
            >
              Nieuw sjabloon
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Sjablonen lijst */}
            <div className="md:col-span-1 space-y-4">
              <div className="font-medium">Beschikbare sjablonen</div>
              <div className="space-y-2">
                {emailTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`p-3 rounded border cursor-pointer hover:bg-muted transition-colors ${
                      selectedTemplate?.id === template.id ? 'bg-muted border-primary' : ''
                    }`}
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground">{template.type}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sjabloon editor */}
            <div className="md:col-span-3">
              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={templateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sjabloonnaam</FormLabel>
                          <FormControl>
                            <Input placeholder="Bijv. Welkom e-mail" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={templateForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer een type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="account">Account</SelectItem>
                              <SelectItem value="birthday">Verjaardag</SelectItem>
                              <SelectItem value="welcome">Welkom</SelectItem>
                              <SelectItem value="points">Punten update</SelectItem>
                              <SelectItem value="custom">Aangepast</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={templateForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Onderwerp</FormLabel>
                        <FormControl>
                          <Input placeholder="E-mail onderwerp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="htmlContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTML Inhoud</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="HTML content van de e-mail"
                            className="min-h-[200px] font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Gebruik {'{{firstName}}'}, {'{{email}}'}, {'{{points}}'} etc. als variabelen.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="textContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tekst Inhoud</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Plaintext versie van de e-mail"
                            className="min-h-[200px] font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Tekst versie voor e-mailclients die geen HTML ondersteunen.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        templateForm.reset();
                        setSelectedTemplate(null);
                      }}
                    >
                      Annuleren
                    </Button>
                    <Button type="submit">
                      {selectedTemplate ? 'Bijwerken' : 'Aanmaken'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </TabsContent>

        {/* Automatiseringen tabblad */}
        <TabsContent value="automations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Automatiseringen</h3>
            <Button 
              onClick={() => {
                setSelectedAutomation(null);
                automationForm.reset({
                  name: "",
                  triggerType: "birthday",
                  templateId: "",
                  points: 0,
                  enabled: true,
                });
              }}
            >
              Nieuwe automatisering
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Automatiseringen lijst */}
            <div className="md:col-span-1 space-y-4">
              <div className="font-medium">Actieve automatiseringen</div>
              <div className="space-y-2">
                {automations.map(automation => (
                  <div
                    key={automation.id}
                    className={`p-3 rounded border cursor-pointer hover:bg-muted transition-colors ${
                      selectedAutomation?.id === automation.id ? 'bg-muted border-primary' : ''
                    } ${!automation.enabled ? 'opacity-60' : ''}`}
                    onClick={() => handleSelectAutomation(automation.id)}
                  >
                    <div className="font-medium">{automation.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {automation.triggerType === 'birthday' ? 'Verjaardag' : 
                       automation.triggerType === 'userCreated' ? 'Nieuwe gebruiker' : 
                       'Aangepast'}
                    </div>
                    {automation.points > 0 && (
                      <div className="text-sm font-medium text-blue-600 mt-1">
                        +{automation.points} punten
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Automatisering editor */}
            <div className="md:col-span-3">
              <Form {...automationForm}>
                <form onSubmit={automationForm.handleSubmit(onAutomationSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={automationForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naam</FormLabel>
                          <FormControl>
                            <Input placeholder="Bijv. Verjaardag bonus" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={automationForm.control}
                      name="triggerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trigger</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer een type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="birthday">Verjaardag</SelectItem>
                              <SelectItem value="userCreated">Nieuwe gebruiker</SelectItem>
                              <SelectItem value="anniversary">Jubileum</SelectItem>
                              <SelectItem value="pointsThreshold">Puntenlimiet bereikt</SelectItem>
                              <SelectItem value="inactivity">Inactiviteit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={automationForm.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mailsjabloon</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een sjabloon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {emailTemplates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={automationForm.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Toe te kennen punten</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                            onChange={e => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Laat op 0 om geen punten toe te kennen.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={automationForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Automatisering actief
                          </FormLabel>
                          <FormDescription>
                            Schakel uit om deze automatisering tijdelijk te pauzeren.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <label 
                              htmlFor="enabled-checkbox" 
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${field.value ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                              <span 
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${field.value ? 'translate-x-5' : 'translate-x-0'}`} 
                              />
                              <input
                                type="checkbox"
                                id="enabled-checkbox"
                                className="sr-only"
                                {...field}
                                checked={field.value}
                                onChange={e => field.onChange(e.target.checked)}
                              />
                            </label>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        automationForm.reset();
                        setSelectedAutomation(null);
                      }}
                    >
                      Annuleren
                    </Button>
                    <Button type="submit">
                      {selectedAutomation ? 'Bijwerken' : 'Aanmaken'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}