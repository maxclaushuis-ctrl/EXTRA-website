import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Building, Calendar, Clock, MapPin, Users, Briefcase, 
  ChevronRight, CalendarDays, TrendingUp, CheckCircle2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Queries
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['/api/planning/shifts'],
  });

  const { data: myAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/planning/assignments'],
    queryFn: () => fetch('/api/planning/assignments?userId=' + user?.id).then(res => res.json()),
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/planning/clients'],
  });

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/planning/locations'],
  });

  // Statistics berekenen
  const stats = {
    totalClients: clients?.length || 0,
    totalLocations: locations?.length || 0,
    totalShifts: shifts?.length || 0,
    openShifts: shifts?.filter(s => s.status === "open").length || 0,
    assignedShifts: myAssignments?.filter(a => a.status === "confirmed").length || 0,
    upcomingShifts: 0,
    todayShifts: 0
  };

  if (shifts) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    stats.todayShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate.getTime() === today.getTime();
    }).length;
    
    stats.upcomingShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate.getTime() > today.getTime();
    }).length;
  }

  // Filteren op datum indien geselecteerd
  const getFilteredShifts = () => {
    if (!shifts) return [];
    
    let filteredShifts = [...shifts];
    
    if (selectedDate) {
      filteredShifts = filteredShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        const filterDate = new Date(selectedDate);
        
        return (
          shiftDate.getDate() === filterDate.getDate() && 
          shiftDate.getMonth() === filterDate.getMonth() && 
          shiftDate.getFullYear() === filterDate.getFullYear()
        );
      });
    } else {
      // Als geen datum is geselecteerd, toon alleen toekomstige diensten
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filteredShifts = filteredShifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        shiftDate.setHours(0, 0, 0, 0);
        return shiftDate.getTime() >= today.getTime();
      });
    }
    
    // Sorteer op datum
    filteredShifts.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return filteredShifts.slice(0, 6); // Toon maximaal 6 diensten
  };

  // Bepaal of een dienst vandaag is
  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Format voor tijd weergave
  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  // Helper functie voor locatienaam
  const getLocationName = (locationId: number) => {
    if (!locations) return "Onbekende locatie";
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : "Onbekende locatie";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Planning Dashboard</h1>
          <p className="text-muted-foreground">
            Overzicht van diensten, locaties en inschrijvingen
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <DatePicker
            placeholder="Filter op datum"
            date={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>
      </div>

      {/* Statistieken */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CalendarDays className="h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-full mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Diensten Vandaag</p>
                <h3 className="text-2xl font-bold">{stats.todayShifts}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500 p-1.5 bg-purple-500/10 rounded-full mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Komende Diensten</p>
                <h3 className="text-2xl font-bold">{stats.upcomingShifts}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 p-1.5 bg-green-500/10 rounded-full mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Mijn Inschrijvingen</p>
                <h3 className="text-2xl font-bold">{stats.assignedShifts}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-500 p-1.5 bg-blue-500/10 rounded-full mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Opdrachtgevers</p>
                <h3 className="text-2xl font-bold">{stats.totalClients}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Komende Diensten</TabsTrigger>
          <TabsTrigger value="myshifts">Mijn Diensten</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {shiftsLoading ? (
            <div className="text-center py-12">Diensten laden...</div>
          ) : getFilteredShifts().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredShifts().map((shift) => (
                <Card key={shift.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{shift.title}</CardTitle>
                      {isToday(shift.date) && (
                        <Badge className="bg-blue-500">Vandaag</Badge>
                      )}
                    </div>
                    <CardDescription>{formatDate(new Date(shift.date))}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatTime(shift.startTime, shift.endTime)}
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                        {shift.serviceType}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        {getLocationName(shift.locationId)}
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        {shift.assignedStaff || 0}/{shift.requiredStaff}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full flex items-center justify-center"
                      onClick={() => navigate(`/planning/shifts/${shift.id}`)}
                    >
                      Details <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {selectedDate ? 
                `Geen diensten gevonden voor ${formatDate(selectedDate)}.` : 
                "Geen komende diensten gevonden."
              }
              <div className="mt-4">
                <Button onClick={() => navigate("/planning/shifts")}>
                  Bekijk alle diensten
                </Button>
              </div>
            </div>
          )}
          
          {getFilteredShifts().length > 0 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => navigate("/planning/shifts")}
              >
                Bekijk alle diensten
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="myshifts">
          {assignmentsLoading ? (
            <div className="text-center py-12">Inschrijvingen laden...</div>
          ) : myAssignments && myAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAssignments
                .filter(a => a.status === "confirmed")
                .slice(0, 6)
                .map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{assignment.shift.title}</CardTitle>
                        {isToday(assignment.shift.date) && (
                          <Badge className="bg-green-500">Vandaag</Badge>
                        )}
                      </div>
                      <CardDescription>{formatDate(new Date(assignment.shift.date))}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatTime(assignment.shift.startTime, assignment.shift.endTime)}
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                          {assignment.shift.serviceType}
                        </div>
                        <div className="flex items-center col-span-2">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                          {assignment.shift.location?.name || "Onbekende locatie"}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full flex items-center justify-center"
                        onClick={() => navigate(`/planning/shifts/${assignment.shift.id}`)}
                      >
                        Details <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Je hebt nog geen bevestigde inschrijvingen.
              <div className="mt-4">
                <Button onClick={() => navigate("/planning/shifts")}>
                  Bekijk beschikbare diensten
                </Button>
              </div>
            </div>
          )}
          
          {myAssignments && myAssignments.length > 0 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => navigate("/planning/assignments")}
              >
                Bekijk al mijn diensten
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Opdrachtgevers en Locaties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recente Opdrachtgevers</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/planning/clients")}
              >
                Bekijk alle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="text-center py-4">Opdrachtgevers laden...</div>
            ) : clients && clients.length > 0 ? (
              <div className="space-y-4">
                {clients.slice(0, 5).map((client) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <Building className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.city || "Amsterdam"}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/planning/clients/${client.id}`)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Geen opdrachtgevers gevonden.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recente Locaties</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/planning/locations")}
              >
                Bekijk alle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {locationsLoading ? (
              <div className="text-center py-4">Locaties laden...</div>
            ) : locations && locations.length > 0 ? (
              <div className="space-y-4">
                {locations.slice(0, 5).map((location) => (
                  <div key={location.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                        <MapPin className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {location.city || "Amsterdam"}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/planning/clients/${location.clientId}?tab=locaties`)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Geen locaties gevonden.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}