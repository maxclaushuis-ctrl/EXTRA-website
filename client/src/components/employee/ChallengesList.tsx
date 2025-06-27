import { useQuery } from '@tanstack/react-query';
import { Challenge, ChallengeStep } from '@shared/schema';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ChallengesList() {
  const { t } = useLanguage();

  const { data: challenges, isLoading, error } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/challenges', {
          credentials: 'include',
          headers: {
            'x-internal-auth': 'employee_access',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('Challenges API response:', text);
        
        // Check if response is valid JSON
        try {
          const data = JSON.parse(text);
          console.log('Parsed challenges data:', data);
          return data;
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response text that failed to parse:', text);
          throw new Error('Invalid JSON response from challenges API');
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
    }
  });

  // Fetch challenge steps for each challenge
  const { data: challengeSteps } = useQuery<Record<number, ChallengeStep[]>>({
    queryKey: ['/api/challenges/steps'],
    enabled: !!challenges,
    queryFn: async () => {
      if (!challenges) return {};
      
      const stepsMap: Record<number, ChallengeStep[]> = {};
      
      for (const challenge of challenges) {
        try {
          const response = await fetch(`/api/challenges/${challenge.id}/steps`, {
            credentials: 'include',
            headers: {
              'x-internal-auth': 'employee_access'
            }
          });
          
          if (response.ok) {
            const steps = await response.json();
            stepsMap[challenge.id] = steps;
          }
        } catch (error) {
          console.error(`Error fetching steps for challenge ${challenge.id}:`, error);
        }
      }
      
      return stepsMap;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-400">Challenges laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Challenge loading error:', error);
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400">Er zijn op dit moment geen challenges beschikbaar. Probeer het later opnieuw.</p>
      </div>
    );
  }

  const getProgressForChallenge = (challengeId: number) => {
    // Mock user progress - in a real app this would come from the user's progress data
    // For now, let's simulate some progress
    const mockProgress: Record<number, number> = {
      1: 7,   // Diensten draaien: 7/10 for first step
      2: 3,   // Last-minute: 3/5 for first step  
      3: 1,   // Vrienden: 1/3 for first step
      4: 0    // Stories: 0/1 for first step
    };
    
    return mockProgress[challengeId] || 0;
  };

  const getCurrentStepForChallenge = (challengeId: number, userProgress: number) => {
    const steps = challengeSteps?.[challengeId] || [];
    
    // Find the current step based on progress
    for (let i = 0; i < steps.length; i++) {
      if (userProgress < steps[i].targetValue) {
        return steps[i];
      }
    }
    
    // If all steps are completed, return the last step
    return steps[steps.length - 1];
  };

  return (
    <div className="space-y-4 pt-4 pb-16">
      {challenges?.map((challenge) => {
        const userProgress = getProgressForChallenge(challenge.id);
        const currentStep = getCurrentStepForChallenge(challenge.id, userProgress);
        const progressPercentage = currentStep ? Math.min((userProgress / currentStep.targetValue) * 100, 100) : 0;
        
        return (
          <div key={challenge.id} className="bg-gray-900 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {currentStep ? currentStep.title : challenge.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {currentStep ? currentStep.description : challenge.description}
                </p>
              </div>
              <div className="text-right ml-4">
                <div className="text-blue-400 font-medium text-sm">
                  {currentStep ? `${currentStep.pointsReward} punten` : 'Actief'}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {currentStep ? `${userProgress}/${currentStep.targetValue}` : ''}
                </div>
              </div>
            </div>
            
            {currentStep && challenge.type === 'doorlopend' && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Voortgang</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {(!challenges || challenges.length === 0) && (
        <div className="text-center py-8">
          <p className="text-gray-400">Er zijn op dit moment geen challenges beschikbaar. Probeer het later opnieuw.</p>
        </div>
      )}
    </div>
  );
}