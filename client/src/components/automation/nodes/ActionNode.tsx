import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Mail, MessageSquare, Award } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuery } from '@tanstack/react-query';

interface ActionNodeProps {
  data: {
    label: string;
    actionType: string;
    config: any;
  };
  isConnectable: boolean;
  selected: boolean;
}

const actionTypes = [
  { value: 'send_email', label: 'Verstuur E-mail' },
  { value: 'add_points', label: 'Ken Punten Toe' },
  { value: 'send_notification', label: 'Verstuur Notificatie' },
];

const ActionNode = ({ data, isConnectable, selected }: ActionNodeProps) => {
  const [config, setConfig] = useState<any>(data.config || {});
  
  // Update node data when configuration changes
  useEffect(() => {
    data.config = config;
  }, [config, data]);

  // Fetch email templates
  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['/api/email-templates'],
    select: (data) => data as any[]
  });
  
  // Filter templates by type if needed
  const getBirthdayTemplates = () => {
    return emailTemplates.filter(template => 
      template.type === 'birthday' || 
      template.name.toLowerCase().includes('verjaardag') || 
      template.name.toLowerCase().includes('birthday')
    );
  };

  const renderActionIcon = () => {
    switch(data.actionType) {
      case 'send_email':
        return <Mail className="h-4 w-4" />;
      case 'add_points':
        return <Award className="h-4 w-4" />;
      case 'send_notification':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const renderConfigFields = () => {
    switch(data.actionType) {
      case 'send_email':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>E-mailsjabloon</Label>
              <Select 
                value={config.templateId?.toString() || ''} 
                onValueChange={(value) => setConfig({...config, templateId: parseInt(value)})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecteer een sjabloon" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.length === 0 ? (
                    <SelectItem value="empty" disabled>Geen sjablonen beschikbaar</SelectItem>
                  ) : (
                    emailTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {config.templateId ? 
                  `Geselecteerd sjabloon: ${emailTemplates.find(t => t.id === config.templateId)?.name || 'Onbekend'}` : 
                  'Selecteer een e-mailsjabloon om te versturen'
                }
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Verjaardagssjablonen</Label>
              <RadioGroup 
                value={config.birthdayTemplateId?.toString() || ''} 
                onValueChange={(value) => setConfig({...config, birthdayTemplateId: parseInt(value)})}
              >
                {getBirthdayTemplates().length === 0 ? (
                  <div className="text-xs text-gray-500">
                    Geen verjaardagssjablonen beschikbaar
                  </div>
                ) : (
                  getBirthdayTemplates().map(template => (
                    <div key={template.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={template.id.toString()} id={`template-${template.id}`} />
                      <Label htmlFor={`template-${template.id}`}>{template.name}</Label>
                    </div>
                  ))
                )}
              </RadioGroup>
            </div>
          </div>
        );
        
      case 'add_points':
        return (
          <div className="space-y-2">
            <Label>Aantal punten</Label>
            <Input 
              type="number" 
              min="1" 
              placeholder="100" 
              value={config.points || 100}
              onChange={(e) => setConfig({...config, points: parseInt(e.target.value)})}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Aantal punten dat wordt toegekend aan de gebruiker
            </p>
          </div>
        );
        
      case 'send_notification':
        return (
          <div className="space-y-2">
            <Label>Titel</Label>
            <Input 
              placeholder="Titel van de notificatie" 
              value={config.title || ''}
              onChange={(e) => setConfig({...config, title: e.target.value})}
              className="w-full"
            />
            
            <Label>Bericht</Label>
            <Textarea 
              placeholder="Inhoud van de notificatie" 
              value={config.message || ''}
              onChange={(e) => setConfig({...config, message: e.target.value})}
              className="w-full min-h-[80px]"
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className={`min-w-[250px] ${selected ? 'ring-2 ring-green-500' : ''}`}>
      <CardHeader className="bg-green-500 text-white p-2 flex flex-row items-center gap-2">
        {renderActionIcon()}
        <CardTitle className="text-sm font-medium">Actie: {data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-4">
        <div className="space-y-2">
          <Label>Type actie</Label>
          <Select 
            value={data.actionType} 
            onValueChange={(value) => {
              data.actionType = value;
              setConfig({});
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecteer actie type" />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {renderConfigFields()}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        id="b"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="c"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />
    </Card>
  );
};

export default ActionNode;