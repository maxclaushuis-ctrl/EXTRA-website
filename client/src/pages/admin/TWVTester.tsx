import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Eenvoudige testpagina
const TWVTester = () => {
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const fetchTWVUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test gewone fetch om te zien of het een cookie-probleem is
      const response = await fetch('/api/twv/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // belangrijk voor cookies
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Fout bij ophalen TWV gebruikers');
      }
      
      setResponseData(data);
      toast({
        title: "Data succesvol opgehaald",
        description: `Aantal items: ${Array.isArray(data) ? data.length : 0}`,
      });
    } catch (err: any) {
      setError(err.message || 'Onbekende fout');
      toast({
        title: "Fout",
        description: err.message || 'Onbekende fout',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const testApiRequest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test apiRequest functie (gebruikt door react-query)
      const data = await apiRequest('/api/twv/users', {
        method: 'GET'
      });
      
      setResponseData(data);
      toast({
        title: "Data succesvol opgehaald via apiRequest",
        description: `Aantal items: ${Array.isArray(data) ? data.length : 0}`,
      });
    } catch (err: any) {
      setError(err.message || 'Onbekende fout');
      toast({
        title: "Fout bij apiRequest",
        description: err.message || 'Onbekende fout',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const testSync = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test synchronisatiefunctie
      const data = await apiRequest('/api/twv/sync', {
        method: 'POST'
      });
      
      setResponseData(data);
      toast({
        title: "Synchronisatie succesvol",
        description: `Resultaat: ${JSON.stringify(data)}`,
      });
    } catch (err: any) {
      setError(err.message || 'Onbekende fout');
      toast({
        title: "Fout bij synchronisatie",
        description: err.message || 'Onbekende fout',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">TWV Tester</h1>
          <p className="text-gray-500">
            Test de TWV API-routes en bekijk de respons
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Gebruiker Informatie</CardTitle>
            <CardDescription>
              Huidige ingelogde gebruiker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </CardContent>
        </Card>
        
        <div className="flex space-x-4">
          <Button onClick={fetchTWVUsers} disabled={loading}>
            {loading ? "Laden..." : "Haal TWV Gebruikers op (fetch)"}
          </Button>
          
          <Button onClick={testApiRequest} disabled={loading}>
            {loading ? "Laden..." : "Haal TWV Gebruikers op (apiRequest)"}
          </Button>
          
          <Button onClick={testSync} disabled={loading}>
            {loading ? "Laden..." : "Test TWV Synchronisatie"}
          </Button>
        </div>
        
        {error && (
          <Card className="border-red-400">
            <CardHeader>
              <CardTitle className="text-red-500">Fout</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}
        
        {responseData && (
          <Card>
            <CardHeader>
              <CardTitle>Respons Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[400px] overflow-auto">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TWVTester;