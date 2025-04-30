import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tag, Percent, ShoppingBag, Phone, Coffee, Film, Gift } from 'lucide-react';

export function DiscountsList() {
  // Voor de demo gebruiken we een vaste lijst kortingsacties
  // In een productieomgeving zou dit van een API komen
  const discounts = useMemo(() => [
    {
      id: 1,
      name: "25% korting bij Uber Eats",
      description: "Bestel voedsel met 25% korting bij je eerste Uber Eats bestelling.",
      partner: "Uber Eats",
      discount: "25%",
      expiry: "31 mei 2025",
      code: "EXTRA25",
      category: "food",
      icon: <ShoppingBag className="h-5 w-5 text-[#00AAFF]" />
    },
    {
      id: 2,
      name: "10% korting bij MediaMarkt",
      description: "Ontvang 10% korting op alle elektronica bij MediaMarkt.",
      partner: "MediaMarkt",
      discount: "10%",
      expiry: "15 juni 2025",
      code: "EXTRA10MM",
      category: "electronics",
      icon: <Phone className="h-5 w-5 text-[#00AAFF]" />
    },
    {
      id: 3,
      name: "Gratis koffie bij Starbucks",
      description: "Haal een gratis koffie (kleine maat) bij je eerste bezoek aan Starbucks.",
      partner: "Starbucks",
      discount: "100%",
      expiry: "30 juni 2025",
      code: "EXTRACOFFEE",
      category: "food",
      icon: <Coffee className="h-5 w-5 text-[#00AAFF]" />
    },
    {
      id: 4,
      name: "2 voor 1 bij Pathé Bioscopen",
      description: "Twee kaartjes voor de prijs van één bij alle Pathé vestigingen.",
      partner: "Pathé",
      discount: "50%",
      expiry: "1 juli 2025",
      code: "EXTRA2FOR1",
      category: "entertainment",
      icon: <Film className="h-5 w-5 text-[#00AAFF]" />
    },
    {
      id: 5,
      name: "€10 korting bij Bol.com",
      description: "€10 korting bij je bestelling vanaf €50 bij Bol.com.",
      partner: "Bol.com",
      discount: "€10",
      expiry: "31 juli 2025",
      code: "EXTRABOL10",
      category: "shopping",
      icon: <ShoppingBag className="h-5 w-5 text-[#00AAFF]" />
    }
  ], []);

  const handleClaim = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Kortingscode ${code} gekopieerd naar klembord!`);
  };

  return (
    <div className="space-y-4 pb-16">
      
      {discounts.map((discount) => (
        <Card key={discount.id} className="bg-gray-900 border-gray-800 text-white shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  {discount.icon}
                  {discount.name}
                </CardTitle>
                <CardDescription className="text-gray-400 mt-1">
                  Via {discount.partner} • Geldig tot {discount.expiry}
                </CardDescription>
              </div>
              <div className="bg-[#00AAFF] text-white font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <Percent className="h-4 w-4" />
                {discount.discount}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-gray-300">{discount.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-0">
            <div className="flex items-center text-sm">
              <span className="text-gray-400 mr-2">Code:</span>
              <code className="bg-gray-800 px-2 py-1 rounded">{discount.code}</code>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleClaim(discount.code)}
              className="bg-transparent hover:bg-[#00AAFF] hover:text-white border-[#00AAFF] text-[#00AAFF]"
            >
              Kopieer code
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}