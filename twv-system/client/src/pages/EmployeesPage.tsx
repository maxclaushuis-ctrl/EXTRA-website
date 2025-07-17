import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Users, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees', {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }
      return response.json()
    }
  })

  const filteredEmployees = employees?.filter((employee: any) =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medewerkers</h1>
            <p className="text-gray-600 mt-1">Beheer alle medewerkers en hun TWV status</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medewerkers</h1>
            <p className="text-gray-600 mt-1">Beheer alle medewerkers en hun TWV status</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">Fout bij laden van medewerkers</h3>
              <p className="text-gray-600 mt-1">Er ging iets mis bij het ophalen van de medewerkergegevens.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getNationalityBadge = (nationality: string) => {
    switch (nationality) {
      case 'EU':
        return <Badge variant="secondary">EU</Badge>
      case 'non_EU':
        return <Badge variant="destructive">Non-EU</Badge>
      default:
        return <Badge variant="outline">{nationality}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Actief</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactief</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medewerkers</h1>
          <p className="text-gray-600 mt-1">Beheer alle medewerkers en hun TWV status</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Medewerker
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Zoek medewerkers op naam of email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employees Grid */}
      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                {searchTerm ? 'Geen medewerkers gevonden' : 'Nog geen medewerkers'}
              </h3>
              <p className="text-gray-600 mt-1">
                {searchTerm 
                  ? 'Probeer een andere zoekterm.'
                  : 'Voeg je eerste medewerker toe om te beginnen.'
                }
              </p>
              {!searchTerm && (
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste Medewerker Toevoegen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee: any) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {employee.firstName} {employee.lastName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {employee.email || 'Geen email'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(employee.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Nationaliteit:</span>
                    {getNationalityBadge(employee.nationality)}
                  </div>
                  {employee.positionTitle && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Functie:</span>
                      <span className="font-medium">{employee.positionTitle}</span>
                    </div>
                  )}
                  {employee.employmentStartDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Startdatum:</span>
                      <span className="font-medium">
                        {new Date(employee.employmentStartDate).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    Details Bekijken
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{employees?.length || 0}</div>
              <div className="text-sm text-gray-600">Totaal Medewerkers</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {employees?.filter((e: any) => e.status === 'active').length || 0}
              </div>
              <div className="text-sm text-gray-600">Actieve Medewerkers</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {employees?.filter((e: any) => e.nationality === 'non_EU').length || 0}
              </div>
              <div className="text-sm text-gray-600">Non-EU Medewerkers</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}