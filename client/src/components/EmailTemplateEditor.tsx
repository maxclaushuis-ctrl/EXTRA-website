import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EmailTemplateEditorProps {
  htmlContent: string;
  onHtmlChange: (content: string) => void;
  textContent: string;
  onTextChange: (content: string) => void;
}

const EmailTemplateEditor = ({
  htmlContent,
  onHtmlChange,
  textContent,
  onTextChange,
}: EmailTemplateEditorProps) => {
  const [activeTab, setActiveTab] = useState<string>("html");
  
  // Variabelen die in templates gebruikt kunnen worden
  const variables = [
    { key: 'firstName', value: 'John', description: 'Voornaam van de ontvanger' },
    { key: 'lastName', value: 'Doe', description: 'Achternaam van de ontvanger' },
    { key: 'email', value: 'john.doe@example.com', description: 'E-mailadres van de ontvanger' },
    { key: 'points', value: '100', description: 'Aantal punten (voor verjaardagen)' },
    { key: 'naam', value: 'John Doe', description: 'Volledige naam (verouderd)' }
  ];
  
  // Helper functie om alle variabelen te vervangen in de preview
  const replaceVariables = (content: string): string => {
    let result = content;
    variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
      result = result.replace(regex, variable.value);
    });
    return result;
  };
  
  // Insert variabele in cursor positie
  const insertVariable = (variable: string) => {
    // Voeg variabele toe aan het actieve veld (HTML of tekst)
    const varToInsert = `{{${variable}}}`;
    if (activeTab === 'html') {
      onHtmlChange(htmlContent + varToInsert);
    } else if (activeTab === 'text') {
      onTextChange(textContent + varToInsert);
    }
  };
  
  return (
    <div className="border rounded-md p-1">
      <div className="p-2 bg-gray-50 border-b flex flex-wrap gap-1">
        <p className="text-sm text-gray-500 mr-2 flex items-center">Variabelen:</p>
        <TooltipProvider>
          {variables.map((variable) => (
            <Tooltip key={variable.key}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 py-0 h-6 text-xs"
                  onClick={() => insertVariable(variable.key)}
                >
                  {`{{${variable.key}}}`}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{variable.description}</p>
                <p className="text-xs text-gray-500">Klik om in te voegen</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
      
      <Tabs defaultValue="html" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="text">Tekst</TabsTrigger>
          <TabsTrigger value="preview">Voorbeeld</TabsTrigger>
        </TabsList>
        
        <TabsContent value="html" className="p-4">
          <Textarea
            value={htmlContent}
            onChange={(e) => onHtmlChange(e.target.value)}
            placeholder="HTML inhoud van de e-mail"
            className="min-h-[300px] font-mono"
          />
          <p className="text-sm text-gray-500 mt-2">
            Gebruik dubbele accolades met variabele naam (bijv. &#123;&#123;firstName&#125;&#125;, &#123;&#123;points&#125;&#125;).
          </p>
        </TabsContent>
        
        <TabsContent value="text" className="p-4">
          <Textarea
            value={textContent}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Tekst versie van de e-mail"
            className="min-h-[300px] font-mono"
          />
          <p className="text-sm text-gray-500 mt-2">
            Gebruik dezelfde variabelen als in de HTML versie voor consistentie.
          </p>
        </TabsContent>
        
        <TabsContent value="preview" className="p-4">
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-100 border-b p-2 flex items-center">
              <div className="rounded-full w-3 h-3 bg-red-500 mr-2"></div>
              <div className="rounded-full w-3 h-3 bg-yellow-500 mr-2"></div>
              <div className="rounded-full w-3 h-3 bg-green-500 mr-2"></div>
              <div className="text-xs text-gray-500 flex-1 text-center">E-mail voorbeeld</div>
            </div>
            <ScrollArea className="h-[300px] p-4 bg-white">
              <div 
                className="preview-content" 
                dangerouslySetInnerHTML={{ __html: replaceVariables(htmlContent) }} 
              />
            </ScrollArea>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Dit is een voorbeeld van hoe de e-mail eruit zal zien. Variabelen zijn vervangen door voorbeeldwaarden.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailTemplateEditor;