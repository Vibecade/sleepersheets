
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group font-headline text-xs sm:text-sm touch-manipulation select-none",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-lg hover:shadow-xl md:hover:scale-105 active:scale-95 active:opacity-90 font-tech uppercase tracking-wider",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-lg hover:shadow-xl md:hover:scale-105 active:scale-95 active:opacity-90 font-tech uppercase tracking-wider",
        outline:
          "glass-button text-primary md:hover:scale-105 active:scale-95 active:opacity-90 border-primary/30 hover:border-primary/60 font-tech uppercase tracking-wider",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary-glow text-secondary-foreground shadow-lg hover:shadow-xl md:hover:scale-105 active:scale-95 active:opacity-90 font-tech uppercase tracking-wider",
        ghost: "text-foreground hover:bg-accent/10 md:hover:scale-105 active:scale-95 active:bg-accent/20",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-glow",
        stadium:
          "glass-button text-primary font-tech uppercase tracking-widest hover:animate-helmet-glow shadow-lg active:scale-95",
        war:
          "bg-gradient-to-r from-secondary to-secondary-glow text-secondary-foreground font-display uppercase tracking-widest shadow-lg hover:shadow-2xl md:hover:scale-110 active:scale-95 border border-secondary/50",
        command:
          "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-tech uppercase tracking-wide shadow-lg hover:shadow-xl md:hover:rotate-1 active:scale-95 border border-primary/50"
      },
      size: {
        default: "h-11 min-h-[44px] px-3 sm:px-6 py-2",
        sm: "h-9 min-h-[36px] rounded-lg px-2 sm:px-4 text-xs",
        lg: "h-12 min-h-[48px] rounded-xl px-4 sm:px-8 text-sm sm:text-base font-bold",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
        xl: "h-14 min-h-[56px] px-6 sm:px-12 text-base sm:text-lg font-black tracking-widest",
        mobile: "h-12 min-h-[48px] px-2 text-xs whitespace-normal break-words leading-tight min-w-0",
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
