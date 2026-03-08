import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import {
  ArrowRight,
  PartyPopper,
  Check,
  Phone,
  ArrowLeft,
  Users,
  Zap,
  BarChart3,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  Star,
  GlassWater,
  Utensils,
  LayoutDashboard,
  Award
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import sollicitatieImg from "@assets/Sollicitatieformulier_1772893764120.png";

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealSection({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

function XPatternBg({
  className = "",
  count = 3,
  opacity = 0.12,
  color = "rgba(139,92,246,1)",
}: {
  className?: string;
  count?: number;
  opacity?: number;
  color?: string;
}) {
  const positions = [
    { left: "5%", top: "10%", size: 200, rotate: 15 },
    { left: "80%", top: "20%", size: 160, rotate: -25 },
    { left: "50%", top: "60%", size: 240, rotate: 35 },
    { left: "15%", top: "75%", size: 180, rotate: -10 },
    { left: "90%", top: "80%", size: 140, rotate: 45 },
    { left: "35%", top: "30%", size: 120, rotate: -30 },
  ];
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {positions.slice(0, count).map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: pos.left,
            top: pos.top,
            width: pos.size,
            height: pos.size,
            transform: `rotate(${pos.rotate}deg)`,
            opacity,
            WebkitMaskImage: `url(${xPatroon})`,
            maskImage: `url(${xPatroon})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
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

export default function EventPersoneelGezocht() {
  useEffect(() => {
    document.title = "Eventpersoneel inzetten | EXTRA Uitzendbureau Amsterdam";
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden relative">
      <GrainOverlay />
      <PublicNav />

      {/* 1. HERO */}
      <section
        className="relative min-h-[80svh] flex items-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0a0310 0%, #1a0a3e 50%, #1e1b4b 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-40">
          <img src={heroBgImage} alt="" className="w-full h-full object-cover" />
        </div>
        <XPatternBg
          count={4}
          opacity={0.15}
          color="rgba(255,255,255,0.9)"
          className="z-10"
        />
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="max-w-3xl">
            <RevealSection>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 mb-8">
                <PartyPopper className="w-4 h-4 text-purple-400" />
                <span className="text-white/90 text-sm font-semibold tracking-wide uppercase">
                  Events & Festivals
                </span>
              </div>
              <h1
                className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-8"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Jouw event, onze mensen
              </h1>
              <p className="text-lg sm:text-xl text-purple-100/80 mb-10 leading-relaxed font-medium max-w-2xl">
                Bediening, runners en hosts — EXTRA regelt de bezetting zodat jij je focust op het event.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/personeelsaanvraag"
                  className="group bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold px-8 py-4 rounded-full text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Personeel aanvragen
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="tel:0851305915"
                  className="group border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  085 130 59 15
                </a>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 2. BREADCRUMB */}
      <div className="bg-[#faf8f5] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-4">
          <Link
            href="/personeel-gezocht"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-purple-600 font-semibold transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Personeel gezocht
          </Link>
        </div>
      </div>

      {/* 3. INTRO */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <h2
                className="text-3xl sm:text-4xl font-black text-gray-900 mb-6"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Snel schakelen bij events
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Events zijn onvoorspelbaar. De drukte piek je pas op het moment
                zelf. EXTRA heeft een pool van getrainde medewerkers klaar die
                direct kunnen schakelen. Of het nu gaat om een zakelijk diner
                voor 50 personen of een festival voor 5.000 gasten.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  {
                    title: "Direct inzetbaar",
                    desc: "Binnen no-time de juiste mensen op locatie.",
                  },
                  {
                    title: "Getraind team",
                    desc: "Medewerkers die weten hoe ze moeten aanpakken.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200}>
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 sm:p-12 rounded-3xl border border-purple-100 relative overflow-hidden">
                <XPatternBg count={2} opacity={0.05} />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Onze belofte
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Altijd representatief en verzorgd",
                      "Kennis van etiquette en service",
                      "Flexibel inzetbaar (ook last-minute)",
                      "Gemotiveerd door ons EXTRAATje systeem",
                    ].map((text, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span className="text-gray-700 font-medium">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 4. FLEXIBEL OPSCHALEN */}
      <section className="py-24 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <h2
              className="text-3xl sm:text-5xl font-black text-gray-900 mb-6"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Onbeperkt opschalen
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Van één extra handje tot een compleet team van 50+ medewerkers.
              Wij groeien mee met jouw event.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                count: "1-5",
                label: "Mensen",
                desc: "Voor kleine borrels of intieme diners.",
                icon: Users,
              },
              {
                count: "10-25",
                label: "Mensen",
                desc: "Voor bedrijfsfeesten en middelgrote events.",
                icon: Users,
              },
              {
                count: "50+",
                label: "Mensen",
                desc: "Voor grootschalige producties en festivals.",
                icon: Users,
              },
            ].map((item, i) => (
              <RevealSection
                key={i}
                delay={i * 100}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center group hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-4xl font-black text-purple-600 mb-2">
                  {item.count}
                </div>
                <div className="text-xl font-bold text-gray-900 mb-4">
                  {item.label}
                </div>
                <p className="text-gray-500">{item.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 5. ROLLEN SECTIE */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="mb-16">
            <h2
              className="text-3xl sm:text-5xl font-black text-gray-900 mb-6"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Rollen die EXTRA levert voor events
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Ons team bestaat uit allround horecatalent en specialisten.
            </p>
          </RevealSection>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {[
              { title: "Bediening", icon: Utensils },
              { title: "Barmedewerker", icon: GlassWater },
              { title: "Dinerlopers", icon: Utensils },
              { title: "Eventmedewerker", icon: PartyPopper },
              { title: "Cateringmedewerker", icon: Utensils },
              { title: "Supervisor", icon: UserCheck },
            ].map((role, i) => (
              <RevealSection
                key={i}
                delay={i * 50}
                className="bg-[#faf8f5] p-6 sm:p-8 rounded-2xl border border-gray-100 flex flex-col items-center text-center group hover:bg-purple-600 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <role.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-white transition-colors">
                  {role.title}
                </h3>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 6. KWALITEITSSELECTIE SECTIE */}
      <section className="py-24 bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50 overflow-hidden relative">
        <XPatternBg count={3} opacity={0.05} />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealSection>
              <h2
                className="text-3xl sm:text-5xl font-black text-gray-900 mb-8"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Zo selecteert EXTRA medewerkers
              </h2>
              <p className="text-lg text-gray-600 mb-10">
                Kwaliteit is bij events geen optie, maar een vereiste. Wij
                hanteren een streng selectieproces waarbij we niet alleen kijken
                naar ervaring, maar vooral naar instelling en uitstraling.
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: "Strenge beoordeling",
                    desc: "Elke sollicitant doorloopt een uitgebreid assessment.",
                    icon: Award,
                  },
                  {
                    title: "Focus op houding",
                    desc: "Wij selecteren op gastvrijheid en pro-activiteit.",
                    icon: Star,
                  },
                  {
                    title: "Duidelijke communicatie",
                    desc: "Vloeiend Nederlands en representatief voorkomen.",
                    icon: MessageSquare,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>

            <RevealSection delay={300} className="relative">
              {/* Device Mockup */}
              <div className="relative mx-auto w-full max-w-[500px]">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl rounded-[3rem]" />
                <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl border-4 border-gray-800">
                  <div className="bg-white rounded-[1.8rem] overflow-hidden aspect-[4/5] relative">
                    <img
                      src={sollicitatieImg}
                      alt="EXTRA Sollicitatieformulier"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
                  </div>
                </div>
                {/* Floating Tags */}
                <div className="absolute -right-4 top-1/4 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 animate-bounce-slow">
                  <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                    <UserCheck className="w-4 h-4" /> Geselecteerd
                  </div>
                </div>
                <div className="absolute -left-4 bottom-1/4 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 animate-bounce-slow delay-700">
                  <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
                    <BarChart3 className="w-4 h-4" /> 9.2 Score
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 7. WAAROM EXTRA VOOR EVENTS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <h2
              className="text-3xl sm:text-5xl font-black text-gray-900 mb-6"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Waarom EXTRA voor events
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Maximale flexibiliteit",
                desc: "Last-minute wijzigingen in het draaiboek? Wij schakelen moeiteloos mee.",
                icon: Zap,
              },
              {
                title: "Kwaliteit gegarandeerd",
                desc: "Onze mensen zijn getraind in hospitality en representativiteit.",
                icon: ShieldCheck,
              },
              {
                title: "Gemotiveerde mensen",
                desc: "Door ons beloningssysteem gaan medewerkers altijd voor die 10.",
                icon: Trophy,
              },
            ].map((usp, i) => (
              <RevealSection key={i} delay={i * 100} className="text-center group">
                <div className="w-20 h-20 rounded-[2rem] bg-purple-50 flex items-center justify-center mx-auto mb-8 group-hover:bg-purple-600 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-xl group-hover:shadow-purple-200">
                  <usp.icon className="w-10 h-10 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {usp.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{usp.desc}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div
            className="relative rounded-[3rem] overflow-hidden p-8 sm:p-20 text-center"
            style={{
              background: "linear-gradient(135deg, #0a0310 0%, #1a0a3e 100%)",
            }}
          >
            <XPatternBg count={3} opacity={0.1} color="white" />
            <RevealSection className="relative z-10">
              <h2
                className="text-3xl sm:text-5xl font-black text-white mb-8"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Klaar voor een geslaagd event?
              </h2>
              <p className="text-xl text-purple-100/70 mb-12 max-w-2xl mx-auto">
                Laat ons de personele zorg uit handen nemen, zodat jij je kunt
                focussen op de gasten.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href="/personeelsaanvraag"
                  className="bg-white text-purple-900 font-black px-10 py-5 rounded-full text-xl hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1"
                >
                  Personeel aanvragen
                </Link>
                <a
                  href="tel:0851305915"
                  className="flex items-center justify-center gap-3 text-white font-bold text-xl px-10 py-5 rounded-full border-2 border-white/20 hover:bg-white/10 transition-all"
                >
                  <Phone className="w-6 h-6" />
                  085 130 59 15
                </a>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      <PublicFooter />

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
