import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, ClipboardCheck, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

type ShortUrlResponse = {
  originalUrl: string;
  shortId: string;
  clicks: number;
  createdAt: string;
};

export function UrlShortenerForm() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState<ShortUrlResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fullShortUrl = shortUrl
    ? `${import.meta.env.VITE_API_BASE_URL}/${shortUrl.shortId}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShortUrl);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = () => {
    setShortUrl(null);
    setOriginalUrl("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("1. Submitting form with URL:", originalUrl);

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/shorten`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl }),
      });
      console.log("2. Received API Response:", response);
      if (response.ok) {
        console.log("3. Response was OK. Processing data...");
        const data = await response.json();
        setShortUrl(data);

        const myLinks = JSON.parse(localStorage.getItem('myLinks') || '[]');
        if (!myLinks.some((link: { shortId: string }) => link.shortId === data.shortId)) {
          myLinks.push(data);
        }
         console.log("4. Attempting to save this to localStorage:", myLinks);
        localStorage.setItem('myLinks', JSON.stringify(myLinks))
         console.log("5. Successfully saved to localStorage.");
        toast.success("Link shortened successfully!");
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.error || "Failed to shorten URL. Please check the console.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      console.error("Error while shortening link:", error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
  } as const;

  return (
    <div className="w-lg md:mt-10 bg-black flex justify-center p-2 bg-yellow-950/30 border border-neutral-500/30">
      <Card className=" max-w-lg w-full bg-neutral-900 backdrop-blur-sm border-neutral-500/30 shadow-[0_0_20px_theme(colors.neutral.500/20)]">
        <CardHeader>
          <CardTitle className="text-2xl text-neutral-300">
            {shortUrl ? "Your link is ready" : "Create a short link"}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <AnimatePresence mode="wait">
            {!shortUrl ? (
              <motion.div
                key="form"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Input
                    type="url"
                    placeholder="https://your-super-long-url.com/goes-here"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    required
                    className="h-12 text-lg bg-neutral-800/50 border-neutral-700 text-neutral-200  placeholder:text-neutral-400 focus:border-yellow-800"
                  />
                  <Button
                    type="submit"
                    className="h-12 font-bold text-lg bg-yellow-700 hover:bg-yellow-600 text-slate-900 transition-all duration-300 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Shortening..." : "Shorten!"}
                  </Button>
                  {error && (
                    <p className="text-red-400 text-center animate-in fade-in">
                      {" "}
                      {error}{" "}
                    </p>
                  )}
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between gap-2 p-3 rounded-md border border-neutral-700 bg-neutral-800/50">
                  <a
                    href={fullShortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-lg text-neutral-200 truncate hover:underline"
                  >
                    {fullShortUrl}
                  </a>
                  <Button
                    onClick={handleCopy}
                    size="icon"
                    variant="ghost"
                    className="text-yellow-500 hover:text-yellow-200 cursor-pointer"
                  >
                    {isCopied ? (
                      <ClipboardCheck className="h-5 w-5 text-yellow-500 focus:none" />
                    ) : (
                      <Copy className="h-5 w-5 " />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="h-12 text-lg border-neutral-700 text-neutral-300 hover:bg-yellow-800 hover:text-neutral-100 cursor-pointer"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Shorten Another
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
