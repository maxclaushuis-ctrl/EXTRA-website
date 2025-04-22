import { useState } from "react";
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { useAnalytics } from "@/hooks/use-analytics";
import rewardsImage from "@/assets/rewards_image.png";

const rewards = [
  {
    id: "airpods",
    title: "Apple AirPods Pro",
    imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=400&h=250&q=80",
    points: 5000
  },
  {
    id: "museum",
    title: "Museumjaarkaart",
    imageUrl: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=400&h=250&q=80",
    points: 3000
  },
  {
    id: "concert",
    title: "Concert Tickets",
    imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=400&h=250&q=80",
    points: 2000
  }
];

export default function RewardsSection() {
  const { trackEvent } = useAnalytics();
  
  const handleRewardClick = (rewardId: string, points: number) => {
    trackEvent({
      name: "reward_click",
      properties: {
        reward_id: rewardId,
        points: points
      }
    });
  };
  
  return (
    <section className="py-6 px-4 bg-[hsl(var(--primary))] text-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-poppins font-bold text-2xl mb-2 text-center">SPAAR VOOR EXTRAATJES 🎁</h2>
          <p className="text-center mb-6">Punten sparen, rewards claimen</p>
          
          {/* Rewards showcase afbeelding */}
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img 
              src={rewardsImage} 
              alt="EXTRA rewards - AirPods Pro en andere beloningen" 
              className="w-full h-auto"
            />
          </div>
          
          <Carousel className="w-full">
            <CarouselContent>
              {rewards.map((reward) => (
                <CarouselItem key={reward.id} className="md:basis-1/2 lg:basis-1/3 pl-2 pr-2">
                  <motion.div 
                    className="bg-white rounded-lg overflow-hidden text-black"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-full h-40 bg-gray-200 relative">
                      <img 
                        src={reward.imageUrl} 
                        alt={reward.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-poppins font-semibold">{reward.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="bg-yellow-400 text-black font-bold py-1 px-2 rounded text-xs">
                          {reward.points} punten
                        </span>
                        <button 
                          className="bg-[hsl(var(--primary))] text-white py-1 px-3 rounded text-xs"
                          onClick={() => handleRewardClick(reward.id, reward.points)}
                        >
                          Spaar nu
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-4">
              <CarouselPrevious className="relative static mr-2 h-7 w-7" />
              <CarouselNext className="relative static h-7 w-7" />
            </div>
          </Carousel>
        </motion.div>
      </div>
    </section>
  );
}
