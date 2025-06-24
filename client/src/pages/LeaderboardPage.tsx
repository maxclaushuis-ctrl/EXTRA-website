import { useAuth } from '@/contexts/AuthContext';
import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Leaderboard />
    </div>
  );
}