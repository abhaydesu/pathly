import { useId } from "react"

import { cn } from "@/lib/utils"

// Dotted rules drawn with an SVG pattern, so dot spacing stays crisp at any length

export function DotsHorizontal({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg aria-hidden className={cn("pointer-events-none block h-1 w-full", className)} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="8" height="4" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="2" r="1" className="fill-neutral-400 dark:fill-neutral-700" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

export function DotsVertical({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg aria-hidden className={cn("pointer-events-none block h-full w-1", className)} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="4" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="4" r="1" className="fill-neutral-400 dark:fill-neutral-700" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

// Fine diagonal cross-hatch; colour comes from --pattern-fg on a parent
export function HatchPattern({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <div className="absolute inset-0 bg-[repeating-linear-gradient(315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)] bg-size-[5px_5px]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(-315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)] bg-size-[5px_5px]" />
    </div>
  )
}
