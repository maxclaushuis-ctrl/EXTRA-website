import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Naam moet minimaal 2 karakters bevatten" }),
  email: z.string().email({ message: "Voer een geldig e-mailadres in" }),
  phone: z.string().min(10, { message: "Voer een geldig telefoonnummer in" }),
  consent: z.boolean().refine(val => val === true, {
    message: "Je moet akkoord gaan met de voorwaarden"
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface SignupFormProps {
  onSubmit: (data: FormValues) => void;
  isSubmitted: boolean;
}

export default function SignupForm({ onSubmit, isSubmitted }: SignupFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      consent: false,
    },
  });
  
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/signup", data);
      return res.json();
    },
    onSuccess: (data) => {
      onSubmit(form.getValues());
    },
    onError: (error: Error) => {
      setServerError(error.message || "Er is iets misgegaan. Probeer het later opnieuw.");
    },
  });
  
  const handleSubmit = (data: FormValues) => {
    setServerError(null);
    mutation.mutate(data);
  };
  
  if (isSubmitted) {
    return (
      <motion.div 
        className="bg-white rounded-lg p-6 shadow-sm text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="font-poppins font-bold text-xl mb-2">Awesome! 🎉</h3>
        <p className="mb-4">We hebben je aanmelding ontvangen en nemen snel contact met je op.</p>
        <p className="text-sm text-gray-600">Download alvast de EXTRA app om je profiel compleet te maken.</p>
        <div className="flex justify-center space-x-4 mt-4">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/1280px-Download_on_the_App_Store_Badge.svg.png" alt="App Store" className="h-10" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/1280px-Google_Play_Store_badge_EN.svg.png" alt="Play Store" className="h-10" />
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="bg-white rounded-lg p-5 shadow-sm">
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {serverError}
            </div>
          )}
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel className="text-sm font-medium">Naam</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Jouw naam" 
                    {...field} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel className="text-sm font-medium">E-mail</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="jouw@email.nl" 
                    type="email" 
                    {...field} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel className="text-sm font-medium">Telefoonnummer</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="06 12345678" 
                    type="tel" 
                    {...field} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem className="mb-6 flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">
                    Ik ga akkoord met de <a href="#" className="text-[hsl(var(--primary))] underline">voorwaarden</a> en geef toestemming om contact met mij op te nemen
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] text-white font-poppins font-bold py-3 px-6 rounded-full text-lg w-full transition transform hover:scale-105"
          >
            {mutation.isPending ? "BEZIG MET AANMELDEN..." : "START DIRECT BIJ EXTRA"}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
