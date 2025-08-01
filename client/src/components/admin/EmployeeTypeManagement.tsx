import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, Users, Utensils, Info, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface EmployeeTypeRule {
  type: string;
  rules: {
    basePoints: number;
    multiplier: number;
    bonusConditions: {
      overtime?: number;
      lastMinute?: number;
      punctuality?: number;
      weekendWork?: number;
      holidayWork?: number;
    };
  };
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeType: string;
  points: number;
}

export default function EmployeeTypeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get employee type rules
  const { data: employeeTypes } = useQuery<EmployeeTypeRule[]>({
    queryKey: ['/api/admin/employee-types'],
    queryFn: async () => {
      const response = await fetch('/api/admin/employee-types');
      if (!response.ok) throw new Error('Failed to fetch employee types');
      return response.json();
    }
  });

  // Get all employees
  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      return data.filter((user: any) => user.role === 'employee');
    }
  });

  // Update employee type mutation
  const updateEmployeeTypeMutation = useMutation({
    mutationFn: async ({ userId, employeeType }: { userId: number; employeeType: string }) => {
      return await apiRequest(`/api/admin/users/${userId}/employee-type`, {
        method: 'PATCH',
        body: { employeeType }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Employee type bijgewerkt',
        description: 'Het employee type is succesvol bijgewerkt'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fout bij bijwerken employee type',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chef':
        return <ChefHat className="h-4 w-4" />;
      case 'horecamedewerker':
        return <Utensils className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'chef':
        return 'Chef';
      case 'horecamedewerker':
        return 'Horecamedewerker';
      case 'general':
        return 'Algemeen';
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'chef':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'horecamedewerker':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Employee Type Beheer</h2>
        <p className="text-muted-foreground">
          Beheer employee types en hun punt beloningsregels
        </p>
      </div>

      {/* Employee Type Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {employeeTypes?.map((type) => (
          <Card key={type.type}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getTypeIcon(type.type)}
                {getTypeLabel(type.type)}
              </CardTitle>
              <CardDescription>
                Punt beloningsregels voor {getTypeLabel(type.type).toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Basis punten:</span>
                <Badge variant="secondary">{type.rules.basePoints}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Multiplier:</span>
                <Badge variant="secondary">×{type.rules.multiplier}</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Bonussen:</div>
                <div className="space-y-1 text-xs">
                  {type.rules.bonusConditions.overtime && (
                    <div className="flex justify-between">
                      <span>Overwerk:</span>
                      <span>+{type.rules.bonusConditions.overtime}</span>
                    </div>
                  )}
                  {type.rules.bonusConditions.lastMinute && (
                    <div className="flex justify-between">
                      <span>Last-minute:</span>
                      <span>+{type.rules.bonusConditions.lastMinute}</span>
                    </div>
                  )}
                  {type.rules.bonusConditions.punctuality && (
                    <div className="flex justify-between">
                      <span>Stiptheid:</span>
                      <span>+{type.rules.bonusConditions.punctuality}</span>
                    </div>
                  )}
                  {type.rules.bonusConditions.weekendWork && (
                    <div className="flex justify-between">
                      <span>Weekend:</span>
                      <span>+{type.rules.bonusConditions.weekendWork}</span>
                    </div>
                  )}
                  {type.rules.bonusConditions.holidayWork && (
                    <div className="flex justify-between">
                      <span>Feestdag:</span>
                      <span>+{type.rules.bonusConditions.holidayWork}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Medewerkers & Types</CardTitle>
          <CardDescription>
            Bekijk en wijzig employee types voor individuele medewerkers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!employees || employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>Geen medewerkers gevonden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </h4>
                      <Badge className={getTypeBadgeColor(employee.employeeType || 'general')}>
                        {getTypeIcon(employee.employeeType || 'general')}
                        <span className="ml-1">{getTypeLabel(employee.employeeType || 'general')}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>{employee.points} punten</span>
                    </div>
                  </div>
                  <div className="w-48">
                    <Select
                      value={employee.employeeType || 'general'}
                      onValueChange={(value) =>
                        updateEmployeeTypeMutation.mutate({
                          userId: employee.id,
                          employeeType: value
                        })
                      }
                      disabled={updateEmployeeTypeMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Algemeen
                          </div>
                        </SelectItem>
                        <SelectItem value="chef">
                          <div className="flex items-center gap-2">
                            <ChefHat className="h-4 w-4" />
                            Chef
                          </div>
                        </SelectItem>
                        <SelectItem value="horecamedewerker">
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4" />
                            Horecamedewerker
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Verschillende employee types hebben verschillende punt beloningsregels.
          Chefs krijgen bijvoorbeeld hogere basis punten en bonussen omdat hun rol meer verantwoordelijkheid heeft.
        </AlertDescription>
      </Alert>
    </div>
  );
}