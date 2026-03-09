import { useEffect, useRef, useState } from "react";
import { 
  ArrowRight, Phone, Check, Star, Users, Clock, Shield, 
  UtensilsCrossed, Wine, UserCheck, MessageCircle, ChevronLeft 
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

function XPatternBg({ className = "", count = 3, opacity = 0.12, color = "rgba(139,92,246,1)" }: { className?: string; count?: number; opacity?: number; color?: string }) {
  const positions = [
    { left: "5%", top: "10%", size: 200, rotate: 15 },
    { left: "80%", top: "20%", size: 160, rotate: -25 },
    { left: "50%", top: "60%", size: 240, rotate: 35 },
    { left: "15%", top: "75%", size: 180, rotate: -10 },
    { left: "90%", top: "80%", size: 140, rotate: 45 },
    { left: "35%", top: "30%", size: 120, rotate: -30 },
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

export default function RestaurantPersoneelGezocht() {
  useEffect(() => {
    document.title = "Restaurantpersoneel inzetten | EXTRA Uitzendbureau Amsterdam";
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative bg-white">
      <GrainOverlay />
      <PublicNav />

      {/* 1. HERO */}
      <section className="relative min-h-[80svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBgImage} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a0310 0%, #1a0a3e 50%, #1e1b4b 100%)", opacity: 0.9 }} />
        </div>
        <XPatternBg count={4} opacity={0.15} color="rgba(255,255,255,0.9)" className="z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl text-white leading-[1.1] mb-6 font-black" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Restaurantpersoneel tekort? <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">EXTRA vult het op.</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/90 mb-10 leading-relaxed font-medium">
              Extra handen tijdens drukte, bij uitval of op piekdagen, direct inzetbaar personeel dat snel meteen mee kan draaien.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/personeelsaanvraag" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold px-8 py-4 rounded-full text-lg shadow-xl shadow-purple-500/25 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                Personeel aanvragen
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="tel:0851305915" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                085 130 59 15
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BREADCRUMB */}
      <div className="bg-[#faf8f5] py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Link href="/personeel-gezocht" className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Terug naar Personeel gezocht
          </Link>
        </div>
      </div>

      {/* 3. INTRO */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Direct inspelen op de hectiek van een vol restaurant
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Onverwachte drukte, een ziek personeelslid, een vol restaurant op vrijdagavond. EXTRA heeft de mensen die direct kunnen worden ingezet. Wij begrijpen dat in een restaurant snelheid en kwaliteit hand in hand gaan.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Onze pool van medewerkers bestaat uit mensen die gewend zijn aan de dynamiek van de horeca. Ze zijn representatief, spreken de taal van de gast en weten hoe ze moeten aanpakken.
              </p>
            </RevealSection>
            <RevealSection delay={200} className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
                <XPatternBg count={2} opacity={0.1} color="#7c3aed" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Star className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Direct inzetbaar</h4>
                      <p className="text-gray-600 text-sm">Zonder lange inwerktrajecten</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Groot netwerk</h4>
                      <p className="text-gray-600 text-sm">Toegang tot honderden medewerkers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Kwaliteitsgarantie</h4>
                      <p className="text-gray-600 text-sm">Altijd representatief personeel</p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 4. ROLLEN SECTIE */}
      <section className="py-24 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Welk personeel levert EXTRA voor restaurants?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Wij bieden een breed scala aan functies om uw restaurantteam te versterken.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Bediening", icon: Wine, desc: "Gastvrije medewerkers die zorgen voor een vlekkeloze service aan tafel." },
              { title: "Runner", icon: Clock, desc: "Snelle krachten die zorgen dat gerechten en drankjes direct bij de gast komen." },
              { title: "Barmedewerker", icon: Wine, desc: "Ervaren krachten die met snelheid en precisie de lekkerste drankjes bereiden." },
              { title: "Chef de partie", icon: UtensilsCrossed, desc: "Gekwalificeerde koks die direct mee kunnen draaien op hun eigen station." },
              { title: "Keukenhulp", icon: UtensilsCrossed, desc: "Onmisbare ondersteuning in de keuken, van mise-en-place tot afwas." },
              { title: "Supervisor", icon: UserCheck, desc: "Ervaren leidinggevenden die de rust bewaren en het team aansturen." },
            ].map((role, i) => (
              <RevealSection key={i} delay={i * 50} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                  <role.icon className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{role.title}</h3>
                <p className="text-gray-600 leading-relaxed">{role.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 5. UITDAGINGEN SECTIE */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <RevealSection>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Veelvoorkomende uitdagingen in de restaurantbranche
              </h2>
              <div className="space-y-6">
                {[
                  { title: "Onverwachte drukte", desc: "Een terras dat ineens volstroomt door goed weer of een onverwachte groep." },
                  { title: "Personeelstekort op piekdagen", desc: "Zaterdagavonden zijn altijd druk, maar de juiste mensen vinden is lastig." },
                  { title: "Last-minute uitval", desc: "Ziekte of andere uitval op het moment dat u het personeel het hardst nodig heeft." },
                  { title: "Kwaliteit en snelheid", desc: "Personeel nodig dat niet alleen hard werkt, maar ook de gastgerichtheid behoudt." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                      <Check className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200} className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-10 text-white relative overflow-hidden">
               <XPatternBg count={3} opacity={0.15} color="white" />
               <div className="relative z-10">
                 <h3 className="text-2xl font-bold mb-6">De EXTRA oplossing</h3>
                 <p className="text-purple-100 mb-8 leading-relaxed">
                   Wij bieden niet zomaar personeel; wij bieden een verlengstuk van uw eigen team. Door onze strenge selectie en ons unieke beloningssysteem zijn onze medewerkers extra gemotiveerd om bij u het verschil te maken.
                 </p>
                 <Link href="/personeelsaanvraag" className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-6 py-3 rounded-full hover:bg-purple-50 transition-colors">
                    Ontdek onze werkwijze
                    <ArrowRight className="w-4 h-4" />
                 </Link>
               </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 6. WAAROM EXTRA VOOR RESTAURANTS */}
      <section className="py-24 bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection className="mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Waarom restaurants kiezen voor EXTRA
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Representatief & Ervaren", desc: "Al onze medewerkers worden persoonlijk geselecteerd op houding, ervaring en gastvrijheid." },
              { title: "Snel schakelen", desc: "Door onze grote pool in Amsterdam kunnen we vaak op zeer korte termijn mensen leveren." },
              { title: "Geen administratieve last", desc: "Wij regelen alles: van verloning tot verzekeringen. U ontvangt enkel een factuur voor de gewerkte uren." },
            ].map((usp, i) => (
              <RevealSection key={i} delay={i * 100} className="bg-white p-10 rounded-3xl shadow-sm border border-purple-100">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/20">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{usp.title}</h3>
                <p className="text-gray-600 leading-relaxed">{usp.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SOCIAL PROOF / REVIEWS */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
             <h2 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
               Wat andere restaurantmanagers zeggen
             </h2>
          </RevealSection>
          <div className="grid md:grid-cols-2 gap-8">
            <RevealSection className="bg-[#faf8f5] p-8 rounded-3xl relative">
              <MessageCircle className="absolute top-6 right-8 w-8 h-8 text-purple-200" />
              <div className="flex gap-1 text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-gray-700 italic mb-6">
                "Wanneer we last-minute uitval hebben of een onverwacht drukke avond, is EXTRA onze eerste keuze. De medewerkers snappen direct wat er moet gebeuren."
              </p>
              <div>
                <p className="font-bold text-gray-900">Mark de Vries</p>
                <p className="text-gray-500 text-sm">Restaurantmanager, Amsterdam Centrum</p>
              </div>
            </RevealSection>
            <RevealSection delay={200} className="bg-[#faf8f5] p-8 rounded-3xl relative">
              <MessageCircle className="absolute top-6 right-8 w-8 h-8 text-purple-200" />
              <div className="flex gap-1 text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-gray-700 italic mb-6">
                "Fijn personeel dat representatief is en echt zin heeft om te werken. Het beloningssysteem van EXTRA zie je echt terug in de motivatie op de werkvloer."
              </p>
              <div>
                <p className="font-bold text-gray-900">Sophie Janssen</p>
                <p className="text-gray-500 text-sm">Eigenaar, Bistro de Pijp</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <RevealSection className="bg-[#0a0310] rounded-[3rem] p-12 sm:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-transparent opacity-50" />
            <XPatternBg count={4} opacity={0.12} color="white" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Klaar om uw restaurantteam te versterken?
              </h2>
              <p className="text-xl text-purple-100/80 mb-12 max-w-2xl mx-auto">
                Binnen 2 minuten heeft u uw aanvraag geplaatst. Wij gaan direct voor u aan de slag.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/personeelsaanvraag" className="bg-white text-purple-900 font-bold px-10 py-5 rounded-full text-xl hover:bg-purple-50 transition-all hover:scale-105 shadow-xl shadow-white/10">
                  Personeel aanvragen
                </Link>
                <a href="tel:0851305915" className="bg-transparent border-2 border-white/20 text-white font-bold px-10 py-5 rounded-full text-xl hover:bg-white/5 transition-all">
                  Bel direct: 085 130 59 15
                </a>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
