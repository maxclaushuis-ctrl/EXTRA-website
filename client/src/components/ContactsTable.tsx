import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@shared/schema';
import ContactDetailDialog from './ContactDetailDialog';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { debounce } from '@/lib/utils';

interface ContactsTableProps {
  onEditUser?: (userId: number) => void;
  onAssignPoints?: (userId: number) => void;
}

export default function ContactsTable({ onEditUser, onAssignPoints }: ContactsTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Kon gebruikers niet ophalen');
      }
      return response.json() as Promise<User[]>;
    },
    // Regelmatig de gebruikerslijst vernieuwen om wijzigingen te zien
    refetchInterval: 5000, // Elke 5 seconden vernieuwen
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
      const points = prompt('Hoeveel punten wil je toekennen? (gebruik - voor minpunten)');
      if (points) {
        const pointsNumber = parseInt(points, 10);
        if (!isNaN(pointsNumber) && pointsNumber !== 0) {
          // API aanroep om punten toe te kennen
          fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              amount: pointsNumber,
              type: 'earned',
              description: 'Handmatig toegekend',
              source: 'admin',
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
            description: 'Vul een geldig getal in (niet nul)',
            variant: 'destructive',
          });
        }
      }
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };
  
  // Zoekfunctie
  const searchUsers = useRef(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults(null);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error('Zoeken mislukt');
        }
        
        const data = await response.json();
        setSearchResults(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Zoeken mislukt:', error);
        toast({
          title: 'Zoeken mislukt',
          description: 'Er is een fout opgetreden bij het zoeken van contacten',
          variant: 'destructive',
        });
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300)
  ).current;
  
  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      searchUsers(query);
    } else {
      setSearchResults(null);
      setShowSuggestions(false);
    }
  };
  
  // Handle search suggestion click
  const handleSuggestionClick = (user: User) => {
    setSearchQuery('');
    setSearchResults(null);
    setShowSuggestions(false);
    setSelectedUserId(user.id);
    setIsDetailDialogOpen(true);
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Click outside handler to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Bepalen welke gebruikers te tonen
  const displayUsers = searchResults || users;
  
  // Berekenen van paginering
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayUsers ? displayUsers.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = displayUsers ? Math.ceil(displayUsers.length / itemsPerPage) : 0;
  
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
              {/* Zoekbalk */}
              <div className="p-4 relative">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Zoek contacten..."
                    className="pl-10 pr-10"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={handleClearSearch}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                  
                  {/* Zoeksuggesties */}
                  {showSuggestions && searchResults && searchResults.length > 0 && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute mt-1 w-full max-h-60 overflow-auto rounded-md bg-popover shadow-md z-10"
                    >
                      <ul className="py-1 text-sm">
                        {searchResults.slice(0, 5).map((user) => (
                          <li 
                            key={user.id}
                            className="px-4 py-2 hover:bg-muted cursor-pointer"
                            onClick={() => handleSuggestionClick(user)}
                          >
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-blue-100">
                                <div className="flex h-full w-full items-center justify-center text-sm font-medium text-blue-600">
                                  {getInitials(user.firstName, user.lastName)}
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                        {searchResults.length > 5 && (
                          <li className="px-4 py-2 text-center text-xs text-muted-foreground">
                            + {searchResults.length - 5} meer resultaten
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                
                {searchResults && searchResults.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchResults.length} resultaten gevonden
                  </p>
                )}
                
                {isSearching && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Zoeken...</span>
                  </div>
                )}
              </div>
              
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Naam</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Geboortedatum</th>
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
                        {user.birthDate ? new Date(user.birthDate).toLocaleDateString('nl-NL') : '-'}
                      </td>
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