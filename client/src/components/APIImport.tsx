import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Database, Check, RefreshCw, AlertCircle } from 'lucide-react';

export default function APIImport() {
  const [apiEndpoint, setApiEndpoint] = useState('https://api.example.com/employees');
  const [apiKey, setApiKey] = useState('');
  const [importMethod, setImportMethod] = useState('merge');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importResult, setImportResult] = useState<{ total: number; imported: number; errors: number } | null>(null);
  
  const { toast } = useToast();
  
  const handleImport = async () => {
    if (!apiEndpoint) {
      toast({
        title: 'API Endpoint ontbreekt',
        description: 'Vul een geldig API endpoint in',
        variant: 'destructive',
      });
      return;
    }
    
    setIsImporting(true);
    setImportStatus('idle');
    
    // Simuleer een API-import proces
    setTimeout(() => {
      setIsImporting(false);
      setImportStatus('success');
      setImportResult({
        total: 24,
        imported: 22,
        errors: 2,
      });
      
      toast({
        title: 'Import voltooid',
        description: `22 contacten succesvol geïmporteerd`,
      });
    }, 2000);
    
    // Hier zou de echte API-import plaatsvinden
    // try {
    //   const response = await fetch('/api/import/api', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       apiEndpoint,
    //       apiKey,
    //       importMethod,
    //     }),
    //   });
    //   
    //   if (response.ok) {
    //     const result = await response.json();
    //     setImportResult(result);
    //     setImportStatus('success');
    //     
    //     toast({
    //       title: 'Import voltooid',
    //       description: `${result.imported} contacten succesvol geïmporteerd`,
    //     });
    //   } else {
    //     setImportStatus('error');
    //     toast({
    //       title: 'Import mislukt',
    //       description: 'Er is een fout opgetreden bij het importeren',
    //       variant: 'destructive',
    //     });
    //   }
    // } catch (error) {
    //   setImportStatus('error');
    //   toast({
    //     title: 'Import mislukt',
    //     description: 'Er is een fout opgetreden bij het importeren',
    //     variant: 'destructive',
    //   });
    // } finally {
    //   setIsImporting(false);
    // }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Contacten Importeren</CardTitle>
        <CardDescription>
          Importeer contacten uit een externe API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-endpoint">API Endpoint</Label>
          <Input
            id="api-endpoint"
            placeholder="https://api.example.com/employees"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Het volledige endpoint URL waar de contactgegevens opgehaald kunnen worden
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="api-key">API Sleutel (optioneel)</Label>
          <Input
            id="api-key"
            type="password"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Authenticatiesleutel voor toegang tot de API
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>Import Methode</Label>
          <RadioGroup 
            defaultValue="merge" 
            value={importMethod}
            onValueChange={setImportMethod}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="merge" id="merge" />
              <Label htmlFor="merge">Samenvoegen</Label>
              <span className="text-xs text-muted-foreground">(Update bestaande contacten, voeg nieuwe toe)</span>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="replace" id="replace" />
              <Label htmlFor="replace">Vervangen</Label>
              <span className="text-xs text-muted-foreground">(Verwijder bestaande contacten en vervang door nieuwe)</span>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="add" id="add" />
              <Label htmlFor="add">Alleen toevoegen</Label>
              <span className="text-xs text-muted-foreground">(Voeg alleen nieuwe contacten toe, update bestaande niet)</span>
            </div>
          </RadioGroup>
        </div>
        
        {importStatus === 'success' && importResult && (
          <div className="rounded-lg bg-green-50 p-4">
            <div className="mb-2 flex items-center">
              <Check className="mr-2 h-5 w-5 text-green-600" />
              <h3 className="font-medium text-green-800">Import voltooid</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Totaal verwerkt:</span> {importResult.total}</p>
              <p><span className="font-medium">Succesvol geïmporteerd:</span> {importResult.imported}</p>
              <p><span className="font-medium">Fouten:</span> {importResult.errors}</p>
            </div>
          </div>
        )}
        
        {importStatus === 'error' && (
          <div className="flex items-center rounded-lg bg-red-50 p-4 text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            <div>
              <p className="font-medium">Import mislukt</p>
              <p className="text-sm">Er is een fout opgetreden bij het importeren van contacten</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">
          <Database className="mr-2 h-4 w-4" />
          Testen
        </Button>
        <Button 
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Importeren...
            </>
          ) : (
            'Importeren'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}