import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Search,
  Shirt,
  Laptop,
  Sparkle,
  Home,
  Dumbbell,
  Baby,
  Gamepad2,
  BookOpen,
  Flame,
  ArrowUpRight,
  Star,
  Zap,
  Activity,
  Radio,
} from "lucide-react";
import {
  businessCase,
  currentHourBucket,
  hourlySeries,
  liveSignal,
  parsePrice,
  compactINR,
  HOUR_MS,
  type LiveSignal,
} from "@/lib/live-trends";
import { BusinessImpact } from "@/components/business-impact";
import { DailyReport, type ReportRow } from "@/components/daily-report";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRENSEE — Live Hourly Product Trends & Investment Reports" },
      {
        name: "description",
        content:
          "TRENSEE tracks trending products across Amazon, Flipkart, Myntra and more every hour, then delivers a daily report with revenue, profit and ROI potential for businesses.",
      },
      {
        property: "og:title",
        content: "TRENSEE — Live Hourly Product Trends & Investment Reports",
      },
      {
        property: "og:description",
        content:
          "Hourly trend refreshes, end-of-day digests, and business ROI projections for every trending product.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Domain = {
  id: string;
  label: string;
  icon: typeof Shirt;
  hue: string;
};

const DOMAINS: Domain[] = [
  { id: "fashion", label: "Fashion", icon: Shirt, hue: "from-fuchsia-500 to-pink-500" },
  { id: "electronics", label: "Electronics", icon: Laptop, hue: "from-cyan-400 to-blue-500" },
  { id: "beauty", label: "Beauty", icon: Sparkle, hue: "from-rose-400 to-pink-500" },
  { id: "home", label: "Home & Living", icon: Home, hue: "from-amber-400 to-orange-500" },
  { id: "fitness", label: "Fitness", icon: Dumbbell, hue: "from-emerald-400 to-teal-500" },
  { id: "kids", label: "Kids", icon: Baby, hue: "from-yellow-400 to-orange-400" },
  { id: "gaming", label: "Gaming", icon: Gamepad2, hue: "from-violet-500 to-indigo-500" },
  { id: "books", label: "Books", icon: BookOpen, hue: "from-lime-400 to-emerald-500" },
];

type Product = {
  name: string;
  brand: string;
  price: string;
  original?: string;
  rating: number;
  reviews: number;
  source: string;
  trend: number; // 0-100
  velocity: string; // eg "+142%"
  image: string;
  reason: string;
};

