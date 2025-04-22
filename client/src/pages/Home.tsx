import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import USPSection from "@/components/USPSection";
import SocialProofSection from "@/components/SocialProofSection";
import RewardsSection from "@/components/RewardsSection";
import SignupBonusSection from "@/components/SignupBonusSection";
import SignupForm from "@/components/SignupForm";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { useAnalytics } from "@/hooks/use-analytics";
import { VARIANT_A, VARIANT_B, getStoredVariant, storeVariant } from "@/lib/variants";

export default function Home() {
  // A/B testing variant state
  const [variant, setVariant] = useState<string>(() => {
    // If there's a variant in localStorage, use that
    const storedVariant = getStoredVariant();
    if (storedVariant) return storedVariant;
    
    // Otherwise, randomly assign variant A or B (50/50 split)
    return Math.random() < 0.5 ? VARIANT_A : VARIANT_B;
  });
  
  const { trackPageView, trackEvent } = useAnalytics();
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  
  // Track page view with variant info
  useEffect(() => {
    trackPageView({
      path: "/",
      variant
    });
    
    // Store the variant in localStorage
    storeVariant(variant);
  }, [variant, trackPageView]);
  
  // Handle variant change (for testing)
  const handleVariantChange = (newVariant: string) => {
    setVariant(newVariant);
    trackEvent({
      name: "switch_variant",
      properties: {
        from: variant,
        to: newVariant
      }
    });
  };
  
  // Handle form submission
  const handleFormSubmit = (data: any) => {
    trackEvent({
      name: "form_submit",
      properties: {
        variant,
        ...data
      }
    });
    setIsFormSubmitted(true);
  };
  
  // Handle CTA click
  const handleCtaClick = () => {
    trackEvent({
      name: "cta_click",
      properties: {
        variant,
        location: "sticky"
      }
    });
    
    // Scroll to form
    document.getElementById("signup-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant={variant} onVariantChange={handleVariantChange} />
      
      <Hero />
      
      {variant === VARIANT_A ? (
        <>
          <USPSection />
          <SocialProofSection variant={variant} />
        </>
      ) : (
        <>
          <SocialProofSection variant={variant} />
          <USPSection />
        </>
      )}
      
      <RewardsSection />
      <SignupBonusSection />
      
      <section id="signup-form" className="py-6 px-4 bg-gray-100">
        <div className="container mx-auto">
          <h2 className="text-2xl mb-2 text-center">Meld je aan bij EXTRA</h2>
          <p className="text-center mb-6">En start direct met flexibel werken in Amsterdam</p>
          
          <SignupForm onSubmit={handleFormSubmit} isSubmitted={isFormSubmitted} />
        </div>
      </section>
      
      <FAQSection />
      
      {!isFormSubmitted && (
        <motion.div 
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <button 
            onClick={handleCtaClick}
            className="bg-[hsl(var(--primary))] text-white font-poppins font-bold py-3 px-6 rounded-full text-lg w-full transition transform hover:scale-105"
          >
            MELD JE AAN
          </button>
        </motion.div>
      )}
      
      <Footer />
    </div>
  );
}
