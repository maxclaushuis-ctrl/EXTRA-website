import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, AlertCircle } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapportages</h1>
          <p className="text-gray-600 mt-1">Genereer TWV rapporten en statistieken</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-purple-500" />
            <h3 className="text-lg font-medium text-gray-900 mt-2">Rapportages</h3>
            <p className="text-gray-600 mt-1">Dit onderdeel is nog in ontwikkeling.</p>
            <Badge variant="secondary" className="mt-4">Binnenkort beschikbaar</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}