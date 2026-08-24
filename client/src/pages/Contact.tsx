import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send, Clock, MessageCircle, ExternalLink, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { TELEFOON, TELEFOON_LINK, WHATSAPP_LINK, MAILADRES, ADRES, OPENINGSTIJDEN } from "@shared/aanvraagMails";

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

  const [verzonden, setVerzonden] = useState(false);

  // Dit formulier deed hiervoor alleen een console.log() en toonde daarna toch
  // "Bericht verzonden". Elk bericht verdween. Nu gaat het naar /api/contact-bericht,
  // dat het opslaat, kantoor mailt en de afzender een bevestiging stuurt.
  const mutation = useMutation({
    mutationFn: async (data: ContactValues) =>
      await apiRequest("/api/contact-bericht", {
        method: "POST",
        body: JSON.stringify({
          naam: data.name,
          email: data.email,
          bericht: data.message,
          pagina: "/contact",
        }),
      }),
    onSuccess: () => {
      setVerzonden(true);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Versturen mislukt",
        description: `Probeer het opnieuw of bel ons op ${TELEFOON}.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactValues) => mutation.mutate(data);

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
                Vertel ons <span className="text-purple-400">wat je nodig hebt</span>
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
                    <a href={TELEFOON_LINK} className="text-purple-200/60 hover:text-white transition-colors block">
                      {TELEFOON}
                    </a>
                    <p className="text-purple-200/40 text-sm mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {OPENINGSTIJDEN}
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <MessageCircle className="w-8 h-8 text-emerald-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">WhatsApp</h3>
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-200/60 hover:text-white transition-colors"
                    >
                      Stuur een bericht
                    </a>
                    <p className="text-purple-200/40 text-sm mt-1">Meestal snel antwoord</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 sm:col-span-2">
                    <MapPin className="w-8 h-8 text-green-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Bezoek ons</h3>
                    <p className="text-purple-200/60">{ADRES}</p>
                  </div>
                </div>

                {/* Route naar kantoor.
                    Hier stond een blok "Interactieve kaart wordt geladen..." dat nooit
                    een kaart laadde. Bewust geen ingesloten Google Maps: dat plaatst
                    cookies van een derde partij en de site heeft nog geen
                    toestemmingslaag. Een link naar de kaart doet dat niet. */}
                <a
                  href="https://maps.google.com/?q=Herengracht+372,+1016+CH+Amsterdam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 hover:bg-white/[0.07] transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <MapPin className="w-8 h-8 text-purple-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                        Route naar kantoor
                        <ExternalLink className="w-4 h-4 text-purple-300/60 group-hover:text-purple-300 transition-colors" />
                      </h3>
                      <p className="text-purple-200/60">{ADRES}</p>
                      <p className="text-purple-200/40 text-sm mt-2">
                        Loop gerust binnen tijdens kantooruren, of bel even vooraf.
                      </p>
                    </div>
                  </div>
                </a>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <h2 className="text-2xl font-bold mb-8">Stuur ons een bericht</h2>
                {verzonden ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Je bericht is binnen</h3>
                    <p className="text-purple-200/60 mb-6 max-w-sm mx-auto leading-relaxed">
                      Je krijgt een bevestiging per mail. Tijdens kantooruren ({OPENINGSTIJDEN}) reageren we
                      meestal dezelfde dag.
                    </p>
                    <p className="text-purple-200/50 text-sm">
                      Haast? Bel{" "}
                      <a href={TELEFOON_LINK} className="text-purple-300 font-semibold hover:text-white">
                        {TELEFOON}
                      </a>
                    </p>
                  </div>
                ) : (
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
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full py-6 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      {mutation.isPending ? "Versturen…" : "Bericht verzenden"}
                    </Button>
                    <p className="text-purple-200/40 text-xs text-center">
                      Liever direct contact? Bel{" "}
                      <a href={TELEFOON_LINK} className="text-purple-300 hover:text-white">
                        {TELEFOON}
                      </a>{" "}
                      of mail{" "}
                      <a href={`mailto:${MAILADRES}`} className="text-purple-300 hover:text-white">
                        {MAILADRES}
                      </a>
                    </p>
                  </form>
                </Form>
                )}
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
