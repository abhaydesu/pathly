import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Link as LinkIcon, Loader2 } from "lucide-react";
import type { LinkData } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type AnalyticsData = {
  totalClicks: number;
  clicksOverTime: { _id: string; count: number }[];
};

const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
} as const;

export function MyLinks() {
  const [myLinks, setMyLinks] = useState<LinkData[]>([]);
  const [selectedLink, setSelectedLink] = useState<LinkData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedLinksRaw = localStorage.getItem("myLinks");
    const storedLinks = JSON.parse(storedLinksRaw || "[]");
    setMyLinks(storedLinks);
  }, []);

  const fetchAnalytics = async (shortId: string) => {
    setSelectedLink(myLinks.find((l) => l.shortId === shortId) || null);
    setLoading(true);
    setAnalytics(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/analytics/${shortId}`
      );
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (myLinks.length === 0) {
    return (
      <div className="w-full md:mt-10 bg-black flex justify-center p-2 bg-yellow-950/30 border border-neutral-500/30">
        <Card className="max-w-3xl w-full bg-neutral-900 backdrop-blur-sm border-neutral-500/30 shadow-[0_0_20px_theme(colors.neutral.500/20)]">
          <CardHeader>
            <CardTitle className="text-2xl text-neutral-300">
              You haven&apos;t created any links yet!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-neutral-400">
            Create your first short link to see it here.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full md:mt-10 bg-black flex justify-center p-2 bg-yellow-950/30 border border-neutral-500/30">
      <Card className="max-w-6xl w-full bg-neutral-900 backdrop-blur-sm border-neutral-500/30 shadow-[0_0_20px_theme(colors.neutral.500/20)]">
        <CardHeader>
          <CardTitle className="text-2xl text-neutral-300">My Links & Analytics</CardTitle>
        </CardHeader>

        <CardContent className=" overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="flex flex-col rounded-md border border-neutral-700 bg-neutral-800/50 p-3 ">
                <p className="mb-3 flex items-center gap-2 text-neutral-300">
                  <LinkIcon className="h-4 w-4" />
                  <span className="font-medium">My Links</span>
                </p>

                <ul className="flex mx-2 flex-col gap-2 overflow-y-auto min-h-0 pr-2 flex-1">
                  {myLinks.map((link) => {
                    const isActive = selectedLink?.shortId === link.shortId;
                    return (
                      <button
                        key={link.shortId}
                        onClick={() => fetchAnalytics(link.shortId)}
                        className={[
                          "w-full text-left p-3 rounded-md truncate transition-all duration-300",
                          "border border-neutral-700/50 bg-neutral-900/60 hover:bg-yellow-800/20",
                          isActive
                            ? "border border-yellow-700/60"
                            : "",
                        ].join(" ")}
                      >
                        <p className="font-mono text-sm text-neutral-200">
                          {link.shortId}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {link.originalUrl}
                        </p>
                      </button>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Analytics Display */}
            <div className="md:col-span-2">
              <div className="rounded-md border border-neutral-700 bg-neutral-800/50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-yellow-500" />
                    <p className="text-neutral-300 font-semibold">Analytics</p>
                  </div>

                  {selectedLink && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedLink(null)}
                      className="h-9 border-neutral-700 text-neutral-300 hover:bg-yellow-800 hover:text-neutral-100"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {!selectedLink ? (
                    <motion.div
                      key="placeholder"
                      variants={containerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="text-neutral-400"
                    >
                      Select a link on the left to view its stats.
                    </motion.div>
                  ) : loading ? (
                    <motion.div
                      key="loading"
                      variants={containerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex items-center gap-2 text-neutral-300"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </motion.div>
                  ) : analytics ? (
                    <motion.div
                      key="analytics"
                      variants={containerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="flex flex-col gap-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-md border border-neutral-700 bg-neutral-900/60 p-4">
                          <p className="text-neutral-400">Short ID</p>
                          <p className="text-2xl font-bold text-neutral-200 font-mono">
                            {selectedLink.shortId}
                          </p>
                        </div>
                        <div className="rounded-md border border-neutral-700 bg-neutral-900/60 p-4">
                          <p className="text-neutral-400">Total Clicks</p>
                          <p className="text-4xl font-bold text-neutral-200">
                            {analytics.totalClicks}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold mb-2 text-neutral-300">
                          Clicks Over Time
                        </p>
                        <div className="h-[300px] rounded-md border border-neutral-700 bg-neutral-900/60 p-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={analytics.clicksOverTime}
                              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="_id" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="count" name="Clicks" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-data"
                      variants={containerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="text-neutral-400"
                    >
                      No analytics available for this link yet.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}