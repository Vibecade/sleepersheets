
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105",
  {
    variants: {
      variant: {
        default:
          "border-emerald-400/30 bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-200 hover:from-emerald-500/30 hover:to-green-500/30 shadow-lg backdrop-blur-sm",
        secondary:
          "border-white/30 bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-gray-200 hover:from-slate-500/30 hover:to-slate-600/30 shadow-lg backdrop-blur-sm",
        destructive:
          "border-red-400/30 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-200 hover:from-red-500/30 hover:to-pink-500/30 shadow-lg backdrop-blur-sm",
        warning:
          "border-yellow-400/30 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-200 hover:from-yellow-500/30 hover:to-orange-500/30 shadow-lg backdrop-blur-sm",
        outline: "text-gray-200 border-white/30 hover:bg-white/10 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    )
  }
)

Badge.displayName = "Badge"

export { Badge, badgeVariants }
