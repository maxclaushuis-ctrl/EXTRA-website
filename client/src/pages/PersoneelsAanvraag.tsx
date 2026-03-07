import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, ArrowLeft, Check, Phone, MessageCircle, Shield, Users, Zap } from "lucide-react";
import extraLogoWit from "@assets/EXTRA_LOGO_WIT_1771406959468.webp";
import xPatroon from "@assets/X_patroon_1771260543289.webp";
import logoMarriott from "@assets/Logo_Marriott_1771267205959.webp";
import logoHilton from "@assets/Logo_Hilton_1771267205959.webp";
import logoHartMuseum from "@assets/Logo_H'art-museum_1771267205959.png";
import logoSelectCatering from "@assets/Logo_select-catering_1771267205959.webp";
import logoAppel from "@assets/Logo-Appel_1771267205959.webp";
import logoAmrath from "@assets/Logo_amrath_1771267205959.webp";

function XPatternBg({ count = 3, opacity = 0.12, color = "rgba(139,92,246,1)" }: { count?: number; opacity?: number; color?: string }) {
  const positions = [
    { left: "5%", top: "10%", size: 200, rotate: 15 },
    { left: "80%", top: "20%", size: 160, rotate: -25 },
    { left: "50%", top: "60%", size: 240, rotate: 35 },
    { left: "15%", top: "75%", size: 180, rotate: -10 },
    { left: "90%", top: "80%", size: 140, rotate: 45 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
}

function RevealDiv({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const FUNCTION_OPTIONS = [
  "Bediening",
  "Bar",
  "Keuken / Chef",
  "Housekeeping",
  "Front Office",
];

const formSchema = z.object({
  companyName: z.string().min(1, "Bedrijfsnaam is verplicht"),
  contactName: z.string().min(1, "Naam is verplicht"),
  phone: z.string().min(8, "Voer een geldig telefoonnummer in"),
  email: z.string().email("Voer een geldig e-mailadres in"),
  locationName: z.string().optional(),
  functions: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const inputClass = (hasError: boolean, isDirty?: boolean) =>
  `w-full px-4 py-3.5 rounded-xl border text-base outline-none transition-all focus:ring-2 focus:ring-purple-200 ${
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-400"
      : isDirty && !hasError
      ? "border-green-300 focus:border-green-400"
      : "border-gray-200 focus:border-purple-400"
  }`;

const clients = [
  { src: logoMarriott, alt: "Marriott" },
  { src: logoHilton, alt: "Hilton" },
  { src: logoHartMuseum, alt: "H'art Museum" },
  { src: logoSelectCatering, alt: "Select Catering" },
  { src: logoAppel, alt: "Appel" },
  { src: logoAmrath, alt: "Amrath" },
];

export default function PersoneelsAanvraag() {
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = "Personeelsaanvraag | EXTRA Uitzendbureau";
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => { window.removeEventListener("scroll", handleScroll); document.title = "EXTRA"; };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { companyName: "", contactName: "", phone: "", email: "", locationName: "", functions: [], notes: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("/api/staffing-request", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          locationType: data.locationName ? "Overig" : "Niet opgegeven",
        }),
      });
    },
    onSuccess: () => setSubmitted(true),
  });

  const onSubmit = (data: FormValues) => mutation.mutate(data);

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-purple-100/50" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <a href="/landing" className="flex items-center">
              <img src={extraLogoWit} alt="EXTRA" className={`h-9 sm:h-10 w-auto transition-all ${scrolled ? "brightness-0" : ""}`} />
            </a>
            <div className="flex items-center gap-6">
              <a href="/horeca-personeel-inhuren" className={`hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-colors ${scrolled ? "text-gray-600 hover:text-purple-600" : "text-white/80 hover:text-white"}`}>
                <ArrowLeft className="w-4 h-4" /> Terug
              </a>
              <a href="tel:0851305915" className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${scrolled ? "text-gray-700 hover:text-purple-600" : "text-white hover:text-purple-200"}`}>
                <Phone className="w-4 h-4" /> 085 130 59 15
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" />
        <XPatternBg count={3} opacity={0.1} color="rgba(255,255,255,0.8)" />
        <div className="relative z-10 max-w-2xl mx-auto px-5 text-center">
          <RevealDiv>
            <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-widest mb-5 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-500/30">
              <Zap className="w-3.5 h-3.5" /> Reactie binnen 1 uur
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Personeel nodig?<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Wij bellen je terug.</span>
            </h1>
            <p className="text-lg text-purple-200/80 max-w-lg mx-auto leading-relaxed">
              Laat je gegevens achter — in 30 seconden klaar. We nemen persoonlijk contact op om alles door te spreken.
            </p>
          </RevealDiv>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section className="relative bg-gray-50 py-12 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

            {/* FORM CARD */}
            <RevealDiv>
              {submitted ? (
                <div className="bg-white rounded-3xl shadow-xl shadow-purple-500/10 border border-purple-100 p-10 sm:p-14 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Aanvraag ontvangen!
                  </h2>
                  <p className="text-lg text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                    We nemen zo snel mogelijk contact met je op — tijdens kantooruren meestal binnen 1 uur.
                  </p>
                  <a href="/horeca-personeel-inhuren" className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-8 py-4 rounded-full hover:bg-purple-700 transition-all hover:scale-105">
                    <ArrowLeft className="w-4 h-4" /> Terug naar overzicht
                  </a>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="bg-white rounded-3xl shadow-xl shadow-purple-500/10 border border-purple-100 p-7 sm:p-10">
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Laat je gegevens achter
                  </h2>
                  <p className="text-gray-400 text-sm mb-8">Wij bellen je terug om alles door te spreken.</p>

                  <div className="space-y-5">
                    {/* Bedrijfsnaam */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bedrijfsnaam <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...form.register("companyName")}
                        className={inputClass(!!form.formState.errors.companyName, form.formState.dirtyFields.companyName)}
                        placeholder="Bijv. Hotel Amsterdam"
                        autoComplete="organization"
                      />
                      {form.formState.errors.companyName && (
                        <p className="text-red-500 text-sm mt-1.5">{form.formState.errors.companyName.message}</p>
                      )}
                    </div>

                    {/* Naam */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Naam contactpersoon <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...form.register("contactName")}
                        className={inputClass(!!form.formState.errors.contactName, form.formState.dirtyFields.contactName)}
                        placeholder="Je naam"
                        autoComplete="name"
                      />
                      {form.formState.errors.contactName && (
                        <p className="text-red-500 text-sm mt-1.5">{form.formState.errors.contactName.message}</p>
                      )}
                    </div>

                    {/* Telefoon + Email naast elkaar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Telefoonnummer <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("phone")}
                          type="tel"
                          className={inputClass(!!form.formState.errors.phone, form.formState.dirtyFields.phone)}
                          placeholder="06 12345678"
                          autoComplete="tel"
                        />
                        {form.formState.errors.phone && (
                          <p className="text-red-500 text-sm mt-1.5">{form.formState.errors.phone.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          E-mailadres <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("email")}
                          type="email"
                          className={inputClass(!!form.formState.errors.email, form.formState.dirtyFields.email)}
                          placeholder="naam@bedrijf.nl"
                          autoComplete="email"
                        />
                        {form.formState.errors.email && (
                          <p className="text-red-500 text-sm mt-1.5">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Stad / Locatienaam */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Stad of locatienaam{" "}
                        <span className="text-gray-400 font-normal">(optioneel)</span>
                      </label>
                      <input
                        {...form.register("locationName")}
                        className={inputClass(false, form.formState.dirtyFields.locationName)}
                        placeholder="Bijv. Amsterdam, Hotel V"
                        autoComplete="address-level2"
                      />
                    </div>

                    {/* Functies */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Welk type personeel zoek je?{" "}
                        <span className="text-gray-400 font-normal">(optioneel, meerdere mogelijk)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {FUNCTION_OPTIONS.map((fn) => {
                          const selected = (form.watch("functions") ?? []).includes(fn);
                          return (
                            <button
                              key={fn}
                              type="button"
                              onClick={() => {
                                const current = form.getValues("functions") ?? [];
                                form.setValue(
                                  "functions",
                                  selected ? current.filter((f) => f !== fn) : [...current, fn],
                                  { shouldDirty: true }
                                );
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                                selected
                                  ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                                  : "bg-white border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-600"
                              }`}
                            >
                              {fn}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Toelichting (optioneel) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Toelichting{" "}
                        <span className="text-gray-400 font-normal">(optioneel)</span>
                      </label>
                      <textarea
                        {...form.register("notes")}
                        rows={3}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-base resize-none"
                        placeholder="Bijv. aantal personen, datum, specifieke wensen…"
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-lg px-8 py-4.5 rounded-2xl transition-all hover:scale-[1.02] shadow-xl shadow-purple-600/25 disabled:cursor-not-allowed"
                      style={{ paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
                    >
                      {mutation.isPending ? (
                        <>
                          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Versturen…
                        </>
                      ) : (
                        <>
                          Bel mij terug <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    {/* Microcopy */}
                    <p className="text-center text-sm text-gray-400 mt-4">
                      We nemen meestal binnen 1 uur contact op om je aanvraag door te spreken.
                    </p>

                    {mutation.isError && (
                      <p className="text-center text-red-500 text-sm mt-3">
                        Er ging iets mis. Probeer het opnieuw of bel ons direct.
                      </p>
                    )}
                  </div>

                  {/* Trust */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { Icon: Shield, text: "NEN 4400-1 gecertificeerd" },
                        { Icon: Users, text: "Personeel in loondienst" },
                        { Icon: Zap, text: "Snel inzetbaar bij events, hotels en horeca" },
                      ].map(({ Icon, text }, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm text-gray-500">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </RevealDiv>

            {/* SIDEBAR */}
            <div className="space-y-6">
              {/* Direct contact */}
              <RevealDiv delay={100}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Liever direct contact?</p>
                  <div className="space-y-3">
                    <a href="tel:0851305915" className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">085 130 59 15</p>
                        <p className="text-xs text-gray-400">Ma–vr 9:00–18:00</p>
                      </div>
                    </a>
                    <a href="https://wa.me/31851305915" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">Stuur een WhatsApp</p>
                        <p className="text-xs text-gray-400">Snel antwoord gegarandeerd</p>
                      </div>
                    </a>
                  </div>
                </div>
              </RevealDiv>

              {/* Klanten */}
              <RevealDiv delay={200}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Zij gingen je voor</p>
                  <div className="grid grid-cols-3 gap-3">
                    {clients.map((c, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-center justify-center aspect-[3/2]">
                        <img src={c.src} alt={c.alt} className="max-h-11 max-w-full object-contain opacity-70 hover:opacity-100 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              </RevealDiv>

              {/* Quote */}
              <RevealDiv delay={300}>
                <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl p-6 text-white">
                  <div className="text-3xl font-black text-purple-300 mb-2">"</div>
                  <p className="text-sm text-purple-100 leading-relaxed italic">
                    EXTRA levert altijd mensen die direct inzetbaar zijn. Geen gedoe, gewoon goede service.
                  </p>
                  <p className="text-xs text-purple-300 font-bold mt-3">— Operationeel manager, NH Hotels</p>
                </div>
              </RevealDiv>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
