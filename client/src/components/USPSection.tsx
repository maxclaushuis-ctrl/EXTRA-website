import { motion } from "framer-motion";

const usps = [
  {
    icon: "💰",
    title: "DIRECT UITBETAALD",
    description: "Wacht niet meer op je geld en word direct na je shift uitbetaald"
  },
  {
    icon: "👯",
    title: "WERK MET VRIENDEN",
    description: "Nodig je vrienden uit in de EXTRA app om samen te werken"
  },
  {
    icon: "🗓️",
    title: "WANNEER JE WILT",
    description: "Bepaal zelf waar en wanneer je werkt"
  },
  {
    icon: "🎁",
    title: "SPAAR EXTRAATJES",
    description: "Spaar voor toffe rewards zoals AirPods, concert tickets en meer!"
  }
];

export default function USPSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <section className="py-6 px-4 bg-white">
      <div className="container mx-auto">
        <h2 className="font-poppins font-bold text-2xl mb-6 text-center">Waarom werken bij EXTRA?</h2>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {usps.map((usp, index) => (
            <motion.div 
              key={index}
              className="bg-[hsl(var(--extra-blue))] rounded-lg p-4 mb-4"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start">
                <div className="bg-[hsl(var(--accent))] p-2 rounded-lg mr-3">
                  <span className="text-2xl">{usp.icon}</span>
                </div>
                <div>
                  <h3 className="font-poppins font-semibold text-lg">{usp.title}</h3>
                  <p>{usp.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
