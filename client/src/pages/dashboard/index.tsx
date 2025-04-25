import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { MobileHeader } from '@/components/employee/MobileHeader';
import { PointsHeader } from '@/components/employee/PointsHeader';
import { RewardsList } from '@/components/employee/RewardsList';

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect naar login als niet ingelogd
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Toon laadindicator tijdens het controleren van de authenticatie
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-[#00AAFF]">Laden...</div>
      </div>
    );
  }

  // Als authenticated false is, is de redirect al in gang gezet
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="employee-dashboard flex flex-col min-h-screen">
      <MobileHeader title="EXTRA@JE" showBackButton={false} />
      
      <div className="flex-1">
        <PointsHeader />
        
        <main>
          <RewardsList />
        </main>
      </div>
    </div>
  );
}