import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Clock, Github, Moon, PenLine, Sun, Zap } from "lucide-react";
import { Toaster } from "sonner";
import { UrlShortenerForm } from "@/components/url-shortener-form";
import { MyLinks } from "@/components/my-links";
import { buttonClasses } from "@/components/ui/button-variants";
import { DotsHorizontal, DotsVertical } from "@/components/ui/dots";
import GradientASCII from "@/components/ui/gradient-ascii";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#create", label: "Create" },
  { href: "#analytics", label: "Analytics" },
];

const FEATURES = [
  { icon: PenLine, title: "Custom aliases", subtitle: "Pick your slug" },
  { icon: Clock, title: "Expiring links", subtitle: "1 hour to 30 days" },
  { icon: BarChart3, title: "Click analytics", subtitle: "Clicks per day" },
  { icon: Zap, title: "Fast redirects", subtitle: "Cached in Redis" },
];

const GITHUB_URL = "https://github.com/abhaydesu/pathly";


function Logo({ className }: { className?: string }) {
  return (
    <>
      <img src="/logo-black.png" alt="" className={cn(className, "dark:hidden")} />
      <img src="/logo-white.png" alt="" className={cn(className, "hidden dark:block")} />
    </>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={buttonClasses("secondary", "size-9 overflow-hidden p-0")}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: -12, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 12, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function Nav() {
  return (
    <header className="sticky top-4 z-50 px-4">
      <nav className="relative mx-auto flex max-w-3xl items-center justify-between rounded-2xl bg-white/90 p-2 shadow-sm shadow-black/10 ring-1 ring-black/10 backdrop-blur dark:bg-neutral-900/80 dark:shadow-black/40 dark:ring-white/10">
        <a href="#create" className="relative flex items-center gap-2 py-1 pr-5 pl-2">
          <Logo className="h-5 w-5" />
          <span className="font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">Pathly</span>
          <DotsVertical className="absolute -top-2 right-0 h-[calc(100%+1rem)]" />
        </a>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 sm:flex">
          {NAV_LINKS.map((link, i) => (
            <span key={link.href} className="flex items-center gap-4">
              {i > 0 && <span className="size-1 rounded-full bg-primary" />}
              <a href={link.href} className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">
                {link.label}
              </a>
            </span>
          ))}
        </div>

        <div className="relative flex items-center gap-2 pl-5">
          <DotsVertical className="absolute -top-2 left-0 hidden h-[calc(100%+1rem)] sm:block" />
          <ThemeToggle />
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "py-1.5")}>
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}

function Hero({ onLinkCreated }: { onLinkCreated: () => void }) {
  return (
    <section id="create" className="relative pt-16 md:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.6 }}
        className="flex flex-col items-center gap-4 px-4 text-center md:px-8"
      >
        <h1 className="max-w-[40ch] text-3xl leading-snug font-semibold tracking-tight text-balance text-neutral-700 md:text-4xl dark:text-neutral-200">
          Short links that tell you
          <br className="hidden sm:block" /> exactly <span className="bg-primary px-1 text-white">how often they're clicked</span>
        </h1>
        <p className="max-w-[52ch] text-base text-pretty text-neutral-600 dark:text-neutral-400">
          Paste a long URL, pick a custom alias or an expiry, and get a link you can share. Every click is counted, so you
          can see what's working.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.6, delay: 0.08 }}
        className="mt-10 flex justify-center px-4 md:px-8"
      >
        <UrlShortenerForm onCreated={onLinkCreated} />
      </motion.div>

      <div className="mt-12 flex flex-col items-center gap-4 px-4 md:mt-16">
        <p className="text-center text-sm font-medium text-neutral-800 dark:text-neutral-200">Everything a link needs</p>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, subtitle }) => (
            <li key={title} className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 shadow-sm shadow-black/10 ring-1 ring-black/10 dark:bg-neutral-800 dark:ring-white/10">
                <Icon className="size-4 text-neutral-500 dark:text-neutral-400" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{title}</span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">{subtitle}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <DotsHorizontal className="mt-12 md:mt-16" />
    </section>
  );
}

// Light-mode palette from React Bits' "atmosphere" light swap; dark uses the component's default blues
const ASCII_LIGHT_COLORS = ["#4f8ff7", "#e8f0ff", "#b4d0ff", "#7cb4fb"];
const ASCII_DARK_COLORS = ["#1e3fd8", "#f6f8ff", "#a5d8ff", "#38bdf8"];

// Animated ASCII gradient behind the hero, faded out towards the content.
// Glyphs scramble along the cursor's trail and ripple out from clicks.
function HeroBackdrop() {
  const isDark = useTheme().theme === "dark";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-1 top-0 h-[32rem] overflow-hidden mask-b-to-90%">
      <GradientASCII
        shape="horizon"
        lightMode={!isDark}
        colors={isDark ? ASCII_DARK_COLORS : ASCII_LIGHT_COLORS}
        cellSize={16}
      />
    </div>
  );
}

export default function App() {
  // Bumped whenever a link is created so the analytics list reloads from storage
  const [linksVersion, setLinksVersion] = useState(0);
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-800 antialiased dark:bg-neutral-950 dark:text-neutral-200">
      <Toaster position="bottom-center" theme={theme} />

      <div className="relative mx-auto max-w-6xl pt-4">
        <HeroBackdrop />
        <DotsVertical className="absolute inset-y-0 left-0" />
        <DotsVertical className="absolute inset-y-0 right-0" />

        <Nav />
        <Hero onLinkCreated={() => setLinksVersion((v) => v + 1)} />

        <section id="analytics" className="pt-12 md:pt-16">
          <div className="px-4 pb-8 md:px-8 md:pb-12">
            <h2 className="max-w-[35ch] text-xl font-semibold tracking-tight text-balance text-neutral-700 md:text-2xl dark:text-neutral-200">
              Your links &amp; analytics
            </h2>
            <p className="mt-2 max-w-[46ch] text-base text-pretty text-neutral-500 dark:text-neutral-400">
              Links you create in this browser show up here. Pick one to see how it's performing.
            </p>
          </div>
          <MyLinks refreshKey={linksVersion} />
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-neutral-500 sm:flex-row md:px-8 dark:text-neutral-400">
          <span className="flex items-center gap-2">
            <Logo className="h-4 w-4 opacity-70" />
            Built with Node.js, TypeScript, MongoDB, Redis &amp; React
          </span>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-neutral-800 dark:hover:text-neutral-100">
            Source on GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
