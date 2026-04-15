import { BetaAnalyticsDataClient } from "@google-analytics/data";

let _client: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient {
  if (_client) return _client;

  const json = process.env.GA_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GA_SERVICE_ACCOUNT_JSON niet ingesteld");

  let creds: any;
  try {
    creds = JSON.parse(json);
  } catch {
    throw new Error("GA_SERVICE_ACCOUNT_JSON is geen geldige JSON");
  }

  _client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
  });
  return _client;
}

function getPropertyId(): string {
  const id = process.env.GA_PROPERTY_ID;
  if (!id) throw new Error("GA_PROPERTY_ID niet ingesteld");
  return id;
}

export function isGa4Configured(): boolean {
  return !!(process.env.GA_SERVICE_ACCOUNT_JSON && process.env.GA_PROPERTY_ID);
}

export async function fetchGa4Overview(days = 30) {
  const client = getClient();
  const propertyId = getPropertyId();
  const startDate = `${days}daysAgo`;

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      { startDate, endDate: "today" },
      { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` },
    ],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "screenPageViews" },
      { name: "bounceRate" },
      { name: "averageSessionDuration" },
    ],
  });

  const curr = response.rows?.[0]?.metricValues ?? [];
  const prev = response.rows?.[1]?.metricValues ?? [];

  return {
    sessions: { value: Number(curr[0]?.value ?? 0), prev: Number(prev[0]?.value ?? 0) },
    users: { value: Number(curr[1]?.value ?? 0), prev: Number(prev[1]?.value ?? 0) },
    pageviews: { value: Number(curr[2]?.value ?? 0), prev: Number(prev[2]?.value ?? 0) },
    bounceRate: { value: parseFloat((Number(curr[3]?.value ?? 0) * 100).toFixed(1)), prev: parseFloat((Number(prev[3]?.value ?? 0) * 100).toFixed(1)) },
    avgDuration: { value: Math.round(Number(curr[4]?.value ?? 0)), prev: Math.round(Number(prev[4]?.value ?? 0)) },
  };
}

export async function fetchGa4Trend(days = 30) {
  const client = getClient();
  const propertyId = getPropertyId();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  return (response.rows ?? []).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? "",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    users: Number(row.metricValues?.[1]?.value ?? 0),
  }));
}

export async function fetchGa4Sources(days = 30) {
  const client = getClient();
  const propertyId = getPropertyId();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 8,
  });

  return (response.rows ?? []).map((row) => ({
    channel: row.dimensionValues?.[0]?.value ?? "Onbekend",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    users: Number(row.metricValues?.[1]?.value ?? 0),
  }));
}

export async function fetchGa4TopPages(days = 30) {
  const client = getClient();
  const propertyId = getPropertyId();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }, { name: "averageSessionDuration" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10,
  });

  return (response.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "/",
    pageviews: Number(row.metricValues?.[0]?.value ?? 0),
    users: Number(row.metricValues?.[1]?.value ?? 0),
    avgDuration: Math.round(Number(row.metricValues?.[2]?.value ?? 0)),
  }));
}

export async function fetchGa4Devices(days = 30) {
  const client = getClient();
  const propertyId = getPropertyId();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "sessions" }],
  });

  return (response.rows ?? []).map((row) => ({
    device: row.dimensionValues?.[0]?.value ?? "onbekend",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
  }));
}
