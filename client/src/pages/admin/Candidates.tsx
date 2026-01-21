import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainNav } from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Clock, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Star,
  Shield,
  FileText,
  Upload,
  Filter,
  LayoutList,
  ArrowUpDown
} from "lucide-react";
import type { Candidate } from "@shared/schema";

const functionTypes = [
  { value: "housekeeping", label: "Housekeeping", color: "green" },
  { value: "horecamedewerker", label: "Horecamedewerker", color: "orange" },
  { value: "chef", label: "Chef", color: "blue" },
  { value: "front_office", label: "Front-office", color: "pink" },
];

const statusOptions = [
  { value: "in_behandeling", label: "In behandeling", color: "bg-yellow-500" },
  { value: "aangenomen", label: "Aangenomen", color: "bg-green-500" },
  { value: "afgewezen", label: "Afgewezen", color: "bg-red-500" },
];

function getStatusBadge(status: string) {
  const option = statusOptions.find(o => o.value === status);
  if (!option) return <Badge variant="outline">{status}</Badge>;
  
  return (
    <Badge className={`${option.color} text-white`}>
      {option.label}
    </Badge>
  );
}

function getFunctionLabel(type: string) {
  const func = functionTypes.find(f => f.value === type);
  return func?.label || type;
}

function getScoreBadge(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return <span className="text-gray-400">-</span>;
  }
  let colorClass = 'bg-red-100 text-red-700';
  if (score >= 75) colorClass = 'bg-green-100 text-green-700';
  else if (score >= 50) colorClass = 'bg-yellow-100 text-yellow-700';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass} font-medium`}>
      {score}
    </span>
  );
}

function calculateOverallScore(candidate: Candidate) {
  const weights = { softskills: 0.30, bar: 0.20, bediening: 0.25, diner: 0.25 };
  const scores = [
    { value: candidate.softSkillsScore, weight: weights.softskills },
    { value: candidate.barScore, weight: weights.bar },
    { value: candidate.serviceScore, weight: weights.bediening },
    { value: candidate.dinerScore, weight: weights.diner }
  ].filter(s => s.value !== null && s.value !== undefined);
  
  if (scores.length === 0) return null;
  
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = scores.reduce((sum, s) => sum + ((s.value || 0) * s.weight), 0);
  return Math.round(weightedSum / totalWeight);
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function SalaryScaleInfo({ birthDate, functionType, currentScaleId }: { 
  birthDate: string; 
  functionType: string;
  currentScaleId?: number | null;
}) {
  const age = calculateAge(birthDate);
  
  const { data: scaleByAge, isLoading } = useQuery<{ id: number; name: string; hourlyRate: number }>({
    queryKey: ['/api/admin/salary-scales/by-age', age, functionType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (functionType) params.set('functionType', functionType);
      const res = await fetch(`/api/admin/salary-scales/by-age/${age}?${params}`, {
        credentials: 'include'
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!birthDate
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('nl-NL', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(cents / 100);
  };

  if (isLoading) {
    return <span className="text-sm text-muted-foreground">Laden...</span>;
  }

  if (!scaleByAge) {
    return (
      <div className="text-sm">
        <p className="text-muted-foreground">Leeftijd: {age} jaar</p>
        <p className="text-orange-600">Geen salarisschaal beschikbaar voor deze leeftijd</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Leeftijd:</span>
        <Badge variant="outline">{age} jaar</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Schaal:</span>
        <span className="text-sm font-medium">{scaleByAge.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Uurloon:</span>
        <span className="text-sm font-semibold text-green-600">
          {formatCurrency(scaleByAge.hourlyRate)}
        </span>
      </div>
    </div>
  );
}

export default function CandidatesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [functionFilter, setFunctionFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt-desc");
  const [minScore, setMinScore] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);

  const { data, isLoading } = useQuery<{ candidates: Candidate[]; total: number }>({
    queryKey: ['/api/admin/candidates', { search, status: statusFilter, functionType: functionFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (functionFilter) params.set('functionType', functionFilter);
      params.set('page', page.toString());
      params.set('limit', '25');
      const res = await fetch(`/api/admin/candidates?${params}`);
      if (!res.ok) throw new Error('Failed to fetch candidates');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/candidates', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
      setIsAddDialogOpen(false);
      toast({ title: "Sollicitant toegevoegd", description: "De sollicitant is succesvol aangemaakt." });
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is iets misgegaan.", variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/admin/candidates/${id}/status`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status }) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
      toast({ title: "Status bijgewerkt", description: "De status is succesvol bijgewerkt." });
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is iets misgegaan.", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/candidates/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
      toast({ title: "Verwijderd", description: "De sollicitant is verwijderd." });
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is iets misgegaan.", variant: "destructive" });
    }
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: async (data: { id: number; interviewDate: string; interviewTime: string; interviewLocation: string }) => {
      return apiRequest(`/api/admin/candidates/${data.id}`, { 
        method: 'PATCH', 
        body: JSON.stringify({
          interviewDate: data.interviewDate,
          interviewTime: data.interviewTime,
          interviewLocation: data.interviewLocation
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
      setIsInterviewDialogOpen(false);
      setInterviewCandidate(null);
      toast({ title: "Interview gepland", description: "Het interview is succesvol ingepland." });
    },
    onError: () => {
      toast({ title: "Fout", description: "Er is iets misgegaan.", variant: "destructive" });
    }
  });

  const openInterviewDialog = (candidate: Candidate) => {
    setInterviewCandidate(candidate);
    setIsInterviewDialogOpen(true);
  };

  const handleScheduleInterview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!interviewCandidate) return;
    const formData = new FormData(e.currentTarget);
    scheduleInterviewMutation.mutate({
      id: interviewCandidate.id,
      interviewDate: formData.get('interviewDate') as string,
      interviewTime: formData.get('interviewTime') as string,
      interviewLocation: formData.get('interviewLocation') as string || 'Kantoor EXTRA'
    });
  };

  const handleAddCandidate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      functionType: formData.get('functionType'),
      city: formData.get('city'),
      notes: formData.get('notes'),
    };
    createMutation.mutate(data);
  };

  const viewCandidate = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailDialogOpen(true);
  };

  let candidates = data?.candidates || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 25);

  // Apply score filter for horecamedewerker
  if (functionFilter === 'horecamedewerker' && minScore > 0) {
    candidates = candidates.filter(c => {
      const overall = calculateOverallScore(c);
      return overall !== null && overall >= minScore;
    });
  }

  // Apply sorting for horecamedewerker
  if (functionFilter === 'horecamedewerker') {
    const [sortField, sortDir] = sortBy.split('-');
    candidates = [...candidates].sort((a, b) => {
      let valA: number, valB: number;
      if (sortField === 'overall') {
        valA = calculateOverallScore(a) ?? -1;
        valB = calculateOverallScore(b) ?? -1;
      } else if (sortField === 'softskills') {
        valA = a.softSkillsScore ?? -1;
        valB = b.softSkillsScore ?? -1;
      } else if (sortField === 'bar') {
        valA = a.barScore ?? -1;
        valB = b.barScore ?? -1;
      } else if (sortField === 'bediening') {
        valA = a.serviceScore ?? -1;
        valB = b.serviceScore ?? -1;
      } else if (sortField === 'diner') {
        valA = a.dinerScore ?? -1;
        valB = b.dinerScore ?? -1;
      } else {
        return 0;
      }
      if (sortDir === 'desc') return valB - valA;
      return valA - valB;
    });
  }

  const getViewIndicator = () => {
    if (!functionFilter) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
          <LayoutList className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Weergave: Master</span>
        </div>
      );
    }
    const func = functionTypes.find(f => f.value === functionFilter);
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
    };
    const colors = colorMap[func?.color || 'purple'];
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 ${colors.bg} border ${colors.border} rounded-lg`}>
        <Filter className={`w-4 h-4 ${colors.text}`} />
        <span className={`text-sm font-medium ${colors.text}`}>Weergave: {func?.label}</span>
      </div>
    );
  };

  const renderTableHeaders = () => {
    if (functionFilter === 'horecamedewerker') {
      return (
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Interview</TableHead>
          <TableHead className="text-center">Overall</TableHead>
          <TableHead className="text-center">Softskills</TableHead>
          <TableHead className="text-center">Bar</TableHead>
          <TableHead className="text-center">Bediening</TableHead>
          <TableHead className="text-center">Diner</TableHead>
          <TableHead className="text-right">Acties</TableHead>
        </TableRow>
      );
    }
    if (functionFilter === 'chef') {
      return (
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ervaring</TableHead>
          <TableHead>Interview</TableHead>
          <TableHead className="text-right">Acties</TableHead>
        </TableRow>
      );
    }
    if (functionFilter === 'housekeeping') {
      return (
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Beschikbaarheid</TableHead>
          <TableHead>Interview</TableHead>
          <TableHead className="text-right">Acties</TableHead>
        </TableRow>
      );
    }
    if (functionFilter === 'front_office') {
      return (
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Talen</TableHead>
          <TableHead>Interview</TableHead>
          <TableHead className="text-right">Acties</TableHead>
        </TableRow>
      );
    }
    return (
      <TableRow>
        <TableHead>Naam</TableHead>
        <TableHead>Functie</TableHead>
        <TableHead>Contact</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Datum</TableHead>
        <TableHead className="text-right">Acties</TableHead>
      </TableRow>
    );
  };

  const renderTableRow = (candidate: Candidate) => {
    const initials = (candidate.firstName?.charAt(0) || '') + (candidate.lastName?.charAt(0) || '');
    
    const nameCell = (
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-purple-700">
            {initials}
          </div>
          <div>
            <div className="font-medium">{candidate.firstName} {candidate.lastName}</div>
            {candidate.city && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {candidate.city}
              </div>
            )}
          </div>
        </div>
      </TableCell>
    );

    const contactCell = (
      <TableCell>
        <div className="text-sm space-y-1">
          {candidate.email && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              {candidate.email}
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {candidate.phone}
            </div>
          )}
        </div>
      </TableCell>
    );

    const statusCell = (
      <TableCell>{getStatusBadge(candidate.status)}</TableCell>
    );

    const interviewCell = (
      <TableCell>
        {candidate.interviewDate ? (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {new Date(candidate.interviewDate).toLocaleDateString('nl-NL')}
            </div>
            {candidate.interviewTime && (
              <div className="text-muted-foreground">{candidate.interviewTime}</div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
    );

    const actionsCell = (
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => viewCandidate(candidate)}>
              <Eye className="h-4 w-4 mr-2" />
              Bekijken
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: candidate.id, status: 'aangenomen' })}>
              <UserCheck className="h-4 w-4 mr-2" />
              Aannemen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: candidate.id, status: 'afgewezen' })}>
              <UserX className="h-4 w-4 mr-2" />
              Afwijzen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openInterviewDialog(candidate)}>
              <Calendar className="h-4 w-4 mr-2" />
              Interview plannen
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                if (confirm('Weet je zeker dat je deze sollicitant wilt verwijderen?')) {
                  deleteMutation.mutate(candidate.id);
                }
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    );

    if (functionFilter === 'horecamedewerker') {
      const overall = calculateOverallScore(candidate);
      return (
        <TableRow key={candidate.id}>
          {nameCell}
          {contactCell}
          {statusCell}
          {interviewCell}
          <TableCell className="text-center">{getScoreBadge(overall)}</TableCell>
          <TableCell className="text-center">{getScoreBadge(candidate.softSkillsScore)}</TableCell>
          <TableCell className="text-center">{getScoreBadge(candidate.barScore)}</TableCell>
          <TableCell className="text-center">{getScoreBadge(candidate.serviceScore)}</TableCell>
          <TableCell className="text-center">{getScoreBadge(candidate.dinerScore)}</TableCell>
          {actionsCell}
        </TableRow>
      );
    }

    if (functionFilter === 'chef') {
      return (
        <TableRow key={candidate.id}>
          {nameCell}
          {contactCell}
          {statusCell}
          <TableCell>
            <span className="text-sm text-muted-foreground">
              {candidate.horecaExperience || '-'}
            </span>
          </TableCell>
          {interviewCell}
          {actionsCell}
        </TableRow>
      );
    }

    if (functionFilter === 'housekeeping') {
      return (
        <TableRow key={candidate.id}>
          {nameCell}
          {contactCell}
          {statusCell}
          <TableCell>
            <span className="text-sm text-muted-foreground">
              {candidate.availability || '-'}
            </span>
          </TableCell>
          {interviewCell}
          {actionsCell}
        </TableRow>
      );
    }

    if (functionFilter === 'front_office') {
      return (
        <TableRow key={candidate.id}>
          {nameCell}
          {contactCell}
          {statusCell}
          <TableCell>
            <span className="text-sm text-muted-foreground">
              {candidate.language || '-'}
            </span>
          </TableCell>
          {interviewCell}
          {actionsCell}
        </TableRow>
      );
    }

    return (
      <TableRow key={candidate.id}>
        {nameCell}
        <TableCell>
          <Badge variant="outline">
            {getFunctionLabel(candidate.functionType)}
          </Badge>
        </TableCell>
        {contactCell}
        {statusCell}
        <TableCell>
          <div className="text-sm text-muted-foreground">
            {new Date(candidate.createdAt).toLocaleDateString('nl-NL')}
          </div>
        </TableCell>
        {actionsCell}
      </TableRow>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Sollicitanten</h1>
            <p className="text-muted-foreground">Beheer sollicitanten en hun status</p>
          </div>
          <div className="flex items-center gap-3">
            {getViewIndicator()}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe sollicitant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nieuwe sollicitant toevoegen</DialogTitle>
                  <DialogDescription>
                    Voer de gegevens van de nieuwe sollicitant in.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCandidate}>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Voornaam *</Label>
                      <Input id="firstName" name="firstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Achternaam *</Label>
                      <Input id="lastName" name="lastName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" name="email" type="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefoon</Label>
                      <Input id="phone" name="phone" type="tel" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="functionType">Functie *</Label>
                      <Select name="functionType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer functie" />
                        </SelectTrigger>
                        <SelectContent>
                          {functionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Woonplaats</Label>
                      <Input id="city" name="city" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="notes">Notities</Label>
                      <Textarea id="notes" name="notes" rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuleren
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Opslaan..." : "Opslaan"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoeken op naam, e-mail of telefoon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Alle statussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={functionFilter || "all"} onValueChange={(v) => setFunctionFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Alle functies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle functies</SelectItem>
                  {functionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {functionFilter === 'horecamedewerker' && (
              <div className="flex gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Min. score:</Label>
                  <Select value={minScore.toString()} onValueChange={(v) => setMinScore(parseInt(v))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Alle</SelectItem>
                      <SelectItem value="50">50+</SelectItem>
                      <SelectItem value="60">60+</SelectItem>
                      <SelectItem value="70">70+</SelectItem>
                      <SelectItem value="80">80+</SelectItem>
                      <SelectItem value="90">90+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Sorteren:</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overall-desc">Overall (hoog-laag)</SelectItem>
                      <SelectItem value="overall-asc">Overall (laag-hoog)</SelectItem>
                      <SelectItem value="softskills-desc">Softskills (hoog-laag)</SelectItem>
                      <SelectItem value="bar-desc">Bar (hoog-laag)</SelectItem>
                      <SelectItem value="bediening-desc">Bediening (hoog-laag)</SelectItem>
                      <SelectItem value="diner-desc">Diner (hoog-laag)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter("")}>
              Alle ({total})
            </TabsTrigger>
            <TabsTrigger value="in_behandeling" onClick={() => setStatusFilter("in_behandeling")}>
              <Clock className="h-4 w-4 mr-1" />
              In behandeling
            </TabsTrigger>
            <TabsTrigger value="aangenomen" onClick={() => setStatusFilter("aangenomen")}>
              <UserCheck className="h-4 w-4 mr-1" />
              Aangenomen
            </TabsTrigger>
            <TabsTrigger value="afgewezen" onClick={() => setStatusFilter("afgewezen")}>
              <UserX className="h-4 w-4 mr-1" />
              Afgewezen
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Laden...</div>
            ) : candidates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Geen sollicitanten gevonden
              </div>
            ) : (
              <>
                <div className="px-4 py-2 text-sm text-muted-foreground border-b">
                  Toont {candidates.length} van {total} sollicitanten
                </div>
                <Table>
                  <TableHeader>
                    {renderTableHeaders()}
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => renderTableRow(candidate))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Vorige
            </Button>
            <span className="py-2 px-4">
              Pagina {page} van {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Volgende
            </Button>
          </div>
        )}

        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCandidate?.firstName} {selectedCandidate?.lastName}
              </DialogTitle>
              <DialogDescription>
                {selectedCandidate && getFunctionLabel(selectedCandidate.functionType)} - {selectedCandidate && getStatusBadge(selectedCandidate.status)}
              </DialogDescription>
            </DialogHeader>
            {selectedCandidate && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Contactgegevens</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {selectedCandidate.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {selectedCandidate.email}
                        </div>
                      )}
                      {selectedCandidate.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {selectedCandidate.phone}
                        </div>
                      )}
                      {selectedCandidate.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {selectedCandidate.city}
                        </div>
                      )}
                      {selectedCandidate.needsTwv && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-orange-500" />
                          TWV nodig
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Interview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {selectedCandidate.interviewDate ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(selectedCandidate.interviewDate).toLocaleDateString('nl-NL')}
                          </div>
                          {selectedCandidate.interviewTime && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {selectedCandidate.interviewTime}
                            </div>
                          )}
                          {selectedCandidate.interviewLocation && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {selectedCandidate.interviewLocation}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">Geen interview gepland</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Salaris</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedCandidate.birthDate ? (
                      <SalaryScaleInfo 
                        birthDate={selectedCandidate.birthDate} 
                        functionType={selectedCandidate.functionType}
                        currentScaleId={selectedCandidate.salaryScaleId}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">Geboortedatum nodig voor salarisschaal</p>
                    )}
                  </CardContent>
                </Card>

                {selectedCandidate.functionType === 'horecamedewerker' && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Beoordelingsscores</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-5 gap-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Overall</div>
                          {getScoreBadge(calculateOverallScore(selectedCandidate))}
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Softskills</div>
                          {getScoreBadge(selectedCandidate.softSkillsScore)}
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Bar</div>
                          {getScoreBadge(selectedCandidate.barScore)}
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Bediening</div>
                          {getScoreBadge(selectedCandidate.serviceScore)}
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Diner</div>
                          {getScoreBadge(selectedCandidate.dinerScore)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Foto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        {selectedCandidate.photoUrl ? (
                          <img 
                            src={selectedCandidate.photoUrl} 
                            alt={`${selectedCandidate.firstName} ${selectedCandidate.lastName}`}
                            className="w-24 h-24 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl font-medium text-gray-400">
                              {selectedCandidate.firstName?.charAt(0)}{selectedCandidate.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !selectedCandidate) return;
                                const formData = new FormData();
                                formData.append('photo', file);
                                try {
                                  const res = await fetch(`/api/admin/candidates/${selectedCandidate.id}/photo`, {
                                    method: 'POST',
                                    body: formData,
                                    credentials: 'include'
                                  });
                                  if (res.ok) {
                                    queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
                                    const data = await res.json();
                                    setSelectedCandidate({ ...selectedCandidate, photoUrl: data.photoUrl });
                                    toast({ title: "Foto geüpload", description: "De foto is succesvol opgeslagen." });
                                  } else {
                                    toast({ title: "Fout", description: "Upload mislukt", variant: "destructive" });
                                  }
                                } catch {
                                  toast({ title: "Fout", description: "Upload mislukt", variant: "destructive" });
                                }
                              }}
                            />
                            <Button variant="outline" size="sm" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-1" />
                                Upload foto
                              </span>
                            </Button>
                          </label>
                          {selectedCandidate.photoUrl && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/admin/candidates/${selectedCandidate.id}/photo`, {
                                    method: 'DELETE',
                                    credentials: 'include'
                                  });
                                  if (res.ok) {
                                    queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
                                    setSelectedCandidate({ ...selectedCandidate, photoUrl: null });
                                    toast({ title: "Foto verwijderd" });
                                  }
                                } catch {
                                  toast({ title: "Fout", variant: "destructive" });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Verwijderen
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                {selectedCandidate.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Notities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedCandidate.notes}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={async () => {
                      if (!confirm('Weet je zeker dat je deze kandidaat wilt anonimiseren?\n\nDit verwijdert alle persoonsgegevens permanent conform AVG/GDPR en kan niet ongedaan worden gemaakt.')) {
                        return;
                      }
                      try {
                        const res = await fetch(`/api/admin/candidates/${selectedCandidate.id}/anonymize`, {
                          method: 'POST',
                          credentials: 'include'
                        });
                        if (res.ok) {
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/candidates'] });
                          setIsDetailDialogOpen(false);
                          toast({ title: "Geanonimiseerd", description: "Kandidaat is geanonimiseerd conform AVG." });
                        } else {
                          toast({ title: "Fout", description: "Anonimisatie mislukt", variant: "destructive" });
                        }
                      } catch {
                        toast({ title: "Fout", description: "Anonimisatie mislukt", variant: "destructive" });
                      }
                    }}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    AVG Anonimiseren
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                      Sluiten
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => updateStatusMutation.mutate({ id: selectedCandidate.id, status: 'aangenomen' })}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Aannemen
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Interview plannen</DialogTitle>
              <DialogDescription>
                Plan een interview voor {interviewCandidate?.firstName} {interviewCandidate?.lastName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleScheduleInterview}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="interviewDate">Datum *</Label>
                  <Input 
                    id="interviewDate" 
                    name="interviewDate" 
                    type="date" 
                    required 
                    defaultValue={interviewCandidate?.interviewDate || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interviewTime">Tijd *</Label>
                  <Input 
                    id="interviewTime" 
                    name="interviewTime" 
                    type="time" 
                    required 
                    defaultValue={interviewCandidate?.interviewTime || '10:00'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interviewLocation">Locatie</Label>
                  <Select name="interviewLocation" defaultValue={interviewCandidate?.interviewLocation || 'Kantoor EXTRA'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer locatie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kantoor EXTRA">Kantoor EXTRA</SelectItem>
                      <SelectItem value="Kantoor Amsterdam">Kantoor Amsterdam</SelectItem>
                      <SelectItem value="Kantoor Rotterdam">Kantoor Rotterdam</SelectItem>
                      <SelectItem value="Online (Teams)">Online (Teams)</SelectItem>
                      <SelectItem value="Online (Zoom)">Online (Zoom)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsInterviewDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={scheduleInterviewMutation.isPending}>
                  <Calendar className="h-4 w-4 mr-2" />
                  {scheduleInterviewMutation.isPending ? "Opslaan..." : "Interview plannen"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
