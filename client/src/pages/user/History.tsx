import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowUp, ArrowDown, Package, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';

interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: 'earned' | 'redeemed';
  description: string;
  source: string;
  sourceId: string | null;
  createdAt: string;
}

interface Redemption {
  id: number;
  userId: number;
  rewardId: number;
  pointsCost: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  reward?: {
    name: string;
    imageUrl: string | null;
  };
}

export default function HistoryPage() {
  const { user } = useAuth();

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/users/${user.id}/transactions`);
      if (!response.ok) {
        throw new Error('Kon transacties niet ophalen');
      }
      return response.json() as Promise<Transaction[]>;
    },
    enabled: !!user?.id,
  });

  const { data: redemptions, isLoading: redemptionsLoading } = useQuery({
    queryKey: ['/api/redemptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/users/${user.id}/redemptions`);
      if (!response.ok) {
        throw new Error('Kon verzilveringen niet ophalen');
      }
      return response.json() as Promise<Redemption[]>;
    },
    enabled: !!user?.id,
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd-MM-yyyy HH:mm');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">In afwachting</Badge>;
      case 'processing':
        return <Badge variant="secondary">In behandeling</Badge>;
      case 'shipped':
        return <Badge variant="secondary">Verzonden</Badge>;
      case 'completed':
        return <Badge variant="success">Voltooid</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Geannuleerd</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Geschiedenis</h1>
          <p className="text-muted-foreground">
            Bekijk je punten geschiedenis en verzilveringen
          </p>
        </div>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">Punten Transacties</TabsTrigger>
          <TabsTrigger value="redemptions">Verzilveringen</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Punten Transacties</CardTitle>
              <CardDescription>
                Overzicht van alle verdiende en uitgegeven punten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex justify-center p-8">Transacties laden...</div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <p className="text-lg font-medium">Geen transacties gevonden</p>
                  <p className="text-sm text-muted-foreground">
                    Je hebt nog geen punten verdiend of uitgegeven
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">Datum</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Beschrijving</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Bron</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Punten</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-muted/50">
                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            {formatDate(transaction.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm">{transaction.description}</td>
                          <td className="px-4 py-3 text-sm">{transaction.source}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <div
                              className={`flex items-center justify-end ${
                                transaction.type === 'earned'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {transaction.type === 'earned' ? (
                                <ArrowUp className="mr-1 h-4 w-4" />
                              ) : (
                                <ArrowDown className="mr-1 h-4 w-4" />
                              )}
                              <span className="font-medium">
                                {transaction.type === 'earned' ? '+' : '-'}
                                {Math.abs(transaction.amount)}
                              </span>
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

        <TabsContent value="redemptions">
          <Card>
            <CardHeader>
              <CardTitle>Verzilveringen</CardTitle>
              <CardDescription>
                Overzicht van alle ingewisselde beloningen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {redemptionsLoading ? (
                <div className="flex justify-center p-8">Verzilveringen laden...</div>
              ) : !redemptions || redemptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <p className="text-lg font-medium">Geen verzilveringen gevonden</p>
                  <p className="text-sm text-muted-foreground">
                    Je hebt nog geen beloningen ingewisseld
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {redemptions.map((redemption) => (
                    <div
                      key={redemption.id}
                      className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50"
                    >
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {redemption.reward?.imageUrl ? (
                          <img
                            src={redemption.reward.imageUrl}
                            alt={redemption.reward.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200">
                            <Package className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">
                              {redemption.reward?.name || `Beloning #${redemption.rewardId}`}
                            </h4>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatDate(redemption.createdAt)}
                            </div>
                          </div>
                          <div className="space-x-2">
                            {getStatusBadge(redemption.status)}
                            <Badge variant="outline">{redemption.pointsCost} punten</Badge>
                          </div>
                        </div>
                        {redemption.notes && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Opmerkingen:</span> {redemption.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}