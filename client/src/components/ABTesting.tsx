import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { VARIANT_A, VARIANT_B, getStoredVariant, storeVariant } from "@/lib/variants";
import { useAnalytics } from "@/hooks/use-analytics";

interface ABTestingProps {
  variant: string;
  onVariantChange: (variant: string) => void;
  showControls?: boolean;
}

export default function ABTesting({ variant, onVariantChange, showControls = false }: ABTestingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { trackEvent } = useAnalytics();

  // Only show the testing panel in development mode by default
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setIsOpen(true);
    }
  }, []);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const handleVariantChange = (newVariant: string) => {
    onVariantChange(newVariant);
    storeVariant(newVariant);
    
    trackEvent({
      name: "variant_switch",
      properties: {
        from: variant,
        to: newVariant,
        manual: true
      }
    });
  };

  if (!showControls && process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <motion.div
      className="fixed top-20 right-0 z-50 flex flex-col items-end"
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "calc(100% - 32px)" }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="outline"
        size="sm"
        className="absolute -left-8 top-2 rotate-90 bg-white shadow-md border-gray-200 h-8 w-8 rounded-t-lg rounded-b-none p-0"
        onClick={togglePanel}
      >
        {isOpen ? "×" : "A/B"}
      </Button>

      <div className="bg-white p-4 shadow-lg rounded-l-lg border border-gray-200 min-w-[250px]">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-sm mb-2">A/B Test Variant</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="variant"
                  value={VARIANT_A}
                  checked={variant === VARIANT_A}
                  onChange={() => handleVariantChange(VARIANT_A)}
                  className="text-[hsl(var(--primary))]"
                />
                <span className="text-sm">
                  A: USPs first, then social proof
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="variant"
                  value={VARIANT_B}
                  checked={variant === VARIANT_B}
                  onChange={() => handleVariantChange(VARIANT_B)}
                  className="text-[hsl(var(--primary))]"
                />
                <span className="text-sm">
                  B: Social proof first, then USPs
                </span>
              </label>
            </div>
          </div>

          <div className="text-xs text-gray-500 border-t pt-2">
            <p>Current variant: <span className="font-semibold">{variant === VARIANT_A ? "A" : "B"}</span></p>
            <p className="mt-1">This testing panel is only visible in development mode.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
