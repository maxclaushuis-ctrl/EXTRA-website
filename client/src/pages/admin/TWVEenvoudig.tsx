import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileEdit } from "lucide-react";

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
      status: "required"
    },
    {
      id: 2,
      firstName: "Maria",
      lastName: "Silva",
      birthDate: "1991-08-22",
      status: "required"
    }
  ],
  pending: [
    {
      id: 3,
      firstName: "Viktor",
      lastName: "Popov",
      birthDate: "1988-11-05",
      status: "pending"
    },
    {
      id: 4,
      firstName: "Anita",
      lastName: "Cheng",
      birthDate: "1996-05-18",
      status: "pending"
    }
  ],
  approved: [
    {
      id: 5,
      firstName: "Diego",
      lastName: "Martinez",
      birthDate: "1990-02-10",
      status: "approved"
    },
    {
      id: 6,
      firstName: "Olga",
      lastName: "Petrov",
      birthDate: "1993-09-30",
      status: "approved"
    }
  ],
  rejected: [
    {
      id: 7,
      firstName: "Phuong",
      lastName: "Nguyen",
      birthDate: "1994-12-12",
      status: "rejected"
    },
    {
      id: 8,
      firstName: "Gabriel",
      lastName: "Santos",
      birthDate: "1997-06-23",
      status: "rejected"
    }
  ]
};

// Tabel component
const TWVTable = ({ users }: { users: any[] }) => {
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
                <TWVStatusBadge status={user.status} />
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

// TWV pagina met 4 aparte tabellen
const TWVEenvoudig = () => {
  // Statistieken
  const statsCount = {
    required: sampleData.required.length,
    pending: sampleData.pending.length,
    approved: sampleData.approved.length,
    rejected: sampleData.rejected.length
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">TWV Management</h1>
          <p className="text-gray-500">
            Beheer tewerkstellingsvergunningen voor buitenlandse medewerkers
          </p>
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
              <TWVTable users={sampleData.required} />
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
              <TWVTable users={sampleData.pending} />
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
              <TWVTable users={sampleData.approved} />
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
              <TWVTable users={sampleData.rejected} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TWVEenvoudig;