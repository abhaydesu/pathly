import * as React from "react"

import { buttonClasses, type Variant } from "@/components/ui/button-variants"

type ButtonProps = React.ComponentProps<"button"> & { variant?: Variant }

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...props} />
}
