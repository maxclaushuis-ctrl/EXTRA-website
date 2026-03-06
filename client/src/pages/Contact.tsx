import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Naam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres"),
  message: z.string().min(10, "Bericht moet minimaal 10 tekens bevatten"),
});

type ContactValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactValues) => {
    console.log("Contact form submitted:", data);
    toast({
      title: "Bericht verzonden",
      description: "We nemen zo snel mogelijk contact met je op.",
    });
    form.reset();
  };

  return (
    <div className="min-h-screen bg-[#0a0310] text-white">
      <PublicNav forceDark />
      
      <main className="pt-24 pb-20">
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-6xl font-bold font-poppins mb-6">
                Contact
              </h1>
              <p className="text-xl text-purple-200/70 max-w-2xl mx-auto">
                Heb je een vraag of wil je meer weten over onze dienstverlening? Neem gerust contact met ons op.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <Mail className="w-8 h-8 text-purple-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">E-mail ons</h3>
                    <a href="mailto:info@doehetextra.nl" className="text-purple-200/60 hover:text-white transition-colors">
                      info@doehetextra.nl
                    </a>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <Phone className="w-8 h-8 text-blue-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Bel ons</h3>
                    <a href="tel:0201234567" className="text-purple-200/60 hover:text-white transition-colors">
                      020-123 45 67
                    </a>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 sm:col-span-2">
                    <MapPin className="w-8 h-8 text-green-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Bezoek ons</h3>
                    <p className="text-purple-200/60">
                      Amsterdam, Nederland
                    </p>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="aspect-video rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden flex items-center justify-center group">
                  <div className="absolute inset-0 bg-purple-900/10 group-hover:bg-purple-900/20 transition-colors" />
                  <MapPin className="w-12 h-12 text-purple-500/50 relative z-10" />
                  <span className="relative z-10 font-medium text-purple-200/50 ml-2">Interactieve kaart wordt geladen...</span>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <h2 className="text-2xl font-bold mb-8">Stuur ons een bericht</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-200/70">Naam</FormLabel>
                          <FormControl>
                            <Input placeholder="Je volledige naam" {...field} className="bg-white/5 border-white/10 focus:border-purple-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-200/70">E-mailadres</FormLabel>
                          <FormControl>
                            <Input placeholder="je@email.com" {...field} className="bg-white/5 border-white/10 focus:border-purple-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-purple-200/70">Bericht</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Hoe kunnen we je helpen?" 
                              className="min-h-[150px] bg-white/5 border-white/10 focus:border-purple-500" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full py-6 flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Bericht verzenden
                    </Button>
                  </form>
                </Form>
              </motion.div>
            </div>

            <div className="mt-20 pt-20 border-t border-white/10 text-center">
              <h2 className="text-2xl font-bold mb-8">Direct aan de slag?</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild variant="outline" size="lg" className="border-purple-500 text-purple-400 hover:bg-purple-500/10 rounded-full px-8">
                  <Link href="/personeelsaanvraag">Ik zoek personeel</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-blue-500 text-blue-400 hover:bg-blue-500/10 rounded-full px-8">
                  <Link href="/aanmelden">Ik zoek werk</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
