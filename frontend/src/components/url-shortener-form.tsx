import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown, Copy, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { LinkData } from "@/types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const EXPIRY_OPTIONS = [
  { label: "Never", ms: null },
  { label: "1 hour", ms: HOUR },
  { label: "1 day", ms: DAY },
  { label: "7 days", ms: 7 * DAY },
  { label: "30 days", ms: 30 * DAY },
] as const;

const containerVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" } },
} as const;

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {children}
    </label>
  );
}

// Matches a URL scheme like "https://" or "mailto:", but not a port ("google.com:8080")
const SCHEME = /^[a-z][a-z\d+.-]*:(?!\d)/i;

// Accept bare domains like "google.com" by assuming https://. Returns null if the input
// clearly isn't a web address. Other schemes are passed through for the backend to reject.
function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const { protocol, hostname } = new URL(withScheme);
    const isWeb = protocol === "http:" || protocol === "https:";
    // A bare word like "hello" parses as https://hello, so also require a dotted hostname
    if (isWeb && !hostname.includes(".")) return null;
    return withScheme;
  } catch {
    return null;
  }
}

function saveToMyLinks(link: LinkData) {
  const myLinks: LinkData[] = JSON.parse(localStorage.getItem("myLinks") || "[]");
  if (!myLinks.some((l) => l.shortId === link.shortId)) {
    myLinks.unshift(link);
    localStorage.setItem("myLinks", JSON.stringify(myLinks));
  }
}

export function UrlShortenerForm({ onCreated }: { onCreated?: () => void }) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiryMs, setExpiryMs] = useState<number | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [shortUrl, setShortUrl] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const normalizedUrl = normalizeUrl(originalUrl);
  const addedScheme = normalizedUrl !== null && normalizedUrl !== originalUrl.trim();
  const fullShortUrl = shortUrl ? `${import.meta.env.VITE_API_BASE_URL}/${shortUrl.shortId}` : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullShortUrl);
    setIsCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = () => {
    setShortUrl(null);
    setOriginalUrl("");
    setCustomAlias("");
    setExpiryMs(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const url = normalizeUrl(originalUrl);
    if (!url) {
      setError("Enter a valid URL, like example.com");
      return;
    }

    setLoading(true);
    const alias = customAlias.trim();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: url,
          ...(alias && { customAlias: alias }),
          ...(expiryMs && { expiresAt: new Date(Date.now() + expiryMs).toISOString() }),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        const message = data.error || "Failed to shorten URL.";
        setError(message);
        toast.error(message);
        return;
      }

      setShortUrl(data);
      saveToMyLinks(data);
      onCreated?.();
      toast.success("Link created");
    } catch (error) {
      console.error("Error while shortening link:", error);
      const message = "Couldn't reach the server. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-left shadow-sm shadow-black/10 ring-1 ring-black/10 sm:p-8 dark:bg-neutral-900 dark:shadow-black/40 dark:ring-white/10">
      <AnimatePresence mode="wait" initial={false}>
        {!shortUrl ? (
          <motion.div key="form" variants={containerVariants} initial="initial" animate="animate" exit="exit">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">Create a short link</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Paste a long URL and get a link you can share.</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="originalUrl">Destination URL</Label>
                {/* type="text" so the browser doesn't reject bare domains; inputMode keeps the URL keyboard on phones */}
                <Input
                  id="originalUrl"
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="your-super-long-url.com/goes-here"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  aria-describedby={addedScheme ? "originalUrl-hint" : undefined}
                  required
                />
                {addedScheme && (
                  <p id="originalUrl-hint" className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                    Will shorten <span className="font-mono text-neutral-500 dark:text-neutral-400">{normalizedUrl}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowOptions((v) => !v)}
                className="flex w-fit cursor-pointer items-center gap-1 text-xs font-medium text-neutral-500 transition hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                aria-expanded={showOptions}
              >
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showOptions && "rotate-180")} />
                Custom alias &amp; expiry
              </button>

              <AnimatePresence initial={false}>
                {showOptions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="-mx-1 overflow-hidden px-1"
                  >
                    <div className="flex flex-col gap-5 pt-1 pb-1">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="customAlias">Custom alias</Label>
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 font-mono text-sm text-neutral-400">/</span>
                          <div className="flex-1">
                            <Input
                              id="customAlias"
                              placeholder="my-link"
                              value={customAlias}
                              onChange={(e) => setCustomAlias(e.target.value)}
                              pattern="[A-Za-z0-9_\-]{3,30}"
                              title="3-30 characters: letters, numbers, - or _"
                              className="font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>Expires after</Label>
                        <div className="flex flex-wrap gap-2">
                          {EXPIRY_OPTIONS.map((option) => (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => setExpiryMs(option.ms)}
                              aria-pressed={expiryMs === option.ms}
                              className={cn(
                                "cursor-pointer rounded-lg px-3 py-1 text-xs font-medium transition",
                                expiryMs === option.ms
                                  ? "bg-primary text-white ring-1 ring-primary"
                                  : "bg-white text-neutral-600 shadow-sm shadow-black/5 ring-1 ring-black/10 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-neutral-950 dark:text-neutral-400 dark:ring-white/10 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" disabled={loading} className="mt-1 h-11 w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Shortening…
                  </>
                ) : (
                  <>Shorten &rarr;</>
                )}
              </Button>

              {error && <p className="text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
            </form>
          </motion.div>
        ) : (
          <motion.div key="result" variants={containerVariants} initial="initial" animate="animate" exit="exit">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">Your link is ready</h2>
            <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">{shortUrl.originalUrl}</p>

            <div className="mt-6 flex items-center gap-1 rounded-xl bg-neutral-50 p-1.5 pl-4 ring-1 ring-black/10 dark:bg-neutral-950 dark:ring-white/10">
              <a
                href={fullShortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate font-mono text-sm text-primary hover:underline dark:text-tertiary"
              >
                {fullShortUrl.replace(/^https?:\/\//, "")}
              </a>
              <a
                href={fullShortUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open link"
                className="rounded-lg p-2 text-neutral-500 transition hover:bg-white hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <button
                onClick={handleCopy}
                aria-label="Copy link"
                className={buttonClasses("primary", "rounded-lg px-2.5 py-2")}
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {shortUrl.expiresAt && (
              <p className="mt-3 font-mono text-xs text-neutral-400 dark:text-neutral-500">
                Expires {new Date(shortUrl.expiresAt).toLocaleString()}
              </p>
            )}

            <Button variant="secondary" onClick={handleReset} className="mt-6 h-11 w-full">
              <RotateCcw className="h-4 w-4" /> Shorten another
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
