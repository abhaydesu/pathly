import { cn } from "@/lib/utils"

export type Variant = "primary" | "secondary"

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"

const variants: Record<Variant, string> = {
  // Blue gradient with an inner glow and a ring offset that reads as a double border
  primary:
    "bg-linear-to-b from-tertiary to-primary text-white shadow-[0px_0px_10px_0px_rgba(255,255,255,0.2)_inset] ring ring-white/20 ring-inset ring-offset-2 ring-offset-primary hover:shadow-[0px_0px_20px_0px_rgba(255,255,255,0.4)_inset] hover:ring-white/40",
  secondary:
    "bg-white text-neutral-900 shadow-sm shadow-black/10 ring-1 ring-black/10 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-100 dark:shadow-black/40 dark:ring-white/10 dark:hover:bg-neutral-800",
}

export function buttonClasses(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className)
}
