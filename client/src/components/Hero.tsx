import { motion } from "framer-motion";
import { useAnalytics } from "@/hooks/use-analytics";
import heroGraphic from "@/assets/hero_graphic.svg";

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
          <div className="flex items-center justify-center mb-3">
            <div className="bg-white text-black rounded-full px-3 py-1 text-sm font-medium flex items-center">
              <span className="text-yellow-400 mr-1">★★★★★</span>
              <span>4.8/5</span>
              <span className="text-gray-500 text-xs ml-1">(215 reviews)</span>
            </div>
          </div>
          
          <h1 className="font-poppins font-bold text-3xl mb-3">WERK WANNEER JIJ WILT 🔥</h1>
          <p className="text-lg mb-4">Flexibele horeca bijbanen in Amsterdam, direct uitbetaald na elke shift!</p>
          
          <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
            <img 
              src={heroGraphic} 
              alt="Flexibel werken in de horeca met EXTRA" 
              className="w-full h-auto"
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
    </section>
  );
}
