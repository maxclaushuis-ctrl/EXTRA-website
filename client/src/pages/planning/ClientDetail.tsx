import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, Building2, Mail, Phone, Calendar, ArrowLeft, 
  Clock, Users, Briefcase, FileEdit, MapPinned
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";

export default function ClientDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState("overzicht");

  // Client data ophalen
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['/api/planning/clients', id],
  });

  // Locaties ophalen voor deze client
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/planning/clients', id, 'locations'],
    queryFn: () => fetch(`/api/planning/clients/${id}/locations`).then(res => res.json()),
  });

  // Diensten ophalen voor deze client
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['/api/planning/shifts'],
    select: (shifts) => shifts.filter(shift => {
      // Filter op locaties van deze client
      if (!locations) return false;
      const locationIds = locations.map(loc => loc.id);
      return locationIds.includes(shift.locationId);
    }),
    enabled: !!locations
  });

  // Helper functie voor opmaak
  const renderField = (label: string, value: string | null | undefined, icon: React.ReactNode) => {
    return (
      <div className="flex items-center mb-3">
        <div className="mr-3 text-gray-400">{icon}</div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div>{value || "Niet beschikbaar"}</div>
        </div>
      </div>
    );
  };

  if (clientLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Gegevens laden...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Opdrachtgever niet gevonden</div>
        <Button 
          variant="link" 
          onClick={() => navigate("/planning/clients")}
          className="mx-auto mt-4 flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar opdrachtgevers
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/planning/clients")}
          className="flex items-center mb-4 p-0 h-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar opdrachtgevers
        </Button>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          {isAdmin && (
            <Button onClick={() => navigate(`/planning/clients/edit/${id}`)}>
              <FileEdit className="mr-2 h-4 w-4" />
              Bewerken
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overzicht" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
          <TabsTrigger value="locaties">Locaties ({locations?.length || 0})</TabsTrigger>
          <TabsTrigger value="diensten">Diensten ({shifts?.length || 0})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overzicht">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Informatie</CardTitle>
                <CardDescription>Contactgegevens en algemene informatie</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {renderField("Adres", `${client.address || ""}, ${client.postalCode || ""} ${client.city || ""}`, <MapPin className="h-5 w-5" />)}
                    {renderField("Contactpersoon", client.primaryContactName, <Building2 className="h-5 w-5" />)}
                    {renderField("E-mail", client.primaryContactEmail, <Mail className="h-5 w-5" />)}
                    {renderField("Telefoonnummer", client.primaryContactPhone, <Phone className="h-5 w-5" />)}
                  </div>
                  <div>
                    {client.createdAt && renderField("Klant sinds", formatDate(new Date(client.createdAt)), <Calendar className="h-5 w-5" />)}
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Beschrijving</h3>
                      <p className="text-muted-foreground">
                        {client.description || "Geen beschrijving beschikbaar"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Samenvatting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center">
                      <MapPinned className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Locaties</span>
                    </div>
                    <span className="font-medium">{locations?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Actieve diensten</span>
                    </div>
                    <span className="font-medium">{shifts?.filter(s => new Date(s.date) >= new Date()).length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Totaal uren</span>
                    </div>
                    <span className="font-medium">
                      {shifts?.reduce((total, shift) => total + (shift.hoursTotal || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Benodigde medewerkers</span>
                    </div>
                    <span className="font-medium">
                      {shifts?.reduce((total, shift) => total + (shift.requiredStaff || 0), 0) || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locaties">
          <div>
            {locationsLoading ? (
              <div className="text-center py-12">Locaties laden...</div>
            ) : locations && locations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locations.map((location) => (
                  <Card key={location.id}>
                    <CardHeader>
                      <CardTitle>{location.name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {location.city || "Amsterdam"}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {location.address && (
                          <div className="text-sm">
                            <div className="text-muted-foreground">Adres</div>
                            <div>{location.address}, {location.postalCode} {location.city}</div>
                          </div>
                        )}
                        {location.contactName && (
                          <div className="text-sm">
                            <div className="text-muted-foreground">Contactpersoon</div>
                            <div>{location.contactName}</div>
                          </div>
                        )}
                        {location.contactPhone && (
                          <div className="text-sm">
                            <div className="text-muted-foreground">Telefoonnummer</div>
                            <div>{location.contactPhone}</div>
                          </div>
                        )}
                        {location.contactEmail && (
                          <div className="text-sm">
                            <div className="text-muted-foreground">E-mail</div>
                            <div className="truncate">{location.contactEmail}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Deze opdrachtgever heeft nog geen locaties.
                {isAdmin && (
                  <div className="mt-4">
                    <Button 
                      onClick={() => navigate(`/planning/locations/new?clientId=${id}`)}
                    >
                      Locatie toevoegen
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="diensten">
          <div>
            {shiftsLoading ? (
              <div className="text-center py-12">Diensten laden...</div>
            ) : shifts && shifts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shifts
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((shift) => (
                    <Card key={shift.id}>
                      <CardHeader>
                        <div className="flex justify-between">
                          <CardTitle>{shift.title}</CardTitle>
                          <Button 
                            variant="ghost" 
                            className="h-8 p-0" 
                            onClick={() => navigate(`/planning/shifts/${shift.id}`)}
                          >
                            Details
                          </Button>
                        </div>
                        <CardDescription>
                          {formatDate(new Date(shift.date))} • {shift.startTime} - {shift.endTime}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div className="flex items-center">
                            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                            {shift.serviceType}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            {shift.hoursTotal} uur
                          </div>
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                            {shift.assignedStaff || 0}/{shift.requiredStaff} medewerkers
                          </div>
                          <div className="flex items-center">
                            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                            {locations?.find(l => l.id === shift.locationId)?.name || "Onbekende locatie"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Er zijn geen diensten gevonden voor deze opdrachtgever.
                {isAdmin && (
                  <div className="mt-4">
                    <Button 
                      onClick={() => navigate(`/planning/shifts/new?clientId=${id}`)}
                    >
                      Dienst toevoegen
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}