import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Crown, Star } from 'lucide-react';
import { User } from '@shared/schema';
import { useEffect, useState } from 'react';

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
      return 'bg-gray-100 text-gray-700';
  }
}

export default function Leaderboard() {
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
        console.log('Leaderboard WebSocket verbonden');
        
        // Authenticate with stored user data
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
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
        console.log('Leaderboard WebSocket verbinding verbroken');
      };
      
      return () => {
        socket.close();
      };
    } catch (error) {
      console.error('WebSocket verbindingsfout:', error);
      setIsRealtime(false);
    }
  }, [refetch]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Maandelijk Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with realtime indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Top 10 Medewerkers</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRealtime ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isRealtime ? 'Live updates' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Previous month winner */}
      {previousWinner && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              Winnaar Vorige Maand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-purple-300">
                <AvatarFallback className="bg-purple-100 text-purple-700 font-bold">
                  {previousWinner.firstName[0]}{previousWinner.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-purple-900">
                  {previousWinner.firstName} {previousWinner.lastName}
                </p>
                <p className="text-sm text-purple-600">Gefeliciteerd met de overwinning! 🎉</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current month leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Deze Maand
          </CardTitle>
          <CardDescription>
            Realtime ranglijst op basis van behaalde punten deze maand
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!leaderboard || leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nog geen punten behaald deze maand.</p>
              <p className="text-sm">Begin met werken om op het leaderboard te komen!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    index < 3 
                      ? 'bg-gradient-to-r from-gray-50 to-white border border-gray-200 shadow-sm' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Rank badge */}
                  <div className="flex items-center justify-center w-8 h-8">
                    {index < 3 ? (
                      getRankIcon(user.rank)
                    ) : (
                      <Badge 
                        variant="outline" 
                        className={`w-6 h-6 p-0 text-xs font-bold ${getRankBadgeColor(user.rank)}`}
                      >
                        {user.rank}
                      </Badge>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className={`h-10 w-10 ${index < 3 ? 'border-2 border-yellow-300' : ''}`}>
                    <AvatarFallback className={index === 0 ? 'bg-yellow-100 text-yellow-700 font-bold' : ''}>
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${index === 0 ? 'text-yellow-700' : ''}`}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <Badge 
                      className={`${getRankBadgeColor(user.rank)} px-3 py-1 font-bold`}
                    >
                      {user.monthlyPoints} punten
                    </Badge>
                    {index === 0 && (
                      <p className="text-xs text-yellow-600 mt-1 font-medium">👑 Leider</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Punten worden automatisch gereset aan het begin van elke maand.
              Leaderboard wordt elke 30 seconden bijgewerkt.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}