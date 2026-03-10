import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { RevealSection, XPatternBg } from "@/pages/LandingPage";
import { Link } from "wouter";
import {
  ArrowRight, UtensilsCrossed, Beer, PartyPopper, Layers,
  Zap, Trophy, Gift, MapPin, Clock, Star, CheckCircle,
  Banknote, Users, CalendarCheck, Handshake, ChevronRight
} from "lucide-react";
import { useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import horecaImg from "@assets/Horecamedewerker_1771836004844.webp";
import baristaImg from "@/assets/images/blog-barista.jpg";
import cateringImg from "@/assets/images/blog-catering.jpg";
import hotelImg from "@/assets/images/blog-hotel.jpg";

const XDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 64L720 0L1440 64H0Z" fill="#0d0415" />
    </svg>
  </div>
);

const XDividerReverse = () => (
  <div className="relative h-16 overflow-hidden">
    <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <path d="M0 0L720 64L1440 0H0Z" fill="#0d0415" />
    </svg>
  </div>
);

const jobTypes = [
  {
    title: "Bediening",
    img: horecaImg,
    icon: UtensilsCrossed,
    desc: "Serveren in restaurants, hotel-dining en bij zakelijke diners. Jij bent het gezicht van de avond.",
  },
  {
    title: "Bar",
    img: baristaImg,
    icon: Beer,
    desc: "Tap bier, mix cocktails of zet koffie op toplocaties. Van bruine kroeg tot rooftop bar.",
  },
  {
    title: "Events en catering",
    img: cateringImg,
    icon: PartyPopper,
    desc: "Werk bij gala-diners, festivals en zakelijke events. Nooit hetzelfde, altijd de moeite waard.",
  },
  {
    title: "Banqueting",
    img: hotelImg,
    icon: Layers,
    desc: "Opbouwen, serveren en afruimen bij hotel-events. Structuur, samenwerken en precisie.",
  },
];

const usps = [
  {
    Icon: Zap,
    title: "Dagbetaling via Jixbee",
    desc: "Na je dienst staat je geld dezelfde dag nog op je rekening. Geen wachten tot het einde van de maand.",
  },
  {
    Icon: CalendarCheck,
    title: "Werk wanneer jij wilt",
    desc: "Jij kiest je eigen diensten via de EXTRA app. Passend bij je studie, sport of andere bezigheden.",
  },
  {
    Icon: Gift,
    title: "EXTRAATje beloningen",
    desc: "Spaar punten voor elke dienst en wissel ze in voor beloningen. Hoe meer je werkt, hoe meer je verdient.",
  },
];

const steps = [
  { number: "1", title: "Schrijf je in", desc: "Vul het aanmeldformulier in. Duurt minder dan 5 minuten." },
  { number: "2", title: "Kennismaking", desc: "We plannen een korte kennismaking. Dan weten we bij welke locaties je past." },
  { number: "3", title: "Kies je diensten", desc: "Via de EXTRA app zie je beschikbare diensten en kies je zelf wanneer je werkt." },
  { number: "4", title: "Werk en word uitbetaald", desc: "Draai je dienst, ontvang dezelfde dag je betaling via Jixbee." },
];

const reviews = [
  {
    quote: "Via EXTRA werk ik bij mooie locaties en bepaal ik zelf mijn planning. Precies wat ik zocht naast mijn studie.",
    name: "Sophie",
    role: "Barmedewerker",
    stars: 5,
  },
  {
    quote: "Dagbetaling via Jixbee is echt een gamechanger. Het geld staat er meteen op, dat voelt gewoon goed.",
    name: "Daan",
    role: "Bediening",
    stars: 5,
  },
  {
    quote: "Ik werk nu al bijna een jaar via EXTRA. De locaties zijn top en het team is goed bereikbaar als er vragen zijn.",
    name: "Lena",
    role: "Events en catering",
    stars: 5,
  },
];

const faqs = [
  {
    q: "Heb ik horecaervaring nodig?",
    a: "Niet altijd. Voor ondersteunende functies zoals runner of afwas is geen ervaring vereist. Voor bediening en bar is basishervaring een pre, maar wij kijken vooral naar je instelling en motivatie.",
  },
  {
    q: "Kan ik zelf mijn diensten kiezen?",
    a: "Ja. Via de EXTRA app zie je welke diensten beschikbaar zijn en kies je zelf wat bij je past. Jij beslist wanneer je werkt.",
  },
  {
    q: "Hoe werkt dagbetaling via Jixbee?",
    a: "Na afloop van je dienst word je uitbetaald via Jixbee. Het bedrag staat doorgaans dezelfde dag nog op je rekening. Je hoeft nergens apart voor te registreren.",
  },
  {
    q: "Op welke locaties kan ik werken?",
    a: "Via EXTRA werk je bij hotels, restaurants en events in Amsterdam, Utrecht en Den Haag. Denk aan Hilton, Marriott, NH Hotels en diverse evenementenlocaties.",
  },
  {
    q: "Hoe snel kan ik beginnen met werken?",
    a: "Na je aanmelding en een korte kennismaking kun je al snel je eerste diensten pakken. In de meeste gevallen ben je binnen een week aan de slag.",
  },
];

