import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F1F3F7] px-4 py-1 text-base font-medium text-[#222] w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-[#E5E7EB] bg-[#F1F3F7] text-[#222]",
        secondary:
          "border-[#E5E7EB] bg-[#F8F9FB] text-[#222]",
        destructive:
          "border-[#F87171] bg-[#FEE2E2] text-[#B91C1C]",
        outline:
          "border-[#E5E7EB] bg-white text-[#222]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
