import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, Clock, MapPin, Euro, Briefcase, Search,
  CalendarClock, ChevronRight, CalendarCheck, XCircle, CheckCircle
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Toewijzingen ophalen
  const { data: myAssignments, isLoading } = useQuery({
    queryKey: ['/api/planning/assignments'],
    queryFn: () => fetch('/api/planning/assignments?userId=' + user?.id).then(res => res.json()),
  });

  // Alle toewijzingen ophalen (alleen voor admins)
  const { data: allAssignments, isLoading: allAssignmentsLoading } = useQuery({
    queryKey: ['/api/planning/assignments/all'],
    queryFn: () => fetch('/api/planning/assignments').then(res => res.json()),
    enabled: isAdmin
  });

  // Helper functie om te filteren op basis van tab
  const filterByTab = (assignments) => {
    if (!assignments) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return assignments.filter(assignment => {
      const shiftDate = new Date(assignment.shift.date);
      shiftDate.setHours(0, 0, 0, 0);
      
      if (activeTab === "upcoming") {
        return shiftDate >= today;
      } else if (activeTab === "past") {
        return shiftDate < today;
      } else { // all
        return true;
      }
    });
  };

  // Filter assignments verder op basis van zoekopdracht en filters
  const filterAssignments = (assignments) => {
    return assignments.filter(assignment => {
      // Zoekfilter
      const matchesSearch = 
        assignment.shift.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.shift.serviceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.shift.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Statusfilter
      const matchesStatus = statusFilter ? assignment.status === statusFilter : true;
      
      // Datumfilter
      let matchesDate = true;
      if (selectedDate) {
        const shiftDate = new Date(assignment.shift.date);
        const filterDate = new Date(selectedDate);
        
        matchesDate = 
          shiftDate.getDate() === filterDate.getDate() && 
          shiftDate.getMonth() === filterDate.getMonth() && 
          shiftDate.getFullYear() === filterDate.getFullYear();
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  // Sorteer assignments op datum
  const sortByDate = (assignments) => {
    return [...assignments].sort(
      (a, b) => new Date(a.shift.date).getTime() - new Date(b.shift.date).getTime()
    );
  };

  // Filter, sorteer en bereid weergave voor
  const filteredMyAssignments = sortByDate(
    filterAssignments(filterByTab(myAssignments || []))
  );
  
  const filteredAllAssignments = isAdmin ? sortByDate(
    filterAssignments(filterByTab(allAssignments || []))
  ) : [];

  // Assignment statussen voor het filter
  const statusOptions = [
    { value: 'pending', label: 'In behandeling' },
    { value: 'confirmed', label: 'Bevestigd' },
    { value: 'completed', label: 'Afgerond' },
    { value: 'cancelled', label: 'Geannuleerd' },
    { value: 'rejected', label: 'Afgewezen' }
  ];

  // Helper functies
  const getStatusBadge = (status: string) => {
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

  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  const formatEuro = (cents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(cents / 100);
  };
  
  const renderCheckInStatus = (assignment) => {
    if (assignment.checkedInAt && assignment.checkedOutAt) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span className="text-xs">Uitgecheckt om {new Date(assignment.checkedOutAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      );
    } else if (assignment.checkedInAt) {
      return (
        <div className="flex items-center text-blue-600">
          <CalendarCheck className="h-4 w-4 mr-1" />
          <span className="text-xs">Ingecheckt om {new Date(assignment.checkedInAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      );
    } else {
      const shiftDate = new Date(assignment.shift.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      shiftDate.setHours(0, 0, 0, 0);
      
      if (shiftDate.getTime() === today.getTime() && assignment.status === "confirmed") {
        return (
          <div className="flex items-center text-yellow-600">
            <CalendarClock className="h-4 w-4 mr-1" />
            <span className="text-xs">Check-in vereist</span>
          </div>
        );
      } else if (shiftDate < today) {
        return (
          <div className="flex items-center text-red-600">
            <XCircle className="h-4 w-4 mr-1" />
            <span className="text-xs">Niet ingecheckt</span>
          </div>
        );
      }
      return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mijn Diensten</h1>
        <Button onClick={() => navigate("/planning/shifts")}>
          Beschikbare Diensten
        </Button>
      </div>

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">Aankomend</TabsTrigger>
          <TabsTrigger value="past">Afgerond</TabsTrigger>
          <TabsTrigger value="all">Alle</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Zoek en filter balk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-10"
            placeholder="Zoek op titel, type dienst..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter op status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle statussen</SelectItem>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <DatePicker
            placeholder="Filter op datum"
            date={selectedDate}
            onSelect={setSelectedDate}
            className="w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Diensten laden...</div>
      ) : filteredMyAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMyAssignments.map((assignment) => (
            <Card key={assignment.id} className={
              assignment.status === "rejected" ? "border-red-200" : 
              assignment.status === "confirmed" ? "border-green-200" : ""
            }>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{assignment.shift.title}</CardTitle>
                  {getStatusBadge(assignment.status)}
                </div>
                <CardDescription>
                  {formatDate(new Date(assignment.shift.date))}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatTime(assignment.shift.startTime, assignment.shift.endTime)}
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    {assignment.shift.serviceType}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    {assignment.shift.location?.name || "Onbekende locatie"}
                  </div>
                  <div className="flex items-center">
                    <Euro className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatEuro(assignment.shift.hourlyRate)}
                  </div>
                </div>
                
                {renderCheckInStatus(assignment)}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={() => navigate(`/planning/shifts/${assignment.shift.id}`)}
                >
                  Details <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {activeTab === "upcoming" ? (
            <>
              Je hebt geen aankomende diensten.
              <div className="mt-4">
                <Button onClick={() => navigate("/planning/shifts")}>
                  Bekijk beschikbare diensten
                </Button>
              </div>
            </>
          ) : activeTab === "past" ? (
            "Je hebt geen afgeronde diensten."
          ) : (
            "Je hebt nog geen diensten."
          )}
        </div>
      )}

      {/* Admin view - alle assignments */}
      {isAdmin && (
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-bold mb-6">Alle Inschrijvingen</h2>
          
          {allAssignmentsLoading ? (
            <div className="text-center py-12">Inschrijvingen laden...</div>
          ) : filteredAllAssignments.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAllAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{assignment.shift.title}</CardTitle>
                        <CardDescription>
                          {formatDate(new Date(assignment.shift.date))} • {formatTime(assignment.shift.startTime, assignment.shift.endTime)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(assignment.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between mb-4">
                      <div>
                        <div className="font-medium">{assignment.user.firstName} {assignment.user.lastName}</div>
                        <div className="text-sm text-muted-foreground">{assignment.user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Dienst type</div>
                        <div>{assignment.shift.serviceType}</div>
                      </div>
                    </div>
                    
                    {renderCheckInStatus(assignment)}
                  </CardContent>
                  <CardFooter>
                    <div className="flex justify-between w-full">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/planning/shifts/${assignment.shift.id}`)}
                      >
                        Bekijk Dienst
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/employees/${assignment.user.id}`)}
                      >
                        Bekijk Medewerker
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Er zijn geen inschrijvingen gevonden die overeenkomen met je zoekopdracht.
            </div>
          )}
        </div>
      )}
    </div>
  );
}