const locations = ["Hilton", "Marriott", "NH Hotels", "Amrâth", "Radisson", "InterContinental", "Mövenpick", "Park Plaza"];

export default function HorecaWerk() {
  useEffect(() => {
    document.title = "Horeca Werk via EXTRA | Flexibel Werken in de Horeca Amsterdam";
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0310] text-white font-sans selection:bg-purple-500/30">
      <PublicNav forceDark={false} />

      <main>

        {/* ── 1. HERO ── */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-[#0a0310] to-[#0a0310]" />
          <XPatternBg count={3} opacity={0.1} color="rgba(168,85,247,0.5)" />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <RevealSection>
              <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
                <UtensilsCrossed className="w-4 h-4" /> Horecawerk via EXTRA
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Flexibel horecawerk{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  dat bij jou past
                </span>
              </h1>
              <p className="text-xl text-purple-100/70 mb-10 leading-relaxed max-w-2xl">
                Werk in bediening, bar, banqueting of events bij de mooiste hotels, restaurants en events van Amsterdam. Jij bepaalt wanneer je werkt.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105">
                  Schrijf je in <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/horeca-vacatures-amsterdam" className="group inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300">
                  Bekijk open functies <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── 2. WAT VOOR HORECAWERK ── */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Wat voor horecawerk kun je doen?
                </h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  Via EXTRA werk je in verschillende horecafuncties. Van bediening tot bar en van events tot banqueting. Kies wat bij jou past.
                </p>
              </div>
            </RevealSection>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {jobTypes.map((job, i) => (
                <RevealSection key={job.title} delay={i * 100}>
                  <Link href="/aanmelden" className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col h-full">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={job.img} alt={job.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0310]/80 to-transparent" />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-600 transition-colors">
                          <job.icon className="w-5 h-5 text-purple-400 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white">{job.title}</h3>
                      </div>
                      <p className="text-white/50 text-sm mb-4 flex-grow">{job.desc}</p>
                      <div className="flex items-center text-purple-400 font-bold text-sm gap-1 group-hover:gap-2 transition-all">
                        Schrijf je in <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </RevealSection>
              ))}
            </div>

            {/* Extra functies row */}
            <RevealSection delay={500}>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {["Runner", "Host / Hostess", "Afwas en ondersteunend", "Roomservice"].map((fn) => (
                  <span key={fn} className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-sm text-white/60 font-medium">
                    {fn}
                  </span>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* ── 3. WAAROM HORECA VIA EXTRA ── */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Waarom horeca via EXTRA?
                </h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  EXTRA is meer dan zomaar een uitzendbureau. We werken anders — en dat merk je direct.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {usps.map(({ Icon, title, desc }, i) => (
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

        {/* ── 4. LOCATIES ── */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Werken op locaties waar jij trots op kunt zijn
                </h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  Via EXTRA werk je bij gerenommeerde hotels, restaurants en evenementenlocaties. Geen doorsnee horecabijbaan, maar een plek om echt iets te leren.
                </p>
              </div>
            </RevealSection>
            <RevealSection delay={200}>
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  { Icon: MapPin, title: "Hotels", desc: "Werk bij vijfsterren hotels in Amsterdam, Utrecht en Den Haag. Denk aan internationale ketens en boutique hotels." },
                  { Icon: UtensilsCrossed, title: "Restaurants", desc: "Van bruisende restaurants tot rustige fine dining. Horeca werk Amsterdam is afwisselend en altijd interessant." },
                  { Icon: PartyPopper, title: "Events", desc: "Festivals, gala-diners, personeelsfeesten en beurzen. Werk op unieke locaties bij bijzondere gelegenheden." },
                ].map(({ Icon, title, desc }, i) => (
                  <RevealSection key={i} delay={i * 100}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={400}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5 text-center">Locaties waar je kunt werken</p>
              <div className="flex flex-wrap justify-center gap-3">
                {locations.map((loc) => (
                  <span key={loc} className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-sm font-medium text-white/50">
                    {loc}
                  </span>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* ── 5. HOE HET WERKT ── */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Hoe het werkt
                </h2>
                <p className="text-white/60 max-w-2xl mx-auto">
                  In vier stappen van aanmelding tot je eerste uitbetaling.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map(({ number, title, desc }, i) => (
                  <RevealSection key={i} delay={i * 100}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-500/30 transition-colors">
                        <span className="text-2xl font-black text-purple-400">{number}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── 6. DAGBETALING ── */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-10 lg:p-14 flex flex-col justify-center">
                    <span className="inline-flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20 w-fit">
                      <Banknote className="w-4 h-4" /> Dagbetaling
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Geld op je rekening, dezelfde dag nog
                    </h2>
                    <p className="text-white/60 mb-6 leading-relaxed">
                      Na je dienst word je uitbetaald via Jixbee. Dat betekent: geen wachten op je maandsalaris, maar direct je verdiende geld. Transparant, snel en betrouwbaar.
                    </p>
                    <ul className="space-y-3 mb-8">
                      {["Uitbetaling via Jixbee", "Zelfde dag na je dienst", "Transparant en duidelijk overzicht", "Geen verrassingen op je loonstrook"].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-white/70 text-sm">
                          <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-purple-600/20 hover:scale-105 w-fit">
                      Schrijf je in <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600/20 to-violet-700/20 flex items-center justify-center p-10 lg:p-14 border-l border-white/10">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Banknote className="w-12 h-12 text-purple-400" />
                      </div>
                      <p className="text-5xl font-black text-white mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Dag</p>
                      <p className="text-white/50 text-lg">betaling</p>
                      <p className="text-white/40 text-sm mt-4 max-w-xs mx-auto">
                        Flexibel horecawerk gecombineerd met snelle uitbetaling. Zo hoort het.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        <XDivider />

        {/* ── 7. REVIEWS ── */}
        <section className="py-24 bg-[#0a0310]">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Wat zeggen onze medewerkers?
                </h2>
                <p className="text-white/60 max-w-xl mx-auto">
                  Van studenten tot young professionals — zij werken al via EXTRA in de horeca.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {reviews.map(({ quote, name, role, stars }, i) => (
                  <RevealSection key={i} delay={i * 120}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 flex flex-col h-full">
                      <div className="flex gap-1 mb-6">
                        {Array.from({ length: stars }).map((_, s) => (
                          <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed flex-grow mb-6">"{quote}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-400 font-bold text-sm">{name[0]}</span>
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{name}</p>
                          <p className="text-white/40 text-xs">{role} via EXTRA</p>
                        </div>
                      </div>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── 8. FAQ ── */}
        <section className="py-24 bg-[#0d0415]">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Veelgestelde vragen
                </h2>
                <p className="text-white/60">
                  Alles wat je wilt weten over werken in de horeca via EXTRA.
                </p>
              </div>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map(({ q, a }, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 hover:border-purple-500/30 transition-colors data-[state=open]:border-purple-500/40 data-[state=open]:bg-white/8"
                  >
                    <AccordionTrigger className="text-white font-semibold text-left py-5 hover:no-underline hover:text-purple-300 transition-colors [&>svg]:text-purple-400">
                      {q}
                    </AccordionTrigger>
                    <AccordionContent className="text-white/60 text-sm leading-relaxed pb-5">
                      {a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </RevealSection>
          </div>
        </section>

        {/* ── 9. CTA BANNER ── */}
        <section className="relative py-20 bg-gradient-to-r from-purple-600 to-violet-700 overflow-hidden">
          <XPatternBg count={2} opacity={0.08} color="rgba(255,255,255,1)" />
          <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
            <RevealSection>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Klaar om te beginnen?
              </h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                Aanmelden duurt minder dan 5 minuten. Daarna bepaal jij wanneer je werkt.
              </p>
              <Link href="/aanmelden" className="group inline-flex items-center gap-2.5 bg-white text-purple-700 font-bold text-lg px-10 py-5 rounded-full transition-all hover:scale-105 shadow-2xl">
                Schrijf je in bij EXTRA <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* ── LINK CLOUD ── */}
        <section className="py-12 bg-[#0a0310] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6 text-center">Gerelateerde pagina's</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Horeca vacatures Amsterdam", href: "/horeca-vacatures-amsterdam" },
                { label: "Bediening vacatures", href: "/horeca-vacatures-amsterdam" },
                { label: "Horeca bijbaan Amsterdam", href: "/horeca-werk-amsterdam" },
                { label: "Flexibel horecawerk", href: "/horeca-werk-amsterdam" },
                { label: "Housekeeping werk", href: "/ik-zoek-extra-werk/housekeeping" },
                { label: "Over EXTRA", href: "/horeca-uitzendbureau-amsterdam" },
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
