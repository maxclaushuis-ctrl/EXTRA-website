import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Set default headers
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle common error scenarios
  if (!response.ok) {
    // For 401 Unauthorized, you might want to redirect to login
    if (response.status === 401) {
      // Optional: redirect to login page
    }
  }

  return response;
}