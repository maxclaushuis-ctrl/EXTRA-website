import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';
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

interface ConditionNodeData {
  label: string;
  condition: {
    field: string;
    operator: string;
    value: number | string;
  };
}

const ConditionNode = ({ data, isConnectable }: NodeProps<ConditionNodeData>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [field, setField] = useState(data.condition?.field || 'points');
  const [operator, setOperator] = useState(data.condition?.operator || '>=');
  const [value, setValue] = useState(data.condition?.value?.toString() || '100');
  
  // Beschrijving op basis van conditie
  const getConditionDescription = () => {
    const fieldLabels: Record<string, string> = {
      'points': 'Punten',
      'age': 'Leeftijd',
      'signupDate': 'Registratiedatum',
      'lastActivity': 'Laatste activiteit'
    };
    
    const operatorLabels: Record<string, string> = {
      '>=': 'is groter of gelijk aan',
      '>': 'is groter dan',
      '=': 'is gelijk aan',
      '!=': 'is niet gelijk aan',
      '<': 'is kleiner dan',
      '<=': 'is kleiner of gelijk aan'
    };
    
    return `${fieldLabels[field] || field} ${operatorLabels[operator] || operator} ${value}`;
  };
  
  // Update condition when fields change
  const updateCondition = () => {
    data.condition = {
      field,
      operator,
      value: field === 'points' || field === 'age' ? parseInt(value) : value
    };
  };

  return (
    <Card className="min-w-[250px] border-2 border-orange-400">
      <CardHeader className="bg-orange-400 text-white p-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span>Voorwaarde: {data.label}</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-orange-900">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configureer Voorwaarde</DialogTitle>
                <DialogDescription>
                  Stel criteria in voor deze voorwaarde.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="conditionLabel" className="text-right">
                    Label
                  </Label>
                  <Input
                    id="conditionLabel"
                    defaultValue={data.label}
                    className="col-span-3"
                    onChange={e => data.label = e.target.value}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="conditionField" className="text-right">
                    Veld
                  </Label>
                  <Select 
                    value={field} 
                    onValueChange={(v) => {
                      setField(v);
                      updateCondition();
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecteer veld" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Punten</SelectItem>
                      <SelectItem value="age">Leeftijd</SelectItem>
                      <SelectItem value="signupDate">Registratiedatum</SelectItem>
                      <SelectItem value="lastActivity">Laatste activiteit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="conditionOperator" className="text-right">
                    Operator
                  </Label>
                  <Select 
                    value={operator} 
                    onValueChange={(v) => {
                      setOperator(v);
                      updateCondition();
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecteer operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">=">is groter of gelijk aan</SelectItem>
                      <SelectItem value=">">is groter dan</SelectItem>
                      <SelectItem value="=">is gelijk aan</SelectItem>
                      <SelectItem value="!=">is niet gelijk aan</SelectItem>
                      <SelectItem value="<">is kleiner dan</SelectItem>
                      <SelectItem value="<=">is kleiner of gelijk aan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="conditionValue" className="text-right">
                    Waarde
                  </Label>
                  <Input
                    id="conditionValue"
                    value={value}
                    type={field === 'points' || field === 'age' ? 'number' : 'text'}
                    className="col-span-3"
                    onChange={e => {
                      setValue(e.target.value);
                      updateCondition();
                    }}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="text-xs">
          <p><strong>Voorwaarde:</strong></p>
          <p className="text-gray-700 mt-1">
            {getConditionDescription()}
          </p>
        </div>
      </CardContent>
      
      {/* Input handle om verbinding te maken met vorige node */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-orange-500"
      />
      
      {/* Output handles om verbinding te maken met volgende nodes (ja/nee) */}
      <div className="flex justify-between absolute w-full -bottom-6">
        <div className="relative left-5">
          <div className="text-xs text-green-600 font-bold">Ja</div>
          <Handle
            id="yes"
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="w-3 h-3 bg-green-500 relative -left-5"
          />
        </div>
        <div className="relative right-5">
          <div className="text-xs text-red-600 font-bold">Nee</div>
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="w-3 h-3 bg-red-500 relative left-5"
          />
        </div>
      </div>
    </Card>
  );
};

export default memo(ConditionNode);