import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, MessageSquare, Settings } from 'lucide-react';
import InactivityManagement from '@/components/admin/InactivityManagement';
import EmployeeTypeManagement from '@/components/admin/EmployeeTypeManagement';
import ChallengeRequestManagement from '@/components/admin/ChallengeRequestManagement';

export default function SystemManagement() {
  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Systeembeheer</h1>
        <p className="text-muted-foreground">
          Geavanceerde beheerfuncties voor het EXTRAATJE platform
        </p>
      </div>

      <Tabs defaultValue="inactivity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inactivity" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Inactiviteit
          </TabsTrigger>
          <TabsTrigger value="employee-types" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employee Types
          </TabsTrigger>
          <TabsTrigger value="challenge-requests" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Challenge Verzoeken
          </TabsTrigger>
          <TabsTrigger value="system-settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Systeem Instellingen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inactivity">
          <InactivityManagement />
        </TabsContent>

        <TabsContent value="employee-types">
          <EmployeeTypeManagement />
        </TabsContent>

        <TabsContent value="challenge-requests">
          <ChallengeRequestManagement />
        </TabsContent>

        <TabsContent value="system-settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Systeem Instellingen</CardTitle>
                <CardDescription>
                  Algemene configuratie en systeeminstellingen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Punt Conversie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Punten naar Euro:</span>
                          <span className="font-medium">20 punten = €1</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Verjaardag bonus:</span>
                          <span className="font-medium">100 punten</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Inactiviteit Regels</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Reset periode:</span>
                          <span className="font-medium">3 maanden</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Waarschuwing periode:</span>
                          <span className="font-medium">2,5 maanden</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Email Service</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Provider:</span>
                          <span className="font-medium">SendGrid</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <span className="font-medium text-green-600">Actief (Mock)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Database</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Type:</span>
                          <span className="font-medium">PostgreSQL</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Storage:</span>
                          <span className="font-medium">In-Memory (Development)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planworks Integratie</CardTitle>
                <CardDescription>
                  Status van de externe planning systeem integratie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div>
                      <p className="font-medium text-yellow-800">Integratie in ontwikkeling</p>
                      <p className="text-sm text-yellow-700">
                        Planworks API integratie wordt ontwikkeld door externe developer
                      </p>
                    </div>
                    <div className="text-yellow-600">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-muted-foreground">9</div>
                      <div className="text-sm text-muted-foreground">Beschikbare Challenges</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-muted-foreground">7</div>
                      <div className="text-sm text-muted-foreground">Automatische Categorieën</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}