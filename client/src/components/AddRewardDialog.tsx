import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRewardSchema } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "./ui/image-upload";

// Formulier schema voor beloningen
const rewardFormSchema = insertRewardSchema.extend({
  image: z.instanceof(File).optional(),
});

type RewardFormValues = z.infer<typeof rewardFormSchema>;

interface AddRewardDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRewardDialog({ isOpen, onClose }: AddRewardDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Formulier initialiseren
  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsCost: 0,
      status: "available",
      stock: null,
    },
  });

  // Beloning toevoegen mutatie
  const addRewardMutation = useMutation({
    mutationFn: async (data: RewardFormValues) => {
      // Als er een afbeelding is, deze eerst uploaden
      let imageUrl = null;
      if (data.image) {
        const formData = new FormData();
        formData.append("image", data.image);

        // Hier zou normaal een echte afbeeldingsupload API zijn
        // Voor nu gebruiken we een lokale URL
        imageUrl = URL.createObjectURL(data.image);
      }

      // Verwijder de afbeelding uit de data, want deze sturen we niet naar de API
      const { image, ...rewardData } = data;

      // Stuur de reward data naar de API
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...rewardData,
          imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Kon beloning niet toevoegen");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalideer de query cache om een refresh te triggeren
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      
      // Toon success bericht
      toast({
        title: "Beloning toegevoegd",
        description: "De beloning is succesvol toegevoegd",
      });
      
      // Reset form en sluit dialog
      form.reset();
      setImagePreview(null);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Form submission handler
  const onSubmit = (data: RewardFormValues) => {
    setIsSubmitting(true);
    addRewardMutation.mutate(data);
  };

  // Handler voor afbeelding upload
  const handleImageChange = (file: File | null): void => {
    if (file) {
      form.setValue("image", file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      form.setValue("image", undefined);
      setImagePreview(null);
    }
  };

  // Dialog sluiten en form resetten
  const handleClose = () => {
    form.reset();
    setImagePreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Beloning toevoegen</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe beloning toe die medewerkers kunnen inwisselen met hun punten
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Afbeelding upload */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Afbeelding</FormLabel>
                  <FormControl>
                    <ImageUpload
                      onChange={(file) => handleImageChange(file)}
                      value={imagePreview}
                      previewHeight={150}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload een afbeelding voor deze beloning (optioneel)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Titel */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input placeholder="Voer de titel in" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Omschrijving */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Omschrijving</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Voer een omschrijving in"
                      className="min-h-[100px]"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Puntenaantal */}
            <FormField
              control={form.control}
              name="pointsCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puntenaantal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Voer het aantal punten in"
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Hoeveel punten kost deze beloning?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuleren
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Toevoegen..." : "Beloning toevoegen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}