import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link as LinkIcon, Loader2, MousePointerClick } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buttonClasses } from "@/components/ui/button-variants";
import { HatchPattern } from "@/components/ui/dots";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { LinkData } from "@/types";

type AnalyticsData = {
  totalClicks: number;
  clicksOverTime: { _id: string; count: number }[];
};

const CHART_COLOR = "#2667ff";

const cardClass =
  "rounded-2xl bg-white shadow-sm shadow-black/10 ring-1 ring-black/10 dark:bg-neutral-900 dark:shadow-black/40 dark:ring-white/10";
const eyebrowClass = "text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400";

const isExpired = (link: LinkData) => !!link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now();

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

function StatCard({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className={cn(cardClass, "p-5")}>
      <p className={eyebrowClass}>{label}</p>
      <p className={cn("mt-2 truncate text-2xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100", mono && "font-mono text-xl")}>
        {value}
      </p>
    </div>
  );
}

// Highlighted stat, in the brand gradient with a white hatch
function PrimaryStatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-b from-tertiary to-primary p-5 text-white shadow-sm shadow-primary/30 ring-1 ring-white/20 ring-inset">
      <HatchPattern className="opacity-30 [--pattern-fg:rgb(255_255_255/0.12)]" />
      <p className="relative text-xs font-medium tracking-wide text-white/80 uppercase">{label}</p>
      <p className="relative mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-md shadow-black/10 ring-1 ring-black/10 dark:bg-neutral-900 dark:ring-white/10">
      <p className="font-mono text-neutral-500">{label}</p>
      <p className="mt-0.5 font-medium text-neutral-900 dark:text-neutral-100">
        {payload[0].value} click{payload[0].value === 1 ? "" : "s"}
      </p>
    </div>
  );
}

// What the analytics panel is currently showing. Kept separate from the selected link so the
// previous result stays on screen (dimmed) while the next one loads, instead of collapsing.
type PanelView = { link: LinkData; analytics: AnalyticsData | null; error: string | null };

