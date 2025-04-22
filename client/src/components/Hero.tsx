import { motion } from "framer-motion";
import { useAnalytics } from "@/hooks/use-analytics";
import heroImage from "@/assets/hero_image.png";

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
    <section className="bg-[hsl(var(--primary))] bg-pattern text-white py-8 px-4 overflow-hidden">
      <div className="container mx-auto">
        <div className="relative">
          {/* Hero content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <h1 className="font-poppins font-bold text-3xl mb-3">
              EEN (BIJ)BAAN <br /> IN DE HORECA
            </h1>
            <p className="text-lg mb-4">Flexibele horeca bijbanen in Amsterdam, direct uitbetaald na elke shift!</p>
            
            <div className="relative mb-6 mt-8 rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm p-1">
              <div className="flex items-center bg-white text-black rounded px-2 py-1 absolute top-2 right-2 z-10">
                <span className="text-yellow-400 mr-1">★★★★★</span>
                <span className="text-xs font-medium">4.8/5</span>
              </div>
              
              <img 
                src={heroImage} 
                alt="EXTRA medewerkers in de horeca" 
                className="w-full h-auto rounded"
              />
            </div>
            
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
      </div>
    </section>
  );
}
