import { ClientOnly } from "@tanstack/react-router";
import { Download, CalendarClock, TrendingUp, TrendingDown } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { compactINR } from "@/lib/live-trends";

export type ReportRow = {
  name: string;
  brand: string;
  domain: string;
  trend: number;
  delta: number;
  velocityPct: number;
  unitsPerHour: number;
  revenue: number;
  profit: number;
  roiPct: number;
  verdict: string;
};

export function DailyReport({
  dateLabel,
  series,
  rows,
}: {
  dateLabel: string;
  series: { hour: string; trend: number; units: number }[];
  rows: ReportRow[];
}) {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const avgRoi = Math.round(rows.reduce((s, r) => s + r.roiPct, 0) / Math.max(1, rows.length));
  const risers = rows.filter((r) => r.delta > 0).length;

  const download = () => {
    const header = [
      "product",
      "brand",
      "domain",
      "trend_score",
      "hourly_delta",
      "velocity_pct",
      "units_per_hour",
      "projected_monthly_revenue_inr",
      "projected_monthly_profit_inr",
      "roi_pct",
      "verdict",
    ];
    const csv = [
      `# TRENSEE daily report — ${dateLabel}`,
      header.join(","),
      ...rows.map((r) =>
        [
          `"${r.name}"`,
          r.brand,
          r.domain,
          r.trend,
          r.delta,
          r.velocityPct,
          r.unitsPerHour,
          Math.round(r.revenue),
          Math.round(r.profit),
          r.roiPct,
          r.verdict,
        ].join(","),
      ),
      "",
      "# hourly trend curve (last 24h)",
      "hour,avg_trend_score,units",
      ...series.map((p) => `${p.hour},${p.trend},${p.units}`),
    ].join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `trensee-daily-report-${dateLabel.replace(/\s|,/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="report" className="mx-auto mt-24 max-w-7xl px-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl md:p-10">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              End-of-day report
            </div>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Daily digest · {dateLabel}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Every hourly refresh is rolled up at midnight into one report: what moved, what to
              stock, and what each product is worth to a business next month.
            </p>
          </div>
          <button
            onClick={download}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-glow)] transition hover:brightness-110"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Download className="h-4 w-4" /> Download report (CSV)
          </button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Products rising today" value={`${risers} / ${rows.length}`} />
          <Kpi label="Aggregate revenue potential" value={compactINR(totalRevenue)} />
          <Kpi label="Aggregate profit potential" value={compactINR(totalProfit)} />
          <Kpi label="Average ROI" value={`${avgRoi}%`} />
        </div>

        <div className="mt-8 h-64 w-full">
          <ClientOnly fallback={<div className="h-full w-full rounded-2xl bg-white/[0.03]" />}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 300)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 300)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  interval={3}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[40, 100]}
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20,20,30,0.92)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="trend"
                  name="Avg trend score"
                  stroke="oklch(0.82 0.15 210)"
                  strokeWidth={2}
                  fill="url(#trendFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ClientOnly>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-white/10">
                <th className="py-3 pr-4 font-medium">Product</th>
                <th className="py-3 pr-4 font-medium">Domain</th>
                <th className="py-3 pr-4 font-medium">Trend</th>
                <th className="py-3 pr-4 font-medium">1h change</th>
                <th className="py-3 pr-4 font-medium">Revenue potential</th>
                <th className="py-3 pr-4 font-medium">Profit</th>
                <th className="py-3 pr-4 font-medium">ROI</th>
                <th className="py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((r) => (
                <tr key={r.name} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.brand}</div>
                  </td>
                  <td className="py-3 pr-4 capitalize text-muted-foreground">{r.domain}</td>
                  <td className="py-3 pr-4 font-medium">{r.trend}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        r.delta >= 0 ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {r.delta >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {r.delta >= 0 ? "+" : ""}
                      {r.delta}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{compactINR(r.revenue)}</td>
                  <td className="py-3 pr-4">{compactINR(r.profit)}</td>
                  <td className="py-3 pr-4 font-medium">{r.roiPct}%</td>
                  <td className="py-3 text-muted-foreground">{r.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="font-display text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
