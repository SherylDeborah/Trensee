// Deterministic hourly "live" signal engine.
// Every metric is derived from the current hour bucket, so the server and the
// client always agree during hydration, and the whole board changes on the hour.

export const HOUR_MS = 3_600_000;

export function currentHourBucket(now: number = Date.now()): number {
  return Math.floor(now / HOUR_MS);
}

/** Stable 32-bit hash so a (product, hour) pair always yields the same signal. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function noise(key: string, bucket: number, spread: number): number {
  return (hash(`${key}#${bucket}`) - 0.5) * 2 * spread;
}

export type LiveSignal = {
  /** 0-100 live trend score for this hour */
  trend: number;
  /** hour-over-hour change in trend score */
  delta: number;
  velocityPct: number;
  searchVelocity: number;
  wishlistAdds: number;
  crossStoreDemand: number;
  sentiment: number;
  unitsPerHour: number;
  stockPressure: number;
};

function rawTrend(key: string, base: number, bucket: number): number {
  const wave = Math.sin((bucket % 24) / 24 * Math.PI * 2 + hash(key) * 6.283) * 4;
  return clamp(base + wave + noise(key, bucket, 3.5), 40, 99.5);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function liveSignal(
  key: string,
  baseTrend: number,
  baseRating: number,
  bucket: number,
): LiveSignal {
  const t = rawTrend(key, baseTrend, bucket);
  const prev = rawTrend(key, baseTrend, bucket - 1);
  const delta = t - prev;
  return {
    trend: round1(t),
    delta: round1(delta),
    velocityPct: Math.round(clamp(t * 2.1 + delta * 12 + noise(key + "v", bucket, 18), 5, 420)),
    searchVelocity: Math.round(clamp(t + noise(key + "s", bucket, 6), 30, 100)),
    wishlistAdds: Math.round(clamp(t - 7 + noise(key + "w", bucket, 8), 25, 100)),
    crossStoreDemand: Math.round(clamp(t - 13 + noise(key + "c", bucket, 9), 20, 100)),
    sentiment: Math.round(clamp(baseRating * 20 + noise(key + "m", bucket, 4), 40, 100)),
    unitsPerHour: Math.round(clamp(t * 34 + noise(key + "u", bucket, 260), 40, 5200)),
    stockPressure: Math.round(clamp(t - 20 + noise(key + "k", bucket, 14), 10, 99)),
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** 24 hourly points ending at `bucket` — the data behind the daily report. */
export function hourlySeries(key: string, baseTrend: number, bucket: number) {
  return Array.from({ length: 24 }, (_, i) => {
    const b = bucket - 23 + i;
    const t = round1(rawTrend(key, baseTrend, b));
    return {
      hour: `${String(((b % 24) + 24) % 24).padStart(2, "0")}:00`,
      trend: t,
      units: Math.round(clamp(t * 34 + noise(key + "u", b, 260), 40, 5200)),
    };
  });
}

export type BusinessCase = {
  /** projected monthly revenue if a business stocks/invests in this product, INR */
  projectedMonthlyRevenue: number;
  grossMarginPct: number;
  projectedMonthlyProfit: number;
  roiPct: number;
  paybackDays: number;
  recommendedInvestment: number;
  demandConfidencePct: number;
  verdict: "Invest now" | "Scale gradually" | "Watch";
  headline: string;
};

const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatINR(n: number): string {
  return `₹${INR.format(Math.round(n))}`;
}

export function compactINR(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
  return formatINR(n);
}

export function parsePrice(price: string): number {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

export function businessCase(
  key: string,
  price: number,
  signal: LiveSignal,
  bucket: number,
): BusinessCase {
  // A single mid-size retailer captures only a sliver of market-wide hourly demand.
  const monthlyUnits = signal.unitsPerHour * 24 * 30 * 0.0006;
  const projectedMonthlyRevenue = monthlyUnits * price;
  const grossMarginPct = round1(clamp(18 + signal.trend * 0.28 + noise(key + "g", bucket, 3), 14, 46));
  const projectedMonthlyProfit = projectedMonthlyRevenue * (grossMarginPct / 100);
  // Half a month of cost-of-goods as opening inventory.
  const recommendedInvestment = projectedMonthlyRevenue * (1 - grossMarginPct / 100) * 0.5;
  const roiPct = Math.round((projectedMonthlyProfit / Math.max(1, recommendedInvestment)) * 100);
  const paybackDays = Math.max(4, Math.round(recommendedInvestment / Math.max(1, projectedMonthlyProfit / 30)));
  const demandConfidencePct = Math.round(
    clamp(signal.trend * 0.6 + signal.sentiment * 0.3 + signal.crossStoreDemand * 0.1, 40, 98),
  );
  const verdict: BusinessCase["verdict"] =
    signal.trend >= 88 && signal.delta >= 0 ? "Invest now" : signal.trend >= 78 ? "Scale gradually" : "Watch";
  const headline =
    verdict === "Invest now"
      ? `Demand is compounding hour over hour — stocking now captures the peak of the curve.`
      : verdict === "Scale gradually"
        ? `Healthy, steady demand — a phased inventory ramp keeps working capital safe.`
        : `Signal is cooling this hour — hold budget and re-check the next refresh.`;
  return {
    projectedMonthlyRevenue,
    grossMarginPct,
    projectedMonthlyProfit,
    roiPct,
    paybackDays,
    recommendedInvestment,
    demandConfidencePct,
    verdict,
    headline,
  };
}
