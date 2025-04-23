import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Rule } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'wouter';

export default function RulesPage() {
  const { data: rules, isLoading } = useQuery({
    queryKey: ['/api/rules'],
    queryFn: async () => {
      const response = await fetch('/api/rules');
      if (!response.ok) {
        throw new Error('Kon regels niet ophalen');
      }
      return response.json() as Promise<Rule[]>;
    },
  });

  // Group rules by type
  const rulesByType = rules?.reduce((acc, rule) => {
    if (!acc[rule.type]) {
      acc[rule.type] = [];
    }
    acc[rule.type].push(rule);
    return acc;
  }, {} as Record<string, Rule[]>);

  // Helper function to get the rule type display name
  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'Vaste Beloning';
      case 'multiplication':
        return 'Vermenigvuldigingsregel';
      case 'custom':
        return 'Aangepaste Regel';
      default:
        return type;
    }
  };

  // Helper function to render the rule condition in human-readable format
  const formatRuleCondition = (rule: Rule) => {
    if (rule.type === 'fixed') {
      return `Wanneer ${rule.condition.type} gelijk is aan ${rule.condition.value}`;
    } else if (rule.type === 'multiplication') {
      return `Vermenigvuldig ${rule.condition.type} met ${rule.condition.value}`;
    } else {
      return `${rule.condition.type} ${rule.condition.operator || ''} ${rule.condition.value}`;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Regels</h1>
          <p className="text-muted-foreground">
            Stel regels in voor het automatisch toekennen van punten
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Regels beheren</CardTitle>
          <CardDescription>
            Stel automatische regels in voor het toekennen van punten aan medewerkers op basis van 
            hun werkpatronen, beoordelingen of andere criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              Regels Verwerken
            </Button>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nieuwe Regel
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-8">Regels laden...</div>
      ) : !rules || rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-lg font-medium">Geen regels gevonden</p>
          <p className="text-sm text-muted-foreground">
            Voeg regels toe om automatisch punten toe te kennen
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {rulesByType && Object.entries(rulesByType).map(([type, typeRules]) => (
            <div key={type}>
              <h2 className="mb-4 text-xl font-semibold">{getRuleTypeLabel(type)}</h2>
              <div className="space-y-4">
                {typeRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          <CardDescription>{rule.description}</CardDescription>
                        </div>
                        <div className="flex items-center">
                          <Switch checked={rule.isActive} />
                          <span className="ml-2 text-sm">
                            {rule.isActive ? 'Actief' : 'Inactief'}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Voorwaarde</p>
                          <p className="text-sm">{formatRuleCondition(rule)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Beloning</p>
                          <p className="text-sm">
                            <span className="font-bold text-blue-600">{rule.pointsValue}</span> punten
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm">
                          Bewerken
                        </Button>
                        <Button variant="outline" size="sm">
                          Verwijderen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}