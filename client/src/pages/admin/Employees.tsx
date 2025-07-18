import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, UserPlus, ArrowLeft, Eye } from 'lucide-react';
import { Link } from 'wouter';
import UserChallengeProgress from '@/components/admin/UserChallengeProgress';

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Kon medewerkers niet ophalen');
      }
      return response.json() as Promise<User[]>;
    },
  });

  const filteredEmployees = employees?.filter(
    (employee) =>
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Medewerkers</h1>
          <p className="text-muted-foreground">
            Beheer medewerkers en hun punten
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Medewerkers beheren</CardTitle>
          <CardDescription>
            Voeg medewerkers toe, bewerk hun gegevens of wijs punten toe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek medewerkers..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="shrink-0">
              <UserPlus className="mr-2 h-4 w-4" />
              Medewerker toevoegen
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-8">Medewerkers laden...</div>
      ) : filteredEmployees?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-lg font-medium">Geen medewerkers gevonden</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? `Geen resultaten voor "${searchQuery}"`
              : 'Voeg medewerkers toe om te beginnen'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Naam</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Punten</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEmployees?.map((employee) => (
                <tr key={employee.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                        {employee.profileImage ? (
                          <img
                            src={employee.profileImage}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-blue-100 text-lg font-medium text-blue-600">
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{employee.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={employee.role === 'admin' ? 'default' : 'outline'}>
                      {employee.role === 'admin' ? 'Admin' : 'Medewerker'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{employee.points}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      variant={employee.status === 'active' ? 'success' : 'destructive'}
                    >
                      {employee.status === 'active' ? 'Actief' : 'Inactief'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Bewerken
                      </Button>
                      <Button variant="outline" size="sm">
                        Punten toekennen
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(employee.id);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Challenges
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Challenge Progress Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Challenge Voortgang - {
                selectedUserId 
                  ? `${employees?.find(e => e.id === selectedUserId)?.firstName} ${employees?.find(e => e.id === selectedUserId)?.lastName}`
                  : 'Medewerker'
              }
            </DialogTitle>
            <DialogDescription>
              Beheer de challenge voortgang van deze medewerker. Handmatige challenges kunnen hier worden bijgewerkt.
            </DialogDescription>
          </DialogHeader>
          {selectedUserId && (
            <UserChallengeProgress userId={selectedUserId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}