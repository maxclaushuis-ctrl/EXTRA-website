import { useState } from "react";
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import TestimonialCard from "@/components/TestimonialCard";
import { VARIANT_B } from "@/lib/variants";

interface SocialProofSectionProps {
  variant: string;
}

const testimonials = [
  {
    name: "Sanne",
    age: 22,
    rating: 5,
    comment: "Super chill dat ik zelf kan bepalen wanneer ik werk. En het geld staat echt meteen op mijn rekening na m'n shift!"
  },
  {
    name: "Bram",
    age: 19,
    rating: 5,
    comment: "Ik kan nu naast m'n studie flexibel bijverdienen. Werk vaak samen met vrienden, dat maakt het extra leuk!"
  },
  {
    name: "Kim",
    age: 21,
    rating: 5,
    comment: "Het puntensysteem is echt top, heb al concert tickets kunnen scoren door extra shifts te werken!"
  }
];

export default function SocialProofSection({ variant }: SocialProofSectionProps) {
  const isVariantB = variant === VARIANT_B;
  
  return (
    <section className="py-6 px-4 bg-gray-100">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-poppins font-bold text-2xl mb-6 text-center">
            {isVariantB ? "Studenten ❤️ EXTRA" : "Wat zeggen onze EXTRA'ers"}
          </h2>
          
          {isVariantB && (
            <div className="bg-black rounded-lg overflow-hidden mb-6 relative" style={{ paddingTop: "56.25%" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm">Bekijk hoe EXTRA werkt</p>
                </div>
              </div>
            </div>
          )}
          
          <Carousel className="w-full">
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <TestimonialCard testimonial={testimonial} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-4">
              <CarouselPrevious className="relative static mr-2 h-7 w-7" />
              <CarouselNext className="relative static h-7 w-7" />
            </div>
          </Carousel>
          
          {/* Altijd de rating tonen, ongeacht de variant */}
          <div className="flex justify-between mt-6 text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-1/3">
              <p className="font-poppins font-bold text-2xl">4.8/5</p>
              <p className="text-xs">★★★★★</p>
              <p className="text-xs text-gray-600">188 reviews</p>
            </div>
            <div className="w-1/3">
              <p className="font-poppins font-bold text-2xl">1000+</p>
              <p className="text-xs">Studenten</p>
            </div>
            <div className="w-1/3">
              <p className="font-poppins font-bold text-2xl">200+</p>
              <p className="text-xs">Locaties</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
