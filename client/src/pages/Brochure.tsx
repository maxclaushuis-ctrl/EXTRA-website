import { motion } from "framer-motion";
import { 
  Users, 
  Shield, 
  Phone, 
  Star, 
  CheckCircle2, 
  BadgeCheck, 
  UserCheck,
  MessageCircle,
  Clock,
  Award,
  Sparkles,
  ArrowRight
} from "lucide-react";

import extraLogoWit from "../assets/pitch/extra-logo-wit.png";
import extraPattern from "../assets/pitch/extra-pattern.jpg";
import extraXShape from "../assets/pitch/extra-x-shape.png";

export default function Brochure() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center p-8 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ 
              background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ 
              background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
            }}
          />
          <div className="absolute top-10 right-10 opacity-10">
            <img 
              src={extraXShape}
              alt=""
              className="w-[100px] h-[100px]"
              style={{ filter: 'invert(1) brightness(1.5) sepia(1) saturate(5) hue-rotate(240deg)' }}
            />
          </div>
          <div className="absolute bottom-10 left-10 opacity-10">
            <img 
              src={extraXShape}
              alt=""
              className="w-[80px] h-[80px]"
              style={{ filter: 'invert(1) brightness(1.5) sepia(1) saturate(5) hue-rotate(240deg)' }}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl z-10"
        >
          <motion.img 
            src={extraLogoWit} 
            alt="EXTRA" 
            className="h-20 md:h-28 mx-auto mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          />
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight"
            style={{ fontFamily: 'Poppins', fontWeight: 800 }}
          >
            Uw partner in{" "}
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              kwalitatieve
            </span>{" "}
            horeca- en eventmedewerkers
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-400 mb-12"
            style={{ fontFamily: 'Poppins' }}
          >
            Meer dan een uitzendbureau. Wij zijn uw verlengstuk.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-6"
          >
            {[
              { icon: BadgeCheck, text: "NEN-4400-1 Gecertificeerd" },
              { icon: Users, text: "800+ Medewerkers" },
              { icon: Clock, text: "Dagbetaling" },
            ].map((item, i) => (
              <div 
                key={item.text}
                className="flex items-center gap-2 bg-gray-800/50 border border-purple-500/30 rounded-full px-5 py-2"
              >
                <item.icon className="w-5 h-5 text-purple-400" />
                <span className="text-gray-300" style={{ fontFamily: 'Poppins' }}>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* USP Section: Kwaliteit */}
      <section className="relative py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/40 rounded-full px-4 py-2 mb-6">
              <Star className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 text-sm" style={{ fontFamily: 'Poppins' }}>Onze belofte</span>
            </div>
            <h2 className="text-3xl md:text-5xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
              <span className="text-purple-400">Kwaliteit</span> staat voorop
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
              Wij selecteren, trainen en behouden de beste mensen voor uw zaak
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: UserCheck,
                title: "Uitgebreide selectie",
                desc: "Elke kandidaat doorloopt een grondig selectieproces met sollicitatiegesprek en beoordelingssysteem",
                color: "from-purple-600 to-purple-800"
              },
              {
                icon: Award,
                title: "Beloningssysteem",
                desc: "Met EXTRAATJE motiveren wij medewerkers om zich in te zetten. Goede prestaties worden beloond",
                color: "from-pink-600 to-pink-800"
              },
              {
                icon: Star,
                title: "Continue feedback",
                desc: "Na elke dienst ontvangt de medewerker een beoordeling. Zo blijven wij scherp op kwaliteit",
                color: "from-cyan-600 to-cyan-800"
              }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-6`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl text-white font-bold mb-3" style={{ fontFamily: 'Poppins' }}>
                  {item.title}
                </h3>
                <p className="text-gray-400" style={{ fontFamily: 'Poppins' }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* USP Section: Dezelfde medewerkers */}
      <section className="relative py-24 px-8 bg-gradient-to-b from-gray-900/50 to-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-cyan-600/20 border border-cyan-500/40 rounded-full px-4 py-2 mb-6">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-300 text-sm" style={{ fontFamily: 'Poppins' }}>Continuïteit</span>
              </div>
              <h2 className="text-3xl md:text-5xl mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                Dezelfde <span className="text-cyan-400">gezichten</span>, steeds weer
              </h2>
              <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
                Geen eindeloos inwerken. Wij zorgen dat u zoveel mogelijk dezelfde medewerkers ziet die uw zaak al kennen.
              </p>
              
              <div className="space-y-4">
                {[
                  "Vaste pool voor uw locatie",
                  "Medewerkers kennen uw werkwijze",
                  "Geen tijd kwijt aan inwerken",
                  "Hogere productiviteit vanaf dag één"
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300" style={{ fontFamily: 'Poppins' }}>{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg" style={{ fontFamily: 'Poppins' }}>Uw vaste team</h4>
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>Gematchte medewerkers</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {["Anna B.", "Mohammed K.", "Lisa V.", "Thomas R."].map((name, i) => (
                    <div key={name} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {name.split(' ')[0][0]}{name.split(' ')[1][0]}
                        </div>
                        <span className="text-white" style={{ fontFamily: 'Poppins' }}>{name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* USP Section: Wet- en regelgeving */}
      <section className="relative py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/40 rounded-full px-4 py-2 mb-6">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 text-sm" style={{ fontFamily: 'Poppins' }}>100% Compliant</span>
            </div>
            <h2 className="text-3xl md:text-5xl mb-4" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
              Volledige <span className="text-emerald-400">zekerheid</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto" style={{ fontFamily: 'Poppins' }}>
              Wij nemen alle zorgen rondom wet- en regelgeving uit handen
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BadgeCheck,
                title: "NEN-4400-1",
                desc: "Volledig gecertificeerd voor arbeidswetgeving en fiscale verplichtingen",
                highlight: true
              },
              {
                icon: Shield,
                title: "100% Loondienst",
                desc: "Al onze medewerkers zijn in vaste loondienst. Geen risico op schijnzelfstandigheid",
                highlight: false
              },
              {
                icon: CheckCircle2,
                title: "Waadi Check",
                desc: "Geregistreerd in het Waadi-register van de SNA",
                highlight: false
              },
              {
                icon: Users,
                title: "TWV Controle",
                desc: "Strikte controle op tewerkstellingsvergunningen bij buitenlandse medewerkers",
                highlight: false
              },
              {
                icon: Award,
                title: "Verzekeringen",
                desc: "Volledig verzekerd. U loopt geen enkel risico",
                highlight: false
              },
              {
                icon: Sparkles,
                title: "Zorgeloos",
                desc: "Wij handelen alle administratie en verplichtingen voor u af",
                highlight: false
              }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`bg-gradient-to-br ${item.highlight ? 'from-emerald-600/30 to-emerald-800/20 border-emerald-500/50' : 'from-gray-800/80 to-gray-900/80 border-emerald-500/20'} backdrop-blur-xl border rounded-2xl p-6`}
              >
                <div className={`w-12 h-12 ${item.highlight ? 'bg-emerald-600' : 'bg-emerald-600/20'} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.highlight ? 'text-white' : 'text-emerald-400'}`} />
                </div>
                <h3 className="text-lg text-white font-bold mb-2" style={{ fontFamily: 'Poppins' }}>
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* USP Section: Persoonlijk Contact */}
      <section className="relative py-24 px-8 bg-gradient-to-b from-gray-900/50 to-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 md:order-1"
            >
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-700 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold" style={{ fontFamily: 'Poppins' }}>Directe lijn</h4>
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>Geen wachtrijen, geen keuzemenu's</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-pink-600/10 border border-pink-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="w-5 h-5 text-pink-400" />
                      <span className="text-pink-300 font-semibold" style={{ fontFamily: 'Poppins' }}>Telefonisch</span>
                    </div>
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>
                      Bel direct met uw vaste contactpersoon. Geen callcenter.
                    </p>
                  </div>
                  
                  <div className="bg-pink-600/10 border border-pink-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="w-5 h-5 text-pink-400" />
                      <span className="text-pink-300 font-semibold" style={{ fontFamily: 'Poppins' }}>WhatsApp</span>
                    </div>
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>
                      Snelle communicatie via WhatsApp. Antwoord binnen een uur.
                    </p>
                  </div>

                  <div className="bg-pink-600/10 border border-pink-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-pink-400" />
                      <span className="text-pink-300 font-semibold" style={{ fontFamily: 'Poppins' }}>7 dagen per week</span>
                    </div>
                    <p className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>
                      Ook in het weekend en op feestdagen bereikbaar.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 md:order-2"
            >
              <div className="inline-flex items-center gap-2 bg-pink-600/20 border border-pink-500/40 rounded-full px-4 py-2 mb-6">
                <Phone className="w-5 h-5 text-pink-400" />
                <span className="text-pink-300 text-sm" style={{ fontFamily: 'Poppins' }}>Altijd bereikbaar</span>
              </div>
              <h2 className="text-3xl md:text-5xl mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
                <span className="text-pink-400">Korte lijntjes</span>, snelle actie
              </h2>
              <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
                Geen wachtrijen of keuzemenu's. Bij EXTRA heeft u een vaste contactpersoon die uw zaak kent.
              </p>
              
              <div className="space-y-4">
                {[
                  "Vaste accountmanager voor uw locatie",
                  "Direct contact, geen omwegen",
                  "Proactieve communicatie",
                  "Snelle oplossingen bij problemen"
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-pink-400 flex-shrink-0" />
                    <span className="text-gray-300" style={{ fontFamily: 'Poppins' }}>{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-12"
          >
            <h2 className="text-3xl md:text-5xl mb-6" style={{ fontFamily: 'Poppins', fontWeight: 800 }}>
              Klaar om te <span className="text-purple-400">starten</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-8" style={{ fontFamily: 'Poppins' }}>
              Ontdek hoe EXTRA uw personeelszorgen wegneemt
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="tel:+31851306767"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-full px-8 py-4 transition-all"
                style={{ fontFamily: 'Poppins' }}
              >
                <Phone className="w-5 h-5" />
                Bel ons direct
              </a>
              <a 
                href="mailto:info@extra-works.nl"
                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-purple-500/30 text-white font-semibold rounded-full px-8 py-4 transition-all"
                style={{ fontFamily: 'Poppins' }}
              >
                <MessageCircle className="w-5 h-5" />
                Stuur een bericht
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={extraLogoWit} alt="EXTRA" className="h-10" />
          <div className="flex flex-wrap justify-center gap-6 text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>
            <span>info@extra-works.nl</span>
            <span>085 130 67 67</span>
            <span>Utrecht, Nederland</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <BadgeCheck className="w-4 h-4" />
            <span style={{ fontFamily: 'Poppins' }}>NEN-4400-1 Gecertificeerd</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
