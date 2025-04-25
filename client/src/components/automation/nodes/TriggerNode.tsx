import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

interface TriggerNodeData {
  label: string;
  triggerType: string;
  config: Record<string, any>;
}

const TriggerNode = ({ data, isConnectable }: NodeProps<TriggerNodeData>) => {
  const [triggerType, setTriggerType] = useState(data.triggerType || 'birthday');
  const [isOpen, setIsOpen] = useState(false);

  // Beschrijving op basis van trigger type
  const getTriggerDescription = (type: string) => {
    switch (type) {
      case 'birthday':
        return 'Wordt geactiveerd wanneer een gebruiker jarig is.';
      case 'new_account':
        return 'Wordt geactiveerd wanneer een nieuwe gebruiker wordt aangemaakt.';
      case 'points_threshold':
        return 'Wordt geactiveerd wanneer een gebruiker een bepaald aantal punten bereikt.';
      case 'custom':
        return 'Aangepaste trigger met eigen logica.';
      default:
        return 'Selecteer een trigger type.';
    }
  };

  // Update node data when trigger type changes
  const handleTriggerTypeChange = (value: string) => {
    setTriggerType(value);
    data.triggerType = value;
  };

  return (
    <Card className="min-w-[250px] border-2 border-blue-400">
      <CardHeader className="bg-blue-400 text-white p-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span>Trigger: {data.label}</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-blue-900">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configureer Trigger</DialogTitle>
                <DialogDescription>
                  Pas de instellingen van deze trigger aan.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="triggerLabel" className="text-right">
                    Label
                  </Label>
                  <Input
                    id="triggerLabel"
                    defaultValue={data.label}
                    className="col-span-3"
                    onChange={e => data.label = e.target.value}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="triggerType" className="text-right">
                    Type
                  </Label>
                  <Select value={triggerType} onValueChange={handleTriggerTypeChange}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecteer trigger type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Verjaardag</SelectItem>
                      <SelectItem value="new_account">Nieuw Account</SelectItem>
                      <SelectItem value="points_threshold">Punten Drempel</SelectItem>
                      <SelectItem value="custom">Aangepast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {triggerType === 'points_threshold' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pointsThreshold" className="text-right">
                      Punten Drempel
                    </Label>
                    <Input
                      id="pointsThreshold"
                      type="number"
                      defaultValue={data.config?.threshold || 100}
                      className="col-span-3"
                      onChange={e => {
                        data.config = {
                          ...data.config,
                          threshold: parseInt(e.target.value)
                        };
                      }}
                    />
                  </div>
                )}
                
                {triggerType === 'custom' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="customTrigger" className="text-right">
                      Beschrijving
                    </Label>
                    <Input
                      id="customTrigger"
                      defaultValue={data.config?.description || ''}
                      className="col-span-3"
                      onChange={e => {
                        data.config = {
                          ...data.config,
                          description: e.target.value
                        };
                      }}
                    />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="text-xs">
          <p><strong>Type:</strong> {triggerType}</p>
          <p className="text-gray-500 mt-1">
            {getTriggerDescription(triggerType)}
          </p>
        </div>
      </CardContent>
      
      {/* Output handle om verbinding te maken met volgende node */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </Card>
  );
};

export default memo(TriggerNode);