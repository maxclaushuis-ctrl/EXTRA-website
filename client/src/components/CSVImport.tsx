import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';

export default function CSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Check bestandstype (moet CSV zijn)
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Ongeldig bestandstype',
        description: 'Upload een CSV-bestand',
        variant: 'destructive',
      });
      return;
    }
    
    setFile(selectedFile);
    
    // Lees een preview van het CSV-bestand
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(0, 5); // Toon maximaal 5 rijen als preview
      const parsedRows = rows.map(row => row.split(','));
      setPreview(parsedRows);
    };
    reader.readAsText(selectedFile);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Check bestandstype (moet CSV zijn)
      if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
        toast({
          title: 'Ongeldig bestandstype',
          description: 'Upload een CSV-bestand',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(droppedFile);
      
      // Lees een preview van het CSV-bestand
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').slice(0, 5); // Toon maximaal 5 rijen als preview
        const parsedRows = rows.map(row => row.split(','));
        setPreview(parsedRows);
      };
      reader.readAsText(droppedFile);
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    setPreview([]);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    
    // Simuleer een upload proces
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploadStatus('success');
          
          toast({
            title: 'Upload voltooid',
            description: `${file.name} is succesvol geïmporteerd`,
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    // Hier zou de echte upload naar de server plaatsvinden
    // const formData = new FormData();
    // formData.append('file', file);
    // 
    // try {
    //   const response = await fetch('/api/import/csv', {
    //     method: 'POST',
    //     body: formData,
    //   });
    //   
    //   if (response.ok) {
    //     setUploadStatus('success');
    //     toast({
    //       title: 'Upload voltooid',
    //       description: `${file.name} is succesvol geïmporteerd`,
    //     });
    //   } else {
    //     setUploadStatus('error');
    //     toast({
    //       title: 'Upload mislukt',
    //       description: 'Er is een fout opgetreden bij het importeren',
    //       variant: 'destructive',
    //     });
    //   }
    // } catch (error) {
    //   setUploadStatus('error');
    //   toast({
    //     title: 'Upload mislukt',
    //     description: 'Er is een fout opgetreden bij het importeren',
    //     variant: 'destructive',
    //   });
    // } finally {
    //   setUploading(false);
    // }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>CSV Contacten Importeren</CardTitle>
        <CardDescription>
          Upload een CSV-bestand met contactgegevens om in bulk medewerkers toe te voegen
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!file ? (
          <div
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="mb-4 rounded-full bg-blue-50 p-3">
              <Upload className="h-6 w-6 text-blue-500" />
            </div>
            <p className="mb-2 text-sm font-medium">Sleep een CSV-bestand hierheen of</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Bestand kiezen
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Het bestand moet een header-rij bevatten met kolommen voor e-mail, naam, rol, etc.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Toon een preview van de CSV-data */}
            {preview.length > 0 && (
              <div className="mb-4 overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {preview[0].map((cell, i) => (
                        <th key={i} className="p-2 text-left">{cell}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, i) => (
                      <tr key={i} className="border-b">
                        {row.map((cell, j) => (
                          <td key={j} className="p-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {uploading && (
              <div className="mb-4 space-y-2">
                <Progress value={progress} className="h-2 w-full" />
                <p className="text-xs text-muted-foreground">
                  Importeren... {progress}%
                </p>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="mb-4 flex items-center rounded-lg bg-green-50 p-3 text-green-600">
                <Check className="mr-2 h-4 w-4" />
                <p className="text-sm">Import succesvol voltooid</p>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div className="mb-4 flex items-center rounded-lg bg-red-50 p-3 text-red-600">
                <AlertCircle className="mr-2 h-4 w-4" />
                <p className="text-sm">Er is een fout opgetreden bij het importeren</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {file && uploadStatus === 'idle' && (
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleUpload} 
            disabled={uploading}
          >
            {uploading ? 'Importeren...' : 'Importeren'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}