const formatCreated = (link: LinkData) =>
  new Date(link.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function MyLinks({ refreshKey }: { refreshKey?: number }) {
  const [myLinks, setMyLinks] = useState<LinkData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<PanelView | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(new Map<string, AnalyticsData>());
  const requestRef = useRef<AbortController | null>(null);
  const isDark = useTheme().theme === "dark";
  const axisColor = isDark ? "#a3a3a3" : "#737373";

  useEffect(() => {
    setMyLinks(JSON.parse(localStorage.getItem("myLinks") || "[]"));
  }, [refreshKey]);

  useEffect(() => () => requestRef.current?.abort(), []);

  const selectLink = async (link: LinkData) => {
    setSelectedId(link.shortId);
    // Show cached numbers straight away, then refresh them in the background
    const cached = cacheRef.current.get(link.shortId);
    if (cached) setView({ link, analytics: cached, error: null });

    // Only the latest click may update the panel
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analytics/${link.shortId}`, {
        signal: request.signal,
      });
      if (res.ok) {
        const data: AnalyticsData = await res.json();
        cacheRef.current.set(link.shortId, data);
        setView({ link, analytics: data, error: null });
      } else {
        const error =
          res.status === 404
            ? "This link no longer exists. It may have expired."
            : "Couldn't load analytics. Please try again.";
        setView({ link, analytics: null, error });
      }
    } catch {
      if (request.signal.aborted) return;
      setView({ link, analytics: null, error: "Couldn't reach the server. Please try again." });
    }
    if (requestRef.current === request) setLoading(false);
  };

  const clearSelection = () => {
    requestRef.current?.abort();
    setSelectedId(null);
    setView(null);
    setLoading(false);
  };

  if (myLinks.length === 0) {
    return (
      <div className="relative border-y border-neutral-200 px-4 py-16 [--pattern-fg:rgb(10_10_10/0.05)] md:py-20 dark:border-neutral-800 dark:[--pattern-fg:rgb(255_255_255/0.05)]">
        <HatchPattern />
        <div className={cn(cardClass, "relative mx-auto max-w-sm p-8 text-center")}>
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-neutral-100 shadow-sm shadow-black/10 ring-1 ring-black/10 dark:bg-neutral-800 dark:ring-white/10">
            <LinkIcon className="size-4 text-neutral-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">No links yet</h3>
          <p className="mt-1 text-sm text-neutral-500">Create your first short link to see its analytics here.</p>
          <a href="#create" className={buttonClasses("primary", "mt-6")}>
            Create a link
          </a>
        </div>
      </div>
    );
  }

  const analytics = view?.analytics;
  // Dim the current result while a different link (or a refresh) is loading
  const stale = loading && (!analytics || view?.link.shortId !== selectedId);

  let chartBody: React.ReactNode;
  if (analytics) {
    chartBody =
      analytics.clicksOverTime.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-neutral-400">No clicks yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analytics.clicksOverTime} margin={{ top: 5, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={isDark ? "#262626" : "#e5e5e5"} strokeDasharray="2 4" />
            <XAxis
              dataKey="_id"
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor, fontSize: 11 }}
              tickFormatter={(d: string) => d.slice(5)}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: axisColor, fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: isDark ? "#404040" : "#d4d4d4" }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={CHART_COLOR}
              strokeWidth={2}
              fill="url(#clicksFill)"
              dot={{ r: 3, fill: CHART_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: CHART_COLOR, stroke: isDark ? "#171717" : "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
  } else if (view?.error) {
    chartBody = <p className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-500">{view.error}</p>;
  } else if (loading) {
    chartBody = (
      <p className="flex h-full items-center justify-center gap-2 text-sm text-neutral-500">
        <Loader2 className="size-4 animate-spin text-primary" />
        Loading…
      </p>
    );
  } else {
    chartBody = (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-neutral-500">
        <span className="flex size-10 items-center justify-center rounded-lg bg-neutral-100 shadow-sm shadow-black/10 ring-1 ring-black/10 dark:bg-neutral-800 dark:ring-white/10">
          <MousePointerClick className="size-4 text-neutral-500" />
        </span>
        Select a link to see its stats.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 border-y border-neutral-200 md:grid-cols-3 dark:border-neutral-800">
      {/* Link list */}
      <div className="flex flex-col border-b border-neutral-200 p-4 md:max-h-[640px] md:border-r md:border-b-0 md:p-6 dark:border-neutral-800">
        <p className="mb-2 flex items-center px-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          My links
          <span className="ml-auto rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-500 ring-1 ring-black/5 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-white/10">
            {myLinks.length}
          </span>
        </p>

        {/* Padding inside the scroll area (offset by negative margin) so the active item's ring and shadow aren't clipped */}
        <ul className="-mr-3 -ml-1 flex max-h-72 flex-col gap-1 overflow-y-auto py-1.5 pr-3 pl-1 md:max-h-none md:flex-1">
          {myLinks.map((link) => {
            const isActive = selectedId === link.shortId;
            return (
              <li key={link.shortId}>
                <button
                  onClick={() => selectLink(link)}
                  aria-pressed={isActive}
                  className={cn(
                    "w-full cursor-pointer rounded-xl p-3 text-left transition-colors",
                    isActive
                      ? "bg-white shadow-sm shadow-black/10 ring-1 ring-black/10 dark:bg-neutral-900 dark:ring-white/10"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-900/60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isActive && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                    <p
                      className={cn(
                        "truncate font-mono text-sm",
                        isActive ? "text-primary dark:text-tertiary" : "text-neutral-800 dark:text-neutral-200"
                      )}
                    >
                      /{link.shortId}
                    </p>
                    {isExpired(link) && (
                      <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-px text-[10px] font-medium text-neutral-500 ring-1 ring-black/5 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-white/10">
                        expired
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">{hostOf(link.originalUrl)}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Analytics: one fixed layout; only the values inside it change */}
      <div className="relative p-4 [--pattern-fg:rgb(10_10_10/0.05)] md:col-span-2 md:p-6 dark:[--pattern-fg:rgb(255_255_255/0.05)]">
        <HatchPattern />

        <div className={cn("relative flex flex-col gap-4 transition-opacity duration-200", stale && "opacity-60")}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <PrimaryStatCard label="Total clicks" value={analytics?.totalClicks ?? "—"} />
            <StatCard label="Created" value={view ? formatCreated(view.link) : "—"} />
            <div className="col-span-2 sm:col-span-1">
              <StatCard label="Short link" value={view ? `/${view.link.shortId}` : "—"} mono />
            </div>
          </div>

          <div className={cn(cardClass, "p-5")}>
            <div className="mb-4 flex h-6 items-center justify-between">
              <p className={cn(eyebrowClass, "flex items-center gap-2")}>
                Clicks per day
                {loading && view && <Loader2 className="size-3.5 animate-spin text-primary" />}
              </p>
              {selectedId && (
                <button
                  onClick={clearSelection}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                >
                  Clear
                </button>
              )}
            </div>
            {/* Fade in each new link's result in place; no exit animation, so the panel never collapses */}
            <motion.div
              key={view ? `${view.link.shortId}-${view.analytics ? "data" : "error"}` : loading ? "loading" : "empty"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="h-56"
            >
              {chartBody}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
