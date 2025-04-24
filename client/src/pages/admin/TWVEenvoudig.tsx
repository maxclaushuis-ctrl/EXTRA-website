import { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileEdit, ExternalLink, FileText } from "lucide-react";

// Status badge component
const TWVStatusBadge = ({ status }: { status: string }) => {
  let color;
  let label;
  
  switch (status) {
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

// Voorbeeld data voor de tabellen
const sampleData = {
  required: [
    {
      id: 1,
      firstName: "Ahmed",
      lastName: "Yilmaz",
      birthDate: "1995-03-15",
      status: "required",
      notitie: "Nieuwe medewerker, TWV moet nog worden aangevraagd"
    },
    {
      id: 2,
      firstName: "Maria",
      lastName: "Silva",
      birthDate: "1991-08-22",
      status: "required",
      notitie: "Heeft eerder in Nederland gewerkt, diploma papieren toevoegen"
    }
  ],
  action_required: [
    {
      id: 9,
      firstName: "Cheng",
      lastName: "Wei",
      birthDate: "1992-07-25",
      status: "pending",
      notitie: "Document niet compleet",
      actie: "Contact opnemen voor BSN nummer"
    },
    {
      id: 10,
      firstName: "Fatima",
      lastName: "Al-Farsi",
      birthDate: "1988-09-11",
      status: "pending",
      notitie: "Ontbrekende pasfoto",
      actie: "Pasfoto opvragen"
    }
  ],
  pending: [
    {
      id: 3,
      firstName: "Viktor",
      lastName: "Popov",
      birthDate: "1988-11-05",
      status: "pending",
      notitie: "Aanvraag ingediend op 09-04-2024"
    },
    {
      id: 4,
      firstName: "Anita",
      lastName: "Cheng",
      birthDate: "1996-05-18",
      status: "pending",
      notitie: "Aanvraag ingediend op 12-04-2024"
    }
  ],
  approved: [
    {
      id: 5,
      firstName: "Diego",
      lastName: "Martinez",
      birthDate: "1990-02-10",
      status: "approved",
      notitie: "Alle documenten in orde",
      twvStartDate: "2024-03-01",
      twvEndDate: "2025-02-28"
    },
    {
      id: 6,
      firstName: "Olga",
      lastName: "Petrov",
      birthDate: "1993-09-30",
      status: "approved",
      notitie: "Verlengd voor een jaar",
      twvStartDate: "2024-02-15",
      twvEndDate: "2025-02-14"
    }
  ],
  rejected: [
    {
      id: 7,
      firstName: "Phuong",
      lastName: "Nguyen",
      birthDate: "1994-12-12",
      status: "rejected",
      notitie: "Afgewezen op 02-04-2024",
      reden: "Onvoldoende documentatie, ontbrekende verblijfsvergunning"
    },
    {
      id: 8,
      firstName: "Gabriel",
      lastName: "Santos",
      birthDate: "1997-06-23",
      status: "rejected",
      notitie: "Afgewezen op 10-04-2024",
      reden: "Werkgeschiedenis komt niet overeen met de aanvraag"
    }
  ]
};

// Notitie Dialog
const NotitieDialog = ({ notitie }: { notitie: string }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1" />
          <span className="sr-only">Notitie bekijken</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notitie</DialogTitle>
          <DialogDescription>
            Informatie over deze medewerker en TWV status
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 border rounded-md bg-slate-50">
          <p>{notitie}</p>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary">
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Standaard tabel component met alleen notitie veld
const TWVTableBasic = ({ users }: { users: any[] }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead>Geboortedatum</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notitie</TableHead>
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
                <TWVStatusBadge status={user.status} />
              </TableCell>
              <TableCell>
                <NotitieDialog notitie={user.notitie || ""} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">
                  <FileEdit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Tabel voor TWV aanvragen met handeling vereist (extra actie veld)
const TWVTableActionRequired = ({ users }: { users: any[] }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead>Geboortedatum</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actie</TableHead>
            <TableHead>Notitie</TableHead>
            <TableHead className="text-right">Bewerken</TableHead>
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
                <TWVStatusBadge status={user.status} />
              </TableCell>
              <TableCell className="font-medium text-red-600">
                {user.actie}
              </TableCell>
              <TableCell>
                <NotitieDialog notitie={user.notitie || ""} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">
                  <FileEdit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Tabel voor TWV toegewezen met begin- en einddatum
const TWVTableApproved = ({ users }: { users: any[] }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead>Geboortedatum</TableHead>
            <TableHead>TWV Begin</TableHead>
            <TableHead>TWV Einde</TableHead>
            <TableHead>Notitie</TableHead>
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
                {user.twvStartDate ?
                  format(new Date(user.twvStartDate), 'dd MMM yyyy', { locale: nl })
                  : '-'}
              </TableCell>
              <TableCell>
                {user.twvEndDate ?
                  format(new Date(user.twvEndDate), 'dd MMM yyyy', { locale: nl })
                  : '-'}
              </TableCell>
              <TableCell>
                <NotitieDialog notitie={user.notitie || ""} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">
                  <FileEdit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Tabel voor TWV afgekeurd met reden
const TWVTableRejected = ({ users }: { users: any[] }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Naam</TableHead>
            <TableHead>Geboortedatum</TableHead>
            <TableHead>Reden afkeuring</TableHead>
            <TableHead>Notitie</TableHead>
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
              <TableCell className="max-w-xs">
                <span className="line-clamp-2">{user.reden}</span>
              </TableCell>
              <TableCell>
                <NotitieDialog notitie={user.notitie || ""} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">
                  <FileEdit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// TWV pagina met 5 aparte tabellen
const TWVEenvoudig = () => {
  // Statistieken
  const statsCount = {
    required: sampleData.required.length,
    action_required: sampleData.action_required.length,
    pending: sampleData.pending.length,
    approved: sampleData.approved.length,
    rejected: sampleData.rejected.length
  };
  
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
          <a 
            href="https://www.uwv.nl/nl/werkvergunning/twv-aanvragen" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center bg-[#1a77c2] hover:bg-[#0d5f9a] text-white px-4 py-2 rounded-md"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Naar UWV-portaal
          </a>
        </div>
        
        {/* Statistieken */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              <CardTitle className="text-sm font-medium">Handeling vereist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsCount.action_required}</div>
              <p className="text-xs text-muted-foreground">
                TWV's die actie nodig hebben
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
        
        {/* Vijf aparte secties voor de verschillende TWV statussen */}
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
              <TWVTableBasic users={sampleData.required} />
            </CardContent>
            <CardFooter>
              <a 
                href="https://www.uwv.nl/nl/werkvergunning/twv-aanvragen" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                Ga naar UWV-portaal om vergunningen aan te vragen
              </a>
            </CardFooter>
          </Card>
          
          {/* 2. Handeling vereist */}
          <Card>
            <CardHeader>
              <CardTitle>TWV handeling vereist</CardTitle>
              <CardDescription>
                Medewerkers waarbij actie nodig is voor hun TWV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TWVTableActionRequired users={sampleData.action_required} />
            </CardContent>
          </Card>
          
          {/* 3. In behandeling */}
          <Card>
            <CardHeader>
              <CardTitle>TWV in behandeling</CardTitle>
              <CardDescription>
                Lopende TWV aanvragen bij het UWV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TWVTableBasic users={sampleData.pending} />
            </CardContent>
          </Card>
          
          {/* 4. Toegewezen */}
          <Card>
            <CardHeader>
              <CardTitle>TWV toegewezen</CardTitle>
              <CardDescription>
                Medewerkers met een goedgekeurde tewerkstellingsvergunning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TWVTableApproved users={sampleData.approved} />
            </CardContent>
          </Card>
          
          {/* 5. Afgekeurd */}
          <Card>
            <CardHeader>
              <CardTitle>TWV afgekeurd</CardTitle>
              <CardDescription>
                Medewerkers met een afgewezen TWV aanvraag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TWVTableRejected users={sampleData.rejected} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TWVEenvoudig;