import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Percent, Store, Calendar, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Define types based on actual schema
type Discount = {
  id: number;
  name: string;
  description?: string;
  partnerName: string;
  discountPercentage: number;
  code?: string;
  validUntil?: Date;
  isActive: boolean;
  termsAndConditions?: string;
  websiteUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export function Discounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form states
  const [newDiscountName, setNewDiscountName] = useState("");
  const [newDiscountDescription, setNewDiscountDescription] = useState("");
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newDiscountPercentage, setNewDiscountPercentage] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newValidUntil, setNewValidUntil] = useState("");
  const [newTermsAndConditions, setNewTermsAndConditions] = useState("");
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);

  // Fetch discounts
  const { data: discounts = [], isLoading } = useQuery<Discount[]>({
    queryKey: ["/api/discounts"],
  });

  // Create discount mutation
  const createDiscountMutation = useMutation({
    mutationFn: async (discountData: any) => {
      return apiRequest(`/api/discounts`, {
        method: "POST",
        body: JSON.stringify(discountData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discounts"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Kortingsactie aangemaakt",
        description: "De nieuwe kortingsactie is succesvol aangemaakt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij aanmaken kortingsactie",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewDiscountName("");
    setNewDiscountDescription("");
    setNewPartnerName("");
    setNewDiscountPercentage("");
    setNewCode("");
    setNewValidUntil("");
    setNewTermsAndConditions("");
    setNewWebsiteUrl("");
    setNewIsActive(true);
  };

  const handleCreateDiscount = () => {
    if (!newDiscountName.trim()) {
      toast({
        title: "Naam vereist",
        description: "Voer een naam in voor de kortingsactie.",
        variant: "destructive",
      });
      return;
    }

    if (!newPartnerName.trim()) {
      toast({
        title: "Partner naam vereist",
        description: "Voer een partner naam in.",
        variant: "destructive",
      });
      return;
    }

    if (!newDiscountPercentage || isNaN(Number(newDiscountPercentage))) {
      toast({
        title: "Kortingspercentage vereist",
        description: "Voer een geldig kortingspercentage in.",
        variant: "destructive",
      });
      return;
    }

    createDiscountMutation.mutate({
      name: newDiscountName,
      description: newDiscountDescription,
      partnerName: newPartnerName,
      discountPercentage: Number(newDiscountPercentage),
      code: newCode,
      validUntil: newValidUntil ? new Date(newValidUntil) : null,
      termsAndConditions: newTermsAndConditions,
      websiteUrl: newWebsiteUrl,
      isActive: newIsActive,
    });
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Geen einddatum";
    return new Date(date).toLocaleDateString("nl-NL");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Kortingsacties</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kortingsacties</h2>
          <p className="text-muted-foreground">
            Beheer partnerdiscounts en speciale aanbiedingen
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Kortingsactie
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nieuwe Kortingsactie Aanmaken</DialogTitle>
              <DialogDescription>
                Maak een nieuwe kortingsactie aan van een partner.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={newDiscountName}
                  onChange={(e) => setNewDiscountName(e.target.value)}
                  placeholder="Bijv. 20% korting bij Restaurant X"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={newDiscountDescription}
                  onChange={(e) => setNewDiscountDescription(e.target.value)}
                  placeholder="Beschrijf de kortingsactie..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partnerName">Partner Naam</Label>
                  <Input
                    id="partnerName"
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    placeholder="Restaurant X"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Kortingspercentage (%)</Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    min="1"
                    max="100"
                    value={newDiscountPercentage}
                    onChange={(e) => setNewDiscountPercentage(e.target.value)}
                    placeholder="20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kortingscode (optioneel)</Label>
                  <Input
                    id="code"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="EXTRA20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Geldig tot (optioneel)</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={newValidUntil}
                    onChange={(e) => setNewValidUntil(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL (optioneel)</Label>
                <Input
                  id="websiteUrl"
                  value={newWebsiteUrl}
                  onChange={(e) => setNewWebsiteUrl(e.target.value)}
                  placeholder="https://www.partner.nl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select value={newIsActive ? "true" : "false"} onValueChange={(value) => setNewIsActive(value === "true")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Actief</SelectItem>
                    <SelectItem value="false">Inactief</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateDiscount}
                disabled={createDiscountMutation.isPending}
              >
                {createDiscountMutation.isPending ? "Bezig..." : "Kortingsactie Aanmaken"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Discounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts.map((discount) => (
          <Card key={discount.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Store className="h-5 w-5 text-primary" />
                  <Badge variant={discount.isActive ? "default" : "secondary"}>
                    {discount.isActive ? "Actief" : "Inactief"}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-lg">{discount.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <span>{discount.partnerName}</span>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Percent className="h-3 w-3" />
                  <span>{discount.discountPercentage}%</span>
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {discount.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {discount.description}
                  </p>
                )}
                {discount.code && (
                  <div className="text-sm">
                    <span className="font-medium">Code:</span> {discount.code}
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Geldig tot: {formatDate(discount.validUntil)}</span>
                </div>
                {discount.websiteUrl && (
                  <div className="pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={discount.websiteUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Bezoek Website
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {discounts.length === 0 && (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Geen kortingsacties gevonden
          </h3>
          <p className="text-muted-foreground mb-4">
            Maak je eerste kortingsactie aan om medewerkers extra waarde te bieden.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Eerste Kortingsactie Aanmaken
          </Button>
        </div>
      )}
    </div>
  );
}