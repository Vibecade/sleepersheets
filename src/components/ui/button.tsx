
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 hover:scale-[1.03] active:scale-[0.97]",
        destructive:
          "bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white hover:from-red-400 hover:via-red-500 hover:to-pink-500 shadow-lg hover:shadow-2xl hover:shadow-red-500/25 hover:scale-105 active:scale-95",
        outline:
          "glass-button text-white hover:scale-105 active:scale-95 border-white/20 hover:border-white/40",
        secondary:
          "bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 text-white hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 hover:scale-105 active:scale-95",
        ghost: "text-white hover:bg-white/10 hover:scale-105 active:scale-95",
        link: "text-emerald-400 underline-offset-4 hover:underline hover:text-emerald-300",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