const CATALOG: Record<string, Product[]> = {
  fashion: [
    { name: "Oversized Wool Blazer", brand: "Zara", price: "₹4,999", original: "₹7,499", rating: 4.7, reviews: 2841, source: "Myntra", trend: 96, velocity: "+184%", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80", reason: "Surging with women 22-30 in metros this week." },
    { name: "Chunky Leather Loafers", brand: "H&M", price: "₹3,299", rating: 4.6, reviews: 1204, source: "Ajio", trend: 92, velocity: "+121%", image: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80", reason: "Matches your recent boot browsing history." },
    { name: "Cargo Wide-Leg Denim", brand: "Levi's", price: "₹2,799", original: "₹3,999", rating: 4.5, reviews: 3910, source: "Flipkart", trend: 89, velocity: "+96%", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80", reason: "Top pick in your cluster: streetwear-first shoppers." },
    { name: "Silk Slip Midi Dress", brand: "Mango", price: "₹5,499", rating: 4.8, reviews: 892, source: "Nykaa Fashion", trend: 87, velocity: "+78%", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80", reason: "Trending among premium evening-wear buyers." },
  ],
  electronics: [
    { name: "MacBook Air M3 13\"", brand: "Apple", price: "₹1,04,900", rating: 4.9, reviews: 5210, source: "Apple Store", trend: 98, velocity: "+212%", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80", reason: "Hottest laptop launch across student segment." },
    { name: "Sony WH-1000XM6", brand: "Sony", price: "₹34,990", original: "₹39,990", rating: 4.8, reviews: 12480, source: "Amazon", trend: 95, velocity: "+167%", image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80", reason: "Recommended based on your podcast listening pattern." },
    { name: "iPhone 17 Pro", brand: "Apple", price: "₹1,34,900", rating: 4.9, reviews: 9821, source: "Croma", trend: 99, velocity: "+340%", image: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=800&q=80", reason: "#1 trending nationally in the last 6 hours." },
    { name: "Boat Airdopes Genesis", brand: "Boat", price: "₹1,499", original: "₹3,990", rating: 4.4, reviews: 21044, source: "Flipkart", trend: 84, velocity: "+64%", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80", reason: "Best-value pick in your budget cluster." },
  ],
  beauty: [
    { name: "Vitamin C Glow Serum", brand: "Minimalist", price: "₹699", rating: 4.7, reviews: 8420, source: "Nykaa", trend: 94, velocity: "+152%", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80", reason: "Trending among 18–25 skincare enthusiasts." },
    { name: "Matte Liquid Lipstick", brand: "Sugar", price: "₹499", rating: 4.6, reviews: 5210, source: "Myntra", trend: 88, velocity: "+91%", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80", reason: "Matches your favorite shade family: warm nudes." },
    { name: "Retinol Night Cream", brand: "The Ordinary", price: "₹1,290", rating: 4.8, reviews: 3891, source: "Nykaa", trend: 90, velocity: "+108%", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80", reason: "Users like you re-purchase this every 6 weeks." },
    { name: "Rose Gold Fragrance", brand: "Bella Vita", price: "₹899", rating: 4.5, reviews: 2104, source: "Amazon", trend: 82, velocity: "+58%", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80", reason: "Rising gift pick for the festive week." },
  ],
  home: [
    { name: "Linen Duvet Set", brand: "House of Nomad", price: "₹4,499", rating: 4.7, reviews: 1204, source: "Amazon", trend: 91, velocity: "+119%", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80", reason: "Winter bedding surge in your city." },
    { name: "Ceramic Table Lamp", brand: "Urban Ladder", price: "₹2,899", rating: 4.6, reviews: 682, source: "Reliance Trends", trend: 86, velocity: "+72%", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80", reason: "Fits your minimalist decor cluster." },
    { name: "Bamboo Coffee Table", brand: "Wakefit", price: "₹6,999", rating: 4.5, reviews: 421, source: "Flipkart", trend: 78, velocity: "+41%", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80", reason: "Popular with first-apartment buyers." },
    { name: "Aroma Diffuser", brand: "Forest Essentials", price: "₹1,499", rating: 4.8, reviews: 3120, source: "Nykaa", trend: 84, velocity: "+63%", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80", reason: "Frequently bought with your recent skincare views." },
  ],
  fitness: [
    { name: "Nike Pegasus 41", brand: "Nike", price: "₹9,995", rating: 4.8, reviews: 4820, source: "Nike", trend: 93, velocity: "+134%", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80", reason: "Best-seller among daily-runner segment." },
    { name: "Adidas Ultraboost 5", brand: "Adidas", price: "₹15,999", rating: 4.7, reviews: 2140, source: "Adidas", trend: 89, velocity: "+95%", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80", reason: "Premium alt-pick in your running cluster." },
    { name: "Whey Isolate 2kg", brand: "MyProtein", price: "₹3,499", rating: 4.6, reviews: 8210, source: "Amazon", trend: 85, velocity: "+68%", image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&q=80", reason: "Restock reminder — 82% of similar users re-buy now." },
    { name: "Smart Fitness Band", brand: "Boat", price: "₹1,999", original: "₹3,999", rating: 4.4, reviews: 15210, source: "Flipkart", trend: 80, velocity: "+52%", image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&q=80", reason: "Budget pick with best rating in category." },
  ],
  kids: [
    { name: "STEM Building Blocks", brand: "Funskool", price: "₹1,299", rating: 4.7, reviews: 1820, source: "Amazon", trend: 87, velocity: "+81%", image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80", reason: "Top-gifted this week for ages 4–8." },
    { name: "Kids Winter Jacket", brand: "H&M", price: "₹1,799", rating: 4.5, reviews: 620, source: "Myntra", trend: 82, velocity: "+59%", image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80", reason: "Seasonal surge — cold wave alerts." },
    { name: "Illustrated Story Set", brand: "Puffin", price: "₹999", rating: 4.9, reviews: 3210, source: "Amazon", trend: 84, velocity: "+66%", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80", reason: "Best-reviewed bedtime pick." },
    { name: "Sneakers Kids", brand: "Puma", price: "₹1,599", rating: 4.4, reviews: 480, source: "Ajio", trend: 76, velocity: "+38%", image: "https://images.unsplash.com/photo-1514989940723-e8e51635289c?w=800&q=80", reason: "Refreshed pick for school-run parents." },
  ],
  gaming: [
    { name: "PS5 Slim Bundle", brand: "Sony", price: "₹49,990", rating: 4.9, reviews: 6210, source: "Croma", trend: 97, velocity: "+201%", image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80", reason: "Console launch week — highest velocity nationally." },
    { name: "Mechanical Keyboard TKL", brand: "Keychron", price: "₹8,499", rating: 4.8, reviews: 2140, source: "Amazon", trend: 90, velocity: "+112%", image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80", reason: "Loved by your competitive-gamer cluster." },
    { name: "Gaming Chair RGB", brand: "Green Soul", price: "₹14,999", rating: 4.6, reviews: 1820, source: "Flipkart", trend: 85, velocity: "+71%", image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&q=80", reason: "Frequent bundle with recent monitor views." },
    { name: "Wireless Controller", brand: "Xbox", price: "₹5,499", rating: 4.7, reviews: 4820, source: "Amazon", trend: 82, velocity: "+55%", image: "https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=800&q=80", reason: "Compatible with your existing setup." },
  ],
  books: [
    { name: "Tomorrow, and Tomorrow", brand: "Vintage", price: "₹399", rating: 4.7, reviews: 8420, source: "Amazon", trend: 88, velocity: "+93%", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80", reason: "Trending in your literary-fiction cluster." },
    { name: "Atomic Habits (HB)", brand: "Random House", price: "₹499", rating: 4.9, reviews: 42100, source: "Flipkart", trend: 91, velocity: "+118%", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80", reason: "Perennial top-seller — restocked this week." },
    { name: "Deep Work", brand: "Grand Central", price: "₹349", rating: 4.8, reviews: 12800, source: "Amazon", trend: 86, velocity: "+74%", image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80", reason: "Matches your productivity reading pattern." },
    { name: "The Let Them Theory", brand: "Hay House", price: "₹450", rating: 4.6, reviews: 3210, source: "Amazon", trend: 83, velocity: "+62%", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80", reason: "Rising fast in self-help this month." },
  ],
};

/** Client-only countdown — never rendered on the server, so no hydration mismatch. */
function HourCountdown() {
  const [label, setLabel] = useState("--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(now.getHours() + 1, 0, 0, 0);
      const diff = Math.max(0, next.getTime() - now.getTime());
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return <ClientOnly fallback={<span>--:--</span>}><span>{label}</span></ClientOnly>;
}

/** Rolls forward on the hour so the entire board refreshes automatically. */
function useHourBucket() {
  const [bucket, setBucket] = useState(() => currentHourBucket());
  useEffect(() => {
    const t = setInterval(() => setBucket(currentHourBucket()), 15_000);
    return () => clearInterval(t);
  }, []);
  return bucket;
}

type LiveProduct = Product & {
  domain: string;
  signal: LiveSignal;
  bc: ReturnType<typeof businessCase>;
};

function buildLive(domain: string, list: Product[], bucket: number): LiveProduct[] {
  return list
    .map((p) => {
      const signal = liveSignal(p.name, p.trend, p.rating, bucket);
      return {
        ...p,
        domain,
        signal,
        bc: businessCase(p.name, parsePrice(p.price), signal, bucket),
      };
    })
    .sort((a, b) => b.signal.trend - a.signal.trend);
}

function Index() {
  const [active, setActive] = useState<string>("fashion");
  const [query, setQuery] = useState("");
  const bucket = useHourBucket();

  const products = useMemo(() => {
    const list = buildLive(active, CATALOG[active] ?? [], bucket);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.source.toLowerCase().includes(q),
    );
  }, [active, query, bucket]);

  const topPick = products[0];

  const reportRows = useMemo<ReportRow[]>(() => {
    return Object.entries(CATALOG)
      .flatMap(([domain, list]) => buildLive(domain, list, bucket))
      .map((p) => ({
        name: p.name,
        brand: p.brand,
        domain: p.domain,
        trend: p.signal.trend,
        delta: p.signal.delta,
        velocityPct: p.signal.velocityPct,
        unitsPerHour: p.signal.unitsPerHour,
        revenue: p.bc.projectedMonthlyRevenue,
        profit: p.bc.projectedMonthlyProfit,
        roiPct: p.bc.roiPct,
        verdict: p.bc.verdict,
      }))
      .sort((a, b) => b.trend - a.trend);
  }, [bucket]);

  const reportSeries = useMemo(() => {
    const keys = Object.values(CATALOG).flat();
    const perProduct = keys.map((p) => hourlySeries(p.name, p.trend, bucket));
    return perProduct[0].map((_, i) => ({
      hour: perProduct[0][i].hour,
      trend: Math.round((perProduct.reduce((s, s2) => s + s2[i].trend, 0) / perProduct.length) * 10) / 10,
      units: perProduct.reduce((s, s2) => s + s2[i].units, 0),
    }));
  }, [bucket]);

  const dateLabel = useMemo(
    () =>
      new Date(bucket * HOUR_MS).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [bucket],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Ambient gradient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
        }}
      />

      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">TRENSEE</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#trending" className="transition hover:text-foreground">Trending</a>
          <a href="#how" className="transition hover:text-foreground">How it works</a>
          <a href="#report" className="transition hover:text-foreground">Daily report</a>
          <a href="#insights" className="transition hover:text-foreground">Insights</a>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md md:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live · refresh in <HourCountdown />
          </div>
          <button
            className="rounded-full px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-glow)] transition hover:brightness-110"
            style={{ background: "var(--gradient-primary)" }}
          >
            Get started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
            <Radio className="h-3.5 w-3.5 text-primary" />
            Streaming trends from 17 stores · updated hourly
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            See what the world is
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              buying right now.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            TRENSEE reads live signals from Amazon, Flipkart, Myntra, Nykaa, Croma and
            a dozen more — then ranks what's actually trending for you, powered by
            deep behavioral AI.
          </p>

          {/* Search */}
          <div className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl">
            <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: trending shoes under ₹3000 · gaming laptops for students"
              className="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button
              className="rounded-xl px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
              style={{ background: "var(--gradient-primary)" }}
            >
              Ask AI
            </button>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { k: "17", v: "Stores tracked" },
              { k: "2.4M", v: "Products indexed" },
              { k: "hourly", v: "Trend refresh" },
              { k: "94%", v: "Match accuracy" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className="font-display text-2xl font-semibold">{s.k}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domain selector */}
      <section id="trending" className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-[color:var(--accent-pink)]" />
              Pick a domain
            </div>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              What's trending in{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {DOMAINS.find((d) => d.id === active)?.label}
              </span>
            </h2>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <Activity className="h-3.5 w-3.5 text-emerald-400" /> Auto-updating · next refresh in <HourCountdown />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => {
            const Icon = d.icon;
            const isActive = d.id === active;
            return (
              <button
                key={d.id}
                onClick={() => setActive(d.id)}
                className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  isActive
                    ? "border-transparent text-white shadow-[var(--shadow-glow)]"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                }`}
                style={
                  isActive ? { background: "var(--gradient-primary)" } : undefined
                }
              >
                <Icon className="h-4 w-4" />
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Top pick spotlight */}
        {topPick && (
          <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <img
                src={topPick.image}
                alt={topPick.name}
                className="h-72 w-full object-cover transition duration-700 group-hover:scale-105 md:h-96"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-white backdrop-blur-md">
                <Flame className="h-3 w-3 text-[color:var(--accent-pink)]" /> #1 Trending now
              </div>
              <div className="absolute inset-x-6 bottom-6">
                <div className="text-xs text-muted-foreground">{topPick.brand} · {topPick.source}</div>
                <div className="mt-1 font-display text-2xl font-semibold md:text-3xl">{topPick.name}</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-lg font-semibold">{topPick.price}</span>
                  {topPick.original && (
                    <span className="text-sm text-muted-foreground line-through">
                      {topPick.original}
                    </span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-400">
                    <TrendingUp className="h-3 w-3" /> +{topPick.signal.velocityPct}%
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Why this is trending
              </div>
              <p className="mt-3 text-base leading-relaxed text-foreground/90">
                {topPick.reason}
              </p>
              <div className="mt-6 space-y-3">
                <SignalRow label="Search velocity" value={topPick.signal.searchVelocity} />
                <SignalRow label="Wishlist adds" value={topPick.signal.wishlistAdds} />
                <SignalRow label="Cross-store demand" value={topPick.signal.crossStoreDemand} />
                <SignalRow label="Sentiment score" value={topPick.signal.sentiment} />
              </div>
              <button
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-[var(--shadow-glow)] transition hover:brightness-110"
                style={{ background: "var(--gradient-primary)" }}
              >
                View on {topPick.source} <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Business case for the top pick */}
        {topPick && (
          <div className="mt-6">
            <BusinessImpact name={topPick.name} bc={topPick.bc} signal={topPick.signal} />
          </div>
        )}

        {/* Product grid */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(1).map((p) => (
            <ProductCard key={p.name} p={p} />
          ))}
          {products.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-muted-foreground">
              No products match "{query}" in this domain yet.
            </div>
          )}
        </div>
      </section>

      <DailyReport dateLabel={dateLabel} series={reportSeries} rows={reportRows} />

      {/* Insights */}
      <section id="insights" className="mx-auto mt-24 max-w-7xl px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: TrendingUp,
              title: "Real-time trend scoring",
              body: "We stream signals from 17 stores every hour — search velocity, wishlist adds, review sentiment, and demand — into a single trend score.",
            },
            {
              icon: Zap,
              title: "Behavioral clustering",
              body: "Deep Embedded Clustering finds the segment you actually belong to, not the one a marketer guessed. Recommendations follow.",
            },
            {
              icon: Sparkles,
              title: "Explainable picks",
              body: "Every product tells you why it's here — the cluster, the signal, the moment. No black boxes.",
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
              >
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="font-display text-lg font-semibold">{f.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stores */}
      <section id="how" className="mx-auto mt-24 max-w-7xl px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl md:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Stores we listen to
              </div>
              <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                One index across every major store.
              </h3>
            </div>
            <div className="text-sm text-muted-foreground">
              Refreshed hourly · deduped · price-normalized
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
            {[
              "Amazon","Flipkart","Myntra","Ajio","Nykaa","Meesho","Reliance","Croma","Apple","Nike","Adidas","Puma","Boat","Samsung","OnePlus",
            ].map((s) => (
              <div
                key={s}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-muted-foreground transition hover:border-white/25 hover:text-foreground"
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TRENSEE · Personalized Product Discovery
      </footer>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: "var(--gradient-primary)" }}
        />
      </div>
    </div>
  );
}

function ProductCard({ p }: { p: LiveProduct }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition hover:border-white/25 hover:shadow-[var(--shadow-card)]">
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-white backdrop-blur-md">
          <Flame className="h-3 w-3 text-[color:var(--accent-pink)]" /> {p.signal.trend}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-medium text-emerald-300 backdrop-blur-md">
          +{p.signal.velocityPct}%
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {p.brand} · {p.source}
        </div>
        <div className="mt-1 line-clamp-2 font-medium">{p.name}</div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {p.rating}
          <span>·</span>
          <span>{p.reviews.toLocaleString()} reviews</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-semibold">{p.price}</span>
          {p.original && (
            <span className="text-xs text-muted-foreground line-through">{p.original}</span>
          )}
        </div>
        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.reason}</p>
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Profit potential / mo</span>
            <span className="font-medium">{compactINR(p.bc.projectedMonthlyProfit)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">ROI</span>
            <span className="font-medium text-emerald-300">{p.bc.roiPct}%</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Verdict</span>
            <span className="font-medium">{p.bc.verdict}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
