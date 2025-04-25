import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edge, Node } from 'reactflow';
import { AutomationFlowWithProvider } from './AutomationFlow';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { PlusIcon, RefreshCw, Plus, Brain, Zap, Activity, ListFilter } from 'lucide-react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AutomationPage = () => {
  const [newAutomationDialogOpen, setNewAutomationDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<number | null>(null);
  const [newAutomationName, setNewAutomationName] = useState('');
  const [newAutomationDescription, setNewAutomationDescription] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch automations
  const { data: automations = [], isLoading: isLoadingAutomations } = useQuery({
    queryKey: ['/api/automations'],
    select: (data) => data as any[]
  });

  // Get selected automation data
  const { data: automationDetail } = useQuery({
    queryKey: ['/api/automations', selectedAutomation],
    enabled: !!selectedAutomation,
    select: (data) => data as any
  });

  // Create new automation
  const createMutation = useMutation({
    mutationFn: async (newAutomation: any) => {
      const response = await apiRequest('/api/automations', {
        method: 'POST',
        body: JSON.stringify(newAutomation)
      });
      return response;
    },
    onSuccess: (responseData: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
      if (responseData && responseData.id) {
        setSelectedAutomation(responseData.id);
      }
      setNewAutomationDialogOpen(false);
      toast({
        title: 'Automatisering aangemaakt',
        description: 'De nieuwe automatisering is aangemaakt en klaar om te configureren.',
      });
    },
    onError: (error) => {
      console.error('Error creating automation:', error);
      toast({
        title: 'Fout bij aanmaken',
        description: 'Er is een fout opgetreden bij het aanmaken van de automatisering.',
        variant: 'destructive',
      });
    }
  });

  const handleCreateAutomation = () => {
    if (!newAutomationName.trim()) {
      toast({
        title: 'Naam vereist',
        description: 'Geef een naam op voor de automatisering.',
        variant: 'destructive',
      });
      return;
    }
    
    const newAutomation = {
      name: newAutomationName,
      description: newAutomationDescription || null,
      status: 'draft',
      flowData: {
        nodes: [
          {
            id: 'trigger-1',
            type: 'triggerNode',
            position: { x: 250, y: 100 },
            data: { 
              label: 'Start Trigger',
              triggerType: 'birthday',
              config: {}
            }
          }
        ],
        edges: []
      }
    };
    
    createMutation.mutate(newAutomation);
  };

  const refreshAutomations = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
  };

  // Filter automations based on status
  const filteredAutomations = automations.filter((automation: any) => {
    if (filterStatus === 'all') return true;
    return automation.status === filterStatus;
  });

  // Helper function to get automation status badge classes
  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'draft':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Node elements to drag & drop into the flow editor
  const renderNodePalette = () => (
    <div className="mb-4 p-4 border rounded-md bg-white">
      <h3 className="text-sm font-medium mb-2">Componenten</h3>
      <div className="flex flex-wrap gap-2">
        <div
          className="flex items-center border rounded-md p-2 cursor-grab bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
          draggable={true}
          onDragStart={(event) => {
            console.log('Drag started: trigger');
            event.dataTransfer.setData('application/reactflow', 'trigger');
            event.dataTransfer.effectAllowed = 'move';
          }}
        >
          <Zap className="h-4 w-4 mr-2" />
          <span>Trigger</span>
        </div>
        <div
          className="flex items-center border rounded-md p-2 cursor-grab bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
          draggable={true}
          onDragStart={(event) => {
            console.log('Drag started: action');
            event.dataTransfer.setData('application/reactflow', 'action');
            event.dataTransfer.effectAllowed = 'move';
          }}
        >
          <Activity className="h-4 w-4 mr-2" />
          <span>Actie</span>
        </div>
        <div
          className="flex items-center border rounded-md p-2 cursor-grab bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100"
          draggable={true}
          onDragStart={(event) => {
            console.log('Drag started: condition');
            event.dataTransfer.setData('application/reactflow', 'condition');
            event.dataTransfer.effectAllowed = 'move';
          }}
        >
          <ListFilter className="h-4 w-4 mr-2" />
          <span>Voorwaarde</span>
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        <p>Sleep een component naar het canvas. Klik op componenten om ze te bewerken.</p>
        <p>Verbind componenten door van een uitgangspunt naar een ander element te slepen.</p>
      </div>
    </div>
  );

  // Main content with either automation list or flow editor
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Automatisering</h2>
          <p className="text-gray-500">Beheer automatische acties gebaseerd op triggers.</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={refreshAutomations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
          <Dialog open={newAutomationDialogOpen} onOpenChange={setNewAutomationDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nieuwe Automatisering
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe Automatisering</DialogTitle>
                <DialogDescription>
                  Maak een nieuwe automatisering aan voor jouw medewerkers.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Naam
                  </Label>
                  <Input
                    id="name"
                    placeholder="Bijv. Verjaardagsemail"
                    className="col-span-3"
                    value={newAutomationName}
                    onChange={(e) => setNewAutomationName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Beschrijving (optioneel)
                  </Label>
                  <Input
                    id="description"
                    placeholder="Beschrijf het doel van deze automatisering"
                    className="col-span-3"
                    value={newAutomationDescription}
                    onChange={(e) => setNewAutomationDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleCreateAutomation}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Bezig met aanmaken...' : 'Aanmaken'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="list" value={selectedAutomation ? 'editor' : 'list'}>
        <TabsList className="mb-4">
          <TabsTrigger 
            value="list" 
            onClick={() => setSelectedAutomation(null)}
          >
            Overzicht
          </TabsTrigger>
          <TabsTrigger 
            value="editor" 
            disabled={!selectedAutomation}
          >
            Flow Editor
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <div className="mb-4 flex justify-between items-center">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter op status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="inactive">Inactief</SelectItem>
                <SelectItem value="draft">Concept</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoadingAutomations ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAutomations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Brain className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">Geen automatiseringen</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Er zijn nog geen automatiseringen aangemaakt.
                    Maak je eerste automatisering om acties te automatiseren.
                  </p>
                  <div className="mt-6">
                    <Dialog open={newAutomationDialogOpen} onOpenChange={setNewAutomationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Nieuwe Automatisering
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAutomations.map((automation: any) => (
                <Card key={automation.id} className="relative overflow-hidden">
                  <div 
                    className={`absolute right-2 top-2 px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClasses(automation.status)}`}
                  >
                    {automation.status === 'active' ? 'Actief' : 
                     automation.status === 'inactive' ? 'Inactief' : 'Concept'}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle>{automation.name}</CardTitle>
                    <CardDescription>{automation.description || 'Geen beschrijving'}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Aangemaakt op:</span>
                        <span>{new Date(automation.createdAt).toLocaleDateString()}</span>
                      </div>
                      {automation.lastRun && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Laatst uitgevoerd:</span>
                          <span>{new Date(automation.lastRun).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setSelectedAutomation(automation.id)}
                      variant="default"
                      className="w-full"
                    >
                      Bewerken
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="editor">
          {renderNodePalette()}
          <AutomationFlowWithProvider automation={automationDetail} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationPage;