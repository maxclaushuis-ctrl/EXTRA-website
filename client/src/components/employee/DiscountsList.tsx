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
  });

  const handleCopyCode = (discount: Discount) => {
    navigator.clipboard.writeText(discount.discountCode);
    setCopiedId(discount.id);
    toast({
      title: t("discountCodeCopied"),
      description: t("discountCodeCopiedMessage", { code: discount.discountCode }),
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
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{t("errorLoadingDiscounts")}</p>
      </div>
    );
  }

  if (!discounts || discounts.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">{t("noDiscountsAvailable")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 pt-4 pb-16 md:grid-cols-2">
      {discounts.map((discount) => (
        <Card key={discount.id} className="overflow-hidden border-none bg-white shadow-md">
          {discount.imageUrl && (
            <div
              className="h-48 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${discount.imageUrl})` }}
            />
          )}
          <CardHeader className="p-4">
            <div className="flex items-center">
              <div className="mr-2 min-h-10 min-w-10 overflow-hidden rounded-full border border-gray-200 bg-white p-1">
                <img 
                  src={`https://logo.clearbit.com/${discount.partner?.toLowerCase().replace(/\s+/g, '')}.com`} 
                  alt={discount.partner || "Partner logo"}
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/40?text=?"; 
                  }}
                />
              </div>
              <div>
                <CardTitle className="text-lg">{discount.name}</CardTitle>
                <CardDescription className="text-xs">
                  {t("offeredBy")} {discount.partner}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-gray-600">{discount.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between p-4 pt-0">
            <Badge variant="outline" className="bg-blue-50 text-blue-600">{discount.category}</Badge>
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={() => handleCopyCode(discount)}
            >
              {copiedId === discount.id ? (
                <>
                  <Check className="h-4 w-4" />
                  {t("copied")}
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4" />
                  {t("copyDiscountCode")}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
