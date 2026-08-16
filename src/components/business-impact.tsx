import { ArrowUpRight, BadgeIndianRupee, Briefcase, LineChart, ShieldCheck } from "lucide-react";
import { compactINR, type BusinessCase, type LiveSignal } from "@/lib/live-trends";

export function BusinessImpact({
  name,
  bc,
  signal,
}: {
  name: string;
  bc: BusinessCase;
  signal: LiveSignal;
}) {
  const verdictTone =
    bc.verdict === "Invest now"
      ? "text-emerald-300 bg-emerald-400/10"
      : bc.verdict === "Scale gradually"
        ? "text-amber-300 bg-amber-400/10"
        : "text-muted-foreground bg-white/5";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Briefcase className="h-3.5 w-3.5 text-primary" />
          Business opportunity
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${verdictTone}`}>
          {bc.verdict}
        </span>
      </div>

      <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
        If you invest in {name}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{bc.headline}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric
          icon={BadgeIndianRupee}
          label="Projected monthly revenue"
          value={compactINR(bc.projectedMonthlyRevenue)}
        />
        <Metric
          icon={LineChart}
          label="Projected monthly profit"
          value={compactINR(bc.projectedMonthlyProfit)}
        />
        <Metric icon={ArrowUpRight} label="Return on investment" value={`${bc.roiPct}%`} />
        <Metric icon={ShieldCheck} label="Payback period" value={`${bc.paybackDays} days`} />
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <Row label="Recommended inventory spend" value={compactINR(bc.recommendedInvestment)} />
        <Row label="Gross margin" value={`${bc.grossMarginPct}%`} />
        <Row label="Demand confidence" value={`${bc.demandConfidencePct}%`} />
        <Row label="Live units / hour (market)" value={signal.unitsPerHour.toLocaleString("en-IN")} />
        <Row
          label="Stock-out pressure"
          value={`${signal.stockPressure}% — ${signal.stockPressure > 70 ? "restock early" : "comfortable"}`}
        />
      </dl>

      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Company upside: at this demand curve a retailer listing {name} lifts category revenue by
        roughly {Math.max(3, Math.round(bc.roiPct / 12))}% and improves sell-through by{" "}
        {Math.round(bc.demandConfidencePct / 6)}%, because acquisition cost falls when the product
        is already the one people are searching for.
      </p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 font-display text-lg font-semibold">{value}</div>
      <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
