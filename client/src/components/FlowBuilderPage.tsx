// ─── Flow Builder Page — Stap 5 ───────────────────────────────────────────────
// Visuele flow builder met ReactFlow v11, 6 node-types en auto-save.

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Save, Rocket, X, Mail, Clock, HelpCircle, Tag, Play, StopCircle,
  ChevronLeft, GripVertical, AlertCircle, CheckCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType = 'trigger' | 'email' | 'wait' | 'condition' | 'tag_action' | 'end';

interface FlowNodeData {
  stapId: string;
  type: NodeType;
  label: string;
  config: Record<string, any>;
  hasError?: boolean;
  errorMessage?: string;
}

interface FlowStep {
  id?: number;
  stapId: string;
  type: string;
  label: string | null;
  config: string;
  nextStapId: string | null;
  nextStapIdYes: string | null;
  volgorde: number;
  posX: number;
  posY: number;
}

interface Props {
  campaignId: number;
  campaignName: string;
  onClose: () => void;
  onActivate?: () => void;
}

// ─── Node Kleuren ──────────────────────────────────────────────────────────────

const NODE_STYLES: Record<NodeType, { border: string; bg: string; text: string; icon: any }> = {
  trigger:    { border: '#059669', bg: '#D1FAE5', text: '#065F46', icon: Play },
  email:      { border: '#7C3AED', bg: '#EDE9FE', text: '#4C1D95', icon: Mail },
  wait:       { border: '#2563EB', bg: '#DBEAFE', text: '#1E3A8A', icon: Clock },
  condition:  { border: '#D97706', bg: '#FEF3C7', text: '#78350F', icon: HelpCircle },
  tag_action: { border: '#CA8A04', bg: '#FEF9C3', text: '#713F12', icon: Tag },
  end:        { border: '#374151', bg: '#374151', text: '#F9FAFB', icon: StopCircle },
};

// ─── Custom Nodes ─────────────────────────────────────────────────────────────

