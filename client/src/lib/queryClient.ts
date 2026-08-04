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

/**
 * GET met JSON-antwoord, voor een eigen queryFn die query-parameters nodig
 * heeft en dus niet op defaultQueryFn hierboven kan leunen.
 *
 * Waarom dit bestaat: een eigen queryFn werd op meerdere plekken geschreven
 * als `fetch(url).then(r => r.json())`. Die keten kijkt niet naar de
 * HTTP-status, dus een 403 van adminMiddleware ({"message":"Geen toegang"})
 * of een 500 ({"message":"Fout bij ..."}) komt binnen als een gewóón geslaagd
 * antwoord. React Query zet dat foutobject dan in `data`, en de component
 * denkt een lijst te hebben terwijl er een object staat. Het gevolg is geen
 * nette foutmelding maar een crash verderop, bij de eerste .filter() of
 * .map(). Zo'n mislukte aanroep hoort te falen op het moment dat hij mislukt.
 */
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    const errorText = await response.text();
    let melding = errorText;
    try { melding = JSON.parse(errorText)?.message || errorText; } catch { /* geen JSON */ }
    const error: any = new Error(
      response.status === 401 || response.status === 403
        ? 'Geen toegang — log opnieuw in en probeer het nog eens.'
        : melding || `Serverfout (${response.status})`,
    );
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

/**
 * Zelfde als fetchJson, maar voor endpoints die een lijst horen terug te
 * geven. Krijgt de client iets anders (een foutobject, een enkel record),
 * dan faalt de query met een leesbare melding in plaats van dat het probleem
 * pas verderop in de render opduikt als "x.filter is not a function".
 */
export async function fetchJsonList<T>(url: string): Promise<T[]> {
  const data = await fetchJson<unknown>(url);
  if (!Array.isArray(data)) {
    throw new Error(`Onverwacht antwoord van ${url}: er werd een lijst verwacht.`);
  }
  return data as T[];
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
