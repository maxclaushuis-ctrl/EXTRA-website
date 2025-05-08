import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MapPin, Building2, Phone, Mail, Plus, Search, FileEdit, Shield, Calendar 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ClientsPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  
  // Clients ophalen
  const { data: clients, isLoading } = useQuery({
    queryKey: ['/api/planning/clients'],
  });

  // Filter clients op basis van zoekopdracht
  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.city?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Opdrachtgevers</h1>
        {isAdmin && (
          <Button onClick={() => navigate("/planning/clients/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Opdrachtgever
          </Button>
        )}
      </div>

      {/* Zoekbalk */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10"
          placeholder="Zoek op naam, beschrijving, of plaats..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Opdrachtgevers laden...</div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{client.name}</CardTitle>
                <CardDescription className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {client.city || "Amsterdam"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {client.description || "Geen beschrijving beschikbaar"}
                </p>
                
                <div className="mt-4 space-y-2">
                  {client.primaryContactName && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 mr-2" />
                      <span>{client.primaryContactName}</span>
                    </div>
                  )}
                  {client.primaryContactPhone && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 mr-2" />
                      <span>{client.primaryContactPhone}</span>
                    </div>
                  )}
                  {client.primaryContactEmail && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 mr-2" />
                      <span className="truncate">{client.primaryContactEmail}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/planning/clients/${client.id}`)}
                  >
                    Details
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="ghost"
                      onClick={() => navigate(`/planning/clients/edit/${client.id}`)}
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
          {searchQuery ? 
            "Geen opdrachtgevers gevonden die overeenkomen met je zoekopdracht." :
            "Er zijn nog geen opdrachtgevers toegevoegd."
          }
          {isAdmin && (
            <div className="mt-4">
              <Button onClick={() => navigate("/planning/clients/new")}>
                Opdrachtgever toevoegen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}