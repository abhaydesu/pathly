import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-xl bg-white px-3.5 py-2 text-sm text-neutral-900 shadow-sm shadow-black/5 ring-1 ring-black/10 transition outline-none",
        "placeholder:text-neutral-400 hover:ring-black/20 focus-visible:ring-2 focus-visible:ring-primary",
        "dark:bg-neutral-950 dark:text-neutral-100 dark:shadow-black/40 dark:ring-white/10 dark:placeholder:text-neutral-500 dark:hover:ring-white/20 dark:focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
