import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Setting } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Kon instellingen niet ophalen');
      }
      return response.json() as Promise<Setting[]>;
    },
  });

  // Group settings by category
  const settingsByCategory = settings?.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  const updateSettingMutation = useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: string;
      value: string;
    }) => {
      const response = await apiRequest(`/api/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Kon instelling niet bijwerken');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Instellingen bijgewerkt',
        description: 'De instellingen zijn succesvol bijgewerkt',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout bij bijwerken',
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleToggleChange = (setting: Setting, checked: boolean) => {
    updateSettingMutation.mutate({
      key: setting.key,
      value: checked.toString(),
    });
  };

  const handleInputChange = (setting: Setting, value: string) => {
    updateSettingMutation.mutate({
      key: setting.key,
      value,
    });
  };

  // Helper function to render setting based on type
  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={setting.key}
              checked={setting.value === 'true'}
              onCheckedChange={(checked) => handleToggleChange(setting, checked)}
            />
            <Label htmlFor={setting.key}>
              {setting.value === 'true' ? 'Ingeschakeld' : 'Uitgeschakeld'}
            </Label>
          </div>
        );
      case 'number':
        return (
          <div className="grid gap-2">
            <Label htmlFor={setting.key}>{setting.key}</Label>
            <Input
              id={setting.key}
              type="number"
              value={setting.value || ''}
              onChange={(e) => handleInputChange(setting, e.target.value)}
            />
          </div>
        );
      default:
        return (
          <div className="grid gap-2">
            <Label htmlFor={setting.key}>{setting.key}</Label>
            <Input
              id={setting.key}
              type="text"
              value={setting.value || ''}
              onChange={(e) => handleInputChange(setting, e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Instellingen</h1>
          <p className="text-muted-foreground">
            Configureer de algemene instellingen voor het beloningssysteem
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">Instellingen laden...</div>
      ) : !settings || settings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-lg font-medium">Geen instellingen gevonden</p>
          <p className="text-sm text-muted-foreground">
            Er zijn nog geen instellingen geconfigureerd
          </p>
        </div>
      ) : (
        settingsByCategory && (
          <Tabs defaultValue={Object.keys(settingsByCategory)[0]}>
            <TabsList className="mb-4">
              {Object.keys(settingsByCategory).map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
              <TabsContent key={category} value={category}>
                <Card>
                  <CardHeader>
                    <CardTitle>{category} Instellingen</CardTitle>
                    <CardDescription>
                      Beheer de {category.toLowerCase()} instellingen voor het beloningssysteem
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {categorySettings.map((setting) => (
                      <div key={setting.key} className="space-y-1">
                        {renderSettingInput(setting)}
                      </div>
                    ))}

                    <Button className="mt-4">
                      <Save className="mr-2 h-4 w-4" />
                      Instellingen opslaan
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )
      )}
    </div>
  );
}