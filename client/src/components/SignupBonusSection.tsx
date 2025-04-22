import { motion } from "framer-motion";

const bonuses = [
  "50% korting op je Traimore-abonnement",
  "€15 korting bij Swapfiets",
  "30 gratis rijminuten bij Check"
];

export default function SignupBonusSection() {
  return (
    <section className="py-6 px-4 bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-poppins font-bold text-2xl mb-6 text-center">Aanmeldbonus 🚀</h2>
          
          <div className="bg-gradient-to-br from-[hsl(var(--primary))] to-purple-700 rounded-lg p-5 text-white shadow-lg">
            <h3 className="font-poppins font-bold text-xl mb-3">Meld je nu aan en krijg:</h3>
            <ul className="space-y-3">
              {bonuses.map((bonus, index) => (
                <motion.li 
                  key={index} 
                  className="flex items-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-[hsl(var(--accent))]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{bonus}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
