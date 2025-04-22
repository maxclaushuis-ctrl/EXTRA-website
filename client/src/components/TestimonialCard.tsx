import { motion } from "framer-motion";

interface TestimonialCardProps {
  testimonial: {
    name: string;
    age: number;
    rating: number;
    comment: string;
  };
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { name, age, rating, comment } = testimonial;
  
  return (
    <motion.div 
      className="bg-white p-4 rounded-lg shadow-sm mx-1"
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white">
          {name.charAt(0)}
        </div>
        <div className="ml-3">
          <p className="font-semibold">{name}, {age}</p>
          <div className="flex">
            <span className="text-yellow-400">{"★".repeat(rating)}</span>
            <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
          </div>
        </div>
      </div>
      <p className="text-sm">{`"${comment}"`}</p>
    </motion.div>
  );
}
