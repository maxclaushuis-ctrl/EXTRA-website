import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RewardsList } from '@/components/employee/RewardsList';
import DiscountsList from '@/components/employee/DiscountsList';
import ChallengesList from '@/components/employee/ChallengesList';
import { LeaderboardMobile } from '@/components/employee/LeaderboardMobile';
import { BadgesList } from '@/components/employee/BadgesList';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function RewardTabs() {
  const [activeTab, setActiveTab] = useState('beloningen');
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <Tabs defaultValue="beloningen" className="w-full mt-32" onValueChange={(value) => setActiveTab(value)}>
      <TabsList className="grid w-full grid-cols-5 bg-gray-900 rounded-lg p-1">
        <TabsTrigger 
          value="beloningen" 
          className="text-xs font-normal text-gray-400 data-[state=active]:bg-[#00AAFF] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:rounded-md transition-all"
        >
          Beloningen
        </TabsTrigger>
        <TabsTrigger 
          value="kortingsacties" 
          className="text-xs font-normal text-gray-400 data-[state=active]:bg-[#00AAFF] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:rounded-md transition-all"
        >
          Deals
        </TabsTrigger>
        <TabsTrigger 
          value="challenges" 
          className="text-xs font-normal text-gray-400 data-[state=active]:bg-[#00AAFF] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:rounded-md transition-all"
        >
          Challenges
        </TabsTrigger>
        <TabsTrigger 
          value="leaderboard" 
          className="text-xs font-normal text-gray-400 data-[state=active]:bg-[#00AAFF] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:rounded-md transition-all"
        >
          Ranglijst
        </TabsTrigger>
        <TabsTrigger 
          value="badges" 
          className="text-xs font-normal text-gray-400 data-[state=active]:bg-[#00AAFF] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:rounded-md transition-all"
        >
          Badges
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="beloningen" className="mt-4">
        <RewardsList />
      </TabsContent>
      
      <TabsContent value="kortingsacties" className="mt-4">
        <DiscountsList />
      </TabsContent>
      
      <TabsContent value="challenges" className="mt-4">
        <ChallengesList />
      </TabsContent>
      
      <TabsContent value="leaderboard" className="mt-4">
        <LeaderboardMobile />
      </TabsContent>
      
      <TabsContent value="badges" className="mt-4">
        <BadgesList userPoints={user?.points || 0} />
      </TabsContent>
    </Tabs>
  );
}