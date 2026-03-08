import { useEffect, useRef, useState, useCallback } from "react";
import PublicFooter from "@/components/PublicFooter";
import {
  Users, Gift, Star, ChevronDown, 
  TrendingUp, Shield, Clock, Trophy,
  ArrowRight, Check, Briefcase, UserCheck,
  Award, Handshake, Phone, Sparkles, Heart, Zap,
  Building2, UtensilsCrossed, PartyPopper, Wine, MessageCircle,
  Tag, BookOpen, BarChart3, UserPlus, Search, CalendarCheck, ThumbsUp,
  ArrowLeft, Smartphone, Layout
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import sollicitatieImg from "@assets/Sollicitatieformulier_1772893764120.png";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";

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

export default function CateringPersoneelGezocht() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = "Cateringpersoneel inzetten | EXTRA Uitzendbureau Amsterdam";
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative bg-white" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <GrainOverlay />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-purple-100/50" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="/landing" className="flex items-center">
              <img src={extraLogoWit} alt="EXTRA" className={`h-9 sm:h-10 w-auto transition-all ${scrolled ? "brightness-0" : ""}`} />
            </a>
            <div className="hidden lg:flex items-center gap-6">
              <a href="/personeel-gezocht" className={`text-sm font-bold flex items-center gap-2 transition-colors ${scrolled ? "text-gray-800 hover:text-purple-600" : "text-white/90 hover:text-white"}`}>
                <ArrowLeft className="w-4 h-4" /> Personeel gezocht
              </a>
              <a href="/personeelsaanvraag" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all shadow-lg shadow-purple-500/20">
                Vraag personeel aan
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 1. HERO */}
      <section className="relative min-h-[85svh] flex items-center overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0310 0%, #1a0a3e 50%, #1e1b4b 100%)" }}>
        <div className="absolute inset-0">
          <img src={heroBgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0310]/80" />
        </div>
        <XPatternBg count={4} opacity={0.1} color="white" className="z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="max-w-3xl">
            <RevealSection>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl text-white leading-[1.1] mb-6 font-black" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Cateringpersoneel nodig? <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">EXTRA levert snel.</span>
              </h1>
              <p className="text-lg sm:text-xl text-purple-100/80 mb-10 leading-relaxed font-medium max-w-2xl">
                Van recepties tot grote events — representatieve medewerkers die hospitality snappen. Wij leveren de extra handen die je morgen nodig hebt.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/personeelsaanvraag" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold px-8 py-4 rounded-full text-lg shadow-xl shadow-purple-500/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                  Personeel aanvragen
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a href="tel:0851305915" className="border-2 border-white/20 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" />
                  085 130 59 15
                </a>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 2. BREADCRUMB */}
      <div className="bg-[#faf8f5] py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <a href="/personeel-gezocht" className="text-sm font-bold text-gray-500 hover:text-purple-600 flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Terug naar Personeel gezocht
          </a>
        </div>
      </div>

      {/* 3. INTRO */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Handen tekort bij uw cateringopdracht?
              </h2>
              <div className="space-y-6">
                <p className="text-lg text-gray-600 leading-relaxed">
                  Cateraars werken met onvoorspelbare drukte. Een bestelling van 300 couverts vraagt morgen ineens extra handen. Of het nu gaat om een zakelijke lunch, een huwelijksdiner of een grootschalig publieksevenement: de kwaliteit van de uitvoering staat of valt bij het personeel.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed font-semibold">
                  EXTRA heeft de mensen klaar die weten wat hospitality is. Representatief, vlot en getraind om direct mee te draaien in uw team.
                </p>
              </div>
            </RevealSection>
            <RevealSection delay={200}>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-8 rounded-3xl border border-purple-100">
                  <div className="text-4xl font-black text-purple-600 mb-2">800+</div>
                  <div className="text-sm font-bold text-purple-900 uppercase tracking-wider">Actieve medewerkers</div>
                </div>
                <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
                  <div className="text-4xl font-black text-indigo-600 mb-2">24/7</div>
                  <div className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Bereikbaar</div>
                </div>
                <div className="col-span-2 bg-pink-50 p-8 rounded-3xl border border-pink-100 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-pink-600 mb-1">NEN-4400-1</div>
                    <div className="text-sm font-bold text-pink-900 uppercase tracking-wider">Gecertificeerd</div>
                  </div>
                  <Shield className="w-12 h-12 text-pink-200" />
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 4. OP- EN AFSCHALEN VISUAL */}
      <section className="py-24 bg-[#faf8f5] relative overflow-hidden">
        <XPatternBg count={2} opacity={0.05} />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Flexibel op- en afschalen
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
              Vandaag 2 mensen, morgen 50. Wij passen ons aan aan uw planning, hoe onvoorspelbaar die ook is.
            </p>
          </RevealSection>

          <div className="relative max-w-5xl mx-auto">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-purple-100 -translate-y-1/2 hidden md:block" />
            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                { time: "Maandag", people: "2 medewerkers", desc: "Voorbereiding & Mise-en-place", icon: Clock },
                { time: "Dinsdag", people: "45 medewerkers", desc: "Eventdag: buffet & bediening", icon: Users },
                { time: "Woensdag", people: "4 medewerkers", desc: "Afbouw & cleaning", icon: Check },
              ].map((step, i) => (
                <RevealSection key={i} delay={i * 200} className="bg-white p-8 rounded-3xl shadow-xl shadow-purple-500/5 border border-purple-100 text-center relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/20">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-black text-purple-600 uppercase tracking-widest mb-2">{step.time}</div>
                  <div className="text-2xl font-black text-gray-900 mb-3">{step.people}</div>
                  <p className="text-gray-600 font-medium">{step.desc}</p>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. ROLLEN SECTIE */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Rollen die EXTRA levert voor catering
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Onze medewerkers zijn multi-inzetbaar en gespecialiseerd in diverse facetten van catering.
            </p>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Bediening", desc: "Representatieve medewerkers voor uitserveren en gastontvangst.", icon: Users },
              { title: "Barmedewerker", desc: "Vlotte barman/vrouw voor drankjes, cocktails en tapwerk.", icon: Wine },
              { title: "Dinerlopers", desc: "Snel en efficiënt personeel voor buffetten en grote groepen.", icon: Zap },
              { title: "Keukenmedewerker", desc: "Mise-en-place, assistentie bij de chef en koude kant.", icon: UtensilsCrossed },
              { title: "Cateringassistent", desc: "Hulp bij opbouw, uitgifte en algemene ondersteuning.", icon: Handshake },
              { title: "Leidinggevende catering", desc: "Ervaren krachten die uw team op locatie aansturen.", icon: Award },
            ].map((role, i) => (
              <RevealSection key={i} delay={i * 50} className="group p-8 rounded-3xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <role.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{role.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{role.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 6. KWALITEITSSELECTIE (IMPORTANT) */}
      <section className="py-24 bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Zo selecteert EXTRA <br />
                <span className="text-purple-600">het beste personeel</span>
              </h2>
              <div className="space-y-8">
                {[
                  { title: "Strenge Intake", desc: "Iedere medewerker doorloopt een persoonlijk gesprek en vaardigheidstest." },
                  { title: "Beoordelingssysteem", desc: "Na iedere dienst geven opdrachtgevers een score. Alleen de beste blijven over." },
                  { title: "Representativiteit", desc: "Onze mensen zien er verzorgd uit en spreken de taal van hospitality." },
                  { title: "Ervaring & Houding", desc: "Wij kijken verder dan een CV; de juiste instelling is bij ons cruciaal." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-gray-600 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
            
            <RevealSection delay={300} className="relative">
              <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full translate-x-12 translate-y-12" />
              <div className="relative bg-white p-4 rounded-[2rem] shadow-2xl border border-white rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <img 
                  src={sollicitatieImg} 
                  alt="Extra sollicitatie beoordeling" 
                  className="mt-4 rounded-xl w-full h-auto group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute bottom-6 right-6 bg-purple-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
                  <Star className="w-6 h-6 fill-white" />
                  <span className="font-black text-lg">9.2 Gemiddeld</span>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 7. WAAROM EXTRA VOOR CATERAARS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Waarom EXTRA voor cateraars?
            </h2>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { 
                title: "Snelheid & Betrouwbaarheid", 
                desc: "Last-minute aanvraag? Wij schakelen direct en komen onze afspraken altijd na.",
                icon: Zap 
              },
              { 
                title: "Geen administratieve last", 
                desc: "Wij verlonen in loondienst. U krijgt één overzichtelijke factuur, wij regelen de rest.",
                icon: Layout 
              },
              { 
                title: "Gedreven door beloning", 
                desc: "Dankzij ons EXTRAATje systeem zijn onze mensen gemotiveerder dan bij gewone bureaus.",
                icon: Gift 
              },
            ].map((usp, i) => (
              <RevealSection key={i} delay={i * 100} className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-purple-200">
                  <usp.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{usp.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  {usp.desc}
                </p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0310]" />
        <XPatternBg count={5} opacity={0.15} color="white" />
        <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <RevealSection>
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Uw catering weer vlekkeloos laten draaien?
            </h2>
            <p className="text-xl text-purple-100/70 mb-12 max-w-2xl mx-auto font-medium">
              Vraag vandaag nog uw eerste medewerkers aan of bel ons voor direct contact.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a 
                href="/personeelsaanvraag" 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black px-10 py-5 rounded-full text-xl shadow-2xl shadow-purple-500/30 transition-all hover:-translate-y-1 inline-flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
              >
                Personeel aanvragen
                <ArrowRight className="w-6 h-6" />
              </a>
              <div className="text-white">
                <div className="text-sm font-bold text-purple-300 uppercase tracking-widest mb-1">Of bel direct:</div>
                <a href="tel:0851305915" className="text-2xl font-black hover:text-purple-300 transition-colors">085 130 59 15</a>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Partner Logos */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all">
            <img src={logoMarriott} alt="Marriott" className="h-8 md:h-10 w-auto" />
            <img src={logoHilton} alt="Hilton" className="h-8 md:h-10 w-auto" />
            <img src={logoAmrath} alt="Amrath" className="h-8 md:h-10 w-auto" />
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
