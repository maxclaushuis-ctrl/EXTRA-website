import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield, Star, ChevronDown, ChevronUp,
  ArrowRight, ArrowLeft, Check, Menu, X, Phone,
  MessageCircle, Users, TrendingUp, Gift,
  Building2, UtensilsCrossed, PartyPopper, Wine,
  Loader2
} from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.png";
import xPatroon from "@assets/X_patroon_1771260543289.png";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.png";
import logoHilton from "@assets/Logo_Hilton_1771267205959.png";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.png";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.png";
import logoAppel from "@assets/Logo-Appel_1771267205959.png";
import logoAmrath from "@assets/Logo_amrath_1771267205959.png";

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
    <section ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
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
  ];
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {positions.slice(0, count).map((pos, i) => (
        <div key={i} className="absolute" style={{
          left: pos.left, top: pos.top, width: pos.size, height: pos.size,
          transform: `rotate(${pos.rotate}deg)`, opacity,
          WebkitMaskImage: `url(${xPatroon})`, maskImage: `url(${xPatroon})`,
          WebkitMaskSize: "contain", maskSize: "contain",
          WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
          WebkitMaskPosition: "center", maskPosition: "center",
          backgroundColor: color,
        }} />
      ))}
    </div>
  );
}

function GrainOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat", backgroundSize: "256px 256px",
    }} />
  );
}

