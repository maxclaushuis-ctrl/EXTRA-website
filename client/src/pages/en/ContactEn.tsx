import { useEffect } from "react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});
type ContactValues = z.infer<typeof contactSchema>;

export default function ContactEn() {
  const { toast } = useToast();
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  useEffect(() => {
    document.title = "Contact | EXTRA Hospitality Staffing Amsterdam";
    const s = (n: string, c: string, a = 'name') => { let el = document.querySelector(`meta[${a}="${n}"]`) as HTMLMetaElement; if (!el) { el = document.createElement('meta'); el.setAttribute(a, n); document.head.appendChild(el); } el.setAttribute('content', c); };
    const l = (rel: string, href: string, hl?: string) => { const sel = hl ? `link[rel="${rel}"][hreflang="${hl}"]` : `link[rel="${rel}"]`; let el = document.querySelector(sel) as HTMLLinkElement; if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); if (hl) el.setAttribute('hreflang', hl); document.head.appendChild(el); } el.setAttribute('href', href); };
    s('description', 'Get in touch with EXTRA. Questions about hospitality staffing, partnerships or working with us in Amsterdam?');
    l('canonical', 'https://www.doehetextra.nl/en/contact');
    l('alternate', 'https://www.doehetextra.nl/contact', 'nl');
    l('alternate', 'https://www.doehetextra.nl/en/contact', 'en');
  }, []);

  const onSubmit = (data: ContactValues) => {
    console.log("Contact form submitted:", data);
    toast({ title: "Message sent", description: "We will get back to you as soon as possible." });
    form.reset();
  };

  return (
    <div className="min-h-screen bg-[#0a0310] text-white">
      <PublicNav forceDark />
      <main className="pt-24 pb-20">
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold font-poppins mb-6">
                Tell us <span className="text-purple-400">what you need</span>
              </h1>
              <p className="text-xl text-purple-200/70 max-w-2xl mx-auto">
                Questions about our service, a partnership, or simply want to say hello? We would love to hear from you.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <Mail className="w-8 h-8 text-purple-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Email us</h3>
                    <a href="mailto:info@doehetextra.nl" className="text-purple-200/60 hover:text-white transition-colors">info@doehetextra.nl</a>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <Phone className="w-8 h-8 text-blue-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Call us</h3>
                    <a href="tel:0201234567" className="text-purple-200/60 hover:text-white transition-colors">020-123 45 67</a>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 sm:col-span-2">
                    <MapPin className="w-8 h-8 text-green-500 mb-4" />
                    <h3 className="text-lg font-bold mb-2">Visit us</h3>
                    <p className="text-purple-200/60">Amsterdam, Netherlands</p>
                  </div>
                </div>
                <div className="aspect-video rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden flex items-center justify-center group">
                  <div className="absolute inset-0 bg-purple-900/10 group-hover:bg-purple-900/20 transition-colors" />
                  <MapPin className="w-12 h-12 text-purple-500/50 relative z-10" />
                  <span className="relative z-10 font-medium text-purple-200/50 ml-2">Interactive map loading...</span>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-8">Send us a message</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-purple-200/70">Name</FormLabel>
                        <FormControl><Input placeholder="Your full name" {...field} className="bg-white/5 border-white/10 focus:border-purple-500" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-purple-200/70">Email address</FormLabel>
                        <FormControl><Input placeholder="you@example.com" {...field} className="bg-white/5 border-white/10 focus:border-purple-500" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-purple-200/70">Message</FormLabel>
                        <FormControl><Textarea placeholder="How can we help you?" className="min-h-[150px] bg-white/5 border-white/10 focus:border-purple-500" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full py-6 flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" /> Send message
                    </Button>
                  </form>
                </Form>
              </div>
            </div>

            <div className="mt-20 pt-20 border-t border-white/10 text-center">
              <h2 className="text-2xl font-bold mb-8">Ready to get started?</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild variant="outline" size="lg" className="border-purple-500 text-purple-400 hover:bg-purple-500/10 rounded-full px-8">
                  <Link href="/personeelsaanvraag">I need hospitality staff</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-blue-500 text-blue-400 hover:bg-blue-500/10 rounded-full px-8">
                  <Link href="/aanmelden">I am looking for work</Link>
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
