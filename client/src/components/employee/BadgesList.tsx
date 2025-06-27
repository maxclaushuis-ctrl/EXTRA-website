import { Crown, Award, Star, Trophy } from "lucide-react";

interface Badge {
  id: number;
  title: string;
  description: string;
  points: number;
  color: string;
  icon: string;
  earned: boolean;
}

interface BadgesListProps {
  userPoints: number;
}

export function BadgesList({ userPoints }: BadgesListProps) {
  // Definieer badges gebaseerd op punten
  const badges: Badge[] = [
    {
      id: 1,
      title: "250 punten",
      description: "Eerste mijlpaal bereikt",
      points: 250,
      color: "#F59E0B", // amber
      icon: "🏆",
      earned: userPoints >= 250
    },
    {
      id: 2,
      title: "450 punten", 
      description: "Goede vooruitgang",
      points: 450,
      color: "#6B7280", // gray
      icon: "🥈",
      earned: userPoints >= 450
    },
    {
      id: 3,
      title: "500 punten",
      description: "Leider prestatie",
      points: 500,
      color: "#F59E0B", // gold
      icon: "👑",
      earned: userPoints >= 500
    },
    {
      id: 4,
      title: "750 punten",
      description: "Uitstekende prestatie", 
      points: 750,
      color: "#8B5CF6", // purple
      icon: "⭐",
      earned: userPoints >= 750
    },
    {
      id: 5,
      title: "1000 punten",
      description: "Top performer",
      points: 1000,
      color: "#EF4444", // red
      icon: "🌟",
      earned: userPoints >= 1000
    }
  ];

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "crown":
        return <Crown className="h-6 w-6" />;
      case "award":
        return <Award className="h-6 w-6" />;
      case "star":
        return <Star className="h-6 w-6" />;
      case "trophy":
        return <Trophy className="h-6 w-6" />;
      default:
        return <Trophy className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white mb-4">Jouw Badges</h3>
      
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={`p-4 rounded-xl border transition-all duration-200 ${
            badge.earned
              ? 'bg-gray-800 border-gray-600 shadow-lg'
              : 'bg-gray-900 border-gray-700 opacity-60'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Badge Icon/Emoji */}
            <div 
              className={`flex items-center justify-center w-12 h-12 rounded-xl text-2xl ${
                badge.earned ? 'bg-opacity-20' : 'bg-gray-800'
              }`}
              style={{ 
                backgroundColor: badge.earned ? badge.color + '33' : undefined 
              }}
            >
              {badge.icon}
            </div>
            
            {/* Badge Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={`font-bold text-base ${
                  badge.earned ? 'text-white' : 'text-gray-400'
                }`}>
                  {badge.title}
                </h4>
                {badge.earned && badge.title.includes("Leider") && (
                  <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
                    Leider
                  </span>
                )}
              </div>
              <p className={`text-sm ${
                badge.earned ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {badge.description}
              </p>
              
              {/* Progress indicator */}
              {!badge.earned && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{userPoints} punten</span>
                    <span>{badge.points} punten</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((userPoints / badge.points) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Status indicator */}
            {badge.earned && (
              <div className="text-green-400">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-800 rounded-xl border border-gray-600">
        <div className="text-center">
          <p className="text-gray-300 text-sm">
            Je hebt <span className="font-bold text-white">{badges.filter(b => b.earned).length}</span> van de <span className="font-bold text-white">{badges.length}</span> badges verdiend
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Blijf punten verdienen om meer badges te ontgrendelen!
          </p>
        </div>
      </div>
    </div>
  );
}