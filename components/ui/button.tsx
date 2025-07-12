import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 shadow-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-200",
  {
    variants: {
      variant: {
        default:
          "bg-white text-[#222] border border-[#E5E7EB] hover:bg-[#F1F3F7]",
        destructive:
          "bg-[#F87171] text-white border border-[#F87171] hover:bg-[#ef4444]",
        outline:
          "bg-white text-[#222] border border-[#E5E7EB] hover:bg-[#F1F3F7]",
        secondary:
          "bg-[#F1F3F7] text-[#222] border border-[#E5E7EB] hover:bg-[#E5E7EB]",
        ghost:
          "bg-transparent text-[#222] hover:bg-[#F1F3F7]",
        link: "text-blue-600 underline-offset-4 hover:underline bg-transparent border-none",
      },
      size: {
        default: "h-11 px-6 py-2 has-[>svg]:px-4 text-base",
        sm: "h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-3 text-sm",
        lg: "h-14 rounded-xl px-8 has-[>svg]:px-6 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
