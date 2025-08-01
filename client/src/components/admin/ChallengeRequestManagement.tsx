import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ChallengeRequest {
  id: number;
  challengeId: number;
  userId: number;
  message: string;
  evidence: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  challenge?: {
    title: string;
    description: string;
  };
}

export default function ChallengeRequestManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ChallengeRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Get all challenge requests
  const { data: requests, isLoading } = useQuery<ChallengeRequest[]>({
    queryKey: ['/api/admin/challenge-requests'],
    queryFn: async () => {
      const response = await fetch('/api/admin/challenge-requests');
      if (!response.ok) throw new Error('Failed to fetch challenge requests');
      return response.json();
    }
  });

  // Process challenge request mutation
  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, adminNote }: { requestId: number; status: string; adminNote: string }) => {
      return await apiRequest(`/api/admin/challenge-requests/${requestId}`, {
        method: 'PATCH',
        body: { status, adminNote }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/challenge-requests'] });
      setSelectedRequest(null);
      setAdminNote('');
      toast({
        title: 'Challenge verzoek verwerkt',
        description: 'Het challenge verzoek is succesvol verwerkt'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij verwerken verzoek',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />In behandeling</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1 bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3" />Goedgekeurd</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Afgewezen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProcessRequest = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    processRequestMutation.mutate({
      requestId: selectedRequest.id,
      status,
      adminNote
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const processedRequests = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Challenge Verzoeken</h2>
        <p className="text-muted-foreground">
          Beheer handmatige challenge verzoeken van medewerkers
        </p>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Wachtende verzoeken ({pendingRequests.length})
          </CardTitle>
          <CardDescription>
            Challenge verzoeken die nog verwerkt moeten worden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>Geen wachtende challenge verzoeken</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{request.challenge?.title || `Challenge ${request.challengeId}`}</h4>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {request.user?.firstName} {request.user?.lastName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(request.createdAt)}
                        </span>
                      </div>
                      {request.message && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Bericht:</p>
                          <p className="text-sm text-muted-foreground">{request.message}</p>
                        </div>
                      )}
                      {request.evidence && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Bewijs:</p>
                          <a
                            href={request.evidence}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Bekijk bewijs
                          </a>
                        </div>
                      )}
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNote('');
                          }}
                        >
                          Verwerken
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Challenge verzoek verwerken</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium">{selectedRequest?.challenge?.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Door: {selectedRequest?.user?.firstName} {selectedRequest?.user?.lastName}
                            </p>
                          </div>
                          
                          {selectedRequest?.message && (
                            <div>
                              <p className="text-sm font-medium">Bericht van medewerker:</p>
                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                {selectedRequest.message}
                              </p>
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium">Admin notitie (optioneel)</label>
                            <Textarea
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              placeholder="Voeg een notitie toe..."
                              className="mt-1"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleProcessRequest('approved')}
                              disabled={processRequestMutation.isPending}
                              className="flex-1 gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Goedkeuren
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleProcessRequest('rejected')}
                              disabled={processRequestMutation.isPending}
                              className="flex-1 gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              Afwijzen
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verwerkte verzoeken</CardTitle>
            <CardDescription>Overzicht van recent verwerkte challenge verzoeken</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{request.challenge?.title || `Challenge ${request.challengeId}`}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.user?.firstName} {request.user?.lastName} • {formatDate(request.createdAt)}
                    </p>
                    {request.adminNote && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Admin notitie:</strong> {request.adminNote}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}