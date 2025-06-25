import { useQuery } from '@tanstack/react-query';
import { Challenge } from '@shared/schema';
import { useLanguage } from '@/contexts/LanguageContext';

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

  return (
    <div className="space-y-4 pt-4 pb-16">
      {challenges?.map((challenge) => (
        <div key={challenge.id} className="bg-gray-900 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{challenge.title}</h3>
              <p className="text-gray-400 text-sm">{challenge.description}</p>
            </div>
            <div className="text-right">
              <div className="text-blue-400 font-medium">Actief</div>
            </div>
          </div>
        </div>
      ))}
      
      {(!challenges || challenges.length === 0) && (
        <div className="text-center py-8">
          <p className="text-gray-400">Er zijn op dit moment geen challenges beschikbaar. Probeer het later opnieuw.</p>
        </div>
      )}
    </div>
  );
}