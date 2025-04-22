import { useState } from "react";
import { motion } from "framer-motion";
import { VARIANT_A, VARIANT_B } from "@/lib/variants";

interface HeaderProps {
  variant: string;
  onVariantChange: (variant: string) => void;
}

export default function Header({ variant, onVariantChange }: HeaderProps) {
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  
  // Toggle variant selector (only for development/testing)
  const toggleVariantSelector = () => {
    if (process.env.NODE_ENV === "development") {
      setShowVariantSelector(!showVariantSelector);
    }
  };
  
  return (
    <header className="bg-[hsl(var(--primary))] py-4 px-4 sticky top-0 z-40">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="w-24" onClick={toggleVariantSelector}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <svg className="h-8" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 5H100C111.046 5 120 13.9543 120 25C120 36.0457 111.046 45 100 45H20C8.95431 45 0 36.0457 0 25C0 13.9543 8.95431 5 20 5Z" fill="white"/>
                <path d="M16.936 28.816H29.296V33H11.512V17.064H16.936V28.816ZM47.4273 17.064V33H41.9913V26.44H36.1353V33H30.6993V17.064H36.1353V22.288H41.9913V17.064H47.4273ZM62.7544 33L60.7384 28.816H60.4904H56.6904V33H51.2664V17.064H60.4904C62.2797 17.064 63.8184 17.4053 65.1064 18.088C66.4157 18.7707 67.4237 19.72 68.1304 20.936C68.8371 22.152 69.1904 23.528 69.1904 25.064C69.1904 26.6 68.8371 27.976 68.1304 29.192C67.4237 30.3867 66.4051 31.32 65.0744 31.992L67.7544 33H62.7544ZM63.7544 25.064C63.7544 24.0667 63.4757 23.304 62.9184 22.776C62.3611 22.2267 61.5384 21.952 60.4504 21.952H56.6904V28.176H60.4504C61.5384 28.176 62.3611 27.9013 62.9184 27.352C63.4757 26.8027 63.7544 26.04 63.7544 25.064ZM87.3865 17.064L80.1465 33H73.3865L66.1465 17.064H72.1145L76.7865 28.296L81.4745 17.064H87.3865Z" fill="#7E3FF2"/>
              </svg>
            </motion.div>
          </div>
          <button className="bg-[hsl(var(--accent))] text-black font-poppins text-sm py-2 px-4 rounded-full transition transform hover:scale-105">
            Amsterdam <span>▼</span>
          </button>
        </div>
        
        {showVariantSelector && (
          <div className="mt-2 bg-white rounded-lg p-2 flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-700">Variant:</span>
            <select 
              value={variant}
              onChange={(e) => onVariantChange(e.target.value)}
              className="text-xs border rounded px-1 py-0.5"
            >
              <option value={VARIANT_A}>A (USPs first)</option>
              <option value={VARIANT_B}>B (Social proof first)</option>
            </select>
          </div>
        )}
      </div>
    </header>
  );
}
