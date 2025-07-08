import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clipboard, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Discount } from "@shared/schema";

export default function DiscountsList() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: discounts, isLoading, error } = useQuery<Discount[]>({
    queryKey: ["/api/discounts"],
    queryFn: async () => {
      const response = await fetch('/api/discounts', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }
  });

  const handleCopyCode = (discount: Discount) => {
    navigator.clipboard.writeText(discount.discountCode);
    setCopiedId(discount.id);
    toast({
      title: "Kortingscode gekopieerd",
      description: `De code "${discount.discountCode}" is gekopieerd naar het klembord`,
    });

    // Reset copy icon after 3 seconds
    setTimeout(() => {
      setCopiedId(null);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 pt-4 pb-16 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden border-none bg-white shadow-md">
            <div className="h-48">
              <Skeleton className="h-full w-full" />
            </div>
            <CardHeader className="p-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-16 w-full" />
            </CardContent>
            <CardFooter className="flex justify-between p-4 pt-0">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('Discount loading error:', error);
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Fout bij het laden van kortingsacties</p>
        <p className="text-sm text-gray-400 mt-2">{error.message}</p>
      </div>
    );
  }

  if (!discounts || discounts.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Geen kortingsacties beschikbaar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 pb-16">
      {discounts.map((discount) => (
        <Card key={discount.id} className="border-none bg-gray-900 text-white overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-white text-lg font-semibold mb-2">{discount.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{discount.description}</p>
              </div>
              
              {discount.imageUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden ml-4 flex-shrink-0">
                  <img 
                    src={discount.imageUrl} 
                    alt={discount.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700">
                {discount.category}
              </Badge>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleCopyCode(discount)}
              >
                {copiedId === discount.id ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Gekopieerd
                  </>
                ) : (
                  <>
                    <Clipboard className="h-4 w-4 mr-2" />
                    Code kopiëren
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
