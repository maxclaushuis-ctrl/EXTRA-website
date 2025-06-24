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

  return (
    <div className="space-y-5">
      {/* Header with realtime indicator */}
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h3 className="text-lg font-bold text-white">Top 10 Ranking</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRealtime ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-400">
            {isRealtime ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Previous month winner */}
      {previousWinner && (
        <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full">
              <Crown className="h-6 w-6 text-yellow-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-200 font-medium">🏆 Topper van vorige maand</p>
              <p className="text-lg font-bold text-white">
                {previousWinner.firstName} {previousWinner.lastName[0]}.
              </p>
              <p className="text-sm text-blue-200">
                {previousWinner.monthlyPoints || 0} punten
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current user position if in top 10 */}
      {currentUserRank && (
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg border-2 border-blue-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-full">
              {getRankIcon(currentUserRank)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">Je staat op plaats {currentUserRank}!</p>
              <p className="text-sm text-blue-200">
                {user?.monthlyPoints || 0} punten deze maand
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-300" />
              <span className="text-lg font-bold text-white">{user?.monthlyPoints || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Separator if user is not in top 3 but in top 10 */}
      {currentUserRank && currentUserRank > 3 && (
        <div className="flex items-center gap-3 px-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-xs text-gray-400 px-2">Jouw positie</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>
      )}

      {/* Leaderboard list */}
      {!leaderboard || leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-gray-800 rounded-xl shadow-lg">
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
                className={`flex items-center gap-4 p-4 rounded-xl shadow-lg transition-all duration-300 border ${
                  isCurrentUser 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-400' 
                    : isTopThree 
                      ? `${getRankBackgroundColor(leaderUser.rank)} shadow-md` 
                      : 'bg-gray-800 border-gray-700'
                }`}
              >
                {/* Rank badge */}
                <div className="flex items-center justify-center w-10 h-10">
                  {isTopThree ? (
                    getRankIcon(leaderUser.rank)
                  ) : (
                    <Badge 
                      variant="outline" 
                      className={`w-8 h-8 p-0 text-sm font-bold ${getRankBadgeColor(leaderUser.rank)}`}
                    >
                      {leaderUser.rank}
                    </Badge>
                  )}
                </div>

                {/* Avatar with colored background */}
                <Avatar className={`h-12 w-12 ${isTopThree ? 'border-2 border-yellow-400 shadow-md' : 'border border-gray-600'}`}>
                  <AvatarFallback 
                    className={`font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-white' : 
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-400 text-white' :
                      isCurrentUser ? 'bg-white text-blue-600' :
                      'bg-gray-600 text-white'
                    }`}
                  >
                    {getInitials(leaderUser.firstName, leaderUser.lastName)}
                  </AvatarFallback>
                </Avatar>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-base truncate ${
                    isCurrentUser ? 'text-white' : 
                    index === 0 ? 'text-yellow-700' : 
                    index === 1 ? 'text-gray-700' :
                    index === 2 ? 'text-orange-700' :
                    'text-gray-200'
                  }`}>
                    {isCurrentUser ? 'Jij' : `${leaderUser.firstName} ${leaderUser.lastName[0]}.`}
                  </p>
                  <p className={`text-sm font-medium ${
                    isCurrentUser ? 'text-blue-200' :
                    isTopThree ? 'text-gray-600' :
                    'text-gray-400'
                  }`}>
                    {leaderUser.monthlyPoints} punten
                  </p>
                </div>

                {/* Points badge */}
                <div className="text-right">
                  <Badge 
                    className={`px-3 py-2 text-sm font-bold ${
                      isCurrentUser ? 'bg-white text-blue-600' : 
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-500 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-700 text-gray-200'
                    }`}
                  >
                    #{leaderUser.rank}
                  </Badge>
                  {index === 0 && (
                    <div className="mt-1 text-center">
                      <span className="text-lg">👑</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer info */}
      <div className="p-4 bg-gray-800 rounded-xl shadow-lg">
        <p className="text-sm text-gray-400 text-center">
          Punten worden maandelijks gereset • Updates elke 30 seconden
        </p>
      </div>
    </div>
  );
}