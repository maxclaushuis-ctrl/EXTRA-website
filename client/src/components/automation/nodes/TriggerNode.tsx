import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface TriggerNodeProps {
  data: {
    label: string;
    triggerType: string;
    config: any;
  };
  isConnectable: boolean;
  selected: boolean;
}

const triggerTypes = [
  { value: 'birthday', label: 'Verjaardag' },
  { value: 'status_change', label: 'Status Veranderd' },
  { value: 'transaction', label: 'Transactie Uitgevoerd' },
  { value: 'new_user', label: 'Nieuwe Gebruiker' },
  { value: 'redemption', label: 'Beloning Ingewisseld' },
];

const statusOptions = [
  { value: 'active', label: 'Actief' },
  { value: 'inactive', label: 'Inactief' },
];

const TriggerNode = ({ data, isConnectable, selected }: TriggerNodeProps) => {
  const [config, setConfig] = useState<any>(data.config || {});
  
  // Update node data when configuration changes
  useEffect(() => {
    data.config = config;
  }, [config, data]);

  const renderConfigFields = () => {
    switch(data.triggerType) {
      case 'birthday':
        return (
          <div className="space-y-2">
            <Label>Dagen voor verjaardag</Label>
            <Input 
              type="number" 
              min="0" 
              max="30" 
              placeholder="0" 
              value={config.daysBeforeBirthday || 0}
              onChange={(e) => setConfig({...config, daysBeforeBirthday: parseInt(e.target.value)})}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              0 = op de verjaardag zelf, 1 = één dag ervoor, etc.
            </p>
          </div>
        );
        
      case 'status_change':
        return (
          <div className="space-y-2">
            <Label>Nieuwe status</Label>
            <Select 
              value={config.newStatus || 'inactive'} 
              onValueChange={(value) => setConfig({...config, newStatus: value})}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecteer status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
        
      case 'transaction':
        return (
          <div className="space-y-2">
            <Label>Minimum punten</Label>
            <Input 
              type="number" 
              min="0" 
              placeholder="Alle transacties" 
              value={config.minPoints || ''}
              onChange={(e) => setConfig({...config, minPoints: e.target.value ? parseInt(e.target.value) : null})}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Laat leeg voor alle transacties
            </p>
          </div>
        );
        
      case 'new_user':
        return (
          <div className="text-xs text-gray-500">
            Wordt getriggerd wanneer een nieuwe gebruiker wordt aangemaakt.
          </div>
        );
        
      case 'redemption':
        return (
          <div className="space-y-2">
            <Label>Reward ID (optioneel)</Label>
            <Input 
              type="number" 
              min="1" 
              placeholder="Alle beloningen" 
              value={config.rewardId || ''}
              onChange={(e) => setConfig({...config, rewardId: e.target.value ? parseInt(e.target.value) : null})}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Laat leeg voor alle beloningen
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className={`min-w-[250px] ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="bg-blue-500 text-white p-2 flex flex-row items-center gap-2">
        <Zap className="h-4 w-4" />
        <CardTitle className="text-sm font-medium">Trigger: {data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-4">
        <div className="space-y-2">
          <Label>Type trigger</Label>
          <Select 
            value={data.triggerType} 
            onValueChange={(value) => {
              data.triggerType = value;
              setConfig({});
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecteer trigger type" />
            </SelectTrigger>
            <SelectContent>
              {triggerTypes.map(type => (
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
        type="source"
        position={Position.Right}
        id="a"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </Card>
  );
};

export default TriggerNode;