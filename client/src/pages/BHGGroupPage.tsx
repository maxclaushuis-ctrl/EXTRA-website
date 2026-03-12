import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { ClientReviewCard } from "@/components/ClientReviewCard";
import { getReviewsByCategory } from "@/data/reviews";
import {
  ArrowRight, Phone, Shield, Clock, Users, Zap, Gift,
  Building2, UserCheck, Star, CheckCircle2, TrendingUp,
  BedDouble, Utensils, ChefHat, GlassWater, Trophy,
  CalendarCheck, Bell, BarChart3, Layers, Target, Handshake,
  Sparkles, Heart, Check
} from "lucide-react";
import heroBgImage from "@assets/hero-background.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoNH from "@assets/Copyright_nh_hotel_group_Logo_NH-Hotels_1769548607559.webp";
import screenshotGebruikers from "@assets/Gebruikers_1772098047298.webp";
import screenshotProfiel from "@assets/Medewerkersprofiel_1772098064753.webp";
import screenDashboard from "@assets/IMG_9066_1773314165933.png";
import screenRewards from "@assets/IMG_9067_1773314165933.png";
import screenUitdagingen from "@assets/IMG_9071_1773316943369.png";
import screenRanglijst from "@assets/IMG_9068_1773314165933.png";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(28px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function XPatternBg({ count = 4, opacity = 0.06, color = "rgba(139,92,246,1)", className = "" }: { count?: number; opacity?: number; color?: string; className?: string }) {
  const positions = [
    { top: "8%", left: "3%" }, { top: "15%", right: "4%" },
    { bottom: "10%", left: "5%" }, { bottom: "8%", right: "3%" },
    { top: "45%", left: "1%" }, { top: "40%", right: "2%" },
  ].slice(0, count);
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {positions.map((pos, i) => (
        <div key={i} className="absolute" style={{ ...pos, opacity }}>
          <img src={xPatroon} alt="" width="180" height="180" className="w-28 sm:w-40 lg:w-48" />
        </div>
      ))}
    </div>
  );
}

const appScreens = [
  { key: "dashboard", img: screenDashboard, label: "Dashboard" },
  { key: "beloningen", img: screenRewards, label: "Beloningen" },
  { key: "uitdagingen", img: screenUitdagingen, label: "Uitdagingen" },
  { key: "ranglijst", img: screenRanglijst, label: "Ranglijst" },
];

