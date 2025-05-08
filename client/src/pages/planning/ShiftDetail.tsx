import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, Building2, Mail, Phone, Calendar, ArrowLeft, 
  Clock, Users, Briefcase, FileEdit, Euro, FileText,
  CheckCircle2, XCircle, AlertTriangle, UserCheck, UserPlus2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ShiftDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState("overzicht");

  // Shift data ophalen
  const { data: shift, isLoading: shiftLoading } = useQuery({
    queryKey: ['/api/planning/shifts', id],
  });

  // Locatie ophalen voor deze shift
  const { data: location, isLoading: locationLoading } = useQuery({
    queryKey: ['/api/planning/locations', shift?.locationId],
    queryFn: () => fetch(`/api/planning/locations/${shift?.locationId}`).then(res => res.json()),
    enabled: !!shift?.locationId
  });

  // Client ophalen voor deze shift/locatie
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['/api/planning/clients', location?.clientId],
    queryFn: () => fetch(`/api/planning/clients/${location?.clientId}`).then(res => res.json()),
    enabled: !!location?.clientId
  });

  // Toewijzingen ophalen voor deze shift
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/planning/shifts', id, 'assignments'],
    queryFn: () => fetch(`/api/planning/shifts/${id}/assignments`).then(res => res.json()).catch(() => []),
  });

  // Inschrijving voor een shift
  const applyForShift = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/planning/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: Number(id),
          userId: user?.id,
          status: 'pending'
        })
      });
      
      if (!response.ok) {
        throw new Error('Inschrijven voor dienst niet mogelijk');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/planning/shifts', id, 'assignments']
      });
      toast({
        title: "Succesvol ingeschreven",
        description: "Je bent ingeschreven voor deze dienst",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij inschrijven",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Inschrijving status wijzigen (voor admin)
  const updateAssignmentStatus = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: number, status: string }) => {
      const response = await fetch(`/api/planning/assignments/${assignmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Status wijzigen niet mogelijk');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/planning/shifts', id, 'assignments']
      });
      toast({
        title: "Status gewijzigd",
        description: "De status van de inschrijving is gewijzigd",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij wijzigen status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Check of gebruiker is ingeschreven
  const userAssignment = assignments?.find(a => a.userId === user?.id);
  
  // Bereken hoe vol een shift zit
  const calculateFillPercentage = (shift) => {
    if (!shift || !shift.requiredStaff) return 0;
    const assignedCount = shift.assignedStaff || 0;
    return Math.min(100, Math.round((assignedCount / shift.requiredStaff) * 100));
  };

  // Format euro bedrag
  const formatEuroAmount = (cents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(cents / 100);
  };

  // Render status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500">Open</Badge>;
      case "filled":
        return <Badge className="bg-blue-500">Ingevuld</Badge>;
      case "completed":
        return <Badge variant="outline">Afgerond</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Geannuleerd</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAssignmentStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Bevestigd</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">In behandeling</Badge>;
      case "rejected":
        return <Badge variant="destructive">Afgewezen</Badge>;
      case "cancelled":
        return <Badge variant="outline">Geannuleerd</Badge>;
      case "completed":
        return <Badge variant="secondary">Afgerond</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (shiftLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Dienst laden...</div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Dienst niet gevonden</div>
        <Button 
          variant="link" 
          onClick={() => navigate("/planning/shifts")}
          className="mx-auto mt-4 flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar diensten
        </Button>
      </div>
    );
  }

  // Bepaal of de dienst vol is en of de gebruiker kan inschrijven
  const isFull = (shift.assignedStaff || 0) >= shift.requiredStaff;
  const isUpcoming = new Date(shift.date) > new Date();
  const canApply = !userAssignment && isUpcoming && !isFull && shift.status === "open";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/planning/shifts")}
          className="flex items-center mb-4 p-0 h-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar diensten
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{shift.title}</h1>
            <div className="flex items-center mt-1">
              {getStatusBadge(shift.status)}
              <span className="ml-2 text-muted-foreground">
                {shift.serviceType}
              </span>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate(`/planning/shifts/edit/${id}`)}>
              <FileEdit className="mr-2 h-4 w-4" />
              Bewerken
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overzicht" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
          <TabsTrigger value="inschrijvingen">
            Inschrijvingen ({assignments?.length || 0}/{shift.requiredStaff})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overzicht">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>Informatie over deze dienst</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Datum</div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDate(new Date(shift.date))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Tijden</div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        {shift.startTime} - {shift.endTime} ({shift.hoursTotal} uur)
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Type dienst</div>
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                        {shift.serviceType}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Vergoeding</div>
                      <div className="flex items-center">
                        <Euro className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatEuroAmount(shift.hourlyRate)} per uur ({formatEuroAmount(shift.hourlyRate * shift.hoursTotal)} totaal)
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Beschrijving</div>
                    <p className="text-muted-foreground">
                      {shift.description || "Geen beschrijving beschikbaar"}
                    </p>

                    {shift.dress_code && (
                      <div className="mt-4">
                        <div className="text-sm text-muted-foreground mb-1">Dresscode</div>
                        <p>{shift.dress_code}</p>
                      </div>
                    )}

                    {shift.notes && (
                      <div className="mt-4">
                        <div className="text-sm text-muted-foreground mb-1">Speciale instructies</div>
                        <p>{shift.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              {canApply && (
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => applyForShift.mutate()}
                    disabled={applyForShift.isPending}
                  >
                    <UserPlus2 className="mr-2 h-4 w-4" />
                    Inschrijven voor deze dienst
                  </Button>
                </CardFooter>
              )}
              {userAssignment && (
                <CardFooter>
                  <Card className="w-full border-green-200 bg-green-50">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base text-green-800">
                          Je bent ingeschreven
                        </CardTitle>
                        {getAssignmentStatusBadge(userAssignment.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-green-800">
                        {userAssignment.status === "confirmed" 
                          ? "Je inschrijving is bevestigd." 
                          : userAssignment.status === "pending"
                          ? "Je inschrijving wordt nog beoordeeld."
                          : userAssignment.status === "rejected"
                          ? "Je inschrijving is afgewezen."
                          : "Status: " + userAssignment.status}
                      </p>
                    </CardContent>
                  </Card>
                </CardFooter>
              )}
              {!canApply && !userAssignment && (
                <CardFooter>
                  <Card className="w-full border-gray-200 bg-gray-50">
                    <CardContent className="pt-6">
                      <p className="text-sm text-center text-gray-500">
                        {isFull 
                          ? "Deze dienst is al volledig ingevuld." 
                          : !isUpcoming
                          ? "Deze dienst is al geweest."
                          : shift.status !== "open"
                          ? "Deze dienst staat niet meer open voor inschrijving."
                          : "Je kunt je niet inschrijven voor deze dienst."}
                      </p>
                    </CardContent>
                  </Card>
                </CardFooter>
              )}
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Locatie</CardTitle>
                </CardHeader>
                <CardContent>
                  {locationLoading ? (
                    <div className="text-center py-4">Locatie laden...</div>
                  ) : location ? (
                    <div className="space-y-4">
                      <div className="text-lg font-medium">{location.name}</div>
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          {location.address}<br />
                          {location.postalCode} {location.city}
                        </div>
                      </div>
                      
                      {location.contactName && (
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          {location.contactName}
                        </div>
                      )}
                      
                      {location.contactPhone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          {location.contactPhone}
                        </div>
                      )}
                      
                      {location.contactEmail && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="truncate">{location.contactEmail}</span>
                        </div>
                      )}

                      {clientLoading ? (
                        <div className="text-center py-2">Opdrachtgever laden...</div>
                      ) : client ? (
                        <div className="mt-6 pt-4 border-t">
                          <div className="text-sm text-muted-foreground mb-2">Opdrachtgever</div>
                          <div className="font-medium">{client.name}</div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Geen locatie toegewezen
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Voortgang</span>
                        <span>{shift.assignedStaff || 0}/{shift.requiredStaff} medewerkers</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${calculateFillPercentage(shift)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Beschikbare plekken</div>
                        <div className="font-medium">
                          {Math.max(0, shift.requiredStaff - (shift.assignedStaff || 0))} van {shift.requiredStaff}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div>{getStatusBadge(shift.status)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inschrijvingen">
          {assignmentsLoading ? (
            <div className="text-center py-12">Inschrijvingen laden...</div>
          ) : assignments && assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle>{assignment.user.firstName} {assignment.user.lastName}</CardTitle>
                      {getAssignmentStatusBadge(assignment.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {assignment.user.email}
                      </div>
                      {assignment.user.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          {assignment.user.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        TWV status: {assignment.user.needsTwv ? 
                          (assignment.user.twvStatus || "Onbekend") : "Niet nodig"}
                      </div>
                    </div>
                  </CardContent>
                  {isAdmin && assignment.status === "pending" && (
                    <CardFooter>
                      <div className="flex space-x-2 w-full">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => 
                            updateAssignmentStatus.mutate({
                              assignmentId: assignment.id,
                              status: "rejected"
                            })
                          }
                          disabled={updateAssignmentStatus.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Afwijzen
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => 
                            updateAssignmentStatus.mutate({
                              assignmentId: assignment.id,
                              status: "confirmed"
                            })
                          }
                          disabled={updateAssignmentStatus.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Bevestigen
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Er zijn nog geen inschrijvingen voor deze dienst.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}