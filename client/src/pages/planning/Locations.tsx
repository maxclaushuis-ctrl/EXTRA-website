import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { 
  MapPin, Building2, Phone, Mail, Plus, Search, FileEdit, Tag
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LocationsPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("");
  
  // Locaties en clients ophalen
  const { data: locations, isLoading } = useQuery({
    queryKey: ['/api/planning/locations'],
  });

  const { data: clients } = useQuery({
    queryKey: ['/api/planning/clients'],
  });

  // Filter locaties op basis van zoekopdracht en client
  const filteredLocations = locations?.filter(location => {
    const matchesSearch = 
      location.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClient = clientFilter ? location.clientId.toString() === clientFilter : true;
    
    return matchesSearch && matchesClient;
  }) || [];

  // Zoek client op basis van locatie
  const getClientName = (clientId: number) => {
    const client = clients?.find(c => c.id === clientId);
    return client ? client.name : "Onbekende opdrachtgever";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Locaties</h1>
        {isAdmin && (
          <Button onClick={() => navigate("/planning/locations/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Locatie
          </Button>
        )}
      </div>

      {/* Zoek en filter balk */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-10"
            placeholder="Zoek op naam, adres of stad..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-64">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter op opdrachtgever" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle opdrachtgevers</SelectItem>
              {clients?.map(client => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Locaties laden...</div>
      ) : filteredLocations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <Card key={location.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{location.name}</CardTitle>
                <CardDescription className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {location.city || "Amsterdam"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm mb-3">
                  <Tag className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>{getClientName(location.clientId)}</span>
                </div>
                
                <div className="mt-4 space-y-2">
                  {location.address && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mr-2" />
                      <span>{location.address}, {location.postalCode} {location.city}</span>
                    </div>
                  )}
                  {location.contactName && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 mr-2" />
                      <span>{location.contactName}</span>
                    </div>
                  )}
                  {location.contactPhone && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 mr-2" />
                      <span>{location.contactPhone}</span>
                    </div>
                  )}
                  {location.contactEmail && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 mr-2" />
                      <span className="truncate">{location.contactEmail}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/planning/clients/${location.clientId}?tab=locaties`)}
                  >
                    Opdrachtgever
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/planning/locations/edit/${location.id}`)}
                    >
                      <FileEdit className="h-4 w-4 mr-1" /> Bewerken
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Geen locaties gevonden die overeenkomen met je zoekopdracht.
        </div>
      )}
    </div>
  );
}