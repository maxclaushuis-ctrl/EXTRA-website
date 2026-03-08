import { useEffect, useState } from "react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { 
  Building2, 
  ArrowRight, 
  Phone, 
  ChevronLeft, 
  CheckCircle2, 
  Star, 
  Users, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Bed,
  Utensils,
  GlassWater,
  UserCheck,
  LayoutDashboard
} from "lucide-react";
import { Link } from "wouter";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";

function useScrollReveal() {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setIsVisible(true);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return isVisible;
}

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div 
      className={`transition-all duration-700 ease-out ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function XPatternBg({ className = "", count = 3, opacity = 0.12, color = "rgba(139,92,246,1)" }: { className?: string; count?: number; opacity?: number; color?: string }) {
  const positions = [
    { left: "5%", top: "10%", size: 200, rotate: 15 },
    { left: "80%", top: "20%", size: 160, rotate: -25 },
    { left: "50%", top: "60%", size: 240, rotate: 35 },
    { left: "15%", top: "75%", size: 180, rotate: -10 },
    { left: "90%", top: "80%", size: 140, rotate: 45 },
  ];
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {positions.slice(0, count).map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: pos.left, top: pos.top,
            width: pos.size, height: pos.size,
            transform: `rotate(${pos.rotate}deg)`,
            opacity,
            WebkitMaskImage: `url(${xPatroon})`,
            maskImage: `url(${xPatroon})`,
            WebkitMaskSize: "contain", maskSize: "contain",
            WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
            WebkitMaskPosition: "center", maskPosition: "center",
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
      }}
    />
  );
}

export default function HotelPersoneelGezocht() {
  useEffect(() => {
    document.title = "Hotelpersoneel inzetten | EXTRA Uitzendbureau Amsterdam";
    window.scrollTo(0, 0);
  }, []);

  const roles = [
    { title: "Front-office medewerker", icon: Building2, desc: "Het visitekaartje van uw hotel bij de check-in." },
    { title: "Housekeeping", icon: Bed, desc: "Zorgvuldige schoonmaak voor een perfecte gastervaring." },
    { title: "Banqueting medewerker", icon: Utensils, desc: "Ondersteuning bij congressen, vergaderingen en feesten." },
    { title: "Barmedewerker", icon: GlassWater, desc: "Ervaren barpersoneel voor uw hotelbar of lounge." },
    { title: "Ober/bedienend personeel", icon: Utensils, desc: "Representatieve bediening voor uw hotelrestaurant." },
    { title: "Receptionist", icon: UserCheck, desc: "Professionele ontvangst en administratieve afhandeling." },
  ];

  const painPoints = [
    { title: "Hoge bezetting/piek", desc: "Snel extra handen nodig tijdens vakantieperiodes of grote evenementen.", solution: "Direct opschalen met ervaren krachten." },
    { title: "Kwaliteitsbewaking", desc: "Zorg dat tijdelijk personeel hetzelfde niveau levert als uw vaste team.", solution: "Strikte selectie en hospitality training." },
    { title: "Continuïteit", desc: "Last-minute uitval van personeel opvangen zonder stress.", solution: "24/7 bereikbaarheid en snelle vervanging." },
    { title: "Representativiteit", desc: "Personeel dat de taal spreekt en de juiste uitstraling heeft.", solution: "Representatieve medewerkers die passen bij uw merk." },
  ];

  const usps = [
    { title: "Representatief & Ervaren", desc: "Onze medewerkers zijn zorgvuldig geselecteerd op houding, uitstraling en hospitality-ervaring.", icon: Star },
    { title: "Altijd in Loondienst", desc: "Geen gedoe met ZZP-wetgeving. Al ons personeel is volledig verzekerd en in loondienst bij EXTRA.", icon: ShieldCheck },
    { title: "Snel Inzetbaar", desc: "Of het nu gaat om morgen of volgende week, wij schakelen razendsnel om uw gaten te vullen.", icon: Clock },
  ];

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative bg-white">
      <GrainOverlay />
      <PublicNav />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0310 0%, #1a0a3e 50%, #1e1b4b 100%)" }}>
        <div className="absolute inset-0 opacity-40">
          <img src={heroBgImage} alt="" className="w-full h-full object-cover" />
        </div>
        <XPatternBg count={3} opacity={0.15} color="#7c3aed" />
        
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
          <RevealSection>
            <div className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
              <Sparkles className="w-4 h-4" /> Voor Hotels
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Hotelpersoneel nodig? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">EXTRA levert de juiste mensen.</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Van front-office tot housekeeping — representatief, geselecteerd en direct inzetbaar. Wij vullen uw team aan met gemotiveerde hospitality professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/personeelsaanvraag" className="group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                Personeel aanvragen
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="tel:0851305915" className="inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 border border-white/20 backdrop-blur-sm">
                <Phone className="w-5 h-5" />
                085 130 59 15
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Breadcrumb Section */}
      <section className="bg-[#faf8f5] py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Link href="/personeel-gezocht" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Terug naar Personeel gezocht
          </Link>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Kwaliteit staat centraal in uw hotel. <span className="text-purple-600">Bij ons ook.</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Hotels draaien op mensen. Bij EXTRA leveren wij horecamedewerkers die passen bij de uitstraling van jouw hotel — verzorgd, representatief en direct inzetbaar. Of het nu gaat om het opvangen van ziekteverzuim, vakantiepieken of extra ondersteuning bij evenementen.
              </p>
              <div className="space-y-4">
                {["Gespecialiseerd in hotel-hospitality", "Representatieve uitstraling", "Nederlands & Engels sprekend"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-bold text-gray-800">{item}</span>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200} className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                    <Users className="w-10 h-10 text-purple-600 mb-4" />
                    <div className="text-3xl font-black text-gray-900 mb-1">800+</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Actieve medewerkers</div>
                  </div>
                  <div className="bg-[#faf8f5] p-6 rounded-2xl border border-gray-100">
                    <Star className="w-10 h-10 text-yellow-500 mb-4" />
                    <div className="text-3xl font-black text-gray-900 mb-1">4.8/5</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Klantwaardering</div>
                  </div>
                </div>
                <div className="pt-8 space-y-4">
                  <div className="bg-[#faf8f5] p-6 rounded-2xl border border-gray-100">
                    <Building2 className="w-10 h-10 text-blue-600 mb-4" />
                    <div className="text-3xl font-black text-gray-900 mb-1">60+</div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Hotel partners</div>
                  </div>
                  <div className="bg-purple-600 p-6 rounded-2xl shadow-xl shadow-purple-600/20">
                    <LayoutDashboard className="w-10 h-10 text-white mb-4" />
                    <div className="text-2xl font-bold text-white leading-tight">Digitaal overzicht & planning</div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-24 bg-[#faf8f5] relative overflow-hidden">
        <XPatternBg count={2} opacity={0.05} color="#7c3aed" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6">Voor welke functies levert <span className="text-purple-600">EXTRA</span>?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Een complete ontzorging voor alle hospitality-gerelateerde rollen binnen uw hotel.</p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roles.map((role, i) => (
              <RevealSection key={i} delay={i * 50} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                  <role.icon className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{role.title}</h3>
                <p className="text-gray-600">{role.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6">Herkenbare uitdagingen bij hotels</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Wij begrijpen de druk op hotelmanagers en bieden concrete oplossingen.</p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {painPoints.map((point, i) => (
              <RevealSection key={i} delay={i * 100} className="flex gap-6 p-8 rounded-2xl bg-[#faf8f5] border border-gray-100">
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-xl">!</div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">{point.title}</h3>
                  <p className="text-gray-600 mb-4">{point.desc}</p>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-sm font-black text-green-900 uppercase tracking-wider mb-1">Oplossing:</span>
                      <p className="text-green-800 text-sm font-medium">{point.solution}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* USP Specific Section */}
      <section className="py-24 bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {usps.map((usp, i) => (
              <RevealSection key={i} delay={i * 100} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-8 mx-auto">
                  <usp.icon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">{usp.title}</h3>
                <p className="text-gray-600 leading-relaxed">{usp.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <h2 className="text-2xl font-black text-gray-400 uppercase tracking-widest mb-12">Vertrouwd door toonaangevende hotels</h2>
            <div className="flex flex-wrap justify-center items-center gap-12 sm:gap-20 opacity-60">
              <img src={logoMarriott} alt="Marriott" className="h-12 w-auto grayscale hover:grayscale-0 transition-all" />
              <img src={logoHilton} alt="Hilton" className="h-10 w-auto grayscale hover:grayscale-0 transition-all" />
              <img src={logoAmrath} alt="Amrath" className="h-10 w-auto grayscale hover:grayscale-0 transition-all" />
            </div>
          </RevealSection>

          <RevealSection className="max-w-4xl mx-auto bg-purple-900 rounded-3xl p-10 sm:p-16 relative overflow-hidden shadow-2xl">
            <XPatternBg count={2} opacity={0.1} color="white" />
            <div className="relative z-10 text-center">
              <Star className="w-12 h-12 text-yellow-400 mb-8 mx-auto fill-yellow-400" />
              <blockquote className="text-2xl sm:text-3xl font-medium text-white italic mb-10 leading-relaxed">
                "EXTRA begrijpt dat hospitality in een hotel verder gaat dan alleen een glimlach. De medewerkers die zij sturen zijn representatief, spreken hun talen en passen naadloos in onze teams."
              </blockquote>
              <div className="text-white">
                <div className="font-black text-xl mb-1">Operations Manager</div>
                <div className="text-purple-300 font-bold uppercase tracking-widest text-sm">Toonaangevend Hotel Amsterdam</div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0a0310] relative overflow-hidden">
        <XPatternBg count={3} opacity={0.15} color="#7c3aed" />
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 text-center">
          <RevealSection>
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Klaar om uw team te <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">versterken?</span>
            </h2>
            <p className="text-xl text-purple-100/70 mb-12 leading-relaxed">
              Vraag vandaag nog uw personeel aan of neem contact op voor een vrijblijvende kennismaking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/personeelsaanvraag" className="group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-lg px-10 py-5 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                Personeel aanvragen
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="tel:0851305915" className="inline-flex items-center justify-center gap-2.5 bg-white text-gray-900 font-bold text-lg px-10 py-5 rounded-full transition-all duration-300 hover:bg-gray-100">
                <Phone className="w-5 h-5" />
                085 130 59 15
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
