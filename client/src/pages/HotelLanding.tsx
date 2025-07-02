
import { motion } from "framer-motion";
import { useAnalytics } from "@/hooks/use-analytics";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Users, 
  Clock, 
  Phone, 
  CheckCircle, 
  Star,
  Award,
  Heart,
  PhoneCall,
  MessageCircle
} from "lucide-react";

export default function HotelLanding() {
  const { trackEvent } = useAnalytics();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent({
      name: "hotel_contact_form_submit",
      properties: {
        company: formData.company,
        email: formData.email
      }
    });
    
    // Form submission logic here
    console.log('Contact form submitted:', formData);
  };

  const handleCtaClick = (location: string) => {
    trackEvent({
      name: "hotel_cta_click",
      properties: {
        location: location
      }
    });
    
    // Scroll to contact form
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-[#7E3FF2] text-white px-4 py-2 rounded font-bold text-xl">
                EXTRA
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-full">
                <Shield className="h-5 w-5 text-[#7E3FF2]" />
                <span className="text-sm font-medium">NEN 4400-1</span>
              </div>
              <Button 
                onClick={() => handleCtaClick('header')}
                className="bg-[#7E3FF2] hover:bg-[#6D35D9] text-white"
              >
                Contact
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#7E3FF2] bg-gradient-to-br from-[#7E3FF2] to-[#6D35D9] text-white py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L45 15L30 30L15 15L30 0Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
            backgroundRepeat: 'repeat'
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="font-bold text-5xl md:text-6xl mb-6">
              HOTELPERSONEEL<br />
              <span className="text-[#C5FDBB]">GEZOCHT?</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 font-medium">
              Snel hotelpersoneel nodig? EXTRA staat voor je klaar<br />
              <span className="text-[#C5FDBB]">DBA-proof • NEN gecertificeerd • 24/7 bereikbaar</span>
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => handleCtaClick('hero')}
                size="lg"
                className="bg-[#C5FDBB] text-black hover:bg-[#B5ED9F] font-bold text-lg px-8 py-4 rounded-lg"
              >
                NEEM DIRECT CONTACT OP
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Hotel Logos Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-gray-600 font-medium">Vertrouwd door toonaangevende hotels</p>
          </div>
          <div className="flex justify-center items-center space-x-8 md:space-x-12 opacity-60">
            {/* Placeholder hotel logos */}
            <div className="bg-gray-300 h-12 w-24 rounded flex items-center justify-center text-xs font-bold">MARRIOTT</div>
            <div className="bg-gray-300 h-12 w-24 rounded flex items-center justify-center text-xs font-bold">HILTON</div>
            <div className="bg-gray-300 h-12 w-24 rounded flex items-center justify-center text-xs font-bold">NH HOTELS</div>
            <div className="bg-gray-300 h-12 w-24 rounded flex items-center justify-center text-xs font-bold">AMSTEL</div>
            <div className="bg-gray-300 h-12 w-24 rounded flex items-center justify-center text-xs font-bold">MERCURE</div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              De uitdagingen van <span className="text-[#7E3FF2]">hotelmanagement</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 text-red-600">Personeelstekort</h3>
                  <p className="text-gray-600">Last-minute uitval, seizoenspieken en onverwachte drukte zorgen voor personeelstekorten die je service kwaliteit bedreigen.</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 text-red-600">DBA Wetgeving</h3>
                  <p className="text-gray-600">Ingewikkelde regelgeving rond schijnzelfstandigheid. Gebruik van ZZP'ers kan resulteren in hoge boetes tot €87.000.</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 text-red-600">No-shows</h3>
                  <p className="text-gray-600">Personeel dat niet komt opdagen, waardoor je met onderbezetting zit tijdens belangrijke momenten.</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 text-red-600">Compliance Risico's</h3>
                  <p className="text-gray-600">Complexe TWV procedures, loonheffing en arbeidsrecht zorgen voor administratieve hoofdpijn en juridische risico's.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 bg-[#7E3FF2] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                EXTRA oplossingen voor <span className="text-[#C5FDBB]">jouw hotel</span>
              </h2>
              <p className="text-xl">Complete ontzorging, van administratie tot dagbetaling</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <Shield className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">NEN 4400-1 Gecertificeerd</h3>
                <p className="text-white/90">Volledig compliant en gecertificeerd volgens de hoogste kwaliteitsnormen voor uitzendwerk.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <Users className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">Geen ZZP'ers (DBA-proof)</h3>
                <p className="text-white/90">Al ons personeel is in loondienst. Geen risico op boetes of juridische problemen.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <CheckCircle className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">TWV's Geregeld</h3>
                <p className="text-white/90">Alle vergunningen en administratie volledig geregeld. Jij hoeft je nergens zorgen over te maken.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <Clock className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">24/7 Bereikbaar</h3>
                <p className="text-white/90">Vaste contactpersoon die altijd bereikbaar is. Ook in het weekend en 's avonds.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <Award className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">Geselecteerd Bestand</h3>
                <p className="text-white/90">Groot bestand van ervaren hotelmedewerkers. Allemaal gescreend en getraind.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <Heart className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">EXTRAATJE Beloning</h3>
                <p className="text-white/90">Uniek beloningssysteem zorgt voor gemotiveerde medewerkers en lagere no-show rates.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center items-center space-x-2 mb-4">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-2xl font-bold">4.8</span>
                <span className="text-gray-600">(241 reviews)</span>
              </div>
              <h2 className="text-3xl font-bold mb-8">Wat onze hotelpartners zeggen</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-l-4 border-l-[#7E3FF2]">
                <CardContent className="p-6">
                  <div className="flex space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "EXTRA heeft ons enorm geholpen tijdens de drukke zomerperiode. Betrouwbaar personeel dat goed is voorbereid en geen no-shows. Aanrader!"
                  </p>
                  <div className="font-semibold">- Hotel Manager, Amsterdam</div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-[#7E3FF2]">
                <CardContent className="p-6">
                  <div className="flex space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "Eindelijk een uitzendbureau dat begrijpt wat wij nodig hebben. Snelle service, kwaliteit personeel en volledig DBA-compliant."
                  </p>
                  <div className="font-semibold">- Operations Director, Den Haag</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* USP Blocks */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Waarom kiezen hotels voor <span className="text-[#7E3FF2]">EXTRA</span>?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Favorietenpoule</h3>
                <p className="text-gray-600">Bouw je eigen team van betrouwbare medewerkers die jouw hotel kennen en waarderen.</p>
              </div>

              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Klantportaal</h3>
                <p className="text-gray-600">Online dashboard waar je eenvoudig personeel kunt aanvragen en planningen kunt inzien.</p>
              </div>

              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Dagbetaling</h3>
                <p className="text-gray-600">Medewerkers krijgen direct na hun shift betaald, wat zorgt voor hogere motivatie.</p>
              </div>

              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Geen No-shows</h3>
                <p className="text-gray-600">Door ons beloningssysteem en strenge selectie hebben wij de laagste no-show rates.</p>
              </div>

              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">100% Compliant</h3>
                <p className="text-gray-600">Volledig conform alle wet- en regelgeving. Geen risico's voor jouw organisatie.</p>
              </div>

              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Persoonlijk Contact</h3>
                <p className="text-gray-600">Vaste accountmanager die jouw hotel en wensen kent. Altijd bereikbaar voor vragen.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Section */}
      <section className="py-16 bg-[#7E3FF2] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold mb-6">
                <span className="text-[#C5FDBB]">Een dienst draaien</span> = een dienst bewijzen
              </h2>
              <p className="text-xl mb-8">
                Voor elke gewerkte shift doneren wij een maaltijd aan de voedselbank.<br />
                Samen maken we impact, binnen én buiten de hospitality sector.
              </p>
              <div className="bg-white/10 backdrop-blur rounded-lg p-6 inline-block">
                <Heart className="h-12 w-12 text-[#C5FDBB] mx-auto mb-4" />
                <div className="text-2xl font-bold text-[#C5FDBB]">25.000+</div>
                <div className="text-white/90">gedoneerde maaltijden</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-form" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Klaar om je personeelsproblemen op te lossen?
              </h2>
              <p className="text-xl text-gray-600">
                Neem contact op voor een vrijblijvend gesprek over jouw personeelsbehoefte
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Verstuur een bericht</h3>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Naam *</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                          placeholder="Jouw naam"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Hotel/Bedrijf *</label>
                        <Input
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                          required
                          placeholder="Hotelnaam"
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">E-mail *</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                          placeholder="jouw@email.nl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Telefoon</label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="06-12345678"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Bericht</label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        rows={4}
                        placeholder="Vertel ons over je personeelsbehoefte..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#7E3FF2] hover:bg-[#6D35D9] text-white"
                      size="lg"
                    >
                      VERSTUUR BERICHT
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6">Direct contact</h3>
                  <div className="space-y-4">
                    <a 
                      href="tel:+31203690000" 
                      className="flex items-center space-x-4 p-4 bg-[#7E3FF2] text-white rounded-lg hover:bg-[#6D35D9] transition group"
                    >
                      <PhoneCall className="h-6 w-6" />
                      <div>
                        <div className="font-semibold">Bel direct</div>
                        <div>020-369 0000</div>
                      </div>
                    </a>

                    <a 
                      href="https://wa.me/31203690000" 
                      className="flex items-center space-x-4 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <MessageCircle className="h-6 w-6" />
                      <div>
                        <div className="font-semibold">WhatsApp</div>
                        <div>Direct beschikbaar</div>
                      </div>
                    </a>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-bold text-lg mb-4">Waarom EXTRA kiezen?</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Binnen 2 uur reactie op aanvragen</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>24/7 bereikbare accountmanager</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>95%+ tevredenheid van hotelpartners</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Vrijblijvend adviesgesprek</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating CTA */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => handleCtaClick('floating')}
          size="lg"
          className="bg-[#7E3FF2] hover:bg-[#6D35D9] text-white shadow-lg rounded-full px-6 py-3"
        >
          <Phone className="h-5 w-5 mr-2" />
          Contact
        </Button>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="bg-[#7E3FF2] text-white px-4 py-2 rounded font-bold text-xl inline-block mb-4">
                EXTRA
              </div>
              <p className="text-gray-400">
                Dé specialist in flexibel hotelpersoneel.<br />
                NEN 4400-1 gecertificeerd.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <div>020-369 0000</div>
                <div>hotels@extra.nl</div>
                <div>Beschikbaar 24/7</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Certificeringen</h4>
              <div className="space-y-2 text-gray-400">
                <div>✓ NEN 4400-1 Gecertificeerd</div>
                <div>✓ DBA Compliant</div>
                <div>✓ ISO Gecertificeerd</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} EXTRA Uitzendbureau. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
