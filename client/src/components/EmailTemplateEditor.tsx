import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmailTemplateEditorProps {
  htmlContent: string;
  onHtmlChange: (content: string) => void;
  textContent: string;
  onTextChange: (content: string) => void;
}

export const EmailTemplateEditor = ({
  htmlContent,
  onHtmlChange,
  textContent,
  onTextChange,
}: EmailTemplateEditorProps) => {
  const [activeTab, setActiveTab] = useState<string>("html");
  
  return (
    <div className="border rounded-md p-1">
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
            Gebruik {{naam}} als placeholder voor de naam van de ontvanger.
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
            Gebruik {{naam}} als placeholder voor de naam van de ontvanger.
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
                dangerouslySetInnerHTML={{ __html: htmlContent.replace(/{{naam}}/g, 'John Doe') }} 
              />
            </ScrollArea>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Dit is een voorbeeld van hoe de e-mail eruit zal zien. Placeholders zijn vervangen door voorbeeldwaarden.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};