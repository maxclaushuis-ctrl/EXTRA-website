import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  ArrowDown, 
  ArrowUp, 
  CalendarIcon, 
  Download, 
  Filter, 
  Gift, 
  Plus, 
  SearchIcon, 
  User,
  Check,
  Clock,
  Truck,
  XCircle,
  PackageOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PointTransaction, Redemption } from '@shared/schema';

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('points');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all point transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Kon transacties niet ophalen');
      }
      return response.json() as Promise<PointTransaction[]>;
    },
  });

  // Fetch all redemptions (reward transactions)
  const { data: redemptions, isLoading: redemptionsLoading } = useQuery({
    queryKey: ['/api/redemptions'],
    queryFn: async () => {
      const response = await fetch('/api/redemptions');
      if (!response.ok) {
        throw new Error('Kon verzilveringen niet ophalen');
      }
      return response.json() as Promise<Redemption[]>;
    },
  });

  // Fetch all users for reference
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Kon gebruikers niet ophalen');
      }
      return response.json();
    },
  });

  // Fetch all rewards for reference
  const { data: rewards } = useQuery({
    queryKey: ['/api/rewards'],
    queryFn: async () => {
      const response = await fetch('/api/rewards');
      if (!response.ok) {
        throw new Error('Kon beloningen niet ophalen');
      }
      return response.json();
    },
  });

  // Filter transactions based on search query
  const filteredTransactions = transactions?.filter(transaction => {
    if (!searchQuery) return true;
    
    const user = users?.find((u: { id: number }) => u.id === transaction.userId);
    if (!user) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      transaction.description.toLowerCase().includes(searchLower)
    );
  });

  // Filter redemptions based on search query
  const filteredRedemptions = redemptions?.filter(redemption => {
    if (!searchQuery) return true;
    
    const user = users?.find((u: { id: number }) => u.id === redemption.userId);
    const reward = rewards?.find((r: { id: number }) => r.id === redemption.rewardId);
    if (!user || !reward) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      reward.name.toLowerCase().includes(searchLower) ||
      redemption.status.toLowerCase().includes(searchLower)
    );
  });

  // Get user name by ID
  const getUserName = (userId: number) => {
    const user = users?.find((u: { id: number; firstName: string; lastName: string }) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Onbekende gebruiker';
  };

  // Get reward name by ID
  const getRewardName = (rewardId: number) => {
    const reward = rewards?.find((r: { id: number; name: string }) => r.id === rewardId);
    return reward ? reward.name : 'Onbekende beloning';
  };

  // Format date
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'dd MMM yyyy, HH:mm', { locale: nl });
    } catch (error) {
      return 'Ongeldige datum';
    }
  };

  // Status icon for redemptions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <PackageOpen className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 p-4 pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold">Transacties</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporteren
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-md mb-4">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Zoek transacties..."
          className="w-full pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="points" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="points">
            <Plus className="h-4 w-4 mr-2" />
            Punttransacties
          </TabsTrigger>
          <TabsTrigger value="rewards">
            <Gift className="h-4 w-4 mr-2" />
            Beloningsverzilveringen
          </TabsTrigger>
        </TabsList>

        {/* Punttransacties tab */}
        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle>Punttransacties</CardTitle>
              <CardDescription>
                Overzicht van alle toegekende en afgeschreven punten voor medewerkers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {transactionsLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !filteredTransactions?.length ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <p className="text-center text-muted-foreground mb-4">
                    Geen punttransacties gevonden
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Ken punten toe
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">Datum</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Medewerker</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Punten</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Beschrijving</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredTransactions?.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              {formatDate(transaction.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <span>{getUserName(transaction.userId)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={transaction.type === 'earned' ? 'default' : 'secondary'}>
                              {transaction.type === 'earned' ? (
                                <ArrowUp className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowDown className="h-3 w-3 mr-1" />
                              )}
                              {transaction.type === 'earned' ? 'Verdiend' : 'Uitgegeven'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            <span className={transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}>
                              {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {transaction.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Beloningsverzilveringen tab */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Beloningsverzilveringen</CardTitle>
              <CardDescription>
                Overzicht van alle verzilverde beloningen door medewerkers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {redemptionsLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !filteredRedemptions?.length ? (
                <div className="flex justify-center py-8 px-4">
                  <p className="text-center text-muted-foreground">
                    Geen beloningsverzilveringen gevonden
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">Datum</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Medewerker</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Beloning</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Kosten</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredRedemptions?.map((redemption) => (
                        <tr key={redemption.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              {formatDate(redemption.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <span>{getUserName(redemption.userId)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                                <Gift className="h-4 w-4 text-purple-600" />
                              </div>
                              <span>{getRewardName(redemption.rewardId)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            <span className="text-red-600">-{redemption.pointsAmount || 0}</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              {getStatusIcon(redemption.status)}
                              <Badge variant="outline" className="ml-2">
                                {redemption.status === 'pending' && 'In behandeling'}
                                {redemption.status === 'processing' && 'Wordt verwerkt'}
                                {redemption.status === 'shipped' && 'Verzonden'}
                                {redemption.status === 'completed' && 'Afgerond'}
                                {redemption.status === 'cancelled' && 'Geannuleerd'}
                              </Badge>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}