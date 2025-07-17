import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      return response.json()
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Totaal Medewerkers',
      value: stats?.totalEmployees || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'TWV Aanvragen',
      value: stats?.totalApplications || 0,
      icon: FileCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'In Behandeling',
      value: stats?.pendingApplications || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Goedgekeurd',
      value: stats?.approvedApplications || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overzicht van alle TWV aanvragen en medewerkers
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>TWV Status Overzicht</CardTitle>
            <CardDescription>
              Verdeling van alle TWV aanvragen per status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">In Behandeling</span>
                </div>
                <Badge variant="secondary">{stats?.pendingApplications || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Goedgekeurd</span>
                </div>
                <Badge variant="secondary">{stats?.approvedApplications || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Afgekeurd</span>
                </div>
                <Badge variant="secondary">{stats?.rejectedApplications || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recente Activiteiten</CardTitle>
            <CardDescription>
              Laatste acties in het TWV systeem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivities?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivities.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">
                        {activity.action === 'application_created' && 'TWV aanvraag aangemaakt'}
                        {activity.action === 'application_updated' && 'TWV status gewijzigd'}
                        {activity.action === 'employee_created' && 'Nieuwe medewerker toegevoegd'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.employeeName && `voor ${activity.employeeName}`}
                        {activity.userName && ` door ${activity.userName}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(activity.timestamp), 'dd MMM yyyy, HH:mm', { locale: nl })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Geen recente activiteiten</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Snelle Acties</CardTitle>
          <CardDescription>
            Veelgebruikte functies voor dagelijks TWV beheer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/employees"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-medium">Medewerkers Beheren</h3>
              <p className="text-sm text-gray-600">Voeg nieuwe medewerkers toe of bewerk bestaande</p>
            </a>
            <a
              href="/twv-applications"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileCheck className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-medium">TWV Aanvragen</h3>
              <p className="text-sm text-gray-600">Beheer alle TWV aanvragen en statussen</p>
            </a>
            <a
              href="/reports"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-medium">Rapportages</h3>
              <p className="text-sm text-gray-600">Genereer rapporten en statistieken</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}