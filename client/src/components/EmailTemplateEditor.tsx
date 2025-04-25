import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { 
  AlignCenterIcon, 
  AlignLeftIcon, 
  AlignRightIcon, 
  BoldIcon, 
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MousePointerClickIcon,
  Paintbrush,
  PanelTopIcon,
  Pilcrow,
  Underline,
  Type,
  PaletteIcon
} from "lucide-react";

interface EmailTemplateEditorProps {
  htmlContent: string;
  onHtmlChange: (content: string) => void;
  textContent: string;
  onTextChange: (content: string) => void;
}

interface StyleOption {
  name: string;
  preview: React.ReactNode;
  htmlPrefix: string;
  htmlSuffix: string;
}

const fontSizes = [
  { value: "1", label: "Extra klein" },
  { value: "2", label: "Klein" },
  { value: "3", label: "Normaal" },
  { value: "4", label: "Groot" },
  { value: "5", label: "Extra groot" },
  { value: "6", label: "Heel groot" },
  { value: "7", label: "Enorm" },
];

const fontColors = [
  { value: "#000000", label: "Zwart" },
  { value: "#FFFFFF", label: "Wit" },
  { value: "#9442E9", label: "EXTRA Paars" },
  { value: "#C5FDBB", label: "EXTRA Neon" },
  { value: "#B9EBFF", label: "EXTRA Blauw" },
  { value: "#FF0000", label: "Rood" },
  { value: "#007BFF", label: "Blauw" },
  { value: "#28A745", label: "Groen" },
  { value: "#FFC107", label: "Geel" },
  { value: "#DC3545", label: "Gevaar" },
  { value: "#6C757D", label: "Grijs" },
];

const buttonStyles = [
  { 
    name: "EXTRA Paars", 
    preview: <div className="bg-[#9442E9] text-white text-center py-1 px-3 rounded">Knop</div>,
    htmlPrefix: '<a href="##URL##" style="display: inline-block; background-color: #9442E9; color: white; font-family: Poppins, sans-serif; font-weight: 500; text-decoration: none; padding: 10px 20px; border-radius: 4px; text-align: center;">',
    htmlSuffix: '</a>'
  },
  { 
    name: "EXTRA Neon", 
    preview: <div className="bg-[#C5FDBB] text-black text-center py-1 px-3 rounded">Knop</div>,
    htmlPrefix: '<a href="##URL##" style="display: inline-block; background-color: #C5FDBB; color: black; font-family: Poppins, sans-serif; font-weight: 500; text-decoration: none; padding: 10px 20px; border-radius: 4px; text-align: center;">',
    htmlSuffix: '</a>'
  },
  { 
    name: "EXTRA Blauw", 
    preview: <div className="bg-[#B9EBFF] text-black text-center py-1 px-3 rounded">Knop</div>,
    htmlPrefix: '<a href="##URL##" style="display: inline-block; background-color: #B9EBFF; color: black; font-family: Poppins, sans-serif; font-weight: 500; text-decoration: none; padding: 10px 20px; border-radius: 4px; text-align: center;">',
    htmlSuffix: '</a>'
  },
  { 
    name: "Eenvoudig", 
    preview: <div className="bg-gray-100 text-black text-center py-1 px-3 rounded border">Knop</div>,
    htmlPrefix: '<a href="##URL##" style="display: inline-block; background-color: #f1f1f1; color: black; font-family: Poppins, sans-serif; font-weight: 500; text-decoration: none; padding: 10px 20px; border: 1px solid #ccc; border-radius: 4px; text-align: center;">',
    htmlSuffix: '</a>'
  },
  { 
    name: "Primair", 
    preview: <div className="bg-blue-600 text-white text-center py-1 px-3 rounded">Knop</div>,
    htmlPrefix: '<a href="##URL##" style="display: inline-block; background-color: #0d6efd; color: white; font-family: Poppins, sans-serif; font-weight: 500; text-decoration: none; padding: 10px 20px; border-radius: 4px; text-align: center;">',
    htmlSuffix: '</a>'
  },
  { 
    name: "Secundair", 
    preview: <div className="bg-gray-500 text-white text-center py-1 px-3 rounded">Knop</div>,
    htmlPrefix: '<a href="##URL##" style="display: inline-block; background-color: #6c757d; color: white; font-family: Poppins, sans-serif; font-weight: 500; text-decoration: none; padding: 10px 20px; border-radius: 4px; text-align: center;">',
    htmlSuffix: '</a>'
  },
  { 
    name: "Succes", 
    preview: <div className="bg-green-600 text-white text-center py-1 px-3 rounded">Knop</div>,
    htmlPrefix: '<a href="##URL##" style="display: inline-block; background-color: #28a745; color: white; font-family: Poppins, sans-serif; font-weight: 500; text-decoration: none; padding: 10px 20px; border-radius: 4px; text-align: center;">',
    htmlSuffix: '</a>'
  },
];

