
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group font-headline",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-tech uppercase tracking-wider",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-tech uppercase tracking-wider",
        outline:
          "glass-button text-primary hover:scale-105 active:scale-95 border-primary/30 hover:border-primary/60 font-tech uppercase tracking-wider",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary-glow text-secondary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-tech uppercase tracking-wider",
        ghost: "text-foreground hover:bg-accent/10 hover:scale-105 active:scale-95",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-glow",
        stadium: 
          "glass-button text-primary font-tech uppercase tracking-widest hover:animate-helmet-glow shadow-lg",
        war: 
          "bg-gradient-to-r from-secondary to-secondary-glow text-secondary-foreground font-display uppercase tracking-widest shadow-lg hover:shadow-2xl hover:scale-110 border border-secondary/50",
        command:
          "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-tech uppercase tracking-wide shadow-lg hover:shadow-xl transform hover:rotate-1 border border-primary/50"
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base font-bold",
        icon: "h-11 w-11",
        xl: "h-14 px-12 text-lg font-black tracking-widest",
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
