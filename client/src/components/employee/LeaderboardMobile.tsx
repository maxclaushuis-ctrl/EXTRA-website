import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Crown, Star, Zap } from 'lucide-react';
import { User } from '@shared/schema';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardUser extends User {
  rank: number;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Trophy className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <Star className="h-4 w-4 text-gray-400" />;
  }
}

function getRankBadgeColor(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    case 2:
      return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    case 3:
      return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
    default:
      return 'bg-gray-800 text-gray-300';
  }
}

function getRankBackgroundColor(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
    case 2:
      return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    case 3:
      return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
    default:
      return 'bg-gray-800 border-gray-700';
  }
}

function getInitials(firstName: string, lastName: string): string {
  return (firstName[0] + lastName[0]).toUpperCase();
}

export function LeaderboardMobile() {
  const { user } = useAuth();
  const [isRealtime, setIsRealtime] = useState(false);

  const { data: leaderboard, isLoading, refetch } = useQuery({
    queryKey: ['/api/leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) {
        throw new Error('Kon leaderboard niet ophalen');
      }
      return response.json() as Promise<LeaderboardUser[]>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for realtime updates
  });

  const { data: previousWinner } = useQuery({
    queryKey: ['/api/leaderboard/previous-winner'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/previous-winner');
      if (!response.ok) {
        return null;
      }
      return response.json() as Promise<User | null>;
    },
  });

  // WebSocket setup for realtime updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        setIsRealtime(true);
        
        // Authenticate with current user data
        if (user) {
          socket.send(JSON.stringify({
            type: 'auth',
            userId: user.id,
            userRole: user.role
          }));
        }
      };
      
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        // Refresh leaderboard when points are updated
        if (message.type === 'points_update' || message.type === 'leaderboard_update') {
          refetch();
        }
      };
      
      socket.onclose = () => {
        setIsRealtime(false);
      };
      
      return () => {
        socket.close();
      };
    } catch (error) {
      console.error('WebSocket verbindingsfout:', error);
      setIsRealtime(false);
    }
  }, [refetch, user]);

  // Find current user's position
  const currentUserRank = leaderboard?.find(u => u.id === user?.id)?.rank;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg animate-pulse">
            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  // Get current month name in Dutch
  const getCurrentMonth = () => {
    const months = [
      'januari', 'februari', 'maart', 'april', 'mei', 'juni',
      'juli', 'augustus', 'september', 'oktober', 'november', 'december'
    ];
    const now = new Date();
    const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    return months[previousMonth];
  };

  return (
    <div className="space-y-6">
      {/* Previous month winner */}
      {previousWinner && (
        <div className="p-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl shadow-lg">
          <div className="flex items-center gap-4">
            <Crown className="h-8 w-8 text-yellow-300" />
            <div className="flex-1">
              <p className="text-white font-bold text-lg">Topper van {getCurrentMonth()}</p>
              <p className="text-xl font-bold text-white mt-1">
                {previousWinner.firstName} {previousWinner.lastName[0]}.
              </p>
              <p className="text-white text-base font-medium">
                {previousWinner.monthlyPoints || 0} punten
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Your position this month */}
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h3 className="text-lg font-bold text-white">Jouw positie deze maand</h3>
        <div className="flex items-center gap-2 ml-auto">
          <div className={`w-2 h-2 rounded-full ${isRealtime ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-400">
            {isRealtime ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Current user position */}
      <div className="p-5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-30 rounded-full">
            <span className="text-xl font-bold text-white">
              {getInitials(user?.firstName || 'U', user?.lastName || 'U')}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold text-white">Jij staat op plek {currentUserRank || '?'}</p>
            <p className="text-white text-base font-medium">
              {user?.monthlyPoints || 0} punten deze maand
            </p>
          </div>
        </div>
      </div>

      {/* Top 10 header */}
      <div className="flex items-center gap-3 mt-8">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h3 className="text-lg font-bold text-white">Top 10 Ranglijst</h3>
      </div>

      {/* Leaderboard list */}
      {!leaderboard || leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-gray-800 rounded-2xl shadow-lg">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-600" />
          <p className="text-base">Nog geen punten behaald deze maand.</p>
          <p className="text-sm">Begin met werken om op de ranglijst te komen!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.slice(0, 10).map((leaderUser, index) => {
            const isCurrentUser = leaderUser.id === user?.id;
            const isTopThree = index < 3;
            
            return (
              <div
                key={leaderUser.id}
                className={`flex items-center gap-4 p-4 rounded-2xl shadow-lg transition-all duration-300 ${
                  isCurrentUser 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                    : isTopThree 
                      ? index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                        'bg-gradient-to-r from-orange-400 to-orange-500'
                      : 'bg-gray-800'
                }`}
              >
                {/* Rank badge or initials */}
                <div className="flex items-center justify-center w-12 h-12">
                  {isTopThree ? (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-600 text-white' :
                      index === 1 ? 'bg-gray-600 text-white' :
                      'bg-orange-600 text-white'
                    }`}>
                      {getInitials(leaderUser.firstName, leaderUser.lastName)}
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {leaderUser.rank}
                      </span>
                    </div>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-lg truncate ${
                    isCurrentUser || isTopThree ? 'text-white' : 'text-gray-200'
                  }`}>
                    {isCurrentUser ? 'Jij' : `${leaderUser.firstName} ${leaderUser.lastName}`}
                  </p>
                  <p className={`text-base font-medium ${
                    isCurrentUser || isTopThree ? 'text-white text-opacity-90' : 'text-gray-400'
                  }`}>
                    {leaderUser.monthlyPoints} punten
                  </p>
                </div>

                {/* Points display */}
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    isCurrentUser || isTopThree ? 'text-white' : 'text-gray-200'
                  }`}>
                    {leaderUser.monthlyPoints}
                  </div>
                  <div className={`text-sm ${
                    isCurrentUser || isTopThree ? 'text-white text-opacity-80' : 'text-gray-400'
                  }`}>
                    punten
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer info */}
      <div className="p-4 bg-gray-800 rounded-2xl shadow-lg mt-6">
        <p className="text-sm text-gray-400 text-center">
          Punten worden maandelijks gereset • Updates elke 30 seconden
        </p>
      </div>
    </div>
  );
}