import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListFilter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface ConditionNodeProps {
  data: {
    label: string;
    condition: {
      field: string;
      operator: string;
      value: string | number;
    };
  };
  isConnectable: boolean;
  selected: boolean;
}

const fieldOptions = [
  { value: 'points', label: 'Punten' },
  { value: 'status', label: 'Status' },
  { value: 'role', label: 'Rol' },
  { value: 'daysInCompany', label: 'Dagen in dienst' },
  { value: 'lastLogin', label: 'Laatste login (dagen)' },
  { value: 'redemptionCount', label: 'Aantal inwisselingen' },
  { value: 'transactionCount', label: 'Aantal transacties' },
];

const operatorOptions = [
  { value: '==', label: 'Is gelijk aan' },
  { value: '!=', label: 'Is niet gelijk aan' },
  { value: '>', label: 'Is groter dan' },
  { value: '>=', label: 'Is groter dan of gelijk aan' },
  { value: '<', label: 'Is kleiner dan' },
  { value: '<=', label: 'Is kleiner dan of gelijk aan' },
  { value: 'contains', label: 'Bevat' },
  { value: 'startsWith', label: 'Begint met' },
  { value: 'endsWith', label: 'Eindigt met' },
];

const statusOptions = [
  { value: 'active', label: 'Actief' },
  { value: 'inactive', label: 'Inactief' },
];

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'employee', label: 'Medewerker' },
];

const ConditionNode = ({ data, isConnectable, selected }: ConditionNodeProps) => {
  const [condition, setCondition] = useState<any>(data.condition || { field: 'points', operator: '>=', value: 100 });
  
  // Update node data when configuration changes
  useEffect(() => {
    data.condition = condition;
  }, [condition, data]);

  const getValueInputType = () => {
    switch(condition.field) {
      case 'points':
      case 'daysInCompany':
      case 'lastLogin':
      case 'redemptionCount':
      case 'transactionCount':
        return 'number';
      default:
        return 'text';
    }
  };

  const renderValueInput = () => {
    switch(condition.field) {
      case 'status':
        return (
          <Select 
            value={condition.value?.toString() || 'active'} 
            onValueChange={(value) => setCondition({...condition, value})}
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
        );
      
      case 'role':
        return (
          <Select 
            value={condition.value?.toString() || 'employee'} 
            onValueChange={(value) => setCondition({...condition, value})}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecteer rol" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input 
            type={getValueInputType()} 
            placeholder="Waarde" 
            value={condition.value || ''}
            onChange={(e) => {
              const value = getValueInputType() === 'number' 
                ? (e.target.value ? parseInt(e.target.value) : 0)
                : e.target.value;
              setCondition({...condition, value});
            }}
            className="w-full"
          />
        );
    }
  };

  return (
    <Card className={`min-w-[250px] ${selected ? 'ring-2 ring-orange-500' : ''}`}>
      <CardHeader className="bg-orange-500 text-white p-2 flex flex-row items-center gap-2">
        <ListFilter className="h-4 w-4" />
        <CardTitle className="text-sm font-medium">Voorwaarde: {data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-4">
        <div className="space-y-2">
          <Label>Veld</Label>
          <Select 
            value={condition.field} 
            onValueChange={(value) => setCondition({...condition, field: value})}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecteer veld" />
            </SelectTrigger>
            <SelectContent>
              {fieldOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Vergelijking</Label>
          <Select 
            value={condition.operator} 
            onValueChange={(value) => setCondition({...condition, operator: value})}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecteer operator" />
            </SelectTrigger>
            <SelectContent>
              {operatorOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Waarde</Label>
          {renderValueInput()}
        </div>
        
        <div className="text-xs text-gray-500 pt-2">
          Voorbeeld: <span className="font-semibold">{fieldOptions.find(f => f.value === condition.field)?.label}</span> {' '}
          <span className="font-semibold">{operatorOptions.find(o => o.value === condition.operator)?.label}</span> {' '}
          <span className="font-semibold">{condition.value}</span>
        </div>
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        id="d"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-orange-500"
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="e"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-orange-500"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="f"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-orange-500"
      />
    </Card>
  );
};

export default ConditionNode;