import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';

interface PointsCelebrationProps {
  points: number;
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

export default function PointsCelebration({ 
  points, 
  isVisible, 
  onAnimationComplete 
}: PointsCelebrationProps) {
  const [particles, setParticles] = useState<Array<{id: number; x: number; y: number; size: number; color: string}>>([]);

  // Genereer confetti-achtige deeltjes wanneer de animatie zichtbaar wordt
  useEffect(() => {
    if (isVisible) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50, // Willekeurige positie links of rechts
        y: Math.random() * 60 - 30,  // Willekeurige positie boven of onder
        size: Math.random() * 8 + 5, // Willekeurige grootte
        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)] // Willekeurige kleur
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="relative">
            {/* Achtergrond overlay */}
            <motion.div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Centrale animatie container */}
            <motion.div
              className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto text-center relative z-10"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                duration: 0.4 
              }}
              onAnimationComplete={() => {
                setTimeout(() => {
                  onAnimationComplete?.();
                }, 1500); // Laat de animatie 1.5 seconden zichtbaar blijven
              }}
            >
              {/* Points icon animation */}
              <motion.div
                className="mx-auto mb-4 rounded-full bg-blue-100 p-4 inline-block"
                initial={{ rotate: 0 }}
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeInOut",
                  times: [0, 0.5, 1]
                }}
              >
                <Award className="h-12 w-12 text-blue-600" />
              </motion.div>
              
              {/* Points text */}
              <motion.h2 
                className="text-2xl font-bold text-gray-900 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {points} Punten Toegekend!
              </motion.h2>
              
              <motion.p
                className="text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Goed bezig! Ga zo door.
              </motion.p>
            </motion.div>
            
            {/* Confetti-achtige deeltjes */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
                animate={{ 
                  x: particle.x, 
                  y: particle.y, 
                  opacity: [0, 1, 0],
                  width: particle.size,
                  height: particle.size,
                  rotate: Math.random() * 360
                }}
                transition={{ 
                  duration: 1.5,
                  ease: "easeOut",
                  times: [0, 0.4, 1]
                }}
                style={{ 
                  backgroundColor: particle.color,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}