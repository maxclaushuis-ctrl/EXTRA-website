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
    <div className="space-y-4">
      {/* Header with realtime indicator */}
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-white">Top 10 Ranglijst</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRealtime ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-400">
            {isRealtime ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Current user position if in top 10 */}
      {currentUserRank && (
        <div className="p-4 bg-blue-600 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8">
              {getRankIcon(currentUserRank)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">Je staat op plaats {currentUserRank}!</p>
              <p className="text-sm text-blue-200">
                {user?.monthlyPoints || 0} punten deze maand
              </p>
            </div>
            <Zap className="h-5 w-5 text-yellow-300" />
          </div>
        </div>
      )}

      {/* Previous month winner */}
      {previousWinner && (
        <div className="p-4 bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-purple-300" />
            <div className="flex-1">
              <p className="text-sm text-purple-200">Winnaar Vorige Maand</p>
              <p className="font-semibold text-white">
                {previousWinner.firstName} {previousWinner.lastName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      {!leaderboard || leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-gray-800 rounded-lg">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-600" />
          <p>Nog geen punten behaald deze maand.</p>
          <p className="text-sm">Begin met werken om op de ranglijst te komen!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.slice(0, 10).map((leaderUser, index) => (
            <div
              key={leaderUser.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                leaderUser.id === user?.id 
                  ? 'bg-blue-600 border border-blue-500' 
                  : index < 3 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-gray-800'
              }`}
            >
              {/* Rank badge */}
              <div className="flex items-center justify-center w-8 h-8">
                {index < 3 ? (
                  getRankIcon(leaderUser.rank)
                ) : (
                  <Badge 
                    variant="outline" 
                    className={`w-6 h-6 p-0 text-xs font-bold ${getRankBadgeColor(leaderUser.rank)}`}
                  >
                    {leaderUser.rank}
                  </Badge>
                )}
              </div>

              {/* Avatar */}
              <Avatar className={`h-10 w-10 ${index < 3 ? 'border-2 border-yellow-300' : ''}`}>
                <AvatarFallback className={index === 0 ? 'bg-yellow-100 text-yellow-700 font-bold' : 'bg-gray-600 text-white'}>
                  {leaderUser.firstName[0]}{leaderUser.lastName[0]}
                </AvatarFallback>
              </Avatar>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${
                  leaderUser.id === user?.id ? 'text-white' : 
                  index === 0 ? 'text-yellow-300' : 'text-gray-200'
                }`}>
                  {leaderUser.id === user?.id ? 'Jij' : `${leaderUser.firstName} ${leaderUser.lastName}`}
                </p>
                <p className="text-sm text-gray-400 truncate">{leaderUser.email}</p>
              </div>

              {/* Points */}
              <div className="text-right">
                <Badge 
                  className={`${
                    leaderUser.id === user?.id ? 'bg-white text-blue-600' : getRankBadgeColor(leaderUser.rank)
                  } px-3 py-1 font-bold`}
                >
                  {leaderUser.monthlyPoints} pnt
                </Badge>
                {index === 0 && (
                  <p className="text-xs text-yellow-400 mt-1 font-medium">👑</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer info */}
      <div className="p-3 bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-400 text-center">
          Punten worden maandelijks gereset. Updates elke 30 seconden.
        </p>
      </div>
    </div>
  );
}