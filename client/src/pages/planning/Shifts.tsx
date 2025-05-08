import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  CalendarDays, Clock, MapPin, Users, Euro, Calendar, 
  Briefcase, Plus, Search, FileEdit, CalendarCheck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";

export default function ShiftsPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Diensten, locaties ophalen
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['/api/planning/shifts'],
  });

  const { data: locations } = useQuery({
    queryKey: ['/api/planning/locations'],
  });

  // Filter shifts op basis van zoekopdracht en filters
  const filteredShifts = shifts?.filter(shift => {
    const matchesSearch = 
      shift.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.serviceType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? shift.status === statusFilter : true;
    const matchesServiceType = serviceTypeFilter ? shift.serviceType === serviceTypeFilter : true;
    
    // Datum filter
    let matchesDate = true;
    if (selectedDate) {
      const shiftDate = new Date(shift.date);
      const filterDate = new Date(selectedDate);
      
      matchesDate = 
        shiftDate.getDate() === filterDate.getDate() && 
        shiftDate.getMonth() === filterDate.getMonth() && 
        shiftDate.getFullYear() === filterDate.getFullYear();
    }
    
    return matchesSearch && matchesStatus && matchesServiceType && matchesDate;
  }) || [];

  // Sorteren op datum (oplopend)
  const sortedShifts = [...filteredShifts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Unieke service types voor filter
  const serviceTypes = shifts ? 
    [...new Set(shifts.map(shift => shift.serviceType))] : [];

  // Helper functies
  const getLocationName = (locationId: number | null) => {
    if (!locationId) return "Onbekende locatie";
    const location = locations?.find(l => l.id === locationId);
    return location ? location.name : "Onbekende locatie";
  };

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

  const formatDutchMoney = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount / 100); // Bedragen zijn in centen opgeslagen
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Diensten</h1>
        {isAdmin && (
          <Button onClick={() => navigate("/planning/shifts/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Dienst
          </Button>
        )}
      </div>

      {/* Zoek en filter balk */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-10"
            placeholder="Zoek op titel, beschrijving..." 
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
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="filled">Ingevuld</SelectItem>
              <SelectItem value="completed">Afgerond</SelectItem>
              <SelectItem value="cancelled">Geannuleerd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter op type dienst" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle diensten</SelectItem>
              {serviceTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
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

      {/* Snelle filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button 
          variant={!selectedDate && !statusFilter && !serviceTypeFilter ? "default" : "outline"} 
          size="sm"
          onClick={() => {
            setSelectedDate(undefined);
            setStatusFilter("");
            setServiceTypeFilter("");
          }}
        >
          Alle diensten
        </Button>
        <Button 
          variant={!selectedDate && statusFilter === "open" ? "default" : "outline"} 
          size="sm"
          onClick={() => {
            setSelectedDate(undefined);
            setStatusFilter("open");
          }}
        >
          Open diensten
        </Button>
        <Button 
          variant={
            (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const selectedToday = selectedDate && 
                selectedDate.getDate() === today.getDate() &&
                selectedDate.getMonth() === today.getMonth() &&
                selectedDate.getFullYear() === today.getFullYear();
              return selectedToday ? "default" : "outline";
            })()
          } 
          size="sm"
          onClick={() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            setSelectedDate(today);
          }}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Vandaag
        </Button>
        <Button 
          variant={
            (() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(0, 0, 0, 0);
              const selectedTomorrow = selectedDate && 
                selectedDate.getDate() === tomorrow.getDate() &&
                selectedDate.getMonth() === tomorrow.getMonth() &&
                selectedDate.getFullYear() === tomorrow.getFullYear();
              return selectedTomorrow ? "default" : "outline";
            })()
          } 
          size="sm"
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            setSelectedDate(tomorrow);
          }}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Morgen
        </Button>
        {serviceTypes.slice(0, 3).map(type => (
          <Button 
            key={type}
            variant={serviceTypeFilter === type ? "default" : "outline"} 
            size="sm"
            onClick={() => setServiceTypeFilter(type)}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            {type}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12">Diensten laden...</div>
      ) : sortedShifts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedShifts.map((shift) => {
            const shiftDate = new Date(shift.date);
            const isToday = new Date().toDateString() === shiftDate.toDateString();
            const isTomorrow = 
              new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === 
              shiftDate.toDateString();
            
            return (
              <Card key={shift.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="mr-2">{shift.title}</CardTitle>
                    {getStatusBadge(shift.status)}
                  </div>
                  <CardDescription>
                    <div className="flex items-center">
                      {isToday ? (
                        <Badge variant="secondary" className="mr-2">Vandaag</Badge>
                      ) : isTomorrow ? (
                        <Badge variant="outline" className="mr-2">Morgen</Badge>
                      ) : null}
                      <CalendarCheck className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {formatDate(shiftDate)}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {shift.description || "Geen beschrijving beschikbaar"}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {shift.startTime} - {shift.endTime}
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                      {shift.serviceType}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {getLocationName(shift.locationId)}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      {shift.assignedStaff || 0}/{shift.requiredStaff}
                    </div>
                    <div className="flex items-center col-span-2">
                      <Euro className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatDutchMoney(shift.hourlyRate)} per uur
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex justify-between w-full">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/planning/shifts/${shift.id}`)}
                    >
                      Details
                    </Button>
                    {isAdmin && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/planning/shifts/edit/${shift.id}`)}
                      >
                        <FileEdit className="h-4 w-4 mr-1" /> Bewerken
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Geen diensten gevonden die overeenkomen met je zoekopdracht.
        </div>
      )}
    </div>
  );
}