const bannerTemplates = [
  { 
    name: "EXTRA Blauw",
    html: `<div style="background-color: #B9EBFF; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
    <img src="https://via.placeholder.com/200x80/B9EBFF/000000?text=EXTRA" alt="EXTRA logo" style="max-width: 200px; height: auto;" />
  </div>`
  },
  { 
    name: "EXTRA Paars",
    html: `<div style="background-color: #9442E9; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
    <img src="https://via.placeholder.com/200x80/9442E9/FFFFFF?text=EXTRA" alt="EXTRA logo" style="max-width: 200px; height: auto;" />
  </div>`
  },
  { 
    name: "EXTRA Neon",
    html: `<div style="background-color: #C5FDBB; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
    <img src="https://via.placeholder.com/200x80/C5FDBB/000000?text=EXTRA" alt="EXTRA logo" style="max-width: 200px; height: auto;" />
  </div>`
  },
  { 
    name: "Eenvoudig",
    html: `<div style="background-color: #f8f9fa; padding: 20px; text-align: center; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 20px;">
    <img src="https://via.placeholder.com/200x80/FFFFFF/000000?text=EXTRA" alt="EXTRA logo" style="max-width: 200px; height: auto;" />
  </div>`
  },
];

const EmailTemplateEditor = ({
  htmlContent,
  onHtmlChange,
  textContent,
  onTextChange,
}: EmailTemplateEditorProps) => {
  const [activeTab, setActiveTab] = useState<string>("visual");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [selectedButtonStyle, setSelectedButtonStyle] = useState<StyleOption>(buttonStyles[0]);
  const [selectedFontSize, setSelectedFontSize] = useState("3"); // Default: Normaal
  const [selectedFontColor, setSelectedFontColor] = useState("#000000"); // Default: Zwart
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showButtonDialog, setShowButtonDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showFontSizeDialog, setShowFontSizeDialog] = useState(false);
  const [showFontColorDialog, setShowFontColorDialog] = useState(false);
  
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
  
  // Insert variabele in cursor positie of aan het einde
  const insertAtCursor = (textToInsert: string) => {
    if (activeTab !== 'html') {
      setActiveTab('html');
    }
    
    const textarea = textareaRef.current;
    if (!textarea) {
      onHtmlChange(htmlContent + textToInsert);
      return;
    }
    
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const newContent = 
      htmlContent.substring(0, startPos) + 
      textToInsert + 
      htmlContent.substring(endPos);
    
    onHtmlChange(newContent);
    
    // Focus terug op textarea en plaats cursor na de ingevoegde tekst
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = startPos + textToInsert.length;
      textarea.selectionEnd = startPos + textToInsert.length;
    }, 0);
  };
  
  // Insert variabele
  const insertVariable = (variable: string) => {
    const varToInsert = `{{${variable}}}`;
    insertAtCursor(varToInsert);
  };
  
  // Opmaak toevoegen
  const addFormatting = (prefix: string, suffix: string) => {
    insertAtCursor(prefix + suffix);
    // Plaats de cursor tussen de tags
    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart - suffix.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = pos;
          textareaRef.current.selectionEnd = pos;
        }
      }, 0);
    }
  };
  
  const insertLink = () => {
    if (!linkUrl) return;
    
    const linkHtml = `<a href="${linkUrl}" style="color: #0d6efd; text-decoration: none;">${linkText || linkUrl}</a>`;
    insertAtCursor(linkHtml);
    
    // Reset formulier
    setLinkUrl("");
    setLinkText("");
    setShowLinkDialog(false);
  };
  
  const insertButton = () => {
    if (!buttonUrl) return;
    
    let buttonHtml = selectedButtonStyle.htmlPrefix.replace('##URL##', buttonUrl);
    buttonHtml += buttonText || 'Klik hier';
    buttonHtml += selectedButtonStyle.htmlSuffix;
    
    insertAtCursor(buttonHtml);
    
    // Reset formulier
    setButtonUrl("");
    setButtonText("");
    setShowButtonDialog(false);
  };
  
  const insertBanner = (bannerHtml: string) => {
    insertAtCursor(bannerHtml);
    setShowBannerDialog(false);
  };

  // Lettergrootte toepassen op geselecteerde tekst of invoegen op cursor positie
  const applyFontSize = (size: string) => {
    const sizeValue = size === "1" ? "10px" : 
                     size === "2" ? "12px" : 
                     size === "3" ? "16px" : 
                     size === "4" ? "20px" : 
                     size === "5" ? "24px" : 
                     size === "6" ? "30px" : "36px";
                     
    addFormatting(`<span style="font-size: ${sizeValue};">`, '</span>');
    setSelectedFontSize(size);
    setShowFontSizeDialog(false);
  };
  
  // Tekstkleur toepassen op geselecteerde tekst of invoegen op cursor positie
  const applyFontColor = (color: string) => {
    addFormatting(`<span style="color: ${color};">`, '</span>');
    setSelectedFontColor(color);
    setShowFontColorDialog(false);
  };
  
  // Synchroniseer tekst versie wanneer HTML verandert
  useEffect(() => {
    // Eenvoudige HTML naar tekst conversie
    if (activeTab === 'html') {
      const stripHtml = (html: string) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        return text;
      };
      
      // Alleen bijwerken als er significante wijzigingen zijn
      const textVersion = stripHtml(htmlContent);
      if (textVersion.trim() !== textContent.trim()) {
        onTextChange(textVersion);
      }
    }
  }, [htmlContent, activeTab]);
  
  return (
    <div className="border rounded-md">
      <div className="p-2 bg-gray-50 border-b flex flex-wrap gap-1">
        <p className="text-sm text-gray-500 flex items-center mr-2">Variabelen:</p>
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
      
      <Tabs defaultValue="visual" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="visual" className="flex items-center gap-1">
            <Paintbrush className="h-4 w-4" /> Visueel
          </TabsTrigger>
          <TabsTrigger value="html" className="flex items-center gap-1">
            <Type className="h-4 w-4" /> HTML
          </TabsTrigger>
          <TabsTrigger value="text">Tekst</TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1">
            <MousePointerClickIcon className="h-4 w-4" /> Voorbeeld
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="visual" className="p-4">
          <div className="flex flex-wrap gap-2 p-2 mb-4 border-b">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<h1 style="font-family: Poppins, sans-serif; font-size: 24px; font-weight: 700; margin-bottom: 10px;">', '</h1>')}
                >
                  <Type className="h-4 w-4" />
                  <span className="ml-1">H1</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Koptekst 1</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<h2 style="font-family: Poppins, sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 8px;">', '</h2>')}
                >
                  <Type className="h-4 w-4" />
                  <span className="ml-1">H2</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Koptekst 2</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<p style="font-family: Poppins, sans-serif; font-size: 16px; line-height: 1.5; margin-bottom: 16px;">', '</p>')}
                >
                  <Pilcrow className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Paragraaf</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-8" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<strong>', '</strong>')}
                >
                  <BoldIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vetgedrukt</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<em>', '</em>')}
                >
                  <ItalicIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cursief</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<u>', '</u>')}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Onderstrepen</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-8" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<div style="text-align: left;">', '</div>')}
                >
                  <AlignLeftIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Links uitlijnen</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<div style="text-align: center;">', '</div>')}
                >
                  <AlignCenterIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Centreren</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<div style="text-align: right;">', '</div>')}
                >
                  <AlignRightIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rechts uitlijnen</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-8" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<ul style="margin-bottom: 16px; padding-left: 20px;">\n  <li style="margin-bottom: 8px;">', '</li>\n</ul>')}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Lijst met bullets</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addFormatting('<ol style="margin-bottom: 16px; padding-left: 20px;">\n  <li style="margin-bottom: 8px;">', '</li>\n</ol>')}
                >
                  <ListOrderedIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Genummerde lijst</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-8" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowLinkDialog(true)}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Link toevoegen</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowButtonDialog(true)}
                >
                  <MousePointerClickIcon className="h-4 w-4" />
                  <span className="ml-1">Knop</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Knop toevoegen</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowBannerDialog(true)}
                >
                  <PanelTopIcon className="h-4 w-4" />
                  <span className="ml-1">Banner</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Banner toevoegen</TooltipContent>
            </Tooltip>
          </div>
          
          {showLinkDialog && (
            <div className="p-4 mb-4 border rounded-md bg-gray-50">
              <h3 className="text-sm font-bold mb-2">Link toevoegen</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="link-url">URL</Label>
                  <Input 
                    id="link-url" 
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="link-text">Tekst (optioneel)</Label>
                  <Input 
                    id="link-text" 
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Klik hier"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLinkDialog(false)}
                  >
                    Annuleren
                  </Button>
                  <Button
                    size="sm"
                    onClick={insertLink}
                    disabled={!linkUrl}
                  >
                    Invoegen
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {showButtonDialog && (
            <div className="p-4 mb-4 border rounded-md bg-gray-50">
              <h3 className="text-sm font-bold mb-2">Knop toevoegen</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="button-url">URL</Label>
                  <Input 
                    id="button-url" 
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="button-text">Tekst</Label>
                  <Input 
                    id="button-text" 
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Klik hier"
                  />
                </div>
                <div>
                  <Label>Stijl</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {buttonStyles.map((style) => (
                      <div 
                        key={style.name}
                        className={`border rounded-md p-2 cursor-pointer ${selectedButtonStyle.name === style.name ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedButtonStyle(style)}
                      >
                        <div className="text-xs text-gray-600 mb-1">{style.name}</div>
                        {style.preview}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowButtonDialog(false)}
                  >
                    Annuleren
                  </Button>
                  <Button
                    size="sm"
                    onClick={insertButton}
                    disabled={!buttonUrl}
                  >
                    Invoegen
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {showBannerDialog && (
            <div className="p-4 mb-4 border rounded-md bg-gray-50">
              <h3 className="text-sm font-bold mb-2">Banner toevoegen</h3>
              <div className="grid gap-4">
                <Label>Kies een banner</Label>
                <div className="grid grid-cols-2 gap-2">
                  {bannerTemplates.map((banner) => (
                    <div 
                      key={banner.name}
                      className="border rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
                      onClick={() => insertBanner(banner.html)}
                    >
                      <div className="p-2 bg-gray-100 border-b text-sm">{banner.name}</div>
                      <div 
                        className="p-2" 
                        dangerouslySetInnerHTML={{ __html: banner.html }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBannerDialog(false)}
                  >
                    Annuleren
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="border rounded-md overflow-hidden bg-white">
            <ScrollArea className="h-[300px]">
              <div 
                className="p-4 preview-content" 
                dangerouslySetInnerHTML={{ __html: replaceVariables(htmlContent) }} 
              />
            </ScrollArea>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Gebruik de werkbalk om visueel je e-mail te ontwerpen. 
            Voeg koppen, paragrafen, links en meer toe zonder HTML-kennis.
          </p>
        </TabsContent>
        
        <TabsContent value="html" className="p-4">
          <Textarea
            ref={textareaRef}
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
            <ScrollArea className="h-[400px] bg-white">
              <div
                className="p-4 preview-content" 
                style={{ fontFamily: 'Poppins, sans-serif' }}
                dangerouslySetInnerHTML={{ __html: replaceVariables(htmlContent) }} 
              />
            </ScrollArea>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Dit is een voorbeeld van hoe de e-mail eruit zal zien. Variabelen zijn vervangen door voorbeeldwaarden.
          </p>
        </TabsContent>
      </Tabs>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .preview-content * {
          font-family: Poppins, sans-serif;
        }
      `}} />
    </div>
  );
};

export default EmailTemplateEditor;