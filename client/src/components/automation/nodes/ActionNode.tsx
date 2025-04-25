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
import { useQuery } from '@tanstack/react-query';

interface ActionNodeData {
  label: string;
  actionType: string;
  config: Record<string, any>;
}

const ActionNode = ({ data, isConnectable }: NodeProps<ActionNodeData>) => {
  const [actionType, setActionType] = useState(data.actionType || 'email');
  const [isOpen, setIsOpen] = useState(false);
  
  // Haal e-mail templates op
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/email-templates'],
    enabled: actionType === 'email',
    select: (data) => data as any[]
  });

  // Beschrijving op basis van actie type
  const getActionDescription = (type: string) => {
    switch (type) {
      case 'email':
        return 'Stuurt een e-mail naar de gebruiker.';
      case 'points':
        return 'Kent punten toe aan de gebruiker.';
      case 'notification':
        return 'Stuurt een notificatie naar de gebruiker.';
      default:
        return 'Selecteer een actie type.';
    }
  };

  // Update node data when action type changes
  const handleActionTypeChange = (value: string) => {
    setActionType(value);
    data.actionType = value;
  };

  return (
    <Card className="min-w-[250px] border-2 border-green-400">
      <CardHeader className="bg-green-400 text-white p-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span>Actie: {data.label}</span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:text-green-900">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configureer Actie</DialogTitle>
                <DialogDescription>
                  Pas de instellingen van deze actie aan.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="actionLabel" className="text-right">
                    Label
                  </Label>
                  <Input
                    id="actionLabel"
                    defaultValue={data.label}
                    className="col-span-3"
                    onChange={e => data.label = e.target.value}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="actionType" className="text-right">
                    Type
                  </Label>
                  <Select value={actionType} onValueChange={handleActionTypeChange}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecteer actie type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="points">Punten Toekennen</SelectItem>
                      <SelectItem value="notification">Notificatie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {actionType === 'email' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="emailTemplate" className="text-right">
                        E-mail Template
                      </Label>
                      <Select
                        value={data.config?.templateId?.toString() || ''}
                        onValueChange={value => {
                          data.config = {
                            ...data.config,
                            templateId: parseInt(value)
                          };
                        }}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecteer een template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="emailSubject" className="text-right">
                        Onderwerp
                      </Label>
                      <Input
                        id="emailSubject"
                        defaultValue={data.config?.subject || ''}
                        className="col-span-3"
                        onChange={e => {
                          data.config = {
                            ...data.config,
                            subject: e.target.value
                          };
                        }}
                      />
                    </div>
                  </>
                )}
                
                {actionType === 'points' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pointsAmount" className="text-right">
                      Aantal Punten
                    </Label>
                    <Input
                      id="pointsAmount"
                      type="number"
                      defaultValue={data.config?.points || 10}
                      className="col-span-3"
                      onChange={e => {
                        data.config = {
                          ...data.config,
                          points: parseInt(e.target.value)
                        };
                      }}
                    />
                  </div>
                )}
                
                {actionType === 'notification' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notificationMessage" className="text-right">
                      Bericht
                    </Label>
                    <Input
                      id="notificationMessage"
                      defaultValue={data.config?.message || ''}
                      className="col-span-3"
                      onChange={e => {
                        data.config = {
                          ...data.config,
                          message: e.target.value
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
          <p><strong>Type:</strong> {actionType}</p>
          <p className="text-gray-500 mt-1">
            {getActionDescription(actionType)}
          </p>
          {actionType === 'email' && data.config?.templateId && (
            <p className="mt-1">
              <strong>Template:</strong> {templates.find((t: any) => t.id === data.config.templateId)?.name || 'Onbekend'}
            </p>
          )}
          {actionType === 'points' && data.config?.points && (
            <p className="mt-1">
              <strong>Punten:</strong> {data.config.points}
            </p>
          )}
        </div>
      </CardContent>
      
      {/* Input handle om verbinding te maken met vorige node */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />
      
      {/* Output handle om verbinding te maken met volgende node */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />
    </Card>
  );
};

export default memo(ActionNode);