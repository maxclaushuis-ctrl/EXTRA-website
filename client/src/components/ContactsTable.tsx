import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@shared/schema';
import ContactDetailDialog from './ContactDetailDialog';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ContactsTableProps {
  onEditUser?: (userId: number) => void;
  onAssignPoints?: (userId: number) => void;
}

export default function ContactsTable({ onEditUser, onAssignPoints }: ContactsTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Kon gebruikers niet ophalen');
      }
      return response.json() as Promise<User[]>;
    },
  });

  // Functie om een gebruiker te bewerken
  const handleEditUser = (userId: number) => {
    if (onEditUser) {
      onEditUser(userId);
    } else {
      setSelectedUserId(userId);
      setIsDetailDialogOpen(true);
    }
  };

  // Functie om punten toe te kennen aan een gebruiker
  const handleAssignPoints = (userId: number) => {
    if (onAssignPoints) {
      onAssignPoints(userId);
    } else {
      const points = prompt('Hoeveel punten wil je toekennen?');
      if (points) {
        const pointsNumber = parseInt(points, 10);
        if (!isNaN(pointsNumber) && pointsNumber > 0) {
          // API aanroep om punten toe te kennen
          fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              points: pointsNumber,
              type: 'earned',
              description: 'Handmatig toegekend',
            }),
          })
            .then(response => {
              if (!response.ok) {
                throw new Error('Kon geen punten toekennen');
              }
              return response.json();
            })
            .then(() => {
              toast({
                title: 'Punten toegekend',
                description: `${pointsNumber} punten toegekend aan de gebruiker`,
              });
              // Gebruikersgegevens verversen
              queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            })
            .catch(error => {
              toast({
                title: 'Fout bij toekennen punten',
                description: error.message,
                variant: 'destructive',
              });
            });
        } else {
          toast({
            title: 'Ongeldige invoer',
            description: 'Vul een geldig positief getal in',
            variant: 'destructive',
          });
        }
      }
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };
  
  // Berekenen van paginering
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = users ? users.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = users ? Math.ceil(users.length / itemsPerPage) : 0;
  
  // Pagina wijzigen
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Naar eerste pagina
  const goToFirstPage = () => setCurrentPage(1);
  
  // Naar laatste pagina
  const goToLastPage = () => setCurrentPage(totalPages);
  
  // Naar vorige pagina
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Naar volgende pagina
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <>
      {/* Contact detail dialog */}
      <ContactDetailDialog 
        userId={selectedUserId} 
        isOpen={isDetailDialogOpen} 
        onClose={() => setIsDetailDialogOpen(false)} 
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="flex justify-center p-8">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <p className="mb-4 text-muted-foreground">Geen contacten gevonden</p>
              <Button variant="outline">Contact toevoegen</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  {currentItems.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                            <div className="flex h-full w-full items-center justify-center bg-blue-100 text-lg font-medium text-blue-600">
                              {getInitials(user.firstName, user.lastName)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                        } px-2 py-1 text-xs font-medium`}>
                          {user.role === 'admin' ? 'Admin' : 'Medewerker'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{user.points}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`rounded-full ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-yellow-100 text-yellow-600'
                        } px-2 py-1 text-xs font-medium`}>
                          {user.status === 'active' ? 'Actief' : 'Inactief'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditUser(user.id)}
                          >
                            Bewerken
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAssignPoints(user.id)}
                          >
                            Punten toekennen
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Paginering */}
              {totalPages > 0 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {users ? (
                      <>
                        Toont {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, users.length)} van {users.length} contacten
                      </>
                    ) : null}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Paginanummers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          // Als er 5 of minder pagina's zijn, toon ze allemaal
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // Als we aan het begin zijn
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // Als we aan het einde zijn
                          pageNum = totalPages - 4 + i;
                        } else {
                          // Ergens in het midden (huidig in het midden)
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => paginate(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}