function FlowNode({ data, selected }: NodeProps<FlowNodeData>) {
  const style = NODE_STYLES[data.type] || NODE_STYLES.email;
  const Icon = style.icon;
  const isCondition = data.type === 'condition';
  const isTrigger = data.type === 'trigger';
  const isEnd = data.type === 'end';

  if (isCondition) {
    return (
      <div style={{ position: 'relative', width: 140, height: 70 }}>
        <Handle type="target" position={Position.Top} style={{ background: '#9CA3AF' }} />
        <div style={{
          width: 140, height: 70,
          background: style.bg,
          border: `${selected ? 3 : 2}px solid ${style.border}`,
          borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 4,
          transform: 'rotate(0deg)',
          boxShadow: selected ? `0 0 0 2px ${style.border}40` : '0 2px 8px rgba(0,0,0,0.08)',
          cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon size={14} color={style.text} />
            <span style={{ fontSize: 11, fontWeight: 600, color: style.text, maxWidth: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.label || 'Conditie'}
            </span>
          </div>
          {data.hasError && <AlertCircle size={12} color="#EF4444" />}
        </div>
        {/* Ja output (rechts) */}
        <Handle
          type="source"
          position={Position.Right}
          id="yes"
          style={{ background: '#059669', top: '50%' }}
        />
        {/* Nee output (onder) */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="no"
          style={{ background: '#6B7280' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      minWidth: 160, maxWidth: 200,
      background: style.bg,
      border: `${selected ? 3 : 2}px solid ${style.border}`,
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: selected ? `0 0 0 2px ${style.border}40` : '0 2px 8px rgba(0,0,0,0.08)',
      cursor: 'pointer',
      position: 'relative',
    }}>
      {!isTrigger && <Handle type="target" position={Position.Top} style={{ background: '#9CA3AF' }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} color={style.text} />
        <span style={{ fontSize: 12, fontWeight: 600, color: style.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.label || data.type}
        </span>
        {data.hasError && <AlertCircle size={12} color="#EF4444" style={{ flexShrink: 0 }} />}
      </div>
      {!isEnd && (
        <Handle type="source" position={Position.Bottom} style={{ background: '#9CA3AF' }} />
      )}
    </div>
  );
}

const nodeTypes = { flowNode: FlowNode };

// ─── Converters ───────────────────────────────────────────────────────────────

function stepsToNodesEdges(steps: FlowStep[]): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const nodes: Node<FlowNodeData>[] = steps.map(s => {
    let config: Record<string, any> = {};
    try { config = JSON.parse(s.config || '{}'); } catch {}
    return {
      id: s.stapId,
      type: 'flowNode',
      position: { x: s.posX || 0, y: s.posY || 0 },
      data: {
        stapId: s.stapId,
        type: s.type as NodeType,
        label: s.label || typeToLabel(s.type as NodeType, config),
        config,
      },
    };
  });

  const edges: Edge[] = [];
  steps.forEach(s => {
    if (s.nextStapId) {
      edges.push({
        id: `${s.stapId}->${s.nextStapId}`,
        source: s.stapId,
        target: s.nextStapId,
        sourceHandle: s.type === 'condition' ? 'no' : undefined,
        markerEnd: { type: MarkerType.ArrowClosed, color: s.type === 'condition' ? '#6B7280' : '#9CA3AF' },
        style: { stroke: s.type === 'condition' ? '#6B7280' : '#9CA3AF', strokeWidth: 2 },
        label: s.type === 'condition' ? 'Nee ✗' : undefined,
        labelStyle: { fill: '#6B7280', fontSize: 11 },
        labelBgStyle: { fill: '#F9FAFB', fillOpacity: 0.8 },
      });
    }
    if (s.nextStapIdYes) {
      edges.push({
        id: `${s.stapId}->yes->${s.nextStapIdYes}`,
        source: s.stapId,
        target: s.nextStapIdYes,
        sourceHandle: 'yes',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#059669' },
        style: { stroke: '#059669', strokeWidth: 2 },
        label: 'Ja ✓',
        labelStyle: { fill: '#059669', fontSize: 11 },
        labelBgStyle: { fill: '#F0FDF4', fillOpacity: 0.9 },
      });
    }
  });

  return { nodes, edges };
}

function typeToLabel(type: NodeType, config: Record<string, any>): string {
  switch (type) {
    case 'trigger': return '▶ Flow gestart';
    case 'email': return config.onderwerp ? `✉ ${config.onderwerp}` : '✉ E-mail sturen';
    case 'wait': return `⏱ Wacht ${config.waarde || 1} ${config.eenheid || 'dagen'}`;
    case 'condition': return `❓ ${config.conditie === 'mail_geopend' ? 'Geopend?' : config.conditie === 'link_geklikt' ? 'Geklikt?' : 'Geen actie?'}`;
    case 'tag_action': return `🏷 ${config.actie === 'verwijderen' ? 'Verwijder' : 'Voeg toe'}: ${config.tag || 'tag'}`;
    case 'end': return '⏹ Flow beëindigd';
    default: return type;
  }
}

function nodesToSteps(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  campaignId: number
): FlowStep[] {
  return nodes.map((node, idx) => {
    // Vind uitgaande edges
    const outEdges = edges.filter(e => e.source === node.id);
    const noEdge = outEdges.find(e => e.sourceHandle === 'no' || !e.sourceHandle);
    const yesEdge = outEdges.find(e => e.sourceHandle === 'yes');

    return {
      stapId: node.id,
      type: node.data.type,
      label: node.data.label,
      config: JSON.stringify(node.data.config || {}),
      nextStapId: noEdge?.target || null,
      nextStapIdYes: yesEdge?.target || null,
      volgorde: idx,
      posX: node.position.x,
      posY: node.position.y,
      campaignId,
    };
  });
}

let idCounter = 1000;
function newId(type: NodeType): string {
  return `${type}_${Date.now()}_${idCounter++}`;
}

// ─── Node Bibliotheek Item ────────────────────────────────────────────────────

const NODE_LIBRARY: Array<{
  type: NodeType;
  title: string;
  desc: string;
  emoji: string;
}> = [
  { type: 'email',      title: 'E-mail sturen',           desc: 'Stuur een e-mail naar het contact',              emoji: '✉️' },
  { type: 'wait',       title: 'Wacht',                   desc: 'Pauzeer de flow voor een bepaalde tijd',          emoji: '⏱️' },
  { type: 'condition',  title: 'Conditie',                desc: 'Vertak de flow op basis van contactgedrag',       emoji: '❓' },
  { type: 'tag_action', title: 'Tag toevoegen/verwijderen', desc: 'Voeg een tag toe of verwijder een tag',         emoji: '🏷️' },
  { type: 'end',        title: 'Einde',                   desc: 'Beëindig de flow voor dit contact',              emoji: '⏹️' },
];

// ─── Eigenschappen Paneel ─────────────────────────────────────────────────────

function PropertiesPanel({
  node,
  emailNodes,
  onUpdate,
  onClose,
}: {
  node: Node<FlowNodeData>;
  emailNodes: Node<FlowNodeData>[];
  onUpdate: (id: string, data: Partial<FlowNodeData>) => void;
  onClose: () => void;
}) {
  const data = node.data;
  const config = { ...data.config };

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    let newLabel = typeToLabel(data.type, newConfig);
    onUpdate(node.id, { config: newConfig, label: newLabel });
  };

  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 300,
      background: 'white', borderLeft: '1px solid #E5E7EB', zIndex: 10,
      display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Eigenschappen</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {data.type === 'trigger' && (
          <p style={{ fontSize: 13, color: '#6B7280' }}>Dit is het startpunt van de flow. Wordt geactiveerd wanneer een contact aan de flow wordt toegevoegd.</p>
        )}

        {data.type === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Onderwerp</Label>
              <Input
                value={config.onderwerp || ''}
                onChange={e => updateConfig('onderwerp', e.target.value)}
                placeholder="Onderwerp van de e-mail"
                style={{ fontSize: 13 }}
              />
            </div>
            <div>
              <Label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Inhoud (samenvatting)</Label>
              <Textarea
                value={config.preview || ''}
                onChange={e => updateConfig('preview', e.target.value)}
                placeholder="Korte beschrijving van de e-mail inhoud..."
                rows={3}
                style={{ fontSize: 12 }}
              />
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF' }}>Gebruik de E-mail Builder in de campagne voor de volledige opmaak.</p>
          </div>
        )}

        {data.type === 'wait' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Wachttijd</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={config.waarde || 1}
                  onChange={e => updateConfig('waarde', parseInt(e.target.value) || 1)}
                  style={{ width: 80, fontSize: 13 }}
                />
                <Select
                  value={config.eenheid || 'dagen'}
                  onValueChange={v => updateConfig('eenheid', v)}
                >
                  <SelectTrigger style={{ flex: 1, fontSize: 13 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uren">Uren</SelectItem>
                    <SelectItem value="dagen">Dagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {data.type === 'condition' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Conditie type</Label>
              <Select
                value={config.conditie || 'mail_geopend'}
                onValueChange={v => updateConfig('conditie', v)}
              >
                <SelectTrigger style={{ fontSize: 13 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mail_geopend">Mail geopend</SelectItem>
                  <SelectItem value="link_geklikt">Link geklikt</SelectItem>
                  <SelectItem value="geen_actie">Geen actie na X dagen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.conditie === 'geen_actie' && (
              <div>
                <Label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Aantal dagen</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={config.dagen || 3}
                  onChange={e => updateConfig('dagen', parseInt(e.target.value) || 3)}
                  style={{ fontSize: 13 }}
                />
              </div>
            )}
            <div>
              <Label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Controleer e-mail stap</Label>
              <Select
                value={config.referentie_stap_id || ''}
                onValueChange={v => updateConfig('referentie_stap_id', v)}
              >
                <SelectTrigger style={{ fontSize: 13 }}>
                  <SelectValue placeholder="Kies e-mail stap..." />
                </SelectTrigger>
                <SelectContent>
                  {emailNodes.map(n => (
                    <SelectItem key={n.id} value={n.id}>{n.data.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div style={{ background: '#FEF9C3', borderRadius: 8, padding: 12, fontSize: 12, color: '#78350F' }}>
              <strong>Ja ✓</strong> (groene pijl) → conditie klopt<br />
              <strong>Nee ✗</strong> (grijze pijl) → conditie klopt niet
            </div>
          </div>
        )}

        {data.type === 'tag_action' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Actie</Label>
              <Select
                value={config.actie || 'toevoegen'}
                onValueChange={v => updateConfig('actie', v)}
              >
                <SelectTrigger style={{ fontSize: 13 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toevoegen">Toevoegen</SelectItem>
                  <SelectItem value="verwijderen">Verwijderen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Tag naam</Label>
              <Input
                value={config.tag || ''}
                onChange={e => updateConfig('tag', e.target.value)}
                placeholder="bijv. Warme lead"
                style={{ fontSize: 13 }}
              />
            </div>
          </div>
        )}

        {data.type === 'end' && (
          <p style={{ fontSize: 13, color: '#6B7280' }}>De flow stopt hier voor dit contact. Status wordt bijgewerkt naar "Voltooid".</p>
        )}
      </div>
    </div>
  );
}

// ─── Hoofd Component ──────────────────────────────────────────────────────────

export default function FlowBuilderPage({ campaignId, campaignName, onClose, onActivate }: Props) {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(null);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);

  // Laad bestaande stappen
  useEffect(() => {
    fetch(`/api/admin/prospect-campaigns/${campaignId}/flow-steps`, { credentials: 'include' })
      .then(r => r.json())
      .then((steps: FlowStep[]) => {
        if (steps && steps.length > 0) {
          const { nodes: n, edges: e } = stepsToNodesEdges(steps);
          setNodes(n);
          setEdges(e);
        } else {
          // Standaard trigger node
          const triggerId = `trigger_start`;
          setNodes([{
            id: triggerId,
            type: 'flowNode',
            position: { x: 280, y: 60 },
            data: { stapId: triggerId, type: 'trigger', label: '▶ Flow gestart', config: { type: 'trigger' } },
          }]);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [campaignId]);

  // Auto-save debounce
  const scheduleAutoSave = useCallback(() => {
    if (!loaded) return;
    isDirty.current = true;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (isDirty.current) handleSave(true);
    }, 2000);
  }, [loaded]);

  useEffect(() => {
    if (loaded) scheduleAutoSave();
  }, [nodes, edges]);

  const handleSave = async (silent = false) => {
    if (!silent) setSaving(true);
    try {
      // Haal huidige staat op rechtstreeks van ReactFlow
      const currentNodes = nodes;
      const currentEdges = edges;
      const steps = nodesToSteps(currentNodes, currentEdges, campaignId);

      await apiRequest('PUT', `/api/admin/prospect-campaigns/${campaignId}/flow-steps`, { steps });
      isDirty.current = false;
      if (!silent) toast({ title: 'Flow opgeslagen ✓' });
    } catch (e: any) {
      if (!silent) toast({ title: 'Opslaan mislukt', variant: 'destructive' });
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handleActivate = async () => {
    // Validatie
    const errors: string[] = [];
    const hasTrigger = nodes.some(n => n.data.type === 'trigger');
    if (!hasTrigger) errors.push('Geen trigger stap gevonden');
    const emailNodes = nodes.filter(n => n.data.type === 'email');
    emailNodes.forEach(n => {
      if (!n.data.config?.onderwerp) errors.push(`E-mail stap heeft geen onderwerp`);
    });

    if (errors.length > 0) {
      toast({ title: `Validatiefout: ${errors[0]}`, variant: 'destructive' });
      return;
    }

    if (!window.confirm(`Flow activeren voor campagne "${campaignName}"?\n\nDe flow wordt gestart voor alle contacten die voldoen aan de segmentfilters.`)) return;

    setActivating(true);
    try {
      await handleSave(true);
      const result: any = await apiRequest('POST', `/api/admin/prospect-campaigns/${campaignId}/flow-activate`);
      toast({ title: `Flow geactiveerd voor ${result?.gestart ?? 0} contacten ✓` });
      onActivate?.();
    } catch (e: any) {
      toast({ title: e?.data?.message || 'Activeren mislukt', variant: 'destructive' });
    } finally {
      setActivating(false);
    }
  };

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({
      ...connection,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#9CA3AF' },
      style: { stroke: '#9CA3AF', strokeWidth: 2 },
    }, eds));
  }, []);

  const onNodeClick = useCallback((_: any, node: Node<FlowNodeData>) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback((id: string, data: Partial<FlowNodeData>) => {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
    setSelectedNode(prev => prev?.id === id ? { ...prev, data: { ...prev.data, ...data } } : prev);
  }, []);

  const addNode = useCallback((type: NodeType) => {
    const id = newId(type);
    const config: Record<string, any> = type === 'wait' ? { waarde: 3, eenheid: 'dagen' }
      : type === 'condition' ? { conditie: 'mail_geopend' }
      : type === 'tag_action' ? { actie: 'toevoegen', tag: '' }
      : {};
    const label = typeToLabel(type, config);
    const newNode: Node<FlowNodeData> = {
      id,
      type: 'flowNode',
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: { stapId: id, type, label, config },
    };
    setNodes(ns => [...ns, newNode]);
  }, []);

  const hasTrigger = nodes.some(n => n.data.type === 'trigger');
  const emailNodes = nodes.filter(n => n.data.type === 'email');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column',
      background: '#F8F8F8',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Topbalk */}
      <div style={{
        height: 56, background: 'white', borderBottom: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
        flexShrink: 0, zIndex: 20,
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 14 }}>
          <ChevronLeft size={18} />
          <span>Terug</span>
        </button>
        <div style={{ width: 1, height: 24, background: '#E5E7EB' }} />
        <span style={{ fontWeight: 600, fontSize: 15, color: '#111827', flex: 1 }}>{campaignName} — Flow Builder</span>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>
          {nodes.length} stappen · {edges.length} verbindingen
        </span>
        <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving} className="gap-2">
          <Save size={14} />
          {saving ? 'Opslaan...' : 'Opslaan'}
        </Button>
        <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={handleActivate} disabled={activating}>
          <Rocket size={14} />
          {activating ? 'Activeren...' : 'Flow activeren'}
        </Button>
      </div>

      {/* Inhoud: sidebar + canvas + eigenschappen */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Linker paneel: node bibliotheek */}
        <div style={{
          width: 220, background: 'white', borderRight: '1px solid #E5E7EB',
          display: 'flex', flexDirection: 'column', overflow: 'auto', flexShrink: 0,
        }}>
          <div style={{ padding: '14px 16px 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Starten
          </div>
          <div
            onClick={() => !hasTrigger && addNode('trigger')}
            style={{
              margin: '0 8px 4px', padding: '10px 12px', borderRadius: 8,
              border: '2px solid #059669', background: '#D1FAE5',
              cursor: hasTrigger ? 'not-allowed' : 'pointer',
              opacity: hasTrigger ? 0.4 : 1,
              display: 'flex', alignItems: 'center', gap: 10,
            }}
            title={hasTrigger ? 'Trigger is al aanwezig' : 'Voeg toe aan canvas'}
          >
            <Play size={14} color="#065F46" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#065F46' }}>Trigger</div>
              <div style={{ fontSize: 10, color: '#059669' }}>Startpunt van de flow</div>
            </div>
          </div>

          <div style={{ padding: '14px 16px 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Acties
          </div>
          {NODE_LIBRARY.filter(n => ['email', 'tag_action'].includes(n.type)).map(item => {
            const s = NODE_STYLES[item.type];
            const Icon = s.icon;
            return (
              <div
                key={item.type}
                onClick={() => addNode(item.type)}
                draggable
                onDragStart={e => e.dataTransfer.setData('nodeType', item.type)}
                style={{
                  margin: '0 8px 4px', padding: '10px 12px', borderRadius: 8,
                  border: `2px solid ${s.border}`, background: s.bg,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                }}
                title={item.desc}
              >
                <Icon size={14} color={s.text} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.text }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: s.border }}>{item.desc.substring(0, 30)}...</div>
                </div>
              </div>
            );
          })}

          <div style={{ padding: '14px 16px 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Timing
          </div>
          {NODE_LIBRARY.filter(n => n.type === 'wait').map(item => {
            const s = NODE_STYLES[item.type];
            const Icon = s.icon;
            return (
              <div
                key={item.type}
                onClick={() => addNode(item.type)}
                style={{
                  margin: '0 8px 4px', padding: '10px 12px', borderRadius: 8,
                  border: `2px solid ${s.border}`, background: s.bg,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                }}
                title={item.desc}
              >
                <Icon size={14} color={s.text} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.text }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: s.border }}>Pauzeer de flow...</div>
                </div>
              </div>
            );
          })}

          <div style={{ padding: '14px 16px 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Logica
          </div>
          {NODE_LIBRARY.filter(n => n.type === 'condition').map(item => {
            const s = NODE_STYLES[item.type];
            const Icon = s.icon;
            return (
              <div
                key={item.type}
                onClick={() => addNode(item.type)}
                style={{
                  margin: '0 8px 4px', padding: '10px 12px', borderRadius: 8,
                  border: `2px solid ${s.border}`, background: s.bg,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                }}
                title={item.desc}
              >
                <Icon size={14} color={s.text} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.text }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: s.border }}>Vertak de flow...</div>
                </div>
              </div>
            );
          })}

          <div style={{ padding: '14px 16px 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Afsluiten
          </div>
          {NODE_LIBRARY.filter(n => n.type === 'end').map(item => {
            const s = NODE_STYLES[item.type];
            const Icon = s.icon;
            return (
              <div
                key={item.type}
                onClick={() => addNode(item.type)}
                style={{
                  margin: '0 8px 4px', padding: '10px 12px', borderRadius: 8,
                  border: `2px solid ${s.border}`, background: s.bg,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <Icon size={14} color={s.text} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.text }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: '#6B7280' }}>Beëindig de flow...</div>
                </div>
              </div>
            );
          })}

          <div style={{ flex: 1 }} />
          <div style={{ padding: 12, fontSize: 11, color: '#D1D5DB', borderTop: '1px solid #F3F4F6', lineHeight: 1.5 }}>
            Klik op een blok om het toe te voegen · Klik op een stap om de eigenschappen te bewerken
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            style={{ background: '#F8F8F8' }}
          >
            <Background color="#E5E7EB" gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor={n => {
                const s = NODE_STYLES[n.data?.type as NodeType];
                return s?.border || '#9CA3AF';
              }}
              style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
            <Panel position="top-center">
              {!loaded && (
                <div style={{ background: 'white', padding: '8px 16px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 13, color: '#6B7280' }}>
                  Flow laden...
                </div>
              )}
            </Panel>
          </ReactFlow>
        </div>

        {/* Eigenschappen paneel */}
        {selectedNode && (
          <PropertiesPanel
            node={selectedNode}
            emailNodes={emailNodes}
            onUpdate={updateNodeData}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
