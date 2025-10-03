import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UrlShortenerForm } from "@/components/url-shortener-form";
import { MyLinks } from "@/components/my-links";
import { BackgroundRippleEffect } from "./components/ui/background-ripple-effect";

export default function App() {
  const [view, setView] = useState<"home" | "links">("home");

  const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: "easeIn" } },
  } as const;

  return (
    <main className="relative dark bg-neutral-800 min-h-screen flex flex-col items-center p-4 font-mono overflow-auto">
      <div>
        <BackgroundRippleEffect />
      </div>

      <div className="relative  mt-40 w-full max-w-6xl flex flex-col items-center">
        <div className="text-center mb-8 sticky top-0 z-20">
          <h1 className="font-bold z-10 tracking-tight text-6xl md:text-8xl lg:text-9xl text-yellow-100/90 animate-in fade-in slide-in-from-top-3 duration-700 dm-serif-text-regular">
            Pathly
          </h1>
          <p className="mt-3 text-stone-400 animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
            Your modern URL shortener with analytics.
          </p>
        </div>

        <div className="mb-8 z-50">
          <div className="flex items-center gap-2 rounded-lg border border-neutral-700/50 bg-neutral-900/60 p-1 shadow-[0_0_20px_theme(colors.neutral.500/20)]">
            <Button
              onClick={() => setView("home")}
              variant={view === "home" ? "secondary" : "ghost"}
              className={
                view === "home"
                  ? "bg-yellow-700 text-neutral-900 hover:bg-yellow-600 cursor-pointer"
                  : "text-neutral-200 hover:bg-yellow-800/20 cursor-pointer"
              }
              aria-current={view === "home" ? "page" : undefined}
            >
              Create Link
            </Button>
            <Button
              onClick={() => setView("links")}
              variant={view === "links" ? "secondary" : "ghost"}
              className={
                view === "links"
                  ? "bg-yellow-700 text-neutral-900 hover:bg-yellow-600 cursor-pointer"
                  : "text-neutral-200 hover:bg-yellow-800/20 cursor-pointer"
              }
              aria-current={view === "links" ? "page" : undefined}
            >
              My Links &amp; Analytics
            </Button>
          </div>
        </div>

        <div className="w-full">
          <AnimatePresence mode="wait">
            {view === "home" ? (
              <motion.section
                key="home"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full flex justify-center"
              >
                <UrlShortenerForm />
              </motion.section>
            ) : (
              <motion.section
                key="links"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <MyLinks />
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}