import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileCheck, AlertCircle } from 'lucide-react'

export default function TwvApplicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">TWV Aanvragen</h1>
          <p className="text-gray-600 mt-1">Beheer alle tewerkstellingsvergunning aanvragen</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <FileCheck className="mx-auto h-12 w-12 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900 mt-2">TWV Aanvragen</h3>
            <p className="text-gray-600 mt-1">Dit onderdeel is nog in ontwikkeling.</p>
            <Badge variant="secondary" className="mt-4">Binnenkort beschikbaar</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}