export default function BHGGroupPage() {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveScreen(p => (p + 1) % appScreens.length), 3500);
    return () => clearInterval(interval);
  }, []);

  const hotelReviews = getReviewsByCategory("hotels");

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <PublicNav forceDark={true} />

      {/* ═══════════════════════════════════════════════════ */}
      {/* 1. HERO                                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBgImage} alt="" className="w-full h-full object-cover object-center" loading="eager" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(26,10,46,0.96) 0%, rgba(26,10,46,0.92) 40%, rgba(26,10,46,0.75) 65%, rgba(26,10,46,0.40) 82%, rgba(26,10,46,0.12) 100%)" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 via-transparent to-transparent" />
        </div>
        <XPatternBg count={3} opacity={0.07} color="rgba(168,85,247,0.7)" />

        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-36 sm:pb-32">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-3 mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/20">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white text-xs sm:text-sm font-semibold">Gepersonaliseerde brochure voor BHG Group</span>
              </div>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-5 sm:mb-8"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Minder uitval,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-200">
                meer continuïteit
              </span>{" "}
              in uw hotels
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-purple-100/80 leading-relaxed mb-8 sm:mb-10 max-w-xl">
              EXTRA levert geselecteerd hotelpersoneel met een bewezen systeem voor motivatie, kwaliteit en loyaliteit — speciaal ontwikkeld voor hotelgroepen die structurele rust willen in hun operatie.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <a
                href="/personeelsaanvraag"
                className="group bg-white text-purple-900 font-bold px-7 sm:px-8 py-4 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
              >
                Plan een kennismaking
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-8 py-4 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                085 130 59 15
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              {[
                { icon: Shield, text: "NEN-4400-1 gecertificeerd" },
                { icon: Users, text: "Iedereen volledig in loondienst" },
                { icon: Clock, text: "Snel inzetbaar, ook last minute" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/80">
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-3 h-3" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 2. LOGO'S VERTROUWDE PARTNERS                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <RevealSection>
            <p className="text-center text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 sm:mb-10">
              Ook vertrouwd door toonaangevende hotelketens
            </p>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 lg:gap-20">
              {[
                { src: logoMarriott, alt: "Marriott Hotels" },
                { src: logoHilton, alt: "Hilton Hotels" },
                { src: logoAmrath, alt: "Amrâth Hotels" },
                { src: logoNH, alt: "NH Hotels" },
              ].map((logo, i) => (
                <div key={i} className="hover:scale-105 transition-transform duration-300">
                  <img src={logo.src} alt={logo.alt} width="200" height="200" loading="lazy" decoding="async" className="h-10 sm:h-14 lg:h-16 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 3. KLANTREVIEWS HOTELS                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: "#fdf9f3" }}>
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-10 sm:mb-14">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                <Heart className="w-4 h-4" /> Wat hotelmanagers zeggen
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Ervaren partners. Bewezen resultaten.
              </h2>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <span className="text-base font-bold text-gray-900">4,8</span>
                <span className="text-sm text-gray-500">gemiddeld uit 232 Google reviews</span>
              </div>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {hotelReviews.map((review, i) => (
              <RevealSection key={review.id} delay={i * 100}>
                <ClientReviewCard review={review} variant="light" />
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={200}>
            <div className="flex justify-center mt-10">
              <Link href="/klantcases-horeca">
                <button className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-200" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
                  Meer klantcases bekijken <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 4. WAAROM BHG VOOR EXTRA KIEST                     */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                <Shield className="w-4 h-4" /> Waarom EXTRA
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Wat BHG Group van EXTRA mag verwachten
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Hotelgroepen hebben andere eisen dan losse locaties. EXTRA begrijpt dat — en bouwt daar de samenwerking omheen.
              </p>
            </div>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                emoji: "🛡️",
                title: "Structureel minder no-shows",
                desc: "Ons beloningssysteem beloont medewerkers die betrouwbaar zijn. Dat leidt aantoonbaar tot minder uitval en no-shows — ook bij last-minute diensten.",
              },
              {
                emoji: "🏨",
                title: "Vaste gezichten per hotel",
                desc: "Via favorietenpoules bouwen we per BHG-locatie een vaste kern op. Medewerkers die uw procedures, standaarden en cultuur kennen.",
              },
              {
                emoji: "📊",
                title: "Zicht op prestaties per locatie",
                desc: "Na iedere dienst registreren we scores, complimenten en feedback. U weet wie op welke locatie presteert — en wij sturen hier actief op.",
              },
              {
                emoji: "⚡",
                title: "Snelle opschaling bij drukte",
                desc: "Seizoensdrukte, een groot event of onverwachte uitval? EXTRA schakelt snel en levert binnen 48 uur geselecteerd personeel.",
              },
              {
                emoji: "🤝",
                title: "Één aanspreekpunt voor alle locaties",
                desc: "Voor BHG Group werken we met een dedicated contactpersoon die alle locaties kent en overzicht houdt over de samenwerking.",
              },
              {
                emoji: "📋",
                title: "Volledig in loondienst & gecertificeerd",
                desc: "Geen zzp-risico's. Alle medewerkers zijn bij EXTRA in loondienst. NEN-4400-1 gecertificeerd en volledig conform arbeidswetgeving.",
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl sm:rounded-[1.5rem] p-6 sm:p-8 border border-purple-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full shadow-sm">
                  <div className="text-3xl sm:text-4xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">{item.emoji}</div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 5. FUNCTIES VOOR HOTELS                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.1} color="rgba(255,255,255,0.7)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                <Sparkles className="w-4 h-4" /> Functies
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Voor elke afdeling binnen uw hotels
              </h2>
              <p className="text-purple-200/70 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
                Van housekeeping tot front office en F&B — EXTRA levert voor alle operationele afdelingen van BHG Group.
              </p>
            </div>
          </RevealSection>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-5">
            {[
              { icon: BedDouble, title: "Housekeeping", desc: "Kamermeisjes, room attendants en turndown-medewerkers die uw hotelstandaard kennen en hanteren." },
              { icon: UserCheck, title: "Front Office", desc: "Representatieve receptiemedewerkers en gastheren/-vrouwen voor een professionele eerste indruk." },
              { icon: Utensils, title: "F&B Bediening", desc: "Ervaren bediening voor restaurant, roomservice, banqueting en conferenties." },
              { icon: ChefHat, title: "Keuken & Chef", desc: "Keukenondersteuning, sous-chefs en ontbijtmedewerkers voor een soepele F&B-operatie." },
              { icon: GlassWater, title: "Bar & Lounge", desc: "Barpersoneel en cocktailmakers die stijlvol en efficiënt werken tijdens drukke avonduren." },
              { icon: CalendarCheck, title: "Event & Banqueting", desc: "Teams voor hotelgebonden events, gala-diners, congressen en boardroom-lunches." },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 70}>
                <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 sm:p-7 hover:bg-white/[0.10] hover:border-purple-400/30 transition-all duration-300 h-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-purple-200/60 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 6. SELECTIEPROCES                                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                <UserCheck className="w-4 h-4" /> Selectieproces
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Elke kandidaat, persoonlijk gescreend
              </h2>
              <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8">
                BHG Group vraagt om personeel dat meer is dan technisch competent. Representativiteit, gastvrijheid en betrouwbaarheid zijn doorslaggevend in onze selectie — aan de voorkant, zodat u nooit voor verrassingen staat.
              </p>
              <div className="space-y-4">
                {[
                  { icon: CheckCircle2, title: "Persoonlijk kennismakingsgesprek", desc: "Iedere kandidaat spreekt eerst met ons team. Karakter, motivatie en gastvrijheid wegen net zo zwaar als ervaring." },
                  { icon: Star, title: "Beoordeling op hotelstandaarden", desc: "We toetsen actief op representativiteit, communicatie en kennis van hospitality-protocollen." },
                  { icon: BarChart3, title: "Trackrecord en referenties", desc: "Eerdere prestaties bij hotels worden gewogen. Positieve historie geeft voorrang bij toekomstige aanvragen van BHG Group." },
                  { icon: Shield, title: "Screening & documentcontrole", desc: "Volledige identiteits- en tewerkstellingsvergunning-controle voordat iemand zijn eerste dienst draait." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm sm:text-base">{item.title}</p>
                      <p className="text-gray-500 text-xs sm:text-sm mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="relative pb-16 pr-6">
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-purple-100">
                  <img src={screenshotGebruikers} alt="EXTRA kandidatenoverzicht" className="w-full" loading="lazy" decoding="async" />
                </div>
                <div className="absolute -bottom-4 -right-2 w-[60%] bg-white rounded-2xl shadow-2xl p-4 sm:p-5 border border-purple-100 rotate-1 hover:rotate-0 transition-transform duration-300">
                  <img src={screenshotProfiel} alt="Medewerkersprofiel met score" className="w-full rounded-lg" loading="lazy" decoding="async" />
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 7. FAVORIETENPOULE                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-white">
        <XPatternBg count={3} opacity={0.07} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection delay={100} className="order-2 lg:order-1">
              <div className="relative bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 sm:p-10 border border-purple-100">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-purple-600 text-white rounded-full px-5 py-2 text-sm font-bold mb-4">
                    <Star className="w-4 h-4 fill-white" /> Favorietenpoule actief
                  </div>
                  <p className="text-gray-600 text-sm">Uw vaste kern voor elk hotel binnen BHG Group</p>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Amrâth Grand Hotel", count: 12, color: "from-purple-500 to-purple-600" },
                    { name: "BHG Hotel Centrum", count: 8, color: "from-indigo-500 to-indigo-600" },
                    { name: "BHG Airport Hotel", count: 6, color: "from-violet-500 to-violet-600" },
                  ].map((hotel, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${hotel.color} flex items-center justify-center flex-shrink-0`}>
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{hotel.name}</p>
                        <p className="text-xs text-gray-400">{hotel.count} vaste medewerkers in poule</p>
                      </div>
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">actief</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-purple-100 grid grid-cols-3 gap-4 text-center">
                  {[
                    { value: "26", label: "Vaste medewerkers" },
                    { value: "94%", label: "Terugkeerpercentage" },
                    { value: "↓62%", label: "Minder introductietijd" },
                  ].map((stat, i) => (
                    <div key={i}>
                      <p className="text-xl sm:text-2xl font-black text-purple-600">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
            <RevealSection className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-purple-100/60 px-4 py-2 rounded-full">
                <Layers className="w-4 h-4" /> Favorietenpoule
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Dezelfde gezichten.<br />Minder uitleg. Meer kwaliteit.
              </h2>
              <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-6">
                Voor BHG Group bouwen we per locatie een vaste favorietenpoule op. Medewerkers die uw procedures, standaarden en cultuur kennen — zodat elke dienst soepel verloopt, ook bij onverwachte drukte.
              </p>
              <div className="space-y-3">
                {[
                  "Snellere inwerktijd bij terugkerende medewerkers",
                  "Hogere gastvredenheid door consistentie",
                  "Minder operationele druk op vaste managers",
                  "Per locatie een aparte poule, centraal beheerd",
                  "Inzicht in wie waar presteert via ons platform",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm sm:text-base text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 8. EXTRAATJE BELONINGSSYSTEEM                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170926] to-[#12071f]" />
        <XPatternBg count={4} opacity={0.10} color="rgba(168,85,247,0.6)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-5 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                <Gift className="w-4 h-4" /> Het Extraatje systeem
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Gemotiveerde medewerkers leveren betere service
              </h2>
              <p className="text-purple-200/70 text-base sm:text-lg leading-relaxed mb-8">
                Het Extraatje beloningssysteem is onze sleuteloplossing voor continuïteit. Medewerkers verdienen punten door op tijd te komen, diensten niet af te zeggen en bij vaste klanten te werken. Dat levert u betere, loyalere mensen op.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: TrendingUp, label: "Motivatie", desc: "Punten voor punctualiteit, kwaliteit en terugkeer" },
                  { icon: Trophy, label: "Loyaliteit", desc: "Ranglijst en beloningen houden medewerkers betrokken" },
                  { icon: Target, label: "Continuïteit", desc: "Vaste medewerkers kiezen vaker voor vaste locaties" },
                  { icon: Bell, label: "Minder uitval", desc: "No-shows dalen aantoonbaar bij actieve deelnemers" },
                ].map((item, i) => (
                  <div key={i} className="bg-white/[0.06] border border-white/10 rounded-xl p-4 sm:p-5">
                    <item.icon className="w-5 h-5 text-purple-400 mb-2" />
                    <p className="font-bold text-white text-sm mb-1">{item.label}</p>
                    <p className="text-xs text-purple-200/60 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              <a href="/beloningssysteem" className="inline-flex items-center gap-2 text-purple-300 font-bold text-sm hover:text-white transition-colors group">
                Lees meer over het beloningssysteem
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </RevealSection>

            <RevealSection delay={150}>
              <div className="relative">
                <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px]">
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10" style={{ background: "linear-gradient(145deg, #2d1b4e, #1a0a2e)" }}>
                    <div className="relative" style={{ paddingBottom: "0" }}>
                      {appScreens.map((screen, i) => (
                        <img
                          key={screen.key}
                          src={screen.img}
                          alt={screen.label}
                          className={`w-full transition-opacity duration-500 ${activeScreen === i ? "opacity-100 relative" : "opacity-0 absolute inset-0"}`}
                          loading="lazy"
                          decoding="async"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full blur-xl bg-purple-400/20" />
                </div>
                <div className="flex justify-center gap-2 mt-6">
                  {appScreens.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveScreen(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${activeScreen === i ? "bg-purple-400 w-8" : "bg-purple-700 w-2 hover:bg-purple-500"}`}
                    />
                  ))}
                </div>
                <div className="flex justify-center gap-2 mt-3 flex-wrap">
                  {appScreens.map((screen, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveScreen(i)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${activeScreen === i ? "bg-purple-500 text-white" : "text-purple-400 hover:text-purple-200"}`}
                    >
                      {screen.label}
                    </button>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 9. DATA & TECHNOLOGIE                              */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden" style={{ backgroundColor: "#faf8f5" }}>
        <XPatternBg count={3} opacity={0.06} color="rgba(139,92,246,1)" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                <BarChart3 className="w-4 h-4" /> Data & technologie
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Grip op kwaliteit, per locatie
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Geen buikgevoel, maar data. EXTRA meet prestaties per medewerker, per locatie en per functietype. Zo weten we altijd wie op welke BHG-locatie het beste presteert.
              </p>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: BarChart3,
                title: "Prestatiescore per medewerker",
                desc: "Na elke dienst registreren we scores op punctualiteit, werkhouding en kwaliteit. Zo wordt elke plaatsing beter dan de vorige.",
              },
              {
                icon: Users,
                title: "Matchingalgoritme",
                desc: "Onze software matcht medewerkers op historische prestaties bij soortgelijke locaties — niet alleen op beschikbaarheid.",
              },
              {
                icon: Zap,
                title: "Real-time planning",
                desc: "Via ons platform ziet u wie er beschikbaar is, wie al eerder bij uw hotel heeft gewerkt en hoe snel we kunnen schakelen.",
              },
              {
                icon: TrendingUp,
                title: "Periodieke rapportage",
                desc: "BHG Group ontvangt periodiek een overzicht van kwaliteitsscores, inzetfrequentie en trends per locatie.",
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-100 shadow-sm hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-5">
                    <item.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 10. HOE DE SAMENWERKING ERUITZIET                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-white">
        <XPatternBg count={2} opacity={0.06} color="rgba(139,92,246,1)" />
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <RevealSection>
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mb-4 bg-purple-100/60 px-4 py-2 rounded-full">
                <Handshake className="w-4 h-4" /> Samenwerking
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Zo ziet de samenwerking eruit
              </h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-xl mx-auto">
                Concrete stappen, geen vaag traject. Van eerste gesprek tot vaste operationele partner.
              </p>
            </div>
          </RevealSection>
          <div className="relative">
            <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-purple-100 -translate-x-1/2" />
            <div className="space-y-8 sm:space-y-0">
              {[
                {
                  step: "01",
                  title: "Kennismaking & intake",
                  desc: "We leren BHG Group kennen: welke locaties, welke functies, welke standaarden en wat er tot nu toe mis ging. Op basis hiervan stellen we een maatwerkplan op.",
                  side: "left",
                },
                {
                  step: "02",
                  title: "Proefplaatsingen & matching",
                  desc: "We starten met gerichte proefplaatsingen. Medewerkers worden gematcht op prestaties bij vergelijkbare hotels, niet alleen op beschikbaarheid.",
                  side: "right",
                },
                {
                  step: "03",
                  title: "Opbouw favorietenpoule",
                  desc: "Na de eerste diensten selecteren we samen wie er structureel aan de slag gaan bij BHG. Die medewerkers worden opgenomen in de vaste favorietenpoule per locatie.",
                  side: "left",
                },
                {
                  step: "04",
                  title: "Vaste operationele partner",
                  desc: "U heeft één aanspreekpunt, inzicht in kwaliteitsdata en een vaste pool per locatie. EXTRA zorgt voor continuïteit, u focust op uw gasten.",
                  side: "right",
                },
              ].map((item, i) => (
                <RevealSection key={i} delay={i * 100}>
                  <div className={`sm:flex sm:gap-8 sm:items-center ${item.side === "right" ? "sm:flex-row-reverse" : ""}`}>
                    <div className={`sm:w-1/2 ${item.side === "right" ? "sm:text-left" : "sm:text-right"} mb-4 sm:mb-0`}>
                      <div className={`bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 sm:p-8 border border-purple-100 shadow-sm ${item.side === "right" ? "sm:ml-8" : "sm:mr-8"}`}>
                        <span className="text-4xl font-black text-purple-200 block mb-2">{item.step}</span>
                        <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex sm:w-0 sm:justify-center">
                      <div className="w-4 h-4 rounded-full bg-purple-500 border-4 border-purple-100 flex-shrink-0" />
                    </div>
                    <div className="sm:w-1/2" />
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 11. CTA                                            */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={4} opacity={0.10} color="rgba(255,255,255,0.7)" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <RevealSection>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6 bg-white/10 backdrop-blur-sm px-4 sm:px-5 py-2 rounded-full border border-white/10">
              <Building2 className="w-4 h-4" /> BHG Group × EXTRA
            </span>
            <h2
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-5 sm:mb-8 leading-tight"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Klaar voor minder uitval{" "}
              <span className="relative inline-block">
                <span className="relative z-10">en meer continuïteit?</span>
                <span className="absolute bottom-0.5 sm:bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-400 -skew-x-3 z-0 opacity-60 rounded-sm" />
              </span>
            </h2>
            <p className="text-base sm:text-xl text-purple-200 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Plan een kennismaking en ontdek hoe EXTRA specifiek voor BHG Group een structurele oplossing kan bouwen — van selectie tot favorietenpoule en datagedreven kwaliteitsbewaking.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mb-10 sm:mb-14">
              <a
                href="/personeelsaanvraag"
                className="group bg-white text-purple-900 font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3"
                style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3), 0 8px 32px rgba(0,0,0,0.2)" }}
              >
                Plan een kennismaking
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="tel:0851305915" className="group border-2 border-white/25 text-white font-bold px-7 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg hover:bg-white/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3">
                <Phone className="w-5 h-5" />
                085 130 59 15
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {[
                { icon: Shield, text: "NEN-4400-1 gecertificeerd" },
                { icon: Users, text: "Iedereen in loondienst" },
                { icon: Clock, text: "Binnen 48 uur beschikbaar" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/60">
                  <item.icon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
