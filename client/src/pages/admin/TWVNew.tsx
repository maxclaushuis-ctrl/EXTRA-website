import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, RefreshCw, AlertCircle, FileEdit } from "lucide-react";

// Type definities
type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
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
  const [formData, setFormData] = useState({
    twvStatus: user.twvStatus,
    twvNotes: user.twvNotes || '',
    twvExpiryDate: user.twvExpiryDate || '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateTWVMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/users/${user.id}/twv`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/twv/users'] });
      toast({
        title: "TWV status bijgewerkt",
        description: `De TWV status voor ${user.firstName} ${user.lastName} is succesvol bijgewerkt.`,
      });
      onClose();
    },
    onError: (error) => {
      console.error("Fout bij bijwerken TWV status:", error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van de TWV status.",
        variant: "destructive",
      });
    }
  });
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Bewerk TWV Status</DialogTitle>
        <DialogDescription>
          Werk de TWV status bij voor {user.firstName} {user.lastName}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="twvStatus">TWV Status</Label>
          <Select 
            value={formData.twvStatus}
            onValueChange={(value) => setFormData({...formData, twvStatus: value})}
          >
            <SelectTrigger id="twvStatus">
              <SelectValue placeholder="Selecteer status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="required">TWV aanvragen</SelectItem>
              <SelectItem value="pending">TWV in behandeling</SelectItem>
              <SelectItem value="approved">TWV toegewezen</SelectItem>
              <SelectItem value="rejected">TWV afgekeurd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {formData.twvStatus === 'approved' && (
          <div className="space-y-2">
            <Label htmlFor="twvExpiryDate">Vervaldatum</Label>
            <Input
              id="twvExpiryDate"
              type="date"
              value={formData.twvExpiryDate ? formData.twvExpiryDate.split('T')[0] : ''}
              onChange={(e) => setFormData({...formData, twvExpiryDate: e.target.value})}
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="twvNotes">Notities</Label>
          <Textarea
            id="twvNotes"
            value={formData.twvNotes}
            onChange={(e) => setFormData({...formData, twvNotes: e.target.value})}
            placeholder="Voeg opmerkingen toe over deze TWV aanvraag..."
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuleren</Button>
        <Button 
          onClick={() => updateTWVMutation.mutate()} 
          disabled={updateTWVMutation.isPending}
        >
          {updateTWVMutation.isPending ? "Opslaan..." : "Opslaan"}
        </Button>
      </DialogFooter>
    </>
  );
};

// TWV overview pagina met vier aparte tabellen
const TWVNew = () => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
  
  // Gebruikers filteren op TWV-status
  const requiredUsers = users.filter(user => user.twvStatus === 'required').sort(
    (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  );
  
  const pendingUsers = users.filter(user => user.twvStatus === 'pending').sort(
    (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  );
  
  const approvedUsers = users.filter(user => user.twvStatus === 'approved').sort(
    (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  );
  
  const rejectedUsers = users.filter(user => user.twvStatus === 'rejected').sort(
    (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  );
  
  // Statistieken per status
  const statsCount = {
    required: requiredUsers.length,
    pending: pendingUsers.length,
    approved: approvedUsers.length,
    rejected: rejectedUsers.length,
    total: users.filter(user => user.needsTwv).length
  };
  
  // Tabel component voor hergebruik
  const TWVTable = ({ users }: { users: User[] }) => {
    if (users.length === 0) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">Geen medewerkers in deze categorie</h3>
          <p className="mt-1 text-sm text-gray-500">
            Er zijn geen medewerkers met deze TWV status.
          </p>
        </div>
      );
    }
    
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Geboortedatum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>
                  {user.birthDate ? 
                    format(new Date(user.birthDate), 'dd MMM yyyy', { locale: nl }) 
                    : '-'}
                </TableCell>
                <TableCell>
                  <TWVStatusBadge status={user.twvStatus} />
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
    );
  };
  
  if (isLoading) {
    return <div className="container mx-auto py-6">Laden...</div>;
  }
  
  if (error) {
    return <div className="container mx-auto py-6 text-red-500">Er is een fout opgetreden bij het laden van TWV gegevens</div>;
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
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
              <CardTitle className="text-sm font-medium">TWV aanvragen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsCount.required}</div>
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
              <div className="text-2xl font-bold">{statsCount.pending}</div>
              <p className="text-xs text-muted-foreground">
                Lopende TWV aanvragen
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Toegewezen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsCount.approved}</div>
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
              <div className="text-2xl font-bold">{statsCount.rejected}</div>
              <p className="text-xs text-muted-foreground">
                Afgekeurde TWV aanvragen
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Vier aparte secties voor de verschillende TWV statussen */}
        <div className="space-y-8">
          {/* 1. Aanvragen */}
          <Card>
            <CardHeader>
              <CardTitle>TWV aanvragen</CardTitle>
              <CardDescription>
                Medewerkers die een tewerkstellingsvergunning nodig hebben
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TWVTable users={requiredUsers} />
            </CardContent>
          </Card>
          
          {/* 2. In behandeling */}
          <Card>
            <CardHeader>
              <CardTitle>TWV in behandeling</CardTitle>
              <CardDescription>
                Lopende TWV aanvragen bij het UWV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TWVTable users={pendingUsers} />
            </CardContent>
          </Card>
          
          {/* 3. Toegewezen */}
          <Card>
            <CardHeader>
              <CardTitle>TWV toegewezen</CardTitle>
              <CardDescription>
                Medewerkers met een goedgekeurde tewerkstellingsvergunning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TWVTable users={approvedUsers} />
            </CardContent>
          </Card>
          
          {/* 4. Afgekeurd */}
          <Card>
            <CardHeader>
              <CardTitle>TWV afgekeurd</CardTitle>
              <CardDescription>
                Medewerkers met een afgewezen TWV aanvraag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TWVTable users={rejectedUsers} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TWVNew;