const formSchema = z.object({
  companyName: z.string().min(1, "Bedrijfsnaam is verplicht"),
  contactName: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Voer een geldig e-mailadres in"),
  phone: z.string().min(8, "Voer een geldig telefoonnummer in"),
  locationType: z.string().min(1, "Selecteer een type locatie"),
  locationTypeOther: z.string().optional(),
  functions: z.array(z.string()).min(1, "Selecteer minimaal één functie"),
  staffCount: z.number().min(1, "Voer het aantal medewerkers in").optional().nullable(),
  datesPeriod: z.string().optional(),
  locationAddress: z.string().optional(),
  locationName: z.string().optional(),
  deploymentType: z.string().optional(),
  urgency: z.string().optional(),
  notes: z.string().optional(),
  wantsCallback: z.boolean().optional(),
  wantsFavoritePool: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const FUNCTION_OPTIONS = [
  "Bediening", "Bar", "Runner", "Housekeeping",
  "Keuken / chef", "Afwas", "Host / Hostess",
  "Banqueting", "Op-/afbouwteam"
];

export default function PersoneelsAanvraag() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "", contactName: "", email: "", phone: "",
      locationType: "", locationTypeOther: "", functions: [],
      staffCount: null, datesPeriod: "", locationAddress: "", locationName: "",
      deploymentType: "", urgency: "", notes: "",
      wantsCallback: false, wantsFavoritePool: false,
    },
  });

  const locationType = form.watch("locationType");
  const selectedFunctions = form.watch("functions");

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("/api/staffing-request", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          staffCount: data.staffCount || null,
        }),
      });
      if (!res.ok) {
        throw new Error("Submission failed");
      }
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
  });

  useEffect(() => {
    document.title = "Personeelsaanvraag | EXTRA Uitzendbureau";
    const meta = document.querySelector('meta[name="description"]');
    const content = "Doe direct een personeelsaanvraag bij EXTRA. Binnen 1 minuut aangevraagd, snel gereageerd. Horecapersoneel in loondienst.";
    if (meta) meta.setAttribute("content", content);
    else { const m = document.createElement("meta"); m.name = "description"; m.content = content; document.head.appendChild(m); }
    return () => { document.title = "EXTRA"; };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  }, []);

  const toggleFunction = (fn: string) => {
    const current = form.getValues("functions");
    if (current.includes(fn)) {
      form.setValue("functions", current.filter(f => f !== fn), { shouldValidate: true });
    } else {
      form.setValue("functions", [...current, fn], { shouldValidate: true });
    }
  };

  const onSubmit = (data: FormValues) => mutation.mutate(data);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden relative bg-gray-50" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <GrainOverlay />

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-purple-500/5 border-b border-purple-100/50" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="/landing" className="flex items-center">
              <img src={extraLogoWit} alt="EXTRA" className={`h-7 sm:h-8 w-auto transition-all ${scrolled ? "brightness-0" : ""}`} />
            </a>
            <div className="hidden lg:flex items-center gap-8">
              <a href="/personeel-gezocht" className={`text-sm font-semibold transition-colors relative group ${scrolled ? "text-gray-600 hover:text-purple-600" : "text-white/80 hover:text-white"}`}>
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Terug naar overzicht
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300" />
              </a>
              <a href="tel:0851305915" className={`text-sm font-semibold transition-colors ${scrolled ? "text-gray-600 hover:text-purple-600" : "text-white/80 hover:text-white"}`}>
                <Phone className="w-4 h-4 inline mr-1" />
                085 130 59 15
              </a>
            </div>
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className={scrolled ? "text-gray-900" : "text-white"} /> : <Menu className={scrolled ? "text-gray-900" : "text-white"} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-6 py-4 space-y-3">
              <a href="/personeel-gezocht" className="block text-gray-700 font-semibold py-2 hover:text-purple-600"><ArrowLeft className="w-4 h-4 inline mr-1" />Terug naar overzicht</a>
              <a href="tel:0851305915" className="block text-gray-700 font-semibold py-2 hover:text-purple-600"><Phone className="w-4 h-4 inline mr-1" />085 130 59 15</a>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════ */}
      {/* 1. COMPACT HERO                             */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative pt-28 sm:pt-32 pb-12 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={3} opacity={0.1} color="rgba(255,255,255,0.8)" />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Doe direct een personeelsaanvraag
          </h1>
          <p className="text-base sm:text-lg text-purple-200 mb-4 max-w-xl mx-auto">
            Binnen 1 minuut aangevraagd. We reageren zo snel mogelijk en denken direct met je mee.
          </p>
          <p className="text-sm text-purple-300/80">
            Liever direct contact?{" "}
            <a href="tel:0851305915" className="text-white font-semibold hover:text-purple-200 underline underline-offset-2">Bel 085 130 59 15</a>
            {" "}of{" "}
            <a href="https://wa.me/31851305915" target="_blank" rel="noopener noreferrer" className="text-white font-semibold hover:text-purple-200 underline underline-offset-2">stuur een WhatsApp</a>.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 2. FORMULIER                                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative py-8 sm:py-12 -mt-6">
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 relative z-10">
          {submitted ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/10 border border-purple-100 p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Aanvraag ontvangen!
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Bedankt voor je aanvraag. We nemen zo snel mogelijk contact met je op — tijdens kantooruren meestal binnen 1 uur.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/personeel-gezocht" className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white font-bold px-6 py-3 rounded-full hover:bg-purple-700 transition-all">
                  <ArrowLeft className="w-4 h-4" /> Terug naar overzicht
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/10 border border-purple-100 p-6 sm:p-10">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Vertel ons wat je nodig hebt
              </h2>

              {/* A) Contactgegevens */}
              <div className="space-y-4 mb-8">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Contactgegevens</p>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bedrijfsnaam <span className="text-red-500">*</span></label>
                  <input {...form.register("companyName")} className={`w-full px-4 py-3 rounded-xl border ${form.formState.errors.companyName ? "border-red-300 bg-red-50" : form.formState.dirtyFields.companyName && !form.formState.errors.companyName ? "border-green-300 bg-green-50/30" : "border-gray-200"} focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm`} placeholder="Bijv. Hotel Amsterdam" />
                  {form.formState.errors.companyName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.companyName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Voor- en achternaam <span className="text-red-500">*</span></label>
                  <input {...form.register("contactName")} className={`w-full px-4 py-3 rounded-xl border ${form.formState.errors.contactName ? "border-red-300 bg-red-50" : form.formState.dirtyFields.contactName && !form.formState.errors.contactName ? "border-green-300 bg-green-50/30" : "border-gray-200"} focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm`} placeholder="Je volledige naam" />
                  {form.formState.errors.contactName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.contactName.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mailadres <span className="text-red-500">*</span></label>
                    <input {...form.register("email")} type="email" className={`w-full px-4 py-3 rounded-xl border ${form.formState.errors.email ? "border-red-300 bg-red-50" : form.formState.dirtyFields.email && !form.formState.errors.email ? "border-green-300 bg-green-50/30" : "border-gray-200"} focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm`} placeholder="je@bedrijf.nl" />
                    {form.formState.errors.email && <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefoonnummer <span className="text-red-500">*</span></label>
                    <input {...form.register("phone")} type="tel" className={`w-full px-4 py-3 rounded-xl border ${form.formState.errors.phone ? "border-red-300 bg-red-50" : form.formState.dirtyFields.phone && !form.formState.errors.phone ? "border-green-300 bg-green-50/30" : "border-gray-200"} focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm`} placeholder="06 12345678" />
                    {form.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>}
                  </div>
                </div>
              </div>

              {/* B) Wat zoek je? */}
              <div className="space-y-4 mb-8">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Wat zoek je?</p>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type locatie <span className="text-red-500">*</span></label>
                  <select {...form.register("locationType")} className={`w-full px-4 py-3 rounded-xl border ${form.formState.errors.locationType ? "border-red-300 bg-red-50" : "border-gray-200"} focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm bg-white`}>
                    <option value="">Selecteer type...</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Eventlocatie">Eventlocatie</option>
                    <option value="Cateraar">Cateraar</option>
                    <option value="Anders">Anders, namelijk…</option>
                  </select>
                  {form.formState.errors.locationType && <p className="text-red-500 text-xs mt-1">{form.formState.errors.locationType.message}</p>}
                </div>
                {locationType === "Anders" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Omschrijf je locatie</label>
                    <input {...form.register("locationTypeOther")} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm" placeholder="Bijv. bedrijfskantine, museum" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Functies <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {FUNCTION_OPTIONS.map(fn => (
                      <button key={fn} type="button" onClick={() => toggleFunction(fn)}
                        className={`px-3.5 py-2 rounded-full text-sm font-semibold border transition-all ${selectedFunctions.includes(fn) ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600"}`}
                      >
                        {selectedFunctions.includes(fn) && <Check className="w-3.5 h-3.5 inline mr-1" />}
                        {fn}
                      </button>
                    ))}
                  </div>
                  {form.formState.errors.functions && <p className="text-red-500 text-xs mt-1">{form.formState.errors.functions.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Aantal medewerkers</label>
                    <input type="number" min="1" onChange={e => form.setValue("staffCount", e.target.value ? parseInt(e.target.value) : null)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm" placeholder="Bijv. 5" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Datum / periode</label>
                    <input {...form.register("datesPeriod")} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm" placeholder="Bijv. 24 en 25 juni, avond" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Locatie (adres/plaats)</label>
                    <input {...form.register("locationAddress")} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm" placeholder="Bijv. Amsterdam" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Locatienaam</label>
                    <input {...form.register("locationName")} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm" placeholder="Bijv. Marriott Arena" />
                  </div>
                </div>
              </div>

              {/* C) Type inzet */}
              <div className="space-y-4 mb-8">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Type inzet</p>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Flexibele of vaste inzet</label>
                  <select {...form.register("deploymentType")} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm bg-white">
                    <option value="">Selecteer...</option>
                    <option value="eenmalig">Eenmalige aanvraag</option>
                    <option value="terugkerend">Terugkerend / vaker</option>
                    <option value="vaste_poule">We willen een vaste poule opbouwen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Urgentie</label>
                  <div className="space-y-2">
                    {[
                      { value: "vandaag_morgen", label: "Vandaag / morgen" },
                      { value: "deze_week", label: "Deze week" },
                      { value: "geen_haast", label: "Binnenkort, geen haast" },
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-purple-300 cursor-pointer transition-all text-sm">
                        <input type="radio" value={opt.value} {...form.register("urgency")} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                        <span className="font-medium text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* D) Toelichting */}
              <div className="space-y-4 mb-8">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Extra toelichting</p>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Toelichting (optioneel)</label>
                  <textarea {...form.register("notes")} rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm resize-none" placeholder="Vertel kort wat voor soort event/locatie het is en wat je belangrijk vindt in het team." />
                </div>
              </div>

              {/* E) Opties */}
              <div className="space-y-3 mb-8">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-purple-300 cursor-pointer transition-all">
                  <input type="checkbox" {...form.register("wantsCallback")} className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500" />
                  <span className="text-sm text-gray-700 font-medium">Bel mij even terug om de aanvraag door te spreken.</span>
                </label>
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-purple-300 cursor-pointer transition-all">
                  <input type="checkbox" {...form.register("wantsFavoritePool")} className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500" />
                  <span className="text-sm text-gray-700 font-medium">Ik wil graag dat EXTRA alvast een vaste favorietenpoule voor ons gaat opbouwen.</span>
                </label>
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-4 px-8 rounded-xl text-base sm:text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Bezig met versturen...
                  </>
                ) : (
                  <>
                    Aanvraag versturen
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              {mutation.isError && (
                <p className="text-red-500 text-sm mt-3 text-center">Er is iets misgegaan. Probeer het opnieuw of neem contact op.</p>
              )}
              <p className="text-xs text-gray-400 text-center mt-4">
                We reageren zo snel mogelijk. Tijdens kantooruren meestal binnen 1 uur.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 3. TRUST BAR                                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <RevealSection>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Shield, text: "100% in loondienst — NEN-4400-1 gecertificeerd" },
                { icon: Users, text: "We kennen al ons personeel persoonlijk" },
                { icon: TrendingUp, text: "Favorietenpoules, skillscores en EXTRAATje voor betere inzet" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-purple-700" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 leading-snug">{item.text}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 4. LOGO'S                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-8 sm:py-10 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <RevealSection>
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Vertrouwd door o.a.</p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {[
                { src: logoMarriott, alt: "Marriott" },
                { src: logoHilton, alt: "Hilton" },
                { src: logoHartMuseum, alt: "Het Scheepvaartmuseum" },
                { src: logoSelectCatering, alt: "Select Catering" },
                { src: logoAppel, alt: "Appèl" },
                { src: logoAmrath, alt: "Amrâth Hotels" },
              ].map((logo, i) => (
                <img key={i} src={logo.src} alt={logo.alt} className="h-10 sm:h-14 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity" />
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 5. MINI TESTIMONIALS                        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <RevealSection>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 text-center mb-6 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Waarom opdrachtgevers EXTRA kiezen
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { quote: "EXTRA levert keer op keer betrouwbaar en goed getraind personeel.", name: "Mark de Vries", role: "F&B Manager, Grand Hotel" },
                { quote: "Binnen 24 uur hadden we personeel voor ons evenement. Professioneel en representatief.", name: "Lisa Jansen", role: "Event Manager, Venues Amsterdam" },
                { quote: "De kwaliteit is constant hoog. Eindelijk een bureau dat hospitality begrijpt.", name: "Sophie van Dijk", role: "Restaurant Manager" },
              ].map((t, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-600 italic mb-3 leading-relaxed">"{t.quote}"</p>
                  <p className="text-xs font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 6. FAQ                                      */}
      {/* ═══════════════════════════════════════════ */}
      <section id="faq" className="py-12 sm:py-16 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-5 sm:px-6">
          <RevealSection>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 text-center mb-6 sm:mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Veelgestelde vragen
            </h2>
          </RevealSection>
          <div className="space-y-3">
            {[
              { q: "Hoe snel kunnen jullie reageren op mijn aanvraag?", a: "We reageren tijdens kantooruren meestal binnen 1 uur. Bij urgente aanvragen schakelen we nog sneller." },
              { q: "Leveren jullie alleen personeel in loondienst?", a: "Ja, al onze medewerkers werken in loondienst via EXTRA. We zijn NEN-4400-1 gecertificeerd en volledig compliant met de arbeidswetgeving." },
              { q: "Kunnen we vaste medewerkers krijgen?", a: "Absoluut. We bouwen per locatie een favorietenpoule op. Medewerkers die goed presteren, worden prioritair ingepland." },
              { q: "In welke regio's zijn jullie actief?", a: "We zijn actief in de Randstad en breiden uit naar andere regio's. Neem contact op voor beschikbaarheid in jouw regio." },
            ].map((faq, i) => (
              <RevealSection key={i} delay={i * 60}>
                <div className="bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-all overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left">
                    <span className="text-sm sm:text-base font-bold text-gray-900 pr-4">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-4 h-4 text-purple-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-32 pb-4 sm:pb-5" : "max-h-0"}`}>
                    <p className="px-4 sm:px-5 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-14">
            <div className="col-span-2 md:col-span-1">
              <a href="/landing" className="flex items-center mb-4 sm:mb-5">
                <img src={extraLogoWit} alt="EXTRA" className="h-6 sm:h-7 w-auto" />
              </a>
              <p className="text-sm sm:text-base leading-relaxed">
                Uitzendbureau voor horeca, hotels en evenementen. Met ons unieke EXTRAATje beloningssysteem.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Werkgevers</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li><a href="/personeel-gezocht" className="hover:text-purple-400 transition-colors">Waarom EXTRA</a></li>
                <li><a href="/personeel-gezocht" className="hover:text-purple-400 transition-colors">Personeel aanvragen</a></li>
                <li><a href="/landing" className="hover:text-purple-400 transition-colors">Homepage</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Werkzoekenden</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li><a href="/sollicitatieformulier" className="hover:text-purple-400 transition-colors">Solliciteren</a></li>
                <li><a href="/landing" className="hover:text-purple-400 transition-colors">Over EXTRA</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-4 sm:mb-5">Contact</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base">
                <li><a href="tel:0851305915" className="hover:text-purple-400 transition-colors">085 130 59 15</a></li>
                <li>info@doehetextra.nl</li>
                <li>Amsterdam, Nederland</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; 2026 EXTRA Uitzendbureau. Alle rechten voorbehouden.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full border border-purple-800/30">NEN 4400-1</span>
            </div>
          </div>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Hoe snel kunnen jullie reageren op mijn aanvraag?", "acceptedAnswer": { "@type": "Answer", "text": "We reageren tijdens kantooruren meestal binnen 1 uur." } },
          { "@type": "Question", "name": "Leveren jullie alleen personeel in loondienst?", "acceptedAnswer": { "@type": "Answer", "text": "Ja, al onze medewerkers werken in loondienst. NEN-4400-1 gecertificeerd." } },
          { "@type": "Question", "name": "Kunnen we vaste medewerkers krijgen?", "acceptedAnswer": { "@type": "Answer", "text": "Ja, we bouwen per locatie een favorietenpoule op." } },
          { "@type": "Question", "name": "In welke regio's zijn jullie actief?", "acceptedAnswer": { "@type": "Answer", "text": "We zijn actief in de Randstad en breiden uit naar andere regio's." } },
        ]
      }) }} />
    </div>
  );
}
