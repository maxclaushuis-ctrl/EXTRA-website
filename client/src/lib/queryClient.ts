import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Globale variabele om bij te houden of WebSocket authenticatie is gelukt
let wsAuthenticated = false;

// Functie om WebSocket authenticatiestatus bij te werken
export function setWsAuthenticatedStatus(status: boolean) {
  wsAuthenticated = status;
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Set default headers
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Voeg WebSocket authenticatie header toe als beschikbaar
  if (wsAuthenticated) {
    headers.set('x-ws-auth', 'admin_authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    // Zorg dat cookies worden meegestuurd
    credentials: 'include',
  });

  // Handle common error scenarios
  if (!response.ok) {
    // For 401 Unauthorized, you might want to redirect to login
    if (response.status === 401) {
      // Optional: redirect to login page
      console.log('Niet geautoriseerd, mogelijk moet je opnieuw inloggen');
    }
  }

  return response;
}