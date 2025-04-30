import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RewardsList } from '@/components/employee/RewardsList';
import { DiscountsList } from '@/components/employee/DiscountsList';

export function RewardTabs() {
  const [activeTab, setActiveTab] = useState('beloningen');

  return (
    <Tabs defaultValue="beloningen" className="w-full mt-16" onValueChange={(value) => setActiveTab(value)}>
      <TabsList className="grid w-full grid-cols-2 bg-gray-900">
        <TabsTrigger 
          value="beloningen" 
          className="text-base font-medium data-[state=active]:bg-[#00AAFF] data-[state=active]:text-white"
        >
          Beloningen
        </TabsTrigger>
        <TabsTrigger 
          value="kortingsacties" 
          className="text-base font-medium data-[state=active]:bg-[#00AAFF] data-[state=active]:text-white"
        >
          Kortingsacties
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="beloningen" className="mt-4">
        <RewardsList />
      </TabsContent>
      
      <TabsContent value="kortingsacties" className="mt-4">
        <DiscountsList />
      </TabsContent>
    </Tabs>
  );
}