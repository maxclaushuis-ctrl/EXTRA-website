import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Link } from "wouter";
import {
  ArrowRight, UtensilsCrossed, Beer, Zap, Trophy, Gift,
  Clock, MapPin, Users, CheckCircle2, Star,
  ChevronDown, ChevronUp, Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import horecaImg from "@assets/Horecamedewerker_1771836004844.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoHetePeper from "@assets/Logo_hetepeper_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.webp";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

const faqs = [
  {
    q: "Kan ik horeca werk combineren met mijn studie?",
    a: "Ja, absoluut. Bij EXTRA kies je zelf wanneer je werkt. Je meldt je beschikbaar voor de diensten die passen bij jouw rooster. Veel van onze medewerkers combineren werken met een studie.",
  },
  {
    q: "Heb ik horeca ervaring nodig?",
    a: "Nee, niet per se. We kijken vooral naar jouw enthousiasme en instelling. Geen ervaring? Geen probleem. We zorgen voor een goede introductie bij de locatie.",
  },
  {
    q: "Hoe snel kan ik beginnen?",
    a: "Zodra je aanmelding en kennismaking zijn afgerond, kun je al snel je eerste diensten kiezen. Veel nieuwe medewerkers werken binnen een week na het gesprek al.",
  },
  {
    q: "Waar werk ik als horecamedewerker via EXTRA?",
    a: "Je werkt bij uiteenlopende locaties zoals restaurants, hotels, evenementenlocaties en cateraars in Amsterdam, Utrecht en Den Haag.",
  },
  {
    q: "Hoe vaak kan ik werken?",
    a: "Dat bepaal je volledig zelf. Of je nu twee diensten per maand wilt of bijna fulltime gaat, je geeft zelf je beschikbaarheid door en kiest de diensten die je wilt draaien.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-white/10 rounded-2xl overflow-hidden bg-white/5 hover:bg-white/8 transition-colors cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4 p-6">
        <span className="font-bold text-white text-sm sm:text-base leading-snug">{q}</span>
        {open
          ? <ChevronUp className="w-5 h-5 text-purple-400 shrink-0" />
          : <ChevronDown className="w-5 h-5 text-white/40 shrink-0" />}
      </div>
      {open && (
        <div className="px-6 pb-6 text-white/60 text-sm leading-relaxed border-t border-white/10 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HorecaWerk() {
  useEffect(() => {
    document.title = "Horeca Werk | Bijbaan in de Horeca via EXTRA";
  }, []);

  const tasks = [
    { img: horecaImg, icon: UtensilsCrossed, title: "Bediening en banqueting", desc: "Serveren, bestellingen opnemen en gasten verwelkomen op toplocaties." },
    { img: "/blog-barista.jpg", icon: Beer, title: "Werken achter de bar", desc: "Tap een perfect biertje of mix cocktails in hotels, restaurants en op festivals." },
    { img: "/blog-catering.jpg", icon: UtensilsCrossed, title: "Events en catering", desc: "Helpen bij gala's, festivals en zakelijke evenementen. Geen twee dagen hetzelfde." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0310] text-white font-sans selection:bg-purple-500/30">
      <PublicNav forceDark={false} />

      <main>

        {/* ======================== 1. HERO ======================== */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#0a0310] to-[#0a0310]" />
          <XPatternBg count={3} opacity={0.1} color="rgba(168,85,247,0.5)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                <UtensilsCrossed className="w-4 h-4" /> Horeca werk via EXTRA
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Werken in de horeca via <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">EXTRA</span>
              </h1>
              <p className="text-xl text-purple-100/70 mb-8 leading-relaxed max-w-2xl">
                Werk bij restaurants, hotels en events in Amsterdam, Utrecht en Den Haag. Kies zelf wanneer je werkt.
              </p>
              <div className="flex flex-wrap gap-2 mb-10">
                {[
                  { icon: Wallet, label: "Dagbetaling mogelijk" },
                  { icon: Clock, label: "Werk wanneer het jou uitkomt" },
                  { icon: CheckCircle2, label: "Iedereen in loondienst" },
                ].map(({ icon: Icon, label }, i) => (
                  <span key={i} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm font-bold text-white/80">
                    <Icon className="w-3.5 h-3.5 text-purple-400" /> {label}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Schrijf je in <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/hoe-extra-werkt" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-full border border-white/20 transition-all">
                  Bekijk hoe het werkt
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ======================== 2. WAT DOE JE ======================== */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Wat doe je als horecamedewerker
                </h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  Als horecamedewerker werk je op verschillende locaties zoals restaurants, hotels en events. Je werkzaamheden zijn altijd afwisselend.
                </p>
              </div>
            </RevealSection>
            <div className="grid md:grid-cols-3 gap-6">
              {tasks.map((task, i) => (
                <RevealSection key={i} delay={i * 100}>
                  <div className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col h-full">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={task.img} alt={task.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0310]/80 to-transparent" />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-600 transition-colors">
                          <task.icon className="w-5 h-5 text-purple-400 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{task.title}</h3>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">{task.desc}</p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <XDivider />

        {/* ======================== 3. WAAR KUN JE WERKEN ======================== */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Werk bij de mooiste locaties
                </h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  Via EXTRA werk je bij restaurants, hotels, evenementenlocaties en cateraars. Toplocaties die alleen met de beste medewerkers werken.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {[
                  { Icon: UtensilsCrossed, title: "Restaurants", desc: "Van gezellige eetcafes tot fine dining. Jij zorgt dat gasten een onvergetelijke avond hebben." },
                  { Icon: Star, title: "Hotels en events", desc: "Werken bij de beste hotels en evenementenlocaties van Amsterdam, Utrecht en Den Haag." },
                  { Icon: Beer, title: "Catering en festivals", desc: "Grote festivals, bruiloften en zakelijke events. Altijd een nieuwe omgeving." },
                ].map(({ Icon, title, desc }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <Icon className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-8 text-center">Onder andere bij</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 items-center">
                {[
                  { src: logoHilton, alt: "Hilton" },
                  { src: logoMarriott, alt: "Marriott" },
                  { src: logoAmrath, alt: "Amrâth Hotels" },
                  { src: logoSelectCatering, alt: "Select Catering" },
                  { src: logoHetePeper, alt: "Hete Peper" },
                  { src: logoHartMuseum, alt: "H'art Museum" },
                ].map(({ src, alt }, i) => (
                  <div key={i} className="flex items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors aspect-[3/2]">
                    <img src={src} alt={alt} className="max-h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ======================== 4. ZO WERKT HET ======================== */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Zo werkt werken via EXTRA
                </h2>
                <p className="text-white/60 max-w-lg mx-auto">Van inschrijving tot eerste dienst in vijf simpele stappen.</p>
              </div>
              <div className="relative">
                <div className="absolute left-6 sm:left-7 top-6 bottom-6 w-px bg-gradient-to-b from-purple-500/60 via-purple-500/30 to-transparent hidden sm:block" />
                <div className="space-y-6">
                  {[
                    { step: "01", title: "Schrijf je in", desc: "Vul in drie minuten het aanmeldformulier in. Geen lange papierrompslomp." },
                    { step: "02", title: "Kennismaking", desc: "We leren je kennen via een kort gesprek. Zo weten we precies wat bij je past." },
                    { step: "03", title: "Kies je diensten", desc: "Je geeft je beschikbaarheid door en kiest de diensten die je leuk vindt." },
                    { step: "04", title: "Werk op mooie locaties", desc: "Je stapt de deur uit naar restaurants, hotels en events in jouw regio." },
                    { step: "05", title: "Verdien EXTRA", desc: "Na je dienst ontvang je je loon. Dagbetaling mogelijk via Jixbee. Je spaart ook punten voor leuke beloningen." },
                  ].map(({ step, title, desc }, i) => (
                    <RevealSection key={i} delay={i * 100}>
                      <div className="flex gap-6 items-start">
                        <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-purple-600/20 relative z-10">
                          {step}
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex-1 hover:bg-white/8 transition-colors">
                          <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
                          <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    </RevealSection>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* ======================== 5. WAAROM EXTRA ======================== */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Waarom werken via EXTRA?</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { Icon: Clock, title: "Werk wanneer je wilt", desc: "Kies zelf je diensten. Jij bepaalt wanneer je werkt en geeft je beschikbaarheid door wanneer het jou uitkomt." },
                  { Icon: Zap, title: "Dagbetaling mogelijk", desc: "Ontvang je geld sneller via Jixbee. Niet wachten tot het einde van de maand na een drukke dienst." },
                  { Icon: Trophy, title: "EXTRAATJE beloningen", desc: "Spaar punten per gewerkte dienst en wissel ze in voor leuke extra's. Hoe meer je werkt, hoe meer je verdient." },
                  { Icon: MapPin, title: "Werk bij mooie locaties", desc: "Hotels, restaurants en events. Je werkt nooit twee keer op dezelfde plek. Altijd nieuw, altijd leuk." },
                  { Icon: Users, title: "Persoonlijk contact", desc: "Onze planners kennen jou. Geen callcenter, maar echte mensen die weten wat bij je past." },
                  { Icon: Gift, title: "Gewoon in loondienst", desc: "Geen gedoe met zzp of facturen. Je werkt gewoon veilig en legaal, met alle zekerheid die daarbij hoort." },
                ].map(({ Icon, title, desc }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <Icon className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ======================== 6. REGIO'S ======================== */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Werk in jouw regio</h2>
                <p className="text-white/60 max-w-xl mx-auto">EXTRA is actief in de drie grootste steden van Nederland.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { Icon: MapPin, city: "Amsterdam", desc: "De meeste horecalocaties van Nederland. Van luxehotels tot bruisende events." },
                  { Icon: MapPin, city: "Utrecht", desc: "Stadscafes, zakelijke bijeenkomsten en evenementenlocaties in de dom-stad." },
                  { Icon: MapPin, city: "Den Haag", desc: "Diplomatieke ontvangsten, hotels en evenementen in de stad aan zee." },
                ].map(({ Icon, city, desc }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <Icon className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">{city}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* ======================== 7. TESTIMONIALS ======================== */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Wat zeggen medewerkers over EXTRA</h2>
                <p className="text-white/60 max-w-lg mx-auto">Geen reclamepraatjes. Gewoon eerlijke ervaringen van mensen die via EXTRA werken.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: "Jasmine K.", role: "Horecamedewerker, Amsterdam", text: "Ik combineer mijn studie met een horeca bijbaan via EXTRA. Ik kies zelf wanneer ik werk en de planners denken altijd mee. Super fijn.", stars: 5 },
                  { name: "Daan V.", role: "Barmedewerker, Utrecht", text: "De dagbetaling maakt echt verschil. Na een drukke dienst staat het loon de volgende ochtend al op mijn rekening. Werken via EXTRA is gewoon lekker snel.", stars: 5, featured: true },
                  { name: "Sara M.", role: "Eventmedewerker, Den Haag", text: "Ik werk bij de mooiste evenementenlocaties van Den Haag. Via EXTRA zie ik plekken waar ik anders nooit zou komen. De communicatie is altijd snel en duidelijk.", stars: 5 },
                ].map(({ name, role, text, stars, featured }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className={`bg-white/5 border rounded-2xl p-8 flex flex-col h-full ${featured ? "border-purple-500/50 shadow-lg shadow-purple-500/10" : "border-white/10"}`}>
                      <div className="flex gap-1 mb-5">
                        {Array.from({ length: stars }).map((_, j) => (
                          <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-white/75 text-sm leading-relaxed flex-1 mb-6 italic">"{text}"</p>
                      <div>
                        <div className="font-bold text-white text-sm">{name}</div>
                        <div className="text-white/40 text-xs">{role}</div>
                      </div>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ======================== 8. FAQ ======================== */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-14">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Veelgestelde vragen over horeca werk</h2>
                <p className="text-white/60">Alles wat je wil weten over werken in de horeca via EXTRA.</p>
              </div>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <RevealSection key={i} delay={i * 60}>
                    <FaqItem q={faq.q} a={faq.a} />
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ======================== 9. CTA ======================== */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>Klaar om te beginnen</h2>
              <p className="text-xl text-purple-100 mb-10">Schrijf je vandaag nog in en ontdek hoe leuk werken via EXTRA kan zijn.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-10 py-5 rounded-full hover:bg-purple-50 transition-all hover:scale-105 shadow-2xl">
                  Schrijf je in bij EXTRA <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Link Cloud */}
        <section className="py-12 bg-[#0a0310] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6 text-center">Gerelateerde pagina's</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Horeca vacatures Amsterdam", href: "/horeca-vacatures-amsterdam" },
                { label: "Horeca werk Amsterdam", href: "/horeca-werk-amsterdam" },
                { label: "Housekeeping vacatures", href: "/housekeeping-vacatures-amsterdam" },
                { label: "Chef vacatures", href: "/chef-vacatures-amsterdam" },
                { label: "Front office vacatures", href: "/front-office-vacatures-amsterdam" },
              ].map((link, i) => (
                <Link key={i} href={link.href} className="bg-white/5 px-5 py-2.5 rounded-full border border-white/10 text-sm font-medium text-white/60 hover:border-purple-400/50 hover:text-purple-300 transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}
