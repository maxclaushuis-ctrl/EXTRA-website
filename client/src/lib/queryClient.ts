import { QueryClient, QueryFunctionContext } from '@tanstack/react-query';

async function defaultQueryFn({ queryKey }: QueryFunctionContext): Promise<unknown> {
  const url = queryKey[0] as string;
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    if (response.status === 401) return null;
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }
  return response.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 0,
    },
  },
});

let wsAuthenticated = false;
export function setWsAuthenticatedStatus(status: boolean) {
  wsAuthenticated = status;
}

const HTTP_VERBS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

/**
 * Flexible API request helper. Supports multiple calling patterns:
 *   apiRequest(url, options)          — standard fetch-style
 *   apiRequest(method, url, body)     — (POST, "/api/...", data)
 *   apiRequest(url, method, body)     — ("/api/...", "POST", data)
 */
export async function apiRequest(
  firstArg: string,
  secondArg?: string | RequestInit,
  thirdArg?: unknown
): Promise<unknown> {
  let url: string;
  let method = 'GET';
  let rawBody: BodyInit | undefined;
  let extraHeaders: Record<string, string> = {};

  if (typeof secondArg === 'string') {
    if (HTTP_VERBS.has(firstArg.toUpperCase())) {
      // (method, url, body)
      method = firstArg.toUpperCase();
      url = secondArg;
      if (thirdArg !== undefined) rawBody = JSON.stringify(thirdArg);
    } else {
      // (url, method, body)
      url = firstArg;
      method = secondArg.toUpperCase();
      if (thirdArg !== undefined) rawBody = JSON.stringify(thirdArg);
    }
  } else if (secondArg && typeof secondArg === 'object') {
    // (url, RequestInit)
    url = firstArg;
    const opts = secondArg as RequestInit;
    method = (opts.method ?? 'GET').toUpperCase();
    rawBody = opts.body as BodyInit | undefined;
    if (opts.headers) {
      extraHeaders = opts.headers as Record<string, string>;
    }
  } else {
    url = firstArg;
  }

  const headers: Record<string, string> = { ...extraHeaders };
  if (rawBody !== undefined && !headers['Content-Type'] && !(rawBody instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: rawBody,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error: any = new Error(`${response.status}: ${errorText}`);
    error.status = response.status;
    try { error.data = JSON.parse(errorText); } catch { /* not JSON */ }
    throw error;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}
