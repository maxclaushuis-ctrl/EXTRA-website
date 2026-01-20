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
  Upload
} from "lucide-react";
import type { Candidate } from "@shared/schema";

const functionTypes = [
  { value: "housekeeping", label: "Housekeeping" },
  { value: "horecamedewerker", label: "Horecamedewerker" },
  { value: "chef", label: "Chef" },
  { value: "front_office", label: "Front-office" },
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

export default function CandidatesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [functionFilter, setFunctionFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

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

  const candidates = data?.candidates || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 25);

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Sollicitanten</h1>
            <p className="text-muted-foreground">Beheer sollicitanten en hun status</p>
          </div>
          <div className="flex gap-2">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Functie</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="font-medium">
                          {candidate.firstName} {candidate.lastName}
                        </div>
                        {candidate.city && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {candidate.city}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getFunctionLabel(candidate.functionType)}
                        </Badge>
                      </TableCell>
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
                      <TableCell>
                        {getStatusBadge(candidate.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(candidate.createdAt).toLocaleDateString('nl-NL')}
                        </div>
                      </TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

                <div className="flex justify-end gap-2">
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
