import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  CalendarIcon, 
  ChevronRightIcon, 
  MailIcon, 
  PenIcon, 
  PlusIcon, 
  SendIcon, 
  TrashIcon,
  AlertTriangleIcon,
  CheckIcon
} from "lucide-react";
// Import de AutomationPage component
import AutomationPage from '@/components/automation/AutomationPage';

import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import EmailTemplateEditor from "@/components/EmailTemplateEditor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

type Campaign = {
  id: number;
  name: string;
  description: string | null;
  subject: string;
  htmlContent: string;
  textContent: string;
  templateId: number | null;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  scheduledFor: string | null;
  sentAt: string | null;
  sentToCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
};

type EmailTemplate = {
  id: number;
  name: string;
  type: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  createdAt: string;
  updatedAt: string;
};

const CampaignStatus = ({ status }: { status: string }) => {
  let color;
  
  switch (status) {
    case 'draft':
      color = 'bg-gray-200 text-gray-800';
      break;
    case 'scheduled':
      color = 'bg-blue-200 text-blue-800';
      break;
    case 'sent':
      color = 'bg-green-200 text-green-800';
      break;
    case 'cancelled':
      color = 'bg-red-200 text-red-800';
      break;
    default:
      color = 'bg-gray-200 text-gray-800';
  }
  
  return (
    <Badge variant="outline" className={`${color} font-medium`}>
      {status === 'draft' && 'Concept'}
      {status === 'scheduled' && 'Gepland'}
      {status === 'sent' && 'Verzonden'}
      {status === 'cancelled' && 'Geannuleerd'}
    </Badge>
  );
};

// Type definitie voor campagne types
type CampaignTypeValue = 'nieuwsbrief' | 'aankondiging' | 'verjaardagen' | 'beloning' | 'punten' | 'overig';

const CampaignType = ({ type }: { type: CampaignTypeValue }) => {
  let color;
  
  switch (type) {
    case 'nieuwsbrief':
      color = 'bg-blue-100 text-blue-800';
      break;
    case 'aankondiging':
      color = 'bg-orange-100 text-orange-800';
      break;
    case 'verjaardagen':
      color = 'bg-pink-100 text-pink-800';
      break;
    case 'beloning':
      color = 'bg-purple-100 text-purple-800';
      break;
    case 'punten':
      color = 'bg-green-100 text-green-800';
      break;
    case 'overig':
    default:
      color = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <Badge variant="outline" className={`${color} font-medium`}>
      {type === 'nieuwsbrief' && 'Nieuwsbrief'}
      {type === 'aankondiging' && 'Aankondiging'}
      {type === 'verjaardagen' && 'Verjaardagen'}
      {type === 'beloning' && 'Beloning'}
      {type === 'punten' && 'Punten'}
      {type === 'overig' && 'Overig'}
    </Badge>
  );
};

const CampaignsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const { data: campaigns = [], isLoading, error } = useQuery({
    queryKey: ['/api/campaigns'],
    select: (data) => data as Campaign[]
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/campaigns/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campagne verwijderd",
        description: "De campagne is succesvol verwijderd",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error("Fout bij verwijderen van campagne:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de campagne",
        variant: "destructive",
      });
    }
  });
  
  const sendCampaign = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/campaigns/${id}/send`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campagne verzonden",
        description: "De campagne is succesvol verzonden",
      });
    },
    onError: (error) => {
      console.error("Fout bij verzenden van campagne:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verzenden van de campagne",
        variant: "destructive",
      });
    }
  });

  const handleDelete = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCampaign) {
      deleteCampaign.mutate(selectedCampaign.id);
    }
  };
  
  const handleSend = (campaign: Campaign) => {
    if (window.confirm(`Weet je zeker dat je de campagne "${campaign.name}" wilt verzenden?`)) {
      sendCampaign.mutate(campaign.id);
    }
  };

  if (isLoading) {
    return <div>Laden...</div>;
  }

  if (error) {
    return <div className="text-red-500">Fout bij het laden van campagnes</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Campagnes</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Nieuwe Campagne
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <NewCampaignForm />
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MailIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Geen campagnes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Er zijn nog geen marketingcampagnes aangemaakt. 
                Maak je eerste campagne om e-mails te versturen naar je medewerkers.
              </p>
              <div className="mt-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Nieuwe Campagne
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <NewCampaignForm />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableCaption>Lijst van alle marketingcampagnes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verzonden</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{campaign.name}</span>
                      {campaign.description && (
                        <span className="text-sm text-gray-500">{campaign.description}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CampaignType type={(campaign.description?.includes('nieuwsbrief') ? 'nieuwsbrief' : 
                      (campaign.description?.includes('aankondiging') ? 'aankondiging' : 
                      (campaign.description?.includes('verjaardag') ? 'verjaardagen' : 
                      (campaign.description?.includes('beloning') ? 'beloning' : 
                      (campaign.description?.includes('punten') ? 'punten' : 'overig'))))) || 'overig'} />
                  </TableCell>
                  <TableCell>
                    <CampaignStatus status={campaign.status} />
                  </TableCell>
                  <TableCell>
                    {campaign.createdAt ? 
                      format(new Date(campaign.createdAt), 'dd MMM yyyy', { locale: nl }) 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {campaign.sentAt ? 
                      <>
                        <span>{format(new Date(campaign.sentAt), 'dd MMM yyyy', { locale: nl })}</span>
                        <br />
                        <span className="text-sm text-gray-500">
                          Verzonden: {campaign.sentToCount}
                        </span>
                      </> 
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <PenIcon className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <EditCampaignForm campaign={campaign} />
                        </DialogContent>
                      </Dialog>
                      
                      {campaign.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSend(campaign)}
                        >
                          <SendIcon className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(campaign)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Campagne verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze campagne wilt verwijderen? 
              Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const NewCampaignForm = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [campaignType, setCampaignType] = useState<CampaignTypeValue>('nieuwsbrief');
  const [htmlContent, setHtmlContent] = useState("<p>Beste {{naam}},</p><p>Dit is een e-mail van EXTRA.</p><p>Met vriendelijke groet,<br>Het EXTRA team</p>");
  const [textContent, setTextContent] = useState("Beste {{naam}},\n\nDit is een e-mail van EXTRA.\n\nMet vriendelijke groet,\nHet EXTRA team");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/email-templates'],
    select: (data) => data as EmailTemplate[]
  });
  
  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campagne aangemaakt",
        description: "De campagne is succesvol aangemaakt",
      });
      // Reset formulier
      setName("");
      setDescription("");
      setSubject("");
      setHtmlContent("<p>Beste {{naam}},</p><p>Dit is een e-mail van EXTRA.</p><p>Met vriendelijke groet,<br>Het EXTRA team</p>");
      setTextContent("Beste {{naam}},\n\nDit is een e-mail van EXTRA.\n\nMet vriendelijke groet,\nHet EXTRA team");
      setSelectedTemplate("");
    },
    onError: (error) => {
      console.error("Fout bij aanmaken van campagne:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het aanmaken van de campagne",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !subject || !htmlContent || !textContent) {
      toast({
        title: "Ongeldige gegevens",
        description: "Vul alle verplichte velden in",
        variant: "destructive",
      });
      return;
    }
    
    // Voeg het campagnetype toe aan de beschrijving zodat we het later kunnen detecteren
    let updatedDescription = description;
    if (campaignType && campaignType !== 'overig') {
      if (!updatedDescription) {
        updatedDescription = `Type: ${campaignType}`;
      } else if (!updatedDescription.includes(`Type: ${campaignType}`)) {
        updatedDescription = `Type: ${campaignType} - ${updatedDescription}`;
      }
    }

    const campaignData = {
      name,
      description: updatedDescription || null,
      templateId: selectedTemplate ? parseInt(selectedTemplate) : null,
      subject,
      htmlContent,
      textContent,
      status: 'draft'
    };
    
    createCampaign.mutate(campaignData);
  };
  
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id.toString() === templateId);
      if (template) {
        setSubject(template.subject);
        setHtmlContent(template.htmlContent);
        setTextContent(template.textContent);
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Nieuwe Campagne</DialogTitle>
        <DialogDescription>
          Maak een nieuwe marketingcampagne om te verzenden naar je medewerkers.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="col-span-1">
            Naam *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Campagnenaam"
            className="col-span-3"
            required
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="col-span-1">
            Beschrijving
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optionele beschrijving van de campagne"
            className="col-span-3"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="campaignType" className="col-span-1">
            Type *
          </Label>
          <Select value={campaignType} onValueChange={(value) => setCampaignType(value as CampaignTypeValue)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Kies een type campagne" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nieuwsbrief">Nieuwsbrief</SelectItem>
              <SelectItem value="aankondiging">Aankondiging</SelectItem>
              <SelectItem value="verjaardagen">Verjaardagen</SelectItem>
              <SelectItem value="beloning">Beloning</SelectItem>
              <SelectItem value="punten">Punten</SelectItem>
              <SelectItem value="overig">Overig</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="template" className="col-span-1">
            Sjabloon
          </Label>
          <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Kies een sjabloon (optioneel)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Geen sjabloon</SelectItem>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="subject" className="col-span-1">
            Onderwerp *
          </Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="E-mail onderwerp"
            className="col-span-3"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Label>E-mail inhoud *</Label>
          <EmailTemplateEditor
            htmlContent={htmlContent}
            onHtmlChange={setHtmlContent}
            textContent={textContent}
            onTextChange={setTextContent}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit" disabled={createCampaign.isPending}>
          {createCampaign.isPending ? "Bezig met aanmaken..." : "Campagne aanmaken"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const EditCampaignForm = ({ campaign }: { campaign: Campaign }) => {
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description || "");
  const [subject, setSubject] = useState(campaign.subject);
  const [htmlContent, setHtmlContent] = useState(campaign.htmlContent);
  const [textContent, setTextContent] = useState(campaign.textContent);
  const [campaignType, setCampaignType] = useState<CampaignTypeValue>(
    (campaign.description?.includes('nieuwsbrief') ? 'nieuwsbrief' : 
    (campaign.description?.includes('aankondiging') ? 'aankondiging' : 
    (campaign.description?.includes('verjaardag') ? 'verjaardagen' : 
    (campaign.description?.includes('beloning') ? 'beloning' : 
    (campaign.description?.includes('punten') ? 'punten' : 'overig'))))) || 'overig'
  );
  const [status, setStatus] = useState<string>(campaign.status);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateCampaign = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campagne bijgewerkt",
        description: "De campagne is succesvol bijgewerkt",
      });
    },
    onError: (error) => {
      console.error("Fout bij bijwerken van campagne:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de campagne",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !subject || !htmlContent || !textContent) {
      toast({
        title: "Ongeldige gegevens",
        description: "Vul alle verplichte velden in",
        variant: "destructive",
      });
      return;
    }
    
    // Voeg het campagnetype toe aan de beschrijving zodat we het later kunnen detecteren
    let updatedDescription = description;
    if (campaignType && campaignType !== 'overig') {
      if (!updatedDescription) {
        updatedDescription = `Type: ${campaignType}`;
      } else if (!updatedDescription.includes(`Type: ${campaignType}`)) {
        // Verwijder oude type-informatie als die bestaat
        const typeRegex = /Type: [a-z]+ - /;
        updatedDescription = updatedDescription.replace(typeRegex, '');
        // Voeg nieuwe type-informatie toe
        updatedDescription = `Type: ${campaignType} - ${updatedDescription}`;
      }
    }

    const campaignData = {
      name,
      description: updatedDescription || null,
      subject,
      htmlContent,
      textContent,
      status
    };
    
    updateCampaign.mutate(campaignData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Campagne bewerken</DialogTitle>
        <DialogDescription>
          Bewerk de gegevens van de campagne.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-name" className="col-span-1">
            Naam *
          </Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-description" className="col-span-1">
            Beschrijving
          </Label>
          <Textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-3"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-campaignType" className="col-span-1">
            Type *
          </Label>
          <Select value={campaignType} onValueChange={(value) => setCampaignType(value as CampaignTypeValue)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Kies een type campagne" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nieuwsbrief">Nieuwsbrief</SelectItem>
              <SelectItem value="aankondiging">Aankondiging</SelectItem>
              <SelectItem value="verjaardagen">Verjaardagen</SelectItem>
              <SelectItem value="beloning">Beloning</SelectItem>
              <SelectItem value="punten">Punten</SelectItem>
              <SelectItem value="overig">Overig</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-status" className="col-span-1">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Kies een status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Concept</SelectItem>
              <SelectItem value="scheduled">Gepland</SelectItem>
              <SelectItem value="sent">Verzonden</SelectItem>
              <SelectItem value="cancelled">Geannuleerd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-subject" className="col-span-1">
            Onderwerp *
          </Label>
          <Input
            id="edit-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Label>E-mail inhoud *</Label>
          <EmailTemplateEditor
            htmlContent={htmlContent}
            onHtmlChange={setHtmlContent}
            textContent={textContent}
            onTextChange={setTextContent}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit" disabled={updateCampaign.isPending}>
          {updateCampaign.isPending ? "Bezig met bijwerken..." : "Campagne bijwerken"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const TemplatesList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['/api/email-templates'],
    select: (data) => data as EmailTemplate[]
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/email-templates/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: "Sjabloon verwijderd",
        description: "Het e-mailsjabloon is succesvol verwijderd",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error("Fout bij verwijderen van sjabloon:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van het sjabloon",
        variant: "destructive",
      });
    }
  });

  const handleDelete = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTemplate) {
      deleteTemplate.mutate(selectedTemplate.id);
    }
  };

  if (isLoading) {
    return <div>Laden...</div>;
  }

  if (error) {
    return <div className="text-red-500">Fout bij het laden van sjablonen</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">E-mailsjablonen</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Nieuw Sjabloon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <NewTemplateForm />
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MailIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Geen sjablonen</h3>
              <p className="mt-1 text-sm text-gray-500">
                Er zijn nog geen e-mailsjablonen aangemaakt. 
                Maak je eerste sjabloon om te gebruiken in je campagnes.
              </p>
              <div className="mt-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Nieuw Sjabloon
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <NewTemplateForm />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableCaption>Lijst van alle e-mailsjablonen</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Onderwerp</TableHead>
                <TableHead>Bijgewerkt</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {template.type === 'general' && 'Algemeen'}
                      {template.type === 'welcome' && 'Welkom'}
                      {template.type === 'birthday' && 'Verjaardag'}
                      {template.type === 'marketing' && 'Marketing'}
                      {template.type === 'review' && 'Review'}
                      {template.type === 'reward' && 'Beloning'}
                    </Badge>
                  </TableCell>
                  <TableCell>{template.subject}</TableCell>
                  <TableCell>
                    {template.updatedAt ? 
                      format(new Date(template.updatedAt), 'dd MMM yyyy', { locale: nl }) 
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <PenIcon className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <EditTemplateForm template={template} />
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sjabloon verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit e-mailsjabloon wilt verwijderen? 
              Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const NewTemplateForm = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState("general");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("<p>Beste {{naam}},</p><p>Dit is een e-mail van EXTRA.</p><p>Met vriendelijke groet,<br>Het EXTRA team</p>");
  const [textContent, setTextContent] = useState("Beste {{naam}},\n\nDit is een e-mail van EXTRA.\n\nMet vriendelijke groet,\nHet EXTRA team");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createTemplate = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/email-templates', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: "Sjabloon aangemaakt",
        description: "Het e-mailsjabloon is succesvol aangemaakt",
      });
      // Reset formulier
      setName("");
      setType("general");
      setSubject("");
      setHtmlContent("<p>Beste {{naam}},</p><p>Dit is een e-mail van EXTRA.</p><p>Met vriendelijke groet,<br>Het EXTRA team</p>");
      setTextContent("Beste {{naam}},\n\nDit is een e-mail van EXTRA.\n\nMet vriendelijke groet,\nHet EXTRA team");
    },
    onError: (error) => {
      console.error("Fout bij aanmaken van sjabloon:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het aanmaken van het sjabloon",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !subject || !htmlContent || !textContent) {
      toast({
        title: "Ongeldige gegevens",
        description: "Vul alle verplichte velden in",
        variant: "destructive",
      });
      return;
    }
    
    const templateData = {
      name,
      type,
      subject,
      htmlContent,
      textContent
    };
    
    createTemplate.mutate(templateData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Nieuw E-mailsjabloon</DialogTitle>
        <DialogDescription>
          Maak een nieuw e-mailsjabloon om te gebruiken in je campagnes.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="col-span-1">
            Naam *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sjabloonnaam"
            className="col-span-3"
            required
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="type" className="col-span-1">
            Type
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Kies een type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Algemeen</SelectItem>
              <SelectItem value="welcome">Welkom</SelectItem>
              <SelectItem value="birthday">Verjaardag</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="reward">Beloning</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="subject" className="col-span-1">
            Onderwerp *
          </Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="E-mail onderwerp"
            className="col-span-3"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Label>E-mail inhoud *</Label>
          <EmailTemplateEditor
            htmlContent={htmlContent}
            onHtmlChange={setHtmlContent}
            textContent={textContent}
            onTextChange={setTextContent}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit" disabled={createTemplate.isPending}>
          {createTemplate.isPending ? "Bezig met aanmaken..." : "Sjabloon aanmaken"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const EditTemplateForm = ({ template }: { template: EmailTemplate }) => {
  const [name, setName] = useState(template.name);
  const [type, setType] = useState(template.type);
  const [subject, setSubject] = useState(template.subject);
  const [htmlContent, setHtmlContent] = useState(template.htmlContent);
  const [textContent, setTextContent] = useState(template.textContent);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateTemplate = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/email-templates/${template.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: "Sjabloon bijgewerkt",
        description: "Het e-mailsjabloon is succesvol bijgewerkt",
      });
    },
    onError: (error) => {
      console.error("Fout bij bijwerken van sjabloon:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van het sjabloon",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !subject || !htmlContent || !textContent) {
      toast({
        title: "Ongeldige gegevens",
        description: "Vul alle verplichte velden in",
        variant: "destructive",
      });
      return;
    }
    
    const templateData = {
      name,
      type,
      subject,
      htmlContent,
      textContent
    };
    
    updateTemplate.mutate(templateData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>E-mailsjabloon bewerken</DialogTitle>
        <DialogDescription>
          Bewerk de gegevens van het e-mailsjabloon.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-name" className="col-span-1">
            Naam *
          </Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-type" className="col-span-1">
            Type
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Kies een type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Algemeen</SelectItem>
              <SelectItem value="welcome">Welkom</SelectItem>
              <SelectItem value="birthday">Verjaardag</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="reward">Beloning</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-subject" className="col-span-1">
            Onderwerp *
          </Label>
          <Input
            id="edit-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="col-span-3"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Label>E-mail inhoud *</Label>
          <EmailTemplateEditor
            htmlContent={htmlContent}
            onHtmlChange={setHtmlContent}
            textContent={textContent}
            onTextChange={setTextContent}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit" disabled={updateTemplate.isPending}>
          {updateTemplate.isPending ? "Bezig met bijwerken..." : "Sjabloon bijwerken"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Import de AutomationPage component bovenaan het bestand
import AutomationPage from '@/components/automation/AutomationPage';

// Automatisering component voor marketing
const AutomatiseringTab = () => {
  // Gebruik de nieuwe drag & drop editor voor automatisering
  return <AutomationPage />;
}

  // Geen legacy code meer nodig, de AutomationPage component regelt alles nu
};

const Marketing = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Marketing</h1>
        <p className="text-gray-500">
          Beheer je marketingcampagnes en e-mailsjablonen.
        </p>
        
        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
            <TabsTrigger value="templates">Sjablonen</TabsTrigger>
            <TabsTrigger value="automation">Automatisering</TabsTrigger>
          </TabsList>
          <TabsContent value="campaigns" className="mt-6">
            <CampaignsList />
          </TabsContent>
          <TabsContent value="templates" className="mt-6">
            <TemplatesList />
          </TabsContent>
          <TabsContent value="automation" className="mt-6">
            <AutomatiseringTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Marketing;