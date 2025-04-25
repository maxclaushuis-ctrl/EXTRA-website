import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  MiniMap,
  Node,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowInstance,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2Icon, Save, Play, Pause } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

// Import custom node components
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';

// Custom node types
const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
};

interface AutomationFlowProps {
  automation?: {
    id: number;
    name: string;
    description: string | null;
    status: 'active' | 'inactive' | 'draft';
    flowData: {
      nodes: Node[];
      edges: Edge[];
    };
    createdAt: string;
    updatedAt: string;
    lastRun: string | null;
    nextRun: string | null;
  };
  onSave?: (flowData: { nodes: Node[]; edges: Edge[] }) => void;
}

const AutomationFlow = ({ automation, onSave }: AutomationFlowProps) => {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Initiële nodes en edges
  const initialNodes: Node[] = automation?.flowData?.nodes || [];
  const initialEdges: Edge[] = automation?.flowData?.edges || [];
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Reset flow wanneer automation wijzigt
  useEffect(() => {
    if (automation?.flowData) {
      setNodes(automation.flowData.nodes || []);
      setEdges(automation.flowData.edges || []);
    } else {
      // Standaard flow voor een nieuwe automatisering
      setNodes([
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 250, y: 100 },
          data: { 
            label: 'Start Trigger',
            triggerType: 'birthday',
            config: {}
          },
        },
      ]);
      setEdges([]);
    }
  }, [automation, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Voeg een nieuwe connection toe tussen nodes
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      
      // Controleer of type bestaat
      if (!type || typeof type !== 'string') {
        return;
      }

      // Haal positie op van het canvas
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      
      if (!reactFlowBounds || !reactFlowInstance) {
        return;
      }
      
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      let newNode: Node = {
        id: `${type}-${Date.now()}`,
        position,
        data: { label: `Nieuwe ${type}` },
      };
      
      // Configureer het juiste node type
      if (type === 'trigger') {
        newNode.type = 'triggerNode';
        newNode.data = { 
          label: 'Trigger',
          triggerType: 'custom',
          config: {} 
        };
      } else if (type === 'action') {
        newNode.type = 'actionNode';
        newNode.data = { 
          label: 'Actie',
          actionType: 'email',
          config: {} 
        };
      } else if (type === 'condition') {
        newNode.type = 'conditionNode';
        newNode.data = { 
          label: 'Voorwaarde',
          condition: { 
            field: 'points', 
            operator: '>=', 
            value: 100 
          } 
        };
      }
      
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleSave = async () => {
    if (onSave) {
      onSave({ nodes, edges });
    } else if (automation?.id) {
      try {
        await apiRequest(`/api/automations/${automation.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            flowData: { nodes, edges }
          })
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/automations', automation.id] });
        
        toast({
          title: 'Flow opgeslagen',
          description: 'De automatisering is succesvol opgeslagen.',
        });
      } catch (error) {
        console.error('Fout bij opslaan van flow:', error);
        toast({
          title: 'Fout bij opslaan',
          description: 'Er is een fout opgetreden bij het opslaan van de automatisering.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleActivate = async () => {
    if (!automation?.id) return;
    
    const newStatus = automation.status === 'active' ? 'inactive' : 'active';
    
    try {
      await apiRequest(`/api/automations/${automation.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus
        })
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/automations', automation.id] });
      
      toast({
        title: newStatus === 'active' ? 'Automatisering geactiveerd' : 'Automatisering gedeactiveerd',
        description: newStatus === 'active' 
          ? 'De automatisering is nu actief en zal worden uitgevoerd.'
          : 'De automatisering is nu inactief en zal niet worden uitgevoerd.',
      });
    } catch (error) {
      console.error('Fout bij activeren/deactiveren:', error);
      toast({
        title: 'Fout bij statuswijziging',
        description: 'Er is een fout opgetreden bij het wijzigen van de status.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!automation?.id) return;
    
    if (!window.confirm('Weet je zeker dat je deze automatisering wilt verwijderen?')) {
      return;
    }
    
    try {
      await apiRequest(`/api/automations/${automation.id}`, {
        method: 'DELETE'
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
      
      toast({
        title: 'Automatisering verwijderd',
        description: 'De automatisering is succesvol verwijderd.',
      });
    } catch (error) {
      console.error('Fout bij verwijderen:', error);
      toast({
        title: 'Fout bij verwijderen',
        description: 'Er is een fout opgetreden bij het verwijderen van de automatisering.',
        variant: 'destructive',
      });
    }
  };

  // Debug log om te controleren of we nodes en edges hebben
  console.log('AutomationFlow rendering:', { nodes, edges, nodeTypes });
  
  return (
    <div className="h-[600px] w-full border rounded-md bg-slate-50" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Control"
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <MiniMap />
        <Background color="#aaa" gap={16} />
        
        <Panel position="top-right">
          <div className="flex space-x-2">
            <Button
              onClick={handleSave}
              className="flex items-center"
              variant="default"
              type="button"
            >
              <Save className="mr-2 h-4 w-4" />
              Opslaan
            </Button>
            
            {automation?.id && (
              <>
                <Button
                  onClick={handleActivate}
                  className="flex items-center"
                  variant={automation.status === 'active' ? 'secondary' : 'outline'}
                  type="button"
                >
                  {automation.status === 'active' ? (
                    <Pause className="mr-2 h-4 w-4" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {automation.status === 'active' ? 'Deactiveren' : 'Activeren'}
                </Button>
                
                <Button
                  onClick={handleDelete}
                  className="flex items-center"
                  variant="destructive"
                  type="button"
                >
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  Verwijderen
                </Button>
              </>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrapped component met ReactFlowProvider
export const AutomationFlowWithProvider = (props: AutomationFlowProps) => (
  <ReactFlowProvider>
    <AutomationFlow {...props} />
  </ReactFlowProvider>
);

export default AutomationFlowWithProvider;