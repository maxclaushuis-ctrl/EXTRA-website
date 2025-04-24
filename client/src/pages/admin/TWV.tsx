import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, RefreshCw, Calendar, DownloadCloud, FileEdit, AlertCircle } from "lucide-react";

// Type definities
type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  needsTwv: boolean;
  twvStatus: string;
  twvRequestDate?: string;
  twvApprovalDate?: string;
  twvExpiryDate?: string;
  twvNotes?: string;
};

// Status badge component
const TWVStatusBadge = ({ status }: { status: string }) => {
  let color;
  let label;
  
  switch (status) {
    case 'none':
      color = 'bg-gray-200 text-gray-800';
      label = 'Geen TWV';
      break;
    case 'required':
      color = 'bg-yellow-200 text-yellow-800';
      label = 'TWV aanvragen';
      break;
    case 'pending':
      color = 'bg-blue-200 text-blue-800';
      label = 'TWV in behandeling';
      break;
    case 'approved':
      color = 'bg-green-200 text-green-800';
      label = 'TWV toegewezen';
      break;
    case 'rejected':
      color = 'bg-red-200 text-red-800';
      label = 'TWV afgekeurd';
      break;
    default:
      color = 'bg-gray-200 text-gray-800';
      label = 'Onbekend';
  }
  
  return (
    <Badge variant="outline" className={`${color} font-medium`}>
      {label}
    </Badge>
  );
};

// TWV bewerken dialog
const EditTWVDialog = ({ user, onClose }: { user: User, onClose: () => void }) => {
  const [status, setStatus] = useState(user.twvStatus);
  const [notes, setNotes] = useState(user.twvNotes || "");
  const [expiryDate, setExpiryDate] = useState(user.twvExpiryDate?.slice(0, 10) || "");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateTWV = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/users/${user.id}/twv`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/twv/users'] });
      toast({
        title: "TWV status bijgewerkt",
        description: "De TWV status is succesvol bijgewerkt",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Fout bij bijwerken van TWV status:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de TWV status",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: any = {
      twvStatus: status,
      twvNotes: notes || null
    };
    
    if (expiryDate) {
      updateData.twvExpiryDate = expiryDate;
    }
    
    updateTWV.mutate(updateData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>TWV status bijwerken</DialogTitle>
        <DialogDescription>
          Werk de TWV status bij voor {user.firstName} {user.lastName}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="col-span-1">
            Status
          </Label>
          <Select
            value={status}
            onValueChange={setStatus}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecteer een status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Geen TWV</SelectItem>
              <SelectItem value="required">TWV aanvragen</SelectItem>
              <SelectItem value="pending">TWV in behandeling</SelectItem>
              <SelectItem value="approved">TWV toegewezen</SelectItem>
              <SelectItem value="rejected">TWV afgekeurd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="expiryDate" className="col-span-1">
            Verloopdatum
          </Label>
          <Input
            id="expiryDate"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="col-span-3"
          />
        </div>
        
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="notes" className="col-span-1 pt-2">
            Notities
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optionele notities over de TWV aanvraag"
            className="col-span-3"
            rows={4}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Annuleren
        </Button>
        <Button type="submit" disabled={updateTWV.isPending}>
          {updateTWV.isPending ? "Bezig met bijwerken..." : "Bijwerken"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// TWV overview pagina
const TWV = () => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedTab, setSelectedTab] = useState("required");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    data: users = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/twv/users'],
    select: (data) => data as User[]
  });
  
  const syncWithPlanning = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/twv/sync', {
        method: 'POST'
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/twv/users'] });
      toast({
        title: "Synchronisatie voltooid",
        description: `TWV gegevens gesynchroniseerd, ${data?.updatedCount || 0} gebruikers bijgewerkt`,
      });
    },
    onError: (error) => {
      console.error("Fout bij synchroniseren met planningsysteem:", error);
      toast({
        title: "Synchronisatie fout",
        description: "Er is een fout opgetreden bij het synchroniseren met het planningsysteem",
        variant: "destructive",
      });
    }
  });
  
  // Filter users based on selected tab
  const filteredUsers = users.filter(user => {
    if (selectedTab === "all") return true;
    return user.twvStatus === selectedTab;
  });
  
  // Sorteer gebruikers op naam
  const sortedUsers = [...filteredUsers].sort((a, b) => 
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  );
  
  // Groepeer gebruikers op status voor statistieken
  const userStats = users.reduce((stats: Record<string, number>, user) => {
    stats[user.twvStatus] = (stats[user.twvStatus] || 0) + 1;
    return stats;
  }, {});
  
  if (isLoading) {
    return <div className="container mx-auto py-6">Laden...</div>;
  }
  
  if (error) {
    return <div className="container mx-auto py-6 text-red-500">Er is een fout opgetreden bij het laden van TWV gegevens</div>;
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">TWV Management</h1>
            <p className="text-gray-500">
              Beheer tewerkstellingsvergunningen voor buitenlandse medewerkers
            </p>
          </div>
          
          <Button onClick={() => syncWithPlanning.mutate()} disabled={syncWithPlanning.isPending}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {syncWithPlanning.isPending ? "Synchroniseren..." : "Synchroniseer met planning"}
          </Button>
        </div>
        
        {/* Statistieken */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aanvragen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.required || 0}</div>
              <p className="text-xs text-muted-foreground">
                Medewerkers die een TWV nodig hebben
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In behandeling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.pending || 0}</div>
              <p className="text-xs text-muted-foreground">
                TWV aanvragen in behandeling
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toegewezen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.approved || 0}</div>
              <p className="text-xs text-muted-foreground">
                Goedgekeurde TWV's
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Afgekeurd</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.rejected || 0}</div>
              <p className="text-xs text-muted-foreground">
                Afgekeurde TWV's
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs voor verschillende statussen */}
        <Tabs defaultValue="required" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="required">TWV aanvragen</TabsTrigger>
            <TabsTrigger value="pending">In behandeling</TabsTrigger>
            <TabsTrigger value="approved">Toegewezen</TabsTrigger>
            <TabsTrigger value="rejected">Afgekeurd</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-6">
            {sortedUsers.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">Geen medewerkers gevonden</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Er zijn geen medewerkers met deze TWV status. 
                      Klik op "Synchroniseer met planning" om gegevens bij te werken.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aanvraagdatum</TableHead>
                      <TableHead>Goedkeuringsdatum</TableHead>
                      <TableHead>Vervaldatum</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{user.firstName} {user.lastName}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TWVStatusBadge status={user.twvStatus} />
                        </TableCell>
                        <TableCell>
                          {user.twvRequestDate ? 
                            format(new Date(user.twvRequestDate), 'dd MMM yyyy', { locale: nl }) 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {user.twvApprovalDate ? 
                            format(new Date(user.twvApprovalDate), 'dd MMM yyyy', { locale: nl }) 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {user.twvExpiryDate ? 
                            format(new Date(user.twvExpiryDate), 'dd MMM yyyy', { locale: nl }) 
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => {
                            if (!open) setEditingUser(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                                <FileEdit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            {editingUser?.id === user.id && (
                              <DialogContent>
                                <EditTWVDialog 
                                  user={user} 
                                  onClose={() => setEditingUser(null)} 
                                />
                              </DialogContent>
                            )}
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TWV;