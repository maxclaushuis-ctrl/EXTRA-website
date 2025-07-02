
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
      name: "client_contact_form_submit",
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
      name: "client_cta_click",
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
              LOREM IPSUM<br />
              <span className="text-[#C5FDBB]">DOLOR SIT?</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 font-medium">
              Lorem ipsum dolor sit amet consectetur adipiscing elit<br />
              <span className="text-[#C5FDBB]">Sed do eiusmod • Tempor incididunt • Ut labore</span>
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
                LOREM IPSUM DOLOR
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Client Logos Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-gray-600 font-medium">Lorem ipsum dolor sit amet consectetur</p>
          </div>
          <div className="flex justify-center items-center space-x-8 md:space-x-12 opacity-60">
            {/* Placeholder client logos */}
            <div className="bg-gray-300 h-12 w-24 rounded flex items-center justify-center text-xs font-bold">CLIENT A</div>
            <div className="bg-gray-300 h-12 w-24 rounded flex items-center justify-center text-xs font-bold">CLIENT B</div>
            <div className="bg-gray-300 h-12 w-24 rounded flex items-center justify-center text-xs font-bold">CLIENT C</div>
            <div className="bg-gray-300 h-12 w-24 rounded flex items-center justify-center text-xs font-bold">CLIENT D</div>
            <div className="bg-gray-300 h-12 w-24 rounded flex items-center justify-center text-xs font-bold">CLIENT E</div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Lorem ipsum <span className="text-[#7E3FF2]">dolor sit amet</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 text-red-600">Lorem Ipsum</h3>
                  <p className="text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 text-red-600">Dolor Sit Amet</h3>
                  <p className="text-gray-600">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 text-red-600">Consectetur</h3>
                  <p className="text-gray-600">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 text-red-600">Adipiscing Elit</h3>
                  <p className="text-gray-600">Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
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
                EXTRA lorem ipsum <span className="text-[#C5FDBB]">dolor sit</span>
              </h2>
              <p className="text-xl">Lorem ipsum dolor sit amet consectetur adipiscing elit</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <Shield className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">Lorem Ipsum</h3>
                <p className="text-white/90">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <Users className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">Dolor Sit Amet</h3>
                <p className="text-white/90">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <CheckCircle className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">Consectetur</h3>
                <p className="text-white/90">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <Clock className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">Adipiscing</h3>
                <p className="text-white/90">Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <Award className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">Tempor Incididunt</h3>
                <p className="text-white/90">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white/10 backdrop-blur rounded-lg p-6"
              >
                <Heart className="h-12 w-12 text-[#C5FDBB] mb-4" />
                <h3 className="font-bold text-lg mb-3">Ut Labore</h3>
                <p className="text-white/90">Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet consectetur.</p>
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
              <h2 className="text-3xl font-bold mb-8">Lorem ipsum dolor sit amet</h2>
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
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."
                  </p>
                  <div className="font-semibold">- Lorem Ipsum, Amsterdam</div>
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
                    "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse."
                  </p>
                  <div className="font-semibold">- Dolor Sit, Den Haag</div>
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
              Lorem ipsum dolor <span className="text-[#7E3FF2]">EXTRA</span>?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Lorem Ipsum</h3>
                <p className="text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.</p>
              </div>

              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Dolor Sit</h3>
                <p className="text-gray-600">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.</p>
              </div>

              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Consectetur</h3>
                <p className="text-gray-600">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.</p>
              </div>

              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Adipiscing</h3>
                <p className="text-gray-600">Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.</p>
              </div>

              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Tempor</h3>
                <p className="text-gray-600">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque.</p>
              </div>

              <div className="text-center">
                <div className="bg-[#7E3FF2] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-3">Incididunt</h3>
                <p className="text-gray-600">Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur adipiscing.</p>
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
                <span className="text-[#C5FDBB]">Lorem ipsum dolor</span> = sit amet consectetur
              </h2>
              <p className="text-xl mb-8">
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.<br />
                Ut enim ad minim veniam, quis nostrud exercitation ullamco.
              </p>
              <div className="bg-white/10 backdrop-blur rounded-lg p-6 inline-block">
                <Heart className="h-12 w-12 text-[#C5FDBB] mx-auto mb-4" />
                <div className="text-2xl font-bold text-[#C5FDBB]">25.000+</div>
                <div className="text-white/90">lorem ipsum dolor</div>
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
                Lorem ipsum dolor sit amet consectetur?
              </h2>
              <p className="text-xl text-gray-600">
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Lorem ipsum dolor</h3>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Naam *</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                          placeholder="Lorem ipsum"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Bedrijf *</label>
                        <Input
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                          required
                          placeholder="Dolor sit amet"
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
                          placeholder="lorem@ipsum.nl"
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
                        placeholder="Lorem ipsum dolor sit amet..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#7E3FF2] hover:bg-[#6D35D9] text-white"
                      size="lg"
                    >
                      LOREM IPSUM DOLOR
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6">Consectetur adipiscing</h3>
                  <div className="space-y-4">
                    <a 
                      href="tel:+31203690000" 
                      className="flex items-center space-x-4 p-4 bg-[#7E3FF2] text-white rounded-lg hover:bg-[#6D35D9] transition group"
                    >
                      <PhoneCall className="h-6 w-6" />
                      <div>
                        <div className="font-semibold">Lorem ipsum</div>
                        <div>020-369 0000</div>
                      </div>
                    </a>

                    <a 
                      href="https://wa.me/31203690000" 
                      className="flex items-center space-x-4 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <MessageCircle className="h-6 w-6" />
                      <div>
                        <div className="font-semibold">Dolor sit</div>
                        <div>Consectetur adipiscing</div>
                      </div>
                    </a>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-bold text-lg mb-4">Lorem ipsum EXTRA?</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Lorem ipsum dolor sit amet</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Consectetur adipiscing elit</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Sed do eiusmod tempor</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Incididunt ut labore</span>
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
                Lorem ipsum dolor sit amet consectetur.<br />
                Adipiscing elit sed do eiusmod.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <div>020-369 0000</div>
                <div>lorem@extra.nl</div>
                <div>Consectetur adipiscing 24/7</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Lorem Ipsum</h4>
              <div className="space-y-2 text-gray-400">
                <div>✓ Dolor Sit Amet</div>
                <div>✓ Consectetur Adipiscing</div>
                <div>✓ Sed Do Eiusmod</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} EXTRA Lorem Ipsum. Dolor sit amet consectetur adipiscing elit.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
