import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, TrendingUp, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const cases = [
  {
    client: "Hotel V Amsterdam",
    problem: "Plotselinge uitval van housekeeping personeel tijdens het hoogseizoen in Amsterdam.",
    solution: "EXTRA leverde binnen 4 uur een team van 5 ervaren housekeeping medewerkers die direct inzetbaar waren.",
    result: "Alle kamers waren tijdig schoon, de bezettingsgraad bleef 100% en de klanttevredenheidsscore bleef stabiel.",
    quote: "De snelheid en kwaliteit van EXTRA hebben ons gered tijdens een kritiek moment.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
  },
  {
    client: "Pathé Events",
    problem: "Behoefte aan 50 gastvrije horecamedewerkers voor een grootschalige filmpremière.",
    solution: "Een op maat geselecteerd team van hospitality-talenten, inclusief een teamleider van EXTRA voor de coördinatie.",
    result: "Vlekkeloze doorstroom van 1500 gasten, uitstekende service bij de bars en positieve feedback van de organisatie.",
    quote: "Het personeel van EXTRA begrijpt wat hospitality is. Ze zijn proactief en representatief.",
    image: "https://images.unsplash.com/photo-1514525253361-bee8a187499b?auto=format&fit=crop&q=80&w=800",
  },
  {
    client: "Marriott Amsterdam",
    problem: "Structurele behoefte aan flexibele krachten in de F&B afdeling die de luxe standaarden begrijpen.",
    solution: "Een vaste pool van 10 getrainde medewerkers die wekelijks worden ingezet via het EXTRA platform.",
    result: "Vermindering van wervingskosten met 20% en een hogere consistentie in servicekwaliteit.",
    quote: "EXTRA is meer dan een uitzendbureau; ze zijn een strategische partner in onze personeelsplanning.",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800",
  },
];

export default function KlantcasesHoreca() {
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
                Klantcases
              </h1>
              <p className="text-xl text-purple-200/70 max-w-3xl mx-auto">
                Ontdek hoe wij horecaondernemers in Amsterdam helpen met flexibele personeelsoplossingen van topkwaliteit.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {cases.map((c, i) => (
                <motion.div
                  key={c.client}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 overflow-hidden h-full flex flex-col hover:border-purple-500/50 transition-colors">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={c.image} 
                        alt={c.client} 
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0310] to-transparent opacity-60" />
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-xl font-bold text-white">{c.client}</h3>
                      </div>
                    </div>
                    <CardContent className="p-6 flex-1 flex flex-col text-white">
                      <div className="space-y-4 flex-1">
                        <div>
                          <div className="flex items-center gap-2 text-purple-400 mb-1">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Probleem</span>
                          </div>
                          <p className="text-sm text-purple-100/80">{c.problem}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Oplossing</span>
                          </div>
                          <p className="text-sm text-purple-100/80">{c.solution}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-green-400 mb-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Resultaat</span>
                          </div>
                          <p className="text-sm text-purple-100/80">{c.result}</p>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-white/10 italic text-sm text-purple-200/60">
                        "{c.quote}"
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="mt-20 text-center space-y-8">
              <h2 className="text-3xl font-bold font-poppins">Ook extra personeel nodig?</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8">
                  <Link href="/personeelsaanvraag">Personeel aanvragen</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-purple-500 text-purple-400 hover:bg-purple-500/10 rounded-full px-8">
                  <Link href="/horeca-uitzendbureau-amsterdam">Lees meer over ons</Link>
                </Button>
              </div>
              <div className="flex justify-center gap-8 pt-8 opacity-50 grayscale contrast-125">
                <Link href="/horeca-personeel-inhuren" className="text-sm hover:text-purple-400 transition-colors">Horeca personeel inhuren</Link>
                <Link href="/horeca-uitzendbureau-amsterdam" className="text-sm hover:text-purple-400 transition-colors">Uitzendbureau Amsterdam</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
