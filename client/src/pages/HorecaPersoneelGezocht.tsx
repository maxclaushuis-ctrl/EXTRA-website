import { useEffect, useRef, useState } from "react";
import { 
  ArrowRight, Phone, Check, Star, Shield, 
  UtensilsCrossed, Wine, ChefHat, Flame, ChevronLeft 
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

export default function HorecaPersoneelGezocht() {
  useEffect(() => {
    document.title = "Horecapersoneel Gezocht? Flexibel via EXTRA Amsterdam";

    const setMeta = (nameOrProp: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, nameOrProp); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };
    const addSchema = (id: string, data: object) => {
      document.getElementById(id)?.remove();
      const s = document.createElement('script');
      s.id = id;
      s.type = 'application/ld+json';
      s.text = JSON.stringify(data);
      document.head.appendChild(s);
    };

    setMeta('description', 'Horecapersoneel inhuren voor jouw restaurant of locatie? EXTRA levert snel bediening, chefs en keukenmedewerkers. Flexibel, betrouwbaar, direct inzetbaar.');
    setLink('canonical', 'https://www.doehetextra.nl/horecapersoneel-gezocht');

    setMeta('og:title', 'Horecapersoneel Gezocht? Flexibel via EXTRA Amsterdam', 'property');
    setMeta('og:description', 'Horecapersoneel inhuren voor jouw restaurant of locatie? EXTRA levert snel bediening, chefs en keukenmedewerkers.', 'property');
    setMeta('og:url', 'https://www.doehetextra.nl/horecapersoneel-gezocht', 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:image', 'https://www.doehetextra.nl/extra_email_banner_bg.png', 'property');

    addSchema('local-business-schema', {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "EXTRA",
      "description": "Flexibel horecapersoneel via EXTRA, NEN-4400-1 gecertificeerd uitzendbureau in Amsterdam.",
      "telephone": "+31851305915",
      "url": "https://www.doehetextra.nl",
      "address": { "@type": "PostalAddress", "addressLocality": "Amsterdam", "addressCountry": "NL" },
      "sameAs": ["https://www.doehetextra.nl"]
    });

    addSchema('faq-schema', {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Hoe snel kan EXTRA horecapersoneel leveren?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Wij kunnen vaak dezelfde dag nog personeel leveren bij spoedaanvragen. Voor structurele planning adviseren we 24-48 uur van tevoren contact op te nemen."
          }
        },
        {
          "@type": "Question",
          "name": "Welk type horecapersoneel levert EXTRA?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Wij leveren bediening, barpersoneel, keukenhulpen, zelfstandig werkend koks, chefs en supervisors voor restaurants en eetcafés."
          }
        },
        {
          "@type": "Question",
          "name": "Is het personeel van EXTRA in loondienst?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ja, al onze medewerkers zijn bij ons in loondienst. Dit voorkomt schijnzelfstandigheid-risico's (Wet DBA) voor onze opdrachtgevers."
          }
        }
      ]
    });

    return () => {
      document.getElementById('local-business-schema')?.remove();
      document.getElementById('faq-schema')?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative bg-[#0a0310] text-white">
      <GrainOverlay />
      <PublicNav />

      {/* 1. HERO */}
      <section className="relative min-h-[85svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBgImage} alt="Horecapersoneel aan het werk" className="absolute inset-0 w-full h-full object-cover object-center opacity-40" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a0310 0%, #1a0a3e 50%, #1e1b4b 100%)", opacity: 0.9 }} />
        </div>
        <XPatternBg count={4} opacity={0.15} color="rgba(255,255,255,0.9)" className="z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl text-white leading-[1.1] mb-6 font-black" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Horecapersoneel tekort? <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">EXTRA levert.</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100/90 mb-10 leading-relaxed font-medium">
              Van bediening tot keuken, flexibel en direct inzetbaar horecapersoneel voor restaurants, eetcafés en horecalocaties in Amsterdam.
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
      <div className="bg-white/5 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Link href="/personeel-gezocht" className="inline-flex items-center gap-2 text-purple-300 hover:text-white font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Terug naar Personeel gezocht
          </Link>
        </div>
      </div>

      {/* 3. INTRO */}
      <section className="py-24 bg-[#0a0310] overflow-hidden relative">
        <XPatternBg count={2} opacity={0.05} color="#7c3aed" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-8 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Dé partner voor Amsterdamse horeca
              </h2>
              <p className="text-lg text-purple-100/70 leading-relaxed mb-6">
                Amsterdam heeft de drukste horecascene van Nederland. Onverwachte drukte, ziekmeldingen, piekdagen. EXTRA heeft altijd mensen klaar die weten van aanpakken.
              </p>
              <p className="text-lg text-purple-100/70 leading-relaxed">
                Wij leveren geen 'handjes', maar horeca-professionals die begrijpen wat gastvrijheid betekent. Onze pool van medewerkers is zorgvuldig geselecteerd en getraind om direct mee te draaien in jouw team.
              </p>
            </RevealSection>
            <RevealSection delay={200} className="relative">
              <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-white/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden backdrop-blur-sm">
                <div className="grid grid-cols-1 gap-8">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                      <Star className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">Hoge Kwaliteit</h4>
                      <p className="text-purple-100/60 text-sm">Persoonlijk geselecteerd personeel</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                      <Check className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">Direct Inzetbaar</h4>
                      <p className="text-purple-100/60 text-sm">Zonder lange inwerktrajecten</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                      <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">100% Compliant</h4>
                      <p className="text-purple-100/60 text-sm">NEN-4400-1 gecertificeerd</p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 4. ROLLEN SECTIE */}
      <section className="py-24 bg-[#0d0415]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Welke horecamedewerkers levert EXTRA?
            </h2>
            <p className="text-lg text-purple-100/60 max-w-2xl mx-auto">
              Wij bieden een breed scala aan functies om jouw horecateam direct te versterken.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Bediening", icon: UtensilsCrossed, desc: "Gastvrije medewerkers die zorgen voor een vlekkeloze service aan tafel." },
              { title: "Barmedewerker", icon: Wine, desc: "Ervaren krachten die met snelheid en precisie de lekkerste drankjes bereiden." },
              { title: "Runner/Keukenhulp", icon: ChefHat, desc: "Snelle krachten voor gerechten-loop of mise-en-place ondersteuning." },
              { title: "Chef de partie", icon: Star, desc: "Gekwalificeerde koks die direct mee kunnen draaien op hun eigen station." },
              { title: "Kok/Sous-chef", icon: Flame, desc: "Ervaren keukenprofessionals voor hoogwaardige culinaire ondersteuning." },
              { title: "Supervisor", icon: Shield, desc: "Ervaren leidinggevenden die de rust bewaren en het team aansturen." },
            ].map((role, i) => (
              <RevealSection key={i} delay={i * 50} className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 transition-all group">
                <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:bg-purple-600 transition-colors">
                  <role.icon className="w-7 h-7 text-purple-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{role.title}</h3>
                <p className="text-purple-100/60 leading-relaxed">{role.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 5. UITDAGINGEN SECTIE */}
      <section className="py-24 bg-[#0a0310]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <RevealSection>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Uitdagingen in de horeca
              </h2>
              <div className="space-y-8">
                {[
                  { title: "Onverwachte drukte", desc: "Vol geboekt restaurant, te weinig handen. EXTRA levert zelfde dag." },
                  { title: "Ziekmeldingen", desc: "Iemand uitgevallen? Wij vullen de plek met een gemotiveerde vervanger." },
                  { title: "Piekdagen", desc: "Vrijdag en zaterdag altijd bomvol? Plan vooruit met de vaste pool van EXTRA." },
                  { title: "Kwaliteit", desc: "Geen gehaaste inhuurders, iedereen is gecheckt en getraind op gastvrijheid." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                      <Check className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xl">{item.title}</h4>
                      <p className="text-purple-100/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200} className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] p-10 sm:p-16 text-white relative overflow-hidden shadow-2xl">
               <XPatternBg count={3} opacity={0.15} color="white" />
               <div className="relative z-10">
                 <h3 className="text-3xl font-black mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>De EXTRA oplossing</h3>
                 <p className="text-purple-100 text-lg mb-10 leading-relaxed">
                   Wij bieden niet zomaar personeel; wij bieden een verlengstuk van jouw eigen team. Door onze strenge selectie en ons unieke beloningssysteem zijn onze medewerkers extra gemotiveerd.
                 </p>
                 <Link href="/personeelsaanvraag" className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-8 py-4 rounded-full hover:bg-purple-50 transition-all hover:scale-105">
                    Personeel aanvragen
                    <ArrowRight className="w-5 h-5" />
                 </Link>
               </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 6. WAAROM EXTRA */}
      <section className="py-24 bg-[#0d0415] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection className="mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Waarom horecaondernemers kiezen voor EXTRA
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Eigen pool", desc: "800+ actieve medewerkers in Amsterdam, direct beschikbaar voor jouw locatie.", icon: Star },
              { title: "Loondienst", desc: "Alle medewerkers in loondienst, geen gedoe met ZZP-risico's of administratie.", icon: Shield },
              { title: "NEN-gecertificeerd", desc: "EXTRA is NEN-4400-1 gecertificeerd, zodat je altijd compliant inhuurt.", icon: Check },
            ].map((usp, i) => (
              <RevealSection key={i} delay={i * 100} className="bg-white/5 p-10 rounded-3xl border border-white/10">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-purple-600/20">
                  <usp.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{usp.title}</h3>
                <p className="text-purple-100/60 leading-relaxed">{usp.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SOCIAL PROOF */}
      <section className="py-24 bg-[#0a0310]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
             <h2 className="text-3xl sm:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
               Wat horecamanagers zeggen
             </h2>
          </RevealSection>
          <div className="grid md:grid-cols-2 gap-8">
            <RevealSection className="bg-white/5 p-10 rounded-3xl border border-white/10 relative">
              <div className="flex gap-1 text-yellow-400 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-purple-100/80 italic text-lg mb-8 leading-relaxed">
                "Wanneer we last-minute uitval hebben op een drukke zaterdagavond, is EXTRA onze eerste keuze. De medewerkers snappen direct wat er moet gebeuren en passen goed in ons team."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center text-purple-400 font-bold border border-purple-500/30">M</div>
                <div>
                  <p className="font-bold text-white text-lg">Mark de Vries</p>
                  <p className="text-purple-100/40 text-sm">Restaurantmanager, Amsterdam Centrum</p>
                </div>
              </div>
            </RevealSection>
            <RevealSection delay={200} className="bg-white/5 p-10 rounded-3xl border border-white/10 relative">
              <div className="flex gap-1 text-yellow-400 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-purple-100/80 italic text-lg mb-8 leading-relaxed">
                "Fijn personeel dat representatief is en echt zin heeft om te werken. Het beloningssysteem van EXTRA zie je echt terug in de motivatie op de werkvloer. Een aanrader."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center text-purple-400 font-bold border border-purple-500/30">S</div>
                <div>
                  <p className="font-bold text-white text-lg">Sophie Janssen</p>
                  <p className="text-purple-100/40 text-sm">Eigenaar, Bistro de Pijp</p>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 8. INTERNAL LINKS */}
      <section className="py-16 bg-[#0d0415] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-purple-100/40 mb-8 uppercase tracking-widest font-bold">Gerelateerde pagina's</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <Link href="/personeel-gezocht" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">Alle sectoren</Link>
            <Link href="/personeelsaanvraag" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">Personeel aanvragen</Link>
            <Link href="/hotelpersoneel-inhuren" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">Hotelpersoneel</Link>
            <Link href="/eventpersoneel-inhuren" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">Eventpersoneel</Link>
          </div>
        </div>
      </section>

      {/* 9. CTA SECTION */}
      <section className="py-24 bg-[#0a0310]">
        <div className="max-w-5xl mx-auto px-5">
          <RevealSection className="bg-gradient-to-br from-purple-600 to-indigo-800 rounded-[3rem] p-12 sm:p-20 text-center relative overflow-hidden shadow-2xl">
            <XPatternBg count={4} opacity={0.15} color="white" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-6xl font-black text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Horecateam versterken?
              </h2>
              <p className="text-xl text-purple-100/90 mb-12 max-w-2xl mx-auto font-medium">
                Binnen 2 minuten geplaatst. Wij gaan direct voor je aan de slag om de beste match te vinden.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/personeelsaanvraag" className="bg-white text-purple-900 font-bold px-10 py-5 rounded-full text-xl hover:bg-purple-50 transition-all hover:scale-105 shadow-xl shadow-black/20">
                  Personeel aanvragen
                </Link>
                <a href="tel:0851305915" className="bg-purple-900/40 border-2 border-white/20 text-white font-bold px-10 py-5 rounded-full text-xl hover:bg-purple-900/60 transition-all flex items-center justify-center gap-3">
                  <Phone className="w-6 h-6" />
                  085 130 59 15
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
