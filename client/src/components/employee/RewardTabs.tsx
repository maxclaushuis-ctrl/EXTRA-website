import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RewardsList } from '@/components/employee/RewardsList';
import DiscountsList from '@/components/employee/DiscountsList';
import { LeaderboardMobile } from '@/components/employee/LeaderboardMobile';
import { useLanguage } from '@/contexts/LanguageContext';

export function RewardTabs() {
  const [activeTab, setActiveTab] = useState('beloningen');
  const { t } = useLanguage();

  return (
    <Tabs defaultValue="beloningen" className="w-full mt-32" onValueChange={(value) => setActiveTab(value)}>
      <TabsList className="grid w-full grid-cols-3 bg-gray-900 rounded-lg p-1">
        <TabsTrigger 
          value="beloningen" 
          className="text-sm font-normal text-gray-400 data-[state=active]:bg-[#00AAFF] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:rounded-md transition-all"
        >
          Beloningen
        </TabsTrigger>
        <TabsTrigger 
          value="kortingsacties" 
          className="text-sm font-normal text-gray-400 data-[state=active]:bg-[#00AAFF] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:rounded-md transition-all"
        >
          Kortingsacties
        </TabsTrigger>
        <TabsTrigger 
          value="leaderboard" 
          className="text-sm font-normal text-gray-400 data-[state=active]:bg-[#00AAFF] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:rounded-md transition-all"
        >
          Ranglijst
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="beloningen" className="mt-4">
        <RewardsList />
      </TabsContent>
      
      <TabsContent value="kortingsacties" className="mt-4">
        <DiscountsList />
      </TabsContent>
      
      <TabsContent value="leaderboard" className="mt-4">
        <LeaderboardMobile />
      </TabsContent>
    </Tabs>
  );
}