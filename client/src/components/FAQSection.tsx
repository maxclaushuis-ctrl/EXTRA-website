import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";

const faqs = [
  {
    question: "Hoe word ik uitbetaald?",
    answer: "Na elke shift wordt je direct uitbetaald via de EXTRA app. Het geld staat binnen enkele minuten op je rekening dankzij ons Payday systeem van ABN-AMRO."
  },
  {
    question: "Kan ik zelf mijn werkdagen kiezen?",
    answer: "Ja! Bij EXTRA bepaal jij zelf wanneer en waar je werkt. Je kiest zelf de shifts die bij jouw agenda passen via de app."
  },
  {
    question: "Hoe spaar ik voor EXTRAatjes?",
    answer: "Voor elke gewerkte shift ontvang je EXTRA punten. Extra punten krijg je als je goed presteert of vrienden aanmeldt. In de app kun je deze punten inwisselen voor toffe rewards!"
  },
  {
    question: "Moet ik horeca ervaring hebben?",
    answer: "Nee, dat is niet nodig! We bieden verschillende soorten werk aan, ook voor beginners. Je krijgt altijd een korte training op locatie."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { trackEvent } = useAnalytics();
  
  const toggleFaq = (index: number) => {
    trackEvent({
      name: "faq_toggle",
      properties: {
        question: faqs[index].question,
        action: openIndex === index ? "close" : "open"
      }
    });
    
    setOpenIndex(openIndex === index ? null : index);
  };
  
  return (
    <section className="py-6 px-4 bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-poppins font-bold text-2xl mb-6 text-center">Veelgestelde vragen</h2>
          
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 py-3">
              <button 
                className="flex justify-between items-center w-full text-left font-medium"
                onClick={() => toggleFaq(index)}
              >
                <span>{faq.question}</span>
                <ChevronDown className={`h-5 w-5 transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              <motion.div 
                className="mt-2 overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-gray-600 pb-2">{faq.answer}</p>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
