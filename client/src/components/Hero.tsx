import { motion } from "framer-motion";
import { useAnalytics } from "@/hooks/use-analytics";

export default function Hero() {
  const { trackEvent } = useAnalytics();
  
  const handleCtaClick = () => {
    trackEvent({
      name: "cta_click",
      properties: {
        location: "hero"
      }
    });
    
    // Scroll to form
    document.getElementById("signup-form")?.scrollIntoView({ behavior: "smooth" });
  };
  
  return (
    <section className="bg-[hsl(var(--primary))] bg-pattern text-white py-8 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-poppins font-bold text-3xl mb-3">WERK WANNEER JIJ WILT 🔥</h1>
          <p className="text-lg mb-4">Flexibele horeca bijbanen in Amsterdam, direct uitbetaald na elke shift!</p>
          <motion.button 
            onClick={handleCtaClick}
            className="bg-[hsl(var(--accent))] text-black font-poppins font-bold py-3 px-6 rounded-full text-lg w-full transition hover:shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            MELD JE AAN
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
