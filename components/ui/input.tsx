import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, style, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        // Force override for pixel-perfect alignment with Button
        "h-12 px-6 rounded-xl border border-[#E5E7EB] font-semibold bg-[#F1F3F7] text-[#222] placeholder:text-[#A0AEC0] focus:ring-0 focus:border-[#2563eb] outline-none appearance-none",
        // Remove any default shadow, border, or padding from Radix or Tailwind
        "!shadow-none !border !border-[#E5E7EB] !p-0 !m-0 !box-border",
        className
      )}
      style={{ minWidth: 0, ...style }}
      {...props}
    />
  )
}

export { Input }
