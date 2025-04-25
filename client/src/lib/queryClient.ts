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
    console.log('WebSocket auth header toegevoegd aan request naar', url);
  }

  // Voeg SameSite=None attribuut toe aan cookies om te voorkomen dat ze geblokkeerd worden
  const fetchOptions = {
    ...options,
    headers,
    // Zorg dat cookies worden meegestuurd en laat toe vanuit iframes
    credentials: 'include',
  };

  console.log(`Sending request to ${url} with credentials: ${fetchOptions.credentials}`);
  
  try {
    const response = await fetch(url, fetchOptions);

    // Debug logging
    console.log(`Response from ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: [...response.headers.entries()].reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {} as Record<string, string>)
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
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}